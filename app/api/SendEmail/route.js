import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import validator from 'validator';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Initialize services
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Honeypot and spam detection
const HONEYPOT_FIELDS = ['company', 'website', 'phone_number']; // Hidden fields
const shadowBanned = new Set(); // Persist shadow bans

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
  const xForwardedFor = req.headers.get('x-forwarded-for');
  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  const realIP = req.headers.get('x-real-ip');
  const vercelIP = req.headers.get('x-vercel-forwarded-for');
  
  return xForwardedFor?.split(',')[0]?.trim() || 
         cfConnectingIP || 
         realIP || 
         vercelIP?.split(',')[0]?.trim() || 
         'unknown-ip';
};

const getFingerprint = (req) => {
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
  
  const emailDomain = process.env.EMAIL_USER.split('@')[1];
  if (emailDomain !== 'shakibul.com') {
    logger('warn', `Email domain ${emailDomain} may not be configured with Space Mail`, 'system');
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

// Detect honeypot submissions
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

// Detect spam patterns
const detectSpamPatterns = (message) => {
  const spamKeywords = [
    'viagra', 'cialis', 'lottery', 'winner', 'claim your prize',
    'click here now', 'limited time offer', 'act now', 'free money',
    'nigerian prince', 'inheritance', 'casino', 'poker'
  ];
  
  const lowerMessage = message.toLowerCase();
  return spamKeywords.some(keyword => lowerMessage.includes(keyword));
};

// Check for identical payload reuse
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
  
  // Cleanup old entries every 100 checks
  if (payloadCache.size > 1000) {
    const now = Date.now();
    for (const [hash, data] of payloadCache.entries()) {
      if (now - data.lastUsed > 60 * 60 * 1000) { // 1 hour
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

export async function POST(req) {
  const requestId = crypto.randomUUID().substring(0, 8);
  const ip = getClientIP(req);
  const fingerprint = getFingerprint(req);
  const clientKey = `${ip}:${fingerprint}`;
  
  try {
    logger('info', 'Request received', ip, { requestId, fingerprint });

    // Check if shadow banned
    if (shadowBanned.has(clientKey)) {
      logger('info', 'Shadow banned client attempted request', ip, { requestId });
      
      // Return fake success
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

    if (!validateEmailConfig()) {
      return new Response(
        JSON.stringify({ error: 'Email service is currently unavailable. Please try again later.' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const transporter = createTransporter();
    const connectionValid = await testEmailConnection(transporter);
    if (!connectionValid) {
      return new Response(
        JSON.stringify({ 
          error: 'Email service is temporarily unavailable. Please try again in a few minutes.' 
        }),
        { 
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    let requestBody;
    try {
      requestBody = await req.json();
      logger('debug', 'Request body parsed', ip, {
        requestId,
        hasEmail: !!requestBody.email,
        hasFirstName: !!requestBody.firstName,
        hasLastName: !!requestBody.lastName,
        hasSubject: !!requestBody.subject,
        hasMessage: !!requestBody.message
      });
    } catch (parseError) {
      logger('warn', 'Invalid JSON body', ip, {
        requestId,
        error: parseError.message
      });
      return new Response(
        JSON.stringify({ error: 'Invalid request. Please check your input and try again.' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 🍯 HONEYPOT CHECK - Instant permanent ban
    if (checkHoneypot(requestBody, ip, requestId)) {
      shadowBanned.add(clientKey);
      
      // Return fake success - no feedback
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

    const { email, firstName, lastName, subject, message } = requestBody;

    const missingFields = [];
    if (!email) missingFields.push('email');
    if (!firstName) missingFields.push('first name');
    if (!lastName) missingFields.push('last name');
    if (!message) missingFields.push('message');

    if (missingFields.length > 0) {
      logger('warn', 'Missing required fields', ip, {
        requestId,
        missingFields
      });
      return new Response(
        JSON.stringify({ 
          error: `Please fill in all required fields: ${missingFields.join(', ')}.` 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const trimmedData = {
      email: email.toString().trim(),
      firstName: firstName.toString().trim(),
      lastName: lastName.toString().trim(),
      subject: subject ? subject.toString().trim() : '',
      message: message.toString().trim()
    };

    if (!trimmedData.email || !trimmedData.firstName || !trimmedData.lastName || !trimmedData.message) {
      logger('warn', 'Empty field detected', ip, { requestId });
      return new Response(
        JSON.stringify({ error: 'Please ensure all required fields are properly filled.' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (trimmedData.firstName.length > 50) {
      return new Response(
        JSON.stringify({ error: 'First name is too long (maximum 50 characters).' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    if (trimmedData.lastName.length > 50) {
      return new Response(
        JSON.stringify({ error: 'Last name is too long (maximum 50 characters).' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    if (trimmedData.subject.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Subject is too long (maximum 100 characters).' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    if (trimmedData.message.length > 2000) {
      return new Response(
        JSON.stringify({ error: 'Message is too long (maximum 2000 characters).' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 🚨 SPAM PATTERN DETECTION
    if (detectSpamPatterns(trimmedData.message)) {
      logger('warn', 'Spam pattern detected', ip, { requestId });
      shadowBanned.add(clientKey);
      
      // Return fake success
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
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
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

    // 🔄 PAYLOAD REUSE DETECTION
    if (checkPayloadReuse(normalizedEmail, trimmedData.message, ip, requestId)) {
      logger('warn', 'Excessive payload reuse detected', ip, { requestId });
      
      // Don't ban immediately, but throttle
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
        firstName: DOMPurify.sanitize(trimmedData.firstName, { 
          ALLOWED_TAGS: [], 
          ALLOWED_ATTR: [] 
        }),
        lastName: DOMPurify.sanitize(trimmedData.lastName, { 
          ALLOWED_TAGS: [], 
          ALLOWED_ATTR: [] 
        }),
        subject: DOMPurify.sanitize(trimmedData.subject, { 
          ALLOWED_TAGS: [], 
          ALLOWED_ATTR: [] 
        }),
        message: DOMPurify.sanitize(trimmedData.message, { 
          ALLOWED_TAGS: ['br', 'p'], 
          ALLOWED_ATTR: [] 
        }),
      };
      
      if (sanitizedData.message.length === 0 && trimmedData.message.length > 0) {
        logger('warn', 'Message sanitization removed all content', ip, { requestId });
        return new Response(
          JSON.stringify({ error: 'Message contains invalid content. Please remove any HTML or special formatting.' }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
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
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!validator.isEmail(sanitizedData.email)) {
      logger('warn', 'Invalid email format after sanitization', ip, {
        requestId,
        emailAttempt: sanitizedData.email
      });
      return new Response(
        JSON.stringify({ error: 'Please enter a valid email address.' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
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
<html>
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
          'X-Mail-Service': 'SpaceMail',
          'X-Client-Fingerprint': fingerprint
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
          details: process.env.NODE_ENV === 'development' ? emailError.message : undefined
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
        requestId: process.env.NODE_ENV === 'development' ? requestId : undefined
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
