export type Weight = "heavy" | "light" | "hair";

export type Stroke = { id: string; d: string; weight: Weight; start: number };

export type DrawingLabel = {
  id: string;
  x: number;
  y: number;
  text: string;
  anchor: "start" | "middle" | "end";
  start: number;
};

const round = (value: number) => Math.round(value * 10) / 10;

export function rectPath(x: number, y: number, width: number, height: number): string {
  return `M${String(round(x))} ${String(round(y))}h${String(round(width))}v${String(round(height))}h${String(round(-width))}Z`;
}

export function linePath(x1: number, y1: number, x2: number, y2: number): string {
  return `M${String(round(x1))} ${String(round(y1))}L${String(round(x2))} ${String(round(y2))}`;
}

export function circlePath(cx: number, cy: number, r: number): string {
  const left = `${String(round(cx - r))} ${String(round(cy))}`;
  const arc = `a${String(round(r))} ${String(round(r))} 0 1 0`;
  return `M${left}${arc} ${String(round(2 * r))} 0${arc} ${String(round(-2 * r))} 0`;
}

export function arcPath(x1: number, y: number, x2: number, r: number): string {
  return `M${String(round(x1))} ${String(round(y))}A${String(round(r))} ${String(round(r))} 0 0 1 ${String(round(x2))} ${String(round(y))}`;
}
