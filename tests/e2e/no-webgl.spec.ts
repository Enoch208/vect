import { expect, test } from "@playwright/test";
import { openExampleWorld, playObservatoryToWin } from "./journey.js";

test.use({ launchOptions: { args: ["--disable-webgl", "--disable-3d-apis"] } });

test("without WebGL, the map fallback still lets a person win", async ({ page }) => {
  await openExampleWorld(page);
  await expect(page.locator('[data-gate="closed"]').first()).toBeVisible();
  await playObservatoryToWin(page);
});
