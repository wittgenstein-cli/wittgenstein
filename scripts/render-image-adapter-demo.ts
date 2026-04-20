#!/usr/bin/env npx tsx
/**
 * Renders a PNG using the image codec + MLP adapter (no LLM).
 *
 * Resolution order (same as runtime):
 *   WITTGENSTEIN_IMAGE_ADAPTER_PREFERRED_PATH → WITTGENSTEIN_IMAGE_ADAPTER_MLP_PATH
 *   then WITTGENSTEIN_IMAGE_ADAPTER_LEGACY_PATH → WITTGENSTEIN_IMAGE_ADAPTER_MLP_FALLBACK_PATH
 *
 * Usage:
 *   pnpm exec tsx scripts/render-image-adapter-demo.ts [out.png] [coastal|forest|meadow]
 */

import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { clearAdapterWeightCache } from "../packages/codec-image/src/adapters/adapter-resolve.js";
import { imageCodec } from "../packages/codec-image/src/codec.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const VARIANTS: Record<string, Record<string, unknown>> = {
  coastal: {
    intent:
      "Natural landscape photograph, coastal shoreline; soft daylight, wide composition, no people, no text.",
    subject: "coastal shoreline",
    stylePalette: ["teal", "sand", "sky"],
    lightingMood: "warm",
  },
  forest: {
    intent:
      "Natural landscape photograph, forest path; soft daylight, wide composition, no people, no text.",
    subject: "forest path",
    stylePalette: ["deep green", "moss", "mist"],
    lightingMood: "dappled",
  },
  meadow: {
    intent:
      "Natural landscape photograph, open meadow or hills; soft daylight, wide composition, no people, no text.",
    subject: "open meadow or hills",
    stylePalette: ["gold", "green", "blue"],
    lightingMood: "clear",
  },
};

function buildScene(variant: string): string {
  const v = VARIANTS[variant] ?? VARIANTS.coastal;
  const palette = (v.stylePalette as string[]) ?? ["teal", "sand", "sky"];
  const mood = (v.lightingMood as string) ?? "warm";
  return JSON.stringify({
    schemaVersion: "witt.image.spec/v0.1",
    intent: v.intent,
    subject: v.subject,
    composition: {
      framing: "wide",
      camera: "neutral camera",
      depthPlan: ["foreground", "midground", "background"],
    },
    lighting: { mood, key: "soft" },
    style: { references: [], palette: palette },
    decoder: {
      family: "llamagen",
      codebook: "stub-codebook",
      codebookVersion: "v0",
      latentResolution: [32, 32],
    },
    constraints: { mustHave: [], negative: ["text", "watermark"] },
    renderHints: { detailLevel: "medium", tokenBudget: 1024, seed: 42 },
  });
}

async function main(): Promise<void> {
  clearAdapterWeightCache();

  const argv = process.argv.slice(2);
  let outPath = resolve(root, "artifacts/demo/mlp-adapter-demo.png");
  let variant = "coastal";
  if (argv[0]?.match(/\.(png|jpg|jpeg)$/i)) {
    outPath = resolve(argv[0]);
    if (argv[1]) {
      variant = argv[1];
    }
  } else if (argv[0] && !argv[0].includes("/") && !argv[0].includes(".")) {
    variant = argv[0];
    if (argv[1]) {
      outPath = resolve(argv[1]);
    }
  } else if (argv[0]) {
    outPath = resolve(argv[0]);
  }

  if (!VARIANTS[variant]) {
    variant = "coastal";
  }

  await mkdir(dirname(outPath), { recursive: true });

  const sceneJson = buildScene(variant);
  const parsed = imageCodec.parse(sceneJson);
  if (!parsed.ok) {
    console.error(parsed);
    process.exit(1);
  }

  const result = await imageCodec.render(parsed.value, {
    runId: `demo-mlp-${variant}`,
    runDir: dirname(outPath),
    seed: 42,
    outPath,
    logger: {
      debug: console.debug,
      info: console.info,
      warn: console.warn,
      error: console.error,
    },
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        variant,
        preferredEnv: process.env.WITTGENSTEIN_IMAGE_ADAPTER_PREFERRED_PATH ?? process.env.WITTGENSTEIN_IMAGE_ADAPTER_MLP_PATH ?? null,
        legacyEnv: process.env.WITTGENSTEIN_IMAGE_ADAPTER_LEGACY_PATH ?? process.env.WITTGENSTEIN_IMAGE_ADAPTER_MLP_FALLBACK_PATH ?? null,
        artifactPath: result.artifactPath,
        bytes: result.bytes,
      },
      null,
      2,
    ),
  );
}

void main();
