# AlembicCore Phase 1-9 外层仓库验收报告

日期：2026-05-17
状态：阶段 1-9 外层接入验收与下一轮任务分配

## 1. 验收范围

本轮只验收 `Alembic` 与 `AlembicPlugin` 两个外层仓库对 `AlembicCore` 的接入和阶段 1-9 迁移执行情况。

验收重点：

- Core 是否作为子仓库与 `file:vendor/AlembicCore` 模块依赖被统一接入。
- 外层仓库是否能通过 Core import boundary 检查。
- 外层仓库是否仍在增长 Core deep import。
- CI、lint、build 是否足以保护阶段 1-9 的边界。
- 剩余 deep import 哪些可以直接交给外层继续替换，哪些需要反馈 Core 做 Phase 10 设计。

本轮不直接修改两个外层仓库代码。外层修正任务写在本文档中，由对应窗口执行。

## 2. 硬性规则

1. 外层仓库新增 Core import 时，默认只能使用 `Stable Public` facade。
2. `Provisional Public` 只能作为迁移期显式记录使用，不能变成新代码默认入口。
3. `Transitional Internal` 只能保留既有 baseline，引用数不能增长。
4. 删除旧外层实现前必须满足：Core 稳定入口存在、外层切换完成、build/test/smoke/import-boundary 通过。
5. Core 不接管 Codex MCP tool、Skill 文案、AgentRuntime、tool policy、AI provider、API key、Dashboard presenter、CLI/HTTP delivery、marketplace/channel 发布。
6. Core 可以提供 host-agent 知识挖掘闭环的确定性协议、持久化、检查和资源能力；宿主 agent 的执行、提示词、工具编排仍在外层。
7. CI 必须 checkout submodules，并且至少在 build job 中运行 Core import boundary 检查。
8. 外层 allowlist / reference limit 是冻结基线，不是免责清单；每完成一批替换都应该下调对应上限或清理 stale metadata。
9. 文档长期存放在 `docs/AlembicCore/`，不要写入个人机器绝对路径。

## 3. 当前接入状态

| 项目 | Alembic | AlembicPlugin |
| --- | --- | --- |
| 工作区状态 | clean | clean |
| 最新提交 | `05fede2 chore: consume core logging facade` | `5139965 chore: migrate stable core facade imports` |
| Core 子仓库 | `vendor/AlembicCore` | `vendor/AlembicCore` |
| Core 指针 | `6b7b52a17fe214816c41344860caeb8bf35f1923` | `6b7b52a17fe214816c41344860caeb8bf35f1923` |
| package dependency | `@alembic/core: file:vendor/AlembicCore` | `@alembic/core: file:vendor/AlembicCore` |
| lockfile resolved | `vendor/AlembicCore` | `vendor/AlembicCore` |

结论：

- 两个外层仓库已经统一成子仓库 + file dependency 的接入模式。
- 两个外层仓库当前都指向同一个 Core 提交，阶段 1-9 的 Core 侧基础一致。
- `AlembicPlugin` CI 已经设置 `submodules: true`；`Alembic` CI 还没有，需要优先修正。

## 4. 验证结果

### 4.1 Alembic

| 命令 | 结果 | 说明 |
| --- | --- | --- |
| `npm run lint:consumer-core-imports` | 通过 | 扫描 630 个文件、755 个 `@alembic/core` import，0 violation。 |
| `npm run lint:core-import-boundary` | 通过 | 114 个当前 specifier，0 stale allowlist，0 reduced frozen entry。 |
| `npm run build:check` | 通过 | Core build + TypeScript noEmit 通过。 |
| `npm run lint -- --diagnostic-level=error` | 通过 | 与 CI lint 口径一致。 |
| `npm run lint` | 通过但有 warning | 311 warnings、25 infos，主要是既有 lint debt，不阻断 CI error 口径。 |

验收结论：代码接入和边界检查通过，但 CI 配置不完整，不能算完全闭环。

### 4.2 AlembicPlugin

| 命令 | 结果 | 说明 |
| --- | --- | --- |
| `npm run lint:consumer-core-imports` | 通过 | 扫描 601 个文件、675 个 `@alembic/core` import，0 violation。 |
| `npm run lint:core-import-boundary` | 通过 | 本地旧脚本报告 764 refs / 102 unique，随后 Core 扫描器报告 675 refs。 |
| `npm run build:check` | 通过 | Core build + TypeScript noEmit 通过。 |
| `npm run lint -- --diagnostic-level=error` | 失败 | `config/core-import-boundary-allowlist.json` 需要 Biome 格式化。 |
| `npm run lint` | 失败 | 同一个格式化错误；另有 warning backlog。 |

验收结论：Core 接入和 build 通过，但 lint/CI 当前会失败，必须先修 `config/core-import-boundary-allowlist.json` 格式。

