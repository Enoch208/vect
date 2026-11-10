const noiseTile = [
  "<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'>",
  "<filter id='g'>",
  "<feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/>",
  "<feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1.4 -0.35'/>",
  "</filter>",
  "<rect width='100%' height='100%' filter='url(#g)'/>",
  "</svg>",
].join("");

const grainImage = `url("data:image/svg+xml,${encodeURIComponent(noiseTile)}")`;

export function Grain() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 opacity-[0.16] mix-blend-multiply"
      style={{ backgroundImage: grainImage }}
    />
  );
}
