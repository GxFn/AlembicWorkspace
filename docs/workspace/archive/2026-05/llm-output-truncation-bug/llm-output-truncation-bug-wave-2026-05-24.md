# LLM Output Truncation Bug Wave

更新日期：2026-05-24
派发时间：2026-05-24 20:34 CST
状态：已完成 / 已通过总控验收
发送给：无

## 用户问题

用户在 Dashboard Jobs Timeline 里看到 `LLM output received` 只显示 `Received 394 visible character(s)`，内容很短，观感像被截断。

## 最终目标

开发者在 Jobs Timeline 里查看 `llm.output` 时，必须能一眼判断：

- 看到的是完整 developer-visible LLM 输出，还是被 Alembic 过程事件保留上限截断。
- 如果可见输出很短，是模型本轮只返回了短 visible content，还是还存在未展示的 reasoning / tool-call-only 输出。
- 如果 provider 因 `finish_reason=length` 等原因截断，前端要明确提示。
- 现阶段仍不直接展示 raw provider payload、secret 或 hidden reasoning；只展示可见输出和必要的完整性 / 省略说明。

这条 bug 完成标准不是“把文字变长”，而是让真实输出链路没有无声截断，并让开发者知道自己看到的内容到底是什么。

## 真实代码证据

- `AlembicAgent/src/agent/runtime/AgentRuntime.ts:947` 构造 `llm.output` process event，`content.text` 只写入 `llmResult.text` 或 tool-call fallback；`metadata.hasHiddenReasoningContent` 只有布尔值，没有 reasoning 字符数、finish reason 或内容截断状态。
- `AlembicAgent/src/external/ai/transport/DeepSeekTransport.ts:263` 解析 DeepSeek `message.content`，`:265` 解析 `reasoning_content`，`:301` 返回 `{ text, functionCalls, usage, reasoningContent }`；当前没有把 `choice.finish_reason` 透出给 Agent runtime。
- `Alembic/lib/workflows/capabilities/execution/internal-agent/BootstrapProcessEvents.ts:13` 设置 `MAX_TEXT_CHARS = 6000`，`:616` 对 process event `content.text` 截到 6000 并在 `:744` 追加 `...[truncated ...]` 标记。截图里的 394 字低于此上限，初判不是 Alembic bridge 截断。
- `AlembicDashboard/src/components/Views/JobsView.tsx:805` 按 `shouldCollapseProcessEventContentByDefault()` 控制展开，`:854` 展开后直接渲染 `event.content`。Dashboard 当前更像是如实展示了已进入 developer view 的短文本，而不是 UI 截掉内容。
- `AlembicDashboard/src/components/Views/JobsView.tsx:807` 的 metadata chips 只展示 sequence/kind/phase/dimension/target/finding/severity 等字段，没有展示 `hasHiddenReasoningContent`、`textChars`、reasoning token 或 provider finish reason。

## 根因判断

当前截图最可疑的不是 Dashboard 视觉截断，而是 `llm.output` 只表达了 `visible content`，但 UI 文案和 metadata 没有告诉开发者：

- hidden reasoning 是否存在但按边界省略；
- provider 是否因为 `length` 停止；
- Alembic bridge 是否真实截断过；
- `394 visible character(s)` 是完整 visible 输出还是截断后的可见片段。

因此第一波修复要补齐“输出完整性 contract + UI 呈现”，而不是直接展示 hidden reasoning。

## 任务包

### LOTB-P1-Agent-Output-Completeness

窗口：`AlembicAgent`
状态：已完成
派发时间：2026-05-24 20:34 CST
状态更新时间：2026-05-24 20:46 CST
合并 TODO：无。
下一处真实阻塞点：本轮主线已封口；后续 process events recovery / job progress / provider length fixture 已进入全局 TODO。
阻塞点之前还能做：`AlembicAgent` 生产侧已通过总控 targeted 代码验收和 `AlembicTest` 真实消费验证。

阶段目标：让 Agent 生产的 `llm.output` process event 明确描述 developer-visible 输出完整性。

主线动作：

