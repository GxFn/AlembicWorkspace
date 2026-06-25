# AlembicPlugin Daemon Removal And Runtime Core Sync Workspace Handoff

Date: 2026-06-18
Status: ready-for-controller-intake
Source Window: Design
Receiving Window: Wakeflow (controller)
Design Key: alembic-plugin-daemon-removal-runtime-core-sync-2026-06-18

## Summary

AlembicPlugin 删除完整嵌入式 daemon、退化为纯 MCP **非强进程**；统领不变量"任何功能不得依赖活过单次 MCP
调用的进程"。一并完成非职责净化删除。需求设计已闭合（边界 / 连通 / 阶段 / 顺序全核实），**无待用户决策项**，
仅剩两个 PDR-0 实现期复核。请控制器 intake、建状态根、按 PDR-0~6 拓扑序规划。详见 requirement design。

## Handoff Type

requirement-candidate

## Confirmed User Goal

- 删完整 Plugin 嵌入式 daemon = 纯 MCP 进程（同进程直调 Core Service）；统领"非强进程"不变量。
- bootstrap/rescan **交互不变**，仅 job/进度数据后端 daemon → 本地临时缓存；完成落 dataRoot（ghost）。
- 运行时状态同步**消费 Core 既有契约**（`ProjectRuntimeControlSnapshot` / `AlembicResidentService*`），多 Plugin
  → 一主体；**暂不新增 Core**；运行时态 = daemon + job（线程延后）。
- 净化删除：`HitRecorder`、**文件变化监控**（`FileChangeHandler` + `GitDiffCheckpointService`，需常驻、与不变量
  冲突）、`IntentExtractor` intake 整层、治理 `Gateway`、死代码清单。
- prime 直调正常向量语义；**无主体用 Plugin 本地向量语义全质量**（本地 Recipe 语义区证据 → 信任门禁）；
  **对外去除 `intentKind`**（后续由 Agent 从维度/类型列表选输入）。
- 保留：**git-commit 机会性进化**（`PluginOpportunisticEvolution`，触发时机后定）、`EvolutionGateway`、
  `RecipeProductionGateway`、本地向量语义、显式 `alembic_evolve`。

## Final Completion Definition

PDR-6（**claude-code 版本验收，不要求 codex 双壳 parity**）：无 daemon 进程四工具全功能；bootstrap/rescan
本地临时缓存 → dataRoot/ghost 落地；无主体纯本地 prime 全质量；有主体多对一运行时同步；净化各项解耦后活路径
（prime/work/code_guard、显式 alembic_evolve、保留的 git-commit 机会性进化）不断；全仓 build/check 绿。

## Current Design Status

- Requirement design status: complete（详见 requirement design 文档全程）。
- User confirmation status: confirmed（本轮逐条确认，无待用户决策项）。
- Mainline relation status: `next-mainline`（用户定为当前唯一推进需求；其他需求不再单独推进）。
- Original plan confirmation status: 无独立 original plan；requirement design 承载。
- Code fact status: 真实代码核实（MCP / daemon / intake / Gateway / resident / 向量 / Core 契约 / 进化链）。
- Needs Wakeflow code research: no（设计期已核实；剩 PDR-0 两项实现期复核）。
- Detached Design mode: no。
- Relation to Wakeflow current mainline: 取代早先"暂缓等推进组归档"；与已关闭的 APQ 的 intent 删除在本需求落地、
  不重开 APQ。

## Recommended Next Step

create controller state root or task package —— intake 后建状态根，按 PDR-0~6 拓扑序规划。
（仅供 Wakeflow review，非执行窗口提示词。控制器接收提示候选见 requirement design 文末。）

## Functional Loop Summary

- User scenario: 宿主 agent 用 AlembicPlugin 四工具（prime/work/code_guard/search 等）获取与治理项目知识，
  有 / 无 Alembic 主体均可用。
- Input: 结构化工具输入（prime 用 requirementGoal / locatorFacets / keywords）。
- Output: prime 知识材料 / 信任 receipt 等（去 `intentKind`）。
- State change: 本地知识库 / 向量；bootstrap 进度本地临时缓存 → dataRoot 落地。
- Producer: 主体 = runtime/control producer、Core = 契约 + JobStore、Plugin = consumer。
- Consumer: 多 Plugin → 一主体（多对一只读镜像）。
- Failure path: 无主体 → 纯本地首类 route（非降级 fallback）；主体中途失联 → 实时降级纯本地。

## Recommended Repository Coverage

