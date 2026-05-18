# Alembic Agent Cutover And Plugin Cleanup Wave 4 Deletion Plan

日期：2026-05-17
总控窗口：AlembicWorkspace
状态：已完成

本文承接 `docs/workspace/alembic-agent-cutover-plugin-cleanup-wave-3-acceptance-next-plan-2026-05-17.md`。Wave 3 已完成：`AlembicAgent` 补齐 remaining host contract surface，`Alembic` 已切走最后 3 个生产侧本地 `lib/agent/**` 调用。本轮开始进入删除 / quarantine 阶段。

## 1. Wave 3 验收结论

| 窗口 | 结论 | 提交 / 证据 | 判断 |
| --- | --- | --- | --- |
| `AlembicAgent` | 已完成 | `bd97459 Expose remaining host contracts`；`@alembic/agent/forge`、`@alembic/agent/tasks`、`@alembic/agent/profiles` import smoke 通过；`npm run check` 通过 | remaining host contract 已可供 Alembic 消费。 |
| `Alembic` | 已完成 | `4be3b1e chore: consume remaining agent host contracts`；`local Agent relative import files: 0`；`local Agent relative imports: 0`；`build:check` 和指定单测通过 | 最后 3 个生产侧本地 `lib/agent/**` 调用已切走。可以进入删除 / quarantine。 |
| `AlembicPlugin` | 已完成 | release readiness 文档与边界报告均为 0 | 保持 agent-free plugin runtime。 |
| `AlembicDashboard` | 观察中 | 上一轮 live host-managed contract 已完成 | 本轮无直接任务。 |
| `AlembicCore` | 观察中 | 未发现 Core 缺口 | 本轮无直接任务。 |

Wave 3 总控复验已跑：

```text
npm run lint:agent-extraction-boundary
npm run build:check
npm run test:unit -- test/unit/AgentTaskHandlers.test.ts test/unit/ToolForgeIntegration.test.ts test/unit/AgentModuleBoundaries.test.ts
node -e "Promise.all([import('@alembic/agent/forge'), import('@alembic/agent/tasks'), import('@alembic/agent/profiles')])..."
rg -n "\.\./\.\./agent/|\.\./agent/|#agent/|lib/agent/" lib bin scripts --glob '*.ts' --glob '*.js' --glob '*.mjs'
```

关键结果：

- `Alembic` boundary lint 通过。
- `local Agent relative import files: 0`。
- `local Agent relative imports: 0`。
- `@alembic/agent/forge/tasks/profiles` import smoke 通过。
- 代表性单测通过，3 个 test files、15 个 tests。
- 生产侧本地 `lib/agent/**` 相对导入已清零。
- 剩余 `#agent/capabilities/Capability.js` 只存在于 `lib/tools/v2/capabilities/CapabilityV2.ts`，该目录属于 Wave 4 删除候选。

## 2. Wave 4 目标

Wave 4 直接清理 Alembic 本地重复实现：

1. 删除 `Alembic` 本地 `lib/agent/**` duplicate implementation，或把极少数确认为 host-owned 的文件改名/移动到宿主目录并写明理由。
2. 删除 `Alembic` 本地 generic Tool V2 implementation，只保留 `ToolContextFactory` 和 host adapters。
3. 清理 `#agent/*` package import alias、边界配置、测试引用和已无意义的 preserved deletion candidate 文案。
4. 保持 `AlembicPlugin` agent-free，不回流任何 Agent/Tool/AI runtime。

本轮不是继续“保留候选”。执行窗口应以删除为目标；只有当删除会破坏真实 host-owned 功能时，才允许保留，并必须把保留文件移动或标注为 host-owned。

## 3. 删除边界

### 3.1 必须删除 / 消除

`Alembic`：

- `lib/agent/**` 中已由 `@alembic/agent/*` 覆盖的所有 duplicate implementation。
- `lib/tools/v2/adapter/V2CapabilityCatalog.ts`
- `lib/tools/v2/adapter/V2ToolRouterAdapter.ts`
- `lib/tools/v2/adapter/index.ts` 中除 `ToolContextFactory` 之外的 re-export。
- `lib/tools/v2/cache/**`
- `lib/tools/v2/capabilities/**`
- `lib/tools/v2/compressor/**`
- `lib/tools/v2/handlers/**`
- `lib/tools/v2/index.ts`
- `lib/tools/v2/registry.ts`
- `lib/tools/v2/router.ts`
- `lib/tools/v2/types.ts`
- `lib/tools/core/**`、`lib/tools/catalog/**`、`lib/tools/workflow/**` 中已经由 `@alembic/agent/tools` 覆盖且无 host adapter 依赖的文件。
- 生产侧和测试侧对本地 `#agent/*` 的依赖。
- package `imports` 中不再需要的 `#agent/*` 映射。

