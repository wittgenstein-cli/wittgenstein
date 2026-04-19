import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { imageCodec } from "../src/index.js";
import { renderImagePipeline } from "../src/pipeline/index.js";

describe("@wittgenstein/codec-image", () => {
  it("parses and enriches scene contract defaults", () => {
    expect(imageCodec.name).toBe("image");
    expect(imageCodec.modality).toBe("image");
    const parsed = imageCodec.parse("{}");
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.schemaVersion).toBe("witt.image.spec/v0.1");
      expect(parsed.value.decoder.codebookVersion).toBe("v0");
      expect(parsed.value.constraints.negative).toEqual([]);
    }
  });

  it("renders placeholder latents into a PNG artifact", async () => {
    const parsed = imageCodec.parse("{}");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      throw new Error("image parse unexpectedly failed in test");
    }

    const runDir = await mkdtemp(resolve(tmpdir(), "wittgenstein-codec-image-"));
    const outPath = resolve(runDir, "output.png");
    const result = await imageCodec.render(parsed.value, {
      runId: "test-run",
      runDir,
      seed: null,
      outPath,
      logger: {
        debug: () => undefined,
        info: () => undefined,
        warn: () => undefined,
        error: () => undefined,
      },
    });

    expect(result.mimeType).toBe("image/png");
    expect(result.bytes).toBeGreaterThan(0);
    const bytes = await readFile(outPath);
    expect(Array.from(bytes.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  });

  it("uses providerLatents when present", async () => {
    const tokens = Array.from({ length: 32 * 32 }, (_, index) => index % 8192);
    const raw = JSON.stringify({
      schemaVersion: "witt.image.spec/v0.1",
      intent: "test",
      subject: "test",
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
        latentResolution: [32, 32],
      },
      constraints: { mustHave: [], negative: [] },
      renderHints: { detailLevel: "medium", tokenBudget: 1024, seed: null },
      providerLatents: {
        schemaVersion: "witt.image.latents/v0.1",
        family: "llamagen",
        codebook: "stub-codebook",
        codebookVersion: "v0",
        tokenGrid: [32, 32],
        tokens,
      },
    });
    const parsed = imageCodec.parse(raw);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      throw new Error("parse failed");
    }
    const runDir = await mkdtemp(resolve(tmpdir(), "wittgenstein-codec-image-pl-"));
    const outPath = resolve(runDir, "out.png");
    await imageCodec.render(parsed.value, {
      runId: "pl-test",
      runDir,
      seed: null,
      outPath,
      logger: {
        debug: () => undefined,
        info: () => undefined,
        warn: () => undefined,
        error: () => undefined,
      },
    });
    const bytes = await readFile(outPath);
    expect(Array.from(bytes.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  });
});

describe("image pipeline (neural decode)", () => {
  it("renders a PNG via the current placeholder decoder bridge", async () => {
    const parsed = imageCodec.parse(
      JSON.stringify({
        intent: "test",
        subject: "x",
        decoder: { latentResolution: [16, 16] },
      }),
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    const runDir = await mkdtemp(resolve(tmpdir(), "wittgenstein-codec-image-pipeline-"));
    const outPath = resolve(runDir, "out.png");
    const result = await renderImagePipeline(parsed.value, {
      runId: "test-run",
      runDir,
      seed: null,
      outPath,
      logger: {
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
      },
    });

    expect(result.mimeType).toBe("image/png");
    expect(result.bytes).toBeGreaterThan(0);
    const bytes = await readFile(outPath);
    expect(Array.from(bytes.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  });
});
