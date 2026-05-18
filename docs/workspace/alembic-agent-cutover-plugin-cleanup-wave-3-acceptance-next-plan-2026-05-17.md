# Alembic Agent Cutover And Plugin Cleanup Wave 3 Acceptance Next Plan

日期：2026-05-17
总控窗口：AlembicWorkspace
状态：已完成

本文承接 `docs/workspace/alembic-agent-extraction-boundary-wave-2-acceptance-next-plan-2026-05-17.md`、`docs/workspace/alembic-tool-v2-contract-consumption-2026-05-17.md` 和 `docs/workspace/alembic-plugin-release-readiness-2026-05-17.md`。本轮目标是验收“`Alembic` 完全切换使用 `AlembicAgent`”与“`AlembicPlugin` 清理干净 agent”的真实进度，并分派下一波任务。

## 1. 总控验收结论

| 窗口 | 结论 | 证据 | 判断 |
| --- | --- | --- | --- |
| `AlembicPlugin` | 已验收：agent / tool / local AI runtime 已清理干净 | `report:agent-extraction-boundary` 扫描 316 个源文件，boundary imports 为 0；`lib/agent`、`lib/tools`、`lib/external/ai` 目录不存在；`build:check` 通过 | 本轮无需继续清理 agent。后续只保留 release / marketplace 前置 gate。 |
| `Alembic` | 已完成：最后 3 个生产侧本地 `lib/agent/**` 调用已切到 `@alembic/agent/*` | `4be3b1e`; boundary lint 通过，`local Agent relative import files: 0`，`local Agent relative imports: 0`; `build:check` 与代表性单测通过 | 可进入 Wave 4 删除 / quarantine。 |
| `AlembicAgent` | 已完成：remaining host contract surface 已补齐 | `bd97459`; `@alembic/agent/forge`、`@alembic/agent/tasks`、`@alembic/agent/profiles` import smoke 通过；`npm run check` 通过 | Wave 4 只作为 contract gap 支援窗口。 |
| `AlembicDashboard` | 已完成上一轮 live contract 复验；本轮无新任务 | 已有 Dashboard live host-managed 记录 | 观察中。 |
| `AlembicCore` | 本轮无直接任务 | 未发现 Core package/resource 缺口 | 观察中。 |

总控判断：

- `AlembicPlugin` 的 agent 清理可以验收为完成；不要重新引入 `@alembic/agent`、`#agent/*`、`#tools/*` 或本地 Agent/Tool runtime。
- `Alembic` 不能直接删除 `lib/agent/**`，因为仍存在真实生产调用和测试覆盖依赖。下一波必须先做 contract cutover，不做删除。
- Wave 3 存在明确上游依赖：`AlembicAgent` 必须先补齐 public contract，`Alembic` 才能切走最后本地 `lib/agent` 生产调用。`Alembic` 在 `AlembicAgent` 回填提交 hash 和验证结果前状态是 `阻塞`，不是可直接启动。
- 总控复验确认：`AlembicAgent` 已完成并通过验收，提交 `bd97459`；`Alembic` 的上游阻塞已解除，当前状态改为 `待启动`。
- 按“一波一阶段”规则，Wave 3 只做“剩余本地 Agent 生产调用切换”；Tool V2 generic 文件删除、`lib/agent/**` 删除或 quarantine 进入 Wave 4。

## 2. 本轮真实代码扫描

### 2.1 仓库状态

| 仓库 | `git status --short` | 说明 |
| --- | --- | --- |
| `Alembic` | 空 | 无未提交源码改动。 |
| `AlembicPlugin` | 空 | 无未提交源码改动。 |
| `AlembicAgent` | 空 | 无未提交源码改动。 |
| `AlembicDashboard` | 空 | 无未提交源码改动。 |
| `AlembicCore` | 空 | 无未提交源码改动。 |

### 2.2 验收命令

| 仓库 | 命令 | 结果 |
| --- | --- | --- |
| `Alembic` | `npm run lint:agent-extraction-boundary` | 通过；`product #agent call sites: 1`，`local AI provider consumers: 0`，`local common tool consumers: 0`，`local memory/context consumers: 0`，`local service/runtime/prompts/domain consumers: 0`。 |
| `Alembic` | `npm run build:check` | 通过。 |
| `AlembicPlugin` | `npm run report:agent-extraction-boundary` | 通过；`filesWithBoundaryImports: 0`，Agent / AI / Tool imports 均为 0。 |
| `AlembicPlugin` | `npm run build:check` | 通过。 |
| `AlembicAgent` | `npm run check` | 通过；6 个 test files、27 个 tests。Biome 仍有既有 27 个 warning，未阻断。 |

