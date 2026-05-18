# Alembic Codex-Only Residual Runtime Docs Closeout Workspace Plan

日期：2026-05-18
总控窗口：AlembicWorkspace
状态：已验收；Alembic 与 AlembicPlugin 均完成并通过总控复核

## 背景

上一波 `alembic-codex-only-host-agent-mode-workspace-plan-2026-05-18.md` 已完成核心路径：`Alembic` 主包删除多 IDE Agent delivery 主链路，`AlembicPlugin` 默认 cold-start / rescan 切到 Codex host-agent workflow，`AlembicDashboard` 可见文案切到 `Codex host agent` + `Alembic internal AI` 两线。

总控复核构建通过，但残留扫描发现文档、配置、模板、file-change runtime 和 Plugin artifact 仍有旧 IDE / Cursor / VSCode 语义。本波只做残留收口，不重新打开已完成主链路删除。

## 总控复核结果

已通过：

```text
node scripts/verify-workspace-docs.mjs --all-workspace
node scripts/check-dispatch-coverage.mjs
git diff --check
Alembic: npm run build:check
AlembicPlugin: npm run build:check
AlembicDashboard: npm run build
```

发现的残留：

- `Alembic/README_CN.md` 仍是旧 Cursor / Copilot / VS Code / Trae / Qoder / Claude Code 入口说明。
- `Alembic/config/default.json`、`config/constitution.yaml`、`templates/recipes-setup/_template.md` 仍保留 IDE / Cursor delivery 语义。
- `Alembic/bin/cli.ts` 的 `coldstart --no-delivery` help 仍写 Cursor/Wiki/Agent 交付。
- `Alembic/lib/service/evolution/*`、`lib/http/routes/file-changes.ts` 仍围绕 VSCode extension heartbeat 做 file-change gating。
- `Alembic/lib/service/wiki/WikiGenerator.ts`、`lib/external/mcp/handlers/knowledge.ts` 等注释 / 文案仍残留 Cursor 语义。
- `AlembicPlugin/config/default.json`、`config/constitution.yaml`、`templates/claude-code`、`templates/cursor-rules`、`templates/instructions` 仍保留多 IDE Agent 或传统交付模板。
- `AlembicPlugin/lib/external/mcp/handlers/evolve-external.ts` 默认 reason 仍写 `IDE Agent confirmed deprecation`。
- `AlembicPlugin` 的 runtime Dashboard dist 需要在 Dashboard 文案完成后重新同步一次。

历史 `CHANGELOG.md` 可以保留旧能力记录，不作为本波删除目标。

## Workspace 提交约束

本波执行窗口可以按本文授权新建或回填 `docs/Alembic/`、`docs/AlembicPlugin/` 等 workspace 文档，但不得自行提交 AlembicWorkspace 仓库。执行窗口只提交各自源码仓库或 nested artifact 仓库；workspace 文档由主控窗口验收、修正索引和确认无遗漏后统一提交。

## 窗口分派

派发只看这张表：`待启动`、`执行中` 且仍有实际执行任务的窗口才发送提示词；`观察中`、`无任务` 不发送。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>已完成 | 已清理主包剩余旧 IDE 文档 / 配置 / 模板 / file-change VSCode heartbeat 语义，让 internal AI + daemon file monitor 成为唯一主包路线。 |
| `AlembicPlugin`<br>已完成 | 已清理 Plugin 剩余传统 IDE 模板 / 配置 / runtime Dashboard artifact，并保持 Codex plugin artifact-only 边界。 |
| `AlembicDashboard`<br>观察中 | Dashboard 源码已验收通过；仅当 Plugin 同步 Dashboard dist 后发现源侧仍有旧文案，才返工。 |
| `AlembicCore`<br>观察中 | 本轮不主动改 public contract；若 Alembic 证明 `FileChangeEventSource` 的 `ide-edit` 命名阻塞主包收口，再启动 Core 专项。 |
| `AlembicAgent`<br>无任务 | internal AI runtime 不涉及本波文档 / 配置 / file-change 残留。 |
| `BiliDili`<br>无任务 | 真实测试项目不参与本波残留清理。 |

## Alembic 执行要求

