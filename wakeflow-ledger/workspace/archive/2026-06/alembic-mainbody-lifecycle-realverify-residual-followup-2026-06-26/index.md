# alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26 — 主体适配 A-F 已实现+push 且控制器已归档 completed，但属 post-archive 假完成(归档 progress 零真机/零 finding#1)。真实剩余两段：Phase FIX 致命覆盖回写(deepMining runDeepMiningRounds:1020 只 ensureCoverageLedgerCells 播种 cell empty + 内联 upsertRound:1101 写轮，recipe 后从不回写 cell→cell 恒 empty/coveredCount0→CoverageLedgerAdvisor converged 分支死代码→覆盖永不前进；修=hook 进 KnowledgeRescanWorkflow per-dim 生成处镜像 Plugin dimension-completion:646，只补 per-CELL 回写、不调 reflow 避双计)+ Phase VERIFY 真 BiliDili 端到端(步3 GATE 修前证伪恒empty/修后grade晋级可达converged)。CG 全决：CG-3=B 下沉 Core(coverage-ledger-write 两函数移 @alembic/core 主体+Plugin 共消费、顺带分层重构下沉)/CG-1=沙箱(.backup() 护真~/.asd)/CG-2=Ollama 接通。门禁不放松(只回写真实 anti-fab recipe)。控制器 intake 须在归档 mainbody 记录挂 finding#1 残留注记，勿当已真实达成。

> State-root index. Generated from wakeflow-state.json (revision 2, event evt-20260627125508-0002). Regenerate with wakeflow-render-progress; do not hand-edit.

## Core records

- [demand.json](demand.json) — immutable demand record
- [wakeflow-state.json](wakeflow-state.json) — authoritative state machine (state: intake, revision 2)
- [controller-events.jsonl](controller-events.jsonl) — append-only controller event log
- [projection.json](projection.json) — machine-readable projection + structured slices
- [developer-progress.md](developer-progress.md) — human progress document

## Task packages

_None yet._

## Target tasks

_None yet._

## Sub-directories

- [task-packages/](task-packages/) — _(not present)_
- [target-results/](target-results/) — _(not present)_
- [transition-candidates/](transition-candidates/) — _(not present)_
- [intake/](intake/) — _(not present)_
- [test-cards/](test-cards/) — _(not present)_
- [evidence/](evidence/) — _(not present)_
- [focus/](focus/) — _(not present)_
