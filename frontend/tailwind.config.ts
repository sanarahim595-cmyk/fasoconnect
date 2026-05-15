import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        burkina: {
          green: "#1f7a4d",
          red: "#d73333",
          yellow: "#f4c542",
          white: "#fffdf7",
          deep: "#111827",
        },
        savanna: "#f4c542",
        baobab: "#1f7a4d",
        laterite: "#d73333",
        night: "#111827",
      },
      boxShadow: {
        soft: "0 18px 45px -28px rgba(17, 24, 39, 0.35)",
        glow: "0 16px 40px -24px rgba(31, 122, 77, 0.65)",
      },
      borderRadius: {
        "2xl": "1.25rem",
      },
      animation: {
        "fade-up": "fadeUp 0.55s ease-out both",
        "pulse-soft": "pulseSoft 2.4s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.02)", opacity: "0.92" },
        },
      },
      fontFamily: {
        sans: ["Inter", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
