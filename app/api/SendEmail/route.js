import validator from 'validator';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Secure sanitization function — strips tags first, then attributes
const sanitizeInput = (input, options = {}) => {
  if (!input) return '';
  
  let sanitized = String(input);
  
  if (!options.ALLOWED_TAGS || options.ALLOWED_TAGS.length === 0) {
    // Remove ALL HTML tags (no tags allowed) — also match malformed tags without closing >
    sanitized = sanitized.replace(/<[^>]*>?/g, '');
  } else {
    // Step 1: Remove all tags NOT in the allowed list
    const allowedTags = options.ALLOWED_TAGS.join('|');
    const disallowedTagRegex = new RegExp(`<(?!\\/?(${allowedTags})\\b)[^>]*>?`, 'gi');
    sanitized = sanitized.replace(disallowedTagRegex, '');

    // Step 2: Strip ALL attributes from the remaining allowed tags
    // Match tags with any whitespace (including newlines) before attributes
    const attrStripRegex = new RegExp(`<(\\/?(?:${allowedTags}))[\\s/][^>]*>`, 'gi');
    sanitized = sanitized.replace(attrStripRegex, '<$1>');
  }

  // Iteratively remove dangerous patterns to prevent bypass via nesting
  // e.g., "javajavascript:script:" → "javascript:" after first pass
  let prev;
  do {
    prev = sanitized;
    sanitized = sanitized
      .replace(/javascript\s*:/gi, '')
      .replace(/vbscript\s*:/gi, '')
      .replace(/data\s*:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  } while (sanitized !== prev);

  return sanitized;
};

// Honeypot fields (names are obfuscated in HTML using different strategy)
const HONEYPOT_FIELDS = ['company', 'website', 'phone_number'];

/* ---------- VERCEL KV FOR EMAIL TRACKING ---------- */
let kv = null;
let kvAvailable = false;

// Initialize Upstash Redis
if (typeof process !== 'undefined' && process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
  try {
    const { Redis } = await import('@upstash/redis');
    kv = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
    kvAvailable = true;
    console.log('[Security] Upstash Redis enabled for email tracking ✅');
  } catch (error) {
    console.log('[Security] Upstash Redis not available - Using in-memory fallback ⚠️');
    kvAvailable = false;
  }
}

const KV_PREFIXES = {
  EMAIL_TRACKER: 'email:',
  EMAIL_BANNED: 'email_ban:',
};

// In-memory fallback (only used if KV unavailable)
const emailTrackerMemory = new Map();
const emailBannedMemory = new Set();

// EMAIL-BASED RATE LIMITING
const EMAIL_LIMITS = {
  MAX_REQUESTS_PER_HOUR: 3,
  MAX_REQUESTS_PER_DAY: 5,
  BAN_THRESHOLD: 10
};

async function getEmailInfo(email) {
  if (!kvAvailable || !kv) {
    return emailTrackerMemory.get(email) || null;
  }
  
  try {
    return await kv.get(KV_PREFIXES.EMAIL_TRACKER + email);
  } catch (error) {
    console.error('[KV Error] Failed to get email info:', error.message);
    return emailTrackerMemory.get(email) || null;
  }
}

async function setEmailInfo(email, info) {
  if (!kvAvailable || !kv) {
    emailTrackerMemory.set(email, info);
    return;
  }
  
  try {
    // Store with 7 days expiry
    await kv.set(KV_PREFIXES.EMAIL_TRACKER + email, info, { ex: 7 * 24 * 60 * 60 });
    emailTrackerMemory.set(email, info); // Also cache in memory
  } catch (error) {
    console.error('[KV Error] Failed to set email info:', error.message);
    emailTrackerMemory.set(email, info);
  }
}

async function isEmailBanned(email) {
  if (!kvAvailable || !kv) {
    return emailBannedMemory.has(email);
  }
  
  try {
    const banned = await kv.get(KV_PREFIXES.EMAIL_BANNED + email);
    if (banned) emailBannedMemory.add(email);
    return !!banned;
  } catch (error) {
    console.error('[KV Error] Failed to check email ban:', error.message);
    return emailBannedMemory.has(email);
  }
}

async function banEmail(email) {
  if (!kvAvailable || !kv) {
    emailBannedMemory.add(email);
    return;
  }
  
  try {
    // Store ban with 30 days expiry
    await kv.set(KV_PREFIXES.EMAIL_BANNED + email, true, { ex: 30 * 24 * 60 * 60 });
    emailBannedMemory.add(email);
  } catch (error) {
    console.error('[KV Error] Failed to ban email:', error.message);
    emailBannedMemory.add(email);
  }
}

async function trackEmailRequest(email, now) {
  const info = await getEmailInfo(email) || {
    requests: [],
    totalRequests: 0,
    firstSeen: now,
    lastSeen: now
  };
  
  info.requests.push(now);
  info.totalRequests++;
  info.lastSeen = now;
  
  // Keep only last 24 hours
  info.requests = info.requests.filter(timestamp => 
    now - timestamp < 24 * 60 * 60 * 1000
  );
  
  await setEmailInfo(email, info);
  
  // Auto-ban if excessive
  if (info.totalRequests >= EMAIL_LIMITS.BAN_THRESHOLD) {
    await banEmail(email);
    console.log(`[Security] Email auto-banned: ${email.substring(0, 5)}...`);
  }
  
  return info;
}

async function isEmailRateLimited(email, now) {
  const info = await getEmailInfo(email);
  if (!info) return false;
  
  const recentRequests = info.requests.filter(timestamp => 
    now - timestamp < 60 * 60 * 1000
  );
  
  const todayRequests = info.requests.filter(timestamp => 
    now - timestamp < 24 * 60 * 60 * 1000
  );
  
  if (recentRequests.length >= EMAIL_LIMITS.MAX_REQUESTS_PER_HOUR) {
    return { limited: true, reason: 'hour', count: recentRequests.length };
  }
  
  if (todayRequests.length >= EMAIL_LIMITS.MAX_REQUESTS_PER_DAY) {
    return { limited: true, reason: 'day', count: todayRequests.length };
  }
  
  return false;
}

// 🎯 ADAPTIVE CAPTCHA CONFIGURATION
const CAPTCHA_CONFIG = {
  TRIGGER_THRESHOLD: 10,
  TRIGGER_WINDOW: 5 * 60 * 1000,
  ACTIVE_DURATION: 10 * 60 * 1000,
  COOLDOWN_AFTER_SUCCESS: 5 * 60 * 1000,
  EMAIL_TRIGGER: 2
};

const shadowBanned = new Set();
const requestTracker = new Map();
const captchaStates = new Map();

// Space Mail configuration
const EMAIL_CONFIG = {
  host: 'mail.spacemail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER || 'contact@shakibul.com',
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    ciphers: 'TLS_AES_256_GCM_SHA384',
    minVersion: 'TLSv1.2',
    rejectUnauthorized: process.env.NODE_ENV === 'production'
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  socketTimeout: 10000,
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  debug: process.env.NODE_ENV === 'development'
};

const createTransporter = () => {
  return nodemailer.createTransport(EMAIL_CONFIG);
};

const logger = (level, message, ip, additionalData = {}) => {
  const logEntry = JSON.stringify({
    level,
    timestamp: new Date().toISOString(),
    ip,
    message,
    ...additionalData
  });
  
  if (process.env.NODE_ENV === 'development') {
    const colors = {
      info: '\x1b[36m',
      debug: '\x1b[90m',
      warn: '\x1b[33m',
      error: '\x1b[31m',
      critical: '\x1b[41m\x1b[37m'
    };
    console.log(`${colors[level] || ''}[${level.toUpperCase()}] ${message}\x1b[0m`, additionalData);
  } else {
    console.log(logEntry);
  }
};

const getClientIP = (req) => {
  const vercelIP = req.headers.get('x-vercel-forwarded-for');
  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  const realIP = req.headers.get('x-real-ip');
  const xForwardedFor = req.headers.get('x-forwarded-for');

  return vercelIP?.split(',')[0]?.trim() ||
         cfConnectingIP ||
         realIP ||
         xForwardedFor?.split(',')[0]?.trim() ||
         'unknown-ip';
};
const getIPSubnet = (ip) => {
  if (!ip || ip === 'unknown-ip') return 'unknown';
  const ipv4Match = ip.match(/^(\d+\.\d+\.\d+)\.\d+$/);
  if (ipv4Match) return ipv4Match[1];
  return ip;
};

const getServerFingerprint = (req) => {
  const ua = req.headers.get('user-agent') || '';
  const lang = req.headers.get('accept-language') || '';
  const encoding = req.headers.get('accept-encoding') || '';
  
  return crypto
    .createHash('sha256')
    .update(`${ua}|${lang}|${encoding}`)
    .digest('hex')
    .substring(0, 16);
};

const validateEmailConfig = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    logger('critical', 'Email credentials not configured', 'system');
    return false;
  }
  
  if (!validator.isEmail(process.env.EMAIL_USER)) {
    logger('critical', 'Invalid email format in EMAIL_USER', 'system');
    return false;
  }
  
  return true;
};

