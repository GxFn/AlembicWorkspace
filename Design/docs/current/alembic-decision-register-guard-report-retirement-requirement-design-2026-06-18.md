# 决策寄存器与 Guard 覆盖/合规报告跨仓能力下线需求设计

Status: Design 草案（真实代码核实版 2026-06-18）/ 用户 C9=B 已定（彻底逐仓下线）/ 待控制器 intake 与 phase-0 连通复核
Date: 2026-06-18
Design Key: alembic-decision-register-guard-report-retirement-2026-06-18
Primary Windows: AlembicPlugin / Alembic / AlembicCore / AlembicDashboard（跨 4 仓协调下线）

## 背景与动机

在 MCP 工具清理需求（`alembic-plugin-mcp-tool-cleanup-consolidation-2026-06-18`）的
C9 确认中，用户裁决 **B：彻底逐仓下线**两条能力——**决策寄存器**（decisionRegister）
与 **Guard 覆盖/合规报告**（coverage_matrix / compliance_report）。这两条能力的 Plugin
MCP 入口只是"皮"，真正实现与消费分布在 Alembic / Core / Dashboard。本需求把这个跨仓
能力下线结构化为分阶段、按仓、先消费者后实现的可恢复流程；MCP 清理需求只负责其 Plugin
MCP 表面那一环，本需求负责其余三仓 + 协调顺序。

这是**产品能力下线**（非死代码清理）：用户已知情接受放弃 prime 决策注入元数据、Alembic
两组 HTTP API、Dashboard 决策/覆盖率视图、Core 两个 analyzer。

## 真实代码全景（2026-06-18 实扫，带锚点）

### 能力 A：决策寄存器 decisionRegister

| 层 | 仓 | 真实位置 |
|---|---|---|
| 入口（MCP）| Plugin | `alembic_decision_record` 工具 + resident client + DI + `public-tools/contract` |
| 入口（HTTP）| Alembic | `lib/http/routes/decision-register.ts`（GET `/capability`、POST `/`、GET `/`）+ `HttpServer` 挂载 + `routes/daemon.ts` + `provider-contracts.ts` |
| 实现 | Alembic | `lib/service/task/DecisionRegisterStore.ts` + `ServiceMap`/`InfraModule` DI + `shared/schemas/http-requests.ts` |
| 消费 | Alembic | **`lib/service/task/PrimeInjectionPackage.ts:207/239`**（`buildDecisionRegisterMeta`，进入 prime 输出 + `retrievalQuality` 计算）、`IntentEvidence.ts` |
| 消费 | Dashboard | `src/api.ts:88/165-171`（`decision-register` surface + `decisionRegisterData` projector）+ `Alembic/lib/generated/dashboard-api-types.ts` |

### 能力 B：Guard 覆盖/合规报告 coverage/compliance

| 层 | 仓 | 真实位置 |
|---|---|---|
| 入口（MCP）| Plugin | `alembic_guard` 的 `coverage_matrix`（`handlers/guard.ts:850`）/ `compliance_report`（:895）+ `GuardModule` DI |
| 入口（HTTP）| Alembic | `lib/http/routes/guardReport.ts`（GET `/api/v1/guard/report` + `/report/coverage`）+ `HttpServer` 挂载 |
| 实现 | Core | `src/service/guard/CoverageAnalyzer.ts`、`ComplianceReporter.ts`、`SourceFileCollector.ts`、`guard/index.ts` 导出 |
| 消费 | Alembic | `GuardModule` / `ServiceMap` DI |
| 消费 | Dashboard | `src/api.ts:4284/4290`（`/panorama/coverage`、modules coverage）|

## 分阶段下线方案（每条能力：先消费者 → 入口 → 实现）

> 顺序铁律（phased-migration）：先删所有**消费者**，再删**入口**，最后删**实现**；
> 每步做 import 扫描 + 全仓 build 绿，禁止跨层一步删。两条能力可并行推进。

### 能力 A — decisionRegister

- **DRR-0 连通复核**：扫全部 decisionRegister 消费者；确认 prime 移除 `decisionRegister`
  字段后 `retrievalQuality` 计算可降级（`PrimeInjectionPackage` 去该输入）；确认 Dashboard
  decision 视图可整体移除。
- **DRR-1 删消费者**：Dashboard `decision-register` surface/projector/api-types；Alembic
  `PrimeInjectionPackage` 的 `buildDecisionRegisterMeta` + `decisionRegister` 字段 +
  `retrievalQuality` 输入 + `IntentEvidence` decision 引用（**prime 降级：去决策检索元数据，
  主体不变**）。
- **DRR-2 删入口**：Plugin `alembic_decision_record`（= MCP 需求 MTC-2 Plugin 环）；Alembic
  `decision-register.ts` HTTP 路由 + `HttpServer` 挂载 + `daemon` route + `provider-contracts`。
- **DRR-3 删实现**：Alembic `DecisionRegisterStore.ts` + `ServiceMap`/`InfraModule` DI +
  `http-requests` schema + `dashboard-api-types` 残留类型。

