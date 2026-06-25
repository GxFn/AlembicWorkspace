# Plugin Intent Knowledge Route Stage 1 Mainline

日期：2026-05-26
状态：已完成待归档（037 Stage 6A 总控验收通过）
发送给：无
总控定位：本文件是 `GTODO-2026-05-24-037 / Plugin intent knowledge route` 当前总控入口；Stage 0、Stage 1A、Stage 1B、Stage 1C、Stage 2A、Stage 2B、Stage 2C、Stage 3A `IntentSearchPlan` + keyword / BM25 baseline、Stage 4A vector / relation 代码事实基线、Stage 4B Alembic vector / relation evidence 最小实现、Stage 4C Plugin evidence consumption、Stage 5A Alembic `PrimeInjectionPackage` source package、Stage 5B Plugin Codex-facing exposure 和 Stage 6A AlembicTest minimal smoke 均已通过总控验收；当前 037 主线在已确认范围内闭合，等待总控归档，不自动启动 038 / 039。

## 目标判断

- 用户目标：推进 `GTODO-2026-05-24-037 / Plugin intent knowledge route`，在已验收的 Stage 0 代码事实基础上继续无人值守执行 Stage 1 最小代码链路，不把阶段计划当默认停点。
- 最终完成定义：`AlembicPlugin` 能从 Codex-facing prime / search 接收安全 host intent / turn metadata，`Alembic` 能消费 recognized intent / episode continuity 形成 `IntentSearchPlan`、keyword / BM25 / vector / relation evidence 和 `PrimeInjectionPackage` source，Plugin 能把 package 安全暴露到 Codex-facing response / prime material / episode metadata；旧 `userQuery` / `activeFile` / `language` fallback 保持可用；最小真实集成 smoke 证明该链路可用后，总控再裁决是否归档或转入后续优化。
- 当前是否已经达到：已达到。Stage 6A `AlembicTest` 最小 test-mode fixture smoke 回填通过，总控复跑同一 probe 也返回 `ok=true`、`classification=passed`；Codex-facing search response、prime response searchMeta、prime material 和 IntentEpisode start/outcome metadata 均包含 `PrimeInjectionPackage`。
- 剩余差距：037 主线内无剩余功能差距。真实 Alembic daemon / 默认 Codex.app Node 路径被 native sqlite / ABI 环境阻塞，已作为 `GTODO-2026-05-27-001` 记录为后续 runtime / test harness 问题，不阻塞本轮 037 最小闭环。
- 已达到时验收 / 归档判断：037 可进入总控归档。038 / 039 是独立后续主线，必须另行目标确认和阶段计划，不因 037 完成自动启动。
- 当前任务分区：验收 / 归档；不做新产品实现，不继续自动派发。
- 不纳入本轮事项：不启动 038 / 039；不做 Dashboard UI；不下沉 `AlembicCore` contract；不新增 Plugin package 生成逻辑。

## 总控决策记录

- 本次决策触发：Stage 6A `AlembicTest` 已回跳；总控已审计并删除本条 controller-return automation，复核 VAD group、测试回填、JSON evidence、报告、产品仓库 clean status，并用 Node 22.22.1 复跑 smoke probe 得到 `ok=true`、`classification=passed`。
- 需求 / 测试结果理解：Stage 6A 证明 Plugin runtime 在 resident-shaped HTTP fixture 下可以把 Alembic `PrimeInjectionPackage` 传回 Codex-facing search / prime / episode 字段；native addon / Node 环境问题是真实 runtime/test harness 风险，但不是 037 package 字段链路失败。
- 已核对证据：`AGENTS.md` 停止卡、当前 workspace index / status、两份 Design requirement 文档、Stage 6A VAD 回填、`AlembicTest` JSON / report、总控复跑输出、`Alembic` / `AlembicPlugin` clean status、VAD accepted verdict 和测试交流单。
- 是否需要先验证 / 重新计划 / 用户确认：无需继续派发。037 已达到当前完成定义；后续 038 / 039、full daemon / cold-start / rescan 或 Dashboard UI 都需要另行确认。
- 本次允许更新：当前计划、测试交流、全局 TODO、workspace index / current status 的机械同步、VAD local runtime mode。
- 本次不得更新：总控不得直接修改子仓库产品源码；不得写入 raw thread id 到 tracked docs；不得把窗口回填直接写成总控结论；不得启动 038 / 039；不得把 Stage 6A 扩大成 full cold-start / rescan / Dashboard UI。

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
4. Stage 1A / 1B 最小链路实现与验收：Plugin / Alembic 字段承载和 resident handoff 已通过总控验收。
5. Stage 1C recognized intent draft：在 Plugin 边界内形成可解释、可降级、可复核的 `RecognizedIntentDraft` / `IntentExtractionFrame` 最小版本，已通过总控验收。
6. Stage 2A IntentEpisode storage boundary：只做代码事实基线，确认 Plugin / Alembic / Core 中哪个层级应负责 episode quick read/write、ProjectScope scoped storage 和跨会话 continuity；已通过总控验收，裁决 Alembic resident / ProjectScope dataRoot 先承接最小持久化，Plugin 暂作 caller，Core 暂不下沉。
7. Stage 2B Alembic IntentEpisode store/API：`Alembic` 单窗口实现 resident store/API 生产者，已通过总控验收。
8. Stage 2C Plugin IntentEpisode handoff：`AlembicPlugin` 调用 Alembic resident API，写入 recognized draft / host turn / searchMeta，并读取 latest/recent continuity；已通过总控验收。
9. Stage 3A IntentSearchPlan + keyword / BM25 baseline：`Alembic` 消费 recognized intent / episode continuity，生成可复核 query plan，先影响 keyword / BM25 查询、过滤和排序证据；已通过总控验收。
10. Stage 4A vector / relation 代码事实基线：只读确认 `Alembic` / `AlembicCore` 现有 vector、ranking、relation、source refs 和 score metadata 链路；已通过总控验收，裁决 Stage 4B 先在 `Alembic` 局部做 evidence wiring，Core 观察。
11. Stage 4B Alembic vector / relation evidence 最小实现：在 `Alembic` 搜索 / prime 边界消费现有 `IntentSearchPlan`、Core SearchEngine meta 和 graph primitives，输出可复核 semantic anchors、top matches、score breakdown 和 relation evidence；已通过总控验收。
12. Stage 4C Plugin evidence consumption：`AlembicPlugin` 消费 Alembic resident `intentEvidence`，把 evidence 安全带回 Codex-facing `alembic_search`、`alembic_task prime` 和 episode handoff 的可复核 metadata；已通过总控验收。
13. Stage 5A Alembic PrimeInjectionPackage source package：`Alembic` 基于已稳定的 intent/search/vector/relation evidence 汇总 package source，保留 selectedKnowledge、omitted、source refs、injection status 和 trace；已通过总控验收。
14. Stage 5B Plugin PrimeInjectionPackage exposure：`AlembicPlugin` 消费 Alembic package source，并在 Codex-facing `alembic_task prime` 中返回统一 `PrimeInjectionPackage`；已通过总控验收。
15. Stage 6A AlembicTest minimal real integration smoke：用真实测试窗口验证 Plugin runtime / Alembic resident / Plugin response package 链路，已通过总控验收。

- 下一处真实阻塞点：037 当前无主线阻塞；后续 native addon / Node runtime smoke 问题已转 `GTODO-2026-05-27-001`。
- 阻塞点之前还能做：总控归档 037，并等待用户确认是否提升 038 / 039 或其它 TODO。
- 当前可派发窗口：无。
- 当前阻塞 / 观察窗口：`AlembicPlugin` / `Alembic` / `AlembicCore` / `AlembicAgent` / `AlembicDashboard` / `AlembicTest` 均无当前派发。

## Stage 0 总控验收结论

- 窗口自述：`AlembicPlugin`、`Alembic`、`AlembicCore` 均声明只读调研完成，子仓库 `git status --short` 输出为空，并回填读取文件、搜索命令、关键事实、Stage 1 建议和不应提前做事项。
- 原始证据：VAD group `g037-stage0-code-baseline-2026-05-26` 三个任务均 completed；总控已读取 `.wakeflow-local/visible-dispatch/dispatch-queue.json` 回填、复核三仓库 `git status --short`、检查 Plugin MCP schema / handler、Alembic resident task / prime search pipeline、Core ProjectScope / source contracts / SearchTypes，并用 `rg` 确认当前无 `hostDeclaredIntent`、`hostTurnMeta`、`IntentExtractionFrame`、`RecognizedIntentDraft`、`IntentEpisode`、`IntentSearchPlan`、`PrimeInjectionPackage` 既有类型。
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

执行前置硬规则：每个待启动窗口必须先读取本 workspace `AGENTS.md`、当前总控文档和目标仓库 `AGENTS.md`，并明确声明当前窗口定位 / 仓库职责；只领取自己窗口对应任务，不能代领其它窗口任务。

| 任务包 ID | 窗口 | 阶段 / 目标 | 主线 / TODO | 阻塞 / 依赖 | 验证 | 回填 | 明确不包含 / 排除事项 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| G037-STAGE0-PLUGIN-HOST-INTENT-FACTS | `AlembicPlugin` | Stage 0 Plugin host intent 输入事实基线 | `GTODO-2026-05-24-037` | 需要确认 Codex host intent / MCP schema / metadata 入口 | 只读 `rg` / 文件定位 / repo clean | 读取文件、命令摘要、Stage 1 建议 | 不改源码、不实现功能 | 总控验收通过 |
| G037-STAGE0-ALEMBIC-PRIME-SEARCH-FACTS | `Alembic` | Stage 0 Alembic prime / search 消费事实基线 | `GTODO-2026-05-24-037` | 需要确认 Alembic prime / search / sourceRefs 消费链路 | 只读 `rg` / 文件定位 / repo clean | 消费链路摘要、字段建议、风险 | 不改源码、不实现 search/vector | 总控验收通过 |
| G037-STAGE0-CORE-CONTRACT-FACTS | `AlembicCore` | Stage 0 Core contract 下沉事实基线 | `GTODO-2026-05-24-037` | 需要判断 Stage 1 是否需要 Core shared contract | 只读 `rg` / 文件定位 / repo clean | 下沉判断、现有类型、风险 | 不新增 Core contract | 总控验收通过 |
| G037-STAGE1-PLUGIN-HOST-INTENT-FRAME | `AlembicPlugin` | Stage 1A Plugin-owned host intent frame | `GTODO-2026-05-24-037` | Stage 0 证明 Plugin 是 Codex-facing producer | targeted schema / task tests、build check | commit、修改文件、验证命令、redaction 风险 | 不做 episode、vector、PrimeInjectionPackage | 总控验收通过 |
| G037-STAGE1-ALEMBIC-INTENT-CONSUME | `Alembic` | Stage 1A Alembic host intent context consumer | `GTODO-2026-05-24-037` | Stage 0 证明 Alembic 有 prime / search context 承载位 | targeted unit、typecheck | commit、修改文件、验证命令、sourceRefs / searchMeta 风险 | 不改 JobStore / search 算法 | 总控验收通过 |
| G037-STAGE1B-PLUGIN-RESIDENT-INTENT-HANDOFF | `AlembicPlugin` | Stage 1B Plugin -> Alembic resident intent handoff | `GTODO-2026-05-24-037` | Stage 1A 已验收，但 resident search 仍只传 query / mode / limit / type | targeted resident client / prime pipeline tests、build check | commit、request 字段、redaction、旧路径兼容 | 不做 vector / relation / package | 总控验收通过 |
| G037-STAGE1B-ALEMBIC-RESIDENT-INTENT-CONTEXT | `Alembic` | Stage 1B Alembic HTTP search intent context | `GTODO-2026-05-24-037` | Plugin handoff 需要 Alembic `/api/v1/search` 接收 context | targeted search route / HostIntentContext tests、typecheck | commit、HTTP contract、searchMeta、旧路径兼容 | 不改 search 算法、不派 Test | 总控验收通过 |
| G037-STAGE1C-PLUGIN-RECOGNIZED-INTENT-DRAFT | `AlembicPlugin` | Stage 1C Plugin recognized intent draft / extraction frame | `GTODO-2026-05-24-037` | Stage 1B 证明可传递 context，但 Plugin 仍缺可解释 recognized draft | targeted HostIntentFrame / task prime / search handler tests、build check | commit、draft 字段、evidence spans、degraded/confidence、旧路径兼容 | 不做 episode / vector / PrimeInjectionPackage / Core contract | 总控验收通过 |
| G037-STAGE2A-PLUGIN-EPISODE-STORAGE-FACTS | `AlembicPlugin` | Stage 2A Plugin episode quick read/write 边界事实 | `GTODO-2026-05-24-037` | 需要确认 Codex-facing plugin runtime 是否应拥有 episode quick store | 只读 `rg` / 文件定位 / repo clean | runtime dataRoot、thread/session meta、task lifecycle、可复用 store、Stage 2B 建议 | 不改源码、不实现 episode | 总控验收通过 |
| G037-STAGE2A-ALEMBIC-EPISODE-STORAGE-FACTS | `Alembic` | Stage 2A Alembic resident / ProjectScope episode 边界事实 | `GTODO-2026-05-24-037` | 需要确认 resident dataRoot / ProjectScope storage 是否应承接 episode | 只读 `rg` / 文件定位 / repo clean | ProjectScope / storage / prime/search consumer 事实、Stage 2B 建议 | 不改源码、不改 search/vector | 总控验收通过 |
| G037-STAGE2A-CORE-EPISODE-CONTRACT-FACTS | `AlembicCore` | Stage 2A Core scoped contract 边界事实 | `GTODO-2026-05-24-037` | 需要判断 `IntentEpisode` 是否已有稳定共享 contract 条件 | 只读 `rg` / 文件定位 / repo clean | 现有 contract / sourceRef / SearchTypes / ProjectScope 事实、下沉判断 | 不新增 Core contract | 总控验收通过 |
| G037-STAGE2B-ALEMBIC-EPISODE-STORE-API | `Alembic` | Stage 2B Alembic IntentEpisode store/API producer | `GTODO-2026-05-24-037` | Stage 2A 裁决 Alembic resident / ProjectScope dataRoot 是第一持久化归属 | targeted store / route / task tests、typecheck | commit、修改文件、store/API 边界、privacy guard、旧路径兼容 | 不做 Plugin consumer、Core contract、vector / relation / PrimeInjectionPackage | 总控验收通过 |
| G037-STAGE2C-PLUGIN-EPISODE-HANDOFF | `AlembicPlugin` | Stage 2C Plugin IntentEpisode API consumer | `GTODO-2026-05-24-037` | Stage 2B 已验收 Alembic resident `/api/v1/intent-episodes` store/API | targeted resident client / prime pipeline / search handler tests、build check | commit、修改文件、API request / response、redaction、fallback、latest/recent read | 不做 Core contract、vector / relation / PrimeInjectionPackage、Dashboard UI | 总控验收通过 |
| G037-STAGE3A-ALEMBIC-INTENT-SEARCH-PLAN-KEYWORD | `Alembic` | Stage 3A IntentSearchPlan + keyword / BM25 baseline | `GTODO-2026-05-24-037` | Stage 2C 已证明 Plugin 能写入 / 读取 IntentEpisode；Alembic 需要消费 continuity 形成检索计划 | targeted search / prime tests、typecheck、build check | commit、修改文件、query plan 字段、keyword/BM25 影响、whySelected/sourceRefs、旧路径兼容 | 不做 vector / relation / PrimeInjectionPackage、Core contract、Dashboard UI | 总控验收通过 |
| G037-STAGE4A-ALEMBIC-VECTOR-RELATION-FACTS | `Alembic` | Stage 4A Alembic vector / relation 消费事实基线 | `GTODO-2026-05-24-037` | Stage 3A 已验收；需要确认 Alembic resident / prime 层如何接入 semantic anchors、vector stats、score metadata 和 relation evidence | 只读 `rg` / 文件定位 / repo clean | SearchEngine 调用链、vector stats、prime result shape、relation/sourceRefs 现状、Stage 4B 建议 | 不改源码、不实现 vector / relation | 总控验收通过 |
| G037-STAGE4A-CORE-VECTOR-RELATION-FACTS | `AlembicCore` | Stage 4A Core vector / relation contract 事实基线 | `GTODO-2026-05-24-037` | Stage 4 可能需要 Core SearchTypes / ranking / source contract；先确认是否应下沉 | 只读 `rg` / 文件定位 / repo clean | vector search、score breakdown、relations / graph / source contract、下沉判断 | 不改源码、不新增 contract | 总控验收通过 |
| G037-STAGE4B-ALEMBIC-VECTOR-RELATION-EVIDENCE | `Alembic` | Stage 4B Alembic vector / relation evidence 最小实现 | `GTODO-2026-05-24-037` | Stage 4A 裁决先在 Alembic 局部生成 evidence shape，Core contract 暂观察 | targeted search / prime tests、lint、build check | commit、修改文件、semantic anchors、top matches、score breakdown、relation evidence、旧路径兼容 | 不改 Core contract、不创建 PrimeInjectionPackage、不派 Test | 总控验收通过 |
| G037-STAGE4C-PLUGIN-EVIDENCE-CONSUMPTION | `AlembicPlugin` | Stage 4C Plugin intentEvidence consumer / projection | `GTODO-2026-05-24-037` | Stage 4B Alembic 已产出 optional `intentEvidence`，Plugin 需要 Codex-facing 消费与测试 | targeted resident client / search handler / prime material / episode handoff tests、build check | commit、修改文件、response / prime / episode 字段、redaction、旧路径兼容 | 不生成 evidence、不改 Core contract、不创建 PrimeInjectionPackage、不派 Test | 总控验收通过 |
| G037-STAGE5A-ALEMBIC-PRIME-INJECTION-PACKAGE-SOURCE | `Alembic` | Stage 5A Alembic PrimeInjectionPackage source package | `GTODO-2026-05-24-037` | Stage 4C 已证明 Plugin 能消费 optional evidence；Alembic 需要先汇总 package source | targeted prime / search tests、lint、build check | commit、修改文件、package 字段、selectedKnowledge / omitted、sourceRefs、injection status、旧路径兼容 | 不改 Plugin、不下沉 Core contract、不派 Test | 总控验收通过 |
| G037-STAGE5B-PLUGIN-PRIME-INJECTION-PACKAGE-EXPOSURE | `AlembicPlugin` | Stage 5B Plugin PrimeInjectionPackage Codex-facing exposure | `GTODO-2026-05-24-037` | Stage 5A 已验收 Alembic package source；Plugin 需要把 package 暴露到 Codex-facing search / prime 输出 | targeted resident client / search handler / task prime / episode handoff tests、build check | commit、修改文件、response 字段、redaction、旧路径兼容、runtime pointer | 不生成 package、不下沉 Core contract、不派 Test | 总控验收通过 |
| G037-STAGE6A-ALEMBICTEST-PRIME-PACKAGE-SMOKE | `AlembicTest` | Stage 6A minimal real integration smoke | `GTODO-2026-05-24-037` | Stage 5B 已验收 Plugin exposure；需要真实测试窗口验证 runtime / resident / response 闭环 | 最小 test-mode smoke、repo clean、报告 | smoke 命令、package 字段路径、成功 / 失败归因、报告路径 | 不跑 full cold-start / rescan、不改产品源码、不做 Dashboard UI | 待验收（已回填） |
| G037-STAGE1-CORE-CONTRACT-OBSERVE | `AlembicCore` | Stage 1 Core contract 观察 | `GTODO-2026-05-24-037` | 只有字段稳定且双向消费后才考虑下沉 | 无派发；后续总控复核 | 如需下沉再创建新任务 | 不新增 Core contract | 观察中 |

