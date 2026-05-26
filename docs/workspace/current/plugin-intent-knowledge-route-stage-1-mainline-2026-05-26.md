# Plugin Intent Knowledge Route Stage 1 Mainline

日期：2026-05-26
状态：执行中（无人值守 Stage 1 最小代码链路待启动）
发送给：`AlembicPlugin`、`Alembic`
总控定位：本文件是 `GTODO-2026-05-24-037 / Plugin intent knowledge route` 当前总控入口；Stage 0 代码事实基线已通过总控验收，当前在无人值守模式下继续推进 Stage 1 最小代码链路，不派 `AlembicTest`、不启动 038 / 039、不提前做 search / vector / PrimeInjectionPackage。

## 目标判断

- 用户目标：推进 `GTODO-2026-05-24-037 / Plugin intent knowledge route`，在已验收的 Stage 0 代码事实基础上继续无人值守执行 Stage 1 最小代码链路，不把阶段计划当默认停点。
- 最终完成定义：`AlembicPlugin` 具备向后兼容、可选、可降级的 host intent / turn metadata 输入承载；`Alembic` 能消费该最小 intent context 并映射到现有 prime / search pipeline；旧 `userQuery` / `activeFile` / `language` fallback 保持可用；总控独立复核提交、diff、targeted tests 和跨仓库字段链路后，决定是否进入下一阶段或归档。
- 当前是否已经达到：Stage 0 已达到，037 主线未完成。三窗口回填已被总控独立复核并接受；下一步是 Stage 1 最小代码链路实现。
- 未达到时剩余差距：需要由 `AlembicPlugin` 生产向后兼容的 host intent 输入承载，由 `Alembic` 消费最小 intent context 并保持 fallback / sourceRefs / searchMeta。
- 已达到时验收 / 归档判断：Stage 1 完成后继续验收是否推进下一阶段或归档 037；无人值守模式下不因阶段计划本身暂停。
- 当前任务分区：分配计划 + 自动化派发；是 Stage 1 最小实现，不扩大到 search / vector / PrimeInjectionPackage。
- 不纳入本轮事项：不改产品源码；不派 `AlembicTest`；不启动 038 / 039；不做 search / vector / PrimeInjectionPackage；不提前创建 `IntentEpisode` 持久化或 Dashboard UI；不让下游窗口猜 contract。

## 总控决策记录

- 本次决策触发：Stage 0 已通过总控验收；用户纠偏无人值守自动化应持续推进到最终目标完成，不能停在“给用户看 Stage 1 计划”。
- 需求 / 测试结果理解：Stage 0 只证明代码事实基线和 Stage 1 最小链路方案，不证明产品功能完成。下一步必须执行 Plugin producer + Alembic consumer 的最小代码链路。
- 已核对证据：`AGENTS.md` 停止卡、当前 workspace index / status、两份 Design requirement 文档、Stage 0 三窗口 VAD 回填、VAD controller / target skill、当前 `visible-dispatch` runtime 状态。
- 是否需要先验证 / 重新计划 / 用户确认：不需要再等用户确认 Stage 1；Stage 1 仍在已确认的 037 目标、非目标和仓库边界内。启动前必须先修正计划字段、运行 sync / dispatch / VAD preflight。
- 本次允许更新：当前计划、workspace index / current status 的机械同步、VAD local runtime mode、VAD local dispatch queue / automation run state。
- 本次不得更新：总控不得直接修改子仓库产品源码；不得写入 raw thread id 到 tracked docs；不得把窗口回填直接写成总控结论；不得把 Stage 0 自动化成功当成 Stage 1 实现完成；不得创建 `AlembicTest` 测试单。

## Design / 需求来源

- 来源类型：AlembicDesign handoff + Stage 0 总控验收 + 用户无人值守持续推进纠偏。
- 来源文档：
  - `AlembicDesign/docs/current/intent-recognition-episode-continuity-requirement-design-2026-05-26.md`
  - `AlembicDesign/docs/current/plugin-intent-knowledge-route-requirement-design-2026-05-26.md`
