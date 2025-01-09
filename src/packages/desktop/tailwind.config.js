/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/app/**/*.tsx', './node_modules/@singhshashi/**/*.js'],
  theme: {},
  extend: {},
  plugins: [require('tailwind-scrollbar')],
};
