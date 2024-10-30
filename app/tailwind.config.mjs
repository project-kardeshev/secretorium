/** @type {import('tailwindcss').Config} */

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'selector', // or 'media' or 'class'
  theme: {
    extend: {
      // fontFamily: {
      //   sans: ['Rubik', 'sans-serif'],
      //   ['sans-bold']: ['Rubik-Bold', 'sans-serif'],
      // },
      text: {
        base: '14px',
        scale: 1.2,
      },
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      bold: 700,
    },
    colors: {
      background: '#131314',
      foreground: '#222224',
      success: '#44af69',
      error: '#ef6461',
      warning: '#ffe31b',
      white: '#fafafa',
      black: 'black',
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('tailwind-scrollbar')({ nocompatible: true }),
  ],
};