- 用户确认状态：已确认 037 为当前主线；Stage 0 已验收；无人值守模式下 Stage 1 不再因“计划已生成”默认暂停。
- 总控接收结论：Stage 1 先做 Plugin host intent 输入承载和 Alembic prime / search 最小消费，Core 观察，不下沉新 contract。
- 是否需要目标阶段确认：不需要新增确认；Stage 1 在已确认目标和非目标内。
- 是否需要代码实现依赖调研：Stage 0 已完成；本轮进入最小实现与 targeted verification。

## Stage 0 代码事实问题

1. Plugin host intent 输入：
   - Codex host / MCP 工具调用当前是否有 `_meta`、tool input、session、conversation、active file、user prompt 或类似 metadata 承载位。
   - `alembic_task prime` / `alembic_search` 等工具 schema 当前允许哪些字段；能否表达 `hostDeclaredIntent`、`hostTurnMeta`、confidence、source refs 或需要新增 Plugin-owned contract。
   - Stage 1 最小链路中，Plugin 应该生产 `IntentExtractionFrame` 还是只传递 host-declared input。
2. Alembic prime / search 消费：
   - 本地 daemon / MCP / project scope / knowledge search 当前如何接收 prime / search 输入，如何构造 query、scope、session history 和 source refs。
   - 现有结果是否能承载 “needs-confirmation / degraded / source evidence / shout” 类输出。
   - Stage 1 最小链路中，Alembic 需要消费哪些字段，哪些字段应保持 Plugin-owned。
3. Core contract 下沉判断：
   - AlembicCore 当前是否已有 source refs、search plan、recipe evidence、project scope、intent-like 类型或 shared contract。
   - `IntentExtractionFrame` / `RecognizedIntentDraft` 是否会被 Plugin 与 Alembic 双向消费；若只有单边使用，暂不下沉。
   - Stage 1 最小代码链路需要的最小 shared contract 是什么；哪些 contract 必须等 Stage 3 / 4 / 5 再讨论。

## 阶段顺序

1. Stage 0：只读代码事实基线，三窗口并行调研并回填证据。
2. Stage 0 验收：总控独立复核回填，区分窗口自述、原始证据和总控裁决。
3. Stage 1 计划：总控形成 Stage 1 最小代码链路和执行计划。
4. Stage 1 实现：无人值守模式下继续启动，因为该实现仍在已确认目标、边界和非目标内。

- 下一处真实阻塞点：Stage 1 Plugin producer 与 Alembic consumer 尚未实现并互相消费。
- 阻塞点之前还能做：并行派发 `AlembicPlugin` producer 与 `Alembic` consumer 最小实现；`AlembicCore` 观察是否出现稳定共享结构。
- 当前可派发窗口：`AlembicPlugin`、`Alembic`。
- 当前阻塞 / 观察窗口：`AlembicCore` 观察，当前不新增 contract；`AlembicAgent` / `AlembicDashboard` 观察；`AlembicTest` 无任务。

## Stage 0 总控验收结论

- 窗口自述：`AlembicPlugin`、`Alembic`、`AlembicCore` 均声明只读调研完成，子仓库 `git status --short` 输出为空，并回填读取文件、搜索命令、关键事实、Stage 1 建议和不应提前做事项。
- 原始证据：VAD group `g037-stage0-code-baseline-2026-05-26` 三个任务均 completed；总控已读取 `.workspace-local/visible-dispatch/dispatch-queue.json` 回填、复核三仓库 `git status --short`、检查 Plugin MCP schema / handler、Alembic resident task / prime search pipeline、Core ProjectScope / source contracts / SearchTypes，并用 `rg` 确认当前无 `hostDeclaredIntent`、`hostTurnMeta`、`IntentExtractionFrame`、`RecognizedIntentDraft`、`IntentEpisode`、`IntentSearchPlan`、`PrimeInjectionPackage` 既有类型。
- 总控裁决：Stage 0 验收通过。回填证据回答了本阶段唯一问题：当前没有现成完整 host intent contract；Plugin 是 Codex-facing 输入生产 / 传递边界；Alembic 已有 prime / search 消费链路和 `sessionHistory` / `language` / `intent` 上下文承载位；Core 已有 ProjectScope、source refs、SearchTypes 和 source contracts，但 Stage 1 不应为了结构好看新增 Core intent contract。
- 不能推出的结论：不能证明 Stage 1 实现已完成；不能证明 Codex SDK 当前真实提供 `request._meta`；不能证明 search / vector / relation / PrimeInjectionPackage 可用；不能证明需要 `AlembicTest`。