文档动作：新建执行记录。

保存位置：`docs/Alembic/alembic-codex-only-residual-runtime-docs-closeout-2026-05-18.md`

挂载入口：本文“回填区 / Alembic”。

目标：

- 重写或同步 `README_CN.md`，不得继续把 Alembic 主包描述为 Cursor / Copilot / VS Code / Trae / Qoder / Claude Code 驱动的工具。
- 清理 `config/default.json` 中不再被主包消费的 `folderNames.ide`；如果仍有兼容读取，改成 host-neutral 命名并在执行记录中写明原因。
- 更新 `config/constitution.yaml`、`templates/constitution.yaml`、`templates/recipes-setup/_template.md` 等 template 文案，把 Cursor / IDE agent 语义改为 host agent / agent adapter / internal AI 语义。
- 更新 `coldstart --no-delivery` help，避免提到 Cursor 交付。
- 清理 file-change runtime 中 VSCode extension heartbeat 设计：删除 `FileChangeSourceTracker` / heartbeat route / daemon collector gating，或改为通用 host source gating；在没有 VSCode extension 后，daemon file monitor 应按 `projectRoot` 自己采集 git worktree changes。
- 更新 `FileChangeDispatcher`、`DaemonFileChangeCollector`、`file-changes` route 的注释和 API 文案，明确这是 Alembic daemon / external host edit source，不是 VSCode extension 专属能力。
- 更新 `WikiGenerator` 和 knowledge handler 中残留的 Cursor 文案；如果同步外部文档能力已经无输入源，应删除空同步阶段或改成 host-neutral external documents。

禁止事项：

- 不恢复 `alembic-mcp`、VSCode extension、Cursor delivery pipeline、IDE setup / mirror / upgrade 命令。
- 不改 `AlembicCore` public type 以绕过本仓库代码残留；如果确实需要 Core 改名，先回填阻塞证据。
- 不触碰 `AlembicPlugin`、`AlembicDashboard`、`BiliDili` 源码。

建议验证命令：

```text
npm run build:check
npm run build
npm run dev:link -- --dry-run --verbose
npm run dev:verify
npm run lint:agent-extraction-boundary
npm run lint:core-import-boundary
npm run test:unit -- test/unit/DaemonFileChangeCollector.test.ts
git diff --check
rg -n "Cursor|Copilot|VSCode|VS Code|Trae|Qoder|Claude Code|IDE Agent|\\.cursor|\\.vscode|cursor-rules|copilot-instructions|alembic-mcp|vscodeExtension|FileChangeSourceTracker|markVscode" README.md README_CN.md config templates bin lib scripts test --glob '!CHANGELOG.md'
```

允许例外：

- `CHANGELOG.md` 历史记录。
- CSS / DOM 普通 `cursor` 交互语义。
- 如果 `ide-edit` public event source 暂时保留为兼容 alias，必须在执行记录中写清消费方和后续 Core 触发条件。

## AlembicPlugin 执行要求

文档动作：新建执行记录。

保存位置：`docs/AlembicPlugin/alembic-plugin-residual-template-runtime-closeout-2026-05-18.md`

挂载入口：本文“回填区 / AlembicPlugin”。

目标：

- 清理 `config/default.json` 中不再被 Codex plugin 消费的 `folderNames.ide`；如果仍由 embedded runtime 兼容读取，改成 host-neutral 命名并记录原因。
- 更新 `config/constitution.yaml`、`templates/constitution.yaml`、`templates/recipes-setup/_template.md` 的 IDE / Cursor 文案。
- 删除 `templates/claude-code`、`templates/cursor-rules` 等传统多 IDE Agent 模板，除非实现证明 release artifact 仍真实引用；如果保留，必须说明为何不等同于恢复多 IDE Agent 支持。
- 清理 `templates/instructions` 的传统 agent-static / conventions 入口，避免 Plugin artifact 继续携带非 Codex 宿主说明。
- 更新 `lib/external/mcp/handlers/evolve-external.ts` 等代码中的 `IDE Agent` 默认 reason，改为 Codex host agent / host agent。
- 在 Dashboard 源码已完成后，重新执行 Dashboard dist 同步与 runtime artifact 准备，让 `plugins/alembic-codex/runtime/dashboard/dist` 使用最新 `AlembicDashboard` 产物。
- 保持 `alembic_codex_bootstrap` / `alembic_codex_rescan` 的显式 internal AI job 说明可以存在；本波不要求删除这些工具。

