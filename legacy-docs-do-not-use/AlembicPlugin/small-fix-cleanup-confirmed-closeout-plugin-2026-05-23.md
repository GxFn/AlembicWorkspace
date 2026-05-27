# AlembicPlugin SFC-R3 Confirmed Closeout

日期：2026-05-23
窗口：AlembicPlugin
任务包：SFC-R3-PLUGIN
状态：已完成，待总控验收
提交 hash：`484174e9d08a2a7a0786c2cc2553de0b2fee5e0c`

## 窗口定位

当前窗口是 `AlembicPlugin` 执行窗口。目标仓库职责是 Codex MCP、Skill、channel / marketplace、插件 runtime、安装验证和 Codex host adapter。

本轮只执行 `SFC-R3-PLUGIN`：按用户确认口径删除 Plugin 内 real-project 非逻辑资产，验证产品实现、测试、release / channel verification 和 runtime artifact 不再消费这些资产。不迁移到 AlembicTest，不操作 BiliDili，不刷新本机 Codex plugin cache，不处理 Alembic 的 sandbox-safe unit test 命令。

## 完成范围

已删除以下文件：

- `scripts/bench-real-projects.mts`
- `scripts/collect-test-project-stats.mts`
- `test/fixtures/real-project-bench.json`
- `test/fixtures/real-project-stats.json`

删除后确认：

- `package.json` 没有 real-project 相关 script。
- root package `files` 不包含上述脚本或 fixture。
- `npm run verify:release-package-boundary`、`npm run verify:codex-plugin`、`npm run verify:codex-channel` 均通过。
- `plugins/alembic-codex` runtime artifact 子仓库无 dirty files；本轮删除的是未打包进入 runtime 的源仓库脚本 / 测试 fixture，因此不需要刷新 runtime artifact。

## 剩余命中 / 仍保留项理由

指定资产扫描：

```text
rg -n "bench-real-projects|collect-test-project-stats|real-project-stats|real-project-bench" .
```

剩余 1 处命中：

- `CHANGELOG.md:574`：历史 changelog 记录，描述曾经新增过这些性能基准脚本和 fixtures；不是当前产品、测试、release、channel 或 runtime 消费方，按历史文本保留。

广义 `real-project` 扫描另有 1 处非资产命中：

- `skills/progressive-chain-validation/progressive-chain-validation/references/overlays/alembic-coldstart-rescan.md:13`：对外部真实项目验证的安全约束文本，要求 full `--wait` 之前确认写入路由或取得明确授权；不是 real-project 采集 / benchmark asset，按安全说明保留。

## 验证命令与结果

| 命令 | 结果 | 摘要 |
| --- | --- | --- |
| `rg -n "bench-real-projects|collect-test-project-stats|real-project-stats|real-project-bench" .` | 通过 | 仅剩 `CHANGELOG.md:574` 历史文本。 |
| `rg -n "real-project|real_project" package.json scripts test lib config plugins channels skills CHANGELOG.md README.md --glob '!plugins/alembic-codex/runtime/node_modules/**' --glob '!dist/**'` | 通过 | 仅剩 changelog 历史文本和 skill 安全约束文本，无资产消费方。 |
| `npm run lint` | 通过 | Checked 181 files，No fixes applied。 |
| `npm run build:check` | 通过 | Core build 使用 `../AlembicCore @ 08a47233f4fccd49d6622aaf0bc123ca22925de3`，`tsc --noEmit` 通过。 |
| `npm run verify:release-package-boundary` | 通过 | root registry publish disabled；embedded runtime Core dependency 保持 `file:vendor/AlembicCore`；embedded Core source 为 `08a47233f4fccd49d6622aaf0bc123ca22925de3`。 |
| `npm run verify:codex-plugin` | 通过 | Codex plugin verification passed。 |
| `npm run verify:codex-channel` | 通过 | Codex channel verification passed。 |
| `npm run check` | 通过 | typecheck、lint、core import boundary 均通过；扫描 332 files 和 448 个 `@alembic/core` imports。 |
| `npm run test:unit` | 通过 | 105 files，1510 tests passed。 |
| `git diff --check` | 通过 | 无 whitespace error。 |

## 遗留风险

- AlembicPlugin 仓库当前 ahead origin 3，包含前序 SFC-R1 / SFC-R2 / 本轮 SFC-R3 提交，尚未 push。
- AlembicCodex runtime artifact 子仓库仍 ahead origin 1，为 SFC-R2 的 runtime artifact 刷新提交；本轮没有新增 runtime artifact 改动。
- `CHANGELOG.md` 仍记录历史脚本名称，若总控后续要求“历史文本也不能命中”，需另行授权修改历史记录口径。

## 下一步建议

- 总控验收 `484174e9d08a2a7a0786c2cc2553de0b2fee5e0c` 后，将 `GTODO-2026-05-23-020` 标为完成并从活跃 TODO 移出。
- SFC-R3 主线剩余项只剩 `Alembic` 的 Codex sandbox-safe unit test 命令验收；Plugin 窗口不再需要继续领取本波任务。
