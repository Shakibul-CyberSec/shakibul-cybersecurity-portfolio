'use client';
import { useState, useEffect, useRef } from 'react';
import { FiMail, FiGithub, FiLinkedin, FiSend, FiShield, FiCheckCircle, FiAlertCircle, FiClock } from 'react-icons/fi';
import { Animate, Stagger } from './Animations';
import Script from 'next/script';

const Contact = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    subject: '',
    message: '',
    // 🍯 HONEYPOT FIELDS - Hidden from real users
    company: '',
    website: '',
    phone_number: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responseMessage, setResponseMessage] = useState({ type: '', message: '' });
  const [visitorId, setVisitorId] = useState(null);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const pageLoadTime = useRef(Date.now());
  const turnstileRef = useRef(null);
  const turnstileWidgetId = useRef(null);
  const [fingerprintLoaded, setFingerprintLoaded] = useState(false);
  const [turnstileLoaded, setTurnstileLoaded] = useState(false);

  // Initialize FingerprintJS after script loads
  useEffect(() => {
    if (fingerprintLoaded && window.FingerprintJS) {
      const initFingerprint = async () => {
        try {
          const fp = await window.FingerprintJS.load();
          const result = await fp.get();
          setVisitorId(result.visitorId);
          console.log('🔒 Device fingerprint initialized:', result.visitorId.substring(0, 8) + '...');
        } catch (error) {
          console.error('❌ Fingerprint initialization failed:', error);
          setVisitorId('fallback-' + Math.random().toString(36).substring(7));
        }
      };
      
      initFingerprint();
    }
  }, [fingerprintLoaded]);

  // Render Turnstile when needed and loaded
  useEffect(() => {
    if (showCaptcha && turnstileLoaded && window.turnstile && turnstileRef.current && !turnstileWidgetId.current) {
      try {
        turnstileWidgetId.current = window.turnstile.render(turnstileRef.current, {
          sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA',
          callback: (token) => {
            console.log('✅ CAPTCHA solved');
            setCaptchaToken(token);
          },
          'error-callback': () => {
            console.error('❌ CAPTCHA error');
            setCaptchaToken(null);
          },
          'expired-callback': () => {
            console.warn('⏰ CAPTCHA expired');
            setCaptchaToken(null);
          },
          theme: 'dark',
          size: 'normal',
        });
      } catch (error) {
        console.error('❌ Turnstile render error:', error);
      }
    }
  }, [showCaptcha, turnstileLoaded]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (showCaptcha && !captchaToken) {
      setResponseMessage({
        type: 'error',
        message: 'Please complete the security verification before submitting.'
      });
      return;
    }

    setIsSubmitting(true);
    setResponseMessage({ type: '', message: '' });
    
    try {
      const timeOnPage = Date.now() - pageLoadTime.current;
      
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
        company: formData.company,
        website: formData.website,
        phone_number: formData.phone_number,
        visitorId: visitorId,
        timeOnPage: timeOnPage,
        captchaToken: captchaToken,
        timestamp: Date.now()
      };

      console.log('📤 Submitting form...', {
        visitorId: visitorId?.substring(0, 8) + '...',
        timeOnPage: `${(timeOnPage / 1000).toFixed(1)}s`,
        hasCaptcha: !!captchaToken
      });

      const response = await fetch('/api/SendEmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setResponseMessage({
          type: 'success',
          message: data.message || 'Message sent successfully!'
        });
        setFormData({ 
          firstName: '', 
          lastName: '', 
          email: '', 
          subject: '', 
          message: '',
          company: '',
          website: '',
          phone_number: ''
        });
        
        if (showCaptcha && window.turnstile && turnstileWidgetId.current) {
          window.turnstile.reset(turnstileWidgetId.current);
          setCaptchaToken(null);
        }
        
        setTimeout(() => {
          setResponseMessage({ type: '', message: '' });
        }, 5000);
      } else if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const requiresCaptcha = data.requiresCaptcha;
        
        let message = 'Too many requests. Please try again later.';
        if (retryAfter) {
          const minutes = Math.ceil(parseInt(retryAfter) / 60);
          message = `Rate limit exceeded. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`;
        }
        
        if (requiresCaptcha && !showCaptcha) {
          setShowCaptcha(true);
          message = 'Please complete the security verification to continue.';
        }
        
        setResponseMessage({
          type: 'ratelimit',
          message: message
        });
      } else if (response.status === 403) {
        if (data.requiresCaptcha && !showCaptcha) {
          setShowCaptcha(true);
        }
        setResponseMessage({
          type: 'error',
          message: data.error || 'Security verification required. Please try again.'
        });
        
        if (window.turnstile && turnstileWidgetId.current) {
          window.turnstile.reset(turnstileWidgetId.current);
          setCaptchaToken(null);
        }
      } else {
        setResponseMessage({
          type: 'error',
          message: data.error || 'Failed to send message. Please try again.'
        });
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      setResponseMessage({
        type: 'error',
        message: 'Network error. Please check your connection and try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const renderResponseMessage = () => {
    if (!responseMessage.message) return null;

    const messageStyles = {
      success: {
        bg: 'bg-neon-green/10',
        border: 'border-neon-green',
        text: 'text-neon-green',
        icon: <FiCheckCircle className="w-5 h-5 text-neon-green mr-3 flex-shrink-0" />
      },
      error: {
        bg: 'bg-red-500/10',
        border: 'border-red-500',
        text: 'text-red-400',
        icon: <FiAlertCircle className="w-5 h-5 text-red-400 mr-3 flex-shrink-0" />
      },
      ratelimit: {
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500',
        text: 'text-yellow-400',
        icon: <FiClock className="w-5 h-5 text-yellow-400 mr-3 flex-shrink-0" />
      }
    };

    const style = messageStyles[responseMessage.type] || messageStyles.error;

    return (
      <div className={`mb-6 p-4 ${style.bg} border ${style.border} rounded-lg flex items-start animate-fadeInUp`}>
        {style.icon}
        <span className={`${style.text} font-medium`}>{responseMessage.message}</span>
      </div>
    );
  };

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/@fingerprintjs/fingerprintjs@3/dist/fp.min.js"
        strategy="lazyOnload"
        onLoad={() => setFingerprintLoaded(true)}
      />
      
      {showCaptcha && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="lazyOnload"
          onLoad={() => setTurnstileLoaded(true)}
        />
      )}
      
      <section id="contact" className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <Animate animation="fadeInUp" delay={0.1} className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-neon-green/10 border border-neon-green/30 mb-6 hover-glow-subtle">
            <FiShield className="w-4 h-4 text-neon-green mr-2" />
            <span className="text-neon-green text-sm font-mono">Secure Contact</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6">
            Get In Touch
          </h2>
          <p className="text-xl text-cyber-gray max-w-3xl mx-auto leading-relaxed">
            For security consultations, vulnerability reports, or professional inquiries.
            All communications are encrypted and handled with strict confidentiality.
          </p>
        </Animate>

        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          <Stagger stagger={0.12} className="space-y-6">
            {[
              {
                icon: <FiMail className="w-6 h-6" />,
                title: 'Email',
                content: 'contact@shakibul.com',
                link: 'mailto:contact@shakibul.com',
              },
              {
                icon: <FiShield className="w-6 h-6" />,
                title: 'Security Notice',
                content: 'Responsible disclosure welcome',
                description: 'Security vulnerability reports are handled with priority',
              },
            ].map((item, index) => (
              <div key={index} className="cyber-card hover-lift group">
                <div className="flex items-start">
                  <div className="text-neon-green mr-4 transform group-hover:scale-110 transition-transform duration-300">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2 group-hover:text-neon-green transition-colors duration-300">
                      {item.title}
                    </h4>
                    {item.link ? (
                      <a
                        href={item.link}
                        className="text-cyber-gray hover:text-neon-green transition-colors break-all"
                      >
                        {item.content}
                      </a>
                    ) : (
                      <p className="text-cyber-gray">{item.content}</p>
                    )}
                    {item.description && (
                      <p className="text-sm text-cyber-gray mt-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <div className="cyber-card hover-lift">
              <h4 className="text-lg font-semibold text-white mb-4">Connect</h4>
              <div className="flex space-x-4">
                {[
                  { icon: <FiGithub className="w-5 h-5" />, label: 'GitHub', url: 'https://github.com/Shakibul-CyberSec' },
                  { icon: <FiLinkedin className="w-5 h-5" />, label: 'LinkedIn', url: 'https://www.linkedin.com/in/shakibul-bokthiar' },
                ].map((social, index) => (
                  <a
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-lg border border-cyber-border flex items-center justify-center text-cyber-gray hover:text-neon-green hover:border-neon-green hover:bg-neon-green/10 transition-all duration-300 hover:scale-110"
                    aria-label={social.label}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </Stagger>

          <div className="lg:col-span-2">
            <Animate animation="fadeInUp" delay={0.25} className="cyber-card p-8 hover-lift">
              <div className="flex items-center mb-8">
                <div className="flex space-x-2 mr-4">
                  <div className="w-3 h-3 rounded-full bg-red-500 terminal-button" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500 terminal-button" />
                  <div className="w-3 h-3 rounded-full bg-green-500 terminal-button" />
                </div>
                <span className="text-neon-green font-mono">secure_message.sh</span>
              </div>

              {renderResponseMessage()}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-cyber-gray mb-2 font-medium">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      maxLength={50}
                      className="w-full px-4 py-3 bg-cyber-dark border border-cyber-border rounded-lg text-white focus:outline-none focus:border-neon-green focus:ring-2 focus:ring-neon-green/20 transition-all duration-300"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-cyber-gray mb-2 font-medium">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      maxLength={50}
                      className="w-full px-4 py-3 bg-cyber-dark border border-cyber-border rounded-lg text-white focus:outline-none focus:border-neon-green focus:ring-2 focus:ring-neon-green/20 transition-all duration-300"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-cyber-gray mb-2 font-medium">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-cyber-dark border border-cyber-border rounded-lg text-white focus:outline-none focus:border-neon-green focus:ring-2 focus:ring-neon-green/20 transition-all duration-300"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm text-cyber-gray mb-2 font-medium">
                    Subject (Optional)
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    maxLength={100}
                    className="w-full px-4 py-3 bg-cyber-dark border border-cyber-border rounded-lg text-white focus:outline-none focus:border-neon-green focus:ring-2 focus:ring-neon-green/20 transition-all duration-300"
                    placeholder="Security Consultation"
                  />
                </div>

                <div>
                  <label className="block text-sm text-cyber-gray mb-2 font-medium">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    maxLength={2000}
                    rows="6"
                    className="w-full px-4 py-3 bg-cyber-dark border border-cyber-border rounded-lg text-white focus:outline-none focus:border-neon-green focus:ring-2 focus:ring-neon-green/20 transition-all duration-300 resize-none"
                    placeholder="Describe your security requirements..."
                  />
                  <div className="text-xs text-cyber-gray mt-1 text-right">
                    {formData.message.length}/2000
                  </div>
                </div>

                {/* 🍯 HONEYPOT FIELDS - Completely hidden from real users, only bots will fill these */}
                <div className="hidden">
                  <label htmlFor="company">Company Name (Leave blank)</label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                  
                  <label htmlFor="website">Website URL (Leave blank)</label>
                  <input
                    type="text"
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                  
                  <label htmlFor="phone_number">Phone Number (Leave blank)</label>
                  <input
                    type="tel"
                    id="phone_number"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>

                {showCaptcha && (
                  <div className="animate-fadeInUp">
                    <div className="bg-yellow-500/10 border border-yellow-500 rounded-lg p-4 mb-4">
                      <div className="flex items-start">
                        <FiShield className="w-5 h-5 text-yellow-400 mr-3 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-yellow-400 font-semibold mb-1">Security Verification Required</h4>
                          <p className="text-sm text-cyber-gray">
                            We've detected unusual activity. Please complete the verification below to continue.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <div ref={turnstileRef}></div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-6 border-t border-cyber-border">
                  <div className="flex items-center text-sm text-cyber-gray">
                    <FiShield className="mr-2 text-neon-green" />
                    End-to-end encrypted
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting || (showCaptcha && !captchaToken)}
                    className="group relative inline-flex items-center px-8 py-3 bg-gradient-to-r from-neon-green to-neon-cyan text-black font-semibold rounded-lg overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-neon-green/30 transition-all duration-300 hover:scale-105 active:scale-95"
                  >
                    <span className="relative z-10 flex items-center">
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                      <FiSend className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </button>
                </div>
              </form>
            </Animate>
          </div>
        </div>

        <Animate animation="fadeInUp" delay={0.4} className="text-center pt-8 border-t border-cyber-border">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-cyber-gray mb-4 md:mb-0">
              <div className="text-white font-heading mb-1">Shakibul Bokthiar</div>
              <div className="text-sm">Cybersecurity Specialist</div>
            </div>
            <div className="flex space-x-6 text-sm text-cyber-gray">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Security Policy</a>
              <div className="text-neon-green font-mono">© 2025</div>
            </div>
          </div>
        </Animate>
      </div>
    </section>
    </>
  );
};

export default Contact;
