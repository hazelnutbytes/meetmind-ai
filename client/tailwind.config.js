/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        charcoal: {
          DEFAULT: '#20231F',
          light: '#2E322D',
          dark: '#141713',
        },
        ivory: {
          DEFAULT: '#F6F3EC',
          light: '#FBF9F5',
          dark: '#EDE8DD',
        },
        terracotta: {
          DEFAULT: '#D96C4F',
          hover: '#C25B40',
          light: '#F5E6E1',
        },
        sage: {
          DEFAULT: '#87927A',
          hover: '#737E67',
          light: '#EBF0E8',
        },
        sand: {
          DEFAULT: '#E8E2D7',
          light: '#F2EDE5',
          dark: '#D5CDBF',
        },
        gold: {
          DEFAULT: '#B58B49',
          light: '#FAF3E7',
          hover: '#9E773A',
        }
      },
      fontFamily: {
        serif: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
