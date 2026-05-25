# LLM Input Optimization Agent Runtime Package

日期：2026-05-25
窗口：`AlembicAgent`
任务包：`LLMI-P10-AGENT-DIST-RUNTIME-PACKAGE`
状态：总控验收通过，已转 AlembicTest Test-09

## 当前窗口定位和仓库职责

- 当前窗口定位：`AlembicAgent` 执行窗口。
- 本轮仓库职责：只负责 `AlembicAgent` 的 Agent runtime、tool system、memory/context、prompt 和 package/runtime 产物链路验证。
- 边界：不修改 `Alembic`、`AlembicCore`、`AlembicDashboard`、`AlembicPlugin`、`AlembicTest` 或真实测试项目源码；不提交 ignored `dist/` / `tmp/` 产物。

## 完成范围

- 已运行 `npm run build` 刷新本地 ignored `dist/`。
- 已确认 runtime package 产物包含 Wave 1-3 的关键能力：
  - LLM input assembly：`dist/agent/runtime/LLMInputAssembly.js`
  - Agent runtime assembly wiring：`dist/agent/runtime/AgentRuntime.js`
  - Observation Ledger：`dist/agent/memory/ActiveContext.js`
  - Tool V2 batch read handler：`dist/tools/v2/handlers/code.js`
  - Tool V2 registry schema / summary：`dist/tools/v2/registry.js`
- 已运行 public import smoke，证明 package public exports/imports 仍可用。
- 已运行 release staging / pack preview，证明 staged publish package 会携带最新 `dist`，并把 local `file:../AlembicCore` 开发依赖转换为 registry version。
- 未发现需要修改 source、package scripts 或 exports 的问题。

## 提交 Hash

- `no source commit`
- 本轮未修改 `AlembicAgent` tracked source；`git status --short` 为空。
- Staged package metadata 记录：
  - `@alembic/agent` source commit：`8970327d73bf6c01476a1aeb5384f014483b68dd`
  - `@alembic/core` source commit：`b72390f2066f6406ce432b7dc94448dcd05862a3`

## 验证命令

| 命令 | 结果 |
| --- | --- |
| `npm run build` | 通过，生成最新 ignored `dist/`。 |
| `npm run smoke:public-imports` | 通过：15 个 public subpaths 可导入，5 个 forbidden subpaths 正确拒绝。 |
| `npm run release:package-guard` | 预期阻断：root dev manifest 仍含 `@alembic/core=file:../AlembicCore`，guard 正确禁止直接发布根包。该非零结果不阻塞 staged publish；正向证据见 `release:pack-preview`。 |
| `npm run release:pack-preview` | 通过，生成 `tmp/release/@alembic-agent` 并 dry-run pack。 |
| `npm run check` | 通过：build check、lint、三项 boundary lint 和 22 个 test files / 104 tests 均通过。 |
| `git diff --check` | 通过。 |
| `node -e "Promise.all([import('./tmp/release/@alembic-agent/dist/agent/runtime/index.js'), import('./tmp/release/@alembic-agent/dist/tools/v2/index.js')])..."` | 通过，staged runtime exports 可导入，`buildLlmInputAssembly`、`AgentRuntime`、`TOOL_REGISTRY`、`V2ToolRouterAdapter`、`OutputCompressor`、`DeltaCache` 均存在。 |

## Dist / Package Artifact 证据

本地 ignored `dist/` 关键文件存在：

| 文件 | 大小 |
| --- | ---: |
| `dist/agent/runtime/LLMInputAssembly.js` | 9,686 bytes |
| `dist/agent/runtime/AgentRuntime.js` | 88,276 bytes |
| `dist/agent/memory/ActiveContext.js` | 45,628 bytes |
| `dist/tools/v2/handlers/code.js` | 25,019 bytes |
| `dist/tools/v2/registry.js` | 22,710 bytes |

Staged package 关键文件存在：

| 文件 | 大小 |
| --- | ---: |
| `tmp/release/@alembic-agent/dist/agent/runtime/LLMInputAssembly.js` | 9,686 bytes |
| `tmp/release/@alembic-agent/dist/agent/runtime/AgentRuntime.js` | 88,276 bytes |
| `tmp/release/@alembic-agent/dist/agent/memory/ActiveContext.js` | 45,628 bytes |
| `tmp/release/@alembic-agent/dist/tools/v2/handlers/code.js` | 25,019 bytes |
| `tmp/release/@alembic-agent/dist/tools/v2/registry.js` | 22,710 bytes |

内容扫描证据：

