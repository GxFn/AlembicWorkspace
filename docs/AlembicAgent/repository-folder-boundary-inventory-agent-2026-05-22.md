# AlembicAgent Repository Folder Boundary Inventory

创建日期：2026-05-22
执行窗口：AlembicAgent
对应计划：`docs/workspace/repository-folder-boundary-restructure-workspace-plan-2026-05-22.md`
任务：RFR-1 路径依赖清单
状态：已通过总控验收

## 执行范围

- 已读取 `AlembicAgent/AGENTS.md`，本轮仅允许修改 workspace 协作文档，不修改 AlembicAgent 源码。
- 已梳理 `src/agent`、`src/external`、`src/tools`、`config`、release stage、public exports 和测试 / 边界脚本的路径依赖。
- 未移动文件、未改源码 import、未删目录、未重命名 package exports、未重建 `dist/` 或 release staging artifact。

## 当前目录职责

| 目录 / 文件 | 当前职责 | 路径边界判断 |
| --- | --- | --- |
| `package.json` | 声明 `@alembic/agent` package、15 个 public exports、4 组 private `#` imports、build/lint/test/release scripts。 | public API 和构建入口根契约，不能在目录整理中被隐式改写。 |
| `src/index.ts` | 根入口，聚合 Agent、memory、context、AI provider、tools，并暴露 package info。 | 绑定 package export `.`，移动时必须同步 `package.json` exports 和 public API guard。 |
| `src/agent` | Agent runtime、service、profile、strategy、context、memory、prompt、domain、task、run 和 forge 主体。 | 当前已经表达 Agent runtime 所有权，不建议为目录美观拆散。 |
| `src/agent/runtime` | `AgentRuntime`、message、state、event bus、budget、tool pipeline 和运行时边界。 | 绑定 `./runtime` export，是高敏感 public surface。 |
| `src/agent/service` | 宿主-facing `AgentService`、router、builder、contract 和 task orchestration。 | 绑定 `./service` export，是宿主接入高敏感 surface。 |
| `src/agent/context` | context window、conversation store、exploration tracker、plan / nudge 相关上下文能力。 | 绑定 `./context` export，涉及持久化和运行时上下文语义。 |
| `src/agent/memory` | active / persistent / session memory、retrieval、store、L4 memory package 和 consolidation 边界。 | 绑定 `./memory` export，涉及状态数据和压缩语义，不能薄化。 |
| `src/agent/prompts` | insight analyst / producer / evolver 等 prompt 和 gate。 | 绑定 `./prompts` export，移动需同步 prompt consumer。 |
| `src/agent/domain` | evidence collector、episodic consolidation、consolidation gate 等领域逻辑。 | 绑定 `./domain` export，不能只作为 helper 目录处理。 |
| `src/agent/profiles` | preset、profile compiler、stage factory registry 和 profile definitions。 | 绑定 `./profiles` export，影响 host profile 选择。 |
| `src/agent/forge` | dynamic tool forge、sandbox runner 和 tool 生成相关能力。 | 绑定 `./forge` export，移动要检查 tool runtime consumer。 |
| `src/agent/tasks` | reusable task handler。 | 绑定 `./tasks` export，属于 Agent service 消费面。 |
| `src/agent/runs` | relation、translation、scan、evolution direct run 类型和执行封装。 | 当前是 agent 内部 direct run 分类，不建议单独抽成顶层目录。 |
| `src/external/ai` | AI factory、provider manager、provider implementations、gateway、guard、registry 和 transport。 | 绑定 `./ai` export；`external` 表达外部 AI provider 边界，暂不建议改名为 `src/ai`。 |
| `src/tools` | tool catalog、router、contracts、terminal tool、Tool V2 adapter/cache/compressor/handlers、workflow registry。 | 绑定 `./tools`、`./tools/terminal`、`./tools/v2` exports，是 tool contract 高敏感区域。 |
| `src/tools/terminal` | terminal capability、envelope、policy、session contract。 | 绑定 `./tools/terminal` export，涉及宿主工具与 sandbox 边界。 |
| `src/tools/v2` | Tool V2 capability、adapter、cache、compressor 和 handlers。 | 绑定 `./tools/v2` export；adapter/cache/compressor 不应提前迁出，等真实消费方和迁移目标明确。 |
| `src/shared` | package assets、token utility、concurrency utility。 | 当前是小型共享 helper，暂不建议单独重构。 |
| `src/types` | 类型辅助目录。 | 当前不是 public export 根。 |
| `config` | `agent-public-api-boundary.json` 和 `core-import-boundary.json`。 | 是边界验证输入，实际迁移必须同步更新。 |
| `scripts` | import/public API boundary lint、release staging、release guard、public import smoke。 | 脚本包含 repo root、sibling Core、`dist` 和 staging 路径假设，不能当普通 helper 移动。 |
| `test` | Vitest 单元和 contract 测试，多处以 `../src/...` 读源码内部。 | 源码目录移动会带来 test import churn，必须和源码迁移同波处理。 |
| `dist` | TypeScript build 生成物，package exports 指向这里。 | 生成物，不手改、不作为目录整理对象。 |
| `tmp/release/@alembic-agent` | `release:stage` 生成的 publish staging 包目录。 | 发布物，不手改、不作为源码目录迁移对象。 |