- 读取 `AGENTS.md`、本计划、`AlembicAgent/AGENTS.md`，先声明当前窗口定位和本轮职责。
- 从 `AgentRuntime`、`LLMResultType`、`AiProvider`、`DeepSeekTransport` / `DeepSeekProvider` 真实链路确认 `text`、`reasoningContent`、`usage.reasoningTokens` 和 provider stop reason 如何流动。
- 给 `llm.output` event metadata 增加稳定字段，建议包括：`visibleTextChars`、`hasHiddenReasoningContent`、`reasoningContentChars` 或 `reasoningContentOmitted`、`finishReason`、`providerOutputTruncated`。
- DeepSeek 链路若能拿到 `choice.finish_reason`，透出到 runtime；当 finish reason 表明 provider 截断时，metadata 必须能被 Alembic / Dashboard 消费。
- 保持 hidden reasoning 不进入 `content.text`；如果需要展示 reasoning 原文，回填为待确认边界，不要擅自暴露。
- 更新 / 新增 `AlembicAgent` 单测，覆盖：长 visible text 不在 Agent 层被截断、hidden reasoning 不进入 content、metadata 能说明 reasoning omitted、finish reason 能透出。

明确不包含：不改 Dashboard UI；不改 Alembic bridge；不展示 raw reasoning。

验证命令：`npm run build:check`、`npm run lint`、`npm run test -- test/AgentRuntime.test.ts test/DeepSeekTransport.test.ts test/DeepSeekProvider.test.ts`、`npm run check`、`git diff --check`。

回填要求：提交 hash、改动文件、metadata 字段名和含义、验证结果、是否需要 Alembic / Dashboard 调整字段名、遗留风险。

### LOTB-P1-Alembic-Bridge-Truncation-Signal

窗口：`Alembic`
状态：已完成
派发时间：2026-05-24 20:34 CST
合并 TODO：无。
下一处真实阻塞点：本轮主线已封口；后续 process events recovery / job progress 已进入全局 TODO。
阻塞点之前还能做：`Alembic` bridge 侧已通过总控 targeted 代码验收和 `AlembicTest` 真实消费验证。

阶段目标：确保 Alembic process event bridge 不会无声截断 LLM 输出，并把真实截断状态传给前端。

主线动作：

- 读取 `AGENTS.md`、本计划、`Alembic/AGENTS.md`，先声明当前窗口定位和本轮职责。
- 检查 `BootstrapProcessEvents`、`JobProcessEventRecorder`、jobs events API 和 socket broadcast 对 `content.text` / metadata 的处理。
- 保留现有 `MAX_TEXT_CHARS = 6000` 安全上限，但当 bridge 截断时，metadata 要明确追加或保留 `contentTruncated=true`、`contentOriginalChars`、`contentRetainedChars` 之类字段；如果已有 `...[truncated ...]` 文本标记，也要有机器可读字段。
- 确认 Agent 上游传来的 `finishReason`、`visibleTextChars`、`reasoningContentOmitted` 等 metadata 不被 sanitize 丢掉；如字段名需调整，回填给总控。
- 更新 / 新增单元测试，覆盖：短文本不标截断、长文本有截断标记和机器字段、hidden/raw/secret 仍不进入 developer view。

明确不包含：不改 Agent provider；不改 Dashboard UI；不提高或删除 6000 字保留上限。

验证命令：`npm run test:unit -- BootstrapProcessEvents JobProcessEventContracts JobsRoute`、`npm run build:check`、`npm run lint:repo-boundary`、`npm run check`、`git diff --check`。

回填要求：提交 hash、字段名、截断上限说明、API developerView 示例、验证结果、遗留风险。

### LOTB-P1-Dashboard-Output-Clarity

窗口：`AlembicDashboard`
状态：已完成
派发时间：2026-05-24 20:34 CST
状态更新时间：2026-05-24 20:46 CST
合并 TODO：无。
下一处真实阻塞点：本轮主线已封口；后续 job progress / provider length fixture 已进入全局 TODO。
阻塞点之前还能做：`AlembicDashboard` 展示侧已通过总控 targeted 代码验收和真实 Jobs Timeline 复测。

阶段目标：让 Jobs Timeline 清楚展示 `llm.output` 的可见输出、截断状态和省略状态。

