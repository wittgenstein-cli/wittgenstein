import { mkdtemp, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { audioCodec } from "../src/index.js";

describe("@wittgenstein/codec-audio", () => {
  it("exports a typed audio codec with default parse behavior", () => {
    expect(audioCodec.name).toBe("audio");
    expect(audioCodec.parse("{}").ok).toBe(true);
  });

  it("renders a wav artifact for speech with ambient overlay", async () => {
    const dir = await mkdtemp(join(tmpdir(), "witt-audio-"));
    const planResult = audioCodec.parse(
      JSON.stringify({
        route: "speech",
        script: "Wittgenstein ships a hackathon-ready audio demo.",
        ambient: { category: "rain", level: 0.2 },
      }),
    );

    expect(planResult.ok).toBe(true);
    if (!planResult.ok) {
      return;
    }

    const result = await audioCodec.render(planResult.value, {
      runId: "test-run",
      runDir: dir,
      seed: 7,
      outPath: join(dir, "speech.wav"),
      logger: console,
    });

    expect(result.mimeType).toBe("audio/wav");
    expect(result.artifactPath.endsWith(".wav")).toBe(true);
    expect((await stat(result.artifactPath)).size).toBeGreaterThan(44);
  });
});
