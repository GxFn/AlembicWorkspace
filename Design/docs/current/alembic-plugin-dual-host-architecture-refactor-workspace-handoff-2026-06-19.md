# AlembicPlugin 双宿主（Codex + Claude Code）职责架构重构与层级建设 Workspace Handoff

Date: 2026-06-19
Status: ready-for-controller-intake
Source Window: Design
Receiving Window: Wakeflow (controller)
Design Key: alembic-plugin-dual-host-architecture-refactor-2026-06-19

## Summary

把 AlembicPlugin（daemon-removal 清理后的纯 MCP 非强进程）**真正做成 Codex + Claude Code 双宿主插件**：经 5 层架构 +
新建 **L3 Host Adapter** 层（对称 codex/claude-code）+ host 抽象统一 + 执行层去 Codex-only。**这不是收拾，而是补能力**——
深挖+对抗核验确认现态是 **Codex 100% / cc ~5% 图式占位 / generic 0%**。**跨仓需求（Plugin + Alembic）**。已完成
Workflow 深挖（8 agents）+ 3 路可执行细化 + 9 项用户确认。详见 requirement design。

## Handoff Type

requirement-candidate（已解锁：daemon-removal 清理由总控完成）

## Confirmed User Goal（9 项已决，用户 2026-06-19）

1. **范围 = 大（全量 RC-1~8）**。
2. **generic-host-agent = 删**（`AGENT_HOSTS` 收敛为 codex + claude-code）。
3. **L3 Host Adapter = 留 Plugin**（host 适配宿主本职、不下沉 Core）。
4. **host 身份 = 真双 identity**（codex/claude-code，env 由 hostShape 派生、删 `ALEMBIC_PLUGIN_HOST=codex` 硬编码 + 加 `CLAUDE_CODE_PLUGIN_HOST`）。
5. **per-host 产物对等 = 纳入**（skills/templates/constitution per-host 分叉）。
6. **de-Codex 化 = 纳入（正确修改，RC-3b）**：~52 个误命名 host-agnostic `Codex*`（全部 `CODEX_*_TOOL_NAMES`、
   `resolveCodexServiceRequestBoundary`、`buildCodexProjectRuntimeContext` 等）去前缀、归 L1/L2。
7. **跨仓 = 确认**：Plugin + Alembic（改共享资产漂移门禁模型，治理权威在 Alembic 侧）——**非 Plugin 单窗口**。
8. **pre-existing 漂移 RED = 纳入本需求**：DH-0 先同步绿（alembic-recipes/structure + recipes-setup/README）。
9. **验收 = claude-code 在 workspace 内真实验收**；**codex 路径由用户在 codex host 真实验收（workspace 外、DH-6 不含 codex 实跑）**。

## Final Completion Definition

DH-6：**claude-code 在 workspace 内真实验收**——cc 端 init/status/工具行为与 codex 真对等；保持纯 MCP 非强进程不变量；
共享资产漂移门禁绿；build/test 绿；de-Codex 后 `Codex*` 误命名清零、层级单向（host-name 分支只在 L3）。
**codex 路径由用户在 codex host 上单独真实验收（workspace 外）**。

## Current Design Status

- Requirement design status: complete（深挖结论 + 5 层目标架构 + RC-1~8 含 de-Codex + 9 已决 + DH-0~6 可执行细化）。
- User confirmation status: confirmed（9 项已决；无悬空决策）。
- Mainline relation status: `next-mainline`（daemon-removal 清理的后继；用户解锁并定全量范围）。
- Original plan confirmation status: 无独立 original plan；requirement design 承载（前身 signal `alembic-plugin-dual-host-architecture-refactor-signal-2026-06-19`）。
- Code fact status: 真实代码核实（Workflow wj95g1fvd 8 agents 4 簇 + 3 对抗核验 + 3 路可执行深挖 + 跨仓 grep）。
- Needs Wakeflow code research: **DH-0 一项**——cc-host hooks 可行性（CC 是否暴露与 codex 等价 host hooks，决定 cc adapter 8 簇形态）。
- Detached Design mode: no。
- Relation to current mainline: 后继于已完成的 daemon-removal；并与 Plugin RC5 遗留漂移、未开工 CC3 波次有交集（DH-0/DH-4 处理）。

## Recommended Next Step

create controller state root or task package —— intake 后建状态根，按 DH-0~6 推进（DH-0 前置：修 pre-existing 漂移 RED +
cc-host hooks 可行性研究 为硬前置）。跨仓覆盖 Plugin + Alembic。

## Functional Loop Summary

- User scenario: 同一 Plugin 在 Codex 与 Claude Code 两宿主下都一等可用（工具/init/status/项目根/skills 行为按宿主正确）。
- Input/Output: 重构对象是**宿主适配与层级**（host 身份、L3 adapter、per-host 产物），不改四工具对外语义/业务行为。
- State change: 新建 L3 adapter；host 身份由 hostShape 派生；52 误命名去 Codex 归 L1/L2；per-host 产物分叉；漂移门禁改 per-host。
- Producer/Consumer: Plugin 双宿主运行时；连接层（L0/L1）host-blind 消费 Core（resident|pure-local）。
- Failure path: 保持 daemon-removal 非强进程不变量；每阶段门禁绿、保活路径，不裸断。

## Recommended Repository Coverage

