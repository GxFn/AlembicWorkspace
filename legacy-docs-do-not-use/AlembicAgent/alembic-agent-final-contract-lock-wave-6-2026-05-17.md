# AlembicAgent Final Contract Lock Wave 6

日期：2026-05-17
窗口：AlembicAgent
状态：已完成

本文回填 `docs/workspace/alembic-agent-cutover-final-integration-readiness-wave-6-plan-2026-05-17.md` 第 4.2 节。

## 完成范围

- 复验 AlembicAgent public contract subpaths：
  - `@alembic/agent`
  - `@alembic/agent/agent`
  - `@alembic/agent/service`
  - `@alembic/agent/runtime`
  - `@alembic/agent/prompts`
  - `@alembic/agent/domain`
  - `@alembic/agent/forge`
  - `@alembic/agent/tasks`
  - `@alembic/agent/profiles`
  - `@alembic/agent/ai`
  - `@alembic/agent/tools`
  - `@alembic/agent/tools/v2`
  - `@alembic/agent/tools/terminal`
  - `@alembic/agent/memory`
  - `@alembic/agent/context`
- 复验 terminal contract 不包含 host execution imports。
- 未发现 contract 缺口，因此未新增业务实现、未修改源码。

## 提交 Hash

无新增代码提交；本轮复验基线为 `10c672d2bd2bf709b88104ef1b4b277c28f97dd9`。

## 验证命令与结果

```text
npm run check
```

结果：通过。`build:check`、`lint`、`lint:agent-import-boundary` 和全量测试均通过；测试结果为 8 个 test files、35 个 tests。Lint 仍输出既有 warnings，但命令退出码为 0。

```text
npm run build
```

结果：通过。

```text
node -e "const publicSubpaths=['@alembic/agent','@alembic/agent/agent','@alembic/agent/service','@alembic/agent/runtime','@alembic/agent/prompts','@alembic/agent/domain','@alembic/agent/forge','@alembic/agent/tasks','@alembic/agent/profiles','@alembic/agent/ai','@alembic/agent/tools','@alembic/agent/tools/v2','@alembic/agent/tools/terminal','@alembic/agent/memory','@alembic/agent/context']; Promise.all(publicSubpaths.map((p)=>import(p))).then(()=>console.log('agent public contract ok'))"
```

结果：通过，输出 `agent public contract ok`。

```text
rg -n "node:child_process|child_process|sandbox-exec|Seatbelt|SandboxNetworkProxy|SandboxExecutor" src/tools/terminal test/terminal-contract.test.ts
```

结果：无匹配；`rg` 退出码为 1，表示 terminal contract 范围未包含这些 host execution imports。

## 遗留风险

- 本轮未发现 AlembicAgent contract 缺口。
- `npm run check` 的 lint warnings 是既有源码 warnings，不是 Wave 6 新增变更导致。
- 真实 terminal/sandbox execution success path 属于 Alembic host smoke，本窗口只确认 Agent portable contract 不携带 host executor。

## 下一步建议

- 等待 `Alembic` 窗口完成 host terminal/sandbox smoke；若 smoke 暴露 contract 缺口，再由 AlembicAgent 接收下一轮精确修复任务。
- `AlembicPlugin` 继续保持 agent-free release gate。
- `AlembicDashboard` 仅在 Alembic capability/API response shape 变化时执行 live UI/API smoke。
