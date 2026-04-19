import type { RenderCtx } from "@wittgenstein/schemas";
import type { ImageLatentCodes } from "./adapter.js";

export interface DecodedRaster {
  pngBytes: Uint8Array;
}

/**
 * Neural raster decode is not wired yet. There is no stock-photo or gradient stand-in.
 * Integrate your frozen decoder here (latent → RGBA) once weights and runtime are available.
 */
export async function decodeLatentsToRaster(
  _codes: ImageLatentCodes,
  _ctx: RenderCtx,
): Promise<DecodedRaster> {
  throw createNotImplementedError(
    "codec-image pipeline: decoder (frozen neural decode required — no reference-image stub)",
  );
}

function createNotImplementedError(scope: string): Error & { code: string } {
  return Object.assign(
    new Error(
      `NotImplementedError(${scope}). Image stays on the sole neural path; plug in decodeLatentsToRaster when the decoder is ready.`,
    ),
    {
      name: "NotImplementedError",
      code: "NOT_IMPLEMENTED",
    },
  );
}
