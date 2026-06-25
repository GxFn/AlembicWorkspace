# Plugin Coldstart Rescan Test Optimization Workspace Plan

状态：总控验收通过 / Stage 3A 已完成 / 待归档
日期：2026-05-31
维护窗口：AlembicWorkspace
Design Key：`PLUGIN-COLDSTART-RESCAN-TEST-OPTIMIZATION-2026-05-31`
当前计划范围：AlembicPlugin cold-start / rescan Recipe loop 测试优化

## 总控入口判断

用户目标：继续推进 `PLUGIN-COLDSTART-RESCAN-TEST-OPTIMIZATION-2026-05-31`，优化 AlembicPlugin 的 Plugin 级 cold-start Recipe 产出与增量 rescan 测试闭环。

当前证据：

- Design handoff 已导入总控 inbox，用户确认状态为 `confirmed`。
- 原始计划与需求设计确认：Plugin 是独立整体，本需求只考虑 Plugin cold-start 产出 Recipe、支持基于已有 Recipe 的增量扫描；其它外围逻辑不纳入本需求。
- Stage 0 只读 inventory 已完成：[plugin-coldstart-rescan-test-optimization-stage-0-inventory-2026-05-31.md](../../../../../codex-control-workspace/.wakeflow-active/current/plugin-coldstart-rescan-test-optimization-stage-0-inventory-2026-05-31.md)。
- `npm run verify:codex-session` 已通过，现有 5 个 status / init / bootstrap scenario 仍可用。
- AlembicPlugin Stage 1-2 已回填并经总控复核通过：commit `9ba3963e75c908d5499b15d77e95cc025997fa2b` 删除 `CodexScenarioAgentSimulator`，新增 architecture Recipe loop acceptance pack 和 evidence checker；总控复跑验证通过。
- Stage 3 真实线程验收曾失败：真实工具链能 submit / dimension_complete / rescan，DB/sourceRefs 保留成立；但 pack item 本身不符合 V3，checker 对真实输出的 Recipe markdown / `evidencePlan` 断言失败。
- Stage 3A 返工已完成并通过总控复核：AlembicPlugin commit `0cfb6e5f9d4f26e6c2c319bae485864875a03128` 修正 V3 pack item、checker DB/sourceRefs persistence 判断、`evidenceHints` / `evidencePlan` evidence surface 和 PathGuard warning 边界；总控使用同一真实 fixture/transcript 重跑 checker 得到 `ok=true`。

当前主线：本计划是 P2 testing optimization 小波次，代码层面已达到当前完成定义；不恢复 PCVM sourceRef 主线，不改 AP-KS-1 已验收结论，不启动自动化。

最小闭环：

```text
fixture project
-> alembic_bootstrap
-> real Codex thread handles architecture
-> alembic_submit_knowledge
-> alembic_dimension_complete
-> Recipe persisted
-> alembic_rescan({ dimensions: ['architecture'] })
-> preserved Recipe / evidenceHints-or-evidencePlan / no duplicate
```

第一阻塞点：已解除。Stage 3A 已把 pack/checker 假设与真实 Plugin 输出对齐，并保留 PathGuard runtime skill export blocked 为上下文 warning。

可安全执行的下一步：本计划可进入归档或等待用户指定下一个总控主线；不启动 automation，不派 AlembicTest，不继续扩大到产品行为重构。

## 完成定义

第一版完成后，总控应能验收：

- `CodexScenarioAgentSimulator` 已删除或明确退场，不再作为 Recipe loop 的 Agent 替身。
- 机械工具调用 / artifact 统计 / report 能力仍可用，不因退场 simulator 而丢失。
- 新增或更新 Codex thread acceptance pack，固定 `architecture` 单维，明确真实 Codex 窗口线程要执行的工具顺序、输入边界、回填证据和停止条件。
- 第一版 evidence checker 能至少断言 Recipe persisted、`knowledge_entries`、dimension / lifecycle / source refs 基础字段、rescan `evidenceHints` / `evidencePlan` evidence surface、unchanged no duplicate。
- 不改 cold-start / rescan 产品行为，不引入 AI provider / 外部 API key，不测试 resident daemon job、packaged runtime parity、Dashboard 或真实项目。

