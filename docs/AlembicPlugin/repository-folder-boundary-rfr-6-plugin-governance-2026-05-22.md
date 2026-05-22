# AlembicPlugin RFR-6A Governance Boundary Execution

创建日期：2026-05-22
执行窗口：AlembicPlugin
对应总控计划：`docs/workspace/repository-folder-boundary-restructure-workspace-plan-2026-05-22.md`
状态：已完成，已通过总控验收

## 任务目标

在 `Plugin first, Alembic install enhances` 前提下，处理 AlembicPlugin 旧 `lib/core` / `#core/*` governance 命名残留。执行前先复核该能力是否属于 Plugin 围绕 Codex / IDE Agent 的自洽闭环，再判断是否应转成 Alembic service request client、portable compatibility 或旧残留，最后做最小真实修正。

## 调用链复核

- `lib/core` 只有 `constitution`、`gateway`、`permission` 三个子目录，共 5 个源码文件。
- 真实消费方包括 `lib/bootstrap.ts` 初始化 constitution / validator / permission / gateway，`lib/injection/modules/InfraModule.ts` 注册 `gateway` singleton，`lib/http/HttpServer.ts` 注册 Gateway actions，`lib/external/mcp/McpServer.ts` 在 embedded MCP 初始化后动态注册 Gateway actions。
- 测试消费方包括 `test/unit/Constitution.test.ts`、`ConstitutionValidator.test.ts`、`Gateway.test.ts`、`PermissionManager.test.ts`。
- `#core/*` 只用于 `lib/external/mcp/McpServer.ts` 的动态导入；其余消费方为相对路径。
- 未发现 `lib/core` 被 `scripts/`、`bin/`、release 脚本或 channel metadata 直接引用；runtime artifact 通过 build / prepare 输出对应 compiled 文件。

## 旧功能分类

| 原目录 | 分类 | 真实消费方 | 判断 |
| --- | --- | --- | --- |
| `lib/core/constitution` | Plugin Codex 自洽闭环 | `Bootstrap`、`Gateway`、`PermissionManager`、治理单测 | 负责加载插件 portable runtime 的 `constitution.yaml` 并为 Codex / IDE Agent 请求治理提供本地规则语义；不是 Alembic service client，也不是旧残留。 |
| `lib/core/gateway` | Plugin Codex 自洽闭环 + portable compatibility | `Bootstrap`、`HttpServer`、`McpServer`、`InfraModule`、Gateway 单测 | 负责 Plugin embedded runtime 内的请求 validate / guard / route / audit，以及 HTTP / MCP compatibility path 的 action registry；Alembic service 可增强外部能力，但本地 portable runtime 仍需要最小治理闭环。 |
| `lib/core/permission` | Plugin Codex 自洽闭环 | `Bootstrap`、`Gateway`、Permission 单测 | 负责 Codex / IDE Agent actor 到 action/resource 的本地权限裁决；属于 Plugin request governance，不应删成空 client。 |

本轮没有发现应立即改写为 Alembic service request client 的项；也没有发现可删除旧残留。后续如果整理 `lib/http` / `lib/service` / `lib/injection` / `lib/daemon`，应另开 RFR-6B 分类，不在 RFR-6A 顺手重写服务请求链路。

## 完成范围

- 将 `lib/core/{constitution,gateway,permission}` 迁移为 `lib/governance/{constitution,gateway,permission}`。
- 将 package import alias 从 `#core/*` 改为 `#governance/*`，同步 Vitest source alias。
- 更新 `lib/bootstrap.ts`、`lib/http/HttpServer.ts`、`lib/external/mcp/McpServer.ts`、`lib/injection/ServiceMap.ts`、`lib/injection/modules/InfraModule.ts` 和四组 governance 单测 imports。
- 将 `Bootstrap.initializeCoreComponents` 收敛为 `initializeGovernanceComponents`，避免新的内部命名继续暗示旧 core bounded context。
- 更新 `AGENTS.md` 当前源码分层与 import alias 口径。
- 重新生成 Codex plugin runtime artifact，runtime 中同步 `dist/lib/governance/**` 和 `#governance/*`。

未移动 `lib/http/`、`lib/service/`、`lib/injection/`、`lib/daemon/`、`lib/external/mcp/`、`lib/codex/`、plugin shell、channel、`.agents/`、`vendor/AlembicCore/`、`plugins/alembic-codex/runtime/` 或 `runtime.tgz` 所在路径；未删除 HTTP compatibility routes、DashboardOperation compatibility、daemon-server、JobStore、git-diff checkpoint、resident search、prime shout、MCP tools 或 Codex runtime 能力。

## 提交与产物

