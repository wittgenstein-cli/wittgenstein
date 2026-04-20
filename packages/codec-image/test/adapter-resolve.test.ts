import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { clearAdapterWeightCache } from "../src/adapters/adapter-resolve.js";
import { resolveMlpForScene } from "../src/adapters/adapter-resolve.js";
import type { ImageSceneSpec } from "../src/schema.js";

const minimalWeights = {
  version: "witt.image.adapter.mlp/v0.1",
  codebookSize: 8192,
  tokenGrid: [32, 32],
  inputDim: 128,
  hiddenDim: 4,
  w1: new Array(4 * 128).fill(0),
  b1: new Array(4).fill(0),
  w2: new Array(1024 * 4).fill(0),
  b2: new Array(1024).fill(0),
  family: "llamagen",
  codebook: "stub-codebook",
  codebookVersion: "v0",
};

describe("adapter-resolve", () => {
  afterEach(() => {
    delete process.env.WITTGENSTEIN_IMAGE_ADAPTER_PREFERRED_PATH;
    delete process.env.WITTGENSTEIN_IMAGE_ADAPTER_LEGACY_PATH;
    delete process.env.WITTGENSTEIN_IMAGE_ADAPTER_MLP_PATH;
    delete process.env.WITTGENSTEIN_IMAGE_ADAPTER_MLP_FALLBACK_PATH;
    clearAdapterWeightCache();
  });

  beforeEach(() => {
    delete process.env.WITTGENSTEIN_IMAGE_ADAPTER_PREFERRED_PATH;
    delete process.env.WITTGENSTEIN_IMAGE_ADAPTER_LEGACY_PATH;
    delete process.env.WITTGENSTEIN_IMAGE_ADAPTER_MLP_PATH;
    delete process.env.WITTGENSTEIN_IMAGE_ADAPTER_MLP_FALLBACK_PATH;
    clearAdapterWeightCache();
  });

  it("uses legacy when preferred path is invalid (compat: MLP + FALLBACK)", async () => {
    const dir = await mkdtemp(join(tmpdir(), "witt-adapter-"));
    const good = resolve(dir, "good.json");
    await writeFile(good, JSON.stringify(minimalWeights), "utf8");

    process.env.WITTGENSTEIN_IMAGE_ADAPTER_MLP_PATH = resolve(dir, "missing.json");
    process.env.WITTGENSTEIN_IMAGE_ADAPTER_MLP_FALLBACK_PATH = good;

    const spec: ImageSceneSpec = {
      schemaVersion: "witt.image.spec/v0.1",
      intent: "t",
      subject: "t",
      composition: {
        framing: "medium shot",
        camera: "neutral camera",
        depthPlan: ["foreground", "midground", "background"],
      },
      lighting: { mood: "n", key: "s" },
      style: { references: [], palette: ["black", "white"] },
      decoder: {
        family: "llamagen",
        codebook: "stub-codebook",
        codebookVersion: "v0",
        latentResolution: [32, 32],
      },
      constraints: { mustHave: [], negative: [] },
      renderHints: { detailLevel: "medium", tokenBudget: 1024, seed: null },
    };

    const logger = { debug: () => undefined, info: () => undefined, warn: () => undefined, error: () => undefined };
    const resolved = await resolveMlpForScene(spec, {
      runId: "t",
      runDir: dir,
      seed: null,
      outPath: join(dir, "o.png"),
      logger,
    });
    expect(resolved).not.toBeNull();
    expect(resolved?.sourcePath).toBe(good);
  });

  it("uses LEGACY when PREFERRED is invalid", async () => {
    const dir = await mkdtemp(join(tmpdir(), "witt-adapter-"));
    const good = resolve(dir, "good.json");
    await writeFile(good, JSON.stringify(minimalWeights), "utf8");

    process.env.WITTGENSTEIN_IMAGE_ADAPTER_PREFERRED_PATH = resolve(dir, "missing.json");
    process.env.WITTGENSTEIN_IMAGE_ADAPTER_LEGACY_PATH = good;

    const spec: ImageSceneSpec = {
      schemaVersion: "witt.image.spec/v0.1",
      intent: "t",
      subject: "t",
      composition: {
        framing: "medium shot",
        camera: "neutral camera",
        depthPlan: ["foreground", "midground", "background"],
      },
      lighting: { mood: "n", key: "s" },
      style: { references: [], palette: ["black", "white"] },
      decoder: {
        family: "llamagen",
        codebook: "stub-codebook",
        codebookVersion: "v0",
        latentResolution: [32, 32],
      },
      constraints: { mustHave: [], negative: [] },
      renderHints: { detailLevel: "medium", tokenBudget: 1024, seed: null },
    };

    const logger = { debug: () => undefined, info: () => undefined, warn: () => undefined, error: () => undefined };
    const resolved = await resolveMlpForScene(spec, {
      runId: "t",
      runDir: dir,
      seed: null,
      outPath: join(dir, "o.png"),
      logger,
    });
    expect(resolved).not.toBeNull();
    expect(resolved?.sourcePath).toBe(good);
  });
});
