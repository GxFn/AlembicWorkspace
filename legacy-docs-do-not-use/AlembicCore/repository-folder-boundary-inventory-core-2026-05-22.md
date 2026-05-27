# AlembicCore Repository Folder Boundary Inventory

创建日期：2026-05-22
执行窗口：AlembicCore
对应总控计划：`docs/workspace/repository-folder-boundary-restructure-workspace-plan-2026-05-22.md`
阶段：RFR-1 路径依赖清单
状态：已通过总控验收

## 执行范围

本轮只做 AlembicCore 路径依赖和 public API 边界清单，不移动文件、不修改 import、不删除目录、不重命名 package exports、不重建 `dist/` 或发布产物。

已检查范围：

- `AGENTS.md`、`package.json`、`package-lock.json`。
- `tsconfig.json`、`vitest.config.ts`、`biome.json`。
- `config/public-api-boundary.json`。
- `scripts/check-public-api-boundary.mjs`、`scripts/check-release-readiness.mjs`、`scripts/lint-consumer-core-imports.mjs`、`scripts/smoke-public-api.mjs` 等 public API / release 脚本。
- `src/` 顶层 facade、`src/core`、`src/domain`、`src/infrastructure`、`src/repository`、`src/service`、`src/shared`、`src/types`、`src/workflows`、`src/daemon`。
- `resources/grammars/*.wasm`。
- `test/` public API、package、boundary、AST grammar、workflow、database、vector/search、workspace resolver 相关测试。

## 当前结构事实

`AlembicCore` 是 `@alembic/core` npm 包，`package.json` 的 `main` 和 `types` 分别指向 `dist/index.js`、`dist/index.d.ts`。TypeScript 编译规则是 `rootDir: src`、`outDir: dist`，因此 `src/` 内路径会按同构结构输出到 `dist/`。

当前 package exports 一共有 136 个入口，其中 exact exports 75 个、wildcard exports 61 个。`config/public-api-boundary.json` 把这些入口分为：

- `stable-public`：17 个。
- `provisional-public`：21 个。
- `transitional-internal`：98 个。
- wildcard exports 当前全部是 transitional，用于兼容迁移期消费方，不能在没有消费方替换证据时直接删除。

`package.json` 的 `files` 会发布 `dist`、`resources`、`config/public-api-boundary.json`、release playbook 和 public API 脚本。`scripts/check-release-readiness.mjs` 还硬性检查 npm pack 中必须包含：

- `package/dist/index.js`
- `package/dist/index.d.ts`
- `package/resources/grammars/tree-sitter-typescript.wasm`
- `package/config/public-api-boundary.json`
- `package/scripts/check-public-api-boundary.mjs`
- `package/scripts/check-release-readiness.mjs`
- `package/scripts/lint-consumer-core-imports.mjs`
- `package/scripts/public-api-boundary-policy.mjs`

这说明 `resources/grammars`、`config/public-api-boundary.json` 和 public API 脚本不是普通可移动杂项，而是发布契约的一部分。

## 不可破坏 public API

以下 stable public exports 是当前消费方可依赖的硬边界，实际目录迁移不得改变这些 specifier 的可用性：

| Export | 当前源入口 | 边界判断 |
| --- | --- | --- |
| `@alembic/core` | `src/index.ts` | 根 facade，已人工收敛 export 范围，不能改成内部全量透传。 |
| `@alembic/core/daemon` | `src/daemon/index.ts` | daemon state、JobStore、runtime capability contract。 |
| `@alembic/core/database` | `src/database.ts` | database facade。 |
| `@alembic/core/dimensions` | `src/dimensions.ts` | dimension facade。 |
| `@alembic/core/events` | `src/events.ts` | event facade。 |
| `@alembic/core/evolution` | `src/evolution.ts` | evolution facade。 |
| `@alembic/core/guard` | `src/guard.ts` | Guard facade。 |
| `@alembic/core/host-agent-workflows` | `src/host-agent-workflows.ts` | host agent 挖掘闭环入口，Plugin / Alembic 消费方不能断。 |
| `@alembic/core/io` | `src/io.ts` | IO / WriteZone facade。 |
| `@alembic/core/knowledge` | `src/knowledge.ts` | knowledge facade。 |
| `@alembic/core/logging` | `src/logging.ts` | logging facade。 |
| `@alembic/core/memory` | `src/memory.ts` | memory facade。 |
| `@alembic/core/project-intelligence` | `src/project-intelligence.ts` | project intelligence facade。 |
| `@alembic/core/repositories` | `src/repositories.ts` | repository facade。 |
| `@alembic/core/search` | `src/search.ts` | search facade。 |
| `@alembic/core/vector` | `src/vector.ts` | vector facade。 |
| `@alembic/core/workspace` | `src/workspace.ts` | WorkspaceResolver / ProjectRegistry / folder names 等 workspace contract。 |

