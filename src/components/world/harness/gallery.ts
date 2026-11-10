import type { Theme } from "../../../contract/codes.js";
import type { WorldSpec } from "../../../contract/world.schema.js";
import { connection, entity, room, sampleWorld } from "../../../fixtures/build.js";
import { propSet } from "../props/index.js";

const perRoom = 3;
const spots = [
  { x: -0.62, y: 0, z: 0.62 },
  { x: 0.05, y: 0, z: -0.55 },
  { x: 0.7, y: 0, z: 0.5 },
];

export function propGallery(theme: Theme): WorldSpec {
  const names = Object.keys(propSet(theme).variants).slice(0, 12);
  const rooms = [room("a", "Bay A", 0, 0), room("b", "Bay B", 1, 0), room("c", "Bay C", 0, 1)];
  const last = room("d", "Bay D", 1, 1);
  return sampleWorld({
    id: `gallery-${theme}`,
    title: `${theme} props`,
    theme,
    prompt: "A gallery of every prop variant in this theme.",
    rooms: [...rooms, last],
    connections: [
      connection("ab", "a", "b"),
      connection("ac", "a", "c"),
      connection("bd", "b", "d"),
    ],
    entities: [
      ...names.map((name, index) =>
        entity({
          id: `prop-${String(index)}`,
          kind: "prop",
          label: name,
          roomId: [...rooms, last][Math.floor(index / perRoom)]?.id ?? "a",
          localPosition: spots[index % perRoom] ?? { x: 0, y: 0, z: 0 },
          presentation: { variant: name, glow: false },
        }),
      ),
      entity({
        id: "goal",
        kind: "goal",
        label: "Goal",
        roomId: "d",
        localPosition: { x: -0.7, y: 0, z: -0.7 },
      }),
    ],
    startRoomId: "a",
    goal: { id: "goal", roomId: "d", requires: { op: "true" } },
  });
}
