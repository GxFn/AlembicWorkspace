# P10 Test Backfill Controller Review: Alembic Full-Reset Live-Route Rerun

Reviewed at: 2026-06-28T07:54:30Z

Dispatch group: `p10-bilidili-project-index-workflow-unify-realtest-rerun-after-alembic-full-reset-live-route-repair-p1`
Target task: `p10-bilidili-project-index-workflow-unify-realtest-rerun-after-alembic-full-reset-live-route-repair-t1`
Target: Test
Controller decision: accept Test blocked evidence for source fail-closed verification; do not accept P10 parity/G4/G6 completion.

## Raw Evidence Reviewed

- TargetResultEnvelope: `.wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26/target-results/tr-p10-bilidili-project-index-workflow-unify-realtest-rerun-after-alembic-full-reset-live-route-repair-t1.json`
- Test report: `.wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26/evidence/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-alembic-full-reset-live-route-repair-t1-report.md`
- Test summary: `.wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26/evidence/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-alembic-full-reset-live-route-repair-t1-summary.json`
- Test boundary card: `.wakeflow-active/current/alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26/test-cards/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-alembic-full-reset-live-route-repair-t1.json`
- Raw snapshots:
  - `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-alembic-full-reset-live-route-repair-t1/before-bootstrap-snapshot.json`
  - `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-alembic-full-reset-live-route-repair-t1/after-bootstrap-fail-closed-snapshot.json`
- Evidence helper reviewed as provenance for the snapshots:
  - `Test/tmp/p10-bilidili-project-index-workflow-unify-realtest-rerun-after-alembic-full-reset-live-route-repair-t1/p10-alembic-full-reset-live-route-evidence.mjs`
- Wakeflow review pack: `wakeflow_review_pack` for this dispatch group returned `groupStatus=blocked`, no missing evidence refs, and a sent/readback-ok controller-return delivery.

## Findings

1. Test identity and preconditions were valid. The run used the real BiliDili workspace, preserved DeepSeek generation and local Qwen/Ollama embeddings, verified R-2 root/dataRoot routing, and did not edit product source, DB rows, provider config, package versions, or manual sessions.
2. Source pins matched the intended post-repair stack: Alembic `af4d976c29fee58a93f05de8bfc334073575b46d`, AlembicPlugin `aee228be0082e8ddb1d4494df07e0ffedc6ea292`, AlembicCore `99a7cf10d82056cd860eb0a1d9544662e3735b08`, and clean BiliDili source state.
3. The before snapshot already showed the BiliDili data-root SQLite database was corrupt. Integrity checks reported malformed `knowledge_entries` table/index state. Runtime counts before bootstrap were `knowledgeEntries=18`, `coverageLedger=28`, `deepMiningRounds=2`, and `tokenUsage=28`; coverage rows were mixed between target modules and aggregate/root identifiers.
4. `alembic_bootstrap({rebuild:true})` returned `ok=false`, `status=failed`, `errorCode=INTERNAL_ERROR`, and `retryable=false`. The summary was fail-closed: destructive rebuild could not clear critical database tables, specifically `knowledge_entries`, so the host stopped before Recipe generation.
5. Runtime logs corroborated the fail-closed path: fullReset started, the DB snapshot was recorded, clearing `knowledge_entries` failed with `database disk image is malformed`, and fullReset aborted with `resetMode:"fail-closed"`. There was no later successful `fullReset complete` log in this attempt.
6. The after snapshot confirms no parity route ran. `coverageLedger`, `deepMiningRounds`, and `tokenUsage` were cleared to zero, but `knowledgeEntries=18` remained because the corrupt table could not be cleared. The existing incomplete bootstrap session also remained because the abort occurred before the successful replacement-session path.

## Judgment

The Test blocked result is valid. It proves the Alembic main live route now fails closed on the real BiliDili corrupt-DB reset path instead of continuing into generation or a false fullReset success.

This does not complete P10 parity, G4 coverage, G6 readiness, or the overall demand. The remaining blocker is not another immediate Alembic source bug in the tested branch; it is the current BiliDili data-root DB health/reset state. The database is malformed enough that official rebuild cannot clear `knowledge_entries`, so Test cannot reach non-empty target-scoped host/in-process parity without a controller-authorized clean data-root reset step.

## Next Action

Create a narrow Test package for controlled BiliDili data-root recovery and parity rerun:

- preserve raw evidence first, including DB file metadata/hash, integrity output, source pins, and current counts;
- quarantine the corrupt SQLite database and sidecar files at file level with a timestamped backup, only inside the BiliDili data root or Test evidence area;
- do not edit DB rows, source code, provider config, package versions, or unrelated `~/.asd` workspaces;
- rerun official `alembic_bootstrap({rebuild:true})` and then the P10 host/in-process workflow-unify parity path;
- pass only on non-empty target-scoped coverage with host vs in-process diff empty, no aggregate/root module ids, coverageLedgerSeed present, and no stale active session/open round after completion;
- block immediately if path identity, source/provider pins, backup/quarantine, reset, or parity evidence is unsafe or incomplete.

Forbidden conclusion: this review accepts the fail-closed blocked evidence only. It does not accept the P10 real-test gate, G4, G6, or final demand completion.
