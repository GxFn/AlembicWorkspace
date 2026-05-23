# AlembicAgent Small Fix / Cleanup Self-Check

日期：2026-05-23
窗口定位：`AlembicAgent` 执行窗口
目标仓库：`AlembicAgent`
状态：已完成自检回填，未直接修复产品源码
提交 hash：无（本轮只做自检和 workspace 文档回填）

## 仓库职责声明

本窗口只负责 `AlembicAgent` 仓库内的 Agent runtime、AI provider、tool system、策略、上下文、memory、prompt、执行循环和宿主工具编排自检。

本轮明确不负责 `AlembicCore` 的确定性内核、`AlembicDashboard` UI、`AlembicPlugin` Codex MCP / marketplace / channel、`Alembic` CLI / daemon / release 底座，也不操作真实测试项目。

## 自检范围

- 已读取 workspace `AGENTS.md`、`docs/workspace/index.md`、当前总控计划和 `AlembicAgent/AGENTS.md`。
- 检查 `package.json` scripts、README、AGENTS、`src/`、`test/`、`scripts/`、`config/`。
- 扫描 TODO / FIXME / deprecated / legacy / compat / cleanup、旧 Feishu/Lark、旧 Dashboard / Plugin / marketplace / channel、绝对路径、跨仓库路径、临时目录和 release artifact 线索。
- 检查 AI provider / model registry、L4 compaction、package asset path、public API / import boundary、Tool V2 / host adapter 边界。
- 运行 repo-local 类型检查、边界 lint、Biome lint 和相关局部测试。

## 发现的问题

| ID | 严重度 | 类型 | 现象 | 影响范围 | 建议处理 |
| --- | --- | --- | --- | --- | --- |
| SFC-Agent-001 | P1 | lint / 小清理 | `npm run lint` 当前失败：1 个格式错误、19 个警告，集中在非空断言、未使用 import / 变量 / 私有方法、可选链建议、`void` union 可读性和 `AgentRuntime.ts` 格式。 | 会导致 `npm run check` 早停；后续小修复包可以一次性清掉，不改变产品边界。 | 下一阶段安排 `AlembicAgent` 执行小修复：按 Biome 输出逐项处理，修完后跑 `npm run lint`、`npm run check` 或等价拆分命令。 |
| SFC-Agent-002 | P2 | 用户可见错误文案 / 边界表达 | AI provider 缺 key 文案硬编码指向 `Alembic Dashboard` 的 `AI Settings`。 | 在 Plugin first / host agent 场景下，用户可能从 Agent runtime 收到 UI 特定且不一定存在的配置指引；也会让 Agent provider 层看起来依赖 Dashboard。 | 将 provider 缺 key 错误改为 host-neutral 的错误码 / metadata / 通用配置提示，由 Dashboard 或宿主 adapter 渲染具体 UI 指引；同步加 provider 缺 key 文案测试。 |
| SFC-Agent-003 | P2 | 临时开关 / runtime 行为决策 | L4 compaction 仍保留“临时止血开关”，默认不自动触发，只能显式配置或通过 `ALEMBIC_AGENT_ENABLE_L4_COMPACTION=1` 打开。 | 当前测试证明这是有意保护，不是坏链；但“临时”状态没有本轮内处理结论，后续预算压力下是否自动 L4 仍需产品决策。 | 总控或用户确认后再修：继续保留 opt-in 并改成正式配置 / 文档，或在 note_finding 证据链验收后恢复自动触发；不要在本轮自检中直接改默认行为。 |
| SFC-Agent-004 | P3 | 兼容 / 清理候选 | `src/shared/package-assets.ts` 仍定义 `CONFIG_DIR`、`INTERNAL_SKILLS_DIR`、`INJECTABLE_SKILLS_DIR`、deprecated `SKILLS_DIR`、`TEMPLATES_DIR`、`RESOURCES_DIR`、`DASHBOARD_DIR`；仓库内扫描只有 `PACKAGE_ROOT` 被 runtime 消费。 | 可能是无消费方内部兼容残留；`DASHBOARD_DIR` 等常量会弱化仓库边界表达。但该文件不是顶层 public export，删除风险较低但仍需跨仓库确认。 | 下一阶段先做跨仓库消费者扫描；若 `Alembic` / `AlembicPlugin` / release scripts 无消费方，再删除未用常量或收窄为内部实现，不直接删除可能被包内相对路径消费的 `PACKAGE_ROOT`。 |

## 关键证据

- `npm run lint` 失败：Biome 输出 `Found 1 error`、`Found 19 warnings`；代表性位置包括 `src/agent/context/ContextWindow.ts:869`、`src/agent/context/ExplorationTracker.ts:43`、`src/agent/domain/EvidenceCollector.ts:385`、`src/agent/runtime/AgentRuntime.ts:667`、`src/agent/runtime/HookSystem.ts:61`、`src/agent/service/AgentService.ts:9`，以及 `src/agent/runtime/AgentRuntime.ts` 格式差异。
- Dashboard AI Settings 文案：
  - `src/external/ai/AiFactory.ts:105`
  - `src/external/ai/providers/OpenAiProvider.ts:301`
  - `src/external/ai/providers/ClaudeProvider.ts:331`
  - `src/external/ai/providers/DeepSeekProvider.ts:453`
  - `src/external/ai/providers/GoogleGeminiProvider.ts:473`
