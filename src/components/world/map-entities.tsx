import type { ReactElement } from "react";
import type { WorldEntity } from "../../contract/world.schema.js";
import type { EntityLayout } from "./layout-types.js";
import { coord } from "./map-geometry.js";
import { NoteRow } from "./map-marks.js";
import { gateEntityIds, isDrawn, isSpent, type MapModel } from "./map-model.js";
import { entitySymbols } from "./map-symbols.js";
import { token, type PaletteName } from "./palette.js";
import { isUsed, switchIsOn } from "./truth.js";

type EntityProps = { model: MapModel; entity: WorldEntity; spot: EntityLayout; index: number };

function symbolTone(entity: WorldEntity, lit: boolean, spent: boolean): PaletteName {
  if (lit) return "accent";
  if (spent) return "faint";
  return entity.kind === "prop" ? "rule" : "ink";
}

function Entity({ model, entity, spot, index }: EntityProps): ReactElement {
  const lit = model.highlights.has(entity.id);
  const spent = isSpent(model, entity);
  const on = entity.kind === "switch" && switchIsOn(model.state, entity);
  const note = model.notes.entities.get(entity.id);
  const tone = symbolTone(entity, lit, spent);
  const pending = !spent && !isUsed(model.state, entity.id);
  const place = `translate(${coord(spot.position[0])} ${coord(spot.position[2])}) scale(${coord(spot.footprint)})`;
  return (
    <g
      data-entity-id={entity.id}
      data-kind={entity.kind}
      data-used={spent ? "true" : undefined}
      data-switch={entity.kind === "switch" ? (on ? "on" : "off") : undefined}
      data-highlight={lit ? "true" : undefined}
    >
      <title>{entity.label}</title>
      <g transform={place}>
        {entitySymbols[entity.kind]({ stroke: token(tone), spent, on, variant: index })}
      </g>
      {note === undefined ? null : (
        <NoteRow
          note={note}
          mark={null}
          tone={pending || lit ? "accent" : tone}
          textTone={spent ? "faint" : "muted"}
          lit={lit}
        />
      )}
    </g>
  );
}

export function Entities({ model }: { model: MapModel }): ReactElement {
  const gateIds = gateEntityIds(model.layout);
  const spots = new Map(model.layout.entities.map((item) => [item.id, item]));
  return (
    <g data-layer="entities">
      {model.world.entities.map((entity, index) => {
        const spot = spots.get(entity.id);
        if (spot === undefined || !isDrawn(model, entity, gateIds)) return null;
        return <Entity key={index} model={model} entity={entity} spot={spot} index={index} />;
      })}
    </g>
  );
}
