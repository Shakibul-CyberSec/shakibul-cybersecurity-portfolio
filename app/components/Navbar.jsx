'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiMenu, FiX } from 'react-icons/fi';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 20);

          // Update active section based on scroll position
          const sections = ['home', 'about', 'skills', 'soc', 'terminal', 'writeups', 'certifications', 'contact'];
          const current = sections.find(section => {
            const element = document.getElementById(section);
            if (element) {
              const rect = element.getBoundingClientRect();
              return rect.top <= 100 && rect.bottom >= 100;
            }
            return false;
          });
          if (current) setActiveSection(current);
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e, href) => {
    e.preventDefault();
    const targetId = href.replace('#', '');
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (isOpen) setIsOpen(false);
  };

  const navItems = [
    { href: '#home', label: 'Home' },
    { href: '#about', label: 'About' },
    { href: '#skills', label: 'Skills' },
    { href: '#soc', label: 'SOC' },
    { href: '#terminal', label: 'Terminal' },
    { href: '#writeups', label: 'Writeups' },
    { href: '#certifications', label: 'Certs' },
    { href: '#contact', label: 'Contact' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
      scrolled 
        ? 'bg-[#0a0a0af2] border-b border-cyber-border shadow-lg shadow-black/20' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo with Profile Picture */}
          <Link href="#home" onClick={(e) => handleNavClick(e, '#home')} className="flex items-center space-x-3 group">
            <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-neon-green/30 group-hover:ring-neon-green transition-all duration-500">
              <img
                src="/profile.jpg"
                alt="Shakibul Bokthiar"
                width={40}
                height={40}
                className="object-cover w-full h-full transform group-hover:scale-110 transition-transform duration-500"
                loading="eager"
              />
            </div>
            <div className="hidden md:block">
              <div className="text-white font-heading text-lg group-hover:text-neon-green transition-colors duration-500">
                Shakibul Bokthiar
              </div>
              <div className="text-cyber-gray text-sm font-mono">Cybersecurity Specialist</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = activeSection === item.href.replace('#', '');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-400 relative group ${
                    isActive 
                      ? 'text-neon-green' 
                      : 'text-cyber-gray hover:text-white'
                  }`}
                >
                  {item.label}
                  <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-neon-green transition-all duration-400 ${
                    isActive ? 'w-8' : 'w-0 group-hover:w-8'
                  }`} />
                </Link>
              );
            })}
            
            <Link
              href="#contact"
              onClick={(e) => handleNavClick(e, '#contact')}
              className="ml-4 px-6 py-2 bg-linear-to-r from-neon-green to-neon-cyan text-black font-semibold rounded-lg hover:shadow-lg hover:shadow-neon-green/30 transition-all duration-400 hover:scale-105 active:scale-95"
            >
              Get in Touch
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-cyber-gray hover:text-neon-green transition-colors duration-400 hover:bg-cyber-border/30 rounded-lg"
            aria-label="Toggle menu"
          >
            {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-cyber-border animate-fade-in">
            <div className="space-y-2">
              {navItems.map((item) => {
                const isActive = activeSection === item.href.replace('#', '');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.href)}
                    className={`block px-4 py-3 rounded-lg transition-all duration-300 ${
                      isActive
                        ? 'text-neon-green bg-neon-green/10 border-l-4 border-neon-green'
                        : 'text-cyber-gray hover:text-white hover:bg-cyber-border/30'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              <Link
                href="#contact"
                onClick={(e) => handleNavClick(e, '#contact')}
                className="block mt-4 px-6 py-3 bg-linear-to-r from-neon-green to-neon-cyan text-black font-semibold rounded-lg text-center hover:shadow-lg hover:shadow-neon-green/30 transition-all duration-300"
              >
                Contact Me
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;