- AlembicPlugin 提交：`cef5e419440064c056d6b3408cd961fac5047b7a`
- AlembicCodex runtime artifact 子仓库提交：`c6e194d9941d0b5ce7f85b03cfe7fa2adc6c9ed9`
- `plugins/alembic-codex/runtime.tgz` SHA-256：`dc40f72a9d581b0d913104d4b150c3b54d191a2c5067bd71ab5cac1e36db9c76`

## 验证命令与结果

| 命令 | 结果 |
| --- | --- |
| `npm run build:check` | 通过；Core build 使用 `../AlembicCore @ f30beacedf89abab13b91e87e4686d0db38e7d29`，TypeScript no-emit 检查通过。 |
| `npm run test:unit -- test/unit/Constitution.test.ts test/unit/ConstitutionValidator.test.ts test/unit/Gateway.test.ts test/unit/PermissionManager.test.ts` | 通过；4 个文件、59 个测试通过。 |
| `npm run test:unit -- test/unit/CodexMcpServer.test.ts test/unit/CodexSessionScenarioRunner.test.ts` | 通过；2 个文件、40 个测试通过。 |
| `npm run build` | 通过；重新生成 Plugin `dist`。 |
| `npm run prepare:codex-plugin-runtime` | 通过；刷新 `plugins/alembic-codex/runtime` 和 `runtime.tgz`。 |
| `npm run verify:codex-plugin` | 通过；`./runtime.tgz -> alembic-ai@0.2.0`。 |
| `npm run verify:codex-channel` | 通过；`alembic-ai@0.2.0`。 |
| `rg -n "lib/core\|#core\|\\.\\./core\|\\.\\./\\.\\./core" lib test bin scripts package.json tsconfig*.json vitest*.config.* AGENTS.md plugins/alembic-codex/runtime/package.json plugins/alembic-codex/runtime/dist --glob '!vendor/**'` | 通过；无命中。 |
| `rg -n "#governance\|lib/governance\|governance/(constitution\|gateway\|permission)" lib test package.json vitest.config.ts AGENTS.md plugins/alembic-codex/runtime/package.json plugins/alembic-codex/runtime/dist` | 通过；命中均为新 governance import map、源码/测试 imports 和 runtime artifact 输出。 |
| `git diff --check` | 通过。 |
| `git -C plugins/alembic-codex diff --check` | 通过。 |

补充：`npm run lint` 已尝试运行，但仓库当前仍有既有 Biome 债，主要命中 `lib/bootstrap.ts` 既有 non-null assertion 和 `lib/cli/SetupService.ts` 既有 console / 文案诊断等，不属于 RFR-6A 建议验收命令；本轮未扩大修复范围。

## 残留风险

- RFR-6A 只完成 governance 命名收敛；`lib/http`、`lib/service`、`lib/injection`、`lib/daemon` 的 Alembic service request client / portable compatibility / 旧残留分类仍需 RFR-6B 深挖。
- Plugin runtime package 仍叫 `alembic-ai@0.2.0`，这是当前 Codex runtime artifact 校验要求；package 身份重叠风险未在本轮处理。
- 本轮没有刷新本机 Codex plugin cache，也没有创建 AlembicTest 真实项目复测单；如总控认为 runtime artifact 需要实际安装验证，应另开 cache refresh / AlembicTest 任务。
- 仓库 `npm run lint` 仍有既有 Biome 债，不阻塞 RFR-6A 目录命名验收，但后续质量线应单独收敛。

## 下一步建议

- 总控先验收 RFR-6A 提交、runtime artifact、残留扫描和分类表。
- RFR-6B 建议围绕 `lib/http` / `lib/service` / `lib/injection` / `lib/daemon` 做同样分类：Plugin Codex 自洽闭环、Alembic service request client、portable compatibility、旧残留；不要直接删除 portable runtime compatibility。
- 若继续处理 package 身份、Dashboard help、Core exports 或 Agent 文档路径，应分别开独立小波次，避免与 Plugin governance 命名收敛混在一起。

## 总控验收

2026-05-22：总控复核通过。复核范围包括 AlembicPlugin 提交 `cef5e419440064c056d6b3408cd961fac5047b7a`、AlembicCodex runtime artifact `c6e194d9941d0b5ce7f85b03cfe7fa2adc6c9ed9`、`lib/core/#core` 负向扫描、`#governance/lib/governance` 正向扫描、runtime artifact 子仓库状态和提交 diff check。

功能完整性检查：governance 能力仍被 bootstrap、HTTP、MCP embedded server、DI 和 targeted tests 消费；本轮只收敛命名与 import 边界，没有移动 HTTP/service/injection/daemon/external MCP/codex/plugin shell/channel/vendor/runtime artifact 所在路径。RFR-6A 验收通过，后续进入 RFR-6B / RFR-6C。