## 5. Core Import 当前分布

| 仓库 | 扫描文件 | Core imports | Stable | Provisional | Transitional | Unique specifiers | Violations |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Alembic | 630 | 755 | 321 | 42 | 392 | 109 | 0 |
| AlembicPlugin | 601 | 675 | 454 | 8 | 213 | 98 | 0 |

阶段 1-9 的迁移是有效的：两个仓库的 Stable Public import 比例明显提升，尤其 AlembicPlugin 已经把 logging / project-intelligence / workspace / events / io / knowledge 等入口大量切到稳定 facade。

但剩余 Transitional Internal 仍然很多。下一轮不应该继续新增 Core API，而应该先让外层把已经存在的稳定入口用干净。

## 6. CI 与脚本问题

### 6.1 Alembic CI 问题

`Alembic/.github/workflows/ci.yml` 当前 checkout 没有 `submodules: true`。仓库依赖 `file:vendor/AlembicCore`，CI 不拉子模块时 `npm ci` 或 `npm run build` 存在失败风险。

同时 build job 没有显式运行：

- `npm run lint:core-import-boundary`
- `npm run lint:consumer-core-imports`

虽然 `package.json` 的 `check` 脚本包含这些检查，但 CI 当前 build job 并没有运行 `npm run check`，因此边界门禁没有真正进入 CI。

### 6.2 AlembicPlugin CI 问题

`AlembicPlugin/.github/workflows/ci.yml` 已经：

- checkout submodules。
- 在 build job 中运行 `npm run lint:core-import-boundary`。

当前阻断点是 `config/core-import-boundary-allowlist.json` 格式化失败。这个文件应由 Plugin 窗口直接格式化，不需要 Core 改代码。

### 6.3 AlembicPlugin boundary 口径问题

AlembicPlugin 的本地 `scripts/lint-core-import-boundary.mjs` 仍报告旧基线：

- 764 refs
- 102 unique specifiers

Core 扫描器当前报告：

- 675 refs
- 98 unique specifiers

这不是运行时错误，但会让后续验收口径混乱。Plugin 窗口应在下一批修正时二选一：

1. 将本地脚本改成只委托 Core 扫描器。
2. 或保留本地冻结脚本，但同步更新命名、注释、metadata，明确它检查的是历史上限，而不是当前真实引用数。

## 7. Alembic 剩余 deep import 优先级

Alembic 当前最大的剩余 Transitional Internal：

| 当前 import | 数量 | 下一步 |
| --- | ---: | --- |
| `@alembic/core/shared/resolveProjectRoot` | 36 | 改为 `@alembic/core/workspace`。 |
| `@alembic/core/infrastructure/signal/SignalBus` | 31 | 改为 `@alembic/core/events`。 |
| `@alembic/core/shared/TimerRegistry` | 12 | 改为 `@alembic/core/events`。 |
| `@alembic/core/domain/knowledge/KnowledgeEntry` | 11 | 改为 `@alembic/core/knowledge`。 |
| `@alembic/core/domain/knowledge/Lifecycle` | 11 | 改为 `@alembic/core/knowledge`。 |
| `@alembic/core/shared/ProjectMarkers` | 10 | 改为 `@alembic/core/workspace`。 |
| `@alembic/core/shared/WorkspaceResolver` | 8 | 改为 `@alembic/core/workspace`。 |
| `@alembic/core/shared/lifecycle` | 8 | 改为 `@alembic/core/events` 的 lifecycle type。 |
| `@alembic/core/core/AstAnalyzer` | 6 | 改为 `@alembic/core/project-intelligence`。 |
| `@alembic/core/infrastructure/event/EventBus` | 6 | 改为 `@alembic/core/events`。 |
| `@alembic/core/shared/PathGuard` | 6 | 改为 `@alembic/core/io`。 |

需要反馈 Core 进一步判断的项：

- `@alembic/core/infrastructure/config/Paths`
- `@alembic/core/repository/knowledge/KnowledgeRepository.impl`
- `@alembic/core/service/knowledge/KnowledgeSyncService`
- `@alembic/core/service/knowledge/SourceRefReconciler`
- `@alembic/core/service/knowledge/ConfidenceRouter`
- `@alembic/core/shared/test-mode`
- `@alembic/core/types/workflows`
- `@alembic/core/types/snapshot-views`

这些不能简单要求外层改 import。外层窗口需要先确认调用语义，再反馈 Core 是否补稳定 facade 或维持 transitional。

## 8. AlembicPlugin 剩余 deep import 优先级

AlembicPlugin 当前最大的剩余 Transitional Internal：

