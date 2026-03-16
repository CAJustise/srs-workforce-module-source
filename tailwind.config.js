/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'ocean': {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        'sand': {
          50: '#fdf8f1',
          100: '#f9ecdc',
          200: '#f2d5b8',
          300: '#ebbe94',
          400: '#e49c5f',
          500: '#dd7a2a',
          600: '#c75f24',
          700: '#a64720',
          800: '#853920',
          900: '#6c301d',
        },
      },
      fontFamily: {
        display: ['var(--font-playfair-display)', 'serif'],
        sans: ['var(--font-inter)', 'sans-serif'],
        garamond: ['var(--font-garamond)', 'serif'],
      },
    },
  },
  plugins: [],
};