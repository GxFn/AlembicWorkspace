# AlembicCore Facade Readiness Wave 3B-Consumer Plan

日期：2026-05-18
总控窗口：AlembicWorkspace
状态：执行中

## 总控验收结论

`AlembicCore` Wave 3B-Core 已通过总控验收，可以进入消费层替换波。

Core 完成提交：`75fac5642b6da736a00667539a720172d23b85c3`

消费层更新：Alembic 执行替换时发现 `@alembic/core/types` 尚未 re-export `types/workflows.ts` 的 workflow contract 类型。本文件已追加 Core 3B-Core-2 任务；在该缺口补齐前，消费层不得硬绕路删除 `@alembic/core/types/workflows` residual。

复核命令：

| 命令 | 总控复核结果 |
| --- | --- |
| `npm run lint:public-api-boundary` | 通过；136 package exports classified；stable 17 / provisional 21 / transitional 98；wildcard 61；no-growth 保持。 |
| `npm run report:public-api-closeout` | 通过；replacement readiness `113/113`；`consumer-ready-stable=6`、`consumer-ready-provisional=107`、`split-required=0`、`keep-transitional=0`。 |
| `npm run smoke:public-api` | 通过；`Imported 75 exact public API entrypoints.` |
| `npm run build:check` | 通过。 |
| `npm run check` | 通过；60 test files / 919 tests passed；Biome checked 415 files；存在既有 `Could not access 'HEAD'` 提示但退出码为 0。 |
| `git diff --check` | 通过。 |
| `git -C AlembicCore status --short` | 干净。 |

验收判断：

- Core 已补齐 `@alembic/core/config` exact facade 直接导出。
- Core 已在 `config/public-api-boundary.json` 写入 `closeout.facadeReadiness`，为 `shared / config / types / candidate` deep imports 提供替换目标和决策。
- Core report 可复现 replacement readiness，并能扫描 `Alembic`、`AlembicPlugin`、`AlembicAgent` 三个消费方。
- 本波没有修改外层消费代码，也没有删除 Core wildcard exports，符合 3B-Core 边界。

## Wave 3B-Consumer 目标

本波只处理消费层 import replacement，不处理 Core 删除。

目标：

1. `Alembic` 替换本波 4 组 deep imports：`shared / config / types / service/candidate`，按 Core 执行记录映射到 exact facade。
2. `AlembicPlugin` 执行同样替换，并保持 agent-free / artifact-only release 边界。
3. 静态 import、dynamic import、`vi.mock` / `vi.doMock` / `vi.doUnmock` 全部同步切到目标 facade，避免测试继续锁定旧 deep specifier。
4. `@alembic/core/types` 目标只用于 type-only contract；能保持 `import type` 的地方必须保持 type-only。
5. 替换完成后收紧各自 Core import boundary allowlist / reference limits，让旧 deep specifier 不再作为允许入口。

## Core 替换地图来源

权威来源是：

- `docs/AlembicCore/alembic-core-facade-readiness-wave-3b-2026-05-18.md`
- `AlembicCore/config/public-api-boundary.json` 的 `closeout.facadeReadiness`
- `npm run report:public-api-closeout` 输出的 replacement readiness

本波目标组：

| 旧 deep export 组 | refs | 消费方 | 目标 facade | 决策 |
| --- | ---: | --- | --- | --- |
| `@alembic/core/shared/*` | 69 | Alembic 37；AlembicPlugin 32 | 多数到 `@alembic/core/shared`；`folder-names` 到 `@alembic/core/workspace`；`similarity` 到 `@alembic/core/search` | stable 6 / provisional 63 |
| `@alembic/core/infrastructure/config/*` | 18 | Alembic 11；AlembicPlugin 7 | `@alembic/core/config` | provisional |
| `@alembic/core/types/*` | 16 | Alembic 14；AlembicPlugin 2 | `@alembic/core/types` | provisional，type-only |
| `@alembic/core/service/candidate/*` | 10 | Alembic 5；AlembicPlugin 5 | `@alembic/core/service/candidate` | provisional |

优先顺序：

1. 先替换 stable-ready 入口：`shared/folder-names -> workspace`，`shared/similarity -> search`。
2. 再替换 `infrastructure/config/* -> config`，注意 namespace import 可使用 `ConfigDefaults` / `ConfigPaths`。
3. 再替换 `types/* -> types`，注意保持 type-only。
4. 再替换 `service/candidate/* -> service/candidate`。
5. 最后替换剩余 `shared/* -> shared`，同步 dynamic import 和 mocks。

