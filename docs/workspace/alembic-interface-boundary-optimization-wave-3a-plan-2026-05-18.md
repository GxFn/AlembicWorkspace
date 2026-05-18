# Alembic Interface Boundary Optimization Wave 3A Plan

日期：2026-05-18
总控窗口：AlembicWorkspace
状态：已完成

## 背景

上一轮 `Release / portable snapshot / publish staging Wave 2` 已验收完成，当前不再阻塞接口边界优化。

本轮接续已完成的 `alembic-core-agent-interface-boundary-wave-2c-acceptance-summary-2026-05-18.md`，不重复做本地源码入口、release staging、vendor 指针或 portable runtime 发布收口。本轮只处理 Core / Agent / 外层消费方的接口边界治理。

## 当前基线

总控已在 2026-05-18 读取真实代码并运行轻量边界 gate：

| 仓库 | 当前 HEAD | 基线 |
| --- | --- | --- |
| `AlembicCore` | `9174c5173a73` | `npm run lint:public-api-boundary` 通过；136 package exports classified；75 exact / 61 wildcard；stable 17 / provisional 21 / transitional 98。 |
| `AlembicAgent` | `f9d020f9ebaf` | `npm run lint:public-api-boundary` 通过；15 exact exports，no wildcard；`npm run lint:core-import-boundary` 通过，216 files / 48 Core imports；`npm run lint:agent-import-boundary` 通过。 |
| `Alembic` | `7f68d43e019d` | `npm run lint:core-import-boundary` 通过，455 files / 598 Core imports；`npm run lint:agent-extraction-boundary` 通过，local Agent duplicate 为 0，仍有 33 `@alembic/agent/tools` consumer files、4 `tools/v2`、10 `tools/terminal`。 |
| `AlembicPlugin` | `6883affe2668` | `npm run lint:core-import-boundary` 通过，320 files / 517 Core imports；`npm run report:agent-extraction-boundary` 通过，`@alembic/agent` / AI / tool imports 均 0。 |
| `AlembicDashboard` | `7143a7ca610a` | 本轮未发现直接 API/client 变更任务，保持观察。 |
| `BiliDili` | `40f97542c9c5` | 真实测试项目，本轮无任务。 |

关键判断：

- `AlembicCore` 是本轮主要源头：wildcard / transitional surface 仍大，必须开始分类和收敛。
- `AlembicAgent` public surface 已干净，本轮重点是把 15 个 exact exports 的 contract / negative gate / host-owned 边界说明补牢，不扩大 API。
- `Alembic` 和 `AlembicPlugin` 仍有大量 Core transitional allowlist 受控引用。本轮目标不是让它们盲删，而是减少已有 stable 替代路径能覆盖的引用，并把缺 facade 的真实调用点反馈给 Core。
- `AlembicPlugin` 必须继续保持 agent-free，不引入 `@alembic/agent`。

## Wave 3A 目标

1. Core：把 public API boundary 从“统计通过”推进到“可执行收敛清单 + 第一批治理动作”。
2. Agent：把 15 个 public subpath 的 contract 固化，防止后续 deep import、wildcard 或 host/agent 边界倒退。
3. Alembic：减少 Core transitional consumer allowlist，保持 Agent duplicate 为 0，并把缺少的 Core stable facade 反馈给 Core。
4. Plugin：减少 Core transitional consumer allowlist，保持 agent-free 和 artifact-only 边界，不触碰 root npm publish 方向。

## 执行顺序

可以并行启动，但依赖关系如下：

- `AlembicCore` 与 `AlembicAgent` 可立即开始。
- `Alembic` / `AlembicPlugin` 可立即做 consumer inventory 和已有 stable 替换；凡是需要 Core 新 facade 的替换，必须等待 `AlembicCore` 给出 commit 或明确不做 facade 的判断。
- 不做 release / vendor / remote pointer 同步；除非本轮改动确实影响 Plugin portable runtime 验证，否则不刷新 `runtime.tgz`。

## 窗口分派

