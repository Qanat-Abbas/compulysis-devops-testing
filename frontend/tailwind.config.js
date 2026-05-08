// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f7ff',
          100: '#ebf0ff',
          200: '#d6e0ff',
          300: '#b3c7ff',
          400: '#8ca5ff',
          500: '#667eea',
          600: '#5568d3',
          700: '#4553b8',
          800: '#3a4599',
          900: '#2f3775',
        },
        secondary: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#764ba2',
          600: '#653c8a',
          700: '#542f71',
          800: '#43265a',
          900: '#341f46',
        },
        success: {
          light: '#d4edda',
          DEFAULT: '#27ae60',
          dark: '#1e8449',
        },
        warning: {
          light: '#ffecd2',
          DEFAULT: '#f39c12',
          dark: '#e67e22',
        },
        danger: {
          light: '#ff9a9e',
          DEFAULT: '#e74c3c',
          dark: '#c0392b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 15px rgba(0,0,0,0.1)',
        'card-hover': '0 8px 25px rgba(0,0,0,0.15)',
        'primary': '0 4px 15px rgba(102,126,234,0.3)',
        'danger': '0 4px 15px rgba(231,76,60,0.2)',
      },
      animation: {
        'pulse-red': 'pulse-red 2s infinite',
        'fade-in': 'fade-in 0.3s ease-in',
        'slide-up': 'slide-up 0.4s ease-out',
      },
      keyframes: {
        'pulse-red': {
          '0%, 100%': { boxShadow: '0 4px 15px rgba(231,76,60,0.2)' },
          '50%': { boxShadow: '0 6px 20px rgba(231,76,60,0.4)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}