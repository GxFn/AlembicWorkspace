# AlembicDashboard 前端抽取执行计划

日期：2026-05-17

适用仓库：

- `AlembicDashboard`：新的 Dashboard 前端源码仓库。
- `Alembic`：主仓库，后续只接入 Dashboard 构建产物和开发入口。
- `AlembicPlugin`：Codex 插件仓库，后续只接入 Dashboard 构建产物、插件 runtime 打包链路和验证脚本。

本计划用于多窗口并行执行：

- Dashboard 窗口：负责把主仓库 `Alembic/dashboard` 的前端完整抽取到 `AlembicDashboard`，并把 `AlembicPlugin/dashboard` 差异作为兼容审计材料。
- Alembic 窗口：负责把主仓库改成消费 `AlembicDashboard`，验证后删除主仓库旧前端源码。
- AlembicPlugin 窗口：负责把插件仓库改成消费 `AlembicDashboard`，验证 runtime 打包链路后删除插件仓库旧前端源码。

## 0. 硬性规则

这些规则优先级高于任何局部实现偏好。

1. 不允许薄实现。

   本次是前端仓库抽取，不是重写 Dashboard。必须完整保留现有页面、组件、hooks、API client、i18n、样式、public 资源、PWA 资源、构建配置和 package lock。不得用空壳页面、占位 API、简化 mock 或“后续再补”替代真实实现。

2. 不允许先删后接。

   `Alembic/dashboard` 和 `AlembicPlugin/dashboard` 的源码删除必须发生在 `AlembicDashboard` 已完成提交、两个外层仓库已经能从 Dashboard 仓库构建并生成 `dashboard/dist/index.html`、对应 build/test/smoke 已通过之后。

3. 主仓库版本是前端源码权威基线。

   本次抽取按照 `Alembic/dashboard` 为准。`AlembicPlugin/dashboard` 不能反向覆盖主仓库前端源码。插件差异只用于兼容审计和外层插件接入判断；除非用户另行明确要求，不把插件版本的旧实现合入 Dashboard 权威源码。

4. 不迁移后端能力到 Dashboard。

   Dashboard 仓库只承载前端 UI、API client、前端状态、路由、样式、可视化和前端测试。HTTP routes、daemon、CLI、agent、tool system、AI provider、SQLite、Drizzle、Core service、plugin channel、runtime packaging 都不进入 `AlembicDashboard`。

5. 不把 Dashboard 逻辑迁入 Core。

   Core 不承载 React UI、Vite、前端资源、Dashboard 页面或浏览器交互逻辑。Dashboard 只通过 API contract 消费 Core/后端结果。

6. 不提交构建产物和依赖目录。

   `node_modules/`、`dist/`、`dashboard/dist/`、插件 runtime 生成目录都必须保持 ignored，不提交。发布和打包需要的 `dashboard/dist` 由构建脚本生成。

7. 不写入个人绝对路径。

   长期文档、脚本、配置、fixture、package metadata 不得写入本机用户名、旧工作区地址或临时绝对路径。脚本使用 repo-relative path、`process.cwd()`、package root 检测或明确的 workspace 变量。

8. 阶段化提交。

   每个窗口每完成一个阶段必须提交一次。提交前记录验证命令和结果。不要把“复制、兼容审计、接入、删除、修测试”塞进一个不可回滚的大提交。

9. 外层删除必须有替代入口。

   删除外层 `dashboard/src`、`dashboard/package.json`、`dashboard/public`、`dashboard/vite.config.ts` 等文件前，必须确认外层已有新 `build:dashboard` 或等价脚本从 `vendor/AlembicDashboard` 生成 `dashboard/dist`。

10. 不能破坏用户工作流。

   `alembic ui`、daemon 静态托管、Codex 插件 `alembic_codex_dashboard`、release 检查、runtime 打包和 smoke 测试必须继续可用。

## 1. 当前真实状态

### 1.1 源码来源

当前存在两份 Dashboard 源码：

```text
Alembic/dashboard
AlembicPlugin/dashboard
```

插件仓库还存在一份已构建 runtime 产物：

