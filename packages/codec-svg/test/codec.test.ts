import { describe, expect, it } from "vitest";
import { mkdir, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { svgCodec } from "../src/index.js";

describe("@wittgenstein/codec-svg", () => {
  it("registers svg codec", () => {
    expect(svgCodec.name).toBe("svg");
    expect(svgCodec.modality).toBe("svg");
  });

  it("parses and renders a minimal SVG document", async () => {
    const doc =
      '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="black"/></svg>';
    const parsed = svgCodec.parse(JSON.stringify({ svg: doc }));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    const dir = join(tmpdir(), `wittgenstein-svg-${Date.now()}`);
    await mkdir(dir, { recursive: true });
    const outPath = join(dir, "out.svg");
    const result = await svgCodec.render(parsed.value, {
      runId: "t",
      runDir: dir,
      seed: null,
      outPath,
      logger: {
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
      },
    });
    expect(result.mimeType).toBe("image/svg+xml");
    const file = await readFile(outPath, "utf8");
    expect(file.trimStart().toLowerCase().startsWith("<svg")).toBe(true);
    await rm(dir, { recursive: true, force: true });
  });
});
