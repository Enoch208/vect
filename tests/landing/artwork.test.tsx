import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { observatory } from "../../src/fixtures/observatory.js";

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
const { Hero } = await import("../../src/components/landing/sections/Hero.js");
const { Loader } = await import("../../src/components/landing/sections/Loader.js");
const { aiArtwork, aiLabel, appAssets } =
  await import("../../src/components/landing/landing-assets.js");

const noop = () => undefined;
const aiSources = Object.values(aiArtwork).map((art) => art.src);

function landingHtml(): string {
  return renderToString(<Landing onOpenStudio={noop} onOpenExample={noop} onPrompt={noop} />);
}

function assetsIn(html: string): string[] {
  return [...html.matchAll(/\/landing\/[\w.-]+\.(?:webp|png|jpe?g|avif|svg)/g)].map(
    (match) => match[0],
  );
}

function imageTags(html: string, src: string): string[] {
  return [...html.matchAll(/<img\b[^>]*>/g)]
    .map((match) => match[0])
    .filter((tag) => tag.includes(`src="${src}"`));
}

describe("landing artwork", () => {
  it("every image on the page is a registered asset", () => {
    const known = new Set<string>([...aiSources, ...appAssets]);
    const unknown = assetsIn(landingHtml()).filter((src) => !known.has(src));
    expect(unknown).toEqual([]);
  });

  it("no AI image is rendered without its label", () => {
    const html = landingHtml();
    let rendered = 0;
    for (const src of aiSources) {
      const tags = imageTags(html, src);
      rendered += tags.length;
      expect(assetsIn(html).filter((found) => found === src)).toHaveLength(tags.length);
      for (const tag of tags) expect(tag).toMatch(/alt="AI-generated illustration of /);
    }
    expect(rendered).toBeGreaterThan(0);
    const labels = html.split(`data-ai-label="">${aiLabel}`).length - 1;
    expect(labels).toBe(rendered);
  });

  it("the loader and the hero never render an AI image", () => {
    const hero = renderToString(
      <Hero world={observatory} drawingVisible onOpenStudio={noop} onOpenExample={noop} />,
    );
    const loader = renderToString(<Loader world={observatory} onReveal={noop} onDone={noop} />);
    for (const html of [hero, loader]) {
      for (const src of aiSources) expect(html).not.toContain(src);
      expect(html).not.toContain(aiLabel);
    }
  });
});
