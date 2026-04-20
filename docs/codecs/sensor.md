# Sensor Codec

Sensor is a first-class codec for structured procedural signals.

## IR

The model emits a signal algorithm spec, not raw sample arrays.

Core fields:

- `signal`
- `sampleRateHz`
- `durationSec`
- `algorithm`
- `operators`
- `notes`

## Operator Families

- `oscillator`
- `noise`
- `drift`
- `pulse`
- `step`
- `ecgTemplate`

The runtime deterministically expands the operator list into samples.

## Renderer Families

- ECG
- temperature
- gyro

## Artifact

The fast path emits:

- JSON sample bundle
- CSV sidecar
- `loupe` HTML dashboard

## Benchmark Case

See `sensor-ecg` in `benchmarks/cases.json`.
