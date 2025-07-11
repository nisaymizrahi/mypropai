/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      // The "Inter" font is already set up and is perfect for a clean, modern look.
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      // NEW: A professional light theme color palette with a turquoise accent.
      colors: {
        'brand-turquoise': {
          'DEFAULT': '#14b8a6', // A vibrant, professional turquoise
          '50': '#f0fdfa',
          '100': '#ccfbf1',
          '200': '#99f6e4',
          '300': '#5eead4',
          '400': '#2dd4bf',
          '500': '#14b8a6',
          '600': '#0d9488',
          '700': '#0f766e',
          '800': '#115e59',
          '900': '#134e4a',
        },
        'brand-gray': {
          '50': '#f8fafc',  // Page background
          '100': '#f1f5f9', // Lighter element background
          '200': '#e2e8f0', // Borders
          '300': '#cbd5e1',
          '400': '#94a3b8',
          '500': '#64748b', // Secondary text
          '600': '#475569',
          '700': '#334155',
          '800': '#1e293b', // Primary text
          '900': '#0f172a',
        },
      }
    },
  },
  plugins: [],
};
