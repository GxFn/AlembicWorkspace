# AlembicCore Facade Readiness Wave 3B-Consumer Plan

日期：2026-05-18
总控窗口：AlembicWorkspace
状态：已完成

## 总控验收结论

`AlembicCore` Wave 3B-Core 已通过总控验收，可以进入消费层替换波。

Core 完成提交：`75fac5642b6da736a00667539a720172d23b85c3`

消费层更新：Alembic 执行替换时发现 `@alembic/core/types` 尚未 re-export `types/workflows.ts` 的 workflow contract 类型。本文件已追加 Core 3B-Core-2 任务；在该缺口补齐前，消费层不得硬绕路删除 `@alembic/core/types/workflows` residual。总控复核 AlembicPlugin 时另发现 1 个非阻塞 residual：`test/unit/ContentImpactAnalyzer.test.ts` 仍从 `@alembic/core/shared/recipe-tokens` 导入；该 residual 已由 Plugin 补丁 `8f48fd1d2b56e0136919414d68e7da93b1707141` 收敛到 `@alembic/core/shared`。

Core 3B-Core-2 更新：`AlembicCore` 已在提交 `9506dca8ebcd0d59a208a640c7c373d8efd26a7c` 补齐 `@alembic/core/types` workflow type-only facade 和 `@alembic/core/search` individual signal runtime exports。Alembic / AlembicPlugin 的 `types/workflows` residual 与 Plugin `SearchRanking.test.ts` Core facade 阻塞可以解除；下一步应派消费层继续收口，不再派 Core。

Plugin 收口更新：`AlembicPlugin` 已在提交 `e4211907c870f1c6d044c3606e94c014f927c05a` 删除最后 1 个 `@alembic/core/types/workflows` code residual，并确认 `SearchRanking.test.ts` + `ContentImpactAnalyzer.test.ts` 77 tests passed；本波目标旧 deep specifier 负向扫描为 0。总控已复核通过，Plugin 本波记为已完成。

Alembic 收口更新：`Alembic` 已在提交 `3c8239cc7fa7428518f8d51436e52c52bdcca5c5` 删除剩余 9 个 `@alembic/core/types/workflows` code residual 和 1 个 boundary allowlist residual；本波目标旧 deep specifier 负向扫描为 0。`lint:consumer-core-imports`、`lint:core-import-boundary`、`build:check`、目标相关 112 tests 和 `git diff --check` 均通过；完整 `lint` / `check` / `test:unit` 剩余失败为既有债务或宿主 sandbox 限制。

总控最终复核：`Alembic` 和 `AlembicPlugin` 本波目标旧 deep specifier 负向扫描均为 0；`npm run report:public-api-closeout` 已显示本波 `shared / infrastructure/config / types / service/candidate` replacement readiness 收口为 `readyRefs=0/0`。当前剩余 closeout refs 属于下一批 `service/knowledge`、`service/evolution`、`core/capability`、`infrastructure/signal` 等消费层组，不是 Wave 3B residual。

复核命令：

| 命令 | 总控复核结果 |
| --- | --- |
| `npm run lint:public-api-boundary` | 通过；136 package exports classified；stable 17 / provisional 21 / transitional 98；wildcard 61；no-growth 保持。 |
| `npm run report:public-api-closeout` | 通过；replacement readiness `113/113`；`consumer-ready-stable=6`、`consumer-ready-provisional=107`、`split-required=0`、`keep-transitional=0`。 |
| `npm run smoke:public-api` | 通过；`Imported 75 exact public API entrypoints.` |
| `npm run build:check` | 通过。 |
| `npm run check` | 通过；60 test files / 919 tests passed；Biome checked 415 files；存在既有 `Could not access 'HEAD'` 提示但退出码为 0。 |
| Consumer 目标旧 specifier 负向扫描 | 通过；Alembic 与 AlembicPlugin 本波目标旧 deep specifier 均 0 命中。 |
| `npm run report:public-api-closeout` 最终复核 | 通过；replacement readiness `readyRefs=0/0`；剩余 `closeoutRefs` 属于下一批 consumer-replace-first 组。 |
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

