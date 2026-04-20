# Image Codec

Image is the strictest modality in Wittgenstein. It has one path and one path only:

`LLM -> structured JSON scene spec -> adapter -> frozen decoder -> PNG`

## Position

This codec is intentionally closer to a **VQ / discrete latent token** view of images than to a direct pixel-emission or local diffusion view.

That means:

- the LLM should describe image semantics, composition, and decoder hints
- a small adapter should map those semantics into discrete latent codes
- a frozen decoder should turn those codes into raster pixels

The project is explicitly trying to move as much modality-specific work as possible out of the paid text-token loop and into a local portability layer.

## What the LLM Emits

The model emits a scene-spec JSON object. It should describe:

- intent and subject
- composition and framing
- lighting and mood
- style cues
- decoder hints such as family and latent resolution

The model does not emit SVG, HTML, Canvas programs, or raw pixels.

## Optional `providerLatents` (MiniMax / API extensions)

If the text API can return discrete VQ indices in the same JSON object, include them under `providerLatents` using the `witt.image.latents/v0.1` shape (`family`, `codebook`, `codebookVersion`, `tokenGrid`, `tokens`). When valid, the runtime **skips** the learned adapter and decodes those tokens directly.

This is the cleanest version of the thesis:

`text-first LLM -> latent tokens -> frozen decoder -> PNG`

## Pipeline Stages

- `pipeline/expand.ts`
  Expands or normalizes the scene spec after parsing.
- `pipeline/adapter.ts`
  Reserved for the only trainable component. Maps scene semantics into discrete latent tokens.
- `pipeline/decoder.ts`
  Calls a frozen pretrained decoder bridge.
- `pipeline/package.ts`
  Packages the decoded raster bytes into the final PNG artifact.

## Adapter Role

The adapter is the small learned translator between the LLM-friendly scene language and the decoder’s latent vocabulary. It is the only trainable part of the image stack in this scaffold.

Planned training shape:

- dataset: captioned image subset with scene-level descriptors
- target: decoder codebook indices
- objective: latent token prediction
- form factor: LoRA or compact translator, not a full image model

In other words, the repo is not trying to train “another image model” here. It is trying to train the smallest possible bridge between:

- text-native semantics
- decoder-native latent codes

## Decoder Candidates

- `llamagen`
- `seed`
- `dvae`-style bridge for smaller ablations

All of these are treated as frozen decoders. The project does not admit diffusion or general text-to-image generators here.

That distinction matters:

- a **generator** samples from a learned image distribution
- a **decoder** deterministically reconstructs pixels from a code representation

Wittgenstein is designed around the latter.

## Failure Modes

- the model emits invalid JSON
- the scene spec validates but the adapter cannot map semantics to latents
- the decoder family does not match the expected codebook
- packaging receives bytes in the wrong shape

## Honest Risk Statement

The scaffold now includes:

- a deterministic scene-to-latent adapter path for validating end-to-end wiring, manifests, and artifact packaging
- a narrow-domain reference decoder bridge for higher-quality local showcase output on the same `scene spec -> adapter -> decoder -> PNG` path

This still does **not** represent the final image thesis. Real generation quality ultimately depends on a properly wired frozen decoder family and a stronger scene-to-latent adapter than the current scaffold uses.

## Training the scene→latent adapter (v1)

1. Prepare `data/image_adapter/raw/metadata.jsonl` and images — see [`data/image_adapter/README.md`](../../data/image_adapter/README.md).
2. Run `python/image_adapter/prepare_dataset.py` then `encode_offline.py` then `train.py` — see [`python/image_adapter/README.md`](../../python/image_adapter/README.md).
3. Point **preferred** weights at the exported `adapter_mlp.json` when running the harness:
   - **`WITTGENSTEIN_IMAGE_ADAPTER_PREFERRED_PATH`** — new / better model (tried first)
   - **`WITTGENSTEIN_IMAGE_ADAPTER_LEGACY_PATH`** — older backup (tried if preferred fails load or grid match)
   - Legacy aliases: `WITTGENSTEIN_IMAGE_ADAPTER_MLP_PATH` (first slot) and `WITTGENSTEIN_IMAGE_ADAPTER_MLP_FALLBACK_PATH` (second slot)

Quick PNG preview (no LLM):

```bash
export WITTGENSTEIN_IMAGE_ADAPTER_PREFERRED_PATH=data/image_adapter/artifacts/adapter_mlp.json
export WITTGENSTEIN_IMAGE_ADAPTER_LEGACY_PATH=data/image_adapter/artifacts/adapter_mlp_legacy.json
pnpm exec tsx scripts/render-image-adapter-demo.ts artifacts/demo/mlp-adapter-demo-forest.png forest
```

The default training stack uses a **small MLP** (no LLM fine-tuning) and a **stub offline encoder** for targets; swap the encoder for a real frozen tokenizer when you wire a production decoder.
