import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { chromium } from "@playwright/test";

type ShotOptions = {
  path: string;
  out: string;
  width: number;
  height: number;
  waitMs: number;
};

const baseUrl = process.env["SHOT_BASE_URL"] ?? "http://127.0.0.1:5200";
const usage = "usage: pnpm shot <path> <out.png> [--size 1366x768] [--wait 8000]\n";

function flagValue(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

function parseArgs(argv: string[]): ShotOptions {
  const [path, out, ...rest] = argv;
  if (path === undefined || out === undefined) {
    process.stderr.write(usage);
    process.exit(2);
  }
  const [width = 1366, height = 768] = (flagValue(rest, "--size") ?? "1366x768")
    .split("x")
    .map(Number);
  return {
    path,
    out: resolve(out),
    width,
    height,
    waitMs: Number(flagValue(rest, "--wait") ?? 8000),
  };
}

async function capture(options: ShotOptions): Promise<string[]> {
  const browser = await chromium.launch({
    args: ["--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
  });
  const page = await browser.newPage({
    viewport: { width: options.width, height: options.height },
    deviceScaleFactor: 1,
  });
  const problems: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      problems.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
  await page.goto(new URL(options.path, baseUrl).toString(), { waitUntil: "load" });
  const ready =
    options.waitMs > 0 &&
    (await page.waitForSelector("[data-scene-ready]", { timeout: options.waitMs }).then(
      () => true,
      () => false,
    ));
  await page.waitForTimeout(500);
  mkdirSync(dirname(options.out), { recursive: true });
  await page.screenshot({ path: options.out });
  await browser.close();
  return [`ready marker: ${ready ? "seen" : "not seen"}`, ...problems];
}

const options = parseArgs(process.argv.slice(2));
const report = await capture(options);
process.stdout.write(`${options.out}\n${report.join("\n")}\n`);
