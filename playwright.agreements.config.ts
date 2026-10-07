import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "external-agreements.spec.ts",
  workers: 1,
  use: { baseURL: "http://127.0.0.1:3100" },
  expect: { timeout: 15000 },
});
