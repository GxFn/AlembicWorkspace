# Alembic Core / Agent Interface Boundary Workspace Plan

日期：2026-05-18
总控窗口：AlembicWorkspace
状态：已完成

后续入口：`docs/workspace/alembic-core-agent-interface-boundary-wave-1-acceptance-wave-2-plan-2026-05-18.md`

本文用于指挥 `AlembicCore` 接口边界优化收尾，以及 `AlembicAgent` 接口边界优化全量治理。本文是新总控入口，不修改旧迁移文档。

## 1. 总目标

1. `AlembicCore` 收尾 public API 边界：把 `AlembicAgent` 纳入正式 Core 消费仓库，收敛外层剩余 transitional import，明确哪些需要稳定 facade、哪些只能保留 transitional adapter。
2. `AlembicAgent` 建立完整接口边界治理：分类 `@alembic/agent` 所有 public subpath，增加机器可检查的 package export policy、self import smoke、消费方 deep import 规则，并治理自身对 `@alembic/core` 的未收口依赖。
3. `Alembic` 继续作为宿主消费方：保持完全切到 `@alembic/agent` 的状态，不恢复 `lib/agent/**` 或 generic Tool V2 duplicate，只反馈真实缺口。
4. `AlembicPlugin` 保持 agent-free：不得引入 `@alembic/agent`，只参与 Core 边界收尾和 release/runtime 观察。
5. `AlembicDashboard` 继续只做前端/API 展示边界观察：没有直接 `@alembic/core` / `@alembic/agent` 依赖时不改代码。

## 2. 已核对的真实代码事实

### 2.1 Core 当前边界

- `@alembic/core` 当前有 15 个 Stable Public exact exports：`.`、`./daemon`、`./database`、`./dimensions`、`./events`、`./guard`、`./host-agent-workflows`、`./io`、`./knowledge`、`./logging`、`./project-intelligence`、`./repositories`、`./search`、`./vector`、`./workspace`。
- `@alembic/core` 当前有 21 个 Provisional Public exact exports。
- `@alembic/core` 当前把 wildcard exports 统一视为 `transitional-internal`；Phase 9 记录为 Exact 73、Wildcard 61、Total 134，Stable 15、Provisional 21、Transitional 98。
- `AlembicCore/scripts/lint-consumer-core-imports.mjs` 已能扫描任意 consumer root，并按 Stable / Provisional / Transitional 分类。

### 2.2 外层 Core 消费现状

用 Core scanner 和当前配置核对：

| 仓库 | Core refs | Stable | Provisional | Transitional | issue |
| --- | ---: | ---: | ---: | ---: | ---: |
| `Alembic` | 601 | 401 | 7 | 193 | 0 |
| `AlembicPlugin` | 517 | 357 | 8 | 152 | 0 |
| `AlembicAgent` | 56 | 42 | 0 | 14 | 14 |
| `AlembicDashboard` | 0 | 0 | 0 | 0 | 0 |

关键结论：`AlembicAgent` 已经是 Core 的真实消费方，但还没有独立 allowlist / reference limit / stable replacement 策略；这就是 Core 收尾必须处理的新边界。

### 2.3 AlembicAgent 当前 public subpath

`@alembic/agent` 当前 package exports：

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
- `./tools/v2`
- `./tools/terminal`
- `./memory`
- `./context`

`Alembic` 当前已消费这些 Agent public subpath，代表性 import 数包括：

- `@alembic/agent/tools`：35
- `@alembic/agent/memory`：29
- `@alembic/agent/service`：27
- `@alembic/agent/runtime`：14
- `@alembic/agent/ai`：12
- `@alembic/agent/tools/terminal`：10
- `@alembic/agent/forge`：6
- `@alembic/agent/prompts`：6
- `@alembic/agent/tools/v2`：5
- `@alembic/agent/context`：4
- `@alembic/agent/tasks`：2

### 2.4 AlembicAgent 当前 Core transitional imports

`AlembicAgent` 当前被 Core scanner 判定为 issue 的 14 个 refs：

