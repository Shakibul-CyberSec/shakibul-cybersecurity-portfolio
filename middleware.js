import { NextResponse } from 'next/server';

/* ---------- VERCEL KV IMPORT (with fallback) ---------- */
let kv = null;
let kvAvailable = false;

// Correct way to import Vercel KV - it auto-reads KV_REST_API_URL and KV_REST_API_TOKEN from env
if (typeof process !== 'undefined' && process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
  try {
    // Dynamic import at runtime
    const kvModule = await import('@vercel/kv');
    kv = kvModule.kv;
    kvAvailable = true;
    console.log('[Security] Vercel KV initialized - Persistent storage enabled ✅');
  } catch (error) {
    console.log('[Security] Vercel KV not available - Using in-memory fallback ⚠️');
    kvAvailable = false;
  }
} else {
  console.log('[Security] KV environment variables not found - Using in-memory fallback ⚠️');
}

/* ---------- RATE LIMIT CONFIG ---------- */
const RATE_LIMITS = {
  NORMAL: { count: 2, window: 5 * 60 * 1000 },      // 2 requests per 5 minutes
  SUSPICIOUS: { count: 1, window: 30 * 60 * 1000 },  // 1 request per 30 minutes
  ABUSIVE: { count: 1, window: 2 * 60 * 60 * 1000 } // 1 request per 2 hours
};

const ESCALATION_THRESHOLD = 3;
const COOLDOWN_PERIOD = 24 * 60 * 60 * 1000;

// Fallback in-memory storage (only used if KV unavailable)
const memoryCache = new Map();
const violationTracker = new Map();
const shadowBanned = new Set();

/* ---------- KV STORAGE HELPERS ---------- */
const KV_PREFIXES = {
  RATE_LIMIT: 'rl:',
  VIOLATION: 'vio:',
  SHADOW_BAN: 'ban:',
  SUBNET: 'sub:',
};

async function kvGet(key) {
  if (!kvAvailable || !kv) {
    // Fallback to memory
    return memoryCache.get(key) || null;
  }
  
  try {
    return await kv.get(key);
  } catch (error) {
    console.error('[KV Error] Read failed:', error.message);
    return memoryCache.get(key) || null;
  }
}

async function kvSet(key, value, expirySeconds = null) {
  if (!kvAvailable || !kv) {
    // Fallback to memory
    memoryCache.set(key, value);
    return;
  }
  
  try {
    if (expirySeconds) {
      await kv.set(key, value, { ex: expirySeconds });
    } else {
      await kv.set(key, value);
    }
    // Also update memory cache for faster reads
    memoryCache.set(key, value);
  } catch (error) {
    console.error('[KV Error] Write failed:', error.message);
    memoryCache.set(key, value);
  }
}

async function kvSadd(key, member) {
  if (!kvAvailable || !kv) {
    shadowBanned.add(member);
    return;
  }
  
  try {
    await kv.sadd(key, member);
    shadowBanned.add(member);
  } catch (error) {
    console.error('[KV Error] Set add failed:', error.message);
    shadowBanned.add(member);
  }
}

async function kvSismember(key, member) {
  if (!kvAvailable || !kv) {
    return shadowBanned.has(member);
  }
  
  try {
    const isMember = await kv.sismember(key, member);
    if (isMember) shadowBanned.add(member);
    return isMember === 1;
  } catch (error) {
    console.error('[KV Error] Set check failed:', error.message);
    return shadowBanned.has(member);
  }
}

/* ---------- BOT DETECTION ---------- */
const BAD_BOTS = [
  'curl', 'wget', 'python', 'httpclient', 'go-http-client',
  'axios', 'node-fetch', 'postman', 'insomnia', 'scrapy',
  'bot', 'crawler', 'spider', 'selenium', 'phantomjs', 'headless'
];

function isBotUserAgent(ua) {
  const normalizedUA = (ua || '').toLowerCase();
  return BAD_BOTS.some(bot => normalizedUA.includes(bot));
}

