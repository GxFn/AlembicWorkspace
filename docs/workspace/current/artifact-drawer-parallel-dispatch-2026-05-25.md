# Artifact Drawer Parallel Dispatch

日期：2026-05-25
状态：并行分派完成：Artifact Drawer 总控验收通过 / LLM Wave 6 已验收
发送给：无
总控定位：本文件是当前总控并行分派入口，不把 Artifact Drawer UI 优化并入 LLM 输入优化主线，也不改变 LLM Wave 6 的完成定义。

<!-- workspace-sync
{
  "status": "并行分派完成：Artifact Drawer 总控验收通过 / LLM Wave 6 已验收",
  "indexPlanDescription": "LLM Wave 6 Test-09 已通过总控验收；`ARTIFACT-DRAWER-2026-05-25` 独立 Dashboard UI 优化提交 `d90f4d8ddde518f6e5db1477668bae13cf894a6a` 已通过总控验收。",
  "indexStatusDescription": "当前窗口状态、发送名单和活跃观察项；LLM 输入优化 Wave 6 与 Artifact Drawer 并行任务均已通过总控验收。",
  "currentIndexType": "当前并行分派",
  "currentIndexDescription": "LLM Wave 6 已验收，Artifact Drawer 已由 `AlembicDashboard` 回填并通过总控验收，当前无可发送窗口。",
  "indexRows": [
    {
      "type": "Artifact Drawer 并行分派",
      "doc": "docs/workspace/current/artifact-drawer-parallel-dispatch-2026-05-25.md",
      "status": "总控验收通过",
      "description": "`AlembicDashboard` 提交 `d90f4d8ddde518f6e5db1477668bae13cf894a6a`，完成 Timeline artifact detail 双层 drawer stack、窄屏覆盖和返回按钮，并通过总控验收。"
    },
    {
      "type": "Artifact Drawer Dashboard 回填",
      "doc": "docs/AlembicDashboard/timeline-artifact-drawer-optimization-dashboard-2026-05-25.md",
      "status": "总控验收通过",
      "description": "`ARTIFACT-DRAWER-P1-DASHBOARD-DRAWER-STACK` 完成范围、提交 hash、验证命令、DOM 等价视觉证据、遗留风险和总控验收结论。"
    }
  ],
  "currentIndexRows": [
    {
      "type": "Artifact Drawer Dashboard 回填",
      "doc": "docs/AlembicDashboard/timeline-artifact-drawer-optimization-dashboard-2026-05-25.md",
      "description": "`ARTIFACT-DRAWER-P1-DASHBOARD-DRAWER-STACK` 回填与总控验收结论。"
    }
  ]
}
-->

## 目标判断

当前存在两项已闭合事项：

- `GTODO-2026-05-24-040` / LLM 输入优化主线已完整闭合。Wave 6A `AlembicAgent` package/runtime producer 已通过总控验收；`AlembicTest` Test-09 package/runtime 证据已通过总控验收。
- `ARTIFACT-DRAWER-2026-05-25` 已由 `AlembicDesign` 完成需求设计并经用户确认，随后作为独立 `AlembicDashboard` UI 适配派发；`AlembicDashboard` 提交 `d90f4d8ddde518f6e5db1477668bae13cf894a6a` 已通过总控验收，不改后端、不触碰真实测试项目、不影响 LLM Wave 6 Test-09。

当前完成定义：

- LLM Wave 6B：`AlembicTest` 已按 [alembic-test-exchange.md](alembic-test-exchange.md) 回填 `Test-2026-05-25-09 / LLMI-P11-Package-Runtime-Integration` 证据，并通过总控验收。
- Artifact Drawer：`AlembicDashboard` 已完成 Timeline artifact detail 双层抽屉体验；总控复核确认宽屏上下文并排、窄屏第二层覆盖第一层、第二层返回按钮、Escape 优先关闭第二层，以及 artifact / metrics / trace / metadata 现有内容和失败状态均保留。

## Design 接收结论

来源：

- [Timeline Artifact Recipe Drawer Optimization 原始计划](../../../AlembicDesign/docs/current/timeline-artifact-recipe-drawer-optimization-original-plan-2026-05-25.md)
- [Timeline Artifact Recipe Drawer Optimization 需求设计](../../../AlembicDesign/docs/current/timeline-artifact-recipe-drawer-optimization-requirement-design-2026-05-25.md)
- [Design Handoff Inbox](design-handoff-inbox.md)

总控接收结论：

