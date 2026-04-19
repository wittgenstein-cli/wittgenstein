import { describe, expect, it } from "vitest";
import { Modality, RenderResultSchema, RunManifestSchema } from "../src/index.js";

describe("@wittgenstein/schemas", () => {
  it("exports the locked modality set", () => {
    expect(Modality.Image).toBe("image");
    expect(Modality.Audio).toBe("audio");
    expect(Modality.Video).toBe("video");
    expect(Modality.Sensor).toBe("sensor");
    expect(Modality.Svg).toBe("svg");
  });

  it("validates render results and manifests", () => {
    expect(
      RenderResultSchema.safeParse({
        artifactPath: "/tmp/out.png",
        mimeType: "image/png",
        bytes: 1,
        metadata: {
          codec: "image",
          llmTokens: { input: 0, output: 0 },
          costUsd: 0,
          durationMs: 0,
          seed: null,
        },
      }).success,
    ).toBe(true);

    expect(
      RunManifestSchema.safeParse({
        runId: "run-1",
        gitSha: null,
        lockfileHash: null,
        nodeVersion: process.version,
        wittgensteinVersion: "0.0.0",
        command: "wittgenstein image",
        args: ["prompt"],
        seed: null,
        codec: "image",
        llmProvider: "openai-compatible",
        llmModel: "gpt-4.1-mini",
        llmTokens: { input: 0, output: 0 },
        costUsd: 0,
        promptRaw: "prompt",
        promptExpanded: "expanded",
        llmOutputRaw: "{}",
        llmOutputParsed: {},
        artifactPath: null,
        artifactSha256: null,
        startedAt: new Date().toISOString(),
        durationMs: 0,
        ok: false,
        error: {
          code: "NOT_IMPLEMENTED",
          message: "NotImplementedError(codec: image)",
        },
      }).success,
    ).toBe(true);
  });
});
