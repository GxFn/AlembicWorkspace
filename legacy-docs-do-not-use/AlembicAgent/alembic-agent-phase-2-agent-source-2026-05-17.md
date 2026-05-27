# AlembicAgent Phase 2 Agent Source Migration

日期：2026-05-17
阶段：Phase 2 - 完整复制主仓库 Agent 实现
范围：只修改 `AlembicAgent` 仓库；只读参考 `Alembic` 主仓库；未修改 `Alembic`、`AlembicPlugin`、`AlembicCore`。

## 完成内容

Phase 2 已完成。`Alembic/lib/agent/**` 已完整迁入 `AlembicAgent/src/agent/**`，`Alembic/lib/types/agent.d.ts` 已迁入 `AlembicAgent/src/types/agent.d.ts`。

用户确认后，本仓库最终源码落点采用 `src/`，不是 `lib/`：

- `src/agent/**`：Agent runtime、profiles、runs、memory、context、policies、strategies、prompts、forge、capabilities。
- `src/types/agent.d.ts`：Agent 类型声明。
- `src/index.ts`：导出 Agent barrel 与 package metadata。

迁入数量：

| 区域 | 文件数 | 说明 |
| --- | ---: | --- |
| `src/agent/**` | 98 | 从 `Alembic/lib/agent/**` 完整复制。 |
| `src/types/agent.d.ts` | 1 | 从 `Alembic/lib/types/agent.d.ts` 复制。 |

## 直接依赖支撑文件

为满足 Phase 2 “Agent 源码可独立 typecheck / barrel 可 smoke import”，本轮同时从主仓库复制了 Agent 直接引用的真实依赖子集，不写空壳：

| 区域 | 文件数 | 原因 |
| --- | ---: | --- |
| `src/external/ai/**` | 26 | `AgentRuntime`、`SystemRunContextFactory`、`forced-summary` 等直接引用 `#external/ai/*`。该目录本就是 Phase 3 候选，后续 Phase 3 会正式收敛和补测试。 |
| `src/tools/**` | 30 | `CapabilityRegistry`、`capabilities/index.ts`、`AgentRuntimeTypes`、forge/runtime 直接引用 tool core/catalog/v2/workflow。该子集只覆盖 Agent 直接依赖链，完整 tool migration 留给 Phase 4。 |
| `src/shared/package-assets.ts` | 1 | 兼容旧 `Conversation` capability 的相对 import；已将 package root 定位从 `alembic-ai` 调整为 `@alembic/agent`。 |

`src/tools/**` 当前包含：

- `catalog/**`
- `core/**`
- `v2/capabilities/**`
- `v2/handlers/**`
- `v2/registry.ts`
- `v2/types.ts`
- `v2/compressor/strip.ts`
- `workflow/**`

## Import 调整列表

为独立构建做了这些必要调整：

1. `package.json` 新增 package imports：
   - `#agent/*`
   - `#external/*`
   - `#shared/*`
   - `#tools/*`
2. package imports 使用 `types` 指向 `src/**`、`alembic-dev` 指向 `src/**`、默认运行时指向 `dist/**`。
3. `src/index.ts` 从 Phase 1 metadata-only 入口改为导出 `./agent/index.js`。
4. `vitest.config.ts` 增加 `alembic-dev` 条件和源码 alias，保证测试运行 TS 源码时能解析 `#agent/#external/#shared/#tools`。
5. `src/agent/runtime/AgentRuntime.ts` 给 `logger` 添加 `Pick<Console, 'info' | 'warn'>` 显式类型，避免 TypeScript 生成声明时穿透到 `@alembic/core/node_modules/winston` 的非可移植类型。
6. `src/shared/package-assets.ts` 将 package root 识别从 `alembic-ai` 改为 `@alembic/agent`。
7. `package.json` 新增直接依赖：
   - `better-sqlite3`
   - `drizzle-orm`
   - `undici`
   - `@types/better-sqlite3`

## 与 Alembic 主仓库源文件差异

`src/agent/**` 与 `Alembic/lib/agent/**` 只有一个文件存在差异：

- `src/agent/runtime/AgentRuntime.ts`
  - 差异：`logger` 字段添加显式结构类型。
  - 原因：独立 package 生成声明文件时避免暴露 Core 内部 `winston` 依赖路径。
  - 行为影响：无运行行为变化。

其他 97 个 `src/agent/**` 文件与主仓库对应文件内容一致。

`src/shared/package-assets.ts` 是 package 适配文件，故意从 `alembic-ai` root 调整为 `@alembic/agent` root。

## 验证结果

已通过：

- `npm install`
- `npm run build:check`
- `npm run lint`
- `npm run lint:agent-import-boundary`
- `npm run test`
- `npm run check`
- `npm run build`
- `node -e "import('./dist/index.js')..."` barrel smoke import

Smoke import 结果：

```json
{"hasAgentRuntime":true,"phase":"phase-2-agent-source"}
```

说明：`npm run lint` 返回成功，但 Biome 对主仓库原始 Agent 源码报告了 27 个 warning，主要是 non-null assertion、unused import/private member 和 optional-chain 风格建议。本阶段为保持行为不变未做批量清理。

## 交给 Alembic 窗口的任务

Phase 2 完成后，`Alembic` 窗口可以开始只读评估主仓库接入点，但仍不要删除主仓库实现。

任务：

1. 继续保留 `Alembic/lib/agent/**`，不要删除本地 AgentRuntime。
2. 扫描主仓库 product shell 中 `#agent/*` 调用点，标注哪些后续可切到 `@alembic/agent`。
3. 暂不迁移 CLI、daemon、HTTP/API、Dashboard/native/IDE、Lark/Feishu runtime。
4. 等 Phase 3 和 Phase 4 分别完成 AI provider 与通用 tool system 正式收敛后，再做主仓库 runtime 接入实现。
5. 删除主仓库重复 Agent 前必须提供 import 扫描、替代入口和 CLI/daemon/Dashboard smoke 证据。

## 交给 AlembicPlugin 窗口的任务

Phase 2 完成后，`AlembicPlugin` 窗口不接入 `AlembicAgent` 依赖。Plugin 的目标是删除内置 Agent 能力，并在宿主 agent contract 明确后改用宿主提供的 agent。

任务：

1. 不增加、不规划 `@alembic/agent` dependency；不要使用 `file:../AlembicAgent`。
2. 扫描 Plugin 中 20 个 `#agent/*` 调用文件，标注哪些应删除、哪些需要改到宿主 agent adapter。
3. 暂不删除 `AlembicPlugin/lib/agent/**`，等待宿主 agent contract 和替代验证。
4. 暂不删除 `AlembicPlugin/lib/external/ai/**`；等待 Phase 3 正式迁移、宿主 agent/config adapter 明确，并补 mock provider 测试。
5. 暂不删除 tool core/catalog/v2/workflow；等待 Phase 4 正式迁移并补 tool router/permission/timeout/cancel/error 测试。
6. 保留 `lib/codex/**`、`lib/external/mcp/**`、`skills/**`、`injectable-skills/**`、`plugins/**`、`channels/**` 和 release/smoke/verify 脚本。

## 下一阶段

下一轮进入 Phase 3：正式迁移 AI Provider 与模型路由。

Phase 3 应在当前 `src/external/ai/**` 基础上：

- 确认 26 个文件与 `Alembic/lib/external/ai/**` 保持一致。
- 补 mock provider 测试。
- 覆盖 provider 成功、失败、超时/取消、参数校验和错误分类。
- 记录 Plugin 删除 `lib/external/ai/**` 前的宿主 agent adapter 和验证任务。
