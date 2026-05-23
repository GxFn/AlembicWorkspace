# Small Fix / Cleanup Confirmed Closeout Wave

更新日期：2026-05-23
总控窗口：AlembicWorkspace
状态：SFC-R3 总控验收通过
发送给：无

## 用户确认口径

用户于 2026-05-23 确认：

- L4 compaction 当前问题较多，暂不处理；保留为低优 TODO，等用户再次提及时再处理。
- `AlembicTest/tmp/` raw JSON 暂不影响当前目标，先保留并移出活跃 TODO。
- `AlembicPlugin` real-project asset 属于非逻辑资产，不应该放在 Plugin，可以删除。
- `Alembic` 全量 `npm run test:unit` 需要先在 Codex 内增加可摘除 sandbox / listen 权限型用例的参数或脚本；若仍需要完整复跑，再由用户在 Codex 外执行。

## 目标与完成定义

本波只处理用户已经确认的两个可执行封口项：

- `AlembicPlugin`：删除 Plugin 内 real-project 采集 / benchmark 脚本与 fixture，确认不再有产品实现、单元测试、release / channel verification 或 runtime artifact 消费这些资产。
- `Alembic`：增加 Codex sandbox-safe unit test 命令或参数，保留完整 `npm run test:unit` 不降级，让 Codex 内可先跑排除权限型用例的 unit baseline。

完成定义：

- Plugin 不再保留 `scripts/bench-real-projects.mts`、`scripts/collect-test-project-stats.mts`、`test/fixtures/real-project-stats.json`、`test/fixtures/real-project-bench.json` 或等价 real-project 采集 / benchmark asset。
- Plugin 删除后 `rg` 扫描只允许历史 changelog 或已解释的非资产文本命中；若仍有 runtime / test 消费方，必须停止并回填阻塞。
- Alembic 新增命令必须在 Codex sandbox 内通过，并明确排除哪些权限型测试；完整 `npm run test:unit` 仍保持全量命令，不能被替换成 reduced command。
- Alembic 文档 / package script 要让开发者一眼知道：Codex-safe 命令用于本地受限环境，完整 unit 仍需要在允许 listen / sandbox-exec 的环境跑。

## TODO / Backlog

| ID | 状态 | 推荐窗口 | 摘要 | 本波目标 |
| --- | --- | --- | --- | --- |
| GTODO-2026-05-23-020 | 已完成 | `AlembicPlugin` | 删除 Plugin real-project 非逻辑资产。 | `484174e9d08a2a7a0786c2cc2553de0b2fee5e0c` 已删除脚本 / fixture，并验证无当前消费方。 |
| GTODO-2026-05-23-021 | 已完成 | `Alembic` | 增加 Codex sandbox-safe unit test 命令。 | `69474767c84adc15fccaa9d8a8513bd8ff7f2ee5` 已新增 `test:unit:codex`，排除 `SandboxNetworkProxy` / `TerminalAdapter` 权限型用例，完整 `test:unit` 保持不变。 |
| GTODO-2026-05-23-024 | 观察中 | `AlembicAgent` | L4 compaction 默认行为。 | 用户确认低优等待再次提及，本波不派发。 |

`AlembicTest/tmp/` raw evidence 已按用户口径移出活跃 TODO；保留现状，不派发、不删除。

## 空闲窗口调度

| 窗口 | 调度判断 | 是否发送 |
| --- | --- | --- |
| `Alembic` | SFC-R3 Codex-safe unit test 命令已验收。 | 否 |
| `AlembicCore` | 本波无职责。 | 否 |
| `AlembicAgent` | L4 compaction 低优观察，等用户再次提及。 | 否 |
| `AlembicDashboard` | 本波无职责；contract typing / Mermaid 性能专项仍在全局 TODO 排队。 | 否 |
| `AlembicPlugin` | SFC-R3 real-project 非逻辑资产删除已验收。 | 否 |
| `AlembicTest` | `tmp/` raw evidence 保留，real-project asset 不迁移，本波无职责。 | 否 |
| `BiliDili` | 真实 iOS 项目受保护，不作为执行窗口。 | 否 |

## 阶段任务包

所有任务包的执行前置硬规则：先读取 workspace `AGENTS.md`、本计划和目标仓库 `AGENTS.md`，并在开始修改前明确当前窗口定位 / 仓库职责。

### SFC-R3-ALEMBIC

窗口：`Alembic`

阶段目标：让 Codex 内可以跑一个明确的 sandbox-safe unit baseline，同时保留完整 unit 命令。

