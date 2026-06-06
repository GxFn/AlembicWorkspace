# Control State Machine Redesign Real Closed-Loop Audit

日期：2026-06-05
范围：AlembicWorkspace / codex-control-workspace only
状态：audited / fixes-applied / verification-passed-with-known-external-residue

## 审计目标

本次审计验证 `CONTROL-STATE-MACHINE-REDESIGN-2026-06-05` 的真实落地情况：

- 从 AFAPI 全量需求中挑选一个已完成但足够复杂的独立需求，按新 state-root 路线新建需求推进文档。
- 跑通 `controller-state` 主状态机、`developer-progress.md` 唯一状态投影、target result、reducer、总控裁决和最终完成 transition。
- 验证 automation JSON 路线不依赖 Markdown、不伪造 direct-thread send / readback。
- 检查边界失败是否 fail closed，并修复发现的问题。
- 判断新方案是否真正减少操作复杂度、减少状态分叉和误判风险。

## 选中样本需求

选中样本：`AFAPI-FULL-17 / Dashboard diagnostics UI`

选择理由：

- 它来自 Plugin Agent-Facing Public API Redesign 全量需求拆分。
- 已有真实完成证据和长期落地文档，可作为只读样本，不需要重启产品实现。
- 该需求涉及 producer contract、Dashboard consumer、diagnostics/sourceOfTruth/stateCleanup 等边界，足以验证新推进文档能承载复杂目标和证据。

样本 state root：

- `.workspace-active/workspace/current/afapi-full-17-dashboard-diagnostics-ui-state-machine-audit-2026-06-05/`
- 开发者推进文档：`.workspace-active/workspace/current/afapi-full-17-dashboard-diagnostics-ui-state-machine-audit-2026-06-05/developer-progress.md`
- 证据来源：`workspace-ledger/requirement-designs/plugin-agent-facing-public-api-redesign/afapi-11-dashboard-runtime-diagnostics-ui-landing-2026-06-05.md`

该 state root 位于 ignored `.workspace-active`，不进入开源仓库提交；tracked 仓库只承载模板、schema、脚本、skill 和测试。

## 真实链路验证

已实际执行并通过的链路：

1. `controller-state.mjs init`
   - 创建 `demand.json`、`controller-state.json`、`controller-events.jsonl`、`projection.json`、`developer-progress.md` 和机器目录。
   - 初始状态为 `intake`，automation disabled。

2. `controller-state.mjs add-task-package`
   - 任务包 `AFAPI-FULL-17-SAMPLE-P1` 写入 `task-packages/*.json`。
   - 主状态 revision 前进，projection 标为 stale。
   - 推进文档正文未被自动改写。

3. `append-progress-log.mjs` + `render-progress-doc.mjs`
   - 任务包摘要只追加到 `Task Packages`。
   - `render-progress-doc` 只更新 `Unified Status` marker block。

4. `codex-automation-loop.mjs prepare-dispatch-from-state`
   - 从 `controller-state.json` 和 task package JSON 生成 dispatch packet / dispatch group / delivery envelope。
   - packet/envelope 含 `stateRef` 和 `humanContextRef`，不含 `controlPlan` authority。
   - 未注册真实 target thread 时输出 `threadReady=false`，不声称已发送。

5. direct-thread 边界失败验证
   - `prepare-dispatch-from-state --require-thread` 在缺线程时 fail closed。
   - target delivery run 记录为 `blocked`，说明未执行 host send/readback。
   - controller return `--require-thread` 在缺 controller 线程时 fail closed。
   - controller-return envelope 可生成 pending 机器计划，但 delivery run 被记录为 `blocked`，不当作回跳完成。

6. `submit-result` / `review-results`
   - automation target result envelope 只进入 local runtime。
   - `review-results` 返回 `needs-controller-review`，不自动验收。

7. `controller-state.mjs import-target-result`
   - state-root target result 写入 `target-results/*.json`。
   - `stateRevisionUnchanged=2`，证明回填不改主状态。

8. `codex-automation-loop.mjs review-pack --state-root`
   - 读取 state-root result 和 evidence refs。
   - 找到 AFAPI-FULL-17 证据文档存在。
   - 输出 `rawEvidencePullRequired=true` / `totalControlVerdictRequired=true`。

9. `controller-state.mjs reduce-results`
   - 从 result 生成 `transition-candidates/*.json`。
   - 主状态进入 `review-ready`，但不接受任务、不创建下一跳。

10. `controller-state.mjs decide-review`
    - 总控显式 `accept` 后，任务包和 target task 进入 `accepted`。
    - 状态仍回到 `planned`，供总控决定是否还有下一任务。

11. `controller-state.mjs complete-demand`
    - 本次审计新增并验证最终 completion transition。
    - 只有所有 task package / target task 均 `accepted` 且无 active blocker 时允许进入 `completed`。
    - 完成 transition 必须带 `--reason` 和至少一个 `--evidence-ref`。

12. 最终 `render-progress-doc`
    - `developer-progress.md` 的 `Unified Status` 显示 `Main state: completed`、`Review: demand-completed`。
    - 正文只保留 Goal / Completion Definition / Stage Plan / Task Packages / Backfill / Decisions append log。

## 修复的问题

### Fix 1：controller-return blocked delivery 缺少 controller window evidence

问题：

