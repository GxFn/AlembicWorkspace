# P1.4c main-body in-process re-point — needs-review: named target is dead code, real entry is elsewhere

Date: 2026-06-30 · Window: Alembic · Demand: alembic-recipe-authoring-guidance-optimization-2026-06-29 · Task: p1-mainbody-inprocess-repoint (P1.4c)

Status: **needs-review (no code committed)** — the task's named enforcement point is verified dead code; gating it would close CG-4 for zero live paths and would NOT satisfy the demand completion definition ("complete CG-4 across all submission paths"). The real enforcement point is outside the task's named scope and changes visible behavior, so it is a controller decision.

## What the task asked

Re-point the main-body `lib/governance/gateway/GatewayActionRegistry.ts` actions `candidate:create` (:24-29) and `recipe:create` (:77-82) — described as the SECOND in-process submit entry that "both call `knowledgeService.create(ctx.data)` DIRECTLY ... run only Core stage-3" — to run `validateAgainst({stage:'all', path:'in-process', profile, sourceRefResolver, dimensionId})` before `knowledgeService.create`, completing CG-4. Acceptance text: "a re-point test proving both GatewayActionRegistry create actions now run validateAgainst before knowledgeService.create".

## Verified ground truth (independent, 2-pass grep + call-site reads)

### Finding 1 — the two named Gateway actions are DEAD (no live dispatcher)

- `grep -rn "candidate:create\|recipe:create" lib/ bin/ test/` → only the two `gateway.register(...)` definitions (`GatewayActionRegistry.ts:24,77`) + one docstring example (`lib/http/middleware/gatewayMiddleware.ts:31`). **No dispatch site.**
- The only generic Gateway dispatcher is `req.gw(action, resource, data)` (`gatewayMiddleware.ts:36,42`). Whole-repo scan of live `req.gw(...)` calls → **only `'guard_rule:create'`** (`lib/http/routes/guardRules.ts:185`).
- `buildGatewayRequest` (`GatewayActionRegistry.ts:221`) is **never called**.
- No dynamic `${resource}:create` dispatch reaches these actions.
- Sanity: 31 `gateway.register(...)` actions exist, but only `guard_rule:create` is ever dispatched via `req.gw` — the Gateway create-action layer for knowledge/recipe is vestigial (V3 unified Candidate+Recipe into knowledge and the create paths moved to direct service calls).

⇒ Adding a gate inside the two `GatewayActionRegistry` handlers guards a path with **no live caller**. It closes CG-4 for **zero** live submission paths.

### Finding 2 — the REAL live main-body knowledge-create entries bypass the Gateway

| Entry | file:line | Live via | Type |
|---|---|---|---|
| **In-process AI producer** | `lib/cli/AiScanService.ts:159` → `knowledgeService.create(recipe, {userId:'ai-scan'})` (then `publish` :162) | `bin/cli.ts:1210-1211` (`new AiScanService(...)` → `scan()`) | **In-process AI authoring — the genuine main-body CG-4 gap** |
| External HTTP create | `lib/http/routes/knowledge.ts:186` → `knowledgeService.create(data, context)` | `lib/http/HttpServer.ts:307` mounts `POST {apiPrefix}/knowledge` | External HTTP / API / dashboard-backend |

- `AiScanService.scan()` authors recipes via the embedded AlembicAgent (`runScanAgentTask({task:'extract'})`, `AiScanService.ts:121-127`) then `create`+`publish` directly — only Core stage-3 runs (no stage-1/2). This is exactly the "independent `knowledgeService.create`" path the **design §C.7** asked us to find: *"确认 main-body in-process submit 是否经 AlembicAgent handleSubmit（embedded runtime）还是独立 `knowledgeService.create`；若独立，P1.4 增显式 re-point"*. It is independent ⇒ §C.7 says re-point HERE.
- The task's named line numbers (the Gateway actions) appear to be a stale pointer: the P0.0 oracle traced `knowledgeService.create` callers and recorded the Gateway registrations, but those registrations are dead; the live independent create is `AiScanService.ts:159`.

### Finding 3 — reuse of the AlembicAgent gate is NOT possible without touching AlembicAgent