### 3.2 必须保留

`Alembic`：

- CLI、daemon、HTTP/API、Dashboard server、native/IDE/Lark/product shell。
- `lib/tools/v2/adapter/ToolContextFactory.ts`，除非已有明确替代 host bridge。
- Dashboard/Mac/Skill/Terminal/Workflow/MCP host adapters。
- DI container、repository/search/gateway/projectRoot/dataRoot/sandbox/write-zone wiring。
- Alembic host-owned AI config/env/settings HTTP and CLI UX。

### 3.3 不允许的状态

- 不允许继续把一整棵 `lib/agent/**` 留成“以后再删”。
- 不允许为了让 lint 通过保留空壳 facade。
- 不允许删除 host adapter 后把功能缺口转嫁给 Dashboard 或 Plugin。
- 不允许让 `AlembicPlugin` 重新依赖 `@alembic/agent`。

## 4. Wave 4 分派表

| 窗口 | 状态 | 任务 | 文档动作 | 保存位置 | 挂载入口 | 回填位置 | 验证命令 | 阻塞/依赖 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `Alembic` | 已完成 | 删除 duplicate local Agent implementation 和 generic Tool V2 implementation；清理 `#agent/*` alias、边界配置、测试引用；只保留明确 host-owned adapter。 | 已新建 | `docs/Alembic/alembic-local-agent-tool-implementation-deletion-2026-05-17.md` | 本文第 4 节 | 本文第 5.1 节和 Alembic 专项文档 | `npm run lint:agent-extraction-boundary`; `npm run build:check`; `npm run check`; `npm run build`; targeted unit tests; CLI status smoke | 上游 contract 已满足；提交 `6abf1321b39b31a4a33c59b4d357d7f1e191cf39`。 |
| `AlembicAgent` | 观察中 | 如果 Alembic 删除阶段发现缺少 public contract，立即补 export/type/test，禁止让 Alembic 保留第二套实现。 | 按需新建 | `docs/AlembicAgent/alembic-agent-wave-4-contract-gap-support-2026-05-17.md` | 本文第 4 节 | 本文第 5.2 节 | `npm run check`; self-reference import smoke | 仅被 Alembic 缺口触发。 |
| `AlembicPlugin` | 已完成 | 保持 agent-free；本轮无实现任务。 | 无需新建 | 本文 | 本文第 4 节 | 本文第 5.3 节 | 如 release 前重跑 plugin gates | 无。 |
| `AlembicDashboard` | 观察中 | 本轮无前端任务；若 Alembic 删除影响 API/UI contract 再复验。 | 无需新建 | 本文 | 本文第 4 节 | 本文第 5.4 节 | 如触发：`npm run build` | 等待 API contract 变化。 |
| `AlembicCore` | 观察中 | 本轮无 Core 任务；只有共享 deterministic contract 缺口才触发。 | 无需新建 | 本文 | 本文第 4 节 | 本文第 5.5 节 | 如触发：Core `npm run check` + 外层验证 | 无。 |

## 5. 执行细则

### 5.1 Alembic

执行目标：

- 删除 `lib/agent/**` 或把极少数 host-owned glue 从 `lib/agent` 移出，不再保留 `lib/agent` 作为重复实现目录。
- 删除 local generic Tool V2 implementation，最终 `lib/tools/v2/**` 只允许保留 `adapter/ToolContextFactory.ts` 和必要最小 index（如必须存在）。
- 清理 `#agent/*` alias；若 alias 仍存在，必须解释哪个正式源码还需要它。
- 更新 `scripts/lint-agent-extraction-boundary.mjs`，把 Wave 4 目标作为硬 gate：
  - production local Agent relative imports = 0。
  - production `#agent/*` imports = 0。
  - local generic Tool V2 duplicate files = 0。
  - preserved `lib/agent/**` files = 0，或只有明确 host-owned relocation 记录。
