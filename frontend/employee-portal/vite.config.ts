import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@portal-kit": path.resolve(__dirname, "../portal-kit/src")
    },
    dedupe: ["react", "react-dom", "react-router", "react-router-dom", "framer-motion"]
  },
  base: "/assets/entertainment_express/employee/",
  build: {
    outDir: "../../entertainment_express/entertainment_express/public/employee",
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: "./src/main.tsx",
      output: {
        entryFileNames: "main.js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name].[ext]"
      }
    }
  }
});
