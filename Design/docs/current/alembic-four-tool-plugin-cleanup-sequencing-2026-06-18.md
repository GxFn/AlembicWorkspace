# Alembic 四工具与 Plugin 清理统一推进编排

Status: Design 编排（2026-06-18）/ 整合 4 个需求的阶段为通顺执行序列 / 供控制器 intake 分组与排期 / 不派发
Date: 2026-06-18
Design Key: alembic-four-tool-plugin-cleanup-sequencing-2026-06-18

## 目的

Plugin 域现有 4 个相互交织的需求，阶段间有真实依赖、共享环与阻断前置。本文件把它们排成
一条**依赖驱动、无倒置、共享环只做一次**的执行序列，保证各阶段执行通顺。这是编排建议，
控制器据此 intake、分组、定 wave；本文件不派发、不定 TODO。

## 纳入的 4 个需求与阶段

| 代号 | 需求（Design Key）| 阶段 |
|---|---|---|
| **GMAP** | 四工具 + ProjectContext/RecipeContext 拆分（`alembic-map-recipe-mounting-...-2026-06-17`）| GMAP-0~9（地基）|
| **MTC** | Plugin MCP 工具清理整合（`alembic-plugin-mcp-tool-cleanup-consolidation-2026-06-18`）| MTC-0~8 |
| **RIC** | Plugin/Core 接口职责清理（`alembic-plugin-core-responsibility-interface-cleanup-2026-06-17`）| RIC-0~7 |
| **DRR/CCR** | 决策寄存器与 Guard 报告跨仓下线（`alembic-decision-register-guard-report-retirement-2026-06-18`）| DRR-0~3 / CCR-0~3 |

## 核心依赖铁链（执行通顺的约束）

1. **GMAP-2（Core RecipeContext 公共门面）→ RIC-2（检索下沉）**：RIC-2 必须等 RecipeContext 落地。
2. **GMAP-8（prime 解耦 intent）→ MTC-2（删 alembic_intent）**：prime `resolvePrimeContext`
   现依赖 alembic_intent（map 需求 :1933），必须先解耦，否则删 intent 工具会断 prime。
3. **跨仓三层序（先消费者→入口→实现）**：DRR-1/CCR-1（消费者）→ MTC-2 / MTC-7C8（= DRR-2/CCR-2
   Plugin 入口，共享）→ DRR-3/CCR-3（实现）。禁止倒置。
4. **CCR-0（证 code_guard check 不依赖 Core analyzer）→ CCR-3（删 Core analyzer）**：未证清不得删实现。
5. **DRR-1（删 prime 的 decision 注入 section）与 GMAP-8（prime 解耦 intent）同改 prime**：相邻安排，
   由 Alembic 窗口连续做，避免两次进出 PrimeInjectionPackage。
6. **共享环只做一次**：MTC-2 = DRR-2 的 decision Plugin 环；MTC-7C8 = CCR-2 的 coverage Plugin 环。
   控制器把这两步在两需求账上各记一次，但只执行一次。
7. **MTC-1（删 Plugin 退役死代码）与 RIC-7（Plugin 复制残留）边界协调**：两者同动 Plugin 死代码，
   intake 时切分谁删哪些，避免重复/冲突。

## 全局执行序列（P0~P9，依赖驱动）

### P0 — 盘点冻结（全并行，只读）
- GMAP-0 基线 ∥ MTC-0 盘点 ∥ RIC-0 盘点冻结 + RIC-1 charter ∥ DRR-0 + **CCR-0 大坑验证**
  （证 code_guard 是否依赖 CoverageAnalyzer/ComplianceReporter）。
- 产出各基线 + 命名映射 + 确认前置；CCR-0 结论决定 CCR-3 是否可全删。

### P1 — Core 地基（GMAP 主线，解锁下游）
- GMAP-1 Graph→ProjectContext → GMAP-2 **Core RecipeContext 公共门面** → GMAP-3 共享 Region Builder。
- 出口解锁：RIC-2（依赖 GMAP-2）。

### P2 — 纯 Plugin 死代码清理（无 Core 依赖，与 P1 并行）
- MTC-1 删退役（panorama/task/**source-graph 整目录**/死路由/project_matrix 残留）
  ∥ RIC-7 Plugin 复制残留 + 嵌入式 daemon 瘦身（**按铁链 7 切分边界**）。

