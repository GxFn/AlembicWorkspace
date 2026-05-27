# AlembicPlugin SFC-R2 Lint Closeout

日期：2026-05-23
窗口：AlembicPlugin
任务包：SFC-R2-PLUGIN
状态：已完成，待总控验收
提交 hash：`b90b522f059fae47a1c79939dd638594d4bfb4ac`
AlembicCodex runtime artifact 提交：`d64d3d147d3e04a3f2eca0e00582e303bb96f259`
runtime artifact hash：`8f25b2cce9d09fd29db0d26f3c6307072170cb3f456f54d9b3d4df628d282daa`

## 窗口定位

当前窗口是 `AlembicPlugin` 执行窗口。目标仓库职责是 Codex MCP、Skill、channel / marketplace、插件 runtime、安装验证和 Codex host adapter。

本轮只领取 `SFC-R2-PLUGIN`：关闭 Plugin lint warning / info 基线，移除 shipped external AI provider 默认配置，刷新并验证 Codex plugin runtime artifact，对 real-project 资产只做消费方扫描和保留项回填。不刷新本机 Codex plugin cache，不运行真实项目采集，不迁移 / 删除 real-project asset，不操作 BiliDili。

## 完成范围

- `SFC-PLUGIN-001-R`：清理 `npm run lint` warning / info。
  - 移除可安全替换的非空断言、无用 constructor、无用 import、缺 radix、无意义 ternary、脚本 `console.log` diagnostics。
  - 对动态 DI 边界保留 2 处显式 `noExplicitAny` suppressions，并在代码中写明原因：MCP handler container 与 gateway action registry 需要按字符串 key 解析异构服务，收窄为 `unknown` 会破坏现有调用方。
  - `npm run lint -- --max-diagnostics=220` 已从 SFC-R1 的 warning / info 输出收敛为 `No fixes applied`，无 lint diagnostics。
- `SFC-PLUGIN-004`：移除 shipped external AI provider 默认配置。
  - 删除 root `config/default.json` 中的 `ai.provider=openai`、`ai.model=gpt-*`、temperature / maxTokens 默认值。
  - 同步删除 embedded runtime `plugins/alembic-codex/runtime/config/default.json` 中的 `ai` block。
  - `scripts/verify-codex-plugin.mjs` 和 `scripts/verify-release-package-boundary.mjs` 增加断言：root config 与 runtime config 不得 ship `ai` key。
  - 负向扫描和 runtime tarball config 扫描均确认无 shipped AI defaults。
- Codex plugin runtime artifact 已同步。
  - 执行 `npm run build` 和 `npm run prepare:codex-plugin-runtime`。
  - `plugins/alembic-codex/runtime.tgz` 已刷新。
  - embedded Core source metadata 为 `08a47233f4fccd49d6622aaf0bc123ca22925de3`，来源于当前本地 `../AlembicCore`。
- `SFC-PLUGIN-005-B`：完成 real-project asset 前置消费方扫描。
  - 仍命中的 Plugin 侧资产为 `scripts/bench-real-projects.mts`、`scripts/collect-test-project-stats.mts` 及其 fixture 输出路径。
  - 相关 BiliDili / BiliDemo 字符串只存在于 path guard / intent inference / guard handler 测试或路径候选逻辑中，本轮没有操作真实项目。

## 验证命令与结果

| 命令 | 结果 | 摘要 |
| --- | --- | --- |
| `npm run lint -- --max-diagnostics=220` | 通过 | Checked 183 files，No fixes applied；无 warning / info diagnostics。 |
| `npm run lint -- --diagnostic-level=error` | 通过 | error 级 lint 通过。 |
| `npm run build:check` | 通过 | `tsc --noEmit` 通过；Core source 为 `../AlembicCore @ 08a47233f4fccd49d6622aaf0bc123ca22925de3`。 |
| `npm run build` | 通过 | dist 构建和 postbuild 通过。 |
| `npm run prepare:codex-plugin-runtime` | 通过 | embedded runtime、vendor Core snapshot 和 `runtime.tgz` 已刷新。 |
| `npm run verify:release-package-boundary` | 通过 | root registry publish disabled；runtime Core dependency 保持 `file:vendor/AlembicCore`；root/runtime config 均不 ship `ai` key。 |
| `npm run verify:codex-plugin` | 通过 | Codex plugin verification passed。 |
| `npm run verify:codex-channel` | 通过 | Codex channel verification passed。 |
| `npm run report:agent-extraction-boundary` | 通过 | 扫描 334 个 source files，agent / AI / tool outside implementation import counts 均为 0。 |
| `npm run lint:repo-boundary` | 通过 | repo boundary escape hatch count 为 0。 |
| `npm run lint:core-import-boundary` | 通过 | 扫描 334 个文件和 456 个 `@alembic/core` imports。 |
| `npm run check` | 通过 | typecheck、lint、core import boundary 全部通过。 |
| `npm run test:unit` | 通过 | 105 files、1510 tests passed。 |
| `git diff --check` | 通过 | 外层 AlembicPlugin 无 whitespace error。 |
| `git diff --check`（`plugins/alembic-codex`） | 通过 | runtime artifact 子仓库无 whitespace error。 |
| root/runtime config 负向扫描 | 通过 | `config/default.json`、runtime config、Plugin source / scripts / skills / README 无 shipped external AI provider 默认值命中。 |
| runtime tarball config 负向扫描 | 通过 | `runtime.tgz` 内 `package/config/default.json` 无 `ai` / `openai` / `gpt-*` 默认值。 |
| real-project consumer scan | 通过并保留 | 仅定位脚本、fixture 输出路径和测试 / path guard 字符串；未迁移、未删除、未操作 BiliDili。 |

## 仍保留项理由

- `SFC-PLUGIN-005-B` 的真实迁移 / 删除未在本轮执行：当前窗口只负责 Plugin 仓库，不能替 AlembicTest 写入接收资产；删除或迁移 real-project 采集脚本 / fixture 会改变测试证据归属，建议由总控基于 AlembicTest 接收政策另派跨仓库封口任务。
- 本机 Codex plugin cache 未刷新：总控文档明确本波不刷新本机 cache。
- BiliDili 未操作：真实 iOS 项目受保护，本波只扫描 Plugin 代码引用。
- 保留 2 处显式 `noExplicitAny` suppressions：这是动态 DI / registry 边界的刻意 allowlist，不再作为 lint diagnostics 输出；若未来需要收窄，建议单独做 typed container 设计。

## 遗留风险

- AlembicCodex 子仓库和 AlembicPlugin 外层仓库均已提交但尚未 push。
- runtime vendor Core snapshot 来自当前本地 `../AlembicCore @ 08a47233f4fccd49d6622aaf0bc123ca22925de3`；发布封口时需要确认 Core 对应提交已进入目标发布源。
- real-project asset 最终迁移 / 删除仍需总控下一波明确授权和跨仓库接收路径，避免误删历史基线证据。

## 下一步建议

- 总控验收 `b90b522f059fae47a1c79939dd638594d4bfb4ac` 与 `d64d3d147d3e04a3f2eca0e00582e303bb96f259` 后，将 `SFC-PLUGIN-001-R`、`SFC-PLUGIN-004` 标为完成。
- 将 `SFC-PLUGIN-005-B` 转为下一波独立封口或观察项：先决定是否由 AlembicTest 接收脚本 / fixture，再由 Plugin 删除或改为最小 retained fixture。
- 若要让本机 Codex 立即使用新 runtime artifact，需要总控另行授权刷新本机 Codex plugin cache。
