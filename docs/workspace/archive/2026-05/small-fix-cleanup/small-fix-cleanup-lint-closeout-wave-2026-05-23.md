# Small Fix / Cleanup Lint Closeout Wave

更新日期：2026-05-23
总控窗口：AlembicWorkspace
状态：SFC-R2 总控验收通过（非主线真实问题已转入全局 TODO）
发送给：无

## 目标与完成定义

本计划承接 [small-fix-cleanup-repair-wave-2026-05-23.md](../../../current/small-fix-cleanup-repair-wave-2026-05-23.md) 的总控验收纠偏。用户指出：各仓库挖掘出的真实问题并没有全部解决，lint 问题不能只作为观察项跳过。

总控结论：用户判断正确。SFC-R1 只关闭了直接修复项，不能代表“小问题修复 / 清理修复”主线完成。SFC-R2 的目标是继续处理剩余真实问题，尤其是 lint / check 基线、Dashboard 缺口、Plugin config 残留和 AlembicTest 证据封口。

本波完成定义：

- `Alembic`、`AlembicPlugin` 的 lint diagnostics 不再只以“命令退出 0”作为完成标准；需要清理 warning / info，或给出逐项允许保留清单和后续归属。
- `AlembicDashboard` 不能只补 `typecheck` 就关闭 `DASH-SFC-001`；需要补真实 lint / test 基线，若确需新增工具或依赖，要按仓库现状给出最小实现和验证证据。
- `AlembicCore` 的剩余小问题不再默认观察：`release:check` dirty tree 语义和 git HEAD 输出噪声需要修复或给出明确“不修”证据。
- `AlembicPlugin` 的 shipped AI config 残留需要进入真实修复或 schema 证据闭环；不能只标待确认后继续归档。
- `AlembicTest` 的本轮自检报告和历史 GFBD 报告必须封口，不能让证据文件长期未跟踪。
- 仍涉及产品行为决策或删除本地 raw evidence 的事项，必须保持确认 / 授权门禁。

## 纠偏判断

SFC-R1 已完成：

- `Alembic` 旧 alias、空目录、retired guard 文案、`env-config` 注释。
- `AlembicCore` 本地源码接入口径、`normalizeLifecycle` additive facade、注释示例。
- `AlembicAgent` lint failure、host-neutral provider 缺 key、package asset 无消费方常量收窄。
- `AlembicDashboard` README、typecheck script、mock cleanup 用户可见反馈。
- `AlembicPlugin` lint failure、release alias fail-closed、SetupService provider/vector 文案。
- `AlembicTest` README / docs README 安全命令和历史证据说明。

SFC-R1 未完成且本波继续处理：

- `SFC-ALEMBIC-005`：Alembic Biome warnings / infos。
- `SFC-CORE-004`、`SFC-CORE-005`：Core release/check 小问题。
- `DASH-SFC-001` 的剩余部分：Dashboard lint / test 真实基线。
- `DASH-SFC-004`、`DASH-SFC-005`：Dashboard chunk / 类型债，需要至少形成真实可执行收敛计划或小修。
- `SFC-PLUGIN-001` 的剩余部分：Plugin lint warning / info。
- `SFC-PLUGIN-004`：Plugin shipped AI config 残留。
- `SFC-PLUGIN-005`：Plugin real-project asset 归属，先与 `AlembicTest` 建立接收或废弃口径。
- `SFC-AT-001`、`SFC-AT-002`、`SFC-AT-003`：AlembicTest 未跟踪证据和 raw evidence 处理策略。

继续保持确认门禁：

- `SFC-Agent-003`：L4 compaction 默认行为属于产品行为决策，本波不派发。
- 删除 `AlembicTest/tmp/` raw JSON 需要授权；本波只允许 dry-run、脱敏摘要或保留策略，不直接删除。

## TODO / Backlog