- `tmp/release/@alembic-agent/dist/agent/runtime/LLMInputAssembly.js:1` 导出 `buildLlmInputAssembly`。
- `tmp/release/@alembic-agent/dist/agent/runtime/LLMInputAssembly.js:199` 包含 `# LLM input runtime layer`。
- `tmp/release/@alembic-agent/dist/agent/runtime/AgentRuntime.js:45` 导入 `buildLlmInputAssembly`；`AgentRuntime.js:669` 调用 input assembly。
- `tmp/release/@alembic-agent/dist/agent/memory/ActiveContext.js:422` / `:740` 包含 Observation Ledger 组装逻辑。
- `tmp/release/@alembic-agent/dist/tools/v2/handlers/code.js:261` 定义 `MAX_BATCH_READ_FILES = 5`；`:264-323` 处理 `filePaths` batch read、互斥 `path` / `filePaths`、partial failure 汇总。
- `tmp/release/@alembic-agent/dist/tools/v2/registry.js:46-52` 声明 `code.read` 支持 single path 或 batch `filePaths`。

Pack preview 摘要：

- staging dir：`tmp/release/@alembic-agent`
- package：`@alembic/agent@0.2.0`
- staged `@alembic/core` dependency：`0.2.0`
- staged manifest local `file:../` dependency：无
- dry-run tarball：`alembic-agent-0.2.0.tgz`
- entry count：417
- size：450,194 bytes
- unpacked size：1,736,153 bytes
- shasum：`dbd390be0d13cca816c1bdb6de354b1838aca55f`
- bundled：`[]`

## Batch Read 边界

- `code.read` 继续支持单文件 `path`。
- batch read 使用 `filePaths`，最多 5 个文件。
- `path` 与 `filePaths` 互斥。
- batch read 对每个文件单独读取和统计，允许 partial failure，并在 structured result 中保留 `requested`、`succeeded`、`failed`、`partialFailure`、`maxFiles`。
- 本轮只验证 compiled/runtime/package 产物包含该能力；功能 correctness 已由 Wave 1 source + Test-05 验证。

## 未做事项

- 未提交 `dist/` 或 `tmp/release`，因为二者按仓库规则为 ignored artifact。
- 未发布 npm package。
- 未启动 full cold-start / rescan / package-runtime integration；该步骤应由后续 `AlembicTest` Wave 6B 承接。
- 未修改 `release:package-guard`，因为当前非零结果是 guard 对 root local-source-first dev manifest 的预期阻断；staged publish 正向链路由 `release:pack-preview` 证明。

## 遗留风险

- `release:package-guard` 对根 manifest 返回非零，需要总控验收时按“root 禁止直接发布”的负向 guard 语义解释；真正 publish preview 以 staged manifest / pack preview 为准。
- `dist/` 和 `tmp/release` 是本地 ignored artifact，后续 package/runtime 验证窗口需要先运行或消费 staged package 证据，不能假设这些产物已进入 git。
- 尚未做 package/runtime 或小 cold-start 集成验证，仍需 `AlembicTest` 验证下游真实消费不会落回旧 `dist`。

## 下一步建议

- 总控验收本回填后，创建 `AlembicTest` Wave 6B / `Test-2026-05-25-09`，验证 package/runtime 或小 cold-start 链路消费 staged / rebuilt runtime artifact。
- 若后续验收要求 `release:package-guard` 必须零退出，需要另开 source 任务调整 guard 语义；本轮不建议为通过命令而移除 root `file:../AlembicCore` 本地开发依赖。

## 总控验收（2026-05-25 16:37 CST）

- 复核结论：通过，关闭 `LLMI-P10-AGENT-DIST-RUNTIME-PACKAGE` 上游门禁。
- 证据判断：本轮 `no source commit` 合理；`AlembicAgent` tracked source 未变，`git status --short` 为空，最新 source commit 仍为 `8970327 Add observation ledger dynamic context`。ignored `dist/` 和 `tmp/release` 均由 package/runtime 验证产生，不应提交。
- 产物复核：总控抽查 `dist/agent/runtime/LLMInputAssembly.js`、`dist/agent/runtime/AgentRuntime.js`、`dist/agent/memory/ActiveContext.js`、`dist/tools/v2/handlers/code.js`、`dist/tools/v2/registry.js` 均存在；staged package manifest 为 `@alembic/agent@0.2.0`、`@alembic/core=0.2.0`，无 local `file:../` dependency。
- 运行复核：总控额外导入 staged runtime exports，确认 `buildLlmInputAssembly`、`AgentRuntime`、`V2ToolRouterAdapter` 可用；内容扫描确认 `# LLM input runtime layer`、Observation Ledger 和 batch `filePaths` read 逻辑进入 staged dist。
- `release:package-guard` 判断：root local-source-first manifest 被阻断是预期负向 guard，不代表 staged publish 链路失败；正向证据以 `release:pack-preview` 和 staged manifest 为准。
- 下一步：已创建 `Test-2026-05-25-09 / LLMI-P11-Package-Runtime-Integration`，交给 `AlembicTest` 验证 package/runtime 或小 cold-start 集成链路真实消费最新 Agent runtime。
