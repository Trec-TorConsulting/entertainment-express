import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      react: path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom")
    },
    dedupe: ["react", "react-dom"]
  },
  base: "/assets/entertainment_express/dispatch/",
  server: { port: 5174 },
  build: {
    outDir: "../../entertainment_express/entertainment_express/public/dispatch",
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: "./src/main.tsx",
      output: {
        entryFileNames: "main.js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name].[ext]",
      },
    },
  },
});
