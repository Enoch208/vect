import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { SpecSheet } from "../../src/components/landing/primitives/SpecSheet.js";
import { Sequence } from "../../src/components/landing/primitives/Sequence.js";
import { Accordion, nextOpenRow } from "../../src/components/landing/primitives/Accordion.js";

function textOf(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function count(html: string, needle: string): number {
  return html.split(needle).length - 1;
}

describe("landing primitives", () => {
  it("SpecSheet renders keys and values with the separator", () => {
    const html = renderToString(
      <SpecSheet
        title="Welcome to Vect"
        rows={[
          { key: "Type", value: "AI game studio" },
          { key: "Engine", value: "vect-engine-1" },
        ]}
      />,
    );
    const text = textOf(html);
    expect(text).toContain("Welcome to Vect");
    expect(text).toMatch(/Type : AI game studio/);
    expect(text).toMatch(/Engine : vect-engine-1/);
    expect(count(html, "<dt")).toBe(2);
    expect(count(html, "<dd")).toBe(2);
  });

  it("Sequence marks done items", () => {
    const html = renderToString(
      <Sequence
        items={[
          { index: 1, label: "Load world observatory-01", done: true },
          { index: 2, label: "Hash 3fa9c1", done: true },
          { index: 3, label: "Solve", done: false },
        ]}
      />,
    );
    expect(count(html, 'data-done="true"')).toBe(2);
    expect(count(html, 'data-done="false"')).toBe(1);
    expect(textOf(html)).toMatch(/001 Load world observatory-01 002 Hash 3fa9c1 003 Solve/);
  });

  it("Accordion opens one row at a time", () => {
    const items = [
      { title: "Indie developers", body: "Ship a level that works." },
      { title: "Game designers", body: "Test the logic first." },
      { title: "Level designers", body: "Find the dead end." },
    ];
    const html = renderToString(<Accordion items={items} defaultOpen={1} />);
    expect(count(html, 'aria-expanded="true"')).toBe(1);
    expect(count(html, 'aria-expanded="false"')).toBe(2);
    expect(html.indexOf('aria-expanded="true"')).toBeGreaterThan(html.indexOf("Indie developers"));
    expect(html.indexOf('aria-expanded="true"')).toBeLessThan(html.indexOf("Level designers"));
    expect(nextOpenRow(1, 2)).toBe(2);
    expect(nextOpenRow(2, 2)).toBeNull();
    expect(nextOpenRow(null, 0)).toBe(0);
  });

  it("Accordion keeps every body in the markup so closed rows stay readable to search", () => {
    const html = renderToString(
      <Accordion
        items={[
          { title: "One", body: "First body." },
          { title: "Two", body: "Second body." },
        ]}
      />,
    );
    expect(count(html, 'aria-expanded="true"')).toBe(0);
    expect(textOf(html)).toContain("Second body.");
  });
});
