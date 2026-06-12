# Cold Start Observation 2026-06-11

Status: live observation / requirement enrichment
Observed Surface: AlembicWorkspace total-control thread running AlembicPlugin
Target Project: Alembic product source root
Storage Mode: Ghost data root

## What Was Observed

The total-control thread attempted a real cold-start rebuild to inspect Codex
agent knowledge-base quality. This was not a pure design exercise. The flow
included cleaning or isolating old knowledge, initializing the project, running
host-agent bootstrap, submitting generated knowledge candidates, and completing
bootstrap dimensions.

Final observed local state at this checkpoint:

- 17 bootstrap dimension checkpoint files exist.
- 55 `knowledge_entries` exist.
- All 55 entries are `staging`, not published active Recipes.
- Entry distribution:
  - `architecture`: 5
  - `ts-js-module`: 5
  - each other completed dimension: 3
- Kind distribution:
  - `fact`: 16
  - `pattern`: 23
  - `rule`: 16
- Every entry has `sourceFile` and `coreCode`.
- Average quality scores are mostly B-range, roughly 0.77 to 0.82 by dimension.
- `code_entities` contains 2214 rows.
- Durable `source_graph_files`, `source_graph_symbols`, `source_graph_edges`,
  and `source_graph_generations` tables are empty.

The main positive signal is that Codex agent can generate valid staged
knowledge across all 17 dimensions after a real host-agent bootstrap, and the
candidate validator rejects under-specified entries before they pollute the
knowledge base.

The main negative signal is that the successful path still required manual
operator repair, manual MCP stdio fallback, and agent-authored templates. It did
not yet prove a clean, repeatable Codex user experience.

## Process Issues Found

### No Knowledge-Base Reset Tool

`alembic_codex_cleanup(confirm=true)` cleans daemon/runtime/log/job state. It
does not clean the actual knowledge database, Recipe/candidate projection,
skills, wiki, vector/context cache, or source graph tables.

For a user who explicitly wants "clear old knowledge and rebuild", there is no
clean public MCP operation such as:

```text
alembic_knowledge_reset({ scope: "knowledge-and-bootstrap", backup: true })
```

The total-control thread had to back up and isolate runtime data manually. That
is not an acceptable product path.

### Project Scope Can Drift Into Wrong Domain

Running bootstrap from the workspace controller root initially produced a
Mission Briefing containing unrelated BiliDili / Swift-style targets. The flow
had to switch to the Alembic product root to avoid contaminating the new
knowledge base with wrong-scope knowledge.

The cold-start UX must therefore make project scope a first-class gate:

- show selected control root and selected source folder;
- require explicit target source root when multiple folders are registered;
- fail closed if Mission Briefing target metadata does not match the requested
  source project;
- never let workspace-control roots silently become product cold-start roots.

### Empty Knowledge State Produces Confusing Failures

Several tools returned failure states during a legitimate empty-library cold
start. Examples included health/list failures and
`CODEX_ALEMBIC_KNOWLEDGE_REQUIRED` style blockers before bootstrap had produced
knowledge.

An empty but initialized project should be represented as a normal state:

```text
initialized_empty -> bootstrap_required
```

It should not look like a tool/runtime failure unless the runtime itself is
broken.

### Ghost Mode And Source Graph PathGuard Conflict

The Alembic source repository is intentionally treated as a source/development
repository. Standard local write mode is rejected by setup, and Ghost mode is the
correct storage model. However, source graph status initially hit a PathGuard
failure because the graph runtime tried to open a Ghost database path outside
the allowed source root.

This means the source graph lifecycle is not yet fully Ghost-aware.

The requirement must add:

- Ghost data-root read/write allowance for source graph storage;
- explicit separation between source root and data root;
- source graph PathGuard tests for registered source repositories;
- no workaround that flips a source repository to standard mode.

### Packaged Plugin Shell Blocked Cold Start

The packaged shell path attempted to install the pinned runtime package, but the
runtime package was not available from the npm registry in this environment. The
Codex host then saw `Transport closed`.

The local development route also failed diagnostics at first because
`local-dev-direct-dist` was not accepted as a valid development runtime route.

This exposes two separate requirements:

- public packaged mode must use a real available pinned runtime package or a
  validated offline cache path;
- local development mode must be explicitly accepted by diagnostics without
  weakening marketplace/runtime-pin checks.

### Codex Host MCP Transport Recovery Is Weak

After plugin cache and diagnostics changes, the Codex host continued reporting
`Transport closed` even when a manual stdio MCP probe could initialize and list
tools successfully. The total-control thread had to bypass the host transport
with a hand-written stdio MCP client.

The product path cannot rely on that.

Cold-start acceptance must require:

- in-host Codex MCP calls, not only manual stdio probes;
- clear startup stderr or host-visible diagnostic logs when the server exits;
- a reload/reconnect story after plugin cache changes;
- no silent shrink from the full tool catalog to a partial tool list without a
  visible reason.

### Clean Output Hid The Useful Failure Cause

