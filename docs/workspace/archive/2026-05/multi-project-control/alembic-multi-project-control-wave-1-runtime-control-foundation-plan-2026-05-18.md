# Alembic Multi Project Control Wave 1 Runtime Control Foundation Plan

日期：2026-05-18
状态：阶段 1 已完成，已验收
维护窗口：AlembicWorkspace

## 目标

本波只启动 `Alembic`，先做真实可用的 Project Runtime Control Foundation。目标是让 Alembic 基于现有 Core registry、Ghost resolver、daemon state、DaemonSupervisor 和 JobStore 形成可运行的多项目 summary / inspect / selected state 基础，而不是先让 Core / Plugin / Dashboard 猜字段。

本波不做完整切换 UI，不做 Plugin mismatch，不做 Dashboard 项目列表，不做 Core contract 下沉；这些都等待 Alembic 第一生产方给出可验证字段和 scope 模型。

## 上游依据

- 目标阶段确认：[alembic-multi-project-control-redesign-goal-stage-confirmation-2026-05-18.md](alembic-multi-project-control-redesign-goal-stage-confirmation-2026-05-18.md)
- 需求设计：[../requirement-designs/alembic-multi-project-control-redesign/requirement-design-2026-05-18.md](../../../../requirement-designs/alembic-multi-project-control-redesign/requirement-design-2026-05-18.md)
- 代码实现依赖调研：[../requirement-designs/alembic-multi-project-control-redesign/code-implementation-dependency-research-2026-05-18.md](../../../../requirement-designs/alembic-multi-project-control-redesign/code-implementation-dependency-research-2026-05-18.md)
- Alembic 执行回填文档：[../Alembic/alembic-multi-project-control-wave-1-runtime-control-foundation-2026-05-18.md](../../../../Alembic/alembic-multi-project-control-wave-1-runtime-control-foundation-2026-05-18.md)

## 窗口分派

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>已完成 | 已完成 Wave 1 并通过总控功能完整性验收。 |
| `AlembicCore`<br>阻塞 | 等待 Wave 2 执行计划启动后沉淀 Core contract；当前不在本计划发送。 |
| `AlembicPlugin`<br>阻塞 | 等待 Alembic projects API / selected state contract 后再处理 hostProject mismatch；当前不发送。 |
| `AlembicDashboard`<br>阻塞 | 等待 Alembic projects API / handoff 字段后再做项目列表和切换；当前不发送。 |
| `AlembicAgent`<br>观察中 | 当前无执行任务；只在 Alembic 发现 internal AI projectRoot / dataRoot 隔离缺口时参与。 |
| `BiliDili`<br>无任务 | 当前不做真实项目 smoke。 |

## Alembic 执行要求

范围：

- 读取 `Alembic/AGENTS.md`、目标阶段确认文档、需求设计和代码实现依赖调研。
- 在 `Alembic` 仓库内实现真实 Project Runtime Control Foundation。
- 优先复用 `ProjectRegistry.list()`、`ProjectRegistry.inspect()`、`WorkspaceResolver.fromProject()`、`resolveDaemonPaths(projectRoot)`、`DaemonSupervisor.status()`、`readDaemonState()`、`JobStore` 等现有能力。
- 新增或调整 Alembic 内部 service / CLI / HTTP API 时，先保证 read-only list / inspect / status-all 可用；如果实现 selected / active state，必须写清持久化位置和兼容策略。
- 聚合的 runtime scope 至少要能表达 projectRoot、projectRealpath、projectId、mode、ghost、dataRoot、runtimeDir、databasePath、workspaceExists、daemon status、dashboardUrl、jobsDir 或 jobs summary、file monitor capability、internal AI availability。
- 明确区分 registry project、selected project、active runtime project 和 Plugin host project；本波不需要实现 Plugin hostProject mismatch，但不能把它们混成同一个概念。

禁止事项：

- 不允许在同一个 `ServiceContainer` 进程内重绑 projectRoot。
- 不允许先改 Core public contract 让下游猜字段。
- 不允许新增 Plugin / Dashboard 任务或复制临时类型到其它仓库。
- 不允许把 `ghost list` 当作最终产品入口；可以复用现有 ghost 能力，但本波要形成 `projects` control plane 起点。
- 不允许自动删除 missing / moved / unavailable 项目。
- 不允许复用旧项目 JobStore、file monitor、internal AI runtime、tool context 或 terminal sandbox 作为目标项目状态。

建议实现顺序：

1. 建立 Alembic 内部 project runtime target / summary / scope 模型，先 repo-local，不下沉 Core。
2. 实现 projects list / inspect / status-all service，覆盖 ready / stopped / stale / missing / unavailable。
3. 增加最小 CLI 或 HTTP API 入口，让总控和后续 Dashboard / Plugin 可以消费真实结果。
4. 如果 selected / active state 落地，提供显式 select / current / clear 或等价能力，并记录不会影响 per-project dataRoot。
5. 补 focused tests 或 smoke，证明 summary 来自真实 resolver / daemon status，不是静态假数据。

验证命令：

```bash
npm run build:check
npm run test -- --runInBand
```

如果 Alembic 仓库没有这些命令或命令名称不同，以 `Alembic/package.json` 和 `Alembic/AGENTS.md` 为准选择等价 focused build / test / smoke，并在回填里说明。

文档动作：

- 新建 / 更新：`docs/Alembic/alembic-multi-project-control-wave-1-runtime-control-foundation-2026-05-18.md`
- 保存位置：workspace 顶层 `docs/Alembic/`
- 挂载入口：本文档“上游依据”与“回填区”
- 回填位置：Alembic 执行回填文档 + 本文档“回填区”

回填必须包含：

