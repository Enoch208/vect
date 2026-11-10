import type { Theme } from "../../../contract/codes.js";
import type { WorldEntity } from "../../../contract/world.schema.js";
import type { Part, PropSet } from "../parts.js";
import { castleProps } from "./castle.js";
import { observatoryProps } from "./observatory.js";
import { sharedProps } from "./shared.js";
import { templeProps } from "./temple.js";

const themed: Record<Theme, PropSet> = {
  observatory: observatoryProps,
  temple: templeProps,
  castle: castleProps,
};

export function propSet(theme: Theme): PropSet {
  const own = themed[theme];
  return {
    variants: { ...sharedProps.variants, ...own.variants },
    keywords: { ...sharedProps.keywords, ...own.keywords },
  };
}

export function propVariants(theme: Theme): string[] {
  const own = Object.keys(themed[theme].variants);
  return own.length > 0 ? own : Object.keys(sharedProps.variants);
}

export function propVariant(theme: Theme, entity: WorldEntity, index: number): string {
  const set = propSet(theme);
  const asked = entity.presentation.variant;
  if (asked !== null && asked in set.variants) return asked;
  const label = entity.label.toLowerCase();
  const matched = Object.entries(set.keywords).find(([, words]) =>
    words.some((word) => label.includes(word)),
  );
  if (matched !== undefined && matched[0] in set.variants) return matched[0];
  const cycle = propVariants(theme);
  return cycle[index % cycle.length] ?? "crate";
}

export function propParts(theme: Theme, entity: WorldEntity, index: number): readonly Part[] {
  return propSet(theme).variants[propVariant(theme, entity, index)] ?? [];
}
