# AlembicAgent Public Contract Hardening Wave 3A

日期：2026-05-18
执行窗口：AlembicAgent
状态：已完成，待总控复核

## 背景

本文回填 `docs/workspace/alembic-interface-boundary-optimization-wave-3a-plan-2026-05-18.md` 分派给 AlembicAgent 的 public contract hardening 任务。

本窗口提交：`b541c9eaa342dcb085834cfbe36e506c5904c43f`

## 完成范围

- 保持 `@alembic/agent` package exports 为 15 个 exact public subpaths，未新增 public subpath，未加入 wildcard export。
- 在 `config/agent-public-api-boundary.json` 增加 15 行 public contract matrix，逐项记录 public specifier、Agent-owned contract、host-owned adapter boundary。
- 明确 `tools/v2` 为 Agent-owned generic router/cache/compressor/parser/catalog/adapter contract；host 只拥有 `ToolContextFactory` 输入、外部 executor wiring、sandbox bridge 和 UI/daemon call surface。
- 明确 `tools/terminal` 为 Agent-owned terminal capability manifest、policy evaluator、session plan contract 和 result envelope；host 只拥有真实 process/PTY execution、sandbox enforcement、approval UI 和 terminal persistence。
- 明确 `service`、`runtime`、`memory`、`context` 是 Agent-owned orchestration / execution / memory / context contracts；host 只负责 HTTP/MCP/CLI/product adapter、permission、storage placement、UI 和 transport。
- 增加 5 个 forbidden consumer specifier samples，覆盖 `dist/*`、`src/*`、three-level deep imports、Tool V2 internals、Terminal internals 和 service internals。
- 增强 `scripts/lint-agent-public-api-boundary.mjs`：校验 contract matrix 与 `package.json#exports` 完全一致，校验 specifier、agentOwned、hostOwnedAdapterBoundary 和 forbidden sample 覆盖关系。
- 增强 `scripts/smoke-agent-public-imports.mjs`：除了导入 15 个合法 public subpaths，还实际动态导入 5 个 forbidden samples，并要求 Node package exports 返回 `ERR_PACKAGE_PATH_NOT_EXPORTED`。
- 未迁入 host adapter 实现，未修改 Core、Alembic、Plugin 或 Dashboard。

## 文件变化

| 文件 | 变化 |
| --- | --- |
| `config/agent-public-api-boundary.json` | 增加 public contract matrix 和 forbidden import negative samples。 |
| `scripts/lint-agent-public-api-boundary.mjs` | 增加 contract matrix 与 forbidden sample 结构校验。 |
| `scripts/smoke-agent-public-imports.mjs` | 增加 deep/dist/src/three-level forbidden specifier 动态导入负向 gate。 |

## 验证命令

| 命令 | 结果 |
| --- | --- |
| `npm run lint:public-api-boundary` | 通过；15 exact exports，no wildcard exports；contract matrix 和 forbidden sample 覆盖关系通过脚本校验。 |
| `npm run smoke:public-imports` | 通过；15 public subpaths imported，5 forbidden subpaths rejected。 |
| `npm run check` | 通过；包含 `build:check`、Biome、Agent import boundary、public API boundary、Core import boundary 和 Vitest；Core scan 为 216 files / 48 Core imports；9 test files / 37 tests passed；Biome 仍输出 23 条既有 warning，未阻断。 |
| `git diff --check` | 通过。 |
| `git status --short` | 提交后干净。 |

## 验证结果

AlembicAgent public surface 维持 15 exact / 0 wildcard。public API boundary 不再只是计数检查，而是校验每个 public subpath 的 Agent-owned contract 与 host-owned adapter boundary；public import smoke 也实际证明 deep import、dist import、src import 和三层以上内部路径不会从 package exports 逃逸。

## 遗留风险

- negative samples 是代表性样例，不是枚举所有可能的 deep import 字符串；当前由 package exports、forbidden patterns 和 sample gate 共同守住边界。
- 本轮只加固 AlembicAgent 自身 contract，不减少 Alembic 或 Plugin 的 consumer allowlist；外层 consumer reduction 仍由对应窗口执行。
- `npm run check` 仍显示 23 条既有 Biome warning；本轮不处理历史 lint warning。

## 下一步建议

1. 总控复核提交 `b541c9eaa342dcb085834cfbe36e506c5904c43f` 与本文证据。
2. Alembic / AlembicPlugin 窗口在做 consumer boundary reduction 时，只消费 15 个 exact public subpaths，不使用 deep import。
3. 后续若需要新增 Agent public subpath，必须同步更新 package exports、public contract matrix、negative gate 和 public import smoke。
