# Plugin Prime Trust Receipt Workspace Plan

日期：2026-06-02
状态：Codex host reload 后 prime 复验通过 / 需求可归档
发送给：无
总控定位：本文件是 AlembicWorkspace 对 `PLUGIN-PRIME-TRUST-RECEIPT-2026-06-02` 的独立总控计划；只承载目标裁决、窗口分派、TODO 归口和验收证据，不承载产品实现。

## 目标判断

- 用户目标：总控正式接收 Design handoff，并开启无人值守自动化推进 Plugin prime trust receipt 需求。
- 最终完成定义：`alembic_task(operation=prime)` 要求 Codex 做 developer-visible receipt 时，receipt contract 必须让 Codex 明确表达信任哪些 prime 材料、遵守哪些规则 / guardrail、使用哪些 Recipe / pattern / context，以及哪些只是 context / candidate / degraded / requires verification；不能让“收到 / 接收到了”式空 receipt 通过。
- 当前是否已经达到：已达到。source-level contract、packaged runtime、submodule pointer、Plugin cache / packaged MCP transport 证据已通过；用户重启 Codex 后，总控当前 host tool 调用 `alembic_task prime` 返回 `success=true` / `status=delivered`，并包含 `trustPosture`、`receiptChecklist` 和五层 trust checklist。
- 当前证据：Design 原始计划和需求设计均为 `ready-for-workspace`，用户确认状态为 confirmed；`PTSR-PLUGIN-STAGE0-INVENTORY-P0` 已回填并通过总控复核；`PTSR-PLUGIN-STAGE1-CONTRACT-P1` 已回填并由总控复跑 focused tests / build / lint / diff check 通过；`PTSR-PLUGIN-STAGE1-BATCH-COMMIT-P2` 已回填 3 个 AlembicPlugin source commits 并由总控复跑 focused tests / build / lint / diff check 通过；`PTSR-PLUGIN-STAGE1-RUNTIME-REFRESH-P3` 已回填并由总控复核 source/runtime/package 证据通过；`PTSR-PLUGIN-STAGE1-CODEX-RUNTIME-P4` 已回填并由总控复核 commits / reports / cache marker / runtime hash / clean status 通过；Codex host reload 后用户可见 prime 复验通过。
- 当前主线关系：独立 P1 Plugin prime UX contract 线路；不接管 MRI/Aux，不改 ProjectScope P7 等待回填状态。
- 最小闭环：由 `AlembicPlugin` 在现有 prime contract 中实现结构化 trust posture / receipt checklist 或等效字段，更新 visible receipt instruction / host response / prime message，并用 focused tests 证明 delivered / empty / degraded / candidate / host intent / evidenceRefs 分层。
- 第一阻塞点：无。当前 host tool 已恢复，复验通过。
- 当前可安全执行的下一步：不创建下一跳；如用户要求收口，可按总控归档流程归档本计划。

## Design / 需求来源

- Design Key：`PLUGIN-PRIME-TRUST-RECEIPT-2026-06-02`
- 原始计划：[plugin-prime-trust-receipt-original-plan-2026-06-02.md](../../../../../AlembicDesign/docs/current/plugin-prime-trust-receipt-original-plan-2026-06-02.md)
- 需求设计：[plugin-prime-trust-receipt-requirement-design-2026-06-02.md](../../../../../AlembicDesign/docs/current/plugin-prime-trust-receipt-requirement-design-2026-06-02.md)
- 用户确认状态：`confirmed`
- 总控接收结论：正式作为独立 Plugin prime visible receipt contract 需求接收。
- 外部调研判断：不需要。当前需求核心是本地 AlembicPlugin MCP prime response contract 和用户明确行为约束，本地代码事实足以推进 Stage 0。

## 已确认设计边界

- 采用结构化信任分层：`trusted-to-obey`、`trusted-to-use`、`context-only`、`requires-verification`、`not-available-or-degraded`；实现可命名为 `trustPosture`、`receiptChecklist` 或等效字段。
- candidate knowledge 和 host intent hint 必须在可见 receipt 中被说清为上下文 / 线索，不能默默混入可信知识。
- 第一版验收以 Plugin focused tests 和 Codex MCP server tests 为主；真实 Codex Agent smoke 只在总控判断可见行为证据不足时追加。
- 本需求独立推进，不并入 `PLUGIN-ARCHITECTURE-INTERFACE-REFACTOR`、`MULTI-REPOSITORY-INTERFACE-OPTIMIZATION` 或 ProjectScope 线路。
- 不固定模板话术；强制语义 checklist，而不是固定自然语言句式。

## 阶段顺序

1. Stage 0：`AlembicPlugin` 只读代码事实 inventory。确认 `task.ts`、`PrimeKnowledgeMaterial`、`PrimeHostResponseInstruction`、resident `primeInjectionPackage` summary、focused tests 和 docs / skill 指引的真实承载点。
2. Stage 1：Plugin contract 更新。按 Stage 0 证据引入结构化 trust posture / receipt checklist 或等效 contract，并更新 `shoutInstruction`、`hostResponse.reason`、prime message。
3. Stage 2：focused tests 和文档。覆盖 delivered / empty / degraded、first-person、anti-empty-slogan、evidenceRefs boundary、candidate/context-only 和 host intent hint。
4. Stage 3：真实 Codex Agent smoke 可选补证。仅当总控验收认为 unit / MCP server tests 不足以证明用户可见行为时启动 `AlembicTest`。