## Stage 1 执行计划草案

Stage 1 目标：打通最小代码链路，让 Plugin 能接收 / 归一化 host-declared intent 与 turn metadata，并把安全、可降级的 intent context 交给 prime / search 消费；保留现有 `userQuery` / `activeFile` / `language` fallback，不做搜索算法、vector、relation、PrimeInjectionPackage、IntentEpisode 持久化或 Dashboard UI。

推荐阶段顺序：

1. `AlembicPlugin` producer：新增向后兼容的可选输入承载位，范围限于 `hostDeclaredIntent`、`hostTurnMeta`、降级原因 / confidence / source refs；安全提取 MCP request metadata，只保留 redacted allowlist；用现有 `userQuery` / `activeFile` / `language` 做 deterministic fallback；补 schema / handler targeted tests。
2. `Alembic` consumer：在 prime / search 消费侧接受 Plugin 传入的最小 intent context，映射到现有 `IntentExtractor` / `PrimeSearchPipeline` / search context，不改 JobStore、daemon 生命周期、搜索算法或 resident vector；保留 `searchMeta` / sourceRefs / degraded 状态；补 targeted unit 或 lightweight runtime JSON probe。
3. `AlembicCore` 观察：Stage 1 默认不新增 Core contract。仅复用现有 ProjectScope、source refs、SearchTypes 和 source-contracts；如果实现中出现 Plugin 与 Alembic 必须长期共享且字段稳定的同一结构，再回到总控确认是否下沉最小 DTO / normalizer / validator。
4. 总控验收：只验 Stage 1 最小链路和 targeted tests；仍不派 `AlembicTest`，除非实现后出现必须依赖真实项目、cold-start / rescan、Dashboard 手动观察、运行时监控或跨仓库环境证据的问题。

Stage 1 当前发送 `AlembicPlugin` 与 `Alembic`；自动化不是跳过总控判断，而是把已验收的 Stage 0 计划继续落到下一阶段。

## 任务包

| 任务包 ID | 窗口 | 摘要 | 状态 |
| --- | --- | --- | --- |
| G037-STAGE0-PLUGIN-HOST-INTENT-FACTS | `AlembicPlugin` | 只读确认 Codex host intent 输入、MCP tool schema / metadata / prime 参数边界，以及 Stage 1 Plugin 最小生产 / 传递责任。 | 总控验收通过 |
| G037-STAGE0-ALEMBIC-PRIME-SEARCH-FACTS | `Alembic` | 只读确认 Alembic prime / search / project scope / source refs 消费链路，以及 Stage 1 Alembic 最小消费责任。 | 总控验收通过 |
| G037-STAGE0-CORE-CONTRACT-FACTS | `AlembicCore` | 只读确认 shared contract / source refs / search contract 现状，判断 Stage 1 是否需要下沉 Core。 | 总控验收通过 |
| G037-STAGE1-PLUGIN-HOST-INTENT-FRAME | `AlembicPlugin` | 实现向后兼容的 Plugin-owned host intent / turn metadata 输入承载、redacted allowlist 提取、deterministic fallback 和 targeted tests。 | 待启动 |
| G037-STAGE1-ALEMBIC-INTENT-CONSUME | `Alembic` | 消费 Plugin 传入的最小 intent context，映射到现有 prime / search context，保留 fallback / sourceRefs / searchMeta，并补 targeted verification。 | 待启动 |
| G037-STAGE1-CORE-CONTRACT-OBSERVE | `AlembicCore` | 观察 Stage 1 是否出现稳定共享结构；默认不新增 Core contract。 | 观察中 |