| Specifier | refs | 代表文件 | 初步边界判断 |
| --- | ---: | --- | --- |
| `@alembic/core/shared/token-utils` | 2 | `ContextWindow.ts`, `ConversationStore.ts` | 可能应由 Core stable utility facade 或 Agent 本地 token helper 替代。 |
| `@alembic/core/shared/concurrency` | 2 | `AgentRunCoordinator.ts`, `FanOutStrategy.ts` | 需要判断是 Core deterministic utility 还是 Agent execution policy。 |
| `@alembic/core/shared/similarity` | 2 | `MemoryRetriever.ts`, `MemoryStore.ts` | 可能应由 Core stable search/vector/utility facade 暴露。 |
| `@alembic/core/infrastructure/database/drizzle/schema` | 2 | `MemoryStore.ts` | Agent memory 持久化直接触碰 Core Drizzle schema，必须明确是否为 adapter allowlist 或 Core memory repository contract 缺口。 |
| `@alembic/core/shared/constants` | 1 | `SessionStore.ts` | 需要稳定常量 facade 或 Agent 自有配置边界。 |
| `@alembic/core/domain/dimension/DimensionSop` | 1 | `insight-analyst.ts` | 需要判断是否并入 `@alembic/core/dimensions`。 |
| `@alembic/core/service/evolution/RecipeImpactPlanner` | 1 | `EvolutionAgentRun.ts` | 需要判断是否属于 Core stable evolution/knowledge contract。 |
| `@alembic/core/shared/folder-names` | 1 | `package-assets.ts` | 可能应使用 `@alembic/core/workspace`。 |
| `@alembic/core/domain/dimension/RecipeDimension` | 1 | `tools/v2/handlers/knowledge.ts` | 可能应使用 `@alembic/core/dimensions`。 |
| `@alembic/core/domain/knowledge/FieldSpec` | 1 | `tools/v2/handlers/knowledge.ts` | 可能应使用 `@alembic/core/knowledge`。 |

## 3. 边界决策

1. `AlembicCore` 不为“好看”新增空 facade。新增 stable export 必须对应真实调用方、真实实现、测试和迁移说明。
2. `AlembicAgent` 不能绕过 `@alembic/core` 包入口，也不能复制 Core repository / SQLite / Drizzle / workflow 内核形成第二套实现。
3. `AlembicAgent` 的终端、沙箱、Tool V2、AI provider、memory/context、service/runtime/prompts/domain 都属于 Agent public contract 的治理对象；其中真实 process/PTY/sandbox executor 仍属于 `Alembic` host bridge。
4. `Alembic` 已删除本地 `lib/agent/**` 和 generic Tool V2 duplicate；后续缺口必须反馈 `AlembicAgent` 补 contract，禁止恢复本地 duplicate。
5. `AlembicPlugin` 继续 agent-free；即使 `AlembicAgent` 完成 full API governance，Plugin 也不得新增 `@alembic/agent`。
6. `AlembicDashboard` 只有在后端 API / capability shape 变化时执行 UI/API smoke；本轮不直接接入 Core 或 Agent package。

## 4. Wave 1 任务分派

Wave 1 可以并行启动。依赖关系是：`AlembicCore` 的稳定 facade 判断会影响 `AlembicAgent` 后续替换 Core transitional imports，但不阻塞 `AlembicAgent` 先建立自身 public API governance。

