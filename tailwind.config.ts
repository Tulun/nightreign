import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Night — backgrounds layered from deepest to surface
        night: {
          950: "#08090c", // page base, near-black with cold blue
          900: "#0d0f14",
          850: "#12141b",
          800: "#181a22", // raised surface (cards)
          700: "#22242e", // hover surface
          600: "#2c2f3b", // hairline borders
        },
        // Erdtree gold — the single accent, used with restraint
        gold: {
          DEFAULT: "#c9a227",
          bright: "#e3c45a",
          dim: "#8a7434",
          faint: "#5c4f2a",
        },
        parchment: {
          DEFAULT: "#e8e2d1", // primary text
          muted: "#a39d8c", // secondary text
          faint: "#6f6a5c", // tertiary / placeholders
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "serif"],
      },
      boxShadow: {
        seal: "0 0 0 1px rgba(201,162,39,0.25), 0 8px 24px -12px rgba(0,0,0,0.8)",
        lift: "0 12px 36px -16px rgba(0,0,0,0.9), 0 0 0 1px rgba(201,162,39,0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
