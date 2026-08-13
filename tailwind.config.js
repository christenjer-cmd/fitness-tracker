/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Fond très sombre légèrement bleuté, plus profond qu'un gris neutre.
        ink: {
          DEFAULT: '#0A0E13',
          soft: '#0F151C',
        },
        surface: {
          DEFAULT: '#141C25',
          raised: '#1B242F',
          sunken: '#0D131A',
        },
        line: 'rgba(255, 255, 255, 0.07)',
        accent: {
          DEFAULT: '#22C55E',
          light: '#4ADE80',
          dark: '#16A34A',
          ink: '#04210F',
        },
        // Seconde teinte du dégradé : c'est le cyan qui donne l'aspect futuriste.
        cyan: {
          DEFAULT: '#22D3EE',
          soft: '#67E8F9',
        },
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.4), 0 8px 24px -12px rgba(0,0,0,0.7)',
        glow: '0 6px 20px -6px rgba(34, 197, 94, 0.55)',
        nav: '0 -8px 24px -12px rgba(0,0,0,0.9)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        // Sans transform : un conteneur transformé devient le référentiel de ses
        // enfants en position fixed, ce qui décalerait le minuteur de repos.
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-ring': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        // Lente dérive des halos de fond, façon aurore.
        aurora: {
          '0%, 100%': { transform: 'translate3d(-4%, 0, 0) scale(1)' },
          '50%': { transform: 'translate3d(4%, -2%, 0) scale(1.12)' },
        },
        'sweep': {
          '0%': { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(220%)' },
        },
        'draw': {
          from: { strokeDashoffset: 'var(--dash)' },
          to: { strokeDashoffset: '0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.25s ease-out both',
        'fade-in': 'fade-in 0.25s ease-out both',
        'scale-in': 'scale-in 0.18s ease-out both',
        'pulse-ring': 'pulse-ring 1.6s ease-in-out infinite',
        aurora: 'aurora 18s ease-in-out infinite',
        'aurora-slow': 'aurora 26s ease-in-out infinite reverse',
        sweep: 'sweep 2.4s ease-in-out infinite',
        draw: 'draw 1.2s ease-out both',
      },
    },
  },
  plugins: [],
};