以下 provisional exports 是当前已被设计为 facade 或边界候选的入口，也不能在没有迁移计划时重命名：

- `@alembic/core/config`
- `@alembic/core/core/capability`
- `@alembic/core/core/enhancement`
- `@alembic/core/domain`
- `@alembic/core/domain/knowledge/values`
- `@alembic/core/infrastructure`
- `@alembic/core/infrastructure/config`
- `@alembic/core/infrastructure/event`
- `@alembic/core/infrastructure/io`
- `@alembic/core/infrastructure/logging`
- `@alembic/core/infrastructure/report`
- `@alembic/core/infrastructure/signal`
- `@alembic/core/service`
- `@alembic/core/service/bootstrap`
- `@alembic/core/service/candidate`
- `@alembic/core/service/evolution`
- `@alembic/core/service/knowledge`
- `@alembic/core/service/quality`
- `@alembic/core/service/recipe`
- `@alembic/core/shared`
- `@alembic/core/types`

`./shared/*`、`./domain/*`、`./daemon/*`、`./core/*`、`./infrastructure/*`、`./repository/*`、`./service/*`、`./types/*`、`./workflows/*` 等 wildcard exports 仍是 transitional，但它们已经出现在 `package.json` exports 中。实际移动内部文件时，如果不保留兼容 re-export 或先让消费方迁移，会直接破坏现有 deep import。

## 路径依赖清单

| 路径 / 文件 | 当前职责 | 迁移判断 |
| --- | --- | --- |
| `package.json` | package identity、exports、files、scripts、dependencies。 | 禁止在 RFR-1 之后直接改 exports；任何改动必须同步 public API policy、tests 和消费方替换证据。 |
| `src/*.ts` 顶层 facade | stable public API 主入口。 | 禁止移动 specifier；如内部移动，顶层 facade 必须保持不变。 |
| `src/index.ts` | 根入口，当前只暴露收敛后的稳定契约，避免 `export *` 冲突。 | 禁止改成薄接口或无差别全导出；变更必须跑 public API smoke。 |
| `src/core/ast` | AST / grammar 加载、multi-language parser；依赖 `resources/grammars`。 | 目录可内部整理但风险高；移动前必须保护 grammar resolver。 |
| `src/shared/package-root.ts` | 通过 package.json 定位包根，导出 `CONFIG_DIR`、`RESOURCES_DIR`、`DASHBOARD_DIR` 等路径。 | 禁止无计划移动或改变查找语义；路径命名仍含历史兼容项。 |
| `resources/grammars/*.wasm` | tree-sitter grammar 运行时资源，随 npm 包发布。 | 生成 / 发布资源，不是普通源码；移动必须同步 resolver、package files、release check 和 grammar tests。 |
| `config/public-api-boundary.json` | public API 分类、closeout、facade readiness 机器可读策略。 | 发布契约；移动会破坏脚本默认路径，需同步所有 public API 脚本。 |
| `scripts/check-public-api-boundary.mjs` | 检查 package exports 分类和增长约束。 | 发布脚本；保持根级 `scripts/` 更稳。 |
| `scripts/lint-consumer-core-imports.mjs` | 扫描消费方 `@alembic/core` import 规范。 | 发布脚本；若移动，外层调用路径也要改。 |
| `scripts/smoke-public-api.mjs` | 动态 import exact exports 并检查关键符号 / d.ts。 | 发布脚本；实际迁移后必须运行。 |
| `scripts/check-release-readiness.mjs` | `npm pack --dry-run` 级别 release package guard。 | 发布脚本；实际迁移后必须运行。 |
| `test/PublicApiInventory.test.ts` | 锁 package exports 分类、wildcard transitional、计数。 | public API 变更必跑。 |
| `test/core-package.test.ts` | 锁 exact exports 可 import 和关键符号。 | public API 变更必跑。 |
| `test/CoreDeliveryBoundary.test.ts` / `test/CoreToolSystemBoundary.test.ts` / `test/CoreCodexBoundary.test.ts` | 锁 Core 不包含 delivery / tool / Codex 边界。 | 目录重构后必须保留，避免把外层能力误放入 Core。 |
| `test/PublicConsumerCoreImportBoundary.test.ts` | 锁消费方导入边界。 | 后续 consumer 替换前后必跑。 |
| `dist/` | 编译生成物。 | 应继续被 `.gitignore`，不要作为源目录迁移目标。 |
| `node_modules/` | 依赖安装目录。 | 不进入迁移。 |

