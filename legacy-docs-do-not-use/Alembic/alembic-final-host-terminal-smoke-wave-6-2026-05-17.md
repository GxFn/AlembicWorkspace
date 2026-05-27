# Alembic Final Host Terminal Smoke Wave 6

日期：2026-05-17
状态：已完成，待总控验收
提交：`00a8fe23af73717f313ad09dbab294534599e2a8`

本文记录 Alembic 在 Wave 6 中完成最终 host integration / release readiness / terminal-sandbox smoke 的结果。本轮只处理 Alembic 仓库内容；没有操作其它仓库。

## 完成范围

- 复验 Wave 5 hard gate 没有回退：local Agent、generic Tool V2、terminal portable duplicate 均为 0。
- 在宿主权限环境中跑通真实 `TerminalAdapter` execution success path，覆盖 `terminal_run`、`terminal_script`、`terminal_shell`、`terminal_pty`、session metadata、audit、artifact、environment redaction 和 policy block。
- 确认 CLI status、daemon start/health/stop、host capability catalog shape 可用。
- 修复验证暴露的 release readiness 问题：`tsc` 不会清理已删除源码的旧 `dist` 产物，导致删除后的 Agent/tool/terminal duplicate 可能仍被打包。现在 `npm run build` 会先清理 `dist`，并且 `lint:agent-extraction-boundary` 会阻断 stale deleted duplicate dist artifacts。

## 代码变更

- `package.json`
  - `build` 改为 `npm run build:core && npm run clean:dist && tsc`。
  - 新增 `clean:dist`。
  - 发布文件白名单加入 `scripts/clean-dist.mjs`。
- `scripts/clean-dist.mjs`
  - 删除主包 `dist`，让每次 build 从干净输出开始。
- `scripts/lint-agent-extraction-boundary.mjs`
  - 新增 stale built artifact hard gate，覆盖已删除的 local Agent、generic tool、terminal capability/policy/session/envelope duplicate 输出。

## 验证命令

| 命令 | 结果 |
| --- | --- |
| `npm run lint:agent-extraction-boundary` | 通过；local Agent / generic Tool V2 / terminal portable duplicate 均为 0，`stale deleted duplicate dist artifacts: 0`，`@alembic/agent/tools/terminal consumer files: 10`。 |
| `npm run build:check` | 通过。 |
| `npm run check` | 通过；Biome 仍输出既有 warnings，退出码为 0。 |
| `npm run build` | 通过；执行 `clean:dist` 后 `tsc` 和 `postbuild` 正常完成。 |
| `npm run test:unit -- test/unit/TerminalAdapter.test.ts` | 宿主权限环境通过；1 个 test file、20 个 tests 全部通过。 |
| `node dist/bin/cli.js status --json` | 通过；CLI 返回 workspace 可用，当前 CLI status 环境 database 为 false。 |
| `node --input-type=module` capability catalog smoke | 通过；host `toolRegistry.toLightweightSchemas()` 返回 21 个 schema，terminal capability 为 `terminal_pty`、`terminal_run`、`terminal_script`、`terminal_session_cleanup`、`terminal_session_close`、`terminal_session_status`、`terminal_shell`。 |
| `node --input-type=module` stale dist scan | 通过；stale deleted duplicate dist artifacts 为 0，仅保留 host-owned `dist/lib/tools/v2/adapter/ToolContextFactory.{js,d.ts}`。 |
| `env ALEMBIC_DAEMON_FILE_CHANGES=0 node --input-type=module` daemon supervisor smoke | 宿主权限环境通过；daemon `start` 为 `ready`，`/api/v1/daemon/health` 和 `/api/v1/health` 均返回 success/healthy，随后 `stop` 成功。 |
| `sandbox-exec -p '(version 1)(allow default)' /bin/echo alembic-sandbox-smoke` | 宿主权限环境通过；`sandbox-exec` 位于 `/usr/bin/sandbox-exec`。 |
| `rg -n "#agent/\|\\.\\./agent/\|\\.\\./\\.\\./agent/\|lib/agent/" lib bin scripts test --glob '*.ts' --glob '*.js' --glob '*.mjs'` | 无匹配；`rg` 退出码 1 表示未命中。 |
| `rg -n "terminal-capabilities\|terminal-policy\|TerminalEnvelopes\|TerminalSession\\.js" lib bin test --glob '*.ts' --glob '*.js' --glob '*.mjs'` | 无匹配；`rg` 退出码 1 表示未命中。 |
| `git diff --check` | 通过。 |

## 环境事实

- macOS：26.3.1；Darwin kernel：25.3.0；arm64。
- `sandbox-exec` 存在于 `/usr/bin/sandbox-exec`。
- 空 profile `sandbox-exec -p '(version 1)' /bin/echo ...` 会被默认拒绝，这是 profile 语义，不代表宿主不可用；加入允许规则后 smoke 通过。
- daemon 在普通 Codex 执行沙盒下会因为本地监听被拒绝而失败，错误为 `listen EPERM: operation not permitted 127.0.0.1`；同一 supervisor smoke 在宿主权限环境通过并完成 stop。

## 遗留风险

- `npm run check` 的 Biome warnings 为既有源码 warnings，本轮未扩大修复范围。
- capability catalog 的直接容器 shape smoke 在没有 Bootstrap DB/API key 的轻量初始化下会输出 AI provider 缺失和 VectorService 非阻塞日志；daemon supervisor smoke 已覆盖完整 Bootstrap + HTTP health 路径。
- Dashboard 是否需要 live UI/API smoke 由 Dashboard 窗口根据本轮 capability shape 结果判断；Alembic 侧 terminal capability id 列表保持 7 个预期项。

## 下一步建议

- 总控复验提交 `00a8fe23af73717f313ad09dbab294534599e2a8` 的 clean build、stale dist hard gate 和 host smoke 证据。
- Dashboard 窗口可按 21 个 lightweight schema / 7 个 terminal capability 的 shape 做 build 或 live smoke 判断。
- 后续 Agent terminal contract 若变化，Alembic 继续只消费 `@alembic/agent/tools/terminal`，不得恢复本地 portable terminal duplicate。