| ID | 状态 | 推荐窗口 | 摘要 | 本波目标 |
| --- | --- | --- | --- | --- |
| SFC-ALEMBIC-005 | 已完成 | `Alembic` | Biome warning / info 规模大。 | `c7cc12c3d28af74e522680f582fb2e3b0b03d2f7` 已将基线 `227 warnings / 25 infos` 收敛为 `npm run lint` 无 warning / info；动态边界已进入显式 allowlist。 |
| SFC-CORE-004 | 已完成 | `AlembicCore` | `release:check` dirty tree 语义与 playbook 不一致。 | `08a47233f4fccd49d6622aaf0bc123ca22925de3` 已修脚本并更新 playbook：dirty tree 成为 release readiness issue，clean tree 通过。 |
| SFC-CORE-005 | 已完成 | `AlembicCore` | `npm run check` 有非致命 git HEAD 输出噪声。 | `08a47233f4fccd49d6622aaf0bc123ca22925de3` 已修 `getFileDiff` 静默 fallback 并补 targeted test，`npm run check` 无 HEAD 噪声。 |
| DASH-SFC-001-R | 已完成 | `AlembicDashboard` | Dashboard 仍缺真实 lint / test 基线。 | `a2e3ad4dcf9b1e0ebdb59cc27d254529f670128f` 已增加真实 `lint`、`test`、`check` 入口和 contract smoke。 |
| DASH-SFC-004 | 已完成 | `AlembicDashboard` | vendor chunk 过大。 | `a2e3ad4dcf9b1e0ebdb59cc27d254529f670128f` 已 lazy-load Markdown / Mermaid / syntax highlight 并重做 manual chunks；Mermaid async chunk 后续专项转 `GTODO-2026-05-23-023`。 |
| DASH-SFC-005 | 已完成 | `AlembicDashboard` | `any` 类型债。 | `a2e3ad4dcf9b1e0ebdb59cc27d254529f670128f` 已收敛高影响路径并用 lint budget 锁住剩余动态 contract；后端 contract 类型化转 `GTODO-2026-05-23-022`。 |
| SFC-PLUGIN-001-R | 已完成 | `AlembicPlugin` | Plugin lint 仍有 warning / info。 | `b90b522f059fae47a1c79939dd638594d4bfb4ac` 已清理 diagnostics；`npm run lint -- --max-diagnostics=220` 无 warning / info。 |
| SFC-PLUGIN-004 | 已完成 | `AlembicPlugin` | shipped `config/default.json` 暴露外部 AI provider 默认值。 | `b90b522f059fae47a1c79939dd638594d4bfb4ac` 已删除 root/runtime shipped `ai` defaults，并用 verify scripts / runtime artifact 验证。 |
| SFC-PLUGIN-005-A | 已完成 | `AlembicTest` | Plugin real-project 资产归属不清。 | `a5b666ec3e77401f6180ac7f267933dd24b3c172` 已给出接收路径、脱敏规则和不接收范围。 |
| SFC-PLUGIN-005-B | 已转全局 TODO | `AlembicPlugin` | Plugin real-project 资产需移出或删除。 | Plugin 已完成消费方扫描；真实迁移 / 删除不属于本波主线，转入 `GTODO-2026-05-23-020`，等待下一波跨仓库封口。 |
| SFC-AT-001 | 已完成 | `AlembicTest` | 未跟踪 GFBD 历史报告需处理。 | 已修正旧测试交换路径并提交 `a5b666ec3e77401f6180ac7f267933dd24b3c172`。 |
| SFC-AT-002 | 已完成 | `AlembicTest` | GFBD 报告引用旧路径。 | 已随 SFC-AT-001 修正并提交。 |
| SFC-AT-003 | 已完成 | `AlembicTest` | `tmp/` raw JSON 需要保留 / 清理策略。 | 已增加 dry-run retention 工具和文档说明；删除 raw JSON 需授权，转入 `GTODO-2026-05-23-025`。 |
| SFC-Agent-003 | 已转全局 TODO | `AlembicAgent` | L4 compaction 默认行为。 | 产品行为确认不属于本波主线，转入 `GTODO-2026-05-23-024`。 |
| GTODO-2026-05-23-019 | 观察中 | `Alembic` | Core 已导出 `normalizeLifecycle`，consumer allowance 可收敛。 | 本波不派，后续 Core public API closeout 时处理。 |

## 空闲窗口调度

