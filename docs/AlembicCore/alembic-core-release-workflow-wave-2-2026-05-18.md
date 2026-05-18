# AlembicCore Release Workflow Wave 2

日期：2026-05-18

状态：已完成

执行窗口：`AlembicCore`

## 目标

补齐 `@alembic/core` 的 release workflow / playbook，使 Core 能作为下游 registry dependency 的源头，同时保留既有 `release:check` package readiness guard。

本轮只处理 Core，不改动 `AlembicAgent`、`Alembic`、`AlembicPlugin` 或 `AlembicDashboard`。

## 完成范围

- 新增 `.github/workflows/release.yml`：
  - `workflow_dispatch`：手动 dry-run release staging，只跑检查、构建、smoke、release readiness 和 pack preview，不发布。
  - `push` tag `v*`：真实发布入口；要求 tag 必须等于 `v${package.version}`。
  - 发布前运行 `npm run check`、`npm run build`、`npm run smoke:public-api`、`npm run release:check`。
  - 生成 `npm pack --dry-run --json` preview，写入 GitHub step summary，并上传 `alembic-core-pack-dry-run` artifact。
  - tag 发布时使用 `npm publish --access public --provenance`，依赖 `NPM_TOKEN` 和 GitHub OIDC。
- 新增 `RELEASE-PLAYBOOK.md`：
  - 明确 `@alembic/core` 是 release chain 第一 registry package。
  - 明确 npm registry、tag 格式、source commit evidence、pack contents evidence、NPM token、provenance/OIDC 和下游顺序。
  - 明确 dry-run staging 与真实 publish 流程。
- 更新 `README.md`：
  - 移除旧的“small/minimal first split”口径。
  - 补齐当前 Core 能力范围和 release guard 入口。
- 更新 `package.json` 和 `scripts/check-release-readiness.mjs`：
  - 将 `RELEASE-PLAYBOOK.md` 纳入 npm pack `files`。
  - `release:check` 要求 pack output 中包含 `package/RELEASE-PLAYBOOK.md`。

## 提交

- 提交 hash：`9174c5173a7313b916b89b7c605ea2afdd874269`
- 提交信息：`chore: add core release workflow`

## 验证命令

- `node -e "const fs=require('fs'); const yaml=require('js-yaml'); for (const f of ['.github/workflows/ci.yml','.github/workflows/release.yml']) { yaml.load(fs.readFileSync(f,'utf8')); console.log(f + ' OK'); }"`
- `npm run check`
- `npm run build`
- `npm run smoke:public-api`
- `npm run release:check`
- `npm --cache <writable-temp-cache> pack --dry-run --json`
- `git status --short`
- `git ls-files dist | wc -l`

## 验证结果

- Workflow YAML parse：通过，`.github/workflows/ci.yml OK`、`.github/workflows/release.yml OK`。
- `npm run check`：通过；public API boundary 136 exports classified，75 exact / 61 wildcard，stable 17 / provisional 21 / transitional 98；60 test files / 919 tests 通过；仍有既有测试输出 `error: Could not access 'HEAD'` 和 `[TestMode] bootstrap dimension filter: arch (1/2)`，不影响通过。
- `npm run build`：通过。
- `npm run smoke:public-api`：通过，75 exact public API entrypoints imported。
- `npm run release:check`：提交后通过；`@alembic/core@0.1.0`，source commit `9174c5173a7313b916b89b7c605ea2afdd874269`，pack entries 717，unpackedSize 22481421，working tree dirty `no`。
- `npm --cache <writable-temp-cache> pack --dry-run --json`：通过；pack entries 717，包含 `README.md`、`RELEASE-PLAYBOOK.md`、`config/public-api-boundary.json`、`dist/**`、`resources/**` 和 release/public API 脚本。
- `git status --short`：干净。
- `git ls-files dist | wc -l`：`0`，确认 `dist/` 未被提交。

## 遗留风险

- Core release workflow 已具备真实 tag publish 入口，但本轮没有执行真实 npm publish；registry 是否已有 `@alembic/core@0.1.0` 仍需后续 release 时确认。
- 真实 publish 依赖 GitHub secret `NPM_TOKEN`、npm package 权限和 OIDC provenance 配置；这些需要在 GitHub 仓库环境中验证。
- 当前版本仍为 `0.1.0`。如果 registry 已存在同版本，真实发布前需要按 semver 升版本再打 tag。
- Wildcard exports 仍属于 transitional/internal migration surface，下游新 staging manifest 应优先依赖 stable exact exports。

## 下一步建议

1. `AlembicAgent` 可以继续 Wave 2 staging manifest：开发 manifest 保持 `file:../AlembicCore`，staging manifest 使用 registry `@alembic/core` 版本，并记录 Core source commit `9174c5173a7313b916b89b7c605ea2afdd874269`。
2. `Alembic` 的 `alembic-ai` staging manifest 应在 Core / Agent registry 版本确定后再解除 root hard gate。
3. `AlembicPlugin` 继续退出 root npm publish，只保留 Codex plugin artifact / portable runtime artifact；embedded runtime `file:vendor/AlembicCore` 例外继续保留并记录 source metadata。