- 当 `ControllerReturnEnvelope` 没有注册 controller thread 时，`record-delivery-run` 只能从 target delivery 的 `targetWindow` / `targetThread.windowName` 推导 window。
- controller-return envelope 没有 `targetWindow`，导致 blocked run 的 `thread.windowName` 缺失。
- 这不影响状态机正确性，但会降低回跳证据可读性，容易让总控复核时不知道 blocked return 是要回哪个窗口。

修复：

- `record-delivery-run` 新增 `deliveryWindow = targetWindow || targetThread.windowName || controllerWindow`。
- run 的 `targetWindow` 和 `thread.windowName` 均使用该值。
- 新增测试：`controller-return blocked delivery records controller window evidence`。

验证：

- 样本 blocked controller-return run 现在显示 `targetWindow=AlembicWorkspace`、`thread.windowName=AlembicWorkspace`。
- `node --test scripts/codex-automation-loop.test.mjs` 所属矩阵通过。

### Fix 2：状态机缺少最终 completed transition

问题：

- `decide-review accept` 只表示本轮 evidence 接受，完成后状态回到 `planned`。
- 脚本 schema 已有 `completed` 主状态，但没有命令可显式完成需求。
- 这会让真实无人值守末端无法干净表达“最终目标完成，无 eligible task，停止下一跳”。

修复：

- 新增 `controller-state.mjs complete-demand`。
- 要求：所有 task package / target task 均为 `accepted`、无 active blockers、提供 reason 和 evidence refs。
- 写入 `demand.completed` event，将主状态改为 `completed`，只标记 projection stale，不改推进文档正文，不启动 automation。
- 更新 `scripts/README.md` 和 `script-pipeline.md`。
- 新增测试：`complete-demand refuses open tasks and records final completion explicitly`。

验证：

- 样本 state root 最终进入 `completed`。
- `developer-progress.md` 最终只由 `Unified Status` 显示完成状态。

## 边界结论

通过的边界：

- `.workspace-active` / `.workspace-local` 继续作为 ignored 本机 / 项目运行态；开源仓库只提交模板、schema、脚本、skill、fixtures 和测试。
- 自动化 JSON 不解析 `developer-progress.md`，只读取 `controller-state.json` / task package JSON / local runtime JSON。
- 缺真实 thread id 时，`--require-thread` fail closed；无 host send/readback 时只能记录 blocked，不允许伪装 sent。
- target result、review pack、delivery run 均不能关闭任务或完成需求。
- reducer 只生成 candidate；总控 `decide-review` 才能接受 / 返工 / 阻塞。
- `complete-demand` 才能最终进入 `completed`，并且必须有已接受任务证据。

未做 / 不应做：

- 未真实发送 direct-thread 消息，因为本次没有注册真实测试目标线程；用 blocked delivery 证明 fail-closed 边界。
- 未修改 Alembic / AlembicPlugin / AlembicDashboard / AlembicCore 等产品仓库。
- 未清理 `BiliDili/.agents/skills` residue；这是既有真实项目 residue，需要用户另行裁决。
- 未迁移历史 `.workspace-active` current docs / global TODO / Design inbox；该方向仍是历史减量迁移问题。

## 复杂度与精简判断

结论：新方案确实降低了“流程判断复杂度”，但没有减少机器证据文件数量；它减少的是状态事实源和人工阅读面。

已降低的复杂度：

- 开发者日常只读一份 `developer-progress.md`，不用在 current plan / current status / index / TODO / delivery runs 之间找主状态。
- 主状态只由 `controller-state.json` + `controller-events.jsonl` 表达。
- `Unified Status` 是唯一状态显示区，且由脚本投影。
- 自动化运行态只回答 transport / result / callback，不再能被当成完成裁决。
- 旧 `controlPlan` 不再是新自动化 authority，state-root dispatch 才是默认入口。

仍然存在的复杂度：

- 机器文件仍多：state、events、task packages、target results、transition candidates、projection、dispatch packets、groups、delivery envelopes、delivery runs、review packs。
- 这是可复核无人值守证据链需要的复杂度，不能为了“看起来少”删除。
- 历史 current docs / TODO / inbox 尚未迁移，会继续让旧入口看起来复杂；但新需求已经不依赖它们。

是否避免了旧错误：

- 避免把 TargetResultEnvelope completed 当总控验收。
- 避免把 review-results `needs-controller-review` 当完成。
- 避免把 keep-live / stop-loop 当任务状态。
- 避免无 thread id 时继续投递。
- 避免推进文档正文反复改写状态。
- 新增 `complete-demand` 后，避免“已验收任务但需求永远停在 planned”的末端空转。

## 验证结果

通过：

- `node --test scripts/controller-state.test.mjs scripts/codex-automation-loop.test.mjs scripts/control-state-machine-route-fixtures.test.mjs`
- `node scripts/check-script-docs.mjs`
- `npm test`
- `git diff --check`
- `node scripts/workspace-control.mjs status --json`

部分失败但非本需求阻塞：

- `node scripts/verify-control-center.mjs --with-script-tests`
  - control workspace boundary / docs / script docs / current layout / whitespace / script tests 均通过。
  - 失败点为既有 `BiliDili/.agents/skills` Project Skill projection residue。
  - 本需求范围明确不改真实项目，因此只记录为外部 residue，不作为本次修复动作。
