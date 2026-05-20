# Alembic Plugin First Enhancement Wave 1 Workspace Plan

日期：2026-05-18
总控窗口：AlembicWorkspace
状态：Wave 1A 已验收；Wave 1B 待启动
长期路线：`Plugin first, Alembic install enhances`

## 背景

上一波 Codex-only 残留收口已经验收完成：`Alembic` 主包不再走多 IDE Agent delivery 主线，`AlembicPlugin` 不再携带传统 IDE 模板，Dashboard artifact 已同步。

本波把两个方向合并处理：

- 残存优化：把 public contract、消费层和 UI 中残留的 `ide-agent` / `ide-edit` 命名收敛为 host-neutral 语义，同时保留旧数据兼容。
- 主要路线：开始落地 `AlembicPlugin` 作为 Codex host agent 入口、`Alembic` 作为本地增强底座的前期模块划分；本波先做接口和路由基础，不做最终跨仓库总验收。

## 原始代码发现

以下为 Wave 1A 启动前发现；当前 Core / Alembic 完成情况以回填区为准。

- `AlembicCore/src/repository/evolution/ProposalRepository.ts` 的 `ProposalSource` 包含 `ide-agent`。
- `AlembicCore/src/service/knowledge/RecipeProductionGateway.ts` 的 `GatewaySource` 包含 `ide-agent`，并把 user/source label 写为 `ide-agent`。
- `AlembicCore/src/types/reactive-evolution.ts` 的 `FileChangeEventSource` 包含 `ide-edit`，注释写 VSCode extension 弹窗语义。
- `AlembicPlugin/lib/external/mcp/handlers/evolve-external.ts` 仍向 Core 提交 `source: 'ide-agent'` 和 `verifiedBy: 'ide-agent'`。
- `AlembicAgent/src/tools/v2/handlers/knowledge.ts` 仍把 evolution proposal source 默认到 `ide-agent`。
- `AlembicDashboard/src/types.ts` 仍把 `ProposalSource` 定义为包含 `ide-agent`。
- `Alembic/lib/http/routes/file-changes.ts` 当前 `VALID_SOURCES` 仍接受 `ide-edit`；`Alembic/lib/http/HttpServer.ts` 还有 Extension 注释。
- `AlembicPlugin/lib/codex/ToolPolicy.ts` 已有 Codex host-agent workflow 与 explicit internal AI job 双路线。
- `AlembicPlugin/lib/external/mcp/CodexMcpServer.ts` 已能启动 daemon、打开 Dashboard、投递 `alembic_codex_bootstrap/rescan` internal AI job。
- `Alembic/lib/http/routes/daemon.ts` 只暴露最小 health identity；还没有面向 Plugin 增强判断的能力清单。
- `AlembicPlugin/lib/daemon/DaemonSupervisor.ts` 当前启动 packaged runtime 的 `dist/bin/daemon-server.js`；还没有独立的本地 Alembic 安装探测 / 选择层。

不是本波任务：

- `RELEASE-PLAYBOOK.md` 中“不创建 `.cursor` / `.vscode`”属于负向验证说明，保留。
- `PathGuard` 测试中阻止 `.cursor` / `.vscode` / `.github` 写入属于负向断言，保留。
- `BiliDili` 不进入本波，除非后续需要真实项目 smoke。

## 目标

- 在 `AlembicCore` 增加清晰的 source contract：`host-agent` 表示 Codex / 外部宿主 Agent，`alembic-agent` 表示 Alembic 内部 Agent runtime；保留 `ide-agent` / `ide-edit` 作为兼容 alias 或旧数据读取值。
- 在 `Alembic` 增加本地增强能力 identity，让 Plugin 能判断本地 Alembic daemon / API / Dashboard / job 能力是否可用。
- 为下一步 `AlembicPlugin` 消费本地 Alembic 增强路线做清晰接口，不在 Plugin 内继续复制或扩大 Alembic daemon / registry / JobStore 实现。
- 在消费层完成后，`AlembicPlugin` 的外部宿主路径使用 `host-agent` / `host-edit`；`AlembicAgent` 内部 Agent runtime 使用 `alembic-agent`；`AlembicDashboard` 同时能显示两类来源。

