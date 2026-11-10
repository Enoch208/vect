import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { gsap } from "gsap";

const lenis = vi.hoisted(() => ({
  constructed: vi.fn(),
  destroy: vi.fn(),
  on: vi.fn(),
  stop: vi.fn(),
  start: vi.fn(),
  raf: vi.fn(),
}));

vi.mock("lenis", () => ({
  default: class {
    constructor() {
      lenis.constructed();
    }
    destroy = lenis.destroy;
    on = lenis.on;
    stop = lenis.stop;
    start = lenis.start;
    raf = lenis.raf;
  },
}));

const { Landing } = await import("../../src/components/landing/index.js");
const { startSmoothScroll } = await import("../../src/components/landing/use-smooth-scroll.js");
const { startReveal } = await import("../../src/components/landing/use-reveal.js");

const noop = () => undefined;

function textOf(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

afterEach(() => {
  vi.restoreAllMocks();
  lenis.constructed.mockClear();
  lenis.destroy.mockClear();
  lenis.stop.mockClear();
  lenis.start.mockClear();
});

describe("landing shell", () => {
  it("sections render their text without running animations", () => {
    const html = renderToString(
      <Landing onOpenStudio={noop} onOpenExample={noop} onPrompt={noop} />,
    );
    const text = textOf(html);
    expect(text).toContain("Vect");
    expect(text).toContain("Open the studio");
    expect(text).toContain("The AI game studio that plays what it builds");
    expect(text).toContain(
      "Describe a world. Vect builds it, plays it, finds what's broken and proves the fix.",
    );
    expect(text).toContain("Example world");
    expect(text).toContain("The part AI skips is the game.");
    expect(text).toContain("A scene that renders is not a level that works.");
    expect(text).toContain("Three.js");
    expect(text).toContain("Runs in any modern browser. No install, no account.");
    expect(html).not.toMatch(/opacity:\s*0|visibility:\s*hidden|translate\(0(px)?,\s*100%\)/);
  });

  it("unmount reverts every trigger", () => {
    const contextSpy = vi.spyOn(gsap, "context");
    const scroll = startSmoothScroll({ reducedMotion: false });
    const stopReveal = startReveal(null, { reducedMotion: false });
    const created = contextSpy.mock.results[0];
    if (created?.type !== "return") throw new Error("startReveal did not create a gsap context");
    const revert = vi.spyOn(created.value, "revert");
    stopReveal();
    scroll.stop();
    expect(revert).toHaveBeenCalledOnce();
    expect(lenis.constructed).toHaveBeenCalledOnce();
    expect(lenis.destroy).toHaveBeenCalledOnce();
  });

  it("a locked scroll stops lenis and an unlock starts it again", () => {
    const scroll = startSmoothScroll({ reducedMotion: false });
    scroll.setLocked(true);
    expect(lenis.stop).toHaveBeenCalledOnce();
    scroll.setLocked(false);
    expect(lenis.start).toHaveBeenCalledOnce();
    scroll.stop();
  });

  it("reduced motion starts neither smooth scroll nor reveals", () => {
    const contextSpy = vi.spyOn(gsap, "context");
    const scroll = startSmoothScroll({ reducedMotion: true });
    const stopReveal = startReveal(null, { reducedMotion: true });
    stopReveal();
    scroll.stop();
    expect(lenis.constructed).not.toHaveBeenCalled();
    expect(contextSpy).not.toHaveBeenCalled();
  });
});
