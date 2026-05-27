# AlembicPlugin Plugin Devdocs / Wiki Removal

日期：2026-05-23
窗口：AlembicPlugin
任务：GTODO-2026-05-23-025
状态：已完成

## 当前窗口定位和职责

- 当前窗口定位：`AlembicPlugin` 执行窗口。
- 目标仓库职责：Codex MCP、Codex plugin skills、channel / marketplace、embedded runtime artifact、安装验证和 Codex 宿主适配。
- 本轮职责：删除 Plugin 侧 `alembic-devdocs` / 旧 `alembic_wiki` 能力；文档管理能力保留给 `Alembic` 主体后续承接。
- 明确不承担：不删除 `Alembic` 主体 resident `alembic_wiki` 或 HTTP `/api/v1/wiki`；不改 Dashboard；不操作 BiliDili / 真实测试项目。

## 完成范围

- 删除 Plugin 内置 `alembic-devdocs` skill：`injectable-skills/alembic-devdocs/SKILL.md`。
- 删除 AlembicCodex plugin shipped `alembic-devdocs` skill：`plugins/alembic-codex/skills/alembic-devdocs/SKILL.md`。
- 从 `plugins/alembic-codex/skills/alembic/SKILL.md` 移除 devdocs related skill 引导。
- 从 `lib/codex/PluginRegistry.ts`、`scripts/verify-codex-plugin.mjs`、`scripts/smoke-codex-plugin.mjs` 移除 `alembic-devdocs` 必备 skill 期望。
- 从 `lib/external/mcp/handlers/skill.ts` 移除 `alembic-devdocs` use case / related skill 映射。
- 删除 Plugin HTTP `/api/v1/wiki` route mount 和 route 文件：`lib/http/HttpServer.ts`、`lib/http/routes/wiki.ts`。
- 删除 Plugin-owned wiki generator service 和单测：`lib/service/wiki/**`、`test/unit/WikiGenerator.test.ts`。
- 重新生成 `dist` 与 AlembicCodex runtime artifact，并同步删除 runtime 内旧 wiki route/service/devdocs skill。

## 提交和 Artifact

- AlembicPlugin commit：`f4efd2561a58562b1686689900ce497a3ff8de83` (`chore: remove plugin devdocs wiki surface`)
- AlembicCodex commit：`628fbad571242ee1891ecb590d0f2133e019b1a6` (`chore: remove codex devdocs skill artifact`)
- AlembicCodex runtime artifact：`plugins/alembic-codex/runtime.tgz`
- runtime artifact sha256：`c5bdbe9b0ace45458da61bd4a270522033626d8cbabcba04aef428bb118ab4bc`

## 验证命令和结果

- `npm run build:check`：通过。
- `npm run lint`：通过，Biome checked 176 files。
- `npm run build`：通过，Core build 使用 `../AlembicCore @ 08a47233f4fccd49d6622aaf0bc123ca22925de3`。
- `npm run prepare:codex-plugin-runtime`：通过，生成 `plugins/alembic-codex/runtime.tgz`。
- `npm run verify:codex-plugin`：通过。
- `npm run verify:codex-channel`：通过。
- `npm run verify:release-package-boundary`：通过，root npm publish 仍 disabled，embedded runtime core dependency 仍为 `file:vendor/AlembicCore`。
- `npm run smoke:codex-plugin`：通过，install / stdio / npxRuntime 均 passed。
- `npm run check`：通过，typecheck / lint / consumer core import boundary 均通过。
- `npm run test:unit`：通过，104 files / 1493 tests passed。
- `git diff --check`（AlembicPlugin）：通过。
- `git diff --check`（AlembicCodex）：通过。
- `node scripts/check-workspace-current-layout.mjs`：通过。
- `node scripts/check-todo-board.mjs`：通过；当前入口是 status 文档，未包含 wave 计划专用 TODO board。
- `node scripts/check-todo-board.mjs --require`：不适用当前 status 文档，失败信息为缺少 `## TODO / Backlog` 和 `## 空闲窗口调度`；未作为阻塞。
- `node scripts/verify-workspace-docs.mjs --all-workspace`：通过，检查 136 个 Markdown links。
- `git diff --check`（AlembicWorkspace）：通过。

## 残留扫描

强删除目标扫描：

- `rg -n "alembic-devdocs|alembic_wiki|WikiGenerator|wikiRouter|/api/v1/wiki|apiPrefix.*wiki|skills/alembic-devdocs|injectable-skills/alembic-devdocs" . --glob '!node_modules/**' --glob '!plugins/alembic-codex/runtime/node_modules/**'`
- 结果：无命中。

Runtime tarball 扫描：

- `tar -tf plugins/alembic-codex/runtime.tgz | rg "alembic-devdocs|service/wiki|routes/wiki|WikiGenerator|alembic_wiki|api/v1/wiki"`
- 结果：无命中。

剩余 `wiki` 命中保留理由：

- `config/default.json` / `plugins/alembic-codex/runtime/config/default.json` 的 `folderNames.project.wiki`：项目知识目录名配置，非 Plugin 文档生成能力。
- `test/unit/WorkspaceResolver.test.ts` 的 `wikiDir` 断言：WorkspaceResolver 路径契约测试，非 Plugin 文档生成能力。
- `lib/codex/status/StatusService.ts` 与 runtime copy 的 `wikiDir`：状态输出 project knowledge path，非 wiki route / devdocs skill / wiki generator。
- `lib/service/cleanup/CleanupService.ts` 与 runtime copy 的 `wiki` 清理：显式清理历史 knowledge wiki 目录，避免卸载 / reset 后遗留旧数据；非新文档管理入口。

## 遗留风险和下一步建议

- 若本机 Codex 已安装缓存中的旧 AlembicCodex plugin，需要总控或用户刷新本机 Codex plugin cache 后才能看到 devdocs skill 消失。
- `GTODO-2026-05-23-026` 和 `GTODO-2026-05-23-027` 仍需目标确认；本轮未设计新的文档管理交付路径，也未收束 resident service contract。

## 总控验收

验收时间：2026-05-23 21:15 CST

验收结论：通过，`GTODO-2026-05-23-025` 关闭。

总控复核：

- `AlembicPlugin` 当前 HEAD 为 `f4efd2561a58562b1686689900ce497a3ff8de83`，工作区干净。
- `AlembicPlugin/plugins/alembic-codex` 当前 HEAD 为 `628fbad571242ee1891ecb590d0f2133e019b1a6`，工作区干净。
- `shasum -a 256 AlembicPlugin/plugins/alembic-codex/runtime.tgz` 输出 `c5bdbe9b0ace45458da61bd4a270522033626d8cbabcba04aef428bb118ab4bc`，与回填一致。
- Plugin 源码强删除扫描 `alembic-devdocs|alembic_wiki|WikiGenerator|wikiRouter|/api/v1/wiki|apiPrefix.*wiki|skills/alembic-devdocs|injectable-skills/alembic-devdocs` 无命中。
- Runtime tarball 强删除扫描 `alembic-devdocs|service/wiki|routes/wiki|WikiGenerator|alembic_wiki|api/v1/wiki` 无命中。
- Alembic 主体保留 `injectable-skills/alembic-devdocs/SKILL.md`、`lib/resident/tool-schema/tools.ts` 的 `alembic_wiki`、`lib/http/routes/wiki.ts` 和 `lib/service/wiki/WikiGenerator.ts`，符合“文档管理能力交给 Alembic 主体”的边界。