### 2.3 Alembic 剩余本地 Agent 调用事实

生产侧仍有以下本地 `lib/agent/**` 调用：

| 文件 | 本地调用 | 判断 |
| --- | --- | --- |
| `lib/injection/modules/AgentModule.ts` | `../../agent/forge/ToolForge.js` | 需要由 `AlembicAgent` 显式导出 `ToolForge` contract 后切换。 |
| `lib/http/routes/ai.ts` | `../../agent/profiles/presets.js` | `AlembicAgent` 已从 `@alembic/agent/agent` 导出 `PRESETS`，但建议下一波补显式 `@alembic/agent/profiles` 或记录为何使用 `./agent` 根。 |
| `lib/http/routes/ai.ts` | `../../agent/tasks/AgentTaskHandlers.js` | 需要由 `AlembicAgent` 显式导出 task handlers 后切换。 |

本地 Tool V2 仍有以下调用：

| 文件 | 调用 | 判断 |
| --- | --- | --- |
| `lib/injection/modules/AgentModule.ts` | `#tools/v2/adapter/ToolContextFactory.js` | host-owned bridge，继续保留。 |
| `lib/tools/v2/capabilities/CapabilityV2.ts` | `#agent/capabilities/Capability.js` | 位于 Tool V2 generic deletion candidate 内；不作为长期生产调用保留。 |

文件规模：

- `Alembic/lib/agent`：98 个文件，仍是 preserved deletion candidates。
- `Alembic/lib/tools/v2`：35 个文件，其中只有 `adapter/ToolContextFactory.ts` 是明确 host-owned；其余 generic files 是 Wave 4 删除 / quarantine 候选。

### 2.4 AlembicPlugin 清理事实

已确认：

- `package.json` 不再声明 `#agent/*`、`#tools/*`、`@alembic/agent`。
- `lib/agent`、`lib/tools`、`lib/external/ai` 不存在。
- `lib/injection/modules/AgentModule.ts` 只注册 `SkillHooks`，不注册 local agent runtime、terminal execution 或 tool registry。
- `lib/injection/ServiceMap.ts` 已移除 legacy Agent unknown fields，仅保留 plugin delivery 需要的 `skillHooks`。
- `test/integration/ServiceContainer.test.ts` 明确断言 `container.get('toolRegistry')` 会失败。

保留说明：

- `lib/codex/HostAiAdapter.ts` 是 Codex host AI adapter，不是 Alembic Agent runtime 或本地 AI provider 复刻。
- Plugin 仍应保留 Codex MCP、Skill、channel、marketplace、runtime packaging、verify/smoke/release chain。

## 3. Wave 3 目标

Wave 3 只做一个阶段：剩余本地 Agent 生产调用切换到 `AlembicAgent` public contract。

### 3.1 依赖链和启动顺序

1. `AlembicAgent` 先执行：已完成，提交 `bd97459`，补齐 `@alembic/agent/forge`、`@alembic/agent/tasks`、`@alembic/agent/profiles` 等 public contract。
2. 总控验收 `AlembicAgent` 回填后，将 `Alembic` 从 `阻塞` 改为 `待启动`：已完成，验收命令和 self-reference import smoke 通过。
3. `Alembic` 后执行：当前 `待启动`，消费新 Agent contract，切走最后 3 个本地 `lib/agent` 生产调用。

`AlembicAgent` contract 已落地；`Alembic` 可以开始 Wave 3 cutover，但本波仍不得删除 `lib/agent/**` 或 `lib/tools/v2/**` generic files。

不做：

- 不删除 `Alembic/lib/agent/**`。
- 不删除 `Alembic/lib/tools/v2/**` generic files。
- 不迁移或删除 `ToolContextFactory`、Dashboard/Mac/Skill/Terminal/Workflow host adapters。
- 不让 `AlembicPlugin` 重新依赖 `@alembic/agent`。

完成 Wave 3 后，才允许启动 Wave 4：Alembic 本地 duplicate Tool V2 / preserved local Agent implementation 删除或 quarantine。

## 4. Wave 3 分派表