## 任务包

| 任务包 ID | 窗口 | 摘要 | 状态 |
| --- | --- | --- | --- |
| PTSR-PLUGIN-STAGE0-INVENTORY-P0 | `AlembicPlugin` | 只读 inventory：确认 prime receipt contract 真实入口、字段命名候选、测试缺口和实现波次边界 | 已完成 / 总控复核通过 |
| PTSR-PLUGIN-STAGE1-CONTRACT-P1 | `AlembicPlugin` | 实现 Plugin prime trust posture / receipt checklist，并补 focused tests | 功能证据通过 / 未提交收口阻塞 |
| PTSR-PLUGIN-STAGE1-BATCH-COMMIT-P2 | `AlembicPlugin` | 按真实 diff 分批提交 mixed dirty worktree，复跑验证并回填 commit hash | source commits 已验收 / runtime refresh 阻塞 |
| PTSR-PLUGIN-STAGE1-RUNTIME-REFRESH-P3 | `AlembicPlugin` | 刷新 packaged runtime / submodule，使实际 Codex 插件运行面包含 PTSR trust posture | 已完成 / 总控复核通过 |
| PTSR-PLUGIN-STAGE1-CODEX-RUNTIME-P4 | `AlembicPlugin` | 处理当前 Codex 插件运行态 / cache / transport，确认 prime trust receipt 是否能在 Codex host 中实际工作 | 已完成 / 总控复核通过 / host reload 复验通过 |

### PTSR-PLUGIN-STAGE0-INVENTORY-P0：Plugin prime trust receipt inventory

窗口：`AlembicPlugin`

阶段目标：

- 只读复核 Plugin prime contract 当前真实代码入口。
- 判断结构化 trust posture / receipt checklist 应落在哪个已有 contract / presenter / handler，不新增空壳实现。
- 判断是否需要 Alembic resident 补字段；如现有 `primeInjectionPackage` summary 足够，只记录消费方式。
- 输出 Stage 1+ 可执行实现包建议和验证命令。

主线动作：

- 读取本 workspace `AGENTS.md`、本计划、`AlembicPlugin/AGENTS.md`。
- 读取并梳理：
  - `AlembicPlugin/lib/codex/mcp/handlers/task.ts`
  - `AlembicPlugin/lib/service/task/PrimeSearchPipeline.ts`
  - `AlembicPlugin/lib/service/resident/AlembicResidentServiceClient.ts`
  - `AlembicPlugin/test/unit/TaskPrimeKnowledgeMaterial.test.ts`
  - `AlembicPlugin/test/unit/CodexMcpServer.test.ts`
  - 如需要，仅只读观察 `Alembic/lib/service/task/PrimeInjectionPackage.ts`
- 明确 delivered / empty / degraded / candidate / host intent / evidenceRefs 在 visible receipt 中的信任分层映射。
- 明确 Stage 1 是否只需 AlembicPlugin，还是需要 Alembic 观察字段补证。

明确不包含：

- 不修改产品代码。
- 不提交代码。
- 不启动 AlembicTest。
- 不把 receipt 变成代码验证、Guard 验收或总控验收。
- 不固定自然语言模板。
- 不创建 sourceRef / candidate / Recipe 生产期 gate。

验证 / 回填要求：

- 回填代码事实 inventory，列出真实文件入口和现有测试保护。
- 回填建议的 Stage 1 实现边界、字段命名候选和测试命令。
- 回填是否需要 Alembic resident 补字段；若需要，必须说明具体缺字段和证据。
- 回填是否建议真实 Codex Agent smoke；若建议，必须说明 unit / MCP tests 不能回答的唯一问题。
- 返回 `TargetResultEnvelope`，证据至少包含可复核文件路径、`rg` / 代码读取摘要、现有测试入口和风险；本轮提交 hash 应为 `无`。

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、本计划和 `AlembicPlugin/AGENTS.md`。
- 开始执行前先声明当前窗口定位、目标仓库职责、本轮任务职责，以及本仓库明确不承担的职责。
- 只允许在 `AlembicPlugin` 职责和 Stage 0 只读边界内执行；如果发现需要改变目标、仓库边界或启动测试窗口，停止并回填待总控裁决。

总控复核证据：

