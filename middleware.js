import { NextResponse } from 'next/server';

/* ---------- RATE LIMIT CONFIG ---------- */
const RATE_LIMITS = {
  NORMAL: { count: 2, window: 5 * 60 * 1000 },      // 2 requests per 5 minutes
  SUSPICIOUS: { count: 1, window: 30 * 60 * 1000 },  // 1 request per 30 minutes
  ABUSIVE: { count: 1, window: 2 * 60 * 60 * 1000 } // 1 request per 2 hours
};

const ESCALATION_THRESHOLD = 3; // Violations before tier escalation
const COOLDOWN_PERIOD = 24 * 60 * 60 * 1000; // 24 hours to reset tier

const memory = new Map();
const violationTracker = new Map();
const shadowBanned = new Set();

/* ---------- BOT DETECTION ---------- */
const BAD_BOTS = [
  'curl',
  'wget',
  'python',
  'httpclient',
  'go-http-client',
  'axios',
  'node-fetch',
  'postman',
  'insomnia',
  'scrapy',
  'bot',
  'crawler',
  'spider'
];

function isBotUserAgent(ua) {
  const normalizedUA = (ua || '').toLowerCase();
  return BAD_BOTS.some(bot => normalizedUA.includes(bot));
}

/* ---------- CLIENT FINGERPRINTING ---------- */
async function getFingerprint(request) {
  const ua = request.headers.get('user-agent') || '';
  const lang = request.headers.get('accept-language') || '';
  const encoding = request.headers.get('accept-encoding') || '';
  const secChUa = request.headers.get('sec-ch-ua') || '';
  const secChUaPlatform = request.headers.get('sec-ch-ua-platform') || '';
  
  const data = `${ua}|${lang}|${encoding}|${secChUa}|${secChUaPlatform}`;
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ---------- IP EXTRACTION ---------- */
function getClientIP(request) {
  return (
    request.ip ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-real-ip') ??
    request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  );
}

/* ---------- RATE LIMIT TIER MANAGEMENT ---------- */
function getViolationTier(clientKey) {
  const violations = violationTracker.get(clientKey);
  
  if (!violations) {
    return 'NORMAL';
  }
  
  // Reset tier if cooldown period has passed
  if (Date.now() - violations.lastViolation > COOLDOWN_PERIOD) {
    violationTracker.delete(clientKey);
    return 'NORMAL';
  }
  
  if (violations.count >= ESCALATION_THRESHOLD * 2) {
    return 'ABUSIVE';
  }
  
  if (violations.count >= ESCALATION_THRESHOLD) {
    return 'SUSPICIOUS';
  }
  
  return 'NORMAL';
}

function recordViolation(clientKey) {
  const violations = violationTracker.get(clientKey) || { count: 0, lastViolation: 0 };
  violations.count++;
  violations.lastViolation = Date.now();
  violationTracker.set(clientKey, violations);
  
  // Shadow ban if violations are extreme
  if (violations.count >= ESCALATION_THRESHOLD * 3) {
    shadowBanned.add(clientKey);
  }
}

/* ---------- BEHAVIORAL ANALYSIS ---------- */
function checkBehavior(clientKey, now) {
  const record = memory.get(clientKey);
  
  if (!record || !record.lastRequest) {
    return true; // First request
  }
  
  const timeDiff = now - record.lastRequest;
  
  // Suspicious: Requests faster than humanly possible (< 800ms)
  if (timeDiff < 800) {
    return false;
  }
  
  return true;
}

/* ---------- MEMORY CLEANUP ---------- */
function cleanupMemory() {
  const now = Date.now();
  const maxAge = Math.max(...Object.values(RATE_LIMITS).map(l => l.window));
  
  for (const [key, record] of memory.entries()) {
    if (now - record.start > maxAge * 2) {
      memory.delete(key);
    }
  }
  
  for (const [key, violations] of violationTracker.entries()) {
    if (now - violations.lastViolation > COOLDOWN_PERIOD * 2) {
      violationTracker.delete(key);
      shadowBanned.delete(key);
    }
  }
}

// Run cleanup every 10 minutes
setInterval(cleanupMemory, 10 * 60 * 1000);

/* ---------- Middleware ---------- */
export async function middleware(request) {
  const pathname = request.nextUrl.pathname;
  
  /* 🔒 RATE LIMIT FOR /api/SendEmail */
  if (pathname === '/api/SendEmail') {
    const ip = getClientIP(request);
    const fingerprint = await getFingerprint(request);
    const method = request.method;
    
    // Multi-dimensional key: IP + Fingerprint + Method + Path
    const clientKey = `${ip}:${fingerprint}:${method}:${pathname}`;
    
    /* ---------- BOT DETECTION ---------- */
    const ua = request.headers.get('user-agent') || '';
    if (isBotUserAgent(ua)) {
      // Silent kill - no feedback to bots
      return new NextResponse(null, { 
        status: 204,
        headers: { 'Cache-Control': 'no-store' }
      });
    }
    
    /* ---------- SHADOW BAN CHECK ---------- */
    if (shadowBanned.has(clientKey)) {
      // Return fake success - attack dies naturally
      return new NextResponse(
        JSON.stringify({ 
          success: true,
          message: 'Thank you for reaching out! Your message has been sent successfully.'
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          },
        }
      );
    }
    
    const now = Date.now();
    
    /* ---------- BEHAVIORAL ANALYSIS ---------- */
    if (!checkBehavior(clientKey, now)) {
      recordViolation(clientKey);
      
      return new NextResponse(
        JSON.stringify({
          error: 'Request rejected. Please slow down.',
          type: 'behavior'
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          },
        }
      );
    }
    
    /* ---------- PROGRESSIVE RATE LIMITING ---------- */
    const tier = getViolationTier(clientKey);
    const limit = RATE_LIMITS[tier];
    
    const record = memory.get(clientKey) || { 
      count: 0, 
      start: now, 
      lastRequest: 0,
      tier: tier 
    };
    
    // Reset count if window has passed
    if (now - record.start > limit.window) {
      record.count = 0;
      record.start = now;
      record.tier = tier;
    }
    
    record.count++;
    record.lastRequest = now;
    memory.set(clientKey, record);
    
    // Block if rate limit exceeded
    if (record.count > limit.count) {
      recordViolation(clientKey);
      
      const retryAfter = Math.ceil((record.start + limit.window - now) / 1000);
      const minutes = Math.ceil(retryAfter / 60);
      
      // Different messages based on tier
      let errorMessage;
      switch (tier) {
        case 'ABUSIVE':
          errorMessage = `Account temporarily restricted. Please try again in ${Math.ceil(retryAfter / 3600)} hour${Math.ceil(retryAfter / 3600) > 1 ? 's' : ''}.`;
          break;
        case 'SUSPICIOUS':
          errorMessage = `Too many attempts detected. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`;
          break;
        default:
          errorMessage = `Too many requests. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`;
      }
      
      return new NextResponse(
        JSON.stringify({
          error: errorMessage,
          type: 'rate_limit',
          tier: process.env.NODE_ENV === 'development' ? tier : undefined
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': limit.count.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.floor((record.start + limit.window) / 1000).toString(),
            'Cache-Control': 'no-store',
          },
        }
      );
    }
  }
  
  /* ---------- Generate Nonce ---------- */
  const nonce = crypto.randomUUID();
  const response = NextResponse.next();
  
  /* ---------- Strict CSP Header with Nonce ---------- */
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
    style-src 'self' 'nonce-${nonce}';
    font-src 'self' data:;
    img-src 'self' data: blob:;
    connect-src 'self' ws: wss:;
    frame-ancestors 'none';
    base-uri 'none';
    form-action 'self';
    object-src 'none';
  `
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
    
  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('x-nonce', nonce);
  
  /* ---------- Security Headers ---------- */
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Frame-Options', 'DENY');
  
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  
  return response;
}

/* ---------- Matcher ---------- */
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|cyber-icon.svg).*)'],
};
