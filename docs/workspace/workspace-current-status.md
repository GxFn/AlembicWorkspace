# AlembicWorkspace Current Status

更新日期：2026-05-18
总控窗口：AlembicWorkspace
状态：执行中；AlembicPlugin、AlembicDashboard 已完成

## 状态摘要

当前计划是直接收束 Alembic 的宿主 Agent 路线：

- 当前计划：[alembic-codex-only-host-agent-mode-workspace-plan-2026-05-18.md](alembic-codex-only-host-agent-mode-workspace-plan-2026-05-18.md)
- 执行窗口：`Alembic`
- 已完成窗口：`AlembicPlugin`、`AlembicDashboard`
- 观察窗口：`AlembicCore`、`AlembicAgent`、`BiliDili`
- 发送判断：当前只给仍有实际任务的 `Alembic` 发送统一提示词；`AlembicPlugin`、`AlembicDashboard` 已完成，观察窗口不发送，避免空转。

## 窗口分派

派发只看这张表：`待启动`、`执行中` 且仍有实际执行任务的窗口才发送提示词；`待验收`、`阻塞`、`观察中`、`无任务` 不发送。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>待启动 | 删除主包多 IDE Agent 默认 / 支持路径，保留 CLI / daemon / Dashboard / HTTP / internal AI。 |
| `AlembicPlugin`<br>已完成 | Codex 插件 cold-start / rescan 主路径已切成 Codex 宿主 Agent 线；执行记录见 [../AlembicPlugin/alembic-plugin-codex-host-agent-single-line-2026-05-18.md](../AlembicPlugin/alembic-plugin-codex-host-agent-single-line-2026-05-18.md)。 |
| `AlembicDashboard`<br>已完成 | 已删除可见 IDE / Cursor / VSCode / Copilot 等文案，改成 Codex host agent + Alembic internal AI 两线；执行记录已回填到当前计划。 |
| `AlembicCore`<br>观察中 | 不派发；观察 host-agent contract 是否阻塞 Plugin 收束。 |
| `AlembicAgent`<br>观察中 | 不派发；保留为 Alembic internal AI runtime。 |
| `BiliDili`<br>观察中 | 不派发；必要时只作为只读 smoke 目标。 |

## 可复制提示词

发送给：`Alembic`

`AlembicPlugin`、`AlembicDashboard` 已完成本轮任务，不再发送领取提示词。

```text
读取 docs/workspace/alembic-codex-only-host-agent-mode-workspace-plan-2026-05-18.md，按照文档，领取并完成分配给你所在窗口的任务；完成后回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。
```

不发送给：`AlembicCore`、`AlembicAgent`、`BiliDili`。

## 回填区

- 当前计划回填入口：`docs/workspace/alembic-codex-only-host-agent-mode-workspace-plan-2026-05-18.md` 的“回填区”。
