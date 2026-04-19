import { z } from "zod";

export const Modality = {
  Image: "image",
  Audio: "audio",
  Video: "video",
  Sensor: "sensor",
  Svg: "svg",
} as const;

export type Modality = (typeof Modality)[keyof typeof Modality];

export const ModalitySchema = z.enum(["image", "audio", "video", "sensor", "svg"]);

export const BaseRequestSchema = z.object({
  prompt: z.string().min(1),
  out: z.string().optional(),
  seed: z.number().int().nullable().optional(),
});

export type BaseRequest = z.infer<typeof BaseRequestSchema>;

export const ImageRequestSchema = BaseRequestSchema.extend({
  modality: z.literal("image"),
  size: z.tuple([z.number().int().positive(), z.number().int().positive()]).optional(),
});
export type ImageRequest = z.infer<typeof ImageRequestSchema>;

export const AudioRequestSchema = BaseRequestSchema.extend({
  modality: z.literal("audio"),
  route: z.enum(["speech", "soundscape", "music"]).optional(),
  durationSec: z.number().positive().optional(),
});
export type AudioRequest = z.infer<typeof AudioRequestSchema>;

export const VideoRequestSchema = BaseRequestSchema.extend({
  modality: z.literal("video"),
  durationSec: z.number().positive().optional(),
});
export type VideoRequest = z.infer<typeof VideoRequestSchema>;

export const SensorRequestSchema = BaseRequestSchema.extend({
  modality: z.literal("sensor"),
  signal: z.string().optional(),
  sampleRateHz: z.number().positive().optional(),
  durationSec: z.number().positive().optional(),
});
export type SensorRequest = z.infer<typeof SensorRequestSchema>;

export const SvgRequestSchema = BaseRequestSchema.extend({
  modality: z.literal("svg"),
});
export type SvgRequest = z.infer<typeof SvgRequestSchema>;

export const WittgensteinRequestSchema = z.discriminatedUnion("modality", [
  ImageRequestSchema,
  AudioRequestSchema,
  VideoRequestSchema,
  SensorRequestSchema,
  SvgRequestSchema,
]);
export type WittgensteinRequest = z.infer<typeof WittgensteinRequestSchema>;