| Window | Recommended Status | Recommended Responsibility | Dependency / Blocker |
| --- | --- | --- | --- |
| AlembicPlugin | participates | 全部 PDR 执行（删 daemon / 净化 / 本地临时缓存 / resident 瘦身 / 路线改写） | PDR-2 必先于 PDR-3 |
| AlembicCore | observing / no-task | 暂不新增 Core（复用既有契约）；仅当本地区向量需补索引时介入 | 见 Open Question 2 |
| Design | design-complete | — | — |
| Test | per controller | claude-code 版本真实场景验收（无 daemon / 无主体 prime / 多对一同步） | controller 启动 |
| Alembic / AlembicAgent / AlembicDashboard | no-task | Dashboard 归主体、不在本需求 | — |

## Evidence And Links

- Requirement design: [requirement design](alembic-plugin-daemon-removal-runtime-core-sync-2026-06-18.md)
- Code research: 已在 requirement design 的《真实代码锚点》《边界情况与连通性核验》核实（含 file:line）。
- User decisions: 本 handoff Confirmed User Goal + requirement design 确认账本。
- Related TODO / Backlog: 无新 TODO；净化在原始需求范围内。
- Related: APQ（`alembic-prime-output-quality-optimization-2026-06-16`，已关闭）—— intent 删除在本需求落地。

## Risks

- prime 无主体全质量依赖本地 Recipe 语义区向量可进程内构建（PDR-0 核；若需补索引触及 Core，与"暂不新增 Core"
  权衡）。
- 删 daemon 波及 `alembic_dashboard` / `alembic_runtime` / `alembic_status` 三工具（MCP 表面变更，已确认处置）。
- intake 整删跨 prime/work/code_guard + `PrimeSearchPipeline` + 会话绑定（`bindWorkSession` / `_trackSession`），
  改造面较大，须保证活路径不断。
- 顺序硬约束误置（PDR-3 先于 PDR-2）会断 `alembic_job`。
- 治理 Gateway 与 `EvolutionGateway` / `RecipeProductionGateway` 同名易混，删除须只删治理 Gateway。

## Non-Goals And Forbidden Shortcuts

- 不新增 Core（本需求）；不恢复 Dashboard（归主体）；不在 Plugin 保留任何常驻 HTTP / daemon 进程；
  不动 `EvolutionGateway` / `RecipeProductionGateway`；不重开已关闭的 APQ；不要求 codex 双壳 parity；
  四工具对外语义除去除 `intentKind` 外不变。

## Phase Candidates

| Phase | Goal | Upstream / Downstream | Completion Signal |
| --- | --- | --- | --- |
| PDR-0 | 盘点（CacheCoordinator 实例模型、本地区向量构建模式、死代码复核、删除面） | → 全部 | 盘点清单 + 两项复核结论 |
| PDR-1 | 净化删除（HitRecorder / 文件变化监控 / intake 整层 + prime 直调向量语义 / 治理 Gateway / 死代码），解耦先行 | 独立于 PDR-2 | 删净 + prime/work/code_guard 活路径绿 |
| PDR-2 | bootstrap/rescan 数据本地临时缓存 + 本地 Recipe 语义区向量 | 必先于 PDR-3 | job 脱 daemon、本地落地走通 |
| PDR-3 | 删完整 daemon（含 NoOpGateway、三工具处置） | 在 PDR-2 后 | 无 daemon 进程、四工具全功能 |
| PDR-5 | 改写 `selectEnhancementRoute`（纯本地首类） | 在 PDR-3 后 | 路线无 embedded、纯本地首类 |
| PDR-4 | resident 客户端瘦身（消费 Core，删 intent/decision/dashboard 三路） | 在 PDR-1 + PDR-3 后 | resident 仅 probe/projectScope/search/job |
| PDR-6 | 验收（claude-code 版本） | 末 | 验收口径全绿 |

执行序：**PDR-0 → 1 → 2 → 3 → 5 → 4 → 6**。Phase 为候选，非 task package。

## Open Questions For Wakeflow

1. CacheCoordinator 去留：无第二进程后是否仍需内存一致性（实例模型）？
2. 本地 Recipe 语义区向量是否已进程内构建（纯 Plugin 接线 vs 需补索引；若触及 Core 则与"暂不新增 Core"权衡）。

## Pre-Handoff Checklist

- Checked `docs/workspace-alignment-checklist.md`: 是（Design 边界内，无产品源码改动 / 派发 / 状态写）。
- This handoff does not include copyable implementation-window prompts: 是（控制器接收提示候选在 requirement
  design，供 intake 参考、非派发）。
- Phases remain candidates, not task packages: 是。
- TODO / Backlog candidates listed in Evidence And Links: 无新 TODO；净化在原始需求范围内。
- 删除 / 降级 / 延后 / 兼容保留 / 边界变更标记确认：是——daemon 删、三工具 MCP 表面变更、`intentKind` 去字段、
  文件变化监控删、暂不新增 Core / 线程延后 / 多对一显式绑定延后，**均已用户确认**。
