# Archive Policy

This policy explains when old repo material should be **archived**, when it should be
**deleted**, and where archived material should live.

The goal is not to preserve everything forever. The goal is to preserve the things that
still carry provenance, reasoning, or historical value without leaving them on the
active decision path.

---

## Why this policy exists

Wittgenstein now has:

- doctrine files
- research notes and briefs
- RFCs and ADRs
- exec-plans and agent guides
- historical launch and hackathon material

As the repo matures, some of those surfaces stop being active without becoming worthless.
Deleting them loses context. Leaving them in place without relabeling makes the repo lie
about what is still active.

Archive is the middle path:

- **keep the provenance**
- **remove the item from the live decision path**
- **make the replacement explicit**

---

## The four actions

When a surface is no longer current, choose one of these four actions.

### 1. Refresh

Use this when the file is still active, but the contents drifted.

Examples:

- a live RFC whose status line is stale
- a current guide whose wording no longer matches the accepted ADR

### 2. Reclassify

Use this when the file is still useful, but its **role** was unclear or misleading.

Examples:

- a long-form theory essay that was being read as a generic note
- a captured website clone that should be treated as extraction scratch space

### 3. Archive

Use this when the file still has historical or reasoning value, but it should no longer
be on the active path for contributors, agents, or maintainers.

Archive is appropriate when the file:

- records a real phase, decision moment, or exploratory path
- may still matter for provenance or future retrospective understanding
- has been superseded by a clearer live surface
- would be misleading if left in the active tree without an explicit warning

### 4. Delete

Use this when the file is no longer active **and** no longer worth keeping.

Delete is appropriate when the file is:

- a low-value scratch file
- reproducible from git history without losing important context
- duplicated elsewhere without unique reasoning value
- likely to add grep noise without helping a future contributor

---

## Preferred archive layout

Archive should be **surface-local first**.

That means:

- `docs/exec-plans/archive/` for old execution plans
- `docs/research/...` for research captures that still belong to the research surface
- a future `docs/archive/` only for historical material that no longer cleanly belongs
  to one active surface

Do **not** move everything into one global graveyard by default.

The preferred rule is:

1. keep the item near the surface it came from, if that keeps the history legible
2. move it to a general archive only if the original surface would be made more
   confusing by keeping it nearby

---

## Requirements for archived material

Every archived file or archive folder should make three things obvious:

1. **why** it was archived
2. **what replaced or subsumed it**, if anything
3. **how it should be treated now**

At minimum, that means one of:

- a folder-level `README.md`
- a short header note at the top of the archived file

Use wording like:

- `Historical record`
- `Archived`
- `Superseded by`
- `Kept for provenance, not execution`

An archived item should never look like an active execution surface.

---

## What should not be archived casually

Do not use archive as a way to avoid making a decision.

If a file is still on the active path, either:

- refresh it
- reclassify it
- or keep it where it is

Archive is for **historical but still meaningful** material, not for unresolved current
ownership.

Also avoid archiving:

- generated binaries better stored under `artifacts/`
- private overlays or local-only helper files
- stale duplicates with no unique reasoning value

---

## Current repo examples

Good current precedent:

- [`docs/exec-plans/archive/README.md`](exec-plans/archive/README.md)

Current non-archive but reclassified examples:

- `docs/research/compression-view-of-llms.md` — theory note
- `docs/research/neural-codec-references.md` — reference sheet
- `docs/research/www.aquin.app/README.md` — captured research artifact / extraction scratch space

These examples show the intended distinction:

- not everything old should be archived
- not everything preserved should stay on the live path
- role clarity often solves more than moving files does

---

## Rule of thumb

If removing the file would erase useful repo memory, but keeping it on the live path
would mislead the next contributor, archive it.
