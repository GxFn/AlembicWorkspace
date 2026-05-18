# AlembicWorkspace 总控索引

更新日期：2026-05-18

本文件是 AlembicWorkspace 的唯一总控入口。跨仓库计划、窗口分派、状态快照、文档挂载、验收证据和历史迁移入口，都必须能从这里追踪到。

## 当前总控入口

| 类型 | 文档 | 状态 | 说明 |
| --- | --- | --- | --- |
| 接口边界优化 Wave 3A | [alembic-interface-boundary-optimization-wave-3a-plan-2026-05-18.md](alembic-interface-boundary-optimization-wave-3a-plan-2026-05-18.md) | 执行中 | 当前新入口：Core public API wildcard/transitional 收敛、Agent public contract hardening、Alembic / Plugin consumer allowlist 减量；AlembicAgent 与 Alembic 已完成本轮任务；Dashboard 观察，BiliDili 无任务。 |
| Alembic Core / Agent consumer boundary reduction Wave 3A | [alembic-core-agent-consumer-boundary-reduction-wave-3a-2026-05-18.md](../Alembic/alembic-core-agent-consumer-boundary-reduction-wave-3a-2026-05-18.md) | 已完成 | Alembic 已把全部 `@alembic/core/domain/dimension*` transitional imports 收敛到稳定 `@alembic/core/dimensions`，收紧 Core import boundary allowlist/reference limits，保持 Agent duplicate / Tool V2 duplicate / terminal duplicate 为 0；提交 `6dc3a875c2ef14be7a3b9a2fa6a9990b6c441c31`。 |
| AlembicAgent public contract hardening Wave 3A | [alembic-agent-public-contract-hardening-wave-3a-2026-05-18.md](../AlembicAgent/alembic-agent-public-contract-hardening-wave-3a-2026-05-18.md) | 已完成 | Agent 已保持 15 exact / 0 wildcard public exports，新增 contract matrix、host-owned adapter boundary 说明和 5 个 forbidden import negative samples；public smoke 通过 15 public imports / 5 forbidden rejects；提交 `b541c9eaa342dcb085834cfbe36e506c5904c43f`。 |
| Workspace 文档归档规则 | [workspace-doc-archive-policy-2026-05-18.md](workspace-doc-archive-policy-2026-05-18.md) | 当前生效规则 | 规定 `docs/workspace/` 当前入口、历史 wave 归档目录、归档条件和 `scripts/archive-workspace-docs.mjs` 使用方式。 |
| Release closeout 验收与 publish staging Wave 2 | [alembic-release-portable-snapshot-closeout-acceptance-publish-staging-wave-2-plan-2026-05-18.md](alembic-release-portable-snapshot-closeout-acceptance-publish-staging-wave-2-plan-2026-05-18.md) | 已完成 | Release / portable snapshot closeout 已验收通过；按用户纠正，`alembic-ai` 由 Alembic 主仓库发布，AlembicPlugin 只产出 Codex 插件产物 / portable runtime artifact，不走 npm registry 包发布；AlembicCore release workflow、AlembicAgent publish staging、Alembic `alembic-ai` publish staging 和 AlembicPlugin artifact-only release 均已完成。 |
| AlembicPlugin artifact release no npm Wave 2 | [alembic-plugin-artifact-release-no-npm-wave-2-2026-05-18.md](../AlembicPlugin/alembic-plugin-artifact-release-no-npm-wave-2-2026-05-18.md) | 已完成 | Plugin root registry publication 已禁用：root package private，release workflow 上传 Codex plugin artifacts，channel package registry 改为 `portable-artifact`，embedded runtime 保留 `@alembic/core: file:vendor/AlembicCore` 与 source metadata；外层提交 `6883affe2668c33627aa5c9529e12096735f3abe`，runtime 子仓库提交 `dbbeb3a2da170256ed09b69b82771c6db1c7acf5`。 |
| Alembic AI publish staging Wave 2 | [alembic-ai-publish-staging-wave-2-2026-05-18.md](../Alembic/alembic-ai-publish-staging-wave-2-2026-05-18.md) | 已完成 | Alembic 主仓库已新增 `.release/alembic-ai` publish staging package，dev manifest 保留 `file:../AlembicCore` / `file:../AlembicAgent`，staging manifest 使用 registry `@alembic/core@0.1.0` 与 `@alembic/agent@0.1.0` 并记录 source commits；release workflow 改为发布 staging package；提交 `7f68d43e019db597c52a5a36d64d68d6dfbc6bcf`。 |
| AlembicAgent publish staging Wave 2 | [alembic-agent-publish-staging-wave-2-2026-05-18.md](../AlembicAgent/alembic-agent-publish-staging-wave-2-2026-05-18.md) | 已完成 | Agent 已新增 `release:stage` / `release:pack-preview`；root dev manifest 继续 `@alembic/core: file:../AlembicCore` 且 root `prepack` hard gate 保留，staging manifest 使用 registry `@alembic/core@0.1.0` 并记录 Core source commit `9174c5173a7313b916b89b7c605ea2afdd874269`；提交 `f9d020f9ebaf95499bbd6e9afbdecafa0615a865`。 |
| AlembicCore release workflow Wave 2 | [alembic-core-release-workflow-wave-2-2026-05-18.md](../AlembicCore/alembic-core-release-workflow-wave-2-2026-05-18.md) | 已完成 | Core 已新增 `Core Release` workflow：manual dry-run release staging、`v*` tag publish、tag/version check、pack preview artifact 和 npm provenance publish；`RELEASE-PLAYBOOK.md` 已进入 pack contents；提交 `9174c5173a7313b916b89b7c605ea2afdd874269`。 |
| Release / portable snapshot 收口总控 | [alembic-release-portable-snapshot-closeout-workspace-plan-2026-05-18.md](archive/2026-05/release-portable-snapshot-closeout/alembic-release-portable-snapshot-closeout-workspace-plan-2026-05-18.md) | 已完成 | 已总控验收通过：保留本地源码优先入口，同时收口 CI、npm publish hard gate、Codex portable runtime、`file:../...` 发布泄漏、embedded `file:vendor/AlembicCore` 例外和 `alembic-ai` 包名冲突保护。 |
| AlembicPlugin release portable runtime boundary | [alembic-plugin-release-portable-runtime-boundary-2026-05-18.md](../AlembicPlugin/alembic-plugin-release-portable-runtime-boundary-2026-05-18.md) | 已完成 | Plugin 已补 `verify:release-package-boundary` / publish hard gate，`verify:codex-plugin` 校验 runtime Core source metadata，CI/release 显式 checkout sibling Core/Dashboard，release playbook 改为多仓库 local-source-first / portable runtime snapshot 口径；外层提交 `3a5a4921398269e7a53c233d200acba8bf6a1f5a`，runtime 快照提交 `7544898b5d5ac6f0128fb80f292bfada29d23521`。 |
| AlembicCore release package baseline | [alembic-core-release-package-baseline-2026-05-18.md](../AlembicCore/alembic-core-release-package-baseline-2026-05-18.md) | 已完成 | Core 新增 `release:check`，验证 `@alembic/core@0.1.0` package metadata、dist exports、pack contents、source commit 和 sibling-free dependency；CI package step 改为 `npm run release:check`；提交 `abcf84f27d23cae0fbefbb4d7a327f5aae7f1caf`。 |
| AlembicAgent release package boundary | [alembic-agent-release-package-boundary-2026-05-18.md](../AlembicAgent/alembic-agent-release-package-boundary-2026-05-18.md) | 已完成 | Agent 保留 `@alembic/core: file:../AlembicCore` 日常开发入口，并新增 `release:package-guard` / `prepack` 阻断 root package 泄漏 `file:../AlembicCore`；`npm pack --dry-run` 预期失败；提交 `019022bedf9c910bf7bf64a4fbe5969f833b294f`。 |
| Alembic release local source package boundary | [alembic-release-local-source-package-boundary-2026-05-18.md](../Alembic/alembic-release-local-source-package-boundary-2026-05-18.md) | 已完成 | Alembic 主仓库 CI/release 已显式 checkout sibling Core/Agent/Dashboard；新增 `release:package-guard` 阻断 root publish 泄漏 `file:../AlembicCore`、`file:../AlembicAgent` 和 `alembic-ai` 包名冲突；提交 `9813101f40774b9e2122f32e7edb75b4a3e94ffd`。 |
| 接口边界 Wave 2C 验收总结 | [alembic-core-agent-interface-boundary-wave-2c-acceptance-summary-2026-05-18.md](archive/2026-05/interface-boundary/alembic-core-agent-interface-boundary-wave-2c-acceptance-summary-2026-05-18.md) | 已完成 | 优化后的 Wave 2C 已总控验收通过；不重复发送已完成的本地源码引入任务，不做例行 vendor / 远程指针同步。 |
| 接口边界 Wave 2C 优化计划 | [alembic-core-agent-interface-boundary-wave-2c-optimized-plan-2026-05-18.md](archive/2026-05/interface-boundary/alembic-core-agent-interface-boundary-wave-2c-optimized-plan-2026-05-18.md) | 已完成 | 回到上一轮 Wave 2C 后的新入口：总控已复核 Alembic / AlembicPlugin / AlembicAgent 的 Core / Agent interface boundary 消费证据。 |
| 本地源码 resolver / script 契约 | [alembic-local-source-resolver-script-contract-2026-05-18.md](alembic-local-source-resolver-script-contract-2026-05-18.md) | 当前生效契约 | 统一本地源码 resolver 优先级、repo-local script 边界、portable runtime 例外和 BiliDili 默认不进入日常流程的规则。 |
| 本地源码引入统一验收总结 | [alembic-local-source-import-unification-acceptance-summary-2026-05-18.md](archive/2026-05/local-source-import-unification/alembic-local-source-import-unification-acceptance-summary-2026-05-18.md) | 已完成 | Alembic / AlembicPlugin / AlembicAgent 引入口径统一已通过总控验收；当前无需要发送的执行提示词。 |
| 引入统一总控 | [alembic-local-source-import-unification-workspace-plan-2026-05-18.md](archive/2026-05/local-source-import-unification/alembic-local-source-import-unification-workspace-plan-2026-05-18.md) | 已完成 | 已暂停旧 Wave 2C 一轮并完成 Alembic / AlembicPlugin / AlembicAgent 本地源码引入口径统一；BiliDili 默认不进入日常开发流程。 |
| Alembic local source import unification | [alembic-local-source-import-unification-2026-05-18.md](../Alembic/alembic-local-source-import-unification-2026-05-18.md) | 已完成 | Alembic 已改为本地开发消费 `@alembic/core: file:../AlembicCore`，保持 `@alembic/agent: file:../AlembicAgent`，Dashboard build 优先 `../AlembicDashboard`，并更新 local-source-first 守门规则；提交 `9461232072ae77a9b272554fcb61246ff9d1d856`。 |
| AlembicPlugin local source import unification | [alembic-plugin-local-source-import-unification-2026-05-18.md](../AlembicPlugin/alembic-plugin-local-source-import-unification-2026-05-18.md) | 已完成 | Plugin 已改为本地开发消费 `@alembic/core: file:../AlembicCore`，Dashboard build/watch 优先 `../AlembicDashboard`，Codex runtime 从本地 Core 生成 portable `runtime/vendor/AlembicCore` 快照并保持 runtime dependency `file:vendor/AlembicCore`；外层提交 `70eaf130d96f5e61a53dfbdb19c24ff13eb80410`，runtime 快照提交 `09d4ac611408098d6ec3e88d1899d802510aadb5`。 |
| AlembicAgent local source import baseline | [alembic-agent-local-source-import-baseline-2026-05-18.md](../AlembicAgent/alembic-agent-local-source-import-baseline-2026-05-18.md) | 已完成 | Agent 已确认 `@alembic/core: file:../AlembicCore`、本地 Core scanner 和 `node_modules/@alembic/core -> ../AlembicCore`；`AGENTS.md` 已补 local-source-first 守门规则；提交 `0b86fdf55e3f927a1a5384c2b14cd97c8bb0daaf`。 |
| 接口边界 Wave 2B 验收与旧 Wave 2C 分派 | [alembic-core-agent-interface-boundary-wave-2b-acceptance-wave-2c-plan-2026-05-18.md](archive/2026-05/interface-boundary/alembic-core-agent-interface-boundary-wave-2b-acceptance-wave-2c-plan-2026-05-18.md) | 已优化 | AlembicAgent Wave 2B 已总控验收通过；旧 Wave 2C 分派已由优化计划接管，暂不直接派发。 |
| 接口边界 Wave 2A 验收与 Wave 2B 分派 | [alembic-core-agent-interface-boundary-wave-2a-acceptance-wave-2b-plan-2026-05-18.md](archive/2026-05/interface-boundary/alembic-core-agent-interface-boundary-wave-2a-acceptance-wave-2b-plan-2026-05-18.md) | 已完成 | AlembicAgent 已完成 Wave 2B 并提交 `1af571674d3eb123e5aad695cb9a02fc69ce37d6`；后续入口改为 Wave 2B 验收与 Wave 2C 分派文档。 |
| AlembicAgent Core facade consumption Wave 2B | [alembic-agent-core-facade-consumption-wave-2b-2026-05-18.md](../AlembicAgent/alembic-agent-core-facade-consumption-wave-2b-2026-05-18.md) | 已完成 | Agent 已消费 `@alembic/core/search` / `@alembic/core/evolution` / `@alembic/core/memory` stable facades；无 config Core consumer scan `issueCount: 0`，负向扫描旧 imports 0 命中；提交 `1af571674d3eb123e5aad695cb9a02fc69ce37d6`。 |
| 接口边界 Wave 1 验收与 Wave 2A 分派 | [alembic-core-agent-interface-boundary-wave-1-acceptance-wave-2-plan-2026-05-18.md](archive/2026-05/interface-boundary/alembic-core-agent-interface-boundary-wave-1-acceptance-wave-2-plan-2026-05-18.md) | 已完成 | Wave 2A AlembicCore 已完成并提交 `b904b66907e16e61f29a6dc0eeedc59231ddfb53`；后续入口改为 Wave 2A 验收与 Wave 2B 分派文档。 |
| AlembicCore interface boundary Phase 10 facades Wave 2 | [alembic-core-interface-boundary-phase-10-facades-wave-2-2026-05-18.md](../AlembicCore/alembic-core-interface-boundary-phase-10-facades-wave-2-2026-05-18.md) | 已完成 | Core 新增稳定 `@alembic/core/evolution`、`@alembic/core/memory`，增强 `@alembic/core/search` similarity helpers，并把 semantic memory repository 纳入 repositories bundle；check/build/smoke 通过；提交 `b904b66907e16e61f29a6dc0eeedc59231ddfb53`。 |
| 接口边界 Wave 1 执行总控 | [alembic-core-agent-interface-boundary-workspace-plan-2026-05-18.md](archive/2026-05/interface-boundary/alembic-core-agent-interface-boundary-workspace-plan-2026-05-18.md) | 已完成 | Core/Agent/Alembic/Plugin Wave 1 均已完成；Agent public API boundary 和 Core consumer allowlist 已建立，Core 产出 Phase 10 facade 判断。 |
| AlembicAgent interface boundary optimization Wave 1 | [alembic-agent-interface-boundary-optimization-wave-1-2026-05-18.md](../AlembicAgent/alembic-agent-interface-boundary-optimization-wave-1-2026-05-18.md) | 已完成 | Agent 已锁定 15 个 exact public exports，新增 public API policy/self import smoke/Core consumer allowlist，并将 Core imports 收敛到 46 stable / 1 provisional / 5 frozen transitional；提交 `b3a57e3a6ff83525332901ad6ceda24cf2fb7d21`。 |
| AlembicCore interface boundary closeout Wave 1 | [alembic-core-interface-boundary-closeout-wave-1-2026-05-18.md](../AlembicCore/alembic-core-interface-boundary-closeout-wave-1-2026-05-18.md) | 已完成 | Core 已把 AlembicAgent 纳入 consumer 扫描口径；Alembic/AlembicPlugin consumer 扫描 issue 0，AlembicAgent 14 个 transitional refs 已完成 stable replacement / narrow facade / adapter allowlist 判断；验证基线 `92ccd10baad1eac5fcfe3b4d4c8191a02042da04`。 |
| AlembicPlugin Core interface consumer agent-free scan Wave 1 | [alembic-core-interface-consumer-agent-free-scan-wave-1-2026-05-18.md](../AlembicPlugin/alembic-core-interface-consumer-agent-free-scan-wave-1-2026-05-18.md) | 已完成 | Plugin Core boundary 315 files / 517 imports / 0 issue；Stable 357、Provisional 8、Transitional 152；agent-free gate 全 0，`@alembic/agent` 0 命中；无新增代码提交，复验基线 `12b7dd2fdb4d8654d78e548cce8a6692c4fd96be`。 |
| Alembic Core / Agent interface consumer scan Wave 1 | [alembic-core-agent-interface-consumer-scan-wave-1-2026-05-18.md](../Alembic/alembic-core-agent-interface-consumer-scan-wave-1-2026-05-18.md) | 已完成 | Alembic 已复验 `@alembic/agent` public subpath 消费面和 Core consumer boundary；Agent duplicate / generic Tool V2 duplicate 均为 0；无新增代码提交，基线 `ea816fcba9934dcf2bad942cb8424459c0e46455`。 |
| 当前冗余删除总控 | [alembic-redundant-systems-removal-workspace-plan-2026-05-18.md](archive/2026-05/redundant-systems-removal/alembic-redundant-systems-removal-workspace-plan-2026-05-18.md) | 已完成 | Feishu/Lark remote 遗留截屏连带能力、推荐系统和 ReverseGuard 已完成删除；Wave 1 源头删除、Wave 2 vendor/runtime/package/channel 收口和最终负向扫描均已验收通过。 |
| Wave 1 验收与 Wave 2 分派 | [alembic-redundant-systems-wave-1-acceptance-wave-2-plan-2026-05-18.md](archive/2026-05/redundant-systems-removal/alembic-redundant-systems-wave-1-acceptance-wave-2-plan-2026-05-18.md) | 已完成 | Alembic / AlembicCore / AlembicDashboard / AlembicAgent Wave 1 验收通过；Alembic 与 AlembicPlugin Wave 2 已完成并通过最终总控验收。 |
| AlembicPlugin redundant systems vendor runtime sweep Wave 2 | [alembic-redundant-systems-vendor-runtime-sweep-wave-2-2026-05-18.md](../AlembicPlugin/alembic-redundant-systems-vendor-runtime-sweep-wave-2-2026-05-18.md) | 已完成 | Plugin 已同步 Core vendor 到 `92ccd10baad1eac5fcfe3b4d4c8191a02042da04`、Dashboard vendor 到 `7143a7ca610a504b7472ae4afac0eb2df2ebdda8`；删除推荐兼容端点和 `recipe:get_recommendations`，刷新 Codex runtime/tarball；提交 `12b7dd2fdb4d8654d78e548cce8a6692c4fd96be`。 |
| Alembic redundant systems vendor sync Wave 2 | [alembic-redundant-systems-vendor-sync-wave-2-2026-05-18.md](../Alembic/alembic-redundant-systems-vendor-sync-wave-2-2026-05-18.md) | 已完成 | Alembic 已同步 Core vendor 到 `92ccd10baad1eac5fcfe3b4d4c8191a02042da04`、Dashboard vendor 到 `7143a7ca610a504b7472ae4afac0eb2df2ebdda8`；build/check/dashboard build 通过；提交 `ea816fcba9934dcf2bad942cb8424459c0e46455`。 |
| Alembic redundant systems removal Wave 1 | [alembic-redundant-systems-removal-wave-1-2026-05-18.md](../Alembic/alembic-redundant-systems-removal-wave-1-2026-05-18.md) | 已完成 | Alembic 已删除截屏连带能力、Skills/Signal/Recipe 推荐 runtime/API/MCP/gateway 和 ReverseGuard 消费入口；本地截屏/ReverseGuard 扫描 0 命中，推荐扫描仅剩允许的 `RuleLearner.recordFeedback`；提交 `2d04d4c04dde46f74160b89fee71f42cd2249791`。 |
| AlembicDashboard Skills recommendation UI removal | [alembic-skill-recommendation-ui-removal-wave-1-2026-05-18.md](../AlembicDashboard/alembic-skill-recommendation-ui-removal-wave-1-2026-05-18.md) | 已完成 | Dashboard 已删除 Skills 推荐 UI/API/polling/i18n，保留手动 Skills 管理、手动创建和搜索解释字段；`npm run build` 与三组负向扫描通过；提交 `7143a7ca610a504b7472ae4afac0eb2df2ebdda8`。 |
| AlembicCore ReverseGuard removal | [alembic-reverseguard-removal-wave-1-2026-05-18.md](../AlembicCore/alembic-reverseguard-removal-wave-1-2026-05-18.md) | 已完成 | Core 已删除 ReverseGuard 源码、exports、测试和 DecayDetector `symbol_drift` coupling；推荐系统扫描仅剩必须保留的 `RuleLearner.recordFeedback`；提交 `92ccd10baad1eac5fcfe3b4d4c8191a02042da04`。 |
| AlembicAgent redundant systems negative scan | [alembic-redundant-systems-negative-scan-2026-05-18.md](../AlembicAgent/alembic-redundant-systems-negative-scan-2026-05-18.md) | 已完成 | Agent 已确认无截屏连带能力、推荐系统或 ReverseGuard 实现；唯一 `SignalCollector` 历史注释已清理；三组负向扫描 0 命中；提交 `cbd7477462bd85f7490df4b8d6832deb8d3860fe`。 |
| 上一轮清理总控 | [alembic-feishu-remote-removal-plan-2026-05-17.md](archive/2026-05/feishu-remote-removal/alembic-feishu-remote-removal-plan-2026-05-17.md) | 已完成 | Feishu/Lark remote 完整删除计划已总控验收通过；主运行时、Agent contract、Core schema、Dashboard 文案、vendor/runtime、Codex plugin runtime/tarball 和 channel/package-facing 文档均已收口。 |
| AlembicPlugin vendor Feishu remote sweep | [alembic-plugin-vendor-feishu-remote-sweep-2026-05-18.md](../AlembicPlugin/alembic-plugin-vendor-feishu-remote-sweep-2026-05-18.md) | 已完成 | Plugin 已同步 vendored Core 到 `0c64fd7549d58ceded8eed163dae85c6678ea679`、Dashboard 到 `32b2e01c249665e3dc33bdcffbfc39b648d0426d`，刷新 Codex runtime/tarball 并复验 check/build/verify/smoke；提交 `106ed71716e12db5c4c00a54b23984a40b5737b1`。 |
| Alembic vendor Feishu remote sweep | [alembic-vendor-feishu-remote-sweep-2026-05-18.md](../Alembic/alembic-vendor-feishu-remote-sweep-2026-05-18.md) | 已完成 | Alembic 已同步 vendored Core 到 `0c64fd7549d58ceded8eed163dae85c6678ea679`、Dashboard 到 `32b2e01c249665e3dc33bdcffbfc39b648d0426d`，复验 build/check/vscode、Agent public import smoke 和负向扫描；提交 `0d109d0469d5cf978252da8217cc674ac400f14d`。 |
| AlembicAgent Lark remote preset removal | [alembic-agent-lark-remote-preset-removal-2026-05-17.md](../AlembicAgent/alembic-agent-lark-remote-preset-removal-2026-05-17.md) | 已完成 | Agent 已删除 `lark` / `remote-exec` preset/profile/source/channel/event 和 ConversationStore lark category；负向扫描 0 命中；提交 `cad5f0bc986d910e6ffa92decd85065167659a0f`。 |
| Alembic Feishu remote 主实现删除 | [alembic-feishu-remote-removal-2026-05-17.md](../Alembic/alembic-feishu-remote-removal-2026-05-17.md) | 已完成 | Alembic 已删除内置 Feishu/Lark remote HTTP route、transport、notifier、repository、VSCode poller、dependency、测试和当前产品文案；提交 `857f430d0524d4003e54d1bc04e4df81330f0ad8`。 |
| AlembicCore remote schema removal | [alembic-core-remote-schema-removal-2026-05-17.md](../AlembicCore/alembic-core-remote-schema-removal-2026-05-17.md) | 已完成 | Core 已删除 `003_add_remote_commands`、Drizzle remote 表定义和测试期待；按用户决策不新增 drop migration，旧开发库需要时重建；提交 `0c64fd7549d58ceded8eed163dae85c6678ea679`。 |
| AlembicDashboard Lark copy removal | [alembic-dashboard-lark-copy-removal-2026-05-17.md](../AlembicDashboard/alembic-dashboard-lark-copy-removal-2026-05-17.md) | 已完成 | Dashboard Help/i18n 已清理 Lark、飞书、remote-exec 产品展示；`src` 负向扫描 0 命中；提交 `32b2e01c249665e3dc33bdcffbfc39b648d0426d`。 |
| 当前验收与下一步总控 | [alembic-agent-cutover-final-integration-readiness-wave-6-plan-2026-05-17.md](archive/2026-05/agent-extraction/alembic-agent-cutover-final-integration-readiness-wave-6-plan-2026-05-17.md) | 已完成 | Wave 6 最终跨仓库集成 / release readiness / 需要宿主权限的 terminal smoke；五个窗口均已完成，总控最终验收通过。 |
| Alembic final host terminal smoke | [alembic-final-host-terminal-smoke-wave-6-2026-05-17.md](../Alembic/alembic-final-host-terminal-smoke-wave-6-2026-05-17.md) | 已完成 | Alembic 已完成 host TerminalAdapter smoke、daemon health、CLI/capability shape 复验，并新增 clean build + stale dist hard gate；提交 `00a8fe23af73717f313ad09dbab294534599e2a8`。 |
| AlembicDashboard final host capability smoke | [alembic-dashboard-final-host-capability-smoke-wave-6-2026-05-17.md](../AlembicDashboard/alembic-dashboard-final-host-capability-smoke-wave-6-2026-05-17.md) | 已完成 | Dashboard build 通过；经 Alembic 21 个 lightweight schema / 7 个 terminal capability shape 判断，不触发 live smoke；提交 `c3d4ca0`。 |
| AlembicPlugin final agent-free release gate | [alembic-plugin-final-agent-free-release-gate-wave-6-2026-05-17.md](../AlembicPlugin/alembic-plugin-final-agent-free-release-gate-wave-6-2026-05-17.md) | 已完成 | Plugin 已删除未使用旧 ambient Agent 类型声明并更新 `AGENTS.md` agent-free 边界，重跑 agent boundary report、check、build、Codex plugin/channel verify 和 smoke；最新提交 `68e0d4b6af0e13d44e6a10a084f5046f379024b7`。 |
| AlembicAgent final contract lock | [alembic-agent-final-contract-lock-wave-6-2026-05-17.md](../AlembicAgent/alembic-agent-final-contract-lock-wave-6-2026-05-17.md) | 已完成 | Agent public subpaths、terminal contract、Tool V2/service/runtime/memory/context/forge/tasks/profiles exports 已复验；无新增代码提交，复验基线 `10c672d2bd2bf709b88104ef1b4b277c28f97dd9`。 |
| Wave 5 terminal/sandbox 边界总控 | [alembic-terminal-sandbox-agent-tool-boundary-wave-5-plan-2026-05-17.md](archive/2026-05/agent-extraction/alembic-terminal-sandbox-agent-tool-boundary-wave-5-plan-2026-05-17.md) | 已完成 | Wave 5 已总控验收通过；AlembicAgent 已补 terminal Agent tool contract，Alembic 已消费 contract 并删除本地 portable duplicate，只保留真实 host executor/sandbox bridge；提交 `6598857fddd2f94d3d5c05ec5c1836879d1fc657`。 |
| Alembic terminal host bridge consumption | [alembic-terminal-sandbox-host-bridge-consumption-wave-5-2026-05-17.md](../Alembic/alembic-terminal-sandbox-host-bridge-consumption-wave-5-2026-05-17.md) | 已完成 | Alembic 已消费 `@alembic/agent/tools/terminal`，删除本地 terminal capability/policy/session plan/envelope duplicate，并新增 Wave 5 boundary hard gate；提交 `6598857fddd2f94d3d5c05ec5c1836879d1fc657`。 |
| AlembicAgent terminal tool contract | [alembic-agent-terminal-sandbox-tool-contract-wave-5-2026-05-17.md](../AlembicAgent/alembic-agent-terminal-sandbox-tool-contract-wave-5-2026-05-17.md) | 已完成 | Agent 已新增 `@alembic/agent/tools/terminal` public subpath，提交 `10c672d2bd2bf709b88104ef1b4b277c28f97dd9`；总控复验通过，Alembic 可解除阻塞消费。 |
| Wave 4 删除验收总控 | [alembic-agent-cutover-plugin-cleanup-wave-4-deletion-plan-2026-05-17.md](archive/2026-05/agent-extraction/alembic-agent-cutover-plugin-cleanup-wave-4-deletion-plan-2026-05-17.md) | 已完成 | Wave 4 已总控验收通过；Alembic 已删除 duplicate local Agent implementation 和 generic Tool V2 implementation，只保留明确 host-owned adapter；提交 `6abf1321b39b31a4a33c59b4d357d7f1e191cf39`。 |
| Alembic local Agent / Tool duplicate deletion | [alembic-local-agent-tool-implementation-deletion-2026-05-17.md](../Alembic/alembic-local-agent-tool-implementation-deletion-2026-05-17.md) | 已完成 | Alembic 已删除 `lib/agent/**`、generic Tool V2 duplicate、tool core/catalog/workflow duplicate，并把 Wave 4 删除状态写入边界配置；提交 `6abf1321b39b31a4a33c59b4d357d7f1e191cf39`。 |
| Wave 3 验收与下一步总控 | [alembic-agent-cutover-plugin-cleanup-wave-3-acceptance-next-plan-2026-05-17.md](archive/2026-05/agent-extraction/alembic-agent-cutover-plugin-cleanup-wave-3-acceptance-next-plan-2026-05-17.md) | 已完成 | AlembicAgent remaining host contract surface 与 Alembic last local Agent callsite cutover 均已验收；Alembic 提交 `4be3b1e`，Agent 提交 `bd97459`。 |
| Alembic remaining local Agent callsite cutover | [alembic-remaining-local-agent-callsite-cutover-2026-05-17.md](../Alembic/alembic-remaining-local-agent-callsite-cutover-2026-05-17.md) | 已完成 | Alembic 已消费 `@alembic/agent/forge`、`@alembic/agent/tasks`、`@alembic/agent/profiles`，并扩展 boundary lint 阻断生产侧相对路径本地 Agent 导入；提交 `4be3b1e`。 |
| Wave 2 验收与下一步总控 | [alembic-agent-extraction-boundary-wave-2-acceptance-next-plan-2026-05-17.md](archive/2026-05/agent-extraction/alembic-agent-extraction-boundary-wave-2-acceptance-next-plan-2026-05-17.md) | 已完成 | 四仓库 wave 2 验收结论、验证结果、Tool V2 消费主线、Plugin/Dashboard live 联动和 release readiness 分派表。 |
| Alembic Tool V2 contract consumption | [alembic-tool-v2-contract-consumption-2026-05-17.md](archive/2026-05/agent-extraction/alembic-tool-v2-contract-consumption-2026-05-17.md) | 已完成 | Alembic 已消费 `@alembic/agent/tools/v2` generic contract，仅保留 host-owned `ToolContextFactory` bridge；提交 `14faa15`。 |
| AlembicPlugin release readiness | [alembic-plugin-release-readiness-2026-05-17.md](archive/2026-05/agent-extraction/alembic-plugin-release-readiness-2026-05-17.md) | 已完成 | Plugin release gate、Codex channel verify、完整 smoke 和 daemon/dashboard smoke 均已通过；提交 `e7840d0`。 |
| AlembicDashboard Plugin live host-managed 复验 | [alembic-dashboard-plugin-live-host-managed-verification-2026-05-17.md](../AlembicDashboard/alembic-dashboard-plugin-live-host-managed-verification-2026-05-17.md) | 已完成 | Dashboard 已与 Plugin live daemon 复验 Candidates enrich/refine、Global Chat refine、AI Chat host-managed contract；提交 `17a4ff5`。 |
| 分阶段迁移指挥模板 | [phased-migration-command-template-2026-05-17.md](phased-migration-command-template-2026-05-17.md) | 模板 | 突出真实代码挖掘、代码事实到阶段拆分、一波一阶段稳定推进，并提供总控计划、单阶段执行记录、验收/下一波、扫描命令和分派提示词模板。 |
| 上一轮验收与下一步总控 | [alembic-agent-extraction-boundary-acceptance-next-plan-2026-05-17.md](archive/2026-05/agent-extraction/alembic-agent-extraction-boundary-acceptance-next-plan-2026-05-17.md) | 已完成 | AlembicAgent / Alembic / AlembicPlugin / AlembicDashboard 上一波任务已验收；Plugin full smoke 阻塞已解除。 |
| AlembicPlugin npx runtime packaging 修复 | [alembic-plugin-npx-runtime-packaging-fix-2026-05-17.md](archive/2026-05/agent-extraction/alembic-plugin-npx-runtime-packaging-fix-2026-05-17.md) | 已完成 | Plugin embedded runtime 已改为 vendor Core + bundled production dependencies，完整 `npm run smoke:codex-plugin` 通过。 |
| 历史主迁移计划 | [alembic-agent-extraction-boundary-plan-2026-05-17.md](../AlembicAgent/alembic-agent-extraction-boundary-plan-2026-05-17.md) | 背景材料 | AlembicAgent 抽取边界与 Alembic / AlembicPlugin / AlembicDashboard 上一轮总控计划。新任务以 workspace 新文档为准。 |
| AlembicAgent Phase 6 记录 | [alembic-agent-phase-6-contract-surface-2026-05-17.md](../AlembicAgent/alembic-agent-phase-6-contract-surface-2026-05-17.md) | 已完成 | Agent service/runtime/prompts/domain exports 与 Tool V2 边界判断。 |
| AlembicAgent Tool V2 contract | [alembic-agent-tool-v2-contract-2026-05-17.md](../AlembicAgent/alembic-agent-tool-v2-contract-2026-05-17.md) | 已完成 | Agent-owned Tool V2 router/cache/compressor/parser/adapter contract exports 与 host-owned adapter 边界。 |
| AlembicPlugin AI provider 删除记录 | [alembic-agent-extraction-boundary-plugin-phase-3-ai-provider-deletion-2026-05-17.md](../AlembicPlugin/alembic-agent-extraction-boundary-plugin-phase-3-ai-provider-deletion-2026-05-17.md) | 已完成 | Plugin 删除本地 AI provider 后的证据入口；完整发布链路已在 npx runtime packaging 修复记录中解除。 |

