# AlembicWorkspace Current Status

更新日期：2026-05-22
总控窗口：AlembicWorkspace
状态：V020-2 / V020-3 待启动

## 状态摘要

当前新主线是 [alembic-0-2-0-version-unification-workspace-plan-2026-05-22.md](alembic-0-2-0-version-unification-workspace-plan-2026-05-22.md)：把 Alembic 自有 package / plugin / release staging / Codex runtime 版本位统一为 `0.2.0`，完成后刷新本机 Codex plugin cache。

总控已完成 V020-1R 复核，当前版本状态：

- `AlembicCore` 源 package / lock 已到 `0.2.0`，提交 `f30beacedf89abab13b91e87e4686d0db38e7d29`，总控复核通过。
- `AlembicDashboard` 源 package / lock 已到 `0.2.0`，提交 `5160a2a0fb164005f1922b8f58f28ca0ec88df56`，总控复核通过。
- `AlembicAgent` root package / root lock 已到 `0.2.0`，且 V020-1R 已将 `package-lock.json` 中 `../AlembicCore` snapshot 刷新到 `0.2.0`，提交 `9de2cd97c3f4962a8b19595b76eeb7df00f853f5`，总控复核通过。
- `Alembic` 与 `AlembicPlugin` 可以进入下游阶段：一个生成 publish staging，一个生成 Codex plugin runtime / channel。

当前发送窗口：`Alembic`、`AlembicPlugin`。

当前不发送给：`AlembicCore`（已完成）、`AlembicAgent`（已完成）、`AlembicDashboard`（已完成）、`AlembicTest`（观察中）、`BiliDili`（无任务）。

## 窗口分派

派发只看这张表：`待启动`、`执行中` 且仍有实际执行任务的窗口才发送提示词；`待验收`、`阻塞`、`暂停`、`观察中`、`无任务` 不发送。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>待启动 | V020-2：更新 root `alembic-ai@0.2.0`、lockfile、publish staging 与 release metadata，确保读取 Core / Agent / Dashboard 的 `0.2.0`。 |
| `AlembicCore`<br>已完成 | V020-1 总控复核通过：提交 `f30beacedf89abab13b91e87e4686d0db38e7d29`，`@alembic/core` package / lock root 自有版本已统一为 `0.2.0`。 |
| `AlembicAgent`<br>已完成 | V020-1R 总控复核通过：提交 `9de2cd97c3f4962a8b19595b76eeb7df00f853f5`，`package-lock.json` 中 `../AlembicCore` snapshot 已刷新到 `0.2.0`，目标残留扫描无命中。 |
| `AlembicDashboard`<br>已完成 | V020-1 总控复核通过：提交 `5160a2a0fb164005f1922b8f58f28ca0ec88df56`，私有 `alembic-dashboard` package / lock root 自有版本已统一为 `0.2.0`。 |
| `AlembicPlugin`<br>待启动 | V020-3：更新 root/plugin/channel/runtime/tests/MCP metadata/cache-sync fallback 到 `0.2.0`，重新生成 Codex plugin runtime；本机 cache refresh 留给总控 V020-4。 |
| `AlembicTest`<br>观察中 | 当前不创建测试单；如用户需要真实 Codex / BiliDili 验证，在 V020-4 后创建。 |
| `BiliDili`<br>无任务 | 不改真实 iOS 项目源码；只可能作为后续测试对象。 |

## 可复制提示词

发送给：`Alembic`、`AlembicPlugin`。

```text
读取 docs/workspace/alembic-0-2-0-version-unification-workspace-plan-2026-05-22.md，按照文档，领取并完成分配给你所在窗口的任务；完成后回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。
```

## 回填区

- 当前总控计划：[alembic-0-2-0-version-unification-workspace-plan-2026-05-22.md](alembic-0-2-0-version-unification-workspace-plan-2026-05-22.md)。
- 全局 TODO：[global-todo-board.md](global-todo-board.md) 的 `GTODO-2026-05-22-011` 已启动。
- 2026-05-22：V020-0 总控扫描完成，当前只派发上游源版本窗口；`Alembic` 与 `AlembicPlugin` 在上游回填后进入下一阶段。
- 2026-05-22：`AlembicAgent` V020-1 已完成并待总控验收，提交 `39b2ab3`，执行记录 `docs/AlembicAgent/alembic-0-2-0-version-unification-agent-2026-05-22.md`。验证：`npm run build` 通过；`npm run test` 通过，19 个测试文件 / 87 个测试用例；`git diff --check` 通过。残留：`package-lock.json` 中 `../AlembicCore` snapshot 仍为当前真实 `0.1.0`，待 Core 完成后刷新。
- 2026-05-22：`AlembicCore` V020-1 已完成并待总控验收，提交 `f30beacedf89abab13b91e87e4686d0db38e7d29`，执行记录 [../AlembicCore/alembic-0-2-0-version-unification-core-2026-05-22.md](../AlembicCore/alembic-0-2-0-version-unification-core-2026-05-22.md)。验证：`npm run build:check`、`npm run test`、`npm run build`、目标残留扫描、lint、`git diff --check` 均通过。
- 2026-05-22：总控复核 V020-1：`AlembicCore` 与 `AlembicDashboard` 通过；`AlembicAgent` 需要 V020-1R 返工。复核确认 `AlembicAgent/package-lock.json` 的 `packages["../AlembicCore"].version` 仍为 `0.1.0`，这是当前 lockfile 中的 Alembic 自有版本残留，当前只派发 `AlembicAgent`。
- 2026-05-22：`AlembicAgent` V020-1R 已完成并待总控验收，提交 `9de2cd9`，执行记录 `docs/AlembicAgent/alembic-0-2-0-version-unification-agent-2026-05-22.md`。验证：Core snapshot 读取为 `0.2.0`；目标残留扫描无命中；`npm run build` 通过；`npm run test` 通过，19 个测试文件 / 87 个测试用例；`git diff --check` 通过。
- 2026-05-22：总控复核 V020-1R 通过。`AlembicAgent` 工作区干净，HEAD 为 `9de2cd97c3f4962a8b19595b76eeb7df00f853f5`；`package.json`、root lock、`packages["../AlembicCore"].version` 均为 `0.2.0`；目标残留扫描无命中。当前派发 `Alembic` / `AlembicPlugin`。
