# Small Fix / Cleanup Self-Check — Alembic

日期：2026-05-23
窗口：`Alembic`
状态：待验收
提交：无。本轮只做自检和 workspace 文档回填，未修改 Alembic 产品源码。

## 窗口定位

- 当前窗口：`Alembic` 主仓库执行窗口。
- 目标仓库：`/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic`。
- 本轮职责：自检 Alembic 本地增强底座、CLI、daemon、HTTP/API、Dashboard server、ProjectRegistry、file monitor、JobStore、internal AI jobs、安装 / dev / release 链路中的小问题和清理候选。
- 明确不承担：不直接修复产品源码，不移动目录，不删除兼容层，不提交代码；不修改 `AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`、`AlembicTest` 或真实测试项目。

## 自检范围

- 入口规则：读取 workspace `AGENTS.md`、`docs/workspace/index.md`、当前 SFC 总控计划和 Alembic `AGENTS.md`。
- 仓库状态：确认 Alembic 当前 `main...origin/main`，无未提交产品源码变更。
- 代码 / 配置 / 文档扫描：
  - package imports、AGENTS 说明、README 插件边界说明。
  - `lib/external`、`#external/*`、old MCP bridge、Codex plugin、旧 Dashboard / AI config 相关残留。
  - Agent extraction boundary config / lint 脚本和 retired fixture tests。
  - HTTP AI config routes 与 vendored Dashboard API 消费关系。
- 轻量验证：build / check / boundary lint / release package guard / targeted unit tests；未运行真实项目、发布、daemon 长驻或 e2e 链路。

## 发现问题

| ID | 级别 | 归属 | 现象 | 证据 | 影响范围 | 建议修复方式 |
| --- | --- | --- | --- | --- | --- | --- |
| SFC-ALEMBIC-001 | 低 | Alembic 文档 | Alembic `AGENTS.md` 的路径别名说明仍列出 `#external/*`，但 `package.json` imports 已移除此别名。 | `Alembic/AGENTS.md:95`；`Alembic/package.json:10-54` 未包含 `#external/*`；`rg -n "#external/|external/mcp|lib/external|#core|lib/core" AGENTS.md README.md README_CN.md package.json lib bin config scripts test` 命中该说明和测试 / guard fixture。 | 后续执行窗口可能误以为可以继续新增或引用 `#external/*`；不影响当前 build。 | 下一轮小修复中更新 `AGENTS.md`：删除 `#external/*`，保留 resident path 和 retired marker 说明；修后跑 `npm run check` 与 `rg -n "#external/" AGENTS.md package.json lib bin scripts config test`。 |
| SFC-ALEMBIC-002 | 低 | Alembic 清理 | `lib/external/mcp/README.md` 作为边界 marker 保留合理，但其下仍有空目录 `lib/external/mcp/handlers/bootstrap`。 | `find lib/external -maxdepth 4 -type f | sort` 仅输出 `lib/external/mcp/README.md`；`find lib/external -type d -empty | sort` 输出 `lib/external/mcp/handlers/bootstrap`；`lib/external/mcp/README.md:9-11` 要求不要再加 TS modules。 | 空目录本身不影响运行，但会让 `external/mcp/handlers` 看起来仍是可放实现的旧树。 | 下一轮可删除空目录，仅保留 `lib/external/mcp/README.md` marker；修后跑 `find lib/external -type d -empty | sort`、`npm run lint:agent-extraction-boundary`、相关 boundary tests。 |
| SFC-ALEMBIC-003 | 中低 | Alembic boundary config / lint | Agent extraction boundary 配置仍把 `lib/external/ai/**` 描述为“preserved only as a deletion candidate”，但仓库内已无该树；lint 脚本仍保留 `#external/ai` / `lib/external/ai` 负向检测。 | `config/agent-extraction-boundary.json:304-315`；`scripts/lint-agent-extraction-boundary.mjs:114-143`、`:575-587`；`find lib/external -maxdepth 4 -type f | sort` 无 `lib/external/ai`。 | 运行检查通过，当前不阻塞；但回填报告仍携带过期“本地树保留”语义，容易误导后续删除 / 保留判断。 | 不建议直接删除全部检测。下一轮应把 config 文案从“preserved deletion candidate”改为“retired path negative guard”，或在总控确认后删除 `ignoredPathPrefixes` / local deletion candidate 语义；修后跑 `npm run lint:agent-extraction-boundary` 和 `npm run check`。 |
| SFC-ALEMBIC-004 | 低 | Alembic HTTP / Dashboard server 文案 | `/api/v1/ai/env-config` 注释写“兼容旧 Dashboard”，但 vendored Dashboard 当前仍消费该 endpoint；这不是可删 API，只是注释口径容易被误判。 | `lib/http/routes/ai.ts:892-898`；`vendor/AlembicDashboard/src/api.ts:1810` 和 `:1845` 消费 `/ai/env-config`。 | 若按“旧 Dashboard”字面理解，后续可能误删当前 Dashboard server API。当前 build / tests 未受影响。 | 下一轮只调整注释口径，例如改为“保留 env-config 路径名以兼容当前 Dashboard API contract / 历史路由名”；删除 endpoint 需要 AlembicDashboard 同步，不应在本轮做。 |
| SFC-ALEMBIC-005 | 观察 | Alembic lint debt | `npm run lint` 与 `npm run check` 均返回 0，但 Biome 输出 227 warnings / 25 infos，集中在 `lib/bootstrap.ts` 非空断言、`lib/cli/AiScanService.ts` 非空断言、`lib/cli/SetupService.ts` console、`lib/governance/gateway/GatewayActionRegistry.ts` explicit any 等。 | `npm run lint` 输出：`lib/bootstrap.ts:102` 起多处 `noNonNullAssertion`；`lib/cli/AiScanService.ts:116-117`；`lib/cli/SetupService.ts:228`、`:230`；`lib/governance/gateway/GatewayActionRegistry.ts:16`；总计 227 warnings / 25 infos。 | 当前 CI/check 不阻塞，因为命令 exit 0；若后续提高 lint 严格度会形成较大修复面。 | 不纳入本轮小修。建议独立 lint debt 任务包：先改 `bootstrap` 依赖守卫和 `AiScanService` 初始化断言，再决定 CLI console policy，最后收敛 gateway container 类型。 |

