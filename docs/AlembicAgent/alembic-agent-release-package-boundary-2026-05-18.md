# AlembicAgent Release Package Boundary

日期：2026-05-18
执行窗口：AlembicAgent
状态：已完成，待总控复核

## 背景

本文回填 `docs/workspace/alembic-release-portable-snapshot-closeout-workspace-plan-2026-05-18.md` 分派给 AlembicAgent 的 release / package boundary 任务。

本窗口提交：`019022bedf9c910bf7bf64a4fbe5969f833b294f`

Core source commit baseline：`abcf84f27d23cae0fbefbb4d7a327f5aae7f1caf`

## 完成范围

- 保留 AlembicAgent 日常开发入口：`@alembic/core: file:../AlembicCore`。
- 新增 `scripts/guard-agent-release-package.mjs`，检查 root `package.json` 和 root `package-lock.json` 是否存在 `file:../` workspace dependency。
- 新增 `release:package-guard` 脚本，提供可显式运行的 release package boundary gate。
- 新增 `prepack` 脚本，确保 `npm pack` / `npm publish` 在本地 workspace dependency 未 staging 为 registry dependency 前被 hard gate 阻断。
- 未复制 Core 源码，未修改 `AlembicCore` 或其它相邻仓库。

## 文件变化

| 文件 | 变化 |
| --- | --- |
| `package.json` | 新增 `release:package-guard` 和 `prepack`，把 release package guard 接入 pack/publish 生命周期。 |
| `scripts/guard-agent-release-package.mjs` | 新增发布包 guard，阻止 root manifest 泄漏 `file:../` workspace dependency，并提示需要 staged publish manifest 和 Core source commit 记录。 |

## 验证命令

| 命令 | 结果 |
| --- | --- |
| `npm run build:check` | 通过。 |
| `npm run smoke:public-imports` | 通过；15 public subpaths imported。 |
| `npm run check` | 通过；9 test files / 37 tests；Biome 仍输出 23 条既有 warning，未阻断。 |
| `npm run release:package-guard` | 预期失败；识别 `package.json:dependencies.@alembic/core=file:../AlembicCore` 和 `package-lock.json root:dependencies.@alembic/core=file:../AlembicCore`，阻止发布包泄漏本地依赖。 |
| `npm pack --dry-run` | 预期失败；`prepack` 触发同一个 guard，阻止 pack/publish 生命周期继续。 |
| `git diff --check` | 通过。 |

## 验证结果

AlembicAgent 当前不是可直接发布状态；这与本轮策略一致。日常开发继续消费相邻 Core 源码，发布/pack 则被 hard gate 阻断，直到后续 release staging manifest 把 `@alembic/core` 改为 registry version，并记录 Core source commit。

## 遗留风险

- 解除 Agent publish gate 依赖 AlembicCore package release baseline；当前只做硬性保护，不生成 publish staging manifest。
- `npm pack --dry-run` 在 root 仓库下会失败，这是本轮期望结果；后续若要真正发布，需要新增 staging 流程并重新验证 pack 内容。
- `npm run lint` 仍输出既有 Biome warning，但完整 `npm run check` 退出码为 0；本轮不处理这些非 release package boundary 问题。

## 下一步建议

1. 总控复核提交 `019022bedf9c910bf7bf64a4fbe5969f833b294f` 与本文证据。
2. 等 `AlembicCore` 完成 package release baseline 后，再决定 AlembicAgent 是否进入 publish staging manifest 阶段。
3. 如进入 staging 阶段，必须把 `@alembic/core` 替换为可安装 registry dependency，并在发布记录中写明 Core source commit。
