# AlembicPlugin Residual Template Runtime Closeout

日期：2026-05-18
窗口：AlembicPlugin
状态：已完成
总控来源：`docs/workspace/alembic-codex-only-residual-runtime-docs-closeout-workspace-plan-2026-05-18.md`

## 完成范围

- 清理 `config/default.json` 中未被 Codex plugin 消费的 `paths.folderNames.ide`，本轮扫描未发现运行时代码读取该配置，因此直接删除而非改名兼容。
- 将 `config/constitution.yaml`、`templates/constitution.yaml`、`templates/recipes-setup/_template.md` 的 IDE / Cursor 交付文案改为 Codex / host agent 语义。
- 删除传统多 IDE Agent 模板目录：`templates/claude-code`、`templates/cursor-rules`、`templates/instructions`。未发现 release / runtime 脚本仍引用这些模板。
- 将 `lib/external/mcp/handlers/evolve-external.ts` 的默认 deprecation reason 从 `IDE Agent confirmed deprecation` 改为 `Host agent confirmed deprecation`。
- 清理 Codex skill 和 channel 文案中的旧宿主示例，避免插件 artifact 继续携带多 IDE 扩展说明。
- 重新从 `AlembicDashboard` 构建并同步 Dashboard dist，随后执行 `prepare:codex-plugin-runtime` 生成 portable runtime artifact。
- 确认 embedded runtime 仍保留 `@alembic/core: file:vendor/AlembicCore` 与 `vendor/AlembicCore/.alembic-source.json`，未重新引入 `@alembic/agent`。

## 提交

- AlembicPlugin：`9426746ddac2a22186b451e90393d9928689a423` (`chore: close residual codex-only plugin artifacts`)
- Codex artifact nested repo：`480e809afe49242340d7bdcb83798a6a3e9128f4` (`chore: close residual codex runtime artifacts`)

## 验证命令

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
node -e "const fs=require('fs'); const pkg=JSON.parse(fs.readFileSync('plugins/alembic-codex/runtime/package.json','utf8')); const meta=JSON.parse(fs.readFileSync('plugins/alembic-codex/runtime/vendor/AlembicCore/.alembic-source.json','utf8')); console.log(JSON.stringify({coreDependency:pkg.dependencies['@alembic/core'], hasSourceMetadata:true, source:meta.source, commit:meta.commit}, null, 2));"
rg -n "Claude Code|Cursor|Copilot|VSCode|VS Code|Trae|Qoder|IDE Agent|\\.cursor|\\.vscode|cursor-rules|copilot-instructions" README.md config templates lib plugins/alembic-codex --glob '!**/runtime/vendor/**' --glob '!**/runtime/dist/**' --glob '!CHANGELOG.md'
rg -n "Claude Code|Cursor|Copilot|VSCode|VS Code|Trae|Qoder|IDE Agent|\\.cursor|\\.vscode|cursor-rules|copilot-instructions" README.md config templates lib plugins/alembic-codex --glob '!**/runtime/vendor/**' --glob '!**/runtime/dist/**' --glob '!**/runtime/dashboard/dist/**' --glob '!CHANGELOG.md'
```

## 验证结果

- `npm run build:check`：通过，Core build 使用 `../AlembicCore @ 9506dca8ebcd0d59a208a640c7c373d8efd26a7c`。
- `npm run build`：通过。
- `npm run build:dashboard`：通过，Dashboard dist 从 `../AlembicDashboard @ 67edca51f092f592125fd5357d7824969cee7205` 同步。
- `npm run prepare:codex-plugin-runtime`：通过，生成 `runtime` 与 `runtime.tgz`。
- `npm run verify:codex-plugin`：通过。
- `npm run verify:codex-channel`：通过。
- `npm run smoke:codex-plugin`：通过，install / stdio / npxRuntime 均 passed，recovery / daemon skipped。
- `npm run lint:core-import-boundary`：通过，扫描 320 files 与 505 个 `@alembic/core` imports。
- `git diff --check`：通过。
- `git -C plugins/alembic-codex diff --check`：通过。
- embedded runtime 检查：`@alembic/core` 仍为 `file:vendor/AlembicCore`，`.alembic-source.json` 存在并指向 `../AlembicCore @ 9506dca8ebcd0d59a208a640c7c373d8efd26a7c`。

## 残留扫描结果

原建议扫描命令仍会命中 generated Dashboard dist 中的 CSS/UI class 噪声，因为该命令没有排除 `plugins/alembic-codex/runtime/dashboard/dist/**`；这不是源码、模板或手写 runtime 文案残留。

加入 generated Dashboard dist 排除后的可行动残留仅剩允许例外：

```text
plugins/alembic-codex/RELEASE-PLAYBOOK.md:148: Ghost mode 不创建 .cursor / .vscode 的负向验证说明
plugins/alembic-codex/runtime/plugins/alembic-codex/RELEASE-PLAYBOOK.md:148: runtime shell snapshot 中同一负向验证说明
```

## 遗留风险

- `evolveExternal` 仍通过 Core 当前 public type 提交 `source: 'ide-agent'`，这是 Core `ProposalSource` 的兼容枚举限制；本轮只清理用户可见默认 reason，不改 Core public contract。若后续 Core 提供 `host-agent` source alias，可再切换。
- Release playbook 的 `.cursor` / `.vscode` 命中是本波文档允许的 Ghost mode 负向检查，不能误删成恢复多 IDE 支持。

## 下一步建议

- 由总控窗口复核 workspace 文档索引和跨仓库总体验收扫描。
- 若总控要求建议扫描完全无 generated dist 噪声，建议统一调整验收命令排除 `**/runtime/dashboard/dist/**`。
