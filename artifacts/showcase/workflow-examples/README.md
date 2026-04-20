# Workflow Example Pack

This pack was generated through the Wittgenstein harness using curated local JSON responses so the runs still produce manifests under `artifacts/runs/<run-id>/`.

## Groups

- `image`: 5 examples
- `music`: 5 examples
- `sensor-ecg`: 5 examples
- `sensor-gyro`: 5 examples
- `sensor-temperature`: 5 examples
- `soundscape`: 5 examples
- `tts`: 5 examples

## Sample Picks

- `image` → `02-forest` → `/Users/dujiayi/Desktop/Wittgenstein/artifacts/showcase/workflow-examples/image/02-forest.png`
- `tts` → `02-harness` → `/Users/dujiayi/Desktop/Wittgenstein/artifacts/showcase/workflow-examples/tts/02-harness.wav`
- `music` → `01-launch-minimal` → `/Users/dujiayi/Desktop/Wittgenstein/artifacts/showcase/workflow-examples/music/01-launch-minimal.wav`
- `soundscape` → `02-forest-morning` → `/Users/dujiayi/Desktop/Wittgenstein/artifacts/showcase/workflow-examples/soundscape/02-forest-morning.wav`
- `sensor-ecg` → `05-clinical` → `/Users/dujiayi/Desktop/Wittgenstein/artifacts/showcase/workflow-examples/sensor/ecg/05-clinical.html`
- `sensor-temperature` → `02-greenhouse` → `/Users/dujiayi/Desktop/Wittgenstein/artifacts/showcase/workflow-examples/sensor/temperature/02-greenhouse.html`
- `sensor-gyro` → `02-hover` → `/Users/dujiayi/Desktop/Wittgenstein/artifacts/showcase/workflow-examples/sensor/gyro/02-hover.html`

## Notes

- Image uses the sole neural path: `scene spec -> adapter -> frozen decoder -> PNG`.
- The current showcase image outputs use a narrow-domain reference decoder bridge inside that path so the demo can look less abstract while staying harness-compatible.
- TTS uses the audio speech route; on macOS it upgrades to `say` + `afconvert` automatically.
- Music and soundscape stay on the local audio runtime.
- Sensor outputs include JSON, CSV, and HTML sidecars when available.
- Every generated example has a corresponding run manifest under `artifacts/runs/`.
