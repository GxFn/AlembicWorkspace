# Alembic Core Capability Inventory And Interface Optimization Workspace Handoff

Date: 2026-06-19
Status: ready-for-controller-intake
Source Window: Design
Receiving Window: Wakeflow (controller)
Design Key: alembic-core-capability-inventory-optimization-2026-06-19

## Summary

AlembicCore（`@alembic/core` 共享内核，120k LOC，被 主体/Plugin/Agent 共消费）的**接口能力整理 → 统一输出层**优化 +
局部内部优化。**评估结论：不需删码式大清理**（Core 健康、纪律强、多在途波次主动清理中）；需要的是用户指定的**能力导向
统一输出层重构**（per-module 能力输出、内部化底层 AST/语言接口、**非 barrel 打包**）+ 拆巨石/facade 归位/补测试。已完成
全量测绘 + 跨仓深挖落地 + 分阶段方案 CO-0~6。**跨仓 consumer 迁移**为主体工作量；**硬序：先替代→迁移→内部化（不裸断）**。
详见 requirement design。

## Handoff Type

requirement-candidate

## Confirmed User Goal

- **核心方向（用户 2026-06-19）**：接口**能力整理 → 统一输出层**——每个隔离功能模块对外只出**一个能力导向输出**、内部化实现；
  **底层 AST/语言级接口不再外暴**；**关键约束=拒绝"纯粹接口打包"(barrel)，做真正能力整理**。ProjectContext/RecipeContext 为范例。
- **其余按 Design 推荐（用户授权）**：先修接口门禁（public-api-boundary/smoke）；`./core/capability` 移除（production 0 消费）；
  范围=中（能力整理 + 修门禁 + 拆 project-intelligence 巨石 + facade 归位 + 补测试）；facade 归位 quality/bootstrap→sub-path、
  panorama 跨仓核实后定。
- **硬约束**：**先给替代能力 → 迁移 consumer → 再内部化收口（不裸断）**；全程跨仓核验 + 消费门禁守护；与在途波次调和。

## Final Completion Definition

CO-6：public-api 门禁绿 + 消费门禁三仓绿 + 三仓 `build:check`/`test` 绿；能力输出是能力导向（非 barrel）；production 无内部化
AST 残留消费；在途波次未被打断；接口/DTO/预算/状态机/持久化兼容未破。

## Current Design Status

- Requirement design status: complete（全量测绘 + 能力输出层深挖落地 + CO-0~6 + 执行序，见 requirement design）。
- User confirmation status: confirmed（核心方向 + 推荐决策 + 不裸断硬序均已确认）。
- Mainline relation status: `after-current`（跨仓内核优化；CO-0 复核在途 Core 波次为硬前置；可与叶子仓清理错峰）。
- Original plan confirmation status: 无独立 original plan；requirement design 承载。
- Code fact status: 真实代码核实（4 簇全量 + ProjectContext/RecipeContext/AST 3 路深挖 + 跨仓 grep 核准 consumer 映射）。
- Needs Wakeflow code research: no（剩 CO-0 复核在途波次终态 + 接口门禁实况）。
- Detached Design mode: no。
- Relation to Wakeflow current mainline: Core 多在途波次（CCR/RIC/GMAP/MTC/D25/CO3/SD-5）正推进——CO-0 复核终态、划清边界为硬前置。

## Recommended Next Step

create controller state root or task package —— intake 后建状态根，按 CO-0~6 推进（CO-0 在途波次复核 + 门禁实况为硬前置）。
（仅供 Wakeflow review，非执行窗口提示词。）

## Functional Loop Summary

- User scenario: 主体/Plugin/Agent 经 `@alembic/core/*` 子路径消费内核能力（知识/搜索/向量/guard/项目上下文/AST 等）。
- Input/Output: 优化对象是**对外接口形态**（能力导向输出 vs 散乱底层接口），不改业务行为/DTO 语义。
- State change: 公共 export 表面收敛 + 底层接口内部化；consumer import 迁移到能力 facade。
- Producer/Consumer: Core=内核 producer；主体/Plugin/Agent=consumer（经消费门禁守护、960 引用）。
- Failure path: 先替代/能力输出（与旧并存）→ 迁移 → 内部化；任一步门禁红即停，不裸断。

## Recommended Repository Coverage

| Window | Recommended Status | Recommended Responsibility | Dependency / Blocker |
| --- | --- | --- | --- |
| AlembicCore | participates | 全部 CO-0~6（建替代/能力输出、内部化、拆巨石、facade 归位、补测试） | CO-0 在途波次硬前置 |
| Alembic | participates | consumer 迁移（enhancement DI 2 点、ProjectContext wrapper、跨仓测试） + 验证 | CO-2 替代就绪后 |
| AlembicPlugin | participates | consumer 迁移（enhancement DI 2 点、recipe-map、跨仓测试 AST grammar） + 验证 | CO-2 替代就绪后 |
| AlembicAgent | observing | core 0 production 消费；仅复核 consumer 门禁绿 | — |
| Design | design-complete | — | — |
| Test | participates | 三仓验收（接口收敛后行为不变 + 门禁绿） | controller 启动 |

