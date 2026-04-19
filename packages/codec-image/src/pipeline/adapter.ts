import type { RenderCtx } from "@wittgenstein/schemas";
import { resolveMlpForScene, predictWithResolved } from "../adapters/adapter-resolve.js";
import {
  ImageLatentCodesSchema,
  type ImageLatentCodes,
  type ImageSceneSpec,
} from "../schema.js";

export type { ImageLatentCodes };
export { ImageLatentCodesSchema };

export async function adaptSceneToLatents(
  parsed: ImageSceneSpec,
  ctx: RenderCtx,
): Promise<ImageLatentCodes> {
  if (parsed.providerLatents) {
    const validated = ImageLatentCodesSchema.safeParse(parsed.providerLatents);
    if (validated.success) {
      ctx.logger.info("Using provider-included latents; skipping learned adapter.");
      return validated.data;
    }
    ctx.logger.warn("providerLatents failed validation; falling back to adapter.", {
      issues: validated.error?.issues,
    });
  }

  const resolved = await resolveMlpForScene(parsed, ctx);
  if (resolved) {
    return annotateLatents(parsed, await predictWithResolved(parsed, resolved));
  }

  return annotateLatents(parsed, placeholderLatents(parsed, ctx));
}

function placeholderLatents(parsed: ImageSceneSpec, ctx: RenderCtx): ImageLatentCodes {
  const [width, height] = parsed.decoder.latentResolution;
  const totalTokens = width * height;
  const codebookSize = 8192;
  const deterministicSeed = hashSpecToSeed(parsed);
  const tokens = new Array<number>(totalTokens);

  for (let index = 0; index < totalTokens; index += 1) {
    tokens[index] = (deterministicSeed + index * 97) % codebookSize;
  }

  const latentCodes = ImageLatentCodesSchema.parse({
    schemaVersion: "witt.image.latents/v0.1",
    family: parsed.decoder.family,
    codebook: parsed.decoder.codebook,
    codebookVersion: parsed.decoder.codebookVersion,
    tokenGrid: [width, height],
    tokens,
  });

  ctx.logger.warn(
    "Using placeholder scene-to-latent adapter; set WITTGENSTEIN_IMAGE_ADAPTER_PREFERRED_PATH + WITTGENSTEIN_IMAGE_ADAPTER_LEGACY_PATH (or legacy aliases WITTGENSTEIN_IMAGE_ADAPTER_MLP_PATH + WITTGENSTEIN_IMAGE_ADAPTER_MLP_FALLBACK_PATH).",
  );
  return latentCodes;
}

function annotateLatents(
  parsed: ImageSceneSpec,
  latents: ImageLatentCodes,
): ImageLatentCodes {
  const seed = hashSpecToSeed(parsed);
  const tokens = [...latents.tokens];
  if (tokens.length >= 4) {
    tokens[0] = inferSceneMode(parsed);
    tokens[1] = seed % 8192;
    tokens[2] = (seed >>> 5) % 8192;
    tokens[3] = (seed >>> 11) % 8192;
  }

  return ImageLatentCodesSchema.parse({
    ...latents,
    tokens,
  });
}

function inferSceneMode(parsed: ImageSceneSpec): number {
  const haystack = `${parsed.subject} ${parsed.intent}`.toLowerCase();
  if (
    haystack.includes("coast") ||
    haystack.includes("shore") ||
    haystack.includes("beach") ||
    haystack.includes("ocean")
  ) {
    return 0;
  }
  if (
    haystack.includes("forest") ||
    haystack.includes("wood") ||
    haystack.includes("tree")
  ) {
    return 1;
  }
  if (
    haystack.includes("lake") ||
    haystack.includes("river") ||
    haystack.includes("water")
  ) {
    return 2;
  }
  if (
    haystack.includes("mountain") ||
    haystack.includes("peak") ||
    haystack.includes("alpine")
  ) {
    return 3;
  }
  if (
    haystack.includes("meadow") ||
    haystack.includes("hill") ||
    haystack.includes("field")
  ) {
    return 4;
  }
  return hashSpecToSeed(parsed) % 5;
}

function hashSpecToSeed(parsed: ImageSceneSpec): number {
  const source = JSON.stringify({
    intent: parsed.intent,
    subject: parsed.subject,
    composition: parsed.composition,
    lighting: parsed.lighting,
    style: parsed.style,
    constraints: parsed.constraints,
    renderHints: parsed.renderHints,
    decoder: parsed.decoder,
  });
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
