import { access } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  DEFAULT_WITTGENSTEIN_CONFIG,
  WittgensteinConfigSchema,
  type WittgensteinConfig,
} from "@wittgenstein/schemas";

export interface LoadConfigOptions {
  cwd?: string;
  configPath?: string;
  env?: NodeJS.ProcessEnv;
}

const CONFIG_CANDIDATES = [
  "wittgenstein.config.ts",
  "wittgenstein.config.mts",
  "wittgenstein.config.js",
  "wittgenstein.config.mjs",
];

export async function loadWittgensteinConfig(
  options: LoadConfigOptions = {},
): Promise<WittgensteinConfig> {
  const cwd = resolve(options.cwd ?? process.cwd());
  const env = options.env ?? process.env;
  const configPath = await resolveConfigPath(cwd, options.configPath);
  const loadedConfig = configPath ? await importConfig(configPath) : {};

  const merged = {
    ...DEFAULT_WITTGENSTEIN_CONFIG,
    ...loadedConfig,
    llm: {
      ...DEFAULT_WITTGENSTEIN_CONFIG.llm,
      ...loadedConfig.llm,
    },
    runtime: {
      ...DEFAULT_WITTGENSTEIN_CONFIG.runtime,
      ...loadedConfig.runtime,
      retry: {
        ...DEFAULT_WITTGENSTEIN_CONFIG.runtime.retry,
        ...loadedConfig.runtime?.retry,
      },
      budget: {
        ...DEFAULT_WITTGENSTEIN_CONFIG.runtime.budget,
        ...loadedConfig.runtime?.budget,
      },
    },
    codecs: {
      ...DEFAULT_WITTGENSTEIN_CONFIG.codecs,
      ...loadedConfig.codecs,
    },
    svg: {
      ...DEFAULT_WITTGENSTEIN_CONFIG.svg,
      ...loadedConfig.svg,
    },
  };

  if (env.WITTGENSTEIN_LLM_PROVIDER) {
    merged.llm.provider = env.WITTGENSTEIN_LLM_PROVIDER as WittgensteinConfig["llm"]["provider"];
  }

  if (env.WITTGENSTEIN_LLM_MODEL) {
    merged.llm.model = env.WITTGENSTEIN_LLM_MODEL;
  }

  if (env.WITTGENSTEIN_LLM_BASE_URL) {
    merged.llm.baseUrl = env.WITTGENSTEIN_LLM_BASE_URL;
  }

  if (env.WITTGENSTEIN_ARTIFACTS_DIR) {
    merged.runtime.artifactsDir = env.WITTGENSTEIN_ARTIFACTS_DIR;
  }

  if (env.WITTGENSTEIN_SVG_INFERENCE_URL) {
    merged.svg = {
      ...merged.svg,
      inferenceUrl: env.WITTGENSTEIN_SVG_INFERENCE_URL,
    };
  }

  return WittgensteinConfigSchema.parse(merged);
}

async function resolveConfigPath(
  cwd: string,
  explicitPath?: string,
): Promise<string | null> {
  if (explicitPath) {
    return resolve(cwd, explicitPath);
  }

  for (const candidate of CONFIG_CANDIDATES) {
    const candidatePath = resolve(cwd, candidate);
    if (await pathExists(candidatePath)) {
      return candidatePath;
    }
  }

  return null;
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function importConfig(filePath: string): Promise<Partial<WittgensteinConfig>> {
  const imported = await import(pathToFileURL(filePath).href);
  return (imported.default ?? imported.config ?? imported) as Partial<WittgensteinConfig>;
}