禁止事项：

- 不把 Plugin 改成 npm registry 包发布；仍然只产出 Codex plugin / marketplace artifact。
- 不把 Dashboard 前端源码迁入 Plugin；Plugin 只能携带 release artifact 或返回 Dashboard URL。
- 不要求 Codex host-agent cold-start 配置 AI Provider。
- 不触碰 `BiliDili` 源码。

建议验证命令：

```text
npm run build:check
npm run build
npm run build:dashboard
npm run prepare:codex-plugin-runtime
npm run verify:codex-plugin
npm run verify:codex-channel
npm run smoke:codex-plugin
npm run lint:core-import-boundary
git diff --check
git -C plugins/alembic-codex diff --check
rg -n "Claude Code|Cursor|Copilot|VSCode|VS Code|Trae|Qoder|IDE Agent|\\.cursor|\\.vscode|cursor-rules|copilot-instructions" README.md config templates lib plugins/alembic-codex --glob '!**/runtime/vendor/**' --glob '!**/runtime/dist/**' --glob '!CHANGELOG.md'
```

允许例外：

- `alembic_codex_bootstrap` / `alembic_codex_rescan` 作为显式 internal AI job 的工具名、测试和文档说明。
- Release playbook 中验证 Ghost mode 不创建 `.cursor` / `.vscode` 的负向说明可以保留。
- `CHANGELOG.md` 历史记录。

## 总体验收条件

- `Alembic` 源码、README、中文 README、config、templates、file-change runtime 中不再有传统多 IDE Agent 支持叙述。
- `Alembic` daemon file monitor 是主包自身能力，不再等待 VSCode extension heartbeat。
- `AlembicPlugin` 不再携带传统 Claude Code / Cursor Rules 模板作为 Codex plugin artifact 的默认资源。
- `AlembicPlugin` runtime Dashboard dist 已同步 Dashboard 最新产物。
- `AlembicDashboard` 源码保持干净；不需要为了 Plugin artifact 同步重复改 UI。
- `AlembicCore`、`AlembicAgent`、`BiliDili` 未被无必要修改。

总控复核命令：

```text
node scripts/verify-workspace-docs.mjs --all-workspace
node scripts/check-dispatch-coverage.mjs
git diff --check
rg -n "full-ide|alembic-mcp|setup:mcp|install:cursor|install:vscode|build:vscode|package:vscode|cursor-rules|\\.cursor|\\.vscode|copilot-instructions|\\.qoder|\\.trae|Claude Code|Qoder|Trae|Copilot|VSCode Extension|IDE Agent|vscodeExtension|FileChangeSourceTracker|markVscode" Alembic AlembicPlugin AlembicDashboard --glob '!**/node_modules/**' --glob '!**/dist/**' --glob '!**/vendor/**' --glob '!**/runtime/vendor/**' --glob '!**/docs/**' --glob '!**/CHANGELOG.md'
```

## 可复制分派提示词

发送给：无

```text
当前无可发送执行窗口；本计划已经验收完成，不再派发领取任务提示词。
```

不发送给：`Alembic`、`AlembicPlugin`、`AlembicDashboard`、`AlembicCore`、`AlembicAgent`、`BiliDili`。

## 回填区

### Alembic