const testEmailConnection = async (transporter) => {
  try {
    await transporter.verify();
    logger('info', 'Space Mail connection verified successfully', 'system');
    return true;
  } catch (error) {
    logger('error', 'Space Mail connection failed', 'system', {
      error: error.message,
      code: error.code
    });
    return false;
  }
};

const checkHoneypot = (body, ip, requestId) => {
  for (const field of HONEYPOT_FIELDS) {
    if (body[field] && body[field].trim().length > 0) {
      logger('critical', 'Honeypot triggered - Bot detected', ip, {
        requestId,
        field,
        value: body[field].substring(0, 20)
      });
      return true;
    }
  }
  return false;
};

const detectSpamPatterns = (message) => {
  const spamKeywords = [
    'viagra', 'cialis', 'lottery', 'winner', 'claim your prize',
    'click here now', 'limited time offer', 'act now', 'free money',
    'nigerian prince', 'inheritance', 'casino', 'poker', 'crypto wallet',
    'bitcoin', 'investment opportunity', 'make money fast'
  ];
  
  const lowerMessage = message.toLowerCase();
  return spamKeywords.some(keyword => lowerMessage.includes(keyword));
};

const payloadCache = new Map();
const MAX_PAYLOAD_REUSE = 3;

const checkPayloadReuse = (email, message, ip, requestId) => {
  const payloadHash = crypto
    .createHash('sha256')
    .update(`${email}|${message}`)
    .digest('hex');
  
  const record = payloadCache.get(payloadHash) || { count: 0, ips: new Set() };
  record.count++;
  record.ips.add(ip);
  record.lastUsed = Date.now();
  payloadCache.set(payloadHash, record);
  
  if (payloadCache.size > 1000) {
    const now = Date.now();
    for (const [hash, data] of payloadCache.entries()) {
      if (now - data.lastUsed > 60 * 60 * 1000) {
        payloadCache.delete(hash);
      }
    }
  }
  
  if (record.count > MAX_PAYLOAD_REUSE) {
    logger('warn', 'Identical payload detected multiple times', ip, {
      requestId,
      reuseCount: record.count,
      uniqueIPs: record.ips.size
    });
    return true;
  }
  
  return false;
};

