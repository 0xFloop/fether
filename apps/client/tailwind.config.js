/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: "jit",
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    fontFamily: {
      display: ["HelveticaNeue, Helvetica, Arial, sans-serif"],
      body: ["Inter var", "sans-serif"],
    },
    extend: {
      colors: { "secondary-blue": "#3232FF" },
      keyframes: {},
      animation: {},
    },
  },
  plugins: [require("@tailwindcss/forms")({ strategy: "base" })],
};