| 窗口 | 调度判断 | 是否发送 |
| --- | --- | --- |
| `Alembic` | SFC-R2 lint diagnostics closeout 已验收；全量 unit 权限环境复跑转 `GTODO-2026-05-23-021`。 | 否 |
| `AlembicCore` | SFC-R2 release/check 小问题修复已验收。 | 否 |
| `AlembicAgent` | SFC-R1 lint 已绿；L4 默认行为转 `GTODO-2026-05-23-024`，等待用户确认。 | 否 |
| `AlembicDashboard` | SFC-R2 lint/test 基线、chunk 和类型债收敛已验收；剩余 contract / Mermaid 专项转全局 TODO。 | 否 |
| `AlembicPlugin` | SFC-R2 lint diagnostics closeout 和 shipped AI config 修复已验收；real-project 迁移 / 删除转 `GTODO-2026-05-23-020`。 | 否 |
| `AlembicTest` | SFC-R2 证据封口、GFBD 报告处理和 real-project asset 接收判断已验收；raw evidence 删除授权转 `GTODO-2026-05-23-025`。 | 否 |
| `BiliDili` | 真实 iOS 项目受保护，本波不进入。 | 否 |

## 阶段任务包

所有任务包的执行前置硬规则：先读取 workspace `AGENTS.md`、本计划和目标仓库 `AGENTS.md`，并在开始修改前明确当前窗口定位 / 仓库职责。

### SFC-R2-ALEMBIC

窗口：`Alembic`

阶段目标：把 `SFC-ALEMBIC-005` 从“观察”推进到真实处理结论。

主线动作：

- 运行并保存 `npm run lint` / `npm run check` 的 diagnostics 摘要。
- 清理可安全处理的 Biome warnings / infos，优先处理非空断言、CLI console 策略、明显未使用 / 可选链 / 宽类型等小修。
- 对无法在本波安全处理的 diagnostics，建立明确 allowlist / 后续 TODO，写清文件、原因、风险和触发条件。

合并 TODO：`SFC-ALEMBIC-005`。

明确不包含：不做大范围架构重构；不改变 HTTP/API contract；不启动 daemon / Dashboard live smoke，除非修复触发运行时行为。

下一处真实阻塞点：若 diagnostics 牵涉 CLI 用户输出策略或 public API 行为变化，停止并回填需要确认的问题。

阻塞点之前还能做：安全 lint 小修和 diagnostics 分类可以一次完成。

验证命令：`npm run lint`、`npm run check`、targeted tests（如触及对应模块）、`git diff --check`。

回填要求：提交 hash、lint diagnostics 前后对比、仍保留 diagnostics 清单和理由。

### SFC-R2-CORE

窗口：`AlembicCore`

阶段目标：关闭 Core release/check 小问题，不再把它们长期悬为观察。

主线动作：

- 处理 `release:check` dirty tree 语义：修脚本让 dirty tree 成为 issue，或修文档明确它只报告不失败；二选一并写证据。
- 定位 `npm run check` 中 `Could not access 'HEAD'` 非致命输出，修复为静默 fallback / debug 级输出，或补测试说明证明它是预期 fixture。

合并 TODO：`SFC-CORE-004`、`SFC-CORE-005`。

明确不包含：不做 consumer deep import 替换；不修改 Core public API；不发布。

下一处真实阻塞点：如果 dirty tree fail-fast 会破坏开发态 release dry-run，回填风险并说明不改理由。

阻塞点之前还能做：脚本 / 文档 / 测试输出修复可独立完成。

验证命令：`npm run check`、`npm run release:check`、targeted release readiness tests / smoke、`git diff --check`。

回填要求：提交 hash、dirty tree 语义证据、git HEAD 噪声处理结果。

### SFC-R2-DASHBOARD

窗口：`AlembicDashboard`

阶段目标：补齐 Dashboard 质量门禁和处理可安全的 chunk / 类型债，不再只靠 `typecheck`。

主线动作：

- 增加真实 `lint` 和 `test` 入口；如果需要新增工具或依赖，采用仓库现有生态中最小、可验证的方案，并写清原因。
- 为 API / error / mock cleanup / markdown 等高风险路径补最小测试或可执行 smoke，避免空 test script。
- 对 vendor chunk 过大做最小安全收敛，优先 lazy-load Markdown / Mermaid / syntax highlight 等重依赖；若无法安全收敛，输出可执行拆分计划和证据。
- 处理可安全替换的 `any`，优先 `src/api.ts`、mock cleanup 和 markdown 渲染路径。

合并 TODO：`DASH-SFC-001-R`、`DASH-SFC-004`、`DASH-SFC-005`。