## 执行顺序

本计划拆成 Wave 1A 和 Wave 1B：

- Wave 1A：先启动 `AlembicCore` 和 `Alembic`。Core 负责 source contract；Alembic 负责本地增强能力 identity 和 file-change source 兼容入口。
- Wave 1B：`AlembicCore` 和 `Alembic` 已回填，可以启动 `AlembicPlugin`、`AlembicAgent`、`AlembicDashboard` 消费新 contract 和本地增强能力。

## Wave 1A 总控验收

验收结论：通过，可以启动 Wave 1B 消费层任务。

- `AlembicCore` 工作区 clean，HEAD 为 `c0ee3d6e27cc3c77283e9bb27a7b17f8a522e9d7`；代码已公开 `host-agent`、`alembic-agent`、`host-edit` 与旧 source 兼容 helper。
- `Alembic` 工作区 clean，HEAD 为 `91fbe993f389868b9895f086c3695d222027cd0c`；daemon health 已暴露 `enhancement` / `capabilities`，file-change route 已接收 `host-edit` 并兼容旧编辑 source。
- 总控复跑：`AlembicCore npm run build:check` 通过；`AlembicCore npm run test -- test/SourceContracts.test.ts test/ProposalRepository.test.ts test/unit/production-gateway.test.ts` 通过，55 tests；`AlembicCore npm run smoke:public-api` 通过，75 exact public API entrypoints。
- 总控复跑：`Alembic npm run build:check` 通过；`Alembic npm run test:unit -- test/unit/DaemonCapabilities.test.ts test/unit/DaemonFileChangeCollector.test.ts` 通过，5 tests；`Alembic npm run lint:consumer-core-imports` 通过，415 files / 556 `@alembic/core` imports。
- 复核发现的文档证据问题：`docs/Alembic/alembic-plugin-first-enhancement-wave-1-daemon-capabilities-2026-05-18.md` 中 Core HEAD 误写为短 hash，已修正为 `c0ee3d6e27cc3c77283e9bb27a7b17f8a522e9d7`。

## 窗口分派

派发只看这张表：`待启动`、`执行中` 且仍有实际执行任务的窗口才发送提示词；`阻塞`、`观察中`、`无任务` 不发送。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `AlembicCore`<br>已完成 | 已补 source contract：`host-agent` 表示外部宿主 Agent，`alembic-agent` 表示 Alembic 内部 Agent runtime，`host-edit` 表示宿主编辑事件；旧 `ide-agent` / `ide-edit` 保留兼容读取；已补 helper / export / 测试。 |
| `Alembic`<br>已完成 | 已补本地增强能力 identity：daemon health/capabilities 暴露 Plugin 可判断的 API、job、Dashboard、file monitor、internal AI 能力；同步 file-change source 兼容。 |
| `AlembicPlugin`<br>待启动 | 消费新 source contract，并新增本地 Alembic install / daemon enhancement probe 与 route choice。 |
| `AlembicAgent`<br>待启动 | 把 V2 knowledge / evolution 默认 source 从旧 IDE 语义切到 `alembic-agent`，不使用 `host-agent`。 |
| `AlembicDashboard`<br>待启动 | 更新 ProposalSource 类型、source label 和相关 UI 文案。 |
| `BiliDili`<br>无任务 | 本波是接口和路线前期开发，不做真实项目 smoke。 |

## AlembicCore 执行要求

文档动作：新建执行记录。

保存位置：`docs/AlembicCore/alembic-plugin-first-enhancement-wave-1-core-source-contract-2026-05-18.md`

挂载入口：本文“回填区 / AlembicCore”。

目标：