- Dashboard consumer 注释：
  - `src/external/ai/registry/ProviderConfig.ts:5`
  - `src/external/ai/registry/ModelRegistry.ts:10`
  - `src/external/ai/registry/model-defs.ts:5`
- L4 默认禁用证据：
  - `src/agent/runtime/BudgetController.ts:53`
  - `src/agent/runtime/BudgetController.ts:158`
  - `src/agent/context/ContextWindow.ts:240`
  - `test/BudgetController.test.ts`、`test/ContextWindow.test.ts`、`test/AgentRuntime.test.ts` 覆盖当前默认禁用 / opt-in 行为。
- package asset 清理候选：
  - `src/shared/package-assets.ts:36` 到 `src/shared/package-assets.ts:57`
  - `rg "package-assets|DASHBOARD_DIR|SKILLS_DIR|CONFIG_DIR|RESOURCES_DIR|TEMPLATES_DIR|PACKAGE_ROOT"` 显示仓库内只有 `src/agent/capabilities/Conversation.ts` 和 `src/tools/v2/capabilities/ConversationV2.ts` 消费 `PACKAGE_ROOT`。

## 判定为非问题或观察项

- `test/feishu-remote-removal.test.ts` 是负向 contract 测试，验证旧外部 bridge preset / channel / event 不暴露；不是 Feishu/Lark 产品残留。
- `src/tools/v2/adapter/V2ToolRouterAdapter.ts`、`src/tools/core/LightweightRouter.ts`、`src/agent/runtime/AgentRuntimeBoundary.ts` 中的 Plugin / marketplace / channel 文案用于表达“不在 AlembicAgent 实现”的边界，当前不判为残留。
- Model registry 的 deprecated 模型仍未到退役日：Claude 旧模型退役日为 2026-06-15，OpenAI `gpt-4o` 退役日为 2026-07-14，DeepSeek legacy 退役日为 2026-07-24；本轮只观察，不建议提前删除。
- `/tmp`、`localhost`、`127.0.0.1` 命中主要来自测试 fixture 或 Ollama 默认配置，不构成当前清理问题。

## 验证命令与结果

| 命令 | 结果 |
| --- | --- |
| `git status --short`（`AlembicAgent`） | 通过；目标仓库产品代码自检前为干净状态。 |
| `npm run build:check` | 通过。 |
| `npm run lint:agent-import-boundary` | 通过；`AlembicAgent import boundary check passed.` |
| `npm run lint:public-api-boundary` | 通过；`15 exact exports, no wildcard exports.` |
| `npm run lint:core-import-boundary` | 通过；扫描 230 个文件和 49 个 `@alembic/core` imports。 |
| `npm run lint` | 失败；Biome 报 1 个 error、19 个 warnings，见 SFC-Agent-001。 |
| `npm run test -- test/BudgetController.test.ts test/ContextWindow.test.ts test/ai-provider.test.ts test/contract-surface.test.ts test/feishu-remote-removal.test.ts` | 通过；5 个文件、23 个测试全部通过。 |

## 未运行命令理由

- 未运行 `npm run check`：该命令会先执行已失败的 `npm run lint`，因此本轮用拆分命令保留了更清晰的失败证据，并额外跑了相关局部测试。
- 未运行 `npm run release:stage`、`npm run release:pack-preview`、`npm run smoke:public-imports`：这些命令会构建或生成发布 / staging / pack preview 产物，本轮计划要求只做小问题自检，不做发布链路验证。
- 未运行真实项目、冷启动、daemon 或跨仓库集成验证：本轮不触碰真实测试项目，跨仓库消费者确认应由下一阶段总控修复包安排。

## 需要升级或确认的问题

- SFC-Agent-003 需要总控或用户确认 L4 默认行为：继续正式化 opt-in，还是在证据链稳定后恢复自动触发。
- SFC-Agent-004 删除前需要跨仓库消费者扫描，避免误删外部仍通过深路径消费的内部常量。
- SFC-Agent-002 如果 Dashboard 仍是某些宿主的首选配置 UI，应由 Dashboard / host adapter 保留 UI 指引，而不是由 Agent provider 层硬编码。

## 遗留风险

- 本轮未做跨仓库消费者扫描，因此 package asset 常量只能列为清理候选，不能直接删除。
- 本轮未跑完整 `npm run check` 和 release staging；已知原因是 `npm run lint` 失败和本轮不生成发布产物。
- Alembic Codex 本地状态检查不可用：项目未初始化，且诊断显示 plugin runtime pin / metadata 问题；本轮未依赖 Alembic Recipe 知识，只基于真实代码、脚本和验证命令完成自检。

## 回填信息

- 回填文档路径：`docs/AlembicAgent/small-fix-cleanup-self-check-2026-05-23.md`
- 产品代码提交 hash：无
- 产品代码改动：无
- 推荐下一步：总控将 SFC-Agent-001 到 SFC-Agent-004 纳入下一阶段修复 / 观察 / 用户确认分类；其中 SFC-Agent-001 可作为最小小修复包优先处理。