## Stage 1A 总控验收结论

- 窗口自述：`AlembicPlugin` 回填 commit `e77171a8879595555ee5c0c64a385b37d3d513a6`，声明新增 `HostIntentFrame`、MCP `hostDeclaredIntent` / `hostTurnMeta` schema、request `_meta` 读取和 redacted response frame；`Alembic` 回填 commit `053ab8b6029f89494b721fea542132c54179b6da`，声明新增 `HostIntentContext` 并让 resident task / search 接收 intent context。
- 原始证据：总控复核两个子仓库 `git status --short` 均为空；运行 `npm run typecheck`（Alembic）、`npm run build:check`（AlembicPlugin）、`npm run test:unit -- test/unit/HostIntentContext.test.ts`（Alembic）和 `npm test -- test/unit/TaskPrimeKnowledgeMaterial.test.ts test/integration/ZodSchemas.test.ts test/integration/ZodToMcpSchema.test.ts`（AlembicPlugin）均通过；`git show --check --oneline --no-ext-diff HEAD` 两仓库均无 whitespace error。
- 总控裁决：Stage 1A 两个任务验收通过，但这只证明两边已有最小字段承载和 targeted verification；不能推出 Plugin -> Alembic resident route 已经携带 intent context。
- 不能推出的结论：不能证明 Design Stage 1 的 `RecognizedIntentDraft` / `IntentExtractionFrame` 已完整收敛；不能证明 `IntentEpisode` 持久化、vector / relation、PrimeInjectionPackage 或真实项目验证已完成。

## Stage 1B 总控验收结论

- 窗口自述：`Alembic` 回填 commit `396bd5c637f608556dd5774e5d2b99eb628e9904`，声明 `/api/v1/search` 已接收 host intent context 并保留 GET query-only fallback；`AlembicPlugin` 回填 commit `8ec623a3dca5e9472f9969284ae0d2371bf4739d`，声明 resident client / prime pipeline / search handler 已通过 POST body 传递 redacted host intent context，并记录 runtime commit `063b2cc9223e8351e18420260948f1aab8b142a7`。
- 原始证据：总控复核两个子仓库 `git status --short` 均为空；运行 `npm run test:unit -- test/unit/SearchRouteTelemetry.test.ts test/unit/HostIntentContext.test.ts`（Alembic，7 tests passed）、`npm run test:unit -- test/unit/AlembicResidentServiceClient.test.ts test/unit/PrimeSearchPipelineResidentSearch.test.ts test/unit/SearchHandlerResidentSearch.test.ts`（AlembicPlugin，16 tests passed）、两仓库 `npm run build:check` 均通过；字段扫描确认 Plugin `AlembicResidentServiceClient` 使用 POST body 传递 `hostDeclaredIntent` / `hostTurnMeta` / `intentContext` / `sourceRefs`，Alembic `SearchRequestBody` 和 `HostIntentContext` 消费同名字段并回填 `hostIntentApplied` / sourceRefs 摘要。
- 总控裁决：Stage 1B 验收通过。Plugin -> Alembic resident intent handoff 的最小链路已经打通，旧 query-only fallback 保持可用，不需要 `AlembicTest`。
- 不能推出的结论：不能证明 `RecognizedIntentDraft` / `IntentExtractionFrame` 已完整收敛；不能证明 `IntentEpisode` 持久化、vector / relation、PrimeInjectionPackage 或真实项目验证已完成。

## Stage 1C 总控验收结论

- 窗口自述：`AlembicPlugin` 回填 commit `3129b532c0c5b7d9833041f9e4fd070347d9d631`，声明完成 Plugin-owned recognized intent draft / extraction frame；runtime submodule commit `2a57136c145179b22d79aab6940dd2d55218710c`，runtime tgz sha256 `b8af60c03302f38ffc57240218309b6ac33b9436981b1aba65fc6fa1ee00905c`；draft 字段覆盖 query / action / target / constraints / language / confidence / source / status / degradedReasons / evidenceSpans / sourceRefs。
- 原始证据：总控复核 `AlembicPlugin` `git status --short` 为空；`git show --stat --oneline --no-ext-diff HEAD` 显示修改 `lib/service/task/HostIntentFrame.ts`、`test/unit/HostIntentFrame.test.ts`、`TaskPrimeKnowledgeMaterial` / `SearchHandlerResidentSearch` / `PrimeSearchPipelineResidentSearch` tests 和 `plugins/alembic-codex` pointer；运行 `npm run test:unit -- test/unit/HostIntentFrame.test.ts test/unit/TaskPrimeKnowledgeMaterial.test.ts test/unit/SearchHandlerResidentSearch.test.ts test/unit/PrimeSearchPipelineResidentSearch.test.ts` 16 tests passed，`npm run build:check` passed，`git diff --check HEAD^ HEAD` passed；字段扫描确认 `RecognizedIntentDraft`、`evidenceSpans`、`degradedReasons`、`sourceRefs`、`recognizedIntentDraft` handoff 摘要存在。
- 总控裁决：Stage 1C 验收通过。Plugin 已形成 deterministic recognized intent draft，能记录 evidence spans、低置信 degraded / needs-confirmation、sourceRefs redaction，并保持旧输入和 resident handoff 兼容；不需要 `AlembicTest`。
- 不能推出的结论：不能证明 `IntentEpisode` 持久化、跨会话 continuity、vector / relation、PrimeInjectionPackage 或 Core shared contract 已完成。

## Stage 2A 执行计划

Stage 2A 目标：只做 `IntentEpisode` storage / continuity 代码事实基线，确认 episode quick read/write 应落在哪个层级、如何绑定 ProjectScope / thread / turn / workspace，以及哪些结构需要进入 Core contract。该阶段不实现持久化、不改产品源码、不派 `AlembicTest`。

1. `AlembicPlugin` facts：调研 plugin runtime dataRoot、Codex thread / turn metadata、task prime lifecycle、已有 local state / JSONL / skill runtime 存储方式，判断 Plugin 是否应拥有 episode quick store 或仅生产 episode input。
2. `Alembic` facts：调研 daemon / resident dataRoot、ProjectRegistry / ProjectScope storage、prime / search consumer、JobStore / local persistence 边界，判断 Alembic 是否应承接 episode persistence 和 query。
3. `AlembicCore` facts：调研 ProjectScope、source refs、SearchTypes、shared contract 和 storage-neutral DTO，判断 `IntentEpisode` 是否已达到下沉 Core 的稳定条件；若未达到，写清继续由 Plugin / Alembic 边界承接。
4. 总控验收：复核三仓库只读回填、repo clean、关键文件和命令摘要后，再创建 Stage 2B 最小实现计划；仍不启动 038 / 039，不做 vector / relation / PrimeInjectionPackage。

## Stage 2A 总控验收结论

- 窗口自述：`Alembic` 和 `AlembicCore` 回填了读取文件、命令摘要、repo clean、边界判断和 Stage 2B 建议；`AlembicPlugin` 回填过短，只说明 Plugin 有当次 `HostIntentFrame` / session memory `IntentState`，没有完整证据链。
- 原始证据：VAD group `g037-stage2a-episode-storage-boundary-2026-05-26` 三个任务均 completed；总控已删除并 record-stop 本条 controller-return automation。总控复核三仓库 `git status --short` 均为空；`Alembic` HEAD `396bd5c`、`AlembicCore` HEAD `10a9274`、`AlembicPlugin` HEAD `3129b53`。代码事实显示：`Alembic` 已有 `ProjectScopeRegistry` / `resolveAlembicWorkspace` / `dataRoot` / `SignalBus` / task prime-close chain / `/api/v1/search` consumer，但 `IntentChainRecord` JSONL 只在 close/fail/abandon 后写入，不是 prime 前后 quick read/write store；`AlembicCore` 有 ProjectScope、sourceRefs、SearchTypes、SessionRepository 等 generic contracts，但没有 `IntentEpisode` / recognized intent / host turn semantics；`AlembicPlugin` 有 `HostIntentFrame`、`RecognizedIntentDraft`、resident handoff 和 MCP session `IntentState`，但不应拥有 durable ProjectScope store。
- 总控裁决：Stage 2A 验收通过。Stage 2B 先由 `Alembic` 在 resident / ProjectScope dataRoot 下实现最小 `IntentEpisode` store/API；`AlembicPlugin` 等 Alembic producer 验收后再接入；`AlembicCore` 暂不下沉 contract。
- 不能推出的结论：不能证明 `IntentEpisode` 已实现，不能证明 Plugin 已接入 episode store，不能证明 vector / relation / PrimeInjectionPackage 可用，不能证明需要 `AlembicTest`。

## Stage 2B 执行计划

Stage 2B 目标：在 `Alembic` 本地增强底座内建立最小 `IntentEpisode` 持久化生产者。该阶段只做 resident / ProjectScope scoped store 与 API，不改 search ranking、vector、relation、PrimeInjectionPackage、Dashboard UI，不派 `AlembicTest`。

推荐阶段顺序：

1. `Alembic` producer：新增 `IntentEpisodeStore` 或等价仓储，落在 `resolveAlembicWorkspace(projectRoot).dataRoot` 下，支持 append-only audit 与 latest/recent quick read；episode key 不暴露 raw thread id、本机绝对路径或 host payload。
2. `Alembic` resident API / task integration：prime 时写入 start/context/searchMeta；close/fail/abandon 更新 outcome；提供最小 read/write HTTP 或 tool boundary，供后续 Plugin resident client 调用。
3. 总控验收：复核 Alembic commit、diff、targeted store / route / task tests、old path fallback 和 privacy guard；验收通过后再创建 Stage 2C Plugin episode handoff。

Stage 2B 已通过总控验收；当前不再派 `Alembic`。

## Stage 2B 总控验收结论