## 禁止事项

- 消费层窗口不修改 `AlembicCore` 源码；Core `types/workflows` facade 缺口已单独追加 3B-Core-2 任务。
- 不删除 Core wildcard exports；删除必须在消费层替换、扫描和代表性验证完成后另开 closeout wave。
- 不更新 `vendor/AlembicCore` 指针，不刷新 Plugin portable runtime / Codex plugin artifact，不做 npm publish、release staging 或 marketplace sync。
- 不把 `@alembic/core/shared` / `@alembic/core/config` / `@alembic/core/types` / `@alembic/core/service/candidate` 误标为 stable；本波只是消费层收敛到 exact facade。
- 不绕过 `@alembic/core` package exports 去引用 `../AlembicCore/src/**` 或 `vendor/AlembicCore/src/**`。
- 不改业务逻辑、状态机、持久化语义、HTTP/MCP 行为或 Codex plugin release 边界；除非测试暴露必须修复的真实 import 语义问题，并在执行记录中说明。

## 窗口分派

初始计划为 `Alembic` 和 `AlembicPlugin` 并行执行。Alembic 执行中发现 `types/workflows` facade 缺口后，当前优先级调整为先补 Core 3B-Core-2，再继续消费层完整收口。

| 窗口 | 状态 | 任务 | 文档动作 | 保存位置 | 挂载入口 | 回填位置 | 验证命令 | 阻塞/依赖 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `Alembic` | 阻塞 | 已按 Core 替换地图完成可安全替换的 consumer import 收敛；`shared / config / candidate / reactive-evolution / snapshot-views` 旧 deep specifier 已清零；`types/workflows` 因 Core `@alembic/core/types` 尚未 re-export workflow contract 类型而保留 residual。 | 已新建 | `docs/Alembic/alembic-core-facade-consumer-replacement-wave-3b-2026-05-18.md` | 本文“窗口分派”；`docs/workspace/index.md` 当前入口 | 本文“回填区 / Alembic” | `npm run lint:consumer-core-imports`；`npm run lint:core-import-boundary`；`npm run build:check`；`npm run lint`；`npm run test:unit`；`npm run check`；目标旧 specifier 负向扫描；`git diff --check`；`git status --short` | 需要 Core 3B-Core-2 补齐 `@alembic/core/types` 对 `types/workflows` 的 facade export 后，再删除 residual。 |
| `AlembicPlugin` | 阻塞 | 已完成可安全替换的 consumer import 收敛；`shared / config / candidate / reactive-evolution / snapshot-views` 旧 deep specifier 已清零，同步 dynamic import / mocks，并收紧 `config/core-import-boundary-allowlist.json`；`types/workflows` 因 Core `@alembic/core/types` facade 缺口保留 1 个 residual。 | 已新建 | `docs/AlembicPlugin/alembic-plugin-core-facade-consumer-replacement-wave-3b-2026-05-18.md` | 本文“窗口分派”；`docs/workspace/index.md` 当前入口 | 本文“回填区 / AlembicPlugin” | `npm run lint:consumer-core-imports`；`npm run lint:core-import-boundary`；`npm run build:check`；`npm run lint`；`npm run test:unit`；`npm run check`；`npm run report:agent-extraction-boundary`；`npm run verify:codex-plugin`；`npm run smoke:codex-plugin`；目标旧 specifier 负向扫描；`git diff --check`；`git status --short` | 需要 Core 3B-Core-2 补齐 `@alembic/core/types` workflow contract facade；另外 Core `@alembic/core/search` 未 re-export individual signal classes，阻塞 `SearchRanking.test.ts`。未触碰 portable runtime / release artifact。 |
| `AlembicCore` | 待启动 | 追加 3B-Core-2：补齐 `@alembic/core/types` 对 `types/workflows.ts` workflow contract 类型的 re-export，并复跑 public API smoke/report；此前 consumer 不删除 `@alembic/core/types/workflows` residual。 | 新建 | `docs/AlembicCore/alembic-core-types-workflows-facade-wave-3b-core-2-2026-05-18.md` | 本文“回填区 / AlembicCore”；`docs/workspace/index.md` 当前入口 | 待新建 Core 3B-Core-2 回填区，并回填本文“回填区 / AlembicCore” | `npm run lint:public-api-boundary`；`npm run report:public-api-closeout`；`npm run smoke:public-api`；`npm run build:check` | 由 Alembic consumer build 发现 facade 缺口。 |
| `AlembicAgent` | 观察中 | Agent Core imports 已 stable-only，本波无直接任务。消费层完成后总控确认 Agent scan 仍 issue 0。 | 无需新建 | 无 | 本文“窗口分派” | 本文“回填区 / AlembicAgent” | 无 | 不发送提示词。 |
| `AlembicDashboard` | 无任务 | 本波不涉及 Dashboard UI/API client。 | 无需新建 | 无 | 本文“窗口分派” | 本文“回填区 / AlembicDashboard” | 无 | 不发送提示词。 |
| `BiliDili` | 无任务 | 当前是 Alembic/AlembicPlugin Core import 收敛，不涉及真实测试项目。 | 无需新建 | 无 | 本文“窗口分派” | 本文“回填区 / BiliDili” | 无 | 不发送提示词。 |

