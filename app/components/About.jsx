'use client';
import { FiShield, FiSearch, FiTarget, FiLock } from 'react-icons/fi';
import { Animate, Stagger, HoverEffect } from './Animations';

const About = () => {
  const skills = [
    {
      icon: <FiShield className="w-8 h-8" />,
      title: 'Web Application Security',
      description: 'Comprehensive security testing and hardening of web applications against OWASP Top 10 vulnerabilities.',
    },
    {
      icon: <FiTarget className="w-8 h-8" />,
      title: 'Penetration Testing',
      description: 'Simulated cyber attacks to identify and exploit security vulnerabilities before malicious actors can.',
    },
    {
      icon: <FiSearch className="w-8 h-8" />,
      title: 'Vulnerability Assessment',
      description: 'Systematic review of security weaknesses with prioritized remediation recommendations.',
    },
    {
      icon: <FiLock className="w-8 h-8" />,
      title: 'Security Architecture',
      description: 'Designing and implementing robust security frameworks for enterprise infrastructure.',
    },
  ];

  return (
    <section id="about" className="py-20 px-4 relative overflow-hidden">
      {/* Animated background grid - promoted to own layer */}
      <div className="absolute inset-0 cyber-grid opacity-20 pointer-events-none gpu-accelerate" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <Animate animation="fadeInUp" className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-neon-green/10 border border-neon-green/30 mb-6 hover-glow-subtle">
            <span className="text-neon-green text-sm font-mono animate-pulse-text">About Me</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6 text-glow-subtle">
            Cybersecurity Expertise
          </h2>
          <p className="text-xl text-cyber-gray max-w-3xl mx-auto leading-relaxed">
            With a focus on continuous learning and practical application, I specialize in identifying
            and mitigating security vulnerabilities across digital infrastructure.
          </p>
        </Animate>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
          {/* Text Content */}
          <Animate animation="fadeInLeft" delay={0.05} className="space-y-6">
            <h3 className="text-3xl font-heading font-bold text-white">
              Proactive Security Approach
            </h3>
            <div className="space-y-4">
              <p className="text-cyber-gray text-lg leading-relaxed">
                As a cybersecurity specialist, I believe in <span className="text-neon-green font-medium">proactive defense mechanisms</span> that 
                anticipate and neutralize threats before they can cause harm. My methodology combines thorough
                vulnerability assessment with strategic penetration testing to ensure comprehensive
                security coverage.
              </p>
              <p className="text-cyber-gray text-lg leading-relaxed">
                Specializing in <span className="text-neon-cyan font-medium">web application security</span>, I stay updated with the latest attack vectors
                and defense strategies, ensuring robust protection against evolving cyber threats in
                today's digital landscape.
              </p>
            </div>
            
            {/* Status Indicators */}
            <div className="pt-6 flex flex-wrap items-center gap-6 text-sm font-mono">
              <div className="flex items-center status-indicator">
                <div className="w-2 h-2 rounded-full bg-neon-green mr-2 animate-pulse-dot" />
                <span className="text-neon-green font-semibold">ACTIVE</span>
                <span className="text-cyber-gray ml-2">Security Research</span>
              </div>
              <div className="flex items-center status-indicator animation-delay-300">
                <div className="w-2 h-2 rounded-full bg-neon-cyan mr-2 animate-pulse-dot" />
                <span className="text-neon-cyan font-semibold">MONITORING</span>
                <span className="text-cyber-gray ml-2">Threat Detection</span>
              </div>
            </div>
          </Animate>

          {/* Terminal Window */}
          <Animate animation="fadeInRight" delay={0.15} className="terminal-aesthetic cyber-card p-8 hover-terminal">
            <div className="flex items-center mb-6 pb-4 border-b border-neon-green/20">
              <div className="flex space-x-2 mr-4">
                <div className="w-3 h-3 rounded-full bg-red-500 terminal-button" />
                <div className="w-3 h-3 rounded-full bg-yellow-500 terminal-button animation-delay-100" />
                <div className="w-3 h-3 rounded-full bg-green-500 terminal-button animation-delay-200" />
              </div>
              <span className="text-neon-green font-mono text-sm">engagement.sh</span>
              <div className="ml-auto flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse-dot"></div>
                <span className="text-neon-green/60 text-xs font-mono">RUNNING</span>
              </div>
            </div>
            <pre className="text-sm font-mono text-cyber-gray overflow-x-auto terminal-content leading-relaxed">
{`$ engage --target web_app --profile offensive

[+] Initializing security assessment...
[+] Mapping attack surface...
[+] Analyzing trust boundaries...
[+] Testing authentication flows...
[+] Evaluating business logic...
[+] Identifying high-impact weaknesses...

[✓] No critical exposure detected
[✓] Defensive controls validated  
[✓] Attack paths documented

[+] Assessment completed in 41.6s

$ deliver --artifact report \\
  --classification restricted
  
Artifact created: 
offensive_security_assessment_2025.pdf`}
            </pre>
          </Animate>
        </div>

        {/* Skills Grid - Slower, more elegant stagger */}
        <Stagger stagger={0.08} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {skills.map((skill, index) => (
            <HoverEffect key={index} effect="lift" className="h-full">
              <div className="cyber-card h-full group skill-card">
                <div className="relative mb-4">
                  <div className="text-neon-green transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 icon-float-continuous">
                    {skill.icon}
                  </div>
                  {/* Corner accent */}
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-neon-green/0 group-hover:border-neon-green/50 transition-all duration-500 rounded-tr-lg corner-accent" />
                </div>
                
                <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-neon-green transition-colors duration-300">
                  {skill.title}
                </h3>
                
                <p className="text-cyber-gray group-hover:text-gray-300 transition-colors duration-300 leading-relaxed">
                  {skill.description}
                </p>
                
                {/* Progress indicator */}
                <div className="mt-4 pt-4 border-t border-cyber-border/30 opacity-0 group-hover:opacity-100 transition-all duration-500">
                  <div className="h-1 bg-cyber-border/50 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-neon-green to-neon-cyan rounded-full skill-progress" />
                  </div>
                </div>
              </div>
            </HoverEffect>
          ))}
        </Stagger>
      </div>
    </section>
  );
};

export default About;