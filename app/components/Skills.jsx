'use client';
import { useState } from 'react';
import { Animate, ProgressBar, HoverEffect } from './Animations';

const Skills = () => {
  const [activeTab, setActiveTab] = useState('security');
  const [selectedTool, setSelectedTool] = useState(null);
  
  const skillSets = {
    security: [
      { name: 'Web Application Security', level: 80, description: 'OWASP Top 10, SQLi, XSS, CSRF' },
      { name: 'Penetration Testing', level: 75, description: 'Network & Application Testing' },
      { name: 'Vulnerability Assessment', level: 85, description: 'Risk Analysis & Prioritization' },
      { name: 'Network Security', level: 65, description: 'Firewall, IDS/IPS Configuration' },
      { name: 'Cloud Security', level: 65, description: 'AWS, Azure Security Hardening' },
    ],
    tools: [
      { name: 'Burp Suite Pro', category: 'Web Testing' },
      { name: 'Metasploit', category: 'Exploitation' },
      { name: 'Nmap', category: 'Reconnaissance' },
      { name: 'Wireshark', category: 'Network Analysis' },
      { name: 'OWASP ZAP', category: 'Web Testing' },
      { name: 'SQLmap', category: 'Database Security' },
      { name: 'John the Ripper', category: 'Password Cracking' },
      { name: 'Hashcat', category: 'Password Cracking' },
    ],
  };

  const handleToolClick = (toolName) => {
    setSelectedTool(selectedTool === toolName ? null : toolName);
  };

  return (
    <section id="skills" className="py-20 px-4 relative">
      <div className="max-w-6xl mx-auto">
        {/* Header - Single animation */}
        <Animate animation="fadeInUp">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-neon-green/10 border border-neon-green/30 mb-6 hover-glow-subtle">
              <span className="text-neon-green text-sm font-mono">Technical Expertise</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6">
              Security Skills & Tools
            </h2>
            <p className="text-xl text-cyber-gray max-w-3xl mx-auto leading-relaxed">
              Comprehensive expertise in security testing tools, methodologies, and frameworks
              for robust cyber defense.
            </p>
          </div>
        </Animate>

        {/* Tabs - Single animation */}
        <Animate animation="fadeIn" delay={0.1}>
          <div className="flex flex-wrap gap-3 mb-12 justify-center">
            {['security', 'tools'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-3 rounded-lg font-semibold transition-all duration-300 ${
                  activeTab === tab
                    ? 'bg-linear-to-r from-neon-green to-neon-cyan text-black shadow-lg shadow-neon-green/30 scale-105'
                    : 'bg-cyber-card text-cyber-gray hover:text-white hover:bg-cyber-border border border-cyber-border hover:border-neon-green/30'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </Animate>

        {/* Content - Single animation for card */}
        <Animate animation="fadeIn" delay={0.15} key={activeTab}>
          <div className="cyber-card p-8 md:p-12">
            {activeTab === 'security' && (
              <div className="space-y-8">
                {skillSets.security.map((skill, index) => (
                  <div key={index} className="group">
                    <ProgressBar
                      percentage={skill.level}
                      label={skill.name}
                      className="transform transition-all duration-300 hover:scale-[1.01]"
                    />
                    <p className="text-sm text-cyber-gray mt-2 ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {skill.description}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'tools' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {skillSets.tools.map((tool, index) => (
                  <HoverEffect key={index} effect="glowSubtle">
                    <div
                      className={`
                        bg-cyber-dark border rounded-lg p-5 text-center 
                        transition-all duration-300 cursor-pointer group
                        ${selectedTool === tool.name
                          ? 'border-neon-green bg-neon-green/10 transform scale-105 shadow-lg shadow-neon-green/20' 
                          : 'border-cyber-border hover:border-neon-green/50 hover:bg-cyber-border/50'
                        }
                      `}
                      onClick={() => handleToolClick(tool.name)}
                    >
                      <div className={`text-sm font-mono mb-2 transition-colors duration-300 ${
                        selectedTool === tool.name ? 'text-neon-green font-bold' : 'text-neon-green group-hover:text-neon-cyan'
                      }`}>
                        {tool.name}
                      </div>
                      <div className={`text-xs transition-opacity duration-300 ${
                        selectedTool === tool.name ? 'text-neon-cyan opacity-100' : 'text-cyber-gray opacity-0 group-hover:opacity-100'
                      }`}>
                        {tool.category}
                      </div>
                    </div>
                  </HoverEffect>
                ))}
              </div>
            )}
          </div>
        </Animate>

        {/* Methodology Section - Single animation */}
        <Animate animation="fadeInUp" delay={0.05}>
          <div className="mt-20 p-8 md:p-12 rounded-xl bg-linear-to-br from-cyber-dark to-black border border-cyber-border hover-lift">
            <h3 className="text-3xl font-heading font-bold text-white mb-8 text-center">
              Security Methodology
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { 
                  step: '01', 
                  title: 'Reconnaissance', 
                  desc: 'Gather intelligence and identify potential attack vectors through comprehensive information gathering.'
                },
                { 
                  step: '02', 
                  title: 'Analysis', 
                  desc: 'Assess vulnerabilities and prioritize based on risk impact, exploitability, and business context.'
                },
                { 
                  step: '03', 
                  title: 'Remediation', 
                  desc: 'Implement security controls and validate effectiveness through rigorous testing and verification.'
                },
              ].map((item, index) => (
                <div key={index} className="group relative">
                  <div className="absolute -top-2 -left-2 text-6xl font-bold text-neon-green/10 group-hover:text-neon-green/20 transition-colors duration-300">
                    {item.step}
                  </div>
                  <div className="relative space-y-3 p-6 rounded-lg border border-cyber-border/50 group-hover:border-neon-green/30 transition-all duration-300 bg-cyber-dark/50 group-hover:bg-cyber-dark">
                    <div className="text-neon-green font-mono text-sm">{item.step}</div>
                    <h4 className="text-2xl font-semibold text-white group-hover:text-neon-green transition-colors duration-300">
                      {item.title}
                    </h4>
                    <p className="text-cyber-gray leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Animate>
      </div>
    </section>
  );
};

export default Skills;