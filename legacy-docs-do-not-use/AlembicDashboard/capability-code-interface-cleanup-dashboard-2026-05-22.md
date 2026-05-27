# AlembicDashboard CCIC-P1-D Execution Record

日期：2026-05-22
窗口：AlembicDashboard
任务包：CCIC-P1-D
状态：待总控验收

## 窗口定位

本窗口是 `AlembicDashboard` 执行窗口。本轮职责只覆盖 Dashboard 前端 UI、API client、i18n 文案和前端构建验证；不修改 Alembic、AlembicCore、AlembicAgent、AlembicPlugin、AlembicTest 或真实项目源码，不运行真实项目手动验证。

## 完成范围

- `src/api.ts`：扩展 host-managed AI unavailable parser，继续兼容旧 `HOST_AI_MANAGED` / `hostManaged`，同时接受后续 producer 可能新增的 `HOST_AGENT_MANAGED`、`CODEX_HOST_AGENT_MANAGED`、`LOCAL_AI_UNAVAILABLE`、`canonicalCode`、`boundaryCode`、`hostAgentManaged`、`hostAiManaged`、`localAiUnavailable`、`managedBy` 和 nested `meta` / `boundary` 字段。
- `src/api.ts`：`HostManagedUnavailableError` 保留 `hostManaged=true` 旧消费路径，并附带 `hostAgentManaged` / `localAiUnavailable` 归一化标记，避免 Dashboard 要求 Plugin 做 breaking change。
- `src/i18n/locales/zh.ts`、`src/i18n/locales/en.ts`：Help 双语文案从固定 MCP / Skill / internal tool 数量和泛 `Agent Runtime` 口径，调整为 Codex host agent 归 Plugin、Alembic internal AI 归 Alembic + Agent、Dashboard 只展示结果和触发用户动作。
- `src/components/Views/HelpView.tsx`：同步代码注释口径为 `Alembic internal AI`，避免维护者继续沿用旧 `Agent Runtime` 表达。

## 提交

- AlembicDashboard：`502b078c4d1a7123542ae4bce4d92bf916c79c8f`

## API Parser 兼容策略

- 旧 producer：继续识别 `HOST_AI_MANAGED`、`hostManaged: true`、`501` 和 `410`。
- 新 producer：可逐步新增更清晰的 canonical code / field，例如 `HOST_AGENT_MANAGED`、`CODEX_HOST_AGENT_MANAGED`、`LOCAL_AI_UNAVAILABLE`、`hostAgentManaged`、`localAiUnavailable` 或 `managedBy: codex-host-agent`；Dashboard 会归一为同一个 host-managed unavailable UI。
- Dashboard consumer 不要求 Plugin 同步 breaking change；`CandidatesView` 现有 `result.hostManaged` 和 `isHostManagedUnavailable()` 消费路径保持可用。

## 验证命令

```text
npm run build
rg -n "\b(18|22|16|11|5) (MCP|Skills|Skill|tools|工具)|\b(18|22|16|11|5) 个|58 个|5-provider|5 Provider|Agent Runtime|AgentRuntime|5 Provider" src/i18n/locales src/components/Views/HelpView.tsx
rg -n "HOST_AI_MANAGED|HOST_AGENT_MANAGED|CODEX_HOST_AGENT_MANAGED|LOCAL_AI_UNAVAILABLE|hostManaged|hostAgentManaged|localAiUnavailable|managedBy" src/api.ts src/components/Views/CandidatesView.tsx src/components/Shared/GlobalChatDrawer.tsx src/components/Views/AiChatView.tsx
git diff --check
git status --short
```

## 验证结果

- `npm run build`：通过；Vite 仍提示 vendor chunk 超过 1500 kB，这是既有构建体积提醒，不影响本轮类型检查和 production build。
- 固定 MCP / Skill / internal tool 数量与旧 `Agent Runtime` 文案扫描：无命中。
- Host-managed 兼容扫描：命中集中在 `src/api.ts` 新旧兼容 parser、`CandidatesView` / `AiChatView` / `GlobalChatDrawer` 的既有 UI 消费路径，符合保留兼容要求。
- `git diff --check`：通过。
- `git status --short`：Dashboard 仓库干净。

## 负向扫描剩余命中

- `AI 扫描` / `AI scan` 仍作为用户可见功能类别保留，指代 Alembic 冷启动 / 增量扫描产生候选，不是 Dashboard 本地第三方 AI runtime。
- `HOST_AI_MANAGED` / `hostManaged` 仍保留为旧 producer 兼容字段，不作为本轮删除项。

## 2026-05-23 超高复核结论

复核前已重新读取 workspace `AGENTS.md`、`docs/workspace/index.md`、`docs/workspace/workspace-current-status.md`、当前总控计划 `docs/workspace/capability-code-interface-cleanup-workspace-plan-2026-05-22.md` 和 `AlembicDashboard/AGENTS.md`。当前窗口定位仍为 `AlembicDashboard` 执行窗口；本轮职责仍只覆盖 Dashboard 前端 API client、Help/i18n 文案、前端 UI 消费路径和构建验证，不承担 Alembic / Core / Agent / Plugin / Test 仓库实现。

复核命令：

