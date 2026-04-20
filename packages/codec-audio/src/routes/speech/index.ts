import { readFile } from "node:fs/promises";
import type { RenderCtx, RenderResult } from "@wittgenstein/schemas";
import type { AudioPlan } from "../../schema.js";
import { recommendAmbient } from "../../ambient-adapter.js";
import {
  finalizeAudioArtifact,
  generateAmbient,
  mixTracks,
  renderMacSpeech,
  synthSpeech,
} from "../../runtime.js";

export async function renderSpeechRoute(
  plan: AudioPlan,
  ctx: RenderCtx,
): Promise<RenderResult> {
  const startedAt = Date.now();
  const durationSec = Math.max(2, inferSpeechDurationSec(plan.script));
  const ambientRecommendation = recommendAmbient(plan.script);
  const ambientCategory =
    plan.ambient.category === "auto" ? ambientRecommendation.category : plan.ambient.category;

  let speechSamples = synthSpeech(plan.script, durationSec);
  if (await renderMacSpeech(plan.script, ctx.outPath)) {
    speechSamples = decodeWavToFloat32(await readFile(ctx.outPath));
  }

  const ambientSamples = generateAmbient(ambientCategory, durationSec, ctx.seed);
  const result = await finalizeAudioArtifact(
    ctx,
    mixTracks([
      { samples: speechSamples, gain: 1 },
      { samples: ambientSamples, gain: plan.ambient.level },
    ]),
    "speech",
  );

  return {
    ...result,
    metadata: {
      ...result.metadata,
      durationMs: Date.now() - startedAt,
    },
  };
}

function inferSpeechDurationSec(script: string): number {
  const words = script.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(2.5, words / 2.4);
}

function decodeWavToFloat32(buffer: Buffer): Float32Array {
  const dataOffset = 44;
  const sampleCount = Math.max(0, (buffer.length - dataOffset) / 2);
  const samples = new Float32Array(sampleCount);
  for (let i = 0; i < sampleCount; i += 1) {
    samples[i] = buffer.readInt16LE(dataOffset + i * 2) / 32767;
  }
  return samples;
}