- result envelope：`.workspace-local/codex-automation-loop/target-results/AlembicPlugin__PTSR-PLUGIN-STAGE0-INVENTORY-P0.json`
- review pack：`PTSR-STAGE0-PLUGIN-INVENTORY-20260602` 为 `ready`，controller return `sent/readback-ok`。
- 代码事实：`AlembicPlugin/lib/codex/mcp/handlers/task.ts` 现有 `PrimeKnowledgeMaterial` 包含 `status`、`acceptedKnowledge`、`acceptedGuards`、`shoutInstruction`、`hostResponse`、`intentEvidence`、`primeInjectionPackage`，但没有 `trustPosture` / `receiptChecklist`；`_buildPrimeShoutInstruction` 只要求 accepted Recipe / Guard constraints 和 evidenceRefs 后续核验，没有结构化信任分层。
- resident facts：`PrimeSearchPipeline` 和 `AlembicResidentServiceClient` 会把 `primeInjectionPackage` summary 传入 Plugin prime material；compact summary 保留 `injection.status`、`selectedKnowledge[].injectionStatus`、evidence/sourceRefs/trace。
- Alembic 观察：`Alembic/lib/service/task/PrimeInjectionPackage.ts` 已有 `ready | candidate | needs-confirmation | degraded | empty` 和 `selected | candidate` 状态，第一版不需要改 Alembic。
- 测试事实：`TaskPrimeKnowledgeMaterial.test.ts` / `CodexMcpServer.test.ts` 已覆盖 timing、first-person、empty/degraded、evidenceRefs 不默认倾倒和 resident summary，但未覆盖 trust layers / anti-empty-slogan。
- 风险：`AlembicPlugin` 工作树存在与 resident search `projectRoot` propagation 相关的未提交 dirty 变更；Stage 0 inventory 基于当前工作树，不代表 clean HEAD。该风险不阻塞 Stage 1，但 Stage 1 执行窗口必须保护已有 dirty 变更。
- 验收结论：Stage 0 通过；下一波只派 `AlembicPlugin` 实现，不启动 Alembic 或 AlembicTest。

### PTSR-PLUGIN-STAGE1-CONTRACT-P1：Plugin trust posture implementation

窗口：`AlembicPlugin`

阶段目标：

- 在 Plugin prime material 中加入结构化 `trustPosture` / `receiptChecklist` 或等效字段。
- 更新 `shoutInstruction`、`hostResponse.reason` 和 prime tool message，让可见 receipt 必须表达信任 / 遵守 / 使用 / 上下文 / 待验证 / 降级边界。
- 用 focused tests 防止“收到 / 接收到了”式空 receipt 继续通过。

主线动作：

- 在 `AlembicPlugin/lib/codex/mcp/handlers/task.ts` 内实现，不新增空 presenter / adapter；如抽函数，必须有真实调用方和 tests。
- 映射：
  - `acceptedGuards` -> `trusted-to-obey`
  - selected Recipe / pattern / ready package knowledge -> `trusted-to-use`
  - host intent、queries、intent evidence summary -> `context-only`
  - evidenceRefs / sourceRefs / candidate / needs-confirmation -> `requires-verification`
  - empty / degraded -> `not-available-or-degraded`
- 保留现有 timing、first-person speaker、no evidenceRefs path dump、no `codex_host_response` tool 等保护。
- 仅当实现需要，更新 Plugin skill / docs 中的 prime receipt guidance；不要固定自然语言模板。

明确不包含：

- 不改 Alembic resident package，除非实现窗口证明现有 summary 无法表达必需状态。
- 不启动真实 Codex Agent smoke。
- 不创建 sourceRef / candidate / Recipe 生产期 gate。
- 不覆盖或回退当前未提交 resident search scoping 变更。

验证命令：

```text
npm run test:unit -- test/unit/TaskPrimeKnowledgeMaterial.test.ts test/unit/CodexMcpServer.test.ts test/unit/PrimeSearchPipelineResidentSearch.test.ts test/unit/AlembicResidentServiceClient.test.ts
npm run build:check
npm run lint -- --diagnostic-level=error
git diff --check
```

如仓库脚本名不同，先读取 `package.json` 后选择等价 focused test / build / lint，并在回填说明替代原因。

回填要求：

- 完成范围。
- 提交 hash；如本轮因已有 dirty 变更无法提交，必须明确说明阻塞和未提交 diff。
- 关键 diff 摘要。
- trust posture / receipt checklist 字段名和分层映射。
- visible receipt instruction / hostResponse / message 如何覆盖 delivered / empty / degraded / candidate / host intent / evidenceRefs。
- 测试命令和结果。
- 是否仍建议真实 Codex Agent smoke；若建议，说明 focused tests 不能回答的唯一问题。

### PTSR-PLUGIN-STAGE1-BATCH-COMMIT-P2：batch commit closeout

窗口：`AlembicPlugin`

用户裁决：

- AlembicPlugin 可以分批次提交当前 mixed dirty worktree；不需要继续卡在“必须一个 clean commit”。

阶段目标：

- 在不回退、不覆盖现有 dirty 变更的前提下，按真实 diff 的逻辑边界分批提交。
- 至少把 PTSR Stage 1 trust receipt contract 变更提交成可复核 commit；ProjectScope / resident scoping、Plugin tool 描述或 `plugins/alembic-codex` 子仓库 dirty 若属于其它已确认主线，可作为单独 batch 提交或明确保留未提交原因。
- 复跑验证并返回 `TargetResultEnvelope`，让总控可以验收是否具备归档条件。

主线动作：