- 更新 `config/agent-extraction-boundary.json`，把已删除路径从 deletion candidate 移到 completed deletion evidence。
- 更新/删除测试：
  - 真正测试 Agent runtime 的单测迁到 `AlembicAgent` 或改为消费 `@alembic/agent/*`。
  - Alembic 只保留 host integration tests。

最低验收：

```text
npm run lint:agent-extraction-boundary
npm run build:check
npm run check
npm run build
node dist/bin/cli.js status --json
rg -n "#agent/|\.\./agent/|\.\./\.\./agent/|lib/agent/" lib bin scripts test --glob '*.ts' --glob '*.js' --glob '*.mjs'
find lib/agent -type f
find lib/tools/v2 -type f | sort
```

期望结果：

- `find lib/agent -type f` 不存在或为 0；若非 0，必须全部列入 host-owned relocation 清单。
- `find lib/tools/v2 -type f` 只剩 `lib/tools/v2/adapter/ToolContextFactory.ts` 和必要最小导出文件。
- `rg "#agent/"` 在正式源码中为 0；测试中如仍有引用，必须迁到 `@alembic/agent/*` 或删除。
- boundary lint 明确报告 Wave 4 删除已完成。

执行回填：

- 完成范围：Alembic 已删除 `lib/agent/**` 本地 duplicate implementation；删除 `lib/tools/core/**`、`lib/tools/catalog/**`、`lib/tools/workflow/**` 和 generic `lib/tools/v2/**` duplicate；只保留 `lib/tools/v2/adapter/ToolContextFactory.ts` 与 Alembic host adapters / host wiring。
- 提交 hash：`6abf1321b39b31a4a33c59b4d357d7f1e191cf39`，`chore: delete local agent tool duplicates`。
- 边界配置：`config/agent-extraction-boundary.json` 的 `phase9LocalAgentToolImplementationDeletion.status` 已关闭为 `closed`，`nextPhaseAllowed` 为 `true`。
- 测试引用：Alembic 测试侧本地 Agent imports 已切到 `@alembic/agent/*` public subpaths；纯本地 `EvolutionAgentRun` implementation 覆盖删除，归 AlembicAgent 维护。

验证结果：

| 命令 | 结果 |
| --- | --- |
| `npm run lint:agent-extraction-boundary` | 通过；`product #agent call sites: 0`，`local Agent relative import files: 0`，`local Agent relative imports: 0`，`preserved local Agent files: 0`，`duplicate generic Tool V2 files: 0`，`duplicate generic tool core/catalog/workflow files: 0`。 |
| `npm run build:check` | 通过。 |
| `npm run test:unit -- test/unit/AgentModuleBoundaries.test.ts test/unit/V2ToolSystem.test.ts test/unit/AgentTaskHandlers.test.ts test/unit/ToolForgeIntegration.test.ts test/unit/AgentService.test.ts test/unit/AgentRuntime.test.ts test/unit/MemorySystem.test.ts` | 通过；7 个 test files，177 个 tests。 |
| `npm run check` | 通过；存在既有 Biome warnings，未阻断。 |
| `npm run build` | 通过。 |
| `node dist/bin/cli.js status --json` | 通过；workspace detected，当前测试环境 database not found。 |
| `rg -n "#agent/\|\.\./agent/\|\.\./\.\./agent/\|lib/agent/" lib bin scripts test --glob '*.ts' --glob '*.js' --glob '*.mjs'` | 通过；无匹配。 |
| `find lib/agent -type f` | 删除证据通过；`lib/agent` 已不存在。 |
| `find lib/tools/v2 -type f \| sort` | 通过；只剩 `lib/tools/v2/adapter/ToolContextFactory.ts`。 |
| `npm run test:unit` | 已尝试；受当前 sandbox 环境阻塞，`SandboxNetworkProxy.test.ts` 因 `listen EPERM 127.0.0.1` 失败，`TerminalAdapter.test.ts` 因 `sandbox-exec sandbox_apply Operation not permitted` 失败；Wave 4 targeted suites 已通过。 |

遗留风险：

- `ToolContextFactory` 是 Alembic host-owned bridge，后续巡检需继续把它与 generic Tool V2 duplicate 区分开。
- 若 Alembic 后续需要 Agent capabilities / policies / strategies 等更深 contract，应由 AlembicAgent 补 public export/type/test，不应恢复本地 duplicate 文件。
- 完整 `npm run test:unit` 需要在允许 loopback listen 与 `sandbox-exec` 的环境中复跑。

