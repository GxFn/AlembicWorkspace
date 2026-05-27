# AlembicPlugin SFC-R1 Repair Wave

日期：2026-05-23
窗口：AlembicPlugin
任务包：SFC-R1-PLUGIN
状态：已完成，待总控验收
提交 hash：`cc944f22492cabadb2a67a7b11e007ad817ee684`

## 窗口定位

当前窗口是 `AlembicPlugin` 执行窗口。目标仓库职责是 Codex MCP、Skill、channel / marketplace、插件 runtime、安装验证和 Codex host adapter。

本轮只修当前总控文档列为 `待修复` 的 `SFC-PLUGIN-001`、`SFC-PLUGIN-002`、`SFC-PLUGIN-003`；不处理 `SFC-PLUGIN-004` shipped `config/default.json` AI 字段和 `SFC-PLUGIN-005` real-project 采集脚本 / fixture 归属，不操作 BiliDili。

## 完成范围

- `SFC-PLUGIN-001`：修复 Plugin lint 失败项。
  - `lib/bootstrap.ts` 增加显式 `requireBootstrapComponent()`，用 fail-fast 依赖断言替代非空断言，避免用可选链吞掉初始化顺序错误。
  - `lib/bootstrap.ts` 将初始化失败输出改为 `process.stderr.write`。
  - `lib/cli/SetupService.ts` 用类内 `writeLine()` / `writeError()` 替代 `printSummary()` 内直接 `console.log/error`。
  - 运行 `npm run lint:fix` 应用 Biome 安全格式 / import 修复，涉及 import 排序和格式文件。
- `SFC-PLUGIN-002`：收敛 root generic release 入口语义。
  - `package.json` 中 `release:patch` / `release:minor` / `release:major` 改为 fail-closed 到 `release:root-npm-publish:disabled`。
  - `scripts/release.ts` 改为 check-only / artifact-only 口径，删除旧 root package 版本提交 / tag 推送流程；直接调用 `patch|minor|major` 会提示使用 Codex plugin artifact / channel release。
  - `scripts/verify-release-package-boundary.mjs` 增加旧 release alias 必须 fail-closed 的断言。
- `SFC-PLUGIN-003`：修正 `SetupService.stepVectorIndex()` vector / provider 文案。
  - 明确 embedded runtime 不持有可执行 embedding provider。
  - 明确 baseline / hybrid search 继续可用，语义增强由 Alembic resident service / resident search 提供。
  - 移除“在插件宿主配置 embedding provider / API Key”的可见提示。

## 未处理项理由

- `SFC-PLUGIN-004` 未处理：总控文档状态为 `待确认`，本波不删除、置空或改名 shipped `config/default.json` 的 AI 字段。
- `SFC-PLUGIN-005` 未处理：总控文档状态为 `待确认`，本波不迁移 / 删除 real-project 采集脚本或 tracked fixture。
- 未刷新本机 Codex 插件缓存：总控文档明确本波不刷新本机 Codex 插件缓存。
- 未生成新的 portable runtime artifact：本波验证命令未要求产物刷新；release workflow / `release:codex-plugin` 会在发布封口时 build 并 prepare runtime artifact。

## 验证命令与结果

| 命令 | 结果 | 摘要 |
| --- | --- | --- |
| `npm run lint` | 通过 | 命令退出 0；仍输出既有 warning / info，但不再失败。 |
| `npm run lint -- --diagnostic-level=error` | 通过 | Checked 183 files，No fixes applied。 |
| `npm run build:check` | 通过 | Core build 使用 `../AlembicCore @ 69bda3ff6ac413ac1fc318253a840986660a4386`，`tsc --noEmit` 通过。 |
| `npm run verify:release-package-boundary` | 通过 | root package private，root registry publish disabled，旧 release alias fail-closed 断言通过。 |
| `npm run verify:codex-plugin` | 通过 | Codex plugin verification passed，runtime package 为 `alembic-codex-plugin-runtime@0.2.0`。 |
| `npm run verify:codex-channel` | 通过 | Codex channel verification passed。 |
| `npm run report:agent-extraction-boundary` | 通过 | 扫描 334 个 source files，agent / AI / tool outside implementation 均为 0。 |
| `git diff --check` | 通过 | 无 whitespace error。 |
| `rg -n 'release:patch/minor/major|运行 \`npm run release:patch|在插件宿主中配置 embedding provider|未配置 AI API Key|AI Provider 未配置' ...` | 通过 | 仅剩 `scripts/release.ts` 中 intentional fail-closed 注释；旧 provider / API Key 提示无命中。 |
| `rg -n 'config/default.json|\"ai\"|\"provider\": \"openai\"|real-project-stats|real-project-bench|collect-test-project-stats|bench-real-projects' ...` | 符合预期 | `config/default.json` AI 字段和 real-project 脚本 / fixture 仍保留，作为待确认项未处理。 |

## 遗留风险

- `npm run lint` 仍有既有 warning / info 输出；本波目标是修复失败门禁，未把所有 warning 作为小修范围。
- `plugins/alembic-codex/runtime.tgz` 未在本波刷新；若总控要做发布封口，应另派 release artifact refresh / smoke。
- AlembicCore 当前本地仓库显示 ahead origin 1，但无 dirty files；本波只通过 `build:check` 消费本地 Core build，没有改 Core。

## 下一步建议

- 总控验收本提交后，把 `SFC-PLUGIN-001`、`SFC-PLUGIN-002`、`SFC-PLUGIN-003` 改为已完成或待集成验收。
- `SFC-PLUGIN-004` 和 `SFC-PLUGIN-005` 继续保留为待确认，不应由 Plugin 窗口提前处理。
- 如果后续进入发布封口，再运行 `npm run release:codex-plugin` 或总控指定的 artifact refresh / smoke 流程。