| 窗口 | 状态 | 任务 | 文档动作 | 保存位置 | 挂载入口 | 回填位置 | 验证命令 | 阻塞/依赖 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `AlembicCore` | 已完成 | Core interface boundary closeout Wave 1：已把 `AlembicAgent` 纳入 consumer 边界；已扫描 Alembic/AlembicPlugin/AlembicAgent 三方 Core imports；已判断 Agent 14 个 transitional refs 的 stable replacement / Core narrow facade / adapter allowlist 去向；已提出 Phase 10 closeout patch 清单。 | 已新建 | `docs/AlembicCore/alembic-core-interface-boundary-closeout-wave-1-2026-05-18.md` | 本文第 4 节 | 本文第 7.1 节 | `npm run check`; `npm run smoke:public-api`; `node scripts/lint-consumer-core-imports.mjs ../AlembicAgent --format=json`; `node scripts/lint-consumer-core-imports.mjs ../Alembic --config ../Alembic/config/core-import-boundary.json --format=json`; `node scripts/lint-consumer-core-imports.mjs ../AlembicPlugin --config ../AlembicPlugin/config/core-import-boundary-allowlist.json --format=json` | 已完成；若进入 Wave 2 新增 stable facade，必须先列出真实调用方、测试和 consumer 替换计划。 |
| `AlembicAgent` | 已完成 | Agent interface boundary optimization Wave 1：已建立 `@alembic/agent` public API boundary policy、export 分类、self smoke、Core consumer allowlist；已替换可用稳定 facade，剩余 non-stable Core refs 已冻结并反馈 Core；未改 Alembic/Plugin/Dashboard。 | 已新建 | `docs/AlembicAgent/alembic-agent-interface-boundary-optimization-wave-1-2026-05-18.md` | 本文第 4 节 | 本文第 7.2 节 | `npm run build:check`; `npm run lint`; `npm run lint:agent-import-boundary`; `npm run lint:public-api-boundary`; `npm run lint:core-import-boundary`; `npm run test`; `npm run check`; `npm run smoke:public-imports` | 已完成，提交 `b3a57e3a6ff83525332901ad6ceda24cf2fb7d21`。 |
| `Alembic` | 已完成 | 消费侧证据 Wave 1：已复验 `@alembic/agent` 消费面和 Core consumer boundary；已列出 Alembic 是否还需要 Agent 新 public subpath 或 Core stable facade；未恢复本地 Agent/Tool duplicate。 | 已新建 | `docs/Alembic/alembic-core-agent-interface-consumer-scan-wave-1-2026-05-18.md` | 本文第 4 节 | 本文第 7.3 节 | `npm run lint:agent-extraction-boundary`; `npm run lint:core-import-boundary`; `npm run lint:consumer-core-imports`; `npm run build:check`; `npm run check`; 15 个 `@alembic/agent` public subpath import smoke | 已完成；无新增代码提交，基线 `ea816fcba9934dcf2bad942cb8424459c0e46455`。 |
| `AlembicPlugin` | 已完成 | Plugin consumer / agent-free 证据 Wave 1 已完成：Core boundary 0 issue，agent-free gate 0，`@alembic/agent` 0 命中；已列出 Plugin 仍需要 Core stable facade / transitional adapter 的真实调用点。 | 已新建 | `docs/AlembicPlugin/alembic-core-interface-consumer-agent-free-scan-wave-1-2026-05-18.md` | 本文第 4 节 | 本文第 7.4 节 | `npm run report:agent-extraction-boundary`; `npm run lint:core-import-boundary`; `npm run lint:consumer-core-imports`; `npm run build:check`; `npm run check`; `rg -n "@alembic/agent" lib bin config scripts plugins test --glob "*.ts" --glob "*.js" --glob "*.mjs" --glob "*.json"` 均完成；`npm run check` 有既有 Biome warnings / infos 但退出码为 0。 | 不依赖 Agent；未新增 `@alembic/agent`；无新增代码提交，复验基线 `12b7dd2fdb4d8654d78e548cce8a6692c4fd96be`。 |
| `AlembicDashboard` | 观察中 | 前端边界观察：确认没有直接 `@alembic/core` / `@alembic/agent` package 消费；只有 Core/Agent/Alembic 后续改变 HTTP/API shape 时才进入 UI/API smoke。 | 无需新建；如发现直接依赖或 API shape 变化再新建 | `docs/AlembicDashboard/alembic-core-agent-dashboard-api-observation-2026-05-18.md` | 本文第 4 节 | 本文第 7.5 节 | `rg -n "@alembic/(core|agent)" src package.json`; 如触发 UI 变更再运行 `npm run build` | 观察 Core/Agent/Alembic 回填。 |

## 5. Wave 2 预案

Wave 2 必须等待 Wave 1 总控验收后启动。

### 5.1 Core 可能进入的实现任务

- 新增或调整 narrow stable facades，例如 dimensions / knowledge / workspace / shared utility / evolution contract，但必须有真实调用方和测试。
- 把 `AlembicAgent` 纳入 Core consumer boundary 文档与脚本口径。
- 更新 `config/public-api-boundary.json`、public API tests、smoke 脚本和 migration notes。
- 不删除 transitional wildcard exports，除非三方 consumer 扫描证明引用清零且外层已同步。

### 5.2 Agent 可能进入的实现任务

- 替换自身可替换的 Core transitional imports。
- 为不可替换的 Core imports 建立冻结 allowlist / reference limit / adapter path。
- 将 package export policy 加入 `npm run check`，类似 Core 的 `lint:public-api-boundary`。
- 视 Wave 1 判断，收窄 root `.` 聚合出口或明确标注 root 为 aggregate，不让新消费方默认依赖根入口大杂烩。
- 增加 public subpath import smoke，至少覆盖当前 15 个 subpath。

### 5.3 外层同步任务

- `Alembic`：更新 `@alembic/agent` file dependency 和 `vendor/AlembicCore` 指针，重跑 Agent/Core boundary、build/check、host smoke。
- `AlembicPlugin`：只同步 Core vendor，不同步或引入 Agent；重跑 agent-free 和 Codex plugin verify/smoke。
- `AlembicDashboard`：仅在 Alembic API shape 变化时执行 build/live UI smoke。

