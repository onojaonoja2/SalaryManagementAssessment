import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/tests/**/*.test.ts"],
    env: {
      DATABASE_URL: "mysql://root:MaLow89246!@127.0.0.1:3306/salary_mgmt_test",
      JWT_SECRET: "test-secret",
      HR_USERNAME: "hrmanager",
      HR_PASSWORD: "hr@2026!",
      CORS_ORIGIN: "http://localhost:5173",
    },
  },
});