| 窗口 | 状态 | 任务 | 文档动作 | 保存位置 | 挂载入口 | 回填位置 | 验证命令 | 阻塞/依赖 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `AlembicAgent` | 已完成 | 补齐 remaining host contract surface：显式导出 `ToolForge`、`AgentTaskHandlers`、profiles/presets；增加 package exports 和 contract tests。 | 新建 | `docs/AlembicAgent/alembic-agent-remaining-host-contract-surface-2026-05-17.md` | 本文第 4 节；完成后更新本文第 5.1 节 | 本文第 5.1 节和新文档验收章节 | `npm run check` | 已完成；Alembic 可开始切走最后本地 `lib/agent` 生产调用。 |
| `Alembic` | 已完成，待总控验收 | `AlembicAgent` 新 public contract 已验收；已切走 `AgentModule.ts` 和 `http/routes/ai.ts` 中最后 3 个本地 `lib/agent` 生产调用，并扩展边界 lint 捕捉相对路径本地 Agent 调用。 | 已新建 | `docs/Alembic/alembic-remaining-local-agent-callsite-cutover-2026-05-17.md` | 本文第 4 节；完成后更新本文第 5.2 节 | 本文第 5.2 节和新文档验收章节 | `npm run lint:agent-extraction-boundary`; `npm run build:check`; `npm run test:unit -- test/unit/AgentTaskHandlers.test.ts test/unit/ToolForgeIntegration.test.ts test/unit/AgentModuleBoundaries.test.ts` | 已完成；本波未删除 `lib/agent/**` 和 `lib/tools/v2/**`。 |
| `AlembicPlugin` | 已完成 | 本轮无需继续清理 agent；保持 release readiness，避免重新引入 Agent/Tool/AI runtime。 | 无需新建 | 本文 | 本文第 4 节 | 本文第 5.3 节 | 如 release / sync 前再运行：`npm run report:agent-extraction-boundary`; `npm run build:check`; `npm run verify:codex-plugin`; `npm run smoke:codex-plugin` | 无。 |
| `AlembicDashboard` | 观察中 | 本轮无前端任务；如后续 Alembic/Plugin API contract 变化再复验 host-managed UI。 | 无需新建 | 本文 | 本文第 4 节 | 本文第 5.4 节 | 如触发：`npm run build` | 等待后端/API contract 变化。 |
| `AlembicCore` | 观察中 | 本轮无 Core 任务；仅在 Agent/Alembic 切换暴露 Core package/resource 缺口时启动。 | 无需新建 | 本文 | 本文第 4 节 | 本文第 5.5 节 | 如触发：Core `npm run check` + 外层 build | 无。 |

## 5. 执行细则

### 5.1 AlembicAgent

目标：

- 为 Alembic 最后 3 个本地 Agent 生产调用提供稳定 public contract。
- 优先显式补齐以下入口：
  - `@alembic/agent/forge`：导出 `ToolForge` 及必要类型。
  - `@alembic/agent/tasks`：导出 `taskCheckAndSubmit`、`taskDiscoverAllRelations`、`taskFullEnrich`、`taskQualityAudit` 及必要 context/type contract。
  - `@alembic/agent/profiles`：导出 `PRESETS`、`getPreset`、`resolveStrategy`。
- 如果决定复用已有 `@alembic/agent/agent` 根入口，必须在文档中说明为什么不新增显式子路径。

禁止：

- 不把 Alembic host adapters、DI container、Dashboard/Mac/Skill/Terminal execution、Codex plugin delivery 迁入 Agent。
- 不用空壳 export 冒充 contract；导出的必须是真实当前实现。

完成标准：

- package `exports`、源码 index、类型声明和 contract tests 一致。
- `npm run check` 通过。
- 新文档回填完成范围、提交 hash、验证命令、遗留风险、给 Alembic 的消费说明。

执行回填（2026-05-17）：

- 完成范围：
  - 新增 `@alembic/agent/forge`，导出 `ToolForge`、forge 编排组件和相关类型。
  - 新增 `@alembic/agent/tasks`，导出 `taskCheckAndSubmit`、`taskDiscoverAllRelations`、`taskFullEnrich`、`taskQualityAudit`、`taskGuardFullScan` 和 task context/type contracts。
  - 新增 `@alembic/agent/profiles`，导出 `PRESETS`、`getPreset`、`resolveStrategy`、profile compiler/registry/stage factory 和 built-in profile definitions。
  - 新增 `test/remaining-host-contract.test.ts` 覆盖三个新 subpath 的真实 exports。
  - 更新 package metadata 到 `phase-8-remaining-host-contract`。
