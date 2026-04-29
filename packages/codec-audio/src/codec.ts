import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import type { AudioRequest, RenderCtx } from "@wittgenstein/schemas";
import { Modality, codecV2 } from "@wittgenstein/schemas";
import {
  AudioPlanSchema,
  AudioRequestSchema,
  audioSchemaPreamble,
  parseAudioPlan,
  type AudioPlan,
} from "./schema.js";
import { renderSpeechRoute } from "./routes/speech/index.js";
import { renderSoundscapeRoute } from "./routes/soundscape/index.js";
import { renderMusicRoute } from "./routes/music/index.js";
import type { AudioArtifact, AudioRoute } from "./types.js";
import { AUDIO_SAMPLE_RATE } from "./runtime.js";

interface AudioCodecLlmService {
  readonly provider: string;
  readonly model: string;
  readonly maxOutputTokens: number;
  readonly temperature: number;
  generate(request: {
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
    model: string;
    maxOutputTokens: number;
    temperature: number;
    seed: number | null;
    responseFormat?: "json" | "text";
  }): Promise<{
    text: string;
    tokens: { input: number; output: number };
    costUsd: number;
    raw?: unknown;
  }>;
}

interface AudioCodecTelemetryService {
  writeText(name: string, value: string): Promise<void>;
}

interface AudioCodecServices {
  readonly llm?: AudioCodecLlmService;
  readonly telemetry?: AudioCodecTelemetryService;
  readonly dryRun?: boolean;
}

interface AudioPlanPayload {
  readonly plan: AudioPlan;
  readonly promptExpanded: string;
  readonly llmOutputRaw: string;
  readonly llmTokens: { input: number; output: number };
  readonly costUsd: number;
}

const standardSchema = toStandardSchema(AudioRequestSchema);
const AUDIO_ROUTE_DEPRECATION_WARNING =
  "`AudioRequest.route` is deprecated and will be removed after one minor version. Audio routing now lives inside `AudioCodec.route()`; keep `--route` only for compatibility while migrating callers to modality-level intent.";

function injectSchemaPreamble(prompt: string, schemaPreamble: string): string {
  return [
    "You are Wittgenstein.",
    "Return valid JSON only.",
    schemaPreamble.trim(),
    `User prompt:\n${prompt.trim()}`,
  ].join("\n\n");
}

function toStandardSchema(
  schema: typeof AudioRequestSchema,
): codecV2.StandardSchemaV1<unknown, AudioRequest> {
  const maybeStandard = (
    schema as typeof schema & {
      ["~standard"]?: codecV2.StandardSchemaV1<unknown, AudioRequest>["~standard"];
    }
  )["~standard"];
  if (maybeStandard) {
    return { "~standard": maybeStandard };
  }
  return {
    "~standard": {
      version: 1,
      vendor: "zod",
      validate: (value) => {
        const parsed = schema.safeParse(value);
        if (parsed.success) {
          return { value: parsed.data };
        }
        return {
          issues: parsed.error.issues.map((issue) => ({
            message: issue.message,
            path: issue.path,
          })),
        };
      },
    },
  };
}