| 当前 import | 数量 | 下一步 |
| --- | ---: | --- |
| `@alembic/core/types/workflows` | 9 | 优先检查是否可由 `@alembic/core/host-agent-workflows` 覆盖；缺口反馈 Core。 |
| `@alembic/core/service/knowledge/SourceRefReconciler` | 7 | 不直接稳定 service deep path；反馈调用语义。 |
| `@alembic/core/service/knowledge/ConfidenceRouter` | 6 | 不直接稳定 service deep path；反馈调用语义。 |
| `@alembic/core/service/knowledge/KnowledgeSyncService` | 6 | 先确认是否属于 `@alembic/core/knowledge` facade 缺口。 |
| `@alembic/core/shared/lifecycle` | 6 | 改为 `@alembic/core/events` 的 lifecycle type。 |
| `@alembic/core/types/snapshot-views` | 6 | 优先检查是否应由 `@alembic/core/project-intelligence` 覆盖；缺口反馈 Core。 |
| `@alembic/core/infrastructure/config/Paths` | 5 | 判断是 workspace/config facade 缺口，还是外层 delivery 路径逻辑。 |
| `@alembic/core/repository/knowledge/KnowledgeRepository.impl` | 5 | 优先走 `@alembic/core/repositories` factory，不把 impl 作为稳定入口。 |
| `@alembic/core/shared/concurrency` | 5 | 谨慎处理，避免把 AgentRuntime 执行策略稳定进 Core。 |
| `@alembic/core/shared/developer-identity` | 5 | 判断是否属于 knowledge metadata contract。 |

Plugin 已经完成大量 stable facade 切换，下一轮重点不是大面积替换已完成类别，而是处理边界模糊的 service/types/shared 项。

## 9. 分配给 Alembic 窗口的任务

### A1. 先修 CI 闭环

修改 `Alembic/.github/workflows/ci.yml`：

- 所有 `actions/checkout@v5` 步骤增加 `with: submodules: true`。
- Build & Lint job 在 `npm run lint -- --diagnostic-level=error` 后增加 `npm run lint:core-import-boundary`。
- 如 CI 时间允许，也增加 `npm run lint:consumer-core-imports`，或者确认 `lint:core-import-boundary` 已覆盖调用。

验证命令：

- `npm run lint -- --diagnostic-level=error`
- `npm run lint:core-import-boundary`
- `npm run lint:consumer-core-imports`
- `npm run build:check`

### A2. 继续替换已有稳定 facade

按批次执行，不要混在一个大提交里：

1. Workspace 批次：`resolveProjectRoot`、`ProjectMarkers`、`WorkspaceResolver`、`ProjectRegistry` -> `@alembic/core/workspace`。
2. Events 批次：`SignalBus`、`EventBus`、`TimerRegistry`、`shared/lifecycle` -> `@alembic/core/events`。
3. Knowledge 批次：`KnowledgeEntry`、`Lifecycle`、可确认的 `KnowledgeService` / `RecipeProductionGateway` -> `@alembic/core/knowledge`。
4. IO 批次：`PathGuard` / `WriteZone` -> `@alembic/core/io`。
5. Project Intelligence 批次：`AstAnalyzer` / discovery / panorama deep import -> `@alembic/core/project-intelligence`。

每批完成后：

- 更新 `config/core-import-boundary.json` 中对应 `frozenMaxOccurrences` / `referenceLimits` 下限。
- 记录剩余无法替换的 import、文件、原因。
- 运行同 A1 的验证命令。

### A3. 反馈 Core 缺口

不要自行扩大 allowlist。以下项需要形成反馈清单：

- 当前 specifier
- 调用文件
- 使用到的符号
- 是否已有 stable facade 可替代
- 如果不能替代，缺少的 Core contract 是类型、factory、业务服务、还是测试工具

### A4. 可删除或合并的重复脚本

以下文件可以安排删除，但必须先完成同一提交内的 package script / CI 改造，并通过验证命令：

| 文件 | 删除条件 | 替代方式 |
| --- | --- | --- |
| `scripts/lint-core-import-boundary.mjs` | CI 已改为运行 Core 扫描器，且本地脚本不再承担独立规则。 | package script 直接调用 `vendor/AlembicCore/scripts/lint-consumer-core-imports.mjs . --config config/core-import-boundary.json`。 |
| `scripts/lint-consumer-core-imports.mjs` | wrapper 只做路径转发，没有额外 Alembic 专属逻辑。 | package script 直接调用 Core 子仓库脚本。 |

删除验证：

- `npm run lint:core-import-boundary`
- `npm run lint:consumer-core-imports`
- `npm run build:check`
- `npm run lint -- --diagnostic-level=error`

删除提交中必须同时更新 `package.json` 和 CI，不能留下指向已删除脚本的命令。

## 10. 分配给 AlembicPlugin 窗口的任务

