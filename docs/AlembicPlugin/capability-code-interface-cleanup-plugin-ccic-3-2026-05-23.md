# AlembicPlugin CCIC-3 Audit Contract 收敛执行记录

日期：2026-05-23
窗口：AlembicPlugin
任务包：CCIC-P3-P
状态：待总控验收

## 窗口定位

当前窗口定位为 `AlembicPlugin` 执行窗口。

目标仓库职责：Codex MCP、Skill、channel / marketplace、插件 runtime、安装验证和 Codex 宿主适配。

本轮任务职责：只执行 CCIC-P3-P，收敛 Plugin audit 双轨 contract，真实扫描 `AuditStore` / `AuditRepositoryImpl` 的消费方，删除无消费方 `AuditRepositoryImpl` 或在发现真实消费方时合并为唯一后端，并同步 Codex runtime artifact。

明确不承担：不修改 AlembicCore facade、不修改 Alembic resident handler、不修改 Dashboard 前端 parser、不修改 AlembicAgent runtime / AI provider / tool system、不做真实项目复测、不刷新本机 Codex plugin cache。

## 完成范围

- 确认 `AuditStore` 是 AlembicPlugin 当前唯一真实 audit 后端，继续保留 `auditStore` / `auditLogger` service key。
- 删除无真实消费方的 `AuditRepositoryImpl` contract：
  - 删除 `lib/repository/audit/AuditRepository.ts`。
  - 删除 `lib/injection/modules/InfraModule.ts` 中 `auditRepository` singleton 注册。
  - 删除 `lib/injection/ServiceMap.ts` 中 `auditRepository` 类型入口。
- 增加 `test/integration/ServiceContainer.test.ts` 负向契约断言，确认 `auditRepository` 不再可被 DI container 解析。
- 运行 build 后同步 AlembicCodex runtime artifact：
  - 删除 `plugins/alembic-codex/runtime/dist/lib/repository/audit/AuditRepository.js`。
  - 更新 `plugins/alembic-codex/runtime/dist/lib/injection/modules/InfraModule.js`。
  - 刷新 `plugins/alembic-codex/runtime.tgz`。

## 关键代码证据

- `rg -n "AuditRepository|auditRepository|repository/audit" lib test scripts bin --glob '*.ts'`：源码改动后仅剩 `test/integration/ServiceContainer.test.ts` 的负向断言。
- `rg -n "AuditRepository|auditRepository|repository/audit" plugins/alembic-codex/runtime/dist --glob '*.js' --glob '*.d.ts'`：无命中。
- `auditStore` / `auditLogger` 保留路径：
  - `lib/infrastructure/audit/AuditStore.ts`
  - `lib/infrastructure/audit/AuditLogger.ts`
  - `lib/http/routes/audit.ts`
  - `lib/injection/modules/InfraModule.ts`
  - `test/unit/AuditLogger.test.ts`
  - `test/unit/Gateway.test.ts`
  - `test/integration/BootstrapLifecycle.test.ts`
  - `test/integration/GatewayChain.test.ts`
  - `test/integration/FullFlow.test.ts`

## Contract 判断

本轮选择删除 `AuditRepositoryImpl`，不与 `AuditStore` 合并。

原因：

- `AuditStore` 被 bootstrap、`AuditLogger`、HTTP audit route、Gateway flow 和 integration tests 真实消费。
- `AuditRepositoryImpl` 只存在于 DI 类型 / 注册与自身文件，未发现 `ct.get('auditRepository')`、`container.get('auditRepository')` 或业务调用方。
- 保留两个 audit 读写 contract 会继续制造 repository / infrastructure 双轨歧义；删除无消费方 contract 是最小真实收敛。

## 提交

- AlembicPlugin：`87de9fdee8feb20ce000bf30c3d0ba79559afdc5`
- AlembicCodex runtime artifact 子仓库：`b80ea951610cf8ee2a3760165ee014288d3d0c1f`
- `runtime.tgz` SHA-256：`61e73402b378291b7149cc86f96f527b30280ad767227d0cb960984230246ae4`

## 验证命令与结果

- `npm run lint:repo-boundary`：通过。
- `npm run build:check`：通过，Core build 使用 `../AlembicCore @ 4d8d1df417e5f34d5166627bcdbf28547b04736a`。
- `npm run test:unit -- test/unit/AuditLogger.test.ts test/unit/Gateway.test.ts test/unit/AuditEmission-MissionBriefing.test.ts test/unit/PresentationRoutes.test.ts`：通过，4 files / 42 tests。
- `node_modules/.bin/vitest run --config vitest.config.ts test/integration/ServiceContainer.test.ts test/integration/BootstrapLifecycle.test.ts test/integration/GatewayChain.test.ts test/integration/FullFlow.test.ts`：通过，4 files / 65 tests。
- `node_modules/.bin/biome check lib/injection/ServiceMap.ts lib/injection/modules/InfraModule.ts test/integration/ServiceContainer.test.ts`：退出 0；报告 `ServiceContainer.test.ts` 既有 `any` warning，未阻断。
- `npm run build`：通过。
- `npm run prepare:codex-plugin-runtime`：通过，刷新 `plugins/alembic-codex/runtime.tgz`。
- `npm run verify:codex-plugin`：通过。
- `npm run verify:codex-channel`：通过。
- `npm run report:agent-extraction-boundary`：通过，334 个 source files 扫描，agent / ai / tool boundary 命中均为 0。
- `rg -n "AuditRepository|auditRepository|repository/audit" lib test scripts bin --glob '*.ts'`：仅剩负向测试断言。
- `rg -n "AuditRepository|auditRepository|repository/audit" plugins/alembic-codex/runtime/dist --glob '*.js' --glob '*.d.ts'`：无命中。
- `rg -n "@alembic/agent|#agent/|#tools/|#external/ai|lib/agent|lib/tools|lib/external/ai" lib test scripts bin --glob '*.ts' --glob '*.js'`：无命中。
- `git diff --check`：通过。
- `git -C plugins/alembic-codex diff --check`：通过。

额外说明：曾误用 `npm run test:integration -- ...`，由于该 npm script 固定执行 `vitest run test/integration`，实际跑到了完整 integration suite；其中 HTTP server tests 在当前 sandbox 下因 `listen EPERM ::1:3150/3250` 失败。该结果不是本轮验收证据，已改用直接 Vitest targeted command 并通过。

## 遗留风险

- `AuditStore` 仍是 Plugin infrastructure 层的真实 audit 后端；本轮不改变 audit schema、Gateway 审计语义或 Dashboard socket event 语义。
- 本轮不刷新本机 Codex plugin cache；若总控后续要求本机 cache 吃到该 artifact，需要单独刷新。
- 不创建 AlembicTest 复测单；本轮不改变真实项目 prime/search/cold-start 用户路径。

## 下一步建议

- 总控验收 AlembicPlugin CCIC-P3-P 后，关闭 `CCIC-TODO-15`。
- Alembic / AlembicCore 的 CCIC-3 上游任务仍独立推进；Plugin high-reference Core consumer replacement 必须等待 Core readiness 回填后再启动。