### G037-STAGE1-PLUGIN-HOST-INTENT-FRAME

窗口：`AlembicPlugin`

阶段目标：

- 让 Plugin 作为 Codex-facing producer，具备最小、可选、向后兼容的 host intent / turn metadata 输入承载。

主线动作：

- 在 MCP schema / handler 边界新增可选 `hostDeclaredIntent`、`hostTurnMeta` 或等价最小结构，保持旧 `userQuery` / `activeFile` / `language` 不破坏。
- 安全提取允许的 request metadata，只保留 redacted allowlist；不能把 raw thread id、私密路径或大段 host payload 写入响应 / tracked docs。
- 把 host-declared input 与现有 `IntentExtractor` output 合并为 Plugin-owned draft，并明确 degraded / confidence / source 标记。
- 补 schema / handler targeted tests，证明旧输入仍可用，新输入可进入 prime flow。

合并 TODO：

- `GTODO-2026-05-24-037` Stage 1 Plugin producer 最小输入承载。

明确不包含：

- 不实现 `IntentEpisode` 持久化。
- 不下沉 Core contract。
- 不判断 Alembic search / vector / relation scoring。
- 不创建 `PrimeInjectionPackage`。

下一处真实阻塞点：

- Plugin 还没有可复核的 host intent / turn metadata 最小输出结构，Alembic consumer 无法稳定消费。

阻塞点之前还能做：

- 在 Plugin 自己边界内完成可选 schema、handler normalization、redacted metadata allowlist、fallback 和 targeted tests；不等待 Core contract。

验证命令：

```text
git status --short
npm test -- --runInBand <targeted plugin mcp/task tests>
```

回填要求：

- 完成范围、提交 hash、修改文件、验证命令和结果。
- 说明旧输入兼容性、新字段降级路径、redaction 边界、遗留风险。

### G037-STAGE1-ALEMBIC-INTENT-CONSUME

窗口：`Alembic`

阶段目标：

- 让 Alembic 消费 Plugin 传入的最小 intent context，并映射到现有 prime / search pipeline。

主线动作：

- 在 resident / MCP / task prime 入口接收最小 intent context，映射到现有 `IntentExtractor`、`PrimeSearchPipeline`、search context 或 `sessionHistory` / `language` / `intent` 承载位。
- 保持 `userQuery` / `activeFile` / `language` fallback；保持 `searchMeta`、sourceRefs、degraded 状态可复核。
- 补 targeted unit 或 lightweight runtime JSON probe，证明新 context 能影响 prime / search context，且无新字段时旧路径不变。

合并 TODO：

- `GTODO-2026-05-24-037` Stage 1 Alembic consumer 最小消费链路。

明确不包含：

- 不改 JobStore / daemon 生命周期。
- 不重写 search / vector / BM25 / relation。
- 不创建 `PrimeInjectionPackage`。
- 不派 `AlembicTest`。

下一处真实阻塞点：

- Alembic 还没有从 Plugin 最小 intent context 到现有 prime / search context 的可验证消费路径。

阻塞点之前还能做：

- 先实现可选字段接收、mapping、fallback 和 targeted probe；若 Plugin 最终字段名有轻微差异，保持兼容适配而不扩大到 search 算法。

验证命令：

```text
git status --short
npm test -- --runInBand <targeted alembic task/search tests>
```

回填要求：

- 完成范围、提交 hash、修改文件、验证命令和结果。
- 说明消费字段、fallback、sourceRefs / searchMeta 证据、遗留风险。

### G037-STAGE0-PLUGIN-HOST-INTENT-FACTS