### P1. 先修 lint 阻断

格式化 `config/core-import-boundary-allowlist.json`，不改变语义。

验证命令：

- `npm run lint -- --diagnostic-level=error`
- `npm run lint`
- `npm run lint:core-import-boundary`
- `npm run lint:consumer-core-imports`
- `npm run build:check`

### P2. 统一 boundary 口径

处理 `scripts/lint-core-import-boundary.mjs` 与 Core 扫描器口径不一致的问题：

- 推荐方案：让本地脚本委托 `vendor/AlembicCore/scripts/lint-consumer-core-imports.mjs`。
- 如果保留本地脚本，必须更新注释和 metadata，说明它是历史冻结脚本，不是当前真实扫描统计。

同时更新 `config/core-import-boundary-allowlist.json` 的 stale metadata：

- `referenceCount` 当前真实值应按 Core 扫描器重新生成。
- `uniqueSpecifierCount` 当前真实值应按 Core 扫描器重新生成。

### P3. 处理边界模糊的剩余 import

优先处理：

1. `shared/lifecycle` -> `@alembic/core/events`。
2. `types/workflows` -> 检查 `@alembic/core/host-agent-workflows` 是否已覆盖；未覆盖项反馈 Core。
3. `types/snapshot-views` -> 检查 `@alembic/core/project-intelligence` 是否应覆盖；未覆盖项反馈 Core。
4. `KnowledgeSyncService`、`SourceRefReconciler`、`ConfidenceRouter` -> 不直接稳定 service deep path，先提交调用语义清单。
5. `KnowledgeRepository.impl` -> 优先改 repository factory；不能改的场景反馈 Core。
6. `shared/concurrency`、`developer-identity` -> 形成边界判断材料，不要直接推进成 stable import。

### P4. 保持 Plugin 禁止事项

Plugin 不能把以下职责迁入 Core：

- Codex Skill / MCP tool schema / marketplace 发布。
- daemon bridge、包安装、channel delivery。
- API key readiness、provider 执行、模型策略。
- AgentRuntime、tool policy、Codex prompt/tool 名称。

### P5. 可删除或合并的重复脚本

以下文件可以安排删除，但必须先完成同一提交内的 package script / CI 改造，并通过验证命令：

| 文件 | 删除条件 | 替代方式 |
| --- | --- | --- |
| `scripts/lint-core-import-boundary.mjs` | 已不再需要维护本地扫描实现和旧统计口径。 | package script 直接调用 `vendor/AlembicCore/scripts/lint-consumer-core-imports.mjs . --config config/core-import-boundary-allowlist.json`。 |

删除验证：

- `npm run lint:core-import-boundary`
- `npm run lint:consumer-core-imports`
- `npm run build:check`
- `npm run lint -- --diagnostic-level=error`

删除提交中必须同步清理旧脚本引用，避免 CI 或 package script 继续调用已删除文件。

## 11. Core 下一步任务

Core Phase 10 不应该先写新 facade，而要等两个窗口反馈无法替换清单后再判断。

候选判断顺序：

1. `types/workflows` 是否应补进 `@alembic/core/host-agent-workflows`。
2. `types/snapshot-views` 是否应补进 `@alembic/core/project-intelligence`，或单独形成 report/view contract。
3. `shared/errors/*` 是否需要稳定 `@alembic/core/errors` 入口。
4. `developer-identity` 是否属于 `@alembic/core/knowledge` metadata contract。
5. `infrastructure/config/Paths` 是否属于 `@alembic/core/workspace` / `@alembic/core/config`，还是外层 delivery path。
6. `KnowledgeSyncService`、`SourceRefReconciler`、`ConfidenceRouter` 是否应该通过 `@alembic/core/knowledge` 暴露更窄接口，而不是暴露 service 类。
7. `shared/concurrency`、`token-utils`、`test-mode` 先维持谨慎，不因为外层方便就稳定化。

Core 下一步验收输入必须来自外层真实文件和真实符号，不接受只根据路径名新增 facade。

## 12. 当前总评

阶段 1-9 的总体方向是正确的：两个外层仓库已经能通过 Core 边界扫描，且 Stable Public import 比例显著提升。

但当前不是完全收尾状态：

- Alembic 的 CI 没有拉 submodules，也没有把 boundary lint 真正挂进 CI。
- AlembicPlugin 的 CI 会被 allowlist JSON 格式化阻断。
- AlembicPlugin 的旧 boundary 脚本和 Core 扫描器统计口径不一致。
- 两个仓库都还有不少 Transitional Internal import，需要继续分批收敛。

下一轮先让两个外层窗口修 CI/lint 和已知 stable facade 替换。Core 等待无法替换清单，再进入 Phase 10 的真实 API 缺口设计。
