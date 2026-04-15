import { defineConfig } from "tsdown";

export default defineConfig([
  {
    deps: { alwaysBundle: [/.*/] },
    entry: ["src/index.ts", "src/healthcheck.ts"],
    external: [],
    minify: true,
    sourcemap: true,
    platform: "node",
  },
]);
