import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Standalone static hosting build (Vercel / S3).
 * Outputs to ./dist with base "/" for customer.entx.app
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    base: "/",
    server: { port: 5173 },
    define: {
      "import.meta.env.VITE_API_PROXY_TARGET": JSON.stringify(
        env.VITE_API_PROXY_TARGET || ""
      ),
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
      rollupOptions: {
        input: "./index.html",
      },
    },
  };
});
