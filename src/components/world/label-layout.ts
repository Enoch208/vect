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

export type Anchor = [number, number, number];

export type LabelSpec = {
  id: string;
  anchor: Anchor;
  lines: string[];
  badge: string | null;
  below: boolean;
  priority: number;
  alternates?: Anchor[];
  avoidsRooms?: boolean;
};

export type Footprint = { u: number; v: number; halfWidth: number; halfHeight: number };

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

export function clampLines(lines: readonly string[], most: number): string[] {
  if (lines.length <= most) return [...lines];
  const kept = lines.slice(0, most);
  const last = kept[most - 1] ?? "";
  kept[most - 1] = `${last.slice(0, Math.max(1, last.length - 2))}..`;
  return kept;
}

function boxOf(label: LabelSpec, anchor: Anchor, zoom: number, shift: number, lift: number): Box {
  const [u, v] = projectToView(...anchor);
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

const samples = [0.12, 0.5, 0.88];

function covered(box: Box, rooms: readonly Footprint[], zoom: number): number {
  const area = (box.right - box.left) * (box.top - box.bottom);
  let inside = 0;
  for (const across of samples) {
    for (const up of samples) {
      const x = box.left + (box.right - box.left) * across;
      const y = box.bottom + (box.top - box.bottom) * up;
      const hit = rooms.some(
        (room) =>
          Math.abs(x - room.u * zoom) / (room.halfWidth * zoom) +
            Math.abs(y - room.v * zoom) / (room.halfHeight * zoom) <=
          1,
      );
      if (hit) inside += 1;
    }
  }
  return (area * inside) / (samples.length * samples.length);
}

function offsets(label: LabelSpec): Array<[number, number]> {
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

type Spot = { anchor: Anchor; shift: number; lift: number };

function spotsFor(label: LabelSpec): Spot[] {
  const spread = offsets(label);
  return [label.anchor, ...(label.alternates ?? [])].flatMap((anchor) =>
    spread.map(([shift, lift]) => ({ anchor, shift, lift })),
  );
}

export function placeLabels<T extends LabelSpec>(
  labels: readonly T[],
  zoom: number,
  rooms: readonly Footprint[] = [],
): Placed<T>[] {
  const order = [...labels].sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
  const taken: Box[] = [];
  const chosen = new Map<string, Spot>();
  for (const label of order) {
    let best: Spot = { anchor: label.anchor, shift: 0, lift: 0 };
    let least = Number.POSITIVE_INFINITY;
    for (const spot of spotsFor(label)) {
      const box = boxOf(label, spot.anchor, zoom, spot.shift, spot.lift);
      const clash = taken.reduce((total, other) => total + overlap(box, other), 0);
      const cost = clash + (label.avoidsRooms === true ? covered(box, rooms, zoom) : 0);
      if (cost < least) {
        best = spot;
        least = cost;
      }
      if (cost === 0) break;
    }
    taken.push(boxOf(label, best.anchor, zoom, best.shift, best.lift));
    chosen.set(label.id, best);
  }
  return labels.map((label) => {
    const spot = chosen.get(label.id) ?? { anchor: label.anchor, shift: 0, lift: 0 };
    return { ...label, ...labelSize(label.lines, label.badge), ...spot };
  });
}
