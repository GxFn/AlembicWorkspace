# LLM Input Optimization Wave 6

日期：2026-05-25
状态：总控验收通过
发送给：无
主线目标：在 Wave 1-5 已完成 source、artifact、Dashboard 和 test-mode UI/API 验证后，补齐 `AlembicAgent` package/runtime 产物链路，确保后续 test-mode / 小 cold-start 集成验证不会消费旧 `dist`。

## 目标判断

用户当前目标仍是 LLM 输入优化主线；`AlembicTest` 已完成 Wave 6B package/runtime 集成验证并通过总控验收，LLM 输入优化 Wave 1-6 已形成完整闭环。

已完成：

- Wave 1 correctness：`AlembicAgent` 提交 `6cff8beac414ca55eab4af85b31dfad0d1898711`，`AlembicTest` Test-05 通过总控验收。
- Wave 2 input layering：`AlembicAgent` 提交 `bf0a2c2cb0c3d760817ac699e5f47d83e0e5b4d9`，`AlembicTest` Test-06 通过总控验收。
- Wave 3 Observation Ledger：`AlembicAgent` 提交 `8970327d73bf6c01476a1aeb5384f014483b68dd`，`AlembicTest` Test-07 通过总控验收。
- Wave 4 artifact / trace / metrics producer：`Alembic` 提交 `aa5419434d51aa4d944c3614ecebd8aff47a009f`，总控验收通过。
- Wave 5 Dashboard artifact detail：`AlembicDashboard` 提交 `30b376cd3b5539d3fac0db2e019c4136bb98212d`，`AlembicTest` Test-08 已通过总控验收，证明 UI / API / artifact / secret 边界闭合。

完成结论：

- `GTODO-2026-05-25-002` 上游门禁已由 `AlembicAgent` 回填并通过总控验收：ignored `dist`、staged package 和 pack preview 都包含 Wave 1-3 输入结构、runtime layer、Observation Ledger 和 Tool V2 batch read 能力。
- Wave 6B 已由 `AlembicTest` 回填并通过总控验收：package-shape harness 消费 `AlembicAgent/tmp/release/@alembic-agent`，证明下游可加载最新 staged runtime artifact，不落回 source-transform / `src/` 路径。
- 按用户 2026-05-25 明确规则，`AlembicTest` 自身未提交 probe / 报告资产不作为验收阻塞；本轮提交 hash 可记录为 `无`。
- `GTODO-2026-05-24-040` 和 `GTODO-2026-05-25-002` 判定为已完成待归档；`GTODO-2026-05-25-003` 可在用户确认后作为下一主线候选。

## 本波完成定义

本波完成后必须具备：

- `AlembicAgent` 本地 build 能生成最新 `dist`，至少包含 `dist/agent/runtime/LLMInputAssembly.js`、更新后的 `dist/agent/runtime/AgentRuntime.js`、Tool V2 batch read 相关产物和 Observation Ledger 相关产物。
- 公开 package exports / imports 仍指向合法 `dist` 入口，public import smoke 通过。
- release staging / package guard / pack preview 能证明发布包会带上最新 `dist`，不会继续消费旧 dynamicContext-only 路径。
- 若 `dist/` 按仓库规则保持 ignored，不提交 ignored build artifact；但必须回填本地产物路径、关键文件存在性、pack preview / staged package 证据和必要 hash / 摘要。
- 不改 `Alembic`、`AlembicDashboard`、`AlembicPlugin`、`AlembicCore` 或真实测试项目源码。
- 不启动 `GTODO-2026-05-25-003` 的 Agent / LLM 优化循环；本波只关闭 package/runtime 产物门禁。

## 阶段顺序

1. Wave 6A / Agent package-runtime producer：`AlembicAgent` 刷新并验证 dist / staged package，已通过总控验收。
2. Wave 6B / Package-runtime integration verification：`AlembicTest` 已回填 package/runtime 集成链路验证，并通过总控验收。
3. Wave 6B 通过后，`GTODO-2026-05-24-040` 判定完整闭合；`GTODO-2026-05-25-003` 后续按目标确认提升为下一主线候选。

## 任务包

