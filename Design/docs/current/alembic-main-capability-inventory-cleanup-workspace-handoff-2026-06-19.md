# Alembic Main Capability Inventory And Cleanup Workspace Handoff

Date: 2026-06-19
Status: ready-for-controller-intake
Source Window: Design
Receiving Window: Wakeflow (controller)
Design Key: alembic-main-capability-inventory-cleanup-2026-06-19

## Summary

Alembic 主体（`alembic-ai` 主仓）保留能力边界内的净化：删非职责/死/空壳/退役代码，**保留** daemon/HTTP/Dashboard/
Gateway/CLI/file-monitor 等核心能力。已完成全量功能测绘（4 簇 + Core/Agent 边界）、清理候选识别、用户逐项确认、
分阶段方案（MC-0~4）。**与 Plugin 净化性质相反**（主体保留 daemon/HTTP/Dashboard，非删除）。请控制器 intake、
建状态根、按 MC-0~4 推进（MC-0 含 CCR-ALMB 硬前置复核）。详见 requirement design。

## Handoff Type

requirement-candidate

## Confirmed User Goal

- 主体净化 = **保留能力边界内**清死/空壳/退役/确认死代码，**非能力删除**（AGENTS Stop Card 保护 CLI/daemon/HTTP/
  Dashboard/Gateway/ProjectRegistry/file-monitor/JobStore/AI 执行/sandbox/platform/injection/release）。
- **删**：task/intent 意图链 + `alembic_task` + `/task` + `/intent-episodes`（**意图/prime MCP 能力退役**，MCP 表面归
  Plugin）；`HitRecorder`（与意图链联动）；`monitoring`（ErrorTracker/PerformanceMonitor + `/monitoring`，dev 能力删除）；
  退役路由（auth 410 / search-context-aware）；空壳（refreshPanorama/PanoramaModule/AppConfigLoader/agent-project-context
  空目录/delivery-retired 死分支/regenerateEditorIndex）；确认死（CrossEncoderReranker[null 接线未启用]/ReactiveEvolutionService
  别名/BUILD_SYSTEM_MARKERS 别名）。
- **保留**：daemon/HTTP/Dashboard/Gateway(活)/CLI/file-monitor/cache(无 Redis 实现、本地性能缓存)/KnowledgeSyncService(活
  Core 服务)/sandbox/platform/injection/AI 执行编排，及全部 Core-契约 adapter 与 Agent host-owned 适配。
- **暂不处理**：V2 工具 vs 宿主 adapter 统一。

## Final Completion Definition

MC-4（**claude-code 版本验收**）：保留能力（daemon/HTTP/Dashboard/CLI/file-monitor/Gateway/sandbox/AI 执行）全功能；
意图/prime MCP 能力已退役无残留；monitoring 已移除；边界 lint（agent-extraction/core-import/repo-boundary）仍绿；
`build:check`+`test:unit`(+ 必要 integration) 绿；dashboard stats 处置生效。

## Current Design Status

- Requirement design status: complete（全量测绘 + 候选 + 决策 + MC-0~4 方案，见 requirement design）。
- User confirmation status: confirmed（逐项：意图链/HitRecorder/monitoring 删、文件监控/cache/KnowledgeSyncService 留、
  V2-adapter 暂不处理、验收 claude-code）。
- Mainline relation status: `after-current`（独立仓、可与 Plugin 净化并行；MC-0 有 CCR-ALMB 硬前置）。
- Original plan confirmation status: 无独立 original plan；requirement design 承载。
- Code fact status: 真实代码核实（入口/CLI/daemon/http 44 路由、service 12 子、workflows 5 流、支撑层、vendor；
  Core/Agent 边界 + 消费链 grep）。
- Needs Wakeflow code research: no（剩 MC-0 运行时核验）。
- Detached Design mode: no。
- Relation to Wakeflow current mainline: 与在途 **CCR-ALMB** 同源清理——MC-0 须先复核 CCR-ALMB 终态避免重叠/冲突。

## Recommended Next Step

create controller state root or task package —— intake 后建状态根，按 MC-0~4 推进（MC-0 CCR-ALMB 复核为硬前置）。
（仅供 Wakeflow review，非执行窗口提示词。）

## Functional Loop Summary

- User scenario: 用户经 CLI / Dashboard / HTTP 使用 Alembic 主体（项目知识库、guard、搜索、daemon、多项目 runtime）；
  Plugin 经 Core 接口/状态对接主体 daemon。
- Input: CLI 命令 / HTTP API / Dashboard 操作。
- Output: 知识/搜索/guard/项目 runtime 等（删意图/prime MCP 工具后，主体不再出 alembic_task）。
- State change: 知识库/向量/项目 runtime state；净化删除非职责代码。
- Producer/Consumer: 主体=本地完整能力宿主（消费 @alembic/core + @alembic/agent contract）。
- Failure path: 净化全程保边界 lint 绿；任一保留能力受损即停。

## Recommended Repository Coverage

