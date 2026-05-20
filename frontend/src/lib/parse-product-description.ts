const BULLET_LINE =
  /^(?:>\s*|[-•*]\s+|\d+\.\s+)(.+)$/;

export type ParsedProductDescription = {
  intro: string;
  bullets: string[];
};

export function parseProductDescription(text: string): ParsedProductDescription {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const bullets: string[] = [];
  const introParts: string[] = [];

  for (const line of lines) {
    const match = line.match(BULLET_LINE);
    if (match?.[1]) {
      bullets.push(match[1].trim());
    } else {
      introParts.push(line);
    }
  }

  return {
    intro: introParts.join(" "),
    bullets,
  };
}

/** Fallback bullets from styling notes (newline-separated lines or sentences). */
export function bulletsFromStylingNotes(notes: string | undefined): string[] {
  if (!notes?.trim()) return [];
  const byLine = notes
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (byLine.length > 1) return byLine;
  return notes
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12);
}
