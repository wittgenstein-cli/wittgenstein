import type { RenderCtx, RenderResult } from "@wittgenstein/schemas";
import type { AudioPlan } from "../../schema.js";
import { recommendAmbient } from "../../ambient-adapter.js";
import {
  finalizeAudioArtifact,
  generateAmbient,
  mixTracks,
  synthMusic,
} from "../../runtime.js";

export async function renderMusicRoute(
  plan: AudioPlan,
  ctx: RenderCtx,
): Promise<RenderResult> {
  const startedAt = Date.now();
  const durationSec = 8;
  const ambientCategory =
    plan.ambient.category === "auto"
      ? recommendAmbient(`${plan.script} ${plan.music.motif}`).category
      : plan.ambient.category;
  const music = synthMusic(durationSec, plan.music.motif);
  const ambient = generateAmbient(ambientCategory, durationSec, ctx.seed);
  const result = await finalizeAudioArtifact(
    ctx,
    mixTracks([
      { samples: music, gain: 1 },
      { samples: ambient, gain: plan.ambient.level * 0.8 },
    ]),
    "music",
  );

  return {
    ...result,
    metadata: {
      ...result.metadata,
      durationMs: Date.now() - startedAt,
    },
  };
}
