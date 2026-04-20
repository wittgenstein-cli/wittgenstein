import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import type { ImageSceneSpec, ImageLatentCodes } from "../schema.js";
import { ImageLatentCodesSchema } from "../schema.js";

export const MLP_ADAPTER_VERSION = "witt.image.adapter.mlp/v0.1";

export interface MlpAdapterWeights {
  version: typeof MLP_ADAPTER_VERSION;
  codebookSize: number;
  tokenGrid: [number, number];
  inputDim: number;
  hiddenDim: number;
  w1: number[];
  b1: number[];
  w2: number[];
  b2: number[];
  family: ImageLatentCodes["family"];
  codebook: string;
  codebookVersion: string;
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

function canonicalize(value: unknown): unknown {
  if (value === null || typeof value !== "object") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(obj).sort()) {
    out[key] = canonicalize(obj[key]);
  }
  return out;
}

/** Must match `python/image_adapter/features.py` exactly. */
export function sceneSpecToFeatureVector(spec: ImageSceneSpec): Float32Array {
  const payload = { ...spec };
  delete (payload as { providerLatents?: unknown }).providerLatents;
  const s = canonicalJson(payload);
  const digest = createHash("sha256").update(s, "utf8").digest();
  const features = new Float32Array(128);
  for (let i = 0; i < 128; i += 1) {
    const b = digest[i % 32] ?? 0;
    features[i] = b / 127.5 - 1;
  }
  return features;
}

function relu(x: number): number {
  return x > 0 ? x : 0;
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export function forwardMlp(features: Float32Array, weights: MlpAdapterWeights): Float32Array {
  const { inputDim, hiddenDim, w1, b1, w2, b2 } = weights;
  const numTokens = weights.tokenGrid[0] * weights.tokenGrid[1];
  if (features.length !== inputDim) {
    throw new Error(`MLP input dim mismatch: expected ${inputDim}, got ${features.length}`);
  }

  const hidden = new Float32Array(hiddenDim);
  for (let h = 0; h < hiddenDim; h += 1) {
    let sum = b1[h] ?? 0;
    for (let i = 0; i < inputDim; i += 1) {
      sum += (w1[h * inputDim + i] ?? 0) * (features[i] ?? 0);
    }
    hidden[h] = relu(sum);
  }

  const out = new Float32Array(numTokens);
  for (let t = 0; t < numTokens; t += 1) {
    let sum = b2[t] ?? 0;
    for (let h = 0; h < hiddenDim; h += 1) {
      sum += (w2[t * hiddenDim + h] ?? 0) * (hidden[h] ?? 0);
    }
    out[t] = sigmoid(sum);
  }
  return out;
}

export function logitsToTokens(logits: Float32Array, codebookSize: number): number[] {
  const maxIndex = Math.max(0, codebookSize - 1);
  const tokens: number[] = [];
  for (let i = 0; i < logits.length; i += 1) {
    const normalized = Math.min(1, Math.max(0, logits[i] ?? 0));
    tokens.push(Math.round(normalized * maxIndex));
  }
  return tokens;
}

export async function loadMlpAdapterFromJsonPath(filePath: string): Promise<MlpAdapterWeights> {
  const raw = await readFile(filePath, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Adapter file must be a JSON object.");
  }
  const w = parsed as Partial<MlpAdapterWeights>;
  if (w.version !== MLP_ADAPTER_VERSION) {
    throw new Error(`Unsupported adapter version: ${String(w.version)}`);
  }
  if (
    typeof w.codebookSize !== "number" ||
    !Array.isArray(w.tokenGrid) ||
    w.tokenGrid.length !== 2 ||
    typeof w.inputDim !== "number" ||
    typeof w.hiddenDim !== "number" ||
    !Array.isArray(w.w1) ||
    !Array.isArray(w.b1) ||
    !Array.isArray(w.w2) ||
    !Array.isArray(w.b2)
  ) {
    throw new Error("Adapter file is missing required numeric/tensor fields.");
  }
  return w as MlpAdapterWeights;
}

export function predictLatentsFromMlp(spec: ImageSceneSpec, weights: MlpAdapterWeights): ImageLatentCodes {
  const features = sceneSpecToFeatureVector(spec);
  const logits = forwardMlp(features, weights);
  const tokens = logitsToTokens(logits, weights.codebookSize);
  return ImageLatentCodesSchema.parse({
    schemaVersion: "witt.image.latents/v0.1",
    family: weights.family,
    codebook: weights.codebook,
    codebookVersion: weights.codebookVersion,
    tokenGrid: weights.tokenGrid,
    tokens,
  });
}