- 目标、用户场景、输入输出、非目标和完成定义已足够清楚。
- 用户确认它是独立 Dashboard UI 优化，不并入 PCV metrics、LLM input optimization 或 artifact producer。
- 不需要联网调研；本轮第一原则是复用本地已有 Recipe evolution 双层抽屉模式。
- 不需要先进入单独目标阶段确认；该需求范围小、用户已确认、无跨仓库 contract、无后端 producer / consumer 依赖。

## Dashboard 代码事实

总控已核对：

- `AlembicDashboard` 工作区干净，当前 HEAD 为 `30b376c Show job artifact details in timeline`。
- `AlembicDashboard/src/components/Views/RecipesView.tsx` 的 Recipe 详情使用 `PageOverlay` 统一承载两个 `Drawer.Panel`：`showEvolution` 时左侧 / 第二层 Evolution panel 使用 `Drawer.Panel size="sm"`，主 Recipe panel 使用 `Drawer.Panel size={drawerWide ? 'lg' : 'md'}`。这是本需求要求对齐的本地模式。
- `AlembicDashboard/src/components/Layout/Drawer.tsx` 已有通用 `Drawer.Panel`、`Drawer.Header`、`Drawer.Body`、`Drawer.HeaderActions`、`Drawer.CloseButton`、`Drawer.WidthToggle`，足够承载 drawer stack，不需要新建后端 contract。
- `AlembicDashboard/src/components/Views/JobsView.tsx` 当前 Timeline 使用 `Drawer open size="full"`，内部在选中 detail 时切到 `lg:grid-cols-[minmax(0,1fr)_minmax(340px,460px)]`；窄屏下 detail panel 会堆叠到 Timeline 下方，不是覆盖第一层，也没有明确返回按钮，只提供关闭 icon。
- `JobProcessEventDetailPanel` 已消费 `artifactRefs`、`api.getJobProcessArtifact`、`llmMetrics`、`traceEnvelope` 和 artifact metadata；本轮应保留这些内容和 loading / empty / error / success 状态。

文件边界判断：

- 主改动应集中在 `AlembicDashboard/src/components/Views/JobsView.tsx`。
- 可按需要小幅调整 `AlembicDashboard/src/components/Layout/Drawer.tsx`，但仅限通用抽屉返回 / stacking 语义；不得引入一套 Timeline 专用复杂 drawer 系统。
- 不改 `AlembicDashboard/src/api.ts`，除非 Dashboard 执行窗口发现现有 artifact read API 无法支撑当前已存在内容；若发现 API 缺口，先回填阻塞，不自行扩大到 `Alembic`。

## 阶段顺序

1. LLM Wave 6B 已验收：`AlembicTest` 已回填 Test-09，并通过总控复核；`AlembicTest` 自身未提交测试资产不作为阻塞。
2. 并行启动 Artifact Drawer Wave 1：`AlembicDashboard` 同包完成剩余代码事实确认、窄屏覆盖 / 返回按钮实现、宽窄屏 UI 验证证据。
3. `AlembicDashboard` 已回填并通过总控验收；本轮无后端 API 缺口，且代码 / contract / DOM 证据覆盖宽屏并排、窄屏覆盖、返回按钮和 artifact 状态，因此不额外创建 `AlembicTest` 测试单。
4. `GTODO-2026-05-24-040` 已判定完整闭合待归档；Artifact Drawer 不改变 LLM 主线验收结论。

## 任务包

| 任务包 ID | 窗口 | 摘要 | 状态 |
| --- | --- | --- | --- |
| LLMI-P11-Package-Runtime-Integration | `AlembicTest` | 验证 package/runtime 或小 cold-start 链路消费最新 Agent runtime。 | 总控验收通过 |
| ARTIFACT-DRAWER-P1-DASHBOARD-DRAWER-STACK | `AlembicDashboard` | 对齐 Recipe evolution 双层抽屉模式，完成 Timeline artifact detail 窄屏覆盖与返回按钮。 | 总控验收通过 |

### LLMI-P11-Package-Runtime-Integration：Package runtime integration verification

窗口：`AlembicTest`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 16:53 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 17:14 CST

阶段目标：

- 关闭 LLM 输入优化 Wave 6B 的最后真实验证门。
- 证明下游 package/runtime 或小 cold-start 链路消费最新 `AlembicAgent` runtime，而不是旧 `dist` 或 source-transform 路径。

主线动作：