```text
AlembicPlugin/plugins/alembic-codex/runtime/dashboard/dist
```

runtime 产物不是源码迁移来源，只用于验证插件打包链路。

### 1.2 文件规模与差异

扫描结果：

```text
Alembic/dashboard       90 files  (excluding node_modules/dist)
AlembicPlugin/dashboard 88 files  (excluding node_modules/dist)
```

两个源码目录只有 4 个同名缺失差异，全部是 `Alembic/dashboard` 独有：

```text
src/components/Views/AiChatView.tsx
src/components/Views/WikiView.tsx
src/hooks/useChatStream.ts
src/hooks/useChatTopics.ts
```

内容差异共 18 处，关键文件包括：

```text
src/App.tsx
src/api.ts
src/components/Layout/CommandPalette.tsx
src/components/Layout/Header.tsx
src/components/Layout/Sidebar.tsx
src/components/Modals/LlmConfigModal.tsx
src/components/Shared/GlobalChatDrawer.tsx
src/components/Shared/PageOverlay.tsx
src/components/Views/CandidatesView.tsx
src/components/Views/HelpView.tsx
src/components/Views/SkillsView.tsx
src/constants/index.ts
src/i18n/locales/en.ts
src/i18n/locales/zh.ts
```

初步判断：

- `Alembic/dashboard` 是本次抽取的权威基线，包含 AI chat、Wiki、chat stream hooks、SignalCollector badge 等增强。
- `AlembicPlugin/dashboard` 只作为兼容审计来源。插件差异不能覆盖主仓库版本；如果插件后端缺少主仓库 Dashboard 需要的接口，由插件窗口在后端/API 或外层接入层做兼容，而不是降级 Dashboard 权威源码。

### 1.3 外层接入热点

主仓库当前：

- `package.json` 中 `build:dashboard = cd dashboard && npm run build`。
- `package.json.files` 包含 `dashboard/dist`。
- `.gitignore` 忽略 `dashboard/dist/`。
- `bin/daemon-server.ts` 通过 `DASHBOARD_DIR/dist/index.html` 决定是否挂载 Dashboard。
- `bin/cli.ts` 的 `ui` 命令在有 `dashboard/src` 时启动 Vite dev server，无源码但有 `dashboard/dist` 时直接托管产物。
- `lib/shared/package-assets.ts` 中 `DASHBOARD_DIR` 指向 package root 下的 `dashboard`。

插件仓库当前：

- `package.json` 中 `build:dashboard = cd dashboard && npm run build`。
- `package.json.files` 包含 `dashboard/dist`。
- `.gitignore` 忽略 `dashboard/dist/`。
- `bin/daemon-server.ts` 通过 `DASHBOARD_DIR/dist/index.html` 挂载 Dashboard。
- `scripts/prepare-codex-plugin-runtime.mjs` 从 `dashboard/dist` 复制到插件 runtime 的 `dashboard/dist`。
- `scripts/dev-watch-codex-plugin.mjs`、`scripts/dev-verify-codex-plugin.mjs`、`scripts/release-codex-plugin.mjs`、`scripts/smoke-codex-plugin.mjs` 都有 Dashboard 构建或验证假设。

## 2. 目标架构

目标关系：

```text
AlembicDashboard
  ├── src/
  ├── public/
  ├── package.json
  ├── package-lock.json
  ├── vite.config.ts
  └── dist/                 # ignored, build output

Alembic
  ├── vendor/AlembicDashboard -> Git subrepo/submodule
  ├── scripts/build-dashboard.mjs
  └── dashboard/dist/        # ignored, generated package asset

AlembicPlugin
  ├── vendor/AlembicDashboard -> Git subrepo/submodule
  ├── scripts/build-dashboard.mjs
  ├── dashboard/dist/        # ignored, generated package asset
  └── plugins/alembic-codex/runtime/dashboard/dist/  # generated runtime asset
```

长期原则：

