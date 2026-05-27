# Workspace Doc Archive Policy

更新日期：2026-05-23
状态：长期规则

## 目标

保持 `docs/workspace/` 可持续：根层级只放长期规则、长期契约、长期记录地图和唯一索引；短期工作面放入 `docs/workspace/current/`；完成的 workspace 计划、历史分派和旧验收记录进入 `archive/`，不在当前入口和全局 TODO 里无限堆叠。

归档不是清除证据。归档后的正文文档仍是当时证据快照；当前开发区不直接散链到具体归档文件。开发者需要历史细节时，先进入 [workspace-record-map.md](workspace-record-map.md)，再进入对应归档文件夹的 `index.md` 汇总说明和地图清单。

## 根层级保留规则

`docs/workspace/` 根层级优先保留：

- `index.md`：唯一总控入口。
- `workspace-record-map.md`：长期记录地图，是开发区查询历史归档的唯一入口。
- 长期规则、长期契约、长期流程和测试交流规则。
- 长期模板、脚本、流程和外部目录入口。

`docs/workspace/current/` 优先保留：

- `workspace-current-status.md`：当前短状态快照，不作为历史流水账。
- `global-todo-board.md`：活跃 / 观察 TODO 账本。
- `test-exchange.md`：当前测试交流面。
- 当前正在执行或等待用户确认的 workspace 计划。

完成后应归档：

- 已完成且不再执行的 workspace plan / wave / batch cleanup 文档。
- 已被后续计划取代的历史验收、分派、代码分析和临时状态文档。
- 不再需要复制提示词的历史任务包。
- 全局 TODO 中已完成的条目和旧同步记录。

暂不归档：

- `docs/workspace/index.md` 第一行当前入口指向的文档，除非它已经切回空闲状态。
- 状态为 `待启动`、`执行中`、`待验收`、`阻塞` 的当前计划。
- 当前正在被其它窗口读取的分派文档。
- 长期规则、长期契约、长期流程、模板入口和当前测试交流入口。

## 归档目录

workspace 历史归档目录：

```text
docs/workspace/archive/YYYY-MM/<topic>/
```

单仓库执行记录继续留在对应目录，不跟随 workspace wave 归档移动：

- `docs/AlembicCore/`
- `docs/AlembicAgent/`
- `docs/Alembic/`
- `docs/AlembicPlugin/`
- `docs/AlembicDashboard/`
- `AlembicTest/docs/`

真实项目测试、复现、回归与证据记录由 `AlembicTest` 承接；workspace 只保留测试交流入口。

## 索引压缩

`docs/workspace/index.md` 的“当前总控入口”不是完整历史清单。历史 topic 归档后，当前索引只保留当前短期工作区和 [workspace-record-map.md](workspace-record-map.md) 入口；具体 topic 目录统一进入长期记录地图：

```text
docs/workspace/workspace-record-map.md
```

每个归档 topic 文件夹必须有单独汇总说明文件：

```text
docs/workspace/archive/index.md
docs/workspace/archive/YYYY-MM/index.md
docs/workspace/archive/YYYY-MM/<topic>/index.md
```

归档根目录和月份目录的 `index.md` 负责说明归档区 / 月份地图；topic 目录的 `index.md` 负责概括介绍该归档包、列出文件地图，并在需要时保留从旧当前索引压缩下来的历史索引行。不要把概括说明批量写进每个归档正文文件；正文文件保持当时证据快照。

## 全局 TODO 归档

`docs/workspace/current/global-todo-board.md` 只保留活跃、观察中或仍会影响后续派发的 TODO。已完成 TODO 和旧同步记录归档到：

```text
docs/workspace/archive/YYYY-MM/global-todo/global-todo-completed-YYYY-MM-DD.md
```

完成 TODO 归档后，本文件只保留指向长期记录地图的短入口；旧同步记录不继续留在开发区根文档里。

## 脚本

移动 workspace 文档：

```bash
node scripts/archive-workspace-docs.mjs --topic <topic> --file docs/workspace/current/<file>.md --apply
```

只压缩当前索引中的历史行：

```bash
node scripts/compact-workspace-index.mjs --topic <topic> --match '<regex>' --apply
```

归档全局 TODO 完成项和旧同步记录：

```bash
node scripts/archive-global-todo-board.mjs --apply
```

建议顺序：

1. 先用 `archive-workspace-docs.mjs` 移动已完成文档，并更新 `workspace-record-map.md`。
2. 再用 `compact-workspace-index.mjs` 压缩仍留在当前索引中的历史行。
3. 再用 `archive-global-todo-board.mjs` 清理已完成 TODO 和旧同步记录。
4. 再用 `generate-archive-topic-summaries.mjs` 为每个归档 topic 生成 / 更新 `index.md` 汇总说明和地图清单。
5. 最后更新 `current/workspace-current-status.md` 为短状态快照。

所有脚本默认 dry-run；只有追加 `--apply` 才写文件。

## 验证

归档后必须运行：

```bash
node scripts/verify-workspace-docs.mjs --all-workspace
node scripts/check-dispatch-coverage.mjs
git diff --check
```

如果本轮调整了 TODO 或任务包，还需要按需运行：

```bash
node scripts/check-todo-board.mjs
node scripts/check-task-packages.mjs
```