- 先读取本 workspace `AGENTS.md`、`docs/workspace/index.md`、本文档、`docs/workspace/current/alembic-test-exchange.md` 和 `AlembicTest/AGENTS.md`，并声明当前窗口定位和本轮仓库职责。
- 按 [alembic-test-exchange.md](alembic-test-exchange.md) 中 `Test-2026-05-25-09 / LLMI-P11-Package-Runtime-Integration` 执行。
- 只验证 package/runtime 或小 cold-start 消费链路；不修改真实测试项目源码。

合并 TODO：

- `GTODO-2026-05-24-040`：LLM 输入优化主线最后集成验证。
- `GTODO-2026-05-25-002`：`AlembicAgent/dist` / staged package 产物消费证明。

明确不包含：

- 不处理 Artifact Drawer UI 需求。
- 不启动 PCV metrics / `GTODO-2026-05-25-003`。
- 不改 `AlembicAgent`、`AlembicDashboard` 或真实项目源码。

下一处真实阻塞点：

- 无。Test-09 已通过总控验收，LLM 输入优化主线已完整闭合待归档。

阻塞点之前还能做：

- 本包应一次完成 package/runtime 或小 cold-start 级验证、日志 / fixture 证据整理和测试交流文档回填。

验证命令：

```text
以 docs/workspace/current/alembic-test-exchange.md 中 Test-2026-05-25-09 的命令为准。
```

回填要求：

- 完成范围、验证命令、验证结果、关键日志 / artifact 摘要、遗留风险。
- 说明 package/runtime 链路是否包含 `LLMInputAssembly`、runtime layer、Observation Ledger 和 batch `filePaths` read。
- 回填到 `docs/workspace/current/alembic-test-exchange.md` 和 `AlembicTest/docs/` 对应报告。

执行前置硬规则：

- 先读取目标仓库 `AlembicTest/AGENTS.md`，并明确当前窗口定位 / 仓库职责。

### ARTIFACT-DRAWER-P1-DASHBOARD-DRAWER-STACK：Timeline artifact drawer stack

窗口：`AlembicDashboard`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 16:53 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 17:30 CST

阶段目标：

- 让 Timeline artifact detail 具备与 Recipe evolution 一致的双层抽屉体验。
- 第一版重点补窄屏适配：第二层覆盖第一层并提供返回按钮，不大改通用样式。

主线动作：

- 先读取本 workspace `AGENTS.md`、`docs/workspace/index.md`、本文档、Design 原始计划 / 需求设计和 `AlembicDashboard/AGENTS.md`，并声明当前窗口定位和本轮仓库职责。
- 复核 `RecipesView.tsx` 的 `PageOverlay + Drawer.Panel` 双层模式和 `JobsView.tsx` 的当前 Timeline detail grid 实现。
- 在 `JobsView.tsx` 中把 Timeline artifact detail 从窄屏堆叠改为 drawer stack：宽屏可并排保留 Timeline 上下文，窄屏第二层覆盖第一层，不产生水平滚动或双窄栏挤压。
- 第二层 detail header 提供清晰返回按钮；返回只关闭第二层并回到第一层 Timeline，不关闭整个 Timeline drawer。
- 保留当前 artifact projection、完整 redacted artifact、artifact refs 切换、metadata、metrics、trace、loading、empty、error、success 状态。
- 保持现有 Dashboard 设计系统和通用 drawer 样式；必要时只做最小通用 Drawer shell 增强。
- 回填执行记录到 `docs/AlembicDashboard/timeline-artifact-drawer-optimization-dashboard-2026-05-25.md`，并写清截图 / Browser 验证证据路径。

合并 TODO：

- `GTODO-2026-05-25-004`：Artifact Drawer UI optimization。
- `ARTIFACT-DRAWER-TODO-1`：定位 Recipe evolution 双层抽屉和 Timeline artifact detail 复用边界。
- `ARTIFACT-DRAWER-TODO-2`：实现窄屏覆盖和返回按钮。
- `ARTIFACT-DRAWER-TODO-3`：宽屏 / 窄屏响应式验证。

明确不包含：

- 不改 `Alembic` artifact producer / storage / API。
- 不改 `AlembicAgent` prompt / runtime、`AlembicCore` schema 或 `AlembicPlugin` host-agent route。
- 不实现 PCV metrics UI，不启动 `GTODO-2026-05-25-003`。
- 不为 Timeline 新建一套完全脱离 Recipe drawer pattern 的复杂抽屉系统。

下一处真实阻塞点：

- 若 Dashboard 无法只靠现有 artifact API 和前端 state 支撑双层详情，必须回填 API / contract 缺口；在此之前不得自行扩大到后端修改。

阻塞点之前还能做：

- Dashboard 可以在本包内完成代码事实复核、前端实现、基础测试、宽屏和窄屏 Browser / screenshot 验证，以及执行记录回填。