- `AlembicDashboard` 是前端源码唯一维护点。
- `Alembic` / `AlembicPlugin` 不再维护 `dashboard/src`、`dashboard/public`、`dashboard/package.json`、`dashboard/vite.config.ts` 等前端源码和构建配置。
- 两个外层仓库可以保留 `dashboard/dist` 作为构建生成目录，因为现有 package/runtime 资产路径和 daemon 挂载逻辑都依赖 package root 下的 `dashboard/dist`。
- 外层仓库的 HTTP/API/daemon/CLI/tool/agent 代码仍留在外层，不进入 Dashboard 仓库。

## 3. 多窗口执行顺序

执行顺序不能颠倒：

1. Dashboard 窗口完成 `AlembicDashboard` 主仓库源码抽取、插件差异兼容审计、构建验证和提交。
2. Alembic 窗口接入 `vendor/AlembicDashboard`，新增构建脚本，验证主仓库继续可用。
3. AlembicPlugin 窗口接入 `vendor/AlembicDashboard`，新增构建脚本，验证插件 runtime 打包继续可用。
4. Alembic / AlembicPlugin 两个窗口分别删除旧前端源码，只保留生成型 `dashboard/dist` 路径。
5. 两个外层窗口完成 smoke/release 验证后，Dashboard 窗口再接收后续功能修正。

### 3.1 执行状态更新

最后更新：2026-05-17，Dashboard 窗口完成 D5 最小 CI。

Dashboard 窗口：

- D1 状态：已完成。
- 提交：`e04a7f9 chore: import dashboard frontend baseline`。
- 范围：从 `Alembic/dashboard` 完整导入前端基线到 `AlembicDashboard`，保留已有 `AGENTS.md`。
- 额外仓库卫生：新增 `.gitignore`，忽略 `node_modules/`、`dist/`、`.vite/`，避免依赖目录和构建产物进入独立前端仓库提交。
- 验证：
  - `npm ci` 通过。
  - `npm run build` 通过，生成 `dist/index.html`。
  - `diff -qr --exclude=node_modules --exclude=dist --exclude=.git --exclude=AGENTS.md --exclude=.gitignore . ../Alembic/dashboard` 无差异。
  - 本地绝对路径标记扫描无匹配。
- D2 状态：已完成。
- 提交：`3872d5d docs: record plugin dashboard compatibility audit`。
- 审计记录：`docs/alembic-dashboard-plugin-compatibility-audit-2026-05-17.md`。
- D2 结论：保持 `Alembic/dashboard` 导入后的 Dashboard 权威基线；不使用 `AlembicPlugin/dashboard` 覆盖 `AlembicDashboard`。
- 插件兼容结论：
  - 插件窗口需要为共享 Dashboard 提供 `/api/v1/ai/env-config` GET/POST 兼容别名，或等价适配现有 workspace-config 实现。
  - 插件窗口需要挂载或实现 `/api/v1/wiki/*` routes，不能通过删除 Wiki UI 规避。
  - 插件窗口需要补齐 `/api/v1/skills/suggest` 和 `/api/v1/skills/signal-status`，若完整 SignalCollector 未就绪则返回兼容空数据。
  - 插件窗口需要判断 job `source` 是否会返回 `codex`；如会返回，后续 Dashboard 可做小型类型兼容 patch。
- D2 验证：
  - 与 `AlembicPlugin/dashboard` 的差异清单已逐项审计。
  - 只读核对 Alembic / AlembicPlugin 后端路由。
  - `npm run build` 通过，生成 `dist/index.html`。
  - 本地绝对路径标记扫描无匹配。
- D3 状态：已完成。
- 提交：`206a062 docs: define dashboard repository rules`。
- 范围：补强 `AGENTS.md` 的抽取后长期契约，明确 `AlembicDashboard` 是前端源码唯一维护点，`AlembicPlugin/dashboard` 只能作为兼容审计材料，生成物必须保持 ignored。
- D3 核对：
  - `package.json` 保持 `name = alembic-dashboard`、`private = true`、`build = tsc && vite build`。
  - `.gitignore` 包含 `node_modules/`、`dist/`、`.vite/`。
  - `AGENTS.md` 与本计划一致，不承载后端、Agent、tool、Core 内核或插件交付壳。
