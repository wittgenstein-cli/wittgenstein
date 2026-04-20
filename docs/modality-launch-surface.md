# Modality Launch Surface

This is the lightweight contract for the four launch-critical user paths: `image`, `tts`, `audio`, and `sensor`.

| Path | CLI | Structured IR | Artifact | Minimal benchmark case |
| --- | --- | --- | --- | --- |
| Image | `wittgenstein image "..." --out out.png` | `ImageSceneSpec` | PNG | `image-editorial` |
| TTS | `wittgenstein tts "..." --ambient rain --out out.wav` | `AudioPlan` with `route = speech` | WAV | `tts-launch` |
| Audio | `wittgenstein audio "..." --route music --out out.wav` | `AudioPlan` | WAV | `audio-music` |
| Sensor | `wittgenstein sensor "..." --out out.json` | `SensorSignalSpec` algorithm/operator plan | JSON + CSV + HTML | `sensor-ecg` |

## Unified Shape

Each path should stay aligned on five things:

1. Input prompt from CLI.
2. Structured JSON contract as the codec boundary.
3. Deterministic or bounded render path to an artifact.
4. A single benchmark case that is cheap to rerun.
5. A manifest under `artifacts/runs/<run-id>/`.

## Notes

- `tts` is a convenience command, not a new modality. It rides the audio codec's speech route.
- `sensor` should prefer algorithm specs over raw point-by-point generation.
- `image` keeps the stricter thesis path and should not pick up painter-style fallbacks in the main harness.
