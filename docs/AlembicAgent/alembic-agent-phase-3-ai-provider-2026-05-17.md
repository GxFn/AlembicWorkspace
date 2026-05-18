# AlembicAgent Phase 3 AI Provider Migration

日期：2026-05-17
阶段：Phase 3 - 迁移 AI Provider 与模型路由
范围：只修改 `AlembicAgent` 仓库；只读参考 `Alembic` 主仓库；未修改 `Alembic`、`AlembicPlugin`、`AlembicCore`。

## 完成内容

Phase 3 已完成。`src/external/ai/**` 在 Phase 2 已从 `Alembic/lib/external/ai/**` 复制进 `AlembicAgent`，本轮将其正式作为 AlembicAgent 的 AI provider/model routing 能力对外暴露，并补齐验收测试。

新增/调整：

- `src/external/ai/index.ts`：新增 AI provider barrel。
- `package.json`：新增 `./ai` package export，指向 `dist/external/ai/index.js` 和对应声明文件。
- `src/index.ts`：根入口导出 `./external/ai/index.js`，package metadata 升级为 `phase-3-ai-provider`。
- `test/ai-provider.test.ts`：新增 provider、参数约束、错误分类、模型路由和 manager 切换测试。

## 公开入口

Phase 3 后，主仓库/宿主代码应优先从以下入口消费 Agent 的 AI 能力：

```ts
import {
  AiProvider,
  AiProviderManager,
  MockProvider,
  ModelRegistry,
  ParameterGuard,
  PROVIDER_CONFIGS,
} from '@alembic/agent/ai';
```

根入口 `@alembic/agent` 也会导出同一组 AI 能力，便于主仓库/宿主渐进迁移；需要直接接入 Agent package 的宿主代码建议使用 `@alembic/agent/ai`，让边界更清晰。`AlembicPlugin` 不属于这个接入方，它不引入 `AlembicAgent` 依赖。

## 与主仓库源文件差异

`src/external/ai/**` 与 `Alembic/lib/external/ai/**` 继续保持真实实现一致；本轮新增的唯一差异是 AlembicAgent 自己的 public barrel：

```text
Only in src/external/ai: index.ts
```

没有从 `AlembicPlugin` 合并 provider 实现；Plugin 仍只作为删除对象和 adapter 参考。

## 测试覆盖

新增测试覆盖 Phase 3 验收项：

- Provider 成功路径：`MockProvider.chat`、`chatWithTools`、`embed`。
- Provider 失败路径：HTTP 400 非重试错误不触发 circuit breaker。
- 超时错误分类：`ETIMEDOUT` 作为可重试/服务错误进入 circuit breaker。
- 取消路径：`AbortError` 不重试、不改变 circuit breaker 状态。
- 参数校验：`ParameterGuard` clamp allowed params，并过滤 unsupported/topP/toolChoice/reasoningEffort。
- 模型路由：`ModelRegistry.resolveOrCreate` 动态模型定义。
- Provider config：`PROVIDER_CONFIGS`、`getProviderConfig`。
- Manager 切换：`AiProviderManager` 在 provider switch 时重挂 token tracking 并触发 listener。

## 验证结果

已通过：

- `npm run build:check`
- `npm run lint`
- `npm run lint:agent-import-boundary`
- `npm run test`
- `npm run check`
- `npm run build`
- `node -e "import('./dist/index.js')..."`
- `node -e "import('./dist/external/ai/index.js')..."`

Smoke import 结果：

```json
{"hasAgentRuntime":true,"hasMockProvider":true,"hasModelRegistry":true,"phase":"phase-3-ai-provider"}
```

```json
{"hasMockProvider":true,"hasParameterGuard":true,"providerConfigs":5}
```

说明：`npm run lint` 返回成功，但 Biome 对迁入的原始 Agent/AI 源码仍报告 27 个 warning，主要是 non-null assertion、unused import/private member 和 optional-chain 风格建议。本阶段为保持行为不变未做批量清理。

## 交给 Alembic 窗口的接入任务

`Alembic` 主仓库仍不要立即删除 `lib/external/ai/**`。Phase 3 后可以开始做接入准备：

1. 在主仓库扫描 `#external/ai/*`、`lib/external/ai` 和相对路径引用，形成替换清单。
2. 将 provider、transport、model registry、parameter guard、LLM gateway 的消费点切到 `@alembic/agent/ai`。
3. 保留 API key 来源、Dashboard AI Settings、CLI/daemon 配置读取、环境变量解析作为主仓库宿主 adapter；不要把这些宿主交互迁回 Agent package。
4. 删除候选：完成替换并验证后，`Alembic/lib/external/ai/**` 可删除。
5. 删除前必须提供 import 扫描结果、build/check/lint 结果，以及 CLI/daemon/Dashboard AI settings smoke 证据。

## 交给 AlembicPlugin 窗口的宿主适配与删除逻辑

`AlembicPlugin` 可以优先处理重复 AI provider 删除，因为该目录与主仓库源实现一致，AlembicAgent 已有正式入口和测试。但 Plugin 不能新增 `@alembic/agent` dependency，也不能 import `@alembic/agent/ai`；它应删除内置 provider，并通过宿主 agent/config contract 使用 AI 能力。

任务：

1. 不为 Plugin 接入 `@alembic/agent` dependency，开发期也不要使用 `file:../AlembicAgent`。
2. 扫描 `AlembicPlugin/lib/**` 中所有 `#external/ai/*`、`lib/external/ai`、相对 AI provider 引用。
3. 删除 provider、transport、model registry、parameter guard、LLM gateway 的内置 import；必要调用改到宿主 agent/config adapter。
4. 保留 `lib/external/mcp/**`、Codex MCP schema/envelope/session/policy、skills、injectable-skills、plugins、channels 和 release/smoke/verify 脚本。
5. 删除候选：宿主 adapter 替代路径验证完成后删除 `AlembicPlugin/lib/external/ai/**`。
6. 删除前必须运行 import 扫描；删除后至少运行 `npm run build:check`、`npm run lint -- --diagnostic-level=error`、`npm run lint:core-import-boundary`、`npm run smoke:codex-plugin`、`npm run verify:codex-plugin`。
7. 如果发现 Plugin 专属 AI config/env 读取逻辑，保留在 Plugin adapter 中；provider 执行能力由宿主 agent 提供，不由 Plugin 直接依赖 `@alembic/agent/ai`。

## 下一阶段

下一轮进入 Phase 4：迁移通用 Tool System。

Phase 4 应在当前 `src/tools/**` 基础上：

- 明确 tool core/catalog/v2/workflow 的 Agent-owned 子集。
- 保留宿主专属 adapter，例如 Codex MCP handler、Dashboard operation、Mac/native 系统能力。
- 补 tool router、permission、timeout/cancel、error envelope 测试。
- 更新 Alembic 的 tool 接入清单，以及 AlembicPlugin 的宿主 agent adapter / 删除清单。
