# 0008 Codec Protocol v2 Adoption

## Status

Accepted (ratifies RFC-0001)

## Decision

Wittgenstein adopts Codec Protocol v2 as specified in RFC-0001. The `Codec<Req, Art>.produce(req, ctx): Promise<Art>` primitive replaces per-modality branching in `packages/core/src/runtime/harness.ts:123-172`. Strategy moves from request schema into codec-declared `Route` metadata, retiring `AudioRequest.route`, `SvgRequest.source`, `AsciipngRequest.source`, and `VideoRequest.inlineSvgs`. Every codec implements the full L3–L5 pipeline (`expand → adapt → decode → package`), even if L4 adapter or L5 packaging is a no-op — the seams exist uniformly. The codec authors its own `manifestRows(art)`; harness merges but does not override, retiring `harness.ts:139-172`. The `IR = Text | Latent | Hybrid` sum type (name locked by ADR-0011) is the canonical handoff shape between LLM and codec, with only `Text` inhabited at v0.2. Default pipeline is **one LLM round** with schema-in-preamble (the current `codec-image/src/pipeline/expand.ts` shape, matching the PPT's strict-image-path slide). A second expansion round is an optional `--expand` flag per codec, not the default — two-round pipelines pay double LLM latency and cost for a quality lift that has not been measured; revisit only if Brief E benchmarks show a real image-quality delta under the one-round default. Amended 2026-04-24 per `docs/v02-alignment-review.md` §2.3.

## Consequence

Migration is phased **image → audio → sensor → cleanup** (exec plan `docs/exec-plans/active/codec-v2-port.md`, amended 2026-04-24 per `docs/v02-alignment-review.md` §2.4 — image first because it stresses L4 adapter and L5 packaging hardest). Kill date for the pre-v2 surface is v0.3.0. Brief A's rename "VQ decoder" → "LFQ-family discrete-token decoder" lands in M5 alongside the harness cleanup, updating ADR-0005's vocabulary without weakening its content. Future scale-out past ~10 modalities is unblocked because adding a modality is now "implement `Codec` once," not "add a branch to the harness and four fields to the request schema." If after migration ≥2 modalities still need special-case harness carve-outs, or if the round-trip test cannot fit a new modality in ≤20 lines, RFC-0001's kill criteria fire and v3 opens.
