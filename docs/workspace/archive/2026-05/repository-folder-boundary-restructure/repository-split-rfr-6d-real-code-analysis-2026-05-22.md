# Repository Split RFR-6D Real Code Analysis

创建日期：2026-05-22
总控窗口：AlembicWorkspace
状态：已完成，建议启动 RFR-6D
上游计划：[repository-folder-boundary-restructure-workspace-plan-2026-05-22.md](repository-folder-boundary-restructure-workspace-plan-2026-05-22.md)

## 结论

RFR-6C 可以通过总控验收。`AlembicPlugin` 已将 HTTP `DashboardOperations` cluster 收敛到 `lib/http/compatibility/operations/`，并保留外部 `dashboard.*` operation id、HTTP route、operation payload、runtime artifact 路径和 channel/cache 行为。保留下来的 `kind: 'dashboard-operation'` 是 fallback manifest payload 兼容语义，不再代表源码目录边界。

下一轮不建议直接处理整个 `service`、整个 `injection` 或整个 `daemon`。基于 RFR-6C 后的真实代码，最小且明确的下一修正点是 `AlembicPlugin/lib/injection/modules/AgentModule.ts`：该文件现在只注册 `SkillHooks`，已经不承载 Agent runtime、AI provider runtime 或 tools runtime，但文件名仍叫 `AgentModule`，容易把 Plugin 误读成仍维护 AlembicAgent 侧实现。

## RFR-6C 验收证据

- `AlembicPlugin` 提交：`a535d16e6974fdcba2b643b64dc24c8315c9b51e`。
- Codex runtime artifact 子仓库提交：`85c8fbdc2a94d86a4f721301c42a3fe618c4da76`。
- `runtime.tgz` SHA-256：`c151d06691c4b631d5b1d249140ca2989300a7c16c935256589e12f4f3513835`。
- 执行记录：[../AlembicPlugin/repository-folder-boundary-rfr-6c-plugin-http-compat-operations-2026-05-22.md](../../../../AlembicPlugin/repository-folder-boundary-rfr-6c-plugin-http-compat-operations-2026-05-22.md)。
- 提交 diff 只重命名旧 `lib/http/dashboard/DashboardOperations.ts` 和 `lib/http/utils/dashboard-operation.ts`，更新 `commands` / `modules` routes，新增 `DashboardCompatibilityOperations` targeted test，并刷新 runtime artifact。
- `rg -n "http/dashboard|DashboardOperations|DASHBOARD_OPERATION|from '../dashboard|from '../../dashboard|../utils/dashboard-operation|executeDashboardOperation|sendDashboardOperationResponse" AlembicPlugin/lib AlembicPlugin/test AlembicPlugin/bin AlembicPlugin/scripts AlembicPlugin/package.json AlembicPlugin/tsconfig.json AlembicPlugin/vitest.config.ts AlembicPlugin/vitest.unit.config.ts AlembicPlugin/plugins/alembic-codex/runtime/dist` 无命中。
- `git -C AlembicPlugin diff --check HEAD^ HEAD` 通过。
- `git -C AlembicPlugin/plugins/alembic-codex status --short --branch` 显示 runtime artifact 子仓库干净。

## RFR-6C 后残留扫描

`Alembic` 与 `AlembicPlugin` 的 `lib` 同相对路径对比仍显示若干大块差异：

| 顶层目录 | common | same | diff | 判断 |
| --- | ---: | ---: | ---: | --- |
| `http` | 37 | 22 | 15 | RFR-6C 已处理 Dashboard compatibility 小 cluster；剩余 routes 需要继续按真实消费方分类，不能整体搬迁。 |
| `service` | 19 | 4 | 15 | 同时含 baseline search、resident search client、module service、wiki fallback、skill hooks、git diff checkpoint，不适合一波整体处理。 |
| `injection` | 10 | 0 | 10 | DI 模块仍是 Plugin runtime wiring，但存在个别旧命名，适合小步收敛。 |
| `external` | 19 | 10 | 9 | MCP surface 是 Codex-facing ownership，暂不做大面积迁移。 |
| `daemon` | 2 | 0 | 2 | 代表 embedded daemon supervision / job runner，后续可单独分类，不在下一波混入。 |

## 下一轮证据

`lib/injection/modules/AgentModule.ts` 的真实代码当前只做一件事：

- 注释写明 `AlembicPlugin no longer registers local agent runtime or terminal execution services`。
- 唯一 import 是 `SkillHooks`。
- `register(c)` 只注册 `skillHooks` singleton，并 best-effort 调用 `hooks.load()`。

真实消费方：

- `lib/injection/ServiceContainer.ts` import `AgentModule` 并在初始化链中调用 `AgentModule.register(this)`。
- `lib/injection/ServiceMap.ts` 的 `skillHooks` 类型仍是真实服务键。
- `lib/service/skills/SkillHooks.ts`、`lib/external/mcp/handlers/skill.ts`、`lib/workflows/capabilities/execution/WorkflowSkillCompletionCapability.ts` 和相关测试继续消费 SkillHooks 能力。

边界判断：

- 这是 Plugin Codex 自洽闭环的一部分：插件交付需要 Skill lifecycle hooks。
- 它不是 Alembic service request client。
- 它不是 AlembicAgent runtime。
- 它也不是可删除旧残留，因为 `skillHooks` 仍有真实消费方。

## RFR-6D 建议

只派发 `AlembicPlugin`，目标是把 `AgentModule` 命名收敛为 `SkillHooksModule` 或等价更准确名称：

- 保留 `skillHooks` service key 和 `SkillHooks` 行为。
- 更新 `ServiceContainer` import / 调用和相关 tests。
- 如源码进入 runtime artifact，运行 runtime prepare / verify，并回填 runtime artifact commit / tarball hash。
- 保存执行记录到 `docs/AlembicPlugin/repository-folder-boundary-rfr-6d-plugin-skill-hooks-module-2026-05-22.md`。

不做内容：

- 不删除 `SkillHooks`。
- 不引入 `@alembic/agent`、Agent runtime、Tool runtime 或 AI provider runtime。
- 不处理 `service`、`daemon`、resident search、Dashboard compatibility、package 身份或 Dashboard HelpView 文案。