- D3 验证：
  - `npm run build` 通过，生成 `dist/index.html`。
  - `AGENTS.md` 本地绝对路径标记扫描无匹配。
- D4 状态：已完成。
- 提交：`bea8cd4 fix: accept codex job source`。
- 审计记录：`docs/alembic-dashboard-boundary-connectivity-audit-2026-05-17.md`。
- 范围：自检 Dashboard 仓库边界、开发代理/Socket 连通性、API client 与 Alembic / AlembicPlugin 后端路由兼容性。
- D4 结论：
  - Dashboard 仓库未发现个人绝对路径、跨仓源码 import、旧分层 alias 或后端运行时依赖。
  - 主仓库后端与当前 Dashboard API client 兼容。
  - 插件仓库仍需补 `/api/v1/ai/env-config`、`/api/v1/wiki/*`、`/api/v1/skills/suggest`、`/api/v1/skills/signal-status`。
  - Dashboard 已把 `DaemonJobRecord.source` 扩展为包含 `codex`，与 Core job source 保持一致。
- D4 验证：
  - `npm run build` 通过，生成 `dist/index.html`。
  - 边界扫描无匹配。
  - 本地 daemon 连通性探测显示 `127.0.0.1:3000` 当前无进程响应；本轮 live 联调需等 Alembic / AlembicPlugin 窗口启动对应 daemon 后执行。
- D5 状态：已完成。
- 提交：`c7568f2 ci: add dashboard build workflow`。
- 范围：新增 `.github/workflows/ci.yml`，在 push / pull_request 上运行最小 CI。
- D5 检查：
  - `npm ci`。
  - `npm run build`。
  - 确认 `dist` 与 `node_modules` 仍作为 ignored 生成物，不作为源码提交。
  - 扫描 Dashboard 源码和配置中的本地路径、跨仓引用、旧分层 alias 与后端运行时依赖标记。
- D5 验证：
  - 本地 `npm run build` 通过。
  - 本地边界扫描无匹配。
  - workflow 文件自身未写入本机绝对路径或旧工作区路径字面量。
- Dashboard 窗口状态：D1-D5 已完成。后续等待 Alembic / AlembicPlugin 接入和验证反馈。

Alembic 窗口当前任务：

- 可以开始 A1。
- 接入目标：新增 `vendor/AlembicDashboard` 指针，指向 Dashboard 提交 `c7568f2` 或其后续 fast-forward。
- 仍然不要删除 `Alembic/dashboard` 源码；删除必须等 A1-A3 接入和验证完成后进入 A4。
- A1-A2 优先事项：新增 `vendor/AlembicDashboard`、更新 ignore、实现 `scripts/build-dashboard.mjs`，将 `build:dashboard` 改为从 vendor 构建并复制到 `dashboard/dist`。
- A1-A2 必跑验证：`npm run build:dashboard`、`npm run build:check`，并确认 `dashboard/dist/index.html` 存在且未提交。

AlembicPlugin 窗口当前任务：

- 可以开始 P1。
- 接入目标：新增 `vendor/AlembicDashboard` 指针，指向 Dashboard 提交 `c7568f2` 或其后续 fast-forward。
- 仍然不要删除 `AlembicPlugin/dashboard` 源码；删除必须等 P1-P2 接入、API 兼容和 runtime 验证完成后进入 P3。
- P1-P2 优先事项：新增 `vendor/AlembicDashboard`、更新 ignore、实现 `scripts/build-dashboard.mjs`，保持 runtime 打包入口继续从本仓库 `dashboard/dist` 复制。
- P1-P2 必跑验证：`npm run build:dashboard`、`npm run build:check`、`npm run prepare:codex-plugin-runtime`，并确认 `dashboard/dist/index.html` 和 runtime Dashboard `index.html` 均存在且生成物未提交。
- API 兼容优先事项：按 D2 审计记录补 `/api/v1/ai/env-config`、`/api/v1/wiki/*`、`/api/v1/skills/suggest`、`/api/v1/skills/signal-status`，不要通过裁剪共享 Dashboard UI 规避。

## 4. Dashboard 窗口任务

### 阶段 D1：初始化前端仓库基线