派发只看这张表：`待启动`、`执行中` 且仍有实际执行任务的窗口才发送提示词；`待验收`、`阻塞`、`观察中`、`无任务` 不发送。保存位置、验证命令和回填证据放在下方“派发细节”、后文执行要求与回填区，不塞进派发表。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `AlembicCore`<br>已完成 | 3B-Core-2 已完成：`@alembic/core/types` re-export workflow contract 类型，`@alembic/core/search` re-export individual signal classes；提交 `9506dca8ebcd0d59a208a640c7c373d8efd26a7c`。 |
| `AlembicPlugin`<br>已完成 | 已删除剩余 `@alembic/core/types/workflows` residual，确认 `SearchRanking.test.ts` 不再因 Core facade 缺口失败，并复跑本波验证；完整 lint/check/unit 剩余失败为既有债务，已通过总控复核。 |
| `Alembic`<br>已完成 | 已删除剩余 `@alembic/core/types/workflows` residual，更新 allowlist/reference limits，并复跑本波验证；完整 lint/check/unit 剩余失败为既有债务或宿主 sandbox 限制。 |
| `AlembicAgent`<br>观察中 | Agent Core imports 已 stable-only；消费层完成后总控只复核 scan，不派执行任务。 |
| `AlembicDashboard`<br>无任务 | 本波不涉及 Dashboard UI/API client。 |
| `BiliDili`<br>无任务 | 当前是 Alembic / AlembicPlugin Core import 收敛，不涉及真实测试项目。 |

### 派发细节

- `Alembic`：文档已新建，保存 `docs/Alembic/alembic-core-facade-consumer-replacement-wave-3b-2026-05-18.md`；挂载入口为本文“窗口分派”和 `docs/workspace/index.md` 当前入口；回填到本文“回填区 / Alembic”；验证 `lint:consumer-core-imports`、`lint:core-import-boundary`、`build:check`、目标旧 specifier 负向扫描、`git diff --check`、`git status --short`，并按执行记录复跑必要测试。
- `AlembicPlugin`：文档已新建，保存 `docs/AlembicPlugin/alembic-plugin-core-facade-consumer-replacement-wave-3b-2026-05-18.md`；挂载入口为本文“窗口分派”和 `docs/workspace/index.md` 当前入口；回填到本文“回填区 / AlembicPlugin”；验证 `lint:consumer-core-imports`、`lint:core-import-boundary`、`build:check`、`report:agent-extraction-boundary`、`verify:codex-plugin`、`smoke:codex-plugin`、目标旧 specifier 负向扫描、`git diff --check`、`git status --short`；不刷新 portable runtime / release artifact。
- `AlembicCore`：3B-Core-2 文档已新建，保存 `docs/AlembicCore/alembic-core-types-workflows-facade-wave-3b-core-2-2026-05-18.md`；已回填本文“回填区 / AlembicCore”；验证 `lint:public-api-boundary`、`report:public-api-closeout`、`smoke:public-api`、`build:check`，当前不再发送提示词。
- `AlembicAgent`：无需新建文档；消费层完成后总控只确认 Agent scan 仍 issue 0。
- `AlembicDashboard`：无需新建文档；本波无验证命令。
- `BiliDili`：无需新建文档；本波无验证命令。

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

当前无需要继续发送的执行窗口；不要发送领取任务提示词，避免空转。

`AlembicCore` 3B-Core-2 已完成：`@alembic/core/types` 已 re-export `types/workflows.ts` 的 workflow contract 类型，`@alembic/core/search` 已 re-export individual signal classes；Core 提交 `9506dca8ebcd0d59a208a640c7c373d8efd26a7c`。

`AlembicPlugin` 已补非阻塞 residual：`test/unit/ContentImpactAnalyzer.test.ts` 的 `@alembic/core/shared/recipe-tokens` 已收敛到 `@alembic/core/shared`；Core 缺口解除后，最后 1 个 `@alembic/core/types/workflows` residual 已收敛到 `@alembic/core/types`，提交 `e4211907c870f1c6d044c3606e94c014f927c05a`。

暂不发送窗口：`AlembicCore`（3B-Core-2 已完成）、`AlembicPlugin`（已完成）、`Alembic`（已完成）、`AlembicAgent`、`AlembicDashboard`、`BiliDili`

## 回填区

### Alembic