| 任务包 ID | 窗口 | 摘要 | 状态 |
| --- | --- | --- | --- |
| LLMI-P10-AGENT-DIST-RUNTIME-PACKAGE | `AlembicAgent` | 刷新并验证 dist / release package runtime 产物，关闭 `GTODO-2026-05-25-002` 的上游门禁。 | 总控验收通过 |
| Test-2026-05-25-09 / LLMI-P11-Package-Runtime-Integration | `AlembicTest` | 验证 package/runtime 或小 cold-start 集成链路真实消费 staged / rebuilt runtime artifact。 | 总控验收通过 |

### LLMI-P10-AGENT-DIST-RUNTIME-PACKAGE：Agent package runtime producer

窗口：`AlembicAgent`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 16:21 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 16:37 CST

阶段目标：

- 让 `AlembicAgent` 的实际 package/runtime 产物追上 Wave 1-3 source 实现。
- 为后续 `AlembicTest` package/runtime 或小 cold-start 集成验证提供可信上游证据。

主线动作：

- 先读取本 workspace `AGENTS.md`、`docs/workspace/index.md`、本文档、`docs/workspace/current/llm-input-optimization-wave-1-2026-05-25.md`、`docs/workspace/current/llm-input-optimization-wave-2-2026-05-25.md`、`docs/workspace/current/llm-input-optimization-wave-3-2026-05-25.md` 和 `AlembicAgent/AGENTS.md`，并声明当前窗口定位和本轮仓库职责。
- 检查 `AlembicAgent` source 与 package runtime 产物链路：`tsconfig`、`package.json` exports/imports、`dist/`、release staging 和 pack preview。
- 运行 build 生成最新 ignored `dist/`；不要为了提交而强行跟踪 `dist/`。
- 验证关键 compiled runtime 文件存在，并能从 package public exports / runtime exports 路径导入。
- 验证 staged publish package / pack preview 包含最新 dist；记录 staged package 路径、pack preview 摘要和关键文件列表。
- 如果发现 package scripts、exports 或 release staging 无法覆盖新 runtime 文件，允许在 `AlembicAgent` 仓库内做最小真实修复并提交；否则回填 no-source-change + 产物证据。
- 回填执行记录到 `docs/AlembicAgent/llm-input-optimization-agent-runtime-package-2026-05-25.md`，并从当前计划挂回。

合并 TODO：

- `GTODO-2026-05-25-002`：`AlembicAgent/dist` 未刷新，source test-mode 通过但 package/runtime/cold-start 验证前会消费旧产物。

明确不包含：

- 不修改 `Alembic` producer、Dashboard UI、Codex Plugin host-agent route 或 Core contract。
- 不跑 full cold-start / rescan。
- 不实现 `GTODO-2026-05-25-003` 的优化循环。
- 不提交 ignored `dist/` 或临时 pack preview 产物，除非目标仓库规则另有明确要求。

下一处真实阻塞点：

- 在 `AlembicAgent` 没有刷新并证明 package/runtime 产物前，`AlembicTest` 无法判断真实运行链路是否仍在消费旧 `dist`。

阻塞点之前还能做：

- 本包应一次完成 build、关键 dist 文件检查、public import smoke、release package guard、pack preview 和回填证据；不要只运行 typecheck 后宣布完成。

验证命令：

```text
npm run build
npm run smoke:public-imports
npm run release:package-guard
npm run release:pack-preview
npm run check
git diff --check
```

可按 `AlembicAgent/AGENTS.md` 补充等价 targeted 命令；若某命令因既有环境限制无法运行，必须写清原因、替代证据和是否阻塞。

回填要求：

- 完成范围、文件 / 模块变化、提交 hash；若无源码变更，明确写 `no source commit`。
- 关键 dist 文件存在性：`LLMInputAssembly`、`AgentRuntime`、Tool V2 batch read、Observation Ledger 相关产物。
- package public import / runtime import smoke 结果。
- release stage / pack preview 路径、文件列表摘要和是否包含最新 dist。
- 验证命令和结果。
- 遗留风险和是否可以启动 `AlembicTest` Wave 6B。

执行前置硬规则：

