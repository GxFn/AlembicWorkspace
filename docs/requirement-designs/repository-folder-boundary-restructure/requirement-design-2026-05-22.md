# Repository Folder Boundary Restructure Requirement Design

创建日期：2026-05-22
状态：已进入 RFR-1 路径依赖清单阶段
原始计划：[original-plan-2026-05-22.md](original-plan-2026-05-22.md)

## 需求目标

在不削减功能、不破坏发布链路、不改变仓库职责的前提下，重新调整 Alembic 系列仓库的文件夹层级关系，让源码、运行时资源、生成物、发布物和测试资产的目录语义更清晰。

## 用户场景

- 新 Codex 窗口进入某个仓库时，能从目录层级判断该仓库职责，而不是被历史镜像结构误导。
- 总控分派结构调整任务时，能精确说明哪些目录可迁移、哪些目录只可观察、哪些目录是发布或 runtime 资产不能随手移动。
- 后续发布、cache refresh、runtime artifact 生成、Alembic resident service 和 Codex plugin 都能沿用原功能闭环。

## 功能闭环

输入：

- 当前各仓库真实目录结构。
- `package.json` 的 `main`、`bin`、`imports`、`exports`、`files`、scripts。
- `tsconfig`、Vitest、Biome、release、runtime prepare、cache sync、package root resolver 等路径依赖。
- 各仓库 `AGENTS.md` 与当前 workspace 边界规则。

处理：

- 先形成路径依赖清单，标出外部入口、内部 import、生成物、发布物、缓存物、测试 fixture 和禁止移动项。
- 总控根据各仓库回填设计分阶段迁移，不允许无证据地移动目录。
- 每波迁移后由对应窗口运行 targeted 验证，并由总控验收功能完整性。

输出：

- 各仓库目录职责图和目标层级建议。
- 分阶段迁移计划、禁止事项和验证矩阵。
- 后续每波实际代码变更的提交 hash、验证命令、验证结果和残留风险。

## 当前代码事实摘要

- `Alembic` 和 `AlembicPlugin` 仍使用 `lib/` 作为源码根，并通过 package `imports` 同时映射 `alembic-dev` 的 `./lib/...` 和默认 `./dist/lib/...`。二者的 `main` / `bin` 也指向 `dist/lib/bootstrap.js` 与 `dist/bin/...`。
- `Alembic` 与 `AlembicPlugin` 的 lint/format/check 脚本硬编码 `lib/ bin/ config/ scripts/`，直接移动 `lib/` 会影响脚本、tsconfig、package imports、生成物和 runtime。
- `AlembicPlugin/scripts/prepare-codex-plugin-runtime.mjs` 明确复制 `dist`、`config`、`templates`、`injectable-skills`、`channels`、`.agents`、embedded Core 和 plugin shell snapshot 到 `plugins/alembic-codex/runtime`，这是最敏感的发布路径之一。
- `Alembic/scripts/prepare-publish-staging.mjs` 根据 root package `files` 复制发布 payload 到 `.release/alembic-ai`，并读取相邻 `AlembicCore`、`AlembicAgent`、`AlembicDashboard` 的 package version。
- `AlembicCore` 和 `AlembicAgent` 已采用 `src/` 源码根，package `exports` 指向 `dist/`。其中 `AlembicCore` 的 public exports 范围很宽，任何内部目录调整都可能触发 API 兼容问题。
- `AlembicDashboard` 是标准 Vite 前端结构，当前目录风险低于 `Alembic` / `AlembicPlugin`。

完整调研见：[code-implementation-dependency-research-2026-05-22.md](code-implementation-dependency-research-2026-05-22.md)。

## 设计原则

- 先依赖清单，后移动目录。
- 先交付入口和生成链路，后内部整理。
- 一波只让一个主要源码仓库移动目录；路径依赖清单阶段可以并行。
- `dist/`、`.release/`、`runtime/`、`vendor/`、`plugins/alembic-codex`、`channels/codex`、`.agents` 必须作为生成物 / 发布物 / 渠道资产单独处理。
- 任何目录移动必须同步更新 package manifest、tsconfig、lint/format/test/release scripts、runtime prepare、cache sync 和文档。

## 阶段设计

| 阶段 | 目标 | 主要窗口 | 是否改代码 |
| --- | --- | --- | --- |
| RFR-0 | 总控建立需求设计、代码路径依赖调研和分派计划。 | `AlembicWorkspace` | 否 |
| RFR-1 | 每个产品仓库输出路径依赖清单、目标层级建议和验证矩阵。 | `Alembic` / `AlembicCore` / `AlembicAgent` / `AlembicDashboard` / `AlembicPlugin` | 否 |
| RFR-2 | 优先整理 `AlembicPlugin` 的 Codex-facing 目录表达。 | `AlembicPlugin` | 是，待 RFR-1 验收后 |
| RFR-3 | 整理 `Alembic` 本地增强底座目录表达。 | `Alembic` | 是，待 RFR-2 或其依赖确认后 |
| RFR-4 | 对 Core / Agent / Dashboard 做必要且低风险的目录收敛。 | 按 RFR-1 结果决定 | 可能 |
| RFR-5 | 跨仓库验证、cache refresh、必要时测试单。 | `AlembicWorkspace` / `AlembicTest` | 按需 |

## 非目标

- 不把仓库合并为 monorepo。
- 不调整产品职责归属。
- 不把真实测试项目纳入目录迁移。
- 不为了目录统一强制 `AlembicCore` / `AlembicAgent` / `AlembicDashboard` 大搬家。
- 不删除任何仍有真实消费方的能力。

## 风险

- `Alembic` / `AlembicPlugin` 共有 `alembic-ai` 包名和类似历史结构，迁移时容易误改错误仓库。
- package imports 和 generated runtime 对 `lib` / `dist/lib` 路径敏感。
- release staging、Codex plugin runtime、cache sync 都会复制路径，不能只跑 `tsc` 就判定成功。
- `AlembicCore` public exports 暴露深层路径，内部目录移动可能成为破坏性 API 变更。

## 当前确认

用户已确认启动，且特别强调功能完整性。因此当前 RFR-1 只派发路径依赖清单任务，不派发目录移动任务。
