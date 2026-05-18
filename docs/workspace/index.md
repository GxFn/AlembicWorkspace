# AlembicWorkspace 总控索引

更新日期：2026-05-18

本文件是 AlembicWorkspace 的唯一总控入口。跨仓库计划、窗口分派、状态快照、文档挂载、验收证据和历史迁移入口，都必须能从这里追踪到。

## 当前总控入口

| 类型 | 文档 | 状态 | 说明 |
| --- | --- | --- | --- |
| AlembicCore facade readiness Wave 3B-Consumer | [alembic-core-facade-readiness-wave-3b-consumer-plan-2026-05-18.md](alembic-core-facade-readiness-wave-3b-consumer-plan-2026-05-18.md) | 执行中 | Core 3B-Core-2 已完成并提交 `9506dca8ebcd0d59a208a640c7c373d8efd26a7c`，解除 `@alembic/core/types` workflow type-only facade 与 `@alembic/core/search` individual signal facade 缺口；AlembicPlugin 已提交 `e4211907c870f1c6d044c3606e94c014f927c05a` 清零 Plugin `types/workflows` residual 并进入待验收；当前优先派 Alembic 删除剩余 residual 并复跑验证；不触碰 Core 删除、vendor、portable runtime 或 release。 |
| AlembicCore types workflows facade Wave 3B-Core-2 | [alembic-core-types-workflows-facade-wave-3b-core-2-2026-05-18.md](../AlembicCore/alembic-core-types-workflows-facade-wave-3b-core-2-2026-05-18.md) | 已完成 | Core 已补 `@alembic/core/types` workflow contract type-only exports 和 `@alembic/core/search` individual signal runtime exports；public smoke / report / check 通过，Plugin `SearchRanking.test.ts` 51 tests passed；提交 `9506dca8ebcd0d59a208a640c7c373d8efd26a7c`。 |
| Alembic Core facade consumer replacement Wave 3B | [alembic-core-facade-consumer-replacement-wave-3b-2026-05-18.md](../Alembic/alembic-core-facade-consumer-replacement-wave-3b-2026-05-18.md) | 待启动 | Alembic 已把 `shared / config / candidate / reactive-evolution / snapshot-views` 目标旧 deep specifier 收敛到 Core exact facades，并收紧 `config/core-import-boundary.json`；Core 阻塞已解除，下一步删除 9 个 `types/workflows` code imports + 1 个 boundary allowlist residual；提交 `64f30f68ffce13c350ca9c328e511e087ded3246`。 |
| AlembicPlugin Core facade consumer replacement Wave 3B | [alembic-plugin-core-facade-consumer-replacement-wave-3b-2026-05-18.md](../AlembicPlugin/alembic-plugin-core-facade-consumer-replacement-wave-3b-2026-05-18.md) | 待验收 | Plugin 已把 `shared / config / candidate / reactive-evolution / snapshot-views / workflows` 目标旧 deep specifier 收敛到 Core exact facades，并收紧 `config/core-import-boundary-allowlist.json`；`shared/recipe-tokens` 与 `types/workflows` residual 均已清零；`SearchRanking` + `ContentImpactAnalyzer` 77 tests passed；提交 `f185e95127411b9b6fcac6df43709be9b1ccee54`，补丁提交 `8f48fd1d2b56e0136919414d68e7da93b1707141`，最终收口提交 `e4211907c870f1c6d044c3606e94c014f927c05a`。 |
| AlembicCore facade readiness Wave 3B-Core | [alembic-core-facade-readiness-wave-3b-core-plan-2026-05-18.md](alembic-core-facade-readiness-wave-3b-core-plan-2026-05-18.md) | 已完成 | Core 已完成 `shared / config / types / candidate` facade readiness，replacement readiness `113/113`，提交 `75fac5642b6da736a00667539a720172d23b85c3`；本波不再发送提示词，下一步可新建 Wave 3B-Consumer 总控文档派 Alembic / AlembicPlugin 替换消费层 imports。 |
| AlembicCore facade readiness Wave 3B 执行记录 | [alembic-core-facade-readiness-wave-3b-2026-05-18.md](../AlembicCore/alembic-core-facade-readiness-wave-3b-2026-05-18.md) | 已完成 | 记录 deep specifier 到目标 facade 的替换地图、决策、风险、验证命令和 Core 提交 `75fac5642b6da736a00667539a720172d23b85c3`；覆盖 6 个 stable-ready refs 与 107 个 provisional-ready refs。 |
| 接口边界优化 Wave 3A | [alembic-interface-boundary-optimization-wave-3a-plan-2026-05-18.md](alembic-interface-boundary-optimization-wave-3a-plan-2026-05-18.md) | 已完成 | Core public API closeout inventory、Agent public contract hardening、Alembic / Plugin consumer allowlist 减量均已完成；当前无需要继续发送的执行提示词，Dashboard 观察，BiliDili 无任务。 |
| AlembicCore public API closeout Wave 3A | [alembic-core-public-api-closeout-wave-3a-2026-05-18.md](../AlembicCore/alembic-core-public-api-closeout-wave-3a-2026-05-18.md) | 已完成 | Core 已建立 98 transitional / 61 wildcard closeout inventory，分类为 0 promote / 18 keep-provisional / 21 consumer-replace-first / 46 no-consumer-deprecate-candidate / 13 must-keep-transitional；新增 no-growth gate 和 report script；提交 `4679f004c923ab32ad2b5407f6c9dfa7561c840e`。 |
| Alembic Core / Agent consumer boundary reduction Wave 3A | [alembic-core-agent-consumer-boundary-reduction-wave-3a-2026-05-18.md](../Alembic/alembic-core-agent-consumer-boundary-reduction-wave-3a-2026-05-18.md) | 已完成 | Alembic 已把全部 `@alembic/core/domain/dimension*` transitional imports 收敛到稳定 `@alembic/core/dimensions`，收紧 Core import boundary allowlist/reference limits，保持 Agent duplicate / Tool V2 duplicate / terminal duplicate 为 0；提交 `6dc3a875c2ef14be7a3b9a2fa6a9990b6c441c31`。 |
| AlembicPlugin Core consumer boundary reduction Wave 3A | [alembic-plugin-core-consumer-boundary-reduction-wave-3a-2026-05-18.md](../AlembicPlugin/alembic-plugin-core-consumer-boundary-reduction-wave-3a-2026-05-18.md) | 已完成 | Plugin 已把 knowledge/domain、memory repository、source-ref type、dimension helper 等已有 stable facade 覆盖的 imports 替换为稳定入口，收紧 Core import boundary allowlist/reference limits，保持 agent-free 与 artifact-only 边界；提交 `170f52a407914ebf1d484e269980c40cc6eee90c`。 |
| AlembicAgent public contract hardening Wave 3A | [alembic-agent-public-contract-hardening-wave-3a-2026-05-18.md](../AlembicAgent/alembic-agent-public-contract-hardening-wave-3a-2026-05-18.md) | 已完成 | Agent 已保持 15 exact / 0 wildcard public exports，新增 contract matrix、host-owned adapter boundary 说明和 5 个 forbidden import negative samples；public smoke 通过 15 public imports / 5 forbidden rejects；提交 `b541c9eaa342dcb085834cfbe36e506c5904c43f`。 |
| Workspace 文档归档规则 | [workspace-doc-archive-policy-2026-05-18.md](workspace-doc-archive-policy-2026-05-18.md) | 当前生效规则 | 规定 `docs/workspace/` 当前入口、历史 wave 归档目录、归档条件和 `scripts/archive-workspace-docs.mjs` 使用方式。 |
| Release closeout 验收与 publish staging Wave 2 | [alembic-release-portable-snapshot-closeout-acceptance-publish-staging-wave-2-plan-2026-05-18.md](alembic-release-portable-snapshot-closeout-acceptance-publish-staging-wave-2-plan-2026-05-18.md) | 已完成 | Release / portable snapshot closeout 已验收通过；按用户纠正，`alembic-ai` 由 Alembic 主仓库发布，AlembicPlugin 只产出 Codex 插件产物 / portable runtime artifact，不走 npm registry 包发布；AlembicCore release workflow、AlembicAgent publish staging、Alembic `alembic-ai` publish staging 和 AlembicPlugin artifact-only release 均已完成。 |
| AlembicPlugin artifact release no npm Wave 2 | [alembic-plugin-artifact-release-no-npm-wave-2-2026-05-18.md](../AlembicPlugin/alembic-plugin-artifact-release-no-npm-wave-2-2026-05-18.md) | 已完成 | Plugin root registry publication 已禁用：root package private，release workflow 上传 Codex plugin artifacts，channel package registry 改为 `portable-artifact`，embedded runtime 保留 `@alembic/core: file:vendor/AlembicCore` 与 source metadata；外层提交 `6883affe2668c33627aa5c9529e12096735f3abe`，runtime 子仓库提交 `dbbeb3a2da170256ed09b69b82771c6db1c7acf5`。 |
| Alembic AI publish staging Wave 2 | [alembic-ai-publish-staging-wave-2-2026-05-18.md](../Alembic/alembic-ai-publish-staging-wave-2-2026-05-18.md) | 已完成 | Alembic 主仓库已新增 `.release/alembic-ai` publish staging package，dev manifest 保留 `file:../AlembicCore` / `file:../AlembicAgent`，staging manifest 使用 registry `@alembic/core@0.1.0` 与 `@alembic/agent@0.1.0` 并记录 source commits；release workflow 改为发布 staging package；提交 `7f68d43e019db597c52a5a36d64d68d6dfbc6bcf`。 |
| AlembicAgent publish staging Wave 2 | [alembic-agent-publish-staging-wave-2-2026-05-18.md](../AlembicAgent/alembic-agent-publish-staging-wave-2-2026-05-18.md) | 已完成 | Agent 已新增 `release:stage` / `release:pack-preview`；root dev manifest 继续 `@alembic/core: file:../AlembicCore` 且 root `prepack` hard gate 保留，staging manifest 使用 registry `@alembic/core@0.1.0` 并记录 Core source commit `9174c5173a7313b916b89b7c605ea2afdd874269`；提交 `f9d020f9ebaf95499bbd6e9afbdecafa0615a865`。 |
| AlembicCore release workflow Wave 2 | [alembic-core-release-workflow-wave-2-2026-05-18.md](../AlembicCore/alembic-core-release-workflow-wave-2-2026-05-18.md) | 已完成 | Core 已新增 `Core Release` workflow：manual dry-run release staging、`v*` tag publish、tag/version check、pack preview artifact 和 npm provenance publish；`RELEASE-PLAYBOOK.md` 已进入 pack contents；提交 `9174c5173a7313b916b89b7c605ea2afdd874269`。 |
| AlembicPlugin release portable runtime boundary | [alembic-plugin-release-portable-runtime-boundary-2026-05-18.md](../AlembicPlugin/alembic-plugin-release-portable-runtime-boundary-2026-05-18.md) | 已完成 | Plugin 已补 `verify:release-package-boundary` / publish hard gate，`verify:codex-plugin` 校验 runtime Core source metadata，CI/release 显式 checkout sibling Core/Dashboard，release playbook 改为多仓库 local-source-first / portable runtime snapshot 口径；外层提交 `3a5a4921398269e7a53c233d200acba8bf6a1f5a`，runtime 快照提交 `7544898b5d5ac6f0128fb80f292bfada29d23521`。 |
| AlembicCore release package baseline | [alembic-core-release-package-baseline-2026-05-18.md](../AlembicCore/alembic-core-release-package-baseline-2026-05-18.md) | 已完成 | Core 新增 `release:check`，验证 `@alembic/core@0.1.0` package metadata、dist exports、pack contents、source commit 和 sibling-free dependency；CI package step 改为 `npm run release:check`；提交 `abcf84f27d23cae0fbefbb4d7a327f5aae7f1caf`。 |
| AlembicAgent release package boundary | [alembic-agent-release-package-boundary-2026-05-18.md](../AlembicAgent/alembic-agent-release-package-boundary-2026-05-18.md) | 已完成 | Agent 保留 `@alembic/core: file:../AlembicCore` 日常开发入口，并新增 `release:package-guard` / `prepack` 阻断 root package 泄漏 `file:../AlembicCore`；`npm pack --dry-run` 预期失败；提交 `019022bedf9c910bf7bf64a4fbe5969f833b294f`。 |
| Alembic release local source package boundary | [alembic-release-local-source-package-boundary-2026-05-18.md](../Alembic/alembic-release-local-source-package-boundary-2026-05-18.md) | 已完成 | Alembic 主仓库 CI/release 已显式 checkout sibling Core/Agent/Dashboard；新增 `release:package-guard` 阻断 root publish 泄漏 `file:../AlembicCore`、`file:../AlembicAgent` 和 `alembic-ai` 包名冲突；提交 `9813101f40774b9e2122f32e7edb75b4a3e94ffd`。 |
| 本地源码 resolver / script 契约 | [alembic-local-source-resolver-script-contract-2026-05-18.md](alembic-local-source-resolver-script-contract-2026-05-18.md) | 当前生效契约 | 统一本地源码 resolver 优先级、repo-local script 边界、portable runtime 例外和 BiliDili 默认不进入日常流程的规则。 |
| Alembic local source import unification | [alembic-local-source-import-unification-2026-05-18.md](../Alembic/alembic-local-source-import-unification-2026-05-18.md) | 已完成 | Alembic 已改为本地开发消费 `@alembic/core: file:../AlembicCore`，保持 `@alembic/agent: file:../AlembicAgent`，Dashboard build 优先 `../AlembicDashboard`，并更新 local-source-first 守门规则；提交 `9461232072ae77a9b272554fcb61246ff9d1d856`。 |
| AlembicPlugin local source import unification | [alembic-plugin-local-source-import-unification-2026-05-18.md](../AlembicPlugin/alembic-plugin-local-source-import-unification-2026-05-18.md) | 已完成 | Plugin 已改为本地开发消费 `@alembic/core: file:../AlembicCore`，Dashboard build/watch 优先 `../AlembicDashboard`，Codex runtime 从本地 Core 生成 portable `runtime/vendor/AlembicCore` 快照并保持 runtime dependency `file:vendor/AlembicCore`；外层提交 `70eaf130d96f5e61a53dfbdb19c24ff13eb80410`，runtime 快照提交 `09d4ac611408098d6ec3e88d1899d802510aadb5`。 |
| AlembicAgent local source import baseline | [alembic-agent-local-source-import-baseline-2026-05-18.md](../AlembicAgent/alembic-agent-local-source-import-baseline-2026-05-18.md) | 已完成 | Agent 已确认 `@alembic/core: file:../AlembicCore`、本地 Core scanner 和 `node_modules/@alembic/core -> ../AlembicCore`；`AGENTS.md` 已补 local-source-first 守门规则；提交 `0b86fdf55e3f927a1a5384c2b14cd97c8bb0daaf`。 |
| AlembicAgent Core facade consumption Wave 2B | [alembic-agent-core-facade-consumption-wave-2b-2026-05-18.md](../AlembicAgent/alembic-agent-core-facade-consumption-wave-2b-2026-05-18.md) | 已完成 | Agent 已消费 `@alembic/core/search` / `@alembic/core/evolution` / `@alembic/core/memory` stable facades；无 config Core consumer scan `issueCount: 0`，负向扫描旧 imports 0 命中；提交 `1af571674d3eb123e5aad695cb9a02fc69ce37d6`。 |
| AlembicCore interface boundary Phase 10 facades Wave 2 | [alembic-core-interface-boundary-phase-10-facades-wave-2-2026-05-18.md](../AlembicCore/alembic-core-interface-boundary-phase-10-facades-wave-2-2026-05-18.md) | 已完成 | Core 新增稳定 `@alembic/core/evolution`、`@alembic/core/memory`，增强 `@alembic/core/search` similarity helpers，并把 semantic memory repository 纳入 repositories bundle；check/build/smoke 通过；提交 `b904b66907e16e61f29a6dc0eeedc59231ddfb53`。 |
| AlembicAgent interface boundary optimization Wave 1 | [alembic-agent-interface-boundary-optimization-wave-1-2026-05-18.md](../AlembicAgent/alembic-agent-interface-boundary-optimization-wave-1-2026-05-18.md) | 已完成 | Agent 已锁定 15 个 exact public exports，新增 public API policy/self import smoke/Core consumer allowlist，并将 Core imports 收敛到 46 stable / 1 provisional / 5 frozen transitional；提交 `b3a57e3a6ff83525332901ad6ceda24cf2fb7d21`。 |
| AlembicCore interface boundary closeout Wave 1 | [alembic-core-interface-boundary-closeout-wave-1-2026-05-18.md](../AlembicCore/alembic-core-interface-boundary-closeout-wave-1-2026-05-18.md) | 已完成 | Core 已把 AlembicAgent 纳入 consumer 扫描口径；Alembic/AlembicPlugin consumer 扫描 issue 0，AlembicAgent 14 个 transitional refs 已完成 stable replacement / narrow facade / adapter allowlist 判断；验证基线 `92ccd10baad1eac5fcfe3b4d4c8191a02042da04`。 |
| AlembicPlugin Core interface consumer agent-free scan Wave 1 | [alembic-core-interface-consumer-agent-free-scan-wave-1-2026-05-18.md](../AlembicPlugin/alembic-core-interface-consumer-agent-free-scan-wave-1-2026-05-18.md) | 已完成 | Plugin Core boundary 315 files / 517 imports / 0 issue；Stable 357、Provisional 8、Transitional 152；agent-free gate 全 0，`@alembic/agent` 0 命中；无新增代码提交，复验基线 `12b7dd2fdb4d8654d78e548cce8a6692c4fd96be`。 |
| Alembic Core / Agent interface consumer scan Wave 1 | [alembic-core-agent-interface-consumer-scan-wave-1-2026-05-18.md](../Alembic/alembic-core-agent-interface-consumer-scan-wave-1-2026-05-18.md) | 已完成 | Alembic 已复验 `@alembic/agent` public subpath 消费面和 Core consumer boundary；Agent duplicate / generic Tool V2 duplicate 均为 0；无新增代码提交，基线 `ea816fcba9934dcf2bad942cb8424459c0e46455`。 |
| AlembicPlugin redundant systems vendor runtime sweep Wave 2 | [alembic-redundant-systems-vendor-runtime-sweep-wave-2-2026-05-18.md](../AlembicPlugin/alembic-redundant-systems-vendor-runtime-sweep-wave-2-2026-05-18.md) | 已完成 | Plugin 已同步 Core vendor 到 `92ccd10baad1eac5fcfe3b4d4c8191a02042da04`、Dashboard vendor 到 `7143a7ca610a504b7472ae4afac0eb2df2ebdda8`；删除推荐兼容端点和 `recipe:get_recommendations`，刷新 Codex runtime/tarball；提交 `12b7dd2fdb4d8654d78e548cce8a6692c4fd96be`。 |
| Alembic redundant systems vendor sync Wave 2 | [alembic-redundant-systems-vendor-sync-wave-2-2026-05-18.md](../Alembic/alembic-redundant-systems-vendor-sync-wave-2-2026-05-18.md) | 已完成 | Alembic 已同步 Core vendor 到 `92ccd10baad1eac5fcfe3b4d4c8191a02042da04`、Dashboard vendor 到 `7143a7ca610a504b7472ae4afac0eb2df2ebdda8`；build/check/dashboard build 通过；提交 `ea816fcba9934dcf2bad942cb8424459c0e46455`。 |
| Alembic redundant systems removal Wave 1 | [alembic-redundant-systems-removal-wave-1-2026-05-18.md](../Alembic/alembic-redundant-systems-removal-wave-1-2026-05-18.md) | 已完成 | Alembic 已删除截屏连带能力、Skills/Signal/Recipe 推荐 runtime/API/MCP/gateway 和 ReverseGuard 消费入口；本地截屏/ReverseGuard 扫描 0 命中，推荐扫描仅剩允许的 `RuleLearner.recordFeedback`；提交 `2d04d4c04dde46f74160b89fee71f42cd2249791`。 |
| AlembicDashboard Skills recommendation UI removal | [alembic-skill-recommendation-ui-removal-wave-1-2026-05-18.md](../AlembicDashboard/alembic-skill-recommendation-ui-removal-wave-1-2026-05-18.md) | 已完成 | Dashboard 已删除 Skills 推荐 UI/API/polling/i18n，保留手动 Skills 管理、手动创建和搜索解释字段；`npm run build` 与三组负向扫描通过；提交 `7143a7ca610a504b7472ae4afac0eb2df2ebdda8`。 |
| AlembicCore ReverseGuard removal | [alembic-reverseguard-removal-wave-1-2026-05-18.md](../AlembicCore/alembic-reverseguard-removal-wave-1-2026-05-18.md) | 已完成 | Core 已删除 ReverseGuard 源码、exports、测试和 DecayDetector `symbol_drift` coupling；推荐系统扫描仅剩必须保留的 `RuleLearner.recordFeedback`；提交 `92ccd10baad1eac5fcfe3b4d4c8191a02042da04`。 |
| AlembicAgent redundant systems negative scan | [alembic-redundant-systems-negative-scan-2026-05-18.md](../AlembicAgent/alembic-redundant-systems-negative-scan-2026-05-18.md) | 已完成 | Agent 已确认无截屏连带能力、推荐系统或 ReverseGuard 实现；唯一 `SignalCollector` 历史注释已清理；三组负向扫描 0 命中；提交 `cbd7477462bd85f7490df4b8d6832deb8d3860fe`。 |
| AlembicPlugin vendor Feishu remote sweep | [alembic-plugin-vendor-feishu-remote-sweep-2026-05-18.md](../AlembicPlugin/alembic-plugin-vendor-feishu-remote-sweep-2026-05-18.md) | 已完成 | Plugin 已同步 vendored Core 到 `0c64fd7549d58ceded8eed163dae85c6678ea679`、Dashboard 到 `32b2e01c249665e3dc33bdcffbfc39b648d0426d`，刷新 Codex runtime/tarball 并复验 check/build/verify/smoke；提交 `106ed71716e12db5c4c00a54b23984a40b5737b1`。 |
| Alembic vendor Feishu remote sweep | [alembic-vendor-feishu-remote-sweep-2026-05-18.md](../Alembic/alembic-vendor-feishu-remote-sweep-2026-05-18.md) | 已完成 | Alembic 已同步 vendored Core 到 `0c64fd7549d58ceded8eed163dae85c6678ea679`、Dashboard 到 `32b2e01c249665e3dc33bdcffbfc39b648d0426d`，复验 build/check/vscode、Agent public import smoke 和负向扫描；提交 `0d109d0469d5cf978252da8217cc674ac400f14d`。 |
| AlembicAgent Lark remote preset removal | [alembic-agent-lark-remote-preset-removal-2026-05-17.md](../AlembicAgent/alembic-agent-lark-remote-preset-removal-2026-05-17.md) | 已完成 | Agent 已删除 `lark` / `remote-exec` preset/profile/source/channel/event 和 ConversationStore lark category；负向扫描 0 命中；提交 `cad5f0bc986d910e6ffa92decd85065167659a0f`。 |
| Alembic Feishu remote 主实现删除 | [alembic-feishu-remote-removal-2026-05-17.md](../Alembic/alembic-feishu-remote-removal-2026-05-17.md) | 已完成 | Alembic 已删除内置 Feishu/Lark remote HTTP route、transport、notifier、repository、VSCode poller、dependency、测试和当前产品文案；提交 `857f430d0524d4003e54d1bc04e4df81330f0ad8`。 |
| AlembicCore remote schema removal | [alembic-core-remote-schema-removal-2026-05-17.md](../AlembicCore/alembic-core-remote-schema-removal-2026-05-17.md) | 已完成 | Core 已删除 `003_add_remote_commands`、Drizzle remote 表定义和测试期待；按用户决策不新增 drop migration，旧开发库需要时重建；提交 `0c64fd7549d58ceded8eed163dae85c6678ea679`。 |
| AlembicDashboard Lark copy removal | [alembic-dashboard-lark-copy-removal-2026-05-17.md](../AlembicDashboard/alembic-dashboard-lark-copy-removal-2026-05-17.md) | 已完成 | Dashboard Help/i18n 已清理 Lark、飞书、remote-exec 产品展示；`src` 负向扫描 0 命中；提交 `32b2e01c249665e3dc33bdcffbfc39b648d0426d`。 |
| Alembic final host terminal smoke | [alembic-final-host-terminal-smoke-wave-6-2026-05-17.md](../Alembic/alembic-final-host-terminal-smoke-wave-6-2026-05-17.md) | 已完成 | Alembic 已完成 host TerminalAdapter smoke、daemon health、CLI/capability shape 复验，并新增 clean build + stale dist hard gate；提交 `00a8fe23af73717f313ad09dbab294534599e2a8`。 |
| AlembicDashboard final host capability smoke | [alembic-dashboard-final-host-capability-smoke-wave-6-2026-05-17.md](../AlembicDashboard/alembic-dashboard-final-host-capability-smoke-wave-6-2026-05-17.md) | 已完成 | Dashboard build 通过；经 Alembic 21 个 lightweight schema / 7 个 terminal capability shape 判断，不触发 live smoke；提交 `c3d4ca0`。 |
| AlembicPlugin final agent-free release gate | [alembic-plugin-final-agent-free-release-gate-wave-6-2026-05-17.md](../AlembicPlugin/alembic-plugin-final-agent-free-release-gate-wave-6-2026-05-17.md) | 已完成 | Plugin 已删除未使用旧 ambient Agent 类型声明并更新 `AGENTS.md` agent-free 边界，重跑 agent boundary report、check、build、Codex plugin/channel verify 和 smoke；最新提交 `68e0d4b6af0e13d44e6a10a084f5046f379024b7`。 |
| AlembicAgent final contract lock | [alembic-agent-final-contract-lock-wave-6-2026-05-17.md](../AlembicAgent/alembic-agent-final-contract-lock-wave-6-2026-05-17.md) | 已完成 | Agent public subpaths、terminal contract、Tool V2/service/runtime/memory/context/forge/tasks/profiles exports 已复验；无新增代码提交，复验基线 `10c672d2bd2bf709b88104ef1b4b277c28f97dd9`。 |
| Alembic terminal host bridge consumption | [alembic-terminal-sandbox-host-bridge-consumption-wave-5-2026-05-17.md](../Alembic/alembic-terminal-sandbox-host-bridge-consumption-wave-5-2026-05-17.md) | 已完成 | Alembic 已消费 `@alembic/agent/tools/terminal`，删除本地 terminal capability/policy/session plan/envelope duplicate，并新增 Wave 5 boundary hard gate；提交 `6598857fddd2f94d3d5c05ec5c1836879d1fc657`。 |
| AlembicAgent terminal tool contract | [alembic-agent-terminal-sandbox-tool-contract-wave-5-2026-05-17.md](../AlembicAgent/alembic-agent-terminal-sandbox-tool-contract-wave-5-2026-05-17.md) | 已完成 | Agent 已新增 `@alembic/agent/tools/terminal` public subpath，提交 `10c672d2bd2bf709b88104ef1b4b277c28f97dd9`；总控复验通过，Alembic 可解除阻塞消费。 |
| Alembic local Agent / Tool duplicate deletion | [alembic-local-agent-tool-implementation-deletion-2026-05-17.md](../Alembic/alembic-local-agent-tool-implementation-deletion-2026-05-17.md) | 已完成 | Alembic 已删除 `lib/agent/**`、generic Tool V2 duplicate、tool core/catalog/workflow duplicate，并把 Wave 4 删除状态写入边界配置；提交 `6abf1321b39b31a4a33c59b4d357d7f1e191cf39`。 |
| Alembic remaining local Agent callsite cutover | [alembic-remaining-local-agent-callsite-cutover-2026-05-17.md](../Alembic/alembic-remaining-local-agent-callsite-cutover-2026-05-17.md) | 已完成 | Alembic 已消费 `@alembic/agent/forge`、`@alembic/agent/tasks`、`@alembic/agent/profiles`，并扩展 boundary lint 阻断生产侧相对路径本地 Agent 导入；提交 `4be3b1e`。 |
| AlembicDashboard Plugin live host-managed 复验 | [alembic-dashboard-plugin-live-host-managed-verification-2026-05-17.md](../AlembicDashboard/alembic-dashboard-plugin-live-host-managed-verification-2026-05-17.md) | 已完成 | Dashboard 已与 Plugin live daemon 复验 Candidates enrich/refine、Global Chat refine、AI Chat host-managed contract；提交 `17a4ff5`。 |
| 分阶段迁移指挥模板 | [phased-migration-command-template-2026-05-17.md](phased-migration-command-template-2026-05-17.md) | 模板 | 突出真实代码挖掘、代码事实到阶段拆分、一波一阶段稳定推进，并提供总控计划、单阶段执行记录、验收/下一波、扫描命令和分派提示词模板。 |
| 历史主迁移计划 | [alembic-agent-extraction-boundary-plan-2026-05-17.md](../AlembicAgent/alembic-agent-extraction-boundary-plan-2026-05-17.md) | 背景材料 | AlembicAgent 抽取边界与 Alembic / AlembicPlugin / AlembicDashboard 上一轮总控计划。新任务以 workspace 新文档为准。 |
| AlembicAgent Phase 6 记录 | [alembic-agent-phase-6-contract-surface-2026-05-17.md](../AlembicAgent/alembic-agent-phase-6-contract-surface-2026-05-17.md) | 已完成 | Agent service/runtime/prompts/domain exports 与 Tool V2 边界判断。 |
| AlembicAgent Tool V2 contract | [alembic-agent-tool-v2-contract-2026-05-17.md](../AlembicAgent/alembic-agent-tool-v2-contract-2026-05-17.md) | 已完成 | Agent-owned Tool V2 router/cache/compressor/parser/adapter contract exports 与 host-owned adapter 边界。 |
| AlembicPlugin AI provider 删除记录 | [alembic-agent-extraction-boundary-plugin-phase-3-ai-provider-deletion-2026-05-17.md](../AlembicPlugin/alembic-agent-extraction-boundary-plugin-phase-3-ai-provider-deletion-2026-05-17.md) | 已完成 | Plugin 删除本地 AI provider 后的证据入口；完整发布链路已在 npx runtime packaging 修复记录中解除。 |