### P3 — 四工具收敛与解耦（GMAP）
- GMAP-4/5/6/7 Recipe Map + Mounting → GMAP-8 移除中间层 + 四工具独立（**prime 解耦 intent**）。
- 出口解锁：MTC-2（依赖 GMAP-8）。

### P4 — 跨仓消费者层（先消费者，铁链 3）
- DRR-1 删 decisionRegister 消费者（Dashboard 视图 + **prime decision section** + IntentEvidence；
  与 GMAP-8 同改 prime，铁链 5 相邻做）
  ∥ CCR-1 删 coverage/compliance 消费者（Dashboard 覆盖率 + Alembic guardReport HTTP）。

### P5 — Plugin 入口环（共享，只做一次，铁链 6）
- MTC-2 删 alembic_intent + alembic_decision_record（= DRR-2 decision Plugin 环；
  前置 GMAP-8 + DRR-1 完成）
  ∥ MTC-7 C8 下线 Plugin guard coverage/compliance（= CCR-2 Plugin 环；前置 CCR-1）。

### P6 — MCP 表面整合（MTC 其余）
- MTC-3 graph 唯一入口 → MTC-4 状态合一（跨 server gate OR）→ MTC-5 去 codex + CodexMcpServer→
  HostMcpServer → MTC-6 去 mcp → MTC-7 其余合并（job/stop-cleanup/work/guard check 并 code_guard）。

### P7 — cleanup 职责下沉（RIC，依赖 P1）
- RIC-2 检索下沉 RecipeContext（依赖 GMAP-2 ✓）→ RIC-3 删 resident（连通前置 routes/task·skills·
  candidates）→ RIC-4 知识/治理 HTTP 边界 → RIC-5 Core 共享骨架 + 两执行路线归位。

### P8 — 跨仓实现层删除（最后删实现，铁链 3/4）
- DRR-3 删 decisionRegister 实现（Alembic DecisionRegisterStore + DI + schema）
  ∥ CCR-3 删 coverage/compliance 实现（Core CoverageAnalyzer/ComplianceReporter；**前置 CCR-0 证清**）。

### P9 — 统一验收
- GMAP-9 测试运行时证明 + MTC-8 双壳 parity 重建 + RIC-6 验收 + RR-DONE 跨仓验收；各仓 build/check 绿。

## 并行与关键路径

- **关键路径**：P0 → P1（GMAP-2）→ P3（GMAP-8）→ P5（Plugin 入口环）→ P8（实现删除）→ P9。
- **可并行**：P2（纯 Plugin 死代码）与 P1 并行；P4 两条消费者线并行；P6 MCP 表面整合可在 P5 后与
  P7 部分并行（不同文件域）。
- **最易卡点**：GMAP-2（解锁 RIC-2）、GMAP-8（解锁 MTC-2）、CCR-0（解锁 CCR-3）——这三个是下游多阶段
  的闸门，优先推进。

## 阻断前置清单（未满足不得进对应阶段）

| 阶段 | 阻断前置 |
|---|---|
| RIC-2 | GMAP-2 RecipeContext 公共门面已落地 |
| MTC-2 | GMAP-8 prime 已解耦 intent + DRR-1 prime decision section 已删 |
| MTC-7C8 / CCR-2 | CCR-1 coverage 消费者已删 |
| CCR-3 | CCR-0 已证 code_guard check 不依赖 Core analyzer |
| DRR-3 / CCR-3 | 对应消费者（P4）+ 入口（P5）已删完 |
| RIC-3 删 resident | routes/task·skills·candidates 已改调 Service/RecipeContext |

## 给控制器的 intake 建议

- 把 4 个需求并入一个**推进组**，按 P0~P9 排 wave；共享环（P5）在组级只排一次，结果回填两需求账。
- 每个 Phase 出 wave 前确认其阻断前置（上表）已满足；P0 的 CCR-0 结论先回报，决定 P8 的 CCR-3 范围。
- 跨仓阶段（P4/P8）涉及 Alembic/Core/Dashboard，按各窗口归属派发、各自提交；Plugin 入口环（P5）由
  Plugin 窗口执行。
- 本文件是编排，不替代各需求的任务级确认；每个 wave 仍按各需求的 confirmation gate 走。