主线动作：

- 基于现有 `vitest.unit.config.ts` 增加一个 Codex-safe 参数、script 或 config，排除当前受限环境失败的权限型测试：`test/unit/SandboxNetworkProxy.test.ts` 和 `test/unit/TerminalAdapter.test.ts`。
- 不修改这两个测试的真实行为，不把完整 `npm run test:unit` 降级为 reduced command。
- 在 `package.json` 或最小文档位置写清命令用途：Codex sandbox-safe baseline 用于受限环境；完整 unit 仍需在允许 `127.0.0.1` listen 和 `sandbox-exec` 的环境跑。

合并 TODO：`GTODO-2026-05-23-021`。

明确不包含：不改 sandbox / terminal 产品逻辑；不删除测试；不把 CI / release check 改成只跑 sandbox-safe baseline，除非仓库已有明确分层要求。

下一处真实阻塞点：如果 Vitest CLI 不支持直接 exclude 参数，改用独立 config 或 wrapper script；如果 reduced baseline 仍失败，回填新的真实失败清单。

阻塞点之前还能做：读取现有 `vitest.unit.config.ts`、确认失败用例路径、选择可验证的独立 config / package script 方案、补最小文档和跑 sandbox-safe baseline。

验证命令：`npm run test:unit:<新命令名>` 或等价新增命令、`npm run lint`、`npm run check`、`npm run build:check`、`git diff --check`。

回填要求：提交 hash、新命令名称、排除清单、完整 `test:unit` 未降级证据、验证结果和仍需 Codex 外复跑的说明。

### SFC-R3-PLUGIN

窗口：`AlembicPlugin`

阶段目标：删除 Plugin 内 real-project 非逻辑资产，保持 Plugin 作为 Codex host agent 插件产出库的边界清晰。

主线动作：

- 删除 `scripts/bench-real-projects.mts`、`scripts/collect-test-project-stats.mts`、`test/fixtures/real-project-stats.json`、`test/fixtures/real-project-bench.json`，以及等价 real-project 采集 / benchmark asset。
- 扫描并清理产品代码、测试、verify scripts、release / channel scripts、runtime artifact 中对这些资产的消费方。
- 历史 changelog 可保留为历史文本；如果当前 README / docs / package scripts 还指向这些资产，必须删除或改成“已移除”口径。
- 不迁移到 AlembicTest，不操作 BiliDili，不改真实项目源码。

合并 TODO：`GTODO-2026-05-23-020`。

明确不包含：不刷新本机 Codex plugin cache；不运行真实项目采集；不删除 BiliDili / BiliDemo path guard 测试语义；不清理普通测试 fixture。

下一处真实阻塞点：如果发现 Plugin 产品验证或 unit test 仍真实消费这些资产，停止删除并回填消费方证据。

阻塞点之前还能做：删除已确认的两个 real-project 脚本和两个 fixture、清理当前 README / package / verify 引用、扫描剩余命中并区分历史 changelog 与真实消费方。

验证命令：`rg -n "bench-real-projects|collect-test-project-stats|real-project-stats|real-project-bench" .`、`npm run lint`、`npm run build:check`、`npm run verify:release-package-boundary`、`npm run verify:codex-plugin`、`npm run verify:codex-channel`、`npm run check`、`npm run test:unit`、`git diff --check`。

回填要求：提交 hash、删除文件清单、剩余命中清单和理由、验证结果、是否需要刷新 runtime artifact 的判断。

## 窗口分派

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>已完成 | 已验收 `SFC-R3-ALEMBIC`；提交 `69474767c84adc15fccaa9d8a8513bd8ff7f2ee5`。 |
| `AlembicCore`<br>无任务 | 本波无职责。 |
| `AlembicAgent`<br>观察中 | L4 compaction 低优等待用户再次提及。 |
| `AlembicDashboard`<br>无任务 | 本波无职责。 |
| `AlembicPlugin`<br>已完成 | 已验收 `SFC-R3-PLUGIN`；提交 `484174e9d08a2a7a0786c2cc2553de0b2fee5e0c`。 |
| `AlembicTest`<br>无任务 | `tmp/` raw evidence 保留，real-project asset 不迁移。 |
| `BiliDili`<br>无任务 | 不操作真实 iOS 项目。 |

## 可复制提示词

发送给：无

当前无可复制执行提示词；SFC-R3 执行窗口均已验收完成。

