/** @type {import('tailwindcss').Config} */
module.exports = {
  // Aquí le decimos que busque en la carpeta "app" y en "src"
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        aura: {
          blue: '#6BA3D6',
          cream: '#FDF8F3',
          lavender: '#E8E4F0'
        }
      }
    },
  },
  plugins: [],
}