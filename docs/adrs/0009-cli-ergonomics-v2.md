# 0009 CLI Ergonomics v2

## Status

Accepted (ratifies RFC-0002)

## Decision

Wittgenstein adopts the CLI ergonomics described in RFC-0002. Canonical stdout contract is NDJSON under `--json` with logs on stderr (the `gh` convention); default pretty mode stays. Configuration resolves in documented order `flag > env > project (./wittgenstein.toml) > user ($XDG_CONFIG_HOME/wittgenstein/config.toml) > defaults`, with `wittgenstein doctor` printing per-key provenance. The zero-config entry point is `npx @wittgenstein/cli doctor`. Auth unifies under `wittgenstein auth <provider> login|logout|status` for anthropic / openai / minimax / ollama, deprecating the legacy `minimax-key` command. Two divergences from industry chat-CLIs are deliberate and stay in force through v0.3: no interactive REPL as the primary interface, and no user-facing `--model` flag on modality commands (the codec owns its model; `WITTGENSTEIN_MODEL` env var is the documented escape hatch for experimentation).

## Consequence

Downstream agents (and humans using Claude Code, Codex, Gemini, Kimi, Cursor, or raw `gh`-style pipelines) can pipe Wittgenstein output into standard NDJSON tooling without scraping pretty-printed text. `doctor` becomes the first-contact surface for setup failures, making provenance debuggable without a support channel. Deprecation window is one minor release per migration phase; `minimax-key` alias is removed at v0.4. Kill criteria from RFC-0002 remain live: if by v0.4 the dominant agentic surface is MCP-native rather than CLI, retire the investment and pivot to an MCP server; if `--json` consumers parse pretty output anyway, the contract failed; if `doctor` takes >2s on cold start, it's a bad doctor.