| Window | Recommended Status | Recommended Responsibility | Dependency / Blocker |
| --- | --- | --- | --- |
| Alembic | participates | 全部 MC-0~4（净化删除、解耦先行） | MC-0 CCR-ALMB 硬前置；保留能力边界不碰 |
| AlembicDashboard | observing / needs-research | 若前端显示 guardHits/searchHits 或依赖 /monitoring·/task，配套前端调整 | MC-0 运行时核验定 |
| AlembicCore | no-task | 边界已清、无改动；仅复核 core-import lint 绿 | — |
| AlembicAgent | no-task | 抽取已完成、无改动；仅复核 agent-extraction lint 绿 | — |
| Design | design-complete | — | — |
| Test | participates | claude-code 版本真实场景验收（保留能力全功能 + 意图能力无残留） | controller 启动 |

## Evidence And Links

- Requirement design（含全量测绘 / 清理候选 / Core·Agent 边界核查 / MC-0~4 / 执行序）：
  [requirement design](alembic-main-capability-inventory-cleanup-2026-06-19.md)
- Code research: 已在 requirement design 各节核实（含 file:line + 消费链 grep）。
- User decisions: 本 handoff Confirmed User Goal + requirement design 确认账本。
- Related: 在途 **CCR-ALMB**（主体 git log：retire coverage/compliance、删 DecisionRegisterStore）——MC-0 复核终态；
  Plugin 净化 `alembic-plugin-daemon-removal-runtime-core-sync-2026-06-18`（对照：主体保留 daemon/HTTP/Dashboard）。

## Risks

- **意图/prime MCP 能力退役**：主体无 prime/work/code_guard 替代 → 删 task 链后主体不再有 MCP prime/intent 入口
  （合理：MCP 表面归 Plugin；但属可见能力变更，已用户确认）。
- **CCR-ALMB 重叠**：在途清理可能与本删除项交叉 → MC-0 硬前置复核。
- **dashboard stats**：删 HitRecorder 后 `guardHits/searchHits/searchHitsLast30d` 失生产者 → 前端处置可能触及 AlembicDashboard 仓。
- **运行时消费未明**：`/task`·`/intent-episodes` 代码审计无调用点，运行时（Dashboard/host）需确认。
- **保留能力误删**：daemon/HTTP/Dashboard/Gateway 等是主体本职——净化须严守边界 lint，勿空壳化。

## Non-Goals And Forbidden Shortcuts

- 不删/不空壳化 AGENTS Stop Card 保留能力（daemon/HTTP/Dashboard/Gateway/CLI/file-monitor/sandbox/platform/injection/
  AI 执行/release）。
- 不改 Core/Agent（边界已清、无重复/迁移项）；不在主体新增 Dashboard 前端源码（属 AlembicDashboard）。
- 不做 V2 工具 vs 宿主 adapter 统一（本轮暂不处理）。
- 不对齐 Plugin 的 git-commit-only 进化取向——主体**保留**文件变化监控。
- 验收仅 claude-code 版本（不要求 codex 双壳 parity）。

## Phase Candidates

| Phase | Goal | Upstream / Downstream | Completion Signal |
| --- | --- | --- | --- |
| MC-0 | 盘点 + 前置核验（CCR-ALMB 复核硬前置、/task·/intent-episodes 运行时消费核、dashboard stats 决策、lint 绿基线、死项 grep） | → 全部 | 前置结论 + 决策齐 |
| MC-1 | 安全直删（退役路由 + 空壳 + 确认死） | 独立、可并行 | grep 无残留 + build:check 绿 |
| MC-2 | monitoring 删（先撤 HttpServer 注入/中间件/路由再删） | 独立、可并行 | HttpServer + 其余路由正常 + build:check 绿 |
| MC-3 | 意图范式整删（task 链 + alembic_task + /task·/intent-episodes + HitRecorder + 意图信号订阅，解耦先行） | 独立、可并行（最重） | 全仓无 alembic_task/IntentExtractor 残留 + /search 不受影响 + build/test 绿 |
| MC-4 | 验收（claude-code） | 末 | 保留能力全功能 + 边界 lint 绿 + build/test 绿 |

执行序：**MC-0 →（MC-1 ‖ MC-2 ‖ MC-3）→ MC-4**。Phase 为候选，非 task package。

## Open Questions For Wakeflow

1. `/api/v1/task`·`/intent-episodes` 运行时消费方（Dashboard/host-agent；代码审计未见）——MC-0 运行时核。
2. 删 HitRecorder 后 dashboard `guardHits/searchHits/searchHitsLast30d` 字段处置（移除+前端 vs 置 0；是否触及 AlembicDashboard）。
3. CCR-ALMB 在途清理终态（MC-0 硬前置复核，避免重叠/冲突）。

## Pre-Handoff Checklist

- Checked `docs/workspace-alignment-checklist.md`: 是（Design 边界内，无产品源码改动 / 派发 / 状态写）。
- This handoff does not include copyable implementation-window prompts: 是。
- Phases remain candidates, not task packages: 是。
- TODO / Backlog candidates listed in Evidence And Links: 无新 TODO；净化在原始需求范围内。
- 删除 / 降级 / 延后 / 边界变更标记确认：是——意图/prime MCP 能力退役（可见能力变更）、monitoring dev 能力删除、V2-adapter
  暂不处理、Core/Agent 无改动、文件监控/cache/KnowledgeSyncService 保留，**均已用户确认**；保留能力边界明列非目标。