## 路径依赖清单

### package exports / imports

`package.json` 当前声明 15 个 public exports：

- `.`
- `./agent`
- `./service`
- `./runtime`
- `./prompts`
- `./domain`
- `./forge`
- `./tasks`
- `./profiles`
- `./ai`
- `./tools`
- `./tools/terminal`
- `./tools/v2`
- `./memory`
- `./context`

这些 exports 全部指向 `./dist/...`。任何源码目录移动都必须保持 public subpath 不变，除非总控另开 public API 变更波次。

`package.json` private imports：

- `#agent/*`：dev/types 指向 `./src/agent/*`，default 指向 `./dist/agent/*`。
- `#external/*`：dev/types 指向 `./src/external/*`，default 指向 `./dist/external/*`。
- `#shared/*`：dev/types 指向 `./src/shared/*`，default 指向 `./dist/shared/*`。
- `#tools/*`：dev/types 指向 `./src/tools/*`，default 指向 `./dist/tools/*`。

因此，若改动 `src/agent`、`src/external`、`src/shared` 或 `src/tools` 的顶层名称，必须同步改 package private import map、Vitest alias、源码 import、测试 import、public API config 和 smoke import。

### TypeScript / Vitest / Biome

- `tsconfig.json` 使用 `rootDir: "src"` 和 `outDir: "dist"`，并只 include `src/**/*.ts`。
- `vitest.config.ts` 通过 `alembic-dev` condition 和 alias 把 `#agent`、`#external`、`#shared`、`#tools` 映射回 `src/*`。
- `biome.json` 和 `npm run lint` 扫描 `src scripts test`。

这些配置说明当前源码根是 `src`，没有 `lib` 或 `bin` 产品源码目录。

### release / package scripts

- `scripts/stage-agent-publish-package.mjs` 假设当前 repo root 的 sibling 是 `../AlembicCore`，读取 `README.md`、`dist`、root `package.json` 和 Core `package.json`，输出到 `tmp/release/@alembic-agent`。
- `release:stage` 先执行 build，再执行 staging script。
- `release:pack-preview` 在 staging package 上 dry-run pack，避免直接从源码根发布。
- `scripts/guard-agent-release-package.mjs` 会阻止源码根 package 直接 pack，因为源码根依赖 `@alembic/core: file:../AlembicCore` 是本地开发契约。
- `scripts/smoke-agent-public-imports.mjs` 依赖 `config/agent-public-api-boundary.json` 并逐个 import public exports。

目录迁移如果影响 `dist` layout、root manifest、Core sibling 路径或 staging 目录，必须单独做 release 波次验证。

### boundary scripts

- `scripts/lint-agent-public-api-boundary.mjs` 要求 package exports 与 `config/agent-public-api-boundary.json` 完全一致，且 export target 只能指向 `./dist`。
- `scripts/lint-agent-import-boundary.mjs` 扫描 `src`、`lib`、`bin`、`config`、`scripts`、`test`，缺失目录可跳过；如果未来新增 `lib` 或 `bin`，它们会自动进入边界扫描。
- `npm run lint:core-import-boundary` 调用 `../AlembicCore/scripts/lint-consumer-core-imports.mjs . --config config/core-import-boundary.json`，保持 Core stable facade 消费边界。

### tests

`test/` 多数文件使用 `../src/...` 相对路径测试内部实现。源码移动必须同时改测试 import，不应通过临时 re-export 或 duplicate 文件掩盖真实目录变更。

## 分类结论

### 可迁移目录

当前没有建议立即实际迁移的源码目录。

可作为后续专项评估的低优先级候选：

- `src/external/ai` 是否改为更直观的 `src/ai`。当前不建议，因为 `external` 已经表达外部 provider 边界，且改名会牵动 `#external/*`、`./ai` export、测试和 public API guard。
- `src/shared` 是否在未来按真实消费语义收敛。当前体量小，先保持。
- `src/agent/runs` 是否进一步文档化 direct run 归属。当前不建议拆顶层。

### 应保留目录

- `src/agent`
- `src/external/ai`
- `src/tools`
- `src/shared`
- `config`
- `scripts`
- `test`

这些目录和当前 ownership、package exports、private imports、boundary guard、release flow 均匹配。

### 生成物 / 发布物目录

- `dist`
- `tmp/release/@alembic-agent`
- `tmp/npm-cache`
- `coverage`
- `node_modules`

这些目录不得作为源码整理对象，实际迁移波次也不应手工修改。

### 禁止移动目录 / 文件

