# Alembic Release Local Source Package Boundary

日期：2026-05-18
窗口：Alembic
状态：已完成
总控文档：`docs/workspace/alembic-release-portable-snapshot-closeout-workspace-plan-2026-05-18.md`

## 提交

- Alembic 提交：`9813101f40774b9e2122f32e7edb75b4a3e94ffd`（`chore: guard main release package boundary`）

## 完成范围

- 更新 `.github/workflows/ci.yml`，远程 CI 改为显式 checkout sibling layout：
  - `Alembic`
  - `AlembicCore`
  - `AlembicAgent`
  - `AlembicDashboard`
- CI 默认工作目录切到 `Alembic`，通过 `../AlembicCore`、`../AlembicAgent`、`../AlembicDashboard` 复现本地 local-source-first 结构；不把 vendor/submodule 恢复为日常入口。
- CI 安装并构建 sibling Core / Agent；需要 Dashboard 产物的 job 改为安装 `../AlembicDashboard` 依赖并走 `npm run build:dashboard`。
- 更新 `.github/workflows/release.yml`，release workflow 同样显式 checkout sibling Core / Agent / Dashboard，并在日志中记录三个 source commit。
- 新增 `scripts/verify-release-package-boundary.mjs` 和 `npm run release:package-guard`：
  - 阻断 root `package.json` 中的 `file:../...` workspace-local dependency 泄漏到 npm publish。
  - 阻断 root package 使用 `file:vendor/...` dependency；vendor file dependency 只允许 embedded portable runtime 场景，不允许主仓库 root npm package。
  - 检查 root `package-lock.json` 的 workspace-local dependency 元数据。
  - 对 `alembic-ai` 包名与 `AlembicPlugin` 同名发布冲突加硬闸；只有显式设置 `ALEMBIC_MAIN_NPM_PACKAGE_OWNER_CONFIRMED=1` 且依赖已转成 registry staging manifest 后才可能通过。
- 将 release workflow 的 npm publish 前置到 `npm run release:package-guard` 之后；当前 guard 预期失败，publish step 不会触达。
- 更新 `scripts/release.ts`，让本地 `release:check` / `release:patch|minor|major` 同步运行 package boundary guard，防止本地 release helper 继续推进错误 tag。

## 验证命令与结果

| 命令 | 结果 |
| --- | --- |
| `npm run build:check` | 通过；`build:core` 使用 `../AlembicCore`。 |
| `npm run lint:core-import-boundary` | 通过；使用本地 Core scanner，扫描 454 files / 598 Core imports，issue 0。 |
| `npm run lint:agent-extraction-boundary` | 通过；local Agent relative imports 0，local service/runtime/prompts/domain consumers 0。 |
| `npm run check` | 通过；Biome 仍打印既有 warning/info，但 exit code 为 0。 |
| `npm run build` | 通过。 |
| `npm run release:package-guard` | 预期失败；阻断 `@alembic/agent: file:../AlembicAgent`、`@alembic/core: file:../AlembicCore`、lockfile local links，以及 `alembic-ai` 包名归属未确认。 |
| `node -e "yaml.parse(...)"` | 通过；`.github/workflows/ci.yml` 和 `.github/workflows/release.yml` 均可解析。 |
| `rg -n "file:\.\./AlembicCore\|file:\.\./AlembicAgent\|repository: GxFn/Alembic(Core\|Agent\|Dashboard)\|release:package-guard\|npm publish" package.json package-lock.json scripts .github/workflows` | 通过；本地开发依赖仍在 package/lockfile，CI/release 明确 checkout sibling，release workflow 在 publish 前运行 guard。 |
| `git diff --cached --check` | 通过。 |

## Guard 输出摘要

`npm run release:package-guard` 当前应失败，失败项为：

- root `dependencies.@alembic/agent` 使用 `file:../AlembicAgent`。
- root `dependencies.@alembic/core` 使用 `file:../AlembicCore`。
- root lockfile 仍记录 `@alembic/agent` / `@alembic/core` 的 workspace-local dependency。
- root package name `alembic-ai` 与 `AlembicPlugin` 同名，未设置发布归属确认。

这些失败项是本轮 hard gate 的预期结果，用来防止主仓库在 Core / Agent registry package baseline 和 `alembic-ai` 归属未完成前误发布。

## 遗留风险

- Alembic root package 仍不是 publish-ready；发布解除依赖 `@alembic/core`、`@alembic/agent` registry 版本和 `alembic-ai` 包名归属结论。
- GitHub Actions sibling checkout 当前使用各 sibling 仓库默认 ref；如果未来需要精确 release snapshot，必须把 Core / Agent / Dashboard source commit 写入 release staging 元数据或 pin ref。
- `npm run check` 仍输出既有 Biome warning/info，本轮未处理历史 lint warning。
- 本轮未运行 live GitHub Actions，只做了 workflow YAML 解析和本地命令验证。

## 下一步建议

- 等 `AlembicPlugin` 完成 portable runtime verify / playbook / root publish guard 后，由总控统一复核 release / portable snapshot closeout。
- 后续若决定主仓库继续发布 `alembic-ai`，应先完成包名归属决策，再生成 publish staging manifest，把 `file:../AlembicCore` / `file:../AlembicAgent` 转为 registry dependency。
- 若主仓库不再拥有 `alembic-ai` npm 包名，应保留 hard gate，并把 release workflow 调整为只产出内部 artifact / VS Code extension 或改用新的 npm package name。
