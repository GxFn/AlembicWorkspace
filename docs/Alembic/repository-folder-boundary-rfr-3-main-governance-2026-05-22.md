# Alembic RFR-3A Main Governance Boundary Execution Record

日期：2026-05-22
窗口：Alembic
来源计划：`docs/workspace/repository-folder-boundary-restructure-workspace-plan-2026-05-22.md`
状态：已完成，已通过总控验收
Alembic 提交：`07273a64a413c59a8d5b247f098859d9658a1985`

## 任务目标

RFR-3A 目标是处理 Alembic 主仓库 `lib/core` 与外部共享包 `@alembic/core` 的命名歧义。复核后确认当前 `lib/core` 并不是共享 deterministic core，而是 Alembic host-owned governance bounded context，承载 constitution、gateway、permission 三类运行期治理能力。

本轮只做该 bounded context 的目录命名收敛：将 `lib/core` 收敛为 `lib/governance`，保持 CLI、daemon、HTTP route、Dashboard dist、release staging、resources、vendor、workspace source resolver 和真实项目不变。

## 调用链复核

- `lib/bootstrap.ts` 是 governance 能力的生产入口，创建 `Constitution`、`ConstitutionValidator`、`PermissionManager` 和 `Gateway`，并注入 service container。
- `lib/injection/ServiceMap.ts` 只消费 governance 类型，`lib/injection/modules/InfraModule.ts` 通过 service container 读取 `Gateway`。
- `lib/http/HttpServer.ts` 只读取 `GatewayActionRegistry`，用于注册 HTTP gateway actions。
- `test/unit/Constitution*.test.ts`、`Gateway.test.ts`、`PermissionManager.test.ts` 是该 bounded context 的直接回归测试。
- `package.json` 里原 `#core/*` import map 没有源码消费方；为避免继续混淆，替换为 `#governance/*`，未保留无消费方 compatibility alias。
- `scripts/bench-real-projects.mts` 和 `scripts/collect-test-project-stats.mts` 中旧 `../lib/core/...` 指向已不存在的历史 Core 实现；本轮改为通过 `@alembic/core` public exports 读取共享 Core 能力，避免继续暗示 Alembic 主仓库拥有该实现。

## 完成范围

- 移动文件：
  - `lib/core/constitution/Constitution.ts` -> `lib/governance/constitution/Constitution.ts`
  - `lib/core/constitution/ConstitutionValidator.ts` -> `lib/governance/constitution/ConstitutionValidator.ts`
  - `lib/core/gateway/Gateway.ts` -> `lib/governance/gateway/Gateway.ts`
  - `lib/core/gateway/GatewayActionRegistry.ts` -> `lib/governance/gateway/GatewayActionRegistry.ts`
  - `lib/core/permission/PermissionManager.ts` -> `lib/governance/permission/PermissionManager.ts`
- 更新生产 imports：`lib/bootstrap.ts`、`lib/http/HttpServer.ts`、`lib/injection/ServiceMap.ts`、`lib/injection/modules/InfraModule.ts`。
- 更新测试 imports：`test/unit/Constitution.test.ts`、`test/unit/ConstitutionValidator.test.ts`、`test/unit/Gateway.test.ts`、`test/unit/PermissionManager.test.ts`。
- 更新 manifest：`package.json` package imports 从 `#core/*` 调整为 `#governance/*`。
- 更新脚本历史路径：`scripts/bench-real-projects.mts`、`scripts/collect-test-project-stats.mts` 改用 `@alembic/core` public exports。
- 更新 Alembic 仓库规则文档：`AGENTS.md` 的 package import 列表和源码目录说明。
- 删除迁移后为空的 `lib/core` 目录。

## 验证命令与结果