- 窗口自述：`Alembic` 回填 commit `c05b607433d37833a9332a9e81018acc224ff39f`，声明新增 ProjectScope scoped `IntentEpisodeStore`、resident HTTP API、daemon capability、DI service、`alembic_task` prime/create/close/fail/abandon 接入，以及 store / route / task 单元测试。
- 原始证据：总控已删除并 record-stop 本条 controller-return automation；VAD group `g037-stage2b-alembic-episode-store-api-2026-05-26` 为 terminal completed 且有 backfill。总控复核 `Alembic` `git status --short` 为空，`git show --stat --oneline --no-ext-diff HEAD` 显示新增 / 修改 `IntentEpisodeStore.ts`、`intent-episodes.ts`、`HttpServer.ts`、`daemon.ts`、`InfraModule.ts`、`task.ts`、HTTP schemas 和三份 targeted tests；`git diff --check HEAD^ HEAD` 无输出。
- 总控复测：`npm run test:unit -- test/unit/IntentEpisodeStore.test.ts test/unit/IntentEpisodeRoute.test.ts test/unit/IntentEpisodeTask.test.ts test/unit/DaemonCapabilities.test.ts test/unit/HostIntentContext.test.ts` 5 files / 10 tests passed；`npm run lint`、`npm run build:check`、`npm run lint:agent-extraction-boundary`、`npm run lint:core-import-boundary`、`npm run lint:consumer-core-imports` 均通过。
- 代码事实：store 落在 `resolveAlembicWorkspace(projectRoot).dataRoot/.asd/intent-episodes`，写入 `records/<episodeId>.json`、`latest.json`、`index.json` 和 append-only `episodes.jsonl`；`sessionId` / `turnId` 写成 sha256 session key；绝对路径转成 `[absolute-path]/basename`；HTTP API 提供 start、latest、recent、read、update outcome；resident task prime 会 start episode，create attach taskId，close/fail/abandon 更新 outcome。
- 总控裁决：Stage 2B 验收通过。Alembic 已形成最小 durable producer / API，但 037 主线未完成，因为 Plugin 尚未调用该 API。
- 不能推出的结论：不能证明 Plugin 已写入 / 读取 `IntentEpisode`，不能证明 cross-turn refinement、vector / relation、PrimeInjectionPackage、Dashboard UI 或 Core shared contract 已完成，不能证明需要 `AlembicTest`。

## Stage 2C 执行计划

Stage 2C 目标：让 `AlembicPlugin` 在保持旧 prime / search fallback 的前提下，调用 Alembic resident `IntentEpisode` API，写入 recognized draft / host turn / searchMeta，并能读取 latest/recent continuity。该阶段只做 Plugin consumer / handoff，不改 Alembic store、不下沉 Core contract、不做 search ranking / vector / relation / PrimeInjectionPackage。

推荐阶段顺序：

1. `AlembicPlugin` resident client：扩展 `AlembicResidentServiceClient` 或等价 client，支持 `POST /api/v1/intent-episodes`、`GET latest/recent`、`PATCH outcome` 的最小 typed wrapper；旧 daemon 不支持 capability 时必须安全降级。
2. `AlembicPlugin` prime / search integration：prime 时把 Stage 1C `RecognizedIntentDraft` / host turn / searchMeta / sourceRefs 以 redacted payload 写入 episode store；必要时读取 latest/recent 作为 continuity input；不保存 raw thread id 到 tracked docs。
3. 总控验收：复核 Plugin commit、request / response 字段、redaction、fallback、targeted resident client / pipeline / handler tests 和 build check；验收后再判断是否进入后续 knowledge route planning。

Stage 2C 已通过总控验收；当前不再派 `AlembicPlugin`。

## Stage 2C 总控验收结论

- 窗口自述：`AlembicPlugin` 回填 commit `0cf2977b1920a9f6d72983a1d7eb0d44a20c78cf`，声明新增 resident client `/api/v1/intent-episodes` start / latest / recent / outcome 消费；prime 后创建 episode 并返回 `sessionKey` / `episodeId` 摘要；close / fail / abandon 更新 outcome；旧 daemon / route 缺失降级不阻塞；runtime submodule commit `88b109f8451542a24bc83cb9269706b6dd8791b1`，runtime tgz sha256 `1b02ba8b31eb741a0da56b7976ed27261d812abefec47b1734362ff4d850f9ca`。
- 原始证据：总控已删除并 record-stop 本条 controller-return automation；VAD group `g037-stage2c-plugin-episode-handoff-2026-05-26` 为 terminal completed 且有 backfill。总控复核 `AlembicPlugin` `git status --short` 为空，`git show --stat --oneline --no-ext-diff HEAD` 显示修改 `lib/service/resident/AlembicResidentServiceClient.ts`、`lib/external/mcp/handlers/task.ts`、handler types、runtime pointer 和三份 targeted tests。
- 总控复测：`npm run test:unit -- test/unit/AlembicResidentServiceClient.test.ts test/unit/TaskPrimeKnowledgeMaterial.test.ts test/unit/PrimeSearchPipelineResidentSearch.test.ts test/unit/SearchHandlerResidentSearch.test.ts` 4 files / 23 tests passed；`npm run build:check`、`npm run lint`、`npm run lint:core-import-boundary`、`npm run build`、`npm run prepare:codex-plugin-runtime`、`git diff --check HEAD^ HEAD` 和 `git -C plugins/alembic-codex diff --check HEAD^ HEAD` 均通过。
- 代码事实：Plugin resident client 提供 start / latest / recent / update outcome typed wrapper；task prime 先读 latest / recent，再以 redacted recognized draft、host turn facts、sourceRefs 和 searchMeta start 当前 episode；sessionId 使用 hash 化来源，不把 raw thread id 放入 request / visible payload；close / fail / abandon 会 PATCH outcome；旧 daemon 缺 route 时安全 degraded。
- 总控裁决：Stage 2C 验收通过。Plugin 已能作为 consumer 调用 Alembic `IntentEpisode` API 并读取 continuity；037 主线未完成，因为 search / prime 还没有把 recognized intent 与 episode continuity 转成可解释 `IntentSearchPlan` 和 keyword / BM25 selection。
- 不能推出的结论：不能证明 vector / relation、PrimeInjectionPackage、Dashboard UI、Core shared contract 或真实项目 smoke 已完成，不能证明需要 `AlembicTest`。

## Stage 3A 执行计划

Stage 3A 目标：在 `Alembic` 本地增强底座内，把 Stage 1C / 2C 提供的 recognized intent 与 episode continuity 转成最小 `IntentSearchPlan`，先影响 keyword / BM25 查询、过滤和 ranking profile，并保留 `whySelected`、`sourceRefs` 和降级原因。该阶段不做 vector cosine、relation expansion、PrimeInjectionPackage、Dashboard UI 或 Core contract 下沉。

推荐阶段顺序：

1. `Alembic` query plan：在 resident search / prime pipeline 的现有 context 消费点生成最小 `IntentSearchPlan`，字段包含 `intentId` / `episodeId` 可用摘要、lexical queries、filters、negativeSignals、rankingProfile、sourceRefs、degradedReasons。
2. `Alembic` keyword / BM25 消费：让 query plan 影响 keyword / BM25 搜索请求或候选排序；旧 raw query / no intent fallback 必须保持可用，低置信或 needs-confirmation 时不得强行注入。
3. `Alembic` evidence：在 searchMeta / prime material 或等价 trace 中保留 query plan、whySelected、sourcePath / sourceRefs 和 omitted / degraded 摘要，便于 Plugin / 总控复核。
4. 总控验收：复核 Alembic commit、targeted search / prime tests、typecheck / build check、旧路径兼容和“不做 vector / relation / package”的边界。验收后再决定 Stage 3B Plugin response consumption 或 Stage 4 vector / relation。

当前只派 `Alembic`，因为 Stage 3A 的真实阻塞点在 Alembic search / prime 消费侧；`AlembicPlugin` 已完成 producer / handoff，先观察是否需要补 response schema。

### G037-STAGE3A-ALEMBIC-INTENT-SEARCH-PLAN-KEYWORD

窗口：`Alembic`

阶段目标：

- 让 Alembic 把 Plugin 传入的 recognized intent / episode continuity 转成最小可执行检索计划，并先在 keyword / BM25 路径中产生可复核差异。

主线动作：

- 在 resident search / prime pipeline 的现有 intent context 消费点建立 `IntentSearchPlan` 或等价内部结构，记录 lexical queries、filters、negativeSignals、rankingProfile、sourceRefs、degradedReasons 和可用 episode 摘要。
- 让 keyword / BM25 查询或候选排序使用该计划；不同 recognized intent 应能产生不同 query plan，且旧 raw query / no intent fallback 保持可用。
- 在 searchMeta / prime material / trace 中输出 `queryPlan`、`whySelected`、`sourcePath` / `sourceRefs`、omitted / degraded 摘要，便于总控验收。
- 补 targeted tests，证明有 intent、低置信 / degraded、无 intent fallback、sourceRefs 保留和 keyword / BM25 差异均可复核。

合并 TODO：

- `GTODO-2026-05-24-037` Stage 3A IntentSearchPlan + keyword / BM25 baseline。

明确不包含：

- 不做 vector cosine。
- 不做 relation expansion。
- 不创建 `PrimeInjectionPackage`。
- 不下沉 `AlembicCore` contract。
- 不做 Dashboard UI。
- 不派 `AlembicTest`。

下一处真实阻塞点：

- Alembic 搜索侧仍主要按 raw query / scenario 消费，无法解释 recognized intent 如何影响知识召回和候选选择。

阻塞点之前还能做：

- 在 Alembic 自身边界内完成 query plan、keyword / BM25 差异、evidence trace 和 targeted tests；不等待 Plugin / Core。

验证命令：

```text
git status --short
npm run test:unit -- <targeted IntentSearchPlan / search route / prime search tests>
npm run build:check
git diff --check HEAD^ HEAD
```

回填要求：

- 完成范围、提交 hash、修改文件、验证命令和结果。
- 说明 `IntentSearchPlan` 字段、keyword / BM25 影响、`whySelected` / `sourceRefs` 证据、低置信 / degraded 处理、旧路径兼容性和遗留风险。

## Stage 3A 总控验收结论

- 窗口自述：`Alembic` 回填 commit `a47c4c67ea09d47a89a395f5637bfd73cfbe5d5a`，声明新增 `IntentSearchPlan` baseline，在 HTTP `/api/v1/search`、resident MCP search、`alembic_task prime` / `PrimeSearchPipeline` 中消费 recognized intent / episode continuity，先影响 keyword / BM25 / prime lexical query，并在 `searchMeta` / prime data 中暴露 evidence。
- 原始证据：总控已删除并 record-stop 本条 controller-return automation；VAD group `g037-stage3a-intent-search-plan-keyword-2026-05-27` 为 terminal completed 且有 backfill。总控复核 `Alembic` `git status --short` 为空，`git show --stat --oneline --no-ext-diff HEAD` 显示新增 / 修改 `IntentSearchPlan.ts`、`search.ts`、resident search / task handlers、`IntentEpisodeStore.ts`、`PrimeSearchPipeline.ts` 和四份 targeted tests；`git diff --check HEAD^ HEAD` 无输出。
- 总控复测：`npm run test:unit -- test/unit/IntentSearchPlan.test.ts test/unit/SearchRouteTelemetry.test.ts test/unit/PrimeSearchPipelineIntentPlan.test.ts test/unit/HostIntentContext.test.ts test/unit/IntentEpisodeStore.test.ts` 5 files / 14 tests passed；`npm run lint`、`npm run build:check`、`npm run lint:agent-extraction-boundary`、`npm run lint:core-import-boundary`、`npm run lint:consumer-core-imports`、`npm run lint:repo-boundary`、`git diff --check` 和 `git diff --check HEAD^ HEAD` 均通过。
- 代码事实：`IntentSearchPlan` 会在 recognized draft 高置信且 lexical mode 时生成 `executableQuery`、`lexicalQueries`、filters、negativeSignals、rankingProfile、sourceRefs、sourcePath、whySelected、degraded / omitted 和 latest / recent episode 摘要；keyword / BM25 / prime lexical 路径使用 `executableQuery`，semantic mode 只 observe 不改 vector query；低置信、needs-confirmation、degraded 或 host degraded 时回落 raw query；本机绝对路径 sourceRefs 被 redacted。
- 总控裁决：Stage 3A 验收通过。Alembic 已形成 intent -> keyword/BM25/prime lexical 的最小消费证据；037 主线未完成，因为 vector cosine、relation expansion 和统一 `PrimeInjectionPackage` 尚未接入。
- 不能推出的结论：不能证明 Stage 4 vector / relation 已可用，不能证明 Core shared contract 应下沉，不能证明 Plugin response schema 已足够，不能证明 Dashboard UI 或真实项目 smoke 已完成，不能证明需要 `AlembicTest`。

## Stage 4A 执行计划

Stage 4A 目标：只做 vector cosine / relation expansion 代码事实基线，确认 Stage 4B 最小实现应该落在 `Alembic`、`AlembicCore` 或二者组合。该阶段不改源码、不新增 contract、不创建 `PrimeInjectionPackage`，也不派 `AlembicTest`。

推荐阶段顺序：

1. `Alembic` facts：调研 resident `/api/v1/search`、`SearchEngine` 调用、vector stats、`PrimeSearchPipeline`、searchMeta / score metadata、sourceRefs 和 relation / graph 使用点，确认 semantic anchors 与 relation evidence 能否先在 Alembic 局部消费。
2. `AlembicCore` facts：调研 Core SearchTypes、vector search、ranking / score breakdown、source contracts、graph / relation 数据结构和可共享 DTO，判断 Stage 4B 是否需要下沉最小 contract。
3. 总控验收：复核两仓库只读回填、repo clean、关键文件和命令摘要后，再裁决 Stage 4B 最小实现计划；仍不启动 038 / 039，不做 `PrimeInjectionPackage`。

当前派 `Alembic` 与 `AlembicCore` 只读事实基线；`AlembicPlugin` 观察，因为 Stage 3A response 已有 `intentSearchPlan` 元数据，是否需要 Plugin response schema 由 Stage 4A 后续裁决。

### G037-STAGE4A-ALEMBIC-VECTOR-RELATION-FACTS

窗口：`Alembic`

阶段目标：

- 只读确认 Alembic 本地增强底座中 vector cosine、relation evidence、score metadata 和 prime result shape 的真实可接入点。

主线动作：

- 搜索并读取 resident search / task prime / `PrimeSearchPipeline` / vector stats / SearchEngine consumer / relation 或 graph 相关代码。
- 判断 Stage 4B 是否能先在 Alembic 局部构造 semantic anchors、score breakdown 和 relation evidence，还是必须依赖 Core 共享能力。
- 写清不应修改的边界：不改源码、不实现 vector / relation、不创建 `PrimeInjectionPackage`、不派 `AlembicTest`。

验证命令：

```text
git status --short
rg -n "semantic|vector|cosine|scoreBreakdown|relation|graph|sourceRefs|SearchEngine|PrimeSearchPipeline|IntentSearchPlan" lib test package.json
```

回填要求：

- 读取文件、命令摘要、repo clean 状态、Alembic 可接入点、缺口、Stage 4B 最小实现建议、风险和明确不包含事项。

### G037-STAGE4A-CORE-VECTOR-RELATION-FACTS

窗口：`AlembicCore`

阶段目标：

- 只读确认 Core 是否已有 Stage 4 所需的 vector / ranking / relation / source contract，判断是否应下沉最小共享 contract。

主线动作：

- 搜索并读取 SearchTypes、vector / semantic search、ranking / score metadata、source contracts、relation / graph 相关代码。
- 判断 `IntentSearchPlan` 的 semantic anchors、score breakdown 或 relation evidence 是否已经达到 Core contract 稳定条件；若未达到，写清继续留在 Alembic 局部实现的理由。
- 写清不应修改的边界：不改源码、不新增 contract、不实现 vector / relation、不派 `AlembicTest`。

