# Small Fix / Cleanup Self-Check Plan

更新日期：2026-05-23
总控窗口：AlembicWorkspace
状态：自检已验收，已转入 [small-fix-cleanup-repair-wave-2026-05-23.md](../../../current/small-fix-cleanup-repair-wave-2026-05-23.md)
发送给：无

## 目标与完成定义

用户目标：沿用老路线做一轮“小问题修复 / 清理修复”。先让各仓库自检并回填真实问题，再由总控制定修复计划；结束条件不是“发起检查”，而是检查出来的问题全部得到处理结论并完成对应修复、取消、观察或升级。

本轮只做第一阶段自检，目标是建立可信问题清单：

- 覆盖 `Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`、`AlembicTest` 的 repo-local 小问题、清理候选和验证风险。
- 每个窗口必须先明确自身仓库职责，再用真实代码、配置、脚本、文档和验证命令作为证据。
- 执行窗口本轮不直接修复代码；发现问题后先回填现象、证据、影响范围、建议修复方式和推荐验证命令。
- 总控收到回填后，将问题归类为修复、取消 / 不做、观察、阻塞或需要用户确认，再组成下一阶段修复任务包。

最终完成定义：

- 六个执行窗口均完成自检回填，或明确回填无问题和未运行命令理由。
- 所有发现项进入本计划的 `TODO / Backlog` 或对应下一阶段修复计划。
- 每个发现项都有处理结论：已修复、进入修复包、取消 / 不做、观察、阻塞或升级用户确认。
- 需要真实项目、冷启动、复现或回归时，只通过 `AlembicTest` 承接，不直接触碰 BiliDili。

非目标：

- 不启动新功能设计，不改变跨仓库职责边界，不重做 Plugin first 路线。
- 不做无边界重构，不移动目录层级，不删除有真实消费方的兼容代码。
- 不把 BiliDili 当成执行窗口或改真实项目源码。
- 不要求执行窗口为了自检去猜测其它仓库 contract；跨仓库问题只回填证据和建议归属。

## 自检范围

所有执行窗口按自身仓库职责检查：

- 仓库 `AGENTS.md` 与实际代码、脚本、目录职责是否冲突。
- `package.json` / 构建脚本 / lint / test / release / dev 命令是否有明显坏链、过期入口或误导命名。
- 源码中是否存在已经没有真实消费方的旧兼容层、旧配置、旧 Dashboard / 旧 Plugin 调用残留、旧外部 AI 能力残留或重复接口。
- 文档、README、脚本说明、模板、测试说明是否指向已删除路径、旧流程或错误仓库职责。
- 轻量验证命令是否能跑；不能跑时要说明原因，避免把环境问题误判为代码问题。

本轮不要求全面修复，也不要求跑昂贵真实项目验证。发现高风险项时只记录，不私自扩大范围。

## TODO / Backlog

| ID | 状态 | 类型 | 归属 / 推荐窗口 | 现象 / 目标 | 依赖 / 触发 |
| --- | --- | --- | --- | --- | --- |
| SFC-TODO-2026-05-23-001 | 已完成 | 自检汇总 | 总控 + 全执行窗口 | 收集六个仓库的小问题、清理候选、lint / check 风险和文档脚本坏链，形成下一阶段修复包。 | 已汇总并转入 `small-fix-cleanup-repair-wave-2026-05-23.md`。 |

后续回填后，总控必须把每个发现项补入本表或新的修复计划，并写清处理结论。

## 空闲窗口调度

| 窗口 | 调度判断 | 是否发送 |
| --- | --- | --- |
| `Alembic` | 已完成本地增强底座小问题 / 清理候选自检回填，并转入 SFC-R1 修复计划。 | 否 |
| `AlembicCore` | 已完成共享 headless 内核小问题 / 清理候选自检回填，并转入 SFC-R1 修复计划。 | 否 |
| `AlembicAgent` | 已完成 Agent runtime / provider / tool system 小问题 / 清理候选自检回填，并转入 SFC-R1 修复计划。 | 否 |
| `AlembicDashboard` | 已完成 Dashboard UI / API client / 前端状态 / 样式 / 可视化 / 前端测试自检回填，并转入 SFC-R1 修复计划。 | 否 |
| `AlembicPlugin` | 已完成 Codex MCP / Skill / channel / runtime artifact 小问题 / 清理候选自检回填，并转入 SFC-R1 修复计划。 | 否 |
| `AlembicTest` | 已完成测试仓库、测试脚本和测试文档自检回填，并转入 SFC-R1 修复计划。 | 否 |
| `BiliDili` | 真实 iOS 项目受保护；本轮不直接进入。 | 否 |

## 阶段任务包

