#!/usr/bin/env bash
# Wait for data.jsonl to have ≥200 samples, then train the adapter.
set -e
cd "$(dirname "$0")/.."
echo "[auto_train] waiting for train/data.jsonl to have 200+ samples..."
while true; do
  n=$(wc -l < train/data.jsonl 2>/dev/null || echo 0)
  echo "[auto_train] $n samples so far..."
  if [ "$n" -ge 200 ]; then
    break
  fi
  sleep 15
done
echo "[auto_train] training with $(wc -l < train/data.jsonl) samples"
python3 train/train.py --epochs 600 --lr 3e-3
echo "[auto_train] done — adapter saved at train/adapter.npz"