- 先读取目标仓库 `AlembicAgent/AGENTS.md`，并明确当前窗口定位 / 仓库职责。

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 / 推荐窗口 | 事项 / 目标 | 影响复测 / 派发 | 下一步 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GTODO-2026-05-24-040 | 已完成待归档 | internal agent llm input optimization | P0 | `AlembicTest` / 总控 | LLM 输入优化闭环。Wave 1-5、Wave 6A 和 Test-09 package/runtime integration 均已通过总控验收。 | 否 | 主线已完整闭合；后续归档时移入历史记录。 |
| GTODO-2026-05-25-002 | 已完成待归档 | build artifact sync | P1 | `AlembicAgent` / `AlembicTest` | `AlembicAgent/dist` 未刷新，source test-mode 通过但 package/runtime/cold-start 验证前会消费旧产物。 | 否 | Agent 已刷新 ignored `dist`、验证 staged package 和 pack preview；Test-09 已证明下游 package/runtime 消费 staged artifact。后续归档时移入历史记录。 |
| GTODO-2026-05-25-003 | 下一主线候选 | agent / llm optimization loop | P0 | `AlembicAgent` / `Alembic` / `AlembicDashboard` / `AlembicTest` | 监控可视化闭环建立后，用 baseline、artifact、trace 和 metrics 优化 Agent / LLM 输入输出，并结合 `progressive-chain-validation` 做节点级 baseline。 | 是 | 等 `GTODO-2026-05-24-040` 完整完成并归档后，经目标确认提升为下一主线。 |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `Alembic` | 已完成 | 否 | Wave 4 producer 已由总控验收通过；本波只处理 Agent package/runtime。 |
| `AlembicCore` | 观察中 | 否 | 暂不下沉 contract；若 Agent 发现 Core 必改，先回填阻塞。 |
| `AlembicAgent` | 已完成 | 否 | Wave 6A package/runtime producer 已通过总控验收；本轮无返工任务。 |
| `AlembicDashboard` | 已完成 | 否 | Wave 5 consumer 已通过 Test-08 验收；本波不改 UI。 |
| `AlembicPlugin` | 无任务 | 否 | 本主线是 Alembic internal Agent 运行链路，不改变 Codex Plugin host-agent 路由。 |
| `AlembicTest` | 已完成 | 否 | Test-09 package/runtime 集成验证已通过总控验收。 |
| `BiliDili` | 无任务 | 否 | 不改真实 iOS 项目源码。 |

## 窗口分派

发送给：无

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>已完成 | Wave 4 producer 已验收；本波无任务。 |
| `AlembicCore`<br>观察中 | 暂无任务；如 Agent 发现 Core contract 缺口再回填阻塞。 |
| `AlembicAgent`<br>已完成 | `LLMI-P10-AGENT-DIST-RUNTIME-PACKAGE` 已通过总控验收；本轮无返工任务。 |
| `AlembicDashboard`<br>已完成 | Wave 5 Dashboard artifact detail 已通过 Test-08；本波无任务。 |
| `AlembicPlugin`<br>无任务 | 不参与本轮。 |
| `AlembicTest`<br>已完成 | `Test-2026-05-25-09 / LLMI-P11-Package-Runtime-Integration` 已通过总控验收。 |
| `BiliDili`<br>无任务 | 不参与本轮。 |

## 可复制分派提示词

发送给：无。

```text
当前无新的执行窗口可发送提示词；LLM 输入优化 Wave 6 已通过总控验收。
```

## 回填区

