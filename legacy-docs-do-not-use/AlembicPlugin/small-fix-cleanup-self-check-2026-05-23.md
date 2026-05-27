# AlembicPlugin Small Fix / Cleanup Self-Check

日期：2026-05-23
窗口：AlembicPlugin
状态：自检完成，待总控归类
提交 hash：无。本轮未修改 AlembicPlugin 产品源码，workspace 回填文档不由执行窗口提交。

## 窗口定位

当前窗口是 `AlembicPlugin` 执行窗口。目标仓库职责是 Codex MCP、Skill、channel / marketplace、插件 runtime、安装验证和 Codex host adapter。

本轮职责只做小问题修复 / 清理修复自检，回填证据和建议；不直接修复产品源码、不移动目录、不删除兼容层、不修改 `Alembic` / `AlembicCore` / `AlembicAgent` / `AlembicDashboard` / `AlembicTest` / 真实测试项目。

## 自检范围

- 读取 workspace `AGENTS.md`、`docs/workspace/index.md`、`docs/workspace/current/workspace-current-status.md`、本轮计划和 `AlembicPlugin/AGENTS.md`。
- 扫描 AlembicPlugin 的 `package.json`、release / verify / sync scripts、Codex MCP、Skill、channel / marketplace、runtime artifact packaging、安装验证、Codex host adapter、旧外部 AI / Dashboard / agent 残留。
- 复核 `config/default.json`、`lib/cli/SetupService.ts`、`lib/injection/modules/VectorModule.ts`、`lib/injection/modules/KnowledgeModule.ts` 中 provider / vector search 的真实边界。
- 复核 real-project 采集脚本和 fixture 是否仍留在 Plugin 仓库。
- 运行轻量验证和边界扫描；未运行真实项目、daemon live smoke、发布、插件安装或全量测试。

## 发现的问题

### SFC-PLUGIN-001：repo lint 基线不绿

现象：`npm run lint` 失败。输出摘要为 `Found 6 errors. Found 116 warnings. Found 29 infos.`，主要命中 `lib/bootstrap.ts` 非空断言和 `lib/cli/SetupService.ts` CLI 输出中的 `console.log`。

证据：

- `lib/bootstrap.ts:98`、`lib/bootstrap.ts:116`、`lib/bootstrap.ts:144`、`lib/bootstrap.ts:158`、`lib/bootstrap.ts:181`、`lib/bootstrap.ts:191` 等被 Biome 报 `lint/style/noNonNullAssertion`。
- `lib/cli/SetupService.ts:246`、`lib/cli/SetupService.ts:248`、`lib/cli/SetupService.ts:250`、`lib/cli/SetupService.ts:253` 等被 Biome 报 `lint/suspicious/noConsole`。
- 命令：`npm run lint`，结果失败。

影响范围：当前 repo 的常规 lint check 已经不能作为绿色验收门禁。`lib/bootstrap.ts` 属于 daemon / runtime 初始化链路，`SetupService.ts` 属于初始化命令输出链路。

建议修复方式：下一阶段单独修复 lint 基线。`lib/bootstrap.ts` 建议用显式 invariant / accessor 收紧初始化顺序，而不是简单全部改成可选链吞掉错误；`SetupService.ts` 的用户可见 CLI 输出建议收敛到本类输出方法、logger，或用最小范围 Biome suppression 说明这是 CLI 正常输出。

推荐验证：`npm run lint`、`npm run build:check`、相关 bootstrap / setup 单元测试或最小初始化 smoke。

是否需要升级或用户确认：不需要用户确认，但需要总控把它列入下一阶段修复包。

### SFC-PLUGIN-002：root generic release 脚本仍保留旧发布入口语义

现象：root package 已经是 artifact-only 且 registry publish 被禁用，但仍保留 `release:patch` / `release:minor` / `release:major`，`scripts/release.ts` 也把 `patch/minor/major` 作为发布入口展示。这不会绕过 `prepublishOnly`，但容易让维护者误以为 AlembicPlugin 仍有 root semantic release 流程。

证据：

