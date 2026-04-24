# Codec v2 Port — P6 execution plan (stub)

**Date opened:** 2026-04-25
**Last amended:** 2026-04-24 (ordering flipped image-first; two-round default dropped; Handoff renamed back to IR — see `docs/v02-alignment-review.md` §2.3, §2.4)
**Feeds from:** ADR-0008 (Codec Protocol v2 adoption), ADR-0011 (naming v2), RFC-0001, Brief A (LFQ rename), Brief E (benchmarks v2 targets)
**Status:** 🔴 Not started — stub

## Purpose

This is the execution plan for the code port ratified by ADR-0008. It is deliberately
*outside* the docs-phase sequence P1–P5: the restructuring phases lock decisions; this
plan lands the migration.

Scope: port Wittgenstein's existing 7 modality groups from the v0.1 harness surface to
the Codec v2 protocol (RFC-0001), in the order **image → audio → sensor → cleanup**,
while retiring the five confirmed code smells.

## Ordering rationale (image first, not sensor first)

The earlier draft ordered `sensor → audio → image`, reasoning that sensor was the
cheapest migration. That rationale fails on closer reading. `codec-sensor` has no L4
adapter and a near-trivial L5 — porting it first proves only that the `Codec<Req, Art>`
shape can absorb a simple case, which was never in doubt. The useful pressure test is
the hardest modality: `codec-image` is the only codec with both an L4 adapter slot and
a non-trivial L5 packaging step, and it is also the priority-one pipeline per
`docs/v02-alignment-review.md` §3 (LLM-to-image is the user's stated first target).
Port image first, and the protocol either fits or visibly breaks. Audio and sensor then
land as confirmations, not discoveries.

## Phase ordering

| Phase | Work | Gate |
|---|---|---|
| M0 | Introduce `Codec<Req, Art>`, `IR`, `Route`, `HarnessCtx` types in `packages/schemas` behind an `@experimental` tag. No call-site change. | Types land; `pnpm typecheck` green. |
| M1 | Port `codec-image` (svg, ascii-png, raster) first — only modality with both L4 adapter slot and non-trivial L5, so it stresses the protocol hardest. Default pipeline stays one LLM round (schema-in-preamble). `--expand` flag opts into a round-1 expansion pass for A/B comparison. | Goldens preserve; manifest rows codec-authored; round-trip test ≤20 lines; Brief A's "LFQ-family discrete-token decoder" rename lands in ADR-0005 addendum. |
| M2 | Port `codec-audio` (speech, soundscape, music) — eliminates the 80-line route copy-paste. | Goldens preserve; `AudioRequest.route` deprecated with warning. |
| M3 | Port `codec-sensor` (ecg, gyro, temperature) — confirmation case (no L4), closes the modality sweep. | Goldens preserve; `SensorRequest` surface unchanged from user side. |
| M4 | Retire `harness.ts:123-172` modality branching + `:139-172` manifest overrides. Remove `AudioRequest.route`, `SvgRequest.source`, `AsciipngRequest.source`, `VideoRequest.inlineSvgs`. | Harness is modality-blind; `codec-video` (🔴 stub) awaits its own M-slot. |
| M5 | Land benchmarks v2 bridge (Brief E): VQAScore / UTMOS+WER / librosa / LAION-CLAP / NeuroKit2 / rule lists / clip-frame-drift, default tier only. `--quality=heavy` remains opt-in. | Composite Quality score reports; `quality_partial` invariant enforced. |

Kill date for pre-v2 surface: **v0.3.0**. Post v0.3.0 the old interfaces are compile
errors, not deprecation warnings.

## Out of scope (explicit)

- Two-round LLM default — the single-call `expand → decoder` pipeline stays the default. Two-round is opt-in via `--expand` and gated on Brief E showing a measured quality delta. See ADR-0008 §Decision amendment.
- JEPA / `IR.Latent` implementation — gated on Brief B kill criterion 1 (JEPA multimodal parity by Q3 2026). Until then `Latent` stays uninhabited.
- Site rewrite (RFC-0004) — tracked as a separate PR against the site repo.
- CLI ergonomics port (RFC-0002 / ADR-0009) — adjacent execution plan, can parallelize with M2–M5.
- New modalities beyond the current 7 — post-M5.
- Path C code (ADR-0007 — rejected).

## Review

Two hats at every phase boundary:

- **Researcher hat:** does this migration preserve the verdicts of Brief A, Brief B, Brief E?
- **Hacker hat:** can the resulting `Codec<Req, Art>` absorb an 8th modality in ≤20 lines, as RFC-0001's round-trip test requires?

## Next step

This file is a stub. The full phase-by-phase plan (per-package diff, golden fixture
strategy, migration tests, rollback criteria) is written as its own planning pass before
M0 starts.