const shouldRequireCaptcha = async (clientKey, email, now) => {
  const tracker = requestTracker.get(clientKey);
  const emailInfo = await getEmailInfo(email);
  
  // Trigger CAPTCHA if email has made multiple requests
  if (emailInfo && emailInfo.requests.length >= CAPTCHA_CONFIG.EMAIL_TRIGGER) {
    const captchaState = captchaStates.get(clientKey);
    if (!captchaState || !captchaState.required) {
      captchaStates.set(clientKey, {
        required: true,
        activatedAt: now,
        reason: 'email_frequency'
      });
      logger('warn', 'CAPTCHA triggered by email frequency', 'system', {
        email: email.substring(0, 5) + '...',
        requestCount: emailInfo.requests.length
      });
    }
    return true;
  }
  
  const captchaState = captchaStates.get(clientKey);
  if (captchaState && captchaState.required) {
    if (now - captchaState.activatedAt > CAPTCHA_CONFIG.ACTIVE_DURATION) {
      captchaStates.delete(clientKey);
      logger('info', 'CAPTCHA requirement expired', 'system', { clientKey: clientKey.substring(0, 20) });
      return false;
    }
    return true;
  }
  
  if (!tracker) return false;
  
  if (tracker.lastSuccessfulCaptcha && (now - tracker.lastSuccessfulCaptcha < CAPTCHA_CONFIG.COOLDOWN_AFTER_SUCCESS)) {
    return false;
  }
  
  const recentRequests = tracker.requests.filter(timestamp => 
    now - timestamp < CAPTCHA_CONFIG.TRIGGER_WINDOW
  );
  
  tracker.requests = recentRequests;
  
  if (recentRequests.length >= CAPTCHA_CONFIG.TRIGGER_THRESHOLD) {
    captchaStates.set(clientKey, {
      required: true,
      activatedAt: now,
      reason: 'request_frequency'
    });
    logger('warn', 'CAPTCHA triggered due to high request volume', 'system', {
      clientKey: clientKey.substring(0, 20),
      requestCount: recentRequests.length
    });
    return true;
  }
  
  return false;
};