- 读取本 workspace `AGENTS.md`、本计划、`AlembicPlugin/AGENTS.md`。
- 先运行 `git status --short`、`git diff --name-status`、必要的 `git diff -- <file>`，按真实职责分类 dirty 文件。
- 建议分批口径：
  - PTSR trust receipt contract：`lib/codex/mcp/handlers/task.ts`、`test/unit/TaskPrimeKnowledgeMaterial.test.ts`、`test/unit/CodexMcpServer.test.ts` 中直接服务 trust posture / visible receipt contract 的变更。
  - ProjectScope / resident search scoping：`lib/service/task/PrimeSearchPipeline.ts`、`lib/service/resident/AlembicResidentServiceClient.ts`、相关 resident tests。
  - Plugin prime trigger / skill 描述：`lib/codex/mcp/tools.ts` 或 `plugins/alembic-codex` dirty，如确认为已实现用户确认的 prime-before-user-input / skill 描述变更，可单独提交；如无法确认，保留并回填待裁决。
- 使用非交互 git 命令分批 stage / commit；不要使用 destructive checkout/reset，不要回退未提交变更。
- 每个 commit message 要能说明所属主线和边界。

明确不包含：

- 不重新设计 trust posture contract。
- 不创建 sourceRef / candidate / Recipe 生产期 gate。
- 不启动 AlembicTest。
- 不改 Alembic / Core / Agent / Dashboard / Test 仓库。
- 不为了凑 clean 而提交无法归类或未确认的变更；无法归类时保留并回填。

验证命令：

```text
npm run test:unit -- test/unit/TaskPrimeKnowledgeMaterial.test.ts test/unit/CodexMcpServer.test.ts test/unit/PrimeSearchPipelineResidentSearch.test.ts test/unit/AlembicResidentServiceClient.test.ts
npm run build:check
npm run lint -- --diagnostic-level=error
git diff --check
git status --short
```

回填要求：

- 每个 batch 的 commit hash、commit message、包含文件和主线归属。
- 若仍有 dirty 文件，列出文件、为什么未提交、需要谁裁决。
- 验证命令和结果。
- 是否已经满足 PTSR 归档条件；如不满足，第一阻塞点是什么。

### PTSR-PLUGIN-STAGE1-RUNTIME-REFRESH-P3：packaged runtime refresh

窗口：`AlembicPlugin`

阶段目标：

- 将已提交的 PTSR trust receipt source contract 同步进实际 Codex 插件 packaged runtime / `plugins/alembic-codex` 子仓库。
- 清理当前子仓库 mixed dirty：重新生成 runtime dist、skills、`runtime.tgz` 和必要 vendor artifacts，使 bundle 与父仓库 commits 一致。
- 提交 `plugins/alembic-codex` 子仓库 commit，并在父仓库提交 submodule pointer 更新；如发布脚本要求额外 marker / cache 记录，也按 AlembicPlugin 既有流程执行并回填。

主线动作：

- 读取本 workspace `AGENTS.md`、本计划、`AlembicPlugin/AGENTS.md`。
- 先确认父仓库 HEAD 包含：
  - `3852f15 Add prime trust receipt posture`
  - `3a80266 Scope resident prime search by project root`
  - `3581c0c Clarify Alembic prime trigger guidance`
- 使用 AlembicPlugin 既有 release / packaged runtime 生成流程；不要手工拼 runtime bundle。
- 生成后检查：
  - `plugins/alembic-codex/runtime/dist/lib/codex/mcp/handlers/task.js` 包含 `trustPosture` / `receiptChecklist` / `trusted-to-obey`。
  - `plugins/alembic-codex/runtime/dist/lib/codex/mcp/tools.js` 包含最新 prime-before-user-input guidance。
  - `plugins/alembic-codex/skills/alembic/SKILL.md` 与 runtime skill 副本包含知识库存在时每个用户输入前 prime、空库不主动 prime 的口径。
- 复跑 source focused tests / build / lint，并补跑 AlembicPlugin 既有 packaged plugin verify / release verify 命令；如命令名称不确定，先读 `package.json`，不要发明脚本。

明确不包含：

- 不重新设计 PTSR source contract。
- 不创建 sourceRef / candidate / Recipe 生产期 gate。
- 不启动 AlembicTest，除非 runtime refresh 后总控判断仍需要真实 Codex smoke。
- 不改 Alembic / Core / Agent / Dashboard / Test 仓库源码；只允许通过既有 packaging 流程更新 vendored/generated runtime artifacts。

验证命令：

```text
npm run test:unit -- test/unit/TaskPrimeKnowledgeMaterial.test.ts test/unit/CodexMcpServer.test.ts test/unit/PrimeSearchPipelineResidentSearch.test.ts test/unit/AlembicResidentServiceClient.test.ts
npm run build:check
npm run lint -- --diagnostic-level=error
git diff --check
rg -n "trustPosture|receiptChecklist|trusted-to-obey" plugins/alembic-codex/runtime/dist/lib/codex/mcp/handlers/task.js
```

同时回填实际执行的 packaged plugin verify / release verify 命令和结果。

回填要求：