## Evidence And Links

- Requirement design（全量测绘 / 公共 API 表面 / 能力输出层深挖落地 / CO-0~6 / 执行序）：
  [requirement design](alembic-core-capability-inventory-optimization-2026-06-19.md)
- Code research: requirement design 各节 + 跨仓 grep（`@alembic/core/core*` production 仅 enhancement 有消费方）。
- User decisions: 本 handoff Confirmed User Goal + requirement design 已决账本。
- Related: 主体净化 `alembic-main-capability-inventory-cleanup-2026-06-19`、Plugin daemon-removal
  `alembic-plugin-daemon-removal-runtime-core-sync-2026-06-18`（同四仓净化系列；Core 优化是其消费基座）。

## Risks

- **在途波次重叠**：CCR/RIC/GMAP/MTC/D25/CO3/SD-5 正推进 → CO-0 硬前置复核终态，避免重复/冲突。
- **跨仓裸断风险**：内部化底层接口前 consumer 必须先迁完 → 严守"先替代→迁移→内部化"+ 每删项跨仓 grep + 消费门禁。
- **接口门禁疑失效**：`lint:public-api-boundary`/`smoke:public-api` 疑 path-error → CO-0 复核，失效则 CO-1 先修（收口无守护即危险）。
- **RecipeContext 4 个无 consumer kind**（detail/search/prime/relations）：未来能力 vs 死设计待定。
- **能力输出≠barrel**：须做真正能力整理（识别能力、设计输出、删散乱接口），不得退化为接口打包。

## Non-Goals And Forbidden Shortcuts

- 不把宿主能力放进 Core；不空壳化/不删外层仍消费的能力（daemon 契约、ProjectScope、19 stable 导出、migrations）；
- 不破坏 exports/DTO/排序/预算/状态机/错误语义/持久化兼容；不与在途波次重复/冲突；
- 不做删码式大清理（本需求是接口能力整理 + 局部优化）；不裸断 consumer（先替代再迁再内部化）；
- 能力输出不得退化为纯粹接口打包（barrel）。

## Phase Candidates

| Phase | Goal | Upstream / Downstream | Completion Signal |
| --- | --- | --- | --- |
| CO-0 | 盘点 + 前置核验（在途波次终态复核硬前置、接口门禁实况、consumer 映射、RecipeContext 4 kind 去留） | → 全部 | 前置结论齐 |
| CO-1 | 修接口门禁 + 移 `./core/capability`（0 production 消费） | CO-0 后 | 门禁绿、capability 移除无影响 |
| CO-2 | 建替代能力 + per-module 能力输出（与旧并存、不删旧）：enhancement facade / test-fixture facade / ProjectContextCapabilities / RecipeContext 干净 facade | CO-1 后 | 新输出就绪、旧导出未动 |
| CO-3 | consumer 迁移（主体+Plugin DI/wrapper/recipe-map/跨仓测试 → 新输出） | CO-2 后（硬序） | 消费门禁 + 三仓 build/test 绿、无人用旧导出 |
| CO-4 | 内部化收口（删旧）：handler/ports/ast/analysis/discovery/capability/enhancement 内实现 → ./internal、删 `./core/*` 深导出、wildcard→exact、关 barrel | CO-3 后（硬序，不裸断） | production 无内部化 AST 残留、门禁绿 |
| CO-5 | 内部优化（CO-0 后可并行）：拆 project-intelligence 35k 巨石、清 knowledge deprecated、facade 归位、补测试 | 并行 | 巨石拆分、测试补齐 |
| CO-6 | 验收 | 末 | 见完成定义 |

执行序：**CO-0 → CO-1 → CO-2 → CO-3 → CO-4 →（CO-5 并行）→ CO-6**。硬序 CO-2→3→4（先替代→迁移→内部化、不裸断）。Phase 为候选，非 task package。

## Open Questions For Wakeflow

1. 在途波次（CCR/RIC/GMAP/MTC/D25/CO3/SD-5）各自完成度——CO-0 复核，划清本需求边界。
2. `lint:public-api-boundary`/`smoke:public-api` 是否真 path-error 失效（修复优先级最高）。
3. RecipeContext detail/search/prime/relations 4 个无 consumer kind：未来能力保留 vs 删。
4. facade 归位 quality/bootstrap/panorama 跨仓消费实况（定 sub-path vs 下沉）。

## Pre-Handoff Checklist

- Checked `docs/workspace-alignment-checklist.md`: 是（Design 边界内，无源码改动 / 派发 / 状态写）。
- This handoff does not include copyable implementation-window prompts: 是。
- Phases remain candidates, not task packages: 是。
- TODO / Backlog candidates listed in Evidence And Links: 无新 TODO；优化在原始需求范围内。
- 删除 / 降级 / 延后 / 边界变更标记确认：是——接口能力整理/内部化底层接口（可见接口变更，consumer 迁移）、capability 移除、
  facade 归位、能力输出非 barrel、不裸断硬序、在途波次硬前置，**均已用户确认**；禁删契约（daemon/stable/migrations）明列非目标。
