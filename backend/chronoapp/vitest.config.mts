import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    env: {
      JWT_SECRET: "a".repeat(32),
      DATABASE_URL: "postgresql://user:pass@localhost:5432/test",
      RESEND_TOKEN: "b".repeat(32),
      APP_URL: "http://localhost:3000",
      UPSTASH_REDIS_REST_TOKEN: "c".repeat(32),
      UPSTASH_REDIS_REST_URL: "https://fake.upstash.io",
    },
  },
});