- 子仓库 commit hash、父仓库 submodule pointer commit hash。
- runtime/dist 与 skill 关键证据路径。
- `runtime.tgz` 是否更新及 hash / size 摘要。
- 验证命令和结果。
- 父仓库和子仓库最终 `git status --short`。
- 是否建议追加真实 Codex Agent smoke；若建议，说明 source/runtime tests 不能回答的唯一问题。

总控复核证据：

- result envelope：`.workspace-local/codex-automation-loop/target-results/AlembicPlugin__PTSR-PLUGIN-STAGE1-RUNTIME-REFRESH-P3.json`
- review pack：`PTSR-STAGE1-RUNTIME-REFRESH-20260602` 为 `ready`，controller return `sent/readback-ok`。
- 父仓库 commit：`5b67386cf4e862fb757e3eae774fd75df9d5bc7c Update Codex plugin runtime snapshot`，`git ls-tree HEAD plugins/alembic-codex` 指向 `27758982aa7e2f344ab98cb006446d610d174c86`。
- 子仓库 commit：`27758982aa7e2f344ab98cb006446d610d174c86 Refresh runtime for prime trust receipt`。
- runtime evidence：`plugins/alembic-codex/runtime/dist/lib/codex/mcp/handlers/task.js` 包含 `trustPosture` / `receiptChecklist` / `trusted-to-obey`；packaged tool / skill 说明包含 project-level/local knowledge base 时每次用户输入前 prime、empty project 不主动 prime。
- tarball evidence：`plugins/alembic-codex/runtime.tgz` sha256 `197523f4e657051e4185eca127feb7251be771b96e93140f5ff20d5d9cef4f56`，size `22421034` bytes。
- 总控复跑：focused unit `4 files / 61 tests`、`npm run build:check`、`npm run lint -- --diagnostic-level=error`、父 / 子 `git diff --check`、`npm run verify:codex-channel`、`npm run verify:codex-plugin`、`npm run smoke:codex-plugin` 均通过；父仓库和子仓库 `git status --short` 均为空。
- 未归档原因：当前 Codex 插件 host 运行态仍未由 Plugin 判定。总控线程里的 `alembic_task prime` 返回 `Transport closed`；刷新本机 cache 到 P3 后，`npm run dev:codex-plugin:refresh -- --packaged --skip-build --skip-prepare --project-root /Users/gaoxuefeng/Documents/AlembicWorkspace --report-path scratch/ptsr-p3-cache-refresh-report.json` 在 packaged probe 阶段返回 MCP `Connection closed`；随后 `ALEMBIC_CODEX_NPM_CACHE=/private/tmp/alembic-codex-ptsr-p3-npm-cache npm run dev:codex-plugin:probe-installed -- --project-root /Users/gaoxuefeng/Documents/AlembicWorkspace --report-path scratch/ptsr-p3-probe-installed-temp-npm-cache-report.json` 通过。该事实只作为 Plugin 诊断输入，不作为总控修复结论。

### PTSR-PLUGIN-STAGE1-CODEX-RUNTIME-P4：Codex plugin runtime/cache/transport

窗口：`AlembicPlugin`

用户裁决：

- Codex 插件运行态 / cache / transport 问题交给 `AlembicPlugin` 处理；总控不继续自行拆插件细节，避免做错误决定。

阶段目标：

- 基于 P3 已验收 source/runtime/package 证据，确认当前 Codex host 中 `alembic_task(operation=prime)` 是否能使用 PTSR trust receipt contract。
- 若不能，定位并修复 AlembicPlugin 职责内的 cache refresh、packaged wrapper、npm cache、Codex plugin install/refresh、MCP transport 或 host-facing 配置问题。
- 若需要用户重启 Codex、清理特定 cache、或执行非代码操作，必须说明精确原因、命令 / 操作、可验证结果和为什么不是代码缺陷。

主线动作：

- 读取本 workspace `AGENTS.md`、本计划、`AlembicPlugin/AGENTS.md`。
- 先复核 P3 commits 和总控提供的 cache evidence；不要把总控的临时判断当成 root cause。
- 使用 AlembicPlugin 既有脚本、MCP probe、packaged/runtime smoke、Codex plugin refresh 方式自行建立证据链。
- 修复只允许在 AlembicPlugin / `plugins/alembic-codex` 职责内进行；不得创建 sourceRef / candidate / Recipe 生产期 gate。

验证 / 回填要求：

- 回填 root cause、修复范围、提交 hash 或无代码修改理由。
- 回填当前 Codex plugin cache marker、runtime hash、MCP probe / packaged probe / live prime 证据。
- 如果仍需总控或用户执行重启 / 刷新，给出唯一可复核动作和预期结果。
- 返回 `TargetResultEnvelope`；证据必须包含命令输出摘要、报告路径、runtime JSON / log / cache marker 或可复核文件证据。

总控复核证据：

