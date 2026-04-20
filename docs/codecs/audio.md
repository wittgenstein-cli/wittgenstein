# Audio Codec

Audio is the shared runtime for both `tts` and broader audio generation.

## CLI Surface

- `wittgenstein tts "launch line" --ambient rain --out out.wav`
- `wittgenstein audio "ambient score" --route music --out out.wav`

## IR

The model emits an `AudioPlan`, not raw samples.

Core fields:

- `route`: `speech | soundscape | music`
- `script`: short spoken or guiding text
- `ambient`: `auto | silence | rain | wind | city | forest | electronic`
- `timeline` and `music` metadata

## Render Path

- `speech`: local speech render plus optional ambient layer
- `soundscape`: deterministic ambient texture render
- `music`: tiny symbolic synth plus optional ambient layer

## Artifact

The current fast path emits `WAV`.

## Benchmark Case

See `tts-launch` and `audio-music` in `benchmarks/cases.json`.
