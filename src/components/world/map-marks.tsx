import type { ReactElement } from "react";
import type { Point } from "./layout-types.js";
import { coord, round, tagTextSize, textWidth } from "./map-geometry.js";
import { lineStep, noteGap, pillHeight, pillWidth, slotWidth, type Note } from "./map-notes.js";
import { token, type PaletteName } from "./palette.js";

export const hairline = {
  fill: "none",
  strokeWidth: 1,
  vectorEffect: "non-scaling-stroke",
} as const;

export const dashed = { ...hairline, strokeDasharray: "3 3" } as const;

const mono = { fontFamily: "var(--font-mono, ui-monospace, monospace)" } as const;
const capRise = 0.35;
const chipPad = 0.18;

type TextProps = {
  x: number;
  z: number;
  size: number;
  tone: PaletteName;
  anchor?: "start" | "middle";
  children: string;
};

export function MapText({ x, z, size, tone, anchor = "start", children }: TextProps): ReactElement {
  return (
    <text
      x={round(x)}
      y={round(z + size * capRise)}
      fontSize={size}
      fontWeight={500}
      textAnchor={anchor}
      fill={token(tone)}
      style={mono}
    >
      {children}
    </text>
  );
}

export function LockMark({ at, tone }: { at: Point; tone: PaletteName }): ReactElement {
  const [x, z] = at;
  const shackle = `M${coord(x - 0.17)} ${coord(z - 0.08)}v-0.13a0.17 0.17 0 0 1 0.34 0v0.13`;
  return (
    <g data-mark="lock">
      <rect x={round(x - 0.29)} y={round(z - 0.08)} width={0.58} height={0.44} fill={token(tone)} />
      <path d={shackle} {...hairline} stroke={token(tone)} strokeWidth={1.5} />
    </g>
  );
}

export function TickMark({ at }: { at: Point }): ReactElement {
  const d = `M${coord(at[0] - 0.3)} ${coord(at[1])}l0.2 0.22l0.4 -0.46`;
  return (
    <path data-mark="tick" d={d} {...hairline} stroke={token("positive")} strokeWidth={1.75} />
  );
}

type PillProps = { x: number; z: number; tag: string; tone: PaletteName };

export function TagPill({ x, z, tag, tone }: PillProps): ReactElement {
  const w = pillWidth(tag);
  return (
    <g data-tag={tag}>
      <rect
        x={round(x)}
        y={round(z - pillHeight / 2)}
        width={round(w)}
        height={pillHeight}
        rx={pillHeight / 2}
        {...hairline}
        fill={token("paper")}
        stroke={token(tone)}
      />
      <MapText x={x + w / 2} z={z} size={tagTextSize} tone={tone} anchor="middle">
        {tag}
      </MapText>
    </g>
  );
}

export const chipHeight = 0.95;

export function chipWidth(text: string): number {
  return textWidth(text, tagTextSize) + chipPad * 2;
}

export function Chip({ at, text }: { at: Point; text: string }): ReactElement {
  const w = chipWidth(text);
  return (
    <g data-chip="true">
      <rect
        x={round(at[0] - w / 2)}
        y={round(at[1] - chipHeight / 2)}
        width={round(w)}
        height={chipHeight}
        fill={token("accentSoft")}
      />
      <MapText x={at[0]} z={at[1]} size={tagTextSize} tone="accent" anchor="middle">
        {text}
      </MapText>
    </g>
  );
}

type RowProps = {
  note: Note;
  mark: "lock" | "tick" | null;
  tone: PaletteName;
  textTone: PaletteName;
  lit: boolean;
};

export function NoteRow({ note, mark, tone, textTone, lit }: RowProps): ReactElement {
  const middle = note.box.z + note.box.h / 2;
  const first = note.box.x + (note.slot ? slotWidth + noteGap : 0);
  const starts = note.tags.map((_, index) =>
    note.tags.slice(0, index).reduce((sum, tag) => sum + pillWidth(tag) + noteGap, first),
  );
  const textStart = note.tags.reduce((sum, tag) => sum + pillWidth(tag) + noteGap, first);
  const markAt: Point = [note.box.x + slotWidth / 2, middle];
  const top = middle - ((note.lines.length - 1) * lineStep) / 2;
  return (
    <g data-note="true">
      {mark === "lock" ? <LockMark at={markAt} tone={tone} /> : null}
      {mark === "tick" ? <TickMark at={markAt} /> : null}
      {note.tags.map((tag, index) => (
        <TagPill key={index} x={starts[index] ?? first} z={middle} tag={tag} tone={tone} />
      ))}
      {note.lines.map((line, index) => {
        const z = top + index * lineStep;
        const centre: Point = [textStart + textWidth(line, tagTextSize) / 2, z];
        return lit ? (
          <Chip key={index} at={centre} text={line} />
        ) : (
          <MapText key={index} x={textStart} z={z} size={tagTextSize} tone={textTone}>
            {line}
          </MapText>
        );
      })}
    </g>
  );
}
