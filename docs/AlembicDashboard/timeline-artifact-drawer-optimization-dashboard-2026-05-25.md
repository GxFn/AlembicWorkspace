# Timeline Artifact Drawer Optimization Dashboard

日期：2026-05-25
窗口：`AlembicDashboard`
任务包：`ARTIFACT-DRAWER-P1-DASHBOARD-DRAWER-STACK`
状态：已完成，总控验收通过

## 当前窗口定位

当前窗口是 `AlembicDashboard` 执行窗口，本轮职责是独立完成 Timeline artifact detail 的前端 drawer stack UI 优化。

本轮不是 `Alembic` / `AlembicAgent` / `AlembicPlugin` / `AlembicCore` / `AlembicTest` 窗口；未改后端 API，未改 artifact producer，未处理 LLM Wave 6 Test-09。

## 完成范围

- 将 Jobs Timeline 从单层 `Drawer open size="full"` 改为对齐 Recipe evolution 的 `PageOverlay + Drawer.Panel` 双层抽屉模式。
- 宽屏下保留 Timeline 第一层上下文，并在同一 `PageOverlay` 内并排显示 artifact detail 第二层。
- 窄屏下第二层 `Drawer.Panel` 使用 `absolute inset-y-0 right-0 z-20` 和 `w-full` 覆盖第一层，避免原先窄屏堆叠、双窄栏挤压或横向滚动。
- 第二层 header 增加 `返回 Timeline` / `Back to timeline` 按钮；按钮和 `Escape` 在 detail 打开时只关闭第二层，回到第一层 Timeline，不关闭整个 Timeline drawer。
- 保留 artifact projection、完整 redacted artifact、artifact refs 切换、artifact metadata、metrics、trace，以及 loading / empty / error / success 状态。
- 未新增独立复杂 drawer 系统，未修改 `Drawer.tsx` 通用组件；本轮仅复用现有 `PageOverlay`、`Drawer.Panel`、`Drawer.Header`、`Drawer.Body`、`Drawer.HeaderActions`、`Drawer.CloseButton`。

## 提交 Hash

- `AlembicDashboard`: `d90f4d8ddde518f6e5db1477668bae13cf894a6a`

## 关键代码证据

- `src/components/Views/JobsView.tsx:815` 使用 `PageOverlay` 承载双层 drawer stack。
- `src/components/Views/JobsView.tsx:818-828` 是 artifact detail 第二层 `Drawer.Panel`，宽屏 `lg:w-[min(34vw,460px)]` 并排，窄屏 `w-full` + `absolute inset-y-0 right-0 z-20` 覆盖第一层。
- `src/components/Views/JobsView.tsx:830-886` 是 Timeline 第一层 `Drawer.Panel`，detail 打开时宽屏收敛到 `lg:w-[min(62vw,960px)]`，窄屏仍保留在底层上下文。
- `src/components/Views/JobsView.tsx:745-756` 让 `Escape` 先关闭第二层 detail，再关闭整体 Timeline。
- `src/components/Views/JobsView.tsx:1104-1123` 是第二层 detail header，包含清晰返回按钮和 close button。
- `src/components/Views/JobsView.tsx:1125-1201` 保留 projection、artifact refs、full artifact、metrics、trace、metadata、loading、empty、error、success 展示。

## 视觉 / DOM 证据

当前会话未暴露 Browser 自动化工具，且本地 `playwright` 模块不可用，因此未生成真实浏览器截图。本轮按分派要求提供等价 DOM / contract 视觉证据：

- 宽屏并排：`scripts/dashboard-contract.test.mjs:188-195` 锁定 `PageOverlay + Drawer.Panel`、detail 宽屏 `lg:w-[min(34vw,460px)]`、Timeline 宽屏 `lg:w-[min(62vw,960px)]`。
- 窄屏覆盖：`scripts/dashboard-contract.test.mjs:192-194` 锁定 detail `w-full` 与 `absolute inset-y-0 right-0 z-20`，同时 `scripts/dashboard-contract.test.mjs:229-230` 禁止回退到旧单层 `Drawer size="full"` 和旧 `lg:grid-cols-[minmax(0,1fr)_minmax(340px,460px)]` 内嵌 grid。
- 返回按钮：`scripts/dashboard-contract.test.mjs:190-196` 锁定 `closeTimelineDetail`、`Escape` 分支和 `aria-label={text.backToTimeline}`。
- 横向滚动控制：`scripts/dashboard-contract.test.mjs:197-200` 锁定 Timeline body `overflow-x-hidden`。
- Artifact 状态：`scripts/dashboard-contract.test.mjs:206-216` 锁定 projection、full artifact、`api.getJobProcessArtifact`、empty / loading / error / success、metrics、trace、artifact metadata。

若总控需要真实截图封口，建议补派 `AlembicTest` 或手动 Browser 视觉复核；本轮没有发现 API / contract 缺口。

## 验证命令

```text
npm run test
npm run typecheck
npm run check
git diff --check
git diff --check HEAD^ HEAD
```

## 验证结果

- `npm run test`：通过，12/12 contract tests passed。
- `npm run typecheck`：通过，`tsc --noEmit` 无错误。
- `npm run check`：通过，lint / test / typecheck / build 全部通过；Vite build 仅保留既有 large chunk warning。
- `git diff --check`：通过，无 whitespace error。
- `git diff --check HEAD^ HEAD`：通过，无提交区间 whitespace error。
- `AlembicDashboard` 提交后 `git status --short` 为空。

## 遗留风险

- 未生成真实 Browser screenshot；当前以 DOM contract + build/typecheck 作为等价视觉证据。
- 未做真实后端 artifact API 联调；本轮未改 API，且已复用 Wave 5 既有 `api.getJobProcessArtifact` 消费链路。

## 下一步建议

- 当前提交已通过总控验收；后续仅在用户要求真实浏览器截图或出现回归时再补派 `AlembicTest` 做 Jobs Timeline 宽屏并排、窄屏覆盖和返回按钮最小 Browser 复测。

## 总控验收

- 2026-05-25 17:30 CST：总控复核提交 `d90f4d8ddde518f6e5db1477668bae13cf894a6a`、工作区状态、`JobsView.tsx` 关键代码和 `scripts/dashboard-contract.test.mjs` contract 证据，验收通过。
- 总控复跑 `npm run test`、`npm run typecheck`、`git diff --check HEAD^ HEAD` 通过。
- Browser / screenshot 未作为本轮阻塞；本轮无后端 API 缺口，DOM contract 与代码事实已覆盖宽屏并排、窄屏覆盖、返回按钮和 artifact 状态。
