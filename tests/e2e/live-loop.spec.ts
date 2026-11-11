import { expect, test } from "@playwright/test";
import { healthResponseSchema } from "../../src/contract/api.schema.js";
import {
  collectPageErrors,
  openExampleWorld,
  playObservatoryToWin,
  runAgentTest,
} from "./journey.js";

const breakingEdit = "Put the access key inside the room it unlocks.";

test.describe("the live loop: break, fail, repair, prove", () => {
  test.beforeEach(async ({ request }) => {
    const health = healthResponseSchema.parse(await (await request.get("/api/health")).json());
    test.skip(
      !health.modelConfigured,
      "No model is configured on this server, so live edits and repairs are unavailable.",
    );
  });

  test("an edit breaks the world, the agent fails it, and a repair is verified", async ({
    page,
  }) => {
    test.setTimeout(240_000);
    const errors = collectPageErrors(page);
    await openExampleWorld(page);
    await playObservatoryToWin(page);

    await page.locator("main").getByRole("button", { name: "Edit", exact: true }).first().click();
    const editPanel = page.locator('aside[aria-label="Edit world"]');
    await page.locator("#edit-instruction").fill(breakingEdit);
    await editPanel.getByRole("button", { name: "Preview edit" }).click();
    const apply = editPanel.getByRole("button", { name: "Apply revision" });
    const refusal = editPanel.getByRole("alert");
    await expect(apply.or(refusal).first()).toBeVisible({ timeout: 60_000 });
    if (await refusal.isVisible()) {
      throw new Error(`The edit was refused by the server: ${await refusal.innerText()}`);
    }
    await expect(editPanel).toContainText("Unreachable");
    await apply.click();
    await expect(page.locator('main [data-status="DRAFT"]').first()).toBeVisible();

    const agentTest = await runAgentTest(page);
    await expect(agentTest.locator('header [data-status="FAILED"]')).toBeVisible({
      timeout: 60_000,
    });
    await expect(agentTest.locator('section[aria-label="Findings"]')).toContainText(
      "CIRCULAR_DEPENDENCY",
    );

    await agentTest.getByRole("button", { name: "Auto-fix" }).click();
    const commit = page
      .locator('section[aria-label="Repair"]')
      .getByRole("button", { name: "Commit repaired version" });
    await expect(commit).toBeVisible({ timeout: 120_000 });
    await commit.click();

    const columns = page.getByTestId("proof-columns");
    await expect(columns).toBeVisible();
    await expect(
      columns.locator('[aria-label="Before"] [data-status="FAILED"]').first(),
    ).toBeVisible();
    await expect(
      columns.locator('[aria-label="After"] [data-status="VERIFIED"]').first(),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });
});