验证命令：

```text
git status --short
rg -n "semantic|vector|cosine|score|scoreBreakdown|relation|graph|sourceRef|SearchTypes|SearchResponse|ranking" src lib test package.json
```

回填要求：

- 读取文件、命令摘要、repo clean 状态、Core 现有 contract / 缺口、下沉判断、Stage 4B 建议、风险和明确不包含事项。

## Stage 4A 总控验收结论

- 窗口自述：`Alembic` 和 `AlembicCore` 均声明只读完成 vector / relation 代码事实基线，未改产品源码、无产品提交，回填 repo clean、读取文件、搜索命令、事实结论、Stage 4B 建议和明确不包含事项。
- 原始证据：本条 controller-return automation 合规审计通过并已删除 / record-stop；VAD group `g037-stage4a-vector-relation-facts-2026-05-27` 为 terminal completed 且两项任务均有 backfill。总控复核 `Alembic` HEAD `a47c4c6`、`AlembicCore` HEAD `10a9274`，两仓库 `git status --short` 均为空；总控负向扫描确认当前无 `semanticAnchors`、`topAnchorMatches`、`scoreBreakdown`、`relationEvidence`、`relationBoost` 或 `anchorMatches` 既有实现。
- 代码事实：`Alembic` 已有 `IntentSearchPlan`、resident / HTTP search、`PrimeSearchPipeline`、SearchEngine 调用、generic vector telemetry、sourceRefs 和 graph / relation handler，但当前只把 semantic route 作为 observe-only，不输出 result-level semantic anchor / score breakdown / relation evidence。`AlembicCore` 已公开 search / vector primitives、`SearchResponseMeta`、`VectorService`、`HybridRetriever`、`MultiSignalRanker`、sourceRefs 与 relation / graph 仓储能力，但没有稳定的 `IntentSearchPlan`、semantic anchor、score breakdown 或 relation evidence contract。
- 总控裁决：Stage 4A 验收通过。Stage 4B 先由 `Alembic` 在本地增强底座内做最小 evidence wiring：使用现有 `IntentSearchPlan`、Core SearchEngine meta / results 和 graph primitives 产出可复核 `semanticAnchors`、`topAnchorMatches`、`scoreBreakdown` 与 `relationEvidence`；`AlembicCore` 暂不下沉 contract，等 evidence shape 被 Plugin / Alembic 双向消费后再裁决。
- 不能推出的结论：不能证明 vector / relation evidence 已实现，不能证明 Core contract 应立即下沉，不能证明 Plugin response schema / PrimeInjectionPackage 已足够，不能证明 Dashboard UI 或真实项目 smoke 已完成，不能证明需要 `AlembicTest`。

## Stage 4B 执行计划

Stage 4B 目标：在 `Alembic` 本地增强底座内，把 Stage 3A `IntentSearchPlan` 和 Stage 4A 确认的 Core search / vector / relation primitives 转成最小可复核 evidence。该阶段只做 Alembic search / prime metadata 和 targeted tests，不改 `AlembicCore` contract、不创建 `PrimeInjectionPackage`、不派 `AlembicTest`。

推荐阶段顺序：

1. `Alembic` semantic anchors：从 recognized intent draft、query plan lexical queries、sourceRefs 和 latest / recent episode 摘要中构造脱敏 `semanticAnchors`；低置信、degraded、semantic unavailable 或 no intent 时回落 observe-only。
2. `Alembic` vector / score evidence：在 HTTP search、resident search 和 prime pipeline 中保留 `topAnchorMatches` 与 `scoreBreakdown`，说明 raw score、mode、semantic/vector used、fallback reason、sourceRefs 和 whySelected；不得伪造 Core 未返回的 per-hit vector cosine。
3. `Alembic` relation evidence：基于现有 graph / relation service 或可用 relation buckets，对 top result ids / sourceRefs 做解释性 `relationEvidence` projection；若 relation source 不足，只输出 omitted / degraded reason，不做 scoring boost。
4. 总控验收：复核 Alembic commit、targeted search / prime tests、lint、build check、sourceRefs redaction、旧路径兼容，以及“不改 Core contract / 不做 package / 不派 Test”的边界。验收后再判断 Plugin response consumption、Core typed evidence contract 或 PrimeInjectionPackage。

当前只派 `Alembic`，因为 Stage 4B 的最小闭环可以在 Alembic 搜索 / prime 消费侧完成；`AlembicCore` 观察 evidence shape 是否稳定，`AlembicPlugin` 观察后续是否需要消费 response schema。

### G037-STAGE4B-ALEMBIC-VECTOR-RELATION-EVIDENCE

窗口：`Alembic`

阶段目标：

- 让 Alembic search / prime 输出最小可复核 vector / relation evidence，使 intent-driven retrieval 不再只停留在 keyword / BM25 plan。

主线动作：

- 在 `IntentSearchPlan` 或相邻 Alembic-local structure 中补 `semanticAnchors` / anchor summary，来源限于 recognized draft、episode continuity、query hints 和 sourceRefs，必须 redacted。
- 在 HTTP `/api/v1/search`、resident search 和 `PrimeSearchPipeline` 的 searchMeta / prime metadata 中输出 `topAnchorMatches`、`scoreBreakdown`、`relationEvidence` 或明确的 omitted / degraded reasons。
- 复用 Core SearchEngine / vector / relation primitives；不得在 Alembic 重写 cosine ranking，不得把 sparse-only 或 generic score 伪装成 vector evidence。
- 补 targeted tests，证明有 intent semantic route、no vector fallback、relation omitted/degraded、sourceRefs redaction、旧 raw query fallback 和 prime metadata 均可复核。

合并 TODO：

- `GTODO-2026-05-24-037` Stage 4B vector / relation evidence 最小实现。

明确不包含：

- 不改 `AlembicCore` contract。
- 不创建 `PrimeInjectionPackage`。
- 不做 Dashboard UI。
- 不派 `AlembicTest`。
- 不启动 038 / 039。

下一处真实阻塞点：

- 当前 Stage 3A only keyword / BM25 baseline 仍缺 semantic / relation evidence shape；没有该 shape，后续 Plugin response / PrimeInjectionPackage 无法判断消费字段。

阻塞点之前还能做：

- Alembic 可以在自身 search / prime metadata 层生成并测试最小 evidence projection；Core 和 Plugin 等 evidence 字段稳定后再进入消费或 contract 下沉。

验证命令：

```text
git status --short
npm run test:unit -- <targeted IntentSearchPlan / SearchRouteTelemetry / PrimeSearchPipeline evidence tests>
npm run lint
npm run build:check
git diff --check HEAD^ HEAD
```

回填要求：

- 完成范围、提交 hash、修改文件、验证命令和结果。
- 说明 `semanticAnchors`、`topAnchorMatches`、`scoreBreakdown`、`relationEvidence` 字段来源、redaction、degraded / omitted 处理、旧路径兼容性、没有伪造 vector cosine 的边界和遗留风险。

## Stage 4B 总控验收结论

- 窗口自述：`Alembic` 回填 commit `8c4d7a715e18a898795b01ce26edd3748df16e66`，声明新增 `IntentEvidence` helper，把 `IntentSearchPlan`、SearchEngine item metadata 和 `knowledgeGraphService` graph edges 归一化为 `semanticAnchors`、`topAnchorMatches`、`scoreBreakdown` 和 `relationEvidence`；接入 HTTP `/api/v1/search`、resident MCP search、`PrimeSearchPipeline`、resident intent state schema 与 episode searchMeta sanitizer。
- 原始证据：本条 controller-return automation 合规审计通过并已删除 / record-stop；VAD group `g037-stage4b-alembic-vector-relation-evidence-2026-05-27` 为 terminal completed 且有 backfill。总控复核 `Alembic` `git status --short` 为空，`git show --stat --oneline --no-ext-diff HEAD` 显示修改 `IntentEvidence.ts`、HTTP / resident search、task state、episode store、prime pipeline 和两份 targeted tests；`git diff --check` 无输出。
- 总控复测：`npm run test:unit -- test/unit/SearchRouteTelemetry.test.ts test/unit/PrimeSearchPipelineIntentPlan.test.ts test/unit/IntentEpisodeStore.test.ts test/unit/IntentEpisodeRoute.test.ts test/unit/IntentSearchPlan.test.ts` 5 files / 12 tests passed；`npm run check`、`npm run build:check` 和 `git diff --check` 均通过。
- 代码事实：`intentEvidence` 是 optional metadata，不改变旧 `intentSearchPlan`、`searchMeta`、items 或 legacy fallback 响应形状；semantic anchors 来自 query plan / lexical queries / sourceRefs / tokens；top matches 和 score breakdown 只使用可见 result metadata，不伪造 Core 未返回的 per-hit vector cosine；relation evidence 读取 graph edge shape，失败或缺失时 degraded / empty evidence；episode sanitizer 会截断并 redacted 绝对路径。
- 总控裁决：Stage 4B 验收通过。Alembic 已成为 vector / relation evidence producer；037 主线未完成，因为 Plugin 还需要把该 optional evidence 安全带回 Codex-facing search / prime / episode handoff。
- 不能推出的结论：不能证明 Plugin 已稳定消费 `intentEvidence`，不能证明 `PrimeInjectionPackage` 已可创建，不能证明 Core typed evidence contract 需要立即下沉，不能证明 Dashboard UI 或真实项目 smoke 已完成，不能证明需要 `AlembicTest`。

## Stage 4C 执行计划

Stage 4C 目标：让 `AlembicPlugin` 消费 Alembic resident search 返回的 optional `intentEvidence`，并把它作为可复核、可降级、可压缩的 evidence metadata 暴露给 Codex-facing `alembic_search`、`alembic_task prime` 和 IntentEpisode handoff。该阶段不生成 evidence、不改 Alembic / Core、不创建 `PrimeInjectionPackage`、不派 `AlembicTest`。

推荐阶段顺序：

1. `AlembicPlugin` resident client / metadata typing：在 `ResidentSearchAttemptMeta` 或相邻结构中识别 `intentEvidence`，保持 unknown-safe passthrough，并补 compact projection / sanitizer，避免 oversized metadata 或私密 sourceRefs 泄漏。
2. `AlembicPlugin` search / prime response：让 `alembic_search` response `searchMeta` 和 `alembic_task prime` `searchMeta` 明确保留 compact `intentEvidence`；若 resident service 不支持或返回 degraded，旧 baseline search / old daemon fallback 继续工作。
3. `AlembicPlugin` episode handoff：写入 `IntentEpisode` 的 `searchMeta` 时保留 compact evidence summary，使 Alembic 后续 continuity 能看到上一轮 evidence，但不把 raw thread id、本机绝对路径或大段 host payload 写入。
4. 总控验收：复核 Plugin commit、targeted resident client / search handler / prime material / episode handoff tests、build check、runtime package / submodule 如有变化，以及“不生成 evidence / 不做 package / 不派 Test”的边界。验收后再裁决是否进入 `PrimeInjectionPackage`。

当前只派 `AlembicPlugin`，因为 evidence producer 已在 Alembic 验收通过；`Alembic` 观察 Plugin 消费反馈，`AlembicCore` 继续观察是否需要窄 contract。

### G037-STAGE4C-PLUGIN-EVIDENCE-CONSUMPTION

窗口：`AlembicPlugin`

阶段目标：

- 让 Plugin 把 Alembic resident `intentEvidence` 作为 first-class optional evidence metadata 消费，而不是只依赖人工在 nested `residentSearch.searchMeta` 中翻找。

主线动作：

- 在 resident service client / meta builder 中识别并 compact `intentEvidence`，保留 `semanticAnchors`、`topAnchorMatches`、`scoreBreakdown`、`relationEvidence`、`degradedReasons` 和 `version` 的安全摘要。
- 在 `alembic_search` response `searchMeta`、`alembic_task prime` searchMeta / knowledge material 和 episode start / update payload 中带上 compact evidence summary；旧 daemon、无 resident evidence、baseline search 和 degraded path 必须保持兼容。
- 补 targeted tests，证明 resident `intentEvidence` 能到达 search response、prime result、episode handoff；同时证明 oversized / absolute sourceRefs 被 redacted / compact，旧 fallback 不新增必填字段。

合并 TODO：

- `GTODO-2026-05-24-037` Stage 4C Plugin evidence consumption。

明确不包含：

- 不在 Plugin 内生成 semantic anchors、score breakdown 或 relation evidence。
- 不改 Alembic / AlembicCore contract。
- 不创建 `PrimeInjectionPackage`。
- 不做 Dashboard UI。
- 不派 `AlembicTest`。
- 不启动 038 / 039。

下一处真实阻塞点：

- Plugin 侧尚未把 `intentEvidence` 作为稳定 response / prime / episode metadata 消费；没有这一步，下一阶段 `PrimeInjectionPackage` 会缺少可证明来源和降级边界。

阻塞点之前还能做：

- Plugin 可以在自己的 Codex-facing boundary 做 optional projection、typing、redaction 和 targeted tests；不等待 Core / Dashboard。

验证命令：

```text
git status --short
npm run test:unit -- test/unit/AlembicResidentServiceClient.test.ts test/unit/SearchHandlerResidentSearch.test.ts test/unit/PrimeSearchPipelineResidentSearch.test.ts test/unit/TaskPrimeKnowledgeMaterial.test.ts
npm run build:check
git diff --check HEAD^ HEAD
```

回填要求：

- 完成范围、提交 hash、修改文件、验证命令和结果。
- 说明 `intentEvidence` 从 resident response 到 search response / prime searchMeta / episode handoff 的字段路径、compact / redaction 规则、旧 daemon fallback、遗留风险和下一步建议。

## Stage 4C 总控验收结论

