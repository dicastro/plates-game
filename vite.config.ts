import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { obfuscator } from "rollup-obfuscator";

const OBFUSCATOR_PLUGIN = obfuscator({
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

    // Safe to enable — no external SDK entry-point contract to preserve.
    renameGlobals: true,
  }
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const isRealBackend = mode === "production" || mode === "cf-staging";
  const isProduction = mode === "production";

  if (isRealBackend && env.VITE_TIME_STRATEGY === "FAST_FORWARD") {
    throw new Error("FAST_FORWARD time strategy is forbidden in production builds.");
  }

  const FORCED_DELAY = Number(env.VITE_SPLASH_FORCED_DELAY_MS ?? 0);
  if (isRealBackend && FORCED_DELAY > 0) {
    throw new Error("VITE_SPLASH_FORCED_DELAY_MS must be 0 (or unset) in production builds.");
  }

  return {
    plugins: [
      react(),
      isProduction && OBFUSCATOR_PLUGIN,
    ],
    build: {
      // Source maps disabled in production — never expose the original source to attackers
      sourcemap: false,
      outDir: "dist",
      target: "es2020",
    },
  }
});