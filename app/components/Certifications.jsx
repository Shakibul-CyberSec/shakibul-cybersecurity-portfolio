'use client';
import { useState } from 'react';
import { FiExternalLink, FiCalendar, FiCheckCircle, FiAward } from 'react-icons/fi';
import { Animate, Stagger } from './Animations';
import Image from 'next/image';

const Certifications = () => {
  const [selectedCert, setSelectedCert] = useState(null);

  const certifications = [
    {
      id: 1,
      title: 'Ethical Hacking for Professionals',
      issuer: 'Byte Capsule',
      credentialId: 'BHF2Q53KBC',
      date: 'December 2024',
      skills: ['Web Security', 'Network Pentesting', 'Vulnerability Analysis'],
      verifyUrl: 'https://bytecapsuleit.com/verify-certificate',
      badge: '🎯',
      image: '/ehp.jpg',
    },
    {
      id: 2,
      title: 'Junior Penetration Tester Internship',
      issuer: 'Byte Capsule',
      credentialId: 'BF752R003X',
      date: 'February 2025',
      skills: ['Security Assessment', 'Reporting', 'Remediation Guidance'],
      verifyUrl: 'https://bytecapsuleit.com/verify-certificate',
      badge: '🛡️',
      image: '/intern.png',
    },
  ];

  const continuousLearning = [
    'Web Application Security',
    'Penetration Testing Techniques',
    'Cloud Security Architecture',
    'Threat Intelligence Analysis',
    'Incident Response Planning',
    'Security Compliance Standards',
  ];

  return (
    <section id="certifications" className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header - Single animation */}
        <Animate animation="fadeInUp">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-neon-green/10 border border-neon-green/30 mb-6 hover-glow-subtle">
              <FiAward className="w-4 h-4 text-neon-green mr-2" />
              <span className="text-neon-green text-sm font-mono">Credentials</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6">
              Professional Certifications
            </h2>
            <p className="text-xl text-cyber-gray max-w-3xl mx-auto leading-relaxed">
              Validated expertise through industry-recognized certifications and specialized training.
            </p>
          </div>
        </Animate>

        {/* Certifications Grid - Stagger animation */}
        <Stagger stagger={0.12} className="grid md:grid-cols-2 gap-8 mb-16">
          {certifications.map((cert) => (
            <div key={cert.id} className="cyber-card group hover-lift">
              <div className="mb-6">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-neon-green/10 border border-neon-green/30 mb-4">
                  <FiCheckCircle className="w-3 h-3 text-neon-green mr-2" />
                  <span className="text-neon-green text-xs font-mono font-semibold">CERTIFIED</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-neon-green transition-colors duration-300">
                  {cert.title}
                </h3>
                <p className="text-neon-cyan font-medium">{cert.issuer}</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="p-4 bg-cyber-dark rounded-lg border border-cyber-border/50 group-hover:border-neon-green/30 transition-colors duration-300">
                  <div className="text-xs text-cyber-gray mb-1 font-mono">CREDENTIAL ID</div>
                  <div className="font-mono text-white text-lg">{cert.credentialId}</div>
                </div>
                
                <div className="flex items-center text-cyber-gray">
                  <FiCalendar className="w-4 h-4 mr-2 text-neon-green" />
                  <span>Issued {cert.date}</span>
                </div>
              </div>

              <div className="mb-6">
                <div className="text-sm text-cyber-gray mb-3 font-semibold">Skills Demonstrated</div>
                <div className="flex flex-wrap gap-2">
                  {cert.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 text-xs bg-cyber-dark border border-cyber-border rounded-full text-cyber-gray hover:border-neon-green/50 hover:text-neon-green transition-all duration-300 cursor-default"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-cyber-border">
                <button
                  onClick={() => setSelectedCert(cert)}
                  className="text-neon-green hover:text-neon-cyan transition-colors flex items-center font-medium"
                >
                  View Details
                  <FiExternalLink className="ml-2 w-4 h-4" />
                </button>
                <a
                  href={cert.verifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2 bg-gradient-to-r from-neon-green to-neon-cyan text-black font-semibold rounded-lg hover:shadow-lg hover:shadow-neon-green/30 transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  Verify
                </a>
              </div>
            </div>
          ))}
        </Stagger>

        {/* Continuous Learning - Single animation */}
        <Animate animation="fadeInUp">
          <div className="cyber-card hover-lift">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 rounded-full bg-neon-green/10 flex items-center justify-center mr-4">
                <span className="text-2xl">📚</span>
              </div>
              <h3 className="text-2xl font-bold text-white">Continuous Learning</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {continuousLearning.map((topic, index) => (
                <div key={index} className="flex items-center p-4 rounded-lg bg-cyber-dark border border-cyber-border/50 hover:border-neon-green/30 transition-all duration-300 group cursor-default">
                  <div className="w-2 h-2 rounded-full bg-neon-green mr-3 animate-pulse-dot" />
                  <span className="text-cyber-gray group-hover:text-white transition-colors duration-300">
                    {topic}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Animate>
      </div>

      {/* Certificate Modal */}
      {selectedCert && (
        <div 
          className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50 animate-fadeIn backdrop-blur-sm"
          onClick={() => setSelectedCert(null)}
        >
          <div 
            className="bg-cyber-card border-2 border-neon-green/30 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 animate-scaleIn shadow-2xl shadow-neon-green/20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center">
                <div className="text-4xl mr-4">{selectedCert.badge}</div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">{selectedCert.title}</h3>
                  <p className="text-neon-cyan font-medium">{selectedCert.issuer}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCert(null)}
                className="text-cyber-gray hover:text-white text-3xl transition-colors leading-none p-2 hover:rotate-90 transform duration-300"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            {/* Certificate Image */}
            <div className="mb-6 rounded-lg overflow-hidden border-2 border-neon-green/20 hover:border-neon-green/40 transition-all duration-300 group">
              <div className="relative w-full aspect-[1.414/1] bg-cyber-dark">
                <Image
                  src={selectedCert.image}
                  alt={`${selectedCert.title} Certificate`}
                  fill
                  className="object-contain group-hover:scale-105 transition-transform duration-500"
                  priority
                />
              </div>
            </div>

            {/* Certificate Details */}
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <div className="p-4 bg-cyber-dark rounded-lg border border-cyber-border hover:border-neon-green/30 transition-colors duration-300">
                <div className="text-xs text-cyber-gray mb-1 font-mono">CREDENTIAL ID</div>
                <div className="font-mono text-white text-lg">{selectedCert.credentialId}</div>
              </div>
              
              <div className="p-4 bg-cyber-dark rounded-lg border border-cyber-border hover:border-neon-green/30 transition-colors duration-300">
                <div className="text-xs text-cyber-gray mb-1 font-mono">ISSUE DATE</div>
                <div className="text-white">{selectedCert.date}</div>
              </div>
            </div>

            <div className="mb-8">
              <div className="p-4 bg-cyber-dark rounded-lg border border-cyber-border hover:border-neon-green/30 transition-colors duration-300">
                <div className="text-xs text-cyber-gray mb-2 font-mono">SKILLS DEMONSTRATED</div>
                <div className="flex flex-wrap gap-2">
                  {selectedCert.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 text-sm bg-black/50 border border-neon-green/30 rounded-full text-neon-green font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-4">
              <button
                onClick={() => setSelectedCert(null)}
                className="px-6 py-3 text-cyber-gray hover:text-white transition-colors font-medium border border-cyber-border rounded-lg hover:border-neon-green/30"
              >
                Close
              </button>
              <a
                href={selectedCert.verifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-gradient-to-r from-neon-green to-neon-cyan text-black font-semibold rounded-lg hover:shadow-lg hover:shadow-neon-green/30 transition-all duration-300 hover:scale-105 active:scale-95 text-center"
              >
                Verify Certificate
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Certifications;