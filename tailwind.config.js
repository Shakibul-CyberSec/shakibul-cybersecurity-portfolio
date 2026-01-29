/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'cyber-dark': '#0a0a0a',
        'cyber-card': '#111111',
        'cyber-border': '#1a1a1a',
        'neon-green': '#00ff41',
        'neon-cyan': '#00e5ff',
        'cyber-gray': '#a0a0a0',
        'terminal-bg': '#0d0d0d',
      },
      fontFamily: {
        // REMOVE Google Fonts references - use system fonts instead
        'mono': ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
        'sans': ['ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        'heading': ['ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.6s cubic-bezier(0.22, 0.61, 0.36, 1) forwards',
        'fade-in-down': 'fadeInDown 0.6s cubic-bezier(0.22, 0.61, 0.36, 1) forwards',
        'fade-in-left': 'fadeInLeft 0.6s cubic-bezier(0.22, 0.61, 0.36, 1) forwards',
        'fade-in-right': 'fadeInRight 0.6s cubic-bezier(0.22, 0.61, 0.36, 1) forwards',
        'scale-in': 'scaleIn 0.5s cubic-bezier(0.22, 0.61, 0.36, 1) forwards',
        'slide-up': 'slideUp 0.8s cubic-bezier(0.22, 0.61, 0.36, 1) forwards',
        'slide-down': 'slideDown 0.8s cubic-bezier(0.22, 0.61, 0.36, 1) forwards',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite linear',
        'typing': 'typing 3.5s steps(40, end) forwards, blink 1s step-end infinite 3.5s',
        'progress-grow': 'progressGrow 1.5s cubic-bezier(0.65, 0, 0.35, 1) forwards',
        'border-glow': 'borderGlow 3s ease-in-out infinite',
        'text-shimmer': 'textShimmer 2s linear infinite',
        'neon-pulse': 'neonPulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { 
            opacity: '0',
            transform: 'translateY(30px) scale(0.95)',
          },
          '100%': { 
            opacity: '1',
            transform: 'translateY(0) scale(1)',
          },
        },
        fadeInDown: {
          '0%': { 
            opacity: '0',
            transform: 'translateY(-30px) scale(0.95)',
          },
          '100%': { 
            opacity: '1',
            transform: 'translateY(0) scale(1)',
          },
        },
        fadeInLeft: {
          '0%': { 
            opacity: '0',
            transform: 'translateX(-40px) scale(0.95)',
          },
          '100%': { 
            opacity: '1',
            transform: 'translateX(0) scale(1)',
          },
        },
        fadeInRight: {
          '0%': { 
            opacity: '0',
            transform: 'translateX(40px) scale(0.95)',
          },
          '100%': { 
            opacity: '1',
            transform: 'translateX(0) scale(1)',
          },
        },
        scaleIn: {
          '0%': { 
            opacity: '0',
            transform: 'scale(0.85) rotate(-2deg)',
          },
          '100%': { 
            opacity: '1',
            transform: 'scale(1) rotate(0)',
          },
        },
        slideUp: {
          '0%': { 
            transform: 'translateY(100px)',
            opacity: '0',
          },
          '100%': { 
            transform: 'translateY(0)',
            opacity: '1',
          },
        },
        slideDown: {
          '0%': { 
            transform: 'translateY(-100px)',
            opacity: '0',
          },
          '100%': { 
            transform: 'translateY(0)',
            opacity: '1',
          },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        float: {
          '0%, 100%': {
            transform: 'translateY(0)',
          },
          '50%': {
            transform: 'translateY(-20px)',
          },
        },
        glow: {
          '0%, 100%': {
            boxShadow: '0 0 5px rgba(0, 255, 157, 0.3), 0 0 10px rgba(0, 255, 157, 0.2)',
          },
          '50%': {
            boxShadow: '0 0 20px rgba(0, 255, 157, 0.6), 0 0 30px rgba(0, 255, 157, 0.4)',
          },
        },
        borderGlow: {
          '0%, 100%': {
            borderColor: 'rgba(0, 255, 157, 0.3)',
            boxShadow: '0 0 5px rgba(0, 255, 157, 0.2)',
          },
          '50%': {
            borderColor: 'rgba(0, 255, 157, 0.8)',
            boxShadow: '0 0 15px rgba(0, 255, 157, 0.6)',
          },
        },
        shimmer: {
          '0%': {
            backgroundPosition: '-200% center',
          },
          '100%': {
            backgroundPosition: '200% center',
          },
        },
        textShimmer: {
          '0%': {
            backgroundPosition: '0% center',
          },
          '100%': {
            backgroundPosition: '200% center',
          },
        },
        typing: {
          from: { width: '0' },
          to: { width: '100%' },
        },
        blink: {
          '0%, 100%': { borderColor: 'transparent' },
          '50%': { borderColor: '#00ff41' },
        },
        progressGrow: {
          '0%': { width: '0%' },
          '100%': { width: 'var(--progress-width, 100%)' },
        },
        neonPulse: {
          '0%, 100%': {
            textShadow: '0 0 5px rgba(0, 255, 157, 0.5)',
            opacity: '1',
          },
          '50%': {
            textShadow: '0 0 15px rgba(0, 255, 157, 0.8), 0 0 25px rgba(0, 255, 157, 0.4)',
            opacity: '0.9',
          },
        },
      },
    },
  },
  plugins: [],
}