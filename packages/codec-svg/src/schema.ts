import { z } from "zod";
import type { Result } from "@wittgenstein/schemas";
import type { SvgRequest } from "@wittgenstein/schemas";
import { SvgRequestSchema } from "@wittgenstein/schemas";

export const SvgIrSchema = z.object({
  svg: z
    .string()
    .min(1)
    .refine((s) => s.trimStart().toLowerCase().startsWith("<svg"), {
      message: 'Expected a root "<svg" document.',
    })
    .refine((s) => s.includes("</svg>"), {
      message: 'Expected a closing "</svg>" tag.',
    }),
});

export type SvgIr = z.infer<typeof SvgIrSchema>;

export function svgSchemaPreamble(req: SvgRequest): string {
  return [
    "Emit JSON only for the vector codec.",
    'Shape: {"svg":"<svg xmlns=\\"http://www.w3.org/2000/svg\\" ...>...</svg>"}',
    "The svg field must be a single self-contained SVG document (no markdown fences).",
    `Requested seed: ${req.seed ?? "null"}.`,
  ].join("\n");
}

export function parseSvgIr(raw: string): Result<SvgIr> {
  try {
    const json = JSON.parse(raw) as unknown;
    const parsed = SvgIrSchema.safeParse(json);
    if (!parsed.success) {
      return {
        ok: false,
        error: {
          code: "SVG_SCHEMA_INVALID",
          message: "SVG IR failed validation.",
          details: { issues: parsed.error.issues },
        },
      };
    }
    return { ok: true, value: parsed.data };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "SVG_SCHEMA_PARSE_FAILED",
        message: "SVG IR was not valid JSON.",
        cause: error,
      },
    };
  }
}

export { SvgRequestSchema };
