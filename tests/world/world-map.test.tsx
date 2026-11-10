import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { GameAction, GameState } from "../../src/contract/game.schema.js";
import type { WorldSpec } from "../../src/contract/world.schema.js";
import { WorldMap, canUseWebGL, layoutWorld } from "../../src/components/world/map.js";
import { wallBoxes } from "../../src/components/world/map-geometry.js";
import { createInitialState, stepGame } from "../../src/domain/step-game.js";
import { connection, derive, entity, flag } from "../../src/fixtures/build.js";
import { observatory, observatoryKeyBehindDoor } from "../../src/fixtures/observatory.js";
import { tenRoomTemple } from "../../src/fixtures/suite-large.js";

type Attributes = Record<string, string>;

const toLibrary: GameAction = { type: "MOVE_TO", roomId: "library" };
const takeKey: GameAction = { type: "INTERACT", entityId: "key1" };
const toControl: GameAction = { type: "MOVE_TO", roomId: "control" };
const flipSwitch: GameAction = { type: "INTERACT", entityId: "switch1" };

function play(world: WorldSpec, actions: GameAction[]): GameState {
  return actions.reduce(
    (state, action) => stepGame(world, state, action).state,
    createInitialState(world, world.seed),
  );
}

function draw(world: WorldSpec, actions: GameAction[] = [], highlightIds: string[] = []): string {
  return renderToString(
    <WorldMap world={world} state={play(world, actions)} path={[]} highlightIds={highlightIds} />,
  );
}

function groups(html: string): Attributes[] {
  return [...html.matchAll(/<g\b([^>]*)>/g)].map((group) =>
    Object.fromEntries(
      [...(group[1] ?? "").matchAll(/([\w-]+)="([^"]*)"/g)].map((pair) => [
        pair[1] ?? "",
        pair[2] ?? "",
      ]),
    ),
  );
}

function gate(html: string, connectionId: string): Attributes | undefined {
  return groups(html).find(
    (group) => group["data-connection-id"] === connectionId && group["data-gate"] !== undefined,
  );
}

function entityGroup(html: string, entityId: string): Attributes | undefined {
  return groups(html).find(
    (group) => group["data-entity-id"] === entityId && group["data-kind"] !== undefined,
  );
}

function lettering(html: string): string {
  return [...html.matchAll(/<text\b[^>]*>([^<]*)<\/text>/g)]
    .map((found) => found[1] ?? "")
    .join(" ");
}

function count(html: string, text: string): number {
  return html.split(text).length - 1;
}

