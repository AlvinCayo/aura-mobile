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
}/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        aura: {
          blue: {
            50: '#F0F7FF',
            100: '#E0EFFF',
            400: '#6BA3D6', // Color primario exacto
            500: '#5A92C5',
            600: '#487FB3',
          },
          cream: {
            50: '#FFFCFA',
            100: '#FDF8F3', // Fondo oficial exacto
            200: '#F7EFE7',
          },
          lavender: {
            100: '#F3F0F8',
            200: '#E8E4F0',
            400: '#C9B8E8',
          }
        },
        social: {
          google: '#DB4437',
          facebook: '#4267B2',
        }
      },
      borderRadius: {
        'aura': '1.25rem', // 20px, el redondeado característico de AURA
      }
    },
  },
  plugins: [],
}