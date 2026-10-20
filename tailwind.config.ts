import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        night: { DEFAULT: "#171410", 800: "#1C1814", 900: "#110F0C" },
        surface: { DEFAULT: "#211C17", 2: "#2A231C" },
        cream: { DEFAULT: "#F1E8DA", 50: "#F8F2E8" },
        mist: "#B9AC99",
        caramel: { DEFAULT: "#A88965", 300: "#C4A785", 600: "#8F7352", 700: "#6F593F" },
        line: "#3A3026",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        script: ["var(--font-script)", "cursive"],
      },
      letterSpacing: { eyebrow: "0.28em" },
    },
  },
  plugins: [],
};

export default config;
