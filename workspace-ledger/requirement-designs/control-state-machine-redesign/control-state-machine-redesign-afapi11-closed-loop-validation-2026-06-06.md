# Control State Machine Redesign AFAPI 11 Closed-loop Validation

日期：2026-06-06
样本需求：`AFAPI-REQ-11-DASHBOARD-RUNTIME-DIAGNOSTICS-UI`
验证窗口：AlembicWorkspace

## 验证目标

选择一个已经完成且证据足够的独立需求，重新走新总控状态机的完整闭环，验证：

- 单个需求可以从 state root 独立接手，不依赖旧 Markdown current plan 作为状态权威。
- developer progress 只由脚本更新 `Unified Status` 和追加日志。
- automation transport 只负责 packet / envelope / delivery-run evidence，不替代总控验收。
- TargetResultEnvelope / review-pack / reducer candidate / accept / complete-demand 每一步边界清晰。
- 缺真实 thread id 时 fail closed，不登记占位 thread id，不把 blocked delivery 写成 sent。

## 样本选择理由

`AFAPI-REQ-11-DASHBOARD-RUNTIME-DIAGNOSTICS-UI` 是条件型下游需求，已在 AFAPI Stage 5B 完成并通过总控验收。它有真实 Dashboard commit、API client / UI / contract test / screenshot 证据，同时无需重新启动产品实现，适合验证控制流程本身。

## 本轮状态根

- State root：`codex-control-workspace/.workspace-active/workspace/current/afapi-11-dashboard-runtime-diagnostics-ui-closed-loop-validation-2026-06-06/`
- Developer progress：`developer-progress.md`
- Local automation state：`codex-control-workspace/.workspace-local/codex-automation-loop-afapi11-closed-loop-validation-2026-06-06/`
- Task package：`CSMR-AFAPI11-DASHBOARD-CLOSED-LOOP-P1`
- Target task：`CSMR-AFAPI11-DASHBOARD-EVIDENCE-T1`
- Dispatch group：`CSMR-AFAPI11-DASHBOARD-CLOSED-LOOP-GROUP-20260606`

以上两个运行态目录均被 `.gitignore` 忽略；长期仓库只保留模板、脚本、skill、测试和本审计记录。

## 实际闭环步骤

1. `controller-state.mjs init` 创建 state root、机器状态、事件 JSONL、developer progress 和任务/结果/automation 子目录。
2. `controller-state.mjs add-task-package` 写入任务包和目标窗口，状态 revision 到 `2`，progress doc 未自动改写。
3. `append-progress-log.mjs` 追加 task-package 日志；`render-progress-doc.mjs` 只更新 Unified Status。
4. `codex-automation-loop.mjs prepare-dispatch-from-state` 生成 window config、dispatch packet、dispatch group、delivery envelope；输出 `threadReady=false`。
5. `prepare-dispatch-from-state --require-thread` 因未注册 `AlembicDashboard` 真实 thread id 失败关闭。
6. `record-delivery-run` 将 delivery 记录为 `blocked`，没有 sent/readback 证据。
7. `submit-result` 写入 TargetResultEnvelope，随后 `review-pack` 暴露原始证据 refs、delivery blocked 状态和总控 review gate。
8. `controller-state.mjs import-target-result` 将同一批原始证据导入 state root，revision 不变。
9. `codex-automation-loop.mjs review-pack --state-root` 显示 `controllerReviewReady=true`、`missingEvidenceRefsPresent=false`，仍要求总控 verdict。
10. `controller-state.mjs reduce-results` 生成 candidate `tc-20260605161717-0003`，状态进入 `review-ready`。
11. `controller-state.mjs decide-review --decision accept` 记录显式总控裁决，任务包和 target task 变为 accepted，状态回到 `planned`。
12. `controller-state.mjs complete-demand` 记录最终完成 transition，状态进入 `completed`，review 为 `demand-completed`。
13. 最终 `developer-progress.md` 显示 `Main state: completed`、任务包和窗口均 `accepted`，append-only 日志保留 task package / backfill / accept / completed。

