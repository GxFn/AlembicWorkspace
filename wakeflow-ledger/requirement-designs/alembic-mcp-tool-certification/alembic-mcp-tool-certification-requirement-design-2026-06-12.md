# Alembic MCP Tool Certification Requirement Design

Status: candidate / user-requested 2026-06-12 / audit runs now on both surfaces, Plugin code fixes CKG-gated / needs controller intake
Date: 2026-06-12
Design Key: alembic-mcp-tool-certification
Primary Windows: AlembicWorkspace (audit harness, matrix), Alembic (resident/embedded fixes), AlembicPlugin (post-CKG fixes), AlembicCore (shared output/budget mechanism), Test (real-scenario runs as assigned)

## Problem

Despite the completed clean-output contracts (D22/D24/D25) and the
in-flight CKG tool work, the user reports two persistent symptoms across
the Alembic MCP tools: agents still misuse tools, and some outputs are
far too large. The structural census
([mcp-tool-certification-findings-2026-06-12.md](mcp-tool-certification-findings-2026-06-12.md))
explains both: output caps are scattered hardcoded slices with no
per-tool budget, no measured baselines, and no overflow route; tool
descriptions are not held to the tool-to-information standard; misuse
evidence from real runs has never been systematically harvested. No
demand has ever walked EVERY tool, one by one, and certified it.

## Goal

Every Alembic MCP tool — across the resident surface (17) and the Plugin
surface (40), as they exist at MT0 freeze — holds a **certification
card** proving:

1. **Connectivity**: callable end-to-end on its real runtime; every
   advertised operation/mode returns real data (no dead routes, no
   silent stubs).
2. **Functional completeness vs design expectation**: behavior matches
   the already-defined contracts (D22/D24/D25, CKG catalog where it
   applies) — gaps are fixed or explicitly re-ruled.
3. **Edge cases**: empty/invalid/oversized inputs, wrong scope, degraded
   runtime, missing prerequisites — each returns the taxonomy problem
   with a next action, never a crash or silent emptiness.
4. **Output budget**: a measured per-tool size budget (tokens/bytes per
   representative call), enforced by a shared budget mechanism with a
   pagination or artifact-ref overflow route replacing magic-number
   slices; oversized tools are compacted.
5. **Usage ergonomics**: the description states what question the tool
   answers, required inputs, what it cannot prove, and when NOT to use
   it (the CKG matrix standard applied to every tool); schemas are
   misuse-resistant (enumerated modes, required-field honesty); the
   harvested real-misuse cases each get a guard or guidance fix plus a
   negative test.
6. **Value verdict**: keep / upgraded / merge-candidate /
   deprecate-candidate — candidates routed to a per-item user decision
   register, never deleted here.

## Non-goals

- No surface-duality resolution (IC5), no source-graph catalog redesign
  (CKG4 — findings on those 9 tools are handed to CKG4 via the
  controller while CKG runs), no host packaging (CC), no new tools.
- No deletions or merges executed here — verdict candidates go to the
  user decision register.
- No Plugin code edits before CKG completes (auditing by invoking the
  committed Plugin MCP server is allowed — CO smoke precedent).
- No weakening of any existing contract, gate, or census ratchet; no
  version bumps without user direction.

## Candidate Demand Sequence

### MT0 - Inventory Freeze, Expectation Sheets, And Harness (AlembicWorkspace)

- freeze the full tool population on both surfaces (committed state) and
  write one **expectation sheet per tool**: design intent (from
  D-sequence/CKG/contract docs), advertised operations, input schema,
  output shape, edge matrix, and a proposed size budget;
- harvest the real misuse/error/bloat evidence from existing transcripts
  (2026-06-11 cold-start observation, CKG runs, controller smokes) into
  a per-tool symptom list — evidence, not invention;
- build the certification harness: a scripted MCP client driving every
  tool/operation with representative + edge inputs, capturing raw
  outputs, sizes, latencies, and problem objects (Test window assignment
  for real-scenario portions per testing rules);
- execute within the three user gates recorded 2026-06-12 (see
  Decisions): budgets are blocking smoke gates; the certification floor
  is all-five-pass (connectivity, completeness, edge honesty, budget
  compliance, description standard); merge/deprecate candidates go to
  the per-item user decision register — MT0 turns these into the harness
  pass/fail rules and the budget-gate wiring spec.

### MT1 - Connectivity And Completeness Sweep (AlembicWorkspace + Test as assigned)

- run the harness against both real runtimes (resident daemon MCP;
  committed Plugin MCP server) — every tool, every operation;
