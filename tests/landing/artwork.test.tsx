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
const { aiArtwork, aiLabel, appAssets, heroEngraving } =
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
    const known = new Set<string>([...aiSources, ...appAssets, heroEngraving.src]);
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

  it("the loader never renders an AI image", () => {
    const loader = renderToString(<Loader world={observatory} onReveal={noop} onDone={noop} />);
    for (const src of [...aiSources, heroEngraving.src]) expect(loader).not.toContain(src);
    expect(loader).not.toContain(aiLabel);
  });

  it("the hero's shaded drawing is labelled as an AI illustration where it appears", () => {
    const hero = renderToString(
      <Hero world={observatory} drawingVisible onOpenStudio={noop} onOpenExample={noop} />,
    );
    expect(hero).toContain(`href="${heroEngraving.src}"`);
    expect(hero).toContain(
      `aria-label="${aiLabel} of ${heroEngraving.subject.replace("'", "&#x27;")}"`,
    );
    expect(hero).toMatch(new RegExp(`data-ai-label="shading"[^>]*>${aiLabel}</span>`));
    for (const src of aiSources) expect(hero).not.toContain(src);
  });

  it("only the example world is shaded", () => {
    const other = { ...observatory, id: "another-world" };
    const hero = renderToString(
      <Hero world={other} drawingVisible onOpenStudio={noop} onOpenExample={noop} />,
    );
    expect(hero).not.toContain(heroEngraving.src);
    expect(hero).not.toContain(aiLabel);
  });
});
