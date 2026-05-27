# AlembicDashboard AI Source Boundary Dashboard Labels

日期：2026-05-18
执行窗口：AlembicDashboard
状态：待验收
来源计划：`docs/workspace/alembic-ai-source-boundary-plugin-enhancement-workspace-plan-2026-05-18.md`

## 完成范围

- 新增共享 source 展示 helper：`src/utils/sourceLabels.ts`，统一 `host-agent`、`alembic-agent`、`host-edit`、历史 `ide-agent` / `ide-edit` 兼容来源和现有 domain source 的 label / color。
- 更新 `ProposalSource`，补齐 `host-agent`、`alembic-agent`、`host-edit`，保留 `ide-agent` / `ide-edit` 只作为兼容显示。
- 候选、知识、Recipe、Evolution proposal、扫描结果、Signal 视图、Reasoning 来源数组和 Token source 分布改为消费同一套 source label。
- 中英文 i18n 新增 `sources.*` 统一文案；旧 `ide-agent` / `ide-edit` 显示为 compatibility source。
- AI provider / model / provider key / LLM config 继续留在 `api.ts`、`Header`、`LlmConfigModal` 和 `llmConfig` 文案中，未被接入 knowledge source label helper。
- 未改 Alembic 后端能力归属；Dashboard API client 只保留既有 provider config / source filter 传参形态。

## 提交

- AlembicDashboard：`26369661193fb42d9f7db0d7df6440a01cab656e` (`Clarify AI source labels`)

## 验证命令与结果

- `npm run build`：通过；Vite 仍提示既有 large chunk warning。
- `npm run`：通过；确认当前脚本只有 `dev`、`build`、`preview`，本仓库没有额外 `check` script。
- `git diff --check`：通过。
- `git diff --check HEAD~1..HEAD`：通过。
- `rg -n "ide-agent|ide-edit|host-agent|alembic-agent|aiProvider|provider" src --glob '!**/dist/**'`：通过；剩余命中为 `ProposalSource` / `sourceLabels` / i18n 兼容文案、Help 文案中的 host-agent 说明，以及 AI provider config UI/API 类型。
- `rg -n "provider.*host-agent|aiProvider.*host-agent|model.*host-agent|configSource.*host-agent|host-agent.*provider|host-agent.*model|provider.*alembic-agent|aiProvider.*alembic-agent|model.*alembic-agent|configSource.*alembic-agent|alembic-agent.*provider|alembic-agent.*model" src --glob '!**/dist/**'`：无命中，未发现 provider / model / config source 与 `host-agent` 或 `alembic-agent` 混用。
- `node scripts/verify-workspace-docs.mjs --all-workspace`：通过。
- `node scripts/check-dispatch-coverage.mjs`：通过；当前只发送给 `AlembicPlugin`。

## 负向扫描剩余命中

- `ide-agent` / `ide-edit`：仅剩 `ProposalSource` 类型、`sourceLabels` 兼容映射和 i18n 兼容文案。
- `host-agent` / `alembic-agent`：用于 `ProposalSource` 类型、`sourceLabels` label 映射和 Help 文案说明；未用于 provider fallback。
- `provider` / `aiProvider`：仍存在于 AI config API、Header 切换和 LLM config modal；这些是配置状态，不是 knowledge source。

## 遗留风险

- Dashboard 只能展示和筛选 source contract，不能阻止后端继续写入旧 `ide-agent` / `ide-edit`；需要 Alembic / AlembicAgent / AlembicPlugin 写入侧继续保证新默认值。
- 未新增 UI snapshot；本轮用类型构建和 source 扫描覆盖。
- 未知未来 source 会回退为原始字符串展示，需要后端或后续 UI 再补充 label。

## 下一步建议

- `AlembicPlugin` 继续完成 host-agent 写入和本地 Alembic enhancement probe / resolver。
- 总控验收时把 provider config 命中和 knowledge source 命中分开判断，避免把 LLM 配置 UI 误判成 source 残留。
- 后端验收需确认新写入不再使用 `ide-agent` / `ide-edit`。
