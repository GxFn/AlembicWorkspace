# Alembic Dev Link Global Environment Workspace Plan

更新日期：2026-05-18
总控窗口：AlembicWorkspace
状态：已完成

## 目标

让 `Alembic` 仓库内执行 `npm run dev:link` 时，能够直接更新本机全局 Alembic 开发环境，使全局 `alembic` / `alembic-mcp` 使用当前 workspace 的本地构建结果。

这不是发布流程，也不是 Codex plugin 流程。本轮只解决 Alembic 主包的本地全局 CLI / MCP / Dashboard 静态资源联调体验。

## 真实代码判断

- 当前 `Alembic/package.json` 的 `dev:link` 只是 `npm run build && npm install -g .`。
- 当前 `npm run build` 会先执行 `build:core`，因此能构建 `AlembicCore`，但不会主动构建 `AlembicAgent`。
- `AlembicAgent` 的 package exports 指向 `dist/**`，如果 Agent 刚改过而未 build，Alembic 全局安装后的运行期可能仍读取旧的 Agent dist。
- `AlembicDashboard` 已是独立仓库；Alembic 的 Dashboard 静态产物需要通过 `npm run build:dashboard` 从本地 `../AlembicDashboard` 或 fallback source 构建并复制到 `Alembic/dashboard/dist`。
- `npm install -g .` 只更新全局 npm bin / package 解析；已经运行中的 daemon 进程不会被这一步静默热替换。

## 本轮原则

- 默认一键命令要覆盖本地开发最常见需求：Core、Agent、Alembic 主包、Dashboard 静态资源和全局安装。
- 不自动执行 `npm ci` 或联网安装依赖；缺依赖时给出明确命令和失败原因。
- 不自动停止或杀掉已有 daemon，避免破坏正在测试的真实项目；但要检测并提示旧进程需要重启。
- 不触碰 `AlembicPlugin` 的 Codex plugin runtime、channel、marketplace 或插件缓存同步。
- 不修改 `BiliDili`；它只可作为执行后的真实项目只读验证目标。

## 阶段计划

### Phase 1：Alembic 实现 dev:link 编排

执行窗口：`Alembic`

在 `Alembic` 仓库新增或调整 dev link 编排脚本，建议落点：

- `scripts/dev-link.mjs`
- `package.json` 的 `dev:link`
- 如需避免重复构建 Core，可新增 `build:self`，让 `build` 继续保持兼容：`build = build:core + build:self`
- 如需增强验证，可调整 `dev:verify` 或新增 `dev:verify:global`

默认执行顺序建议为：

1. 预检 Node 版本、workspace 本地源码、必要 `node_modules` 和 package scripts。
2. 构建 `AlembicCore`：使用现有 `npm run build:core` 或等价本地源码 resolver。
3. 构建 `AlembicAgent`：当 `../AlembicAgent` 存在时执行 `npm --prefix ../AlembicAgent run build`。
4. 构建 `Alembic` 主包：清理并生成 `dist/**`，确保 `bin` 产物带 shebang。
5. 构建并复制 Dashboard 静态资源：默认执行 `npm run build:dashboard`，使用本地 `../AlembicDashboard` 优先。
6. 执行 `npm install -g .` 更新全局 `alembic` / `alembic-mcp`。
7. 运行全局 smoke：至少覆盖 `which alembic`、`alembic --version`，并确认全局命令入口来自本轮安装。
8. 检测已有 daemon 状态；只提示重启，不自动杀进程。

可选参数建议：

- `--skip-dashboard`：只更新 CLI / MCP，不重建 Dashboard 静态资源。
- `--skip-install`：只构建，不写全局 npm 安装。
- `--dry-run`：打印将执行的步骤，不写文件、不安装。
- `--verbose`：显示每个子命令、cwd 和耗时。

### Phase 2：全局环境验收

执行窗口：`Alembic`

验收需要证明：

- 单次 `npm run dev:link` 能完成本地 Core、Agent、Alembic、Dashboard 和全局安装。
- 全局 `alembic` 与 `alembic-mcp` 使用最新构建产物。
- Dashboard 静态资源存在并来自当前本地 Dashboard 构建。
- 缺少 `AlembicAgent` 或 `AlembicDashboard` 依赖时，失败信息可读，不产生半成功误判。
- 已运行 daemon 不会被静默杀掉；脚本会提醒需要重启。

建议验证命令：

```bash
npm run dev:link -- --dry-run
npm run dev:link
npm run dev:verify
npm run build:check
npm run lint
git diff --check
```

真实项目只读 smoke：

```bash
alembic ai status --dir ../BiliDili
alembic daemon status --dir ../BiliDili --json
```

如果 `BiliDili` 未初始化 Alembic workspace，记录实际输出即可，不要求修改 `BiliDili`。

### Phase 3：回填和后续判断

执行窗口：`Alembic`

完成后回填：

- 实现范围。
- 修改文件。
- 提交 hash。
- 验证命令和结果。
- 是否仍需要手动重启 daemon。
- 是否需要把同类 dev link 编排经验同步给 `AlembicPlugin`。本轮默认不直接改 Plugin。

