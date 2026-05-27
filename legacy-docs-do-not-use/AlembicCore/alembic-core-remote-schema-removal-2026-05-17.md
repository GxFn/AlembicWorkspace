# AlembicCore Remote Schema Removal

执行日期：2026-05-18
状态：已完成
总控入口：`docs/workspace/alembic-feishu-remote-removal-plan-2026-05-17.md`

## 1. 目标与边界

本阶段属于 Feishu/Lark remote 删除计划的 Wave 2，AlembicCore 只负责移除 Core 内 remote database schema 源头。

删除目标：

- 删除 `003_add_remote_commands` active migration。
- 删除 Drizzle `remoteCommands` / `remoteState` 表定义。
- 更新数据库集成测试，确认新库不再创建 `remote_commands` / `remote_state`。
- 保证构建产物和 package dry-run 不再携带旧 remote migration。

明确不做：

- 不新增 `010_drop_remote_tables.ts`。
- 不处理旧 remote 表数据。
- 不提供旧开发库 drop migration。旧库如仍含 remote 表，按用户决策重建数据库。

## 2. 完成范围

代码变更：

- 删除 `src/infrastructure/database/migrations/003_add_remote_commands.ts`。
- 更新 `src/infrastructure/database/drizzle/schema.ts`：
  - 删除 `remoteCommands`。
  - 删除 `remoteState`。
  - 更新表清单和后续表编号。
- 更新 `test/DatabaseRepository.test.ts`：
  - active migration 列表不再包含 `003_add_remote_commands`。
  - 新库 table scan 断言 `remote_commands` / `remote_state` 不存在。

本地构建产物处理：

- 清理 stale `dist/infrastructure/database/migrations/003_add_remote_commands.*`。
- 清理曾短暂生成但已取消的 `dist/infrastructure/database/migrations/010_drop_remote_tables.*`。
- `dist/` 为 ignored 构建产物，不进入提交。

提交 hash：`0c64fd7549d58ceded8eed163dae85c6678ea679`

## 3. 验证命令与结果

已执行：

- `npm test -- DatabaseRepository`：通过，2 files / 5 tests。
- `npm run build:check`：通过。
- `npm run check`：通过，60 files / 926 tests；public API boundary 报告 134 个 package exports；保留既有非阻塞 stderr `error: Could not access 'HEAD'`。
- `npm run build`：通过。
- `npm run smoke:public-api`：通过，73 个 exact public API entrypoints 可导入。
- `npm --cache <temporary-npm-cache> pack --dry-run`：通过；package dry-run 不再包含 `003_add_remote_commands` 或 `010_drop_remote_tables`。
- `git diff --check`：通过。
- `git status --short`：提交后干净。

## 4. 负向扫描

严格 remote 扫描：

```text
rg -n "@larksuiteoapi|ALEMBIC_LARK|LarkTransport|IntentClassifier|RemoteCommandPoller|RemoteCommandRepository|remote_commands|remote_state|/api/v1/remote|/remote/wait|sendLark|notifyTaskProgress|Channel\.LARK|LARK_MESSAGE|fromLark|remote-exec" src test dist config package.json README.md scripts --glob '!**/node_modules/**'
```

剩余命中：

- `test/DatabaseRepository.test.ts` 中 `remote_commands` / `remote_state` 不存在断言。

结论：剩余命中是验收断言，不是实现残留。

宽松 Lark 文案扫描：

```text
rg -n -i "lark|飞书|remote-exec|remote exec" src test dist config package.json README.md scripts --glob '!**/node_modules/**'
```

剩余命中：

- Starlark parser / test / generated dist 命中。

结论：这些是 Bazel / Buck / Pants Starlark 解析相关误伤，非 Feishu/Lark remote。

构建产物 migration 扫描：

```text
ls dist/infrastructure/database/migrations | rg '003|010'
```

结果：无命中。

## 5. 遗留风险

- 旧开发库如果已经执行过 `003_add_remote_commands`，仍可能保留 `remote_commands` / `remote_state`；本阶段按用户决策不迁移旧数据，需要时重建数据库。
- `npm run check` 中 `error: Could not access 'HEAD'` 为既有非阻塞输出，未影响本阶段验证通过。
- Core 仍有既有 transitional / wildcard exports；这是 public API 边界治理的存量状态，不属于本 remote schema 删除阶段。

## 6. 下一步建议

- `AlembicAgent` 完成 Wave 2：删除 `lark` / `remote-exec` preset/profile/source/channel contract。
- `AlembicPlugin` 等 Core/Dashboard/Agent 完成后启动 Wave 3 vendor/runtime sweep：
  - 更新 `vendor/AlembicCore` 到提交 `0c64fd7549d58ceded8eed163dae85c6678ea679`。
  - 验证 plugin runtime/package/channel 产物不含 `003_add_remote_commands`、`010_drop_remote_tables`、`remote_commands`、`remote_state` 或 Feishu/Lark 文案。
