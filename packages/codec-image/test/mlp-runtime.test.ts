import { describe, expect, it } from "vitest";
import {
  forwardMlp,
  logitsToTokens,
  sceneSpecToFeatureVector,
  type MlpAdapterWeights,
} from "../src/adapters/mlp-runtime.js";
import type { ImageSceneSpec } from "../src/schema.js";

describe("mlp-runtime", () => {
  it("matches Python weight layout for one forward step", () => {
    const spec: ImageSceneSpec = {
      schemaVersion: "witt.image.spec/v0.1",
      intent: "a",
      subject: "b",
      composition: {
        framing: "medium shot",
        camera: "neutral camera",
        depthPlan: ["foreground", "midground", "background"],
      },
      lighting: { mood: "neutral", key: "soft" },
      style: { references: [], palette: ["black", "white"] },
      decoder: {
        family: "llamagen",
        codebook: "stub-codebook",
        codebookVersion: "v0",
        latentResolution: [4, 4],
      },
      constraints: { mustHave: [], negative: [] },
      renderHints: { detailLevel: "medium", tokenBudget: 1024, seed: null },
    };

    const inputDim = 128;
    const hiddenDim = 2;
    const numTokens = 16;
    const features = sceneSpecToFeatureVector(spec);

    const w1 = new Array(hiddenDim * inputDim).fill(0);
    const b1 = new Array(hiddenDim).fill(0);
    const w2 = new Array(numTokens * hiddenDim).fill(0);
    const b2 = new Array(numTokens).fill(0);
    w1[0] = 0.01;
    w2[0] = 1.0;

    const weights: MlpAdapterWeights = {
      version: "witt.image.adapter.mlp/v0.1",
      codebookSize: 8192,
      tokenGrid: [4, 4],
      inputDim,
      hiddenDim,
      w1,
      b1,
      w2,
      b2,
      family: "llamagen",
      codebook: "stub-codebook",
      codebookVersion: "v0",
    };

    const logits = forwardMlp(features, weights);
    expect(logits.length).toBe(16);
    const tokens = logitsToTokens(logits, 8192);
    expect(tokens.length).toBe(16);
  });
});
