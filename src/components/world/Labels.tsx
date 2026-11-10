import { createPortal, useFrame, useThree } from "@react-three/fiber";
import { useContext, useMemo, type ReactElement } from "react";
import type { GameState } from "../../contract/game.schema.js";
import type { WorldSpec } from "../../contract/world.schema.js";
import { fitMargin, fitLayout, followZoom } from "./camera-math.js";
import { placeLabels } from "./label-layout.js";
import { isActorNote, sceneNotes } from "./label-specs.js";
import { PresentationContext } from "./presentation.js";
import { useScene } from "./scene-context.js";
import { Tag } from "./Tag.js";

const compactBelow = 17;

type LabelsProps = {
  world: WorldSpec;
  state: GameState;
  highlightIds: readonly string[];
  selectedEntityId: string | null;
  actor: { anchor: [number, number, number]; text: string };
};

export function Labels(props: LabelsProps): ReactElement {
  const { world, state, highlightIds, selectedEntityId, actor } = props;
  const { layout, pairing, overlay, reducedMotion } = useScene();
  const presentation = useContext(PresentationContext);
  const size = useThree((three) => three.size);
  const fit = useMemo(() => fitLayout(layout, size, fitMargin).zoom, [layout, size]);
  const zoom = presentation.view === "follow" ? Math.max(fit, followZoom) : fit;
  const notes = useMemo(
    () =>
      placeLabels(
        sceneNotes({
          world,
          state,
          layout,
          pairing,
          highlightIds,
          selectedEntityId,
          compact: fit < compactBelow,
          actor,
        }),
        zoom,
      ),
    [world, state, layout, pairing, highlightIds, selectedEntityId, zoom, fit, actor],
  );
  useFrame((three) => {
    const cleared = three.gl.autoClear;
    if (reducedMotion) three.gl.render(three.scene, three.camera);
    three.gl.autoClear = false;
    three.gl.clearDepth();
    three.gl.render(overlay, three.camera);
    three.gl.autoClear = cleared;
  }, 2);
  return createPortal(
    <group>
      {notes
        .filter((note) => presentation.labels && !isActorNote(note.id))
        .map((note) => (
          <Tag
            key={note.id}
            anchor={note.anchor}
            lines={note.lines}
            badge={note.badge}
            tone={note.tone}
            below={note.below}
            lift={note.lift}
            shift={note.shift}
          />
        ))}
    </group>,
    overlay,
  );
}
