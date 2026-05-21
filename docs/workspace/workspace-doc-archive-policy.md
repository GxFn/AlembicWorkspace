# Workspace Doc Archive Policy

更新日期：2026-05-21
状态：长期规则

## 目标

保持 `docs/workspace/` 可持续：当前计划和近期入口容易读取，已完成的历史 wave 可以稳定归档，不因手动移动导致当前入口丢失。

归档同时要控制 `docs/workspace/index.md` 体积：当前总控入口只保留当前计划、近期正在执行/待验收的入口、长期规则、长期契约和必要的近期背景。已归档的历史文档不继续逐条堆在当前总表里，而是压缩到归档摘要入口。通用模板统一放在 `templates/`，不再散落在 `docs/workspace/` 或流程目录中。

## 目录规则

- `docs/workspace/index.md` 永远留在原位，是唯一总控入口。
- 当前正在执行的总控文档留在 `docs/workspace/` 根层级。
- 刚完成且后续仍可能马上回看的总控文档可以短期留在 `docs/workspace/` 根层级。
- `docs/workspace/index.md` 的“当前总控入口”不做完整历史清单；归档后的历史入口只保留在“历史归档摘要”中。
- `templates/` 保存长期模板；`docs/workspace/` 根层级不再新增通用模板正文，只保留指向模板的入口链接。
- 已完成且不再作为当前入口的历史总控文档归档到：

```text
docs/workspace/archive/YYYY-MM/<topic>/
```

单仓库执行记录继续留在：

- `docs/AlembicCore/`
- `docs/AlembicAgent/`
- `docs/Alembic/`
- `docs/AlembicPlugin/`
- `docs/AlembicDashboard/`
- `docs/BiliDili/`

这些单仓库目录不跟随 workspace wave 归档移动。

## 归档条件

可以归档：

- 状态为 `已完成` 的旧总控计划。
- 已被更新总控文档取代的验收 / 分派文档。
- 不再需要复制提示词的历史 wave。
- 旧清理阶段、旧迁移阶段、旧验收阶段。

暂不归档：

- 当前 `docs/workspace/index.md` 第一行当前入口指向的文档。
- 状态为 `待启动`、`执行中`、`待验收`、`阻塞` 的文档。
- 当前正在被执行窗口读取的分派文档。
- 分阶段迁移模板、长期契约文档、当前生效规则。

如果索引第一行已经是 `已完成` 的旧总控文档，可以归档；归档后需要把第一行切到新的当前计划或 `无任务` 空闲状态文档。

## 脚本

使用 `scripts/archive-workspace-docs.mjs`。

默认是 dry-run：

```bash
node scripts/archive-workspace-docs.mjs --topic interface-boundary --file docs/workspace/alembic-core-agent-interface-boundary-wave-2c-optimized-plan-2026-05-18.md
```

真正移动文件并压缩 `docs/workspace/index.md`：

```bash
node scripts/archive-workspace-docs.mjs --topic interface-boundary --file docs/workspace/alembic-core-agent-interface-boundary-wave-2c-optimized-plan-2026-05-18.md --apply
```

多个文件可以重复 `--file`：

```bash
node scripts/archive-workspace-docs.mjs \
  --topic agent-extraction \
  --file docs/workspace/alembic-agent-cutover-plugin-cleanup-wave-3-acceptance-next-plan-2026-05-17.md \
  --file docs/workspace/alembic-agent-cutover-plugin-cleanup-wave-4-deletion-plan-2026-05-17.md \
  --apply
```

默认行为：

- 移动 `--file` 指定的 workspace 文档到归档目录。
- 重写还需要保留的当前 Markdown 链接。
- 从 `docs/workspace/index.md` 的“当前总控入口”移除这些归档文档对应的逐条历史行。
- 在 `docs/workspace/index.md` 的“历史归档摘要”保留 topic 级目录入口。

轻量归档旧的非长期文档时，不要求追着历史正文反复修改内部链接或旧验证命令。归档后的历史文档视为当时证据快照；只需要保证当前总控入口、长期规则和模板入口不指向已移动的旧位置。

如确实需要保留逐条历史行，可追加 `--keep-index-rows`，但默认不建议使用。

只压缩已经归档过的旧索引行、不移动文件：

```bash
node scripts/archive-workspace-docs.mjs --prune-index-only --apply
```

该命令会从“当前总控入口”移除已指向 `archive/` 的历史行，并在“历史归档摘要”保留 topic 级目录入口。

归档后必须运行：

```bash
node scripts/verify-workspace-docs.mjs --all-workspace
node scripts/check-dispatch-coverage.mjs
```

## 建议第一批归档候选

优先从最旧且已完成的 wave 开始：

- Feishu / Lark remote removal。
- Agent extraction 旧 wave。
- 冗余系统删除旧 wave。
- 接口边界 Wave 2C 以前的历史分派和验收。

当前 Wave 3A、当前仍可能回看的 release publish staging Wave 2、长期契约和模板先不要归档。
