# 🛡️ Professional Cybersecurity Portfolio

A modern, highly secure, and performance-optimized developer portfolio built using the latest web technologies and defense-in-depth principles. This portfolio is designed to showcase cybersecurity expertise, penetration testing skills, and professional certifications, while actively defending itself from spam, bot attacks, and automated abuse.

---

## 🚀 Tech Stack & Core Technologies

*   **Framework**: [Next.js 16.2.9](https://nextjs.org/) (React 19.2.7) with App Router.
*   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with a dark glassmorphism cyber-aesthetic and hardware-accelerated animations.
*   **Database**: [Upstash Redis](https://upstash.com/) for edge-level persistent rate-limiting, shadow-bans, and incident tracking.
*   **Mailing**: [Nodemailer 9.0.0](https://nodemailer.com/) with TLS encryption pool for secure SMTP delivery via Space Mail.
*   **Integrations**: Cloudflare Turnstile CAPTCHA and FingerprintJS v3 client-side device identification.

---

## 🔒 Security Architecture (Defense-in-Depth)

This portfolio acts as a live demonstration of secure development practices:

### 1. Edge-Level Custom Request Proxy (`proxy.js`)
Rather than relying on generic middleware, all site traffic is intercepted by a custom proxy:
*   **Adaptive Escalation Rate Limiter**: Tracks client request intervals and subnets. Traffic is categorized into **Normal**, **Suspicious**, and **Abusive** states, adjusting the window and threshold automatically.
*   **Subnet-Wide Shadow Banning**: If a malicious client tries to bypass rate limits by switching IPs within their subnet, the proxy flags the entire subnet and places it in a silent *Shadow Ban* list (persisted in Upstash Redis). The client receives a fake success response, but no payload is processed or sent.
*   **Serverless-Safe Lazy Cleanups**: Instead of running background `setInterval` timers which leak memory and fail in serverless edge runtimes, memory cleanup is lazy-evaluated and triggered per request.

### 2. Hardened Contact Form API (`app/api/SendEmail/route.js`)
The backend endpoint features strict validation checks before sending emails:
*   **Payload Signature Caching**: Message hashes are analyzed and cached in-memory. If identical content is submitted repeatedly (even from different IPs/emails), the system flags it as spam and triggers a ban.
*   **Multi-Signal Risk Scoring**: Calculates a live risk score for every submission based on:
    *   *Time on Page* (detects copy-paste bot autofill under 3 seconds).
    *   *Device Fingerprinting* (checks for missing browser fingerprint).
    *   *User-Agent inspection* (flags curl, python, wget, and headless scrapers).
    *   *Disposable Domain Lists* (detects temp-mail addresses).
*   **Cloudflare Turnstile CAPTCHA**: Enforces cryptographic site verification dynamically when risk scores or email frequencies exceed safe thresholds.
*   **Deep Input Sanitization**: Statically strips HTML tags, script attributes, nesting patterns, and malicious protocols (`javascript:`, `data:`, `vbscript:`) to prevent XSS (Cross-Site Scripting).
*   **Hidden Honeypots**: Incorporates obfuscated fields hidden from actual users using visual trapping (`.hp-trap`) instead of standard `display: none` css rules, intercepting automated form submission bots.

### 3. Dynamic CSP & Nonce Injection (`app/layout.js`)
*   Enforces a strict Content Security Policy (CSP) using dynamically generated HTTP headers.
*   Uses `nonce` verification for inline style and script tags.
*   Runs a client-side mutation observer to intercept and remove unauthorized scripts or iframes.

---

## 📁 Project Structure

```text
├── app/
│   ├── api/
│   │   └── SendEmail/
│   │       └── route.js       # Hardened email handler, Turnstile validator, and risk scoring
│   ├── components/
│   │   ├── About.jsx          # Profile details, core competencies, and terminal simulation
│   │   ├── Animations.jsx     # Hardware-accelerated Framer Motion & CSS keyframe wrappers
│   │   ├── Certifications.jsx # Accessible modal-based credential showcase
│   │   ├── Contact.jsx        # Front-end Turnstile/FingerprintJS form integrations
│   │   ├── Header.jsx         # Hero section with typing terminal aesthetic and smooth-scroll CTAs
│   │   ├── Navbar.jsx         # Dark mode navigation header
│   │   └── NonceScript.js     # Runtime script-injection filter for CSP safety
│   ├── favicon.ico
│   ├── globals.css            # Tailwind CSS v4 variables, custom keyframes, and neon animations
│   ├── layout.js              # CSP Nonce root layout definition
│   └── page.js                # Core landing page template
├── public/                    # Assets and static certification images
├── next.config.mjs            # Production build optimizations
├── package.json               # Dependency manifests & vulnerability overrides
├── proxy.js                   # Edge-level security proxy middleware (rate limiter / shadow banner)
└── tsconfig.json              # TypeScript compilation setup
```

---

## ⚙️ Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/Shakibul-CyberSec/shakibul-cybersecurity-portfolio.git
cd shakibul-cybersecurity-portfolio
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up Environment Variables
Create a `.env` or `.env.local` file in the root directory:

```env
# Upstash Redis Configuration (used for rate-limiting & shadow banning)
KV_REST_API_URL="https://your-upstash-redis-url.upstash.io"
KV_REST_API_TOKEN="your_upstash_redis_rest_token"

# SMTP Email Configuration (Space Mail)
EMAIL_USER="contact@yourdomain.com"
EMAIL_PASSWORD="your_smtp_mailbox_password"

# Cloudflare Turnstile Configuration
NEXT_PUBLIC_TURNSTILE_SITE_KEY="your_turnstile_site_key"
TURNSTILE_SECRET_KEY="your_turnstile_secret_key"
```

### 4. Running the Project

*   **Development Server**:
    ```bash
    npm run dev
    ```
*   **Production Build**:
    ```bash
    npm run build
    ```
*   **Start Production Server**:
    ```bash
    npm run start
    ```
*   **Linting**:
    ```bash
    npm run lint
    ```

---

## 🛡️ License

This project is open-source. Feel free to use the security framework and frontend templates to secure your own applications!
