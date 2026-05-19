# Alembic Multi Project Control Wave 2 Core Contract Sedimentation Plan

日期：2026-05-19
状态：阶段 2 已验收，Wave 3 Alembic 待启动
维护窗口：AlembicWorkspace

## 目标

本波只启动 `AlembicCore`，把 Alembic Wave 1 已验证的 project runtime control 字段沉淀为 Core public contract。目标是让后续 `Alembic`、`AlembicPlugin`、`AlembicDashboard` 消费同一套稳定类型和 helpers，避免复制临时字段。

本波不是重新实现 Alembic runtime control service，也不是让 Core 接管 daemon / HTTP / CLI / Dashboard / Plugin。Core 只沉淀真实实现已经证明需要的 contract。

## 上游依据

- Wave 1 执行计划：[alembic-multi-project-control-wave-1-runtime-control-foundation-plan-2026-05-18.md](alembic-multi-project-control-wave-1-runtime-control-foundation-plan-2026-05-18.md)
- Alembic Wave 1 回填：[../Alembic/alembic-multi-project-control-wave-1-runtime-control-foundation-2026-05-18.md](../../../../Alembic/alembic-multi-project-control-wave-1-runtime-control-foundation-2026-05-18.md)
- 目标阶段确认：[alembic-multi-project-control-redesign-goal-stage-confirmation-2026-05-18.md](alembic-multi-project-control-redesign-goal-stage-confirmation-2026-05-18.md)
- 代码实现依赖调研：[../requirement-designs/alembic-multi-project-control-redesign/code-implementation-dependency-research-2026-05-18.md](../../../../requirement-designs/alembic-multi-project-control-redesign/code-implementation-dependency-research-2026-05-18.md)
- AlembicCore 执行回填文档：[../AlembicCore/alembic-multi-project-control-wave-2-core-contract-sedimentation-2026-05-19.md](../../../../AlembicCore/alembic-multi-project-control-wave-2-core-contract-sedimentation-2026-05-19.md)

## 窗口分派

| 窗口 / 状态 | 任务 |
| --- | --- |
| `AlembicCore`<br>已完成 | 已沉淀 Wave 1 已验证 project runtime contracts，提交 `ab5e332843d6da89c3def6bf33631e0397552566`；public exports、tests 和 public API smoke 已更新。 |
| `Alembic`<br>Wave 3 待启动 | 下一波独立计划中消费 Core project runtime contracts，替换本地重复类型，并补齐 start / stop / open-dashboard / switch orchestration。 |
| `AlembicPlugin`<br>阻塞 | 等待 Alembic 消费 Core contract 并稳定 projects API 后处理 hostProject mismatch。 |
| `AlembicDashboard`<br>阻塞 | 等待 Alembic 消费 Core contract 并稳定 projects API 后做项目列表和 handoff UI。 |
| `AlembicAgent`<br>观察中 | 当前无执行任务；Wave 1 未发现 internal AI 隔离缺口。 |
| `BiliDili`<br>无任务 | 当前不做真实项目 smoke。 |

## AlembicCore 执行要求

范围：

- 读取 `AlembicCore/AGENTS.md`、本文档、Wave 1 Alembic 回填、Alembic `lib/daemon/ProjectRuntimeControl.ts` 的真实字段。
- 在 Core 中新增或扩展合适的 public contract 模块。命名可由 Core 窗口按现有结构决定，但必须通过 package public export 暴露，供 Alembic / Plugin / Dashboard 后续消费。
- 合同字段必须来自 Wave 1 已验证实现，优先覆盖：
  - `ProjectRuntimeTarget`
  - `ProjectConnectionState`
  - `ProjectRuntimeControlState`
  - `ProjectRuntimeJobsSummary`
  - `ProjectRuntimeFileMonitorSummary`
  - `ProjectRuntimeInternalAiSummary`
  - `ProjectRuntimeDaemonSummary`
  - `ProjectRuntimeScopeSummary`
  - `ProjectRuntimeControlSnapshot`
  - 后续 `ProjectHandoffMismatch` 所需的最小稳定基础字段，如 selected / active project identity。
- 如需新增 helper / constants / type guards，只能服务真实消费，例如 connection state 枚举、summary shape 校验、target 判定；不要创建无调用方的空 helper。
- 保持 registry v1 兼容。不要破坏 `ProjectRegistry`、`WorkspaceResolver`、daemon state、JobStore 现有行为。

禁止事项：

- 不允许把 Alembic 的 runtime control service、HTTP route、CLI、DaemonSupervisor orchestration 搬进 Core。
- 不允许先扩展过多未来字段；没有 Wave 1 证据或 Wave 3 消费路径的字段不要下沉。
- 不允许改 registry schema 为强制新字段，避免旧 `projects.json` 失效。
- 不允许只新增类型但不更新 public export / public API smoke / tests。
- 不允许让 AlembicPlugin 或 Dashboard 先猜 contract。

建议实现顺序：

1. 对照 Alembic `ProjectRuntimeControl.ts` 的 exported interfaces，建立 Core public contract 文件。
2. 更新 Core package exports / barrel exports，保持现有 public API 边界。
3. 增加 focused tests，验证 contract exports、connection states、target shape 或 type guard。
4. 运行 public API smoke 和 boundary scripts。
5. 回填建议 Alembic 下一波应替换的本地类型清单。

验证命令：