```text
git show --name-status --stat --oneline --no-renames 502b078c4d1a7123542ae4bce4d92bf916c79c8f
git diff --name-status 502b078c4d1a7123542ae4bce4d92bf916c79c8f^ 502b078c4d1a7123542ae4bce4d92bf916c79c8f
git diff --unified=0 502b078c4d1a7123542ae4bce4d92bf916c79c8f^ 502b078c4d1a7123542ae4bce4d92bf916c79c8f -- src/api.ts | rg -n "http\.(get|post|patch|delete)|/candidates|/ai|/knowledge|/skills|/chat|/search"
rg -n "isHostManagedUnavailable|HostManagedUnavailableError|throwHostManagedFromError|parseHostManagedUnavailable|hostManagedCandidateAiMessage|hostManagedCandidateAiUnavailable|result\.hostManaged|HOST_AI_MANAGED|hostManaged" src/api.ts src/components/Views/CandidatesView.tsx src/components/Views/AiChatView.tsx src/components/Shared/GlobalChatDrawer.tsx
rg -n "HOST_AI_MANAGED|HOST_AGENT_MANAGED|CODEX_HOST_AGENT_MANAGED|LOCAL_AI_UNAVAILABLE|canonicalCode|boundaryCode|hostManaged|hostAgentManaged|hostAiManaged|localAiUnavailable|managedBy" src/api.ts src/components/Views/CandidatesView.tsx src/components/Views/AiChatView.tsx src/components/Shared/GlobalChatDrawer.tsx
rg -n "/candidates/enrich|/candidates/refine|enrichCandidates|refineCandidate|previewCandidateRefine|applyCandidateRefine" src/api.ts src/components/Views/CandidatesView.tsx src/components/Shared/GlobalChatDrawer.tsx
rg -n "18 MCP|22 MCP|16 tools|16 工具|11 Skills|11 个 Skills|5 Skills|5 个 Skills|58 internal|58 个内部|Agent Runtime|AgentRuntime|5-provider|5 Provider" src/i18n/locales src/components/Views/HelpView.tsx
rg -n "Dashboard.*(run|exec|execute).*AI|Dashboard.*本地.*AI|Plugin.*(has|owns|拥有).*AI provider|Plugin.*本地执行.*AI|第三方 AI runtime|third-party AI locally|local third-party AI" src/i18n/locales src/components/Views/HelpView.tsx src/api.ts
npm run build
git diff --check 502b078c4d1a7123542ae4bce4d92bf916c79c8f^ 502b078c4d1a7123542ae4bce4d92bf916c79c8f
git status --short
```

复核结果：

- 未误删真实消费方：提交 `502b078c4d1a7123542ae4bce4d92bf916c79c8f` 仅修改 `src/api.ts`、`src/components/Views/HelpView.tsx`、`src/i18n/locales/en.ts`、`src/i18n/locales/zh.ts`，没有删除或重命名文件；`CandidatesView`、`AiChatView`、`GlobalChatDrawer` 仍真实消费 `isHostManagedUnavailable()`、`result.hostManaged`、`hostManagedCandidateAiMessage` 和相关 disabled / notification UI。
- 未改变 API 路径或后端职责边界：`src/api.ts` changed-line endpoint 扫描对 `http.get/post/patch/delete`、`/candidates`、`/ai`、`/knowledge`、`/skills`、`/chat`、`/search` 无新增或删除命中；候选补齐 / refine 真实入口仍为 `/candidates/enrich`、`/candidates/refine-preview`、`/candidates/refine-apply` 和 refine preview stream。
- 兼容字段保留有证据：`HOST_AI_MANAGED`、`hostManaged` 仍存在于 `HostManagedUnavailableError`、`parseHostManagedUnavailable()`、`isHostManagedUnavailable()`、`enrichCandidates()` 返回归一化和 Candidates / Chat UI 消费路径；本轮只是新增 `HOST_AGENT_MANAGED`、`CODEX_HOST_AGENT_MANAGED`、`LOCAL_AI_UNAVAILABLE`、`canonicalCode`、`boundaryCode`、`hostAgentManaged`、`hostAiManaged`、`localAiUnavailable`、`managedBy` 的兼容识别。
- 删除/不删除判断符合计划：计划要求不得删除 Candidates AI unavailable UI、不得改 Dashboard API 路径、不得要求 Plugin 同步 breaking change；复核确认这些约束均满足。
- 职责边界未越界：Help/i18n 文案收敛为 Codex host agent 归 Plugin、Alembic internal AI 归 Alembic + Agent、Dashboard 只展示结果和触发用户动作；没有新增 Dashboard 本地执行第三方 AI、Plugin 本地拥有 AI provider、Dashboard 接管 Agent runtime 或 tool execution 的表达。
- 负向扫描完成：固定 MCP / Skill / internal tool 数量与旧 `Agent Runtime` 文案扫描无命中；误导性 “Dashboard/Plugin 本地执行 AI provider” 扫描只命中新增的否定式边界说明，属于预期正向证据。
- 验证完成：`npm run build` 通过，仍只有既有 vendor chunk 超 1500 kB 提醒；提交 diff check 通过；Dashboard 仓库 `git status --short` 干净。

复核结论：本轮 Dashboard 改动是 consumer 侧兼容增强 + 文案边界清洁，不是功能删减、API breaking change 或职责迁移；可以继续保持 CCIC-P1-D `待总控验收` 状态，等待 `AlembicPlugin` CCIC-P1-P producer 回填后再决定是否固化正式 canonical contract。

## 遗留风险

- Plugin producer 尚未回填最终 canonical 字段名；Dashboard 当前采用宽兼容解析，后续可在 Plugin producer 定稿后收窄为正式 contract。
- Help 页仍是静态说明页，未从后端 capability API 动态读取 MCP / Skill 数量；本轮已去掉不稳定固定数量，未新增动态接口依赖。

## 下一步建议

- 等 `AlembicPlugin` CCIC-P1-P 回填 canonical code / field 后，由总控决定是否在 CCIC-2 固化 Dashboard API contract 注释或补充 consumer targeted test。
- 若后续需要真实 UI 手动体验，再由总控创建 `AlembicTest` 测试单；本轮按计划不操作真实项目。