- produce the certification matrix v1: PASS/FAIL per tool×operation with
  raw outputs archived; dead routes, stubs, contract drift, and
  expectation mismatches enumerated;
- route findings: resident/embedded defects → MT2/MT3 fix scope
  (Alembic repo, immediate); Plugin-code defects → post-CKG fix queue;
  source-graph-tool findings → handed to CKG4 via controller.

### MT2 - Output Budget Mechanism And Compaction (AlembicCore + Alembic; Plugin post-CKG)

- one shared budget mechanism in Core (per-tool declared budget,
  measured enforcement, `truncated` honesty, pagination or artifact-ref
  overflow route) replacing per-handler magic-number slices;
- budgets set from MT1 measurements per the MT0-ruled policy; oversized
  tools compacted (projection trimming, summaries + refs for bulk data);
- budget gate wired into the repos' smoke per the MT0 ruling, with
  demonstrated failures;
- resident/embedded tools land now; Plugin tools queue post-CKG.

### MT3 - Usage-Error Hardening (Alembic now; AlembicPlugin post-CKG)

- every tool description rewritten to the tool-to-information standard
  (answers what / inputs / cannot prove / when not to use), validated by
  a description-completeness check;
- schemas made misuse-resistant: enumerated modes, honest required
  fields, cross-field validation with taxonomy problems + next actions;
- each harvested real-misuse case gets a specific guard or guidance fix
  and a regression negative test;
- gateway resolver closures replaced by statically auditable
  declarations where still present (AO1 follow-through check).

### MT4 - Certification Cards, Verdicts, And Acceptance (AlembicWorkspace)

- re-run the full harness; every tool gets its certification card
  (connectivity, completeness, edges, measured size vs budget,
  ergonomics, evidence links) stored script-readably in the ledger;
- per-tool value verdicts: keep / upgraded / merge-candidate /
  deprecate-candidate — candidates delivered as a per-item user decision
  register;
- before/after deltas reported: misuse-case closure rate, output-size
  reductions, PASS matrix completion; Plugin post-CKG queue handed to
  the controller with owners;
- controller acceptance from raw harness evidence; archive; Wakeflow
  verification.

## Producer/Consumer Order

MT0 → MT1 → MT2/MT3 (parallel-eligible: Core mechanism vs Alembic
descriptions, controller discretion) → MT4. Plugin-code portions of
MT2/MT3 form a post-CKG queue accepted inside MT4 or as a follow-up
package per controller decision.

## Completion Definition

- Every tool on both surfaces has a certification card with raw harness
  evidence; zero unexplained FAILs.
- The shared budget mechanism replaces magic-number slices; every tool
  has a declared, measured, enforced (per MT0 ruling) output budget with
  an honest overflow route.
- Every harvested misuse case is closed by a guard/guidance fix with a
  negative test; descriptions meet the tool-to-information standard.
- Verdict register delivered; merge/deprecate candidates await user
  decisions; Plugin post-CKG queue explicitly owned.
- All repo checks and the new gates green; acceptance from raw evidence;
  archived.

## Validation Requirements

MT1/MT4 harness runs archive raw MCP outputs per tool×operation; MT2/MT3
carry per-fix negative tests and demonstrated gate failures; every demand
runs the owning repos' full checks; the Codex surface invocations reuse
the CO smoke precedent; MT4 ends with Wakeflow verification. Real-project
scenarios route through Test per the workspace testing rules.

## Stop Conditions

- Any Plugin code edit before CKG completes (invocation-only audit
  excepted).
- A fix would change a tool's public contract beyond the
  already-defined design expectation — re-rule before editing.
- A deletion/merge would execute without its per-item user decision.
- Budget enforcement would silently drop data without the honest
  truncated/overflow signal.
- Findings on the 9 canonical source-graph tools would be fixed here
  instead of handed to CKG4 while CKG runs.
- Prose-only evidence.

## Decisions And Open Items

Inherited: Plugin hands-off until CKG completes (code edits); IC/AD/CC
rulings stand; write-strict/read-tolerant posture; releases
user-directed.

Resolved by user confirmation on 2026-06-12 (all three MT0 gates, as
recommended):

- Budget policy: measured per-tool budgets become BLOCKING gates in each
  repo's smoke (advisory-only rejected).
- Certification floor: a tool stays on the surface only when all five
  pass — connectivity, functional completeness, edge honesty, budget
  compliance, description standard.
- Verdict register: merge/deprecate candidates go to per-item user
  decisions (confirmed).

For intake: MT2/MT3 parallelization; whether the Plugin post-CKG queue
closes inside MT4 or as its own package; Test window assignment scope
for MT1.