- 在 public types 中引入 `host-agent` 作为 Codex / 外部宿主 Agent 来源，并引入 `alembic-agent` 作为 AlembicAgent / Alembic internal AI 来源；保留 `ide-agent` 兼容旧 DB、旧调用方和历史 Recipe source。
- 在 reactive file-change source 中引入 `host-edit` 或等价 host-neutral 命名；保留 `ide-edit` 兼容旧客户端输入。
- 增加或补齐 normalizer / display label helper，明确 `host-agent`、`alembic-agent`、`host-edit` 和旧兼容值的映射，避免各消费层自己判断旧值。
- 更新注释，把 VSCode extension 弹窗语义改为宿主编辑事件 / daemon 汇总语义。
- 确认 `@alembic/core` public exports 暴露新类型 / helper，消费层无需 deep import。

禁止事项：

- 不删除旧枚举值导致历史数据无法读取。
- 不引入 Codex、Dashboard、HTTP、daemon 或 AI provider 依赖。
- 不把兼容 alias 伪装成新主路线；新写入默认值必须是 host-neutral。

建议验证命令：

```text
npm run build:check
npm run smoke:public-api
npm run lint:public-api-boundary
npm run lint:consumer-core-imports
git diff --check
rg -n "VSCode|VS Code|Extension|ide-agent|ide-edit" src --glob '!**/dist/**'
```

回填要求：完成范围、public export 变化、兼容策略、提交 hash、验证命令、验证结果、遗留风险、需要消费层替换的具体值。

## Alembic 执行要求

文档动作：新建执行记录。

保存位置：`docs/Alembic/alembic-plugin-first-enhancement-wave-1-daemon-capabilities-2026-05-18.md`

挂载入口：本文“回填区 / Alembic”。

目标：

- 在 `/api/v1/daemon/health` 或新的稳定 daemon endpoint 中暴露本地增强能力 identity，例如 daemon mode、projectRoot、dataRoot、projectId、version、schemaMigrationVersion、dashboard URL、jobs bootstrap/rescan、file monitor、internal AI availability。
- 能力字段要服务于 `AlembicPlugin` 判断“是否可把重任务交给本地 Alembic”，不要变成 Dashboard 专属 shape。
- 接收 Core 新 file-change source；旧 `ide-edit` 只作为兼容输入，不作为新默认文案。
- 清理主包仍可见的 Extension / VSCode 注释；如果某个注释只是历史兼容，改成外部宿主 / host edit source。
- 不改 Plugin，不在 Alembic 内复制 Plugin MCP / skill / channel onboarding。

禁止事项：

- 不恢复多 IDE Agent 安装器、模板、delivery pipeline。
- 不把 `AlembicPlugin` 的 Codex tool policy 迁入 Alembic。
- 不删除 daemon、HTTP/API、Dashboard server、JobStore、ProjectRegistry 或 internal AI jobs。

建议验证命令：

```text
npm run build:check
npm run lint:core-import-boundary
npm run lint:consumer-core-imports
npm run test:unit -- test/unit/DaemonFileChangeCollector.test.ts
git diff --check
rg -n "VSCode|VS Code|Extension|ide-agent|ide-edit|native/IDE" lib bin config templates README.md README_CN.md --glob '!**/dist/**' --glob '!CHANGELOG.md'
```

回填要求：完成范围、daemon capability shape、file-change 兼容策略、提交 hash、验证命令、验证结果、遗留风险、Plugin 下一步消费方式。

## AlembicPlugin 后续要求

当前状态：待启动，解除条件已满足。

解除条件：已满足；`AlembicCore` 已回填 host-neutral source contract，`Alembic` 已回填 daemon capability identity。

后续任务预案：

- 新建执行记录：`docs/AlembicPlugin/alembic-plugin-first-enhancement-wave-1-plugin-route-2026-05-18.md`
- 将 `evolve-external`、status、diagnostics、README/skill 中的 source 写入切到 `host-agent`，旧值只作为兼容读取。
- 增加本地 Alembic enhancement probe / resolver：识别 embedded plugin runtime 与本地 Alembic install / daemon 能力，status/diagnostics 中展示 route choice。
- `alembic_codex_dashboard`、`alembic_codex_bootstrap`、`alembic_codex_rescan` 应优先使用可用本地 Alembic daemon/API；没有本地 Alembic 时继续使用 plugin embedded runtime。
- 不删除 runtime snapshot，不把 Plugin 改成 npm registry 发布。