- 窗口自述：`AlembicPlugin` 回填 commit `2c52eae6a0ff43b9ef7b2098786e88f6a188be23`，声明把 Alembic resident `searchMeta.intentEvidence` compact 为 first-class optional metadata，并投影到 `alembic_search` response、`alembic_task prime` searchMeta / `primeKnowledgeMaterial` 和 `IntentEpisode` handoff；runtime submodule commit `cb00b5e63e3e5e0b45defb150824884ba04bbb5b`，runtime tgz sha256 `7bda2d87ccc21eb1ebbaa1df4581f3abb0e2994371e24817bf3f9882ec3a8a97`。
- 原始证据：VAD group `g037-stage4c-plugin-evidence-consumption-2026-05-27` 已 terminal completed 且有 backfill；总控复核 `AlembicPlugin` `git status --short` 为空，`plugins/alembic-codex` worktree clean，`git show --stat --oneline --no-ext-diff HEAD` 显示修改 resident client、search handler、task handler、PrimeSearchPipeline、handler types、targeted tests 和 runtime pointer。
- 总控复测：`npm run test:unit -- test/unit/AlembicResidentServiceClient.test.ts test/unit/SearchHandlerResidentSearch.test.ts test/unit/PrimeSearchPipelineResidentSearch.test.ts test/unit/TaskPrimeKnowledgeMaterial.test.ts` 4 files / 23 tests passed；`npm run build:check`、`npm run lint`、`npm run lint:core-import-boundary`、`npm run build`、`npm run prepare:codex-plugin-runtime`、`git diff --check HEAD^ HEAD` 和 `git -C plugins/alembic-codex diff --check HEAD^ HEAD` 均通过。
- 代码事实：`ResidentSearchAttemptMeta.intentEvidence` 使用 compact summary，保留 `version`、`degraded` / `degradedReasons`、`semanticAnchors`、`topAnchorMatches`、`scoreBreakdown` 和 `relationEvidence`，并通过 bounded arrays、long-string truncation 和 absolute path redaction 降低泄露 / 膨胀风险；Plugin 没有生成 semantic anchors、vector cosine 或 relation evidence，只消费 Alembic optional evidence。
- 总控裁决：Stage 4C 验收通过。037 主线未完成，因为 prime 仍缺统一 `PrimeInjectionPackage`；下一跳进入 Stage 5A，由 `Alembic` 先生产 package source。
- 不能推出的结论：不能证明 `PrimeInjectionPackage` 已创建，不能证明 Core typed package contract 需要立即下沉，不能证明 Dashboard UI 或真实项目 smoke 已完成，不能证明需要 `AlembicTest`。

## Stage 5A 执行计划

Stage 5A 目标：在 `Alembic` 本地增强底座内，把 Stage 3A / 4B 已有 `IntentSearchPlan`、keyword / BM25 结果、vector / relation evidence 和 source refs 汇总为 `PrimeInjectionPackage` source package。该阶段只做 Alembic resident search / prime metadata 和 targeted tests，不改 `AlembicPlugin`、不下沉 `AlembicCore` contract、不做 Dashboard UI、不派 `AlembicTest`。

推荐阶段顺序：

1. `Alembic` package builder：新增内部 `PrimeInjectionPackage` 或等价 builder，字段至少覆盖 `intent`、`search`、`vector`、`relations`、`selectedKnowledge`、`omitted`、`injection` 和 `trace`，并保持 source path / sourceRefs 可复核。
2. `Alembic` search / prime integration：把 package source 放入 HTTP `/api/v1/search` / resident search / prime metadata 中；旧无 intent / 无 evidence / low confidence / degraded path 必须继续返回旧字段，并在 package 中写清 `degraded` / `needs-confirmation` / `omitted` 原因。
3. `Alembic` evidence guard：不得伪造 Core 未返回的 raw cosine；`selectedKnowledge.scoreBreakdown` 只能来自已有 query plan、SearchEngine item metadata、intentEvidence 和可见 relation metadata；没有 source path 的候选只能降级为 `candidate` 或进入 `omitted`。
4. 总控验收：复核 Alembic commit、targeted prime / search tests、lint、build check、sourceRefs 保留、低置信降级、旧路径兼容和“不改 Plugin / 不派 Test”的边界；验收后再派 Stage 5B Plugin consumption。

当前只派 `Alembic`，因为 package source 的真实阻塞点在 Alembic resident / prime evidence 汇总；`AlembicPlugin` 等待 Stage 5A producer 验收后再消费。

### G037-STAGE5A-ALEMBIC-PRIME-INJECTION-PACKAGE-SOURCE

窗口：`Alembic`

阶段目标：

- 让 Alembic 先生成可被 Plugin 消费的 `PrimeInjectionPackage` source package，统一解释本轮 prime 为什么选择 / 未选择这些知识。

主线动作：

- 汇总 `intent`、`search`、`vector`、`relations`、`selectedKnowledge`、`omitted`、`injection` 和 `trace` 字段；`selectedKnowledge` 必须保留 source path / sourceRefs / evidenceRefs、scoreBreakdown 和 whySelected。
- 处理低置信 / degraded 场景：允许 `injection.status = "needs-confirmation"` 或 `"degraded"`，并写入 omitted / degradedReasons；不得为了“有注入”污染 Codex 上下文。
- 把 package source 放到 Alembic search / prime metadata 可消费的位置，旧 raw query / no intent / old consumer fallback 保持可用。
- 补 targeted tests，证明不同 intent / low confidence / no source path / degraded evidence / old fallback 的 package 字段和 sourceRefs 行为可复核。

合并 TODO：

- `GTODO-2026-05-24-037` Stage 5A PrimeInjectionPackage source package。

明确不包含：

- 不修改 `AlembicPlugin`。
- 不下沉 `AlembicCore` typed contract。
- 不做 Dashboard UI。
- 不派 `AlembicTest`。
- 不启动 038 / 039。

下一处真实阻塞点：

- Alembic 尚未把已验收的 intent/search/vector/relation evidence 汇总成统一 package source；没有该 source，Plugin 无法稳定返回 Codex-facing `PrimeInjectionPackage`。

阻塞点之前还能做：

- Alembic 可以在自身 resident / prime metadata 边界完成 package source、targeted tests 和旧路径兼容；不等待 Plugin / Core。

验证命令：

```text
git status --short
npm run test:unit -- <targeted PrimeInjectionPackage / search / prime tests>
npm run check
npm run build:check
git diff --check HEAD^ HEAD
```

回填要求：

- 完成范围、提交 hash、修改文件、验证命令和结果。
- 说明 package 字段路径、selectedKnowledge / omitted 规则、sourceRefs 保留、低置信 / degraded 状态、旧路径兼容、遗留风险和下一步建议。

## Stage 5A 验收

- 回填输入：VAD group `g037-stage5a-prime-injection-package-source-2026-05-27` terminal completed；`Alembic` 回填 commit `15145a12baf47694f06392a7eeeeee666df8acd3`，完成 `PrimeInjectionPackage` builder，并接入 HTTP search、resident search、`alembic_task prime`、`PrimeSearchPipeline` 与 `IntentEpisodeStore` metadata。
- 原始证据：总控已删除并 `record-stop` 本条 controller-return automation；`Alembic` `git status --short` 为空，`git show --name-only --oneline --no-ext-diff HEAD` 显示新增 / 修改 `PrimeInjectionPackage.ts`、search / task / pipeline / episode store integration 和 targeted tests；`git diff --check HEAD^ HEAD` 无输出。
- 总控复核命令：`npm run test:unit -- test/unit/PrimeSearchPipelineIntentPlan.test.ts test/unit/SearchRouteTelemetry.test.ts test/unit/IntentEpisodeTask.test.ts test/unit/IntentEpisodeStore.test.ts test/unit/IntentEpisodeRoute.test.ts test/unit/IntentSearchPlan.test.ts` 通过 6 files / 13 tests；`npm run check` 通过；`npm run build:check` 通过。
- 总控代码事实：`searchMeta.primeInjectionPackage` 与 task prime `data.primeInjectionPackage` 已包含 `intent`、`search`、`vector`、`relations`、`selectedKnowledge`、`omitted`、`injection`、`trace`；`sourceRefs` 做 redaction，`sourcePath` 只记录符号化来源路径；低置信 recognized intent 返回 `needs-confirmation` 并写入 omitted；缺 sourceRefs 的 selected knowledge 降级为 candidate / omitted。
- 总控裁决：Stage 5A 验收通过。037 主线未完成，因为 `AlembicPlugin` 仍需把 Alembic package source 暴露为 Codex-facing `PrimeInjectionPackage`；下一跳进入 Stage 5B。
- 不能推出的结论：不能证明 Plugin 已暴露 package，不能证明 Core typed package contract 需要立即下沉，不能证明 Dashboard UI 或真实项目 smoke 已完成，不能证明需要 `AlembicTest`。

## Stage 5B 执行计划

Stage 5B 目标：让 `AlembicPlugin` 消费 Alembic Stage 5A 返回的 `PrimeInjectionPackage`，并在 Codex-facing `alembic_search` 与 `alembic_task prime` 输出中稳定暴露。该阶段只做 Plugin consumer / projection / runtime package，不生成 package source、不修改 Alembic / Core、不做 Dashboard UI、不派 `AlembicTest`。

推荐阶段顺序：

1. `AlembicPlugin` resident client / schema：扩展 resident search / task prime 响应类型，保留 optional `primeInjectionPackage`，旧 Alembic 版本无该字段时必须继续 fallback。
2. `AlembicPlugin` Codex-facing projection：在 `alembic_search`、`alembic_task prime` 和必要的 episode handoff metadata 中暴露 package 摘要，保持 redaction，不写 raw thread id、本机绝对路径或 oversized host payload。
3. `AlembicPlugin` runtime / tests：补 targeted resident client、search handler、task prime / prime material 和 episode handoff tests；如 runtime package 需要更新，必须记录 runtime pointer / package commit。
4. 总控验收：复核 Plugin commit、runtime package、targeted tests、build check、redaction、旧路径兼容和“不生成 package / 不派 Test”的边界；验收后再裁决是否需要窄 Core typed package contract或 Stage 6 真实项目验证。

当前只派 `AlembicPlugin`，因为 package source 已由 Alembic producer 验收，下一处真实阻塞点是 Codex-facing consumer 暴露；`Alembic`、`AlembicCore` 和 `AlembicTest` 观察。

### G037-STAGE5B-PLUGIN-PRIME-INJECTION-PACKAGE-EXPOSURE

窗口：`AlembicPlugin`

阶段目标：

- 让 Plugin 把 Alembic 返回的 `PrimeInjectionPackage` 安全、可复核地暴露给 Codex-facing search / prime 消费方。

主线动作：

- 扩展 resident client / handler types，接受 Alembic search / prime metadata 中的 optional `primeInjectionPackage`。
- 在 `alembic_search` / `alembic_task prime` 输出或 prime material 中保留 package 结构或摘要，字段至少覆盖 injection status、selectedKnowledge、omitted、sourceRefs、evidenceRefs 和 trace source summary。
- 保持旧 Alembic 返回无 package 时的兼容 fallback；低置信 / degraded / no sourceRefs path 不得被包装成 ready。
- 补 targeted tests，证明新字段暴露、旧字段兼容、redaction、runtime package 和 episode handoff 不泄露 raw thread id / 本机绝对路径。

合并 TODO：

- `GTODO-2026-05-24-037` Stage 5B Plugin PrimeInjectionPackage Codex-facing exposure。

明确不包含：

- 不生成或重写 Alembic `PrimeInjectionPackage` source。
- 不下沉 `AlembicCore` typed contract。
- 不做 Dashboard UI。
- 不派 `AlembicTest`。
- 不启动 038 / 039。

下一处真实阻塞点：

- Plugin 尚未消费 Stage 5A package source；没有这一步，Codex-facing prime / search 仍无法直接复核统一 package。

阻塞点之前还能做：

- Plugin 可以在自身 MCP / resident client / runtime package 边界完成 optional consumer projection、targeted tests 和旧路径兼容；不等待 Core 或 Test。

验证命令：

```text
git status --short
npm run test -- <targeted resident client / search handler / task prime / episode handoff tests>
npm run build:check
npm run lint
git diff --check HEAD^ HEAD
```

回填要求：

- 完成范围、提交 hash、修改文件、验证命令和结果。
- 说明 package 在 Codex-facing response / prime material / episode handoff 的字段路径、redaction、fallback、runtime pointer、遗留风险和下一步建议。

## Stage 5B 总控验收结论

- 窗口自述：`AlembicPlugin` 回填 commit `6c988dec2a118989ae97be637a4bb15ea0e4001f`，声明已消费 Alembic optional `searchMeta.primeInjectionPackage`，并暴露到 `data.searchMeta.primeInjectionPackage`、`primeKnowledgeMaterial.primeInjectionPackage` 和 IntentEpisode start / outcome `searchMeta.primeInjectionPackage`；runtime subrepo commit `cedd422955e5b24b59794e90a8c0b7b71a940da6`，runtime tgz sha256 `e35816e415adc7f8e96b9229f24c23fc177af328e5f9c56874af2858688f9634`。
- 原始证据：总控已删除并 record-stop 本条 controller-return automation；VAD group `g037-stage5b-plugin-prime-injection-package-exposure-2026-05-27` 为 terminal completed 且有 backfill。总控复核 `AlembicPlugin` `git status --short` 为空，`git show --stat --oneline --no-ext-diff HEAD` 显示修改 resident client、search handler、task handler、prime pipeline、runtime pointer 和 targeted tests；runtime subrepo status 为空，HEAD 为 `cedd422`。
- 总控复测：`npm run test -- test/unit/AlembicResidentServiceClient.test.ts test/unit/SearchHandlerResidentSearch.test.ts test/unit/PrimeSearchPipelineResidentSearch.test.ts test/unit/TaskPrimeKnowledgeMaterial.test.ts` 4 files / 23 tests passed；`npm run build:check`、`npm run lint`、`npm run lint:core-import-boundary`、`npm run build`、`npm run prepare:codex-plugin-runtime`、`git diff --check HEAD^ HEAD` 和 `git -C plugins/alembic-codex diff --check HEAD^ HEAD` 均通过。
- 代码事实：Plugin resident client 对 `PrimeInjectionPackage` 做 compact / redaction，保留 injection status、selectedKnowledge、omitted、sourceRefs、trace、vector / relation evidence 摘要；search handler 暴露 `searchMeta.primeInjectionPackage`；task prime material 和 episode handoff 保留同一 package 摘要；旧 Alembic 无 package 字段时保持 fallback。
- 总控裁决：Stage 5B 验收通过。当前没有证据要求立即下沉 `AlembicCore` typed package contract；下一处真实阻塞点是用最小真实集成 smoke 证明 Plugin runtime / Alembic resident / Plugin response 链路可用。
- 不能推出的结论：不能证明真实运行时集成已经通过，不能证明 Dashboard UI、038 / 039、full cold-start / rescan 或生产质量 beyond-smoke 已完成。

## Stage 6A 执行计划

Stage 6A 目标：由 `AlembicTest` 做最小真实集成 smoke，验证 `AlembicPlugin` runtime 调用 `Alembic` resident 后，`PrimeInjectionPackage` 能进入 Codex-facing search / prime response、prime material 和 episode metadata。该阶段只验证已实现链路，不改产品源码，不跑 full cold-start / rescan，不做 Dashboard UI，不启动 038 / 039。

推荐阶段顺序：

1. `AlembicTest` 先读取本 workspace `AGENTS.md`、当前计划、测试交流和 `AlembicTest/AGENTS.md`，声明当前窗口定位 / 测试职责。
2. 使用真实 test-mode / minimal fixture 连接或模拟最小 Plugin runtime -> Alembic resident 调用边界，确认消费版本为 `Alembic` commit `15145a12baf47694f06392a7eeeeee666df8acd3`、`AlembicPlugin` commit `6c988dec2a118989ae97be637a4bb15ea0e4001f`、Plugin runtime commit `cedd422955e5b24b59794e90a8c0b7b71a940da6`。
3. 断言 package 出现在 `alembic_search` response `searchMeta.primeInjectionPackage`、`alembic_task prime` / `primeKnowledgeMaterial.primeInjectionPackage` 和 episode `searchMeta.primeInjectionPackage` 的最小字段路径；记录 redaction、fallback 和 failure attribution。
4. 回填命令、结果、报告路径、repo clean、成功 / 失败归因和不能推出的结论；若失败，必须明确归属 `Alembic` producer、`AlembicPlugin` consumer / runtime package、`AlembicTest` harness 或环境。

