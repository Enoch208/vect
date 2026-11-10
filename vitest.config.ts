import { defineConfig } from "vitest/config";

const lane = (name: string) => ({
  test: {
    name,
    include: [`tests/${name}/**/*.test.ts`, `tests/${name}/**/*.test.tsx`],
    environment: "node",
  },
});

export default defineConfig({
  test: {
    projects: [lane("engine"), lane("ai"), lane("world"), lane("studio")],
  },
});