- result envelope：`.workspace-local/codex-automation-loop/target-results/AlembicPlugin__PTSR-PLUGIN-STAGE1-CODEX-RUNTIME-P4.json`
- review pack：`PTSR-STAGE1-CODEX-RUNTIME-P4-20260602` 为 `ready`，controller return `sent/readback-ok`。
- 父仓库 commit：`1b186b0f120b1adf8224067631f2efda13b5fe2c Fix Codex plugin runtime cache startup`，只更新 diagnostics 与 `plugins/alembic-codex` pointer。
- 子仓库 commit：`4491fd5db8fe1deaf8cf64b02ff602e78249c86a Isolate Codex runtime wrapper npm cache`，更新 wrapper、runtime.tgz、runtime dist diagnostics 和 README。
- cache report：`AlembicPlugin/scratch/ptsr-p4-cache-refresh-final-report.json` 为 `ok=true`，`mode=packaged-runtime`，cache marker `gitHead=1b186b0f120b1adf8224067631f2efda13b5fe2c`，`runtimeTarball=70f81f07c04b206bf2657473a87a5da3d345d0b77dea1c3bc2b0b705a00386f2`，`wrapper=d270e7f04d586ecaab3f694878938cf06bba2af3f0fd4c046ccc2772e7c07443`。
- installed packaged MCP prime report：`AlembicPlugin/scratch/ptsr-p4-final-live-prime-packaged-mcp-report.json` 为 `ok=true`，stderr tail 包含 `Alembic Codex MCP ready — 25 tools`；prime result 含 `trustPosture`、`receiptChecklist` 和五层 `trusted-to-obey / trusted-to-use / context-only / requires-verification / not-available-or-degraded`；`hostResponse` 和 message 均包含 trust posture receipt 指令。
- tarball evidence：仓库与本机 cache 的 `runtime.tgz` sha256 均为 `70f81f07c04b206bf2657473a87a5da3d345d0b77dea1c3bc2b0b705a00386f2`，size 均为 `22421621` bytes。
- 总控复核：父仓库和子仓库 `git status --short` 均为空，父仓库和子仓库 `git diff --check` 均通过；cache runtime handler 包含 `trustPosture` / `receiptChecklist` / `trusted-to-obey`。
- host reload 复验证据：用户重启 Codex 后，总控调用 `mcp__alembic.alembic_task prime` 成功，返回 `success=true`、`status=delivered`，可见 message 包含 `Trust posture checklist: trusted-to-obey=2, trusted-to-use=4, context-only=2, requires-verification=1, not-available-or-degraded=0`，并要求 receipt 不能是 generic received-knowledge slogan。`primeKnowledgeMaterial` 中包含 `trustPosture`、`receiptChecklist`、`hostResponse` 和 `shoutInstruction`。

## 窗口覆盖

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>观察中 | 仅当 Plugin Stage 0 证明 resident `PrimeInjectionPackage` summary 缺字段时再裁决；当前不投递。 |
| `AlembicCore`<br>无任务 | 当前未证明需要 shared Core contract。 |
| `AlembicAgent`<br>无任务 | 当前语境是 Codex host agent，不改 AlembicAgent runtime。 |
| `AlembicDashboard`<br>无任务 | 不涉及 Dashboard UI。 |
| `AlembicPlugin`<br>已完成 | `PTSR-PLUGIN-STAGE1-CODEX-RUNTIME-P4`：Plugin 代码 / package / cache 证据通过，Codex host reload 后 prime 复验通过。 |
| `AlembicTest`<br>观察中 | 第一版不默认启动；仅当总控裁决真实 Codex visible smoke 必要时创建测试单。 |
| `BiliDili`<br>无任务 | 真实项目受保护，不参与本需求。 |

## 自动化投递

