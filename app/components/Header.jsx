'use client';
import { FiArrowRight, FiShield, FiCode } from 'react-icons/fi';
import { Animate, Stagger } from './Animations';

const Header = () => {

  return (
    <section id="home" className="min-h-screen flex items-center justify-center px-4 pt-16">
      <div className="max-w-6xl mx-auto text-center">
        <div className="space-y-8">
          {/* Badge */}
          <Animate animation="fadeIn" delay={0.1}>
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-neon-green/10 border border-neon-green/30 hover-glow-subtle">
              <FiShield className="w-4 h-4 text-neon-green mr-2 animate-pulse-dot" />
              <span className="text-neon-green text-sm font-mono">Cybersecurity Professional</span>
            </div>
          </Animate>

          {/* Main Heading */}
          <Animate animation="fadeInUp" delay={0.15}>
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-heading font-bold leading-tight">
              <span className="text-white">Securing Digital</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-green via-neon-cyan to-neon-green bg-size-200 text-glow-subtle">
                Infrastructure
              </span>
            </h1>
          </Animate>

          {/* Subtitle */}
          <Animate animation="fadeInUp" delay={0.25}>
            <p className="text-xl md:text-2xl text-cyber-gray max-w-3xl mx-auto font-light leading-relaxed">
              Specializing in <span className="text-neon-green font-medium">web application security</span>, 
              <span className="text-neon-cyan font-medium"> penetration testing</span>, and 
              <span className="text-neon-green font-medium"> vulnerability assessment</span> to 
              protect against evolving cyber threats.
            </p>
          </Animate>

          {/* Stats Grid */}
          <Stagger stagger={0.1} className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto pt-4">
            {[
              { value: '100%', label: 'Security-First Approach', icon: '🛡️' },
              { value: 'In-Depth', label: 'Vulnerability Analysis', icon: '🔍' },
              { value: 'Hands-On', label: 'Penetration Testing', icon: '⚡' },
            ].map((stat, index) => (
              <div key={index} className="cyber-card hover-lift group">
                <div className="text-4xl mb-2">{stat.icon}</div>
                <div className="text-3xl font-bold text-white mb-2 group-hover:text-neon-green transition-colors duration-300">
                  {stat.value}
                </div>
                <div className="text-cyber-gray group-hover:text-white transition-colors duration-300">
                  {stat.label}
                </div>
              </div>
            ))}
          </Stagger>

          {/* CTA Buttons */}
          <Animate animation="fadeInUp" delay={0.4}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <a
                href="#contact"
                className="group relative inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-neon-green to-neon-cyan text-black font-semibold rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-neon-green/30 hover:scale-105 active:scale-95"
              >
                <span className="relative z-10 flex items-center">
                  Start Security Assessment
                  <FiArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              </a>
              
              <a
                href="#certifications"
                className="group inline-flex items-center justify-center px-8 py-4 bg-cyber-card border-2 border-neon-green/30 text-white font-semibold rounded-lg hover:bg-neon-green/10 hover:border-neon-green transition-all duration-300"
              >
                <FiCode className="mr-2 w-5 h-5" />
                View Certifications
              </a>
            </div>
          </Animate>

          {/* Scroll Indicator - No animation wrapper, just a subtle static element */}
          <div className="pt-16 opacity-50 hover:opacity-80 transition-opacity duration-500">
            <div className="text-cyber-gray text-sm font-mono mb-2">Scroll to explore</div>
            <div className="w-px h-10 bg-gradient-to-b from-neon-green/60 to-transparent mx-auto animate-pulse-dot" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Header;