import { NextResponse } from 'next/server';

/* ---------- RATE LIMIT CONFIG ---------- */
const RATE_LIMIT = 2; // 2 requests
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const memory = new Map();

/* ---------- Middleware ---------- */
export function middleware(request) {
  const pathname = request.nextUrl.pathname;
  
  /* 🔒 RATE LIMIT FOR /api/SendEmail */
  if (pathname === '/api/SendEmail') {
    const ip =
      request.ip ??
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('cf-connecting-ip') ??
      request.headers.get('x-real-ip') ??
      'unknown';
    
    const now = Date.now();
    const record = memory.get(ip) || { count: 0, start: now };
    
    // Reset count if window has passed
    if (now - record.start > WINDOW_MS) {
      record.count = 0;
      record.start = now;
    }
    
    record.count++;
    memory.set(ip, record);
    
    // Block if rate limit exceeded
    if (record.count > RATE_LIMIT) {
      const retryAfter = Math.ceil((record.start + WINDOW_MS - now) / 1000);
      const minutes = Math.ceil(retryAfter / 60);
      
      return new NextResponse(
        JSON.stringify({
          error: `Too many requests. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`,
          type: 'ip'
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': RATE_LIMIT.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.floor((record.start + WINDOW_MS) / 1000).toString(),
            'Cache-Control': 'no-store',
          },
        }
      );
    }
  }
  
  /* ---------- Generate Nonce ---------- */
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
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