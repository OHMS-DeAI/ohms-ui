/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0B1537',
        accentGold: '#F5C542',
        textOnDark: '#E6E8F0',
      },
    },
  },
  plugins: [],
}