const recordRequest = (clientKey, now) => {
  const tracker = requestTracker.get(clientKey) || {
    requests: [],
    lastSuccessfulCaptcha: null
  };
  
  tracker.requests.push(now);
  tracker.requests = tracker.requests.filter(timestamp => 
    now - timestamp < 60 * 60 * 1000
  );
  
  requestTracker.set(clientKey, tracker);
};

const recordSuccessfulCaptcha = (clientKey, now) => {
  const tracker = requestTracker.get(clientKey);
  if (tracker) {
    tracker.lastSuccessfulCaptcha = now;
    tracker.requests = [];
    requestTracker.set(clientKey, tracker);
  }
  
  captchaStates.delete(clientKey);
  
  logger('info', 'CAPTCHA solved successfully', 'system', {
    clientKey: clientKey.substring(0, 20)
  });
};

const verifyTurnstile = async (token, ip) => {
  try {
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: token,
          remoteip: ip
        })
      }
    );
    
    const data = await response.json();
    
    if (data.success) {
      logger('info', 'Turnstile verification successful', ip);
      return { success: true };
    } else {
      logger('warn', 'Turnstile verification failed', ip, {
        errorCodes: data['error-codes']
      });
      return { success: false, errors: data['error-codes'] };
    }
  } catch (error) {
    logger('error', 'Turnstile verification error', ip, {
      error: error.message
    });
    return { success: false, error: error.message };
  }
};

const calculateRiskScore = (req, requestBody, clientKey) => {
  let score = 0;
  const signals = [];
  
  const timeOnPage = requestBody.timeOnPage || 0;
  if (timeOnPage < 3000) {
    score += 30;
    signals.push(`fast_fill:${timeOnPage}ms`);
  }
  
  const clientVisitorId = requestBody.visitorId;
  
  if (!clientVisitorId) {
    score += 20;
    signals.push('no_fingerprint');
  }
  
  const ua = req.headers.get('user-agent') || '';
  const suspiciousBots = ['curl', 'wget', 'python', 'bot', 'crawler', 'scraper'];
  if (suspiciousBots.some(bot => ua.toLowerCase().includes(bot))) {
    score += 40;
    signals.push('suspicious_ua');
  }
  
  const tracker = requestTracker.get(clientKey);
  if (tracker && tracker.requests.length > 10) {
    score += 25;
    signals.push(`high_frequency:${tracker.requests.length}`);
  }
  
  const email = requestBody.email || '';
  const disposableDomains = ['tempmail', 'guerrillamail', '10minutemail', 'throwaway', 'mailinator'];
  if (disposableDomains.some(domain => email.toLowerCase().includes(domain))) {
    score += 35;
    signals.push('disposable_email');
  }
  
  return { score, signals };
};

// Lazy cleanup instead of setInterval (avoids timer leaks in serverless)
let lastCleanupTime = 0;
const CLEANUP_INTERVAL = 10 * 60 * 1000;