窗口：`AlembicPlugin`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-26 19:37 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-26 19:37 CST

阶段目标：

- 确认 Plugin 作为 Codex host agent 入口，当前可以从哪里取得或传递 host intent / turn metadata。

主线动作：

- 读取 `AlembicPlugin/AGENTS.md`、MCP tool 定义、plugin skill / manifest、prime / search 入口和 schema。
- 用只读命令搜索 `alembic_task`、`prime`、`search`、`_meta`、`metadata`、`inputSchema`、`session`、`projectRoot`、`userQuery`、`host`、`intent` 等真实入口。
- 回填 Stage 1 Plugin 最小代码链路建议：生产什么、传递什么、不该在 Plugin 内判断什么。

合并 TODO：

- `GTODO-2026-05-24-037` Stage 0 Plugin host intent 输入事实基线。

明确不包含：

- 不实现 `IntentExtractionFrame` / `RecognizedIntentDraft`。
- 不改 MCP schema、skill、manifest 或 runtime。
- 不做 Alembic daemon / Core contract 变更。

下一处真实阻塞点：

- 未确认 host intent 输入来源和 schema 承载边界前，不能让 Alembic 或 Core 猜字段。

阻塞点之前还能做：

- 完成只读入口搜索、文件定位、现有 schema 摘要和 Stage 1 Plugin 责任边界建议。

验证命令：

```text
git status --short
rg -n "alembic_task|prime|search|_meta|metadata|inputSchema|session|projectRoot|userQuery|host|intent" .
```

回填要求：

- 完成范围：
- 读取的文件 / 模块：
- 只读命令和关键输出摘要：
- Plugin host intent 输入事实：
- Stage 1 最小链路建议：
- 不应提前做的事项：
- 遗留风险：

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档、`AlembicPlugin/AGENTS.md`，并声明当前窗口定位和仓库职责。
- 只做代码事实调研，不改产品源码。

### G037-STAGE0-ALEMBIC-PRIME-SEARCH-FACTS

窗口：`Alembic`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-26 19:37 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-26 19:37 CST

阶段目标：

- 确认 Alembic 本地增强底座如何消费 prime / search 输入，哪些字段可进入 daemon / project scope / knowledge search / source refs。

主线动作：

- 读取 `Alembic/AGENTS.md`、MCP / daemon / API / search / project scope / prime 相关入口。
- 用只读命令搜索 `prime`、`search`、`alembic_task`、`projectRoot`、`projectScope`、`sessionHistory`、`sourceRef`、`recipe`、`knowledge`、`shout`、`needs-confirmation`、`metadata`。
- 回填 Stage 1 Alembic 最小消费责任：接收哪些 Plugin 字段、如何降级、如何保留 evidence / source refs。

合并 TODO：

- `GTODO-2026-05-24-037` Stage 0 Alembic prime / search 消费事实基线。

明确不包含：

- 不实现 keyword / BM25 / vector / relation search。
- 不实现 PrimeInjectionPackage。
- 不改 daemon / API / JobStore / ProjectRegistry。

下一处真实阻塞点：

- 未确认现有 prime / search 消费链路前，不能设计 Stage 1 字段流和验证命令。

阻塞点之前还能做：

- 完成只读入口搜索、消费链路摘要、现有 evidence / source refs 能力判断和 Stage 1 Alembic 责任边界建议。

验证命令：

```text
git status --short
rg -n "prime|search|alembic_task|projectRoot|projectScope|sessionHistory|sourceRef|recipe|knowledge|shout|needs-confirmation|metadata" .
```

回填要求：

- 完成范围：
- 读取的文件 / 模块：
- 只读命令和关键输出摘要：
- Alembic prime / search 消费事实：
- Stage 1 最小链路建议：
- 不应提前做的事项：
- 遗留风险：

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档、`Alembic/AGENTS.md`，并声明当前窗口定位和仓库职责。
- 只做代码事实调研，不改产品源码。

### G037-STAGE0-CORE-CONTRACT-FACTS