## Alembic 执行要求

替换范围：

- `@alembic/core/shared/folder-names` -> `@alembic/core/workspace`
- `@alembic/core/shared/similarity` -> `@alembic/core/search`
- `@alembic/core/infrastructure/config/ConfigLoader` -> `@alembic/core/config`
- `@alembic/core/infrastructure/config/Defaults` -> `@alembic/core/config`
- `@alembic/core/infrastructure/config/Paths` -> `@alembic/core/config`
- `@alembic/core/types/reactive-evolution` -> `@alembic/core/types`
- `@alembic/core/types/snapshot-views` -> `@alembic/core/types`
- `@alembic/core/types/workflows` -> `@alembic/core/types`
- `@alembic/core/service/candidate/CandidateAggregator` -> `@alembic/core/service/candidate`
- `@alembic/core/service/candidate/SimilarityService` -> `@alembic/core/service/candidate`
- 其它 `@alembic/core/shared/*` 目标按 Core readiness map 收敛到 `@alembic/core/shared`。

特别注意：

- `scripts/diagnose-mcp.ts`、`scripts/install-cursor-skill.ts` 等 scripts 也在 scanRoots 中，不能只改 `lib/`。
- `test/unit/BootstrapTerminalToolset.test.ts`、`test/unit/TestMode.test.ts`、`test/unit/KnowledgeAPI.test.ts` 等 dynamic import / mock 必须同步到新 facade。
- `types/*` 替换时保留 `import type`。
- 更新 `config/core-import-boundary.json` 时，同时移除旧 specifier 和对应 reference limits；不要为了让 lint 过而把旧 deep specifier 重新 allowlist。

## AlembicPlugin 执行要求

替换范围：

- `@alembic/core/shared/similarity` -> `@alembic/core/search`
- `@alembic/core/infrastructure/config/ConfigLoader` -> `@alembic/core/config`
- `@alembic/core/infrastructure/config/Defaults` -> `@alembic/core/config`
- `@alembic/core/infrastructure/config/Paths` -> `@alembic/core/config`
- `@alembic/core/types/reactive-evolution` -> `@alembic/core/types`
- `@alembic/core/types/snapshot-views` -> `@alembic/core/types`
- `@alembic/core/types/workflows` -> `@alembic/core/types`
- `@alembic/core/service/candidate/CandidateAggregator` -> `@alembic/core/service/candidate`
- `@alembic/core/service/candidate/SimilarityService` -> `@alembic/core/service/candidate`
- 其它 `@alembic/core/shared/*` 目标按 Core readiness map 收敛到 `@alembic/core/shared`。

特别注意：

- 本波不刷新 `plugins/alembic-codex/runtime/vendor/AlembicCore`，不运行 release / channel / marketplace 发布链路。
- `lib/codex/*`、`lib/external/mcp/**`、HTTP routes、test support 和 tests 都在范围内；不能只改主 runtime。
- `vi.mock` / dynamic import 指向旧 deep specifier 时必须同步，否则测试仍会证明旧路径。
- 更新 `config/core-import-boundary-allowlist.json` 时，删除本波旧 deep specifier 和 reference limits；保留其它非本波 transitional entries。

## 验收标准

单仓库完成标准：

- 执行记录已新建并挂回本文回填区。
- 本波目标旧 deep specifier 在对应仓库负向扫描为 0。
- `lint:consumer-core-imports` / `lint:core-import-boundary` 通过，并能证明 allowlist/reference limits 已收紧。
- `build:check`、`lint`、`test:unit`、`check` 通过。
- 提交 hash、验证命令、验证结果、遗留风险、下一步建议已回填。
- 工作区干净。

总控最终验收标准：