| 窗口 | 状态 | 任务 | 文档动作 | 保存位置 | 挂载入口 | 回填位置 | 验证命令 | 阻塞/依赖 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `AlembicCore` | 已完成 | 已建立 Core public API closeout inventory：将 98 transitional / 61 wildcard 分类为 `promote-to-stable=0`、`keep-provisional=18`、`consumer-replace-first=21`、`no-consumer-deprecate-candidate=46`、`must-keep-transitional=13`；落地 no-growth gate 和 report script；给 Alembic / Plugin 回填 existing stable 替换建议与缺 facade 清单。未删除任何 export。 | 已新建 | `docs/AlembicCore/alembic-core-public-api-closeout-wave-3a-2026-05-18.md` | 本文“窗口分派”；`docs/workspace/index.md` 当前入口 | 本文“回填区 / AlembicCore” | `npm run lint:public-api-boundary`；`npm run report:public-api-closeout`；`npm run smoke:public-api`；`npm run build:check`；AlembicAgent / Alembic / Plugin consumer scan；`npm run lint`；`npm run check`；`git diff --check`；`git status --short` | 已提交 `4679f004c923ab32ad2b5407f6c9dfa7561c840e`；Alembic / Plugin 可继续 consumer reduction。 |
| `AlembicAgent` | 已完成 | 已完成 Agent public contract hardening：15 个 exact exports 增加 contract matrix；补 deep/dist/src/three-level import negative gate；明确 `tools/v2`、`tools/terminal`、`service/runtime/memory/context` 的 Agent-owned contract 与 host-owned adapter 边界；未新增 public subpath，未迁入 host adapter。 | 已新建 | `docs/AlembicAgent/alembic-agent-public-contract-hardening-wave-3a-2026-05-18.md` | 本文“窗口分派”；`docs/workspace/index.md` 当前入口 | 本文“回填区 / AlembicAgent” | `npm run lint:public-api-boundary`；`npm run smoke:public-imports`；`npm run check`；`git diff --check`；`git status --short` | 已提交 `b541c9eaa342dcb085834cfbe36e506c5904c43f`；外层 consumer reduction 仍由 Alembic / Plugin 窗口执行。 |
| `Alembic` | 已完成 | Alembic consumer boundary reduction 已完成：将全部 `@alembic/core/domain/dimension*` transitional imports 替换为稳定 `@alembic/core/dimensions`，收紧 `config/core-import-boundary.json`，保持 Agent duplicate / Tool V2 duplicate / terminal duplicate 均为 0，并反馈剩余 Core facade 缺口。 | 已新建 | `docs/Alembic/alembic-core-agent-consumer-boundary-reduction-wave-3a-2026-05-18.md` | 本文“窗口分派”；`docs/workspace/index.md` 当前入口；Alembic 执行记录 | 本文“回填区 / Alembic” | `npm run lint:core-import-boundary`；`npm run lint:agent-extraction-boundary`；`npm run build:check`；`npm run check`；Agent public import smoke；负向扫描 `file:vendor/AlembicCore` 默认入口 | 已提交 `6dc3a875c2ef14be7a3b9a2fa6a9990b6c441c31`；下一批 service/evolution、service/knowledge、candidate、repository 替换等待 Core facade 决策。 |
| `AlembicPlugin` | 已完成 | Plugin Core consumer boundary reduction 已完成：基于 517 Core imports，将 knowledge/domain、memory repository、source-ref type、dimension helper 等已有 stable facade 覆盖的 imports 替换为稳定入口，收紧 `config/core-import-boundary-allowlist.json`，保持 `@alembic/agent` 0 依赖、root registry publish disabled、embedded runtime `file:vendor/AlembicCore` 例外不变，并反馈剩余 Core facade 缺口。 | 已新建 | `docs/AlembicPlugin/alembic-plugin-core-consumer-boundary-reduction-wave-3a-2026-05-18.md` | 本文“窗口分派”；`docs/workspace/index.md` 当前入口；Plugin 执行记录 | 本文“回填区 / AlembicPlugin” | `npm run lint:core-import-boundary`；`npm run report:agent-extraction-boundary`；`npm run verify:release-package-boundary`；`npm run verify:codex-plugin`；`npm run smoke:codex-plugin`；`npm run build:check`；`npm run check`；focused unit tests；负向扫描 `@alembic/agent` | 已提交 `170f52a407914ebf1d484e269980c40cc6eee90c`；下一批 service/knowledge、service/evolution、candidate、repository/config 替换等待 Core facade 决策。 |
| `AlembicDashboard` | 观察中 | 本轮不改 Dashboard。仅当 Alembic / Plugin 的 API client 或 Dashboard build source 因边界改动失败时追加任务。 | 无需新建 | 无 | 本文“窗口分派” | 本文“回填区 / AlembicDashboard” | 无 | 观察窗口，不发送提示词。 |
| `BiliDili` | 无任务 | 当前是 Alembic 多仓库接口边界治理，不涉及真实 iOS/Swift 项目验证。 | 无需新建 | 无 | 本文“窗口分派” | 本文“回填区 / BiliDili” | 无 | 不发送提示词。 |

