import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        primary: ["Encode Sans Expanded"],
      },
      colors: {
        accent: "#3232FF",
        "primary-gray": "#27262B",
        "dark-gray": "#212024",
        "secondary-orange": "#FF6B00",
        "off-white": "#FAFAFA",
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
