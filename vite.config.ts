import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { apiDevServer } from "./vite-api-dev.js";

export default defineConfig(({ mode }) => {
  for (const [key, value] of Object.entries(loadEnv(mode, import.meta.dirname, ""))) {
    process.env[key] ??= value;
  }
  return {
    plugins: [react(), tailwindcss(), apiDevServer()],
    server: {
      host: "127.0.0.1",
      port: 5200,
      strictPort: true,
    },
    preview: {
      host: "127.0.0.1",
      port: 5201,
      strictPort: true,
    },
    worker: {
      format: "es",
    },
    build: {
      outDir: "dist",
      sourcemap: true,
    },
  };
});
