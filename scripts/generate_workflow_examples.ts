#!/usr/bin/env node

import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import { dirname, resolve, join, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { Wittgenstein } from "../packages/core/src/index.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT_DIR = resolve(ROOT, "artifacts/showcase/workflow-examples");

process.env.WITTGENSTEIN_IMAGE_ADAPTER_PREFERRED_PATH = resolve(
  ROOT,
  "data/image_adapter/artifacts/adapter_mlp.json",
);
process.env.WITTGENSTEIN_IMAGE_ADAPTER_LEGACY_PATH = resolve(
  ROOT,
  "data/image_adapter/artifacts/adapter_mlp_legacy.json",
);

class CuratedLocalAdapter {
  readonly provider = "local-curated";

  public constructor(private readonly responses: Map<string, unknown>) {}

  public async generate(request: {
    messages: Array<{ content: string }>;
  }): Promise<{
    text: string;
    tokens: { input: number; output: number };
    costUsd: number;
    raw: unknown;
  }> {
    const expanded = request.messages.at(-1)?.content ?? "";
    const marker = "User prompt:\n";
    const idx = expanded.lastIndexOf(marker);
    const prompt = idx >= 0 ? expanded.slice(idx + marker.length).trim() : expanded.trim();
    const payload = this.responses.get(prompt);
    if (!payload) {
      throw new Error(`No curated local response for prompt: ${prompt}`);
    }
    return {
      text: JSON.stringify(payload),
      tokens: { input: 0, output: 0 },
      costUsd: 0,
      raw: { localCurated: true, prompt },
    };
  }
}

async function ensureDir(path: string) {
  await mkdir(path, { recursive: true });
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

async function loadImageSceneBySubject() {
  const raw = await readFile(resolve(ROOT, "data/image_adapter/train/scenes.jsonl"), "utf8");
  const lines = raw.trim().split("\n").filter(Boolean);
  const wanted = [
    "coastal shoreline",
    "forest path",
    "lake or river",
    "mountain vista",
    "open meadow or hills",
  ];
  const found = new Map<string, Record<string, unknown>>();
  for (const line of lines) {
    const row = JSON.parse(line) as { image_scene_spec?: Record<string, unknown> };
    const spec = row.image_scene_spec;
    const subject = typeof spec?.subject === "string" ? spec.subject : null;
    if (!subject || found.has(subject) || !wanted.includes(subject)) {
      continue;
    }
    found.set(subject, spec);
    if (found.size === wanted.length) {
      break;
    }
  }
  return found;
}

function buildTtsPlan(script: string, ambient: string, voice: Record<string, string> = {}) {
  return {
    route: "speech",
    script,
    voice: {
      speaker: voice.speaker ?? "narrator",
      tone: voice.tone ?? "clear",
      language: voice.language ?? "en",
    },
    timeline: [],
    music: {
      bpm: 108,
      key: "C",
      motif: "minimal",
    },
    ambient: {
      category: ambient,
      level: ambient === "silence" ? 0 : 0.12,
    },
  };
}

function buildMusicPlan(script: string, motif: string, ambient: string, bpm = 118, key = "C") {
  return {
    route: "music",
    script,
    voice: {
      speaker: "none",
      tone: "n/a",
      language: "n/a",
    },
    timeline: [],
    music: {
      bpm,
      key,
      motif,
    },
    ambient: {
      category: ambient,
      level: ambient === "silence" ? 0 : 0.2,
    },
  };
}

function buildSoundscapePlan(script: string, ambient: string) {
  return {
    route: "soundscape",
    script,
    voice: {
      speaker: "none",
      tone: "n/a",
      language: "n/a",
    },
    timeline: [],
    music: {
      bpm: 96,
      key: "C",
      motif: "texture",
    },
    ambient: {
      category: ambient,
      level: 0.25,
    },
  };
}

function buildEcgSpec(name: string, bpm: number, noise: number, drift: number, pulseAmp: number, durationSec = 12) {
  return {
    signal: "ecg",
    sampleRateHz: 120,
    durationSec,
    unit: "mV",
    algorithm: "deterministic-operators",
    operators: [
      { type: "ecgTemplate", bpm, amplitude: 1 },
      { type: "noise", color: "white", amplitude: noise },
      { type: "drift", slopePerSec: drift },
      { type: "pulse", centerSec: durationSec * 0.65, widthSec: 0.42, amplitude: pulseAmp },
    ],
    notes: [name],
  };
}

function buildTemperatureSpec(name: string, drift: number, stepAt: number, stepAmp: number, noise = 0.04, durationSec = 24) {
  return {
    signal: "temperature",
    sampleRateHz: 4,
    durationSec,
    unit: "C",
    algorithm: "deterministic-operators",
    operators: [
      { type: "drift", slopePerSec: drift },
      { type: "noise", color: "white", amplitude: noise },
      { type: "step", atSec: stepAt, amplitude: stepAmp },
    ],
    notes: [name],
  };
}

function buildGyroSpec(name: string, f1: number, a1: number, f2: number, a2: number, noise: number, durationSec = 14) {
  return {
    signal: "gyro",
    sampleRateHz: 80,
    durationSec,
    unit: "deg/s",
    algorithm: "deterministic-operators",
    operators: [
      { type: "oscillator", frequencyHz: f1, amplitude: a1, phaseRad: 0 },
      { type: "oscillator", frequencyHz: f2, amplitude: a2, phaseRad: 1.1 },
      { type: "noise", color: "pink", amplitude: noise },
    ],
    notes: [name],
  };
}

async function main() {
  await ensureDir(OUT_DIR);

  const imageScenes = await loadImageSceneBySubject();
  const responses = new Map<string, unknown>();

  const imageDefs = [
    { id: "01-coastal", subject: "coastal shoreline", prompt: "Showcase image: coastal shoreline at soft daylight for the Wittgenstein demo." },
    { id: "02-forest", subject: "forest path", prompt: "Showcase image: forest path with soft daylight for the Wittgenstein demo." },
    { id: "03-lake", subject: "lake or river", prompt: "Showcase image: lake or river landscape with quiet daylight for the Wittgenstein demo." },
    { id: "04-mountain", subject: "mountain vista", prompt: "Showcase image: mountain vista with wide composition for the Wittgenstein demo." },
    { id: "05-meadow", subject: "open meadow or hills", prompt: "Showcase image: open meadow or hills with wide framing for the Wittgenstein demo." },
  ].map((item, index) => {
    const scene = clone(imageScenes.get(item.subject));
    scene.constraints = { mustHave: [], negative: ["text", "watermark", "people", "logo"] };
    scene.renderHints = { detailLevel: "medium", tokenBudget: 1024, seed: null };
    scene.style = {
      references: [],
      palette:
        item.subject === "coastal shoreline"
          ? ["teal", "sand", "sky"]
          : item.subject === "forest path"
            ? ["deep green", "moss", "mist"]
            : item.subject === "lake or river"
              ? ["blue", "slate", "silver"]
              : item.subject === "mountain vista"
                ? ["stone", "ice", "sky"]
                : ["gold", "green", "blue"],
    };
    responses.set(item.prompt, scene);
    return {
      group: "image",
      id: item.id,
      prompt: item.prompt,
      request: {
        modality: "image" as const,
        prompt: item.prompt,
        seed: 100 + index,
      },
      outPath: resolve(OUT_DIR, "image", `${item.id}.png`),
    };
  });

  const ttsDefs = [
    ["01-thesis", "Wittgenstein turns a text model into a system that ships real files.", "silence"],
    ["02-harness", "The model plans, the runtime builds, and every artifact stays traceable.", "city"],
    ["03-codecs", "Typed codecs make the output legible to both humans and machines.", "rain"],
    ["04-decoder", "For images, semantics stay in JSON and pixels come from a frozen decoder.", "forest"],
    ["05-launch", "From PNG to WAV to sensor dashboards, the same workflow remains reproducible.", "electronic"],
  ].map(([id, script, ambient], index) => {
    const prompt = `Showcase TTS: ${script}`;
    responses.set(prompt, buildTtsPlan(script, ambient));
    return {
      group: "tts",
      id,
      prompt,
      request: {
        modality: "audio" as const,
        prompt,
        route: "speech" as const,
        ambient,
        seed: 200 + index,
      },
      outPath: resolve(OUT_DIR, "tts", `${id}.wav`),
    };
  });

  const musicDefs = [
    ["01-launch-minimal", "Minimal launch score with light motion and confidence.", "minimal pulse", "electronic", 112, "C"],
    ["02-editorial-glow", "Editorial soundtrack with soft synthetic shimmer.", "editorial shimmer", "city", 118, "D"],
    ["03-forest-bloom", "Warm organic motif that feels patient and precise.", "organic bloom", "forest", 104, "G"],
    ["04-rain-grid", "Measured launch bed with gentle momentum under the surface.", "quiet grid", "rain", 116, "A"],
    ["05-night-drive", "Clean product reveal cue with low-end calm and movement.", "night drive", "wind", 122, "E"],
  ].map(([id, script, motif, ambient, bpm, key], index) => {
    const prompt = `Showcase music: ${script}`;
    responses.set(prompt, buildMusicPlan(script, motif, ambient, bpm, key));
    return {
      group: "music",
      id,
      prompt,
      request: {
        modality: "audio" as const,
        prompt,
        route: "music" as const,
        ambient,
        seed: 300 + index,
      },
      outPath: resolve(OUT_DIR, "music", `${id}.wav`),
    };
  });

  const soundscapeDefs = [
    ["01-rain-glass", "Soft rain on glass and distant room tone.", "rain"],
    ["02-forest-morning", "Light forest air with subtle bird motion.", "forest"],
    ["03-urban-night", "Low urban night bed with passing city hum.", "city"],
    ["04-open-ridge", "Open ridge wind with broad atmospheric motion.", "wind"],
    ["05-machine-room", "Low electronic room tone for a product teaser.", "electronic"],
  ].map(([id, script, ambient], index) => {
    const prompt = `Showcase soundscape: ${script}`;
    responses.set(prompt, buildSoundscapePlan(script, ambient));
    return {
      group: "soundscape",
      id,
      prompt,
      request: {
        modality: "audio" as const,
        prompt,
        route: "soundscape" as const,
        ambient,
        seed: 400 + index,
      },
      outPath: resolve(OUT_DIR, "soundscape", `${id}.wav`),
    };
  });

  const ecgDefs = [
    ["01-resting", "Showcase ECG: resting wearable trace.", buildEcgSpec("resting wearable trace", 68, 0.018, 0.002, 0.04)],
    ["02-exercise", "Showcase ECG: post-walk elevated trace.", buildEcgSpec("post-walk elevated trace", 92, 0.026, 0.003, 0.06)],
    ["03-recovery", "Showcase ECG: recovery trace settling down.", buildEcgSpec("recovery trace", 78, 0.02, 0.0015, 0.03)],
    ["04-noisy-patch", "Showcase ECG: noisy patch sensor trace.", buildEcgSpec("noisy patch trace", 74, 0.04, 0.004, 0.05)],
    ["05-clinical", "Showcase ECG: clean clinical-style trace.", buildEcgSpec("clean clinical trace", 70, 0.01, 0.001, 0.025)],
  ].map(([id, prompt, spec], index) => {
    responses.set(prompt, spec);
    return {
      group: "sensor-ecg",
      id,
      prompt,
      request: {
        modality: "sensor" as const,
        prompt,
        signal: "ecg",
        seed: 500 + index,
      },
      outPath: resolve(OUT_DIR, "sensor/ecg", `${id}.json`),
    };
  });

  const temperatureDefs = [
    ["01-office", "Showcase temperature: stable office room trace.", buildTemperatureSpec("stable office room", 0.002, 13.5, 0.18, 0.02)],
    ["02-greenhouse", "Showcase temperature: sunrise greenhouse trace.", buildTemperatureSpec("sunrise greenhouse", 0.012, 8, 0.9, 0.03)],
    ["03-cold-chain", "Showcase temperature: cold-chain bump trace.", buildTemperatureSpec("cold-chain bump", -0.004, 15, 0.55, 0.025)],
    ["04-device-warmup", "Showcase temperature: device warm-up trace.", buildTemperatureSpec("device warm-up", 0.018, 6, 0.45, 0.02)],
    ["05-hvac", "Showcase temperature: HVAC step-change trace.", buildTemperatureSpec("HVAC step-change", 0.001, 10, -0.35, 0.04)],
  ].map(([id, prompt, spec], index) => {
    responses.set(prompt, spec);
    return {
      group: "sensor-temperature",
      id,
      prompt,
      request: {
        modality: "sensor" as const,
        prompt,
        signal: "temperature",
        seed: 600 + index,
      },
      outPath: resolve(OUT_DIR, "sensor/temperature", `${id}.json`),
    };
  });

  const gyroDefs = [
    ["01-handheld", "Showcase gyro: handheld pan trace.", buildGyroSpec("handheld pan trace", 1.4, 0.38, 3.2, 0.1, 0.04)],
    ["02-hover", "Showcase gyro: drone hover jitter trace.", buildGyroSpec("drone hover jitter", 2.2, 0.26, 5.4, 0.08, 0.06)],
    ["03-walk", "Showcase gyro: wearable walking trace.", buildGyroSpec("wearable walking", 1.8, 0.44, 3.8, 0.14, 0.05)],
    ["04-vehicle", "Showcase gyro: low vehicle vibration trace.", buildGyroSpec("low vehicle vibration", 2.8, 0.22, 6.1, 0.07, 0.03)],
    ["05-gimbal", "Showcase gyro: slow gimbal compensation trace.", buildGyroSpec("slow gimbal compensation", 0.9, 0.19, 2.4, 0.05, 0.02)],
  ].map(([id, prompt, spec], index) => {
    responses.set(prompt, spec);
    return {
      group: "sensor-gyro",
      id,
      prompt,
      request: {
        modality: "sensor" as const,
        prompt,
        signal: "gyro",
        seed: 700 + index,
      },
      outPath: resolve(OUT_DIR, "sensor/gyro", `${id}.json`),
    };
  });

  const definitions = [
    ...imageDefs,
    ...ttsDefs,
    ...musicDefs,
    ...soundscapeDefs,
    ...ecgDefs,
    ...temperatureDefs,
    ...gyroDefs,
  ];

  const harness = await Wittgenstein.bootstrap({
    cwd: ROOT,
    llmAdapter: new CuratedLocalAdapter(responses),
  });

  const results: Array<Record<string, unknown>> = [];
  for (const item of definitions) {
    await ensureDir(dirname(item.outPath));
    const outcome = await harness.run(item.request, {
      command: "script:generate-workflow-examples",
      args: [item.group, item.id],
      cwd: ROOT,
      dryRun: false,
      outPath: item.outPath,
    });
    results.push({
      group: item.group,
      id: item.id,
      prompt: item.prompt,
      outPath: item.outPath,
      runId: outcome.manifest.runId,
      runDir: outcome.runDir,
      artifactPath: outcome.manifest.artifactPath,
      ok: outcome.manifest.ok,
      error: outcome.error,
    });
    if (!outcome.manifest.ok) {
      throw new Error(`Generation failed for ${item.group}/${item.id}: ${JSON.stringify(outcome.error)}`);
    }
  }

  const sampleSelections = {
    image: "02-forest",
    tts: "02-harness",
    music: "01-launch-minimal",
    soundscape: "02-forest-morning",
    "sensor-ecg": "05-clinical",
    "sensor-temperature": "02-greenhouse",
    "sensor-gyro": "02-hover",
  };

  const sampleDir = resolve(OUT_DIR, "samples");
  await ensureDir(sampleDir);

  for (const [group, sampleId] of Object.entries(sampleSelections)) {
    const hit = results.find((item) => item.group === group && item.id === sampleId) as Record<string, string> | undefined;
    if (!hit?.artifactPath) {
      continue;
    }
    const groupSampleDir = resolve(sampleDir, group);
    await ensureDir(groupSampleDir);
    const source = hit.artifactPath;
    await copyFile(source, join(groupSampleDir, basename(source)));

    if (group.startsWith("sensor-")) {
      const stem = source.slice(0, -extname(source).length);
      for (const ext of [".json", ".csv", ".html"]) {
        const candidate = `${stem}${ext}`;
        try {
          await copyFile(candidate, join(groupSampleDir, basename(candidate)));
        } catch {}
      }
    }
  }

  const byGroup = new Map<string, Array<Record<string, unknown>>>();
  for (const item of results) {
    const group = String(item.group);
    if (!byGroup.has(group)) {
      byGroup.set(group, []);
    }
    byGroup.get(group)?.push(item);
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    root: OUT_DIR,
    counts: Object.fromEntries([...byGroup.entries()].map(([group, items]) => [group, items.length])),
    samples: sampleSelections,
    results,
  };

  await writeFile(resolve(OUT_DIR, "summary.json"), JSON.stringify(summary, null, 2));

  let readme = "# Workflow Example Pack\n\n";
  readme += "This pack was generated through the Wittgenstein harness using curated local JSON responses so the runs still produce manifests under `artifacts/runs/<run-id>/`.\n\n";
  readme += "## Groups\n\n";
  for (const [group, items] of [...byGroup.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    readme += `- \`${group}\`: ${items.length} examples\n`;
  }
  readme += "\n## Sample Picks\n\n";
  for (const [group, sampleId] of Object.entries(sampleSelections)) {
    const hit = results.find((item) => item.group === group && item.id === sampleId) as Record<string, string> | undefined;
    if (!hit) {
      continue;
    }
    readme += `- \`${group}\` → \`${sampleId}\` → \`${hit.artifactPath}\`\n`;
  }
  readme += "\n## Notes\n\n";
  readme += "- Image uses the sole neural path: `scene spec -> adapter -> frozen decoder -> PNG`.\n";
  readme += "- TTS uses the audio speech route; on macOS it upgrades to `say` + `afconvert` automatically.\n";
  readme += "- Music and soundscape stay on the local audio runtime.\n";
  readme += "- Sensor outputs include JSON, CSV, and HTML sidecars when available.\n";
  readme += "- Every generated example has a corresponding run manifest under `artifacts/runs/`.\n";
  await writeFile(resolve(OUT_DIR, "README.md"), readme);

  console.log(JSON.stringify(summary, null, 2));
}

void main();
