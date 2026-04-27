# 0014 Governance Lane for Meta-Process Doctrine

## Status

Accepted.

## Context

The repo's decision chain — `Brief → RFC → ADR → exec-plan → code` — was designed for **codec / modality / engineering** decisions. M1A is the canonical example: Brief A + G + H pressure-tested the lineage and engineering, RFC-0001 proposed the protocol, ADR-0008 ratified it, the exec-plan §M1 sequenced it, code landed via PR #68. Clean.

But the chain has no explicit lane for **governance / meta-process** decisions: how should we review, what counts as agency, what to archive, how to label, where research notes live, what surfaces are doctrine vs hypothesis. As of 2026-04-27, the absence of a governance lane caused multiple Codex agents to default to writing such decisions inline into `docs/engineering-discipline.md` with no Brief or ADR pre-flight, creating a 36-hour drift event documented in the audit memo (`docs/research/research-system-audit-2026-04.md`, when salvaged) and resolved retroactively via ADRs 0012, 0013, and this one.

## Decision

Wittgenstein adopts an **explicit governance lane** for meta-process doctrine, separate from the engineering chain:

1. **Governance scope** — any decision about _how the project decides, reviews, classifies, archives, or describes its own surfaces_. Concretely: review process, archive policy, label taxonomy, agency boundaries, surface classification (active / locked / historical), research surface taxonomy, contributor map structure, agent-handoff conventions.

2. **Governance lane shape** — `(optional) Governance Note → ADR → inline summary in the canonical operating doc`.
   - **Governance Note** (optional) — a brief working note under `docs/governance/notes/` if the question needs scoping before locking. Cheap; can be skipped for small decisions.
   - **ADR** — the load-bearing artifact. Every governance change goes through an ADR, even small ones. The ADR is canonical; the inline summary is a pointer.
   - **Inline summary** — `engineering-discipline.md` (or `CONTRIBUTING.md`, `AGENTS.md`, etc.) carries a one-paragraph summary that **cites the ratifying ADR by ID**. The inline text is not the doctrine; the ADR is.

3. **Why no RFC for governance** — RFCs are design proposals with alternatives. Governance decisions are usually small enough that the ADR's `## Decision` + `## Consequence` is the entire shape; an RFC would be ceremony. If a governance decision is large enough to need alternatives discussion (e.g. introducing a label-prefix scheme), open a Governance Note first.

4. **`engineering-discipline.md` becomes a curated digest, not a doctrine dump.** New doctrine sections require an ADR first. The file's purpose is to make the operating manual easy to read in one pass; the ratifying ADRs are the audit trail. Each substantive section should cite its ADR (older sections grandfathered until natural follow-up).

5. **What is _not_ governance** — challenging an execution hypothesis (e.g. "the plan's 80-line copy-paste premise is outdated, helpers > class") is not governance. It's `drift correction` per ADR-0013 §3 and lands inline in the relevant brief / exec-plan / port guide without ADR.

## Consequence

- New ADR slots opened: `0012-issue-pr-label-taxonomy` (retroactive for PR #71), `0013-independent-ratification-for-doctrine-prs` (retroactive for PR #75 / paired), `0014` (this one).
- Doctrine sections in `engineering-discipline.md` that landed in the 36-hour window before this ADR ("Documentation surface discipline", "Parallel modality lines", "Agency and Scope", "Review Discipline: No Self-Ratification") are retroactively grounded by ADRs 0013 / 0014; future similar additions require ADR-first.
- A `docs/governance/` directory may exist for governance notes; if it ends up empty after a release cycle, retire it. Do not pre-create empty scaffolding.
- The doctrine chain in the README / contributor-map should be amended in a follow-up to read: `Brief → RFC → ADR → exec-plan → code` (engineering lane) **or** `(Governance Note →) ADR → inline summary` (governance lane).
- Kill criterion: if the governance lane produces > 1 ADR per week sustained for 4 weeks, the lane is being abused as a doctrine-stamp machine — pause and reconsider.