- `Alembic` 和 `AlembicPlugin` 均完成。
- Core `npm run report:public-api-closeout` 显示 `./shared/*`、`./infrastructure/config/*`、`./types/*`、`./service/candidate/*` 的 consumer refs 明显归零或只剩总控认可的非目标残留。
- 不触碰 release / vendor / runtime artifact。
- 决定是否开启下一波：
  - 若本波 113 refs 全部清零：新开 Core wildcard closeout / next consumer group wave。
  - 若存在 mock/dynamic import 残留：先补 consumer cleanup，不进入 Core 删除。
  - 若出现 facade 缺口：回到 Core 做 3B-Core-2，不让消费层硬绕路。

## 可复制分派提示词

当前优先发送给：`AlembicCore`，补齐 3B-Core-2：`@alembic/core/types` 需要 re-export `types/workflows.ts` 的 workflow contract 类型。

暂不发送窗口：`Alembic`（已执行并因 Core facade 缺口阻塞）、`AlembicPlugin`（已执行可安全替换部分并因 Core facade 缺口阻塞）、`AlembicAgent`、`AlembicDashboard`、`BiliDili`

```text
读取 docs/workspace/alembic-core-facade-readiness-wave-3b-consumer-plan-2026-05-18.md，按照文档，领取并完成分配给你所在窗口的任务；完成后回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。
```

## 回填区

### Alembic

- 状态：阻塞
- 完成范围：已完成 Alembic 主仓库可安全替换的 Wave 3B consumer imports：`shared/*` 收敛到 `@alembic/core/shared` / `@alembic/core/workspace` / `@alembic/core/search`；`infrastructure/config/*` 收敛到 `@alembic/core/config`；`service/candidate/*` 收敛到 `@alembic/core/service/candidate`；`types/reactive-evolution` 与 `types/snapshot-views` 收敛到 `@alembic/core/types`；同步 static imports、dynamic import、`vi.mock` / `vi.doMock` / `vi.doUnmock`；收紧 `config/core-import-boundary.json`。`types/workflows` 因 Core facade 缺口保留 residual。
- 执行记录：`docs/Alembic/alembic-core-facade-consumer-replacement-wave-3b-2026-05-18.md`
- 提交 hash：`64f30f68ffce13c350ca9c328e511e087ded3246`
- 验证命令：`npm run lint:consumer-core-imports`；`npm run lint:core-import-boundary`；`npm run build:check`；`npm run test:unit -- test/unit/BootstrapTerminalToolset.test.ts test/unit/KnowledgeAPI.test.ts test/unit/TestMode.test.ts test/unit/ProjectPaths.test.ts test/unit/folder-names.test.ts test/unit/ContentImpactAnalyzer.test.ts`；`npm run lint`；`npm run test:unit`；`npm run test:unit -- test/unit/DecayDetector.test.ts`；`npm run check`；`node scripts/core-source-command.mjs lint-consumer-imports --format=json`；目标旧 specifier 负向扫描；`git diff --check`；`git status --short`。
- 验证结果：`lint:consumer-core-imports` 通过，455 files / 599 imports / issue 0；`lint:core-import-boundary` 通过；`build:check` 通过；目标相关单测 6 files / 105 tests 通过；Core consumer JSON scan issue 0，`stable-public=417`、`provisional-public=64`、`transitional-internal=118`、`referencesScanned=599`；除 `@alembic/core/types/workflows` 外，本波目标旧 deep specifier 0 命中；`git diff --check` 通过；Alembic 仓库提交后干净。
- 未通过项：`npm run lint` 命中既有非本轮 lint errors（`lib/bootstrap.ts`、`lib/cli/AiScanService.ts`、`lib/cli/deploy/FileManifest.ts`、`scripts/verify-context-api.ts`）；`npm run test:unit` 受非目标/环境问题阻断（`SandboxNetworkProxy.test.ts` 的 `listen EPERM 127.0.0.1`、`TerminalAdapter.test.ts` 的 `sandbox-exec Operation not permitted`、`DecayDetector.test.ts` 的既有 `symbol_drift` 断言失败）；`npm run check` 在 lint 阶段被上述既有 lint errors 阻断。
- 遗留风险：`@alembic/core/types/workflows` 仍有 10 命中（9 个代码 type imports + 1 个 boundary allowlist），原因是 Core `@alembic/core/types` 尚未导出 workflow contract 类型；本波完整验收不能标为通过。
- 下一步建议：回到 Core 做 3B-Core-2，补齐 `@alembic/core/types` 对 `types/workflows.ts` 的 re-export；Core 补齐后，Alembic 再把 9 个 residual imports 切到 `@alembic/core/types`，删除 allowlist residual 并复跑本波验证。