主线动作：

- 读取 `AGENTS.md`、本计划、`AlembicDashboard/AGENTS.md`，先声明当前窗口定位和本轮职责。
- 在 `JobsView` / `jobProcessEvents` 中为 `llm.output` 增加清晰但不喧宾夺主的状态展示：可见输出字数、reasoning 已省略、provider finish reason、Alembic content truncated。
- 短内容仍默认展示，长内容仍按 10 行折叠；展开后不得用 CSS、preview 或本地 cache 再次截断 `event.content`。
- 只展示 metadata 指标和说明，不展示 raw hidden reasoning。若 metadata 缺失，保持兼容旧事件。
- 更新 Dashboard contract test 或单测，覆盖：`llm.output` 短内容完整显示、`hasHiddenReasoningContent` / `reasoningContentOmitted` 有可读提示、`contentTruncated` 有明显提示、旧事件无 metadata 时不报错。

明确不包含：不改 Alembic API；不改 Agent producer；不做新布局大改。

验证命令：`npm run check`、`git diff --check`；如可行补 DOM / browser 证据。

回填要求：提交 hash、UI 展示说明、兼容字段列表、验证结果、截图或 DOM 证据、遗留风险。

## 窗口分派

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>已完成 | bridge 截断机器字段和 metadata 透传已通过总控 targeted 代码验收。 |
| `AlembicCore`<br>无任务 | 不新增 core enum / contract；本轮使用 metadata 扩展即可。 |
| `AlembicAgent`<br>已完成 | LLM output 完整性 metadata、DeepSeek finish reason 和单测已通过总控 targeted 代码验收。 |
| `AlembicDashboard`<br>已完成 | Jobs Timeline `llm.output` 可读提示和不二次截断展示已通过总控 targeted 代码验收。 |
| `AlembicPlugin`<br>无任务 | Codex plugin 不消费 Dashboard Jobs Timeline。 |
| `AlembicTest`<br>已完成 | `Test-2026-05-24-08 / LOTB-P2-Output-Completeness-TestMode` 已通过总控验收；后续缺口转全局 TODO。 |
| `BiliDili`<br>无任务 | 不改真实 iOS 项目源码。 |

## AlembicTest 复测候选

测试单 [alembic-test-exchange.md](../../../current/alembic-test-exchange.md) 的 `Test-2026-05-24-08 / LOTB-P2-Output-Completeness-TestMode` 已完成并通过总控验收。复测要点：

- API 中 `llm.output` developerView 包含完整性 metadata。
- Dashboard 截图能看到短 visible output、reasoning omitted 提示、content truncated 提示。
- 若用真实 DeepSeek V4，不要求展示 hidden reasoning 原文，只验证短 visible output 不再被误读为无声截断。

## 可复制分派提示词

发送给：无

```text
当前无可发送窗口；等待总控验收 AlembicTest 回填证据。
```

## 回填区