当前只派 `AlembicTest`，因为代码侧 producer / consumer 已通过总控验收，剩余阻塞点是需要真实测试窗口提供跨仓库运行时证据。

### G037-STAGE6A-ALEMBICTEST-PRIME-PACKAGE-SMOKE

窗口：`AlembicTest`

阶段目标：

- 验证 Plugin runtime / Alembic resident / Plugin response 的 `PrimeInjectionPackage` 最小真实闭环。

主线动作：

- 按测试交流单建立最小 smoke，不修改产品源码，不触碰真实测试项目业务行为。
- 证明 package 字段能从 Alembic Stage 5A source 穿过 Plugin Stage 5B projection，到达 Codex-facing search / prime / episode metadata。
- 记录成功路径、失败路径、repo clean、报告路径和下一步建议。

合并 TODO：

- `GTODO-2026-05-24-037` Stage 6A PrimeInjectionPackage real integration smoke。

明确不包含：

- 不跑 full cold-start / rescan。
- 不做 Dashboard UI。
- 不启动 038 / 039。
- 不改 Alembic / AlembicPlugin / AlembicCore 产品源码。
- 不下沉 `AlembicCore` typed contract。

验证命令：

```text
由 AlembicTest 按自身 AGENTS 和测试策略选择最小 test-mode smoke。
必须回填实际执行命令、结果、报告路径、package 字段路径和 repo clean。
```

回填要求：

- 测试结论：通过 / 未通过 / 阻塞。
- 执行范围：是否只做最小真实集成 smoke；是否未跑 full cold-start / rescan；是否未修改产品源码或真实测试项目业务代码。
- 使用版本：Alembic commit、AlembicPlugin commit、Plugin runtime commit / package。
- package 字段路径：search response、prime material、episode metadata。
- 验证命令 / 结果、报告路径、repo clean、失败归因、遗留风险和下一步建议。

执行回填（AlembicTest，2026-05-27 12:46 CST）：

- 测试结论：通过，范围限定为最小 test-mode fixture smoke。真实 Alembic daemon / 默认 Codex.app Node 路径先被本机 `better-sqlite3` native addon 加载环境阻塞；随后使用 Stage 5B embedded Plugin runtime commit `cedd422955e5b24b59794e90a8c0b7b71a940da6` 与 resident-shaped HTTP fixture 完成最小链路验证。
- 执行范围：只做 Plugin runtime -> resident-shaped HTTP service -> Plugin projection 的最小 smoke；未跑 full cold-start / rescan；未做 Dashboard UI；未修改 `Alembic`、`AlembicPlugin`、`AlembicCore`、真实测试项目或 BiliDili 业务源码。
- 版本证据：`Alembic` `15145a12baf47694f06392a7eeeeee666df8acd3`；`AlembicPlugin` `6c988dec2a118989ae97be637a4bb15ea0e4001f`；Plugin runtime `cedd422955e5b24b59794e90a8c0b7b71a940da6`。
- package 字段路径：`mcp.search.data.searchMeta.primeInjectionPackage=true`；`mcp.prime.data.searchMeta.primeInjectionPackage=true`；`mcp.prime.data.primeKnowledgeMaterial.primeInjectionPackage=true`；fixture 捕获 `POST /api/v1/intent-episodes` request `searchMeta.primeInjectionPackage=true`；fixture 捕获 `PATCH /api/v1/intent-episodes/episode-1` request `searchMeta.primeInjectionPackage=true`。
- 验证命令 / 结果：`/Users/gaoxuefeng/.nvm/versions/node/v22.22.1/bin/node AlembicTest/scripts/probe-prime-injection-package-smoke.mjs --daemon-start-blocked --daemon-start-blocked-reason "Codex.app Node blocked by hardened-runtime Team ID mismatch; Node 24 blocked by NODE_MODULE_VERSION mismatch; nvm Node 22.22.1 matches runtime better-sqlite3 and was used for this smoke" --output AlembicTest/tmp/g037-stage6a-prime-package-smoke-2026-05-27.json --timeout-ms 90000`；结果 `ok=true`、`classification=passed`。
- 产物路径：JSON evidence `AlembicTest/tmp/g037-stage6a-prime-package-smoke-2026-05-27.json`；详细报告 `AlembicTest/docs/g037-prime-injection-package-real-smoke-2026-05-27.md`；probe `AlembicTest/scripts/probe-prime-injection-package-smoke.mjs`。
- 失败归因 / first fix：无产品字段链路失败。环境阻塞为 Codex.app Node hardened-runtime Team ID mismatch、Node 24 ABI mismatch；可由 `AlembicTest` harness 固定 Node 22.22.1，或由发布 / 安装链路处理 native addon 签名与 ABI 匹配。
- Repo clean / 提交 hash：本轮未提交，commit hash `无`；测试未修改产品源码或 BiliDili；`AlembicTest` 新增 probe / 报告 / tmp evidence，历史未提交测试资产未回退。
- 遗留风险：最终通过的是 resident-shaped test-mode fixture，不等同于 full real daemon / full cold-start / rescan；默认 Codex.app Node 仍不能直接跑 sqlite-backed runtime。
- 下一步建议：总控复核原始 JSON / 报告后，裁决 Stage 6A fixture smoke 是否足以关闭 037；若必须要求真实 Alembic daemon，则先修复本机 native addon / Node 环境后重跑同一 probe。

## Stage 6A 总控验收结论

- 窗口自述：`AlembicTest` 回填 Test-2026-05-27-13 通过，范围限定为最小 test-mode fixture smoke；`Alembic` commit `15145a12baf47694f06392a7eeeeee666df8acd3`、`AlembicPlugin` commit `6c988dec2a118989ae97be637a4bb15ea0e4001f`、Plugin runtime commit `cedd422955e5b24b59794e90a8c0b7b71a940da6`。
- 原始证据：VAD group `g037-stage6a-prime-package-real-smoke-2026-05-27` 为 terminal completed 且有 backfill；本条 controller-return automation 已通过 `audit-automation`、已删除并 `record-stop`。总控读取 `AlembicTest/docs/g037-prime-injection-package-real-smoke-2026-05-27.md` 与 `AlembicTest/tmp/g037-stage6a-prime-package-smoke-2026-05-27.json`，确认 JSON `ok=true`、`classification=passed`，所有 package path checks 为 true；`Alembic` / `AlembicPlugin` 产品仓库 clean。
- 总控复测：在总控窗口使用 Node 22.22.1 复跑 `AlembicTest/scripts/probe-prime-injection-package-smoke.mjs`，输出 `AlembicTest/tmp/g037-stage6a-prime-package-smoke-2026-05-27-total-control-rerun.json`，结果 `ok=true`、`classification=passed`。沙箱内首次运行因本地 listen 权限失败，提权后完成复跑。
- 字段链路：`mcp.search.data.searchMeta.primeInjectionPackage=true`、`mcp.prime.data.searchMeta.primeInjectionPackage=true`、`mcp.prime.data.primeKnowledgeMaterial.primeInjectionPackage=true`，fixture 捕获 IntentEpisode start / outcome `searchMeta.primeInjectionPackage=true`，且 package 未泄露 raw absolute path。
- 总控裁决：Stage 6A 验收通过。037 在已确认范围内完成：Plugin host intent / episode / search evidence / PrimeInjectionPackage source 与 Plugin exposure 的最小链路，已由代码侧验收和最小 runtime fixture smoke 共同证明闭合。
- 遗留归口：真实 Alembic daemon / 默认 Codex.app Node 的 sqlite native addon 签名与 ABI 问题不阻塞 037，但会影响后续 full daemon smoke / cold-start / release 验证，已登记为 `GTODO-2026-05-27-001`。
- 不能推出的结论：不能证明 full cold-start / rescan、Dashboard UI、038 / 039、生产质量 beyond-smoke 或 `AlembicCore` typed package contract 必须下沉。以上均需另行目标确认和计划。

## Stage 1B 执行计划

Stage 1B 目标：补齐 Plugin -> Alembic resident search 的最小 intent handoff。该阶段只传递 host intent / turn metadata 中已经 redacted / allowlisted 的可选字段，让 Alembic HTTP search route 能把它们映射到现有 SearchEngine context 和 searchMeta；不做搜索算法、vector、relation、PrimeInjectionPackage、IntentEpisode 持久化或 Dashboard UI。

1. `AlembicPlugin` producer：扩展 `AlembicResidentServiceClient.search` / `PrimeSearchPipeline` 的 request shape，把 `HostIntentFrame` 或其最小 context 投到 resident search；旧 query-only 请求必须继续工作；补 unit / integration 证明 request URL / body 不泄露 raw thread id、本机绝对路径或 oversized payload。
2. `Alembic` resident consumer：扩展 `/api/v1/search` query/body contract，接收可选 intent context、sessionHistory、language、sourceRefs，并传给 `SearchEngine.search(..., { context })`；searchMeta 中暴露 `hostIntentApplied` / `degraded` / sourceRefs 摘要；旧 query-only HTTP route 必须保持兼容。
3. 总控验收：复核两个提交、targeted tests、HTTP route / resident client 字段对应关系，以及旧路径 fallback。仍不派 `AlembicTest`。

## Stage 1C 执行计划

Stage 1C 目标：在 `AlembicPlugin` 边界内把 Stage 1A 的 host intent carrier 升级为可解释、可降级、可复核的 Plugin-owned `RecognizedIntentDraft` / `IntentExtractionFrame` 最小版本。该阶段仍不做 episode 持久化、search ranking、vector、relation、PrimeInjectionPackage、Dashboard UI 或 Core contract 下沉。

1. `AlembicPlugin` producer：基于 `HostIntentFrame`、`userQuery`、`activeFile`、`language` 和可用 request metadata，产出 deterministic recognized draft，至少包含 query / action / target / constraints / language / confidence / source / degradedReasons / evidence spans / sourceRefs 摘要。
2. 安全边界：保留 raw thread id、本机绝对路径和 oversized host payload 的 redaction；低置信度时允许 degraded / needs-confirmation，不强行生成高置信 draft。
3. 消费边界：让 prime / search handler 能携带 draft 摘要进入现有 host intent handoff，但不要求 Alembic 在本阶段新增算法或持久化。`Alembic` 观察即可。
4. 总控验收：复核 Plugin 提交、targeted tests、fallback、redaction、draft 字段和 evidence spans；仍不派 `AlembicTest`。

### G037-STAGE1C-PLUGIN-RECOGNIZED-INTENT-DRAFT

窗口：`AlembicPlugin`

阶段目标：

- 让 Plugin 在不等待联网 AI 的前提下，基于 host / user / file facts 形成可解释 recognized intent draft，为 Stage 2 `IntentEpisode` 和后续 knowledge route 消费提供稳定上游。

主线动作：

- 扩展或补齐 `HostIntentFrame` / task prime / search handler 相关逻辑，形成 Plugin-owned recognized draft / extraction frame。
- draft 必须记录字段来源和 evidence spans；confidence / degradedReasons 必须可复核；低置信度不能污染下游上下文。
- 保持 Stage 1A / 1B 的旧输入、旧 query-only fallback 和 resident handoff 兼容。
- 补 targeted tests，证明 host-declared input、fallback input、低置信降级、redaction、evidence spans 和 resident handoff 摘要均可复核。

合并 TODO：

- `GTODO-2026-05-24-037` Stage 1C recognized intent draft 最小生产链路。

明确不包含：

- 不实现 `IntentEpisode` 持久化或跨会话索引。
- 不做 search / vector / relation / PrimeInjectionPackage。
- 不下沉 `AlembicCore` contract。
- 不派 `AlembicTest`。

下一处真实阻塞点：

- Plugin 仍缺稳定 recognized draft，Stage 2 episode 和后续知识消费不能基于只承载不识别的 context 继续推进。

阻塞点之前还能做：

- 在 Plugin 自身边界内完成 deterministic draft、evidence spans、redaction、degraded/confidence 和 targeted tests；不等待 Alembic / Core。

验证命令：

```text
git status --short
npm run test:unit -- test/unit/HostIntentFrame.test.ts test/unit/TaskPrimeKnowledgeMaterial.test.ts test/unit/SearchHandlerResidentSearch.test.ts
npm run build:check
```

回填要求：

- 完成范围、提交 hash、修改文件、验证命令和结果。
- 说明 draft 字段、evidence spans、confidence / degradedReasons、redaction、旧路径兼容性和遗留风险。

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

### G037-STAGE1B-PLUGIN-RESIDENT-INTENT-HANDOFF

窗口：`AlembicPlugin`

阶段目标：

- 让 Plugin resident search request 能携带最小 host intent context 到 Alembic daemon，同时保持旧 query-only 增强路径不变。

主线动作：

- 扩展 `AlembicResidentServiceClient.search` / `PrimeSearchPipeline` request 形状，传递 redacted / allowlisted 的 host intent context、language、sessionHistory、sourceRefs 或等价最小字段。
- 明确 GET query 或 POST body 的选择；若 URL query 无法安全承载结构化 context，应使用最小 body route 或受控编码，不得泄露 raw thread id、本机绝对路径或大 payload。
- 在 `searchMeta.residentSearch` 或等价元数据里保留 resident handoff 是否启用、是否降级和降级原因。
- 旧 query-only 请求必须继续工作；没有 host context 时不得改变现有 resident enhancement 行为。

验证命令：

```text
git status --short
npm test -- test/unit/TaskPrimeKnowledgeMaterial.test.ts <targeted resident client / prime pipeline tests>
npm run build:check
```

回填要求：

- 完成范围、提交 hash、修改文件、验证命令和结果。
- 说明 resident request 字段、redaction 边界、旧路径兼容性、未覆盖的真实 resident runtime 风险。

### G037-STAGE1B-ALEMBIC-RESIDENT-INTENT-CONTEXT

窗口：`Alembic`

阶段目标：

- 让 Alembic HTTP `/api/v1/search` 能接收 Plugin resident handoff 的最小 intent context，并传入现有 SearchEngine context / searchMeta。

主线动作：

- 扩展 `/api/v1/search` contract，接收可选 intent context、language、sessionHistory、sourceRefs、degraded / confidence 或等价最小字段。
- 将可用 context 映射到 `SearchEngine.search(..., { context })`；不改 keyword / BM25 / semantic / vector / relation 算法。
- 在 resident `searchMeta` 中暴露 `hostIntentApplied`、`degraded`、`sourceRefs` 摘要或等价证据，便于 Plugin / 总控复核。
- 旧 query-only GET 路由必须继续通过；无 context 时行为不变。

验证命令：

```text
git status --short
npm run test:unit -- <targeted search route / HostIntentContext tests>
npm run typecheck
```

回填要求：

- 完成范围、提交 hash、修改文件、验证命令和结果。
- 说明 HTTP contract、SearchEngine context mapping、searchMeta 证据、旧路径兼容性和遗留风险。

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