负责窗口：Dashboard 窗口。

任务：

1. 确认 `AlembicDashboard` 工作区干净，只允许已有 `AGENTS.md` 或本阶段相关文件。
2. 以 `Alembic/dashboard` 为初始完整复制来源，把 `dashboard/` 目录内文件复制到 `AlembicDashboard` 仓库根目录。
3. 不复制 `node_modules/`、`dist/`、临时缓存。
4. 保留 `package-lock.json`，确保依赖版本可复现。
5. 保留 `public/favicon.ico`、`public/logo.svg`、`public/manifest.json`、`public/service-worker.js`。
6. 提交：`chore: import dashboard frontend baseline`。

验收：

```text
AlembicDashboard/
├── AGENTS.md
├── index.html
├── package.json
├── package-lock.json
├── public/
├── src/
├── tailwind.config.cjs
├── postcss.config.cjs
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

必须运行：

```text
npm ci
npm run build
```

如果因为新仓库没有依赖缓存导致 `npm ci` 需要网络，Dashboard 窗口按正常权限流程申请，不要改用复制 `node_modules`。

### 阶段 D2：审计 AlembicPlugin Dashboard 差异

负责窗口：Dashboard 窗口。

任务：

1. 对比 `AlembicPlugin/dashboard` 与 `AlembicDashboard`。
2. 对 18 个差异文件逐个检查，但默认保留 `AlembicDashboard` 中来自主仓库的版本。
3. 不允许用 `AlembicPlugin/dashboard` 覆盖 `AlembicDashboard`。
4. 对每个差异在提交说明或临时验收记录中写明处理结论：

   ```text
   file: ...
   decision: main-authoritative / plugin-compat-needed / plugin-obsolete
   reason: ...
   verification: ...
   ```

5. 特别检查这些差异点：

   - `Job.source` 类型中插件的 `codex` source 与主仓库的 source 定义是否需要统一。
   - `api.ts` 中 `getLlmWorkspaceConfig` / `getLlmEnvConfig` 的兼容关系。
   - AI chat、Wiki、chat stream 是否是主仓库新增完整功能，是否应该进入通用 Dashboard。
   - Sidebar、CommandPalette、i18n 是否需要保留插件 surface 名称或 Codex 文案。
   - Skills / SignalCollector badge 是否依赖后端接口，插件仓库是否已有对应 API。

6. 如果插件确实需要 surface 差异，优先由 AlembicPlugin 窗口补齐后端/API 兼容或运行时配置。Dashboard 只接受不破坏主仓库行为的通用配置，不接受插件旧实现覆盖。
7. 提交：`docs: record plugin dashboard compatibility audit`，或在 D1 提交说明中附带审计记录。

验收：

```text
diff -qr --exclude=node_modules --exclude=dist AlembicDashboard Alembic/dashboard
diff -qr --exclude=node_modules --exclude=dist AlembicDashboard AlembicPlugin/dashboard
```

允许存在差异。差异存在本身不是阻塞项，但每个差异必须有处理结论；默认结论应是 `main-authoritative`。

必须运行：

```text
npm run build
```

### 阶段 D3：固定 Dashboard 仓库长期契约

负责窗口：Dashboard 窗口。

任务：

1. 检查 `package.json`：

   - `name` 暂时可保留 `alembic-dashboard`，除非决定发布 npm 包。
   - `private` 可以保持 `true`，因为外层通过 subrepo 源码构建。
   - 保留 `build = tsc && vite build`。
   - 如新增 `typecheck`、`lint`，不能破坏现有构建。

2. 确认 `.gitignore` 包含：

   ```text
   node_modules/
   dist/
   .vite/
   ```

3. 确认 `AGENTS.md` 与本计划一致：Dashboard 不承载后端、Agent、tool、Core 内核或插件交付壳。
4. 提交：`docs: define dashboard repository rules` 或与 D1 合并提交均可。

验收：

```text
npm run build
git status --short
```

## 5. Alembic 窗口任务

### 阶段 A1：接入 Dashboard 子仓库

负责窗口：Alembic 窗口。

前置条件：

- Dashboard 窗口已完成 D1-D3 并提交。

任务：

1. 在 `Alembic` 中新增 `vendor/AlembicDashboard`，远端指向 `https://github.com/GxFn/AlembicDashboard.git`。
2. 不要把 `AlembicDashboard` 源码复制进 `dashboard/`。
3. 新增或调整 `.gitignore`，确保：

   ```text
   dashboard/dist/
   vendor/AlembicDashboard/dist/
   vendor/AlembicDashboard/node_modules/
   ```

