import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    fontFamily: {
      display: ["HelveticaNeue, Helvetica, Arial, sans-serif"],
      body: ["Inter var", "sans-serif"],
    },
    extend: {
      fontFamily: {
        primary: ["Poppins"],
      },
      colors: {
        accent: "#3232FF",
        "primary-gray": "#16161a",
        "secondary-gray": "#2a2a2f",
        "tertiary-gray": "rgb(156 163 175)",
        "secondary-border": "#3b3b3b",
        "almost-black": "#121212",
      },
      keyframes: {},
      animation: {},
    },
  },
  plugins: [require("@tailwindcss/forms")({ strategy: "base" })],
} satisfies Config;