窗口：`AlembicCore`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-26 19:37 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-26 19:37 CST

阶段目标：

- 判断 Stage 1 是否真的需要把 intent / source-ref contract 下沉到 Core，还是先留在 Plugin / Alembic 边界。

主线动作：

- 读取 `AlembicCore/AGENTS.md`、shared contract / types / search / source-ref / recipe / project scope 相关入口。
- 用只读命令搜索 `sourceRef`、`search`、`recipe`、`projectScope`、`intent`、`metadata`、`evidence`、`vector`、`relation`、`contract`。
- 回填 Core 下沉判断：现有可复用类型、缺口、何时才应该新增 shared contract、Stage 1 最小 contract 候选。

合并 TODO：

- `GTODO-2026-05-24-037` Stage 0 Core contract 下沉事实基线。

明确不包含：

- 不实现新 Core contract。
- 不提前做 Stage 3 / 4 search / vector / relation contract。
- 不改 package exports 或 downstream adapters。

下一处真实阻塞点：

- 未确认双向消费前，不能为了“结构好看”提前下沉 Core。

阻塞点之前还能做：

- 完成只读入口搜索、现有 shared types 摘要、下沉判断和 Stage 1 最小 contract 候选。

验证命令：

```text
git status --short
rg -n "sourceRef|search|recipe|projectScope|intent|metadata|evidence|vector|relation|contract" .
```

回填要求：

- 完成范围：
- 读取的文件 / 模块：
- 只读命令和关键输出摘要：
- Core contract 现状：
- 是否需要 Stage 1 下沉及理由：
- Stage 1 最小链路建议：
- 不应提前做的事项：
- 遗留风险：

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档、`AlembicCore/AGENTS.md`，并声明当前窗口定位和仓库职责。
- 只做代码事实调研，不改产品源码。

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GTODO-2026-05-24-037 | 当前主线 / Stage 1 自动化待启动 | plugin intent knowledge route | P1 | `AlembicPlugin` / `Alembic` / `AlembicCore` / 后续可能 `AlembicDashboard` | Plugin 意图同步，以及意图下面的知识注入与知识检索链路优化增强；Stage 0 代码事实基线已验收。 | 是 | 用户已确认无人值守自动化应继续到最终目标；当前派发 Stage 1 最小代码链路。 | 总控 |
| GTODO-2026-05-24-038 | 等待 037 阶段结果 | knowledge evolution follow-up | P2 | 待定 | 等 037 链路稳定后再判断。 | 否 | 本轮禁止启动。 | 无 |
| GTODO-2026-05-24-039 | 等待 037 阶段结果 | knowledge evolution follow-up | P2 | 待定 | 等 037 链路稳定后再判断。 | 否 | 本轮禁止启动。 | 无 |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `AlembicPlugin` | Stage 1 待启动 | 是 | 实现 Plugin-owned host intent / turn metadata 输入承载和 targeted tests。 |
| `Alembic` | Stage 1 待启动 | 是 | 消费 Plugin intent context 到 prime / search pipeline 并补 targeted verification。 |
| `AlembicCore` | 观察 | 否 | Stage 1 默认不新增 Core contract；如实现中出现稳定共享结构再回到总控确认。 |
| `AlembicAgent` | 观察 | 否 | Stage 0 未确认 Agent runtime 参与点；暂不派发。 |
| `AlembicDashboard` | 观察 | 否 | 当前不做 UI，不消费未确认字段。 |
| `AlembicTest` | 无任务 | 否 | 当前不需要真实项目验证、cold-start / rescan 或 Dashboard 手动观察。 |
| `BiliDili` | 无任务 | 否 | 不触碰真实测试项目。 |

## 窗口分派

