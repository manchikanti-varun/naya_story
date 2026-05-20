/** Central luxury design tokens — consumed by Tailwind, CSS vars, and motion. */
export const luxuryEase = [0.22, 1, 0.36, 1] as const;
export const luxuryEaseOut = [0.16, 1, 0.3, 1] as const;

export const luxuryDurations = {
  instant: 0.2,
  fast: 0.45,
  base: 0.7,
  slow: 1.1,
  cinematic: 1.35,
  hero: 1.8,
} as const;

export const luxurySpacing = {
  sectionY: "clamp(5rem, 12vw, 9rem)",
  sectionYSm: "clamp(3.5rem, 8vw, 6rem)",
  editorialGap: "clamp(2rem, 5vw, 4rem)",
} as const;

export const luxuryTypography = {
  displayHero: "clamp(2.75rem, 7vw, 5.5rem)",
  displaySection: "clamp(2.25rem, 4.5vw, 4rem)",
  displayCard: "clamp(1.35rem, 2vw, 1.75rem)",
  kicker: "0.32em",
  label: "0.24em",
  body: "1.72",
} as const;

export const luxuryColors = {
  ivory: "#F5F1EC",
  ivoryMuted: "#F2EEE8",
  ivorySoft: "#EFE9E1",
  ivoryDeep: "#E8E0D6",
  taupe: "#C4B8A8",
  sand: "#E6DDD1",
  ink: "#2C2825",
  inkMuted: "#4A4540",
  inkSoft: "#6B6560",
  gold: "#C9A15B",
  goldMuted: "#C8A46A",
} as const;
