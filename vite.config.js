import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  const minify = mode !== "development";

  return {
  build: {
    emptyOutDir: false,
    lib: {
      entry: "src/legacy.ts",
      formats: ["iife"],
      name: "LegacyCssBundle",
    },
    minify: minify ? "oxc" : false,
    outDir: "dist",
    rollupOptions: {
      output: {
        entryFileNames: minify ? "legacy.min.js" : "legacy.js",
      },
    },
  },
  };
});