### SFC-P1

窗口：`Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`、`AlembicTest`

阶段目标：完成小问题修复 / 清理修复的第一轮仓库自检，形成可执行问题清单。

主线动作：

- 读取 workspace `AGENTS.md`、本计划和目标仓库 `AGENTS.md`。
- 在回填开头明确当前窗口定位、本轮仓库职责、明确不是什么。
- 检查仓库本地代码、脚本、配置、文档、测试说明和已知清理候选。
- 对发现项记录文件 / 模块、现象、证据、影响范围、建议修复方式、验证命令和风险等级。
- 未发现问题时也要回填检查范围、运行命令和“无问题”结论。

合并 TODO：`SFC-TODO-2026-05-23-001`。

明确不包含：

- 不直接修复代码，不做跨仓库 contract 变更，不改发布流程。
- 不删除兼容层；只记录真实消费方、删除条件和推荐归属。
- `AlembicTest` 不操作 BiliDili 或其它真实测试项目，除非后续总控另建测试单。

下一处真实阻塞点：总控需要收到六个窗口自检回填，才能把问题合并成修复包并判断是否需要用户确认。

阻塞点之前还能做：所有窗口可以并行完成自检，因为本阶段只读分析和轻量验证，不要求依赖其它窗口结果。

验证命令：

- 每个窗口优先运行目标仓库已有的轻量 check / lint / test / build 命令；命令以目标仓库 `AGENTS.md` 和 `package.json` 为准。
- 如果命令会触发昂贵构建、真实项目操作、发布或外部网络，先记录为未运行并说明原因。
- 总控验收本计划时运行 workspace 文档校验和分派校验。

回填要求：

- 回填文档位置：`docs/<Repo>/small-fix-cleanup-self-check-2026-05-23.md`；`AlembicTest` 回填到 `AlembicTest/docs/small-fix-cleanup-self-check-2026-05-23.md`。
- 回填必须包含：完成范围、发现问题清单、证据路径 / 行号或命令输出摘要、建议修复方式、验证命令、未运行命令理由、是否需要总控或用户确认、遗留风险。
- 如执行窗口产生提交，回填提交 hash；如只新增回填文档，也写清文档路径。
- 执行前置硬规则：先读取目标仓库 `AGENTS.md`，并明确当前窗口定位 / 仓库职责。

## 窗口分派

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>已完成 | 已自检本地增强底座、CLI、daemon、HTTP/API、Dashboard server、ProjectRegistry、file monitor、JobStore、internal AI jobs、安装 / dev / release 链路；未直接修复产品源码。报告：`docs/Alembic/small-fix-cleanup-self-check-2026-05-23.md`。 |
| `AlembicCore`<br>已完成 | 已自检共享 headless 内核、public exports、contract、schema、确定性工具、复用边界、release / CI 和 consumer import boundary；未直接修复产品源码。报告：`docs/AlembicCore/small-fix-cleanup-self-check-2026-05-23.md`。 |
| `AlembicAgent`<br>已完成 | 已自检 Agent runtime、AI provider、tool system、策略、上下文、memory、prompt、执行循环和宿主工具编排；未直接修复产品源码。报告：`docs/AlembicAgent/small-fix-cleanup-self-check-2026-05-23.md`。 |
| `AlembicDashboard`<br>已完成 | 已自检前端 UI、API client、状态、路由、样式、可视化、构建脚本和前端测试；不以旧 Plugin 接入作为保留理由。报告：`docs/AlembicDashboard/small-fix-cleanup-self-check-2026-05-23.md`。 |
| `AlembicPlugin`<br>已完成 | 已自检 Codex MCP、Skill、channel / marketplace、插件 runtime、安装验证、Codex host adapter、旧外部 AI / Dashboard 残留、release scripts、provider config 和 real-project fixture 边界。报告：`docs/AlembicPlugin/small-fix-cleanup-self-check-2026-05-23.md`。 |
| `AlembicTest`<br>已完成 | 已自检测试仓库、测试脚本、测试文档、默认配置和回归记录链路；未直接运行或修改 BiliDili。报告：`AlembicTest/docs/small-fix-cleanup-self-check-2026-05-23.md`。 |
| `BiliDili`<br>无任务 | 真实 iOS 项目受保护，本轮不作为执行窗口。 |

## 可复制提示词

发送给：无

```text
先读取 AGENTS.md、docs/workspace/index.md、docs/workspace/current/small-fix-cleanup-self-check-plan-2026-05-23.md，以及你所在窗口/目标仓库的 AGENTS.md；先明确声明当前窗口定位和本轮仓库职责；本轮只做小问题修复 / 清理修复自检，不直接修复。按照当前总控文档领取你所在窗口的自检任务，回填自检范围、发现的问题、证据、影响范围、建议修复方式、验证命令、未运行命令理由、需要升级或用户确认的问题。完成后回填文档路径、提交 hash（如有）、验证结果和遗留风险。
```