/* ---------- IP SUBNET EXTRACTION ---------- */
function getIPSubnet(ip) {
  if (!ip || ip === 'unknown') return 'unknown';
  
  // IPv4: Get first 3 octets (e.g., 103.157.247.x -> 103.157.247)
  const ipv4Match = ip.match(/^(\d+\.\d+\.\d+)\.\d+$/);
  if (ipv4Match) {
    return ipv4Match[1];
  }
  
  // IPv6: Get first 48 bits
  const ipv6Match = ip.match(/^([0-9a-f:]+::[0-9a-f:]+|[0-9a-f:]+:[0-9a-f:]+:[0-9a-f:]+)/i);
  if (ipv6Match) {
    return ipv6Match[1];
  }
  
  return ip;
}

/* ---------- CLIENT FINGERPRINTING (Web Crypto API) ---------- */
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
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
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
async function getViolationTier(clientKey) {
  const violations = await kvGet(KV_PREFIXES.VIOLATION + clientKey);
  
  if (!violations) {
    return 'NORMAL';
  }
  
  // Reset tier if cooldown period has passed
  if (Date.now() - violations.lastViolation > COOLDOWN_PERIOD) {
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

async function recordViolation(clientKey, subnetKey) {
  const now = Date.now();
  
  // Record violation for both specific client and subnet
  for (const key of [clientKey, subnetKey]) {
    const violations = await kvGet(KV_PREFIXES.VIOLATION + key) || { count: 0, lastViolation: 0 };
    violations.count++;
    violations.lastViolation = now;
    
    // Store with 48 hour expiry
    await kvSet(KV_PREFIXES.VIOLATION + key, violations, 48 * 60 * 60);
    
    // Shadow ban if violations are extreme
    if (violations.count >= ESCALATION_THRESHOLD * 3) {
      await kvSadd(KV_PREFIXES.SHADOW_BAN + 'set', key);
      console.log(`[Security] Shadow banned (persistent): ${key.substring(0, 20)}...`);
    }
  }
}

/* ---------- BEHAVIORAL ANALYSIS ---------- */
async function checkBehavior(clientKey, now) {
  const record = await kvGet(KV_PREFIXES.RATE_LIMIT + clientKey);
  
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

/* ---------- SUBNET-WIDE TRACKING ---------- */
async function getSubnetRequests(subnet, now, window) {
  if (!kvAvailable || !kv) {
    // Fallback to in-memory
    let totalRequests = 0;
    for (const [key, record] of memoryCache.entries()) {
      if (key.startsWith(KV_PREFIXES.RATE_LIMIT) && 
          key.includes(subnet + ':') && 
          (now - record.start < window)) {
        totalRequests += record.count;
      }
    }
    return totalRequests;
  }
  
  try {
    // Get all keys for this subnet
    const pattern = `${KV_PREFIXES.RATE_LIMIT}${subnet}:*`;
    const keys = await kv.keys(pattern);
    
    let totalRequests = 0;
    for (const key of keys) {
      const record = await kv.get(key);
      if (record && (now - record.start < window)) {
        totalRequests += record.count;
      }
    }
    
    return totalRequests;
  } catch (error) {
    console.error('[KV Error] Subnet check failed:', error.message);
    return 0;
  }
}

/* ---------- MEMORY CLEANUP (for fallback only) ---------- */
function cleanupMemory() {
  if (kvAvailable) return; // Skip if using KV
  
  const now = Date.now();
  const maxAge = Math.max(...Object.values(RATE_LIMITS).map(l => l.window));
  
  for (const [key, record] of memoryCache.entries()) {
    if (now - record.start > maxAge * 2) {
      memoryCache.delete(key);
    }
  }
}

// Run cleanup every 10 minutes (only for fallback)
setInterval(cleanupMemory, 10 * 60 * 1000);

/* ---------- Middleware ---------- */
export async function middleware(request) {
  const pathname = request.nextUrl.pathname;
  
  /* 🔒 RATE LIMIT FOR /api/SendEmail */
  if (pathname === '/api/SendEmail') {
    const ip = getClientIP(request);
    const subnet = getIPSubnet(ip);
    const fingerprint = await getFingerprint(request);
    const method = request.method;
    
    // Multi-dimensional keys
    const clientKey = `${subnet}:${fingerprint}:${method}`;
    const subnetKey = `subnet:${subnet}:${method}`;
    
    /* ---------- BOT DETECTION ---------- */
    const ua = request.headers.get('user-agent') || '';
    if (isBotUserAgent(ua)) {
      console.log(`[Security] Bot detected: ${ua.substring(0, 50)}`);
      return new NextResponse(null, { 
        status: 204,
        headers: { 'Cache-Control': 'no-store' }
      });
    }
    
    /* ---------- SHADOW BAN CHECK (PERSISTENT) ---------- */
    const isClientBanned = await kvSismember(KV_PREFIXES.SHADOW_BAN + 'set', clientKey);
    const isSubnetBanned = await kvSismember(KV_PREFIXES.SHADOW_BAN + 'set', subnetKey);
    
    if (isClientBanned || isSubnetBanned) {
      console.log(`[Security] Shadow banned request (persistent) from ${subnet}`);
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
    if (!(await checkBehavior(clientKey, now))) {
      await recordViolation(clientKey, subnetKey);
      
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
    
    /* ---------- PROGRESSIVE RATE LIMITING (PERSISTENT) ---------- */
    const tier = await getViolationTier(clientKey);
    const subnetTier = await getViolationTier(subnetKey);
    const effectiveTier = RATE_LIMITS[subnetTier].window > RATE_LIMITS[tier].window ? subnetTier : tier;
    const limit = RATE_LIMITS[effectiveTier];
    
    const record = await kvGet(KV_PREFIXES.RATE_LIMIT + clientKey) || { 
      count: 0, 
      start: now, 
      lastRequest: 0,
      tier: effectiveTier 
    };
    
    // Reset count if window has passed
    if (now - record.start > limit.window) {
      record.count = 0;
      record.start = now;
      record.tier = effectiveTier;
    }
    
    record.count++;
    record.lastRequest = now;
    
    // Store with expiry based on rate limit window
    const expirySeconds = Math.ceil(limit.window / 1000);
    await kvSet(KV_PREFIXES.RATE_LIMIT + clientKey, record, expirySeconds);
    
    // SUBNET-WIDE CHECK: Prevent circumvention via profile switching (PERSISTENT)
    const subnetRequests = await getSubnetRequests(subnet, now, limit.window);
    const SUBNET_MULTIPLIER = 3; // Allow 3x normal limit across all profiles from same subnet
    
    if (subnetRequests > limit.count * SUBNET_MULTIPLIER) {
      await recordViolation(clientKey, subnetKey);
      
      const retryAfter = Math.ceil((record.start + limit.window - now) / 1000);
      
      console.log(`[Security] Subnet limit exceeded (persistent): ${subnet} (${subnetRequests} requests)`);
      
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests from your network. Please try again later.',
          type: 'subnet_limit'
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': retryAfter.toString(),
            'Cache-Control': 'no-store',
          },
        }
      );
    }
    
    // Block if rate limit exceeded
    if (record.count > limit.count) {
      await recordViolation(clientKey, subnetKey);
      
      const retryAfter = Math.ceil((record.start + limit.window - now) / 1000);
      const minutes = Math.ceil(retryAfter / 60);
      
      // Different messages based on tier
      let errorMessage;
      switch (effectiveTier) {
        case 'ABUSIVE':
          errorMessage = `Account temporarily restricted. Please try again in ${Math.ceil(retryAfter / 3600)} hour${Math.ceil(retryAfter / 3600) > 1 ? 's' : ''}.`;
          break;
        case 'SUSPICIOUS':
          errorMessage = `Too many attempts detected. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`;
          break;
        default:
          errorMessage = `Too many requests. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`;
      }
      
      console.log(`[Security] Rate limit exceeded (persistent): ${clientKey.substring(0, 30)}... (Tier: ${effectiveTier})`);
      
      return new NextResponse(
        JSON.stringify({
          error: errorMessage,
          type: 'rate_limit',
          tier: process.env.NODE_ENV === 'development' ? effectiveTier : undefined
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
  const nonceArray = new Uint8Array(16);
  crypto.getRandomValues(nonceArray);
  const nonce = Array.from(nonceArray, byte => byte.toString(16).padStart(2, '0')).join('');
  
  const response = NextResponse.next();
  
  /* ---------- Strict CSP Header with Nonce ---------- */
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://cdn.jsdelivr.net/npm/@fingerprintjs/fingerprintjs@3/dist/fp.min.js https://challenges.cloudflare.com/turnstile/v0/api.js;
    style-src 'self' 'nonce-${nonce}';
    font-src 'self' data:;
    img-src 'self' data: blob:;
    connect-src 'self' https://api.fingerprint.com https://challenges.cloudflare.com;
    frame-src https://challenges.cloudflare.com;
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
