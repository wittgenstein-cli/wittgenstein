import type { RenderCtx, RenderResult, WittgensteinCodec } from "@wittgenstein/schemas";
import { Modality } from "@wittgenstein/schemas";
import type { SvgRequest } from "@wittgenstein/schemas";
import { parseSvgIr, svgSchemaPreamble, SvgIrSchema, SvgRequestSchema, type SvgIr } from "./schema.js";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export const svgCodec: WittgensteinCodec<SvgRequest, SvgIr> = {
  name: "svg",
  modality: Modality.Svg,
  schemaPreamble: svgSchemaPreamble,
  requestSchema: SvgRequestSchema,
  outputSchema: SvgIrSchema,
  parse: parseSvgIr,
  async render(parsed: SvgIr, ctx: RenderCtx): Promise<RenderResult> {
    const bytes = new TextEncoder().encode(parsed.svg);
    await mkdir(dirname(ctx.outPath), { recursive: true });
    await writeFile(ctx.outPath, bytes);

    return {
      artifactPath: ctx.outPath,
      mimeType: "image/svg+xml",
      bytes: bytes.byteLength,
      metadata: {
        codec: "svg",
        llmTokens: { input: 0, output: 0 },
        costUsd: 0,
        durationMs: 0,
        seed: ctx.seed,
      },
    };
  },
};