- 2026-05-25 17:14 CST：总控验收 `Test-2026-05-25-09 / LLMI-P11-Package-Runtime-Integration` 通过。复核 package-shape harness 真实消费 staged `@alembic/agent`，runtime import 未落回 `src/`，manifest 无 local dependency，batch `code.read({ filePaths })`、Observation Ledger、LLM input runtime layer、`noObjectPromise` 和 `noMissingRequiredPath` 均满足 Wave 6B 验收目标。按用户 2026-05-25 明确规则，`AlembicTest` 自身未提交 probe / 报告资产不作为验收阻塞；本轮提交 hash 记录为 `无`。`GTODO-2026-05-24-040` 与 `GTODO-2026-05-25-002` 判定已完成待归档。
- 2026-05-25 16:55 CST：`AlembicTest` 回填 `Test-2026-05-25-09 / LLMI-P11-Package-Runtime-Integration` 通过。新增 `AlembicTest/scripts/probe-package-runtime-integration.mjs` 和报告 [../../../AlembicTest/docs/llm-input-package-runtime-integration-2026-05-25.md](../../../../../AlembicTest/docs/llm-input-package-runtime-integration-2026-05-25.md)。验证命令 `node --check AlembicTest/scripts/probe-package-runtime-integration.mjs`、`node AlembicTest/scripts/probe-package-runtime-integration.mjs --help`、`npm --prefix AlembicTest run check`、`ALEMBIC_TEST_MODE=1 node AlembicTest/scripts/probe-package-runtime-integration.mjs` 均通过。证据 JSON `AlembicTest/tmp/llm-input-package-runtime-integration.json` 显示 staged package `AlembicAgent/tmp/release/@alembic-agent` 为 `@alembic/agent@0.2.0`、`@alembic/core=0.2.0`、local dependency 数量 `0`，pack shasum `dbd390be0d13cca816c1bdb6de354b1838aca55f`；runtime harness public import 解析到 `node_modules/@alembic/agent/dist/...` 且 symlink target 为 staged package，`noSrcResolution=true`；`code.read({ filePaths })` batch read `requested=2 / succeeded=2 / failed=0`；Observation Ledger 与 `# LLM input runtime layer` 均由 staged runtime 生成；`noObjectPromise=true`、`noMissingRequiredPath=true`。`Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicPlugin`、`AlembicDashboard`、`BiliDili` 收口时 `git status --short` 均为空；本轮未跑 full cold-start、未启动 Dashboard、未操作 BiliDili、未修改产品源码。提交 hash：无。
- 2026-05-25 16:37 CST：总控验收 `AlembicAgent` Wave 6A / `LLMI-P10-AGENT-DIST-RUNTIME-PACKAGE` 通过。复核 `docs/AlembicAgent/llm-input-optimization-agent-runtime-package-2026-05-25.md`、`AlembicAgent` 工作区、ignored `dist/` 和 staged package 证据；确认本轮 `no source commit`，`git status --short` 为空，最新 tracked source commit 仍为 `8970327 Add observation ledger dynamic context`。抽查 `dist/agent/runtime/LLMInputAssembly.js`、`dist/agent/runtime/AgentRuntime.js`、`dist/agent/memory/ActiveContext.js`、`dist/tools/v2/handlers/code.js`、`dist/tools/v2/registry.js` 存在；staged package `tmp/release/@alembic-agent/package.json` 为 `@alembic/agent@0.2.0`、`@alembic/core=0.2.0`、无 local `file:../` dependency；staged runtime exports 可导入，`buildLlmInputAssembly`、`AgentRuntime`、`V2ToolRouterAdapter` 可用；内容扫描确认 runtime layer、Observation Ledger 和 batch `filePaths` 逻辑进入 staged dist。`release:package-guard` 非零为 root local-source-first manifest 的预期负向 guard，不阻塞 staged package 验收。已创建 `Test-2026-05-25-09 / LLMI-P11-Package-Runtime-Integration`，当前发送给 `AlembicTest`。
- 2026-05-25 16:31 CST：`AlembicAgent` 回填 `LLMI-P10-AGENT-DIST-RUNTIME-PACKAGE` 完成，记录见 [../../AlembicAgent/llm-input-optimization-agent-runtime-package-2026-05-25.md](../../../../AlembicAgent/llm-input-optimization-agent-runtime-package-2026-05-25.md)。本轮 `no source commit`，`git status --short` 为空；已运行 `npm run build` 生成 ignored `dist/`，确认 `dist/agent/runtime/LLMInputAssembly.js`、`dist/agent/runtime/AgentRuntime.js`、`dist/agent/memory/ActiveContext.js`、`dist/tools/v2/handlers/code.js`、`dist/tools/v2/registry.js` 存在。`npm run smoke:public-imports` 通过，15 个 public subpaths 可导入、5 个 forbidden subpaths 正确拒绝；`npm run release:package-guard` 预期阻断 root local-source-first manifest 的 `file:../AlembicCore` 直接发布；`npm run release:pack-preview` 通过，staged package `tmp/release/@alembic-agent` 使用 `@alembic/core@0.2.0`、无 local `file:../` dependency，dry-run tarball `alembic-agent-0.2.0.tgz` entry count 417、size 450,194、unpacked size 1,736,153、shasum `dbd390be0d13cca816c1bdb6de354b1838aca55f`。`npm run check` 通过 22 个 test files / 104 tests，`git diff --check` 通过。随后总控已于 16:37 CST 验收通过并创建 `AlembicTest` Wave 6B package/runtime 集成验证。
- 2026-05-25 16:21 CST：总控验收 `AlembicTest` Test-08 通过并创建本 Wave 6。当前只发送给 `AlembicAgent`；`AlembicTest` 等上游产物证据后再启动。
