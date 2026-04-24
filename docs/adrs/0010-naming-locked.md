# 0010 Naming Locked

## Status

⛔ **Superseded by ADR-0011 (2026-04-24).** Kept for historical traceability. The four names below (Loom / Transducer / Score / Handoff) are **not** adopted; see ADR-0011 for the locked vocabulary (Harness / Codec / IR / Spec / Adapter / Decoder / Packaging), which matches `AGENTS.md` §Architectural vocabulary and the original PPT. Reason for reversal: `docs/v02-alignment-review.md` §2.2 — the RFC-0003 rename replaced names that were already correct in the codebase and pitch, at measurable agent-readability cost.

## Decision

Four names lock, per RFC-0003:

- **Loom** — the middleware layer that weaves text-model output into non-text artifacts. Retires the informal placeholder "Parasoid."
- **Transducer** — the conceptual unit comprising the Adapter (L4) and Decoder (L5) pair. One word, signal-processing heritage, covers both directions.
- **Score** — the Build Artifact primitive between `Handoff` and the final artifact; composition metaphor preserves "plan a rendering" intuition and aligns with the user's 作品 / opus framing.
- **Handoff** — the sum type `Text | Latent | Hybrid` introduced as `IR` in early RFC-0001 drafts. Born-named `Handoff` so RFC-0001's M1 interface lands with the final name and no rename cost.

## Consequence

All four names are load-bearing as of v0.2. `Parasoid` is retired from pitch material, slack, and docs; new contributors never see the word. `docs/architecture.md` gains a "Conceptual name" column mapping L1 Harness, L2 Codec, L3 Decoder, L4 Adapter, L5 Packaging, with L3+L4 jointly labeled **Transducer**. A `docs/glossary.md` indexes the four names with one-sentence definitions. Kill criterion from RFC-0003 stays live: if more than one external contributor asks "what is a Loom" in the first 90 days post-adoption, discovery has failed and the name gets replaced — but only by a paired RFC + ADR, not by drift.