## 6. 完成标准

Wave 1 完成时必须具备：

- `AlembicCore` 给出三方 consumer scan，且明确 `AlembicAgent` 14 个 Core transitional refs 的处理去向。
- `AlembicAgent` 给出完整 public API export inventory、分类策略、机器检查计划或实现、Core consumer allowlist/替换计划。
- `Alembic` 给出当前 Agent/Core 消费面是否有缺口的证据。
- `AlembicPlugin` 给出 agent-free 和 Core consumer 证据。
- `AlembicDashboard` 给出无直接 package 依赖，或说明触发 UI/API smoke 的原因。

Wave 2 / Wave 3 完成后，目标状态是：

- `AlembicAgent` 对 `@alembic/core` 的 non-stable import 不再无治理增长。
- `@alembic/agent` public subpath 被机器可检查地锁定。
- `Alembic` 继续只通过 `@alembic/agent` 消费 Agent/tool/terminal portable contract。
- `AlembicPlugin` 保持 `@alembic/agent` 0 依赖。
- `AlembicDashboard` 不承担 Core/Agent runtime。

## 7. 回填区

### 7.1 AlembicCore 回填

- 状态：已完成
- 完成范围：已把 `AlembicAgent` 纳入 Core consumer 扫描口径，并复验 `Alembic` / `AlembicPlugin` / `AlembicAgent` 三方 Core imports；已确认 `Alembic` 为 451 files / 601 refs / issueCount 0，`AlembicPlugin` 为 315 files / 517 refs / issueCount 0，`AlembicAgent` 为 211 files / 56 refs / issueCount 14；已逐项判断 Agent 14 个 transitional refs 的 stable replacement、Core narrow facade、Agent adapter allowlist 或 Agent local defaults 去向。执行记录见 `docs/AlembicCore/alembic-core-interface-boundary-closeout-wave-1-2026-05-18.md`。
- 提交 hash：无新增 Core 代码提交；AlembicCore 验证基线为 `92ccd10baad1eac5fcfe3b4d4c8191a02042da04`。workspace 总控文档不在子仓库 git 内。
- 验证命令与结果：`npm run check` 通过，包含 `build:check`、public API boundary、916 个测试和 Biome，测试输出仍有既有 `Could not access 'HEAD'` 杂音但退出码为 0；`npm run smoke:public-api` 通过，成功 import 73 个 exact public API entrypoints；`node scripts/lint-consumer-core-imports.mjs ../AlembicAgent --format=json` 预期失败，stable 42、transitional 14、issueCount 14；`node scripts/lint-consumer-core-imports.mjs ../Alembic --config ../Alembic/config/core-import-boundary.json --format=json` 通过，stable 401、provisional 7、transitional 193、issueCount 0；`node scripts/lint-consumer-core-imports.mjs ../AlembicPlugin --config ../AlembicPlugin/config/core-import-boundary-allowlist.json --format=json` 通过，stable 357、provisional 8、transitional 152、issueCount 0。
- Agent 14 个 transitional refs 处理判断：4 个已有 stable replacement，分别是 `DimensionSop` -> `@alembic/core/dimensions`、`RecipeDimension` -> `@alembic/core/dimensions`、`FieldSpec` -> `@alembic/core/knowledge`、`folder-names` -> `@alembic/core/workspace`；`token-utils`、`concurrency`、`similarity`、`RecipeImpactPlanner` 需要 Core Wave 2 评估 narrow facade；raw Drizzle schema 不应稳定化，需转向 memory repository contract 或 Agent adapter allowlist；`shared/constants` 优先由 Agent 本地化 cache defaults，除非后续证明有多 consumer 需求。
- 遗留风险：`AlembicAgent` 仍有 14 个 Core transitional refs；Core 已有 `repository/memory/MemoryRepository.ts` 但未纳入公开 repository bundle，Agent memory 仍直接依赖 raw schema；utility facade 命名和 stable/provisional 状态尚未最终确定；Core check 输出仍有 `Could not access 'HEAD'` 杂音。
- 下一步建议：`AlembicAgent` 先完成 4 个 stable replacement，并建立 Core consumer allowlist / reference limit；`AlembicCore` Wave 2 只围绕真实调用方实现 token / concurrency / similarity / evolution / memory repository 的窄 facade；`Alembic` 与 `AlembicPlugin` 等 Core Wave 2 有代码提交后再同步 vendor 指针；`AlembicDashboard` 继续观察。

