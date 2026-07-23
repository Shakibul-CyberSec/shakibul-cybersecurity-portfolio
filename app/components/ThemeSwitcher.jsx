'use client';
import { useState, useEffect } from 'react';
import { FiSliders, FiCheck } from 'react-icons/fi';

const themes = [
  { id: 'cyan', name: 'Cyber Cyan', primary: '#00e5ff', secondary: '#ff007f' },
  { id: 'matrix', name: 'Matrix Emerald', primary: '#00ff41', secondary: '#10b981' },
  { id: 'crimson', name: 'Red Team Crimson', primary: '#ff003c', secondary: '#ff6b00' },
  { id: 'violet', name: 'Deep Space Violet', primary: '#a855f7', secondary: '#00f3ff' }
];

export default function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState('matrix');
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('cyber-portfolio-theme') || 'matrix';
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (themeId) => {
    setCurrentTheme(themeId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cyber-portfolio-theme', themeId);
      document.documentElement.setAttribute('data-theme', themeId);

      const themeObj = themes.find(t => t.id === themeId) || themes[0];
      document.documentElement.style.setProperty('--color-neon-green', themeObj.primary);
      document.documentElement.style.setProperty('--color-neon-cyan', themeObj.secondary);
    }
  };

  if (!mounted) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="mb-3 p-3 bg-[#111111]/95 backdrop-blur-xl border border-cyber-border rounded-xl shadow-2xl shadow-black/80 space-y-2 animate-fade-in-up w-52">
          <div className="text-xs font-mono text-cyber-gray uppercase tracking-wider px-2 pb-1 border-b border-cyber-border/50">
            Spectrum Palette
          </div>
          <div className="space-y-1">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  applyTheme(t.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono transition-all duration-300 ${
                  currentTheme === t.id
                    ? 'bg-cyber-border text-white border border-neon-green/40 shadow-sm'
                    : 'text-cyber-gray hover:text-white hover:bg-cyber-border/40'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <span
                    className="w-3 h-3 rounded-full border border-white/20 shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${t.primary}, ${t.secondary})` }}
                  />
                  <span>{t.name}</span>
                </div>
                {currentTheme === t.id && <FiCheck className="text-neon-green text-sm" />}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2.5 bg-[#111111]/90 backdrop-blur-xl border border-neon-green/40 text-white font-mono text-xs rounded-full shadow-lg hover:shadow-neon-green/20 hover:border-neon-green transition-all duration-300 active:scale-95 group cursor-pointer"
        title="Switch Color Spectrum"
      >
        <FiSliders className="text-neon-green group-hover:rotate-90 transition-transform duration-300 text-sm" />
        <span className="hidden sm:inline font-semibold">Spectrum Theme</span>
      </button>
    </div>
  );
}