## 窗口分派

发送给：`无`

| 窗口 / 状态 | 任务 |
| --- | --- |
| `AlembicPlugin`<br>已完成 | `PLUGIN-COLDSTART-RESCAN-TEST-OPTIMIZATION-STAGE-3A-ACCEPTANCE-PACK-FIX` 已完成并通过总控复核：pack item V3 字段、checker 对真实 rescan/result surface 的判断、PathGuard warning 边界均已对齐。 |
| `AlembicWorkspace`<br>已完成 | 已复核 AlembicPlugin commit、同一真实 fixture checker report、focused tests、session verify、build 和 lint；本计划等待归档或切换新主线。 |
| `Alembic`<br>无任务 | 本轮不改 daemon / resident / internal AI job。 |
| `AlembicCore`<br>无任务 | 本轮不改 Core public contract / file-diff planner。 |
| `AlembicAgent`<br>无任务 | 本轮不引入 Agent runtime / AI provider。 |
| `AlembicDashboard`<br>无任务 | 本轮不做 UI。 |
| `AlembicTest`<br>无任务 | 本轮不使用真实项目或 AlembicTest；真实 Codex thread 验收包先由 AlembicPlugin 提供，是否执行由总控后续裁决。 |

## 任务包

任务包 ID：`PLUGIN-COLDSTART-RESCAN-TEST-OPTIMIZATION-STAGE-1-2`

窗口：`AlembicPlugin`

阶段目标：退场伪 Agent simulator，并补真实 Codex thread architecture Recipe loop 验收包。

主线动作：

- 读取 `AlembicPlugin/AGENTS.md`、父级 `AGENTS.md`、本计划和 Stage 0 inventory，先声明当前窗口定位 / 仓库职责。
- 删除或退场 `CodexScenarioAgentSimulator`，同步调整 `ScenarioRunner` / `verify-codex-session` 对它的依赖。
- 保留或迁移 `AgentOutputAnalyzer` 的机械 artifact 统计能力，包括 Recipe 文件、candidate 文件、`knowledge_entries`、lifecycle、tool calls、workspace state、side effects 和 report 输出。
- 新增 Codex thread acceptance pack：固定 `architecture` 单维，写清 `alembic_bootstrap`、`alembic_submit_knowledge`、`alembic_dimension_complete`、`alembic_rescan({ dimensions: ['architecture'] })` 的工具顺序、输入边界、回填证据和停止条件。
- 第一版 evidence checker 至少断言 Recipe persisted、`knowledge_entries`、dimension / lifecycle / source refs 基础字段、rescan `evidenceHints` / `evidencePlan` evidence surface、unchanged no duplicate。

明确不包含：

- 不改 cold-start / rescan 产品行为。
- 不引入 AI provider、联网 AI 或外部 API key。
- 不测试 resident daemon job、packaged runtime parity、Dashboard 或真实项目。
- 不把本任务扩大成 Core workflow、Alembic daemon、AlembicAgent runtime 或 AlembicTest 真实项目验证。
- 不启动 automation、不创建 heartbeat、不使用旧 claim / finish / chain-next。

验证命令：

```bash
npm run verify:codex-session
```

并按实际改动补充 focused unit / script 验证。若新增 evidence checker，必须提供输出样例或报告路径。

回填要求：

- 提交 hash 或 no-commit 理由。
- 删除 / 保留 / 新增文件清单。
- 验证命令和结果。
- 新增 acceptance pack 路径。
- evidence checker 输出样例或报告路径。
- 若发现产品链路断点，按断点单独回填，不得顺手重构。

## Stage 3 真实验收记录

验收目标：按 `architecture-recipe-loop` acceptance pack 用 disposable fixture 跑真实 Codex-facing Alembic MCP 工具链。

证据路径：