## 目录分类

| 分类 | 路径 | 判断 |
| --- | --- | --- |
| 禁止移动 / 需兼容保留 | `src/*.ts`、`src/index.ts`、`package.json` exports、`config/public-api-boundary.json`、`resources/grammars`、`scripts/check-*.mjs`、`scripts/smoke-public-api.mjs` | 这些路径直接参与 public API、package release 或 runtime resource 解析。 |
| 应保留现状 | `src/core`、`src/domain`、`src/infrastructure`、`src/repository`、`src/service`、`src/shared`、`src/types`、`src/workflows`、`src/daemon` | 这些目录已经与 exports 同构；移动会连带 dist 路径和 deep import。 |
| 可内部小步整理 | `test/` 内部测试分组、个别只被内部引用的 helper | 低优先级；不建议在 RFR-2/RFR-3 主线中优先处理。 |
| 生成物 / 发布物 | `dist/`、`resources/grammars`、npm pack 输出 | `dist/` 是生成物；`resources/grammars` 是发布资源。两者性质不同，不能混为普通目录清理。 |
| 需要总控确认 | `src/workflows/capabilities/**`、`src/core/ast/**`、`src/infrastructure/vector/**`、`src/service/search/**`、`src/daemon/**` | 分别影响 host agent 闭环、grammar runtime、resident vector、search、daemon contract。 |

## 目标层级建议

RFR 后续阶段不建议优先移动 AlembicCore 的顶层源码目录。原因是 Core 的 `package.json` exports 已经把 `src/` 的多数层级投射成 `dist/` public / transitional import path，目录移动本身不会降低耦合，反而会制造消费者兼容成本。

建议采用以下路线：

1. 保持 `src/*.ts` stable facade 和 `src/index.ts` 不变。
2. 保持 `src/core`、`src/domain`、`src/infrastructure`、`src/repository`、`src/service`、`src/shared`、`src/types`、`src/workflows`、`src/daemon` 顶层结构不变。
3. 若未来确实要移动内部文件，先在旧路径保留 re-export 兼容层，再让外层仓库改到 exact facade，最后用 public API policy 降低 wildcard / transitional 数量。
4. `resources/grammars` 只在明确需要改变资源布局时处理；必须同步 `src/shared/package-root.ts`、`src/core/ast/ensure-grammars.ts`、`package.json files`、`scripts/check-release-readiness.mjs`。
5. `scripts/` 继续保持根级发布脚本位置；不要为了目录美观移动到隐藏目录，否则外层调用和 npm pack guard 都要同步。

## 后续实际迁移验证矩阵

如果后续只调整文档或清单：

- `git status --short`
- `git diff --check`

如果后续改 package exports、facade 或 public API policy：

- `npm run build:check`
- `npm run lint:public-api-boundary`
- `npm run lint:consumer-core-imports`
- `npm run smoke:public-api`
- `npm run test -- test/PublicApiInventory.test.ts test/core-package.test.ts test/PublicConsumerCoreImportBoundary.test.ts`
- `npm run release:check`
- `git diff --check`

如果后续移动 AST grammar / resources：

