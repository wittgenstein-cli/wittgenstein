import { mkdtemp, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { sensorCodec } from "../src/index.js";

describe("@wittgenstein/codec-sensor", () => {
  it("exports the sensor codec contract", () => {
    expect(sensorCodec.name).toBe("sensor");
    expect(sensorCodec.parse("{}").ok).toBe(true);
  });

  it("renders sensor data with a loupe-friendly sidecar", async () => {
    const dir = await mkdtemp(join(tmpdir(), "witt-sensor-"));
    const parseResult = sensorCodec.parse(
      JSON.stringify({
        signal: "ecg",
        sampleRateHz: 120,
        durationSec: 3,
      }),
    );

    expect(parseResult.ok).toBe(true);
    if (!parseResult.ok) {
      return;
    }

    const result = await sensorCodec.render(parseResult.value, {
      runId: "sensor-run",
      runDir: dir,
      seed: 5,
      outPath: join(dir, "signal.json"),
      logger: console,
    });

    expect(["text/html", "application/json"]).toContain(result.mimeType);
    expect((await stat(result.artifactPath)).size).toBeGreaterThan(10);
  });
});
