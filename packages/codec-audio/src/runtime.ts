import { access, mkdir, stat, unlink, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { dirname } from "node:path";
import type { RenderCtx, RenderResult } from "@wittgenstein/schemas";
import type { AmbientCategory } from "./ambient-adapter.js";

export const AUDIO_SAMPLE_RATE = 22_050;

export async function finalizeAudioArtifact(
  ctx: RenderCtx,
  samples: Float32Array,
  route: string,
): Promise<RenderResult> {
  await mkdir(dirname(ctx.outPath), { recursive: true });
  await writeFile(ctx.outPath, encodeWav(samples, AUDIO_SAMPLE_RATE));
  const info = await stat(ctx.outPath);

  return {
    artifactPath: ctx.outPath,
    mimeType: "audio/wav",
    bytes: info.size,
    metadata: {
      codec: "audio:minimal-runtime",
      route,
      llmTokens: { input: 0, output: 0 },
      costUsd: 0,
      durationMs: 0,
      seed: ctx.seed,
    },
  };
}

export function durationToFrames(durationSec: number): number {
  return Math.max(1, Math.floor(durationSec * AUDIO_SAMPLE_RATE));
}

export function mixTracks(tracks: Array<{ samples: Float32Array; gain: number }>): Float32Array {
  const frameCount = Math.max(...tracks.map((track) => track.samples.length));
  const mixed = new Float32Array(frameCount);

  for (const track of tracks) {
    for (let i = 0; i < frameCount; i += 1) {
      const current = mixed[i] ?? 0;
      mixed[i] = current + (track.samples[i] ?? 0) * track.gain;
    }
  }

  return normalize(mixed, 0.92);
}

export function generateAmbient(category: AmbientCategory, durationSec: number, seed: number | null): Float32Array {
  const frames = durationToFrames(durationSec);
  const rng = createRng(seed ?? 0);
  const buffer = new Float32Array(frames);

  if (category === "silence") {
    return buffer;
  }

  if (category === "rain") {
    for (let i = 0; i < frames; i += 1) {
      buffer[i] = (rng() * 2 - 1) * 0.18 + Math.sin(i / 37) * 0.015;
    }
    return lowPass(buffer, 0.24);
  }

  if (category === "wind") {
    for (let i = 0; i < frames; i += 1) {
      const gust = 0.3 + 0.7 * Math.sin((2 * Math.PI * i) / (AUDIO_SAMPLE_RATE * 3.8));
      buffer[i] = ((rng() * 2 - 1) * 0.15 + Math.sin(i / 190) * 0.02) * gust;
    }
    return lowPass(buffer, 0.12);
  }

  if (category === "city") {
    for (let i = 0; i < frames; i += 1) {
      const hum =
        0.1 * Math.sin((2 * Math.PI * 90 * i) / AUDIO_SAMPLE_RATE) +
        0.05 * Math.sin((2 * Math.PI * 180 * i) / AUDIO_SAMPLE_RATE);
      const traffic = (rng() * 2 - 1) * 0.04;
      buffer[i] = hum + traffic;
    }
    return lowPass(buffer, 0.3);
  }

  if (category === "forest") {
    for (let i = 0; i < frames; i += 1) {
      const wind = Math.sin(i / 260) * 0.02 + (rng() * 2 - 1) * 0.03;
      const chirp = i % Math.floor(AUDIO_SAMPLE_RATE * 1.5) < 2_400
        ? Math.sin((2 * Math.PI * (1800 + (i % 2000)) * i) / AUDIO_SAMPLE_RATE) * 0.04
        : 0;
      buffer[i] = wind + chirp;
    }
    return lowPass(buffer, 0.35);
  }

  for (let i = 0; i < frames; i += 1) {
    buffer[i] =
      0.08 * Math.sin((2 * Math.PI * 60 * i) / AUDIO_SAMPLE_RATE) +
      0.04 * Math.sin((2 * Math.PI * 120 * i) / AUDIO_SAMPLE_RATE) +
      (rng() * 2 - 1) * 0.02;
  }
  return buffer;
}

export async function renderMacSpeech(script: string, outPath: string): Promise<boolean> {
  if (process.platform !== "darwin") {
    return false;
  }

  const aiffPath = outPath.replace(/\.wav$/i, ".aiff");

  try {
    await access("/usr/bin/say");
    await spawnChecked("/usr/bin/say", ["-o", aiffPath, script]);
    await spawnChecked("/usr/bin/afconvert", [
      "-f",
      "WAVE",
      "-d",
      "LEI16@22050",
      aiffPath,
      outPath,
    ]);
    await unlink(aiffPath);
    return true;
  } catch {
    return false;
  }
}

export function synthSpeech(script: string, durationSec: number): Float32Array {
  const normalizedText = script.trim() || "Wittgenstein";
  const frames = Math.max(durationToFrames(durationSec), normalizedText.length * 2_300);
  const samples = new Float32Array(frames);
  const chars = Array.from(normalizedText);

  for (let i = 0; i < chars.length; i += 1) {
    const code = chars[i]?.charCodeAt(0) ?? 65;
    const start = i * 2_000;
    const length = Math.min(1_700, frames - start);
    const freq = 160 + (code % 32) * 14;
    for (let j = 0; j < length; j += 1) {
      const envelope = Math.sin((Math.PI * j) / length);
      const frame = start + j;
      const current = samples[frame] ?? 0;
      samples[frame] =
        current +
        Math.sin((2 * Math.PI * freq * frame) / AUDIO_SAMPLE_RATE) * 0.18 * envelope +
        Math.sin((2 * Math.PI * (freq * 0.5) * frame) / AUDIO_SAMPLE_RATE) * 0.05 * envelope;
    }
  }

  return normalize(samples, 0.86);
}

export function synthMusic(durationSec: number, motif: string): Float32Array {
  const frames = durationToFrames(durationSec);
  const samples = new Float32Array(frames);
  const motifSeed = motif.length || 1;
  const notes = [220, 261.63, 329.63, 392, 440];

  for (let i = 0; i < frames; i += 1) {
    const step = Math.floor(i / 5_512) % notes.length;
    const freq = notes[(step + motifSeed) % notes.length] ?? 220;
    const beat = (i % 5_512) / 5_512;
    const env = beat < 0.85 ? 1 - beat : 0.15;
    samples[i] =
      Math.sin((2 * Math.PI * freq * i) / AUDIO_SAMPLE_RATE) * 0.18 * env +
      Math.sin((2 * Math.PI * (freq / 2) * i) / AUDIO_SAMPLE_RATE) * 0.06 * env;
  }

  return normalize(samples, 0.9);
}

function createRng(seed: number): () => number {
  let state = (seed >>> 0) + 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

function lowPass(samples: Float32Array, alpha: number): Float32Array {
  const out = new Float32Array(samples.length);
  let prev = 0;
  for (let i = 0; i < samples.length; i += 1) {
    prev = prev + alpha * ((samples[i] ?? 0) - prev);
    out[i] = prev;
  }
  return normalize(out, 0.8);
}

function normalize(samples: Float32Array, peak: number): Float32Array {
  let max = 0;
  for (const sample of samples) {
    max = Math.max(max, Math.abs(sample));
  }

  if (max === 0) {
    return samples;
  }

  const gain = peak / max;
  const normalized = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i += 1) {
    normalized[i] = (samples[i] ?? 0) * gain;
  }
  return normalized;
}

function encodeWav(samples: Float32Array, sampleRate: number): Buffer {
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * bytesPerSample, 28);
  buffer.writeUInt16LE(bytesPerSample, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i += 1) {
    const clipped = Math.max(-1, Math.min(1, samples[i] ?? 0));
    buffer.writeInt16LE(Math.round(clipped * 32767), 44 + i * 2);
  }

  return buffer;
}

async function spawnChecked(command: string, args: string[]): Promise<void> {
  await new Promise<void>((resolvePromise, reject) => {
    const child = spawn(command, args, { stdio: "ignore" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }
      reject(new Error(`${command} exited with code ${code ?? "unknown"}`));
    });
  });
}
