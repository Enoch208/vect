import type { ReactElement } from "react";
import type { EntityKind } from "../../contract/codes.js";
import { dashed, hairline } from "./map-marks.js";
import { token } from "./palette.js";

export type SymbolLook = { stroke: string; spent: boolean; on: boolean; variant: number };

const diamond = "M0 -1L1 0L0 1L-1 0Z";

function line(look: SymbolLook) {
  return { ...(look.spent ? dashed : hairline), stroke: look.stroke };
}

function keyShape(look: SymbolLook): ReactElement {
  return (
    <>
      <circle cx={-0.5} cy={0} r={0.42} {...line(look)} />
      <path d="M-0.08 0H1M0.55 0v0.42M0.85 0v0.42" {...line(look)} />
    </>
  );
}

function switchShape(look: SymbolLook): ReactElement {
  const lean = look.on ? 0.75 : -0.75;
  return (
    <>
      <rect x={-0.6} y={-0.4} width={1.2} height={1.2} {...line(look)} />
      <path d={`M0 0.3L${String(lean)} -0.9`} {...line(look)} />
      <circle
        cx={lean}
        cy={-0.9}
        r={0.18}
        {...line(look)}
        fill={look.on ? look.stroke : token("paper")}
      />
    </>
  );
}

function chestShape(look: SymbolLook): ReactElement {
  return (
    <>
      <rect x={-1} y={-0.65} width={2} height={1.3} {...line(look)} />
      {look.spent ? null : <path d="M-1 -0.2H1M0 -0.2v0.32" {...line(look)} />}
    </>
  );
}

function trapShape(look: SymbolLook): ReactElement {
  return (
    <>
      <rect x={-0.8} y={-0.8} width={1.6} height={1.6} {...line(look)} />
      {look.spent ? null : (
        <path d="M-0.8 0L0 -0.8M-0.8 0.8L0.8 -0.8M0 0.8L0.8 0" {...line(look)} />
      )}
    </>
  );
}

function checkpointShape(look: SymbolLook): ReactElement {
  return (
    <>
      <path d={diamond} {...line(look)} />
      {look.spent ? null : <circle cx={0} cy={0} r={0.16} fill={look.stroke} />}
    </>
  );
}

function barrierShape(look: SymbolLook): ReactElement {
  return (
    <>
      <rect x={-1} y={-0.6} width={2} height={1.2} {...line(look)} />
      {look.spent ? null : <path d="M-1 -0.6L1 0.6M-1 0.6L1 -0.6" {...line(look)} />}
    </>
  );
}

function goalShape(look: SymbolLook): ReactElement {
  return (
    <>
      <circle cx={0} cy={0} r={1} {...line(look)} />
      <circle cx={0} cy={0} r={0.55} {...line(look)} />
      <path d="M-1.3 0H1.3M0 -1.3V1.3" {...line(look)} />
    </>
  );
}

function propShape(look: SymbolLook): ReactElement {
  return look.variant % 2 === 0 ? (
    <circle cx={0} cy={0} r={0.85} {...line(look)} />
  ) : (
    <rect x={-0.75} y={-0.75} width={1.5} height={1.5} rx={0.25} {...line(look)} />
  );
}

function doorShape(look: SymbolLook): ReactElement {
  return <path d="M-0.7 0.7H0.7M-0.7 0.7V-0.7A1.4 1.4 0 0 1 0.7 0.7" {...line(look)} />;
}

function portalShape(look: SymbolLook): ReactElement {
  return (
    <>
      <circle cx={0} cy={0} r={1} {...line(look)} />
      <circle cx={0} cy={0} r={0.6} {...line(look)} />
    </>
  );
}

export const entitySymbols: Record<EntityKind, (look: SymbolLook) => ReactElement> = {
  key: keyShape,
  switch: switchShape,
  chest: chestShape,
  trap: trapShape,
  checkpoint: checkpointShape,
  barrier: barrierShape,
  goal: goalShape,
  prop: propShape,
  door: doorShape,
  portal: portalShape,
};
