# Alembic Multi Project Control Wave 5 E2E Smoke Foundation

日期：2026-05-19
状态：已通过总控验收
归属窗口：Alembic
总控计划：../workspace/alembic-multi-project-control-wave-5-e2e-smoke-foundation-plan-2026-05-19.md

## 任务摘要

为多项目控制链路补齐真实端到端 smoke foundation：使用两个隔离 Ghost 项目验证 ProjectRegistry / runtime-control state、真实 daemon start / ready、projects HTTP API、`open-dashboard` / `switch` / `stop` action、Dashboard URL handoff、失败路径和清理流程。

## Alembic 回填

- 完成范围：新增可重复运行的 `npm run smoke:multi-project-control`；脚本创建隔离 `ALEMBIC_HOME` 和两个临时 Ghost 项目，执行 `setup --ghost --force`、`projects start`、HTTP projects API、HTTP action API、CLI current state 校验和清理。未触碰 `BiliDili` 或用户真实项目。
- 关键文件：
  - `package.json`
  - `scripts/smoke-multi-project-control.mjs`
- 提交 hash：`edec0a52c1dffb5f8c09fdc4545422995cdad157` (`test: add multi project control smoke`)
- smoke 路径：
  - 创建 `project-a` / `project-b` 两个隔离项目，并分别运行 Ghost setup。
  - `projects list --json` 确认 registry 只有两个 Ghost 项目。
  - `projects start <project-a>` 启动 A daemon，确认 selected / active 为 A，并记录 A API / Dashboard origin。
  - 从 A daemon 调用 `GET /api/v1/projects` 和 `GET /api/v1/projects/current`，确认项目列表数量、selected / active 状态。
  - 调用 A 的 `open-dashboard`，确认同项目复用 Dashboard URL。
  - 调用无效 projectId 的 `switch`，确认返回 `404` 且 active 仍为 A。
  - 从 A daemon 调用 `switch` 到 B，确认返回 B ready handoff、`deferredStopProject` 为 A、A API 在 response 后断开、B 成为 selected / active。
  - 从 B daemon 调用 `GET /api/v1/projects` / `current` 和 `open-dashboard`，确认 B ready、A inactive、B Dashboard URL 可用。
  - 从 B daemon 调用 `stop`，确认返回 JSON action result、activeRuntimeProject 清空、selected 保留 B、B API 在 response 后断开。
  - 最后用 CLI `projects current --json` 确认 active 为 `null`、selected 为 B，并 best-effort stop 两个项目后删除临时目录。
- 可供下游复用的证据：
  - 上次 smoke 注册了两个 Ghost 项目，示例 projectId 为 A=`8232f1d4`、B=`ee85937b`。
  - `GET /api/v1/projects` 在 A 和 B daemon 上均返回 2 个项目。
  - A `open-dashboard` 和 B `open-dashboard` 都复用同项目 Dashboard URL。
  - A -> B `switch` 返回 `targetReady: true`、`targetStatus: ready`、`previousActiveProjectId: 8232f1d4`、`targetProjectId: ee85937b`、`deferredStopProjectId: 8232f1d4`、`oldApiStoppedAfterResponse: true`。
  - B `stop` 返回 `activeRuntimeProjectAfterAction: null`、`selectedProjectAfterAction: ee85937b`、`selfApiStoppedAfterResponse: true`。
  - 失败路径：无效 projectId `switch` 返回 `404`，且 `invalidSwitchKeptActiveProjectId` 仍为 A。
  - 清理结果：`stoppedProjectIds` 包含 A / B，`removedSmokeRoot: true`。
- 验证命令：
  - `npm run build`
  - `npm run smoke:multi-project-control`
  - `npm run build:check`
  - `npm run lint:consumer-core-imports`
  - `npx biome check --diagnostic-level=error package.json scripts/smoke-multi-project-control.mjs`
  - `git diff --check`
  - `git diff --check --cached`
  - `npm run check`
- 验证结果：
  - `npm run build`：通过。
  - `npm run smoke:multi-project-control`：通过。沙箱内直接运行时 daemon start 被本地绑定限制挡住，按权限规则提权后通过；脚本输出 success，并确认临时 daemon / 目录清理。
  - `npm run build:check`：通过。
  - `npm run lint:consumer-core-imports`：通过，扫描 420 files / 562 imports。
  - 本轮文件 Biome 检查：通过。
  - `git diff --check` 和 `git diff --check --cached`：通过。
  - `npm run check`：`typecheck` 阶段通过，但全仓库 `lint` 阶段失败；失败命中 `lib/bootstrap.ts`、`lib/cli/AiScanService.ts`、`lib/core/gateway/GatewayActionRegistry.ts`、`scripts/verify-context-api.ts` 等既有 `noNonNullAssertion` / `noExplicitAny` lint 债，不在本轮改动范围内。
- 遗留风险：
  - 本波证明 Alembic 自身 daemon / HTTP / runtime-control 链路可跑通，但还未在 Dashboard 浏览器 UI 和 Codex Plugin runtime 里执行 live consumer smoke。
  - `npm run check` 受既有全仓库 lint 债阻塞；本轮新增脚本和 package script 的 targeted Biome / build / smoke 已通过。
  - Smoke 使用隔离临时项目，不覆盖真实大型项目；如总控需要真实项目只读验证，建议另开 BiliDili 或其它真实项目观察任务。
- 下一步建议：
  - 总控验收 `edec0a5` 后解除 `AlembicDashboard` / `AlembicPlugin` 阻塞，让两个窗口基于同一 smoke foundation 做 live consumer 验证。
  - Dashboard 下游重点验证 projects UI 对脚本输出字段的消费、switch 后跨 origin handoff、stop 后断线 / snapshot 展示。
  - Plugin 下游重点验证 host project connected / mismatch / disconnected 与 Alembic selected / active state 的一致性，仍不做项目切换。

## 总控验收记录

- 验收状态：已通过
- 验收时间：2026-05-19
- 验收结论：
  - `scripts/smoke-multi-project-control.mjs` 覆盖真实多项目链路：两个隔离 Ghost 项目、ProjectRegistry、runtime-control、daemon start、projects HTTP API、`open-dashboard`、失败 `switch`、A->B `switch`、B `stop`、CLI current state 和清理流程。
  - 总控复跑 `npm run build` 通过。
  - 总控复跑 `npm run smoke:multi-project-control`：沙箱内 daemon start 受本地绑定限制失败；提权后通过，输出 success。
  - 提权 smoke 证据：A=`a6891648`、B=`f6f183bf`；A/B projects API 均返回 2 个项目；无效 switch 返回 `404` 且 active 仍为 A；A->B switch 后旧 A API 断开；B stop 后 active 为 `null`、selected 保留 B、B API 断开；临时目录已删除。
  - `npm run build:check`、`npm run lint:consumer-core-imports`、targeted Biome 和 `git diff --check` 通过。
  - `npm run check` 的 typecheck 阶段通过，但全仓库 lint 阶段仍失败；失败为既有非本轮 lint 债，不影响本轮新增 smoke 验收。
  - `Alembic` 工作区干净，提交为 `edec0a52c1dffb5f8c09fdc4545422995cdad157`。
- 下一步：
  - 解除 `AlembicDashboard` / `AlembicPlugin` 阻塞，进入 Wave 5B consumer live smoke。
  - 如果 Dashboard / Plugin live smoke 证明需要可复用持久 fixture 或 `--keep-alive` 模式，再由总控单独回派 Alembic；本轮不提前追加。
