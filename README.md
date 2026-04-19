# Wittgenstein

Wittgenstein is a harness-first multimodal system: the LLM plans, the runtime executes, and codecs turn structured IR into real artifacts with a traceable manifest spine.

> **Thesis:** prompts are not the contract. The contract lives in schemas, codec boundaries, renderer logic, and artifact traces.

| Resource | |
| --- | --- |
| **Upstream** | [`github.com/Moapacha/wittgenstein`](https://github.com/Moapacha/wittgenstein) |
| **Landing** | `pnpm dev:site` → [`apps/site`](apps/site/README.md) |

## At A Glance

- `image` keeps a strict single path: `LLM -> JSON scene -> adapter -> frozen decoder -> PNG`
- `tts` and `audio` share one audio codec, with local WAV rendering and optional ambient layering
- `sensor` now uses deterministic algorithm/operator specs and can emit `JSON + CSV + loupe HTML`
- every run leaves a manifest trail under `artifacts/runs/<run-id>/`

## Core Position

Wittgenstein is intentionally closest to the following research framing:

- the base LLM remains primarily a **text planner**
- modality-specific generation is pushed into a **portable codec layer**
- the image path prefers **discrete latent / VQ-style tokens**
- the local image stack is **adapter + frozen decoder**, not a diffusion generator
- extra capability should come from local compute, codecs, retrieval, and tiny adapters, not extra paid token loops

Put differently:

> multimodality is treated here less as “one giant model that knows every modality” and more as “a text-first model connected to modality-specific codecs, latent spaces, and decoders.”

## Why This Repo Exists

Most multimodal demos hide important contracts in prompts or product copy. Wittgenstein pushes those contracts into code:

- schemas define the boundary
- codecs define modality-specific IR
- renderers or decoders produce artifacts
- the harness records what happened

That makes the repo much easier to debug, benchmark, and ship during a hackathon.

It also keeps the repo aligned with a very specific thesis:

- tokens can be a usable cross-modal interface
- vector-quantized or otherwise discrete latents are a plausible bridge between text planning and raster decoding
- a **decoder is not the same thing as a generator**
- the most valuable trainable component is often the small adapter in the middle, not the whole model stack

## What Works Right Now

| Path | Current state | Output |
| --- | --- | --- |
| Image | Main harness path is wired; local adapter work is documented in `python/image_adapter` | PNG |
| TTS | CLI alias over the audio speech route | WAV |
| Audio | Speech, soundscape, and music all render locally | WAV |
| Sensor | Deterministic operator spec expands to samples and a `loupe` dashboard | JSON, CSV, HTML |
| Video | Composition IR scaffold only; MP4 branch still needs to be merged | Pending |

For image specifically, the intended end-state is:

`LLM scene spec -> small scene-to-latent adapter -> VQ/discrete image tokens -> frozen decoder -> PNG`

That is already the architecture the repo is converging toward, even if the current implementation still uses a placeholder adapter/decoder bridge in places.

## Fast Start

```bash
pnpm install
pnpm typecheck
pnpm --filter @wittgenstein/cli exec wittgenstein --help
```

## Demo Commands

```bash
pnpm demo:sensor
pnpm demo:audio
pnpm demo:tts
pnpm train:audio-adapter
pnpm launch:check
pnpm benchmark
```

Demo artifacts land in `artifacts/demo/`.

## CLI Surface

```bash
wittgenstein init
wittgenstein image  "scene prompt" --out out.png
wittgenstein tts    "launch voiceover" --ambient rain --out out.wav
wittgenstein audio  "ambient score" --route music --out out.wav
wittgenstein video  "video prompt" --out out.mp4
wittgenstein sensor "stable ecg trace" --out out.json
wittgenstein doctor
```

## Benchmarks

The repo now includes a lightweight benchmark harness that reports:

- **Cost** (API spend where applicable)
- **Latency**
- **Quality** (modality-specific smoke metrics)

The current harness is intentionally a **smoke benchmark** for quick iteration. The longer-term standard-metric plan is documented separately:

- [`benchmarks/README.md`](benchmarks/README.md)
- [`docs/benchmark-standards.md`](docs/benchmark-standards.md)

Current common-metric targets:

- `image`: `FID` and `CLIPScore`
- `tts/audio`: `MOS` and ASR-based intelligibility such as `WER` or `PER`
- `sensor`: common synthetic time-series measures such as `discriminative score` and `predictive score`
- `video`: `FVD` and `Video-Bench` style evaluation once the MP4 branch is merged

## Why VQ / Latent Tokens

The repo is increasingly standardized around a simple claim:

- raw pixels are too expensive and too fragile as an LLM output surface
- structured scene specs are cheap and controllable
- discrete latent codes are a better bridge from text semantics to raster files than direct pixel emission

This is why the image branch favors:

- scene JSON as the LLM contract
- optional `providerLatents`
- small adapter bundles
- frozen decoder families such as `llamagen`, `seed`, or `dvae`-style bridges

The practical benefit is that we can keep the model-side API mostly text-only while moving modality-specific work into a portability layer.

## Key Docs

- [`AGENTS.md`](AGENTS.md) — short working rules and repo map
- [`docs/architecture.md`](docs/architecture.md) — the five-layer system
- [`docs/codecs/image.md`](docs/codecs/image.md) — the image path, discrete latents, and decoder posture
- [`docs/codec-protocol.md`](docs/codec-protocol.md) — codec contract
- [`docs/reproducibility.md`](docs/reproducibility.md) — manifest spine and seed rules
- [`docs/modality-launch-surface.md`](docs/modality-launch-surface.md) — lightweight contract for image, tts, audio, and sensor
- [`docs/hackathon-launch.md`](docs/hackathon-launch.md) — launch checklist and engineering priorities
- [`packages/cli/README.md`](packages/cli/README.md) — npm-facing CLI usage

## Workspace Layout

- `packages/schemas` — shared zod schemas and codec contracts
- `packages/core` — harness runtime, routing, retry, telemetry, manifests
- `packages/codec-image` — the only shipping image path
- `packages/codec-audio` — WAV routes plus ambient layering
- `packages/codec-video` — composition-first video scaffold
- `packages/codec-sensor` — deterministic signal generation plus `loupe` sidecars
- `packages/cli` — the `wittgenstein` command
- `apps/site` — official site scaffold
- `python/image_adapter` — local image-adapter data and training scripts
- `polyglot-mini` — rapid Python-first prototype area

## Locked Constraints

- image has exactly one shipping path
- shared contracts live in `packages/schemas`
- runs stay traceable under `artifacts/`
- the main harness should prefer deterministic, inspectable boundaries over prompt-only behavior
- frozen decoders are in-bounds; general-purpose local image generators are not the intended main path

## License

Apache 2.0. See [`LICENSE`](LICENSE).