When `alembic_codex_init` failed, the public clean output collapsed the error to
`CODEX_AUTO_INIT_FAILED` and hid the inner setup cause. The operator had to call
lower-level setup code directly to discover that standard mode is rejected for an
Alembic source repository.

Clean output should stay compact, but it must not remove the exact recovery
cause. Init/bootstrap failures need a small `problem` object with:

- reason code;
- failing step;
- sanitized path role, such as `sourceRoot` or `ghostDataRoot`;
- next action;
- whether retry is safe;
- whether manual local-data editing is forbidden.

### Bootstrap Session Is Process-Local

`dimension_complete` depends on the active bootstrap session in the same MCP
process. When bootstrap and submission happened in different manual stdio
sessions, dimension completion failed or lost context. The operator had to rerun
`bootstrap -> submit -> dimension_complete` inside one long-lived MCP process.

That is fragile for real Codex usage because host transports can restart, context
can compact, and users can pause.

The bootstrap session should be recoverable:

- return a `bootstrapSessionRef`;
- persist session state and completed dimensions;
- allow `dimension_complete({ sessionRef })` after MCP restart;
- avoid full reset when resuming the same bootstrap session;
- expose `bootstrap_status` or equivalent progress readback.

### Source Graph Tables Are Empty After Successful Knowledge Creation

The cold-start run created staged knowledge and code entities, but durable source
graph tables remained empty:

```text
source_graph_files = 0
source_graph_symbols = 0
source_graph_edges = 0
source_graph_generations = 0
code_entities = 2214
```

Therefore the current successful cold-start result does not prove that the new
CodeGraph-style source graph capability is being built or used. It proves that
ProjectIntelligence / CodeEntityGraph can feed Codex-authored candidates.

The CKG requirement must explicitly close this gap:

- source graph lifecycle must be part of cold start;
- Mission Briefing should name source graph generation and freshness;
- candidates should be able to bind source graph refs, not only source file
  strings and code snippets;
- source relationship tools must work after bootstrap without a separate hidden
  initialization step.

### Candidate Relations Are Too Weak

The produced candidate files contain useful `coreCode`, source file lists, and
quality scores. However, relation fields are mostly empty or auto-discovered.
This means Recipe candidates are not yet strongly connected to callers, callees,
dependency edges, impact radius, or affected tests.

This is exactly where source graph should improve Recipe production. The next
design pass should require graph-backed relation evidence for at least a subset
of candidate types:

- architecture boundaries;
- route / middleware behavior;
- validation contracts;
- async/concurrency patterns;
- security/auth flows;
- testing and affected-test guidance.

### Project Skill Export Is Blocked But Dimension Completion Still Passes

Several dimensions reported `SkillGenerator` failure because Project Skill export
to `.agents/skills/...` is blocked for the Alembic source repository by
PathGuard. Dimension completion still passed and checkpointed the dimension.

That may be correct for Ghost mode, but the state must be explicit:

- dimension knowledge completed;
- project skill generation skipped;
- skip reason is policy, not failure;
- where the Ghost-mode skill source was stored, if any;
- whether Codex runtime visibility is expected now or requires explicit export.

### Quality Gate Allows Mostly B-Grade Template-Like Knowledge

The final 55 entries are useful, but the quality distribution is mostly B-range.
The output is structurally valid and source-anchored, yet many entries have
short Chinese titles and template-like phrasing.

This is not a blocker for proof of concept, but it is not enough for a polished
knowledge product. Acceptance should measure:

- source coverage quality;
- relationship evidence coverage;
- uniqueness and non-overlap per dimension;
- actionability for future Codex tasks;
- not only "minimum three entries per dimension."

## Requirement Updates Needed

The CKG demand sequence should be amended as follows:

- CKG0 must record this cold-start observation as baseline evidence.
- CKG1 must add a first-class empty-library and wrong-scope onboarding state.
- CKG2 must make source graph Ghost-aware and verify durable source graph tables.
- CKG3 must persist bootstrap sessions and support recovery across MCP restarts.
- CKG4 must require graph-backed relation evidence in clean outputs and candidate
  refs.
- CKG5 must separate staged candidate availability from active Recipe/prime
  availability.
- CKG6 must show skipped skill export and bootstrap session recovery state.
- CKG7 must validate through real Codex host transport; manual stdio is allowed
  only as diagnostic evidence, not final acceptance.

## Current Evidence Summary

This observation should be treated as a strong baseline, not final acceptance.

Positive evidence:

- end-to-end candidate generation can complete 17 dimensions;
- validator blocks incomplete candidates;
- staged candidates are written to DB and file projection;
- dimension checkpoints exist for all 17 dimensions;
- quality scoring and file persistence are active.

Remaining gaps:

- no public knowledge reset operation;
- wrong-scope bootstrap risk;
- Ghost/source graph PathGuard mismatch;
- packaged runtime unavailable;
- Codex host transport instability;
- clean output hides actionable init cause;
- bootstrap session is process-local;
- source graph tables remain empty;
- relation evidence is weak;
- Project Skill export skip is not surfaced as a first-class state;
- staged candidates are not active Recipes and need review/promotion semantics.