- `package.json:54`：`prepublishOnly` 指向 `release:root-npm-publish:disabled`。
- `package.json:69`：`release:check` 仍执行 `npm run build && node dist/scripts/release.js check`。
- `package.json:79`、`package.json:80`、`package.json:81`：`release:patch` / `release:minor` / `release:major` 仍执行 `dist/scripts/release.js`。
- `scripts/release.ts:6`：usage 仍是 `[check|patch|minor|major]`。
- `scripts/release.ts:287`：提示 `运行 npm run release:patch/minor/major 开始发布`。
- `npm run verify:release-package-boundary` 通过，说明 root registry publish 边界本身仍被守住。

影响范围：发布维护体验和 CI / 手工操作理解。真实 artifact-only 链路仍通过 `release:codex-plugin` / `release:codex-channel` 和 `runtime.tgz` 验证，但旧脚本命名会制造方向噪音。

建议修复方式：下一阶段禁用或重命名 `release:patch/minor/major`，把 `scripts/release.ts` 的提示改成 Codex plugin artifact / channel / tag 辅助语义；若仍需要 tag 辅助，建议改名为 `release:tag:patch` 一类明确非 npm registry 的入口，并保持 `verify:release-package-boundary`。

推荐验证：`npm run verify:release-package-boundary`、`npm run verify:codex-plugin`、`npm run verify:codex-channel`、`rg -n "release:patch|release:minor|release:major" package.json scripts README.md README_CN.md plugins/alembic-codex/RELEASE-PLAYBOOK.md`。

是否需要升级或用户确认：不需要用户确认；需要总控确认下一阶段是否只禁用旧别名，还是重命名为 tag helper。

### SFC-PLUGIN-003：SetupService 的 vector / provider 提示仍把 provider 配置说成插件宿主动作

现象：Plugin 实际不再维护可执行 embedding provider，`VectorModule` 和 `KnowledgeModule` 都显式传 `null`；但 `SetupService.stepVectorIndex()` 的用户提示仍写成“在插件宿主中配置 embedding provider”或“配置 API Key 后由插件宿主触发”。

证据：

- `lib/cli/SetupService.ts:757` 到 `lib/cli/SetupService.ts:758`：注释仍说检查 embedding provider 可用性。
- `lib/cli/SetupService.ts:771` 到 `lib/cli/SetupService.ts:772`：reason / hint 仍是 `AI Provider 未配置`、`在插件宿主中配置 embedding provider`。
- `lib/cli/SetupService.ts:780` 到 `lib/cli/SetupService.ts:785`：仍提示 `未配置 AI API Key`、`由插件宿主触发向量索引构建`。
- `lib/injection/modules/VectorModule.ts:32` 到 `lib/injection/modules/VectorModule.ts:36`：实际边界是 Plugin 不维护可执行 embedding provider，resident vector search 由 Alembic daemon HTTP API 增强，embedded runtime 只保留 baseline/vector store 管线。
- `lib/injection/modules/KnowledgeModule.ts:103` 到 `lib/injection/modules/KnowledgeModule.ts:112`：SearchEngine 明确 `aiProvider: null`。

影响范围：初始化输出和开发者判断。不会重新引入外部 AI provider，但会误导用户把 provider 配置责任放到 Plugin host，而不是 Alembic resident service / host agent enhancement。

建议修复方式：下一阶段只改文案和测试。把 `SetupService.stepVectorIndex()` 的 reason / hint 改成“embedded runtime 未注册 embedding provider；语义增强请通过 Alembic resident service / resident search”，避免出现“插件宿主配置 provider / API Key”的可见指导。

推荐验证：`npm run build:check`、`npm run lint`、针对 `SetupService.stepVectorIndex()` 的最小单元测试或字符串断言、`rg -n "插件宿主.*embedding provider|AI Provider 未配置|未配置 AI API Key" lib scripts test`。

是否需要升级或用户确认：不需要用户确认；属于 Plugin first 边界文案修正。

### SFC-PLUGIN-004：打包配置仍暴露 `ai.provider=openai` 和外部模型默认值

现象：`config/default.json` 被 runtime artifact 验证要求携带，但其中仍有 `"ai": {"provider": "openai", "model": "gpt-5.4"}`，以及 vector contextual model 默认值 `claude-sonnet-4-20250514`。当前扫描没有发现 Plugin 代码用 `config.ai` 创建第三方 provider，实际搜索 / 向量链路也显式不注入 provider；因此这是配置表面残留，不是活的外部 AI 执行链。

证据：