- 状态：已完成
- 执行记录：`docs/Alembic/alembic-codex-only-residual-runtime-docs-closeout-2026-05-18.md`
- 完成范围：重写 `README_CN.md`，与英文 README 对齐到 CLI / daemon / HTTP/API / Dashboard / Alembic internal AI 主包路线；删除 `config/default.json` 中不再消费的 `folderNames.ide`；更新 constitution / recipe template / coldstart help / Wiki / knowledge handler / HTTP route 注释中的旧多编辑器与 delivery 文案；删除 `FileChangeSourceTracker`、`/api/v1/file-changes/heartbeat` route 和 daemon collector 的外部扩展心跳 gating；daemon file monitor 现在按项目 git worktree 自主采集变化并通过 `FileChangeDispatcher` 分发。
- 提交 hash：`07a6a0a1d284750bc1e83689c22855f62ef7738c`
- 验证结果：`npm run build:check` 通过；`npm run build` 通过；`npm run dev:link -- --dry-run --verbose` 通过；`npm run dev:verify` 通过，沙箱内 daemon 进程探测不可用但按脚本逻辑跳过提示；`npm run lint:agent-extraction-boundary` 通过；`npm run lint:core-import-boundary` 通过；`npm run test:unit -- test/unit/DaemonFileChangeCollector.test.ts` 通过，3 个测试通过；`git diff --check` 通过；修改文件级 `npx biome check --diagnostic-level=error` 通过；目标负向扫描 0 命中；file-change runtime 专项扫描 0 命中。
- 负向扫描剩余命中：Alembic 主仓库目标扫描 0 命中；历史 `CHANGELOG.md` 未纳入本轮删除目标。
- 遗留风险：`FileChangeEventSource` 的 `ide-edit` 值仍来自 `@alembic/core` public type，本仓库只保留兼容接收，不在本轮改 Core public contract；`WikiGenerator` external docs 同步阶段目前为空同步阶段，用于保留 pipeline shape；workspace 文档按本波约束只回填不提交，等待主控统一验收和提交。
- 下一步建议：等待 `AlembicPlugin` 完成本波模板 / runtime artifact 收口后，由总控运行跨仓库负向扫描；如 `ide-edit` public source 命名仍造成误读，再派发 `AlembicCore` 兼容 rename 专项。

### AlembicPlugin

- 状态：已完成
- 执行记录：`docs/AlembicPlugin/alembic-plugin-residual-template-runtime-closeout-2026-05-18.md`
- 提交 hash：AlembicPlugin `9426746ddac2a22186b451e90393d9928689a423`；Codex artifact nested repo `480e809afe49242340d7bdcb83798a6a3e9128f4`
- 验证结果：`npm run build:check`、`npm run build`、`npm run build:dashboard`、`npm run prepare:codex-plugin-runtime`、`npm run verify:codex-plugin`、`npm run verify:codex-channel`、`npm run smoke:codex-plugin`、`npm run lint:core-import-boundary`、`git diff --check`、`git -C plugins/alembic-codex diff --check` 均通过；embedded runtime 保留 `@alembic/core: file:vendor/AlembicCore` 和 `.alembic-source.json`。
- 遗留风险：Core public type 仍要求 `source: 'ide-agent'` 兼容枚举，本轮只将默认 reason 改为 host agent；残留扫描仅剩 release playbook 允许的 `.cursor` / `.vscode` 负向验证说明，原建议扫描另有 generated Dashboard dist CSS/UI class 噪声。

### 总控验收

- 状态：已验收
- 结论：Alembic 与 AlembicPlugin 均完成本波残留收口，源码仓库工作区干净；总控文档和执行记录已回填。跨仓库扫描只剩允许残留：release playbook 中验证 Ghost mode 不创建 `.cursor` / `.vscode` 的负向说明，以及 `PathGuard` 单元测试中阻止 `.cursor` / `.vscode` / `.github` 写入的负向断言。
- 总控验证结果：`node scripts/verify-workspace-docs.mjs --all-workspace` 通过；`node scripts/check-dispatch-coverage.mjs` 通过；`git diff --check` 通过；`Alembic: npm run build:check` 通过；`Alembic: npm run test:unit -- test/unit/DaemonFileChangeCollector.test.ts` 通过；`AlembicPlugin: npm run build:check` 通过；`AlembicPlugin: npm run lint:core-import-boundary` 通过；`AlembicPlugin: npm run verify:codex-plugin` 通过；`AlembicPlugin: npm run verify:codex-channel` 通过；`AlembicPlugin: npm run smoke:codex-plugin` 通过。
- 下一步建议：进入长期路线收口，按 `Plugin first, Alembic install enhances` 记录边界：`AlembicPlugin` 作为 Codex host agent 入口，`Alembic` 作为本地增强底座；后续新建计划时围绕该契约分配任务。