| Window | Recommended Status | Recommended Responsibility | Dependency / Blocker |
| --- | --- | --- | --- |
| AlembicPlugin | participates | 全部 DH（host 抽象统一/L3 adapter/de-Codex/per-host 产物/清理/测试） | DH-0 cc-host 可行性 + 漂移 RED |
| Alembic | participates | **共享资产漂移门禁模型改 per-host**（manifest + check-shared-asset-drift.mjs，治理权威侧）+ 同步 pre-existing 漂移 | 跨仓协调；CC3 划界 |
| AlembicCore | observing | 连接层 host-blind、无 Core 改动；仅复核消费门禁绿 | — |
| Design | design-complete | — | — |
| Test | participates | **claude-code 端真实场景验收**（双宿主对等、非强进程不变量、门禁绿） | controller 启动；codex 由用户外部验收 |

## Evidence And Links

- Requirement design（深挖结论 / 5 层目标架构 / RC-1~8 / 9 已决 / DH-0~6 可执行细化 / 风险）：
  [requirement design](alembic-plugin-dual-host-architecture-refactor-2026-06-19.md)
- 前身 signal：`alembic-plugin-dual-host-architecture-refactor-signal-2026-06-19.md`（已解锁转需求）。
- Code research: requirement design 各节 + Workflow wj95g1fvd（92 Codex* surface 枚举、host-fix 改点、漂移门禁机制）。
- Related: daemon-removal `alembic-plugin-daemon-removal-runtime-core-sync-2026-06-18`（已完成清理、本需求后继）；
  共享资产漂移门禁权威在 `Alembic/config/shared-asset-manifest.json` + `scripts/check-shared-asset-drift.mjs`；CC3 wording-debt（PLUGIN-SOURCE.json，未开工）。

## Risks

- **大改面**：92 个 `Codex*` surface（~40 抽 L3 + ~52 去前缀归 L1/L2）+ 建对称 cc adapter——大重构，须分阶段、保活路径、每步门禁绿。
- **cc-host hooks 可行性未定**：cc adapter 8 簇（transport/项目根发现/init profile/env/tier/diagnostics/JobStore/execution context）
  需 DH-0 研究 CC 是否暴露等价 hooks；若不等价，cc adapter 形态调整（可能回来找用户）。
- **pre-existing 漂移 RED**：alembic-recipes/structure + README 漂移（plugin RC5 改、main 未同步）——已纳入 DH-0 先同步绿，否则改面纠缠。
- **跨仓协调**：改 Alembic↔Plugin 共享资产漂移门禁治理机制（权威在 Alembic）——须双仓同步、与 CC3 文案划界。
- **不变量**：保持 daemon-removal 纯 MCP 非强进程，不回退；L3 adapter 不得引入常驻进程。

## Non-Goals And Forbidden Shortcuts

- 不回退 daemon-removal 已删能力（纯 MCP 非强进程不变量）；不在 Plugin 重建 daemon/常驻进程。
- 不改四工具对外 MCP 语义/业务行为（仅改宿主适配与层级、host 身份、产物形态）。
- 不下沉 L3 Host Adapter 到 Core（host 适配属宿主层）。
- CC3 文案统一不在本需求（DH-4 只做结构 per-host 分叉；删 "Codex" 术语归 CC3）。
- 本需求验收不含 codex 实跑（codex 由用户在 codex host 外部验收）。

## Phase Candidates

| Phase | Goal | 说明 |
| --- | --- | --- |
| DH-0 | 盘点 + 前置（**修 pre-existing 漂移 RED** + **cc-host hooks 可行性研究** + 跨仓协调点 + CC3 划界） | 硬前置 |
| DH-1 | host 抽象统一 + 删 generic（RC-1/5；RuntimeContext:45/62、cc manifest:32/33、cc bootstrap:100、Diagnostics:542、6 文件删 generic） | — |
| DH-2 | 建 L3 Host Adapter 接口 + codex 实现迁入（RC-2，先对齐不改行为） | — |
| DH-3 | 新建 claude-code adapter + L2 改调 L3 + **52 误命名 de-Codex 归 L1/L2**（RC-2/3/3b） | 双宿主对等执行 |
| DH-4 | per-host 产物对等 + 漂移门禁模型改 per-host（RC-4，跨仓 Alembic + CC3 划界） | 跨仓 |
| DH-5 | 清理遗留收口 + 测试对等（RC-6/7/8） | — |
| DH-6 | 验收（claude-code workspace 内；codex 用户外部） | 末 |

执行序：**DH-0 → 1 → 2 → 3 → 4 → 5 → 6**（DH-2→3 硬序：先建 L3+codex 迁入、再 cc adapter+L2 改调；先替代/对等、不裸断）。Phase 为候选，非 task package。

## Open Questions For Wakeflow

1. **cc-host hooks 可行性（DH-0 研究）**：Claude Code 是否暴露与 codex 等价的 host hooks（transport/项目根/init/env/tier/diagnostics/JobStore）——决定 cc adapter 形态；若缺口大，回报用户。
2. **跨仓 Alembic 协调**：共享资产漂移门禁治理改动需 Alembic 窗口配合；与 CC3 波次划界由控制器协调。
（用户决策项已全部闭合；无阻塞性 open question。）

## Pre-Handoff Checklist

- Checked `docs/workspace-alignment-checklist.md`: 是（Design 边界内，无源码改动 / 派发 / 状态写）。
- This handoff does not include copyable implementation-window prompts: 是。
- Phases remain candidates, not task packages: 是。
- TODO / Backlog candidates listed in Evidence And Links: 无新 TODO；悬挂 bug alembic_project_matrix 已另立后台任务、不阻塞。
- 删除 / 降级 / 边界变更 / 跨仓 标记确认：是——de-Codex 52 去前缀、删 generic、per-host 产物分叉、改共享资产漂移门禁（跨仓）、
  host 身份双化、pre-existing 漂移纳入、cc/codex 验收分工，**均已用户 9 项确认**；非强进程不变量与"不改四工具语义/不下沉 L3"明列非目标。