- 2026-05-24 20:34 CST：总控根据用户截图启动 bug wave。初步代码证据显示 394 字不是 Dashboard 展示层截断，也不是 Alembic 6000 字 bridge 上限截断；当前修复重点是输出完整性 metadata、真实截断机器字段和 Dashboard 可读提示。
- 2026-05-24 20:46 CST：`AlembicDashboard` 完成 `LOTB-P1-Dashboard-Output-Clarity`，提交 `6bd14e0` (`Clarify LLM output timeline metadata`)。
  - 完成范围：在 `jobProcessEvents` 增加 metadata number / boolean 兼容读取、`llm.output` 完整性 hint view-model；在 Jobs Timeline 为 `llm.output` 展示可见输出字数、reasoning 已省略、provider finish reason / provider 截断、Alembic content truncated；展开态继续直接渲染完整 `event.content`，未增加 CSS preview、本地截断或 raw hidden reasoning 展示。
  - 兼容字段列表：`visibleTextChars` / `visibleChars` / `textChars` / `outputTextChars`、`hasHiddenReasoningContent` / `reasoningContentOmitted`、`reasoningContentChars` / `hiddenReasoningChars`、`reasoningTokens` / `reasoningContentTokens`、`finishReason` / `providerFinishReason` / `stopReason`、`providerOutputTruncated` / `providerTruncated`、`contentTruncated` / `bridgeContentTruncated` / `developerViewContentTruncated`、`contentOriginalChars` / `originalChars`、`contentRetainedChars` / `retainedChars`。metadata 缺失的旧事件保持兼容。
  - UI / DOM 证据：contract test 锁定 `getLlmOutputCompletenessHints(event, text.lang)`、`aria-label={text.outputCompleteness}`、`event.content && effectiveContentExpanded` 直出完整内容，并负向锁定 `line-clamp` / `max-h-[` / `contentCollapsed` / 旧内容卡片边框，证明前端不做二次截断和不渲染收起占位。
  - 验证命令：`npm run test`、`npm run check`、`git diff --check`。
  - 验证结果：通过；`npm run check` 中 build 仅保留既有 Vite chunk size warning。
  - 遗留风险：Dashboard 只能展示 producer / bridge 提供或前端可推导的 metadata；`finishReason`、`reasoningContentOmitted`、`contentTruncated` 等真实语义仍依赖 `AlembicAgent` 和 `Alembic` 上游完成并透传。
  - 下一步建议：等待 `AlembicAgent` 回填稳定 metadata 字段和 `Alembic` 回填 bridge 截断机器字段后，由 `AlembicTest` 做最小复测，确认真实 API developerView 中字段能被 Dashboard 正确显示。
- 2026-05-24 20:46 CST：`AlembicAgent` 完成 `LOTB-P1-Agent-Output-Completeness` 并提交 `bdd77335e1904a8bc91342a71d6348a64862eafe`。
  - 完成范围：`LLMResult` / `ChatWithToolsResult` / `TransportResponse` 透出 `finishReason`；DeepSeek provider / transport 解析 `choice.finish_reason`；`AgentRuntime` 的 `llm.output.metadata` 增加 `visibleTextChars`、`developerContentChars`、`reasoningContentOmitted`、`reasoningContentChars`、`reasoningTokens`、`finishReason`、`providerOutputTruncated`、`agentOutputTruncated`、`outputCompleteness` 等字段；hidden reasoning 不进入 `content.text`，长 visible text 不在 Agent 层截断。
  - 验证命令：`npm run test -- test/AgentRuntime.test.ts test/DeepSeekTransport.test.ts test/DeepSeekProvider.test.ts`、`npm run build:check`、`npm run lint`、`git diff --check`、`npm run check`。
  - 验证结果：通过；`npm run check` 覆盖 build、lint、agent import boundary、public API boundary、Core import boundary 和 19 个测试文件 / 91 个测试。
  - Alembic Guard：`alembic_guard` 因 `CODEX_ALEMBIC_KNOWLEDGE_REQUIRED` 未能执行；`alembic_codex_diagnostics` 仍报告 `PLUGIN_RUNTIME_PIN_MISMATCH` 与 `PLUGIN_METADATA_INCOMPLETE`。
  - 遗留风险：本窗口未验证 Alembic bridge 是否保留 metadata，也未验证 Dashboard 真实展示；真实 DeepSeek API 未跑，DeepSeek 行为通过 mock Chat Completions 响应验证。
  - 当时下一步建议：三仓库均回填后由总控复核并创建 `AlembicTest` 最小复测单。
  - 专项回填：[../../AlembicAgent/llm-output-truncation-agent-output-completeness-2026-05-24.md](../../../../AlembicAgent/llm-output-truncation-agent-output-completeness-2026-05-24.md)。
