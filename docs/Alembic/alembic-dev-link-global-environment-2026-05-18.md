# Alembic Dev Link Global Environment

日期：2026-05-18
窗口：Alembic
状态：已完成

## 完成范围

- 新增 `scripts/dev-link.mjs`，将 `npm run dev:link` 升级为一键本地全局开发环境编排。
- 编排顺序覆盖 AlembicCore build、AlembicAgent build、Alembic 主包 build、Dashboard 静态产物构建与复制、全局 `npm install -g .`、全局命令 smoke 和 daemon 进程检测。
- 新增 `build:self`，保留既有 `build = build:core + build:self` 兼容，同时让 `dev:link` 避免重复构建 Core。
- 将 `dev:verify` 改为复用 dev link 脚本的 `--verify-only`，用于检查当前全局 `alembic` / `alembic-mcp` 是否指向本地 Alembic 仓库。
- 支持 `--dry-run`、`--skip-dashboard`、`--skip-install`、`--verify-only`、`--verbose` 和 `--help`。
- 缺依赖时只失败并给出对应 `npm ci` 提示，不自动联网安装；检测到 daemon 时只提示手动重启，不自动停止或杀进程。
- 只读验证 `BiliDili`，未修改 `BiliDili`、`AlembicAgent` 或 `AlembicDashboard` 源码。

## 修改文件

- `package.json`
- `scripts/dev-link.mjs`

## 提交

- Alembic：`c5aa3061fad6346d0e45fa2dbea5ea39baf7d316` (`chore: add global dev link orchestration`)

## 验证命令

```bash
npm run dev:link -- --dry-run --verbose
npm run dev:link -- --skip-install --verbose
npm run dev:link -- --verbose
npm run dev:verify
npm run build:check
npx biome check scripts/dev-link.mjs
npm run lint
npm run check
test -f dashboard/dist/index.html && echo dashboard-dist-ok
alembic ai status --dir ../BiliDili
alembic daemon status --dir ../BiliDili --json
git diff --check
git status --short
```

## 验证结果

- `npm run dev:link -- --dry-run --verbose`：通过，完整打印 Core、Agent、Alembic、Dashboard、global install、global smoke 和 daemon 检测步骤。
- `npm run dev:link -- --skip-install --verbose`：通过，完成本地 Core、Agent、Alembic 主包和 Dashboard 静态产物构建，跳过全局安装。
- `npm run dev:link -- --verbose`：通过，完成全局安装；`alembic`、`alembic-mcp` 和全局 `alembic-ai` package 均指向当前 Alembic 仓库；`alembic --version` 输出 `0.1.0`；未检测到正在运行的 Alembic daemon。
- `npm run dev:verify`：通过，复核全局命令和全局 package 指向当前 Alembic 仓库；未检测到正在运行的 Alembic daemon。
- `npm run build:check`：通过。
- `npx biome check scripts/dev-link.mjs`：通过。
- `test -f dashboard/dist/index.html && echo dashboard-dist-ok`：通过，Dashboard 静态入口存在。
- `alembic ai status --dir ../BiliDili`：通过，只读返回 BiliDili 当前 AI provider / source 未配置，未要求修改项目。
- `alembic daemon status --dir ../BiliDili --json`：通过，只读返回 BiliDili daemon `stopped` / `ready=false`。
- `git diff --check`：通过。
- `git status --short`：Alembic 仓库干净；AlembicAgent、AlembicDashboard、BiliDili 状态检查均无输出。
- `npm run lint`：未通过，仍命中既有 lint debt：`lib/bootstrap.ts`、`lib/cli/AiScanService.ts`、`lib/cli/deploy/FileManifest.ts`、`scripts/verify-context-api.ts`，共 14 errors / 295 warnings / 25 infos。本轮新增脚本已单独通过 Biome 检查。
- `npm run check`：未通过；typecheck 通过后被上述既有 `npm run lint` 问题阻断。

## 边界说明

- 未发布 npm，未触碰 release staging。
- 未修改 `AlembicPlugin`、Codex plugin runtime、channel、marketplace 或 plugin cache。
- 未修改 `BiliDili`；仅作为全局命令只读 smoke 目标。
- 未自动杀 daemon；本次验证未检测到正在运行的 Alembic daemon，因此无需手动重启。
- 计划中的 smoke 建议写过 `alembic -v`，实际 CLI 支持的是 `alembic --version` / `alembic -V`，脚本已使用 `alembic --version`。

## 遗留风险

- `npm run lint` 和 `npm run check` 仍受既有 lint debt 阻断；本轮没有扩大这些错误。
- 全局 `dev:link` 会更新本机全局 npm package 指向当前 Alembic 仓库；如果未来有 daemon 正在运行，仍需要用户手动重启以加载新构建。
- Dashboard build 仍会输出既有 Vite chunk size warning；静态产物已生成，不阻断本轮目标。

## 下一步建议

- 总控可将本轮标记为已完成；当前不需要向 AlembicCore、AlembicAgent、AlembicDashboard、AlembicPlugin 或 BiliDili 发送任务。
- 若后续需要统一 Plugin 自身的开发链接体验，应另开 AlembicPlugin 专项计划，不混入 Alembic 主包 `dev:link`。
- 既有 lint debt 建议单独开清理波处理。