边界要求：

- `host-agent` 只表示 Codex / 外部宿主 Agent 提交；不要用它描述 Alembic internal AI。
- 本地 Alembic enhancement route 只做探测、选择和转发，不把 Alembic 的 daemon、JobStore、ProjectRegistry 或 internal AI provider 复制进 Plugin。
- status / diagnostics 要说明 route choice：embedded runtime、本地 Alembic daemon、本地 Alembic install 或不可用原因。
- 如果本地 Alembic daemon 可用但 capability 缺失，要降级到 embedded runtime，并把缺失字段写入执行记录。

建议验证命令：

```text
npm run build:check
npm run verify:codex-plugin
npm run verify:codex-channel
npm run smoke:codex-plugin
npm run lint:core-import-boundary
git diff --check
```

## AlembicAgent 后续要求

当前状态：待启动，解除条件已满足。

解除条件：已满足；`AlembicCore` 已回填 host-neutral source contract。

后续任务预案：

- 新建执行记录：`docs/AlembicAgent/alembic-plugin-first-enhancement-wave-1-agent-source-contract-2026-05-18.md`
- 将 Tool V2 knowledge / evolution 默认 source 从 `ide-agent` 改为 `alembic-agent`，旧 source 只作为兼容输入；`host-agent` 只用于 Codex / 外部宿主 Agent 路线。
- 保持 terminal / sandbox 作为 Agent tool capability，不迁给 Plugin。

边界要求：

- AlembicAgent 是 Alembic internal AI runtime，不参与 Plugin 的 `host-agent` 命名。
- domain-specific source 如 `rescan-evolution`、`file-change` 继续表达具体机制；只有通用 AlembicAgent / internal AI 写入默认值切到 `alembic-agent`。
- 若发现 Core contract 缺少必要 helper，先回填执行记录并标注阻塞，不在 Agent 内自造另一套 source contract。

建议验证命令：

```text
npm run build:check
npm run smoke:public-imports
npm run lint:public-api-boundary
git diff --check
```

## AlembicDashboard 后续要求

当前状态：待启动，解除条件已满足。

解除条件：已满足；`AlembicCore` 已回填 host-neutral source contract。

后续任务预案：

- 新建执行记录：`docs/AlembicDashboard/alembic-plugin-first-enhancement-wave-1-dashboard-source-labels-2026-05-18.md`
- 更新 `ProposalSource` 类型、source label、筛选 / 展示文案，同时区分 Codex / 外部宿主来源的 `host-agent` 和 Alembic 内部 Agent runtime 来源的 `alembic-agent`。
- 不改 Dashboard API client 之外的后端能力归属。

边界要求：

- UI 展示层只消费后端 / Core contract，不在 Dashboard 内重新定义路由策略。
- 旧 `ide-agent` / `ide-edit` 只能作为兼容显示来源，文案要能表达“旧来源 / 兼容来源”，不作为新主线。
- 如 API 响应还没暴露新字段，先保持兼容展示并在执行记录中列出需要后端补齐的字段。

建议验证命令：

```text
npm run build
git diff --check
rg -n "ide-agent|ide-edit|VSCode|VS Code|Extension" src --glob '!**/dist/**'
```

## 总体验收条件

本波执行后不立刻做最终大验收；等 Wave 1A 和 Wave 1B 都回填后，再新建统一验收文档。当前阶段的完成条件是：

- Core 新 source contract 有兼容策略、public export 和验证证据。
- Alembic daemon capability identity 可被 Plugin 消费，且不绑定 Dashboard UI shape。
- 消费层任务解除条件已满足，后续仍应按本计划逐窗口回填验证证据，避免空转或越界删除。

总控复核命令：

```text
node scripts/verify-workspace-docs.mjs --all-workspace
node scripts/check-dispatch-coverage.mjs
git diff --check
```

## 可复制分派提示词