- 2026-05-24 20:46 CST：`Alembic` 窗口完成 `LOTB-P1-Alembic-Bridge-Truncation-Signal`，提交 `f186ca13dd349c4d62299a4829ea6d5ca28da891`（`fix: expose process event truncation metadata`）。
  - 完成范围：`BootstrapProcessEvents` 在 Agent progress `content.text` 和 dimension visible output 进入 process event draft 时追加机器可读截断 metadata；`JobProcessEventRecorder`、jobs events API、socket broadcast 保持透传边界，不引入二次裁剪；补充 `BootstrapProcessEvents` 与 `JobsRoute` 单测。
  - 字段名：`contentTruncated`、`contentOriginalChars`、`contentRetainedChars`、`contentTruncatedChars`、`contentTruncationLimit`；截断时额外给出 `contentTruncationSource: "alembic-process-event-bridge"`。dimension visible output 额外给出 `outputSectionStats` 和 `outputTruncatedSections`。Agent 上游 metadata（如 `finishReason`、`visibleTextChars`、`reasoningContentOmitted`）在 Alembic bridge 中保留并透传。
  - 截断上限：保留 `MAX_TEXT_CHARS = 6000`，长文本仍保留原有 `...[truncated N chars]` 文本标记，同时新增机器字段；短文本显式标记 `contentTruncated: false`，不会把 394 字这类短 visible output 误报为 Alembic 截断。
  - API developerView 样例：

    ```json
    {
      "kind": "llm.output",
      "title": "LLM output received",
      "content": { "role": "assistant", "text": "Received 394 visible character(s)." },
      "metadata": {
        "contentTruncated": false,
        "contentOriginalChars": 34,
        "contentRetainedChars": 34,
        "contentTruncatedChars": 0,
        "contentTruncationLimit": 6000,
        "finishReason": "length",
        "reasoningContentOmitted": true,
        "visibleTextChars": 394
      }
    }
    ```

  - 验证命令与结果：`npm run test:unit -- BootstrapProcessEvents JobProcessEventContracts JobsRoute` 通过（2 files / 20 tests）；`npm run build:check` 通过；`npm run lint:repo-boundary` 通过；`npm run check` 通过；`git diff --check` 通过。
  - 遗留风险：Alembic 已能透传 `finishReason` / `visibleTextChars` / `reasoningContentOmitted`，但这些字段仍依赖 `AlembicAgent` producer 补齐；Dashboard 仍需消费上述字段并避免 UI 层误读短文本；三仓库完成前不进入 AlembicTest 复测。
  - 下一步建议：等待 `AlembicAgent` 回填真实 provider finish reason 与 output completeness metadata，再由 `AlembicDashboard` 按这些字段展示 “provider length / reasoning omitted / Alembic truncated” 状态；最后交给 `AlembicTest` 做最小真实复测。
- 2026-05-24 20:52 CST：总控完成三仓库 targeted 代码验收，结论为代码侧满足 producer / bridge / UI 三段闭环要求，进入 `AlembicTest` 最小真实复测。
  - `AlembicAgent` 验收：`git status --short` 干净；近期提交 `bdd7733 Add LLM output completeness metadata`；`npm run test -- test/AgentRuntime.test.ts test/DeepSeekTransport.test.ts test/DeepSeekProvider.test.ts` 通过（3 files / 15 tests）；`rg` 证据确认 `finishReason`、`outputCompleteness`、`providerOutputTruncated`、`reasoningContentOmitted`、`visibleTextChars` 已进入测试覆盖。
  - `Alembic` 验收：`git status --short` 干净；近期提交 `f186ca1 fix: expose process event truncation metadata`；`npm run test:unit -- BootstrapProcessEvents JobProcessEventContracts JobsRoute` 通过（2 files / 20 tests）；`rg` 证据确认 `contentTruncated`、`contentOriginalChars`、`contentRetainedChars`、`contentTruncatedChars`、`contentTruncationLimit` 已进入 bridge / route 测试覆盖。
  - `AlembicDashboard` 验收：`git status --short` 干净；近期提交 `6bd14e0 Clarify LLM output timeline metadata`；`npm run check` 通过（lint、11 contract tests、typecheck、build；仅保留既有 Vite chunk size warning）；`rg` 证据确认 `visibleTextChars`、`reasoningContentOmitted`、`finishReason`、`providerOutputTruncated`、`contentTruncated` 已进入 Dashboard contract test。
  - Workspace 验证：`node scripts/verify-workspace-docs.mjs --all-workspace`、`node scripts/check-dispatch-coverage.mjs`、`node scripts/check-workspace-current-layout.mjs`、`git diff --check` 已在验收前通过；创建测试单后需再次运行。
  - 复测入口：已创建 `Test-2026-05-24-08 / LOTB-P2-Output-Completeness-TestMode`，当前发送给 `AlembicTest`。
