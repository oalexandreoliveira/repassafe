import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  use: { baseURL: "http://127.0.0.1:3000" },
  webServer: {
    command: "pnpm dev",
    env: {
      APP_ENV: "test",
      MONITORING_TOKEN: "test-monitoring-token-at-least-32-characters",
      NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3000",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-publishable-key",
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      RATE_LIMIT_PEPPER: "test-rate-limit-pepper-at-least-32-characters",
      SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
    },
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true,
  },
});