明确不包含：不做完整性能专项；不启动真实 backend；不改跨仓库 API contract。

下一处真实阻塞点：如果新增 test / lint 工具需要网络下载或大规模依赖变更，回填阻塞并说明替代方案。

阻塞点之前还能做：本地已有依赖范围内的 lint/test/type cleanup 和构建验证可先完成。

验证命令：`npm run lint`、`npm run test`、`npm run typecheck`、`npm run build`、`git diff --check`；如改 chunk，记录 build chunk 前后摘要。

回填要求：提交 hash、lint/test 是否真实执行、chunk / type debt 处理范围和剩余清单。

### SFC-R2-PLUGIN

窗口：`AlembicPlugin`

阶段目标：处理 Plugin lint warning / info 和 shipped AI config 残留；real-project 资产迁移删除等待 AlembicTest 接收口径。

主线动作：

- 清理可安全处理的 `npm run lint` warning / info；无法处理的 diagnostics 必须列 allowlist / 后续 TODO。
- 基于 runtime config schema、verify scripts 和实际 consumer 扫描，修正 `config/default.json` 中外部 AI provider 默认值：删除、置空、改为 inert / resident-owned 字段三选一，但必须有验证证据。
- 保持 root registry publish disabled、Codex plugin artifact / channel 验证不回退。
- 对 real-project scripts / fixtures 只做消费方扫描和等待 `AlembicTest` 接收口径；没有接收口径前不删除。

合并 TODO：`SFC-PLUGIN-001-R`、`SFC-PLUGIN-004`、`SFC-PLUGIN-005-B` 的前置扫描。

明确不包含：不刷新本机 Codex plugin cache；不运行真实项目采集；不迁移 / 删除 real-project asset，除非 `AlembicTest` 已先给出接收 / 不接收证据。

下一处真实阻塞点：若 config 字段删除影响 runtime artifact verification 或 schema loading，回填阻塞并保留最小 inert 方案。

阻塞点之前还能做：lint closeout、config schema 证据、runtime artifact verification 可以先完成。

验证命令：`npm run lint`、`npm run lint -- --diagnostic-level=error`、`npm run build:check`、`npm run verify:codex-plugin`、`npm run verify:release-package-boundary`、`npm run verify:codex-channel`、`git diff --check`、相关 config/provider 负向扫描。

回填要求：提交 hash、lint diagnostics 前后对比、AI config 修改策略和验证结果、real-project asset 扫描结论。

### SFC-R2-TEST

窗口：`AlembicTest`

阶段目标：完成证据封口和真实项目资产归属判断，不运行真实项目、不删除 raw evidence。

主线动作：

- 将本轮 `docs/small-fix-cleanup-self-check-2026-05-23.md` 作为有效证据提交，或说明为何不提交；不得继续未跟踪悬挂。
- 处理 `docs/global-function-boundary-evidence-test-2026-05-22.md`：修正旧测试交换路径并提交，或明确取消 / 删除口径并回填原因。
- 为 `tmp/` raw JSON 增加 retention / dry-run 清理脚本或文档说明；本波不直接删除 raw JSON。
- 判断是否接收 `AlembicPlugin` 的 real-project 采集脚本 / fixture：若接收，给出目标路径、脱敏规则和验证命令；若不接收，说明原因，供 Plugin 删除或归档。

合并 TODO：`SFC-AT-001`、`SFC-AT-002`、`SFC-AT-003`、`SFC-PLUGIN-005-A`。

明确不包含：不运行 restart / monitor / probe；不操作 BiliDili；不删除 `tmp/` raw JSON；不改 AlembicPlugin。

下一处真实阻塞点：删除 raw evidence 或取消历史 GFBD 证据需要用户确认。

阻塞点之前还能做：证据路径修正、提交 / 取消说明、retention dry-run 和接收判断可以完成。

验证命令：`npm --prefix AlembicTest run check`、`git -C AlembicTest status --short --branch`、`git -C AlembicTest diff --check`、`git diff --check`。

回填要求：提交 hash、未跟踪文件处理结论、real-project asset 接收判断、raw evidence 保留 / 清理策略。

