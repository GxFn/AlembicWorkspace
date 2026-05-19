# Alembic Multi Project Control Wave 5 E2E Smoke Foundation Plan

日期：2026-05-19
状态：阶段 5A 已完成
维护窗口：AlembicWorkspace

## 目标

本波进入真实多项目端到端 smoke。先由 `Alembic` 产出可复用的双项目 runtime / projects API / Dashboard handoff 证据，再解除 `AlembicDashboard` 和 `AlembicPlugin` 的消费层阻塞。

当前只派发 `Alembic`。原因是 Dashboard / Plugin 的 live consumer 验证依赖同一套真实 runtime-control、projectId、dashboardUrl、selected / active 状态和 stop / switch 结果；如果消费层提前各自造环境，会产生不一致证据并浪费窗口。

本波不是继续做抽象接口，不是新增空 adapter，也不是重新设计多项目模型。验收重点是证明现有 Wave 1-4 的实现能组成真实可用链路。

## 上游依据

- 需求设计：[../requirement-designs/alembic-multi-project-control-redesign/requirement-design-2026-05-18.md](../../../../requirement-designs/alembic-multi-project-control-redesign/requirement-design-2026-05-18.md)
- 代码实现依赖调研：[../requirement-designs/alembic-multi-project-control-redesign/code-implementation-dependency-research-2026-05-18.md](../../../../requirement-designs/alembic-multi-project-control-redesign/code-implementation-dependency-research-2026-05-18.md)
- 目标阶段确认：[alembic-multi-project-control-redesign-goal-stage-confirmation-2026-05-18.md](alembic-multi-project-control-redesign-goal-stage-confirmation-2026-05-18.md)
- Wave 3B Alembic safe handoff：[alembic-multi-project-control-wave-3b-http-control-plane-safe-handoff-plan-2026-05-19.md](alembic-multi-project-control-wave-3b-http-control-plane-safe-handoff-plan-2026-05-19.md)
- Wave 4 Dashboard / Plugin consumer handoff：[alembic-multi-project-control-wave-4-dashboard-plugin-consumer-handoff-plan-2026-05-19.md](alembic-multi-project-control-wave-4-dashboard-plugin-consumer-handoff-plan-2026-05-19.md)

## 窗口分派

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>已完成 | 已产出真实双项目 smoke foundation，提交 `edec0a5`；总控复核通过。 |
| `AlembicDashboard`<br>已解除阻塞 | `Alembic` 已提供双项目 projects API、dashboardUrl 和 action 结果证据；进入 Wave 5B 做真实 Dashboard UI live consumer 验证。 |
| `AlembicPlugin`<br>已解除阻塞 | `Alembic` 已提供同一套双项目 runtime-control 证据；进入 Wave 5B 验证 Codex host project connected / mismatch / disconnected 状态。 |
| `AlembicCore`<br>已完成 | Core contract 已验收；本波不派发。若 Alembic smoke 发现 contract 真实缺口，再由总控另开补齐任务。 |
| `AlembicAgent`<br>观察中 | 当前不涉及 internal AI runtime；只观察 smoke 是否暴露 internal AI project scope 缺口。 |
| `BiliDili`<br>观察中 | 本波先不用真实测试项目；隔离双项目 smoke 通过后，如需要真实项目只读验证，再单独派发。 |

## Alembic 执行要求

范围：

- 读取 `Alembic/AGENTS.md`、本文档、Wave 3B Alembic 回填、Wave 4 Dashboard / Plugin 总控验收记录。
- 深入读取真实实现后选择最可靠 smoke 路径，至少覆盖：
  - ProjectRegistry / global runtime-control state。
  - Ghost project setup / register。
  - daemon start / ready status / runtime boundary。
  - projects HTTP API：`GET /api/v1/projects`、`GET /api/v1/projects/current`。
  - project action HTTP API：`open-dashboard`、`switch`、`stop`。
  - Dashboard URL handoff：同源刷新或跨 origin URL 必须可解释。
  - 单 active runtime 模型：切换时旧 active 如何关闭、重连或标记 inactive。