不发送给：`Alembic`（自检已验收，已转入 SFC-R1）、`AlembicAgent`（自检已验收，已转入 SFC-R1）、`AlembicCore`（自检已验收，已转入 SFC-R1）、`AlembicDashboard`（自检已验收，已转入 SFC-R1）、`AlembicPlugin`（自检已验收，已转入 SFC-R1）、`AlembicTest`（自检已验收，已转入 SFC-R1）、`BiliDili`。

## 回填区

- 2026-05-23 17:03 CST：按用户确认的老路线启动“小问题修复 / 清理修复”第一轮自检；本轮只收集各仓库真实问题和清理候选，不直接修复。
- 2026-05-23 17:12 CST：`AlembicDashboard` 完成 SFC-P1 自检回填，报告路径 `docs/AlembicDashboard/small-fix-cleanup-self-check-2026-05-23.md`；未提交产品代码。自检范围覆盖 Dashboard 前端 UI、API client、状态、路由、样式、可视化、构建脚本、测试入口、README / docs 入口和旧残留负向扫描。主要发现：缺少独立 `lint` / `test` / `typecheck` 脚本与源码测试入口；独立仓库缺 README / repo-local docs；mock cleanup 成败只写 console、用户不可见；production build 通过但 vendor chunk 超过阈值；多处显式 `any` 属于后续 contract 类型债。已运行 `npm run build`、`git diff --check` 和多组 `rg` 负向扫描通过；未运行 lint / test / preview / live backend，理由是脚本缺失或本轮只做自检不启动环境。遗留风险：发现项仍未修复，需总控纳入下一阶段修复包。
- 2026-05-23 17:13 CST：`Alembic` 完成 SFC-P1 自检回填，报告路径 `docs/Alembic/small-fix-cleanup-self-check-2026-05-23.md`；未提交产品代码。自检范围覆盖本地增强底座、CLI、daemon、HTTP/API、Dashboard server、ProjectRegistry、file monitor、JobStore、internal AI jobs、安装 / dev / release 链路、AGENTS / README / package scripts / boundary lint。主要发现：`AGENTS.md` 仍记录已删除的 `#external/*` alias；`lib/external/mcp/handlers/bootstrap` 为空目录，可在下一轮清理；Agent extraction boundary config 仍保留 `lib/external/ai/**` deletion-candidate 文案和负向 guard，需总控决定是文案收敛还是 lint 语义收敛；`/api/v1/ai/env-config` 注释写“旧 Dashboard”但 vendored Dashboard 仍消费该 endpoint，不能作为删除候选；Biome lint 返回 0 但仍有 227 warnings / 25 infos，建议独立 lint debt backlog。已运行 `npm run build:check`、`npm run check`、`npm run lint:repo-boundary`、`npm run lint:consumer-core-imports`、`npm run lint:agent-extraction-boundary`、`npm run release:package-guard`、`npm run test:unit -- --run test/unit/ResidentServiceBoundary.test.ts test/unit/AgentModuleBoundaries.test.ts`、`git diff --check`，均通过或按 warning 记录。未运行 integration / e2e / release staging / daemon / 真实项目命令，理由是本轮只做自检、不生成发布产物、不启动长驻服务、不触碰真实项目。遗留风险：未做全量运行时 smoke，发现项仍需总控归类后进入修复 / 观察 / 取消。
- 2026-05-23 17:12 CST：`AlembicAgent` 完成 SFC-P1 自检回填，报告路径 `docs/AlembicAgent/small-fix-cleanup-self-check-2026-05-23.md`；未提交产品代码。自检范围覆盖 Agent runtime、AI provider、tool system、context / memory / prompt、执行循环、host adapter 边界、package scripts、public API / import boundary 和相关局部测试。主要发现：`npm run lint` 失败（1 个格式 error、19 个 warnings）；AI provider 缺 key 文案硬编码 Dashboard AI Settings；L4 compaction 仍为临时 opt-in 默认禁用，需总控 / 用户确认正式行为；`package-assets.ts` 存在未见仓库内消费的 deprecated / Dashboard 相关目录常量，删除前需跨仓库消费者扫描。已运行 `npm run build:check`、三条边界 lint 和 5 个相关测试文件，通过；`npm run lint` 按真实输出记录失败；未运行 `npm run check`、release staging / pack preview 和真实项目 / daemon 验证，理由是本轮只自检且 lint 已失败或命令会生成发布 / 集成产物。遗留风险：未做跨仓库消费者扫描，L4 默认行为需要决策，Alembic Codex 本地知识不可用只作为环境风险记录。
- 2026-05-23 17:14 CST：`AlembicCore` 完成 SFC-P1 自检回填，报告路径 `docs/AlembicCore/small-fix-cleanup-self-check-2026-05-23.md`；未提交产品代码。自检范围覆盖 Core `AGENTS.md`、package scripts / exports、public API boundary、CI / release workflow、README / release playbook、Core / consumer import boundary、旧口径 / 兼容注释和轻量验证。主要发现：Core AGENTS 外层接入口径仍偏向 `vendor/AlembicCore`，与当前 `file:../AlembicCore` 本地源码模式不完全一致；`normalizeLifecycle` 已实现但未进入 `@alembic/core/knowledge` facade；`src/shared/concurrency.ts` 注释示例仍写外层 `#shared/*`；`release:check` 只报告 dirty tree 不失败；`npm run check` 有一次非致命 `Could not access 'HEAD'` 测试输出噪声。已运行 `npm run check`、`npm run build`、`npm run smoke:public-api`、`npm run release:check`、public API closeout report、三仓库 consumer import boundary scan 和 `git diff --check`，均通过；未运行 coverage、真实项目、daemon / Dashboard / Codex plugin cache 或发布命令，理由是本轮只做 Core repo-local 自检。遗留风险：下一阶段应先做 Core 文档 / additive export / release check 小修，再派 consumer 替换，不能直接删除 deep export 或 allowlist。
- 2026-05-23 17:46 CST：`AlembicTest` 完成 SFC-P1 自检回填，报告路径 `AlembicTest/docs/small-fix-cleanup-self-check-2026-05-23.md`；未提交。自检范围覆盖测试仓库规则、README、package scripts、docs、默认配置、restart / monitor / prime / resident search probe 脚本、git 状态和 `tmp/` raw evidence。主要发现：历史 GFBD 报告未跟踪且引用旧测试交换入口路径；`tmp/` 残留 8 份历史 raw probe JSON；README 常用命令缺少安全 `check` 入口；历史报告中的 localhost / cache marker 需要阅读提示；restart preclean 继续要求强授权边界。已运行 `npm --prefix AlembicTest run check` 通过；未运行 restart / monitor / probe / BiliDili 命令，理由是本轮只做自检、不运行真实项目链路。遗留风险：AlembicTest 仍有本轮前未跟踪 GFBD 报告和本地 `tmp/` raw JSON，需要总控确认后进入下一阶段修复 / 清理包。
- 2026-05-23 17:13 CST：`AlembicPlugin` 完成 SFC-P1 自检回填，报告路径 `docs/AlembicPlugin/small-fix-cleanup-self-check-2026-05-23.md`；未提交产品源码。自检范围覆盖 Codex MCP、Skill、channel / marketplace、runtime artifact、安装验证、Codex host adapter、旧外部 AI / Dashboard / agent 残留、release scripts、provider config 和 real-project fixture 边界。主要发现：`npm run lint` 当前失败（Biome 报 6 errors / 116 warnings / 29 infos，集中在 `lib/bootstrap.ts` 非空断言和 `lib/cli/SetupService.ts` console 输出）；root generic `release:patch/minor/major` 仍保留旧发布入口语义；`SetupService.stepVectorIndex()` 仍把 embedding provider / API Key 配置说成插件宿主动作；`config/default.json` 仍暴露 `ai.provider=openai` 和外部模型默认值但未发现活 provider 链路；real-project 采集脚本和 tracked fixture 仍留在 Plugin 仓库且包含 `/tmp/test-projects/...` 路径。已运行 `npm run lint`（失败，作为发现项）、`npm run lint:consumer-core-imports`（通过）、`npm run verify:release-package-boundary`（通过）、`npm run verify:codex-plugin`（通过）、`npm run verify:codex-channel`（通过）、`npm run report:agent-extraction-boundary`（通过）、`npm run build:check`（通过）、`git diff --check`（通过）和旧 agent / AI / bridge 负向扫描（仅命中边界扫描脚本文本）。未运行全量 test、daemon live smoke、插件安装、真实项目采集或发布命令，理由是本轮只做自检、不直接修复和不触碰真实项目 / 本机插件状态。遗留风险：`config/default.json` 删除 / 置空策略和 real-project 资产归属需要总控确认后进入下一阶段修复包。
- 2026-05-23 17:23 CST：总控验收六份自检报告，确认 SFC-P1 自检阶段完成；所有发现项已进入 `small-fix-cleanup-repair-wave-2026-05-23.md`，按待修复、观察、待确认和待授权分类。