- dispatch group：`PTSR-STAGE0-PLUGIN-INVENTORY-20260602` / `PTSR-STAGE1-PLUGIN-CONTRACT-20260602` / `PTSR-STAGE1-BATCH-COMMIT-20260602` / `PTSR-STAGE1-RUNTIME-REFRESH-20260602` / `PTSR-STAGE1-CODEX-RUNTIME-P4-20260602`
- controllerWindow：`AlembicWorkspace`
- returnPolicy：`group-ready`
- target：`AlembicPlugin`
- target task：`PTSR-PLUGIN-STAGE1-RUNTIME-REFRESH-P3`
- skill：`codex-control-workspace/skills/dev/codex-automation-target/SKILL.md`
- keep-live：用户明确开启自动化，投递前启动共享 keep-live watcher；keep-live 只作为无人值守 runtime 支持，不作为验收证据。
- delivery envelope：`.workspace-local/codex-automation-loop/delivery-envelopes/delivery-PTSR-STAGE0-PLUGIN-INVENTORY-20260602__AlembicPlugin__PTSR-PLUGIN-STAGE0-INVENTORY-P0.json`
- delivery run：`.workspace-local/codex-automation-loop/delivery-runs/run-delivery-PTSR-STAGE0-PLUGIN-INVENTORY-20260602__AlembicPlugin__PTSR-PLUGIN-STAGE0-INVENTORY-P0.json`
- readback：`sent` / `readback.ok=true`，目标线程新 turn `inProgress`。
- Stage 1 delivery envelope：`.workspace-local/codex-automation-loop/delivery-envelopes/delivery-PTSR-STAGE1-PLUGIN-CONTRACT-20260602__AlembicPlugin__PTSR-PLUGIN-STAGE1-CONTRACT-P1.json`
- Stage 1 delivery run：`.workspace-local/codex-automation-loop/delivery-runs/run-delivery-PTSR-STAGE1-PLUGIN-CONTRACT-20260602__AlembicPlugin__PTSR-PLUGIN-STAGE1-CONTRACT-P1.json`
- Stage 1 readback：`sent` / `readback.ok=true`，目标线程新 turn `inProgress`。
- keep-live：Stage 0 run lease 已释放；Stage 1 验收后已通过 `stop-loop --automation-run-id PTSR-STAGE1-PLUGIN-CONTRACT-20260602` 释放本 run 租约，当前无 active leases，watcher `status=stopped`；不再为本轮创建下一跳。
- Stage 1 P2：用户裁决允许分批提交后，重新开启 automation run `PTSR-STAGE1-BATCH-COMMIT-20260602`；投递目标为 `AlembicPlugin`。
- Stage 1 P2 delivery envelope：`.workspace-local/codex-automation-loop/delivery-envelopes/delivery-PTSR-STAGE1-BATCH-COMMIT-20260602__AlembicPlugin__PTSR-PLUGIN-STAGE1-BATCH-COMMIT-P2.json`
- Stage 1 P2 delivery run：`.workspace-local/codex-automation-loop/delivery-runs/run-delivery-PTSR-STAGE1-BATCH-COMMIT-20260602__AlembicPlugin__PTSR-PLUGIN-STAGE1-BATCH-COMMIT-P2.json`
- Stage 1 P2 readback：`sent` / `readback.ok=true`，目标线程新 turn `inProgress`。
- Stage 1 P3：P2 source commits 已验收，但 runtime/submodule 未同步；`PTSR-STAGE1-RUNTIME-REFRESH-20260602` 已 direct-thread sent/readback-ok。
- Stage 1 P3 delivery envelope：`.workspace-local/codex-automation-loop/delivery-envelopes/delivery-PTSR-STAGE1-RUNTIME-REFRESH-20260602__AlembicPlugin__PTSR-PLUGIN-STAGE1-RUNTIME-REFRESH-P3.json`
- Stage 1 P3 delivery run：`.workspace-local/codex-automation-loop/delivery-runs/run-delivery-PTSR-STAGE1-RUNTIME-REFRESH-20260602__AlembicPlugin__PTSR-PLUGIN-STAGE1-RUNTIME-REFRESH-P3.json`
- Stage 1 P3 readback：`sent` / `readback.ok=true`，目标线程新 turn `inProgress`。
- keep-live：P2 lease 已通过 `stop-loop --automation-run-id PTSR-STAGE1-BATCH-COMMIT-20260602` 释放；watcher 由 P3 lease 保持，activeRunCount `1`，status `running`。
- Stage 1 P4：用户裁决 Codex 插件运行态 / cache / transport 问题交给 AlembicPlugin；`PTSR-STAGE1-CODEX-RUNTIME-P4-20260602` 已 direct-thread sent/readback-ok，现已回填并通过总控证据复核。用户重启 Codex 后，总控当前 host tool prime 复验通过；不继续派发。

## 回填区

