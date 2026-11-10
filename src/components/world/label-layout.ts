import { projectToView } from "./camera-math.js";

export const labelType = {
  size: 11,
  advance: 0.64,
  lineHeight: 1.25,
  gap: 5,
  markPitch: 21.12,
  markSize: 20,
} as const;
export const maxLabelChars = 22;

export type LabelSpec = {
  id: string;
  anchor: [number, number, number];
  lines: string[];
  badge: string | null;
  below: boolean;
  priority: number;
};

export type Placed<T extends LabelSpec> = T & {
  lift: number;
  shift: number;
  width: number;
  height: number;
};
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

export function badgeMarks(badge: string | null): string[] {
  return badge === null ? [] : badge.split("+");
}

export function labelSize(
  lines: readonly string[],
  badge: string | null = null,
): { width: number; height: number } {
  const marks = badgeMarks(badge).length;
  const longest = Math.max(0, ...lines.map((line) => line.length));
  const text = longest * labelType.size * labelType.advance;
  const rows = lines.length + (marks > 0 ? 1 : 0);
  return {
    width: Math.max(text, marks * labelType.markPitch),
    height: Math.max(
      rows * labelType.size * labelType.lineHeight,
      marks > 0 ? labelType.markSize : 0,
    ),
  };
}

function boxOf(label: LabelSpec, zoom: number, shift: number, lift: number): Box {
  const [u, v] = projectToView(...label.anchor);
  const { width, height } = labelSize(label.lines, label.badge);
  const x = u * zoom + shift;
  const y = v * zoom + (label.below ? -lift : lift);
  return label.below
    ? { left: x - width / 2, right: x + width / 2, top: y, bottom: y - height }
    : { left: x - width / 2, right: x + width / 2, top: y + height, bottom: y };
}

function overlap(a: Box, b: Box): number {
  const pad = labelType.gap;
  const wide = Math.min(a.right, b.right) - Math.max(a.left, b.left) + pad;
  const tall = Math.min(a.top, b.top) - Math.max(a.bottom, b.bottom) + pad;
  return wide > 0 && tall > 0 ? wide * tall : 0;
}

function candidates(label: LabelSpec): Array<[number, number]> {
  const { width } = labelSize(label.lines, label.badge);
  const beside = width / 2 + labelType.gap;
  const clear = width + labelType.gap;
  const step = labelType.size * labelType.lineHeight + labelType.gap;
  const near = (level: number): Array<[number, number]> => [
    [0, level * step],
    [beside, level * step],
    [-beside, level * step],
  ];
  const far = (level: number): Array<[number, number]> => [
    [clear, level * step],
    [-clear, level * step],
  ];
  return [
    ...near(0),
    ...near(1),
    ...far(0),
    ...near(2),
    ...far(1),
    ...near(3),
    ...far(2),
    ...far(3),
  ];
}

export function placeLabels<T extends LabelSpec>(labels: readonly T[], zoom: number): Placed<T>[] {
  const order = [...labels].sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
  const taken: Box[] = [];
  const spots = new Map<string, [number, number]>();
  for (const label of order) {
    let best: [number, number] = [0, 0];
    let least = Number.POSITIVE_INFINITY;
    for (const [shift, lift] of candidates(label)) {
      const box = boxOf(label, zoom, shift, lift);
      const clash = taken.reduce((total, other) => total + overlap(box, other), 0);
      if (clash < least) {
        best = [shift, lift];
        least = clash;
      }
      if (clash === 0) break;
    }
    taken.push(boxOf(label, zoom, best[0], best[1]));
    spots.set(label.id, best);
  }
  return labels.map((label) => {
    const [shift, lift] = spots.get(label.id) ?? [0, 0];
    return { ...label, ...labelSize(label.lines, label.badge), shift, lift };
  });
}
