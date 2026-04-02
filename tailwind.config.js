/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#03060F',
          secondary: '#070D1E',
          tertiary: '#0C1630',
          card: '#0F1E3A',
        },
        cyan: {
          DEFAULT: '#00D4FF',
          dark: '#0095B3',
          light: '#80EAFF',
          glow: 'rgba(0,212,255,0.15)',
        },
        purple: {
          DEFAULT: '#8B5CF6',
          dark: '#6D28D9',
          light: '#C4B5FD',
          glow: 'rgba(139,92,246,0.15)',
        },
        pink: {
          DEFAULT: '#FF2D78',
          dark: '#C71560',
          light: '#FF80AA',
          glow: 'rgba(255,45,120,0.15)',
        },
        emerald: {
          DEFAULT: '#10B981',
          dark: '#059669',
          light: '#6EE7B7',
          glow: 'rgba(16,185,129,0.15)',
        },
        gold: {
          DEFAULT: '#F59E0B',
          dark: '#D97706',
          light: '#FCD34D',
          glow: 'rgba(245,158,11,0.15)',
        },
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-neural': 'radial-gradient(ellipse at 20% 50%, rgba(0,212,255,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.08) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(255,45,120,0.05) 0%, transparent 50%)',
        'gradient-card': 'linear-gradient(135deg, rgba(15,30,58,0.9) 0%, rgba(7,13,30,0.95) 100%)',
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0,212,255,0.3), 0 0 40px rgba(0,212,255,0.1)',
        'glow-purple': '0 0 20px rgba(139,92,246,0.3), 0 0 40px rgba(139,92,246,0.1)',
        'glow-pink': '0 0 20px rgba(255,45,120,0.3), 0 0 40px rgba(255,45,120,0.1)',
        'glow-emerald': '0 0 20px rgba(16,185,129,0.3), 0 0 40px rgba(16,185,129,0.1)',
        'glow-gold': '0 0 20px rgba(245,158,11,0.3), 0 0 40px rgba(245,158,11,0.1)',
        'card': '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