## 窗口分派

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>已完成 | 已验收 `SFC-R2-ALEMBIC`；提交 `c7cc12c3d28af74e522680f582fb2e3b0b03d2f7`。 |
| `AlembicCore`<br>已完成 | 已验收 `SFC-R2-CORE`；提交 `08a47233f4fccd49d6622aaf0bc123ca22925de3`。 |
| `AlembicAgent`<br>观察中 | 不派发；L4 默认行为已转 `GTODO-2026-05-23-024` 等待用户确认。 |
| `AlembicDashboard`<br>已完成 | 已验收 `SFC-R2-DASHBOARD`；提交 `a2e3ad4dcf9b1e0ebdb59cc27d254529f670128f`。 |
| `AlembicPlugin`<br>已完成 | 已验收 `SFC-R2-PLUGIN`；提交 `b90b522f059fae47a1c79939dd638594d4bfb4ac`，AlembicCodex runtime artifact 提交 `d64d3d147d3e04a3f2eca0e00582e303bb96f259`。 |
| `AlembicTest`<br>已完成 | 已验收 `SFC-R2-TEST`；提交 `a5b666ec3e77401f6180ac7f267933dd24b3c172`。 |
| `BiliDili`<br>无任务 | 真实 iOS 项目受保护，本波不作为执行窗口。 |

## 可复制提示词

发送给：无。

本波执行窗口均已回填，当前不再输出新的执行窗口提示词。

不发送给：`Alembic`、`AlembicCore`、`AlembicDashboard`、`AlembicPlugin`、`AlembicTest`（均已验收完成）、`AlembicAgent`（观察中）、`BiliDili`。

## 总控验收结论

验收时间：2026-05-23 18:42 CST

SFC-R2 主线验收通过：本波要求的 lint / check closeout、Dashboard 质量门禁、Plugin shipped AI config 清理、Core release/check 修复和 AlembicTest 证据封口均已有提交、验证命令和回填证据。当前没有需要继续发送的执行窗口。

总控未把以下真实问题包装成完成，已按“非主线真实问题进入 TODO 排队”的口径转入全局 TODO：

- `GTODO-2026-05-23-020`：Plugin real-project 采集 / benchmark 脚本与 fixture 迁移、最小保留或删除封口。
- `GTODO-2026-05-23-021`：Alembic 全量 `npm run test:unit` 在允许 listen / sandbox-exec 的环境复跑。
- `GTODO-2026-05-23-022`：Dashboard `src/api.ts` 剩余动态 contract `any` 与后端 contract 类型化。
- `GTODO-2026-05-23-023`：Dashboard Mermaid async chunk 性能专项。
- `GTODO-2026-05-23-024`：AlembicAgent L4 compaction 默认行为等待用户确认。
- `GTODO-2026-05-23-025`：AlembicTest `tmp/` raw JSON 删除需授权。

验收风险口径：

- Alembic 全量 unit 失败集中在当前 sandbox 权限限制，SFC-R2 相关 targeted unit、lint、check 和 build 已通过；复跑需求转入 TODO，不阻塞本波 lint closeout 主线。
- Plugin real-project asset 已有 AlembicTest 接收政策和 Plugin 消费方扫描，真实迁移 / 删除是下一波封口任务；本波未操作 BiliDili，符合真实项目保护边界。
- Dashboard 未启动真实 backend / 浏览器 live smoke，本波目标是本地质量门禁与构建基线；跨仓库 live smoke 不属于本波主线。

## 回填区