### AlembicPlugin

- 状态：阻塞
- 完成范围：已完成 AlembicPlugin 可安全替换的 Wave 3B consumer imports：`shared/*` 收敛到 `@alembic/core/shared` / `@alembic/core/search`；`infrastructure/config/*` 收敛到 `@alembic/core/config`；`service/candidate/*` 收敛到 `@alembic/core/service/candidate`；`types/reactive-evolution` 与 `types/snapshot-views` 收敛到 `@alembic/core/types`；同步 static imports、dynamic import、`vi.mock` / `vi.doMock`；收紧 `config/core-import-boundary-allowlist.json`。`types/workflows` 因 Core facade 缺口保留 1 个 residual。本波未刷新 portable runtime、未更新 vendor、未运行 release / marketplace / publish 链路。
- 执行记录：`docs/AlembicPlugin/alembic-plugin-core-facade-consumer-replacement-wave-3b-2026-05-18.md`
- 提交 hash：`f185e95127411b9b6fcac6df43709be9b1ccee54`
- 验证命令：`npm run lint:consumer-core-imports`；`npm run lint:core-import-boundary`；`npm run build:check`；`npm run lint`；`npm run test:unit -- test/unit/KnowledgeAPI.test.ts`；`npm run test:unit`；`npm run check`；`npm run report:agent-extraction-boundary`；`npm run verify:codex-plugin`；`npm run smoke:codex-plugin`；目标旧 specifier 负向扫描；`rg -n "@alembic/core/types/workflows" lib bin scripts test config`；`rg -n "@alembic/agent" lib bin scripts test config package.json`；`git diff --check`；`git status --short`。
- 验证结果：`lint:consumer-core-imports` 通过，320 files / 507 imports；`lint:core-import-boundary` 通过；`build:check` 通过；`KnowledgeAPI` 定向单测 49 tests 通过；`report:agent-extraction-boundary` 通过，agent / AI / tool boundary import files 全部 0；`verify:codex-plugin` 通过；`smoke:codex-plugin` 通过，install / stdio / npxRuntime passed；除 `@alembic/core/types/workflows` 外，本波目标旧 deep specifier 0 命中；`@alembic/agent` 0 命中；`git diff --check` 通过。
- 未通过项：`npm run lint` 命中既有 Biome debt（`lib/bootstrap.ts` non-null assertion、`lib/cli/SetupService.ts` console 等）；`npm run test:unit` 剩余 6 files / 7 tests failed，其中 `test/unit/SearchRanking.test.ts` 由 Core `@alembic/core/search` 未导出 `RelevanceSignal` 等 individual signal classes 阻塞，其它为既有非本轮失败；`npm run check` 在 lint 阶段被既有 lint errors 阻断。
- 遗留风险：`@alembic/core/types/workflows` 仍有 1 个代码 residual，原因是 Core `@alembic/core/types` 尚未导出 workflow contract 类型；Core `@alembic/core/search` individual signal facade 缺口会继续阻塞 `SearchRanking.test.ts`。
- 下一步建议：Core 3B-Core-2 补齐 `@alembic/core/types` workflow contract re-export，并补齐或明确 `@alembic/core/search` individual signal public contract；Core 补齐后，AlembicPlugin 再删除 residual 并复跑本波验证。

### AlembicCore

- 状态：待启动
- 验收结论：Core Wave 3B-Core 已通过总控复核；提交 `75fac5642b6da736a00667539a720172d23b85c3`。
- 新增缺口：Alembic consumer 尝试将 `@alembic/core/types/workflows` 替换为 `@alembic/core/types` 时，`build:check` 证明 `McpContext`、`WorkflowDatabaseLike`、`WorkflowSkillHooks`、`IncrementalPlan` 等 workflow contract 类型未从 `@alembic/core/types` 导出。需要 Core 追加 3B-Core-2 后再让 consumer 删除 residual。
- Plugin 复核追加缺口：AlembicPlugin `test/unit/SearchRanking.test.ts` 已消费 `@alembic/core/search` facade，但 runtime facade 未 re-export `RelevanceSignal` 等 individual signal classes，导致完整 unit suite 仍失败。Core 3B-Core-2 需要一并补齐或明确 search public contract。

### AlembicAgent

- 状态：观察中
- 观察结论：Agent Core imports stable-only，本波不发送提示词。

### AlembicDashboard

- 状态：无任务
- 判断理由：本波不涉及 Dashboard。

### BiliDili

- 状态：无任务
- 判断理由：本波不涉及真实测试项目。