- 完成范围
- 关键文件 / 模块变化
- 提交 hash
- 验证命令和结果
- 未完成项 / 风险
- 建议 Core contract 下沉字段
- 是否发现 Plugin / Dashboard / Agent 必须提前参与的真实阻塞

## 验收重点

- Alembic 是否真的基于 Core registry / resolver / daemon state 聚合项目状态。
- 是否遵守同进程不切项目的边界。
- 是否避免 Core 空 contract 和下游提前消费。
- selected / active state 是否独立于 per-project dataRoot，且不会污染任一项目。
- jobs、file monitor、internal AI 和 Dashboard handoff 是否被纳入 scope 设计。
- 功能完整性检查：必须能通过真实 CLI 或 HTTP API 入口查看真实 registry 项目 summary / inspect / status-all；summary 必须来自真实 resolver / daemon state / workspace facts，而不是静态数据或只改类型；如果只有 service 雏形但没有用户或下游可调用入口，不能验收为完成。
- 如果 Alembic 只做了最小连接或内部类型雏形，必须补一轮非最小完整实现：补齐 CLI / HTTP 真实入口、真实 registry / daemon 数据、状态变化、可执行验证和后续消费字段后，再允许 Core / Plugin / Dashboard 进入下游。

## 可复制提示词

发送给：无

```text
读取 docs/workspace/alembic-multi-project-control-wave-1-runtime-control-foundation-plan-2026-05-18.md，按照文档，领取并完成分配给你所在窗口的任务；完成后回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。
```

不发送给：`Alembic`（已完成）、`AlembicCore`（阻塞）、`AlembicPlugin`（阻塞）、`AlembicDashboard`（阻塞）、`AlembicAgent`（观察中）、`BiliDili`（无任务）。

## 回填区

### Alembic

- 状态：已完成
- 执行文档：[../Alembic/alembic-multi-project-control-wave-1-runtime-control-foundation-2026-05-18.md](../../../../Alembic/alembic-multi-project-control-wave-1-runtime-control-foundation-2026-05-18.md)
- 完成范围：
  - 新增 `ProjectRuntimeControl` repo-local foundation，基于 Core registry / resolver、daemon paths、Alembic `DaemonSupervisor.status()`、daemon health、job files 和 workspace AI settings 聚合真实 project runtime scope summary。
  - 新增 `/api/v1/projects` HTTP route，覆盖 list / status-all / current / inspect / select / clear selected state。
  - 新增 `alembic projects list/status/inspect/current/select/clear` CLI 命令组，作为 `ghost list` 之外的多项目 control plane 起点。
  - selected state 持久化到全局 registry 目录 `runtime-control.json`，不写入任一项目 dataRoot；active runtime project 从 selected project 的真实 daemon ready 状态派生。
- 提交 hash：`5802057e99e87a6b3fc0282fc59bfc7eb0bfd175`
- 验证命令：
  - `npm run build:check`
  - `npm run test -- test/unit/ProjectRuntimeControl.test.ts test/unit/DaemonSupervisor.test.ts test/unit/JobStore.test.ts`
  - `npm run test:unit -- test/unit/ProjectRuntimeControl.test.ts test/unit/DaemonSupervisor.test.ts test/unit/JobStore.test.ts`
  - `npm run lint:consumer-core-imports`
  - `npx biome check --diagnostic-level=error lib/daemon/ProjectRuntimeControl.ts lib/http/routes/projects.ts lib/http/HttpServer.ts bin/cli.ts test/unit/ProjectRuntimeControl.test.ts`
  - `git -C Alembic diff --check`
  - `git -C Alembic diff --check HEAD~1..HEAD`
- 验证结果：
  - `npm run build:check`：通过。
  - `npm run test -- test/unit/ProjectRuntimeControl.test.ts test/unit/DaemonSupervisor.test.ts test/unit/JobStore.test.ts`：通过，3 个测试文件、12 个测试通过。
  - `npm run test:unit -- test/unit/ProjectRuntimeControl.test.ts test/unit/DaemonSupervisor.test.ts test/unit/JobStore.test.ts`：通过，3 个测试文件、12 个测试通过。
  - `npm run lint:consumer-core-imports`：通过，扫描 419 个文件、562 个 `@alembic/core` imports。
  - `npx biome check --diagnostic-level=error ...`：通过。
  - `git -C Alembic diff --check`：通过。
  - `git -C Alembic diff --check HEAD~1..HEAD`：通过。
- 遗留风险：
  - 本波不实现 start / stop / open-dashboard / switch orchestration；`select` 只更新全局 selected state，不启动或停止 daemon。
  - active runtime project 当前为 derived state：只有 selected project 的真实 daemon ready 时才标记 active。
  - jobs summary 为只读文件扫描，避免 status-all 为缺失项目创建 job 目录；后续 job 控制必须在目标项目 runtime scope 内显式执行。
- 建议下一步：
  - 总控先验收 Alembic fields / scope 模型；通过后可启动 AlembicCore 沉淀 `ProjectRuntimeTarget`、`ProjectConnectionState`、`ProjectRuntimeScopeSummary`、`ProjectRuntimeControlState`。
  - 下一波 Alembic 可补 start / stop / open-dashboard / handoff 编排，并保持“不在同一 ServiceContainer 内切项目”的边界。
  - Plugin / Dashboard 继续等待 Core contract 或 Alembic API 稳定；当前未发现 Agent 需要提前介入的 internal AI 隔离缺口。

### 总控验收

- 状态：已通过
- 验收时间：2026-05-19
- 验收结论：通过；未发现最小实现，功能完整性检查通过。总控补跑 `build:check`、focused tests、core import lint、`npm run build` 和临时 `ALEMBIC_HOME` CLI smoke 均通过。
- 下一波建议：启动 Wave 2 `AlembicCore` contract sedimentation。