## 禁止事项

- 不做 npm publish、GitHub release、runtime artifact upload 或 marketplace 发布。
- 不做例行 vendor / submodule / remote pointer 同步；只有当前任务明确需要 portable runtime 复验时才允许刷新。
- 不删除仍被 Alembic / Plugin / Agent 消费的 Core export。
- 不为了降低统计数字把真实能力改成薄 wrapper、空 facade 或重复实现。
- `AlembicPlugin` 不得引入 `@alembic/agent`。
- `Alembic` 不得恢复本地 Agent duplicate 或 generic Tool V2 duplicate。
- `BiliDili` 不进入本轮日常流程。

## 验收标准

本轮不是要求一次性把 Core transitional 清零，而是要求边界朝可收敛状态前进：

- `AlembicCore` 必须产出完整 transitional / wildcard 分类，并至少落地一项治理动作：policy no-growth、分类字段、report script、或第一批安全 promotion / deprecation gate。
- `AlembicAgent` 必须保持 15 exact / 0 wildcard，并增加或复核 deep import negative gate。
- `Alembic` 必须证明 Core / Agent consumer boundary 仍通过，并减少至少一个可替换的 transitional specifier；如果没有安全替代，必须列出阻塞的 facade 请求。
- `AlembicPlugin` 必须证明 Core boundary 和 agent-free boundary 仍通过，并减少至少一个可替换的 transitional specifier；如果没有安全替代，必须列出阻塞的 facade 请求。
- 所有窗口必须回填完成范围、提交 hash、验证命令、验证结果、遗留风险、下一步建议。

## 可复制提示词

发送给：无

已完成且当前不再发送：`AlembicCore`、`AlembicAgent`、`Alembic`、`AlembicPlugin`

不发送窗口：`AlembicDashboard`、`BiliDili`

```text
读取 docs/workspace/alembic-interface-boundary-optimization-wave-3a-plan-2026-05-18.md，按照文档，领取并完成分配给你所在窗口的任务；完成后回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。
```

## 回填区

### AlembicCore

- 状态：已完成
- 完成范围：在 `config/public-api-boundary.json` 增加 closeout schema、manual category seed 和 no-growth 上限；在 `scripts/public-api-boundary-policy.mjs` 增加 closeout category / schema 校验；在 `scripts/check-public-api-boundary.mjs` 将 `transitional-internal <= 98` 与 `wildcardExports <= 61` 纳入 `lint:public-api-boundary`；新增 `scripts/report-public-api-closeout.mjs` 和 `npm run report:public-api-closeout`，从 package exports、Core policy 与 sibling consumer scan 生成可复现 inventory；完整分类 98 个 closeout exports：0 promote、18 keep-provisional、21 consumer-replace-first、46 no-consumer-deprecate-candidate、13 must-keep-transitional；未删除任何 export，未新增薄 facade。
- 提交 hash：`4679f004c923ab32ad2b5407f6c9dfa7561c840e`（`Add public API closeout inventory`）
- 验证命令：`npm run lint:public-api-boundary`；`npm run report:public-api-closeout`；`node scripts/report-public-api-closeout.mjs --format=json`；`node scripts/lint-consumer-core-imports.mjs ../AlembicAgent --config ../AlembicAgent/config/core-import-boundary.json --format=json`；`node scripts/lint-consumer-core-imports.mjs ../Alembic --config ../Alembic/config/core-import-boundary.json --format=json`；`node scripts/lint-consumer-core-imports.mjs ../AlembicPlugin --config ../AlembicPlugin/config/core-import-boundary-allowlist.json --format=json`；`npm run smoke:public-api`；`npm run build:check`；`npm run lint`；`npm run check`；`git diff --check`；`git status --short`
- 验证结果：全部通过。`lint:public-api-boundary` 输出 136 exports classified、75 exact / 61 wildcard、stable 17 / provisional 21 / transitional 98，并确认 closeout no-growth 为 transitional `98 <= 98`、wildcard `61 <= 61`。`report:public-api-closeout` 输出 98 closeout exports，consumer scan issue 0；AlembicAgent 为 216 files / 48 imports / stable 48 / transitional 0；Alembic 为 455 files / 598 imports / stable 412 / provisional 7 / transitional 179；AlembicPlugin 为 320 files / 507 imports / stable 360 / provisional 8 / transitional 139。`smoke:public-api` imported 75 exact public API entrypoints。`build:check`、Biome lint、`check` 均通过；`check` 中 60 test files / 919 tests passed，保留既有 `error: Could not access 'HEAD'` 输出但退出码为 0。Core 提交后工作区干净。
- 遗留风险：`consumer-replace-first` 仍需 Alembic / AlembicPlugin 先替换已有 stable facade 或回填缺 facade；`no-consumer-deprecate-candidate` 仍不能立即删除，后续需要 release 兼容窗口与下游负向扫描；AST、Drizzle/migrations、repository bootstrap/sync 仍为 `must-keep-transitional`。
- 下一步建议：Alembic 与 AlembicPlugin 已完成本轮第一批 stable facade 替换，下一批等待 Core facade 决策。后续可先继续复核 `@alembic/core/config`、`@alembic/core/workspace`、`@alembic/core/search`、`@alembic/core/memory` / `@alembic/core/repositories`、`@alembic/core/knowledge` 已覆盖的 imports；无法替换的 `KnowledgeSyncService`、`SourceRefReconciler`、`ConfidenceRouter`、`EvolutionGateway`、`SimilarityService`、`CapabilityProbe`、`shared/errors`、`shared/schemas`、`developer-identity`、`test-mode`、`types/*` 回填给 Core 下一波做最小 facade 判断。

