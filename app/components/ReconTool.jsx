'use client';
import { useState } from 'react';
import { FiGithub, FiTerminal, FiShield, FiZap, FiCheckCircle, FiDownload, FiStar, FiCode } from 'react-icons/fi';
import { Animate, Stagger, HoverEffect } from './Animations';

const ReconTool = () => {
  const [selectedFeature, setSelectedFeature] = useState(null);

  const features = [
    {
      id: 1,
      icon: <FiTerminal className="w-6 h-6" />,
      title: 'Multi-Phase Pipeline',
      description: '17 ruthless reconnaissance phases that tear through targets from subdomain discovery to zero-day hunting',
      details: 'Full-spectrum automated attack surface mapping. Passive enum, DNS brute-force, port sweeps, HTTP probing, JS extraction, vulnerability assessment. Everything you need to dominate.',
      phase: 'Phases 1-14'
    },
    {
      id: 2,
      icon: <FiShield className="w-6 h-6" />,
      title: 'Advanced Security',
      description: 'Battle-hardened bash that doesn\'t break. Centralized job control, smart rate limiting, zero BS',
      details: 'Security-first architecture. Proper variable quoting, input sanitization, exponential backoff. No dangerous constructs, no command injection holes. Built to survive anything.',
      phase: 'v1.0 Enhanced'
    },
    {
      id: 3,
      icon: <FiZap className="w-6 h-6" />,
      title: 'Performance Optimized',
      description: 'Lightning-fast parallel execution that maxes out your hardware without breaking a sweat',
      details: 'Intelligent job tracking, graceful timeout handling, adaptive concurrency. Rate limiting that respects targets while staying aggressive. Optimized for speed, built for reliability.',
      phase: 'High Performance'
    },
    {
      id: 4,
      icon: <FiCheckCircle className="w-6 h-6" />,
      title: 'Resume Capability',
      description: 'Crash? No problem. Pick up exactly where you left off. Never waste a single second of recon time',
      details: 'Advanced checkpoint system with state tracking. Automatic recovery from crashes, network failures, or interruptions. Run 48-hour scans without fear. Your progress is sacred.',
      phase: 'Smart Recovery'
    }
  ];

  const phases = [
    { num: '01', name: 'Subdomain Enumeration', tools: 'subfinder, assetfinder, crt.sh, amass, puredns, dnsx, dnsgen' },
    { num: '02', name: 'Port Scanning', tools: 'naabu, nmap, dig' },
    { num: '03', name: 'HTTP Probing', tools: 'httpx' },
    { num: '04', name: 'URL Collection', tools: 'gau, katana, url-extension' },
    { num: '05', name: 'JavaScript Analysis', tools: 'down, jsscan, httpx' },
    { num: '5.5', name: 'API Discovery', tools: 'httpx' },
    { num: '5.6', name: 'Cloud Asset Discovery', tools: 'CT logs, pattern matching' },
    { num: '5.7', name: 'WAF Detection', tools: 'wafw00f' },
    { num: '06', name: 'Nuclei Vulnerability Scan', tools: 'nuclei' },
    { num: '07', name: 'Vulnerability Pattern Matching', tools: 'gf' },
    { num: '08', name: 'DNS Reconnaissance', tools: 'dig, dnsrecon, whois, subjack' },
    { num: '09', name: 'Visual Screenshots', tools: 'gowitness' },
    { num: '10', name: 'Technology Fingerprinting', tools: 'curl, jq' },
    { num: '11', name: 'Parameter Discovery', tools: 'grep, awk' },
    { num: '12', name: 'Parameter Fuzzing', tools: 'arjun' },
    { num: '13', name: 'CORS Testing', tools: 'curl' },
    { num: '14', name: 'Quick Security Checks', tools: 'httpx, curl' }
  ];

  const stats = [
    { value: '17', label: 'Recon Phases', suffix: '' },
    { value: '30+', label: 'Security Tools', suffix: '' },
    { value: '1.0', label: 'Latest Version', suffix: '' },
    { value: '100%', label: 'Open Source', suffix: '' }
  ];

  return (
    <section id="recon-tool" className="py-20 px-4 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 cyber-grid opacity-20 pointer-events-none" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <Animate animation="fadeInUp" delay={0.1} className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 mb-6 hover-glow-subtle">
            <FiCode className="w-4 h-4 text-neon-cyan mr-2" />
            <span className="text-neon-cyan text-sm font-mono">Featured Project</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6 text-glow-subtle">
            Bug Bounty Recon Pipeline
          </h2>
          <p className="text-xl text-cyber-gray max-w-3xl mx-auto leading-relaxed">
            Elite-level reconnaissance automation that hunts like a pro. 17 phases of pure recon power, 
            from subdomain enumeration to vulnerability discovery. Built for bug bounty hunters who don't mess around. 
            Fast, lethal, and unstoppable.
          </p>
        </Animate>

        {/* Stats Grid */}
        <Stagger stagger={0.12} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="cyber-card text-center group hover-lift">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-green to-neon-cyan mb-2 group-hover:scale-110 transition-transform duration-300">
                {stat.value}{stat.suffix}
              </div>
              <div className="text-cyber-gray text-sm group-hover:text-white transition-colors duration-300">
                {stat.label}
              </div>
            </div>
          ))}
        </Stagger>

        {/* Main Demo Terminal */}
        <Animate animation="scaleIn" delay={0.25} className="mb-16">
          <div className="terminal-aesthetic cyber-card p-8 hover-terminal">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-neon-green/20">
              <div className="flex items-center">
                <div className="flex space-x-2 mr-4">
                  <div className="w-3 h-3 rounded-full bg-red-500 terminal-button" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500 terminal-button animation-delay-100" />
                  <div className="w-3 h-3 rounded-full bg-green-500 terminal-button animation-delay-200" />
                </div>
                <span className="text-neon-green font-mono text-sm">recon.sh</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse-dot"></div>
                  <span className="text-neon-green/60 text-xs font-mono">RUNNING</span>
                </div>
                <a
                  href="https://github.com/Shakibul-CyberSec/Bug-Bounty-Reconnaissance-Automation"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-3 py-1 bg-neon-green/10 border border-neon-green/30 rounded-lg hover:bg-neon-green/20 transition-all duration-300 group"
                >
                  <FiGithub className="w-4 h-4 text-neon-green group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-neon-green text-xs font-mono">View Source</span>
                </a>
              </div>
            </div>
            <pre className="text-sm font-mono text-cyber-gray overflow-x-auto terminal-content leading-relaxed">
{`$ ./recon.sh target.com --verbose

╔════════════════════════════════════════════╗
║   BUG BOUNTY RECON PIPELINE v1.0           ║
║   High-Performance Recon Automation        ║
╚════════════════════════════════════════════╝
   Parallel • Fast • Precise • Elite
   Author: Shakibul | Shakibul_Cybersec
══════════════════════════════════════════════

[+] Verifying tools... OK

[PHASE 1] Subdomain Enumeration
  • Passive + brute-force + permutations
  • Resolved subdomains: 3,421

[PHASE 2] Port Discovery
  • CDN filtering enabled
  • Origin IPs scanned: 847
  • Open ports identified: 5,621

[PHASE 3] HTTP Service Detection
  • Live web services: 2,847

[PHASE 4] URL Intelligence
  • Archive + active crawling
  • Unique URLs collected: 18,934

[PHASE 5] JavaScript Intelligence
  • JS files analyzed: 856

[✓] Recon completed for target.com
══════════════════════════════════════════════
 SUMMARY
══════════════════════════════════════════════
Subdomains   : 3,421
Live Hosts   : 2,847
Open Ports   : 5,621
URLs         : 18,934
JS Files     : 856

[+] Output: recon_20250205_143022/target.com/
Happy Hunting 🚀`}
            </pre>
          </div>
        </Animate>

        {/* Key Features Grid */}
        <div className="mb-16">
          <Animate animation="fadeInUp" delay={0.3} className="text-center mb-10">
            <h3 className="text-3xl font-heading font-bold text-white mb-4">
              Key Features
            </h3>
            <p className="text-cyber-gray max-w-2xl mx-auto">
              Professional-grade recon automation built for the real world. No fluff, just raw power.
            </p>
          </Animate>

          <Stagger stagger={0.15} className="grid md:grid-cols-2 gap-6">
            {features.map((feature) => (
              <HoverEffect key={feature.id} effect="lift" className="h-full">
                <div 
                  className="cyber-card h-full group cursor-pointer"
                  onClick={() => setSelectedFeature(selectedFeature === feature.id ? null : feature.id)}
                >
                  <div className="flex items-start space-x-4 mb-4">
                    <div className="p-3 rounded-lg bg-neon-green/10 border border-neon-green/30 text-neon-green group-hover:bg-neon-green/20 group-hover:scale-110 transition-all duration-300">
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xl font-semibold text-white group-hover:text-neon-green transition-colors duration-300">
                          {feature.title}
                        </h4>
                        <span className="text-xs font-mono text-neon-cyan/60 px-2 py-1 bg-neon-cyan/10 rounded">
                          {feature.phase}
                        </span>
                      </div>
                      <p className="text-cyber-gray group-hover:text-gray-300 transition-colors duration-300 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                  
                  {selectedFeature === feature.id && (
                    <div className="mt-4 pt-4 border-t border-neon-green/20 animate-fadeIn">
                      <p className="text-sm text-cyber-gray leading-relaxed">
                        {feature.details}
                      </p>
                    </div>
                  )}
                </div>
              </HoverEffect>
            ))}
          </Stagger>
        </div>

        {/* Reconnaissance Phases */}
        <Animate animation="fadeInUp" delay={0.4}>
          <div className="cyber-card p-8">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-heading font-bold text-white mb-4">
                17-Phase Reconnaissance Workflow
              </h3>
              <p className="text-cyber-gray">
                Complete attack surface enumeration. From DNS to vulnerabilities. Nothing escapes this pipeline.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {phases.map((phase, index) => (
                <div 
                  key={index}
                  className="group relative p-4 rounded-lg bg-cyber-dark border border-cyber-border hover:border-neon-green/30 transition-all duration-300"
                >
                  <div className="flex items-start space-x-4">
                    <div className="text-2xl font-bold text-neon-green/30 group-hover:text-neon-green/60 transition-colors duration-300 font-mono">
                      {phase.num}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold mb-1 group-hover:text-neon-green transition-colors duration-300">
                        {phase.name}
                      </h4>
                      <p className="text-xs text-cyber-gray font-mono group-hover:text-gray-400 transition-colors duration-300">
                        {phase.tools}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Animate>

        {/* Action Buttons */}
        <Animate animation="fadeInUp" delay={0.5}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
            <a
              href="https://github.com/Shakibul-CyberSec/Bug-Bounty-Reconnaissance-Automation"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-neon-green to-neon-cyan text-black font-semibold rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-neon-green/30 hover:scale-105 active:scale-95"
            >
              <FiGithub className="mr-2 w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
              <span className="relative z-10 flex items-center">
                View on GitHub
              </span>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            </a>
            
            <a
              href="https://github.com/Shakibul-CyberSec/Bug-Bounty-Reconnaissance-Automation/archive/refs/heads/main.zip"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center px-8 py-4 bg-cyber-card border-2 border-neon-green/30 text-white font-semibold rounded-lg hover:bg-neon-green/10 hover:border-neon-green transition-all duration-300"
            >
              <FiDownload className="mr-2 w-5 h-5 group-hover:translate-y-1 transition-transform duration-300" />
              Download Script
            </a>

            <a
              href="https://github.com/Shakibul-CyberSec/Bug-Bounty-Reconnaissance-Automation"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center px-8 py-4 bg-cyber-card border-2 border-neon-cyan/30 text-white font-semibold rounded-lg hover:bg-neon-cyan/10 hover:border-neon-cyan transition-all duration-300"
            >
              <FiStar className="mr-2 w-5 h-5 group-hover:scale-125 transition-transform duration-300" />
              Documentation
            </a>
          </div>
        </Animate>

        {/* Tech Stack Badge */}
        <Animate animation="fadeIn" delay={0.6}>
          <div className="text-center mt-12">
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-cyber-dark border border-cyber-border">
              <span className="text-cyber-gray text-sm">Built with</span>
              <span className="text-neon-green font-mono font-semibold">Bash</span>
              <span className="text-cyber-gray">•</span>
              <span className="text-neon-cyan font-mono font-semibold">30+ Security Tools</span>
              <span className="text-cyber-gray">•</span>
              <span className="text-neon-green font-mono font-semibold">Open Source</span>
            </div>
          </div>
        </Animate>
      </div>
    </section>
  );
};

export default ReconTool;