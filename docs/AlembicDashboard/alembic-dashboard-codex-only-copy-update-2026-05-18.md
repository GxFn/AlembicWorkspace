# AlembicDashboard Codex-only copy update

执行日期：2026-05-18

来源总控：`docs/workspace/alembic-codex-only-host-agent-mode-workspace-plan-2026-05-18.md`

状态：`已完成`

## 完成范围

- 更新 Help 可见文案，把旧的传统多编辑器 Agent 叙述收束为 `Codex host agent` + `Alembic internal AI` 两条线。
- 删除中英文 i18n 中面向用户的 `IDE Agent`、`Cursor`、`VSCode Extension`、`Copilot`、`Trae`、`Qoder`、`Claude Code` 项目交付叙述。
- 将 Help 三角色、核心组件、端到端架构流、host-agent section、internal AI job section 和 CLI 速查中的旧文案替换为 Codex 插件宿主 Agent 与 Alembic internal AI 表述。
- 将 ScanResult / Drawer 中的 `Cursor Delivery` 展示名改为 `Agent Delivery`。
- 将 Wiki source 标签中旧 `Cursor Docs` 展示名改为 `Codex Docs`。
- 将代码编辑器内部 caret 位置回调从 `onCursorChange` 改为 `onCaretChange`，避免总控扫描把普通文本光标误判为 Cursor IDE 残留。
- 保留 Dashboard 的 bootstrap / rescan job 观察与控制 UI，保留 candidates、recipe、wiki、guard、daemon、job 等产品功能。

## 提交

- `67edca51f092f592125fd5357d7824969cee7205` - `Update Codex host agent dashboard copy`

## 验证命令和结果

- `npm run build`
  - 通过。`tsc && vite build` 成功，Vite 仅保留既有 large chunk warning。
- `npm run check`
  - 未通过执行：当前 `package.json` 未定义 `check` 脚本；本仓库当前可用脚本为 `dev`、`build`、`preview`。
- `git diff --check`
  - 通过，无 whitespace/error 输出。
- `rg -n 'IDE Agent|Cursor|Copilot|VSCode Extension|Trae|Qoder|Claude Code|cursorIntegration|cursorDelivery|roleCursorAgent|cliCursor|cliMirror|vscodeExt' src`
  - 0 命中。
- `rg -n 'cursorIntegration|cursorDelivery|roleCursorAgent|cursorAgentResp|cursorAgentCap|ideIntegration|archOverviewIDE|vscodeExtension|vscodeExt|cliCursorRulesDesc|cliMirrorDesc|onCursorChange|handleCursorUpdate' src`
  - 0 命中。
- `rg -n 'IDE|Cursor|Copilot|VSCode|VS Code|Trae|Qoder|Claude Code|\.qoder|\.trae' src/i18n src/components/Views src/components/Shared --glob '!**/dist/**'`
  - 0 命中。
- `rg -n 'Codex/IDE|IDE 宿主|IDE Agent|IDE 集成|Cursor Delivery|Cursor Docs|VSCode Extension|Copilot|Trae|Qoder|Claude Code|cursor-rules|asd mirror' src/i18n src/components/Views src/components/Shared --glob '!**/dist/**'`
  - 0 命中。

## 残留扫描结果

- 总控建议扫描模式在 `src` 下 0 命中。
- 更宽松的小写 `cursor|vscode|trae|qoder` 扫描仅剩两类允许命中：
  - React / CSS 交互语义中的 `cursor-*` className 或 DOM style，例如 `cursor-pointer`、`cursor-not-allowed`。
  - `WikiView` 中后端历史 source id `cursor-devdocs`。该 key 用于兼容既有后端 payload，用户可见 label 已改为 `Codex Docs`。

## 遗留风险

- `cursor-devdocs` source id 仍保留为兼容字段；如果后端后续改名，Dashboard 可同步删除该兼容 key。
- Help 中 `asd ai status` / `asd ai configure` 文案依据总控定义的 Alembic internal AI 线；如果 Alembic 主包最终 CLI 命名调整，需要再同步 Dashboard 文案。
- `npm run check` 脚本缺失不是本次改动引入；本轮以 `npm run build` 覆盖 TypeScript 与 production build 验证。

## 下一步建议

- `Alembic` 完成主包多编辑器交付路径删除后，复核 Dashboard CLI 文案与最终 CLI help 是否一致。
- `AlembicPlugin` 完成 Codex host-agent 主路径收束后，复核 Help 中 Codex 插件描述是否需要补充具体工具名。
- 总控验收时运行跨仓库扫描，并将 CSS `cursor-*` 与 `cursor-devdocs` 兼容 source id 按本记录列为允许命中。
