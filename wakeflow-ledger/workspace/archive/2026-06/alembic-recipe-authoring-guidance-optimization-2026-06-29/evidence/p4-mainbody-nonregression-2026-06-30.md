# P4.2 main-body (Alembic) non-regression — controller self-validation

Date: 2026-06-30
Controller: AlembicWorkspace (claude-code host)
Repo: Alembic (main-body), HEAD `ef30c0d`

## Why self-validated (not dispatched)

Per user decision Option B, `ai-scan` was carved OUT of this demand's CG-4
(AlembicAgent P1.4b is the contract-aware in-process closure; the dead Gateway
create-action layer and the HTTP knowledge route are separate follow-ups). As a
result the main-body received **zero source change** across this entire demand
(P0–P4). The 4th-repo non-regression leg of P4.2 is therefore a controller
self-check, not a window dispatch — there is no main-body work to review.

## Evidence

- `git status --short` (tracked, non-untracked): only `M CLAUDE.md` — the
  pre-existing installer `wakeflow:scope` marker edit (not introduced by this
  demand). No `lib/` or `bin/` source diff.
- `npm run build:check` (Node 22.22.1): **exit_code=0, 0 `error TS`** against the
  rebuilt `../AlembicCore` (consumes the additive Core changes P0–P4). build:core
  succeeded, `tsc --noEmit` clean.

## Conclusion

main-body is byte-unchanged in source and type-checks clean against the additive
Core API changes — non-regression holds. The remaining P4 non-regression legs
(Core, Plugin, Agent) are covered by their own window results
(P4-Core accepted; P4-Plugin + P4-Agent in-flight).
