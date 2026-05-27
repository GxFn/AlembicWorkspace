# Alembic Codex-Only Residual Runtime Docs Closeout

日期：2026-05-18
窗口：Alembic
状态：已完成

## 完成范围

- 重写 `README_CN.md`，与英文 README 对齐为 Alembic 主包路线：CLI、daemon、HTTP/API、Dashboard server、Alembic internal AI；Codex host-agent 工作流归属 `AlembicPlugin`。
- 删除 `config/default.json` 中不再消费的 `folderNames.ide`，避免主包继续携带传统编辑器交付路径配置。
- 更新 `config/constitution.yaml` 与 `templates/recipes-setup/_template.md` 中的旧多编辑器 / delivery 文案，改为 external host / agent consumption 语义。
- 更新 `coldstart --no-delivery` help，改为“跳过可选知识物化阶段”，不再描述项目内编辑器交付。
- 删除 `FileChangeSourceTracker`、`/api/v1/file-changes/heartbeat` 路由和 daemon collector 的外部扩展心跳 gating；`DaemonFileChangeCollector` 现在始终按项目 git worktree 自主采集变更并通过 `FileChangeDispatcher` 分发。
- 更新 `FileChangeDispatcher`、`DaemonFileChangeCollector`、`file-changes`、`guard`、`task` route 注释与 API 文案，改为 Alembic daemon / Dashboard / CLI / external host 通用表述。
- 更新 `WikiGenerator` 和 knowledge handler 中旧宿主文案；Wiki 的同步阶段保留为空的 host-neutral external docs 同步，不再绑定编辑器交付目录。
- 未修改 `AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`、`BiliDili` 源码。

## 提交

- Alembic：`07a6a0a1d284750bc1e83689c22855f62ef7738c`

## 验证命令与结果

- `npm run build:check`：通过。
- `npm run build`：通过。
- `npm run dev:link -- --dry-run --verbose`：通过；仍只验证全局 `alembic`，不要求旧主包宿主入口。
- `npm run dev:verify`：通过；全局 `alembic` 指向当前 Alembic 工作区并返回 `0.1.0`。沙箱内 daemon 进程探测不可用，命令按脚本逻辑跳过提示。
- `npm run lint:agent-extraction-boundary`：通过。
- `npm run lint:core-import-boundary`：通过，扫描 415 个文件和 553 个 `@alembic/core` import。
- `npm run test:unit -- test/unit/DaemonFileChangeCollector.test.ts`：通过，3 个测试通过。
- `git diff --check`：通过。
- `npx biome check --diagnostic-level=error <modified files>`：通过。
- `rg -n "Cursor|Copilot|VSCode|VS Code|Trae|Qoder|Claude Code|IDE Agent|\\.cursor|\\.vscode|cursor-rules|copilot-instructions|alembic-mcp|vscodeExtension|FileChangeSourceTracker|markVscode" README.md README_CN.md config templates bin lib scripts test --glob '!CHANGELOG.md'`：0 命中。
- `rg -n "/heartbeat|heartbeat|ALEMBIC_VSCODE|FileChangeSourceTracker|extensionTtlMs|sourceTracker|vscode" lib/service/evolution lib/http/routes/file-changes.ts bin/daemon-server.ts test/unit/DaemonFileChangeCollector.test.ts`：0 命中。

## 负向扫描剩余命中

- 本轮 Alembic 主仓库目标扫描 0 命中。
- file-change runtime 专项扫描 0 命中。
- 历史 `CHANGELOG.md` 未纳入本轮删除目标。

## 遗留风险

- `FileChangeEventSource` 的 `ide-edit` 值仍来自 `@alembic/core` public type，本仓库只在 HTTP route 中保留兼容接收，不在本轮改 Core public contract。若总控后续要求彻底 host-neutral rename，需要启动 Core 专项并提供兼容迁移计划。
- `WikiGenerator` 的 external docs 同步阶段目前是空同步阶段，用于保留 Wiki pipeline shape；如未来确认没有任何 host-neutral 外部文档输入源，可单独删除该阶段。
- Workspace 文档按本波约束只回填不提交，等待主控窗口统一验收、修正索引和提交。

## 下一步建议

- 等 `AlembicPlugin` 完成同波模板 / runtime artifact 收口后，由总控运行跨仓库负向扫描。
- 总控如确认 `ide-edit` public source 命名仍会造成误读，再派发 `AlembicCore` public contract 兼容别名 / rename 计划。
- 本波完成后可由主控统一复核 `docs/workspace/index.md` 与当前状态文档，决定是否归档上一波和本波计划。
