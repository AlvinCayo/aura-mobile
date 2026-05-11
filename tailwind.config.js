/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        aura: {
          blue: {
            200: '#B8D4E8',
            400: '#6BA3D6', // Color principal
          },
          lavender: {
            200: '#E8E4F0',
            400: '#C9B8E8',
          },
          cream: {
            100: '#FDF8F3', // Fondo oficial
            200: '#F5EDE4',
          }
        }
      }
    },
  },
  plugins: [],
}