4. 提交只包含子仓库指针、ignore 和必要脚本。

验收：

```text
git status --short
git -C vendor/AlembicDashboard status --short
```

### 阶段 A2：改造主仓库构建脚本

负责窗口：Alembic 窗口。

任务：

1. 新增 `scripts/build-dashboard.mjs` 或等价脚本，职责：

   - 定位 `vendor/AlembicDashboard`。
   - 如依赖缺失，提示运行 `npm ci --prefix vendor/AlembicDashboard`，不要隐式复制依赖。
   - 运行 `npm --prefix vendor/AlembicDashboard run build`。
   - 清空并重建 `dashboard/dist`。
   - 将 `vendor/AlembicDashboard/dist` 完整复制到 `dashboard/dist`。
   - 验证 `dashboard/dist/index.html` 存在。

2. 修改 `package.json`：

   ```text
   "build:dashboard": "node scripts/build-dashboard.mjs"
   ```

3. 保留 `package.json.files` 中的 `dashboard/dist`。
4. 不要把 `dashboard/dist` 加入 git。

必须运行：

```text
npm run build:dashboard
npm run build:check
```

### 阶段 A3：保持 `alembic ui` 开发体验

负责窗口：Alembic 窗口。

任务：

1. 检查 `bin/cli.ts` 的 `ui` 命令。
2. 现有逻辑依赖 `dashboard/src` 判断开发模式。删除旧源码后，应改为：

   - 如果 `dashboard/dist/index.html` 存在：生产模式托管 dist。
   - 如果 `vendor/AlembicDashboard/src` 存在且用户处于开发仓库：可以从 vendor 启动 Vite dev server。
   - 如果两者都不存在：给出明确错误，提示运行 `npm run build:dashboard`。

3. Vite dev server 的 `cwd` 应改为 `vendor/AlembicDashboard`。
4. 传入 `VITE_API_URL` 继续指向本地 API server。
5. 不要恢复旧 `dashboard/src`。

必须运行：

```text
npm run build:check
npm run build:dashboard
```

可选手动验证：

```text
npm run build
node dist/bin/cli.js ui --no-open
```

### 阶段 A4：删除主仓库旧前端源码

负责窗口：Alembic 窗口。

前置条件：

- A1-A3 已通过。
- `dashboard/dist/index.html` 可由 `npm run build:dashboard` 生成。

删除候选：

```text
dashboard/index.html
dashboard/package.json
dashboard/package-lock.json
dashboard/postcss.config.cjs
dashboard/public/
dashboard/src/
dashboard/tailwind.config.cjs
dashboard/tsconfig.json
dashboard/tsconfig.node.json
dashboard/vite.config.ts
```

不得删除：

```text
dashboard/dist/   # generated, ignored, package asset path
```

如果删除后 git 无法保留空 `dashboard/` 目录，不需要强行提交 `.gitkeep`，构建脚本负责创建。

必须运行：

```text
npm run build:dashboard
npm run build:check
npm run build
```

提交建议：

```text
chore: consume shared dashboard build
chore: remove local dashboard source
```

## 6. AlembicPlugin 窗口任务

### 阶段 P1：接入 Dashboard 子仓库

负责窗口：AlembicPlugin 窗口。

前置条件：

- Dashboard 窗口已完成 D1-D3 并提交。

任务：

1. 在 `AlembicPlugin` 中新增 `vendor/AlembicDashboard`，远端指向 `https://github.com/GxFn/AlembicDashboard.git`。
2. 不要把 `AlembicDashboard` 源码复制进 `dashboard/`。
3. `.gitignore` 确保：

   ```text
   dashboard/dist/
   vendor/AlembicDashboard/dist/
   vendor/AlembicDashboard/node_modules/
   plugins/alembic-codex/runtime/dashboard/dist/
   ```