- `config/default.json:73` 到 `config/default.json:78`：`ai.provider` / `ai.model` / temperature / maxTokens 仍存在。
- `config/default.json:101` 到 `config/default.json:102`：`contextualEnrich=false`，但 `contextualModel` 仍指向 Claude 模型名。
- `scripts/verify-codex-plugin.mjs:290` 附近要求 runtime 携带 `config/default.json`。
- `rg -n "ai\\.provider|config\\.ai|provider:" lib config scripts test` 未发现 Plugin 生产路径使用 `config.ai` 创建 provider；provider 可见状态来自 Alembic resident service telemetry 或明确 `null`。

影响范围：配置审计和开发者认知。虽然没有活 provider 链路，但打包配置看起来像 Plugin 仍默认 OpenAI provider，和“AI source / provider 属于外部 host agent 或 Alembic resident service”的边界不一致。

建议修复方式：下一阶段先由总控判断是否允许删除 `config.ai`；如果 Core `ConfigLoader` 或历史配置 schema 需要该字段，改成明确 inert / resident-service-owned 的命名或默认 `null`，并同步 runtime artifact 与 verify。不要在没有 schema 复核的情况下直接删除。

推荐验证：`npm run build:check`、`npm run verify:codex-plugin`、`npm run report:agent-extraction-boundary`、`rg -n "\"ai\"|\"provider\": \"openai\"|contextualModel" config plugins/alembic-codex/runtime/config lib scripts test`。

是否需要升级或用户确认：需要总控确认字段删除、置空或改名策略，因为它是 shipped runtime config。

### SFC-PLUGIN-005：real-project 采集脚本和 fixture 仍留在 Plugin 仓库

现象：AlembicPlugin 仓库仍有 `scripts/collect-test-project-stats.mts`、`scripts/bench-real-projects.mts`，并把结果写入 tracked `test/fixtures/real-project-stats.json` / `real-project-bench.json`。其中 `real-project-stats.json` 包含 `/tmp/test-projects/...` 的绝对路径。该链路更像 AlembicTest / Core project intelligence 验证资产，不属于 Codex plugin runtime 自洽闭环。

证据：

- `scripts/collect-test-project-stats.mts:5` 到 `scripts/collect-test-project-stats.mts:9`：说明遍历 20 个真实测试项目并写入 `test/fixtures/real-project-stats.json`。
- `scripts/collect-test-project-stats.mts:19` 到 `scripts/collect-test-project-stats.mts:20`：项目来源按 repo parent 目录推导。
- `scripts/collect-test-project-stats.mts:147` 到 `scripts/collect-test-project-stats.mts:150`：直接写 tracked fixture。
- `scripts/bench-real-projects.mts:247` 到 `scripts/bench-real-projects.mts:250`：直接写 tracked benchmark fixture。
- `test/fixtures/real-project-stats.json:3` 等多处包含 `/tmp/test-projects/...`。
- `rg -n "collect-test-project-stats|bench-real-projects|real-project" package.json README.md README_CN.md scripts test` 显示这些脚本没有 package script 入口，主要是 standalone 采集脚本。

影响范围：仓库边界和 fixture hygiene。它没有进入常规 package scripts，但会把真实项目采集逻辑和环境路径留在 Plugin 仓库，后续容易被误用为 Plugin 自己的真实项目验证链路。

建议修复方式：下一阶段先归属判断。若保留历史性能基准，应迁到 `AlembicTest` 或 workspace 测试记录；若只作为静态 fixture，应把绝对路径归一化为 placeholder，并明确它不由 Plugin 日常测试生成。删除或迁移前需要确认是否还有未扫描到的历史报告消费方。

推荐验证：`rg -n "collect-test-project-stats|bench-real-projects|real-project-stats|real-project-bench" .`、`git ls-files test/fixtures/real-project-*.json scripts/*real-project*`、相关 fixture 消费单测。

是否需要升级或用户确认：需要总控确认归属，因为可能涉及迁到 `AlembicTest` 或删除历史测试资产。

## 未判定为问题的残留

