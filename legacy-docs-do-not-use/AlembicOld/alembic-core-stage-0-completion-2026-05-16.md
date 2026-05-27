# AlembicCore 阶段 0 完成记录

日期：2026-05-16
阶段：0 - Core 包卫生与迁移夹具
范围：只改 `AlembicCore` 仓库；未改 `Alembic` / `AlembicPlugin` 功能代码。
Core 提交：`fb5105e Prepare Core migration fixtures`

## 1. 本阶段目标

阶段 0 不迁移业务能力，只把 Core 仓库整理到可以承接后续完整复制迁移的状态：

- 保持包名 `@alembic/core`、ESM、Node >= 22。
- 让 Core 拥有自己的 Vitest / Biome 配置。
- 保持 `dist/`、`node_modules/` 为 ignored 构建/安装产物。
- 增加最小包级测试夹具，用于验证测试框架可执行；这不是业务迁移覆盖。

## 2. Core 已完成内容

Core 仓库新增或调整：

- `package.json`
  - 增加 `./*` 子路径 exports，便于后续 `@alembic/core/shared/*`、`@alembic/core/domain/*` 等分阶段接入。
  - 增加 `typecheck`、`test`、`test:watch`、`test:coverage`、`lint`、`lint:fix`、`format`、`check` 脚本。
  - 增加 `vitest`、`@biomejs/biome`、`@types/node` devDependencies。
- `package-lock.json`
  - 通过 `npm install --ignore-scripts` 生成，锁定阶段 0 开发依赖。
- `biome.json`
  - 复制外层仓库的 Biome 规则，并把作用域改为 Core 的 `src/**`、`test/**`、根配置 TS 文件。
- `vitest.config.ts`
  - 复制外层仓库的 Vitest 超时/coverage 结构，并把覆盖路径改为 `src/**/*.ts`。
- `test/setup.ts`
  - 设置 `NODE_ENV=test`。
- `test/tsconfig.json`
  - 为后续迁移测试提供 `node`、`vitest/globals` 类型环境。
- `test/core-package.test.ts`
  - 只验证现有包骨架导出和测试框架可运行，不代表业务能力覆盖。
- `src/index.ts`、`src/runtime.ts`、`src/folder-names.ts`
  - 调整到外层 Biome 规则要求的 import/export 顺序和单引号风格。

## 3. 验证结果

在 `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore` 执行：

- `npm run build:check`：通过。
- `npm run test`：通过，1 个测试文件、3 个测试。
- `npm run lint`：通过，Biome 检查 7 个文件。
- `npm run check`：通过，串行执行 build check、test、lint。

注意：

- 阶段 0 只证明 Core 的迁移夹具可运行。
- 真实业务覆盖从阶段 1 开始，必须继续迁入 Alembic / AlembicPlugin 的真实实现和真实测试。

## 4. 外层仓库接入任务

本阶段不要求其他窗口修改 `Alembic` 或 `AlembicPlugin`。

其他窗口可选验证：

- 确认外层 `vendor/AlembicCore` 子仓库指针暂不更新到未发布/未指定 commit，除非用户明确要求。
- 确认外层仓库仍通过自己的 `npm run build:core` 构建 Core。

## 5. 外层删除计划

本阶段无删除计划。

原因：

- 阶段 0 没有迁移任何 `lib/shared/**`、`lib/domain/**`、repository、workflow 或 service 业务实现。
- 外层重复代码必须等对应业务阶段完成并接入后再删除。

## 6. 下一阶段入口

下一阶段是阶段 1：`shared` 基础工具完整迁移。

阶段 1 开始前必须先读取并比对：

- `Alembic/lib/shared/**`
- `AlembicPlugin/lib/shared/**`
- 对应 shared unit tests

阶段 1 不允许只补 facade；必须完整复制真实 shared 实现，并记录 Alembic 与 AlembicPlugin 的同名文件差异。