4. 提交只包含子仓库指针、ignore 和必要脚本。

### 阶段 P2：改造插件 Dashboard 构建链路

负责窗口：AlembicPlugin 窗口。

任务：

1. 新增 `scripts/build-dashboard.mjs` 或等价脚本，职责与 Alembic 主仓库一致：

   - 构建 `vendor/AlembicDashboard`。
   - 复制 `vendor/AlembicDashboard/dist` 到本仓库 `dashboard/dist`。
   - 验证 `dashboard/dist/index.html`。

2. 修改 `package.json`：

   ```text
   "build:dashboard": "node scripts/build-dashboard.mjs"
   ```

3. 更新这些脚本的 Dashboard 假设：

   - `scripts/prepare-codex-plugin-runtime.mjs`：继续从本仓库 `dashboard/dist` 复制到 runtime，不直接从 vendor 复制，保持 runtime 打包入口稳定。
   - `scripts/dev-watch-codex-plugin.mjs`：watch 源码路径从 `dashboard/src` 改为 `vendor/AlembicDashboard/src` 和必要配置文件。
   - `scripts/dev-verify-codex-plugin.mjs`：继续调用 `npm run build:dashboard`，不要直接进入旧 `dashboard`。
   - `scripts/release-codex-plugin.mjs`：继续以 `npm run build:dashboard` 和 `dashboard/dist/index.html` 作为验证点。
   - `scripts/smoke-codex-plugin.mjs`：保留 `dashboard/dist/index.html` 和 runtime `dashboard/dist/index.html` 的 smoke 检查。

4. 保留 `package.json.files` 中的 `dashboard/dist`。

必须运行：

```text
npm run build:dashboard
npm run build:check
npm run prepare:codex-plugin-runtime
```

### 阶段 P3：删除插件仓库旧前端源码

负责窗口：AlembicPlugin 窗口。

前置条件：

- P1-P2 已通过。
- `plugins/alembic-codex/runtime/dashboard/dist/index.html` 可由 prepare runtime 生成。

删除候选：

```text
dashboard/index.html
dashboard/package.json
dashboard/package-lock.json
dashboard/postcss.config.cjs
dashboard/public/
dashboard/src/
dashboard/tailwind.config.cjs
dashboard/tsconfig.json
dashboard/tsconfig.node.json
dashboard/vite.config.ts
```

不得删除：

```text
dashboard/dist/                                # generated, ignored
plugins/alembic-codex/runtime/dashboard/dist/  # generated runtime asset
```

必须运行：

```text
npm run build:dashboard
npm run build:check
npm run prepare:codex-plugin-runtime
npm run verify:codex-plugin
```

如果 `verify:codex-plugin` 太重，可以先运行 focused 验证，但最终收尾前必须跑完整插件验证。

提交建议：

```text
chore: consume shared dashboard build
chore: remove local dashboard source
```

## 7. 插件差异兼容审计清单

Dashboard 窗口必须对这些文件给出明确结论。默认以主仓库版本为准；插件差异只用于判断 AlembicPlugin 窗口是否需要补齐 API 或运行时配置。

| 文件 | 必查点 |
| --- | --- |
| `src/App.tsx` | AI tab、Wiki tab、SignalCollector 轮询、Skills badge、默认 fallback view |
| `src/api.ts` | SSE chat、`Job.source`、LLM config endpoint、test-mode sandbox 字段、后端兼容 |
| `src/components/Layout/CommandPalette.tsx` | 新 tab、命令入口、插件 surface 文案 |
| `src/components/Layout/Header.tsx` | AI/LLM 状态、按钮和权限展示 |
| `src/components/Layout/Sidebar.tsx` | AI/Wiki/Signals/Skills badge 导航 |
| `src/components/Modals/LlmConfigModal.tsx` | env/workspace config endpoint 兼容 |
| `src/components/Shared/GlobalChatDrawer.tsx` | 全局聊天抽屉、stream 和 abort 行为 |
| `src/components/Views/CandidatesView.tsx` | enrich/refine/publish flow 是否与两个后端一致 |
| `src/components/Views/HelpView.tsx` | 主仓库和插件文案是否需要 surface 配置 |
| `src/components/Views/SkillsView.tsx` | Signal suggestion count 和 plugin skill 文案 |
| `src/constants/index.ts` | `validTabs` 是否包含 `ai`、`wiki`，是否影响 plugin |
| `src/i18n/locales/en.ts` | 新 tab、新文案和插件文案 |
| `src/i18n/locales/zh.ts` | 新 tab、新文案和插件文案 |

