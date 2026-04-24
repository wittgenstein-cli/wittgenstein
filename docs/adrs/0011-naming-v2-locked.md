# 0011 Naming v2 Locked (supersedes ADR-0010)

## Status

Accepted (ratifies RFC-0005). Supersedes ADR-0010.

## Decision

The v0.2 architecture vocabulary is the vocabulary already used in `AGENTS.md` §Architectural vocabulary and in the original PPT (`docs/references/01_Build_Book.md`). No invented names. The locked set:

- **Harness** — L1 runtime (routing, retry, seed, budget, telemetry, sandbox, manifest spine).
- **Codec** — L2 middleware: the per-modality module that owns the `produce(req) → artifact` primitive. One codec per modality group (`codec-image`, `codec-audio`, `codec-music`, `codec-soundscape`, `codec-sensor`, `codec-video`). Replaces the informal "Parasoid."
- **Spec** — L2 typed input: the structured description the LLM writes against a zod schema. Concrete forms: `SceneSpec` (image), `AudioSpec` (TTS), `MusicSpec`, `SoundscapeSpec`, `SensorSpec`, `VideoSpec`.
- **IR** — the sum type `Text | Latent | Hybrid` from Brief B / ADR-0006. The internal representation a Codec hands to its Decoder. At v0.2 only `Text` ships.
- **Decoder** — L3: IR-to-bytes renderer. Frozen decoders in-bounds (ADR-0005); general generators are not the default path.
- **Adapter** — L4: small learned bridge shipped beside a Codec (e.g. scene-to-latent for future image decoder migration). Optional; absent for rule-based modalities.
- **Packaging** — L5: CLI, install, shared schemas, docs, agent primers, distribution.

RFC-0003's four proposed renames (Loom / Transducer / Score / Handoff) are explicitly **not** adopted; see RFC-0005 §Proposal for rejection rationale per name.

## Consequence

- `AGENTS.md` §Architectural vocabulary is the canonical reference and does not change.
- `docs/architecture.md`, `THESIS.md`, `README.md` use only the seven locked names; any residual "Loom / Transducer / Score / Handoff" prose gets scrubbed in the alignment PR.
- `THESIS.md §Open` loses the "middleware-layer naming" bullet — it is now resolved: the middleware layer is **Codec**.
- `docs/inheritance-audit.md` N-3 (naming) moves from *revise* to *resolved*.
- Zero code-surface change: `packages/codec-*` directories already use the locked names, so no rename work.
- `docs/glossary.md` (if created in a follow-up PR) indexes these seven names with one-sentence definitions and cross-refs to AGENTS.md. No new vocabulary file is required for ADR-0011 to be load-bearing.
- Kill criterion: if a senior contributor produces a concrete package-level API that reads more clearly under a rename than under the locked names, reopen individually — never the whole set.