发送给：`AlembicPlugin`、`AlembicAgent`、`AlembicDashboard`

```text
读取 docs/workspace/alembic-plugin-first-enhancement-wave-1-workspace-plan-2026-05-18.md，按照文档，领取并完成分配给你所在窗口的任务；完成后回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。
```

不发送给：`AlembicCore`、`Alembic`、`BiliDili`。

## 回填区

### AlembicCore

- 状态：已完成
- 执行记录：`docs/AlembicCore/alembic-plugin-first-enhancement-wave-1-core-source-contract-2026-05-18.md`
- 完成范围：新增 Core source contract helper / type；`host-agent` 表示外部宿主 Agent，`alembic-agent` 表示 AlembicAgent / internal AI runtime，`host-edit` 表示宿主编辑事件；旧 `ide-agent` / `ide-edit` 保留读取兼容；`ProposalRepository` 新写入归一，`host-agent` 过滤覆盖旧 `ide-agent` 行；`RecipeProductionGateway` 和 reactive evolution 类型改用共享 helper；public API smoke 覆盖新增导出；清理 Core 注释中的旧 VSCode 命名。
- Public export 变化：`@alembic/core/shared` 暴露 source constants、normalizer 和 label helper；`@alembic/core/repositories` 暴露 proposal source helper；`@alembic/core/knowledge` 暴露 gateway source helper；`@alembic/core/types` 暴露 file-change source helper。
- 兼容策略：新外部宿主写入使用 `host-agent`，新内部 Agent runtime 写入使用 `alembic-agent`，新编辑事件使用 `host-edit`；旧 `ide-agent` / `ide-edit` 只作为历史数据和旧调用方兼容值读取。
- 提交 hash：`c0ee3d6e27cc3c77283e9bb27a7b17f8a522e9d7`
- 验证结果：`npm run lint` 通过；`npm run build:check` 通过；`npm run test -- test/SourceContracts.test.ts test/ProposalRepository.test.ts test/unit/production-gateway.test.ts` 通过，55 tests；`npm run test -- test/PublicConsumerCoreImportBoundary.test.ts test/SourceContracts.test.ts test/ProposalRepository.test.ts test/unit/production-gateway.test.ts` 通过，59 tests；`npm run lint:consumer-core-imports` 通过；`npm run build` 通过；`npm run smoke:public-api` 通过；`npm run lint:public-api-boundary` 通过；`git diff --check` 通过；`npm run check` 通过，61 files / 923 tests，测试期间仍打印既有非致命 `Could not access 'HEAD'` stderr。
- 残留扫描：`rg -n "VSCode|VS Code|ide-agent|ide-edit|alembic-agent" src --glob '!**/dist/**'` 无 `VSCode` / `VS Code` 命中；剩余命中为 `alembic-agent` canonical source 与 `ide-agent` / `ide-edit` 兼容常量、兼容注释。包含 `Extension` 的完整扫描剩余命中均为语言特性 / AST / Guard 规则语义。
- 遗留风险：消费层尚未切换；Core 为历史 DB 兼容继续保留旧 source 值，不应被消费层作为新默认写入使用；Core `dist/` 未提交，发布或 runtime snapshot 仍由对应发布流程生成。
- 下一步建议：启动 `AlembicPlugin`、`AlembicAgent`、`AlembicDashboard` Wave 1B；Plugin 使用 `host-agent`，Agent 使用 `alembic-agent`，Dashboard 同时展示两类新来源和旧兼容来源。

### Alembic

