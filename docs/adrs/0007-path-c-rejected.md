# 0007 Path C Rejected — no full multimodal retrain

## Status

Accepted

## Decision

Wittgenstein does not pursue Path C — Chameleon-style (Meta FAIR 2024, arXiv:2405.09818) or LlamaGen-style (Sun et al. 2024, arXiv:2406.06525) full multimodal retrain of the base transformer. The master statement *"the modality harness for text-first LLMs"* is incompatible with retraining the text-first model. Path C survives in the repo only as a contrast class in pitch material and in Brief A's lineage audit — "why we don't do this."

## Consequence

The backbone stays untouched. Every modality graft is a harness-level concern (codec + transducer + packaging per RFC-0001 and RFC-0003 nomenclature), never a weights-level concern. This keeps our engineering budget within a month-scale harness iteration rather than a year-scale retrain, and it keeps reproducibility via `RunManifest` (ADR-0003 spine) tractable — retraining would invalidate the seed-plus-frozen-decoder determinism that is our product feature. Should Path C later appear cheaper than expected (e.g., a <$100k frontier-class retrain becomes available via efficiency research), reopen via a new ADR — this one is not permanent, but it is the default for the v0.2 → v0.4 window.