- `npm run build:check`
- `npm run test -- test/AstGrammar.test.ts test/MultiLanguageParsers.test.ts test/PublicProjectIntelligenceEntrypoints.test.ts`
- `npm run release:check`
- `npm run smoke:public-api`
- `git diff --check`

如果后续移动 host agent workflow / project intelligence：

- `npm run build:check`
- `npm run test -- test/PublicHostAgentWorkflowEntrypoints.test.ts test/unit/HostAgentMiningWorkflow.test.ts test/PublicProjectIntelligenceEntrypoints.test.ts test/ProjectIntelligenceIncrementalPlanner.test.ts`
- `npm run lint:consumer-core-imports`
- `git diff --check`

如果后续移动 vector / search：

- `npm run build:check`
- `npm run test -- test/HnswVector.test.ts test/SearchEngine.test.ts test/SearchPipeline.test.ts test/SearchRanking.test.ts test/VectorService.test.ts`
- `npm run smoke:public-api`
- `git diff --check`

如果后续移动 daemon / workspace contract：

- `npm run build:check`
- `npm run test -- test/DaemonState.test.ts test/JobStore.test.ts test/ProjectRuntimeContracts.test.ts test/RuntimeContracts.test.ts test/WorkspaceResolver.test.ts test/WorkspaceSettingsStore.test.ts`
- `npm run smoke:public-api`
- `git diff --check`

## 本轮验证命令与结果

已运行：

- `git status --short`
  - 结果：无输出，AlembicCore 仓库本身无未提交改动。
- `rg --files package.json package-lock.json tsconfig.json vitest.config.ts biome.json config scripts src test resources RELEASE-PLAYBOOK.md`
  - 结果：通过，确认 Core 主要源码、资源、配置、脚本、测试和 release playbook 范围。
- `rg -n "lib/|src/|dist/|\\.release|runtime|vendor/|plugins/alembic-codex|channels/codex|injectable-skills|templates|resources|dashboard" package.json tsconfig*.json vitest*.config.* biome.json config scripts src test resources RELEASE-PLAYBOOK.md`
  - 结果：通过，发现关键路径依赖集中在 package exports、release readiness、public API scripts、package root resolver、grammar resources、runtime workspace resolver、测试 import。
- `node -e "const pkg=require('./package.json'); const policy=require('./config/public-api-boundary.json'); ..."`
  - 结果：通过，确认 exports 总数 136、exact 75、wildcard 61、stable 17、provisional 21。

未运行完整 `npm run test` 或 `npm run build:check`，因为 RFR-1 明确只做文档清单，没有修改 Core 源码、package manifest、资源或测试。

## 遗留风险

- Core 当前仍有 61 个 wildcard exports 和 98 个 transitional-internal exports；这使目录移动天然高风险。应先做消费方替换和 public API closeout，而不是直接移动源码目录。
- `src/shared/package-root.ts` 同时保留 `CONFIG_DIR`、`INJECTABLE_SKILLS_DIR`、`TEMPLATES_DIR`、`RESOURCES_DIR`、`DASHBOARD_DIR` 等历史路径常量；其中部分路径是跨仓库迁移历史留下的兼容面，后续需要单独判断是否仍有消费方。
- `resources/grammars` 是 Core 真实运行资源，不是 generated trash；移动会影响 AST / project intelligence 链路。
- `src/workflows/capabilities/**` 是利用宿主 agent 形成知识挖掘闭环的 Core 内部能力，不能被误判为 AlembicAgent 或 Plugin 目录整理对象。
- `src/daemon/**`、`src/shared/WorkspaceResolver.ts`、`src/shared/ProjectRegistry.ts` 是外层 runtime / project identity 依赖的 contract，目录表达可以讨论，但不能先动实现。

## 下一步建议

- RFR-2/RFR-3 优先处理 `AlembicPlugin` 和 `Alembic` 的目录表达；AlembicCore 在当前证据下不建议进入源码移动。
- 如果总控仍希望 Core 做结构收敛，建议先开独立 wave：目标是减少 wildcard / transitional exports，而不是移动文件夹。只有消费方从 deep imports 迁到 stable / provisional facade 后，才考虑删除或移动旧深层入口。
- 后续所有 Core 结构动作必须先给出旧 specifier 兼容方案、消费方替换清单和 release/package 验证证据。
