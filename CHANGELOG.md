# Changelog

All notable changes to Wittgenstein are recorded here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versioning follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.1.0-alpha.1] — 2026-04-20 — Early Preview

First public prerelease before the formal `0.1.0` cut. This snapshot is the current
verified stage build: enough of the system ships to produce real files, benchmark dry
runs, and exercise the core harness contracts, while the neural image decoder bridge and
video renderer remain intentionally incomplete.

### Added
- TypeScript monorepo (`packages/*`) with pnpm workspaces, strict mode, project references
- `@wittgenstein/schemas` — shared zod codec contract, `RunManifest`, `Modality`
- `@wittgenstein/core` — harness runtime with routing, retry, budget, telemetry, manifest spine, seed control
- `@wittgenstein/codec-image` — neural codec skeleton: LLM → JSON scene spec → adapter → frozen decoder → PNG
- `@wittgenstein/codec-audio` — speech, soundscape, music routes with ambient layering
- `@wittgenstein/codec-sensor` — deterministic operator-spec signal generation + loupe HTML dashboard
- `@wittgenstein/codec-video` — composition IR scaffold
- `@wittgenstein/cli` — `wittgenstein` command with init, image, audio, tts, video, sensor, doctor subcommands
- `polyglot-mini/` — Python rapid-prototype surface implementing the same five layers end-to-end
- `loupe.py` — zero-dependency CSV/JSON → self-contained interactive HTML dashboard
- `apps/site/` — Next.js 14 App Router site scaffold
- `.github/workflows/ci.yml` — install, lint, typecheck, test on push and PR
- Apache 2.0 license
- `docs/research/vq-tokens-as-interface.md` — core design note explaining why discrete VQ tokens are the chosen LLM–decoder interface
- `docs/implementation-status.md` — honest Ships / Partial / Stub matrix across Python + TS surfaces
- `docs/quickstart.md` — 30-second tour producing real files (sensor, audio, image paths)
- `docs/extending.md` — concrete recipes for adding codecs and adapters in both surfaces
- `CHANGELOG.md`, `ROADMAP.md`, `SECURITY.md` at repo root
- Baseline results table in `benchmarks/README.md` (dry-run 2026-04)
- Adapter training baselines: image style MLP (781 COCO examples, 9 s, val BCE 0.7698) and audio ambient classifier (369 examples, < 5 s)

### Changed
- Root `README.md` — restructured for engineer / hacker / researcher readability; receipts table; two-surface positioning; extensibility section
- `docs/benchmark-standards.md` — full measurement protocol, per-modality quality-proxy scoring breakdown, real measured baselines
- Research notes (`compression-view-of-llms.md`, `frozen-llm-multimodality.md`, `neural-codec-references.md`) rewritten from stubs to full arguments with citations
- `polyglot-mini/README.md` — explicit five-layer mapping, precise MLP architecture numbers, provider routing table, decoder ≠ generator section
- `.env.example` — added LLM provider keys (Moonshot / MiniMax / OpenAI / Anthropic)
- `packages/codec-sensor/src/render.ts` — promoted dynamic imports to static top-level; hoisted `__dir` to module scope
- `polyglot-mini/train/train.py` and `train_audio.py` — suppress numpy overflow / divide-by-zero RuntimeWarnings during training

### Fixed
- Deleted stale merged branches `chore/repo-root-wittgenstein` and `feat/foundation-framework`
- Removed pointless `.gitkeep` at repo root and empty legacy `train/` directory

### Locked
- Image has exactly one path: `LLM → JSON scene → adapter → frozen decoder → PNG`
- No diffusion generators, no SVG/HTML/Canvas fallbacks for image
- Every run writes a manifest under `artifacts/runs/<id>/`
- Shared contracts live in `@wittgenstein/schemas`; codec packages depend on schemas, not each other

[Unreleased]: https://github.com/Moapacha/wittgenstein/compare/v0.1.0-alpha.1...HEAD
[0.1.0-alpha.1]: https://github.com/Moapacha/wittgenstein/releases/tag/v0.1.0-alpha.1