function runLazyCleanup() {
  const now = Date.now();
  if (now - lastCleanupTime < CLEANUP_INTERVAL) return;
  lastCleanupTime = now;

  for (const [key, tracker] of requestTracker.entries()) {
    tracker.requests = tracker.requests.filter(timestamp => 
      now - timestamp < 60 * 60 * 1000
    );
    if (tracker.requests.length === 0 && !tracker.lastSuccessfulCaptcha) {
      requestTracker.delete(key);
    }
  }
  
  for (const [key, state] of captchaStates.entries()) {
    if (now - state.activatedAt > CAPTCHA_CONFIG.ACTIVE_DURATION * 2) {
      captchaStates.delete(key);
    }
  }
  
  for (const [hash, data] of payloadCache.entries()) {
    if (now - data.lastUsed > 60 * 60 * 1000) {
      payloadCache.delete(hash);
    }
  }
  
  logger('debug', 'Cleanup completed', 'system', {
    requestTrackerSize: requestTracker.size,
    captchaStatesSize: captchaStates.size,
    payloadCacheSize: payloadCache.size,
    shadowBannedSize: shadowBanned.size
  });
}

export async function POST(req) {
  // Trigger lazy cleanup of in-memory caches
  runLazyCleanup();

  // --- DoS Mitigation: Memory Exhaustion Protection ---
  if (requestTracker.size > 10000) requestTracker.clear();
  if (captchaStates.size > 10000) captchaStates.clear();
  if (shadowBanned.size > 10000) shadowBanned.clear();
  if (payloadCache.size > 10000) payloadCache.clear();
  if (emailTrackerMemory.size > 10000) emailTrackerMemory.clear();
  if (emailBannedMemory.size > 10000) emailBannedMemory.clear();
  // ----------------------------------------------------

  const requestId = crypto.randomUUID().substring(0, 8);
  const ip = getClientIP(req);
  const subnet = getIPSubnet(ip);
  const now = Date.now();
  
  try {
    logger('info', 'Request received', ip, { requestId, subnet });

    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      logger('warn', 'Invalid JSON body', ip, { requestId, error: parseError.message });
      return new Response(
        JSON.stringify({ error: 'Invalid request. Please check your input and try again.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const serverFingerprint = getServerFingerprint(req);
    const clientVisitorId = requestBody.visitorId || 'unknown';
    const clientKey = `${subnet}:${clientVisitorId}:${serverFingerprint}`;
    
    logger('debug', 'Client identified', ip, {
      requestId,
      clientKey: clientKey.substring(0, 30) + '...',
      subnet
    });

    recordRequest(clientKey, now);

    if (shadowBanned.has(clientKey)) {
      logger('info', 'Shadow banned client attempted request', ip, { requestId });
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Thank you for reaching out! Your message has been sent successfully. I\'ll get back to you soon.' 
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, max-age=0',
          }
        }
      );
    }

    // Early email validation to enable email-based tracking
    const email = requestBody.email?.toString().trim().toLowerCase();
    
    if (!email || !validator.isEmail(email)) {
      logger('warn', 'Invalid email format', ip, { requestId });
      return new Response(
        JSON.stringify({ error: 'Please enter a valid email address.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // EMAIL-BASED RATE LIMITING (persistent via Vercel KV)
    if (await isEmailBanned(email)) {
      logger('warn', 'Banned email attempted request', ip, {
        requestId,
        email: email.substring(0, 5) + '...'
      });
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Thank you for reaching out! Your message has been sent successfully.' 
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          }
        }
      );
    }

    const emailLimit = await isEmailRateLimited(email, now);
    if (emailLimit) {
      logger('warn', 'Email rate limit exceeded', ip, {
        requestId,
        email: email.substring(0, 5) + '...',
        reason: emailLimit.reason,
        count: emailLimit.count
      });
      
      const message = emailLimit.reason === 'hour' 
        ? `You've sent ${emailLimit.count} messages in the past hour. Please wait before sending another.`
        : `You've reached the daily limit of ${EMAIL_LIMITS.MAX_REQUESTS_PER_DAY} messages. Please try again tomorrow.`;
      
      return new Response(
        JSON.stringify({
          error: message,
          type: 'email_rate_limit'
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': emailLimit.reason === 'hour' ? '3600' : '86400'
          }
        }
      );
    }

    // Track this email request (persistent via Vercel KV)
    await trackEmailRequest(email, now);

    const captchaRequired = await shouldRequireCaptcha(clientKey, email, now);
    
    if (captchaRequired) {
      const captchaToken = requestBody.captchaToken;
      
      if (!captchaToken) {
        logger('warn', 'CAPTCHA required but not provided', ip, {
          requestId,
          clientKey: clientKey.substring(0, 20)
        });
        
        return new Response(
          JSON.stringify({
            error: 'Security verification required. Please complete the CAPTCHA.',
            requiresCaptcha: true
          }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      const verification = await verifyTurnstile(captchaToken, ip);
      
      if (!verification.success) {
        logger('warn', 'CAPTCHA verification failed', ip, {
          requestId,
          errors: verification.errors
        });
        
        return new Response(
          JSON.stringify({
            error: 'Security verification failed. Please try again.',
            requiresCaptcha: true
          }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      recordSuccessfulCaptcha(clientKey, now);
      logger('info', 'CAPTCHA verified, proceeding with request', ip, { requestId });
    }

    const riskAnalysis = calculateRiskScore(req, requestBody, clientKey);

    logger('debug', 'Risk analysis', ip, {
      requestId,
      score: riskAnalysis.score,
      signals: riskAnalysis.signals
    });
    
    if (riskAnalysis.score > 60 && !requestBody.captchaToken && !captchaRequired) {
      logger('warn', 'High risk score detected', ip, {
        requestId,
        score: riskAnalysis.score,
        signals: riskAnalysis.signals
      });
      
      captchaStates.set(clientKey, {
        required: true,
        activatedAt: now,
        reason: 'risk_score'
      });
      
      return new Response(
        JSON.stringify({
          error: 'Security verification required due to suspicious activity.',
          requiresCaptcha: true
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!validateEmailConfig()) {
      return new Response(
        JSON.stringify({ error: 'Email service is currently unavailable. Please try again later.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const transporter = createTransporter();
    const connectionValid = await testEmailConnection(transporter);
    if (!connectionValid) {
      return new Response(
        JSON.stringify({ 
          error: 'Email service is temporarily unavailable. Please try again in a few minutes.' 
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (checkHoneypot(requestBody, ip, requestId)) {
      shadowBanned.add(clientKey);
      await banEmail(email);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Thank you for reaching out! Your message has been sent successfully.' 
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          }
        }
      );
    }

    const { firstName, lastName, subject, message } = requestBody;

    const missingFields = [];
    if (!email) missingFields.push('email');
    if (!firstName) missingFields.push('first name');
    if (!lastName) missingFields.push('last name');
    if (!message) missingFields.push('message');

    if (missingFields.length > 0) {
      logger('warn', 'Missing required fields', ip, { requestId, missingFields });
      return new Response(
        JSON.stringify({ 
          error: `Please fill in all required fields: ${missingFields.join(', ')}.` 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const trimmedData = {
      email: email,
      firstName: firstName.toString().trim(),
      lastName: lastName.toString().trim(),
      subject: subject ? subject.toString().trim() : '',
      message: message.toString().trim()
    };

    if (!trimmedData.email || !trimmedData.firstName || !trimmedData.lastName || !trimmedData.message) {
      logger('warn', 'Empty field detected', ip, { requestId });
      return new Response(
        JSON.stringify({ error: 'Please ensure all required fields are properly filled.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (trimmedData.firstName.length > 50) {
      return new Response(
        JSON.stringify({ error: 'First name is too long (maximum 50 characters).' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (trimmedData.lastName.length > 50) {
      return new Response(
        JSON.stringify({ error: 'Last name is too long (maximum 50 characters).' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (trimmedData.subject.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Subject is too long (maximum 100 characters).' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (trimmedData.message.length > 2000) {
      return new Response(
        JSON.stringify({ error: 'Message is too long (maximum 2000 characters).' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (detectSpamPatterns(trimmedData.message)) {
      logger('warn', 'Spam pattern detected', ip, { requestId });
      shadowBanned.add(clientKey);
      await banEmail(email);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Thank you for reaching out! Your message has been sent successfully.' 
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          }
        }
      );
    }

    let normalizedEmail;
    try {
      normalizedEmail = validator.normalizeEmail(trimmedData.email);
      if (!normalizedEmail || !validator.isEmail(normalizedEmail)) {
        logger('warn', 'Invalid email format', ip, {
          requestId,
          emailAttempt: trimmedData.email
        });
        return new Response(
          JSON.stringify({ error: 'Please enter a valid email address.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      normalizedEmail = normalizedEmail.toLowerCase();
    } catch (emailError) {
      logger('error', 'Email normalization failed', ip, {
        requestId,
        originalEmail: trimmedData.email,
        error: emailError.message
      });
      normalizedEmail = trimmedData.email.toLowerCase();
    }

    if (checkPayloadReuse(normalizedEmail, trimmedData.message, ip, requestId)) {
      logger('warn', 'Excessive payload reuse detected', ip, { requestId });
      
      return new Response(
        JSON.stringify({ 
          error: 'This message has been submitted multiple times. Please wait before trying again.' 
        }),
        { 
          status: 429,
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': '300'
          }
        }
      );
    }

    let sanitizedData;
    try {
      sanitizedData = {
        email: normalizedEmail,
        firstName: sanitizeInput(trimmedData.firstName, { 
          ALLOWED_TAGS: [], 
          ALLOWED_ATTR: [] 
        }),
        lastName: sanitizeInput(trimmedData.lastName, { 
          ALLOWED_TAGS: [], 
          ALLOWED_ATTR: [] 
        }),
        subject: sanitizeInput(trimmedData.subject, { 
          ALLOWED_TAGS: [], 
          ALLOWED_ATTR: [] 
        }),
        message: sanitizeInput(trimmedData.message, { 
          ALLOWED_TAGS: ['br', 'p'], 
          ALLOWED_ATTR: [] 
        }),
      };
      
      if (sanitizedData.message.length === 0 && trimmedData.message.length > 0) {
        logger('warn', 'Message sanitization removed all content', ip, { requestId });
        return new Response(
          JSON.stringify({ error: 'Message contains invalid content. Please remove any HTML or special formatting.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      logger('debug', 'Input sanitized', ip, { requestId });
    } catch (sanitizationError) {
      logger('error', 'Sanitization failed', ip, {
        requestId,
        error: sanitizationError.message
      });
      return new Response(
        JSON.stringify({ error: 'Invalid input detected. Please check your message and try again.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!validator.isEmail(sanitizedData.email)) {
      logger('warn', 'Invalid email format after sanitization', ip, {
        requestId,
        emailAttempt: sanitizedData.email
      });
      return new Response(
        JSON.stringify({ error: 'Please enter a valid email address.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const emailSubject = sanitizedData.subject 
      ? `New Contact: ${sanitizedData.subject}`
      : `New Contact from ${sanitizedData.firstName} ${sanitizedData.lastName}`;

    const plainText = `New Contact Form Submission

Name: ${sanitizedData.firstName} ${sanitizedData.lastName}
Email: ${sanitizedData.email}
${sanitizedData.subject ? `Subject: ${sanitizedData.subject}\n` : ''}Submitted: ${new Date().toLocaleString()}
Request ID: ${requestId}

Message:
${sanitizedData.message}

---
This message was sent from your website contact form.
You can reply directly to ${sanitizedData.firstName} by clicking "Reply" in your email client.`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Form Submission</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f9fafb; }
    .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb; }
    .header { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 25px; }
    .section { margin-bottom: 25px; }
    .section h2 { color: #4b5563; font-size: 18px; margin-bottom: 10px; }
    .field { margin-bottom: 10px; }
    .field strong { color: #374151; min-width: 80px; display: inline-block; }
    .message-box { background-color: #f9fafb; padding: 20px; border-left: 4px solid #2563eb; border-radius: 6px; margin-top: 10px; line-height: 1.8; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #6b7280; text-align: center; }
    .highlight { color: #2563eb; font-weight: 600; }
    .metadata { font-size: 11px; color: #9ca3af; margin-top: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <h1 class="header">📧 New Contact Request</h1>
    
    <div class="section">
      <h2>👤 Contact Details</h2>
      <div class="field"><strong>Name:</strong> ${validator.escape(sanitizedData.firstName)} ${validator.escape(sanitizedData.lastName)}</div>
      <div class="field"><strong>Email:</strong> <a href="mailto:${validator.escape(sanitizedData.email)}" class="highlight">${validator.escape(sanitizedData.email)}</a></div>
      ${sanitizedData.subject ? `<div class="field"><strong>Subject:</strong> ${validator.escape(sanitizedData.subject)}</div>` : ''}
      <div class="field">
        <strong>Submitted:</strong> 
        <span>${new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })}</span>
        <small>(Bangladesh Time)</small>
      </div>
      <div class="metadata">Request ID: ${requestId}</div>
    </div>

    <div class="section">
      <h2>💬 Message</h2>
      <div class="message-box">
        ${validator.escape(sanitizedData.message).replace(/\n/g, '<br>')}
      </div>
    </div>
    
    <div class="footer">
      <p>This message was sent from your website contact form at shakibul.com</p>
      <p>You can reply directly to <span class="highlight">${sanitizedData.firstName}</span> by clicking "Reply" in your email client.</p>
    </div>
  </div>
</body>
</html>`;

    try {
      logger('info', 'Attempting to send email via Space Mail', ip, {
        requestId,
        to: 'contact@shakibul.com',
        fromEmail: sanitizedData.email.substring(0, 3) + '...'
      });
      
      const emailStartTime = Date.now();
      
      const mailOptions = {
        from: `"Shakibul Portfolio" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER,
        replyTo: `"${sanitizedData.firstName} ${sanitizedData.lastName}" <${sanitizedData.email}>`,
        subject: emailSubject,
        text: plainText,
        html: htmlContent,
        priority: 'normal',
        headers: {
          'X-Priority': '3',
          'X-Mailer': 'Node.js/Nodemailer',
          'X-Request-ID': requestId,
        }
      };

      const emailResponse = await transporter.sendMail(mailOptions);
      
      const emailDuration = Date.now() - emailStartTime;
      logger('info', 'Email sent successfully via Space Mail', ip, {
        requestId,
        messageId: emailResponse.messageId,
        duration: `${emailDuration}ms`,
        accepted: emailResponse.accepted.length,
        email: sanitizedData.email.substring(0, 3) + '...'
      });
    } catch (emailError) {
      logger('error', 'Email send failed via Space Mail', ip, {
        requestId,
        errorType: 'EmailError',
        errorMessage: emailError.message,
        errorCode: emailError.code,
        command: emailError.command,
        email: sanitizedData.email.substring(0, 3) + '...'
      });
      
      let errorMessage = 'Failed to send your message. Please try again in a few moments.';
      
      if (emailError.code === 'EAUTH') {
        errorMessage = 'Email service authentication error. Please contact support.';
      } else if (emailError.code === 'ECONNECTION') {
        errorMessage = 'Could not connect to email service. Please try again later.';
      } else if (emailError.code === 'ETIMEDOUT') {
        errorMessage = 'Email service timeout. Please try again.';
      } else if (emailError.message.includes('Invalid login')) {
        errorMessage = 'Email service configuration error. Please contact support.';
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          ...(process.env.NODE_ENV === 'development' ? { details: emailError.message } : {})
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Thank you for reaching out! Your message has been sent successfully. I\'ll get back to you soon.' 
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0',
        }
      }
    );
  } catch (error) {
    logger('error', 'Unexpected server error', ip, {
      requestId,
      errorType: 'UnhandledException',
      errorMessage: error.message,
      errorStack: error.stack
    });
    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred. Please try again later.',
        ...(process.env.NODE_ENV === 'development' ? { requestId } : {})
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