- 2026-06-02：总控接收 Design handoff `PLUGIN-PRIME-TRUST-RECEIPT-2026-06-02`。Design import 校验通过，用户确认状态 confirmed；本计划建立独立 Stage 0，只读投递 AlembicPlugin，不与 MRI / ProjectScope / Plugin architecture refactor 合并。
- 2026-06-02：总控已启动共享 keep-live watcher，生成 `PTSR-STAGE0-PLUGIN-INVENTORY-20260602` dispatch / delivery envelope，并通过 Desktop direct-thread send 投递给 `AlembicPlugin`；delivery run 已记录 `sent` 且 readback-ok。当前等待 `AlembicPlugin` 以 result envelope / controller return 回跳。
- 2026-06-02：总控验收 `PTSR-PLUGIN-STAGE0-INVENTORY-P0` 通过。原始代码复核确认 Stage 1 只需 AlembicPlugin；不需要 Alembic resident 补字段，不默认启动 AlembicTest。下一步投递 `PTSR-PLUGIN-STAGE1-CONTRACT-P1`。
- 2026-06-02：总控生成 `PTSR-STAGE1-PLUGIN-CONTRACT-20260602` dispatch / delivery envelope，并通过 Desktop direct-thread send 投递给 `AlembicPlugin`；delivery run 已记录 `sent` 且 readback-ok。Stage 0 keep-live lease 已释放，Stage 1 lease 继续运行。
- 2026-06-02：总控验收 `PTSR-PLUGIN-STAGE1-CONTRACT-P1` 回填。review pack 为 `ready`，controller return `sent/readback-ok`；总控复核 `AlembicPlugin/lib/codex/mcp/handlers/task.ts` 已新增 `trustPosture` / `receiptChecklist` 分层，覆盖 `trusted-to-obey`、`trusted-to-use`、`context-only`、`requires-verification`、`not-available-or-degraded`，并更新 `shoutInstruction`、`hostResponse.reason` 和 prime message，未创建 sourceRef / candidate / Recipe 生产期 gate。总控复跑 `npm run test:unit -- test/unit/TaskPrimeKnowledgeMaterial.test.ts test/unit/CodexMcpServer.test.ts test/unit/PrimeSearchPipelineResidentSearch.test.ts test/unit/AlembicResidentServiceClient.test.ts` 通过，4 files / 61 tests；`npm run build:check` 通过，Core build used `../AlembicCore @ 3d14455bbe79c69b67d72ef7382e4a9fedf2555d`；`npm run lint -- --diagnostic-level=error` 通过，Checked 191 files；`git diff --check` 无输出。收口阻塞：AlembicPlugin 工作树仍有 `lib/service/task/PrimeSearchPipeline.ts`、`lib/service/resident/AlembicResidentServiceClient.ts`、相关 tests、`lib/codex/mcp/tools.ts` 和 `plugins/alembic-codex` dirty，不全属于本 Stage 1；本轮提交 hash 为 `none-existing-dirty-worktree`，不能归档或继续下一跳，等待提交边界裁决。
- 2026-06-02：总控执行 `node scripts/codex-automation-loop.mjs stop-loop --automation-run-id PTSR-STAGE1-PLUGIN-CONTRACT-20260602 --reason "stage1-reviewed-code-evidence-pass-clean-commit-blocked-by-mixed-dirty-worktree" --write --json` 成功；keep-live lease 已释放，activeRunCount `0`，watcher `status=stopped`。本计划不创建下一批 dispatch。
- 2026-06-02：用户裁决 AlembicPlugin 可以分批次提交，继续自动化推进。总控将上一轮提交边界阻塞改为 P2 收口任务 `PTSR-PLUGIN-STAGE1-BATCH-COMMIT-P2`，要求 AlembicPlugin 按真实 diff 分类、分批 commit、复跑验证并回填 commit hash；仍禁止 sourceRef / candidate / Recipe 生产期 gate，禁止为了 clean 强行提交无法归类变更。
- 2026-06-02：总控启动 `PTSR-STAGE1-BATCH-COMMIT-20260602` keep-live，watcher `status=running`、activeRunCount `1`；随后生成 dispatch packet / delivery envelope，并通过 Desktop direct-thread send 投递给 `AlembicPlugin`。delivery run 已记录 `sent` 且 readback-ok，目标线程新 turn `inProgress`；当前等待 AlembicPlugin result envelope / controller return。
- 2026-06-02：总控验收 `PTSR-PLUGIN-STAGE1-BATCH-COMMIT-P2` 回填。AlembicPlugin 父仓库 commits 存在且边界清楚：`3852f15 Add prime trust receipt posture`、`3a80266 Scope resident prime search by project root`、`3581c0c Clarify Alembic prime trigger guidance`。总控复跑 focused unit 4 files / 61 tests、`npm run build:check`、`npm run lint -- --diagnostic-level=error`、`git diff --check` 均通过；父仓库 `git status --short` 仅剩 `plugins/alembic-codex` 子仓库 dirty。总控原始证据复核发现子仓库 `runtime/dist/lib/codex/mcp/handlers/task.js` 只有 `projectRoot` 变更，缺少 PTSR `trustPosture` / `receiptChecklist`，因此 source-level 已验收但不能归档为实际 plugin runtime 完成。下一步派发 P3 runtime/submodule refresh。
- 2026-06-02：总控启动 / 复用 keep-live for `PTSR-STAGE1-RUNTIME-REFRESH-20260602`，生成 dispatch packet / delivery envelope，并通过 Desktop direct-thread send 投递给 `AlembicPlugin`；delivery run 已记录 `sent` 且 readback-ok，目标线程新 turn `inProgress`。随后释放 `PTSR-STAGE1-BATCH-COMMIT-20260602` lease，keep-live 仍由 P3 lease 保持，activeRunCount `1`、watcher `status=running`。当前等待 P3 result envelope / controller return。
- 2026-06-02：总控验收 `PTSR-PLUGIN-STAGE1-CODEX-RUNTIME-P4` 回填。AlembicPlugin 父仓库 commit `1b186b0f120b1adf8224067631f2efda13b5fe2c` 与子仓库 commit `4491fd5db8fe1deaf8cf64b02ff602e78249c86a` 已复核；cache marker、runtime hash、installed packaged MCP prime report、父 / 子 clean status 均通过。结论：Plugin 代码 / package / cache / packaged MCP transport 证据通过；当时总控会话仍需 Codex host reload / tool reload 后复验 `alembic_task prime`，不创建下一跳。
- 2026-06-02：用户重启 Codex 后，总控执行 host tool prime 复验通过。`mcp__alembic.alembic_task prime` 返回 `success=true`、`primeKnowledgeMaterial.status=delivered`，并包含 `trustPosture`、`receiptChecklist`、`hostResponse`、`shoutInstruction` 与五层 trust checklist；`Transport closed` 阻塞解除。本需求可归档，不创建下一跳。
