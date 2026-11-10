import { createPortal, useFrame, useThree } from "@react-three/fiber";
import { useMemo, type ReactElement } from "react";
import type { GameState } from "../../contract/game.schema.js";
import type { WorldSpec } from "../../contract/world.schema.js";
import { fitMargin, fitView, followZoom } from "./camera-math.js";
import { placeLabels } from "./label-layout.js";
import { actorNoteId, sceneNotes } from "./label-specs.js";
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
  const { layout, pairing, overlay } = useScene();
  const size = useThree((three) => three.size);
  const fit = useMemo(() => fitView(layout.bounds, size, fitMargin).zoom, [layout.bounds, size]);
  const zoom = Math.max(fit, followZoom);
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
    three.gl.autoClear = false;
    three.gl.clearDepth();
    three.gl.render(overlay, three.camera);
    three.gl.autoClear = cleared;
  }, 2);
  return createPortal(
    <group>
      {notes
        .filter((note) => note.id !== actorNoteId)
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
