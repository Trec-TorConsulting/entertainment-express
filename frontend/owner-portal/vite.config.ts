import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@portal-kit": path.resolve(__dirname, "../portal-kit/src"),
      react: path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
      "react-router-dom": path.resolve(__dirname, "./node_modules/react-router-dom")
    },
    dedupe: ["react", "react-dom", "react-router-dom"]
  },
  base: "/assets/entertainment_express/owner/",
  build: {
    outDir: "../../entertainment_express/entertainment_express/public/owner",
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