### 能力 B — coverage/compliance

- **CCR-0 连通复核（关键大坑）**：删 Core `CoverageAnalyzer`/`ComplianceReporter` 前，**必须
  确认 Guard 主流程（保留工具 `alembic_code_guard` 的 check）不依赖这两个 analyzer**——
  `GuardViolationRepository`/`KnowledgeRepositoryImpl` 实扫出现过 coverage 引用，若 check 走
  coverage 数据，删 analyzer 会**断 code_guard**。此为 phase-0 must-verify，未证清不得进 CCR-3。
- **CCR-1 删消费者**：Dashboard 覆盖率展示（`api.ts` `/panorama/coverage`、modules coverage）；
  Alembic `guardReport.ts` HTTP 路由 + `HttpServer` 挂载。
- **CCR-2 删入口**：Plugin `alembic_guard` 的 `coverage_matrix`/`compliance_report`
  （= MCP 需求 MTC-7 C8 Plugin 环）+ schema。
- **CCR-3 删实现**：Core `CoverageAnalyzer`/`ComplianceReporter`/`SourceFileCollector` +
  `guard/index` 导出 + Alembic `GuardModule`/`ServiceMap` DI（仅在 CCR-0 证清后）。

### RR-DONE 验收

- 两条能力在 4 仓无残留 import；prime 仍可用（仅去决策块，主体验证不破）；Dashboard 无断链；
  Alembic 两组 HTTP 路由移除且无 404 引用；Core 两 analyzer 删除且 code_guard 仍绿；
  各仓 build/check/lint 绿；各仓由其窗口提交。

## Producer/Consumer 顺序

DRR-1 → DRR-2 → DRR-3（A）∥ CCR-0 →（CCR-1 → CCR-2）→ CCR-3（B）。Plugin 入口环（DRR-2 /
CCR-2）与 MCP 清理需求共享——由控制器协调两需求的该环只做一次。

## 非目标

- **不动 prime 主体**：只移除其 `decisionRegister` 输出 section 与 retrievalQuality 输入，
  知识选择/注入/sourceRefs 不变；
- **不动 Guard 主体**：保留 `alembic_code_guard` 的 check/review；只下线 coverage/compliance
  报告；若 CCR-0 证明 check 依赖 analyzer，则停止 CCR-3 并回报（能力下线不得波及 check）；
- 不改四工具核心（graph/recipe_map/search/prime 语义）；不引入替代能力（除非确认点裁定）。

## 确认点

- **RR-C1 prime 降级确认**：prime 去决策检索元数据后，是否需要在别处保留决策查询入口，还是
  彻底无（默认彻底无，B 已含此意）。
- **RR-C2 Dashboard 覆盖率替代**：删覆盖率/合规视图后，Dashboard 是否需要替代的质量视图，
  还是直接去掉（默认去掉）。
- **RR-C3 Core analyzer 真实可删**（阻断 CCR-3）：CCR-0 必须证明 code_guard check 不依赖
  `CoverageAnalyzer`/`ComplianceReporter`；若依赖，能力下线范围收缩到"仅去报告入口、保留
  check 所需内部计算"。

## 连通性边界（硬要求）

- 严格先消费者后实现；每步 import 扫描 + build 绿；
- prime / code_guard 是保留能力，下线动作不得破坏其主体——任一步若发现波及，停止并回报；
- 跨仓提交各归其窗口；本需求不把 4 仓改动混成一次不可恢复步骤。

## 与 MCP 清理需求的关系

- `alembic-plugin-mcp-tool-cleanup-consolidation-2026-06-18` 的 MTC-2（decision_record）、
  MTC-7 C8（coverage/compliance）是本需求的 **Plugin 入口环**（DRR-2 / CCR-2）；
- 控制器 intake 时把两需求并入同一推进组，Plugin 入口环只执行一次，避免重复或顺序倒置。

## 总控接收提示候选

```text
接收 Design 需求候选：Design/docs/current/alembic-decision-register-guard-report-retirement-requirement-design-2026-06-18.md
目标：跨 4 仓（Plugin/Alembic/Core/Dashboard）彻底下线两条在用产品能力——决策寄存器 decisionRegister、
Guard 覆盖/合规报告 coverage/compliance（用户 C9=B 已定）。
铁律：每条能力先删消费者→入口→实现，禁止跨层一步删；CCR-0 must-verify「code_guard check 不依赖 Core
analyzer」否则停 CCR-3。非目标：不动 prime/code_guard 主体（prime 只去决策 section）。
顺序：phase-0 连通复核 → DRR-1/CCR-1 删消费者（prime 降级 + Dashboard 视图 + Alembic HTTP）→ DRR-2/CCR-2
删入口（与 MCP 需求共享 Plugin 环，只做一次）→ DRR-3/CCR-3 删实现（Alembic store / Core analyzer）→ 验收。
与 MCP 清理需求并组推进；各仓改动各窗口提交。
```
