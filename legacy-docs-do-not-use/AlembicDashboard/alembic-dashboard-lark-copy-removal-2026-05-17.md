# AlembicDashboard Lark Copy Removal

日期：2026-05-18
来源计划：`docs/workspace/alembic-feishu-remote-removal-plan-2026-05-17.md`
窗口：`AlembicDashboard`
状态：已完成

## 完成范围

Dashboard Wave 2 已清理 Help/i18n 中把 Lark、飞书、`remote-exec` 作为核心能力展示的文案。

代码变更：

- `src/components/Views/HelpView.tsx`
  - 删除 Agent 架构 preset 列表中的 Lark 与 remote execution 项。
  - 改为展示 `chat`、`insight`、`evolution` 三个核心 preset。
- `src/i18n/locales/zh.ts`
  - 移除内置 Agent、IDE 集成、Agent 架构说明中的飞书 / Lark / remote-exec 宣传。
  - 将 Agent 架构说明改为 3 种核心 preset：`chat`、`insight`、`evolution`。
- `src/i18n/locales/en.ts`
  - 同步英文文案，删除 Lark / remote-exec 产品展示。

本轮没有接入或删除 terminal/sandbox runtime；Dashboard 仍只负责前端展示和文案。

## 提交

`32b2e01c249665e3dc33bdcffbfc39b648d0426d`  
`docs: remove lark remote dashboard copy`

## 验证命令

```text
npm run build
rg -n -i "lark|飞书|remote-exec|remote exec" src --glob '!**/dist/**'
git diff --check
```

## 验证结果

- `npm run build`：通过；仅保留既有 Vite large chunk warning。
- `rg -n -i "lark|飞书|remote-exec|remote exec" src --glob '!**/dist/**'`：无命中；`rg` 退出码 1 表示未命中。
- `git diff --check`：通过。

## 负向扫描剩余命中

Dashboard `src` 范围内剩余命中：0。

本轮没有扫描或修改其它仓库。执行时只读观察到 `AlembicAgent` 尚未完成自己的 Wave 2 删除，因此跨仓库总体验收仍需等待 `AlembicAgent` / `AlembicCore` 完成后再由总控或 Wave 3 做全局扫描。

## 遗留风险

- Dashboard 目前按删除计划中的最终方向展示 `chat`、`insight`、`evolution` 三个核心 preset；如果 `AlembicAgent` Wave 2 最终保留列表与此不同，需要二次同步 Dashboard 文案。
- 本轮只清理源码文案；Plugin vendor/runtime sweep 仍需在 `AlembicPlugin` Wave 3 同步 Dashboard vendor 后复验。
- Vite large chunk warning 为既有构建提示，本轮未扩大到拆包优化。

## 下一步建议

- `AlembicAgent` 完成 preset/profile/source/channel 删除后，回看 Dashboard 的 Agent 架构文案是否需要按最终 public contract 调整。
- `AlembicPlugin` Wave 3 同步 Dashboard vendor 后，执行 package/channel/codex plugin 产物负向扫描，确保不再携带 Lark 文案。
- Dashboard 继续不承载 terminal/sandbox 执行能力，只展示后端状态和审核工作流。