下一步建议：

- 总控复验提交 `6abf1321b39b31a4a33c59b4d357d7f1e191cf39` 的删除清单和 validation 输出。
- 后续 acceptance 或下游 smoke 只验证消费 contract，不恢复 Alembic 本地 Agent/tool duplicate implementation。
- 保持 `npm run lint:agent-extraction-boundary` 作为硬 gate，防止 `#agent/*`、本地 `lib/agent/**`、generic Tool V2 duplicate 回流。

总控复验：

- 复验时间：2026-05-17。
- 复验结论：通过。Wave 4 可以关闭，下一波进入 terminal/sandbox 分层边界。
- 复验命令：
  - `git -C Alembic status --short`：干净。
  - `git -C Alembic log -3 --oneline`：最新提交 `6abf132 chore: delete local agent tool duplicates`。
  - `rg -n "#agent/|\.\./agent/|\.\./\.\./agent/|lib/agent/" lib bin scripts test --glob '*.ts' --glob '*.js' --glob '*.mjs'`：无匹配。
  - `rg --files lib/agent`：目录不存在。
  - `rg --files lib/tools/v2`：只剩 `lib/tools/v2/adapter/ToolContextFactory.ts`。
  - `npm run lint:agent-extraction-boundary`：通过，`preserved local Agent files: 0`，`duplicate generic Tool V2 files: 0`，`duplicate generic tool core/catalog/workflow files: 0`。
  - `npm run build:check`：通过。
  - `npm run test:unit -- test/unit/AgentModuleBoundaries.test.ts test/unit/V2ToolSystem.test.ts test/unit/AgentTaskHandlers.test.ts test/unit/ToolForgeIntegration.test.ts test/unit/AgentService.test.ts test/unit/AgentRuntime.test.ts test/unit/MemorySystem.test.ts`：通过，7 个 test files，177 个 tests。
  - `npm run check`：通过，仍有既有 Biome warnings。
  - `npm run build`：通过。
  - `node dist/bin/cli.js status --json`：通过，workspace detected，测试环境 database not found。

### 5.2 AlembicAgent

执行目标：

- 不主动扩范围。
- 一旦 Alembic 删除阶段反馈缺口，补齐 public contract，而不是让 Alembic 保留 duplicate implementation。
- 可能触发的 export 类型：
  - `@alembic/agent/capabilities`
  - `@alembic/agent/policies`
  - `@alembic/agent/strategies`
  - 更结构化的 `ToolForgeOptions` / constructor contract

完成标准：

- 任何新增 export 都有 package exports、barrel、contract test 和 `npm run check`。

### 5.3 AlembicPlugin

执行目标：

- 保持 agent-free 状态。
- release / marketplace sync 前重跑 release readiness gate。

### 5.4 AlembicDashboard

执行目标：

- 观察即可。
- 如果 Alembic 删除后 HTTP/API response contract 变化，再启动 Dashboard smoke。

### 5.5 AlembicCore

执行目标：

- 观察即可。
- 不承接 Agent runtime/tool implementation。

## 6. Wave 4 完成标准

Wave 4 完成后，`Alembic` 应达到：

- 生产侧完全消费 `@alembic/agent`，不再维护本地 Agent runtime duplicate tree。
- `lib/agent/**` 删除或彻底迁出为明确 host-owned glue。
- generic Tool V2 duplicate implementation 删除，只剩 host bridge。
- `AlembicPlugin` 继续保持 0 Agent/AI/Tool boundary import。
- `AlembicAgent` 成为 Agent/tool generic implementation 的唯一维护仓库。

## 7. 可复制分派提示词

```text
读取 docs/workspace/alembic-agent-cutover-plugin-cleanup-wave-4-deletion-plan-2026-05-17.md，按照文档，领取并完成分配给你所在窗口的任务；完成后回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。
```

本提示词当前发给：

- `Alembic`

`AlembicAgent` 是支援窗口：只有当 `Alembic` 删除阶段反馈 contract 缺口时领取。`AlembicPlugin`、`AlembicDashboard`、`AlembicCore` 本轮保持已完成 / 观察。
