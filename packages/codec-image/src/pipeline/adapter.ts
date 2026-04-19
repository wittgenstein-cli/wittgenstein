import type { RenderCtx } from "@wittgenstein/schemas";
import type { ImageSceneSpec } from "../schema.js";

export interface ImageLatentCodes {
  family: "llamagen" | "seed" | "dvae";
  tokens: number[];
  width: number;
  height: number;
}

/** v1 stub: tokens[0]=1, tokens[1]=byte length, tokens[2..]=UTF-8 bytes of caption. */
export const STUB_LATENT_PROTOCOL_V1 = 1;
const MAX_CAPTION_BYTES = 400;

export async function adaptSceneToLatents(
  parsed: ImageSceneSpec,
  _ctx: RenderCtx,
): Promise<ImageLatentCodes> {
  const caption = `${parsed.subject}\n${parsed.intent}`.trim();
  const bytes = new TextEncoder().encode(caption.slice(0, MAX_CAPTION_BYTES));
  const tokens = [STUB_LATENT_PROTOCOL_V1, bytes.length, ...Array.from(bytes)];

  const [lw, lh] = parsed.decoder.latentResolution;
  const width = Math.min(1024, Math.max(256, lw * 24));
  const height = Math.min(1024, Math.max(256, lh * 24));

  return {
    family: parsed.decoder.family,
    tokens,
    width,
    height,
  };
}
