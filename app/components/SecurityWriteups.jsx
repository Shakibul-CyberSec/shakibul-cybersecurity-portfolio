'use client';
import { useState } from 'react';
import { FiBookOpen, FiX, FiArrowRight, FiExternalLink } from 'react-icons/fi';
import { Animate, Stagger } from './Animations';

const writeups = [
  {
    id: 'shadow-ban',
    title: 'Edge-Level Subnet Shadow-Banning Architecture',
    tag: 'Defensive Security',
    date: '2026-07-15',
    summary: 'How lazy subnet tracking and persistent Upstash Redis stores allow silent bot mitigation without leaking memory in serverless runtimes.',
    content: `### Abstract & Architecture
Generic rate limiters rely on individual IP addresses. Modern automated scrapers bypass basic IP limits by rotating through residential IP subnets. 

This research paper details our custom Edge Proxy (\`proxy.js\`) implementation:
1. **Subnet Mask Aggregation**: IP addresses are aggregated into \`/24\` subnets.
2. **Adaptive Escalation**: Request windows automatically contract when abuse patterns trigger.
3. **Silent Shadow Banning**: Suspicious clients receive a mock \`200 OK\` HTTP status while their actual payload processing is safely aborted at the edge.

\`\`\`javascript
// Lazy-evaluated subnet memory cleanup (Serverless Safe)
if (now - lastCleanup > CLEANUP_INTERVAL) {
  subnetStore.clearStaleEntries(now);
}
\`\`\``
  },
  {
    id: 'csp-nonce',
    title: 'Dynamic CSP & Nonce Script Verification in Next.js 16',
    tag: 'Web Security',
    date: '2026-06-28',
    summary: 'Preventing Cross-Site Scripting (XSS) using dynamic cryptographic nonces and runtime DOM script observers.',
    content: `### Content Security Policy (CSP) Design
Inline script execution remains one of the top attack vectors for Stored and Reflected XSS.

Our implementation:
1. Generates a unique, cryptographically random base64 **nonce** per HTTP request.
2. Injects the nonce header into the server response layout.
3. Enforces strict \`script-src 'nonce-...' 'strict-dynamic'\` policies, invalidating unauthorized inline injections.
4. Uses a lightweight Mutation Observer (\`NonceScript.js\`) to strip unauthorized dynamic \`<script>\` elements immediately upon DOM insertion.`
  },
  {
    id: 'risk-score',
    title: 'Multi-Signal Risk Scoring for Form Abuse Mitigation',
    tag: 'Application Security',
    date: '2026-05-12',
    summary: 'Building a multi-vector bot mitigation pipeline combining Cloudflare Turnstile, FingerprintJS, honeypots, and payload signature caching.',
    content: `### Multi-Vector Risk Score Algorithm
Rather than blocking legitimate users with repetitive CAPTCHA challenges, our backend (\`app/api/SendEmail/route.js\`) calculates a dynamic **Risk Score** ($0 - 100$):

* **Time-on-Page Check**: Submissions under 3.0 seconds add $+40$ risk points (bot autofill).
* **Obfuscated Honeypot**: Hidden \`.hp-trap\` field triggers immediate shadow-ban.
* **Payload Hash Caching**: Message contents are hashed with SHA-256 and stored in Upstash Redis to prevent repeat spam.`
  }
];

export default function SecurityWriteups() {
  const [activeWriteup, setActiveWriteup] = useState(null);

  return (
    <section id="writeups" className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <Animate animation="fadeInUp" delay={0.1}>
          <div className="text-center mb-16 space-y-3">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan font-mono text-xs uppercase tracking-widest">
              <FiBookOpen />
              <span>Research & Security Papers</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-heading text-white font-bold tracking-tight">
              Security Technical <span className="text-neon-cyan">Writeups & Engineering</span>
            </h2>
            <p className="text-cyber-gray max-w-2xl mx-auto text-sm sm:text-base font-mono">
              In-depth technical writeups detailing defensive architecture, vulnerability mitigation, and secure design patterns.
            </p>
          </div>
        </Animate>

        {/* Writeups Card Grid */}
        <Stagger animation="fadeInUp" stagger={0.15}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {writeups.map((w) => (
              <div
                key={w.id}
                onClick={() => setActiveWriteup(w)}
                className="p-6 bg-[#111111] border border-cyber-border rounded-xl shadow-xl hover:border-neon-cyan/50 hover:shadow-neon-cyan/10 transition-all duration-300 cursor-pointer flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-md bg-neon-cyan/10 text-neon-cyan text-xs font-mono font-semibold border border-neon-cyan/30">
                      {w.tag}
                    </span>
                    <span className="text-xs font-mono text-cyber-gray">{w.date}</span>
                  </div>

                  <h3 className="text-lg font-heading text-white font-bold group-hover:text-neon-cyan transition-colors duration-300">
                    {w.title}
                  </h3>

                  <p className="text-xs font-mono text-cyber-gray leading-relaxed">
                    {w.summary}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-cyber-border/40 flex items-center justify-between text-xs font-mono text-neon-cyan">
                  <span>Read Full Writeup</span>
                  <FiArrowRight className="group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </div>
            ))}
          </div>
        </Stagger>

        {/* External Link to Full Security Blog / Subdomain */}
        <Animate animation="fadeInUp" delay={0.3}>
          <div className="mt-12 text-center">
            <a
              href="https://writeups.shakibul.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-3 px-6 py-3 bg-neon-cyan/10 hover:bg-neon-cyan/20 border border-neon-cyan/40 text-neon-cyan font-mono text-xs sm:text-sm font-semibold rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-neon-cyan/20 group"
            >
              <span>Explore All Technical Writeups & CTF Labs on writeups.shakibul.com</span>
              <FiExternalLink className="group-hover:translate-x-1 transition-transform duration-300" />
            </a>
          </div>
        </Animate>

        {/* Writeup Modal Viewer */}
        {activeWriteup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="bg-[#111111] border border-neon-cyan/40 rounded-2xl max-w-3xl w-full p-6 sm:p-8 max-h-[85vh] overflow-y-auto shadow-2xl relative custom-scrollbar space-y-6">
              
              <button
                onClick={() => setActiveWriteup(null)}
                className="absolute top-5 right-5 text-cyber-gray hover:text-white p-2 rounded-lg bg-cyber-border/40 transition-colors cursor-pointer"
              >
                <FiX size={20} />
              </button>

              <div className="space-y-2">
                <span className="px-3 py-1 rounded-md bg-neon-cyan/10 text-neon-cyan text-xs font-mono border border-neon-cyan/30">
                  {activeWriteup.tag}
                </span>
                <h3 className="text-2xl font-heading text-white font-bold">{activeWriteup.title}</h3>
                <p className="text-xs font-mono text-cyber-gray">Published on {activeWriteup.date}</p>
              </div>

              <div className="prose prose-invert max-w-none font-mono text-xs sm:text-sm text-cyber-gray leading-relaxed space-y-4 border-t border-cyber-border pt-4">
                <pre className="whitespace-pre-wrap font-mono bg-[#0a0a0a] p-4 rounded-xl border border-cyber-border text-white">
                  {activeWriteup.content}
                </pre>
              </div>

              <div className="pt-2 border-t border-cyber-border/40 flex justify-end">
                <a
                  href={`https://writeups.shakibul.com/writeup/${activeWriteup.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-neon-cyan/10 hover:bg-neon-cyan/20 border border-neon-cyan/40 text-neon-cyan font-mono text-xs font-semibold rounded-lg transition-all"
                >
                  <span>Open Full Paper on writeups.shakibul.com</span>
                  <FiExternalLink />
                </a>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