- 提交 hash：`bd97459`
- 验证命令：
  - `npm run build:check`
  - `npm run test`
  - `npm run check`
  - `npm run build`
  - `@alembic/agent/forge`、`@alembic/agent/tasks`、`@alembic/agent/profiles` self-reference import smoke
- 验证结果：
  - `npm run build:check` 通过。
  - `npm run test` 通过，7 个 test files、30 个 tests。
  - `npm run check` 通过。
  - `npm run build` 通过。
  - self-reference import smoke 通过。
  - Biome 仍有既有 27 个 warning，但未阻断。
- 遗留风险：
  - `Alembic` 尚未消费新 subpath，最后 3 个生产侧本地 `lib/agent` 调用仍需 Alembic 窗口切换。
  - `Alembic/lib/agent/**` 删除仍未解锁，必须等 Alembic Wave 3 import 扫描为 0 后进入 Wave 4。
  - `ToolForge` 的 concrete host wiring 仍属于 Alembic，不迁入 Agent。
- 下一步建议：
  - `Alembic` 启动 Wave 3 cutover：`AgentModule.ts` 切 `ToolForge` 到 `@alembic/agent/forge`，`http/routes/ai.ts` 切 task handlers 到 `@alembic/agent/tasks`，`PRESETS` 切到 `@alembic/agent/profiles`。
  - `Alembic` 同步扩展 boundary lint，阻断生产侧相对路径导入本地 `lib/agent/**`。
  - Wave 3 通过后再启动 Wave 4 duplicate local Agent / Tool V2 删除或 quarantine。

### 5.2 Alembic

目标：

- 在 AlembicAgent 新 public contract 可用后，切换最后 3 个本地 `lib/agent` 生产调用：
  - `lib/injection/modules/AgentModule.ts`：`ToolForge`
  - `lib/http/routes/ai.ts`：`PRESETS`
  - `lib/http/routes/ai.ts`：`AgentTaskHandlers`
- 扩展 `scripts/lint-agent-extraction-boundary.mjs`，让它同时捕捉生产侧相对路径本地 Agent 调用，避免只统计 `#agent/*` 而漏掉 `../../agent/**`。
- 更新 `config/agent-extraction-boundary.json`，记录 Wave 3 evidence 和 Wave 4 删除入口条件。

禁止：

- 本波不删除 `lib/agent/**`。
- 本波不删除 `lib/tools/v2/**` generic files。
- 不删除 `ToolContextFactory` 或 host adapters。

完成标准：

- 生产侧 `lib/bin/scripts` 中本地 `lib/agent/**` import 为 0，除 `lib/agent/**` 自身实现文件外。
- boundary lint 能报告并阻断新的生产侧本地 Agent 相对路径调用。
- 指定验证命令通过。
- 回填新文档和本文第 5.2。

执行回填（2026-05-17）：

- 完成范围：
  - `lib/injection/modules/AgentModule.ts` 将 `ToolForge` 从本地 `../../agent/forge/ToolForge.js` 切换到 `@alembic/agent/forge`。
  - `lib/http/routes/ai.ts` 将 `PRESETS` 切换到 `@alembic/agent/profiles`，将 5 个 task handlers 切换到 `@alembic/agent/tasks`。
  - `scripts/lint-agent-extraction-boundary.mjs` 扩展为扫描 `lib`、`bin`、`scripts` 源文件，解析相对路径并阻断生产侧本地 `lib/agent/**` 相对导入。
  - `config/agent-extraction-boundary.json` 回填 Wave 3 evidence、相对路径本地 Agent import policy 和 Wave 4 deletion / quarantine 入口条件。
- 提交 hash：`4be3b1e`
- 验证命令：
  - `@alembic/agent/forge`、`@alembic/agent/tasks`、`@alembic/agent/profiles` import smoke
  - `npm run lint:agent-extraction-boundary`
  - `rg -n "\\.\\./\\.\\./agent/|\\.\\./agent/|#agent/|lib/agent/" lib bin scripts --glob '*.ts' --glob '*.js' --glob '*.mjs'`
  - `npm run build:check`
  - `npm run test:unit -- test/unit/AgentTaskHandlers.test.ts test/unit/ToolForgeIntegration.test.ts test/unit/AgentModuleBoundaries.test.ts`
  - `npm run lint -- --diagnostic-level=error`
  - `npm run check`
  - `npm run build`
  - `node dist/bin/cli.js status --json`