- 使用两个隔离测试项目，避免改动 `BiliDili` 和用户真实项目；如必须使用本 workspace 内项目做路径验证，只允许只读并在文档写明理由。
- 记录可供 Dashboard / Plugin 下游复用的证据：项目标识、action 顺序、HTTP 响应摘要、selected / active 变化、dashboardUrl、stop 后状态、失败路径和清理方式。不要写入本机绝对路径、密钥或 token。

禁止事项：

- 不要让 Dashboard / Plugin 提前猜字段或复制临时 contract。
- 不要把失败 smoke 包装成通过；如果发现只能跑 mocked API，必须回填为阻塞或缺口。
- 不要为了通过 smoke 改坏 Plugin first 边界：Plugin 仍不负责项目切换，Dashboard 仍不拥有 daemon 编排。
- 不要在 `AlembicWorkspace` 仓库执行 git add / commit / push；workspace 文档由总控统一提交。

建议验证：

```bash
npm run build
npm run check
```

实际验证命令以 `Alembic/AGENTS.md`、`package.json` 和真实 smoke 路径为准。若 `check` 不适用，必须说明替代命令。

文档动作：

- 新建 / 更新：`docs/Alembic/alembic-multi-project-control-wave-5-e2e-smoke-foundation-2026-05-19.md`
- 回填位置：本文档“回填区”的 `Alembic` 小节。
- 挂载入口：本文档和 `docs/workspace/index.md`。

## 后续解除阻塞标准

`AlembicDashboard` 和 `AlembicPlugin` 只有在 `Alembic` 回填以下证据后才允许变为 `待启动`：

- 两个项目都能被 Alembic 识别并出现在 `/api/v1/projects`。
- `/projects/current` 能反映 selected / active 状态。
- `switch` 能改变 active runtime 或产生可解释的 handoff / deferred result。
- `open-dashboard` 返回可用 dashboardUrl 或明确的 unavailable 错误。
- `stop` 后 projects snapshot 与 daemon 状态一致。
- 已说明清理方式，避免临时项目或 daemon 残留影响下游。

## 功能完整性检查

本波不能只通过构建或单元测试。总控验收必须看到真实 HTTP API、runtime-control 状态变化、daemon ready / stop 行为和 handoff 证据。若只完成最小连接、mocked response、静态 JSON、未启动 daemon 或无法复现的手工描述，不能标为已完成，需要补一轮非最小完整实现。

## 可复制提示词

发送给：无，Wave 5A 已完成；下一步进入 Wave 5B consumer live smoke。

不发送给：`Alembic`（已完成）、`AlembicDashboard`（已解除阻塞，见 Wave 5B）、`AlembicPlugin`（已解除阻塞，见 Wave 5B）、`AlembicCore`（已完成）、`AlembicAgent`（观察中）、`BiliDili`（观察中）。

## 回填区

### Alembic

- 状态：已通过总控验收
- 执行文档：[../Alembic/alembic-multi-project-control-wave-5-e2e-smoke-foundation-2026-05-19.md](../../../../Alembic/alembic-multi-project-control-wave-5-e2e-smoke-foundation-2026-05-19.md)
- 完成范围：新增可重复运行的 `npm run smoke:multi-project-control`；脚本创建隔离 `ALEMBIC_HOME` 和两个临时 Ghost 项目，执行 Ghost setup / register、daemon start、projects HTTP API、`open-dashboard`、失败 `switch`、A->B `switch`、B `stop`、CLI current state 校验和清理。
- 提交 hash：`edec0a52c1dffb5f8c09fdc4545422995cdad157` (`test: add multi project control smoke`)
- 验证命令：`npm run build`；`npm run smoke:multi-project-control`；`npm run build:check`；`npm run lint:consumer-core-imports`；`npx biome check --diagnostic-level=error package.json scripts/smoke-multi-project-control.mjs`；`git diff --check`；`git diff --check --cached`；`npm run check`。
- 验证结果：`build`、`smoke:multi-project-control`、`build:check`、consumer core import lint、targeted Biome、diff checks 均通过。`npm run check` 的 `typecheck` 阶段通过，但全仓库 `lint` 阶段失败，命中既有 `lib/bootstrap.ts` 等非本轮文件的 lint 债。
- 可供下游复用的证据：上次 smoke 示例 projectId 为 A=`8232f1d4`、B=`ee85937b`；A/B 两个 daemon 的 `/api/v1/projects` 均返回 2 个项目；A/B `open-dashboard` 均复用同项目 Dashboard URL；A->B `switch` 返回 B ready handoff、`deferredStopProjectId=8232f1d4`、`oldApiStoppedAfterResponse=true`；B `stop` 返回 activeRuntimeProject `null`、selected 保留 B、`selfApiStoppedAfterResponse=true`；无效 projectId `switch` 返回 `404` 且 active 仍为 A；清理结果为 A/B best-effort stop 且临时目录删除。
- 遗留风险：尚未跑 Dashboard 浏览器 UI 和 Codex Plugin runtime live consumer smoke；`npm run check` 仍受既有全仓库 lint 债阻塞；隔离项目 smoke 不覆盖真实大型项目。
- 下一步建议：总控验收 `edec0a5` 后解除 `AlembicDashboard` / `AlembicPlugin` 阻塞，分别启动 Dashboard live consumer smoke 和 Plugin hostProject live smoke。

