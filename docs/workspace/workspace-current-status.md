# AlembicWorkspace Current Status

更新日期：2026-05-22
总控窗口：AlembicWorkspace
状态：V020-1 待启动

## 状态摘要

当前新主线是 [alembic-0-2-0-version-unification-workspace-plan-2026-05-22.md](alembic-0-2-0-version-unification-workspace-plan-2026-05-22.md)：把 Alembic 自有 package / plugin / release staging / Codex runtime 版本位统一为 `0.2.0`，完成后刷新本机 Codex plugin cache。

总控已完成 V020-0 扫描，确认当前版本入口：

- `Alembic` / `AlembicCore` / `AlembicAgent` 当前为 `0.1.0`。
- `AlembicPlugin` root / Codex plugin manifest / channel / runtime 当前为 `0.1.2`，且还有 `0.1.1` hardcode / fallback 需要在 Plugin 阶段清理。
- `AlembicDashboard` 是私有 package `3.3.8`；按本次用户口径纳入 Alembic 自有版本统一。
- `Alembic` publish staging 会读取 Core / Agent / Dashboard 版本；`AlembicPlugin` Codex runtime 会复制 Core package，所以二者必须等上游版本源先完成。

当前发送窗口：`AlembicCore`、`AlembicAgent`、`AlembicDashboard`。

当前不发送给：`Alembic`（阻塞等待上游版本）、`AlembicPlugin`（阻塞等待 Core 版本）、`AlembicTest`（观察中）、`BiliDili`（无任务）。

## 窗口分派

派发只看这张表：`待启动`、`执行中` 且仍有实际执行任务的窗口才发送提示词；`待验收`、`阻塞`、`暂停`、`观察中`、`无任务` 不发送。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>阻塞 | 等 `AlembicCore` / `AlembicAgent` / `AlembicDashboard` 回填后，再更新 root `alembic-ai@0.2.0`、lockfile、publish staging 与 release metadata。 |
| `AlembicCore`<br>待启动 | V020-1：将 `@alembic/core` 自有版本位从 `0.1.0` 统一为 `0.2.0`，同步 lockfile 和验证结果。 |
| `AlembicAgent`<br>待启动 | V020-1：将 `@alembic/agent` 自有版本位从 `0.1.0` 统一为 `0.2.0`，同步 lockfile 和验证结果。 |
| `AlembicDashboard`<br>待启动 | V020-1：将私有 `alembic-dashboard` 自有 package version 从 `3.3.8` 统一为 `0.2.0`，同步 lockfile 和验证结果。 |
| `AlembicPlugin`<br>阻塞 | 等 `AlembicCore` 回填后再更新 root/plugin/channel/runtime/cache 版本，不提前生成 runtime。 |
| `AlembicTest`<br>观察中 | 当前不创建测试单；如用户需要真实 Codex / BiliDili 验证，在 V020-4 后创建。 |
| `BiliDili`<br>无任务 | 不改真实 iOS 项目源码；只可能作为后续测试对象。 |

## 可复制提示词

发送给：`AlembicCore`、`AlembicAgent`、`AlembicDashboard`。

```text
读取 docs/workspace/alembic-0-2-0-version-unification-workspace-plan-2026-05-22.md，按照文档，领取并完成分配给你所在窗口的 V020-1 任务；完成后回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。
```

## 回填区

- 当前总控计划：[alembic-0-2-0-version-unification-workspace-plan-2026-05-22.md](alembic-0-2-0-version-unification-workspace-plan-2026-05-22.md)。
- 全局 TODO：[global-todo-board.md](global-todo-board.md) 的 `GTODO-2026-05-22-011` 已启动。
- 2026-05-22：V020-0 总控扫描完成，当前只派发上游源版本窗口；`Alembic` 与 `AlembicPlugin` 在上游回填后进入下一阶段。
