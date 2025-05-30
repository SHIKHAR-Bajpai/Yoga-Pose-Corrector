/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary_bg: '#0B0C10',
        secondary_bg:'#1F2833',
        main_heading:'#66FCF1',
        main_text:'#C5C6C7',
        secondary_text:'#45A29E',
        primary_accent:'#66FCF1',
        secondary_accent:'#45A29E',
        standard_border:"#1F2833",
        accent_border:'#45A29E'
      },
      boxShadow: {
        'glow': '0 2px 8px rgba(102, 252, 241, 0.15)', 
        'glow-strong': '0 0 20px rgba(102, 252, 241, 0.4)',
        'glow-medium': '0 0 12px rgba(102, 252, 241, 0.25)',
        'glow-soft': '0 0 8px rgba(102, 252, 241, 0.15)',
      },
    },
  },
  plugins: [],
}

