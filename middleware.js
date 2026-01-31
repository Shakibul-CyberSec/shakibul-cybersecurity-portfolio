import { NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

/* ---------- PERSISTENT STORAGE ---------- */
const STORAGE_DIR = path.join(process.cwd(), '.rate-limit-db');
const STORAGE_FILE = path.join(STORAGE_DIR, 'limits.json');

async function ensureStorageDir() {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create storage directory:', error);
  }
}

async function loadStorage() {
  try {
    await ensureStorageDir();
    const data = await fs.readFile(STORAGE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return { requests: {}, violations: {}, banned: [] };
  }
}

async function saveStorage(data) {
  try {
    await ensureStorageDir();
    await fs.writeFile(STORAGE_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Failed to save storage:', error);
  }
}

/* ---------- RATE LIMIT CONFIG ---------- */
const RATE_LIMITS = {
  NORMAL: { count: 2, window: 5 * 60 * 1000 },      // 2 requests per 5 minutes
  SUSPICIOUS: { count: 1, window: 30 * 60 * 1000 },  // 1 request per 30 minutes
  ABUSIVE: { count: 1, window: 2 * 60 * 60 * 1000 } // 1 request per 2 hours
};

const ESCALATION_THRESHOLD = 3;
const COOLDOWN_PERIOD = 24 * 60 * 60 * 1000;

// In-memory cache (fast access, synced to disk periodically)
const memoryCache = new Map();
const violationTracker = new Map();
const shadowBanned = new Set();

// Load from disk on startup
let storageInitialized = false;

async function initStorage() {
  if (storageInitialized) return;
  
  try {
    const data = await loadStorage();
    
    // Restore to memory
    if (data.requests) {
      Object.entries(data.requests).forEach(([key, value]) => {
        memoryCache.set(key, value);
      });
    }
    
    if (data.violations) {
      Object.entries(data.violations).forEach(([key, value]) => {
        violationTracker.set(key, value);
      });
    }
    
    if (data.banned && Array.isArray(data.banned)) {
      data.banned.forEach(key => shadowBanned.add(key));
    }
    
    storageInitialized = true;
    console.log('[Security] Rate limit storage initialized');
  } catch (error) {
    console.error('[Security] Failed to initialize storage:', error);
    storageInitialized = true; // Continue anyway
  }
}

// Persist to disk periodically
let lastSave = Date.now();
const SAVE_INTERVAL = 30 * 1000; // Save every 30 seconds

async function maybePersist() {
  const now = Date.now();
  if (now - lastSave < SAVE_INTERVAL) return;
  
  try {
    const data = {
      requests: Object.fromEntries(memoryCache),
      violations: Object.fromEntries(violationTracker),
      banned: Array.from(shadowBanned),
      lastUpdate: now
    };
    
    await saveStorage(data);
    lastSave = now;
  } catch (error) {
    console.error('[Security] Failed to persist storage:', error);
  }
}

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
  'spider',
  'selenium',
  'phantomjs',
  'headless'
];

function isBotUserAgent(ua) {
  const normalizedUA = (ua || '').toLowerCase();
  return BAD_BOTS.some(bot => normalizedUA.includes(bot));
}

/* ---------- IP SUBNET EXTRACTION ---------- */
// Extract /24 subnet to handle dynamic IPs from same ISP
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

function recordViolation(clientKey, subnetKey) {
  // Record violation for both specific client and subnet
  for (const key of [clientKey, subnetKey]) {
    const violations = violationTracker.get(key) || { count: 0, lastViolation: 0 };
    violations.count++;
    violations.lastViolation = Date.now();
    violationTracker.set(key, violations);
    
    // Shadow ban if violations are extreme
    if (violations.count >= ESCALATION_THRESHOLD * 3) {
      shadowBanned.add(key);
      console.log(`[Security] Shadow banned: ${key.substring(0, 20)}...`);
    }
  }
}

/* ---------- BEHAVIORAL ANALYSIS ---------- */
function checkBehavior(clientKey, now) {
  const record = memoryCache.get(clientKey);
  
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
function getSubnetRequests(subnetKey, now, window) {
  let totalRequests = 0;
  
  // Count all requests from this subnet across all fingerprints
  for (const [key, record] of memoryCache.entries()) {
    if (key.startsWith(subnetKey + ':') && (now - record.start < window)) {
      totalRequests += record.count;
    }
  }
  
  return totalRequests;
}

/* ---------- MEMORY CLEANUP ---------- */
async function cleanupMemory() {
  const now = Date.now();
  const maxAge = Math.max(...Object.values(RATE_LIMITS).map(l => l.window));
  
  for (const [key, record] of memoryCache.entries()) {
    if (now - record.start > maxAge * 2) {
      memoryCache.delete(key);
    }
  }
  
  for (const [key, violations] of violationTracker.entries()) {
    if (now - violations.lastViolation > COOLDOWN_PERIOD * 2) {
      violationTracker.delete(key);
      shadowBanned.delete(key);
    }
  }
  
  // Persist after cleanup
  await maybePersist();
}

// Run cleanup every 10 minutes
setInterval(cleanupMemory, 10 * 60 * 1000);

/* ---------- Middleware ---------- */
export async function middleware(request) {
  // Initialize storage on first request
  await initStorage();
  
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
    
    /* ---------- SHADOW BAN CHECK ---------- */
    if (shadowBanned.has(clientKey) || shadowBanned.has(subnetKey)) {
      console.log(`[Security] Shadow banned request from ${subnet}`);
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
      recordViolation(clientKey, subnetKey);
      
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
    const subnetTier = getViolationTier(subnetKey);
    const effectiveTier = RATE_LIMITS[subnetTier].window > RATE_LIMITS[tier].window ? subnetTier : tier;
    const limit = RATE_LIMITS[effectiveTier];
    
    const record = memoryCache.get(clientKey) || { 
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
    memoryCache.set(clientKey, record);
    
    // SUBNET-WIDE CHECK: Prevent circumvention via profile switching
    const subnetRequests = getSubnetRequests(subnet, now, limit.window);
    const SUBNET_MULTIPLIER = 3; // Allow 3x normal limit across all profiles from same subnet
    
    if (subnetRequests > limit.count * SUBNET_MULTIPLIER) {
      recordViolation(clientKey, subnetKey);
      
      const retryAfter = Math.ceil((record.start + limit.window - now) / 1000);
      
      console.log(`[Security] Subnet limit exceeded: ${subnet} (${subnetRequests} requests)`);
      
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
      recordViolation(clientKey, subnetKey);
      
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
    
    // Persist changes
    await maybePersist();
  }
  
  /* ---------- Generate Nonce ---------- */
  const nonce = crypto.randomUUID();
  const response = NextResponse.next();
  
  /* ---------- Strict CSP Header with Nonce ---------- */
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://cdn.jsdelivr.net/npm/@fingerprintjs/fingerprintjs@3/dist/fp.min.js https://challenges.cloudflare.com/turnstile/v0/api.js;
    style-src 'self' 'nonce-${nonce}';
    font-src 'self' data:;
    img-src 'self' data: blob:;
    connect-src 'self' https://api.fingerprint<br>.com https://challenges.cloudflare.com;
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