发送给：`AlembicPlugin`、`Alembic`

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>待启动 | 执行 `G037-STAGE1-ALEMBIC-INTENT-CONSUME`，消费 Plugin intent context 到现有 prime / search pipeline。 |
| `AlembicCore`<br>观察中 | Stage 1 默认不新增 Core contract，观察是否出现稳定共享结构。 |
| `AlembicAgent`<br>观察中 | 当前不派发；等 Stage 0 事实显示 Agent runtime 需要参与后再判断。 |
| `AlembicDashboard`<br>观察中 | 当前不派发；Stage 0 不做 UI。 |
| `AlembicPlugin`<br>待启动 | 执行 `G037-STAGE1-PLUGIN-HOST-INTENT-FRAME`，实现 Plugin-owned host intent / turn metadata 输入承载。 |
| `AlembicTest`<br>无任务 | 当前不涉及真实项目验证。 |
| `BiliDili`<br>无任务 | 不触碰真实项目。 |

## 可复制提示词

发送给：`AlembicPlugin`、`Alembic`

```text
先读取 AGENTS.md、docs/workspace/index.md、docs/workspace/current/plugin-intent-knowledge-route-stage-1-mainline-2026-05-26.md，以及你所在窗口/目标仓库的 AGENTS.md。

先明确声明当前窗口定位和本轮仓库职责。

按照当前总控文档领取分配给你所在窗口的 Stage 1 最小代码链路任务；只做本窗口任务，不代处理其它窗口。

完成后回填：完成范围、提交 hash、修改文件、验证命令、验证结果、旧路径兼容性、遗留风险和下一步建议。
```

## 测试交接

- 是否需要 `AlembicTest`：否。
- 总控自测结论：Stage 1 是 Plugin / Alembic 最小代码链路实现和 targeted verification；总控可以用 workspace 脚本校验计划、分派覆盖、VAD preflight 和 runtime 状态，代码侧验证由对应源仓库窗口运行 targeted tests 并回填原始证据。
- 需要真实场景的理由：无。当前不需要真实项目、cold-start / rescan、Dashboard 手动观察、运行时监控或真实项目复现 / 回归。
- 测试前边界与多条件判断：
  - 测试要回答的问题：当前计划是否正确只发送 Stage 1 `AlembicPlugin` / `Alembic` 两个实现任务，VAD 是否只投递到这两个窗口，目标 thread 是否通过 local preflight。
  - 测试对象 / 目标窗口 / 线程 / 项目边界：仅 AlembicWorkspace 文档、VAD local runtime、`AlembicPlugin` 与 `Alembic` 目标窗口；不触碰真实测试项目，不派 `AlembicTest`。
  - 成功能推出的结论：Stage 1 自动化投递已启动，等待两个源仓库窗口回填提交和 targeted test 证据。
  - 失败能推出的结论：若 workspace 脚本 / preflight 失败，归因于 workspace 文档 / VAD runtime / thread registry / automation 投递；若窗口 targeted tests 失败，归因待总控复核后再定位到对应源码链路。
  - 不能推出的结论：不能证明 Stage 1 实现已经通过总控验收，不能证明 search/vector/PrimeInjectionPackage 可用，不能证明需要 `AlembicTest`。
  - 停止或不开始条件：preflight 缺真实 thread id、mode 防睡眠启动失败、dispatch coverage 失败、计划出现 `AlembicTest` 发送任务、038 / 039 被启动，或任务 id 与旧 Stage 0 已验收任务发生碰撞。
- 测试单：无。
- 测试交流入口：[alembic-test-exchange.md](alembic-test-exchange.md)
- 真实项目保护说明：不触碰真实测试项目。

## 自动化控制

- VAD mode：本轮应开启并继续无人值守自动化。
- Dispatch group：`g037-stage1-minimal-chain-2026-05-26`。
- Return policy：`controller-last`；最后一个目标窗口完成后回跳总控，由总控验收并决定下一阶段、返工、自测或归档。
- Target windows：`AlembicPlugin`、`Alembic`。
- 禁止事项：不得创建 `AlembicTest` heartbeat；不得向观察窗口投递；不得把 raw thread id 写入 tracked docs。

## 回填区