- `runInProcessRecipeAuthoringGate` / `createInProcessSourceRefResolver` / `formatRecipeAuthoringViolations` exist ONLY in `AlembicAgent/src/tools/runtime/handlers/{recipeAuthoringGate,knowledge}.ts` (`grep -rln` across `AlembicAgent/src` confirms two files only).
- They are **not re-exported** from any `@alembic/agent` public subpath (exports map: `.`, `./agent`, `./service`, `./runtime`, `./prompts`, `./domain`, `./tasks`, `./profiles`, `./ai`, `./tools/runtime`, `./memory`, `./context`; none re-export the handler symbols).
- The main-body may only consume `@alembic/agent` **public subpaths**; exporting the gate would require editing AlembicAgent, which this task forbids.
- ⇒ The task's "REUSE if possible" is not possible. The sanctioned fallback (supply our own §C.11 fs resolver, byte-faithful to the AlembicAgent one, consuming `@alembic/core/knowledge`) is the path. This is ready; it is not the blocker — the enforcement point is.

## Why this is needs-review, not completed

- Gating the dead Gateway actions = real-caller-less glue code; it makes the acceptance test green while CG-4 stays open for the only live in-process path (`AiScanService`). That manufactures a misleading "CG-4 complete" signal — the demand completion definition is "CG-4 across ALL submission paths".
- Choosing the correct enforcement point is a completion-definition decision:
  - `AiScanService.ts:159` is in this repo and is the genuine in-process AI path, but gating it changes the visible behavior of the `alembic ai-scan` CLI (it would newly-reject low-quality recipes — a bounded content/cheap-grounding tightening).
  - `lib/http/routes/knowledge.ts:186` is an EXTERNAL HTTP API; tightening it changes a public contract for human/dashboard/API clients (high should-pass risk) — likely a USER gate, not just controller.
- Both are beyond the task's named scope ("the two GatewayActionRegistry actions"). Per the repo stop card (disconnected code / no-real-caller glue / partial-without-confirmation) and the window Functional Completeness Self-Check, I stop and surface rather than (a) ship a no-op on dead actions or (b) silently expand scope into visible-behavior changes.

## Options (for controller decision)

- **Option A (recommended) — re-aim the gate to the live independent create `AiScanService.ts:159`** (this is §C.7's "若独立，增显式 re-point").
  - Add main-body `lib/governance/gateway/recipeAuthoringGate.ts` (own §C.11 fs resolver, byte-faithful to the AlembicAgent one; consume `@alembic/core/knowledge` `validateAgainst`/`resolveAuthoringProfile`). Call it before `knowledgeService.create` in `AiScanService.scan()`; reject through the existing `AiScanService` per-recipe `try/catch` (it already pushes failures to `report.errors`).
  - Profile: AiScanService submits with no session/dimensionId ⇒ **opportunistic** (content gates + cheap fs grounding; no 3-file floor, no session-scope) — matches §12.3 "运行期机会式 in-process AI 开发".
  - Producer-prompt-first already satisfied: AiScanService authors via the embedded AlembicAgent `insightProducer` upgraded in P1.4b — no main-body producer prompt to upgrade.
  - Closes CG-4 for the real main-body in-process path. Deliver build:check + a re-point test + a currently-passing-corpus regression (bounded new-reject set) + host-vs-in-process parity.
- **Option B — also gate the external HTTP `POST /api/v1/knowledge` (`knowledge.ts:186`).** External/human/API surface; real public-contract visible-behavior change with high should-pass risk → recommend a separate USER decision, opportunistic profile if pursued.
- **Option C — implement the literal task (gate the two dead Gateway actions) as defense-in-depth.** Matches the named scope + written acceptance exactly and hardens the registered action if ever dispatched via `req.gw`, but closes CG-4 for zero current callers and leaves `AiScanService` open ⇒ does NOT satisfy "CG-4 across all submission paths". Low value alone; acceptable only as a complement to A.

Recommendation: **A** (gate `AiScanService.ts:159`, opportunistic), optionally **+C** for registered-surface completeness; **B** as a separate user-gated decision. Ready to implement A immediately on controller confirmation.

## Boundary held

No code committed. AlembicCore / AlembicPlugin / AlembicAgent / FieldSpec untouched. HEAD unchanged (`ef30c0d`; only the installer-managed `CLAUDE.md` shows the pre-existing `wakeflow:scope` marker edit, not mine). No push/tag/version bump.