后续如果重写当前主计划，应在 `docs/workspace/` 新建 workspace 级入口，并在此表中把旧文档标为历史或背景材料。

## 历史归档摘要

| 归档主题 | 目录 | 说明 |
| --- | --- | --- |
| `2026-05/release-portable-snapshot-closeout` | [release-portable-snapshot-closeout](archive/2026-05/release-portable-snapshot-closeout/) | 最近归档 1 个 workspace 文档；当前索引只保留目录入口。 |
| `2026-05/agent-extraction` | [agent-extraction](archive/2026-05/agent-extraction/) | 最近归档 9 个 workspace 文档；当前索引只保留目录入口。 |
| `2026-05/feishu-remote-removal` | [feishu-remote-removal](archive/2026-05/feishu-remote-removal/) | 最近归档 1 个 workspace 文档；当前索引只保留目录入口。 |
| `2026-05/redundant-systems-removal` | [redundant-systems-removal](archive/2026-05/redundant-systems-removal/) | 最近归档 2 个 workspace 文档；当前索引只保留目录入口。 |
| `2026-05/local-source-import-unification` | [local-source-import-unification](archive/2026-05/local-source-import-unification/) | 最近归档 2 个 workspace 文档；当前索引只保留目录入口。 |
| `2026-05/interface-boundary` | [interface-boundary](archive/2026-05/interface-boundary/) | 最近归档 6 个 workspace 文档；当前索引只保留目录入口。 |

