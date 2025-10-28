/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        kameron: ['"Kameron"', "serif"],
        jersey: ['"Jersey 10"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