- 2026-05-26 19:19 CST：用户确认 VAD 归档、037 提升为下一主线；总控创建本文作为新的当前入口。VAD 后续问题转入 bug / optimization，不再阻塞 037 主线。
- 2026-05-26 19:25 CST：已将 13 个 VAD current 文档归档到 `docs/workspace/archive/2026-05/visible-automation-dispatch/`；`visible-dispatch` mode 已关闭，防睡眠 inactive。`GTODO-2026-05-24-037` 已切为下一主线，`GTODO-2026-05-25-005` 已降为已完成待归档 / 后续 bug 优化。验证通过：`node scripts/sync-current-plan.mjs --check --json`、`node scripts/check-script-docs.mjs`、`node scripts/verify-workspace-docs.mjs --json`、`git diff --check`、`node scripts/verify-control-center.mjs --with-script-tests`，其中 workspace script tests 70 项通过。
- 2026-05-26 19:37 CST：用户确认 037 Stage 0 范围：只调研不实现，确认 Plugin host intent 输入、Alembic prime / search 消费、Core contract 是否需要下沉，以及 Stage 1 最小代码链路；完成后给用户看 Stage 1 执行计划。当前禁止派 `AlembicTest`、启动 038 / 039、提前做 search / vector / PrimeInjectionPackage；总控准备开启 VAD 自动化投递三窗口只读基线任务。
- 2026-05-26 20:03 CST：VAD group `g037-stage0-code-baseline-2026-05-26` 三窗口均 completed，且目标 automation 均已 record-stop。总控已复核回填和关键代码事实，并对 `Alembic`、`AlembicCore`、`AlembicPlugin` 三个任务写入 accepted verdict。Stage 0 验收通过；当时误判为需要暂停等待用户确认 Stage 1 执行计划草案，后续被 20:20 用户纠偏取代。
- 2026-05-26 20:20 CST：用户纠偏：无人值守自动化应持续推进到最终目标完成，甚至领取新 TODO；不能把阶段计划当默认停点。总控已将 VAD controller / target skill、提示词和当前计划调整为 Stage 1 自动化继续。

<!-- workspace-sync
{
  "status": "执行中（无人值守 Stage 1 最小代码链路待启动）",
  "indexPlanDescription": "GTODO-2026-05-24-037 / Plugin intent knowledge route：Stage 0 代码事实基线已验收；当前无人值守继续 Stage 1 最小代码链路，发送给 AlembicPlugin / Alembic，不派 AlembicTest，不启动 038/039，不提前做 search/vector/PrimeInjectionPackage。",
  "indexStatusDescription": "037 Stage 0 已通过总控验收；当前无人值守继续 Stage 1，发送给 AlembicPlugin / Alembic。",
  "currentIndexType": "当前计划",
  "currentIndexDescription": "GTODO-2026-05-24-037 Stage 0 已验收；Stage 1 最小代码链路无人值守待启动。",
  "currentStatusSummary": "037 Stage 0 已通过总控验收；当前无人值守继续 Stage 1，发送给 `AlembicPlugin` / `Alembic`。当前不派 `AlembicTest`，不启动 038/039，不提前做 search/vector/PrimeInjectionPackage。",
  "indexRows": [],
  "currentIndexRows": [
    {
      "type": "GTODO 037 Intent Recognition Design",
      "doc": "AlembicDesign/docs/current/intent-recognition-episode-continuity-requirement-design-2026-05-26.md",
      "description": "037 第一阶段需求设计：prime 快速路径结构化意图、hostTurnMeta、IntentEpisode 连续性和本地 refinement 边界。"
    },
    {
      "type": "GTODO 037 Intent Knowledge Design",
      "doc": "AlembicDesign/docs/current/plugin-intent-knowledge-route-requirement-design-2026-05-26.md",
      "description": "037 第二阶段需求设计：IntentSearchPlan、keyword / vector / relation 增强和保留 source refs 的 PrimeInjectionPackage。"
    }
  ]
}
-->
