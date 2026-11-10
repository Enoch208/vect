import { useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Alert02Icon } from "@hugeicons/core-free-icons";
import type { WorldSpec } from "../../../contract/world.schema.js";
import { checkWorld } from "../../../verification/check-world.js";
import { roomLabel } from "../../../verification/describe.js";
import { Plan } from "../blueprint/Plan.js";
import { findingCallouts, type PlanCallout } from "../blueprint/plan-callouts.js";
import { planGeometry } from "../blueprint/plan-geometry.js";
import { CaptionBox } from "../primitives/CaptionBox.js";
import { Callout } from "../primitives/Callout.js";
import { BracketLabel } from "../primitives/Label.js";
import { LiveBoundary } from "../primitives/LiveBoundary.js";
import { Ruler } from "../primitives/Ruler.js";
import { sequenceIndex } from "../primitives/Sequence.js";
import { StatusChip } from "../primitives/StatusChip.js";
import { display } from "../primitives/type.js";
import { along, tracePoints, type TracePoint } from "./fault-trace.js";
import { nearestProgress } from "./scrub.js";

type Live = {
  status: string | null;
  callouts: PlanCallout[];
  finding: { code: string; explanation: string } | null;
  points: TracePoint[];
};

function liveFor(world: WorldSpec): Live {
  const check = checkWorld(world);
  const finding = check.solvability?.findings[0] ?? check.structural[0] ?? null;
  return {
    status: check.solvability?.status ?? null,
    callouts: findingCallouts(world, check),
    finding: finding === null ? null : { code: finding.code, explanation: finding.explanation },
    points: tracePoints(world),
  };
}

function captionAt(world: WorldSpec, points: readonly TracePoint[], index: number) {
  const step = points[index]?.step ?? null;
  if (step === null) {
    return {
      label: "Start",
      text: `Starts in ${roomLabel(world, world.startRoomId)} with nothing in hand.`,
    };
  }
  return { label: `Step ${sequenceIndex(step.index + 1)} · ${step.code}`, text: step.caption };
}

const corner = "absolute z-10 flex flex-col gap-[calc(var(--spacing)*1.2)]";

function Body({ world, live }: { world: WorldSpec; live: Live | null }) {
  const last = Math.max(0, (live?.points.length ?? 1) - 1);
  const [progress, setProgress] = useState(last);
  const [explained, setExplained] = useState(false);
  const surface = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const view = useMemo(() => planGeometry(world).view, [world]);
  const index = Math.floor(progress + 0.0001);
  const caption = live === null ? null : captionAt(world, live.points, index);
  const traced = live === null ? null : along(live.points, progress);

  function scrub(event: PointerEvent<HTMLDivElement>) {
    const rect = surface.current?.getBoundingClientRect();
    if (live === null || rect === undefined || rect.width === 0) return;
    const scene: [number, number] = [
      view.x + ((event.clientX - rect.left) / rect.width) * view.w,
      view.z + ((event.clientY - rect.top) / rect.height) * view.h,
    ];
    setProgress(
      nearestProgress(
        live.points.map((item) => item.point),
        scene,
      ),
    );
  }

  function step(event: KeyboardEvent<HTMLDivElement>) {
    const moves: Record<string, number> = {
      ArrowRight: 1,
      ArrowUp: 1,
      ArrowLeft: -1,
      ArrowDown: -1,
    };
    if (event.key === "Home") setProgress(0);
    else if (event.key === "End") setProgress(last);
    else if (moves[event.key] !== undefined)
      setProgress(Math.max(0, Math.min(last, index + (moves[event.key] ?? 0))));
    else return;
    event.preventDefault();
  }

  return (
    <div className="relative flex min-h-[150vw] flex-col items-center justify-center px-[12px] py-[calc(var(--spacing)*16)] lg:h-[calc(100dvh-16px)] lg:min-h-[calc(var(--spacing)*86)] lg:px-3">
      <Ruler />
      <div
        className={`${corner} top-[calc(var(--spacing)*3.6)] left-[calc(var(--spacing)*3.6)] max-w-[calc(100%-var(--spacing)*7.2)]`}
      >
        <BracketLabel>Fig. 02 · One edit later</BracketLabel>
        <h2 id="fault-title" className={`${display.m} max-w-[16ch]`}>
          Put the key behind its own door
        </h2>
      </div>
      {live?.status != null && (
        <div
          className={`${corner} top-[calc(var(--spacing)*3.6)] right-[calc(var(--spacing)*3.6)] items-end max-lg:hidden`}
        >
          <StatusChip tone="failure" icon={Alert02Icon}>
            {live.status}
          </StatusChip>
        </div>
      )}
      <div
        ref={surface}
        role={live === null ? undefined : "slider"}
        tabIndex={live === null ? undefined : 0}
        aria-label="Agent trace on the broken world"
        aria-valuemin={live === null ? undefined : 0}
        aria-valuemax={live === null ? undefined : last}
        aria-valuenow={live === null ? undefined : index}
        aria-valuetext={caption === null ? undefined : `${caption.label}: ${caption.text}`}
        onKeyDown={step}
        onPointerDown={(event) => {
          dragging.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          scrub(event);
        }}
        onPointerMove={(event) => {
          if (dragging.current) scrub(event);
        }}
        onPointerUp={() => {
          dragging.current = false;
        }}
        onPointerCancel={() => {
          dragging.current = false;
        }}
        className={`w-full max-w-[calc(var(--spacing)*128)] touch-pan-y select-none focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-accent ${live === null ? "" : "cursor-ew-resize"}`}
      >
        <Plan
          world={world}
          state={traced === null ? null : (live?.points[index]?.step?.state ?? null)}
          agent={traced?.at ?? null}
          path={traced?.path ?? []}
          callouts={live?.callouts ?? null}
          onTargetClick={() => {
            setExplained(true);
          }}
        />
      </div>
      <div className="absolute bottom-[calc(var(--spacing)*3.6)] left-[calc(var(--spacing)*3.6)] z-10">
        <CaptionBox
          label={caption?.label ?? "Agent trace"}
          hint={live === null ? undefined : "Click and drag to trace the agent"}
        >
          {caption?.text ??
            "This plan is drawn from the world file; the live trace could not be computed here."}
        </CaptionBox>
      </div>
      {live?.finding != null && (
        <div className="absolute right-[calc(var(--spacing)*3.6)] bottom-[calc(var(--spacing)*3.6)] z-10 flex flex-col items-end max-lg:hidden">
          {explained ? (
            <Callout code={live.finding.code} detail={live.finding.explanation} />
          ) : (
            <BracketLabel>Click the finding to see why</BracketLabel>
          )}
        </div>
      )}
    </div>
  );
}

function LiveBody({ world }: { world: WorldSpec }) {
  const live = useMemo(() => liveFor(world), [world]);
  return <Body world={world} live={live} />;
}

export function FaultPlan({ world }: { world: WorldSpec }) {
  return (
    <section aria-labelledby="fault-title" className="border-b border-rule">
      <LiveBoundary fallback={<Body world={world} live={null} />}>
        <LiveBody world={world} />
      </LiveBoundary>
    </section>
  );
}
