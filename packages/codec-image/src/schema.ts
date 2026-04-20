import { z } from "zod";
import type { ImageRequest, Result } from "@wittgenstein/schemas";
import { ImageRequestSchema } from "@wittgenstein/schemas";

export const DecoderFamilySchema = z.enum(["llamagen", "seed", "dvae"]);
export const ImageSceneSpecVersionSchema = z.literal("witt.image.spec/v0.1");

/** Discrete latent codes consumed by the frozen decoder bridge (also used for MiniMax / provider-included latents). */
export const ImageLatentCodesSchema = z.object({
  schemaVersion: z.literal("witt.image.latents/v0.1"),
  family: DecoderFamilySchema,
  codebook: z.string().min(1),
  codebookVersion: z.string().min(1),
  tokenGrid: z.tuple([z.number().int().positive(), z.number().int().positive()]),
  tokens: z.array(z.number().int().nonnegative()),
});
export type ImageLatentCodes = z.infer<typeof ImageLatentCodesSchema>;

export const ImageSceneSpecSchema = z.object({
  schemaVersion: ImageSceneSpecVersionSchema.default("witt.image.spec/v0.1"),
  intent: z.string().default("placeholder scene"),
  subject: z.string().default("placeholder subject"),
  composition: z
    .object({
      framing: z.string().default("medium shot"),
      camera: z.string().default("neutral camera"),
      depthPlan: z.array(z.string()).default(["foreground", "midground", "background"]),
    })
    .default({}),
  lighting: z
    .object({
      mood: z.string().default("neutral"),
      key: z.string().default("soft"),
    })
    .default({}),
  style: z
    .object({
      references: z.array(z.string()).default([]),
      palette: z.array(z.string()).default(["black", "white"]),
    })
    .default({}),
  decoder: z
    .object({
      family: DecoderFamilySchema.default("llamagen"),
      codebook: z.string().default("stub-codebook"),
      codebookVersion: z.string().default("v0"),
      latentResolution: z
        .tuple([z.number().int().positive(), z.number().int().positive()])
        .default([32, 32]),
    })
    .default({}),
  constraints: z
    .object({
      mustHave: z.array(z.string()).default([]),
      negative: z.array(z.string()).default([]),
    })
    .default({}),
  renderHints: z
    .object({
      detailLevel: z.enum(["low", "medium", "high"]).default("medium"),
      tokenBudget: z.number().int().positive().default(1024),
      seed: z.number().int().nullable().default(null),
    })
    .default({}),
  /** When set (e.g. MiniMax returns VQ indices), the harness skips the learned adapter and validates these latents. */
  providerLatents: ImageLatentCodesSchema.optional(),
});

export type ImageSceneSpec = z.infer<typeof ImageSceneSpecSchema>;

export function imageSchemaPreamble(req: ImageRequest): string {
  const requestedSize = req.size ? `${req.size[0]}x${req.size[1]}` : "unspecified";

  return [
    "Emit a JSON scene spec for the sole neural image pipeline.",
    "Describe semantics, composition, style, and decoder hints only.",
    "Do not emit SVG, HTML, Canvas commands, or pixel arrays.",
    `Requested output size: ${requestedSize}.`,
    `Requested seed: ${req.seed ?? "null"}.`,
  ].join("\n");
}

export function parseImageSceneSpec(raw: string): Result<ImageSceneSpec> {
  try {
    const json = JSON.parse(raw) as unknown;
    const parsed = ImageSceneSpecSchema.safeParse(json);

    if (!parsed.success) {
      return {
        ok: false,
        error: {
          code: "IMAGE_SCHEMA_INVALID",
          message: "Image scene spec failed validation.",
          details: {
            issues: parsed.error.issues,
          },
        },
      };
    }

    return {
      ok: true,
      value: parsed.data,
    };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "IMAGE_SCHEMA_PARSE_FAILED",
        message: "Image scene spec was not valid JSON.",
        cause: error,
      },
    };
  }
}

export { ImageRequestSchema };
