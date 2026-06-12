# Agent Hygiene & Boundary Config Hardening

Demand Key: `alembic-redundancy-stale-logic-cleanup-rc3-agent-hygiene-boundary-config-2026-06-11`
Primary Window: AlembicAgent

## Goal

Remove broken development remnants, encode the boundary intent that currently
lives only in convention, and register (not execute) the V1 tool-system
retirement intent.

## Task Breakdown

1. **Broken probe (G1)** — fix `tmp/probe-relay.mjs:24`
   (`../dist/external/ai/index.js` → `../dist/ai/index.js`) and add a header
   comment marking it as a manual developer probe — or delete the file if RC0
   finds no usage; either way the verdict is recorded.
2. **Core import boundary limits (G4)** — populate `referenceLimits` in
   `config/core-import-boundary.json` from the current real import set
   (freeze current counts per `@alembic/core/*` subpath, deny-list internal
   paths the Agent must never import), so future drift fails the lint instead
   of passing silently.
3. **expectedCounts automation (G5)** — extend
   `scripts/lint-agent-public-api-boundary.mjs` to compute counts from
   `package.json` exports and compare against
   `config/agent-public-api-boundary.json`, failing with the expected/actual
   diff; keep the file as the reviewed source of intent.
4. **V1 retirement register (G2)** — add a dated note (AGENTS.md or
   `docs/`) recording: V2 (`src/tools/v2/`) is the primary tool system;
   `src/tools/core/` V1 surface and `V2ToolRouterAdapter` are
   compatibility-only; name their current consumers (from RC0) and the
   condition under which V1 can be removed. No code removal in this demand.
5. **MemoryStore ownership note (G3)** — add a boundary comment at
   `src/agent/memory/MemoryStore.ts` stating schema ownership is in
   `@alembic/core/memory` and the raw-SQL adapter's long-term home is pending
   the RC6 decision; reference the RC6 candidate id.

## Completion Definition

`tmp/` contains no broken imports; the core-import lint fails on any new
un-allowlisted Core subpath import; the public-api lint computes counts
instead of trusting hand-written numbers; V1 retirement intent and
MemoryStore ownership are written down with owners and conditions.

## Validation Floor

- Agent repo check gate green.
- `scripts/lint-agent-public-api-boundary.mjs` green, plus a demonstrated
  failure run against an injected count mismatch (evidence of the new check
  actually firing).
- Core-import boundary lint green, plus a demonstrated failure on a
  disallowed subpath.
- `npm run release:pack-preview` staging still green.

## Stop Conditions

- Freezing referenceLimits would immediately fail on a legitimate import —
  record that import into the allowlist with a reason, never loosen the gate
  to empty.
