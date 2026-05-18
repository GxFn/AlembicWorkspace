# Alembic Local Source Import Unification

日期：2026-05-18
窗口：Alembic
状态：已完成
总控文档：`docs/workspace/alembic-local-source-import-unification-workspace-plan-2026-05-18.md`

## 提交

- Alembic 提交：`9461232072ae77a9b272554fcb61246ff9d1d856`（`chore: use local source imports for main repo`）
- 本地 Core 来源：`../AlembicCore @ b904b66907e16e61f29a6dc0eeedc59231ddfb53`
- 本地 Agent 来源：`../AlembicAgent @ 1af571674d3eb123e5aad695cb9a02fc69ce37d6`
- 本地 Dashboard 来源：`../AlembicDashboard @ 7143a7ca610a504b7472ae4afac0eb2df2ebdda8`

## 完成范围

- 将 Alembic 根依赖 `@alembic/core` 从 `file:vendor/AlembicCore` 切到 `file:../AlembicCore`，并同步 `package-lock.json` 与本地安装解析；`@alembic/agent` 保持 `file:../AlembicAgent`。
- 新增 `scripts/workspace-source.mjs` 作为本地源码解析器，默认优先选择 workspace 相邻源码，保留 vendor 作为 workspace 外 fallback / release snapshot 入口。
- 新增 `scripts/core-source-command.mjs`，让 `build:core`、`lint:core-import-boundary`、`lint:consumer-core-imports` 使用本地 `../AlembicCore` 的构建和 consumer boundary scanner。
- 更新 `scripts/build-dashboard.mjs`，Dashboard build 优先使用 `../AlembicDashboard`，仅在本地源码不存在时 fallback 到 `vendor/AlembicDashboard`。
- 更新 Alembic `AGENTS.md` 中过时的 vendor-only 规则，明确日常开发 / 总控验收使用 `../AlembicCore`，vendor 只用于 workspace 外、release snapshot 或便携交付校验。
- 修正本地源码链接暴露出的包实例边界问题：`AuditStore` / `AuditRepositoryImpl` 不再混用 Alembic 外层 Drizzle helper 与 Core 导出的 Drizzle schema，改为通过 raw SQLite 操作 Core 拥有的 `audit_logs` 表，保持查询、统计、清理和审计写入行为。
- 为混合 Core shared Zod schema 的 MCP input schema 补显式 `z.ZodType` 输出类型，避免生成声明时引用 `@alembic/core/node_modules/zod`。
- 未修改 `AlembicCore`、`AlembicAgent`、`AlembicDashboard` 源码。

## 验证命令与结果

| 命令 | 结果 |
| --- | --- |
| `npm install` | 通过；`node_modules/@alembic/core` 更新为指向 `../AlembicCore`。`husky prepare` 因 `.git/config` lock 权限打印 warning，但安装完成。 |
| `npm run build:check` | 通过；日志显示 `Using local AlembicCore source: ../AlembicCore`。 |
| `npm run lint:agent-extraction-boundary` | 通过；local Agent relative imports 0，local service/runtime/prompts/domain consumers 0。 |
| `npm run lint:core-import-boundary` | 通过；日志显示使用 `../AlembicCore`，扫描 453 files / 598 Core imports，issue 0。 |
| `npm run check` | 通过；Biome 仍打印既有 warning/info，但 exit code 为 0。 |
| `npm run build` | 通过；日志显示 `build:core` 使用本地 Core。 |
| `npm run build:dashboard` | 通过；日志显示 `Using local AlembicDashboard source: ../AlembicDashboard`，Vite chunk-size warning 非阻断，产物复制到 `dashboard/dist`。 |
| `node -e "import('@alembic/agent').then(...)"` | 通过；Agent public import loaded，`exportCount: 160`。 |
| local Core / Dashboard resolution proof | 通过；`coreLink: ../../../AlembicCore`，lockfile `node_modules/@alembic/core.resolved: ../AlembicCore`，Dashboard local source exists。 |
| `npm run test -- test/unit/AuditLogger.test.ts test/unit/Gateway.test.ts` | 通过；2 files / 27 tests passed。 |
| `rg -n "file:vendor/AlembicCore\|vendor/AlembicCore/scripts\|vendor/AlembicDashboard" package.json package-lock.json scripts AGENTS.md` | 通过；仅剩 `scripts/build-dashboard.mjs` 中允许的 Dashboard vendor fallback 文案 / fallback 路径，无 `file:vendor/AlembicCore` 或 vendor Core scanner 残留。 |
| `git diff --check` | 通过。 |

## 解析证明

```json
{
  "coreLink": "../../../AlembicCore",
  "packageCore": {
    "resolved": "../AlembicCore",
    "link": true
  },
  "dashboardLocalExists": true,
  "dashboardVendorExists": true,
  "coreHead": "b904b66907e16e61f29a6dc0eeedc59231ddfb53",
  "dashboardHead": "7143a7ca610a504b7472ae4afac0eb2df2ebdda8"
}
```

## 残留扫描结果

- `file:vendor/AlembicCore`：0 命中。
- `vendor/AlembicCore/scripts`：0 命中。
- `vendor/AlembicDashboard`：仅剩 `scripts/build-dashboard.mjs` 的允许 fallback 路径和错误提示。
- `../AlembicCore`：命中 `package.json` / lockfile / resolver / AGENTS 规则，符合本轮目标。
- `../AlembicDashboard`：命中 Dashboard resolver 和错误提示，符合本轮目标。

## 遗留风险

- `npm run check` 仍输出既有 Biome warning/info，本轮未处理非 local-source 引入口径相关的历史风格问题。
- 本地 `file:../AlembicCore` 以 symlink 形式安装；如果外层继续直接组合 Core 内部 ORM schema 与外层 ORM helper，仍可能遇到重复包实例类型问题。本轮已在 Alembic audit adapter 和 MCP schema 声明处收口，后续若新增类似混用应优先走 Core public facade 或宿主 raw adapter。
- `npm run build:dashboard` 的 Vite chunk-size warning 为既有非阻断产物体积提示；本轮不处理 Dashboard 分包优化。
- vendor fallback 仍刻意保留给 workspace 外独立运行、release snapshot 和便携交付校验，不应被视为默认开发入口。

## 下一步建议

- 总控复核 `Alembic`、`AlembicAgent`、`AlembicPlugin` 三个窗口的 local-source-first 口径是否一致。
- release / portable snapshot 指针收口应另建阶段记录，届时再确认 vendor/submodule/embedded runtime 来源 commit。
- 如果后续发现 Dashboard build contract 需要源仓库调整，再单独派发给 `AlembicDashboard`；当前无 Dashboard 源码任务。
