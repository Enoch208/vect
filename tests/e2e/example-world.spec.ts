import { expect, test } from "@playwright/test";
import {
  collectPageErrors,
  openExampleWorld,
  playObservatoryToWin,
  runAgentTest,
} from "./journey.js";

test.describe("the example world, with no model and no account", () => {
  test("a person plays it to the goal and the agent verifies it", async ({ page }) => {
    const errors = collectPageErrors(page);
    await openExampleWorld(page);
    await playObservatoryToWin(page);
    const agentTest = await runAgentTest(page);
    await expect(agentTest.locator('header [data-status="VERIFIED"]')).toBeVisible({
      timeout: 60_000,
    });
    await expect(agentTest.locator('section[aria-label="Dependency check"]')).toBeVisible();
    await expect(agentTest.locator('section[aria-label="Agent run"]')).toBeVisible();
    expect(errors).toEqual([]);
  });
});
