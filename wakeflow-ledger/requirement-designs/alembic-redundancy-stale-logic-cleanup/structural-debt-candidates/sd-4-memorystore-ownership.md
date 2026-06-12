# SD-4 — MemoryStore Raw-SQL Adapter Ownership

Design note for RC6 structural-debt decision gate. Drafted by the Design
window, task `alembic-redundancy-stale-logic-cleanup-rc6-structural-debt-decision-gate-t1`.

Re-verification baseline (2026-06-12): AlembicAgent `dc6d6f7`, AlembicCore
`ed42960`.

## Problem

`AlembicAgent/src/agent/memory/MemoryStore.ts` maintains a synchronous raw-SQL
SQLite CRUD layer over the `semantic_memories` table, while the table's schema
is owned by `@alembic/core/memory` (Core `schema.ts` defines it, migration 001
creates it, `MemoryRepository.ts` is Core's repository implementation). Two
repositories thus hold access logic for one table. RC3 wrote the boundary note
into the file header (ownership pinned to Core; adapter home deferred to this
SD-4 decision; no code moves until then).

## Evidence and re-verification (2026-06-12)

Refs: audit G3 (RC0-corrected); RC0 matrix row G3 + raw `g3-*.txt`; RC3 result
envelope (boundary-note work item) and the header text at
`AlembicAgent/src/agent/memory/MemoryStore.ts:1-29`.

- File length now **620 lines** (RC0 corrected the audit's ~194 to 611; RC3's
  boundary-note header added ~9 — number moved again, as expected).
- The RC3 boundary note is in place and states: schema ownership in
  `@alembic/core/memory`; this file consumes the schema only via
  `ensureSemanticMemorySchema` and must not define or migrate the table;
  long-term home pending RC6 SD-4.
- Design constraints already encoded in the header: the adapter exists because
  Agent's memory path needs SYNCHRONOUS access for existing callers
  ("Agent 保留同步 raw SQLite adapter，兼容现有调用方"); embeddings already
  moved out to `MemoryEmbeddingStore` (JSON sidecar).
- Core boundary policy (`AlembicCore/AGENTS.md:64,73`): deterministic headless
  kernel; Core already has its canonical async repository implementation for
  this table (`MemoryRepository.ts`).

## Options

### Option A — Sink the sync adapter into Core (`@alembic/core/memory` Drizzle wrapper)

Core gains a synchronous facade alongside `MemoryRepository`.

- Cost: new Core public surface during the SD-5 closeout (works against it);
  consumer migration in Agent; vendor-snapshot propagation to Plugin.
- Risk: institutionalizes TWO access paths inside Core itself (async
  repository + sync wrapper) for one table — the dual-path smell moves
  upstream instead of disappearing. Weak fit with Core's "one canonical
  repository per table" shape.

### Option B — Keep in Agent as a declared consumer-side adapter + schema tripwire

The RC3 boundary note becomes the standing contract; add one Agent test that
pins the consumed `semantic_memories` shape (column set the raw SQL touches)
against Core's published schema/migration, so a Core-side schema change fails
Agent's suite loudly instead of corrupting at runtime.

- Cost: one test + keeping the documented status quo.
- Risk: dual implementations persist (Core repository + Agent adapter); the
  22 raw-SQL reference sites stay Agent-maintained. Mitigated by the tripwire
  and by the no-extension discipline the boundary note already imposes.

### Option C — Retire the raw adapter: migrate Agent callers to Core `MemoryRepository`

Single access path, Core-owned.

- Cost: large — Core's repository is async; Agent's memory path callers are
  synchronous by design, so this ripples through the agent runtime memory
  chain (ActiveContext etc.); effectively a memory-subsystem refactor, not a
  cleanup.
- Risk: behavioral change in a runtime-critical path for a structural-purity
  payoff; far beyond this sequence's no-behavior-change discipline.

## Recommendation

**Option B now; record Option C as the written end state with a trigger
condition** ("when the Agent memory path next undergoes an async-capable
refactor, callers migrate to Core `MemoryRepository` and this adapter is
deleted") — appended to the existing RC3 boundary note so intent cannot rot
invisibly. Reject Option A: it relocates a host-convenience adapter into the
kernel and doubles Core's own access paths.

## Affected repositories

AlembicAgent only (Option B). AlembicCore untouched (its ownership facts are
already correct); AlembicCore + Agent if/when the Option-C trigger fires.

## Validation outline

- New schema-shape pin test: green against current Core; demonstrated FAIL
  against an injected schema delta (RC-style fail+pass proof pair).
- Agent `npm run check` green (197-test baseline); no runtime behavior change.
- Boundary-note amendment reviewed (register-style: owner + trigger condition
  + reference to the RC6 SD-4 decision record).
