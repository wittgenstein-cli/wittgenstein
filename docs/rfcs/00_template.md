# RFC-00XX — <title>

**Date:** YYYY-MM-DD
**Author:** <name (email)>
**Status:** 🟡 Draft v0.1
**Feeds from:** <Brief X / earlier RFC / ADR>
**Ratified by:** ADR-00YY (pending)

**Summary:** one sentence — the design in a tweet.

---

## Context

Why does this RFC exist now? What problem is it solving, and what evidence base (briefs, code smells, external convention) points at it? One paragraph, no more.

## Proposal

The design, stated plainly. A reader should be able to stop here and know what is being proposed. Two to four paragraphs.

## Interface

The concrete surface. Types, signatures, flags, file layouts, whatever is the unit of change. Code blocks with language tags. If the RFC is protocol-shaped, include a round-trip test: show the new shape handling every current case in ≤N lines, and note if anything spills.

```ts
// example
```

## Migration

How do we get from today to the proposed surface without breaking receipts? Phased is fine; big-bang is suspect. Name the deprecation window, the shim, and the kill date.

## Red team

Three plausible pushbacks, each answered inline.

## Kill criteria

Concrete events that would force a revision or full withdrawal. If the RFC survives a year with none of these firing, it's genuinely settled.

## Decision record

- **Accepted by:** <ADR-00YY, date>
- **Superseded by:** — (populate if another RFC replaces this)
