import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";

vi.mock("lenis", () => ({
  default: class {
    destroy = vi.fn();
    on = vi.fn();
    raf = vi.fn();
    stop = vi.fn();
    start = vi.fn();
  },
}));

const { Landing } = await import("../../src/components/landing/index.js");

const banned = [
  /guarantee/i,
  /bug[- ]free/i,
  /\boptimal\b/i,
  /revolutionary/i,
  /seamless/i,
  /powered by ai/i,
  /\b\d+(\.\d+)?\s?%/,
  /\b\d+x\s+faster\b/i,
];

function claimsIn(text: string): string[] {
  return banned.flatMap((pattern) => {
    const match = pattern.exec(text);
    return match === null ? [] : [match[0]];
  });
}

function landingText(): string {
  const noop = () => undefined;
  return renderToString(<Landing onOpenStudio={noop} onOpenExample={noop} onPrompt={noop} />)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
}

describe("landing copy", () => {
  it("the claim check catches a banned claim", () => {
    expect(claimsIn("A seamless, bug-free studio, 3x faster and 99% verified")).toEqual([
      "bug-free",
      "seamless",
      "99%",
      "3x faster",
    ]);
  });

  it("landing copy contains no banned claims", () => {
    expect(claimsIn(landingText())).toEqual([]);
  });

  it("every use of verified is the verifier's word, not a promise", () => {
    const uses = landingText().match(/[^.]*\bverified\b[^.]*/gi) ?? [];
    expect(uses.length).toBeGreaterThan(0);
    for (const sentence of uses) {
      expect(sentence).toMatch(/fresh run|replay|verdict|3D worlds|verifier/i);
    }
  });
});