- 状态：已完成
- 完成范围：已完成 Alembic 主仓库 Wave 3B consumer imports：`shared/*` 收敛到 `@alembic/core/shared` / `@alembic/core/workspace` / `@alembic/core/search`；`infrastructure/config/*` 收敛到 `@alembic/core/config`；`service/candidate/*` 收敛到 `@alembic/core/service/candidate`；`types/reactive-evolution`、`types/snapshot-views` 与 `types/workflows` 收敛到 `@alembic/core/types`，其中 workflow contract 保持 type-only import；同步 static imports、dynamic import、`vi.mock` / `vi.doMock` / `vi.doUnmock`；收紧 `config/core-import-boundary.json`，删除 `@alembic/core/types/workflows` residual allowlist；未触碰 vendor、release、portable runtime、npm publish 或远程指针。
- 执行记录：`docs/Alembic/alembic-core-facade-consumer-replacement-wave-3b-2026-05-18.md`
- 提交 hash：`64f30f68ffce13c350ca9c328e511e087ded3246`；最终收口提交 `3c8239cc7fa7428518f8d51436e52c52bdcca5c5`
- 验证命令：`npm run lint:consumer-core-imports`；`npm run lint:core-import-boundary`；`npm run build:check`；`npm run test:unit -- test/unit/WorkflowResultPersistence.test.ts test/unit/BootstrapTerminalToolset.test.ts test/unit/KnowledgeAPI.test.ts test/unit/TestMode.test.ts test/unit/ProjectPaths.test.ts test/unit/folder-names.test.ts test/unit/ContentImpactAnalyzer.test.ts`；`npm run lint`；`npm run test:unit`；`npm run check`；`node scripts/core-source-command.mjs lint-consumer-imports --format=json`；目标旧 specifier 负向扫描；`git diff --check`；`git status --short`。
- 验证结果：`lint:consumer-core-imports` 通过，455 files / 599 imports / issue 0；`lint:core-import-boundary` 通过；`build:check` 通过；目标相关单测 7 files / 112 tests 通过；Core consumer JSON scan issue 0，`stable-public=417`、`provisional-public=70`、`transitional-internal=112`、`referencesScanned=599`；本波目标旧 deep specifier 0 命中，包括 `@alembic/core/types/workflows`；`git diff --check` 通过；Alembic 仓库提交后干净。
- 未通过项：`npm run lint` 命中既有非本轮 lint errors（`lib/bootstrap.ts`、`lib/cli/AiScanService.ts`、`lib/cli/deploy/FileManifest.ts`、`scripts/verify-context-api.ts`），14 errors / 295 warnings / 25 infos；`npm run test:unit` 受非目标/环境问题阻断，3 files failed / 148 passed，20 tests failed / 2261 passed / 2 errors，失败集中在 `SandboxNetworkProxy.test.ts` 的 `listen EPERM 127.0.0.1`、`TerminalAdapter.test.ts` 的 `sandbox-exec Operation not permitted`、`DecayDetector.test.ts` 的既有 `symbol_drift` 断言；`npm run check` 在 typecheck 通过后被既有 lint errors 阻断。
- 遗留风险：本波目标 residual 已清零；`@alembic/core/types` 仍是 provisional public facade，workflow contract 必须继续保持 `import type`；完整 lint/check/unit 失败属于既有债务或宿主 sandbox 限制，需独立波次处理。
- 下一步建议：Alembic 本波完成；总控已复跑 Core closeout report，确认 Wave 3B consumer refs 已收口，剩余 refs 属于下一批 consumer-replace-first 组。

### AlembicPlugin

