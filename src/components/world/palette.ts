export const palette = {
  paper: "#F2F2F1",
  paperRaised: "#FFFFFF",
  ink: "#282828",
  muted: "#626260",
  faint: "#B4B4B0",
  rule: "#B3B3AF",
  ruleSoft: "#E0E0DA",
  accent: "#FA3600",
  accentSoft: "#FFDEDE",
  positive: "#1F8A5B",
  modelLight: "#F4F3EF",
  modelShade: "#E9E7E1",
} as const;

export type PaletteName = keyof typeof palette;

const tokenNames: Record<PaletteName, string> = {
  paper: "--color-paper",
  paperRaised: "--color-paper-raised",
  ink: "--color-ink",
  muted: "--color-muted",
  faint: "--color-faint",
  rule: "--color-rule",
  ruleSoft: "--color-rule-soft",
  accent: "--color-accent",
  accentSoft: "--color-accent-soft",
  positive: "--color-positive",
  modelLight: "--color-paper-raised",
  modelShade: "--color-rule-soft",
};

export function token(name: PaletteName): string {
  return `var(${tokenNames[name]}, ${palette[name]})`;
}