### AlembicDashboard

- 状态：已解除阻塞
- 解除阻塞证据：`Alembic` smoke 已证明两个 Ghost 项目、projects API、`open-dashboard`、失败 `switch`、A->B `switch`、B `stop`、Dashboard URL handoff 和清理流程。
- 下一步：进入 [alembic-multi-project-control-wave-5b-consumer-live-smoke-plan-2026-05-19.md](alembic-multi-project-control-wave-5b-consumer-live-smoke-plan-2026-05-19.md)。

### AlembicPlugin

- 状态：已解除阻塞
- 解除阻塞证据：`Alembic` smoke 已证明 selected / active runtime-control、ready daemon handoff、切换后旧 API 断开和 stop 后 active 清空。
- 下一步：进入 [alembic-multi-project-control-wave-5b-consumer-live-smoke-plan-2026-05-19.md](alembic-multi-project-control-wave-5b-consumer-live-smoke-plan-2026-05-19.md)。

### 总控验收

- 状态：已通过
- 验收时间：2026-05-19
- 验收结论：
  - 本轮新增 `npm run smoke:multi-project-control` 是真实端到端 smoke，不是 mock 或静态 JSON；脚本会创建两个隔离 Ghost 项目，启动 daemon，调用真实 projects HTTP API 和 action API，并验证 stop / switch 后 API 可达性变化。
  - 总控复跑 `npm run build` 通过。
  - 总控复跑 `npm run smoke:multi-project-control`：沙箱内 daemon start 受本地绑定限制失败；按权限规则提权后通过，输出 success。
  - 提权 smoke 证据：A=`a6891648`、B=`f6f183bf`；A/B projects API 均返回 2 个项目；无效 switch 返回 `404` 且 active 仍为 A；A->B switch 后 `targetReady=true`、`targetStatus=ready`、旧 A API 在 response 后断开；B stop 后 active 为 `null`、selected 保留 B、B API 在 response 后断开；临时项目已 best-effort stop 且临时目录删除。
  - `npm run build:check`、`npm run lint:consumer-core-imports`、targeted Biome 和 `git diff --check` 均通过。
  - `npm run check` 的 typecheck 阶段通过，但全仓库 lint 阶段仍失败；失败集中在 `lib/bootstrap.ts`、`lib/cli/AiScanService.ts`、`lib/core/gateway/GatewayActionRegistry.ts`、`scripts/verify-context-api.ts` 等既有非本轮 lint 债，不影响本轮新增 smoke 证据判定。
  - `Alembic` 工作区干净，提交为 `edec0a52c1dffb5f8c09fdc4545422995cdad157`。
- 下一步：
  - 解除 `AlembicDashboard` / `AlembicPlugin` 阻塞，启动 Wave 5B consumer live smoke。
  - `Alembic` 本身不再派发；若 consumer live smoke 发现 fixture 需要持久化或暴露 `--keep-alive` 模式，再由总控单独回派 Alembic。