- 2026-05-24 21:20 CST：`AlembicTest` 回填 `Test-2026-05-24-08 / LOTB-P2-Output-Completeness-TestMode`，详细报告见 [../../../AlembicTest/docs/llm-output-completeness-test-mode-2026-05-24.md](../../../../../AlembicTest/docs/llm-output-completeness-test-mode-2026-05-24.md)。
  - 复测结论：LOTB 核心 output completeness 链路通过；真实 test mode job 的 `llm.output` metadata 与 Dashboard DOM 已覆盖短 visible output、tool-call-only、hidden reasoning omission、Alembic bridge truncation。Provider `finishReason=length` 未自然触发，Dashboard contract test / source contract 补充验证展示路径。
  - job / session：首次 job `bootstrap_mpjsgko1_86455289` / `bs_1779627828685_mpe0kj`，恢复后标记 `DAEMON_SHUTDOWN` 且旧 events API 返回 0 条；二次 job `bootstrap_mpjspdvu_23e95d13` / `bs_1779628239822_8c4uxa`，证据覆盖后主动取消，Dashboard URL `http://127.0.0.1:60559/jobs?job=bootstrap_mpjspdvu_23e95d13`。
  - API 摘要：二次 job 最终 events API `count=72`，`llm.output=25`；sequence 10 `visibleTextChars=480` / `contentTruncated=false` / `finishReason=stop`；sequence 13 `outputCompleteness=tool_call_only` / `visibleTextChars=0` / `reasoningContentOmitted=true`；sequence 57 `visibleTextChars=11005` / `contentTruncated=true` / `contentOriginalChars=11005` / `contentRetainedChars=6000` / `contentTruncationSource=alembic-process-event-bridge`。
  - Dashboard / DOM 证据：live DOM 显示 `可见输出: 480 字`、`Reasoning 已省略: 142 字`、`结束原因: tool_calls`、`Alembic 已截断: 6000 字 / 11005 字`；Browser console errors 为 `[]`。
  - Hidden / raw / secret 边界：Dashboard / 截图未显示 raw hidden reasoning；API summary 中 `reasoningTokens` 为 `[redacted-secret]`。
  - 验证命令：`npm --prefix AlembicDashboard run test` 通过（11 tests）；`curl /api/v1/modules/test-mode`、`curl /api/v1/jobs/:jobId/events?limit=500`、job cancel API 通过；BiliDili / Alembic / AlembicAgent / AlembicDashboard `git status --short` 均干净。
  - 提交 hash：无；本轮只做测试报告与 workspace 回填。
  - 遗留风险：provider `finishReason=length` 未自然触发；process events restart recovery 返回 0 条；运行中 job status/progress 长时间停在 `filling/0%`；二次 job 主动取消，不作为完整 cold-start 成功证据。
  - 下一步建议：总控验收 LOTB 核心链路后，将 process events 持久化 / restart recovery、job progress 同步、provider length 可控 fixture 拆成后续修复 / 测试项。
- 2026-05-24 21:26 CST：总控验收 `AlembicTest` 回填为通过，LOTB 主线完成并准备归档。
  - 完成定义验收：短 visible output 有 `visibleTextChars` / `contentTruncated=false` 证据；tool-call-only 与 hidden reasoning omission 有 metadata 和 Dashboard DOM 提示；Alembic bridge truncation 有 `contentTruncated=true` / retained chars / original chars 和 Dashboard 提示；展开内容未被 Dashboard 二次截断；hidden reasoning 未进入 DOM / 截图。
  - 验收边界：provider `finishReason=length` 未自然触发，但 Agent / Dashboard contract 已覆盖字段生产与展示路径；该缺口不阻塞本轮“短内容不再被无声误读为截断”的完成定义，转入 `GTODO-2026-05-24-035`。
  - 后续归口：process events restart recovery 转 `GTODO-2026-05-24-033`；job progress sync 转 `GTODO-2026-05-24-034`；provider length fixture 转 `GTODO-2026-05-24-035`。