### 7.2 AlembicAgent 回填

- 状态：已完成
- 完成范围：已新建 `docs/AlembicAgent/alembic-agent-interface-boundary-optimization-wave-1-2026-05-18.md`；新增 `config/agent-public-api-boundary.json`、`scripts/lint-agent-public-api-boundary.mjs`、`scripts/smoke-agent-public-imports.mjs`，锁定 `@alembic/agent` 15 个 exact public exports；新增 `config/core-import-boundary.json` 和 `npm run lint:core-import-boundary`，并接入 `npm run check`；替换可用 Core stable facade；将 Agent token/concurrency helper 收到本仓库本地实现；未修改 Alembic/Plugin/Dashboard。
- 提交 hash：`b3a57e3a6ff83525332901ad6ceda24cf2fb7d21`
- 验证命令与结果：`npm run build:check` 通过；`npm run lint` 通过，仍打印既有 Biome warnings；`npm run lint:agent-import-boundary` 通过；`npm run lint:public-api-boundary` 通过；`npm run lint:core-import-boundary` 通过；`npm run test` 通过，9 files / 37 tests；`npm run check` 通过；`npm run smoke:public-imports` 通过，15 个 public subpaths 均可 import；`git diff --check` 通过。
- public API 分类结果：15 个 stable-public exact exports：`.`、`./agent`、`./service`、`./runtime`、`./prompts`、`./domain`、`./forge`、`./tasks`、`./profiles`、`./ai`、`./tools`、`./tools/v2`、`./tools/terminal`、`./memory`、`./context`；provisional 0；transitional 0；wildcard exports 0。
- Core import boundary 处理结果：初始 56 refs / 42 stable / 0 provisional / 14 transitional / 14 issues；本轮后带 config 扫描为 52 refs / 46 stable / 1 provisional / 5 transitional / issueCount 0。剩余受控 non-stable refs 为 `@alembic/core/shared/similarity` 2、`@alembic/core/infrastructure/database/drizzle/schema` 2、`@alembic/core/shared/constants` 1、`@alembic/core/service/evolution` 1。
- 遗留风险：剩余 non-stable Core refs 已由 reference limit 冻结，但是否新增 Core stable facade 需要 AlembicCore 后续决策；`npm run lint` 仍打印既有 warning 但退出码为 0。
- 下一步建议：总控可将 AlembicAgent Wave 1 标记为已完成；等待 AlembicCore 判断是否新增 stable similarity/schema/constants/evolution facade 后，再派 Agent Wave 2 替换剩余 allowlist imports。

### 7.3 Alembic 回填

- 状态：已完成
- 完成范围：已复验 Alembic 作为宿主消费方仍只通过 `@alembic/agent` public subpath 消费 Agent 能力；已确认没有恢复 `lib/agent/**`、generic Tool V2 duplicate、terminal duplicate、memory/context duplicate、service/runtime/prompts/domain duplicate；已复验 Core consumer boundary 451 files / 601 imports / issueCount 0；已完成 15 个 `@alembic/agent` public subpath import smoke。执行记录见 `docs/Alembic/alembic-core-agent-interface-consumer-scan-wave-1-2026-05-18.md`。
- 提交 hash：无新增代码提交；Alembic 基线为 `ea816fcba9934dcf2bad942cb8424459c0e46455`
- 验证命令与结果：`npm run lint:agent-extraction-boundary` 通过；`npm run lint:core-import-boundary` 通过；`npm run lint:consumer-core-imports` 通过；`npm run build:check` 通过；`npm run check` 通过（Biome 仍报告既有 warnings/infos）；`node vendor/AlembicCore/scripts/lint-consumer-core-imports.mjs . --config config/core-import-boundary.json --format=json` 通过，stable-public 401、provisional-public 7、transitional-internal 193、issueCount 0；15 个 `@alembic/agent` public subpath import smoke 通过。
- Agent/Core contract 缺口反馈：Alembic 暂无阻塞性 Agent 新 public subpath 诉求，当前使用的 public subpath 均可 import；暂无阻塞性 Core stable facade 诉求，193 个 Core transitional refs 由现有 allowlist 治理且 issue 为 0；`ToolContextFactory` 仍是 host-owned DI/repository/search/gateway/project-root/data-root/sandbox bridge，建议继续留在 Alembic。
- 遗留风险：`npm run check` 仍有既有 Biome warnings/infos；Alembic 仍有 193 个 Core transitional refs，后续需跟随 Core stable facade / allowlist 收口策略；`@alembic/agent` file dependency 后续若更新 public API governance，Alembic 需要同步复验。
- 下一步建议：等待 `AlembicCore` 与 `AlembicAgent` Wave 1 回填；若上游进入 Wave 2 facade / export policy 实现，Alembic 再同步 `@alembic/agent` file dependency / `vendor/AlembicCore` 指针并重跑 Agent/Core boundary、build/check 和 public subpath smoke。

