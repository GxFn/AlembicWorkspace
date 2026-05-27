# LLM Input Optimization Agent Correctness

日期：2026-05-25
窗口：`AlembicAgent`
任务包：`LLMI-P1-AGENT-CORRECTNESS`
状态：已完成，待总控验收
提交：`6cff8beac414ca55eab4af85b31dfad0d1898711`

## 窗口定位与职责

当前窗口是 `AlembicAgent` 执行窗口。本轮只负责 Agent runtime 内部 LLM 输入 correctness：prompt 装配、Tool V2 `code.read` contract、SCAN planning / toolChoice 一致性和 targeted fixture。未修改 `AlembicCore`、`Alembic`、`AlembicDashboard`、`AlembicPlugin`、`AlembicTest` 或真实测试项目。

Alembic Recipes / Guard prime 未使用：`alembic_codex_diagnostics` 报告当前 Codex plugin runtime pin mismatch，且 `alembic_task prime` 返回当前项目无可用 knowledge base。本轮未初始化 Alembic 项目，按 workspace 文档、目标仓库 `AGENTS.md` 和真实代码证据执行。

## 完成范围

- 固定 LLM 输入 correctness fixture：新增 `test/llm-input-correctness.test.ts`，覆盖 async graph context、`code.read` schema、单文件 / 批量 / partial failure / 越界路径 / delta cache / batch 预算截断，以及 SCAN planning 与 `toolChoice=none` 的一致性。
- 修复 async graph context：`src/agent/prompts/insight-analyst.ts` 将 `CodeEntityGraphLike.generateContextForAgent(...)` 显式建模为 async / sync contract，并在 `buildAnalystPrompt(...)` 中 `await`，避免 `[object Promise]` 进入 prompt。
- 实现真实 batch read：`src/tools/v2/registry.ts` 和 `src/tools/v2/handlers/code.ts` 让 `code.read` 同时支持 `path` 单文件与 `filePaths` 批量读取，保留 `startLine` / `endLine`，新增 `maxLines`，并返回 batch per-file 结构。
- 收敛 prompt 示例：`src/agent/capabilities/CodeAnalysis.ts` 使用 Tool V2 真实 `params` 包装形式，避免旧式伪参数示例。
- 收敛 SCAN planning：`src/agent/context/exploration/PlanTracker.ts` 不再要求 `SCAN` 同轮执行工具，改为等待下一轮或仅在工具开放阶段调用工具。
- 更新信号检测：`src/agent/context/exploration/SignalDetector.ts` 识别 `params.filePaths`，让 batch read 的多文件读取仍能计入新文件信号。

## 关键代码证据

- Prompt async contract：`src/agent/prompts/insight-analyst.ts`
- Tool V2 registry contract：`src/tools/v2/registry.ts`
- Tool V2 read handler：`src/tools/v2/handlers/code.ts`
- SCAN planning 文案：`src/agent/context/exploration/PlanTracker.ts`
- Batch file signal：`src/agent/context/exploration/SignalDetector.ts`
- Capability prompt 示例：`src/agent/capabilities/CodeAnalysis.ts`
- Targeted fixture：`test/llm-input-correctness.test.ts`

## Batch Read 边界

- 最大文件数：`filePaths` 每次最多 5 个文件；超过上限直接失败，不执行批量读取。
- 参数互斥：`path` 与 `filePaths` 不能同时提供；单文件 `path` 兼容旧行为。
- 读取范围：批量读取沿用单文件逻辑，支持 `startLine` / `endLine`；新增 `maxLines` 用于在无显式 `endLine` 时限制每个文件返回行数。
- Adaptive 输出：小文件返回带行号内容；大文件沿用 AST outline / head-tail fallback；重复读取沿用 delta cache。
- Partial failure：批量读取中只要至少一个文件成功，整体 `ok=true`，失败文件以 per-file `error` 返回；全部失败时整体 `ok=false`，并保留 per-file 失败详情。
- 预算 / max output：batch read 使用 `min(ctx.tokenBudget, 5000)` 作为本次批量输出上限，并按文件数分配 per-file token budget；单个文件超预算时保留头尾并标记 `truncated` / `originalTokensEstimate`。Router 的 `maxOutputTokens=5000` 仍保留为 action-level 上限。
- Delta cache：每个文件用项目相对路径作为 delta cache key；重复 batch read 会逐文件返回 `[unchanged since last read]`。
- Path safety：所有 read / outline / structure / write 均通过 `path.relative(projectRoot, absPath)` 判断是否越界；越界路径返回 `Access denied: path is outside project root`，不读取。

## 验证命令与结果

```text
npm test -- llm-input-correctness
# 1 file / 5 tests passed

npm test -- llm-input-correctness ExplorationStrategies tool-v2-contract
# 3 files / 15 tests passed

npm run typecheck
# passed

npm run lint
# passed

npm run lint:agent-import-boundary
# AlembicAgent import boundary check passed

npm run lint:public-api-boundary
# AlembicAgent public API boundary OK

npm run lint:core-import-boundary
# Core import boundary OK: scanned 231 files and 48 @alembic/core imports

git diff --check
# passed

npm run check
# build:check + lint + boundary checks + full vitest passed; 20 files / 96 tests passed
```

## 未做事项

- 未做 section 化 input assembly / stage-specific input profile。
- 未做 Observation Ledger 替换 raw observation dump。
- 未做完整 redacted prompt artifact 持久化。
- 未做 Dashboard artifact 展示。
- 未创建 AlembicTest test-mode 复测单。
- 未启用或调整 L4 compaction。

## 遗留风险

- Batch read 当前在 `AlembicAgent` 内闭合；真实冷启动 / rescan 输入 artifact 仍需后续 AlembicTest 用 test-mode 验证。
- `code.read` batch 的 structuredContent 已有 per-file 结构，但更完整的 developer-visible artifact 分层仍依赖后续 Wave 2-4。
- Alembic project knowledge / Guard 上下文在本窗口不可用，后续总控如需 Guard 级验收，需要先修复或切换 Alembic Codex runtime 状态。

## 下一步建议

- 总控验收 `AlembicAgent` 提交 `6cff8beac414ca55eab4af85b31dfad0d1898711` 后，启动 Wave 2：section 化 input assembly、Analyze / Record / Summarize / Produce 输入 profile 和重复 prompt policy 收敛。
- Wave 2 后再进入 Observation Ledger；不要让 Dashboard 或 Alembic artifact 提前消费未稳定的 input contract。
- 在 Agent correctness 通过总控验收后，给 `AlembicTest` 创建 test-mode 复测单，验证真实 retained input 不再出现 `[object Promise]`，且 batch read 不再触发 `Missing required param "path"`。
