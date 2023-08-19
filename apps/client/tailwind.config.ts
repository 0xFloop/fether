import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    fontFamily: {
      display: ["HelveticaNeue, Helvetica, Arial, sans-serif"],
      body: ["Inter var", "sans-serif"],
    },
    extend: {
      colors: {
        accent: "#20C20E",
        "primary-gray": "#16161a",
        "secondary-gray": "#1d1d21",
        "secondary-border": "#28282e",
        "almost-black": "#121212",
      },
      keyframes: {},
      animation: {},
    },
  },
  plugins: [require("@tailwindcss/forms")({ strategy: "base" })],
} satisfies Config;
