# AlembicAgent Phase 1 Bootstrap

日期：2026-05-17
阶段：Phase 1 - 初始化 `AlembicAgent` 可构建 TypeScript 包
范围：只修改 `AlembicAgent` 仓库；只读参考 `Alembic` / `AlembicCore` 配置；未修改相邻仓库。

## 完成内容

Phase 1 已完成。`AlembicAgent` 现在是一个可独立安装、构建、类型检查、lint、测试和执行 Agent 边界检查的 TypeScript/NodeNext 包。

新增文件：

- `AlembicAgent/package.json`
- `AlembicAgent/package-lock.json`
- `AlembicAgent/tsconfig.json`
- `AlembicAgent/biome.json`
- `AlembicAgent/.gitignore`
- `AlembicAgent/vitest.config.ts`
- `AlembicAgent/src/index.ts`
- `AlembicAgent/test/index.test.ts`
- `AlembicAgent/scripts/lint-agent-import-boundary.mjs`

## 包结构

- package name：`@alembic/agent`
- module system：ESM / NodeNext
- source root：`src/`
- build output：`dist/`
- Core dependency：`@alembic/core` via `file:../AlembicCore`
- public entrypoint：`src/index.ts`

`src/index.ts` 只导出 Phase 1 package metadata：

- `packageName`
- `migrationPhase`
- `implementationStatus`

这不是业务 facade，也不表示 AgentRuntime、AI provider 或 tool system 已完成迁移。真实实现仍从 Phase 2 开始按主仓库源代码完整复制。

## 脚本

`package.json` 已建立：

- `npm run build`
- `npm run build:check`
- `npm run typecheck`
- `npm run lint`
- `npm run lint:fix`
- `npm run lint:agent-import-boundary`
- `npm run test`
- `npm run check`

## Agent Import Boundary

新增 `scripts/lint-agent-import-boundary.mjs`，扫描 `src`、`lib`、`bin`、`config`、`scripts`、`test` 中的 TS/JS import。

当前禁止：

- 直接引用 `AlembicPlugin` 或 `@alembic/plugin`
- 引用 `#codex/*` 或 Codex delivery 目录
- 引用 `#external/mcp` 或 MCP delivery 目录
- 引用 `channels`、`plugins`、`marketplace`
- 引用 `skills`、`injectable-skills`
- 在 `AlembicAgent` 内创建 Codex、MCP delivery、channel、plugin、Skill delivery 目录

这个检查用于保护 Phase 2+ 迁移边界：Agent 包只承载 Agent runtime / AI / tool system，不接管 Plugin/Codex/MCP/channel/Skill 交付层。

## Import 调整列表

本阶段没有迁移主仓库源码，因此没有业务 import 调整。

新增 package 级依赖：

- `@alembic/core`: `file:../AlembicCore`

## 与 Alembic 主仓库源文件的差异

本阶段没有复制 `Alembic/lib/agent/**`、`lib/external/ai/**`、`lib/tools/**` 或 `lib/service/skills/**`。因此不存在与主仓库业务源文件的行为差异。

Phase 2 复制 `Alembic/lib/agent/**` 后，需要记录文件数量、import 调整和与主仓库源文件的差异。

## 验证结果

已通过：

- `npm install`
- `npm run build:check`
- `npm run lint`
- `npm run lint:agent-import-boundary`
- `npm run test`
- `npm run check`
- `npm run build`

说明：第一次 `npm install` 在沙箱网络限制下失败，错误为 `ENOTFOUND registry.npmjs.org`。按权限流程放行网络后，依赖安装成功并生成 `package-lock.json`。

## 交给 Alembic 窗口的任务

Phase 1 完成后，`Alembic` 窗口仍不需要接入代码。

下一步等待 `AlembicAgent` Phase 2 完成 `lib/agent/**` 迁移后，再评估主仓库接入点。当前主仓库应继续：

1. 保留 `Alembic/lib/agent/**`、`lib/external/ai/**`、`lib/tools/**` 和 `lib/service/skills/**`。
2. 不把 CLI、daemon、HTTP/API、Dashboard/native/IDE、Lark/Feishu runtime 迁入 `AlembicAgent`。
3. 准备后续把 product shell 中的 `#agent/*` 引用切到 `@alembic/agent` public entrypoint，但不要提前删除本地实现。

## 交给 AlembicPlugin 窗口的任务

Phase 1 完成后，`AlembicPlugin` 窗口仍不应删除重复 Agent 代码。

下一步等待 `AlembicAgent` Phase 2-4 提供真实实现和 public exports。当前 Plugin 应继续：

1. 保留 `AlembicPlugin/lib/agent/**`。
2. 保留 `lib/codex/**`、`lib/external/mcp/**`、`skills/**`、`injectable-skills/**`、`plugins/**`、`channels/**` 和 release/smoke/verify 脚本。
3. 不准备新增 `@alembic/agent` dependency；后续等宿主 agent contract 明确后，删除内置 Agent 能力并改为调用宿主 agent adapter。
4. 继续把 19 个分叉 Agent 文件作为删除风险分析材料，不迁回 `AlembicAgent` 主实现。

## 下一阶段

下一轮进入 Phase 2：完整复制 `Alembic/lib/agent/**` 和 `Alembic/lib/types/agent.d.ts`。

Phase 2 必须：

- 以 `Alembic` 主仓库为唯一源码来源
- 尽量保留原目录结构和 import 语义
- 只做独立构建所需的 import 调整
- 不合并类、不删 profile、不改 prompt、不做行为优化
- 记录迁入文件列表、import 调整、build/check/lint/test 结果和外部窗口配合任务