后续如果重写当前主计划，应在 `docs/workspace/` 新建 workspace 级入口，并在此表中把旧文档标为历史或背景材料。

## 窗口覆盖状态

| 窗口 | 当前状态 | 当前任务 | 文档动作 | 保存位置 | 挂载入口 | 回填位置 |
| --- | --- | --- | --- | --- | --- | --- |
| `Alembic` | 已完成 | Consumer boundary reduction 已完成：`@alembic/core/domain/dimension*` 全部替换为稳定 `@alembic/core/dimensions`，`config/core-import-boundary.json` 删除四个旧 transitional specifier/limits，提交 `6dc3a875c2ef14be7a3b9a2fa6a9990b6c441c31`。 | 已新建 | `docs/Alembic/alembic-core-agent-consumer-boundary-reduction-wave-3a-2026-05-18.md` | 接口边界优化 Wave 3A“窗口分派”；Alembic Core / Agent consumer boundary reduction Wave 3A 执行记录 | 接口边界优化 Wave 3A“回填区 / Alembic” |
| `AlembicCore` | 待启动 | Core public API closeout：分类 98 transitional / 61 wildcard，按 consumer 事实给出 promote / provisional / replace-first / deprecate / keep-transitional 判断，并落地第一批治理动作。 | 新建 | `docs/AlembicCore/alembic-core-public-api-closeout-wave-3a-2026-05-18.md` | 接口边界优化 Wave 3A“窗口分派” | 接口边界优化 Wave 3A“回填区 / AlembicCore” |
| `AlembicAgent` | 已完成 | Public contract hardening 已完成：锁定 15 exact exports，补 deep/dist/src/three-level negative gate，明确 Agent-owned contract 与 host-owned adapter 边界；提交 `b541c9eaa342dcb085834cfbe36e506c5904c43f`。 | 已新建 | `docs/AlembicAgent/alembic-agent-public-contract-hardening-wave-3a-2026-05-18.md` | 接口边界优化 Wave 3A“窗口分派”；AlembicAgent public contract hardening Wave 3A 执行记录 | 接口边界优化 Wave 3A“回填区 / AlembicAgent” |
| `AlembicDashboard` | 观察中 | 本轮不改 Dashboard；仅当 Alembic / Plugin API client 或 Dashboard build source 因边界变动失败时追加任务。 | 无需新建 | 无 | 接口边界优化 Wave 3A“窗口分派” | 接口边界优化 Wave 3A“回填区 / AlembicDashboard” |
| `AlembicPlugin` | 待启动 | Plugin Core consumer boundary reduction：减少已有 stable facade 可覆盖的 Core transitional imports，收紧 `config/core-import-boundary-allowlist.json`，保持 agent-free 与 artifact-only 边界。 | 新建 | `docs/AlembicPlugin/alembic-plugin-core-consumer-boundary-reduction-wave-3a-2026-05-18.md` | 接口边界优化 Wave 3A“窗口分派” | 接口边界优化 Wave 3A“回填区 / AlembicPlugin” |
| `BiliDili` | 无任务 | 当前是 Alembic 多仓库接口边界治理，不涉及真实 iOS/Swift 项目验证。 | 无需新建 | 无 | 接口边界优化 Wave 3A“窗口分派” | 接口边界优化 Wave 3A“回填区 / BiliDili” |

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

每次跨仓库总控计划必须覆盖所有主要窗口：

| 窗口 | 状态 | 任务 | 文档动作 | 保存位置 | 挂载入口 | 回填位置 | 验证命令 | 阻塞/依赖 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `Alembic` |  |  |  |  |  |  |  |  |
| `AlembicCore` |  |  |  |  |  |  |  |  |
| `AlembicAgent` |  |  |  |  |  |  |  |  |
| `AlembicDashboard` |  |  |  |  |  |  |  |  |
| `AlembicPlugin` |  |  |  |  |  |  |  |  |
| `BiliDili` |  |  |  |  |  |  |  |  |

如果读取代码后发现其它关联窗口、vendor 子仓库、插件资源、runtime 包或发布链路受影响，必须追加到覆盖表中。

## 分派提示词发送规则

- 状态为 `待启动`、`执行中`、`阻塞` 或 `待验收`，且有实际任务的窗口，才进入当前可复制提示词发送名单。
- 状态为 `观察中` 或 `无任务` 的窗口，只保留在覆盖表中防遗漏；不要建议用户发送提示词，除非后续回填触发了实际任务。
