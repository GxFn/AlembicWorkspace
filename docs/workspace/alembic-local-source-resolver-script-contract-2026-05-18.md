# Alembic Local Source Resolver And Script Contract

日期：2026-05-18
总控窗口：AlembicWorkspace
状态：当前生效契约

本文定义 AlembicWorkspace 内多仓库本地源码引入、脚本解析和 portable snapshot 的统一契约。契约只有这一份，保存于 `docs/workspace/`；各仓库只保存执行记录，不重复发明规则。

适用仓库：

- `Alembic`
- `AlembicPlugin`
- `AlembicAgent`

观察 / 被消费仓库：

- `AlembicCore`
- `AlembicDashboard`

默认不参与：

- `BiliDili`：只在真实 iOS/Swift 项目测试、扫描、复现、回归或自身维护需要时纳入。

## 1. 总原则

1. 仓库必须能独立运行自己的 `build`、`check`、`lint`、`smoke`、`release` 或 package 脚本；因此脚本入口保留在各仓库内。
2. 统一管理的是 resolver 契约，不是把所有脚本集中搬到 workspace。
3. 本地开发和总控验收优先使用 workspace 相邻源码，例如 `../AlembicCore`、`../AlembicAgent`、`../AlembicDashboard`。
4. vendor/submodule/远程指针不是日常开发阻塞；只有 release、portable runtime、npm package、离线安装、远程 CI 或 workspace 外独立运行时才作为快照边界。
5. 任何 release / portable snapshot 都必须记录源仓库 commit，不能只记录 vendor 当前状态。

## 2. Resolver 优先级

默认解析优先级：

| 来源 | 说明 | 默认用途 |
| --- | --- | --- |
| workspace sibling | `../AlembicCore`、`../AlembicAgent`、`../AlembicDashboard` | 日常开发、总控验收、跨仓库联调。 |
| installed package / node_modules | `node_modules/@alembic/core` 等 | workspace 外或 package manager 已安装后的普通消费场景。 |
| vendor/submodule | `vendor/AlembicCore`、`vendor/AlembicDashboard` | release snapshot、portable runtime、离线安装、workspace 外 fallback。 |
| remote pointer | git remote / submodule pointer / registry version | 只在发布、远程 CI、安装包或用户明确要求确认时检查。 |

当前已经落地的实现允许简化：

- `AlembicAgent` 直接使用 `file:../AlembicCore`，不需要 vendor fallback。
- `Alembic` 当前 resolver 使用 local → vendor；它没有 portable plugin runtime，允许暂不引入 node_modules fallback。
- `AlembicPlugin` 当前 resolver 使用 local → vendor；portable runtime 内仍必须保留 `file:vendor/AlembicCore`。

后续新增脚本时，应优先复用本仓库已有 resolver，不要再写散落的 `../AlembicCore` / `vendor/AlembicCore` 判断。

## 3. 脚本入口契约

各仓库脚本入口保留在仓库内：

| 仓库 | 必须保留的本地入口 | 契约要求 |
| --- | --- | --- |
| `AlembicAgent` | `build`、`build:check`、`lint:core-import-boundary`、`smoke:public-imports` | 依赖 `@alembic/core: file:../AlembicCore`；Core scanner 从 `../AlembicCore/scripts/lint-consumer-core-imports.mjs` 调用。 |
| `Alembic` | `build:core`、`lint:core-import-boundary`、`lint:consumer-core-imports`、`build:dashboard` | 默认解析 workspace 本地 Core / Dashboard；vendor 只作 fallback。 |
| `AlembicPlugin` | `build:core`、`lint:core-import-boundary`、`build:dashboard`、`dev:codex-plugin:watch`、`prepare:codex-plugin-runtime`、`verify:codex-plugin`、`smoke:codex-plugin` | 根仓库开发默认解析 workspace 本地 Core / Dashboard；runtime 打包从本地 Core 生成 portable vendor 快照。 |

脚本运行时应尽量输出：

- 使用的 source kind，例如 `local`、`vendor`、`package`。
- 使用的相对路径，例如 `../AlembicCore`。
- 如果来源是 git repo，输出 commit hash。
- 如果 fallback 到 vendor，说明 fallback 原因或缺少的本地路径。

## 4. 环境变量约定