- `package.json` exports/imports 相关配置，除非总控明确开 public API 波次。
- `src/index.ts`、`src/agent/index.ts`、`src/external/ai/index.ts`、`src/tools/index.ts` 及所有 public export entrypoint。
- `src/agent/runtime`、`src/agent/service`、`src/agent/memory`、`src/agent/context`。
- `src/tools/terminal`、`src/tools/v2`。
- `config/agent-public-api-boundary.json`、`config/core-import-boundary.json`。
- `scripts/stage-agent-publish-package.mjs`、`scripts/guard-agent-release-package.mjs`、`scripts/smoke-agent-public-imports.mjs`。

禁止含义是不得在 RFR-1 或无专项迁移计划时移动；若未来确需调整，必须先建立迁移波次和完整验证矩阵。

### 需要总控确认目录

- `src/external` 顶层命名调整。
- `src/tools/v2/adapter`、`src/tools/v2/cache`、`src/tools/v2/compressor` 拆分或迁出。
- `src/agent/service` 与 `src/agent/runtime` 的相对层级变化。
- `tmp/release/@alembic-agent` staging 目录变化。
- `@alembic/core: file:../AlembicCore` 本地 source dependency 路径变化。

## 目标层级建议

AlembicAgent 当前目录层级与仓库职责基本一致，RFR 后续不建议优先对 AlembicAgent 做实际目录移动。

建议目标表达：

- 保持 `src/agent` 作为 Agent runtime 和策略主体。
- 保持 `src/external/ai` 作为外部 AI provider 和 gateway 边界，不把 provider 代码并入 runtime。
- 保持 `src/tools` 作为 tool contract / router / terminal / Tool V2 总入口。
- 保持 `config` 和 `scripts` 在 repo root，作为 package boundary、Core import boundary、release staging 和 smoke verification 的显式治理层。
- 后续如需优化，优先补 README 或目录说明，而不是先搬目录。

## 后续实际迁移验证矩阵

| 变更类型 | 最小验证命令 |
| --- | --- |
| 任意源码目录移动 | `npm run build:check`; `npm run lint`; `npm run lint:agent-import-boundary`; `npm run lint:core-import-boundary`; `npm run test`; `git diff --check` |
| public export / package import map 变化 | `npm run lint:public-api-boundary`; `npm run smoke:public-imports`; `npm run release:pack-preview`; `git diff --check` |
| release stage / staging path 变化 | `npm run release:stage`; `npm run release:pack-preview`; `git diff --check` |
| Agent runtime / service 变化 | `npm run test -- AgentRuntime AgentService agent-runtime`; `npm run build:check`; `git diff --check` |
| Tool V2 / terminal tool 变化 | `npm run test -- tool-v2 terminal-contract tool-system`; `npm run lint:agent-import-boundary`; `git diff --check` |
| AI provider / gateway 变化 | `npm run test -- ai-provider DeepSeekProvider DeepSeekTransport`; `npm run build:check`; `git diff --check` |
| memory / context 变化 | `npm run test -- memory ContextWindow l4-memory-package`; `npm run build:check`; `git diff --check` |

## 本轮验证

执行命令：

- `git status --short`
- `rg -n "lib/|src/|dist/|\\.release|runtime|vendor/|plugins/alembic-codex|channels/codex|injectable-skills|templates|resources|dashboard" package.json tsconfig.json vitest.config.ts biome.json scripts src config test`
- `git diff --check`

结果：

- `git status --short`：AlembicAgent 仓库无源码改动。
- 路径依赖扫描：命中集中在 package exports/imports、tsconfig `src`/`dist`、Vitest alias、boundary config、release scripts、public API smoke、测试 fixtures 和运行时类型命名；未发现 AlembicAgent 使用 `.release`、`vendor/`、`plugins/alembic-codex`、`channels/codex`、`injectable-skills`、`templates`、`resources` 作为产品路径。
- `git diff --check`：通过。

## 遗留风险

- AlembicAgent public exports 已经稳定，任何顶层目录改名都会牵动 package exports、private imports、Vitest alias、测试和 release smoke，风险大于收益。
- Tool V2 的 adapter/cache/compressor 仍是稳定 tool contract 的内部结构，当前不应在没有真实迁移目标时拆分。
- `release:stage` 依赖 sibling Core source 和 `dist` layout；未来若 workspace 仓库目录名调整，需要单独验证 staging script。

## 下一步建议

- RFR-1 总控验收时将 AlembicAgent 归为“观察中 / 暂不实际迁移”更合适。
- RFR-2/RFR-3 优先处理 AlembicPlugin 或 Alembic 这类 release/runtime 路径更敏感的仓库。
- 如果后续一定要调整 AlembicAgent 目录，建议只开一个窄波次，先选 `src/shared` 或文档化 `src/external/ai` 边界，避免同时触碰 runtime、service、tools 和 AI provider。