### G037-STAGE2A-PLUGIN-EPISODE-STORAGE-FACTS

窗口：`AlembicPlugin`

阶段目标：

- 确认 Plugin 作为 Codex-facing producer 是否应拥有 `IntentEpisode` quick read/write，或只生产 recognized draft / host turn facts 并交给 Alembic resident 存储。

主线动作：

- 只读调研 `AlembicPlugin` 当前 runtime dataRoot、Codex thread / turn metadata、task prime lifecycle、local state、runtime package 和 submodule 发布链路。
- 找出可复用的本地存储 / JSON / index / skill runtime 模式，以及不能写入 tracked docs 的 thread id / 本机路径 / host payload 边界。
- 判断 Stage 2B 中 Plugin 最小职责：episode producer、quick reader、writer、或仅 caller-side carrier。

明确不包含：

- 不实现 `IntentEpisode`。
- 不改源码、不提交产品变更。
- 不触碰 AlembicTest 或真实测试项目。

下一处真实阻塞点：

- 如果 Plugin 需要 quick read/write，但当前 runtime dataRoot 或 thread metadata 入口不清，Stage 2B 无法安全落地。

验证命令：

```text
git status --short
rg -n "dataRoot|thread|turn|session|HostIntentFrame|recognizedIntentDraft|prime|storage|json|state|episode" lib plugins test package.json
```

回填要求：

- 完成范围、读取文件 / 模块、只读命令摘要、Plugin episode 职责建议、禁止写入数据、Stage 2B 最小实现建议、遗留风险。

### G037-STAGE2A-ALEMBIC-EPISODE-STORAGE-FACTS

窗口：`Alembic`

阶段目标：

- 确认 Alembic resident / ProjectScope storage 是否应承接 `IntentEpisode` persistence、recent episode query 和 prime / search consumption。

主线动作：

- 只读调研 daemon / resident dataRoot、ProjectRegistry / ProjectScope、prime / search consumer、JobStore / local persistence、session history 和 sourceRefs 现有结构。
- 找出现有可复用存储位置、API / MCP / HTTP 边界和旧路径 fallback 要求。
- 判断 Stage 2B 中 Alembic 最小职责：episode store、recent query、search context enhancer、或只消费 Plugin 传入的 episode 摘要。

明确不包含：

- 不实现 episode persistence。
- 不改 search / vector / BM25 / relation / PrimeInjectionPackage。
- 不派 `AlembicTest`。

下一处真实阻塞点：

- 如果 Alembic 应承接 persistence，但 ProjectScope / dataRoot / resident route 边界不清，Stage 2B 会变成无归属状态。

验证命令：

```text
git status --short
rg -n "ProjectScope|ProjectRegistry|dataRoot|JobStore|prime|search|sessionHistory|sourceRefs|intent|episode|storage" src test package.json
```

回填要求：

- 完成范围、读取文件 / 模块、只读命令摘要、Alembic episode 职责建议、ProjectScope / dataRoot 边界、Stage 2B 最小实现建议、遗留风险。

### G037-STAGE2A-CORE-EPISODE-CONTRACT-FACTS

窗口：`AlembicCore`

阶段目标：

- 判断 `IntentEpisode` 是否已达到下沉 Core shared contract 的稳定条件；如果没有，明确 Stage 2B 仍应由 Plugin / Alembic 局部 contract 承接。

主线动作：

- 只读调研 ProjectScope、source refs、SearchTypes、storage-neutral DTO、schema / validation 和已有 shared contracts。
- 判断 episode 字段是否会被 Plugin 与 Alembic 双向稳定消费，或是否仍处于单仓库 / 试验阶段。
- 给出是否下沉 Core 的结论和条件。

明确不包含：

- 不新增 Core contract。
- 不改源码、不提交产品变更。
- 不替 Plugin / Alembic 设计具体 persistence 实现。

下一处真实阻塞点：

- 如果 Core 下沉条件判断不清，Stage 2B 可能过早引入共享 contract 或导致重复局部类型。

验证命令：

```text
git status --short
rg -n "ProjectScope|SourceRef|sourceRefs|SearchType|contract|schema|intent|episode|storage" src tests package.json
```

回填要求：

- 完成范围、读取文件 / 模块、只读命令摘要、Core contract 现状、是否下沉及理由、Stage 2B 最小 contract 建议、遗留风险。

### G037-STAGE2B-ALEMBIC-EPISODE-STORE-API

窗口：`Alembic`

阶段目标：

- 在 Alembic resident / ProjectScope dataRoot 下建立最小 `IntentEpisode` store/API，让一次 prime 的 recognized intent、searchMeta 和后续 close/fail outcome 可以被写入并 quick read。

主线动作：

- 新增 `IntentEpisodeStore` 或等价仓储，路径绑定 `resolveAlembicWorkspace(projectRoot).dataRoot`，不使用 tracked docs，不复用 JobStore。
- 定义最小 episode 记录：episodeId、projectScope / workspace identity、redacted host/session key、prime query、recognized intent summary、searchMeta/sourceRefs、startedAt/updatedAt/outcome/degraded。
- 在 task prime 写入 start/context/searchMeta；close/fail/abandon 更新 outcome；无 host intent 时旧 prime / close 路径保持可用。
- 暴露最小 resident HTTP 或 tool boundary，支持 write/update/read latest/recent；为下一阶段 Plugin resident client 接入预留稳定字段。
- 补 targeted tests：store path / privacy guard / prime write / close update / read latest / old fallback / route contract。

合并 TODO：

- `GTODO-2026-05-24-037` Stage 2B Alembic episode persistence producer。

明确不包含：

- 不实现 Plugin consumer 调用；Plugin 等本任务验收后再派。
- 不新增 AlembicCore shared contract。
- 不做 vector / relation / PrimeInjectionPackage。
- 不派 `AlembicTest`。

下一处真实阻塞点：

- Alembic 还没有 ProjectScope scoped episode store/API，Plugin 即使有 recognized draft 也无法形成跨 prime / close / next turn 的 continuity。

阻塞点之前还能做：

- 在 Alembic 自身边界内完成 store、API、task integration 和 targeted tests；不等待 Plugin。

验证命令：

```text
git status --short
npm run test:unit -- <targeted IntentEpisode store / route / task tests>
npm run typecheck
git diff --check HEAD^ HEAD
```

回填要求：

- 完成范围、提交 hash、修改文件、验证命令和结果。
- 说明 store path、record schema、privacy/redaction、prime / close integration、read API、旧路径兼容性和遗留风险。

### G037-STAGE2C-PLUGIN-EPISODE-HANDOFF

窗口：`AlembicPlugin`

阶段目标：

- 让 Plugin 作为 Codex-facing caller，把 Stage 1C recognized draft / host turn metadata / searchMeta 写入 Alembic `IntentEpisode` store，并在后续 prime/search 前可读取 latest/recent continuity。

主线动作：

- 扩展 `AlembicResidentServiceClient` / prime pipeline / task search handler，对接 Alembic `/api/v1/intent-episodes` start/latest/recent/update outcome。
- prime 时使用 Stage 1C 的 redacted `RecognizedIntentDraft`、host turn facts、sourceRefs 和 searchMeta 创建 episode；旧 Alembic daemon 或 capability 缺失时保持 degraded fallback，不阻断原 prime/search。
- 必须避免 raw thread id、本机绝对路径和 oversized host payload 进入 tracked docs、响应正文或本地持久化；Plugin 只发送给 Alembic API，由 Alembic 返回 sha256 sessionKey / episodeId。
- 补 targeted tests，证明 API request 字段、latest/recent read、capability fallback、redaction、旧路径兼容和 resident handoff 摘要均可复核。

合并 TODO：

- `GTODO-2026-05-24-037` Stage 2C Plugin episode API consumer。

明确不包含：

- 不修改 Alembic store/API；如发现 API 缺口，回填阻塞给总控，不在 Plugin 里绕过。
- 不新增 AlembicCore shared contract。
- 不做 vector / relation / PrimeInjectionPackage。
- 不派 `AlembicTest`。

下一处真实阻塞点：

- Plugin 尚未调用 Alembic `IntentEpisode` API，recognized draft 不能形成跨 prime / close / next turn continuity。

阻塞点之前还能做：

- 在 Plugin 自身边界内完成 resident client、prime/search handoff、fallback 和 targeted tests；不等待 Core / Dashboard。

验证命令：

```text
git status --short
npm run test:unit -- <targeted resident client / prime pipeline / search handler tests>
npm run build:check
git diff --check HEAD^ HEAD
```

回填要求：

- 完成范围、提交 hash、修改文件、验证命令和结果。
- 说明 API request / response 字段、episodeId / sessionKey 处理、latest/recent read、redaction、capability fallback、旧路径兼容性和遗留风险。

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GTODO-2026-05-24-037 | 已完成待归档 | plugin intent knowledge route | P1 | `AlembicPlugin` / `Alembic` / `AlembicCore` / `AlembicTest` / 后续可能 `AlembicDashboard` | Plugin 意图同步，以及意图下面的知识注入与知识检索链路优化增强；Stage 0 至 Stage 6A 均已通过总控验收。 | 否 | Stage 6A `AlembicTest` 最小 fixture smoke 与总控复跑均通过，037 当前完成定义闭合。 | 总控归档 |
| GTODO-2026-05-24-038 | 待排期 / 需独立确认 | knowledge evolution follow-up | P2 | 待定 | 等用户确认后再决定是否提升为 file monitor evolution 主线。 | 否 | 037 已闭合；本轮不自动启动。 | 无 |
| GTODO-2026-05-24-039 | 待排期 / 需独立确认 | knowledge evolution follow-up | P2 | 待定 | 等用户确认后再决定是否提升为 plugin no-monitor evolution 主线。 | 否 | 037 已闭合；本轮不自动启动。 | 无 |
| GTODO-2026-05-27-001 | 待排期 | runtime / test environment | P1 | `AlembicPlugin` / `Alembic` / `AlembicTest` | 修复或固定 sqlite-backed Plugin / Alembic runtime smoke 的 Node/native addon 环境：Codex.app bundled Node 加载 `better_sqlite3.node` 存在 hardened-runtime Team ID mismatch，Node 24 又与 runtime addon ABI 不匹配；后续 full daemon smoke / cold-start / release 验证前需明确 Node 选择、native addon 签名 / rebuild 或 harness 固定策略。 | 是 | 来源 Stage 6A Test-2026-05-27-13；不阻塞 037 最小 fixture smoke 结论，但影响 full daemon / packaged runtime 验证。 | 待定 |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `Alembic` | 无任务 | 否 | 037 中 `Alembic` producer / package source 已验收通过；无当前返修。 |
| `AlembicPlugin` | 无任务 | 否 | 037 中 Plugin consumer / runtime exposure 已验收通过；无当前返修。 |
| `AlembicCore` | 无任务 | 否 | 当前没有证据要求下沉 package typed contract。 |
| `AlembicAgent` | 无任务 | 否 | 037 未确认 Agent runtime 参与点。 |
| `AlembicDashboard` | 无任务 | 否 | 当前不做 UI。 |
| `AlembicTest` | 已完成 | 否 | Test-2026-05-27-13 已通过总控验收；未提交测试资产不作为阻塞。 |
| `BiliDili` | 无任务 | 否 | 不触碰真实测试项目。 |

## 窗口分派

发送给：无

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>无任务 | 037 已完成，无当前返修。 |
| `AlembicPlugin`<br>无任务 | 037 已完成，无当前返修。 |
| `AlembicCore`<br>无任务 | 暂不下沉 package contract；当前没有必须共享 typed contract 的证据。 |
| `AlembicAgent`<br>无任务 | 当前不派发。 |
| `AlembicDashboard`<br>无任务 | 当前不派发。 |
| `AlembicTest`<br>已完成 | `G037-STAGE6A-ALEMBICTEST-PRIME-PACKAGE-SMOKE` 已通过总控验收。 |
| `BiliDili`<br>无任务 | 不触碰真实项目。 |

## 可复制提示词

发送给：无

```text
当前无可复制分派提示词。037 已完成待归档；038 / 039 或其它 TODO 需要用户另行确认后再生成新计划和分派。
```

## 测试交接

- 是否需要 `AlembicTest`：否，Test-2026-05-27-13 已完成并通过总控验收。
- 总控自测结论：Stage 5A Alembic package source 与 Stage 5B AlembicPlugin consumer / projection 均已通过总控代码复核和 targeted tests；总控可以证明两边代码侧闭合，但不能在总控窗口替代真实 Plugin runtime / Alembic resident 集成环境。
- 需要真实场景的理由：Stage 6A 要回答跨仓库 runtime 链路是否真的把 `PrimeInjectionPackage` 带回 Codex-facing response / prime material / episode metadata；该问题属于真实集成环境证据，适合 `AlembicTest`。
- 测试前边界与多条件判断：
  - 测试要回答的问题：真实 Plugin runtime / Alembic resident smoke 是否能让 `PrimeInjectionPackage` 出现在 Codex-facing search response、prime material 和 episode metadata。
  - 测试对象 / 目标窗口 / 线程 / 项目边界：`AlembicTest` 测试环境，`Alembic` commit `15145a12baf47694f06392a7eeeeee666df8acd3`，`AlembicPlugin` commit `6c988dec2a118989ae97be637a4bb15ea0e4001f`，runtime commit `cedd422955e5b24b59794e90a8c0b7b71a940da6`；不修改产品源码，不触碰真实测试项目业务行为。
  - 成功能推出的结论：037 的 PrimeInjectionPackage producer / consumer 最小真实集成链路可用，可进入总控最终收口 / 归档或裁决后续优化。
  - 失败能推出的结论：失败只能按证据归因到 Alembic producer、AlembicPlugin consumer / runtime package、AlembicTest harness 或环境；不能直接扩大为 037 整体设计失败。
  - 不能推出的结论：不能证明 Dashboard UI、038 / 039、full cold-start / rescan 或生产质量 beyond-smoke 已完成；不能证明 Core typed contract 必须下沉。
  - 停止或不开始条件：AlembicTest 真实 thread id / VAD preflight 缺失、任务 id 与旧任务冲突、测试要求被扩大到 full cold-start / rescan / Dashboard UI、或需要修改产品源码才能继续。
- 测试单：`Test-2026-05-27-13 / G037-STAGE6A-PrimeInjectionPackage-Real-Smoke` 已通过总控验收。
- 测试交流入口：[alembic-test-exchange.md](../../../current/alembic-test-exchange.md)
- 真实项目保护说明：不触碰真实测试项目业务代码；如测试 harness 需要写报告 / tmp evidence，写入 `AlembicTest` 允许目录。

## 自动化控制

- VAD mode：已关闭；防睡眠已停止，避免无下一阶段确认时继续循环。
- Dispatch group：`g037-stage6a-prime-package-real-smoke-2026-05-27`。
- Return policy：已完成；controller-return automation 已审计、删除并 record-stop。
- Target windows：无。
- 禁止事项：不得向观察窗口投递；不得把 raw thread id 写入 tracked docs；不得把 Stage 6A 扩大成 full cold-start / rescan / Dashboard UI。

## 回填区

