# alembic-coldstart-chain-repair-2026-06-25 — 宿主 Agent 冷启动 plan→bootstrap→submit→Recipe 全链路闭环:退场断接的 7-domain 层、输出预算化、门禁拒因可操作化、修计数;产出 Recipe 真实准确有价值

> State-root index. Generated from wakeflow-state.json (revision 38, event evt-20260624231002-0038). Regenerate with wakeflow-render-progress; do not hand-edit.

## Core records

- [demand.json](demand.json) — immutable demand record
- [wakeflow-state.json](wakeflow-state.json) — authoritative state machine (state: planned, revision 38)
- [controller-events.jsonl](controller-events.jsonl) — append-only controller event log
- [projection.json](projection.json) — machine-readable projection + structured slices
- [developer-progress.md](developer-progress.md) — human progress document

## Task packages

- `p0-plugin-evidence-gate-actionable-refusal-p1` (accepted) — P0 AlembicPlugin: make alembic_submit_knowledge evidence-gate refusal actionable without loosening the gate. Authority: Design/docs/current/alembic-coldstart-chain-repair-2026-06-25.md P0 only. Do not touch P1/P2/P3/P5/P6 or alembic_plan contract.
- `p1-plugin-retire-seven-domain-onboarding-layer-p1` (accepted) — P1 AlembicPlugin: retire the disconnected hard-coded 7-domain OnboardingContract task-decomposition layer from cold-start bootstrap, and keep only domain-independent host-agent quality contract pieces. Authority: requirement design P1. This is deletion/rewire of conflicting 7-domain guidance, not rename/compat continuation.
- `p2-plugin-bootstrap-recipemap-output-budgeting-p1` (accepted) — P2 AlembicPlugin: budget bootstrap and recipe_map outputs so MCP-visible inline payloads stay under the design threshold and oversized complete details move to transient refs. Authority: requirement design P2. This depends on accepted P1 and must not include P3 target fileCount or P5 recipeCount semantics.
- `p3-core-target-file-count-p1` (accepted) — P3 AlembicCore: fix MissionBriefingBuilder target file counts so bootstrap targets report real owned-file counts instead of ProjectContextRef anchor counts. This follows accepted P0/P1/P2 and must not touch AlembicPlugin P5 recipeCount or any Plugin/Codex transport semantics.
- `p5-plugin-recipecount-db-semantics-p1` (accepted) — P5 AlembicPlugin: align status recipeCount semantics with DB persisted recipe reality and expose disk materialized recipe count separately, after P0/P1/P2/P3 accepted. This must preserve alembic_plan two-part contract and not touch Core/Test/P6.
- `test-bilidili-coldstart-chain-e2e-p1` (accepted) — Final Test e2e for alembic-coldstart-chain-repair: run the BiliDili real-host cold-start loop after P0/P1/P2/P3/P5 accepted, and verify plan-driven bootstrap, inline budgeting, actionable gate refusal/self-correction, true target/status counts, dimension completion, and persisted valuable Recipes.
- `p3-followup-plugin-bootstrap-projectcontext-real-count-repair-p1` (accepted) — Follow-up repair from final Test e2e: bootstrap/rescan still feed MissionBriefingBuilder a reduced ProjectContext presenter input (4 files/0 modules) even though alembic_plan draft sees the real BiliDili project (163 files/10 modules, AOXFoundationKit=22, AOXNetworkKit=30). Repair the AlembicPlugin host-agent ProjectContext analysis path so bootstrap targets report real target-owned file counts through the public cold-start route; do not promote deferred P6 handoff/projectId drift.
- `test-bilidili-coldstart-chain-e2e-after-plugin-count-repair-p1` (accepted) — 复验 BiliDili 真机冷启动闭环：在 AlembicPlugin b94cc366c4921bc189bfb88f32a4816208466937 修复 bootstrap ProjectContext 真实计数后，重新验证原始 coldstart-chain 完成定义和此前 Test 暴露的 target count 缺口。
- `p4-plugin-host-mcp-runtime-count-db-route-repair-p1` (accepted) — 修复 Test 复验暴露的真实 Codex host MCP 路由缺口：本地 b94 修复未进入已安装 host runtime，bootstrap 仍输出 4/0 与 targets=1，dimension_complete 后 DB/status/recipe_map/graph/search 不可验收。

## Target tasks

- `p0-plugin-evidence-gate-actionable-refusal-t1` -> window `AlembicPlugin` (accepted)
- `p1-plugin-retire-seven-domain-onboarding-layer-t1` -> window `AlembicPlugin` (accepted)
- `p2-plugin-bootstrap-recipemap-output-budgeting-t1` -> window `AlembicPlugin` (accepted)
- `p3-core-target-file-count-t1` -> window `AlembicCore` (accepted)
- `p5-plugin-recipecount-db-semantics-t1` -> window `AlembicPlugin` (accepted)
- `test-bilidili-coldstart-chain-e2e-t1` -> window `Test` (accepted)
- `p3-followup-plugin-bootstrap-projectcontext-real-count-repair-t1` -> window `AlembicPlugin` (accepted)
- `test-bilidili-coldstart-chain-e2e-after-plugin-count-repair-t1` -> window `Test` (accepted)
- `p4-plugin-host-mcp-runtime-count-db-route-repair-t1` -> window `AlembicPlugin` (accepted)

## Sub-directories

- [task-packages/](task-packages/)
- [target-results/](target-results/)
- [transition-candidates/](transition-candidates/)
- [intake/](intake/) — _(not present)_
- [test-cards/](test-cards/) — _(not present)_
- [evidence/](evidence/)
- [focus/](focus/) — _(not present)_
