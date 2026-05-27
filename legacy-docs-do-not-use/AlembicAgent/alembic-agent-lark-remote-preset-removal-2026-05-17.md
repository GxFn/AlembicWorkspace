# AlembicAgent Lark Remote Preset Removal

日期：2026-05-18
窗口：AlembicAgent
状态：已完成

本文回填 `docs/workspace/alembic-feishu-remote-removal-plan-2026-05-17.md` 第 7.2 节。

## 完成范围

- 删除 `lark` / `remote-exec` preset。
- 删除 `lark-chat` profile。
- 删除 `remote.profile.ts`，并从 builtin profile 聚合入口移除。
- 删除 Agent router 中的 Lark channel route、`PresetName.LARK` / `REMOTE_EXEC` 和 LLM enum 中的 `lark` / `remote-exec`。
- 删除 `AgentRunSource` 的 `lark` 来源，以及 `BuiltinAgentPreset` 中的 `lark` / `remote-exec`。
- 删除 `AgentService` 中 `source === 'lark'` 到 runtime source / channel 的映射。
- 删除 `Channel.LARK`、`LarkMessage`、`AgentMessage.fromLark()`。
- 删除 `AgentEvents.LARK_MESSAGE`。
- 删除 `ConversationStore` 的 `lark` category。
- 清理相关注释和文案中的当前产品 Feishu/Lark remote 描述。
- 新增负向 contract test，防止 removed preset/profile/channel/factory/event 回流。

## 删除文件

- `src/agent/profiles/definitions/remote.profile.ts`

## 提交 Hash

`cad5f0bc986d910e6ffa92decd85065167659a0f`

## 验证命令与结果

```text
npm run test -- test/feishu-remote-removal.test.ts
```

结果：通过，1 个 test file、2 个 tests。

```text
npm run check
```

结果：通过。`build:check`、`lint`、`lint:agent-import-boundary` 和全量测试均通过；9 个 test files、37 个 tests。Lint 仍输出既有 warnings，但命令退出码为 0。

```text
npm run build
```

结果：通过。

```text
node -e "const publicSubpaths=['@alembic/agent','@alembic/agent/agent','@alembic/agent/service','@alembic/agent/runtime','@alembic/agent/prompts','@alembic/agent/domain','@alembic/agent/forge','@alembic/agent/tasks','@alembic/agent/profiles','@alembic/agent/ai','@alembic/agent/tools','@alembic/agent/tools/v2','@alembic/agent/tools/terminal','@alembic/agent/memory','@alembic/agent/context']; Promise.all(publicSubpaths.map((p)=>import(p))).then(()=>console.log('agent public contract ok'))"
```

结果：通过，输出 `agent public contract ok`。

```text
git diff --check
```

结果：通过。

## 负向扫描剩余命中

```text
rg -n -i "@larksuiteoapi|ALEMBIC_LARK|LarkTransport|IntentClassifier|RemoteCommandPoller|RemoteCommandRepository|remote_commands|remote_state|/api/v1/remote|/remote/wait|sendLark|notifyTaskProgress|Channel\\.LARK|LARK_MESSAGE|fromLark|remote-exec|\\blark\\b|飞书|Lark|Feishu" src test package.json --glob '!**/node_modules/**' --glob '!**/dist/**'
```

结果：0 命中；`rg` 退出码为 1，表示无匹配。

```text
rg -n "remote.profile|REMOTE_EXEC|PresetName\\.LARK|Channel\\.LARK|fromLark|LARK_MESSAGE|ALEMBIC_LARK_ALLOWED_USERS" src test --glob '*.ts'
```

结果：0 命中；`rg` 退出码为 1，表示无匹配。

## 遗留风险

- `npm run check` 仍输出既有 lint warnings；本轮删除范围未新增 lint error。
- `SafetyPolicy`、`SystemInteraction` capability 和 terminal policy 中阻断 remote shell pipe 的安全规则按计划保留。
- 当前 Agent public import smoke 通过；若后续 Plugin vendor/runtime sweep 或 Alembic 集成发现新的 contract 缺口，再由 AlembicAgent 接收精确修复任务。

## 下一步建议

- Wave 2 的 AlembicAgent / AlembicCore / AlembicDashboard 均已完成后，启动 `AlembicPlugin` vendor/runtime sweep。
- Wave 3 应同步 vendor Core/Dashboard/Agent 产物，并执行跨仓库负向扫描，确认 package/channel/Codex plugin 产物不再携带 remote schema 或 Feishu/Lark 文案。