如果某个后端接口只存在于主仓库，Dashboard 不应删除 UI，也不应回退成插件旧 UI。插件窗口需要补齐 API 或返回兼容字段。Dashboard 只在不影响主仓库完整功能的前提下做兼容降级：

- API 404/501：显示不可用状态或隐藏对应动作。
- 字段缺失：使用默认值并保留 loading/error 状态。
- 权限不足：显示禁用态和后端返回原因。

## 8. 外层接入验收清单

Alembic 窗口完成后必须满足：

```text
npm run build:dashboard
npm run build:check
npm run build
test -f dashboard/dist/index.html
```

并确认：

- `dashboard/src` 已不存在。
- `dashboard/package.json` 已不存在。
- `bin/daemon-server.ts` 仍可挂载 `dashboard/dist`。
- `bin/cli.ts ui` 在 dev/release 场景都有明确路径。
- `package.json.files` 仍包含 `dashboard/dist`。

AlembicPlugin 窗口完成后必须满足：

```text
npm run build:dashboard
npm run build:check
npm run prepare:codex-plugin-runtime
test -f dashboard/dist/index.html
test -f plugins/alembic-codex/runtime/dashboard/dist/index.html
```

并确认：

- `dashboard/src` 已不存在。
- `dashboard/package.json` 已不存在。
- `scripts/prepare-codex-plugin-runtime.mjs` 仍复制 `dashboard/dist`。
- `scripts/dev-watch-codex-plugin.mjs` watch 的是 `vendor/AlembicDashboard`。
- `verify:codex-plugin` 或最终 release 验证仍检查 runtime Dashboard。

## 9. 删除计划模板

两个外层窗口在删除旧前端源码前，必须在自己的执行记录里填写：

```text
仓库：
Dashboard subrepo commit：
接入提交：
build:dashboard 结果：
build:check 结果：
runtime/package dist 验证：
准备删除路径：
确认不删除路径：
回滚方式：
```

推荐回滚方式：

- 删除阶段只包含旧源码删除，不混入脚本重构。
- 如果删除后失败，直接 revert 删除提交，保留前一阶段接入提交继续修。

## 10. 收尾任务

全部窗口完成后：

1. Dashboard 窗口记录最终源代码 commit。
2. Alembic / AlembicPlugin 窗口记录各自 `vendor/AlembicDashboard` 指针。
3. 更新 workspace docs 中的后续报告，列出：

   - 删除了哪些旧前端源码。
   - 哪些脚本改为消费 `vendor/AlembicDashboard`。
   - 哪些 smoke / release 检查通过。
   - 是否仍存在 Dashboard 相关重复资源。

4. 后续所有 Dashboard 功能修复都先进入 `AlembicDashboard`，再由外层仓库更新 subrepo 指针。

## 11. 禁止事项速查

- 禁止把 `AlembicDashboard` 变成空 React 壳。
- 禁止用 `AlembicPlugin/dashboard` 覆盖主仓库 Dashboard 权威源码。
- 禁止外层直接 import `vendor/AlembicDashboard/src/**`。
- 禁止把 Vite、React、前端组件放回 `Alembic` 或 `AlembicPlugin`。
- 禁止把 HTTP route、tool、agent、AI provider 放进 `AlembicDashboard`。
- 禁止提交 `dist`、`dashboard/dist`、`node_modules`、runtime 生成产物。
- 禁止在长期文档和配置里写个人绝对路径。
- 禁止在接入验证前删除旧源码。
