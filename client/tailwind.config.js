/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#1a3a5c',
          600: '#15304d',
          700: '#0f253d',
          800: '#0a1a2e',
          900: '#050f1f',
        },
        slate: {
          350: '#b0bec5',
        },
        mint: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
        },
        neo: {
          blue: '#1a3a5c',
          slate: '#64748b',
          mint: '#22c55e',
          bg: '#f8fafc',
          card: '#ffffff',
          border: '#e2e8f0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'neo': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'neo-lg': '0 10px 40px -10px rgba(0, 0, 0, 0.1)',
        'neo-inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
};
