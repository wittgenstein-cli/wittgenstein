import type { RenderCtx } from "@wittgenstein/schemas";
import type { ImageSceneSpec } from "../schema.js";
import {
  loadMlpAdapterFromJsonPath,
  predictLatentsFromMlp,
  type MlpAdapterWeights,
} from "./mlp-runtime.js";

const weightCache = new Map<string, MlpAdapterWeights>();

/** Preferred (newer / better) weights — tried first. */
export function preferredAdapterPath(): string | undefined {
  const a = process.env.WITTGENSTEIN_IMAGE_ADAPTER_PREFERRED_PATH?.trim();
  if (a) {
    return a;
  }
  return process.env.WITTGENSTEIN_IMAGE_ADAPTER_MLP_PATH?.trim();
}

/** Legacy backup — tried if preferred fails load or grid match. */
export function legacyAdapterPath(): string | undefined {
  const a = process.env.WITTGENSTEIN_IMAGE_ADAPTER_LEGACY_PATH?.trim();
  if (a) {
    return a;
  }
  return process.env.WITTGENSTEIN_IMAGE_ADAPTER_MLP_FALLBACK_PATH?.trim();
}

function candidatePaths(): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of [preferredAdapterPath(), legacyAdapterPath()]) {
    if (p && !seen.has(p)) {
      seen.add(p);
      out.push(p);
    }
  }
  return out;
}

async function loadWeightsCached(path: string): Promise<MlpAdapterWeights | null> {
  if (weightCache.has(path)) {
    return weightCache.get(path) ?? null;
  }
  try {
    const w = await loadMlpAdapterFromJsonPath(path);
    weightCache.set(path, w);
    return w;
  } catch {
    return null;
  }
}

/** Clear cache (e.g. tests). */
export function clearAdapterWeightCache(): void {
  weightCache.clear();
}

function pathLabel(path: string): "preferred" | "legacy" {
  const pref = preferredAdapterPath();
  const leg = legacyAdapterPath();
  if (pref && path === pref) {
    return "preferred";
  }
  if (leg && path === leg) {
    return "legacy";
  }
  return "preferred";
}

/**
 * Try preferred (new) then legacy (old) JSON adapters.
 * Skips files that fail to load or grid-mismatch.
 */
export async function resolveMlpForScene(
  parsed: ImageSceneSpec,
  ctx: RenderCtx,
): Promise<{ weights: MlpAdapterWeights; sourcePath: string } | null> {
  const [gw, gh] = parsed.decoder.latentResolution;
  const paths = candidatePaths();
  if (paths.length === 0) {
    return null;
  }

  for (const path of paths) {
    const weights = await loadWeightsCached(path);
    if (!weights) {
      ctx.logger.warn(`Image adapter: could not load or parse JSON at ${path}`);
      continue;
    }
    const [tw, th] = weights.tokenGrid;
    if (gw === tw && gh === th) {
      const label = pathLabel(path);
      ctx.logger.info(`Using MLP adapter (${label}): ${path}`);
      return { weights, sourcePath: path };
    }
    ctx.logger.warn(
      `Image adapter: token_grid mismatch for ${path}; expected scene [${gw},${gh}], weights [${tw},${th}].`,
    );
  }
  return null;
}

export async function predictWithResolved(
  parsed: ImageSceneSpec,
  resolved: { weights: MlpAdapterWeights; sourcePath: string },
): Promise<ReturnType<typeof predictLatentsFromMlp>> {
  return predictLatentsFromMlp(parsed, resolved.weights);
}
