# AlembicAgent Terminal Sandbox Tool Contract Wave 5

日期：2026-05-17
窗口：AlembicAgent
状态：已完成

本文回填 `docs/workspace/alembic-terminal-sandbox-agent-tool-boundary-wave-5-plan-2026-05-17.md` 第 6.1 节。

## 完成范围

- 新增 Agent-owned terminal public contract subpath：`@alembic/agent/tools/terminal`。
- 新增 terminal capability manifests：
  - `terminal_run`
  - `terminal_script`
  - `terminal_shell`
  - `terminal_pty`
  - `terminal_session_close`
  - `terminal_session_status`
  - `terminal_session_cleanup`
- 新增 portable terminal policy intent / decision types、input builders 和 evaluators。
- 新增 terminal session plan validation 与 `TerminalSessionManager` interface。
- 新增 portable terminal result envelope helpers。
- 保持 `terminal.exec` V2 handler 不变；本轮没有改动现有 Tool V2 执行路径。
- 新增 contract tests 覆盖 capability list、policy builders/evaluators、session plan、session manager interface 和 envelope normalization。

## 文件变化

- `package.json`
  - 新增 `./tools/terminal` package export。
- `src/tools/index.ts`
  - 汇总导出 terminal contract。
- `src/tools/terminal/**`
  - 新增 capabilities / policy / session / envelope / public index。
- `test/terminal-contract.test.ts`
  - 新增 terminal contract targeted tests。
- `src/index.ts`、`test/index.test.ts`
  - 将 package migration metadata 更新为 `phase-9-terminal-contract`。

## 提交 Hash

`10c672d2bd2bf709b88104ef1b4b277c28f97dd9`

## 验证命令与结果

```text
npm run build:check
```

结果：通过。

```text
npm run test -- test/terminal-contract.test.ts
```

结果：通过，1 个 test file、5 个 tests。

```text
npx biome check src/tools/terminal test/terminal-contract.test.ts
```

结果：通过，新增 terminal contract 范围无 Biome 问题。

```text
npm run check
```

结果：通过。全量测试 8 个 test files、35 个 tests 通过；lint 仍输出既有 warnings，但命令退出码为 0。

```text
npm run build
```

结果：通过。

```text
node -e "Promise.all([import('@alembic/agent/tools/terminal')]).then(() => console.log('terminal contract import ok'))"
```

结果：通过，输出 `terminal contract import ok`。

## 遗留风险

- `npm run check` 中的 lint warnings 属于本轮前已存在的 Agent 源码 debt；本轮新增 `src/tools/terminal/**` 和 `test/terminal-contract.test.ts` 已单独通过 Biome check。
- terminal public contract 目前只提供 portable schema/policy/session/envelope；真实 process/PTY execution、macOS Seatbelt、network proxy、audit/artifact、approval/gateway、DI wiring 仍应保留在 Alembic host bridge。
- `terminal.exec` V2 handler 与新的 `terminal_run` / `terminal_shell` / `terminal_script` / `terminal_pty` public contract 还未做命名统一或 adapter bridge；本轮只确认不破坏现有 V2 handler。

## 下一步建议

- `Alembic` 窗口解除阻塞，消费 `@alembic/agent/tools/terminal`，删除本地 portable terminal capability/policy/session/envelope duplicate。
- `Alembic` 继续保留真实 host terminal executor、PTY、sandbox、audit、artifact、environment、approval 和 DI wiring。
- `AlembicPlugin` 保持 agent-free，不接入 terminal contract。
- `AlembicDashboard` 继续观察；只有 Alembic 的 capability/API response shape 改变时才启动 UI/API smoke。
