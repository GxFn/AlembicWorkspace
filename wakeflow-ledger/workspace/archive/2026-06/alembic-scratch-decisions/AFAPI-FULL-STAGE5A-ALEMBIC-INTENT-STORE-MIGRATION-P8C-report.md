# AFAPI-FULL-STAGE5A-ALEMBIC-INTENT-STORE-MIGRATION-P8C

Window: Alembic
Task: AFAPI-FULL-STAGE5A-ALEMBIC-INTENT-STORE-MIGRATION-P8C
Scope: read-only inventory for AFAPI-FULL-20, Alembic producer side only.
Result: completed, no code change, no commit.

## Verdict

Alembic should not migrate the existing producer store, physical data path, or resident route from
IntentEpisode to IntentRecord in this Stage 5A inventory.

Classification for AFAPI-FULL-20:
- Alembic producer implementation: covered by current IntentEpisodeStore and route.
- Physical migration to IntentRecordStore: not needed in this task.
- Future rename: user/controller decision only, because it changes a published cross-repo resident
  contract and would require additive compatibility work across Alembic and AlembicPlugin.

## Alembic Code Evidence

- `lib/service/task/IntentEpisodeStore.ts:111` defines the durable store directory as
  `.asd/intent-episodes`; `:132-166` starts a ProjectScope-scoped episode record; `:169-203`
  attaches task id and writes terminal outcomes; `:222-236` exposes latest/recent session reads;
  `:239-272` persists record/latest/index/audit files; `:319-321` hashes raw session identifiers.
- `lib/injection/modules/InfraModule.ts:131-144` constructs `intentEpisodeStore` from
  `resolveAlembicWorkspace(projectRoot)` and passes dataRoot/projectId/projectScopeId/workspaceMode.
- `lib/http/routes/intent-episodes.ts:22-94` exposes start/latest/recent/read/update outcome through
  the resident API; `:96-112` publishes capability endpoints under `/api/v1/intent-episodes` with
  `project-scope-data-root`, `sha256-session-key`, and absolute-path redaction metadata.
- `lib/http/HttpServer.ts:316-317` mounts the route at `/api/v1/intent-episodes`.
- `lib/http/routes/daemon.ts:150-154` exposes daemon health capability as `intentEpisodes`.
- `lib/shared/schemas/http-requests.ts:297-318` validates start/outcome payloads for the current
  IntentEpisode route.
- `lib/resident/tool-handlers/task.ts:271-287` starts an episode during prime, `:356-360` attaches
  task creation to the active episode, and `:553-669` writes close/fail/abandon outcomes.
- `lib/http/routes/search.ts:257-265` and `:727-734` pass the store into IntentSearchPlan so
  latest/recent episode continuity contributes to retrieval.

## Consumer Evidence

- `../AlembicPlugin/lib/service/resident/AlembicResidentServiceClient.ts:223-283` declares the
  resident IntentEpisode record/request/result contract.
- `../AlembicPlugin/lib/service/resident/AlembicResidentServiceClient.ts:389-390` hard-codes
  `/api/v1/intent-episodes` and feature `intent-episodes`; `:573-633` performs start/latest/recent
  and outcome calls on that route.
- `../AlembicPlugin/lib/service/resident/AlembicResidentServiceClient.ts:830-905` treats the
  IntentEpisode route as a local daemon handoff feature with graceful unavailable responses.
- `../AlembicPlugin/lib/codex/mcp/handlers/agent-public-tools.ts:116-176` has a separate public
  `IntentRecord` in-memory concept, while `:312-318` explicitly keeps IntentEpisode handoff out of
  that Stage 3 active public surface. That is a consumer/public API naming distinction, not proof
  that Alembic producer storage should be renamed in place.

## Test Evidence

- `test/unit/IntentEpisodeStore.test.ts:24-116` verifies ProjectScope metadata, redaction, latest,
  recent, index, per-record JSON, and append-only audit under `.asd/intent-episodes`.
- `test/unit/IntentEpisodeRoute.test.ts:59-117` verifies POST/PATCH/latest/recent route behavior and
  response redaction.
- `test/unit/IntentEpisodeTask.test.ts:8-157` verifies resident task prime/create/close calls
  start/attach/updateOutcome and returns intentEpisode material.

Commands run:

```sh
npm run test:unit -- test/unit/IntentEpisodeStore.test.ts test/unit/IntentEpisodeRoute.test.ts test/unit/IntentSearchPlan.test.ts test/unit/IntentEpisodeTask.test.ts test/unit/SearchRouteTelemetry.test.ts test/unit/PrimeSearchPipelineIntentPlan.test.ts
npm run build:check
git status --short
```

Results:
- focused unit: 6 files passed, 14 tests passed.
- build check: passed (`build:core` plus `tsc --noEmit`).
- git status before report: clean.

## Migration Readback If Product Later Requires Rename

The safe migration would be additive, not destructive:

1. Keep `.asd/intent-episodes` as the canonical existing physical path or dual-read it forever.
2. Keep `/api/v1/intent-episodes` and `intentEpisodes` capability as backward-compatible contracts.
3. Add any IntentRecord naming only as an alias/capability projection first.
4. If a physical `.asd/intent-records` path is explicitly required, implement read-old/write-new or
   copy-on-start with no-data-loss tests for `latest.json`, `index.json`, `records/*.json`, and
   `episodes.jsonl`.
5. Coordinate AlembicPlugin client/types/tests and embedded runtime snapshots before changing any
   canonical wording.

Risk if renamed directly now: existing Plugin handoff clients would treat the route as unavailable,
old disk records would not be read by latest/recent lookups, daemon capability keys would drift, and
the Stage 3 public IntentRecord concept would be conflated with Alembic's durable resident episode
continuity contract.