- 状态：已完成
- 执行记录：`docs/Alembic/alembic-plugin-first-enhancement-wave-1-daemon-capabilities-2026-05-18.md`
- 完成范围：扩展 `/api/v1/daemon/health`，新增 `dashboardUrl`、`enhancement` 和 `capabilities`，覆盖 API、Dashboard、bootstrap/rescan jobs、daemon file monitor、internal AI availability；daemon 启动时写入 Dashboard mounted identity；file-change route 接受 `host-edit` 并继续兼容旧编辑 source；清理 Alembic 主包旧 source / Extension 注释；删除无消费方的 `LanguageExtensions` shim，调用方直接消费 `@alembic/core/host-agent-workflows`。
- Daemon capability shape：`capabilities.api` 暴露 base URL 与 health path；`capabilities.dashboard` 暴露 Dashboard 可用性和 URL；`capabilities.jobs` 暴露 `bootstrap` / `rescan` endpoint；`capabilities.fileMonitor` 暴露 `host-edit` / git source、兼容 alias 和 daemon git worktree monitor 状态；`capabilities.internalAi` 暴露 provider/model/config source/availability。
- File-change 兼容策略：新输入使用 `host-edit`、`git-head`、`git-worktree`；历史编辑 source 只作为兼容 alias，由 route 归一到 `host-edit`；新 capabilities 和文案不再把旧 source 作为主路线。
- 提交 hash：`91fbe993f389868b9895f086c3695d222027cd0c`
- 验证结果：`npm run build:check` 通过；`npm run build` 通过；`npm run lint:core-import-boundary` 通过；`npm run lint:consumer-core-imports` 通过；`npm run test:unit -- test/unit/DaemonCapabilities.test.ts test/unit/DaemonFileChangeCollector.test.ts` 通过，5 个测试通过；`npm run test:unit -- test/unit/AgentModuleBoundaries.test.ts` 通过，10 个测试通过；`git diff --check` 通过；修改文件级 `npx biome check --diagnostic-level=error` 通过；`rg -n "VSCode|VS Code|Extension|ide-agent|ide-edit|native/IDE" lib bin config templates README.md README_CN.md --glob '!**/dist/**' --glob '!CHANGELOG.md'` 0 命中。
- 遗留风险：Alembic 构建使用 workspace 本地 `../AlembicCore` 源码；Core 已回填并提交 `c0ee3d6e27cc3c77283e9bb27a7b17f8a522e9d7`，消费层启动时应对齐该 contract；运行时 `fileMonitor.compatibilityAliases` 仍会暴露历史编辑 source alias 以支持旧客户端输入，但源码扫描无旧字面量命中。
- 下一步建议：启动 `AlembicPlugin` Wave 1B；Plugin 应读取 `/api/v1/daemon/health` 的 `enhancement` / `capabilities` 做 local Alembic install / daemon route choice，优先复用本地 daemon Dashboard 和 bootstrap/rescan job 能力，缺失时回退 embedded runtime。

### AlembicPlugin

- 状态：待启动，AlembicCore / Alembic 已验收
- 执行记录：`docs/AlembicPlugin/alembic-plugin-first-enhancement-wave-1-plugin-route-2026-05-18.md`
- 任务：消费 Core 新 source contract，把外部 MCP / Codex host 写入切到 `host-agent`；新增本地 Alembic enhancement probe / resolver，优先复用可用本地 daemon/API，缺失时回退 embedded runtime。
- 回填重点：route choice shape、capability 缺失降级策略、source 替换范围、提交 hash、验证命令与结果、遗留风险。

### AlembicAgent

- 状态：待启动，AlembicCore 已验收
- 执行记录：`docs/AlembicAgent/alembic-plugin-first-enhancement-wave-1-agent-source-contract-2026-05-18.md`
- 任务：Tool V2 knowledge / evolution 默认 source 切到 `alembic-agent`；旧 `ide-agent` 只兼容读取；不要使用 `host-agent` 描述 AlembicAgent。
- 回填重点：默认 source 替换点、保留的 domain-specific source、验证命令与结果、是否需要 Core 追加 helper。

### AlembicDashboard

- 状态：待启动，AlembicCore 已验收
- 执行记录：`docs/AlembicDashboard/alembic-plugin-first-enhancement-wave-1-dashboard-source-labels-2026-05-18.md`
- 任务：更新 source 类型、label、筛选 / 展示文案，同时支持 `host-agent`、`alembic-agent` 和旧兼容来源。
- 回填重点：UI/API 类型变化、兼容来源展示方式、验证命令与结果、需要后端补齐的字段。