### 7.4 AlembicPlugin 回填

- 状态：`已完成`
- 完成范围：已新建 `docs/AlembicPlugin/alembic-core-interface-consumer-agent-free-scan-wave-1-2026-05-18.md`；复验 Core consumer boundary、agent-free gate、无 `@alembic/agent`；分析 Plugin 侧 152 个 Core transitional refs 的真实生产/测试调用点。
- 提交 hash：无新增代码提交；`AlembicPlugin` 复验基线为 `12b7dd2fdb4d8654d78e548cce8a6692c4fd96be`。
- 验证命令与结果：`npm run report:agent-extraction-boundary` 通过，315 个文件且 agent / ai / tool boundary counts 全 0；`npm run lint:core-import-boundary` 通过，315 个文件、517 个 `@alembic/core` imports、0 issue；`npm run lint:consumer-core-imports` 通过；`node vendor/AlembicCore/scripts/lint-consumer-core-imports.mjs . --config config/core-import-boundary-allowlist.json --format=json` 通过，Stable 357、Provisional 8、Transitional 152、issueCount 0；`npm run build:check` 通过；`npm run check` 通过，仍有既有 Biome 123 warnings / 29 infos；`rg -n "@alembic/agent" lib bin config scripts plugins test --glob "*.ts" --glob "*.js" --glob "*.mjs" --glob "*.json"` 0 命中。
- Core contract 缺口反馈：无当前阻塞；Plugin 仍有 152 个 Core transitional refs、75 个 unique specifiers，已受 allowlist/reference limits 约束。后续 Core 可优先判断真实生产调用点：`KnowledgeSyncService`、`EvolutionGateway`、`developer-identity` / `WorkspaceSettingsStore`、`CapabilityProbe`、`infrastructure/config/Paths`、`SimilarityService`、knowledge service internals、signal/report infrastructure、DB/repository adapter；测试专用 AST parser / migration schema / value object imports 不应为测试单独新增 public facade。
- agent-free 复验结果：`report:agent-extraction-boundary` 全 0；`@alembic/agent` 指定范围扫描 0 命中；未新增 Agent dependency、import、vendor 或 runtime 资源。
- 遗留风险：152 个 transitional refs 仍需后续 Core Wave 1/2 判断 stable facade、provisional facade 或 adapter allowlist 去向；`npm run check` 的 Biome warning/info 为既有提示，本轮不做非目标清理。
- 下一步建议：等待 `AlembicCore` Wave 1 给出三方 consumer 判断；若 Core Wave 2 新增 stable facade，Plugin 只同步 Core vendor 并替换可替换 imports，继续保持 `@alembic/agent` 0 依赖。

### 7.5 AlembicDashboard 回填

- 状态：
- 完成范围：
- 提交 hash：
- 验证命令与结果：
- 是否触发 UI/API smoke：
- 遗留风险：
- 下一步建议：

## 8. 可复制分派提示词

```text
读取 docs/workspace/alembic-core-agent-interface-boundary-workspace-plan-2026-05-18.md，按照文档，领取并完成分配给你所在窗口的任务；完成后回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。
```

本提示词当前发给：

- `AlembicCore`
- `AlembicAgent`
- `Alembic`
- `AlembicPlugin`

本轮不发送给：

- `AlembicDashboard`：状态为 `观察中`，当前没有实际任务。只有 Core/Agent/Alembic 后续回填显示 HTTP/API shape 或前端 contract 发生变化时，才再派发 Dashboard observation / smoke 任务。

## 9. 总控下一步

1. 等 Wave 1 回填后，先验收 `AlembicCore` 和 `AlembicAgent`。
2. 如果 Core 需要新增 stable facade，则先派 Core Wave 2，再派 Agent 替换。
3. 如果 Agent 只需本地 allowlist / public API governance，不依赖 Core 改动，则 Agent Wave 2 可以和外层消费验证并行。
4. `Alembic` / `AlembicPlugin` 的 vendor/dependency 同步必须等上游提交明确后再启动。
