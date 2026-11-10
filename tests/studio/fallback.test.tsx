import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { SceneSurface } from "../../src/components/studio/SceneSurface.js";
import { createInitialState } from "../../src/domain/step-game.js";
import { observatory } from "../../src/fixtures/observatory.js";

describe("the scene fallback", () => {
  it("shows a labelled real topology when WebGL is unavailable", () => {
    const markup = renderToString(
      <SceneSurface
        world={observatory}
        state={createInitialState(observatory, observatory.seed)}
        actor="player"
        path={[]}
        highlightIds={[]}
        selectedEntityId={null}
        interactive
        reducedMotion
        onMoveTo={() => undefined}
        onInteract={() => undefined}
        onSelect={() => undefined}
      />,
    );
    expect(markup).toContain("3D unavailable");
    expect(markup).toContain("Blueprint mode");
    expect(markup).toContain(`Blueprint map of ${observatory.title}`);
    for (const room of observatory.rooms) expect(markup).toContain(room.label.toUpperCase());
    expect(markup).not.toContain("<canvas");
  });
});
