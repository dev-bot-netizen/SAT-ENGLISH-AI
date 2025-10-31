/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          violet: '#6C40D4',
          indigo: '#3C1875',
          lavender: '#B47DFF',
          lilac: '#EEE3FF',
          gold: '#FFD700',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 5px #6C40D4, 0 0 10px #6C40D4' },
          '50%': { boxShadow: '0 0 20px #B47DFF, 0 0 30px #B47DFF' },
        },
        'fly-out': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.5)', opacity: '0' },
        },
        pulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.05)', opacity: '0.95' },
        },
        'modal-enter': {
          '0%': { opacity: '0', transform: 'scale(0.95) translateY(10px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'glow-words': {
          '0%, 100%': { opacity: 0.02, transform: 'scale(1)', textShadow: '0 0 5px currentColor' },
          '50%': { opacity: 0.12, transform: 'scale(1.15)', textShadow: '0 0 15px currentColor' },
        },
      },
      animation: {
        shimmer: 'shimmer 2.5s infinite',
        glow: 'glow 4s ease-in-out infinite',
        'fly-out': 'fly-out 0.3s ease-out forwards',
        'pulse': 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'modal-enter': 'modal-enter 0.3s ease-out forwards',
        'glow-words': 'glow-words 20s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
