export const aiLabel = "AI-generated illustration";

export type AiArt = { src: string; subject: string; width: number; height: number };

export const aiArtwork = {
  study: {
    src: "/landing/observatory-study.webp",
    subject: "a perspective concept study of an observatory and its connected halls",
    width: 1448,
    height: 1086,
  },
  poster: {
    src: "/landing/observatory-poster.webp",
    subject: "an observatory concept poster with a vermilion sun",
    width: 1086,
    height: 1448,
  },
  pavilion: {
    src: "/landing/portal-pavilion.webp",
    subject: "a portal pavilion concept with a domed tower and entrance stairs",
    width: 1254,
    height: 1254,
  },
} as const satisfies Record<string, AiArt>;

export const heroEngraving = {
  src: "/landing/observatory-engraving.webp",
  subject: "the example world's level drawing, shaded as a concrete observatory",
  worldId: "observatory-01",
} as const;

export const appAssets = [
  "/landing/observatory-elevation.png",
  "/landing/observatory-three-quarter.png",
  "/landing/studio-capture.webp",
  "/landing/play-capture.webp",
  "/landing/test-capture.webp",
  "/landing/proof-capture.webp",
] as const;
