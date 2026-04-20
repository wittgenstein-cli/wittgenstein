# Image Adapters

## Runtime

- **`mlp-runtime.ts`** — loads `witt.image.adapter.mlp/v0.1` JSON (from `python/image_adapter/train.py`). Forward pass must stay aligned with Python training code.
- **`adapter-resolve.ts`** — tries **preferred (new)** then **legacy (backup)**:
  - `WITTGENSTEIN_IMAGE_ADAPTER_PREFERRED_PATH` → else `WITTGENSTEIN_IMAGE_ADAPTER_MLP_PATH`
  - then `WITTGENSTEIN_IMAGE_ADAPTER_LEGACY_PATH` → else `WITTGENSTEIN_IMAGE_ADAPTER_MLP_FALLBACK_PATH`  
  Skips unloadable files and `tokenGrid` mismatches before the deterministic placeholder.
- **`placeholder.ts`** — legacy placeholder metadata for checkpoints (optional).

## Expected future contents

- ONNX or alternative bridge loaders if you move inference out of Node
- Codebook / tokenizer version pinning utilities
