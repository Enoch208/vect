import { expect, type Page } from "@playwright/test";

export const observatoryRun = [
  { button: /^Library →/i, refused: false },
  { button: /^Control Room →/i, refused: true },
  { button: /^Access Key$/i, refused: false },
  { button: /^Control Room →/i, refused: false },
  { button: /^Portal Switch$/i, refused: false },
  { button: /^Portal Chamber →/i, refused: false },
] as const;

export function collectPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

export async function openExampleWorld(page: Page) {
  await page.goto("/");
  await page
    .getByRole("button", { name: /open example world/i })
    .or(page.getByRole("link", { name: /open example world/i }))
    .first()
    .click();
  await expect(page.locator('main [data-status="EXAMPLE"]').first()).toBeVisible();
  await expect(page.locator('main [data-status="AI_GENERATED"]')).toHaveCount(0);
}

export async function playObservatoryToWin(page: Page) {
  await page.locator("main").getByRole("button", { name: "Play", exact: true }).first().click();
  const controls = page.locator('section[aria-label="Room controls"]');
  await expect(controls).toBeVisible();
  for (const step of observatoryRun) {
    await controls.getByRole("button", { name: step.button }).first().click();
    const refusal = page.getByText(/^Refused:/).first();
    if (step.refused) await expect(refusal).toContainText(/locked/i);
  }
  await expect(page.getByText("Objective complete")).toBeVisible();
}

export async function runAgentTest(page: Page) {
  await page.locator("main").getByRole("button", { name: "Test", exact: true }).first().click();
  const agentTest = page.locator('section[aria-label="Agent test"]');
  await expect(agentTest).toBeVisible();
  return agentTest;
}
