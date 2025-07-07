/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [`./views/**/*.ejs`],
  theme: {
    extend: {},
  },
  daisyui: {
    themes: ['forest'],
  },
  plugins: [require('@tailwindcss/typography'), require('daisyui')],
}

