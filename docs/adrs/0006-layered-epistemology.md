# 0006 Layered Epistemology — compression for rendering, world-models for planning

## Status

Accepted

## Decision

Wittgenstein adopts Brief B's Position (iii) Layered as its epistemic stance, enforced via Position (iv) Agnostic as the engineering contract. Concretely: the compression lineage (Shannon / Kolmogorov / Hutter / Sutskever / Delétang 2023, arXiv:2309.10668) governs rendering — tokens in, artifact out, next-token prediction all the way down. The world-model lineage (LeCun 2022 position paper; I-JEPA arXiv:2301.08243; V-JEPA arXiv:2404.08471; V-JEPA 2 arXiv:2506.09985) is acknowledged as the credible counter-hypothesis for planning and reserved a slot in the protocol without being implemented yet. The `IR = Text | Latent | Hybrid` sum type (RFC-0001; name locked by ADR-0011) encodes this contract: `Text` ships now, `Latent` is JEPA's slot, `Hybrid` is the escape hatch.

## Consequence

Wittgenstein is neither Ilya-pure nor LeCun-pure. The architecture stays text-first because compression is the only lineage with shipped receipts at this scale, but the protocol does not pretend the world-model lineage is wrong — it leaves a typed hole that a future planner can fill without a rewrite. The kill criteria from Brief B are load-bearing: (1) if JEPA multimodal parity reaches ≥28/35 on the showcase blind pairwise eval by Q3 2026, we move to Position (ii); (2) if a compositional held-out benchmark drops below 60% after two IR extensions, we promote `Latent` to active; (3) if v2 → v4 ships with `Latent` uninhabited, the sum type collapses back to just `Text` — we were cosplaying.
