/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./puzzle.html",
    "./archive.html",
    "./script.js"
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#62C8BD',
        'text-primary': '#1C2542',
        'tile-bg': '#FEF9D9',
        'tile-border': 'rgba(254, 249, 217, 0.5)',
        'slot-container': '#E6BD53',
        'slot-border': '#4E2E07',
        'slot-filled': '#4E2E07',
        'submit': '#75FFC3',
        'hint': '#CF1D6B',
        'hint-button': '#CF1D6B',
        'hint-button-hover': '#B4145A',
        'category-text': '#4E2E07',
        'category-bg': '#4E2E07',
      },
      fontFamily: {
        'rem': ['REM', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'container': '-10px 20px 20px rgba(0, 0, 0, 0.25)',
        'button': '-10px 10px 10px rgba(0, 0, 0, 0.25)',
      },
    },
  },
  plugins: [],
}

