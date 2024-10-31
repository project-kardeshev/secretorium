/** @type {import('tailwindcss').Config} */

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'selector', // or 'media' or 'class'
  theme: {
    extend: {
      fontFamily: {
        sans: ['Cinzel Decorative', 'system-ui', 'sans-serif'],
        ['sans-bold']: ['Cinzel Decorative', 'system-ui', 'sans-serif'],
      },
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
    backgroundImage: {
      'hero-pattern': "url('/images/hero.webp')",
      'bronze-gradient': 'linear-gradient(135deg, #1f1f1f, #4E2E1E, #B87333);',
    },
    colors: {
      background: '#131314',
      foreground: '#222224',
      primary: '#B87333',
      secondary: '#4E2E1E',
      success: '#44af69',
      error: '#ef6461',
      warning: '#ffe31b',
      white: '#fafafa',
      black: 'black',
    },
    boxShadow: {
      '3xl': '0 10px 15px 1px rgba(0, 0, 0, 0.9)',
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('tailwind-scrollbar')({ nocompatible: true }),
  ],
};
