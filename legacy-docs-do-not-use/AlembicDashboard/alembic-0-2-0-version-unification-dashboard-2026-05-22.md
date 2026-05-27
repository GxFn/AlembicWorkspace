# AlembicDashboard 0.2.0 Version Unification Execution Record

日期：2026-05-22
窗口：AlembicDashboard
阶段：V020-1
状态：已完成

## 完成范围

- 将 `package.json` 中私有包 `alembic-dashboard` 自有版本从 `3.3.8` 更新为 `0.2.0`。
- 同步 `package-lock.json` 顶层 `version` 与 root package `packages[""].version` 为 `0.2.0`。
- 未修改第三方依赖版本、源码逻辑、构建配置或生成物。

## 提交 Hash

- `5160a2a0fb164005f1922b8f58f28ca0ec88df56` — `Bump dashboard version to 0.2.0`

## 验证命令

```bash
npm run build
rg -n '"version": "3\\.3\\.8"|alembic-dashboard.*3\\.3\\.8' package.json package-lock.json src
git diff --check
git status --short
```

## 验证结果

- `npm run build`：通过；构建输出显示 `alembic-dashboard@0.2.0`。Vite 仍提示既有 large chunk warning，非本次版本位变更引入。
- 残留扫描：无命中；`package.json`、`package-lock.json`、`src` 中未发现 `alembic-dashboard` 的 `3.3.8` 自有版本残留。
- `git diff --check`：通过。
- `git status --short`：提交后 Dashboard 工作区干净。

## 遗留风险

- Dashboard 本轮只负责 private frontend package version。`Alembic` publish staging 仍需在 V020-2 读取本仓库 `0.2.0` 后重新生成。
- 本轮未启动 dev server、未刷新部署环境、未提交 `dist/`。

## 下一步建议

- 总控等待 `AlembicCore`、`AlembicAgent` V020-1 回填后，启动 `Alembic` V020-2，确保 publish staging 读取三个上游仓库的 `0.2.0`。
- `AlembicPlugin` 继续等待 `AlembicCore` 回填后再进入 V020-3，避免 runtime embedded Core 版本不一致。