describe("blueprint map", () => {
  it("renders every room label and marks closed gates", () => {
    const html = draw(observatory);
    for (const room of observatory.rooms) {
      expect(html).toContain(`data-room-id="${room.id}"`);
      expect(html).toContain(`>${room.label.toUpperCase()}</text>`);
    }
    expect(gate(html, "c2")?.["data-gate"]).toBe("closed");
    expect(gate(html, "c3")?.["data-gate"]).toBe("closed");
    expect(gate(html, "c1")).toBeUndefined();
    expect(html).toContain('role="img"');
    expect(html).toContain(observatory.title);
  });

  it("leaves a real gap in the wall at every opening and closes every corner", () => {
    for (const room of layoutWorld(tenRoomTemple).rooms) {
      const walls = wallBoxes(room);
      const covers = (x: number, z: number) =>
        walls.some(
          (wall) => x > wall.x && x < wall.x + wall.w && z > wall.z && z < wall.z + wall.h,
        );
      const half = room.size / 2;
      for (const opening of room.openings) {
        expect(covers(opening.point[0], opening.point[1]), opening.connectionId).toBe(false);
      }
      for (const [dx, dz] of [
        [-half, -half],
        [half, -half],
        [-half, half],
        [half, half],
      ] as const) {
        expect(covers(room.center[0] + dx, room.center[1] + dz), room.id).toBe(true);
      }
      expect(walls).toHaveLength(4 + room.openings.length);
    }
  });

  it("marks a closed gate with a lock and a passed gate with a tick, never colour alone", () => {
    const start = draw(observatory);
    expect(count(start, 'data-mark="lock"')).toBe(2);
    expect(count(start, 'data-mark="tick"')).toBe(0);
    const through = draw(observatory, [toLibrary, takeKey, toControl]);
    expect(count(through, 'data-mark="lock"')).toBe(1);
    expect(count(through, 'data-mark="tick"')).toBe(1);
  });

  it("opens a gate only when the engine says so", () => {
    expect(gate(draw(observatory, [toLibrary]), "c2")?.["data-gate"]).toBe("closed");
    expect(gate(draw(observatory, [toLibrary, takeKey]), "c2")?.["data-gate"]).toBe("open");
    const through = draw(observatory, [toLibrary, takeKey, toControl]);
    expect(gate(through, "c2")?.["data-gate"]).toBe("passed");
    expect(gate(through, "c3")?.["data-gate"]).toBe("closed");
  });

  it("keeps the twin's door closed however the player tries", () => {
    const html = draw(observatoryKeyBehindDoor, [toLibrary, takeKey, toControl, toControl]);
    expect(gate(html, "c2")?.["data-gate"]).toBe("closed");
    expect(entityGroup(html, "key1")).toBeDefined();
  });

  it("stops drawing a key once it is collected", () => {
    expect(entityGroup(draw(observatory, [toLibrary]), "key1")).toBeDefined();
    const html = draw(observatory, [toLibrary, takeKey]);
    expect(html).not.toContain('data-entity-id="key1"');
  });

  it("fades a used chest to an outline instead of drawing it solid", () => {
    const stocked = derive(observatory, {
      entities: [
        ...observatory.entities,
        entity({
          id: "chest1",
          kind: "chest",
          label: "Supply Chest",
          roomId: "entrance",
          localPosition: { x: -0.5, y: 0, z: 0.5 },
        }),
      ],
    });
    expect(entityGroup(draw(stocked), "chest1")?.["data-used"]).toBeUndefined();
    const opened = draw(stocked, [{ type: "INTERACT", entityId: "chest1" }]);
    expect(entityGroup(opened, "chest1")?.["data-used"]).toBe("true");
  });

  it("throws a switch only when its flag is set", () => {
    const before = draw(observatory, [toLibrary, takeKey, toControl]);
    expect(entityGroup(before, "switch1")?.["data-switch"]).toBe("off");
    const after = draw(observatory, [toLibrary, takeKey, toControl, flipSwitch]);
    expect(entityGroup(after, "switch1")?.["data-switch"]).toBe("on");
    expect(gate(after, "c3")?.["data-gate"]).toBe("open");
  });

  it("pairs each key and switch with the gate it opens by a shared tag", () => {
    const html = draw(observatory);
    expect(count(html, 'data-tag="K1"')).toBe(2);
    expect(count(html, 'data-tag="S1"')).toBe(2);
  });

  it("highlights the listed gate and labels it", () => {
    expect(gate(draw(observatoryKeyBehindDoor), "c2")?.["data-highlight"]).toBeUndefined();
    const html = draw(observatoryKeyBehindDoor, [], ["door1"]);
    expect(gate(html, "c2")?.["data-highlight"]).toBe("true");
    expect(gate(html, "c3")?.["data-highlight"]).toBeUndefined();
    expect(html).toContain("CONTROL ROOM DOOR");
  });

  it("highlights rooms and entities by id", () => {
    const html = draw(observatory, [], ["library", "switch1"]);
    const rooms = groups(html).filter((group) => group["data-room-id"] !== undefined);
    expect(rooms.filter((group) => group["data-highlight"] === "true")).toHaveLength(1);
    expect(entityGroup(html, "switch1")?.["data-highlight"]).toBe("true");
    expect(entityGroup(html, "key1")?.["data-highlight"]).toBeUndefined();
  });

  it("puts the actor marker in the engine's current room", () => {
    expect(draw(observatory)).toContain('data-actor-room="entrance"');
    const blocked = draw(observatoryKeyBehindDoor, [toLibrary, toControl]);
    expect(blocked).toContain('data-actor-room="library"');
  });

  it("draws the path only when it has two or more points", () => {
    const state = play(observatory, [toLibrary]);
    const trail = (path: Array<{ x: number; z: number }>) =>
      renderToString(<WorldMap world={observatory} state={state} path={path} highlightIds={[]} />);
    expect(trail([{ x: 0, z: 0 }])).not.toContain("<polyline");
    expect(
      trail([
        { x: 0, z: 0 },
        { x: 1, z: 0 },
      ]),
    ).toContain('points="0,0 14,0"');
  });

  it("draws a portal pair as two pads sharing one tag", () => {
    const linked = derive(observatory, {
      connections: [
        ...observatory.connections,
        connection("c4", "entrance", "control", flag("portal-enabled")),
      ],
    });
    const html = draw(linked);
    expect(gate(html, "c4")?.["data-gate"]).toBe("closed");
    expect(count(html, 'data-pad="P1"')).toBe(2);
    const opened = draw(linked, [toLibrary, takeKey, toControl, flipSwitch]);
    expect(gate(opened, "c4")?.["data-gate"]).toBe("open");
  });

  it("renders the largest world with all ten room labels", () => {
    const html = draw(tenRoomTemple, [
      { type: "MOVE_TO", roomId: "west" },
      { type: "MOVE_TO", roomId: "library" },
      { type: "INTERACT", entityId: "bronze" },
    ]);
    for (const room of tenRoomTemple.rooms) {
      expect(lettering(html)).toContain(room.label.toUpperCase());
    }
    expect(html).toContain(">NORTH</text>");
    expect(groups(html).filter((group) => group["data-room-id"] !== undefined)).toHaveLength(10);
    expect(gate(html, "c2")?.["data-gate"]).toBe("open");
    expect(gate(html, "c6")?.["data-gate"]).toBe("closed");
  });
});

describe("map module", () => {
  const worldDir = fileURLToPath(new URL("../../src/components/world/", import.meta.url));

  function fileFor(name: string): string {
    return existsSync(`${worldDir}${name}.tsx`) ? `${name}.tsx` : `${name}.ts`;
  }

  function reachableFrom(entry: string): string[] {
    const seen = new Set<string>();
    const queue = [entry];
    for (let next = queue.pop(); next !== undefined; next = queue.pop()) {
      if (seen.has(next)) continue;
      seen.add(next);
      const source = readFileSync(`${worldDir}${next}`, "utf8");
      for (const found of source.matchAll(/from "\.\/([\w-]+)\.js"/g)) {
        queue.push(fileFor(found[1] ?? ""));
      }
    }
    return [...seen];
  }

  it("stays three-free through everything it imports", () => {
    const mapFiles = readdirSync(worldDir).filter((file) => /^map-[\w-]+\.tsx?$/.test(file));
    const reachable = reachableFrom("map.ts");
    expect(reachable).toEqual(expect.arrayContaining(["WorldMap.tsx", "webgl.ts", "layout.ts"]));
    expect(mapFiles.length).toBeGreaterThan(0);
    for (const file of new Set([...reachable, ...mapFiles])) {
      const source = readFileSync(`${worldDir}${file}`, "utf8");
      expect(source, file).not.toContain('from "three');
      expect(source, file).not.toContain("@react-three");
      expect(source, file).not.toContain("postprocessing");
    }
  });

  it("reports no WebGL where there is no document", () => {
    expect(canUseWebGL()).toBe(false);
  });
});