## 不判为问题的命中

- `README.md:45-61` 提到 Codex plugin 由 `AlembicPlugin` 维护，符合当前 Plugin first / Alembic install enhances 边界，不建议删除。
- `test/unit/AgentModuleBoundaries.test.ts:231-242` 和 `test/unit/ResidentServiceBoundary.test.ts:52-68` 的 `#external/mcp` / legacy path 命中是 retired compatibility 负向 fixture，不是产品消费方。
- `lib/http/routes/ai.ts` 的 `/api/v1/ai/env-config` endpoint 有 vendored Dashboard consumer，当前不能作为删除候选。

## 验证命令与结果

- `git status --short --branch`：通过，Alembic 为 `## main...origin/main`，无产品源码改动。
- `find lib/external -maxdepth 4 -type f | sort`：仅剩 `lib/external/mcp/README.md`。
- `find lib/external -type d -empty | sort`：发现空目录 `lib/external/mcp/handlers/bootstrap`。
- `rg -n "#external/|external/mcp|lib/external|#core|lib/core" AGENTS.md README.md README_CN.md package.json lib bin config scripts test`：命中 `AGENTS.md` 过期 alias、AI / MCP boundary guard 和 tests 负向 fixture。
- `rg -n "env-config|/api/v1/ai/config|/ai/config" dashboard vendor/AlembicDashboard`：确认 vendored Dashboard 消费 `/ai/env-config`。
- `npm run build:check`：通过。
- `npm run lint:repo-boundary`：通过，escape hatch 1 / 75。
- `npm run lint:consumer-core-imports`：通过，扫描 361 files / 447 imports。
- `npm run lint:agent-extraction-boundary`：通过，local Agent / local AI / local memory-context / stale dist duplicate 均为 0。
- `npm run release:package-guard`：通过；仅提示 package-lock 中 `../AlembicAgent`、`../AlembicCore` 是开发态 local entries，不应复制到 publish staging manifest。
- `npm run test:unit -- --run test/unit/ResidentServiceBoundary.test.ts test/unit/AgentModuleBoundaries.test.ts`：通过，2 files / 14 tests。
- `npm run lint`：命令返回 0；输出 227 warnings / 25 infos。
- `npm run check`：通过；其中 lint 阶段仍输出 227 warnings / 25 infos。
- `git diff --check`：通过，无输出。

## 未运行命令理由

- 未运行 `npm test`、`npm run test:integration`、`npm run test:e2e`、`npm run test:coverage`：本轮是只读自检，不做全面回归或昂贵测试。
- 未运行 `npm run release:check`、`npm run release:staging:prepare`、`npm run release:staging:pack`：会生成发布 / staging 产物，不属于本轮自检。
- 未运行 `npm run start`、`npm run cli`、`npm run smoke:multi-project-control`、daemon / Dashboard 手工 smoke：可能启动长驻服务或依赖真实工作区状态，本轮只记录需要修复候选。
- 未运行真实项目 / BiliDili 相关命令：总控要求真实项目只通过 `AlembicTest` 承接。

## 需要升级或用户确认的问题

- `SFC-ALEMBIC-003` 是否只改 boundary config 文案，还是彻底移除 `lib/external/ai` deletion-candidate 语义，需要总控确认，因为它会改变 Agent extraction lint 报告口径。
- `SFC-ALEMBIC-005` 若要把 227 个 Biome warnings 纳入“小修复”，建议单独成包并确认是否允许调整 CLI console 输出策略；否则继续观察即可。

## 遗留风险

- 本轮没有修改 Alembic 产品源码，因此所有发现项仍待总控归类为下一阶段修复、观察或取消。
- 未跑全量 integration / e2e / release staging，无法证明发布产物和 daemon 长驻行为；不过本轮发现项均不是运行链路阻塞。
- `vendor/AlembicDashboard` 仅作为 Alembic 内 vendored consumer 证据读取，未修改；若后续要删除 `/api/v1/ai/env-config`，必须由 Dashboard 窗口同步验证。

## 下一步建议

- 总控可将 `SFC-ALEMBIC-001`、`SFC-ALEMBIC-002`、`SFC-ALEMBIC-004` 合并为 Alembic 小修复包，风险低、验证路径统一。
- `SFC-ALEMBIC-003` 建议先由总控定口径，再决定是文案修复还是 lint config 收敛。
- `SFC-ALEMBIC-005` 建议作为独立 lint debt backlog，不阻塞本轮小清理。
