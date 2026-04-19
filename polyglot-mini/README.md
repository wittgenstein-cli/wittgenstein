# Wittgenstein — polyglot-mini

> *The limits of language are the limits of the world.*

**Wittgenstein** is a modality harness for text-first LLMs — a portable codec layer that turns a language model into a multi-output system without touching the base model.

---

## The Problem

Every "multimodal AI demo" you've seen today hides the hard parts in:

- a massive fused model trained on everything at once
- a paid API call to DALL·E, ElevenLabs, or Runway
- hand-waving in the slide deck

None of that is portable, inspectable, or reproducible.

---

## What This Does

```
Your Prompt
    ↓
  LLM (text-only, any provider)
    ↓  emits structured JSON / code
  Codec Layer  ──── modality-specific render pipeline
    ↓
  Real File    ──── PNG / WAV / M4A / JSON / HTML
```

**No extra model tokens. No diffusion model. No cloud APIs in the core loop.**

---

## What Ships Right Now

| Modality | Route | Output |
|---|---|---|
| **Image** | LLM → Python painter code → sandbox → PNG | `.png` |
| **Image (no-LLM)** | trained MLP adapter → procedural painter → PNG | `.png` |
| **TTS** | macOS `say` → M4A (zero deps) | `.m4a` |
| **TTS + Ambient** | text → audio classifier → procedural soundscape → mix | `.m4a` |
| **Sensor** | operator spec → numpy expand → loupe HTML dashboard | `.html` + `.csv` |

---

## Install

```bash
pip install numpy scipy Pillow matplotlib   # that's it
```

For LLM-powered image / sensor paths, set an API key:

```bash
export MOONSHOT_API_KEY=sk-...        # Kimi K2
export MINIMAX_API_KEY=sk-api-...     # MiniMax
# or any OpenAI-compatible key
export OPENAI_API_KEY=sk-...
```

---

## CLI

```bash
# Image: LLM painter code → PNG
python3 -m polyglot.cli image "stormy ocean at midnight" --out out.png

# Image: no LLM, adapter-guided
python3 -m polyglot.cli image "warm golden desert" --no-llm --out out.png

# TTS (zero deps)
python3 -m polyglot.cli tts "Hello from Wittgenstein." --raw --out speech.m4a

# TTS + auto ambient from prompt
python3 -m polyglot.cli tts "Late night coding session, focused." --out coded.m4a

# TTS + explicit ambient
python3 -m polyglot.cli tts "Calm presentation voice." --ambient forest --out forest.m4a

# Sensor (dry-run, no LLM)
python3 -m polyglot.cli sensor "ECG 72 bpm resting" --dry-run --out ecg.json
# → ecg.json + ecg.csv + ecg.png + ecg.html (interactive dashboard)
```

---

## Image: Code-as-Painter

```
User prompt
  → LLM writes a Python painter program
     (PIL + NumPy + SciPy + Matplotlib, pre-injected globals)
  → sandboxed subprocess (10s timeout)
  → real PNG file

Fallback (no LLM / failed):
  → MLP adapter predicts palette + layout from text
  → deterministic procedural painter
  → real PNG file
```

The MLP was trained on **781 real COCO images** (captions → extracted palette/stats). Pure numpy. Trains in 9 seconds.

---

## Audio: TTS + Procedural Ambient

```
User prompt
  → audio classifier (MLP + keyword rules)
  → category: rain / wind / city / forest / electronic / silence
  → procedural synthesizer (pure NumPy + SciPy):
       rain     → pink noise + gaussian drip pulses
       wind     → low-pass noise + gust envelope
       city     → traffic rumble + tonal honks
       forest   → wind base + random bird chirps
       electronic → 50/60Hz hum + harmonics
  → mix with TTS speech (stdlib wave, zero deps)
  → M4A output
```

Zero file downloads. Zero extra tokens.

---

## Sensor: Operator Specs + Loupe

```
User prompt
  → LLM emits operator spec JSON
     (ecg / accelerometer / temperature / gyro)
  → deterministic numpy expansion:
     oscillators, pink noise, ECG templates, pulses, steps, drift
  → CSV + NPY + matplotlib PNG
  → loupe.py → self-contained interactive HTML dashboard
```

---

## Train Your Own Adapters

```bash
# Build COCO dataset (~800 images, ~5 min)
python3 train/build_dataset_coco.py -n 800

# Train image style MLP (text → painter params)
python3 train/train.py --epochs 800

# Train audio classifier (keyword-seeded, <5 seconds)
python3 train/train_audio.py

# Predict
python3 train/train.py predict "misty mountain at dawn"
python3 train/train_audio.py predict "cozy rainy afternoon"
```

> `train/coco/*.json` (large COCO annotation files) are not committed — download or generate locally.

---

## Five-Layer Harness Foundation

| Layer | Role |
|---|---|
| **L1 Runtime** | LLM plans, harness routes + retries |
| **L2 IR / Schema** | LLM emits structured JSON, validated |
| **L3 Renderer** | JSON → real file (painter / TTS / signal expand) |
| **L4 Adapter** | Tiny trained MLP: text → renderer params |
| **L5 Distribution** | CLI, npm packages, AGENTS.md |

---

## Philosophy

> Traditional harnesses expand what an agent can **do**.
> Wittgenstein expands what an agent can **express as files**.

A frozen decoder is not a generator. A trained adapter is not a fine-tuned giant. The base model stays text-only — all multimodal work lives in portable, inspectable codec layers.

---

## License

Apache 2.0