## 窗口覆盖状态

| 窗口 / 状态 | 任务 |
| --- | --- |
| `AlembicCore`<br>已完成 | 3B-Core-2 已完成：`@alembic/core/types` re-export workflow contract 类型，`@alembic/core/search` re-export individual signal classes；提交 `9506dca8ebcd0d59a208a640c7c373d8efd26a7c`。 |
| `AlembicPlugin`<br>待验收 | 已删除剩余 `@alembic/core/types/workflows` residual，确认 `SearchRanking.test.ts` 不再因 Core facade 缺口失败，并复跑本波验证；完整 lint/check/unit 剩余失败为既有债务，等待总控复核。 |
| `Alembic`<br>待启动 | Core 阻塞已解除；删除剩余 `@alembic/core/types/workflows` residual，更新 allowlist/reference limits，并复跑本波验证。 |
| `AlembicAgent`<br>观察中 | Agent Core imports stable-only；消费层完成后总控只复核 scan。 |
| `AlembicDashboard`<br>无任务 | 本波不涉及 Dashboard API client 或 UI。 |
| `BiliDili`<br>无任务 | 当前是 Alembic / AlembicPlugin Core import 收敛，不涉及真实测试项目。 |

## 状态枚举

任务状态只使用以下枚举：

- `待启动`：任务已分配但尚未开始。
- `执行中`：窗口正在改代码、写文档或运行验证。
- `待验收`：实现已完成，等待总控证据复核或跨仓库消费验证。
- `阻塞`：需要上游提交、接口、权限、依赖或用户决策。
- `已完成`：提交、扫描、验证和回填证据齐全。
- `暂停`：用户或总控明确延后。
- `观察中`：当前无直接改动，但受其它窗口结果影响。
- `无任务`：本轮判断无需行动，并已写明原因。