## 窗口分派

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>已完成 | 已实现 `npm run dev:link` 一键构建并更新本地全局 Alembic 开发环境；覆盖 Core、Agent、Dashboard、Alembic 主包和全局 smoke。 |
| `AlembicCore`<br>观察中 | 本轮不改 Core 源码；作为 `dev:link` 构建输入，由 Alembic 脚本调用现有 build。 |
| `AlembicAgent`<br>观察中 | 本轮不改 Agent 源码；Alembic 需要在 dev link 中主动构建本地 Agent dist。若发现 Agent package 缺少必要脚本，再回报总控。 |
| `AlembicDashboard`<br>观察中 | 本轮不改 Dashboard 源码；Alembic 需要在 dev link 中主动构建并复制 Dashboard 静态产物。若发现 Dashboard build 契约不足，再回报总控。 |
| `AlembicPlugin`<br>无任务 | 本轮不涉及 Codex plugin runtime、channel、marketplace、plugin cache 或 `alembic-codex-mcp`。 |
| `BiliDili`<br>观察中 | 只作为 Alembic 全局命令的真实项目只读 smoke 目标；不得修改项目文件。 |

## 分派细节

### Alembic

窗口：`Alembic`
状态：已完成
任务：已实现 `npm run dev:link` 一键更新本地全局 Alembic 环境。
目标：一次命令完成本地依赖构建、主包构建、Dashboard 产物刷新、全局安装和 smoke 验证。
范围：`package.json`、`scripts/dev-link.mjs`、必要的 dev verify 脚本或文档。
禁止事项：不得发布 npm；不得改 Codex plugin；不得自动杀 daemon；不得修改 `BiliDili`；不得把 release staging 逻辑混入 dev link。
验证命令：见 Phase 2。
阻塞/依赖：本地 `../AlembicAgent`、`../AlembicDashboard` 需要已有依赖；缺依赖时只失败提示，不自动安装。
文档动作：新建或更新单仓库执行记录。
保存位置：`docs/Alembic/alembic-dev-link-global-environment-2026-05-18.md`
挂载入口：本文“回填区 / Alembic”。
回填位置：本文“回填区 / Alembic”。
下一步允许启动：否，Alembic 本轮任务已完成并回填。

## 执行顺序

本轮已发送并由 `Alembic` 窗口完成。其它窗口保持观察或无任务，不发送领取提示，避免空转。

`Alembic` 完成并回填后，总控再验收是否需要：

- 增补 `AlembicPlugin` 的独立 dev link 编排。
- 将 dev link 经验沉淀到 workspace 长期契约。
- 为全局 daemon restart 增加独立安全命令。

## 可复制分派提示词

发送给：无，Alembic 本轮已完成；不再生成新的领取提示词。

不发送给：`Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`、`BiliDili`。

## 回填区

### Alembic

- 状态：已完成
- 完成范围：新增 `scripts/dev-link.mjs`，将 `npm run dev:link` 升级为一键编排；覆盖 AlembicCore、AlembicAgent、Alembic 主包、Dashboard 静态产物、全局安装、全局命令 smoke 和 daemon 检测；新增 `build:self`，调整 `dev:verify` 为 `--verify-only`。
- 修改文件：`package.json`、`scripts/dev-link.mjs`；执行记录见 [../Alembic/alembic-dev-link-global-environment-2026-05-18.md](../../../../Alembic/alembic-dev-link-global-environment-2026-05-18.md)。
- 提交 hash：`c5aa3061fad6346d0e45fa2dbea5ea39baf7d316`
- 验证命令：`npm run dev:link -- --dry-run --verbose`；`npm run dev:link -- --skip-install --verbose`；`npm run dev:link -- --verbose`；`npm run dev:verify`；`npm run build:check`；`npx biome check scripts/dev-link.mjs`；`npm run lint`；`npm run check`；`test -f dashboard/dist/index.html && echo dashboard-dist-ok`；`alembic ai status --dir ../BiliDili`；`alembic daemon status --dir ../BiliDili --json`；`git diff --check`；`git status --short`。
- 验证结果：dev link dry-run、skip-install、完整全局安装、dev verify、build:check、脚本 Biome、Dashboard 产物检查、BiliDili 只读 smoke、diff check 均通过；全局 `alembic` / `alembic-mcp` / `alembic-ai` package 指向当前 Alembic 仓库，`alembic --version` 为 `0.1.0`，未检测到正在运行的 Alembic daemon；Alembic、AlembicAgent、AlembicDashboard、BiliDili 状态均干净。`npm run lint` 和 `npm run check` 仍被既有 lint debt 阻断，错误集中在 `lib/bootstrap.ts`、`lib/cli/AiScanService.ts`、`lib/cli/deploy/FileManifest.ts`、`scripts/verify-context-api.ts`。
- 遗留风险：既有 lint debt 未在本轮解决；未来若 daemon 正在运行，`dev:link` 只提示手动重启，不自动杀进程；Dashboard build 仍有既有 Vite chunk size warning。
- 下一步建议：本轮不需要继续派发其它窗口；如需 Plugin 独立 dev link 或既有 lint debt 清理，应另开专项计划。