不发送给：`Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`、`AlembicTest`、`BiliDili`。

## 总控验收结论

验收时间：2026-05-23 19:15 CST

SFC-R3 验收通过：

- `Alembic` 新增 `test:unit:codex` 与 `vitest.unit.codex.config.ts`，仅排除当前 Codex sandbox 权限型用例 `SandboxNetworkProxy.test.ts` 和 `TerminalAdapter.test.ts`；完整 `test:unit` 仍保持 `vitest.unit.config.ts`，未降级。
- `AlembicPlugin` 已删除 `scripts/bench-real-projects.mts`、`scripts/collect-test-project-stats.mts`、`test/fixtures/real-project-bench.json`、`test/fixtures/real-project-stats.json`；剩余指定命中仅为 `CHANGELOG.md` 历史文本，广义 real-project 命中另有一处 skill 安全约束说明，不是产品 / 测试 / release / runtime 消费方。
- 两个执行仓库工作区均 clean；`AlembicPlugin/plugins/alembic-codex` runtime artifact 子仓库无本轮新增 dirty，保持 SFC-R2 runtime artifact 提交状态。

本轮完成后，`GTODO-2026-05-23-020` 和 `GTODO-2026-05-23-021` 从活跃全局 TODO 移除。仍保留的非主线 TODO 是：Core consumer allowance 观察、Dashboard contract typing / Mermaid 性能专项、Agent L4 低优等待用户再次提及，以及更早的 prime / service / evidence 观察项。

## 回填区

- 2026-05-23 18:55 CST：用户确认 L4 compaction 暂不处理并降为低优等待提及；`AlembicTest/tmp/` raw JSON 保留并移出活跃 TODO；Plugin real-project asset 可以删除；Alembic 增加 Codex sandbox-safe unit test 命令。
- 2026-05-23 19:05 CST：`Alembic` 完成 `SFC-R3-ALEMBIC` 并提交 `69474767c84adc15fccaa9d8a8513bd8ff7f2ee5`（`test: add codex-safe unit baseline`）。完成范围：新增 `test:unit:codex` 与 `vitest.unit.codex.config.ts`，排除 `test/unit/SandboxNetworkProxy.test.ts` 和 `test/unit/TerminalAdapter.test.ts` 两个权限型用例；新增 `docs/testing.md` 说明 Codex-safe baseline 和完整 unit 的适用环境；完整 `npm run test:unit` 保持 `vitest.unit.config.ts` 不变。验证：`npm run test:unit:codex` 通过（110 files / 1068 tests）；`./node_modules/.bin/biome check package.json vitest.unit.codex.config.ts docs/testing.md`、`npm run lint`、`npm run check`、`npm run build:check`、`git diff --check` 均通过。仍保留项理由：完整 `test:unit` 仍包含 sandbox / terminal 权限型测试，需要在允许 `127.0.0.1` listen 和 `sandbox-exec` 的环境复跑；本波不改产品逻辑、不删除测试、不降级 CI / release 语义。回填文档：[../../Alembic/small-fix-cleanup-confirmed-closeout-alembic-2026-05-23.md](../../../../Alembic/small-fix-cleanup-confirmed-closeout-alembic-2026-05-23.md)。
- 2026-05-23 19:06 CST：`AlembicPlugin` 完成 `SFC-R3-PLUGIN` 并提交 `484174e9d08a2a7a0786c2cc2553de0b2fee5e0c`（`chore: remove plugin real project assets`）。完成范围：删除 `scripts/bench-real-projects.mts`、`scripts/collect-test-project-stats.mts`、`test/fixtures/real-project-bench.json`、`test/fixtures/real-project-stats.json`；确认 `package.json` scripts / package files 无消费方；runtime artifact 无需刷新。验证：指定资产 `rg` 仅剩 `CHANGELOG.md:574` 历史文本；广义 `real-project` 扫描仅剩 changelog 历史文本和 skill 安全约束文本；`npm run lint`、`npm run build:check`、`npm run verify:release-package-boundary`、`npm run verify:codex-plugin`、`npm run verify:codex-channel`、`npm run check`、`npm run test:unit`、`git diff --check` 均通过。仍保留项：`CHANGELOG.md` 历史记录和 skill 的外部真实项目验证安全约束文本。回填文档：[../../AlembicPlugin/small-fix-cleanup-confirmed-closeout-plugin-2026-05-23.md](../../../../AlembicPlugin/small-fix-cleanup-confirmed-closeout-plugin-2026-05-23.md)。
