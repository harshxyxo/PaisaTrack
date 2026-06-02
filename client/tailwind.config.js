/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'pt-bg': '#080e1d',
        'pt-surface': '#0c1324',
        'pt-card': 'rgba(29,37,59,0.6)',
        'pt-accent': '#bd9dff',
        'pt-primary': '#bd9dff',
        'pt-primary-dim': '#8a4cfc',
        'pt-income': '#69f6b8',
        'pt-expense': '#ff716a',
        'pt-warning': '#ff716a',
        'pt-text': '#e0e5fb',
        'pt-muted': '#a5aabf',
        'pt-border': 'rgba(111,117,136,0.2)',
      },
      fontFamily: { 
        sans: ['Inter', 'sans-serif'] 
      },
      borderRadius: {
        'pt-lg': '2rem',
        'pt-md': '1.5rem',
      }
    }
  },
  plugins: []
}