- 验证结果：
  - import smoke 通过。
  - `npm run lint:agent-extraction-boundary` 通过；`local Agent relative import files: 0`，`local Agent relative imports: 0`。
  - 生产侧本地 `lib/agent/**` 相对导入扫描无匹配；仅剩 lint 脚本文本和 classified `lib/tools/v2/capabilities/CapabilityV2.ts` 的 `#agent/capabilities/Capability.js`。
  - `npm run build:check` 通过。
  - 指定单测通过，3 个 test files、15 个 tests。
  - `npm run lint -- --diagnostic-level=error` 通过。
  - `npm run check` 通过；既有 Biome warnings 未阻断。
  - `npm run build` 通过。
  - CLI status smoke 通过；workspace detected，database 在当前测试环境 not found。
- 遗留风险：
  - `lib/agent/**` 仍保留为删除候选；本波未删除。
  - `lib/tools/v2/**` 仍保留为 Wave 4 删除 / quarantine 候选；`ToolContextFactory` 继续 host-owned。
  - `lib/tools/v2/capabilities/CapabilityV2.ts` 的 classified `#agent/capabilities/Capability.js` 仍需 Wave 4 处理。
  - `ToolForge` public declaration 仍带 Agent 内部 nominal class 类型；Alembic 侧用最小 constructor bridge 隔离 TypeScript 私有字段身份差异。
- 下一步建议：
  - 总控复验 `4be3b1e` 后进入 Wave 4。
  - Wave 4 先做 duplicate local Agent / Tool V2 implementation 删除候选审计，再分批删除或 quarantine。
  - 删除前继续保护 `ToolContextFactory` 和 Dashboard/Mac/Skill/Terminal/Workflow/MCP host adapters。

### 5.3 AlembicPlugin

目标：

- 保持已清理状态。
- release / marketplace sync 前按 release readiness 文档重跑 gate。

禁止：

- 不新增 `@alembic/agent` 依赖。
- 不恢复 `lib/agent/**`、`lib/tools/**`、`lib/external/ai/**`。
- 不恢复 `toolRegistry` / `agentService` 等 legacy Agent ServiceMap 字段。

完成标准：

- 本轮无需改动；若后续 release 触发，按 release readiness 文档回填。

### 5.4 AlembicDashboard

目标：

- 观察即可。
- 若后续 host-managed API contract 或 Agent handoff endpoint 改变，再启动 UI 复验。

### 5.5 AlembicCore

目标：

- 观察即可。
- 若 Agent public exports 需要 Core contract 调整，必须先在 Core 源仓库完成、验证、提交，再由 Agent/Alembic 消费。

## 6. Wave 4 预告

Wave 3 验收通过后，下一波才允许启动删除 / quarantine：

1. `Alembic` 删除或 quarantine 已由 `@alembic/agent/tools/v2` 覆盖的 local generic Tool V2 files，仅保留 `ToolContextFactory` 和 host adapters。
2. `Alembic` 对 `lib/agent/**` 做目录级删除候选复核：删除已经完全由 `@alembic/agent/*` 替代的 implementation copy；保留仍被证明为 host-owned 的 glue。
3. `AlembicAgent` 如发现缺口继续补 public contract，不让 Alembic 维护第二套 generic Agent runtime。
4. `AlembicPlugin` 继续保持 agent-free plugin runtime，只做 release gate。

Wave 4 入口条件：

- Wave 3 中 Alembic 生产侧本地 `lib/agent/**` import 为 0。
- Agent public contract tests 通过。
- Alembic boundary lint、build、代表性 tests 通过。
- 总控验收文档回填完成。

## 7. 可复制分派提示词

```text
读取 docs/workspace/alembic-agent-cutover-plugin-cleanup-wave-3-acceptance-next-plan-2026-05-17.md，按照文档，领取并完成分配给你所在窗口的任务；完成后回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。
```

本提示词当前发给：

- `Alembic`

`AlembicAgent` 已完成本轮任务；`AlembicPlugin`、`AlembicDashboard`、`AlembicCore` 本轮为已完成 / 观察窗口，除非它们被上游结果触发，不需要领取执行任务。
