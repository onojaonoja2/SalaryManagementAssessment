import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/tests/**/*.test.ts"],
    env: {
      // Test fixtures only. In CI these come from the environment; the fallbacks
      // are OBVIOUSLY fake so no real secret ever lives in source control.
      DATABASE_URL:
        process.env.DATABASE_URL ?? "mysql://root:MaLow89246!@127.0.0.1:3306/salary_mgmt_test",
      JWT_SECRET: process.env.JWT_SECRET ?? "test-only-fake-secret",
      HR_USERNAME: "hrmanager",
      HR_PASSWORD: process.env.HR_PASSWORD ?? "test-only-fake-password",
      CORS_ORIGIN: "http://localhost:5173",
    },
  },
});
