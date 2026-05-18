# Alembic AI Publish Staging Wave 2

日期：2026-05-18
窗口：Alembic
状态：已完成
总控文档：`docs/workspace/alembic-release-portable-snapshot-closeout-acceptance-publish-staging-wave-2-plan-2026-05-18.md`

## 提交

- Alembic 提交：`7f68d43e019db597c52a5a36d64d68d6dfbc6bcf`（`chore: stage alembic npm publish package`）

## 完成范围

- 保留 Alembic root dev manifest 的 local-source-first 入口：
  - `@alembic/core: file:../AlembicCore`
  - `@alembic/agent: file:../AlembicAgent`
- 新增 `scripts/prepare-publish-staging.mjs`，生成 `.release/alembic-ai/` publish staging package。
- 新增 `release:staging:prepare` / `release:staging:pack`：
  - staging manifest 将 `@alembic/core` 替换为 registry version `0.1.0`。
  - staging manifest 将 `@alembic/agent` 替换为 registry version `0.1.0`。
  - staging package 写入 `alembic-release-source.json`，记录 Alembic / Core / Agent / Dashboard source commits。
  - staging manifest 移除 `prepare` 等 lifecycle script，pack preview 使用 repository-local npm cache 并 `--ignore-scripts`。
- 更新 root release package guard：`alembic-ai` 包名归属已按总控决策属于 Alembic；guard 继续阻断 root dev package 的 `file:../...` 与 `file:vendor/...` 发布泄漏。
- 更新 `.github/workflows/release.yml`：
  - release workflow 先确认 dev root package 仍被 hard gate 阻断。
  - 生成并预览 `.release/alembic-ai` staging package。
  - npm publish 改为发布 `.release/alembic-ai`，不直接发布 dev root。
- 更新 `scripts/release.ts`：
  - 本地 release check / release helper 以“dev root blocked + staging pack preview passed”为 release package 边界。
  - 版本 bump 后重新跑 staging pack preview，避免本地 release helper 创建未预览的新版本 tag。
- 新增 `.release/` ignore，避免 staging artifact 进入源码提交。

## Source Commit Evidence

提交后重新生成的 staging metadata：

| Source | Commit / Version |
| --- | --- |
| Alembic | `7f68d43e019db597c52a5a36d64d68d6dfbc6bcf` |
| AlembicCore | `9174c5173a7313b916b89b7c605ea2afdd874269` / `@alembic/core@0.1.0` |
| AlembicAgent | `f9d020f9ebaf95499bbd6e9afbdecafa0615a865` / `@alembic/agent@0.1.0` |
| AlembicDashboard | `7143a7ca610a504b7472ae4afac0eb2df2ebdda8` |

`alembic-release-source.json` 中 `Alembic.dirty` 为 `false`。

## 验证命令与结果

| 命令 | 结果 |
| --- | --- |
| `npm run build:check` | 通过；使用 local `../AlembicCore` source。 |
| `npm run check` | 通过；Biome 仍输出既有 warning/info，exit code 为 0；Core import boundary 扫描 455 files / 598 imports，issue 0。 |
| `npm run build` | 通过；重新生成 `dist/`，确保 release helper 更新进入 pack preview。 |
| `npm run release:package-guard` | 预期失败；阻断 root `@alembic/core=file:../AlembicCore`、`@alembic/agent=file:../AlembicAgent` 和 root lockfile local links。 |
| `npm run release:staging:pack` | 通过；生成 `.release/alembic-ai` staging package 并执行 `npm pack --dry-run --json --ignore-scripts`，pack preview 为 `alembic-ai@0.1.0`，entryCount 525。 |
| `node -e "yaml.parse(...)"` | 通过；`.github/workflows/release.yml` 可解析。 |
| `rg -n "npm publish\|npm pack --dry-run\|ALEMBIC_MAIN_NPM_PACKAGE_OWNER_CONFIRMED\|file:\.\./Alembic(Core\|Agent)\|file:vendor" package.json package-lock.json scripts .github/workflows` | 通过；root dev file deps 仍只在 package/lockfile 和 boundary scripts 中出现；唯一 workflow publish 入口为 `npm publish .release/alembic-ai ...`；旧 owner env gate 已清除。 |
| `git diff --check` / `git diff --cached --check` | 通过。 |

## 遗留风险

- 本轮没有真实 npm publish；真实发布仍依赖 `@alembic/core@0.1.0` 和 `@alembic/agent@0.1.0` 已在 registry 可安装、npm token / trusted publishing 权限、版本唯一性和 release tag 策略。
- 当前 `alembic-ai` 版本仍为 `0.1.0`；如果 registry 已有同版本，发布前需要升版本。
- Release workflow 仍 checkout sibling 默认分支；当前 staging metadata 会记录实际 source commits，但严格 release snapshot 如需锁定上游，应在 release orchestration 中 pin ref。
- `npm run check` 仍打印既有 Biome warning/info，本轮未处理历史 lint warning。
- `release:staging:pack` 依赖已存在的 `dist/` 和 `dashboard/dist/`，正式 workflow 已在 staging 前执行 build；本地手动 preview 前也应先运行 build。

## 下一步建议

- 总控可等待 `AlembicPlugin` 完成 artifact-only release / root npm publish exit 后，统一复核 Wave 2。
- 进入真实发布前，先按顺序确认 `@alembic/core`、`@alembic/agent` registry 包可安装，再发布 Alembic 主仓库 `alembic-ai` staging package。
- 若后续需要可复现 release snapshot，给 Core / Agent / Dashboard checkout ref 增加显式 pin 或由 release orchestration 注入 source commit。