- Fixture project：`/private/tmp/alembic-plugin-recipe-loop-acceptance-20260531-001/project`
- Transcript：`/private/tmp/alembic-plugin-recipe-loop-acceptance-20260531-001/transcript.jsonl`
- Checker report：`/private/tmp/alembic-plugin-recipe-loop-acceptance-20260531-001/report.json`

真实工具链结果：

- `alembic_bootstrap`：success，projectRoot 为 disposable fixture。
- 原始 `pack.json` 的 `submitKnowledgeItem`：被 V3 拒绝，缺 `content.markdown`，`trigger` 未使用 `@` 前缀。
- 字段完整的同语义 architecture candidate：`alembic_submit_knowledge` success，id `a766c551-bb67-4652-b3b0-71ad51ab51c8`。
- `alembic_dimension_complete`：success，`recipesBound=1`；runtime skill export 观察到 PathGuard blocked。
- `alembic_rescan({ dimensions: ["architecture"] })`：success，`preservedRecipes=1`，audit healthy，返回 `evidenceHints`。

Checker 结果：

```json
{
  "ok": false,
  "errors": [
    "Recipe markdown was not persisted.",
    "alembic_rescan result does not contain evidencePlan."
  ],
  "summary": {
    "recipeFiles": 0,
    "knowledgeEntries": 1,
    "dimensionEntries": 1,
    "sourceRefs": 1,
    "submittedRecipeIds": ["a766c551-bb67-4652-b3b0-71ad51ab51c8"],
    "rescanEvidencePlanFound": false,
    "noDuplicateArchitectureRecipe": true
  }
}
```

总控裁决：Stage 3 真实验收失败，但不是 submit / dimension / rescan 主工具链全断；失败集中在 acceptance pack 示例字段与 checker 对真实输出面的断言。Stage 3A 已完成修正，最终验收见下一节。

## Stage 3A 总控验收记录

AlembicPlugin 提交：`0cfb6e5f9d4f26e6c2c319bae485864875a03128`（`test: align codex recipe loop acceptance evidence`）。

改动范围：

- `test/codex-acceptance-packs/architecture-recipe-loop/pack.json`：`submitKnowledgeItem` 补齐 V3 字段，`trigger` 改为 `@architecture-entry-point`。
- `scripts/lib/codex-recipe-loop-evidence-checker.mjs`：以 DB/sourceRefs 中的 architecture entry 作为当前 Plugin-owned runtime 的 Recipe persistence 证据，支持 `evidenceHints` 或 legacy `evidencePlan`，PathGuard runtime skill export blocked 只记 warning。
- `test/codex-acceptance-packs/architecture-recipe-loop/README.md`：同步说明 markdown Recipe file 可选、DB/sourceRefs 为当前 pass/fail 证据面、PathGuard warning 不属于本 pack 失败项。
- `test/unit/CodexRecipeLoopEvidenceChecker.test.ts`：新增真实 Plugin surface、V3 pack gateway validation 等覆盖。

总控复核命令：

```bash
node scripts/check-codex-recipe-loop-evidence.mjs --project-root /private/tmp/alembic-plugin-recipe-loop-acceptance-20260531-001/project --transcript /private/tmp/alembic-plugin-recipe-loop-acceptance-20260531-001/transcript.jsonl --report /private/tmp/alembic-plugin-recipe-loop-acceptance-20260531-001/report-after-stage-3a.json
npm run verify:codex-session
npx vitest run test/unit/CodexRecipeLoopEvidenceChecker.test.ts test/unit/CodexSessionScenarioRunner.test.ts
npm run build:check
npm run lint -- --diagnostic-level=error
```

复核结果：

- Real fixture checker report：`/private/tmp/alembic-plugin-recipe-loop-acceptance-20260531-001/report-after-stage-3a.json` 为 `ok=true`；`recipePersisted=true`、`knowledgeEntries=1`、`dimensionEntries=1`、`sourceRefs=1`、`rescanEvidenceSurface="evidenceHints"`、`noDuplicateArchitectureRecipe=true`；PathGuard blocked 仅为 warning。
- `npm run verify:codex-session`：通过 1 file / 5 tests。
- Focused vitest：通过 2 files / 9 tests。
- `npm run build:check`：通过。
- `npm run lint -- --diagnostic-level=error`：通过。

