/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
      },
      colors: {
        'sync-bg': '#0a0a0f',
        'sync-surface': 'rgba(255,255,255,0.04)',
        'sync-accent': '#6366f1',
        'sync-accent-secondary': '#8b5cf6',
      },
      backgroundImage: {
        'gradient-sync': 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      },
      animation: {
        'gradient-border': 'gradient-border 3s ease infinite',
      },
      keyframes: {
        'gradient-border': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [],
}
