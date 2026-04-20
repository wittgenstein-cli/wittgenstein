import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { WittgensteinRequest } from "../packages/schemas/src/index.js";
import { Wittgenstein } from "../packages/core/src/index.js";

type BenchmarkCase = WittgensteinRequest & {
  id: string;
  dryRun?: boolean;
};

interface BenchmarkResult {
  id: string;
  modality: string;
  price: {
    costUsd: number;
    inputTokens: number;
    outputTokens: number;
  };
  latency: {
    durationMs: number;
  };
  quality: {
    score: number;
    notes: string[];
  };
  artifactPath: string | null;
  runId: string;
}

async function main(): Promise<void> {
  const cwd = process.cwd();
  const harness = await Wittgenstein.bootstrap({ cwd });
  const casesPath = resolve(cwd, "benchmarks/cases.json");
  const outputPath = resolve(cwd, "artifacts/benchmarks/latest.json");
  const cases = JSON.parse(await readFile(casesPath, "utf8")) as BenchmarkCase[];

  const results: BenchmarkResult[] = [];

  for (const testCase of cases) {
    const outcome = await harness.run(testCase, {
      command: "benchmark",
      args: [testCase.id],
      cwd,
      dryRun: testCase.dryRun ?? true,
      outPath: resolve(cwd, testCase.out ?? defaultOut(testCase)),
    });

    const quality = await scoreQuality(testCase, outcome.manifest.artifactPath);

    results.push({
      id: testCase.id,
      modality: testCase.modality,
      price: {
        costUsd: outcome.manifest.costUsd,
        inputTokens: outcome.manifest.llmTokens.input,
        outputTokens: outcome.manifest.llmTokens.output,
      },
      latency: {
        durationMs: outcome.manifest.durationMs,
      },
      quality,
      artifactPath: outcome.manifest.artifactPath,
      runId: outcome.manifest.runId,
    });
  }

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        dimensions: ["Price", "Latency", "Quality"],
        results,
      },
      null,
      2,
    ),
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        outputPath,
        results,
      },
      null,
      2,
    ),
  );
}

async function scoreQuality(
  testCase: BenchmarkCase,
  artifactPath: string | null,
): Promise<{ score: number; notes: string[] }> {
  const notes: string[] = [];
  if (!artifactPath) {
    return { score: 0, notes: ["No artifact was produced."] };
  }

  const info = await stat(artifactPath);
  let score = info.size > 0 ? 0.6 : 0;
  notes.push(`Artifact size ${info.size} bytes.`);

  if (testCase.modality === "image" && artifactPath.endsWith(".png")) {
    score += 0.25;
    notes.push("PNG artifact present.");
  }

  if (testCase.modality === "audio" && artifactPath.endsWith(".wav")) {
    score += 0.25;
    notes.push("WAV artifact present.");
  }

  if (testCase.modality === "sensor") {
    score += artifactPath.endsWith(".html") ? 0.25 : 0.15;
    notes.push(artifactPath.endsWith(".html") ? "Loupe dashboard present." : "JSON artifact present.");
  }

  return { score: Math.min(1, Number(score.toFixed(2))), notes };
}

function defaultOut(testCase: BenchmarkCase): string {
  if (testCase.modality === "image") {
    return `artifacts/benchmarks/${testCase.id}.png`;
  }
  if (testCase.modality === "audio") {
    return `artifacts/benchmarks/${testCase.id}.wav`;
  }
  if (testCase.modality === "sensor") {
    return `artifacts/benchmarks/${testCase.id}.json`;
  }
  return `artifacts/benchmarks/${testCase.id}.out`;
}

void main();
