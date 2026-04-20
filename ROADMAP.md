# Roadmap

Wittgenstein is built in phases. Each phase is self-contained and shippable — the repo
should be useful (and honest) at every phase boundary, not only at the end.

For per-component status see [`docs/implementation-status.md`](docs/implementation-status.md).
For architectural decisions see [`docs/adrs/`](docs/adrs/).

---

## Phase 0 — Foundation ✅ (shipped 2026-04)

The scaffold and the Python proving ground.

- pnpm TypeScript monorepo with strict types and project references
- Five-layer architecture explicit in the repo structure
- `polyglot-mini` Python surface: image (code-as-painter), TTS + ambient, sensor + loupe
- Image style MLP and audio ambient classifier trained on real data
- CI (lint, typecheck, test) green on push and PR
- Research notes, benchmark standards, implementation status, quickstart

## Phase 1 — Image neural codec real 🚧 (next)

Move the image path from "harness wired with placeholder latents" to "real VQ decoder in".

- [ ] Wire a frozen pretrained VQ decoder (LlamaGen or TiTok candidate)
- [ ] Train the scene-to-latent adapter on a caption subset (CC12M or LAION-COCO slice)
- [ ] Report CLIPScore on 100-prompt benchmark set
- [ ] First golden fixture in `fixtures/golden/image/`
- [ ] Adapter training recipe documented in `packages/codec-image/src/training/README.md`

## Phase 2 — Audio quality upgrade

Move audio from "macOS `say` + procedural ambient" to "local neural TTS".

- [ ] Integrate Coqui XTTS or Piper as local TTS engine (cross-platform)
- [ ] Keep `say` fallback for zero-setup demos
- [ ] Add UTMOS scoring to benchmark harness
- [ ] Extend ambient categories and add a music route (symbolic → synth)

## Phase 3 — Video codec real

- [ ] Integrate HyperFrames (composition IR → MP4)
- [ ] Add FVD scoring hook
- [ ] Golden fixture + CI check

## Phase 4 — Benchmark suite landing

Move benchmarks from "structural smoke proxy" to "standard metrics alongside the proxy".

- [ ] CLIPScore runner for image (`benchmarks/tools/clipscore.py`)
- [ ] Whisper WER runner for TTS (`benchmarks/tools/wer.py`)
- [ ] Discriminative-score classifier for sensor
- [ ] 10 prompts per modality; results committed per release tag
- [ ] Chart generator producing `artifacts/benchmarks/<tag>.png`

## Phase 5 — Distribution

Make the CLI genuinely one-line installable.

- [ ] Publish `@wittgenstein/cli` to npm under a release tag
- [ ] `curl | sh` install script producing a working local env
- [ ] Skill-ready AGENTS.md surface for agent harnesses
- [ ] Homebrew formula (macOS) and pipx package for the Python surface

## Phase 6 — Site and launch content

- [ ] Architecture diagram rendered as image
- [ ] Demo gallery with real artifacts
- [ ] Install instructions and minimal tutorial on `apps/site/`
- [ ] Release notes page

---

## Explicit non-goals

These are stable decisions, not "not yet":

- **No diffusion in the core image path.** Frozen VQ decoders only. If you need a diffusion generator, use a separate tool.
- **No fine-tuning of frontier LLMs.** Adapters and codec layers carry the modality work. The base LLM stays frozen and text-first.
- **No cloud render APIs in the default path.** `--live` may call a hosted LLM for planning; the renderer always runs locally.
- **No silent fallbacks for image.** If the neural codec fails, the CLI returns a structured error. No SVG or canvas "temporary fallback."

---

## How roadmap changes land

1. A phase is considered closed when its items ship, CI is green on the new metric, and `CHANGELOG.md` has an entry.
2. Phase reordering goes through an ADR in `docs/adrs/`.
3. Major scope changes update this file and the opening section of `README.md` in the same commit.
