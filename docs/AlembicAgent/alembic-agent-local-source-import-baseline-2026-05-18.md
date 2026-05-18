# AlembicAgent Local Source Import Baseline

日期：2026-05-18
执行窗口：AlembicAgent
状态：已完成，待总控复核

## 背景

本文回填 `docs/workspace/alembic-local-source-import-unification-workspace-plan-2026-05-18.md` 分派给 AlembicAgent 的任务。

本窗口提交：`0b86fdf55e3f927a1a5384c2b14cd97c8bb0daaf`

## 完成范围

- 复核 `package.json` 与 `package-lock.json`：`@alembic/core` 已使用 `file:../AlembicCore`。
- 复核本地安装解析：`node_modules/@alembic/core` 解析到 workspace 相邻的 `../AlembicCore`。
- 复核 `lint:core-import-boundary`：已调用 `../AlembicCore/scripts/lint-consumer-core-imports.mjs`。
- 更新 `AGENTS.md` 的 Core 接入规则，明确 AlembicAgent 是 local-source-first 基线，不以 vendor、submodule、远程 npm 包或 portable snapshot 作为日常开发入口。
- 未修改 `AlembicCore`、`Alembic`、`AlembicPlugin`、`AlembicDashboard` 或其它相邻仓库。

## 文件变化

| 文件 | 变化 |
| --- | --- |
| `AGENTS.md` | 在 Core 接入规则中补充 `file:../AlembicCore`、本地 Core scanner、release/snapshot 例外场景等守门说明。 |

## 验证命令

| 命令 | 结果 |
| --- | --- |
| `npm run build:check` | 通过。 |
| `npm run lint:public-api-boundary` | 通过；15 exact exports，无 wildcard exports。 |
| `npm run lint:core-import-boundary` | 通过；214 files / 48 Core imports。 |
| `npm run smoke:public-imports` | 通过；15 public subpaths imported。 |
| `npm run check` | 通过；9 test files / 37 tests；Biome 仍输出 23 条既有 warning，未阻断。 |
| `git diff --check` | 通过。 |

## Local Core Resolution Proof

命令：

```sh
node -e "const fs=require('fs'); const path=require('path'); const p=require('./package.json'); console.log(JSON.stringify({dependency:p.dependencies?.['@alembic/core'], coreBoundary:p.scripts?.['lint:core-import-boundary'], coreRealpath:path.relative(process.cwd(), fs.realpathSync('node_modules/@alembic/core'))}, null, 2));"
```

结果：

```json
{
  "dependency": "file:../AlembicCore",
  "coreBoundary": "node ../AlembicCore/scripts/lint-consumer-core-imports.mjs . --config config/core-import-boundary.json",
  "coreRealpath": "../AlembicCore"
}
```

## 遗留风险

- `npm run lint` 仍输出既有 Biome warning，但完整 `npm run check` 退出码为 0；本轮未处理这些非 local-source 引入范围的问题。
- 本轮只确认 AlembicAgent 基线；`Alembic` 与 `AlembicPlugin` 仍需各自完成本地 Core / Dashboard 引入口径调整后，总控才能整体验收。

## 下一步建议

1. 总控复核本提交 `0b86fdf55e3f927a1a5384c2b14cd97c8bb0daaf` 和本文证据。
2. 等 `Alembic` / `AlembicPlugin` 回填后，统一复核三仓库 local-source-first 口径。
3. 若后续进入 release snapshot 指针收口，单独记录 portable / vendor 快照源 commit，不把它反向作为 AlembicAgent 日常开发入口。