总控裁决：`PLUGIN-COLDSTART-RESCAN-TEST-OPTIMIZATION-2026-05-31` 当前代码层面完成定义已达到。当前不需要 AlembicTest、不需要产品行为重构、不启动 automation。

## 可复制提示词

无。Stage 3A 已完成并通过总控复核，当前不再发送执行窗口提示词。

## 回填区

- 2026-05-31：总控创建当前计划并准备发送给既有 AlembicPlugin 线程；未启动 automation。
- 2026-05-31：总控已直接发送 `PLUGIN-COLDSTART-RESCAN-TEST-OPTIMIZATION-STAGE-1-2` 给既有 AlembicPlugin 线程；thread id 仅保存在 `.wakeflow-local` 本地 registry，计划正文不记录；当前等待 AlembicPlugin 回填提交、验证和 evidence checker 证据。
- 2026-05-31：总控验收 AlembicPlugin Stage 1-2 通过。提交 `9ba3963e75c908d5499b15d77e95cc025997fa2b`，工作区 clean；删除 `test/support/codex-session/AgentSimulator.ts`；`ScenarioRunner` 改为机械执行 scenario steps / `expect.toolCalls`；`McpHarness` 记录 `codex.tool_call`；保留 `AgentOutputAnalyzer` 机械统计；新增 `test/codex-acceptance-packs/architecture-recipe-loop/pack.json` / `README.md` 和 `scripts/check-codex-recipe-loop-evidence.mjs` / `scripts/lib/codex-recipe-loop-evidence-checker.mjs`。总控复跑：`npm run verify:codex-session` 通过 1 file / 5 tests；`npx vitest run test/unit/CodexRecipeLoopEvidenceChecker.test.ts test/unit/CodexSessionScenarioRunner.test.ts` 通过 2 files / 7 tests；`npm run build:check` 通过；`npm run lint -- --diagnostic-level=error` 通过；changed-file `npx biome check ... --diagnostic-level=error` 通过；`rg -n "CodexScenarioAgentSimulator|AgentSimulator" test scripts lib` 无残留命中。Evidence sample report `/var/folders/16/4kp442r52ts5vdxvq9llds7r0000gn/T/alembic-recipe-loop-evidence-sample-eEKuL7/report.json` 为 `ok=true`，覆盖 Recipe file / `knowledge_entries` / `architecture` / source refs / ordered tools / rescan evidencePlan / no duplicate。边界：真实 Codex thread 验收尚未执行，需下一阶段单独裁决。
- 2026-05-31：总控执行 Stage 3 真实线程验收，结果失败并已返工 AlembicPlugin。真实工具链 submit / dimension_complete / rescan 基本连通，DB `knowledge_entries` 与 `recipe_source_refs` 保留成立，rescan preserved `1`；但原始 `pack.json` item 被 V3 拒绝，checker report `/private/tmp/alembic-plugin-recipe-loop-acceptance-20260531-001/report.json` 为 `ok=false`，失败项为缺 Recipe markdown 与 rescan result 无 `evidencePlan`。返工任务包：`PLUGIN-COLDSTART-RESCAN-TEST-OPTIMIZATION-STAGE-3A-ACCEPTANCE-PACK-FIX`。
- 2026-05-31：总控验收 Stage 3A 通过。AlembicPlugin commit `0cfb6e5f9d4f26e6c2c319bae485864875a03128`；真实 fixture checker report `/private/tmp/alembic-plugin-recipe-loop-acceptance-20260531-001/report-after-stage-3a.json` 为 `ok=true`，DB/sourceRefs persistence、`evidenceHints` evidence surface、no duplicate 均成立，PathGuard blocked 仅为 warning；`npm run verify:codex-session`、focused vitest、`npm run build:check`、`npm run lint -- --diagnostic-level=error` 均通过。当前计划代码层面完成，等待归档或切换新主线。