### AlembicAgent

- 状态：已完成
- 完成范围：保持 `@alembic/agent` package exports 为 15 exact / 0 wildcard；在 `config/agent-public-api-boundary.json` 增加 15 行 public contract matrix，逐项记录 public specifier、Agent-owned contract 和 host-owned adapter boundary；明确 `tools/v2`、`tools/terminal`、`service`、`runtime`、`memory`、`context` 的 Agent / host 边界；增加 5 个 forbidden consumer specifier samples；增强 `scripts/lint-agent-public-api-boundary.mjs` 校验 contract matrix 与 forbidden sample 覆盖；增强 `scripts/smoke-agent-public-imports.mjs`，实际动态导入 deep/dist/src/three-level forbidden samples 并要求 `ERR_PACKAGE_PATH_NOT_EXPORTED`。未新增 public subpath，未迁入 host adapter 实现，未修改其它仓库。
- 提交 hash：`b541c9eaa342dcb085834cfbe36e506c5904c43f`（`Harden agent public contract boundary`）
- 验证命令：`npm run lint:public-api-boundary`；`npm run smoke:public-imports`；`npm run check`；`git diff --check`；`git status --short`
- 验证结果：`npm run lint:public-api-boundary` 通过，15 exact exports / no wildcard exports，contract matrix 和 forbidden sample 覆盖关系通过脚本校验；`npm run smoke:public-imports` 通过，15 public subpaths imported，5 forbidden subpaths rejected；`npm run check` 通过，包含 `build:check`、Biome、Agent import boundary、public API boundary、Core import boundary 和 Vitest，Core scan 为 216 files / 48 Core imports，9 test files / 37 tests passed，Biome 仍输出 23 条既有 warning；`git diff --check` 通过；提交后 Agent 工作区干净。
- 遗留风险：negative samples 是代表性样例，不是枚举所有可能的 deep import 字符串；当前由 package exports、forbidden patterns 和 sample gate 共同守住边界。外层 Alembic / Plugin consumer allowlist reduction 不在本窗口完成。既有 23 条 Biome warning 仍未处理。
- 下一步建议：Alembic / AlembicPlugin 窗口在做 consumer boundary reduction 时，只消费 15 个 exact public subpaths，不使用 deep import；后续若新增 Agent public subpath，必须同步更新 package exports、public contract matrix、negative gate 和 public import smoke。

### Alembic

