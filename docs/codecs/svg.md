# SVG Codec

The `svg` modality is the **Path A** vector track: a **small instruct model + LoRA** (you train in `research/chat2svg-lora/`) served over HTTP with **Outlines** JSON-schema constrained decoding, plus a strict TS parse/write path in `packages/codec-svg`.

## Flow

1. CLI: `wittgenstein svg "<prompt>"`.
2. Harness expands the prompt with the codec preamble and POSTs to the configured engine (`config.svg.inferenceUrl` + `requestPath`, overridable with `WITTGENSTEIN_SVG_INFERENCE_URL`).
3. Engine returns `{ "text": "{\"svg\":\"...\"}" }` (same string shape as other modalities’ `llmOutputRaw`).
4. `codec-svg` parses JSON, checks root `<svg` / `</svg>`, writes UTF-8 `output.svg`.

## Training and serving

See [`research/chat2svg-lora/README.md`](../../research/chat2svg-lora/README.md).

## Notes

- **XGrammar** can replace or augment Outlines at the engine layer; the harness contract stays the same.
- This modality is **orthogonal** to the sole neural **image** path documented in [`architecture.md`](../architecture.md).
