/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aura: {
          teal: '#14b8a6', // Primary active, energetic hue
        },
        serene: {
          indigo: '#6366f1', // Secondary
        },
        slateBlue: {
          100: '#f1f5f9', // Morandi grayish-blue background
          200: '#e2e8f0',
          800: '#1e293b',
        }
      },
      borderRadius: {
        'super': '2.5rem', // Super-Ellipses requirement
      },
      boxShadow: {
        'deep': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
      }
    },
  },
  plugins: [],
}
