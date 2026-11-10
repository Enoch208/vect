import type { WorldSpec } from "../../../contract/world.schema.js";
import { Button } from "../primitives/Buttons.js";
import { display } from "../primitives/type.js";
import { BuiltWith } from "./BuiltWith.js";

type StatementProps = { world: WorldSpec; onOpenExample: () => void };

export function Statement({ world, onOpenExample }: StatementProps) {
  return (
    <section
      aria-labelledby="statement-title"
      className="grid grid-cols-1 border-b border-rule lg:grid-cols-2"
    >
      <div className="relative flex items-center justify-center overflow-hidden border-rule max-lg:border-b lg:min-h-[calc(var(--spacing)*76.8)] lg:border-r">
        <img
          src="/landing/observatory-three-quarter.png"
          alt={`${world.title}, the example world as a model you can walk`}
          className="h-full max-h-[calc(var(--spacing)*76.8)] w-full object-contain"
        />
      </div>
      <div className="flex flex-col">
        <div className="flex flex-col gap-[calc(var(--spacing)*3.2)] p-[12px] pt-[calc(var(--spacing)*4)] lg:p-3 lg:pt-[calc(var(--spacing)*6)] lg:pl-[calc(var(--spacing)*15.2)]">
          <h2 id="statement-title" data-reveal="" className={`${display.m} max-w-[18ch]`}>
            The part AI skips is the game. A scene that renders is not a level that works.
          </h2>
          <div>
            <Button variant="outline" onClick={onOpenExample}>
              Open example world
            </Button>
          </div>
        </div>
        <div className="flex-1" />
        <BuiltWith />
      </div>
    </section>
  );
}
