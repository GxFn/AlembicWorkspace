# Plugin Docs, Legacy Governance & Surface Pruning

Demand Key: `alembic-redundancy-stale-logic-cleanup-rc4-plugin-docs-legacy-governance-2026-06-11`
Primary Window: AlembicPlugin

## Goal

Make AlembicPlugin's public documents describe the plugin (not the whole
product), give every legacy compatibility path a retirement condition or
remove it, prune HTTP routes with no plugin-runtime consumer, and put scratch
under a retention rule.

## Task Breakdown

1. **README rewrite (P1)** — replace the stale main-repo copy with a
   plugin-scoped README: what the Codex plugin is, MCP server entry
   (`bin/codex-mcp.ts`, `alembic-codex-mcp`), channel/marketplace delivery
   (`channels/codex/channel.json`, `plugins/alembic-codex/`), install and
   smoke verification, relationship to `alembic-ai` / `@alembic/core` /
   `vendor/AlembicCore` snapshot, and pointers to AGENTS.md for boundaries.
2. **Legacy retirement marks (P2)** — per the RC0 consumer map, for each of:
   `LEGACY_DIRECT_CALL_COMPATIBILITY_TOOLS` (`lib/codex/mcp/tools.ts`),
   legacy error-code mapping (`lib/codex/mcp/error-taxonomy.ts:8-40`),
   `LEGACY_IDE_AGENT_SOURCE` (`lib/codex/SourceBoundary.ts`),
   `legacyEffectiveIdentityFallback` (`lib/codex/runtime/ProjectRuntimeContext.ts`):
   delete it if zero current consumers, otherwise annotate with owner +
   concrete retirement condition (host version / release milestone), and list
   them in a single `docs/legacy-register.md` so they cannot rot invisibly.
3. **Route pruning (P4)** — remove route files RC0 marked remove-candidate
   (no MCP handler, daemon, smoke, or acceptance-pack consumer); for each
   removal include the consumer-scan evidence; routes marked unknown stay and
   get a register entry instead.
4. **Scratch retention (P3)** — add `scripts/clean-scratch.mjs` (delete
   `scratch/afapi-*` older than a retention window, dry-run by default) and
   document the retention rule in AGENTS.md; run one supervised cleanup pass.
5. **Vendor snapshot flow (P5)** — document in AGENTS.md /
   RELEASE-PLAYBOOK.md when and how `vendor/AlembicCore` is refreshed
   (which release step syncs it, how lag is checked), so the 6-commit lag is
   an explained state instead of an anomaly.

## Completion Definition

README describes only plugin scope; every legacy path is deleted or appears
in `docs/legacy-register.md` with owner + retirement condition; every
remaining HTTP route has a named consumer; scratch has an executable
retention rule; vendor snapshot refresh is documented.

## Validation Floor

- Plugin vitest suite green; `scripts/lint-repo-boundary.mjs` green.
- `scripts/smoke-codex-plugin.mjs` green; real MCP `tools/list` plus
  representative callTool samples green after route/legacy changes.
- Per-removal consumer-scan raw output attached.
- Codex acceptance packs covering direct-call compatibility behavior pass.

## Stop Conditions

- A legacy path is still exercised by any supported Codex host version —
  deadline-mark only; do not delete.
- A route removal breaks smoke/acceptance — restore and reclassify as
  keep-with-consumer.