## 文档命名

推荐命名格式：

- workspace 总控计划：`<topic>-workspace-plan-YYYY-MM-DD.md`
- 总控状态快照：`<topic>-workspace-status-YYYY-MM-DD.md`
- 窗口分派表：`<topic>-window-dispatch-YYYY-MM-DD.md`
- 单仓库阶段记录：`<topic>-<repo>-phase-N-YYYY-MM-DD.md`
- 边界或扫描记录：`<topic>-<repo>-boundary-YYYY-MM-DD.md`

文档名使用小写 kebab-case。日期使用执行日 `YYYY-MM-DD`。不要在文档名或正文中写入用户本机绝对路径、API key、token 或其它私密信息。

## 分派模板

给窗口分配任务时，默认使用以下字段：

```text
窗口：
状态：
任务：
目标：
范围：
禁止事项：
验证命令：
阻塞/依赖：
文档动作：新建 / 更新 / 无需新建
保存位置：
挂载入口：
回填位置：
下一步允许启动：是/否，原因：
```

## 窗口覆盖模板

每次跨仓库总控计划必须覆盖所有主要窗口。派发表只保留两列，细节放在表后，避免 `index.md` 和当前计划出现难读宽表。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>状态 |  |
| `AlembicCore`<br>状态 |  |
| `AlembicAgent`<br>状态 |  |
| `AlembicDashboard`<br>状态 |  |
| `AlembicPlugin`<br>状态 |  |
| `BiliDili`<br>状态 |  |

派发细节用列表记录：文档动作、保存位置、挂载入口、回填位置、验证命令、阻塞 / 依赖。

如果读取代码后发现其它关联窗口、vendor 子仓库、插件资源、runtime 包或发布链路受影响，必须追加到覆盖表中。

## 分派提示词发送规则

- 状态为 `待启动` 或 `执行中`，且有实际任务的窗口，才进入当前可复制提示词发送名单。
- 状态为 `待验收` 的窗口由总控复核，不建议发送领取任务提示词；验收失败并需要窗口返工时，再改为 `待启动` 或 `执行中`。
- 状态为 `阻塞` 的窗口只保留在覆盖表中，不建议发送提示词；解除阻塞后再改为 `待启动` 或 `执行中`。
- 状态为 `观察中` 或 `无任务` 的窗口，只保留在覆盖表中防遗漏；不要建议用户发送提示词，除非后续回填触发了实际任务。