- `dashboardUrl` 相关命中集中在 `lib/codex/EnhancementRoute.ts`、`lib/external/mcp/CodexMcpServer.ts`、`lib/codex/status/StatusService.ts`、`lib/http/routes/daemon.ts` 和 `scripts/smoke-codex-plugin.mjs`，语义是 Dashboard handoff / capability / daemon health，不是旧 Plugin-owned Dashboard frontend 或旧 HTTP compatibility operation layer。
- 旧 agent / external AI / MCP bridge 负向扫描没有发现生产链路命中；命中只在 `scripts/report-agent-extraction-boundary.mjs` 自身扫描标签中。
- `scratch/codex-plugin-dev-verify-report.json` 存在但未被 git 跟踪，且 `.gitignore` 已忽略 `scratch/`；本轮只记录为本地开发残留，不列入产品源码问题。
- `CHANGELOG.md` 中旧 Dashboard / AI provider 历史条目属于历史记录，不作为活产品 surface 问题。

## 验证命令与结果

| 命令 | 结果 | 摘要 |
| --- | --- | --- |
| `git status --short --branch` | 通过 | AlembicPlugin 为 `## main...origin/main`，自检前后无产品源码改动。 |
| `npm run lint` | 失败 | Biome 报 `Found 6 errors. Found 116 warnings. Found 29 infos.`，见 SFC-PLUGIN-001。 |
| `npm run lint:consumer-core-imports` | 通过 | 扫描 334 files 和 457 个 `@alembic/core` imports，Core import boundary OK。 |
| `npm run verify:release-package-boundary` | 通过 | root package private，root registry publish disabled，runtime 保持 `@alembic/core: file:vendor/AlembicCore`。 |
| `npm run verify:codex-plugin` | 通过 | Codex plugin verification passed，`runtime.tgz -> alembic-codex-plugin-runtime@0.2.0`。 |
| `npm run verify:codex-channel` | 通过 | Codex channel verification passed，版本 `0.2.0`。 |
| `npm run report:agent-extraction-boundary` | 通过 | source files scanned 334，agent / ai / tool outside implementation 均为 0。 |
| `npm run build:check` | 通过 | `build:core` 使用 `../AlembicCore @ a60dde335d76e901d31fd32eb7762bee35e7c9ea`，随后 `tsc --noEmit` 通过；AlembicCore status 检查保持 clean。 |
| `git diff --check` | 通过 | 无 whitespace error。 |
| `rg -n "@alembic/agent|#agent/|lib/agent|lib/external/ai|/api/v1/mcp/call|/api/v1/ai|discover-relations|dashboard-refine|monitoring/dashboard|alembic-ai|HOST_AI_MANAGED|hostManaged|legacyHostManaged" ...` | 通过 | 仅命中 `scripts/report-agent-extraction-boundary.mjs` 的扫描规则文本，无生产链路残留。 |

## 未运行命令与理由

- 未运行 `npm run test` / `npm run test:unit` / `npm run test:integration`：本轮只做自检且没有产品源码变更；当前 `npm run lint` 已给出明确失败基线，先回填由总控归类。
- 未运行 `npm run smoke:codex-plugin`、`npm run verify:codex-session`、daemon live smoke、插件安装或本机 cache refresh：这些会启动 runtime / daemon、触碰本机 Codex 插件状态或接近真实集成验证，不符合本轮“不直接修复、轻量自检”的边界。
- 未运行 `scripts/collect-test-project-stats.mts` / `scripts/bench-real-projects.mts`：它们会扫描真实项目并写 tracked fixtures，本轮只记录问题，不执行真实项目链路。
- 未运行发布、tag、push、registry 或 channel 发布命令：本轮不是发布修复。

## 遗留风险与下一步建议

- 下一阶段应优先把 SFC-PLUGIN-001 放入修复包，因为 lint 红会影响所有后续小修验收。
- SFC-PLUGIN-002 可以和 release boundary 文案修复合并，保持 root package artifact-only，不重新引入 npm registry publish。
- SFC-PLUGIN-003 和 SFC-PLUGIN-004 都属于 AI source / provider 可见边界，建议同包处理，但 `config/default.json` 字段删除或置空需要总控先判定 schema / runtime artifact 兼容。
- SFC-PLUGIN-005 可能涉及跨仓库归属，建议总控决定迁到 `AlembicTest`、归档为历史 fixture，还是删除并保留报告引用。
- 本轮未发现需要 AlembicTest 真实项目复测的立即断点；若下一阶段修复 release/runtime artifact、config/default 或 real-project fixture 归属，再由总控判断是否需要 AlembicTest 复核。