- `npm run build:check`：通过。
- `npm run test:unit -- test/unit/Constitution.test.ts test/unit/ConstitutionValidator.test.ts test/unit/Gateway.test.ts test/unit/PermissionManager.test.ts`：通过，4 个文件 / 59 个测试。
- `npm run build`：通过。
- `npm run release:package-guard`：通过；仅保留既有 package-lock 本地 workspace entry 警告：`../AlembicAgent`、`../AlembicCore`。
- `rg -n "lib/core|#core|\\.\\./core|\\.\\./\\.\\./core" lib test bin scripts package.json tsconfig.json vitest.config.ts vitest.unit.config.ts`：无输出，退出码 1，表示迁移范围内无剩余命中。
- `git diff --check`：通过。
- `npm run lint:repo-boundary`：未通过；失败点是既有 DB boundary 违规，集中在 `lib/http/routes/daemon.ts`、`lib/service/cleanup/CleanupService.ts`、`lib/service/signal/HitRecorder.ts`、`lib/infrastructure/audit/AuditStore.ts`、`bin/daemon-server.ts` 等数据库访问边界，与本轮 governance 目录迁移无直接关系。

## 未触碰范围

- 未移动 `bin/`、`lib/daemon/`、`lib/http/`、`lib/service/`、`lib/workflows/`、`dashboard/dist`、`injectable-skills/`、`templates/`、`resources/`、`vendor/`、`dist/`、`.release/`。
- 未修改 `@alembic/core` 本地源码 resolver、release staging 行为、Dashboard build 输出、runtime data、daemon API、MCP / Plugin contract 或真实项目。
- 未新增 compatibility wrapper 或空 provider。

## 遗留风险

- `npm run lint:repo-boundary` 仍因既有数据库边界规则失败，需要总控单独决定是否开 DB boundary 收敛任务；本轮没有顺手修复，以免扩大 RFR-3A 范围。
- `scripts/bench-real-projects.mts` 和 `scripts/collect-test-project-stats.mts` 现在依赖 `@alembic/core` public exports，后续如 Core export policy 收紧，需要同步调整脚本入口。
- 本轮是 host-owned governance 目录命名收敛，未创建 AlembicTest 真实项目复测单；是否需要 resident service 或 Codex plugin cache refresh，等待总控下一波判断。

## 下一步建议

- 总控验收 RFR-3A 后，先判断是否需要修复既有 `lint:repo-boundary` DB 访问边界，再决定是否进入 RFR-5 跨仓库验收或 AlembicTest 真实复测。
- 如继续做 Alembic 主仓库目录优化，应另开窄波次，并先复核 release staging、Dashboard server、ProjectRegistry、daemon/runtime data 等高耦合入口，避免把目录表达优化扩大成平台行为改写。

## 总控验收

- 2026-05-22：总控验收通过。复核 Alembic 提交 `07273a64a413c59a8d5b247f098859d9658a1985`，确认本轮只将 host-owned governance bounded context 从 `lib/core` 迁入 `lib/governance`，并更新直接生产 / 消费 imports、`package.json` imports、targeted tests、两个历史脚本路径和 `AGENTS.md`。
- 复核范围：`git -C Alembic show --name-status HEAD`、`lib/governance` 文件列表、`package.json` imports、`lib/core/#core` 负向扫描、提交 diff check 和 Alembic 工作区状态。
- 总控补充验证：`npm run build:check` 通过；`npm run test:unit -- test/unit/Constitution.test.ts test/unit/ConstitutionValidator.test.ts test/unit/Gateway.test.ts test/unit/PermissionManager.test.ts` 通过，4 个测试文件 / 59 个测试；`npm run release:package-guard` 通过；`rg -n "lib/core|#core|\\.\\./core|\\.\\./\\.\\./core" lib test bin scripts package.json tsconfig.json vitest.config.ts vitest.unit.config.ts` 无输出；`git diff --check HEAD^ HEAD` 通过。
- `npm run lint:repo-boundary` 仍失败于既有 DB boundary 违规，命中 `lib/http/routes/daemon.ts`、`lib/service/cleanup/CleanupService.ts`、`lib/service/signal/HitRecorder.ts`、`lib/infrastructure/audit/AuditStore.ts`、`bin/daemon-server.ts`；这些文件不是本轮改动范围，总控将其记录为独立后续 TODO，不阻塞 RFR-3A 目录命名收敛验收。
- 功能完整性判断：bootstrap、DI、HTTP gateway action registry、Constitution / Gateway / Permission targeted tests、package import map 和发布边界检查均已覆盖；未触碰 CLI、daemon runtime、HTTP route 行为、Dashboard dist、release staging、resources、vendor、MCP / Plugin contract 或真实项目，本轮满足 RFR-3A 完成定义。