验证命令：

```text
npm run test
npm run typecheck
npm run check
git diff --check
```

还需提供 Browser / screenshot 或等价视觉证据，至少覆盖：

- 宽屏：Timeline 第一层与 artifact 第二层可并排查看，内容不互相遮挡。
- 窄屏：第二层覆盖第一层，不出现双窄栏挤压；返回按钮可回到第一层。
- Artifact 状态：有 artifact、无 artifactRef、artifact loading / error / success 至少通过 fixture、DOM 或代码路径说明覆盖。

回填要求：

- 完成范围、提交 hash、验证命令、验证结果、截图 / Browser 证据、遗留风险和下一步建议。
- 若无需新建 / 修改通用 Drawer 组件，说明理由。
- 若发现需要 `Alembic` API 返修，停止扩大实现并回填阻塞。

执行前置硬规则：

- 先读取目标仓库 `AlembicDashboard/AGENTS.md`，并明确当前窗口定位 / 仓库职责。

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 / 推荐窗口 | 事项 / 目标 | 影响复测 / 派发 | 下一步 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GTODO-2026-05-24-040 | 已完成待归档 | internal agent llm input optimization | P0 | `AlembicTest` / 总控 | LLM 输入优化闭环；Test-09 package/runtime 集成验证已通过总控验收。 | 否 | 主线已完整闭合；后续归档时移入历史记录。 |
| GTODO-2026-05-25-002 | 已完成待归档 | build artifact sync | P1 | `AlembicAgent` / `AlembicTest` | `AlembicAgent/dist` 与 staged package 已刷新并通过总控验收，Test-09 已证明 package/runtime 消费 staged artifact。 | 否 | 已关闭 package/runtime 产物消费门禁；后续归档时移入历史记录。 |
| GTODO-2026-05-25-004 | 已完成待归档 | dashboard responsive drawer | P0 | `AlembicDashboard` | Timeline artifact detail 对齐 Recipe evolution 双层抽屉；窄屏第二层覆盖第一层并提供返回按钮，保留 artifact / metrics / trace 内容。 | 否 | 提交 `d90f4d8ddde518f6e5db1477668bae13cf894a6a` 已通过总控验收；后续归档时移入历史记录。 |
| GTODO-2026-05-25-003 | 下一主线候选 | agent / llm optimization loop | P0 | `AlembicAgent` / `Alembic` / `AlembicDashboard` / `AlembicTest` | 在监控可视化闭环建立后，用 baseline、artifact、trace 和 metrics 优化 Agent / LLM 输入输出，并结合 `progressive-chain-validation` 做节点级 baseline。 | 是 | 不被本并行 UI 任务触发；仍等 LLM 主线完整完成并归档后再目标确认。 |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `Alembic` | 观察中 | 否 | Artifact Drawer 默认不改后端 artifact API；只有 Dashboard 回填 API 缺口时再处理。 |
| `AlembicCore` | 无任务 | 否 | 无共享 contract 或 schema 变更。 |
| `AlembicAgent` | 已完成 | 否 | Wave 6A package/runtime producer 已通过总控验收；本轮无返工任务。 |
| `AlembicDashboard` | 已完成 | 否 | 独立 UI 优化已通过总控验收，提交 `d90f4d8ddde518f6e5db1477668bae13cf894a6a`；本轮无需返工。 |
| `AlembicPlugin` | 无任务 | 否 | 不改变 Codex host-agent route 或 plugin runtime。 |
| `AlembicTest` | 已完成 | 否 | Test-09 已通过总控验收；Artifact Drawer 先由 Dashboard 自带 Browser / screenshot 证据。 |
| `BiliDili` | 无任务 | 否 | 不改真实 iOS 项目源码。 |

## 窗口分派

发送给：无

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>观察中 | 不参与 Artifact Drawer 首轮；仅当 Dashboard 回填 artifact API / contract 缺口时再返修。 |
| `AlembicCore`<br>无任务 | 无共享 contract、schema 或 headless 能力变更。 |
| `AlembicAgent`<br>已完成 | Wave 6A package/runtime producer 已通过总控验收，本轮无返工任务。 |
| `AlembicDashboard`<br>已完成 | `ARTIFACT-DRAWER-P1-DASHBOARD-DRAWER-STACK` 已通过总控验收，提交 `d90f4d8ddde518f6e5db1477668bae13cf894a6a`。 |
| `AlembicPlugin`<br>无任务 | 不参与本轮。 |
| `AlembicTest`<br>已完成 | `Test-2026-05-25-09 / LLMI-P11-Package-Runtime-Integration` 已通过总控验收。 |
| `BiliDili`<br>无任务 | 不参与本轮。 |