## 原始证据

- AFAPI 11 独立需求文档：`workspace-ledger/requirement-designs/plugin-agent-facing-public-api-redesign/afapi-11-dashboard-runtime-diagnostics-ui-landing-2026-06-05.md`
- AFAPI 当前计划 Stage 5B 验收记录：`codex-control-workspace/.workspace-active/workspace/current/plugin-agent-facing-public-api-redesign-workspace-plan-2026-06-05.md`
- Dashboard commit：`47b7555bcf2abc9fc79249d7e6937c9b14bc3479`
- Dashboard worktree：clean；commit 已在 `origin/main`。
- 代码事实复核：`sourceOfTruth`、`diagnostics`、`stateCleanup`、`RuntimeSourceOfTruthPanel` 和 contract test 均存在。
- 截图证据：记录在样本 target result 中；本长期审计文档不写入本机绝对路径。

## 发现和优化

### 1. review-pack 对缺失路径证据的 gate 不够硬

复现：TargetResultEnvelope 中一个 path-like evidence ref 写错后，`review-pack` 能显示 `exists=false`，但 `controllerReviewReady` 仍为 `true`。

修复：

- `codex-automation-loop.mjs` 现在为 group review-pack 和 state-root review-pack 计算 `missingEvidenceRefs`。
- 有缺失 path-like evidence ref 时：
  - `missingEvidenceRefsPresent=true`
  - `evidenceRepairRequired=true`
  - `controllerReviewReady=false`
  - `totalControlVerdictRequired=false`
  - nextAction 指向修复 evidence refs。
- 补充测试：`review-pack gates missing path evidence refs before controller verdict`。

### 2. state-root review-pack 对绝对路径证据生成误导性 stateRootRelativePath

复现：绝对路径证据存在时，state-root review-pack 曾生成看似位于 state root 内的 `stateRootRelativePath`。

修复：

- 绝对路径证据不再生成 `stateRootRelativePath`。
- 相对路径证据仍保留 state-root 相对提示。
- 补充测试覆盖相对证据和绝对证据。

### 3. append-progress-log help 不可用

复现：`append-progress-log.mjs --help` 未输出用法，只给出停止提示。

修复：

- 增加 `--help` / `-h` 用法输出。
- 明确它只追加人类可读日志，不改变机器状态、不 dispatch、不 accept evidence。
- 补充测试：`append-progress-log help documents append-only usage`。

### 4. 过程边界提醒

本轮曾发现人工操作上把 `append-progress-log` 和 `render-progress-doc` 并行运行会有同文件写入风险。实际结果未丢日志，但后续操作应保持顺序：先追加日志，再渲染 Unified Status。该点属于操作纪律和后续 lock 机制候选，不影响本轮闭环完成。

## 验证结果

- Focused tests：`node --test scripts/controller-state.test.mjs scripts/codex-automation-loop.test.mjs`，22/22 passed。
- Script suite：`node scripts/workspace-control.mjs scripts --tests`，65/65 passed。
- `npm test`，67/67 passed。
- `node scripts/workspace-control.mjs status --json` passed；所有配置产品仓库 clean / pushed。
- `node scripts/verify-workspace-docs.mjs --all-workspace` passed；160 links checked。
- `git diff --check` 在 `codex-control-workspace` 和 workspace 根均通过。
- `node scripts/verify-control-center.mjs --with-script-tests` 除既有 `BiliDili/.agents/skills` residue 外均通过；该 residue 属于真实项目污染，不在本轮授权清理范围。

## 结论

AFAPI 11 样本闭环验证通过。新方案真实降低了操作复杂度：开发者只看一个 progress doc，机器状态、target result、dispatch/delivery/review pack 分离；脚本不替代总控裁决；缺 thread id 和缺证据路径都能 fail closed 或关闭 review gate。优化后最容易造成误判的证据路径问题已被测试锁住。

