import type { RenderCtx, RenderResult } from "@wittgenstein/schemas";
import type { AudioPlan } from "../../schema.js";
import { recommendAmbient } from "../../ambient-adapter.js";
import { finalizeAudioArtifact, generateAmbient } from "../../runtime.js";

export async function renderSoundscapeRoute(
  plan: AudioPlan,
  ctx: RenderCtx,
): Promise<RenderResult> {
  const startedAt = Date.now();
  const ambientCategory =
    plan.ambient.category === "auto"
      ? recommendAmbient(`${plan.script} ${plan.music.motif}`).category
      : plan.ambient.category;
  const result = await finalizeAudioArtifact(
    ctx,
    generateAmbient(
      ambientCategory === "silence" ? "forest" : ambientCategory,
      8,
      ctx.seed,
    ),
    "soundscape",
  );

  return {
    ...result,
    metadata: {
      ...result.metadata,
      durationMs: Date.now() - startedAt,
    },
  };
}
