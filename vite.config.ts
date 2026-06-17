import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { obfuscator } from "rollup-obfuscator";
import zipPack from "vite-plugin-zip-pack";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Obfuscation and ZIP packaging are applied exclusively in production builds
    // to avoid slowing down local development HMR cycles
    ...(mode === "production"
      ? [
        obfuscator({
          options: {
            // Flattens the control flow into a state-machine maze to defeat static analysis
            controlFlowFlattening: true,
            controlFlowFlatteningThreshold: 0.75,

            // Injects unreachable dead code branches to mislead reverse engineers
            deadCodeInjection: true,
            deadCodeInjectionThreshold: 0.4,

            // Moves all string literals into a hidden runtime array
            stringArray: true,
            // Encodes every string in the array as Base64 at compile time
            stringArrayEncoding: ["base64"],
            stringArrayThreshold: 0.75,

            // Splits long strings (including salts) into chunks across the bundle
            splitStrings: true,
            splitStringsChunkLength: 5,

            // CRITICAL: Must remain false to preserve window.ytgame SDK entry points
            renameGlobals: false,
          }
        }),
        zipPack({ outDir: "dist-zip", outFileName: "plates-game.zip" }),
      ]
      : []),
  ],
  build: {
    // Source maps disabled in production — never expose the original source to attackers
    sourcemap: false,
    outDir: "dist",
    target: "es2020",
  },
}));