- 2026-05-26 19:19 CST：用户确认 VAD 归档、037 提升为下一主线；总控创建本文作为新的当前入口。VAD 后续问题转入 bug / optimization，不再阻塞 037 主线。
- 2026-05-26 19:25 CST：已将 13 个 VAD current 文档归档到 `docs/workspace/archive/2026-05/visible-automation-dispatch/`；`visible-dispatch` mode 已关闭，防睡眠 inactive。`GTODO-2026-05-24-037` 已切为下一主线，`GTODO-2026-05-25-005` 已降为已完成待归档 / 后续 bug 优化。验证通过：`node scripts/sync-current-plan.mjs --check --json`、`node scripts/check-script-docs.mjs`、`node scripts/verify-workspace-docs.mjs --json`、`git diff --check`、`node scripts/verify-control-center.mjs --with-script-tests`，其中 workspace script tests 70 项通过。
- 2026-05-26 19:37 CST：用户确认 037 Stage 0 范围：只调研不实现，确认 Plugin host intent 输入、Alembic prime / search 消费、Core contract 是否需要下沉，以及 Stage 1 最小代码链路；完成后给用户看 Stage 1 执行计划。当前禁止派 `AlembicTest`、启动 038 / 039、提前做 search / vector / PrimeInjectionPackage；总控准备开启 VAD 自动化投递三窗口只读基线任务。
- 2026-05-26 20:03 CST：VAD group `g037-stage0-code-baseline-2026-05-26` 三窗口均 completed，且目标 automation 均已 record-stop。总控已复核回填和关键代码事实，并对 `Alembic`、`AlembicCore`、`AlembicPlugin` 三个任务写入 accepted verdict。Stage 0 验收通过；当时误判为需要暂停等待用户确认 Stage 1 执行计划草案，后续被 20:20 用户纠偏取代。
- 2026-05-26 20:20 CST：用户纠偏：无人值守自动化应持续推进到最终目标完成，甚至领取新 TODO；不能把阶段计划当默认停点。总控已将 VAD controller / target skill、提示词和当前计划调整为 Stage 1 自动化继续。
- 2026-05-26 22:16 CST：VAD group `g037-stage1-minimal-chain-2026-05-26` 两个任务均 completed，目标 automation 均已 record-stop；总控复核 `AlembicPlugin` commit `e77171a8879595555ee5c0c64a385b37d3d513a6` 与 `Alembic` commit `053ab8b6029f89494b721fea542132c54179b6da`，运行 targeted tests / typecheck / build check 并写入 accepted verdict。补充代码事实发现 Plugin resident search 仍未把 intent context 传到 Alembic HTTP route，因此 Stage 1A 验收通过但 037 未完成，下一跳进入 Stage 1B resident intent handoff。
- 2026-05-26 22:25 CST：Stage 1B VAD group `g037-stage1b-resident-intent-handoff-2026-05-26` 已创建并 arm `Alembic` / `AlembicPlugin` 两个目标 heartbeat；合规 audit 通过。当前等待目标窗口 claim / backfill，最后完成窗口会按 `controller-last` 回跳总控验收。
- 2026-05-26 23:02 CST：Stage 1B VAD group 两个任务均 completed；总控复核 `Alembic` commit `396bd5c637f608556dd5774e5d2b99eb628e9904`、`AlembicPlugin` commit `8ec623a3dca5e9472f9969284ae0d2371bf4739d`，运行 Alembic targeted tests 7/7、AlembicPlugin targeted tests 16/16、两仓库 `npm run build:check` 并写入 accepted verdict。Stage 1B 验收通过；下一跳进入 Stage 1C recognized intent draft。
- 2026-05-26 23:25 CST：Stage 1C VAD group `g037-stage1c-recognized-intent-draft-2026-05-26` 已回跳总控；总控复核 `AlembicPlugin` commit `3129b532c0c5b7d9833041f9e4fd070347d9d631`、runtime submodule commit `2a57136c145179b22d79aab6940dd2d55218710c`、targeted tests 16/16、`npm run build:check`、`git diff --check HEAD^ HEAD` 和 draft 字段扫描后写入 accepted verdict。Stage 1C 验收通过；下一跳进入 Stage 2A IntentEpisode storage boundary 代码事实基线。
- 2026-05-26 23:29 CST：Stage 2A VAD group `g037-stage2a-episode-storage-boundary-2026-05-26` 已 enqueue 并按 20s stagger 创建三条 target heartbeat，已 record-arm：`Alembic`、`AlembicCore`、`AlembicPlugin`。当前等待三窗口 claim / backfill；最后完成窗口按 `controller-last` 回跳总控验收。
- 2026-05-26 23:43 CST：Stage 2A VAD group 已回跳总控；本条 controller-return automation 合规审计通过并已删除 / record-stop。总控接受三条 completed task，其中 `AlembicPlugin` 回填过短但已由总控本地复核补证。Stage 2A 裁决：Alembic resident / ProjectScope dataRoot 先承接 `IntentEpisode` store/API，Plugin 等 Alembic API 验收后接入，Core 暂不下沉。当前已创建并 arm Stage 2B `G037-STAGE2B-ALEMBIC-EPISODE-STORE-API`，`Alembic` 已领取并 record-stop 目标 heartbeat。
- 2026-05-27 00:15 CST：Stage 2B VAD group 已回跳总控；本条 controller-return automation 合规审计通过并已删除 / record-stop。总控复核 `Alembic` commit `c05b607433d37833a9332a9e81018acc224ff39f`、`IntentEpisodeStore` / resident API / task lifecycle integration、targeted tests 10/10、`npm run lint`、`npm run build:check`、三项 boundary lint 和 `git diff --check HEAD^ HEAD` 后写入 accepted verdict。Stage 2B 验收通过；下一跳进入 Stage 2C Plugin IntentEpisode handoff consumer。
- 2026-05-27 01:01 CST：Stage 2C VAD group 已回跳总控；本条 controller-return automation 合规审计通过并已删除 / record-stop。总控复核 `AlembicPlugin` commit `0cf2977b1920a9f6d72983a1d7eb0d44a20c78cf`、runtime commit `88b109f8451542a24bc83cb9269706b6dd8791b1`、IntentEpisode start/latest/recent/outcome client、prime handoff、redacted session handling、targeted tests 23/23、`npm run build:check`、`npm run lint`、`npm run lint:core-import-boundary`、`npm run build`、`npm run prepare:codex-plugin-runtime` 和两项 `git diff --check` 后写入 accepted verdict。Stage 2C 验收通过；下一跳进入 Stage 3A IntentSearchPlan + keyword / BM25 baseline。
- 2026-05-27 01:35 CST：Stage 3A VAD group 已回跳总控；本条 controller-return automation 合规审计通过并已删除 / record-stop。总控复核 `Alembic` commit `a47c4c67ea09d47a89a395f5637bfd73cfbe5d5a`、`IntentSearchPlan` / HTTP search / resident search / prime pipeline integration、targeted tests 14/14、`npm run lint`、`npm run build:check`、四项 boundary lint 和两项 `git diff --check` 后写入 accepted verdict。Stage 3A 验收通过；用户重新开启自动化后，下一跳进入 Stage 4A vector / relation 代码事实基线。
- 2026-05-27 09:56 CST：Stage 4A VAD group 已回跳总控；本条 controller-return automation 合规审计通过并已删除 / record-stop。总控复核 `Alembic` HEAD `a47c4c6`、`AlembicCore` HEAD `10a9274`、两仓库 repo clean、Stage 4A backfill、关键 `rg` 扫描和负向字段扫描后写入 accepted verdict。Stage 4A 验收通过；裁决 Stage 4B 先由 `Alembic` 局部实现 vector / relation evidence shape，`AlembicCore` 暂不下沉 contract。
- 2026-05-27 10:26 CST：Stage 4B VAD group 已回跳总控；本条 controller-return automation 合规审计通过并已删除 / record-stop。总控复核 `Alembic` commit `8c4d7a715e18a898795b01ce26edd3748df16e66`、`IntentEvidence` / HTTP search / resident search / prime pipeline / episode sanitizer integration、targeted tests 12/12、`npm run check`、`npm run build:check` 和 `git diff --check` 后写入 accepted verdict。Stage 4B 验收通过；下一跳进入 Stage 4C Plugin evidence consumption。
- 2026-05-27 10:31 CST：Stage 4C VAD group `g037-stage4c-plugin-evidence-consumption-2026-05-27` 已 enqueue；preflight 通过，已创建并 record-arm `AlembicPlugin` target heartbeat `visible-dispatch-alembicplugin`。当前等待 Plugin claim / backfill，最后完成后按 `controller-last` 回跳总控验收。
- 2026-05-27 10:37 CST：用户说明 Codex 已更新，需要重启；总控确认 Stage 4C 任务已被 `AlembicPlugin` claim、尚无 backfill。当前写入暂停状态并关闭 VAD mode / 防睡眠；重启后先检查 group `g037-stage4c-plugin-evidence-consumption-2026-05-27`，若已有 backfill 则总控验收，若仍 claimed 则等待或由用户重新开启自动化。
- 2026-05-27 11:16 CST：用户重启后要求重新开启自动化；总控复核 Stage 4C group 已 completed 且有 backfill，验收 `AlembicPlugin` commit `2c52eae6a0ff43b9ef7b2098786e88f6a188be23`、runtime commit `cb00b5e63e3e5e0b45defb150824884ba04bbb5b`、targeted tests 23/23、`npm run build:check`、`npm run lint`、`npm run lint:core-import-boundary`、`npm run build`、`npm run prepare:codex-plugin-runtime` 和两项 diff check 后写入 accepted verdict。Stage 4C 验收通过；当前进入 Stage 5A `Alembic` PrimeInjectionPackage source package。
- 2026-05-27 11:21 CST：Stage 5A VAD group `g037-stage5a-prime-injection-package-source-2026-05-27` 已 enqueue；preflight 通过，VAD mode enabled 且防睡眠 active pid `16322`，已创建并 record-arm `Alembic` target heartbeat `visible-dispatch-alembic`。当前等待 Alembic claim / backfill，最后完成后按 `controller-last` 回跳总控验收。
- 2026-05-27 11:22 CST：总控复核 group status，Stage 5A `Alembic` 任务已 claim、尚无 backfill；当前继续等待 Alembic 完成后回跳总控。
- 2026-05-27 11:42 CST：Stage 5A controller-return automation 合规审计通过并已删除 / record-stop；总控复核 `Alembic` commit `15145a12baf47694f06392a7eeeeee666df8acd3`、targeted unit 6 files / 13 tests、`npm run check`、`npm run build:check`、`git diff --check HEAD^ HEAD` 和 clean status 后写入 accepted verdict。Stage 5A 验收通过；当前进入 Stage 5B `AlembicPlugin` PrimeInjectionPackage Codex-facing exposure。
- 2026-05-27 11:49 CST：Stage 5B VAD group `g037-stage5b-plugin-prime-injection-package-exposure-2026-05-27` 已 enqueue；preflight 通过，VAD mode enabled 且防睡眠 active pid `16322`，已创建并 record-arm `AlembicPlugin` target heartbeat `visible-dispatch-alembicplugin`。当前等待 Plugin claim / backfill，最后完成后按 `controller-last` 回跳总控验收。
- 2026-05-27 11:51 CST：总控复核 group status，Stage 5B `AlembicPlugin` 任务已 claim、尚无 backfill；当前继续等待 Plugin 完成后回跳总控。
- 2026-05-27 12:13 CST：Stage 5B controller-return automation 合规审计通过并已删除 / record-stop；总控复核 `AlembicPlugin` commit `6c988dec2a118989ae97be637a4bb15ea0e4001f`、runtime commit `cedd422955e5b24b59794e90a8c0b7b71a940da6`、targeted tests 23/23、`npm run build:check`、`npm run lint`、`npm run lint:core-import-boundary`、`npm run build`、`npm run prepare:codex-plugin-runtime` 和两项 diff check 后写入 accepted verdict。Stage 5B 验收通过；当前进入 Stage 6A `AlembicTest` PrimeInjectionPackage minimal real integration smoke。
- 2026-05-27 12:20 CST：Stage 6A VAD group `g037-stage6a-prime-package-real-smoke-2026-05-27` 已 enqueue；preflight 通过，VAD mode enabled 且防睡眠 active，已创建并 record-arm `AlembicTest` target heartbeat `visible-dispatch-alembictest`。当前等待 AlembicTest claim / backfill，最后完成后按 `controller-last` 回跳总控验收。
- 2026-05-27 12:22 CST：总控复核 group status，Stage 6A `AlembicTest` 任务已 claim、尚无 backfill；当前继续等待 AlembicTest 完成后回跳总控。
- 2026-05-27 12:46 CST：`AlembicTest` 已回填 Stage 6A 最小 test-mode fixture smoke。结果 `ok=true`、`classification=passed`；字段路径覆盖 search response、prime response searchMeta、prime material、IntentEpisode start/outcome metadata。真实 Alembic daemon / 默认 Codex.app Node 路径被 native sqlite 环境阻塞，详细证据见 `AlembicTest/docs/g037-prime-injection-package-real-smoke-2026-05-27.md` 与 `AlembicTest/tmp/g037-stage6a-prime-package-smoke-2026-05-27.json`；当前等待总控验收裁决。
- 2026-05-27 12:48 CST：Stage 6A controller-return automation 合规审计通过并已删除 / record-stop；总控复核 `AlembicTest` JSON / report、`Alembic` / `AlembicPlugin` clean status，并用 Node 22.22.1 复跑 smoke probe，输出 `AlembicTest/tmp/g037-stage6a-prime-package-smoke-2026-05-27-total-control-rerun.json`，结果 `ok=true`、`classification=passed`。Stage 6A 验收通过，037 在当前完成定义内闭合并进入待归档；native addon / Node ABI 问题转 `GTODO-2026-05-27-001`，VAD mode 已关闭且 keep-awake stopped，038 / 039 不自动启动。

<!-- workspace-sync
{
  "status": "已完成待归档（037 Stage 6A 总控验收通过）",
  "indexPlanDescription": "GTODO-2026-05-24-037 / Plugin intent knowledge route：Stage 0 到 Stage 6A 已全部通过总控验收。PrimeInjectionPackage producer / consumer / minimal runtime fixture smoke 闭合，当前等待归档；038 / 039 不自动启动。",
  "indexStatusDescription": "037 Stage 6A 已通过总控验收并进入待归档；native addon / Node ABI 问题已转 GTODO-2026-05-27-001。",
  "currentIndexType": "当前计划",
  "currentIndexDescription": "GTODO-2026-05-24-037 已完成待归档；Stage 6A AlembicTest minimal smoke 与总控复跑均通过。",
  "currentStatusSummary": "037 Stage 6A `AlembicTest` 最小 test-mode fixture smoke 已通过总控验收；Plugin runtime / Alembic resident-shaped fixture / PrimeInjectionPackage response、prime material 和 episode metadata 闭环成立。当前不启动 038/039，不做 Dashboard UI，不跑 full cold-start/rescan；native addon / Node ABI 风险转 GTODO-2026-05-27-001。",
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