## 可复制分派提示词

发送给：无，当前并行分派已完成，无需发送新提示词。

```text
先读取 AGENTS.md、docs/workspace/index.md、docs/workspace/current/artifact-drawer-parallel-dispatch-2026-05-25.md，以及你所在窗口/目标仓库的 AGENTS.md。

先明确声明当前窗口定位和本轮仓库职责。

再按照文档领取并完成分配给你所在窗口的任务。

完成后回填：完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。
```

## 回填区

- 2026-05-25 17:30 CST：总控验收 `AlembicDashboard` `ARTIFACT-DRAWER-P1-DASHBOARD-DRAWER-STACK` 通过。复核提交 `d90f4d8ddde518f6e5db1477668bae13cf894a6a`、工作区状态、`JobsView.tsx` 关键代码和 `scripts/dashboard-contract.test.mjs` contract 证据，确认 `PageOverlay + Drawer.Panel` 双层 drawer stack、宽屏并排、窄屏第二层覆盖、`返回 Timeline` / `Back to timeline`、Escape 优先关闭第二层、artifact projection / refs / full artifact / metadata / metrics / trace 与 loading / empty / error / success 状态均保留。总控复跑 `npm run test`、`npm run typecheck`、`git diff --check HEAD^ HEAD` 通过；Browser / screenshot 不作为本轮阻塞，因为无后端 API 缺口且 DOM contract 已覆盖视觉行为。
- 2026-05-25 17:20 CST：`AlembicDashboard` 回填 `ARTIFACT-DRAWER-P1-DASHBOARD-DRAWER-STACK` 完成，提交 `d90f4d8ddde518f6e5db1477668bae13cf894a6a`，记录见 [../../AlembicDashboard/timeline-artifact-drawer-optimization-dashboard-2026-05-25.md](../../AlembicDashboard/timeline-artifact-drawer-optimization-dashboard-2026-05-25.md)。完成 Jobs Timeline `PageOverlay + Drawer.Panel` 双层 drawer stack，宽屏并排保留 Timeline 上下文，窄屏第二层覆盖第一层，返回按钮和 Escape 优先关闭第二层；保留 artifact projection、完整 redacted artifact、artifact refs、metadata、metrics、trace 与 loading / empty / error / success 状态。验证 `npm run test`、`npm run typecheck`、`npm run check`、`git diff --check`、`git diff --check HEAD^ HEAD` 均通过；Browser / screenshot 工具不可用，已提供 contract / DOM 等价视觉证据。
- 2026-05-25 17:14 CST：总控验收 `AlembicTest` Test-09 通过。复核 package-shape harness 真实消费 staged `@alembic/agent`，runtime import 未落回 `src/`，manifest 无 local dependency，batch `code.read({ filePaths })`、Observation Ledger、LLM input runtime layer、`noObjectPromise` 和 `noMissingRequiredPath` 均满足 Wave 6B 验收目标。按用户明确规则，`AlembicTest` 自身未提交 probe / 报告资产不作为验收阻塞；LLM 输入优化主线和 `GTODO-2026-05-25-002` 已完成待归档。
- 2026-05-25 16:53 CST：总控接收 `ARTIFACT-DRAWER-2026-05-25` Design handoff。代码事实核对确认 `AlembicDashboard` 工作区干净，Recipe evolution 已有 `PageOverlay + Drawer.Panel` 双层模式，Timeline artifact detail 当前在 `JobsView.tsx` 中窄屏堆叠且缺少返回按钮；判定可作为独立 Dashboard UI 并行任务启动。`AlembicTest` Test-09 当时已回填并等待总控验收，不改变 LLM 主线完成定义。
- 2026-05-25 16:55 CST：`AlembicTest` 已回填 `Test-2026-05-25-09 / LLMI-P11-Package-Runtime-Integration` 通过，报告见 [../../../AlembicTest/docs/llm-input-package-runtime-integration-2026-05-25.md](../../../AlembicTest/docs/llm-input-package-runtime-integration-2026-05-25.md)。验证 staged package `AlembicAgent/tmp/release/@alembic-agent` 可通过 package-shape harness 消费，manifest 无 local dependency，pack shasum `dbd390be0d13cca816c1bdb6de354b1838aca55f`，runtime import 未落回 `src/`，batch `code.read({ filePaths })`、Observation Ledger 和 LLM input runtime layer 均通过；随后总控于 17:14 CST 验收通过。