- 状态：已完成
- 完成范围：Alembic 主仓库已将 `@alembic/core/domain/dimension`、`DimensionCopy`、`DimensionSop`、`RecipeDimension` 四个 transitional dimension specifier 全部替换为稳定 `@alembic/core/dimensions`；同步更新 DI、MCP handlers、cleanup、internal-agent bootstrap/rescan runtime、integration/unit tests；`config/core-import-boundary.json` 已删除四个旧 specifier 及其 frozen/reference limits，新增稳定 facade。
- 提交 hash：`6dc3a875c2ef14be7a3b9a2fa6a9990b6c441c31`
- 验证命令：`rg -n '@alembic/core/domain/dimension' lib test bin scripts config -g '*.ts' -g '*.js' -g '*.mjs' -g '*.json'`；`npm run lint:core-import-boundary`；`npm run lint:agent-extraction-boundary`；`npm run build:check`；Agent public import smoke；`rg -n 'file:vendor/AlembicCore' package.json package-lock.json config scripts bin lib test`；`npm run check`；`node scripts/core-source-command.mjs lint-consumer-imports --format=json`
- 验证结果：dimension 旧 deep import 0 命中；Core import boundary 通过，455 files / 598 imports / issue 0；Agent extraction boundary 通过，local Agent duplicate / generic Tool V2 duplicate / terminal duplicate 均为 0；build:check 通过；Agent public import smoke 通过；`file:vendor/AlembicCore` 默认入口扫描 0 命中；`npm run check` 通过；consumer JSON scan 为 stable-public 412、provisional-public 7、transitional-internal 179、issue 0。
- 遗留风险：service/knowledge、service/evolution、candidate service、repository implementation constructors 仍有 transitional imports；当前 Core stable facade 尚未覆盖这些 host wiring contract，不能在 Alembic 单侧强行替换。
- 下一步建议：等待 AlembicCore Wave 3A closeout inventory / facade 决策后，Alembic 再做下一批 consumer replacement；继续保持 no-growth allowlist，并避免触碰 vendor / release / portable runtime 入口。

### AlembicPlugin

- 状态：已完成
- 完成范围：AlembicPlugin 已将 `@alembic/core/domain/knowledge/FieldSpec`、`UnifiedValidator`、`domain/knowledge/values/*` 替换为稳定 `@alembic/core/knowledge`；将 `MemoryRepositoryImpl` 替换为稳定 `@alembic/core/memory`；将 SourceRef 测试类型断言替换为 `SourceRefRepository` from `@alembic/core/repositories`；将 `recipeDimensionIdOrUnknown` 替换为稳定 `@alembic/core/dimensions`；删除已失效的 `RecipeReadinessChecker` deep mock；收紧 `config/core-import-boundary-allowlist.json`，删除 13 个已替换或已无命中的旧 transitional specifier / limit，更新当前 scan 计数为 507 imports / 79 unique specifiers。
- 提交 hash：`170f52a407914ebf1d484e269980c40cc6eee90c`
- 验证命令：`npm run lint:core-import-boundary`；`npm run report:agent-extraction-boundary`；`npm run verify:release-package-boundary`；`npm run verify:codex-plugin`；`npm run smoke:codex-plugin`；`npm run build:check`；`npm run check`；`npm run test:unit -- test/unit/KnowledgeAPI.test.ts test/unit/KnowledgeEntry.test.ts test/unit/RecipeImpactPlanner.test.ts`；`rg -n "@alembic/agent" package.json package-lock.json lib bin config scripts plugins test channels .github`；`rg -n "@alembic/core/(domain/dimension|domain/knowledge/(FieldSpec|RecipeReadinessChecker|UnifiedValidator|values)|repository/memory/MemoryRepository|repository/sourceref/RecipeSourceRefRepository)" lib test bin scripts config`；`git diff --check`
- 验证结果：Core import boundary 通过，320 files / 507 imports / issue 0，stable-public 360、provisional-public 8、transitional-internal 139；agent extraction boundary 通过，agent / AI / tool boundary imports 全 0；release package boundary 通过，root registry publish disabled，root package private，embedded runtime dependency 保持 `file:vendor/AlembicCore`；Codex plugin verify 通过；Codex plugin smoke 通过，install / stdio / npxRuntime passed；build:check 通过；`npm run check` 退出 0，仍有既有 Biome warning/info；focused unit tests 3 files / 107 tests passed；`@alembic/agent` 负向扫描 0 命中；已替换 deep imports 负向扫描 0 命中；`git diff --check` 通过。
- 遗留风险：`service/knowledge`、`service/evolution`、`service/candidate`、repository/database implementation constructors、config/shared helper deep paths 仍有 transitional/provisional imports；当前 Core stable facade 尚未覆盖这些 Plugin host wiring contract，不能在 Plugin 单侧强行替换。`runtime.tgz` 未刷新，因为本轮源码 import 收敛未改变 portable runtime artifact 口径，且 verify/smoke 已通过。
- 下一步建议：等待 AlembicCore Wave 3A closeout inventory / facade 决策后，再按 Core 给出的 stable promotion 或 keep-transitional 判断做下一批 Plugin consumer replacement；继续保持 agent-free、artifact-only release 边界，不恢复 root npm registry publish，不引入 `@alembic/agent`。

### AlembicDashboard

- 状态：观察中
- 观察结论：

### BiliDili

- 状态：无任务
- 判断理由：当前是 Alembic 多仓库接口边界治理，不涉及真实 iOS/Swift 项目验证。
