# Alembic Vendor Feishu Remote Sweep

日期：2026-05-18

窗口：`Alembic`

状态：已完成

提交：`0d109d0469d5cf978252da8217cc674ac400f14d`

总控计划：`docs/workspace/alembic-feishu-remote-removal-plan-2026-05-17.md`

## 完成范围

- 同步 `vendor/AlembicCore` 从 `6b7b52a17fe214816c41344860caeb8bf35f1923` 到 `0c64fd7549d58ceded8eed163dae85c6678ea679`。
- 同步 `vendor/AlembicDashboard` 从 `bea8cd4b481b27a395456cb3936073729c8a6493` 到 `32b2e01c249665e3dc33bdcffbfc39b648d0426d`。
- 确认 vendored Core 已移除 remote schema / migration runtime 源头，vendored Dashboard 已移除 Lark / Feishu / `remote-exec` 产品文案。
- 复验 Alembic 对 `@alembic/agent` public subpaths 的消费仍稳定。
- 复验 build 后 `dist` 和 VSCode extension out 产物不带 Feishu remote runtime symbols。

## 提交

- Alembic：`0d109d0469d5cf978252da8217cc674ac400f14d`
- 提交信息：`chore: sync feishu remote cleanup vendors`

## 验证命令

| 命令 | 结果 |
| --- | --- |
| `npm run check` | 通过；Biome 仅报告既有 warnings/infos |
| `npm run build` | 通过 |
| `npm run build:vscode-ext` | 通过 |
| `npm run lint:agent-extraction-boundary` | 通过 |
| `npm run lint:core-import-boundary` | 通过 |
| `node -e "const subpaths=['@alembic/agent/ai','@alembic/agent/tools','@alembic/agent/tools/v2','@alembic/agent/tools/terminal','@alembic/agent/memory','@alembic/agent/context','@alembic/agent/domain','@alembic/agent/prompts','@alembic/agent/runtime','@alembic/agent/service']; Promise.all(subpaths.map((p)=>import(p))).then(()=>console.log('agent consumer public imports ok'))"` | 通过，输出 `agent consumer public imports ok` |
| `git diff --check` | 通过 |

## 负向扫描

跨仓库严格扫描：

```text
rg -n "@larksuiteoapi|ALEMBIC_LARK|LarkTransport|IntentClassifier|RemoteCommandPoller|RemoteCommandRepository|remote_commands|remote_state|/api/v1/remote|/remote/wait|sendLark|notifyTaskProgress|Channel\\.LARK|LARK_MESSAGE|fromLark|remote-exec" Alembic AlembicAgent AlembicCore AlembicDashboard AlembicPlugin --glob '!**/node_modules/**' --glob '!**/dist/**' --glob '!docs/**'
```

剩余命中：

- `Alembic/vendor/AlembicCore/test/DatabaseRepository.test.ts` 中 `remote_commands` / `remote_state` 不存在断言。
- `AlembicPlugin/vendor/AlembicCore/test/DatabaseRepository.test.ts` 中 `remote_commands` / `remote_state` 不存在断言。
- `AlembicCore/test/DatabaseRepository.test.ts` 中 `remote_commands` / `remote_state` 不存在断言。

以上均为验收证据，不是运行时 schema / migration / repository 残留。

Alembic runtime 产物扫描：

```text
rg -n "@larksuiteoapi|ALEMBIC_LARK|LarkTransport|IntentClassifier|RemoteCommandPoller|RemoteCommandRepository|remote_commands|remote_state|/api/v1/remote|/remote/wait|sendLark|notifyTaskProgress|Channel\\.LARK|LARK_MESSAGE|fromLark|remote-exec" dist resources/vscode-ext/out package.json package-lock.json --glob '!**/node_modules/**'
```

结果：无命中。

Alembic vendored Core/Dashboard remote schema 扫描：

```text
rg -n "003_add_remote_commands|010_drop_remote_tables|remote_commands|remote_state" Alembic/vendor/AlembicCore Alembic/vendor/AlembicDashboard --glob '!**/node_modules/**' --glob '!**/dist/**' --glob '!docs/**'
```

剩余命中仅为 `vendor/AlembicCore/test/DatabaseRepository.test.ts` 的不存在断言。

宽松 `Lark` / `lark` 扫描补充：

- `vendor/AlembicCore/AGENTS.md` 仍有一句“Core 不包含 ... Lark 集成”的边界说明，非产品文案和非 runtime。
- Starlark parser 未被严格 `\blark\b` 扫描命中；如用子串扫描，仍应按 Bazel / Buck / Pants Starlark 误伤分类。

## 遗留风险

- `AlembicPlugin` Wave 3 仍需自行同步 vendor/runtime/package/channel 并跑 Codex plugin smoke；本轮未操作 `AlembicPlugin` 仓库。
- `remote_commands` / `remote_state` 在 Core 测试中的“不存在断言”会继续出现在严格扫描里，属于预期验收证据。
- Core 旧开发库不做 drop migration 是 Wave 2 用户决策；旧库如仍有旧表，需要重建数据库而不是通过 Alembic 主仓库清理。
- `vendor/AlembicCore/AGENTS.md` 的 Lark 边界说明不是 runtime 残留；若总控要求零关键词，可在 Core 后续文案清理中统一去掉。

## 下一步建议

- 等 `AlembicPlugin` 完成 Wave 3 vendor/runtime/package/channel sweep 后，再做一次最终跨仓库负向扫描。
- 总控可把 Alembic 窗口标为 Wave 3 已完成；剩余收口点集中在 Plugin 发布产物验证。
