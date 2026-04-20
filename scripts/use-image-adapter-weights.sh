#!/usr/bin/env bash
# Source this file: NumPy-trained JSON preferred, PyTorch-trained JSON as legacy backup.
# Usage from repo root:   source scripts/use-image-adapter-weights.sh

_s="${BASH_SOURCE[0]:-$0}"
if [[ "$_s" != /* ]]; then
  _s="$(pwd)/$_s"
fi
_script_dir="$(cd "$(dirname "$_s")" && pwd)"
ROOT="$(cd "$_script_dir/.." && pwd)"

export WITTGENSTEIN_IMAGE_ADAPTER_PREFERRED_PATH="${ROOT}/data/image_adapter/artifacts/adapter_mlp_numpy.json"
export WITTGENSTEIN_IMAGE_ADAPTER_LEGACY_PATH="${ROOT}/data/image_adapter/artifacts/adapter_mlp.json"
