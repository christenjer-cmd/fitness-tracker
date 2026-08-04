/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#16a34a',
          dark: '#15803d',
        },
      },
    },
  },
  plugins: [],
};
