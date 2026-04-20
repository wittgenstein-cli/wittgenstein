import type { RenderCtx, RenderResult } from "@wittgenstein/schemas";
import type { SensorSignalSpec } from "../schema.js";
import { renderSignalBundle } from "../render.js";

export async function renderEcgSignal(
  spec: SensorSignalSpec,
  ctx: RenderCtx,
): Promise<RenderResult> {
  return renderSignalBundle(spec, ctx);
}
