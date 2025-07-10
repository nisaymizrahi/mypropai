/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      // NEW: Set the "Inter" font as the default sans-serif font for the project.
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      // NEW: Define the color palette for our modern, high-tech AI theme.
      colors: {
        'brand-blue': '#00BFFF', // A vibrant, electric blue for accents
        'brand-dark': {
          '100': '#F0F2F5', // Lightest gray for text on dark backgrounds
          '200': '#E1E5E9',
          '300': '#C4CBD2',
          '400': '#A6B1BC',
          '500': '#8997A5',
          '600': '#6B7D8E',
          '700': '#4E6377',
          '800': '#304960',
          '900': '#132F49', // Darkest blue/gray for backgrounds
        },
        'brand-slate': {
          '100': '#2A3B4D', // For card backgrounds
          '200': '#212F3C', // For slightly darker elements
          '300': '#1A242E', // Main background color
        }
      }
    },
  },
  plugins: [],
};
