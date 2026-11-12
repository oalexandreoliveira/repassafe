import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  test: {
    include:
      mode === "postgrest"
        ? ["tests/postgrest/*.postgrest.ts"]
        : ["tests/**/*.test.{ts,tsx}"],
    environment: mode === "postgrest" ? "node" : "jsdom",
    setupFiles: ["./tests/setup.ts"],
    exclude: ["tests/e2e/**", "node_modules/**"],
  },
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
}));
