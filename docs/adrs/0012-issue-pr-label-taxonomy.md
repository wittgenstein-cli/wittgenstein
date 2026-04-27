# 0012 Issue / PR Label Taxonomy

## Status

Accepted (ratifies `docs/labels.md` introduced via PR #71).

## Context

The repo had ad-hoc GitHub labels with no canonical definition. PR #71 introduced `docs/labels.md` as the single source of truth, but that PR did not have a paired ADR — the rule "doctrine lands via ADR" (ADR-0014) was not yet in place. This ADR retroactively ratifies the labels taxonomy so the audit trail is complete.

## Decision

Wittgenstein adopts the **flat label taxonomy** documented in `docs/labels.md`. Concretely:

1. **No prefix scheme** (`area:*` / `type:*` / `phase:*`) until the label set crosses ~20 entries. GitHub's label UI does not group by prefix and the repo is small enough that ~15 well-named labels are easier to grip than 30 prefixed ones.
2. **Four implicit categories** (provenance / lifecycle / type / audience), encoded by name choice rather than prefix.
3. **Labels are contracts.** Applying a label obliges the body to satisfy specific conventions:
   - `research-derived` → body must cite the brief by letter and section.
   - `tracker` → body must name the gating event + re-evaluation date.
   - `horizon-spike` → body must restate the hypothesis + kill criteria.
   - `blocked` → body must cite the internal blocker.
   - `rfc-derived` / `adr-derived` → body must cite the RFC / ADR by ID.
4. **Every PR carries at least one type label** (`bug` / `enhancement` / `documentation` / `refactor`).
5. **Renames are breaking changes** to saved searches; rename only with a follow-up PR that updates `docs/labels.md`, executes `gh label edit`, and announces the rename in the PR body.

The 9 custom labels and their colors / definitions / pairing rules are locked as written in `docs/labels.md` at the time this ADR is accepted.

## Consequence

- `docs/labels.md` is canonical; new labels added without a corresponding doc entry are invalid and may be deleted.
- The body-convention rules give labels semantic weight: an unlabeled `research-derived` issue without a brief citation fails the contract and should be relabeled or have its body amended.
- Labels participate in the doctrine chain only via this ADR. Future taxonomy changes (new label, retired label, new category, prefix introduction) require a follow-up ADR; do not modify `docs/labels.md` in isolation.
- Kill criterion: if the label set crosses ~20 entries, open a follow-up ADR introducing prefixes and superseding this one.