- 状态：已完成
- 完成范围：已完成 AlembicPlugin Wave 3B consumer imports：`shared/*` 收敛到 `@alembic/core/shared` / `@alembic/core/search`；`infrastructure/config/*` 收敛到 `@alembic/core/config`；`service/candidate/*` 收敛到 `@alembic/core/service/candidate`；`types/reactive-evolution`、`types/snapshot-views` 和 `types/workflows` 收敛到 `@alembic/core/types`，其中 workflow contract 保持 type-only import；同步 static imports、dynamic import、`vi.mock` / `vi.doMock`；收紧 `config/core-import-boundary-allowlist.json`。总控复核发现的 `test/unit/ContentImpactAnalyzer.test.ts` `@alembic/core/shared/recipe-tokens` residual 已收敛到 `@alembic/core/shared`；Core 3B-Core-2 后最后 1 个 `types/workflows` residual 已清零。本波未刷新 portable runtime、未更新 vendor、未运行 release / marketplace / publish 链路。
- 执行记录：`docs/AlembicPlugin/alembic-plugin-core-facade-consumer-replacement-wave-3b-2026-05-18.md`
- 提交 hash：`f185e95127411b9b6fcac6df43709be9b1ccee54`；补丁提交 `8f48fd1d2b56e0136919414d68e7da93b1707141`；最终收口提交 `e4211907c870f1c6d044c3606e94c014f927c05a`
- 验证命令：`npm run lint:consumer-core-imports`；`npm run lint:core-import-boundary`；`npm run build:check`；`npm run test:unit -- test/unit/SearchRanking.test.ts test/unit/ContentImpactAnalyzer.test.ts`；`npm run test:unit -- test/unit/KnowledgeAPI.test.ts`；`npm run lint`；`npm run test:unit`；`npm run check`；`npm run report:agent-extraction-boundary`；`npm run verify:codex-plugin`；`npm run smoke:codex-plugin`；目标旧 specifier 负向扫描；`rg -n "@alembic/core/shared/recipe-tokens" lib bin scripts test config`；`rg -n "@alembic/core/types/workflows" lib bin scripts test config`；`rg -n "@alembic/agent" lib bin scripts test config package.json`；`git diff --check`；`git status --short`。
- 验证结果：`lint:consumer-core-imports` 通过，320 files / 505 imports；`lint:core-import-boundary` 通过；`build:check` 通过，Core build used `../AlembicCore @ 9506dca8ebcd0d59a208a640c7c373d8efd26a7c`；`SearchRanking` + `ContentImpactAnalyzer` 定向单测 2 files / 77 tests 通过；`KnowledgeAPI` 定向单测 49 tests 通过；`report:agent-extraction-boundary` 通过，agent / AI / tool boundary import files 全部 0；`verify:codex-plugin` 通过；`smoke:codex-plugin` 通过，install / stdio / npxRuntime passed；本波目标旧 deep specifier 0 命中；`@alembic/core/shared/recipe-tokens` 0 命中；`@alembic/core/types/workflows` 0 命中；`@alembic/agent` 0 命中；`git diff --check` 通过；AlembicPlugin 仓库提交后干净。
- 已解除阻塞项：Core 重复 `IncrementalPlan` re-export、`@alembic/core/types` workflow contract 缺口和 `@alembic/core/search` individual signal 缺口已由 Core 提交 `9506dca8ebcd0d59a208a640c7c373d8efd26a7c` 修复；Plugin 已用 `SearchRanking.test.ts` 51 tests passed 复核 search facade。
- 未通过项：`npm run lint` 命中既有 Biome debt（`lib/bootstrap.ts` non-null assertion、`lib/cli/SetupService.ts` console 等，8 errors / 123 warnings / 29 infos）；`npm run test:unit` 剩余 5 files / 7 tests failed，88 files / 1456 tests passed，失败集中不再包含 `SearchRanking`；`npm run check` 在 `typecheck` 通过后被既有 lint errors 阻断。
- 遗留风险：本波目标 residual 已清零；`@alembic/core/types` 仍是 provisional public facade，Plugin 侧 workflow contract 必须继续保持 `import type`；完整 lint/check/unit 失败属于既有债务，需独立波次处理。
- 下一步建议：AlembicPlugin 本波总控验收通过；既有 lint debt 与非本轮 unit failures 可另开独立清理波处理；仍不刷新 portable runtime / vendor / release artifact。

### AlembicCore

- 状态：已完成
- 完成范围：Core Wave 3B-Core-2 已补齐 `@alembic/core/types` workflow type-only facade，以及 `@alembic/core/search` individual ranking signal runtime exports；新增 built declaration smoke，防止 type-only facade 再次漏导出。
- 执行记录：`docs/AlembicCore/alembic-core-types-workflows-facade-wave-3b-core-2-2026-05-18.md`
- 提交 hash：`9506dca8ebcd0d59a208a640c7c373d8efd26a7c`
- 验证命令：`npm run build`；`npm run build:check`；`npm run lint:public-api-boundary`；`npm run smoke:public-api`；`npm run report:public-api-closeout`；`npm run lint`；`npm run check`；AlembicPlugin search facade smoke；AlembicPlugin `SearchRanking.test.ts`；Alembic type declaration smoke；`git diff --check`；`git status --short`。
- 验证结果：全部通过。Core public API boundary 仍为 136 exports，75 exact / 61 wildcard，stable 17 / provisional 21 / transitional 98；smoke imported 75 exact entrypoints；closeout report 当前只剩 `@alembic/core/types/workflows -> @alembic/core/types` readiness `6/6`；Core check 中 60 test files / 919 tests passed，保留既有 `Could not access 'HEAD'` 提示但退出码为 0；AlembicPlugin `SearchRanking.test.ts` 51 tests passed；Core 提交后工作区干净。
- 遗留风险：`@alembic/core/types` 仍是 provisional public facade，消费层替换必须继续保持 `import type`；本次不删除 Core wildcard exports，不触碰 vendor / portable runtime / release artifact。
- 下一步建议：Wave 3B-Consumer 已完成；下一波可围绕 Core closeout report 剩余 consumer-replace-first 组另建计划。

### AlembicAgent

- 状态：观察中
- 观察结论：Agent Core imports stable-only，本波不发送提示词。

### AlembicDashboard

- 状态：无任务
- 判断理由：本波不涉及 Dashboard。

### BiliDili

- 状态：无任务
- 判断理由：本波不涉及真实测试项目。
