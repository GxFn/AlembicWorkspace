# AlembicPlugin Release Portable Runtime Boundary

日期：2026-05-18
窗口：AlembicPlugin
状态：已完成

来源总控文档：`docs/workspace/alembic-release-portable-snapshot-closeout-workspace-plan-2026-05-18.md`

## 完成范围

- 保留 AlembicPlugin root 日常开发入口：`@alembic/core: file:../AlembicCore`。
- 保留 Codex embedded runtime 便携入口：`plugins/alembic-codex/runtime/package.json` 中 `@alembic/core: file:vendor/AlembicCore`。
- 新增 `scripts/verify-release-package-boundary.mjs`，在普通验证模式下确认 root local-source-first、runtime portable dependency、runtime Core source metadata 和 root publish blocked 状态；在 `--publish` 模式下阻断 root package 中的 `file:../AlembicCore` 发布泄漏。
- 新增 `verify:release-package-boundary` 与 `release:package-boundary:publish` scripts，并让 `prepublishOnly` 先运行 publish boundary gate 再运行 `release:codex-plugin`。
- 强化 `scripts/verify-codex-plugin.mjs`，要求 embedded runtime 存在 `vendor/AlembicCore/.alembic-source.json`，并校验 source、40 位 commit、`packageDependency=file:vendor/AlembicCore`。
- 更新 `.github/workflows/ci.yml`，远程 CI 显式 checkout `AlembicPlugin`、`AlembicCore`、`AlembicDashboard` sibling layout，并在 `AlembicPlugin` 目录内运行 root 命令。
- 更新 `.github/workflows/release.yml`，release workflow 显式 checkout sibling Core / Dashboard，安装 sibling 依赖，并在 `npm publish` 前运行 `release:package-boundary:publish`；当前 root package 未做 staging manifest 前不会触达 publish。
- 更新 `plugins/alembic-codex/RELEASE-PLAYBOOK.md`，删除旧 monorepo 口径，补充 local-source-first、portable runtime snapshot、source metadata 和 root publish hard gate 规则。
- 重新生成 `plugins/alembic-codex/runtime` 与 `runtime.tgz`，portable Core snapshot 来源为 `../AlembicCore @ abcf84f27d23cae0fbefbb4d7a327f5aae7f1caf`。

## 提交 Hash

| 范围 | 提交 |
| --- | --- |
| AlembicPlugin 外层 | `3a5a4921398269e7a53c233d200acba8bf6a1f5a` |
| `plugins/alembic-codex` runtime 快照 | `7544898b5d5ac6f0128fb80f292bfada29d23521` |
| embedded Core 来源 | `abcf84f27d23cae0fbefbb4d7a327f5aae7f1caf` |

## 验证命令与结果

| 命令 | 结果 |
| --- | --- |
| `node --check scripts/verify-release-package-boundary.mjs` | 通过。 |
| `node --check scripts/verify-codex-plugin.mjs` | 通过。 |
| `npm run verify:release-package-boundary` | 通过；确认 root package `alembic-ai@0.1.2` 仍有 `@alembic/core=file:../AlembicCore`，`rootPublishBlocked=true`，embedded runtime Core dependency 为 `file:vendor/AlembicCore`，source metadata 指向 `abcf84f27d23cae0fbefbb4d7a327f5aae7f1caf`。 |
| `node scripts/verify-release-package-boundary.mjs --publish` | 预期失败；阻断 root package 发布泄漏 `dependencies.@alembic/core: file:../AlembicCore`，并提示等待 Core package baseline / staging manifest。 |
| `npm run build:check` | 通过；Core build 使用 `../AlembicCore @ abcf84f27d23cae0fbefbb4d7a327f5aae7f1caf`。 |
| `npm run prepare:codex-plugin-runtime` | 通过；刷新 runtime 与 `runtime.tgz`。 |
| `npm run verify:codex-channel` | 通过。 |
| `npm run verify:codex-plugin` | 通过；新增 `.alembic-source.json` metadata 检查已纳入。 |
| `npm run check` | 通过；Biome 仍输出既有 warning/info，但 exit code 为 0；Core import boundary 扫描 320 files / 517 Core imports。 |
| `HUSKY=0 npm_config_cache=<writable-temp-cache> npm pack --dry-run --ignore-scripts` | 通过；package preview 生成 `alembic-ai-0.1.2.tgz`，package size 25.1 MB，total files 1317。 |
| `npm run smoke:codex-plugin` | 通过；install、stdio、npxRuntime 通过；recovery 与 daemon smoke 按脚本条件跳过。 |
| `git diff --check` | 通过。 |
| `git -C plugins/alembic-codex diff --check` | 通过。 |

## 残留扫描结果

- `file:../AlembicCore`：仅保留在 root `package.json` / `package-lock.json` 作为本地开发入口，并被 release boundary guard 识别为 root publish blocked。
- `file:vendor/AlembicCore`：保留在 embedded runtime、runtime metadata 校验、runtime preparation 和 smoke 脚本中，属于 portable runtime 允许例外。
- `.alembic-source.json`：已纳入 runtime 文件检查、runtime tarball 和 release package boundary 检查。
- CI / release workflow：已显式 checkout sibling `AlembicCore` 和 `AlembicDashboard`，不回退到 vendor 日常入口。

## 遗留风险

- AlembicPlugin root package 当前仍不是 publish-ready；`release:package-boundary:publish` 会在 root package 仍含 `file:../AlembicCore` 时阻断发布。解除 hard gate 需要 Core registry package baseline 和 publish staging manifest 决策。
- `alembic-ai` 包名仍涉及 Alembic 与 AlembicPlugin 的归属决策；本轮 Plugin 侧通过 root publish hard gate 避免误发。
- 本轮未运行 GitHub Actions，只做本地 workflow 静态改造、构建、验证、pack preview 和 smoke。
- `npm run check` 仍输出既有 Biome warning/info；本轮未处理历史 lint warning。
- 本地普通 `npm pack --dry-run` 在沙箱内会触发 `prepare`/Husky 写 git config，需使用 `HUSKY=0` 与 writable npm cache 进行本地 pack preview；CI 环境使用正常权限，但 publish 仍会被 boundary gate 阻断。

## 下一步建议

- 总控统一复核 Core / Agent / Alembic / AlembicPlugin 的 release boundary 证据。
- 若进入真实发布阶段，先完成 `@alembic/core` registry 发布或 staging manifest 策略，再决定 `alembic-ai` 包名归属与 AlembicPlugin root publish gate 的解除方式。
