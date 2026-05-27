# AlembicAgent Scan Progress Semantic Richness Agent Events 回填

日期：2026-05-24

## 窗口定位

- 当前窗口：`AlembicAgent`
- 领取任务：`SPSR-P1-Agent-Semantic-Events`
- 本轮仓库职责：让旧终端格式化语义在 Agent runtime 层成为 developer-safe process events，给 Alembic bridge / recorder 消费。
- 明确不属于本轮：不改 Alembic recorder / HTTP / Dashboard UI / Core contract / Plugin；不处理 L4 compaction；不把 stderr 原文无分类塞进事件流；不操作 `BiliDili`。

## 提交

- AlembicAgent commit：`18af90800d1a835ccfde9bdf2c6e56289ebc5151`
- 提交标题：`Emit semantic nudge process events`

## 完成范围

- `src/agent/runtime/AgentRuntime.ts`
  - 将普通 reflection / planning / replan / convergence nudge 的 process event 统一改为语义化 builder，保留 developer-safe 全文并补齐 metadata。
  - 新增 transition nudge process event：`tracker.endRound()` 产生阶段切换 nudge 后，不再只 append context 和写 stderr，也会发送 `agent_process_event`。
  - 新增 digest nudge process event：metrics transition terminal 分支和 text-triggered summarize 分支都会发送语义事件。
  - 新增 continue nudge process event：text response 要求继续推进时发送语义事件。
  - 新增 `buildSemanticNudgeProcessEvent`、`classifySemanticNudgeKind`、`formatSemanticNudgeTitle`、`formatSemanticNudgeSummary`，统一 title / summary / metadata。
- `test/AgentRuntime.test.ts`
  - 扩展 reflection / tool 测试，覆盖 transition nudge process event。
  - 新增 digest / continue nudge process event 测试，覆盖语义 metadata、维度字段和 secret 脱敏。

## 旧终端语义到 process event 映射

| 旧终端信息 | 生产点 | process event kind | metadata.semanticKind | title 示例 |
| --- | --- | --- | --- | --- |
| 中期 / 停滞反思 | `tracker.getNudge()` | `llm.reflection` | `reflection-nudge` | `Agent 中期反思` / `Agent 停滞反思` |
| planning / replan nudge | `tracker.getNudge()` | `llm.reflection` | `planning-nudge` | `Agent 计划检查 Nudge` / `Agent 重新计划 Nudge` |
| convergence nudge | `tracker.getNudge()` | `llm.reflection` | `convergence-nudge` | `Agent 收敛检查 Nudge` |
| Transition Nudge | `tracker.endRound()` | `llm.reflection` | `transition-nudge` | `Agent 阶段转换 Nudge: EXPLORE` |
| Digest Nudge | `tracker.onTextResponse()` / terminal transition | `llm.reflection` | `digest-nudge` | `Agent 总结 Nudge` |
| Continue Nudge | `tracker.onTextResponse()` | `llm.reflection` | `continue-nudge` | `Agent 继续执行 Nudge` |

## 事件样例 JSON

```json
{
  "type": "agent_process_event",
  "processEvent": {
    "kind": "llm.reflection",
    "title": "Agent 阶段转换 Nudge: EXPLORE",
    "summary": "阶段机切换后注入 EXPLORE 阶段指令。",
    "sourceClass": "developer-facing",
    "displayPolicy": "full",
    "retention": "job-retained",
    "severity": "info",
    "phase": "EXPLORE",
    "dimensionId": "architecture",
    "targetName": "Architecture",
    "content": {
      "role": "developer",
      "text": "阶段切换: EXPLORE → SUMMARIZE"
    },
    "metadata": {
      "semanticKind": "transition-nudge",
      "nudgeType": "transition",
      "phase": "EXPLORE",
      "dimensionId": "architecture",
      "targetName": "Architecture",
      "pipelineType": "analyst",
      "source": "system"
    }
  }
}
```

## 安全与边界

- 沿用现有 `redactDeveloperText` / `sanitizeDeveloperData`，developer-facing content 与 metadata 仍会脱敏常见 key / token / password / authorization。
- 本轮只把已经注入上下文、可给开发者看的 nudge 语义发布为 process event；不暴露 hidden reasoning，不转发 raw provider payload，不解析 stderr。
- 未新增 Core public kind；继续使用现有 `llm.reflection`，通过 `metadata.semanticKind` / `metadata.nudgeType` 给 Alembic / Dashboard 做稳定语义区分。

## 验证命令与结果

- `npm run test -- test/AgentRuntime.test.ts`：通过，`8` tests passed。
- `npm run build:check`：通过。
- `npm run lint`：通过。
- `npm run lint:core-import-boundary`：通过。
- `git diff --check`：通过。
- `npm run check`：通过，`19` files / `91` tests passed。
- `alembic_guard`：未运行成功；Alembic project knowledge 未初始化，工具返回 `CODEX_ALEMBIC_KNOWLEDGE_REQUIRED`。本轮用仓库自带 check 作为验证证据。

## 遗留风险

- 本轮未在 Alembic daemon / Dashboard / test-mode cold-start 中验证 live API events；需要 Alembic bridge 接住 `agent_process_event` 后再由 `AlembicTest` 验证。
- 当前 `dimensionDigest` / `topFindings` 的关键发现一等事件属于 Alembic 结果投影任务，本仓库只提供 Agent nudge 语义事件。
- Alembic Codex runtime 状态不可用：`alembic_codex_status` 显示本项目无可用知识库、active runtime project 指向 `BiliDili`；`alembic_codex_diagnostics` 报告 plugin runtime pin / metadata 问题。本轮未切换项目、未初始化 `.asd`、未修改插件配置。

## 下一步建议

- `Alembic` 消费 `event.processEvent`，把 `semanticKind` / `nudgeType` / `pipelineType` / `phase` 持久化进 job process events，并补 key findings / dimensionDigest 投影。
- `AlembicDashboard` 在拿到上游事件样例后，基于 `metadata.semanticKind` 做 Nudge、阶段转换、反思、关键发现的 UI 分组和 cold-start 卡片优先级。
- `AlembicTest` 等上游和 Dashboard 完成后，用 test mode cold-start 验证 API events 与前端展示都能看到新增语义。
