import { describe, expect, it } from "vitest";
import { imageCodec } from "../src/index.js";
import { renderImagePipeline } from "../src/pipeline/index.js";

describe("@wittgenstein/codec-image", () => {
  it("exposes the locked image codec skeleton", () => {
    expect(imageCodec.name).toBe("image");
    expect(imageCodec.modality).toBe("image");
    expect(imageCodec.parse("{}").ok).toBe(true);
  });
});

describe("image pipeline (neural decode)", () => {
  it("fails decode until a frozen decoder is integrated", async () => {
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

    await expect(
      renderImagePipeline(parsed.value, {
        runId: "test-run",
        runDir: ".",
        seed: null,
        outPath: "out.png",
        logger: {
          debug: () => {},
          info: () => {},
          warn: () => {},
          error: () => {},
        },
      }),
    ).rejects.toMatchObject({ code: "NOT_IMPLEMENTED" });
  });
});
