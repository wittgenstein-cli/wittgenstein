# Docs Index

## Core

- [`architecture.md`](architecture.md)
- [`technical-details-script.md`](technical-details-script.md)
- [`codec-protocol.md`](codec-protocol.md)
- [`build-philosophy.md`](build-philosophy.md)
- [`product-spec.md`](product-spec.md)
- [`hard-constraints.md`](hard-constraints.md)
- [`team-split.md`](team-split.md)
- [`reproducibility.md`](reproducibility.md)
- [`distribution.md`](distribution.md)

## Codecs

- [`codecs/image.md`](codecs/image.md)
- [`codecs/audio.md`](codecs/audio.md)
- [`codecs/video.md`](codecs/video.md)
- [`codecs/sensor.md`](codecs/sensor.md)
- [`codecs/svg.md`](codecs/svg.md)

## Architecture Decisions

- [`adrs/README.md`](adrs/README.md)
- [`adrs/0001-record-architecture-decisions.md`](adrs/0001-record-architecture-decisions.md)
- [`adrs/0002-typescript-pnpm-monorepo.md`](adrs/0002-typescript-pnpm-monorepo.md)
- [`adrs/0003-five-layer-harness-foundation.md`](adrs/0003-five-layer-harness-foundation.md)
- [`adrs/0004-neural-codec-as-sole-image-path.md`](adrs/0004-neural-codec-as-sole-image-path.md)
- [`adrs/0005-decoder-not-generator.md`](adrs/0005-decoder-not-generator.md)

## Research

- [`research/compression-view-of-llms.md`](research/compression-view-of-llms.md) — LLMs as neural compressors; why structured IR is the right LLM output surface
- [`research/frozen-llm-multimodality.md`](research/frozen-llm-multimodality.md) — frozen backbone + adapter vs. end-to-end multimodal giants
- [`research/neural-codec-references.md`](research/neural-codec-references.md) — annotated reference sheet: VQ-VAE → VQGAN → DALL-E 1 → LlamaGen → SEED → FSQ → TiTok
- [`research/vq-tokens-as-interface.md`](research/vq-tokens-as-interface.md) — why discrete VQ tokens are the right LLM–decoder interface; adapter geometry; TiTok direction

## Execution

- [`exec-plans/README.md`](exec-plans/README.md)
- [`exec-plans/active/core-day-1.md`](exec-plans/active/core-day-1.md)
- [`exec-plans/active/image-day-1.md`](exec-plans/active/image-day-1.md)
- [`exec-plans/active/audio-day-1.md`](exec-plans/active/audio-day-1.md)
- [`exec-plans/active/video-day-1.md`](exec-plans/active/video-day-1.md)
- [`exec-plans/active/sensor-day-1.md`](exec-plans/active/sensor-day-1.md)
- [`exec-plans/active/site-day-1.md`](exec-plans/active/site-day-1.md)

## Launch & Benchmarks

- [`hackathon-launch.md`](hackathon-launch.md) — launch checklist and demo script
- [`benchmark-standards.md`](benchmark-standards.md) — quality bar and acceptance criteria
- [`modality-launch-surface.md`](modality-launch-surface.md) — per-modality external API surface
- [`implementation-status.md`](implementation-status.md) — what ships now vs what is a typed stub

## Agent contact text (extended primers)

- [`../packages/agent-contact-text/README.md`](../packages/agent-contact-text/README.md) — bundled 00–03 narrative corpus for coding agents (see also root [`AGENTS.md`](../AGENTS.md)).

## References

- [`references/README.md`](references/README.md)
- [`references/01_Build_Book.md`](references/01_Build_Book.md)
- [`references/02_AI_Execution_Context.md`](references/02_AI_Execution_Context.md)
- [`references/03_Research_Reference_Dossier.md`](references/03_Research_Reference_Dossier.md)
