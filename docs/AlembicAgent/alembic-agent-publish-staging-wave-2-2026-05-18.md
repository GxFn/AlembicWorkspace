# AlembicAgent Publish Staging Wave 2

日期：2026-05-18
执行窗口：AlembicAgent
状态：已完成，待总控复核

## 背景

本文回填 `docs/workspace/alembic-release-portable-snapshot-closeout-acceptance-publish-staging-wave-2-plan-2026-05-18.md` 分派给 AlembicAgent 的 publish staging manifest / pack preview 任务。

本窗口提交：`f9d020f9ebaf95499bbd6e9afbdecafa0615a865`

Core release workflow baseline：`9174c5173a7313b916b89b7c605ea2afdd874269`

## 完成范围

- 保留根 `package.json` 的日常开发入口：`@alembic/core: file:../AlembicCore`。
- 新增 `scripts/stage-agent-publish-package.mjs`，生成忽略目录 `tmp/release/@alembic-agent` 作为 publish staging package。
- staging manifest 将 `@alembic/core` 替换为 registry specifier `0.1.0`，并在 `package.json` 的 `alembicRelease` 字段和 `.alembic-source.json` 中记录 Agent / Core source commit。
- staging package 删除 root `prepack` 生命周期 hard gate，避免 staging pack/publish 被 dev manifest guard 阻断；root `prepack` hard gate 保持不变。
- 新增 `release:stage` 与 `release:pack-preview`，pack preview 使用 repo-local `tmp/npm-cache`，避免受用户全局 npm cache 权限影响。
- 补充 `README.md`，说明 Agent package 范围、本地 Core 入口和 publish staging 入口。
- 未复制 Core 源码，未修改 `AlembicCore` 或其它相邻仓库。

## 文件变化

| 文件 | 变化 |
| --- | --- |
| `README.md` | 新增 package 简介和 publish staging 使用口径。 |
| `package.json` | 新增 `release:stage` 与 `release:pack-preview`；保留 `release:package-guard` 与 root `prepack`。 |
| `scripts/guard-agent-release-package.mjs` | hard gate 提示新增 staging pack preview 命令。 |
| `scripts/stage-agent-publish-package.mjs` | 新增 staging manifest / source metadata / pack input 生成器。 |

## 验证命令

| 命令 | 结果 |
| --- | --- |
| `npm run release:pack-preview` | 通过；生成 `tmp/release/@alembic-agent`，staging `@alembic/core` 为 `0.1.0`，Core source commit 为 `9174c5173a7313b916b89b7c605ea2afdd874269`，提交后 Agent source commit 为 `f9d020f9ebaf95499bbd6e9afbdecafa0615a865` 且 `agentWorkingTreeDirty: false`；`npm pack --dry-run` pack entries 407。 |
| `npm run release:package-guard` | 预期失败；继续阻断 root `package.json` 和 root `package-lock.json` 中的 `@alembic/core=file:../AlembicCore`。 |
| `npm --cache tmp/npm-cache pack --dry-run` | 预期失败；root `prepack` 继续触发 `release:package-guard`。 |
| `npm run check` | 通过；9 test files / 37 tests；Biome 仍输出 23 条既有 warning，未阻断。 |
| `npm run smoke:public-imports` | 通过；15 public subpaths imported。 |
| `git diff --check` | 通过。 |

## 验证结果

AlembicAgent 已从“root pack/publish 只能失败保护”推进到“root dev manifest 继续被 hard gate 保护，同时存在明确 publish staging package preview”的状态。

staging package 只包含 `dist`、`README.md`、`.alembic-source.json` 和 publish manifest；不会泄漏 `file:../AlembicCore`，也不会复制 Core 源码。

## 遗留风险

- 本轮仍未真实 npm publish；真实发布依赖 `@alembic/core@0.1.0` 在 registry 可用、`@alembic/agent` 包权限、版本唯一性、npm token/OIDC provenance 和后续 release workflow 接入。
- 当前 `@alembic/agent` 版本仍为 `0.1.0`；若 registry 已存在同版本，发布前需要升版本。
- `npm run check` 仍显示既有 Biome warning；本轮只保证新增脚本无格式化 error，不处理历史 warning。
- `release:pack-preview` 依赖相邻 `AlembicCore` 工作区干净；若 Core 工作区 dirty，脚本会阻断以避免记录不精确的 Core source commit。

## 下一步建议

1. 总控复核提交 `f9d020f9ebaf95499bbd6e9afbdecafa0615a865` 与本文证据。
2. `Alembic` 窗口可消费 Agent staging baseline，生成 `alembic-ai` staging manifest，并记录 Core / Agent source commits。
3. 后续若要从 preview 升级到真实发布，需要在 AlembicAgent 添加 release workflow 或由上游 release orchestration 调用 staging package。
