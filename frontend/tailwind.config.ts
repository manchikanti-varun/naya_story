import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: {
          DEFAULT: "#F5F1EC",
          muted: "#F2EEE8",
          soft: "#EFE9E1",
          deep: "#E8E0D6",
        },
        gold: {
          DEFAULT: "#C9A15B",
          muted: "#C8A46A",
          light: "#D4B87A",
        },
        ink: {
          DEFAULT: "#2C2825",
          muted: "#4A4540",
          soft: "#6B6560",
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      spacing: {
        section: "clamp(4rem, 10vw, 8rem)",
      },
      transitionDuration: {
        luxury: "700ms",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slow-zoom": {
          "0%": { transform: "scale(1.06)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up 1s ease-out forwards",
        "slow-zoom": "slow-zoom 18s ease-out forwards",
      },
    },
  },
  plugins: [],
} satisfies Config;
