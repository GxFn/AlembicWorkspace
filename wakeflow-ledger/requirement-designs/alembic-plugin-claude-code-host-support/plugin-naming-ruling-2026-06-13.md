# Plugin Naming Ruling + Enactment Plan (2026-06-13)

USER RULING (decision C2 core): the plugin distribution name changes
`alembic-codex` → **`alembic`**. The user delegated the concrete
enactment plan and subordinate decisions to the controller ("尽量干净的
处理方式…你来思考真实落实的方案确定决策"). Theme: organization/
structure optimization — clean state over compatibility shims.

## Why NOW is the clean window

`@gxfn/alembic-codex-runtime` was NEVER published (live-proven E404) and
the marketplace has no external users — so a full rename has ZERO
published consumers, zero migrations, zero deprecation aliases. Renaming
BEFORE the first publication (C1) means the npm registry, the
marketplace, and every pin are born under the final name. Waiting until
after C1 would convert this into a published-package migration.

## Controller determinations (under the user's delegation; all
reversible until C1 publish, which stays user-triggered)

| # | Determination | Rationale |
| --- | --- | --- |
| D1 | Distribution name `alembic` on BOTH hosts (Claude Code plugin.json name + marketplace entry → install becomes `alembic@gxfn`; Codex shell product-name strings likewise) | one product, host-neutral name — the exact confusion the user hit |
| D2 | Runtime npm package → **`@gxfn/alembic-runtime`**, version stays 0.2.0; staging + `pack --dry-run` re-verified; the staged C1 publish command is RESTAGED under the new name | clean-window argument above; the runtime is host-neutral by design |
| D3 | Version-pin policy: shells keep EXACT-version pins (deterministic installs, parity-friendly); bumps ride user-triggered releases only | closes the C2 version-pin question conservatively |
| D4 | GitHub repos NOT renamed (AlembicCodex / AlembicClaudeCode / AlembicPlugin) | host-descriptive infrastructure names, not product names; repo renames are user-owned and unnecessary for cleanliness |
| D5 | MCP TOOL names/prefixes (`codex_*`, `alembic_*`) OUT OF SCOPE | API surface, not distribution identity; rides the B1 duality ruling and the Codex-led CKG phase; renaming now would invalidate the in-flight P5 sheet work |
| D6 | `lib/codex/` internal rename stays in SN5 (CKG-gated) as planned | unchanged |
| D7 | Marketplace stays hosted in AlembicClaudeCode under the gxfn catalog | already validated end-to-end |
| D8 | SEQUENCING: naming wave N1 lands BEFORE P5 p2, so certification matrix v2 certifies the FINAL renamed state (re-cert doubles as the rename's terminal proof); N1 dispatches only after P5 p3 vacates the Plugin window | one certification, of the end state |
| D9 | Dev-machine residue (old server-name negative-cache entries, old `alembic-codex-runtime` cacheRoot dirs) — N1 documents the cleanup steps; sandbox applies them; the user's real machine cleanup is listed as a one-liner, never auto-applied | real-data rule |

## N1 wave scope (AlembicPlugin window, one coordinated change set)

1. AlembicClaudeCode shell: `.claude-plugin/plugin.json` name + mcpServers
   server key; `.claude-plugin/marketplace.json` entry → `alembic@gxfn`;
   docs/README strings. `claude plugin validate --strict` PASS.
2. AlembicCodex shell: product-name strings → `alembic` (host-descriptive
   strings stay); config/registration sample updated.
3. AlembicPlugin parent: runtime staging package.json name →
   `@gxfn/alembic-runtime`; BOTH shells' bin `RUNTIME_PACKAGE_NAME` /
   `RUNTIME_PACKAGE_SPECIFIER` / cacheRoot segment; PLUGIN-SOURCE.json и
   cross-shell drift-gate rows; re-stage + `npm pack --dry-run` (expect
   206 files, new name); restaged C1 command recorded to the 0.3.0 ledger.
4. Parity snapshots: serverInfo/name-bearing wire bytes re-baselined ONCE
   with the rename as the justified cause; cross-shell byte-identity
   PRESERVED (the gate itself unchanged).
5. Proof: full Plugin suite green; validate --strict both shells; scratch
   cache-copy live load (5 skills + stdio + tool count) under the new
   name; marketplace add → install `alembic@gxfn` round-trip (cache-copy,
   no publish); repo-wide old-name residue grep (allowlist: history docs,
   lib/codex/ internals per D6, tool names per D5).
6. Commits per repo with gitlink ordering (shells first, then parent),
   pushes; ledger updates (this doc, 0.3.0 ledger, AD2 register C2 row).

Out of scope: publish (C1 user trigger), tool renames (D5), lib/codex
(D6), repo renames (D4).
