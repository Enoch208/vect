import { projectToView } from "./camera-math.js";

export const labelType = { size: 11, advance: 0.64, lineHeight: 1.25, gap: 5, badge: 22 } as const;
export const maxLabelChars = 22;

export type LabelSpec = {
  id: string;
  anchor: [number, number, number];
  lines: string[];
  badge: string | null;
  below: boolean;
  priority: number;
};

export type Placed<T extends LabelSpec> = T & { lift: number; width: number; height: number };
export type PlacedLabel = Placed<LabelSpec>;

type Box = { left: number; right: number; top: number; bottom: number };

export function wrapLabel(text: string, maxChars: number = maxLabelChars): string[] {
  const words = text
    .trim()
    .split(/\s+/)
    .flatMap((word) => word.match(new RegExp(`.{1,${String(maxChars)}}`, "gu")) ?? []);
  const lines: string[] = [];
  for (const word of words) {
    const last = lines[lines.length - 1];
    if (last !== undefined && last.length + 1 + word.length <= maxChars) {
      lines[lines.length - 1] = `${last} ${word}`;
    } else {
      lines.push(word);
    }
  }
  return lines;
}

export function labelSize(
  lines: readonly string[],
  badge: string | null = null,
): { width: number; height: number } {
  const longest = Math.max(0, ...lines.map((line) => line.length));
  const text = longest * labelType.size * labelType.advance;
  return {
    width: badge === null ? text : Math.max(text, labelType.badge),
    height:
      lines.length * labelType.size * labelType.lineHeight + (badge === null ? 0 : labelType.badge),
  };
}

function boxOf(label: LabelSpec, zoom: number, lift: number): Box {
  const [u, v] = projectToView(...label.anchor);
  const { width, height } = labelSize(label.lines, label.badge);
  const x = u * zoom;
  const y = v * zoom + (label.below ? -lift : lift);
  return label.below
    ? { left: x - width / 2, right: x + width / 2, top: y, bottom: y - height }
    : { left: x - width / 2, right: x + width / 2, top: y + height, bottom: y };
}

function overlaps(a: Box, b: Box): boolean {
  const pad = labelType.gap;
  return (
    a.left < b.right + pad &&
    a.right + pad > b.left &&
    a.bottom < b.top + pad &&
    a.top + pad > b.bottom
  );
}

export function placeLabels<T extends LabelSpec>(labels: readonly T[], zoom: number): Placed<T>[] {
  const order = [...labels].sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
  const taken: Box[] = [];
  const lifts = new Map<string, number>();
  const step = labelType.size * labelType.lineHeight + labelType.gap;
  for (const label of order) {
    let lift = 0;
    let box = boxOf(label, zoom, lift);
    for (let tries = 0; tries < 12 && taken.some((other) => overlaps(box, other)); tries += 1) {
      lift += step;
      box = boxOf(label, zoom, lift);
    }
    taken.push(box);
    lifts.set(label.id, lift);
  }
  return labels.map((label) => ({
    ...label,
    ...labelSize(label.lines, label.badge),
    lift: lifts.get(label.id) ?? 0,
  }));
}