```bash
npm run build:check
npm run smoke:public-api
npm run lint:public-api-boundary
npm run test
npm run lint
```

如果 Core 窗口认为全量 `npm run check` 更合适，可以运行：

```bash
npm run check
```

文档动作：

- 新建 / 更新：`docs/AlembicCore/alembic-multi-project-control-wave-2-core-contract-sedimentation-2026-05-19.md`
- 保存位置：workspace 顶层 `docs/AlembicCore/`
- 挂载入口：本文档“上游依据”与“回填区”
- 回填位置：AlembicCore 执行回填文档 + 本文档“回填区”

回填必须包含：

- 完成范围
- 新增 / 更新 public exports
- 与 Alembic Wave 1 字段的对应关系
- 提交 hash
- 验证命令和结果
- 未完成项 / 风险
- Alembic 下一波替换本地类型的建议

## 验收重点

- Core contract 是否只沉淀 Alembic Wave 1 已验证字段。
- 是否通过 public export 暴露，后续 Alembic / Plugin / Dashboard 能稳定消费。
- 是否有 public API smoke / boundary / build / tests 证据。
- 是否保持 registry v1 兼容。
- 功能完整性检查：本波虽然主要是 contract，但必须有真实上游证据和明确下游消费路径；如果只是新增未导出的类型、无测试、无消费映射或无 export smoke，视为最小实现，必须补一轮非最小完整实现。

## 可复制提示词

本波验收已完成，不再发送本文档。下一步发送 Wave 3 独立计划。

```text
读取 docs/workspace/alembic-multi-project-control-wave-3-alembic-consumer-switch-orchestration-plan-2026-05-19.md，按照文档，领取并完成分配给你所在窗口的任务；完成后回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。
```

发送给：`Alembic`。不发送给：`AlembicCore`（已完成）、`AlembicPlugin`（阻塞）、`AlembicDashboard`（阻塞）、`AlembicAgent`（观察中）、`BiliDili`（无任务）。

## 回填区

### AlembicCore

- 状态：已完成
- 执行文档：[../AlembicCore/alembic-multi-project-control-wave-2-core-contract-sedimentation-2026-05-19.md](../../../../AlembicCore/alembic-multi-project-control-wave-2-core-contract-sedimentation-2026-05-19.md)
- 完成范围：新增 `src/daemon/ProjectRuntimeContracts.ts`，沉淀 Alembic Wave 1 已验证的 project runtime target、connection state、control state、jobs / file monitor / internal AI / daemon / scope / snapshot contracts；更新 `src/daemon/index.ts`、public API smoke 和 focused tests。
- 提交 hash：`ab5e332843d6da89c3def6bf33631e0397552566`
- 验证命令：
  - `npm run build:check`
  - `npm run test -- test/ProjectRuntimeContracts.test.ts test/PublicFoundationEntrypoints.test.ts test/RuntimeContracts.test.ts`
  - `npm run build`
  - `npm run check`
  - `npm run smoke:public-api`
  - `git diff --check`
- 验证结果：
  - `npm run build:check`：通过。
  - 目标测试：通过，3 个测试文件、16 个测试通过。
  - `npm run build`：通过。
  - `npm run check`：通过；public API boundary、全量 Vitest 和 Biome lint 均通过。全量 Vitest 63 个测试文件、933 个测试通过；输出一行既有 `error: Could not access 'HEAD'`，但退出码为 0。
  - `npm run smoke:public-api`：通过，75 个 exact public API entrypoints 成功导入。
  - `git diff --check`：通过。
- 遗留风险：Core 不接管 Alembic runtime control service、HTTP route、CLI 或 DaemonSupervisor orchestration；`ProjectRuntimeTarget` 已收紧为 `projectId` / `projectRoot` 二选一，Alembic 消费时需要先归一化 route / CLI 输入。
- 建议下一步：启动 `Alembic` 窗口消费 Core contract，替换 `lib/daemon/ProjectRuntimeControl.ts` 中本地重复类型与 state schema 常量；Plugin / Dashboard 继续等待 Alembic projects API 稳定。

### Alembic

- 状态：待启动
- 前置条件：Core contract 已完成，提交 `ab5e332843d6da89c3def6bf33631e0397552566` 可用。
- 建议任务：消费 `@alembic/core/daemon` project runtime contracts，替换本地重复类型和 `STATE_SCHEMA_VERSION`；保留 Alembic service / route / CLI / orchestration。
- 建议验证：`npm run build:check`、`npm run test -- test/unit/ProjectRuntimeControl.test.ts test/unit/DaemonSupervisor.test.ts test/unit/JobStore.test.ts`、`npm run lint:consumer-core-imports`、projects CLI smoke。

### 总控验收

- 状态：已通过
- 验收时间：2026-05-19
- 验收结论：
  - 通过。Core 已把 Alembic Wave 1 已验证的 project runtime contracts 下沉到 `@alembic/core/daemon`，并保留 Core 只做 public contract 的边界。
  - 功能完整性检查通过：新增 contract 不是孤立类型，已具备 public barrel、runtime constants / helper、focused tests、public entrypoint test 和 public API smoke。
  - 总控补跑验证：`npm run check`、`npm run smoke:public-api`、`git diff --check` 均通过。
- 下一波建议：
  - 新建并启动 Wave 3 `Alembic` consumer + switch orchestration 计划；Plugin / Dashboard 继续阻塞，等待 Alembic projects API 和 handoff 字段稳定。
