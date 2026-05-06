import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["@dimforge/rapier3d-compat"],
  },
  build: {
    target: "esnext",
    sourcemap: true,
  },
  server: {
    port: 5173,
    host: true,
  },
});