当前代码尚未强制实现 env override；后续如果需要用户或 CI 显式指定来源，统一使用以下名称，不再各仓库自造变量：

| 变量 | 含义 |
| --- | --- |
| `ALEMBIC_CORE_SOURCE` | 显式指定 Core 源码根目录。 |
| `ALEMBIC_AGENT_SOURCE` | 显式指定 Agent 源码根目录。 |
| `ALEMBIC_DASHBOARD_SOURCE` | 显式指定 Dashboard 源码根目录。 |
| `ALEMBIC_SOURCE_MODE` | 显式指定来源模式：`local`、`vendor`、`package`。 |

实现 env override 时必须遵守：

- env 指定路径优先级高于 workspace sibling。
- env 路径必须验证 `package.json` 或脚本要求的必要文件存在。
- env 模式为 `vendor` 时，必须在日志里明确这是非默认日常开发入口。
- 不得把用户本机绝对路径写入长期文档；执行记录只写相对路径或脱敏说明。

## 5. Portable Runtime 例外

`AlembicPlugin` 的 Codex plugin runtime / tarball 是 portable 交付物，允许并且必须包含 `runtime/vendor/AlembicCore`。

该例外的契约是：

1. 根仓库日常开发依赖仍使用 `@alembic/core: file:../AlembicCore`。
2. `prepare:codex-plugin-runtime` 从 workspace 本地 Core 源码生成 `plugins/alembic-codex/runtime/vendor/AlembicCore`。
3. runtime 内 `package.json` 继续使用 `@alembic/core: file:vendor/AlembicCore`，保证打包后可离线安装和独立运行。
4. runtime vendor 快照必须记录源 commit，例如 `.alembic-source.json`。
5. `verify:codex-plugin` 和 `smoke:codex-plugin` 必须验证 runtime 内 vendored Core、`node_modules/@alembic/core` 和 tarball 内容。

这个 portable vendor 不得反向解释为根仓库日常开发也要优先使用 vendor。

## 6. 禁止事项

- 不要把 workspace 根目录变成产品源码包或统一脚本运行时。
- 不要让 `Alembic` 或 `AlembicPlugin` 的日常开发默认检查远程指针。
- 不要为了统一脚本而破坏仓库独立 build/check/release 能力。
- 不要在 `AlembicPlugin` 引入 `@alembic/agent`。
- 不要让外层仓库绕过 `@alembic/core` package entry 直接 import Core 源码内部文件。
- 不要把 `BiliDili` 纳入日常 Alembic 依赖收口、发布或迁移流程。

## 7. 当前落地状态

| 仓库 | 状态 | 落地证据 |
| --- | --- | --- |
| `AlembicAgent` | 已完成，待总控最终验收 | `@alembic/core: file:../AlembicCore`；Core boundary scanner 调用 `../AlembicCore/scripts/lint-consumer-core-imports.mjs`；执行记录 `docs/AlembicAgent/alembic-agent-local-source-import-baseline-2026-05-18.md`。 |
| `Alembic` | 已完成，待总控最终验收 | `@alembic/core: file:../AlembicCore`；`scripts/workspace-source.mjs` 与 `scripts/core-source-command.mjs`；Dashboard build 优先 `../AlembicDashboard`；执行记录 `docs/Alembic/alembic-local-source-import-unification-2026-05-18.md`。 |
| `AlembicPlugin` | 已完成，待总控最终验收 | `@alembic/core: file:../AlembicCore`；`scripts/local-source-paths.mjs`、Core build/lint wrappers、Dashboard local resolver、runtime snapshot `.alembic-source.json`；执行记录 `docs/AlembicPlugin/alembic-plugin-local-source-import-unification-2026-05-18.md`。 |

## 8. 后续维护

- 新增跨仓库本地源码脚本时，先检查本仓库已有 resolver。
- 若两个仓库出现第三次以上同构 resolver 逻辑，再评估是否抽成共享 dev tooling；在此之前保留 repo-local thin scripts。
- release / snapshot 阶段应新建专门总控文档，按源 commit 生成 vendor / runtime 快照，不把 snapshot 任务混入日常开发计划。
- 总控验收时，优先确认本地源码解析、package dependency、lockfile、关键 build/lint/smoke、portable runtime 例外是否同时成立。
