import { Accordion } from "../primitives/Accordion.js";
import { Button, TextButton } from "../primitives/Buttons.js";
import { CaptionBox } from "../primitives/CaptionBox.js";
import { Callout, CalloutChip } from "../primitives/Callout.js";
import { Cell, CellGrid } from "../primitives/CellGrid.js";
import { Frame } from "../primitives/Frame.js";
import { Grain } from "../primitives/Grain.js";
import { MonoLabel } from "../primitives/Label.js";
import { Ruler } from "../primitives/Ruler.js";
import { Sequence } from "../primitives/Sequence.js";
import { SpecSheet } from "../primitives/SpecSheet.js";
import { body, display, fluidUnit } from "../primitives/type.js";

const problems = [
  ["AI draws worlds, not games", "A scene that renders can still be a level nobody can finish."],
  ["Nobody tests the logic", "Keys, doors and switches are never played before the world ships."],
  ["Edits break things silently", "One change can lock the goal away, and nothing tells you."],
  ["'It works' is a claim", "Without a run you can replay, there is nothing to check."],
] as const;

const audiences = [
  {
    title: "Indie developers",
    body: "Describe a level and get one the engine has already finished.",
  },
  { title: "Game designers", body: "Change a rule in plain words and see the proof go stale." },
  { title: "Level designers", body: "Find the dead end before a player does." },
  { title: "QA leads", body: "Every report replays on its exact revision." },
];

const nothing = () => undefined;

export function PrimitivesGallery() {
  return (
    <div className={`${fluidUnit} min-h-dvh bg-paper px-[8px] text-ink`}>
      <Frame />
      <Grain />
      <CellGrid columns={4} className="border-b border-rule">
        {problems.map(([title, text]) => (
          <Cell key={title} className="min-h-[calc(var(--spacing)*22.8)]">
            <h3 className={`${display.card} max-w-[12ch]`}>{title}</h3>
            <p className={`${body.m} text-ink-72`}>{text}</p>
          </Cell>
        ))}
      </CellGrid>
      <section className="relative flex h-[calc(var(--spacing)*50)] items-center justify-center">
        <Ruler />
        <h2 className={display.l}>In every room</h2>
        <div className="absolute bottom-[calc(var(--spacing)*3)] left-[calc(var(--spacing)*3)]">
          <CaptionBox label="Introduction" hint="Scroll to continue">
            The agent enters the observatory and reads the rooms it can reach.
          </CaptionBox>
        </div>
        <div className="absolute top-[calc(var(--spacing)*8)] right-[calc(var(--spacing)*8)] flex flex-col items-end gap-3">
          <Callout code="CIRCULAR_DEPENDENCY">Key behind its own door</Callout>
          <CalloutChip code="DOOR_LOCKED" />
        </div>
      </section>
      <section className="grid border-t border-rule lg:grid-cols-2">
        <div className="flex flex-col justify-end gap-4 p-3">
          <MonoLabel>Buttons</MonoLabel>
          <div className="flex gap-3">
            <Button onClick={nothing}>Open the studio</Button>
            <Button onClick={nothing} variant="outline">
              Learn more
            </Button>
            <TextButton onClick={nothing}>Open example world</TextButton>
          </div>
          <div className="flex items-end justify-between gap-6 pt-6">
            <SpecSheet
              title="Welcome to Vect"
              rows={[
                { key: "Type", value: "AI game studio" },
                { key: "Engine", value: "vect-engine-1" },
                { key: "Focus", value: "Playable, verified 3D worlds" },
                { key: "Runs in", value: "Your browser" },
              ]}
            />
            <Sequence
              items={[
                { index: 1, label: "Load world", done: true },
                { index: 2, label: "Hash revision", done: true },
                { index: 3, label: "Solve", done: false },
              ]}
            />
          </div>
        </div>
        <div className="border-l border-rule">
          <h2 className={`${display.l} p-3 lg:pl-[calc(var(--spacing)*15.4)]`}>
            Made for people who build worlds
          </h2>
          <div className="border-t border-rule">
            <Accordion items={audiences} defaultOpen={0} />
          </div>
        </div>
      </section>
    </div>
  );
}
