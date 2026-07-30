import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

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
        sand: {
          DEFAULT: "var(--color-sand, #E6DDD1)",
          muted: "#E0D5C8",
        },
        taupe: {
          DEFAULT: "var(--color-taupe, #C4B8A8)",
          muted: "#B5A898",
        },
        gold: {
          DEFAULT: "var(--color-gold, #C9A15B)",
          muted: "#C8A46A",
          light: "#D4B87A",
        },
        ink: {
          DEFAULT: "var(--color-ink, #2C2825)",
          muted: "var(--color-ink-muted, #4A4540)",
          soft: "var(--color-ink-soft, #6B6560)",
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      spacing: {
        section: "clamp(1rem, 2.5vw, 2rem)",
        "section-sm": "clamp(0.75rem, 2vw, 1.5rem)",
      },
      borderRadius: {
        lux: "var(--radius-lux)",
        "lux-lg": "var(--radius-lux-lg)",
      },
      boxShadow: {
        lux: "var(--shadow-lux)",
        "lux-hover": "var(--shadow-lux-hover)",
      },
      transitionDuration: {
        luxury: "700ms",
        cinematic: "1200ms",
      },
      transitionTimingFunction: {
        luxury: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(28px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slow-zoom": {
          "0%": { transform: "scale(1.08)" },
          "100%": { transform: "scale(1)" },
        },
        "scroll-line": {
          "0%": { transform: "scaleY(0)", transformOrigin: "top", opacity: "0.5" },
          "40%": { transform: "scaleY(1)", transformOrigin: "top", opacity: "1" },
          "60%": { transform: "scaleY(1)", transformOrigin: "bottom", opacity: "1" },
          "100%": { transform: "scaleY(0)", transformOrigin: "bottom", opacity: "0.5" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(200%)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 1.1s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "slow-zoom": "slow-zoom 22s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "scroll-line": "scroll-line 2.4s cubic-bezier(0.22, 1, 0.36, 1) infinite",
        shimmer: "shimmer 2.4s linear infinite",
        marquee: "marquee 30s linear infinite",
      },
    },
  },
  plugins: [typography],
} satisfies Config;