- 2026-05-23 18:01 CST：用户指出真实问题未全部解决且 lint 不应跳过；总控纠偏，启动 SFC-R2，把 lint / check closeout、Dashboard 质量门禁、Plugin shipped AI config 和 AlembicTest 证据封口列入下一波。
- 2026-05-23 18:09 CST：`AlembicCore` 完成 `SFC-R2-CORE` 并提交 `08a47233f4fccd49d6622aaf0bc123ca22925de3`（`fix: close core release check diagnostics`）。完成范围：`scripts/check-release-readiness.mjs` 将 dirty working tree 纳入 release readiness issue；`RELEASE-PLAYBOOK.md` 明确 dirty tree 失败处理；`src/shared/diff-parser.ts` 在非 git / 无 `HEAD` 场景静默 fallback；`test/shared-basics.test.ts` 补非 git 目录无 stderr targeted test。验证：`npm run release:check` clean baseline 通过；修改后 dirty tree 下 `release:check` 按预期失败并输出 `dirty-working-tree`；`npm run test -- --run test/shared-basics.test.ts test/unit/RecipeImpactPlanner.test.ts` 通过；`npm run check` 通过且无 `Could not access 'HEAD'` 噪声；`npm run build`、`git diff --check` 通过；提交后 clean tree `npm run release:check` 通过。回填文档：[../../AlembicCore/small-fix-cleanup-lint-closeout-2026-05-23.md](../../../../AlembicCore/small-fix-cleanup-lint-closeout-2026-05-23.md)。
- 2026-05-23 18:12 CST：`AlembicTest` 完成 `SFC-R2-TEST` 并提交 `a5b666ec3e77401f6180ac7f267933dd24b3c172`（`docs: close AlembicTest evidence handling`）。完成范围：提交 `docs/small-fix-cleanup-self-check-2026-05-23.md` 有效证据；修正并提交 `docs/global-function-boundary-evidence-test-2026-05-22.md` 的当前测试交换路径；新增 `scripts/tmp-evidence-retention.mjs` 和 `tmp:retention` 脚本，补充 `README.md`、`docs/README.md`、`scripts/README.md` 的 raw evidence dry-run / retention 说明；新增 `docs/real-project-asset-intake-policy-2026-05-23.md`，给出 AlembicPlugin real-project collection / benchmark assets 的接收路径、脱敏规则、不接收范围和后续 Plugin 处理建议。验证：`npm --prefix AlembicTest run check`、`npm --prefix AlembicTest run tmp:retention -- --max-age-days 0`、`git -C AlembicTest diff --check`、`git diff --check` 均通过；旧 root-level 测试交换路径扫描无命中。仍保留项：未删除 8 份 `tmp/` raw JSON，dry-run 显示 8 个候选、总计 704104 bytes，删除仍需用户 / 总控授权；未运行 restart / monitor / probe；未操作 BiliDili；未修改 AlembicPlugin。遗留风险：AlembicTest 仓库 ahead 2，需要后续封口 / push；Plugin 仍需基于接收口径处理自身 real-project assets。
- 2026-05-23 18:27 CST：`AlembicPlugin` 完成 `SFC-R2-PLUGIN` 并提交 `b90b522f059fae47a1c79939dd638594d4bfb4ac`（`fix: close plugin lint and config baseline`）；AlembicCodex runtime artifact 子仓库提交 `d64d3d147d3e04a3f2eca0e00582e303bb96f259`（`chore: refresh codex runtime lint closeout artifact`），`runtime.tgz` hash 为 `8f25b2cce9d09fd29db0d26f3c6307072170cb3f456f54d9b3d4df628d282daa`。完成范围：清理 Plugin lint warning / info，删除 root/runtime shipped external AI provider defaults，verify scripts 增加 root/runtime config 不得 ship `ai` key 断言，刷新并验证 Codex plugin runtime artifact，完成 real-project asset 前置消费方扫描。验证：`npm run lint -- --max-diagnostics=220`、`npm run lint -- --diagnostic-level=error`、`npm run build:check`、`npm run build`、`npm run prepare:codex-plugin-runtime`、`npm run verify:release-package-boundary`、`npm run verify:codex-plugin`、`npm run verify:codex-channel`、`npm run report:agent-extraction-boundary`、`npm run lint:repo-boundary`、`npm run lint:core-import-boundary`、`npm run check`、`npm run test:unit`、外层和 runtime 子仓库 `git diff --check`、root/runtime config 负向扫描、runtime tarball config 负向扫描均通过。仍保留项：未刷新本机 Codex plugin cache；未迁移 / 删除 real-project asset，等待总控基于 AlembicTest 接收政策另派封口；未操作 BiliDili。回填文档：[../../AlembicPlugin/small-fix-cleanup-lint-closeout-plugin-2026-05-23.md](../../../../AlembicPlugin/small-fix-cleanup-lint-closeout-plugin-2026-05-23.md)。
- 2026-05-23 18:31 CST：`AlembicDashboard` 完成 `SFC-R2-DASHBOARD` 并提交 `a2e3ad4dcf9b1e0ebdb59cc27d254529f670128f`（`Close dashboard quality gates`）。完成范围：新增无外部依赖的 `npm run lint`、`npm run test` 和聚合 `npm run check`；新增 `scripts/lint-dashboard.mjs`，检查 `console.log`、`catch any`、`as any`、`[object Object]`、用户绝对路径和高风险 `any` budget；新增 `scripts/dashboard-contract.test.mjs`，覆盖质量门禁、mock cleanup 通知、Markdown lazy renderer、chunk 边界和错误对象可读展示；将 Markdown 渲染拆成 lazy `MarkdownSegment`，新增 `LazyCodeBlock`，把 CodeBlock 静态消费点改为 lazy wrapper，`normalizeCode` 下沉到轻量 `src/utils/code.ts`；`vite.config.ts` 按 `react`、`markdown`、`syntax-highlight`、`mermaid`、icons、axios、framer-motion 分块并移除循环 vendor catch-all；收敛 `MarkdownWithHighlight`、`MarkdownSegment`、`GlobalChatDrawer`、`useChatTopics` 和 `src/api.ts` 的可安全 `any`。验证：`npm run lint` 通过（83 个 source files）；`npm run test` 通过（5/5）；`npm run typecheck` 通过；`npm run build` 通过；`npm run check` 通过；`git diff --check` 通过；负向扫描 `console.log|as any|catch (...: any)|[object Object]` 仅剩 locale rule 文案命中。chunk 前后摘要：SFC-R1 build 中 `vendor-DXIWy98S.js` 3987.98KB / gzip 1193.18KB；本次 build 无 vendor catch-all，主要 chunk 为 `index` 933.56KB、`react` 216.62KB、`markdown` 161.31KB、`syntax-highlight` 630.42KB、`mermaid` 2710.73KB。仍保留项理由：`src/api.ts` 仍保留 3 处显式 `any`（SSE 动态 payload、Guard rules 动态 record、Guard violations 动态数组），由 lint budget 锁住，后续需配合后端 contract 类型化；`mermaid` async chunk 仍超过 1.5MB，已移出首屏，继续拆 Mermaid 内部依赖属于专项性能优化，本波不扩大。遗留风险：未启动真实 backend / 浏览器 live smoke；未改跨仓库 API contract。
- 2026-05-23 18:38 CST：`Alembic` 完成 `SFC-R2-ALEMBIC` 并提交 `c7cc12c3d28af74e522680f582fb2e3b0b03d2f7`（`fix: close alembic lint diagnostics`）。完成范围：将 Biome diagnostics 基线 `227 warnings / 25 infos` 收敛为 `npm run lint` 无 warning / info；清理未使用变量 / import、非空断言、可安全 `any`、隐式 any、literal-key / parseInt / banned type / confusing void 等真实代码问题；对 CLI / scripts 用户可见 console、脚本动态类型、resident DI container 和 internal agent projection 动态 artifact 建立显式 allowlist；未改 HTTP/API contract，未启动 daemon / Dashboard live smoke，未操作 BiliDili。验证：`npm run lint`、`npm run check`、`npm run build:check`、`git diff --check` 均通过；targeted unit `./node_modules/.bin/vitest run --config vitest.unit.config.ts test/unit/CrossEncoderReranker.test.ts test/unit/WikiGenerator.test.ts test/unit/WorkflowSkillCompletionCapability.test.ts test/unit/BootstrapProjection.test.ts test/unit/SearchRouteTelemetry.test.ts test/unit/ResidentServiceBoundary.test.ts test/unit/BootstrapRuntimeInitializer.test.ts test/unit/WorkflowResultPersistence.test.ts` 通过（8 files / 45 tests）。全量 `npm run test:unit` 在当前 sandbox 下未通过，失败集中于 `SandboxNetworkProxy.test.ts` 的 `listen EPERM 127.0.0.1` 和 `TerminalAdapter.test.ts` 的 `sandbox-exec: sandbox_apply: Operation not permitted`，其余 110 files / 1076 tests 已通过；需在允许本机 listen / sandbox-exec 的环境复跑。仍保留项理由：allowlist 仅覆盖 CLI 输出和动态 contract 边界，不再保留未分类 diagnostics。回填文档：[../../Alembic/small-fix-cleanup-lint-closeout-alembic-2026-05-23.md](../../../../Alembic/small-fix-cleanup-lint-closeout-alembic-2026-05-23.md)。
