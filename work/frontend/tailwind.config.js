/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        app: {
          bg: '#1a1d21',
          sidebar: '#1a1d21',
          surface: '#222529',
          'surface-hover': '#2a2d31',
          border: '#36393f',
          'text-primary': '#d1d2d3',
          'text-muted': '#72767d',
          accent: '#5865f2',
          'accent-hover': '#4752c4',
          danger: '#ed4245',
          success: '#3ba55d',
          warning: '#faa61a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-in': 'slideIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideIn: {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
