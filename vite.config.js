import { defineConfig } from "vite";

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: "src/legacy.js",
      formats: ["iife"],
      name: "LegacyCssBundle",
    },
    minify: "oxc",
    outDir: "dist",
    rollupOptions: {
      output: {
        entryFileNames: "legacy.min.js",
      },
    },
  },
});