function hashString(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function hashBytes(value: Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function wavDurationSec(bytes: Uint8Array): number {
  const pcm16BytesPerFrame = 2;
  const dataBytes = Math.max(0, bytes.byteLength - 44);
  return dataBytes / (AUDIO_SAMPLE_RATE * pcm16BytesPerFrame);
}

function asServices(services: codecV2.HarnessCtx["services"]): AudioCodecServices {
  return (services ?? {}) as AudioCodecServices;
}

function asAudioPlanPayload(ir: codecV2.IR): AudioPlanPayload {
  if (!codecV2.isTextIR(ir) || !ir.plan) {
    throw new Error("AudioCodec expected TextIR with AudioPlan payload.");
  }
  return ir.plan as AudioPlanPayload;
}

function routeFromRequest(req: AudioRequest): AudioRoute {
  return req.route ?? "speech";
}

function createDryRunPlan(req: AudioRequest): AudioPlan {
  const ambientCategory = isAmbientCategory(req.ambient) ? req.ambient : "auto";
  return AudioPlanSchema.parse({
    route: routeFromRequest(req),
    script: req.prompt || "Wittgenstein launches a multimodal audio artifact.",
    ambient: {
      category: ambientCategory,
      level: ambientCategory === "silence" ? 0 : 0.22,
    },
    music: {
      motif: req.prompt.slice(0, 80) || "minimal",
    },
  });
}

function forceRequestedRoute(plan: AudioPlan, req: AudioRequest): AudioPlan {
  if (!req.route) {
    return plan;
  }
  return { ...plan, route: req.route };
}

function emitRouteDeprecationWarning(req: AudioRequest, ctx: codecV2.HarnessCtx): void {
  if (!req.route) {
    return;
  }
  ctx.logger.warn(AUDIO_ROUTE_DEPRECATION_WARNING);
  ctx.sidecar.warnings.push({
    code: "audio/route-deprecated",
    message: AUDIO_ROUTE_DEPRECATION_WARNING,
    detail: {
      requestedRoute: req.route,
    },
    phase: codecV2.CodecPhase.Expand,
  });
}

function isAmbientCategory(value: unknown): value is AudioPlan["ambient"]["category"] {
  return (
    value === "auto" ||
    value === "silence" ||
    value === "rain" ||
    value === "wind" ||
    value === "city" ||
    value === "forest" ||
    value === "electronic"
  );
}

export class AudioCodec extends codecV2.BaseCodec<AudioRequest, AudioArtifact> {
  readonly name = "audio";
  readonly id = "audio";
  readonly modality = Modality.Audio;
  readonly schema = standardSchema;
  readonly routes: ReadonlyArray<codecV2.Route<AudioRequest>> = [
    { id: "speech", match: (req) => routeFromRequest(req) === "speech" },
    { id: "soundscape", match: (req) => req.route === "soundscape" },
    { id: "music", match: (req) => req.route === "music" },
  ];

  protected override async expand(req: AudioRequest, ctx: codecV2.HarnessCtx): Promise<codecV2.IR> {
    const services = asServices(ctx.services);
    const promptExpanded = injectSchemaPreamble(req.prompt, audioSchemaPreamble(req));
    emitRouteDeprecationWarning(req, ctx);
    await services.telemetry?.writeText("llm-input.txt", promptExpanded);

    if (services.dryRun) {
      const plan = createDryRunPlan(req);
      const llmOutputRaw = JSON.stringify(plan);
      await services.telemetry?.writeText("llm-output.txt", llmOutputRaw);
      return {
        kind: "text",
        text: llmOutputRaw,
        plan: {
          plan,
          promptExpanded,
          llmOutputRaw,
          llmTokens: { input: 0, output: 0 },
          costUsd: 0,
        } satisfies AudioPlanPayload,
      };
    }

    if (!services.llm) {
      throw new Error("AudioCodec requires an LLM service for non-dry-run execution.");
    }

    const generation = await services.llm.generate({
      model: services.llm.model,
      maxOutputTokens: services.llm.maxOutputTokens,
      temperature: services.llm.temperature,
      seed: ctx.seed,
      responseFormat: "json",
      messages: [
        {
          role: "system",
          content: "Return JSON only. Do not wrap it in markdown.",
        },
        {
          role: "user",
          content: promptExpanded,
        },
      ],
    });

    await services.telemetry?.writeText("llm-output.txt", generation.text);
    const parsed = parseAudioPlan(generation.text);
    if (!parsed.ok) {
      throw new Error(parsed.error.message);
    }

    const plan = forceRequestedRoute(parsed.value, req);
    return {
      kind: "text",
      text: generation.text,
      plan: {
        plan,
        promptExpanded,
        llmOutputRaw: generation.text,
        llmTokens: generation.tokens,
        costUsd: generation.costUsd,
      } satisfies AudioPlanPayload,
    };
  }

  protected override async adapt(ir: codecV2.IR): Promise<codecV2.IR> {
    return ir;
  }

  protected override async decode(ir: codecV2.IR, ctx: codecV2.HarnessCtx): Promise<AudioArtifact> {
    const payload = asAudioPlanPayload(ir);
    const startedAt = ctx.clock.now();
    const renderCtx = this.createRenderCtx(ctx);
    const result =
      payload.plan.route === "speech"
        ? await renderSpeechRoute(payload.plan, renderCtx, { allowHostTts: false })
        : payload.plan.route === "soundscape"
          ? await renderSoundscapeRoute(payload.plan, renderCtx)
          : await renderMusicRoute(payload.plan, renderCtx);
    const bytes = await readFile(result.artifactPath);
    const route = payload.plan.route;
    const decoderHash = hashString("procedural-audio-runtime");
    const audioRender = {
      sampleRateHz: AUDIO_SAMPLE_RATE,
      channels: 1,
      durationSec: wavDurationSec(bytes),
      container: "wav" as const,
      bitDepth: 16,
      determinismClass: "byte-parity" as const,
      decoderId: "procedural-audio-runtime",
      decoderHash,
    };

    return {
      outPath: result.artifactPath,
      bytes,
      mime: "audio/wav",
      metadata: {
        codec: "audio",
        route,
        warnings: [],
        llmTokens: payload.llmTokens,
        costUsd: payload.costUsd,
        durationMs: Math.max(0, ctx.clock.now() - startedAt),
        seed: ctx.seed,
        promptExpanded: payload.promptExpanded,
        llmOutputRaw: payload.llmOutputRaw,
        llmOutputParsed: payload.plan,
        quality: {
          structural: {
            schemaValidated: true,
            route,
            determinismClass: audioRender.determinismClass,
          },
          partial: {
            reason: "procedural-runtime",
          },
        },
        audioRender,
        decoderHash: {
          value: decoderHash,
          frozen: true,
          slot: "procedural-audio-runtime",
        },
        artifactSha256: hashBytes(bytes),
      },
    };
  }

  protected override async package(
    art: AudioArtifact,
    ctx: codecV2.HarnessCtx,
  ): Promise<AudioArtifact> {
    return super.package(art, ctx);
  }

  manifestRows(art: AudioArtifact): ReadonlyArray<codecV2.ManifestRow> {
    return [
      { key: "route", value: art.metadata.route },
      { key: "audioRender", value: art.metadata.audioRender },
      { key: "quality.structural", value: art.metadata.quality.structural },
      { key: "quality.partial", value: art.metadata.quality.partial },
      { key: "metadata.warnings", value: art.metadata.warnings.length },
      { key: "L5.decoderHash", value: art.metadata.decoderHash },
      { key: "artifact.sha256", value: art.metadata.artifactSha256 },
    ];
  }

  private createRenderCtx(ctx: codecV2.HarnessCtx): RenderCtx {
    return {
      runId: ctx.runId,
      runDir: ctx.runDir,
      seed: ctx.seed,
      outPath: ctx.outPath,
      logger: {
        debug: (message, data) => ctx.logger.debug(message, data),
        info: (message, data) => ctx.logger.info(message, data),
        warn: (message, data) => ctx.logger.warn(message, data),
        error: (message, data) => ctx.logger.error(message, data),
      },
    };
  }
}

export const audioCodec = new AudioCodec();
