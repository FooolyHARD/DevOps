import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
    css: true,
    globals: true,
    coverage: {
      reporter: ["text", "html", "json"],
      lines: 90,
      statements: 90,
      functions: 90,
      branches: 90,
    },
  },
});
