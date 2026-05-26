# Progressive Chain Validation Metrics Wave 0

日期：2026-05-25
状态：Wave 3D 总控验收通过，Wave 4 待裁决
发送给：无
总控定位：本文件是 `GTODO-2026-05-25-003 / Progressive Chain Validation Metrics` 的当前分派入口；Wave 0 PCV source metrics contract 已验收，Wave 2 `AlembicTest` 证明 PCV source / N9 scorecard fixture 可用；`Alembic` workflow path 残留已通过总控验收并经 AlembicTest 最小重测确认关闭。用户已确认 Wave 3A 只做 N9 producer observability linkage baseline：先打通 N9 的真实 artifact / trace / metrics / source-ref 证据链，不做 Agent prompt 优化、不做 Dashboard UI、不跑 full cold-start；`Alembic` 与 `AlembicAgent` 均已通过总控代码侧验收。Wave 3B `AlembicTest` 最小验证已由总控验收为“有效未通过”；Wave 3C `Alembic` nested evidence consumer extraction 已通过总控验收；Wave 3D `AlembicTest` 重跑同一 probe 已通过并经总控验收，nested `pcvNodeEvidence` 已进入 N9 linked baseline；下一步等待总控裁决 Wave 4 范围。

## 目标判断

- 用户目标：将 PCV 从 `Alembic` / `AlembicPlugin` 内部 submodule checkout 中单独拉出为 workspace 顶层真实仓库，并继续推进 Progressive Chain Validation Metrics。
- 最终完成定义：PCV canonical source 在顶层 `progressive-chain-validation/` 中维护；`Alembic` 与 `AlembicPlugin` 不再各自保留内部 PCV skill 源内容；PCV source 提供节点级 baseline、scorecard、comparison、verdict 和 N9 analyze quality baseline；后续测试和 Agent 优化都消费同一份 source。
- 当前是否已经达到：当前 Wave 3 目标已达到；Wave 0 PCV source、Wave 1 consumer cleanup、Wave 2 `AlembicTest` consumer cleanup probe、Wave 3A 代码侧、Wave 3C `Alembic` 返修和 Wave 3D `AlembicTest` 重跑均已通过；N9 最小 linked baseline 已建立。
- 未达到时剩余差距：PCVM 总目标尚未全部完成；下一阶段需要由总控决定是否进入 Wave 4 Agent / LLM before-after 优化，或先追加更大范围的真实 cold-start / rescan / package-runtime / Dashboard comparison 验证。
- 当前任务分区：测试回填 + TODO 滚动；本轮不继续派发产品实现。
- 不纳入 Wave 3A：不优化 Agent prompt/runtime 策略，不做 Dashboard comparison UI，不跑 full cold-start / rescan，不修改 `AlembicPlugin`，不触碰真实测试项目，不伪造质量分。

## Design / 需求来源

- 来源类型：AlembicDesign handoff + `GTODO-2026-05-25-003` 提升 + 用户确认 PCV 独立拉出。
- 来源文档：
  - [Progressive Chain Validation Metrics 原始计划](../../../AlembicDesign/docs/current/progressive-chain-validation-metrics-original-plan-2026-05-25.md)
  - [Progressive Chain Validation Metrics 需求设计](../../../AlembicDesign/docs/current/progressive-chain-validation-metrics-requirement-design-2026-05-25.md)
  - [PCVM 目标阶段确认](progressive-chain-validation-metrics-goal-stage-confirmation-2026-05-25.md)
  - [PCVM 代码实现依赖调研](../../requirement-designs/progressive-chain-validation-metrics/code-implementation-dependency-research-2026-05-25.md)
- 用户确认状态：用户已确认“单独出来”，并要求后续修改 / 删除 `Alembic` 和 `AlembicPlugin` 内部引入；2026-05-25 21:10 CST 用户确认 Wave 3A 只做 N9 producer observability linkage baseline，先派 `AlembicAgent` + `Alembic`，`AlembicCore` 观察，完成后由 `AlembicTest` 做最小 test-mode 验证；当前 Wave 3D `AlembicTest` 重跑已通过。
- 总控接收结论：顶层 `progressive-chain-validation/` 已从现有 submodule checkout 本地克隆出来，远端保持 `https://github.com/GxFn/progressive-chain-validation.git`，workspace `.gitignore` 已加入 `/progressive-chain-validation/`，避免被 AlembicWorkspace 仓库误跟踪。
- 是否需要目标阶段确认：已完成。
- 是否需要代码实现依赖调研：已完成。

## 代码事实与边界

- 顶层 canonical source：`progressive-chain-validation/`。
- 当前 PCV source hash：`badbf0aa23bbaaff2cf185491a6785a61b74c1d8`。
- PCV source remote：`https://github.com/GxFn/progressive-chain-validation.git`。
- PCV source 工作区状态：`main...origin/main [ahead 1]`，工作区干净；未推送远端不阻塞当前 Wave 3A，但发布 / 跨机消费前需同步远端。
- Wave 0 source 变更范围：`README.md`、`progressive-chain-validation/SKILL.md`、`progressive-chain-validation/references/metrics-contract.md`、`progressive-chain-validation/references/overlays/alembic-coldstart-rescan.md`、`progressive-chain-validation/references/plan-quality-standard.md`、`progressive-chain-validation/templates/plan.md`、`examples/alembic-n9-analyze-quality-baseline.md`、`examples/alembic-mainline-validation-prompt.md`。
- Wave 0 source 能力事实：新增 source-level metrics contract，要求 useful unit、quality gate、stage loss、baseline / candidate / comparison fields、verdict；quality gate 必须先通过，loss improvement 才能计入改进；artifact / trace / metrics 无法关联时输出 `blocked-by-observability-gap`，不得伪造 score。
- Wave 0 consumer 建议事实：PCV README 明确 source repo 是 canonical，consumer 不应维护 divergent internal copy；若 consumer 仅为测试或本地 fixture embed submodule，应替换为 release / install copy 或顶层 source checkout pointer。
- `Alembic/skills/progressive-chain-validation` 与 `AlembicPlugin/skills/progressive-chain-validation` 当前都是同一 remote 的 submodule，hash 同为 `a6c371c8b123fc79f218d362cd6bae61a0679d61`。
- `Alembic/package.json` 和 `AlembicPlugin/package.json` 的 `files` 均包含 `injectable-skills`，不包含 `skills`；现有 PCV tests 也显式断言 internal `skills` 不进入 package builtin exports。
- `Alembic/test/unit/progressive-chain-validation-skill.test.ts` 与 `AlembicPlugin/test/unit/progressive-chain-validation-skill.test.ts` 当前是 internal source fixture / contract tests；删除 submodule 时必须同步删除或替换这些测试，不能留下指向不存在目录的失败测试。
- producer / consumer 依赖：`progressive-chain-validation` 先产出 PCV metrics contract；`Alembic` / `AlembicPlugin` 后续删除 / 替换 internal submodule；`AlembicTest` 再验证 baseline；`AlembicAgent` 最后进入优化。
- 不允许触碰的目录 / 仓库：Wave 0 不改 `Alembic`、`AlembicPlugin`、`AlembicAgent`、`AlembicDashboard`、`AlembicCore`、`AlembicTest` 或真实测试项目源码。

## 阶段顺序

1. Wave 0：`progressive-chain-validation` source repo 实现 scorecard / baseline / comparison 方法、模板、N9 baseline guidance 和 observability gap verdict。状态：已验收，commit `badbf0aa23bbaaff2cf185491a6785a61b74c1d8`。
2. Wave 1：`Alembic` 与 `AlembicPlugin` 删除 / 替换内部 `skills/progressive-chain-validation` submodule，调整 `.gitmodules`、测试和文档，确认父仓库不再保留 PCV source copy。状态：总控验收通过；`Alembic` workflow 残留 P1A 也已验收通过。
3. Wave 2：`AlembicTest` 执行 PCVM Test-01，验证 N9 baseline、artifact / trace / metrics 证据和 PCV 默认使用规则。状态：总控验收通过。
4. Wave 3A：N9 producer observability linkage baseline。状态：已完成，`Alembic` 与 `AlembicAgent` 均已通过总控代码侧验收和轻量独立复核。
5. Wave 3B：`AlembicTest` 最小 test-mode 验证。状态：总控验收有效未通过；失败归口 `Alembic` consumer extraction。
6. Wave 3C：`Alembic` 最小 consumer extraction 返修。状态：总控验收通过，commit `ae9531ac3315a4491e22e3df156cb05e13fc0879`。
7. Wave 3D：`AlembicTest` 重跑 Test-11 同一 probe。状态：总控验收通过。
8. Wave 4+：在真实 baseline 和 comparison evidence 稳定后，才进入 `AlembicAgent` before / after 优化主线。

- 下一处真实阻塞点：无当前可派发阻塞；等待总控裁决 Wave 4 范围。
- 阻塞点之前还能做：本轮最小 linkage 复测已完成；不继续扩大到 full cold-start / rescan。
- 当前可派发窗口：无。
- 当前阻塞 / 观察窗口：`AlembicCore` 继续观察是否需要共享 contract；`AlembicDashboard` 与 `AlembicPlugin` 无任务。

## 任务包

| 任务包 ID | 窗口 | 摘要 | 状态 |
| --- | --- | --- | --- |
| PCVM-P0-PCV-SOURCE-METRICS-CONTRACT | `progressive-chain-validation` | 在顶层 PCV source repo 中补 scorecard / baseline / comparison 方法、模板和 N9 baseline 示例。 | 已验收 |
| PCVM-P1-ALEMBIC-SUBMODULE-REMOVAL | `Alembic` | 删除 / 替换 `Alembic/skills/progressive-chain-validation` submodule、清理 `.gitmodules` / gitlink / 测试和文档引用。 | 总控验收通过，workflow 残留已拆为 P1A |
| PCVM-P1-PLUGIN-SUBMODULE-REMOVAL | `AlembicPlugin` | 删除 / 替换 `AlembicPlugin/skills/progressive-chain-validation` submodule、清理 `.gitmodules` / gitlink / 测试和文档引用。 | 总控验收通过 |
| PCVM-P2-ALEMBICTEST-N9-BASELINE-PLAN | `AlembicTest` | 验证顶层 PCV canonical source、两边 consumer cleanup 和 N9 baseline plan 文档能力。 | 已回填，未通过 |
| PCVM-P1A-ALEMBIC-WORKFLOW-PCV-PATH-CLEANUP | `Alembic` | 清理 CI / release workflow 中旧 `Alembic/skills/progressive-chain-validation` path ref，防止远端链路重新消费内部 source path。 | 总控验收通过 |
| PCVM-P2R-ALEMBICTEST-CONSUMER-CLEANUP-RERUN | `AlembicTest` | 重跑 PCVM Test-01 最小 consumer cleanup probe，确认 Alembic workflow path ref 残留闭合。 | 总控验收通过 |
| PCVM-P3A-AGENT-N9-EVIDENCE-LINKAGE | `AlembicAgent` | 让 N9 analyze quality 生产稳定 node-local evidence：input assembly、Observation Ledger、`note_finding` / sourceRefs、quality gate / repair / reject 元数据。 | 已完成 |
| PCVM-P3A-ALEMBIC-N9-OBSERVABILITY-CARRY | `Alembic` | 把 N9 node linkage 贯穿 job process event、artifactRefs、trace envelope、llm metrics 和 artifact API；缺字段时输出精确 missing-link reason。 | 已完成 |
| PCVM-P3B-ALEMBICTEST-N9-LINKAGE-MINIMAL | `AlembicTest` | 最小 test-mode 验证 `AlembicAgent` nested evidence 与 `Alembic` job-level carry / artifact API 是否能形成真实 N9 baseline linkage。 | 已回填，未通过 |
| PCVM-P3C-ALEMBIC-NESTED-EVIDENCE-CONSUMER-EXTRACTION | `Alembic` | 让 `PcvObservabilityLinkage` 消费 nested `metadata.pcvNodeEvidence.nodeId/chainNodeId/sourceRefs`，并补 nested-only unit，解除 Test-11 的 `source_ref_missing`。 | 总控验收通过 |
| PCVM-P3D-ALEMBICTEST-N9-LINKAGE-RERUN | `AlembicTest` | 重跑 Test-11 同一最小 probe，验证 `Alembic` commit `ae9531ac3315a4491e22e3df156cb05e13fc0879` 已让 nested evidence 进入 linked baseline。 | 总控验收通过 |

### PCVM-P0-PCV-SOURCE-METRICS-CONTRACT：PCV source metrics contract

窗口：`progressive-chain-validation`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 19:05 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 19:40 CST

状态：已验收

验收证据：

- 提交 hash：`badbf0aa23bbaaff2cf185491a6785a61b74c1d8`。
- 提交摘要：`Add PCV metrics contract`。
- 变更范围：8 个文件，包含 metrics contract、N9 analyze baseline example、plan template scorecard、cold-start / rescan overlay metrics floor 和 README consumer guidance。
- 验证命令：`git -C progressive-chain-validation diff --check HEAD^ HEAD`，通过。
- 工作区状态：`main...origin/main [ahead 1]`，工作区干净；未推送远端记录为同步风险，不阻塞当前 Wave 3A。

阶段目标：

- 让 PCV source 从 plan-centric chain execution 扩展为可消费的节点级 baseline / scorecard / comparison 框架。
- 为 N9 analyze quality 定义第一版真实 baseline 证据，不要求真实 optimized-after。
- 给 Wave 1 提供明确的 `Alembic` / `AlembicPlugin` 内部 submodule 删除 / 替换建议。

主线动作：

- 先读取本 workspace `AGENTS.md`、`docs/workspace/index.md`、本文档，以及目标仓库 `progressive-chain-validation/README.md` 和 `progressive-chain-validation/progressive-chain-validation/SKILL.md`；如果目标仓库没有 `AGENTS.md`，开工声明里明确记录“目标仓库无 AGENTS.md，已读取 README / SKILL.md 作为 source 规则”。
- 复核 PCV skill、cold-start / rescan overlay、plan template 和 examples。
- 定义每个节点可自定义 useful unit、quality gate、stage_loss、baseline / candidate / comparison / verdict 的报告格式。
- 明确 quality gate 必须先通过，loss improvement 才能计入改进。
- 为 N9 analyze quality 写入 baseline 示例路径：LLM input assembly、Observation Ledger、`note_finding` 质量、artifact / trace / metrics 关联。
- 若 artifact / trace 无法关联 node，必须输出 `blocked-by-observability-gap`，不得伪造 verdict。
- 更新 source README / skill references / template / example，使后续窗口能按同一字段消费。
- 回填 PCV source commit hash、验证命令、N9 baseline 示例或 gap verdict、Wave 1 删除 / 替换内部 submodule 的建议。

合并 TODO：

- `GTODO-2026-05-25-003`
- `PCVM-TODO-0`
- `PCVM-TODO-1`
- `PCVM-TODO-4`

明确不包含：

- 不修改 `Alembic` 或 `AlembicPlugin` 父仓库。
- 不删除两个父仓库的 submodule；删除进入 Wave 1。
- 不修改 `AlembicAgent` prompt/runtime。
- 不创建 `AlembicTest` 测试单。
- 不做 Dashboard comparison UI。
- 不新增 Core schema，除非只作为后续建议回填。

下一处真实阻塞点：

- `Alembic` / `AlembicPlugin` 需要等待 PCV source commit 和删除 / 替换建议后才能进入 Wave 1。

阻塞点之前还能做：

- PCV source 可以在本包内完成 skill / overlay / template、N9 baseline guidance、observability gap verdict、example 和 source-level 文档验证。

验证命令：

```text
git diff --check
```

如新增或改造 source-level 测试 / 校验脚本，必须同时回填对应命令和结果。

回填要求：

- 完成范围：
- 提交 hash：
- 验证命令和结果：
- N9 baseline 示例或 observability gap verdict：
- `Alembic` / `AlembicPlugin` 内部 submodule 删除 / 替换建议：
- 是否需要 `AlembicCore` contract：
- `AlembicTest` 后续可消费字段：
- 遗留风险：
- 下一步建议：

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档和目标仓库 README / SKILL.md。
- 开始执行前先明确声明当前窗口定位、目标仓库职责、本轮任务职责，以及本仓库明确不承担的职责。

### PCVM-P1-ALEMBIC-SUBMODULE-REMOVAL：Alembic consumer cleanup

窗口：`Alembic`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 19:40 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 19:57 CST

状态：总控验收通过

阶段目标：

- 删除或替换 `Alembic/skills/progressive-chain-validation` 内部 submodule，不再让 `Alembic` 保留 PCV source checkout。
- 清理 `.gitmodules` 中 PCV submodule 条目、删除 gitlink、移除或替换 `test/unit/progressive-chain-validation-skill.test.ts` 中对内部 source copy 的断言。
- 确认 `Alembic` 仍不把 PCV source 当作 package builtin export；若仍需测试 PCV availability，必须改为消费顶层 source / release / install contract，而不是内部 copy。

主线动作：

- 先读取本 workspace `AGENTS.md`、`docs/workspace/index.md`、本文档，以及 `Alembic/AGENTS.md`；开工前声明当前窗口是 `Alembic` 仓库，本轮职责是 consumer cleanup，不是 PCV source 开发。
- 删除 / 替换 `skills/progressive-chain-validation` submodule，确保 `.gitmodules`、git index gitlink、测试和文档引用同步收口。
- 搜索 `progressive-chain-validation`、`skills/progressive-chain-validation`、`PCV` 引用，区分“应删除的内部 source checkout 引用”和“可保留的外部 source / release / 文档引用”。
- 保留 `injectable-skills`、runtime skill infrastructure、ProjectScope skill 逻辑和其它 skill 目录，不做顺手重构。
- 回填完成范围、提交 hash、验证命令、`git submodule status` / 引用清理证据、遗留风险和下一步建议。

合并 TODO：

- `GTODO-2026-05-25-003`
- `PCVM-TODO-0`

依赖前提：

- PCV source Wave 0 已验收，commit `badbf0aa23bbaaff2cf185491a6785a61b74c1d8` 提供 canonical source 和 consumer guidance。
- 本包只依赖 `Alembic` 本仓库状态，不等待 `AlembicPlugin`；两边完成后再进入 `AlembicTest`。

下一处真实阻塞点：

- `AlembicTest` 需要等待 `Alembic` 与 `AlembicPlugin` 都删除 / 替换内部 PCV submodule 后，才能创建 PCVM Test-01。

阻塞点之前还能做：

- 本包内可完成 `Alembic` 内部 submodule 删除、测试 / 文档引用清理、package boundary 复核和提交证据回填。

回填要求：

- 完成范围：
- 提交 hash：
- 验证命令和结果：
- `git submodule status` / 引用清理证据：
- 是否仍保留外部 PCV source / release / 文档引用：
- 遗留风险：
- 下一步建议：

统一验证要求：

- `git diff --check`
- `git submodule status`
- 使用 `rg` 证明不再有指向 `skills/progressive-chain-validation` 内部 source checkout 的运行 / 测试依赖。
- 根据 `Alembic/AGENTS.md` 和本次改动选择最小相关 unit / package-boundary / typecheck 验证；若某项命令不能运行，必须回填原因。

明确不包含：

- 不修改顶层 `progressive-chain-validation/` source repo。
- 不修改 `AlembicPlugin`；Plugin cleanup 由独立窗口执行。
- 不修改 `AlembicAgent` prompt/runtime。
- 不创建 `AlembicTest` 测试单。

执行回填：

- 回填记录：[../../Alembic/progressive-chain-validation-consumer-cleanup-2026-05-25.md](../../Alembic/progressive-chain-validation-consumer-cleanup-2026-05-25.md)
- 完成范围：删除 `skills/progressive-chain-validation` gitlink、`.gitmodules` PCV 条目和 `test/unit/progressive-chain-validation-skill.test.ts` 内部 source fixture test；保留 runtime skill infrastructure / injectable-skills / ProjectScope skill 逻辑。
- 提交 hash：`d99d66d0af14fe6e8a51e683d963028ec9d0679a`
- 验证命令：`git diff --check`、`git submodule status`、`rg -n "skills/progressive-chain-validation" .`、`rg -n "progressive-chain-validation|PCV" .`、`npm run test:unit -- SkillAdapter.test.ts`、`npm run typecheck`、`npm run lint`、`npm run lint:repo-boundary`、`npm run release:package-guard`、`npm run lint:consumer-core-imports`、`npm run lint:agent-extraction-boundary`。
- 验证结果：通过；`git submodule status` 仅剩 `vendor/AlembicCore` 与 `vendor/AlembicDashboard`，`skills/progressive-chain-validation` 无命中，剩余 `progressive-chain-validation` 字符串只在 `SkillAdapter.test.ts` 中作为搜索 query。
- 遗留风险：`AlembicPlugin` 已独立完成同类 cleanup；顶层 PCV source 仍按 Wave 0 记录存在远端同步风险；N9 baseline / Agent 优化验证等待后续阶段。

总控复核：

- 2026-05-25 19:57 CST 复核通过。
- `git -C Alembic status --short --branch`：`main...origin/main [ahead 1]`，工作区干净。
- `git -C Alembic show --stat --oneline HEAD`：仅删除 `.gitmodules` PCV 条目、`skills/progressive-chain-validation` gitlink 和 `test/unit/progressive-chain-validation-skill.test.ts`。
- `git -C Alembic submodule status`：仅剩 `vendor/AlembicCore` 与 `vendor/AlembicDashboard`。
- `git -C Alembic ls-files -s skills/progressive-chain-validation`：无输出，证明 PCV gitlink 已从 index 移除。
- `rg -n "skills/progressive-chain-validation" Alembic -S -g '!node_modules' -g '!dist' -g '!vendor'`：无命中。
- `git -C Alembic diff --check HEAD^ HEAD`：通过。
- 结论：满足 Wave 1 Alembic consumer cleanup 完成定义；本地 ahead 1 记录为远端同步风险，不阻塞 Wave 2。

### PCVM-P1-PLUGIN-SUBMODULE-REMOVAL：AlembicPlugin consumer cleanup

窗口：`AlembicPlugin`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 19:40 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 19:57 CST

状态：总控验收通过

阶段目标：

- 删除或替换 `AlembicPlugin/skills/progressive-chain-validation` 内部 submodule，不再让 `AlembicPlugin` 保留 PCV source checkout。
- 清理 `.gitmodules` 中 PCV submodule 条目、删除 gitlink、移除或替换 `test/unit/progressive-chain-validation-skill.test.ts` 中对内部 source copy 的断言。
- 确认 Plugin package / marketplace / skill runtime 仍只消费正式安装入口或外部 source contract，不把内部 PCV source copy 当作 package builtin export。

主线动作：

- 先读取本 workspace `AGENTS.md`、`docs/workspace/index.md`、本文档，以及 `AlembicPlugin/AGENTS.md`；开工前声明当前窗口是 `AlembicPlugin` 仓库，本轮职责是 Plugin consumer cleanup，不是 PCV source 开发。
- 删除 / 替换 `skills/progressive-chain-validation` submodule，确保 `.gitmodules`、git index gitlink、测试和文档引用同步收口。
- 搜索 `progressive-chain-validation`、`skills/progressive-chain-validation`、`PCV` 引用，区分“应删除的内部 source checkout 引用”和“可保留的外部 source / release / 文档引用”。
- 保留 Plugin runtime、installed skill discovery、marketplace/channel 逻辑和其它 skill 目录，不做顺手重构。
- 回填完成范围、提交 hash、验证命令、`git submodule status` / 引用清理证据、遗留风险和下一步建议。

合并 TODO：

- `GTODO-2026-05-25-003`
- `PCVM-TODO-0`

依赖前提：

- PCV source Wave 0 已验收，commit `badbf0aa23bbaaff2cf185491a6785a61b74c1d8` 提供 canonical source 和 consumer guidance。
- 本包只依赖 `AlembicPlugin` 本仓库状态，不等待 `Alembic`；两边完成后再进入 `AlembicTest`。

下一处真实阻塞点：

- `AlembicTest` 需要等待 `Alembic` 与 `AlembicPlugin` 都删除 / 替换内部 PCV submodule 后，才能创建 PCVM Test-01。

阻塞点之前还能做：

- 本包内可完成 `AlembicPlugin` 内部 submodule 删除、测试 / 文档引用清理、package boundary 复核和提交证据回填。

回填要求：

- 完成范围：已在 `AlembicPlugin` 删除 `.gitmodules` 中 `skills/progressive-chain-validation` submodule 条目、删除 `skills/progressive-chain-validation` gitlink，并删除只依赖内部 source checkout 的 `test/unit/progressive-chain-validation-skill.test.ts`；Plugin runtime、installed skill discovery、marketplace/channel 逻辑和其它 skill 目录未改。
- 提交 hash：`aa171f31734350ef49efaac56c34588b67f0d924`（`chore: remove internal pcv submodule`）
- 验证命令和结果：`git diff --check` 通过；`npm run check` 通过（`tsc --noEmit`、`biome check lib/ bin/ config/ scripts/`、`lint-consumer-core-imports` 均通过）；`npm run test:unit` 通过（104 files / 1502 tests）；`npm run verify:release-package-boundary` 通过，确认 root package private、root registry publish disabled、Codex plugin artifact release enabled、embedded runtime Core dependency 仍为 `file:vendor/AlembicCore`。
- `git submodule status` / 引用清理证据：`git submodule status` 仅剩 `plugins/alembic-codex` 与 `vendor/AlembicCore`；`git ls-files -s | rg "progressive-chain-validation|160000"` 仅显示上述两个 160000 gitlink；`rg -n "progressive-chain-validation|skills/progressive-chain-validation|PCV" . --glob '!node_modules/**'` 无命中，证明 Plugin 仓库内不再有 PCV 内部 checkout 运行 / 测试 / 文档引用。
- 是否仍保留外部 PCV source / release / 文档引用：`AlembicPlugin` 仓库内未保留外部 PCV source / release / 文档引用；顶层 canonical `progressive-chain-validation/` 仓库由 workspace / PCV source 窗口维护，本轮未触碰。
- 遗留风险：本轮只完成 Plugin consumer cleanup；Wave 2 真实 baseline / test-mode 验证已交给 `AlembicTest`。PCV source commit `badbf0aa23bbaaff2cf185491a6785a61b74c1d8` 的远端同步风险沿用 Wave 0 记录，不由 Plugin 窗口处理。
- 下一步建议：总控复核 `Alembic` 与 `AlembicPlugin` 两边 submodule status / 引用清理证据后，创建 `AlembicTest` PCVM Test-01，验证真实项目基线消费同一份顶层 PCV source。

总控复核：

- 2026-05-25 19:57 CST 复核通过。
- `git -C AlembicPlugin status --short --branch`：`main...origin/main [ahead 1]`，工作区干净。
- `git -C AlembicPlugin show --stat --oneline HEAD`：仅删除 `.gitmodules` PCV 条目、`skills/progressive-chain-validation` gitlink 和 `test/unit/progressive-chain-validation-skill.test.ts`。
- `git -C AlembicPlugin submodule status`：仅剩 `plugins/alembic-codex` 与 `vendor/AlembicCore`。
- `git -C AlembicPlugin ls-files -s skills/progressive-chain-validation`：无输出，证明 PCV gitlink 已从 index 移除。
- `rg -n "skills/progressive-chain-validation" AlembicPlugin -S -g '!node_modules' -g '!dist' -g '!vendor'`：无命中。
- `git -C AlembicPlugin diff --check HEAD^ HEAD`：通过。
- 结论：满足 Wave 1 Plugin consumer cleanup 完成定义；本地 ahead 1 记录为远端同步风险，不阻塞 Wave 2。

统一验证要求：

- `git diff --check`
- `git submodule status`
- 使用 `rg` 证明不再有指向 `skills/progressive-chain-validation` 内部 source checkout 的运行 / 测试依赖。
- 根据 `AlembicPlugin/AGENTS.md` 和本次改动选择最小相关 unit / package-boundary / typecheck 验证；若某项命令不能运行，必须回填原因。

明确不包含：

- 不修改顶层 `progressive-chain-validation/` source repo。
- 不修改 `Alembic`；Alembic cleanup 由独立窗口执行。
- 不修改 `AlembicAgent` prompt/runtime。
- 不创建 `AlembicTest` 测试单。

### PCVM-P2-ALEMBICTEST-N9-BASELINE-PLAN：PCV baseline plan validation

窗口：`AlembicTest`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 19:57 CST

状态：已回填，未通过，失败归口 `Alembic` consumer cleanup

阶段目标：

- 验证 PCV canonical source 已能作为 plan 文档能力被后续测试 / 优化流程消费。
- 验证 `Alembic` 与 `AlembicPlugin` 不再依赖内部 `skills/progressive-chain-validation` source checkout。
- 用最小 fixture 或冻结事实生成 / 校验 N9 analyze quality baseline plan section，覆盖 useful unit、quality gate、stage loss、baseline、evidence links、verdict 和 observability gap verdict。

主线动作：

- 先读取本 workspace `AGENTS.md`、`docs/workspace/index.md`、本文档、`docs/workspace/current/alembic-test-exchange.md` 和 `AlembicTest/AGENTS.md`；开工前声明当前窗口是 `AlembicTest`，本轮职责是测试验证，不是产品实现。
- 读取顶层 `progressive-chain-validation/` source 的 metrics contract、plan template 和 N9 baseline example，确认 plan 文档字段可被测试报告消费。
- 只做最小 probe / fixture / 文档生成验证，不跑 full cold-start / rescan，不修改产品源码或真实测试项目业务源码。
- 对 `Alembic` / `AlembicPlugin` 做 read-only consumer cleanup 复核：submodule status、gitlink、`skills/progressive-chain-validation` 引用、仓库状态。
- 生成或回填一份 PCVM Test-01 报告，证明 N9 baseline plan 文档可表达小阶段指标制定与优化对比前置 baseline；若 artifact / trace / metrics 不能稳定关联 node，必须给出 `blocked-by-observability-gap`，不得伪造质量 verdict。

合并 TODO：

- `GTODO-2026-05-25-003`
- `PCVM-TODO-3`
- `PCVM-TODO-5`

依赖前提：

- PCV source Wave 0 已验收，commit `badbf0aa23bbaaff2cf185491a6785a61b74c1d8`。
- `Alembic` Wave 1 已初步验收，commit `d99d66d0af14fe6e8a51e683d963028ec9d0679a`；Test-01 发现 workflow path ref 残留，需返修。
- `AlembicPlugin` Wave 1 已验收，commit `aa171f31734350ef49efaac56c34588b67f0d924`。

下一处真实阻塞点：

- `AlembicAgent` 优化不能启动，直到 `Alembic` 清理 workflow 残留并由 AlembicTest 最小重测 consumer cleanup 通过；本轮已明确回填 observability gap verdict 和失败归口。

阻塞点之前还能做：

- AlembicTest 可以独立完成 PCV source 可读性、plan 文档 baseline 字段、consumer cleanup read-only scan 和测试报告回填。

验证命令：

- `node --check AlembicTest/scripts/probe-pcv-canonical-source-baseline.mjs`：通过。
- `node AlembicTest/scripts/probe-pcv-canonical-source-baseline.mjs --help`：通过。
- `npm --prefix AlembicTest run check`：通过。
- `node AlembicTest/scripts/probe-pcv-canonical-source-baseline.mjs`：退出码 `1`，符合测试发现的 `Alembic` cleanup 残留；已写出 JSON evidence 和 fixture。

回填要求：

- 测试结论：
- 执行范围：
- 使用配置：
- fixture / report / plan 路径：
- PCV source commit：
- Alembic / AlembicPlugin consumer cleanup 复核结果：
- N9 baseline scorecard 字段：
- observability gap verdict 是否触发：
- 真实项目是否干净：
- 详细报告路径：
- 遗留风险：
- 下一步建议：

执行回填：

- 测试结论：未通过；PCV source / N9 baseline fixture 可用，`AlembicPlugin` cleanup 通过，但 `Alembic` workflow 仍引用旧内部 PCV path。
- 执行范围：只使用 AlembicTest 最小 source-readonly probe、fixture 和报告；未跑 full cold-start / rescan；未操作 BiliDili 业务代码；未修改产品源码。
- 使用配置：probe `AlembicTest/scripts/probe-pcv-canonical-source-baseline.mjs`，mode `source-readonly-plus-alembic-test-fixture`。
- fixture / report / plan 路径：`AlembicTest/tmp/pcv-canonical-source-baseline-plan.md`、`AlembicTest/tmp/pcv-canonical-source-baseline.json`、[../../../AlembicTest/docs/pcv-canonical-source-baseline-2026-05-25.md](../../../AlembicTest/docs/pcv-canonical-source-baseline-2026-05-25.md)。
- PCV source commit：`badbf0aa23bbaaff2cf185491a6785a61b74c1d8`。
- Alembic / AlembicPlugin consumer cleanup 复核结果：`AlembicPlugin` 通过；`Alembic` `.gitmodules` / submodule / gitlink 已清理，但 `git grep -n -- skills/progressive-chain-validation` 命中 `.github/workflows/ci.yml:182` 与 `.github/workflows/release.yml:37`。
- N9 baseline scorecard 字段：`usefulUnit`、`qualityGate`、`stageLoss`、`baseline`、`evidenceLinks`、`verdict`。
- observability gap verdict 是否触发：是，`blocked-by-observability-gap`，未伪造质量分。
- 真实项目是否干净：`progressive-chain-validation`、`Alembic`、`AlembicPlugin`、`BiliDili` 工作区均 clean；`Alembic` / `AlembicPlugin` 分支各自 ahead 1。
- 遗留风险和下一步建议：`Alembic` CI / release workflow 仍可能消费旧内部 PCV path；建议先派 `Alembic` 最小清理 workflow 残留，再派 `AlembicTest` 重跑本 probe。

明确不包含：

- 不修改 `progressive-chain-validation` source repo。
- 不修改 `Alembic`、`AlembicPlugin`、`AlembicAgent`、`AlembicDashboard` 或 `AlembicCore` 产品源码。
- 不跑 full cold-start / rescan。
- 不做 Agent / LLM 优化。
- 不做 Dashboard comparison UI。

### PCVM-P1A-ALEMBIC-WORKFLOW-PCV-PATH-CLEANUP：Alembic workflow residual cleanup

窗口：`Alembic`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 20:21 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 20:37 CST

状态：总控验收通过

阶段目标：

- 关闭 Test-01 发现的 `Alembic` consumer cleanup 残留。
- 清理 `.github/workflows/ci.yml` 与 `.github/workflows/release.yml` 中旧 `Alembic/skills/progressive-chain-validation` path ref，防止 CI / release 远端链路重新 checkout 内部 PCV source。
- 保持 `Alembic` 不再维护内部 PCV source copy；如 workflow 仍需 PCV source，只能改为顶层 canonical source / release / install contract 的后续建议，不在本包内创建新集成。

主线动作：

- 先读取本 workspace `AGENTS.md`、`docs/workspace/index.md`、本文档、`docs/workspace/current/alembic-test-exchange.md` 和 `Alembic/AGENTS.md`；开工前声明当前窗口是 `Alembic`，本轮职责是 workflow residual cleanup，不是 PCV source 开发。
- 删除或替换 `.github/workflows/ci.yml` 与 `.github/workflows/release.yml` 中旧 `Alembic/skills/progressive-chain-validation` path ref。
- 搜索 `skills/progressive-chain-validation`、`progressive-chain-validation`、`PCV`，区分已允许的测试 query 字符串和需要清理的旧内部 source path。
- 不恢复 `.gitmodules` PCV 条目，不恢复 `skills/progressive-chain-validation` gitlink，不恢复内部 source fixture test。

合并 TODO：

- `GTODO-2026-05-25-003`
- `PCVM-TODO-0`

依赖前提：

- Test-01 已回填失败证据，归口 `Alembic` workflow residual cleanup。
- `AlembicPlugin` cleanup 已通过，不参与本包。

下一处真实阻塞点：

- `AlembicTest` 需要等待 `Alembic` 返修提交和引用清理证据后，才能重跑最小 PCVM consumer cleanup probe。

阻塞点之前还能做：

- 本包内可完成两个 workflow 文件清理、引用扫描、最小验证和回填。

验证命令：

- `git diff --check`
- `git submodule status`
- `git grep -n -- "skills/progressive-chain-validation"`
- `rg -n "skills/progressive-chain-validation|progressive-chain-validation|PCV" .github test package.json scripts README.md README_CN.md`
- 根据 `Alembic/AGENTS.md` 选择最小 workflow / package-boundary / lint 验证；若某项命令不能运行，必须回填原因。

回填要求：

- 完成范围：
- 提交 hash：
- 验证命令和结果：
- workflow path ref 清理证据：
- 剩余 `progressive-chain-validation` / `PCV` 引用及保留理由：
- 是否影响 release / CI 行为：
- 遗留风险：
- 下一步建议：

明确不包含：

- 不修改顶层 `progressive-chain-validation` source。
- 不修改 `AlembicPlugin`、`AlembicAgent`、`AlembicDashboard`、`AlembicCore` 或 `AlembicTest`。
- 不新增新的 PCV install / release 集成；若 workflow 未来需要 PCV source，应作为后续建议回填。
- 不跑 full cold-start / rescan。

执行回填：

- 回填记录：[../../Alembic/progressive-chain-validation-workflow-cleanup-2026-05-25.md](../../Alembic/progressive-chain-validation-workflow-cleanup-2026-05-25.md)
- 完成范围：删除 `.github/workflows/ci.yml` 与 `.github/workflows/release.yml` 中 checkout `GxFn/progressive-chain-validation` 到 `Alembic/skills/progressive-chain-validation` 的步骤；未新增替代 PCV checkout / install 集成。
- 提交 hash：`92bd976162fb9c1dbc19da1f8afef8756c976c27`
- 验证命令：`git diff --check`、workflow YAML parse、`npm run release:package-guard`、`npm run test:unit -- SkillAdapter.test.ts`、`npm run lint`、`npm run lint:repo-boundary`、`git grep -n -- "skills/progressive-chain-validation"`、`rg -n "skills/progressive-chain-validation|progressive-chain-validation|PCV" .github test package.json scripts README.md README_CN.md -S`、`git submodule status`。
- 验证结果：通过；`skills/progressive-chain-validation` 无命中；剩余 `progressive-chain-validation` 只在 `test/unit/SkillAdapter.test.ts` 的搜索 query 字符串中。
- release / CI 行为影响：CI / release 不再 checkout 到已删除的内部 PCV path；其余 Alembic / Core / Agent / Dashboard checkout、package guard、test 和 publish 流程不变。
- 遗留风险：本轮 workflow residual cleanup 已闭合；仍需 `AlembicTest` 重跑最小 PCVM consumer cleanup probe，确认 Test-01 失败点在测试链路中关闭。

总控复核：

- 2026-05-25 20:37 CST 复核通过。
- `git -C Alembic status --short --branch`：`main...origin/main`，工作区干净。
- `git -C Alembic show --stat --oneline HEAD`：仅删除 `.github/workflows/ci.yml` 与 `.github/workflows/release.yml` 两个 workflow 的 PCV checkout 步骤，共 11 行。
- `git -C Alembic diff --check HEAD^ HEAD`：通过。
- `git -C Alembic grep -n -- "skills/progressive-chain-validation"`：无命中。
- `rg -n "skills/progressive-chain-validation|progressive-chain-validation|PCV" Alembic/.github Alembic/test Alembic/package.json Alembic/scripts Alembic/README.md Alembic/README_CN.md -S`：仅剩 `Alembic/test/unit/SkillAdapter.test.ts:111` 的搜索 query 字符串，可保留。
- `git -C Alembic submodule status`：仅剩 `vendor/AlembicCore` 与 `vendor/AlembicDashboard`。
- 结论：P1A 满足 workflow residual cleanup 完成定义；当前可派 `AlembicTest` 重跑 PCVM Test-01 最小 probe。

### PCVM-P2R-ALEMBICTEST-CONSUMER-CLEANUP-RERUN：PCVM Test-01 rerun

窗口：`AlembicTest`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 20:37 CST

状态：总控验收通过

阶段目标：

- 最小重跑 `Test-2026-05-25-10 / PCVM-P2-Canonical-Source-Baseline` 的 consumer cleanup probe。
- 证明 `Alembic` workflow path ref 残留已被 `92bd976162fb9c1dbc19da1f8afef8756c976c27` 关闭。
- 复核 PCV source / N9 scorecard fixture 仍可用；若 N9 仍缺真实 artifact / trace / metrics node 关联，继续保留 `blocked-by-observability-gap`，不得伪造质量分。

主线动作：

- 先读取本 workspace `AGENTS.md`、`docs/workspace/index.md`、本文档、`docs/workspace/current/alembic-test-exchange.md` 和 `AlembicTest/AGENTS.md`；开工前声明当前窗口是 `AlembicTest`，本轮只做 Test-10 最小重测。
- 复用或重跑 `AlembicTest/scripts/probe-pcv-canonical-source-baseline.mjs`，优先验证先前失败点：`Alembic` 中是否仍有 `skills/progressive-chain-validation` path ref。
- 记录 `Alembic` commit `92bd976162fb9c1dbc19da1f8afef8756c976c27`、`AlembicPlugin` commit `aa171f31734350ef49efaac56c34588b67f0d924`、PCV source commit `badbf0aa23bbaaff2cf185491a6785a61b74c1d8`。
- 不跑 full cold-start / rescan，不修改产品源码或真实测试项目业务源码。

合并 TODO：

- `GTODO-2026-05-25-003`
- `PCVM-TODO-3`

依赖前提：

- `Alembic` P1A workflow cleanup 已通过总控验收，commit `92bd976162fb9c1dbc19da1f8afef8756c976c27`。

下一处真实阻塞点：

- `AlembicAgent` 优化不能启动，直到 Test-10 重测证明 consumer cleanup 通过，或回填新的失败归口。

阻塞点之前还能做：

- AlembicTest 可以独立重跑最小 consumer cleanup probe 和报告回填。

验证命令：

- 由 `AlembicTest` 根据自身 AGENTS 和测试策略执行；建议重跑 `node AlembicTest/scripts/probe-pcv-canonical-source-baseline.mjs` 或等价最小 probe，并保留语法 / help / check 证据。

回填要求：

- 重测结论：
- 执行范围：
- 使用配置：
- fixture / report / plan 路径：
- PCV source commit：
- Alembic / AlembicPlugin consumer cleanup 复核结果：
- N9 baseline scorecard / observability gap verdict 状态：
- 真实项目是否干净：
- 详细报告路径：
- 遗留风险：
- 下一步建议：

明确不包含：

- 不修改 `progressive-chain-validation` source repo。
- 不修改 `Alembic`、`AlembicPlugin`、`AlembicAgent`、`AlembicDashboard` 或 `AlembicCore` 产品源码。
- 不跑 full cold-start / rescan。
- 不做 Agent / LLM 优化。

执行回填：

- 重测结论：通过。最小 probe 结论为 `pass-source-baseline-with-scoring-blocked-by-observability-gap`，consumer cleanup passed 为 `true`。
- 执行范围：只重跑 `AlembicTest/scripts/probe-pcv-canonical-source-baseline.mjs` 的 source-readonly + fixture probe，并做 `Alembic` / `AlembicPlugin` consumer path ref 直接复核；未运行 full cold-start / rescan，未修改产品源码或 BiliDili 业务源码。
- 使用配置：`--expected-alembic-commit 92bd976162fb9c1dbc19da1f8afef8756c976c27`，独立输出 rerun JSON / plan fixture；默认 PCV source commit `badbf0aa23bbaaff2cf185491a6785a61b74c1d8`，默认 AlembicPlugin commit `aa171f31734350ef49efaac56c34588b67f0d924`。
- fixture / report / plan 路径：JSON evidence `AlembicTest/tmp/pcv-canonical-source-baseline-rerun.json`；plan fixture `AlembicTest/tmp/pcv-canonical-source-baseline-rerun-plan.md`；详细报告 [../../../AlembicTest/docs/pcv-consumer-cleanup-rerun-2026-05-25.md](../../../AlembicTest/docs/pcv-consumer-cleanup-rerun-2026-05-25.md)。
- PCV source commit：`badbf0aa23bbaaff2cf185491a6785a61b74c1d8`。
- Alembic / AlembicPlugin consumer cleanup 复核结果：`Alembic` HEAD `92bd976162fb9c1dbc19da1f8afef8756c976c27`，`git grep -n -- skills/progressive-chain-validation` 无命中，`git ls-files -s skills/progressive-chain-validation` 无输出，probe checks 全部为 true；剩余 `progressive-chain-validation` 仅为 `test/unit/SkillAdapter.test.ts:111` 搜索 query。`AlembicPlugin` HEAD `aa171f31734350ef49efaac56c34588b67f0d924`，同样无内部 path ref / gitlink / submodule 条目，`progressive-chain-validation` 无命中。
- N9 baseline scorecard / observability gap verdict 状态：scorecard 字段包含 `usefulUnit`、`qualityGate`、`stageLoss`、`baseline`、`evidenceLinks`、`verdict`；`observabilityGapVerdict.triggered=true`，`verdict=blocked-by-observability-gap`，`noQualityScoreAssigned=true`，原因是本轮没有真实 N9 artifact / trace / metric / source-ref link。
- 真实项目是否干净：`progressive-chain-validation`、`Alembic`、`AlembicPlugin`、`BiliDili` 工作区均 clean；`AlembicPlugin` 分支 `main...origin/main [ahead 1]`，工作树干净。
- 验证命令：`node --check AlembicTest/scripts/probe-pcv-canonical-source-baseline.mjs`、`node AlembicTest/scripts/probe-pcv-canonical-source-baseline.mjs --help`、`npm --prefix AlembicTest run check`、rerun probe、`git -C Alembic grep -n -- skills/progressive-chain-validation`、`git -C AlembicPlugin grep -n -- skills/progressive-chain-validation`、`git -C Alembic ls-files -s skills/progressive-chain-validation`、`git -C AlembicPlugin ls-files -s skills/progressive-chain-validation`。
- 遗留风险：N9 分数仍需要真实 producer 写出 node-local artifact / trace / metric / source-ref linkage；`AlembicPlugin` 本地分支 ahead 1 的 push / 发布不在本轮最小重测范围。
- 下一步建议：总控验收后关闭 Test-10 consumer cleanup 阻塞；如要解除 N9 observability gap，应另派 producer linkage 任务，而不是在本轮 rerun 中补做。

总控复核：

- 2026-05-25 21:00 CST 复核通过。
- 已读取详细报告 [../../../AlembicTest/docs/pcv-consumer-cleanup-rerun-2026-05-25.md](../../../AlembicTest/docs/pcv-consumer-cleanup-rerun-2026-05-25.md)、JSON evidence `AlembicTest/tmp/pcv-canonical-source-baseline-rerun.json` 和 plan fixture `AlembicTest/tmp/pcv-canonical-source-baseline-rerun-plan.md`。
- 独立复核 `git -C Alembic grep -n -- skills/progressive-chain-validation` 与 `git -C AlembicPlugin grep -n -- skills/progressive-chain-validation` 均无命中；两边 `git ls-files -s skills/progressive-chain-validation` 均无输出。
- 独立复核 `progressive-chain-validation`、`Alembic`、`BiliDili` 工作区 clean；`AlembicPlugin` 工作区 clean 且 ahead 1，符合本轮记录；`AlembicTest` 未提交测试资产不作为阻塞。
- 结论：Test-10 consumer cleanup 阻塞关闭，Wave 2 总控验收通过。N9 `blocked-by-observability-gap` 是下一阶段 producer linkage 缺口，不是本轮失败。

### PCVM-P3A-AGENT-N9-EVIDENCE-LINKAGE：N9 agent evidence producer

窗口：`AlembicAgent`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 21:10 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 21:40 CST

状态：已完成

阶段目标：

- 让 N9 analyze quality 在 Agent runtime 内生产可被 PCV scorecard 消费的真实 baseline evidence。
- 把 N9 的 stable node identity、LLM input assembly、Observation Ledger、`note_finding`、source refs、quality gate / repair / reject 元数据收束到可回填的节点本地证据。
- 为后续 `Alembic` job-level artifact / trace / metrics linkage 提供真实 producer 字段；若当前 runtime 无法提供某字段，必须回填精确 missing producer field 和最小补齐建议。

主线动作：

- 先读取本 workspace `AGENTS.md`、`docs/workspace/index.md`、本文档，以及 `AlembicAgent/AGENTS.md`；开工前声明当前窗口是 `AlembicAgent`，本轮职责是 N9 evidence producer，不是 prompt 优化或 Alembic daemon/API 实现。
- 复核 N9 analyze quality 的真实链路：stage profile / N9 配置、`LLMInputAssembly`、`ActiveContext` / Observation Ledger、`note_finding` tool call、quality gate、repair / reject 记录和 report / sourceRefs 输出。
- 为 N9 节点输出稳定 evidence summary，至少能表达：`nodeId` / `chainNodeId` / stage identity、input assembly ref 或摘要、ledger refs、accepted / rejected finding refs、sourceRefs、quality gate status、repair / rejection reason、可被 Alembic carry 的 correlation / run metadata。
- 保持 redaction / privacy 边界；不得把原始 prompt、机密内容或超预算正文直接塞入 scorecard，只输出可追溯引用、摘要或 artifactRef。
- 如需 `Alembic` 承接字段，回填字段名、语义、生成时机和缺失时的 fallback / missing reason；不得让下游猜 contract。

合并 TODO：

- `GTODO-2026-05-25-003`
- `PCVM-TODO-2`
- `PCVM-TODO-4`

明确不包含：

- 不优化 N9 prompt / runtime 策略，不调整 section budget、tool policy 或 before / after 优化指标。
- 不修改 `Alembic` daemon、job store、HTTP/API 或 Dashboard。
- 不新增 `AlembicCore` schema，除非只作为回填建议说明。
- 不跑 full cold-start / rescan，不修改真实测试项目。

下一处真实阻塞点：

- `AlembicTest` 等待 `AlembicAgent` 和 `Alembic` 都回填可复验 evidence linkage 后才能创建 Wave 3B 最小 test-mode 验证。

阻塞点之前还能做：

- 本包内可以完成 N9 evidence producer 字段、最小 runtime / unit 验证、回填文档和给 `Alembic` 的消费说明。

验证命令：

- 根据 `AlembicAgent/AGENTS.md` 和实际改动选择最小相关 test / typecheck / lint。
- 建议覆盖既有相关测试：`test/llm-input-layering.test.ts`、`test/evidence-recording-phase-chain.test.ts`、`test/llm-input-correctness.test.ts`、`test/AgentRuntime.test.ts`、`test/memory-note-finding.test.ts` 中受影响的最小集合；若命令不同，以仓库实际 package scripts 为准并回填原因。

回填要求：

- 完成范围：
- 提交 hash：
- 验证命令和结果：
- N9 evidence producer 字段：
- 与 `Alembic` 的消费 / carry 约定：
- 仍缺的 producer 字段或 missing-link reason：
- 是否需要 `AlembicCore` 共享 schema：
- 遗留风险：
- 下一步建议：

保存位置：

- 回填到 workspace 文档：[../../AlembicAgent/progressive-chain-validation-n9-observability-linkage-2026-05-25.md](../../AlembicAgent/progressive-chain-validation-n9-observability-linkage-2026-05-25.md)。

执行回填（2026-05-25 21:40 CST）：

- 完成范围：`AlembicAgent` 新增 `src/agent/runtime/PcvNodeEvidence.ts`；`LoopContext` 返回 `pcvNodeEvidence`；`AgentRuntime` 在 LLM input process event、tool end process event 和 `AgentResult` 写出 compact / full PCVM node-local evidence；`insightGateEvaluator` 在 quality gate artifact 挂载 `pcvNodeEvidence`；`runtime/index.ts` 显式导出 evidence 类型和 helper；补充 targeted tests。
- 提交 hash：`7ab94575ed9b475dc57253c88738e1f061a3c547`。
- 验证命令和结果：`npm test -- llm-input-layering` 通过（6 tests）；`npm test -- AgentRuntime` 通过（9 tests）；`npm test -- evidence-recording-phase-chain` 通过（11 tests）；`npm run typecheck` 通过；`npm run lint` 通过；`npm run check` 通过（22 files / 106 tests，含 build:check、lint、agent import boundary、public API boundary、Core import boundary 和全量 vitest）；`git diff --check` 通过。
- N9 evidence producer 字段：`nodeId`、`chainNodeId`、`stageIdentity`、`correlation`、`inputAssembly.ref`、`ledgerRefs`、`findingRefs.accepted`、`findingRefs.rejected`、`sourceRefs`、`qualityGate`、`repair`、`missingLinkReasons`。
- 与 `Alembic` 的消费 / carry 约定：process event metadata 提供 compact `pcvNodeEvidence` refs；`AgentResult.pcvNodeEvidence` 与 quality gate artifact `pcvNodeEvidence` 提供完整 node-local evidence。Alembic 可优先消费 explicit `nodeId` / `chainNodeId` / `sourceRefs` / quality gate / finding refs。
- 仍缺的 producer 字段或 missing-link reason：若某次运行缺 trace、finding、sourceRef、input assembly 或 quality gate，producer 会写出 `missing-observation-ledger-ref`、`missing-finding-refs`、`missing-source-refs`、`missing-input-assembly-ref` 或 `missing-quality-gate-status`，不伪造质量分。
- 是否需要 `AlembicCore` 共享 schema：本轮不需要；先由 `AlembicTest` Wave 3B 验证跨仓库消费后再决定是否下沉稳定 schema。
- 遗留风险：本轮只完成 Agent producer evidence，不验证 Alembic job-level carry 与 Agent explicit fields 的真实 test-mode 串联；真实 full cold-start / rescan 不在本轮范围。
- 下一步建议：总控验收 `AlembicAgent` 与 `Alembic` 两侧回填后，创建 Wave 3B `AlembicTest` 最小 test-mode 验证单。

总控复核（2026-05-25 21:55 CST）：

- 代码侧验收结论：通过，可进入 Wave 3B `AlembicTest` 最小 test-mode 验证。
- 复核证据：已读取回填文档 [../../AlembicAgent/progressive-chain-validation-n9-observability-linkage-2026-05-25.md](../../AlembicAgent/progressive-chain-validation-n9-observability-linkage-2026-05-25.md)；`git -C AlembicAgent status --short --branch` 显示 `main...origin/main [ahead 1]` 且工作区 clean；`git -C AlembicAgent show --stat --oneline HEAD` 确认 commit `7ab94575ed9b475dc57253c88738e1f061a3c547` 新增 `PcvNodeEvidence`、runtime wiring、quality gate artifact linkage 和 targeted tests；`git -C AlembicAgent diff --check HEAD^ HEAD` 通过。
- 功能完整性判断：`AlembicAgent` 已在 `AgentResult`、process event metadata 和 quality gate artifact 三处输出 developer-safe PCVM node-local evidence，覆盖 input assembly、ledger refs、accepted / rejected finding refs、sourceRefs、quality gate、repair 和 missing-link reasons，不做 prompt/runtime 优化、不伪造质量分，符合 Wave 3A producer 职责。
- 需由 Wave 3B 验证的风险：当前实际 process event 形态是 nested `metadata.pcvNodeEvidence`，总控复核发现跨仓库 test 必须证明 `Alembic` 能消费该 nested evidence 或精确回填仍缺的 extraction path；此风险已写入 `AlembicTest` Test-11 验收标准，不阻塞代码侧验收。

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档和 `AlembicAgent/AGENTS.md`。
- 开始执行前先明确声明当前窗口定位、目标仓库职责、本轮任务职责，以及本仓库明确不承担的职责。

### PCVM-P3A-ALEMBIC-N9-OBSERVABILITY-CARRY：N9 job-level observability carry

窗口：`Alembic`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 21:10 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 21:35 CST

状态：已完成

阶段目标：

- 让 Alembic job / daemon 侧稳定承载 N9 node linkage，使 PCV scorecard 能从 job process event、artifactRefs、trace envelope、llm metrics 和 artifact read API 找到同一个 N9 节点证据。
- 在真实 Agent 字段尚未存在或缺失时，输出精确 missing-link reason，继续合规保持 `blocked-by-observability-gap`，不得伪造 score。
- 为 Wave 3B `AlembicTest` 最小 test-mode 验证提供可读取的 artifact / trace / metrics / source-ref 证据入口。

主线动作：

- 先读取本 workspace `AGENTS.md`、`docs/workspace/index.md`、本文档，以及 `Alembic/AGENTS.md`；开工前声明当前窗口是 `Alembic`，本轮职责是 job-level observability carry，不是 Agent prompt 优化或 Dashboard UI。
- 复核现有 producer 链路：`DaemonJobRunner`、`BootstrapProcessEvents`、`JobProcessEventArtifacts`、job events / artifacts HTTP routes、trace envelope、`llmMetrics` 和 artifactRef 生成 / 读取路径。
- 将 N9 node identity 与 artifactRefs、trace envelope、metrics、sourceRefs / report refs 稳定关联；若消费 `AlembicAgent` 新字段，需要在回填中明确依赖其提交 hash 和字段语义，不得临时猜字段。
- 失败 / 缺字段时写出可诊断事件或 missing-link metadata，能区分 artifact 缺失、trace 缺失、metrics 缺失、source-ref 缺失、node identity 缺失。
- 保持现有 artifact redaction、job API 兼容和 Dashboard 现有消费不破坏；本轮不要求 Dashboard 新 UI。

合并 TODO：

- `GTODO-2026-05-25-003`
- `PCVM-TODO-4`

明确不包含：

- 不修改 `AlembicAgent` prompt/runtime 策略。
- 不做 Dashboard UI / comparison drawer。
- 不恢复内部 `skills/progressive-chain-validation` submodule 或 workflow checkout。
- 不跑 full cold-start / rescan，不修改真实测试项目。
- 不新增 `AlembicCore` schema，除非实现中证明已有稳定跨包 consumer，届时只回填建议并保持本包不阻塞。

下一处真实阻塞点：

- `AlembicTest` 需要等待 `AlembicAgent` evidence producer 和 `Alembic` job-level carry 都回填后，才能验证 N9 scorecard 是否从 `blocked-by-observability-gap` 进入真实 baseline，或至少精确定位剩余缺口。

阻塞点之前还能做：

- 本包内可以完成 Alembic 侧现有 artifact / trace / metrics carry、missing-link metadata、最小 unit / route 验证和回填文档。

验证命令：

- 根据 `Alembic/AGENTS.md` 和实际改动选择最小相关 unit / typecheck / lint。
- 建议覆盖受影响的 daemon job、process event artifact、jobs route / artifact read API、trace / metrics 相关测试；若命令不同，以仓库实际 package scripts 为准并回填原因。

回填要求：

- 完成范围：
- 提交 hash：
- 验证命令和结果：
- N9 artifact / trace / metrics / source-ref linkage 字段：
- 与 `AlembicAgent` evidence producer 的依赖或消费说明：
- missing-link metadata / diagnostics 语义：
- 是否影响 Dashboard / job API 兼容：
- 是否需要 `AlembicCore` 共享 schema：
- 遗留风险：
- 下一步建议：

执行回填（2026-05-25 21:35 CST）：

- 完成范围：`Alembic` 已新增 `lib/daemon/PcvObservabilityLinkage.ts`，并在 `lib/daemon/DaemonJobRunner.ts` 的 bootstrap process event drafts 写入链路中挂载 N9 observability carry；`test/unit/DaemonJobRunner.test.ts` 增加 linked 与 missing-link 两类覆盖。
- 提交 hash：`647a42fc9e499fc9bbbd166e1b9db2a9c96f99f9`。
- 验证命令和结果：`npm run test:unit -- DaemonJobRunner.test.ts BootstrapProcessEvents.test.ts JobsRoute.test.ts` 通过，3 files / 28 tests passed；`npm run check` 通过；`git diff --check` 通过。
- N9 artifact / trace / metrics / source-ref linkage 字段：`metadata.pcvN9Observability`、`metadata.pcvObservability.n9`、`metadata.traceEnvelope.pcvNodeId/nodeId/chainNodeId/jobId/artifactRefs/metricsPath/sourceRefs/traceId`。
- 与 `AlembicAgent` evidence producer 的依赖或消费说明：本提交不依赖新的 `AlembicAgent` commit；若 Agent 显式发出 `pcvNodeId` / `nodeId` / `chainNodeId`、`llmMetrics`、`sourceRefs`、`traceEnvelope.correlationId` / `traceId`，Alembic 会优先使用 explicit identity；否则只按 host stage profile 输出可诊断 gap。
- missing-link metadata / diagnostics 语义：缺失时保持 `linkageStatus=blocked-by-observability-gap`，区分 `artifact_missing`、`trace_id_missing`、`metrics_missing`、`source_ref_missing`、`node_identity_missing`，并写入 `firstFix`。
- 是否影响 Dashboard / job API 兼容：不新增 route，不修改 artifact read API，不要求 Dashboard UI；字段经现有 job process event developer view metadata 暴露。
- 是否需要 `AlembicCore` 共享 schema：本轮不需要；若 `AlembicAgent` 与 `AlembicTest` 后续证明需要跨包稳定 schema，再由总控评估下沉。
- 遗留风险：解除真实 N9 gap 仍依赖 `AlembicAgent` 发出 node-local evidence；Host stage profile carry 只能帮助定位缺口，不能替代质量分。
- 下一步建议：等待 `AlembicAgent` 回填 explicit N9 evidence producer 后，创建 `AlembicTest` Wave 3B 最小 test-mode 验证单。

总控复核（2026-05-25 21:55 CST）：

- 代码侧验收结论：通过，可进入 Wave 3B `AlembicTest` 最小 test-mode 验证。
- 复核证据：已读取回填文档 [../../Alembic/progressive-chain-validation-n9-observability-linkage-2026-05-25.md](../../Alembic/progressive-chain-validation-n9-observability-linkage-2026-05-25.md)；`git -C Alembic status --short --branch` 显示 `main...origin/main [ahead 1]` 且工作区 clean；`git -C Alembic show --stat --oneline HEAD` 确认 commit `647a42fc9e499fc9bbbd166e1b9db2a9c96f99f9` 只新增 daemon carry、`DaemonJobRunner` wiring 和 unit 覆盖；`git -C Alembic diff --check HEAD^ HEAD` 通过。
- 功能完整性判断：`Alembic` 已把 N9 job-level carry 挂到 process event metadata、`pcvObservability.n9` 和 trace envelope，并覆盖 `linked` 与 `blocked-by-observability-gap` 两类 unit 路径；缺 artifact / trace / metrics / sourceRef 时给出 missing-link reason 和 `firstFix`，不新增 API、不破坏 artifact read path、不要求 Dashboard UI。
- 需由 Wave 3B 验证的风险：`Alembic` 当前显式 identity / sourceRefs 读取以顶层 metadata 和 trace envelope 为主，`AlembicAgent` 新产物以 nested `metadata.pcvNodeEvidence` 为主；Test-11 必须用真实或等价最小 event shape 验证 nested evidence 是否贯通，若失败则归口返修。

### PCVM-P3B-ALEMBICTEST-N9-LINKAGE-MINIMAL：N9 linkage minimal test-mode verification

窗口：`AlembicTest`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 21:55 CST

状态：已回填，未通过；失败归口 `Alembic` consumer extraction

阶段目标：

- 最小 test-mode 验证 `AlembicAgent` node-local producer 与 `Alembic` job-level carry 是否能形成同一个 N9 节点证据链。
- 覆盖真实或等价 process event shape，特别是 `AlembicAgent` 当前 nested `metadata.pcvNodeEvidence` 与 `Alembic` carry 的消费关系。
- 判断 N9 PCV scorecard 是否能从 `blocked-by-observability-gap` 进入真实 baseline；若仍 blocked，必须输出精确 missing-link reason 和归属窗口。

主线动作：

- 先读取本 workspace `AGENTS.md`、`docs/workspace/index.md`、本文档、`docs/workspace/current/alembic-test-exchange.md` 和 `AlembicTest/AGENTS.md`；开工前声明当前窗口是 `AlembicTest`，本轮只做最小 test-mode 验证，不是产品实现。
- 读取 `AlembicAgent` commit `7ab94575ed9b475dc57253c88738e1f061a3c547` 和 `Alembic` commit `647a42fc9e499fc9bbbd166e1b9db2a9c96f99f9` 的回填字段。
- 用 AlembicTest fixture / probe 证明：Agent runtime evidence 中 `inputAssembly`、`ledgerRefs`、`findingRefs`、`sourceRefs`、`qualityGate` 能进入 Alembic job process event / artifact / trace / metrics 读取路径，或精确报告未贯通的字段。
- 优先验证 nested `metadata.pcvNodeEvidence`；如果测试只能通过顶层 `sourceRefs` / `llmMetrics`，必须额外说明 nested Agent evidence 尚未被 Alembic carry 消费。
- 不跑 full cold-start / rescan，不操作 BiliDili 业务代码，不修改产品源码。

合并 TODO：

- `GTODO-2026-05-25-003`
- `PCVM-TODO-3`
- `PCVM-TODO-4`

依赖前提：

- `AlembicAgent` P3A 总控代码侧验收通过：commit `7ab94575ed9b475dc57253c88738e1f061a3c547`。
- `Alembic` P3A 总控代码侧验收通过：commit `647a42fc9e499fc9bbbd166e1b9db2a9c96f99f9`。
- PCV source、consumer cleanup 和 Test-10 均已通过总控验收。

下一处真实阻塞点：

- Wave 4 Agent / LLM before-after 优化不能启动，直到 Test-11 证明 N9 baseline evidence chain 已真实可读，或回填精确剩余缺口并返修对应源仓库。

阻塞点之前还能做：

- AlembicTest 可独立创建 / 复用最小 test-mode probe、fixture、JSON evidence 和报告，不需要等待其它窗口。

验证命令：

- 由 `AlembicTest` 根据自身 AGENTS 和测试策略执行；建议新增或复用最小 PCV N9 observability linkage probe，保留语法 / help / check、fixture generation、consumer field assertions 和 git status 证据。

回填要求：

- 测试结论：
- 执行范围：
- 使用配置：
- fixture / JSON evidence / report / plan 路径：
- AlembicAgent commit / Alembic commit / PCV source commit：
- Agent nested `pcvNodeEvidence` 字段读取结果：
- Alembic job-level `pcvN9Observability` / `traceEnvelope` / artifact API 结果：
- N9 scorecard verdict：`linked` / `blocked-by-observability-gap` / `阻塞`：
- 若 blocked，missing-link reason 和建议归属窗口：
- 真实项目是否干净：
- 遗留风险：
- 下一步建议：

保存位置：

- 回填到 `docs/workspace/current/alembic-test-exchange.md` 的 `Test-2026-05-25-11`。

明确不包含：

- 不修改 `AlembicAgent`、`Alembic`、`AlembicCore`、`AlembicDashboard`、`AlembicPlugin` 或真实测试项目产品源码。
- 不跑 full cold-start / rescan。
- 不做 Agent prompt / runtime 优化，不做 Dashboard UI。
- 不伪造质量分；证据不足时必须输出 `blocked-by-observability-gap` 或阻塞归口。

执行回填（2026-05-25 22:14 CST）：

- 测试结论：未通过。`AlembicAgent` nested `metadata.pcvNodeEvidence` 可读且字段完整；`Alembic` top-level control event 可 `linked`；但 nested-only event 被 carry 后 `sourceRefs=[]`、`linkageStatus=blocked-by-observability-gap`、`missingLinkReasons=["source_ref_missing"]`。
- 执行范围：只做最小 test-mode probe / fixture；未跑 full cold-start / rescan；未操作 BiliDili 业务代码；未修改产品源码。
- 使用配置：`AlembicTest/scripts/probe-pcv-n9-observability-linkage.mjs`；`AlembicAgent` commit `7ab94575ed9b475dc57253c88738e1f061a3c547`；`Alembic` commit `647a42fc9e499fc9bbbd166e1b9db2a9c96f99f9`；PCV source commit `badbf0aa23bbaaff2cf185491a6785a61b74c1d8`。
- fixture / JSON evidence / report / plan 路径：generated fixture test `AlembicTest/tmp/pcv-n9-observability-linkage.generated.test.ts`；fixture JSON `AlembicTest/tmp/pcv-n9-observability-linkage-fixture.json`；JSON evidence `AlembicTest/tmp/pcv-n9-observability-linkage.json`；plan `AlembicTest/tmp/pcv-n9-observability-linkage-plan.md`；报告 [../../../AlembicTest/docs/pcv-n9-observability-linkage-minimal-2026-05-25.md](../../../AlembicTest/docs/pcv-n9-observability-linkage-minimal-2026-05-25.md)。
- nested evidence 读取结果：`nodeId=N9-agent-analyze-quality`；`inputAssemblyRef`、`ledgerRefs`、`acceptedFindingRefs`、`qualityGate`、`sourceRefs=["src/index.ts:42"]` 均存在；nested producer 侧 `missingLinkReasons=[]`。
- Alembic carry 结果：nested-only carry 保留 artifact refs、trace id、metrics path，但未读取 nested `sourceRefs`，`nodeIdentitySource=host-stage-profile`；top-level control event 在顶层 `sourceRefs` + `traceEnvelope.chainNodeId` 下可 `linked`。
- N9 scorecard verdict：`blocked-by-observability-gap`。
- missing-link reason / 建议归属：`source_ref_missing`；建议 `Alembic` 在 `lib/daemon/PcvObservabilityLinkage.ts` 消费 nested `metadata.pcvNodeEvidence.nodeId/chainNodeId/sourceRefs`。
- 真实项目是否干净：`AlembicAgent`、`Alembic`、`progressive-chain-validation`、`BiliDili` 工作区 clean；`AlembicAgent`、`Alembic`、PCV source 均保留已知 `[ahead 1]` 状态。
- 验证命令 / 结果：`node --check AlembicTest/scripts/probe-pcv-n9-observability-linkage.mjs` 通过；`node AlembicTest/scripts/probe-pcv-n9-observability-linkage.mjs --help` 通过；`npm --prefix AlembicTest run check` 通过；主 probe 按预期 exit code 1 并写出 `fail-nested-evidence-not-consumed` failure evidence，内部 targeted product tests 与 generated Vitest fixture 均通过。
- 遗留风险：仅覆盖最小 fixture，未跑 full cold-start / rescan；Wave 4 Agent / LLM 优化仍需等待 Alembic consumer extraction 返修和 Test-11 重跑通过。

总控验收（2026-05-25 22:26 CST）：

- 验收结论：测试证据有效，测试结果按“未通过”处理；失败归口 `Alembic` consumer extraction。
- 证据有效性：测试报告、JSON evidence、fixture、generated Vitest 和命令结果均能复现同一事实：`AlembicAgent` nested producer evidence 字段完整，但 `Alembic` nested-only carry 未消费 nested `sourceRefs`。
- 不阻塞点：`AlembicTest` 自身未提交 probe / 报告资产不作为阻塞；产品仓库与真实项目工作区干净。
- 进入下一步：创建 Wave 3C `PCVM-P3C-ALEMBIC-NESTED-EVIDENCE-CONSUMER-EXTRACTION`，先修 `Alembic/lib/daemon/PcvObservabilityLinkage.ts`，再由 `AlembicTest` 重跑 Test-11 同一 probe。

### PCVM-P3C-ALEMBIC-NESTED-EVIDENCE-CONSUMER-EXTRACTION

窗口：`Alembic`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 22:26 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 22:36 CST

状态：总控验收通过

阶段目标：

- 解除 Test-11 的最小真实阻塞：`Alembic` job-level carry 必须消费 `AlembicAgent` 当前真实 / 等价 event shape 中的 nested `metadata.pcvNodeEvidence.nodeId/chainNodeId/sourceRefs`。
- 让 nested-only event 在具备 artifactRefs、traceId、metricsPath 和 sourceRefs 时进入 `linked`，而不是继续 `blocked-by-observability-gap` / `source_ref_missing`。
- 保留现有顶层 metadata / trace envelope fallback，不改变 Test-11 已证明可用的 top-level control event 行为。

主线动作：

- 先读取本 workspace `AGENTS.md`、`docs/workspace/index.md`、本文档，以及 `Alembic/AGENTS.md`；开始前声明当前窗口是 `Alembic`，本轮只做 daemon job-level carry consumer extraction 返修，不做 Agent producer、不做 Dashboard UI、不跑 full cold-start。
- 读取 Test-11 报告 [../../../AlembicTest/docs/pcv-n9-observability-linkage-minimal-2026-05-25.md](../../../AlembicTest/docs/pcv-n9-observability-linkage-minimal-2026-05-25.md) 和 JSON evidence `AlembicTest/tmp/pcv-n9-observability-linkage.json`。
- 在 `Alembic/lib/daemon/PcvObservabilityLinkage.ts` 中优先或等价读取 nested `metadata.pcvNodeEvidence.nodeId` / `chainNodeId` / `sourceRefs` / `referencedFiles`，再 fallback 到现有顶层 metadata / trace envelope / host-stage inference。
- 补 nested-only unit，明确断言 nested `sourceRefs=["src/index.ts:42"]` 进入 carry evidence links，`missingLinkReasons=[]`，`linkageStatus=linked`。
- 保持缺字段时输出精确 `missingLinkReasons`，不得为了通过 scorecard 伪造 sourceRefs 或质量分。
- 回填 Alembic 提交 hash、修改范围、验证命令、nested-only unit 结果、对 Test-11 重跑的建议和遗留风险。

合并 TODO：

- `GTODO-2026-05-25-003`
- `PCVM-TODO-4`

依赖前提：

- Test-11 已由总控验收为有效未通过，失败归口 `Alembic`。
- `AlembicAgent` producer 不返修；Test-11 已证明 nested evidence 可读且字段完整。

下一处真实阻塞点：

- `Alembic` 回填前，`AlembicTest` 不能重跑通过 Test-11；Wave 4 Agent / LLM before-after 优化不能启动。

阻塞点之前还能做：

- `Alembic` 可以独立完成 nested consumer extraction 和 unit 验证，不需要等待 `AlembicAgent`、`AlembicCore`、Dashboard 或 Plugin。

验证命令：

- `npm run test:unit -- DaemonJobRunner.test.ts`
- 目标新增 / 修改 unit 对 nested-only `metadata.pcvNodeEvidence` 的断言必须通过。
- `npm run check`
- `git diff --check`

回填要求：

- 完成范围：
- 提交 hash：
- 修改文件：
- nested `metadata.pcvNodeEvidence` 消费策略：
- nested-only unit 结果：
- 验证命令 / 结果：
- 是否保持 top-level metadata / trace envelope fallback：
- 遗留风险：
- 下一步建议：是否可派 `AlembicTest` 重跑 `Test-2026-05-25-11` 同一 probe。

执行回填（2026-05-25 22:35 CST）：

- 完成范围：`Alembic` 已修复 `lib/daemon/PcvObservabilityLinkage.ts` 对 nested `metadata.pcvNodeEvidence.nodeId/chainNodeId/sourceRefs/referencedFiles` 的消费，并在 `test/unit/DaemonJobRunner.test.ts` 补 nested-only unit。
- 提交 hash：`ae9531ac3315a4491e22e3df156cb05e13fc0879`。
- 修改文件：`lib/daemon/PcvObservabilityLinkage.ts`、`test/unit/DaemonJobRunner.test.ts`。
- nested `metadata.pcvNodeEvidence` 消费策略：N9 explicit identity candidates 现在同时包含顶层 metadata、`metadata.pcvNode`、nested `metadata.pcvNodeEvidence` 和 trace envelope；source refs 收集合并顶层与 nested `sourceRefs` / `referencedFiles` / findings source refs，并保持原去重逻辑；缺字段时仍输出精确 `missingLinkReasons`。
- nested-only unit 结果：新增 `consumes nested PCV N9 evidence without top-level source refs`，断言 nested `sourceRefs=["src/index.ts:42"]` 进入 carry evidence links，`missingLinkReasons=[]`、`firstFix=[]`、`linkageStatus=linked`、`nodeIdentitySource=agent-explicit`。
- 验证命令 / 结果：`npm run test:unit -- DaemonJobRunner.test.ts` 通过，1 file / 9 tests passed；`npm run check` 通过；`git diff --check HEAD^ HEAD` 通过。
- 是否保持 top-level metadata / trace envelope fallback：保持；原 top-level metadata、`metadata.pcvNode`、trace envelope 和 host-stage fallback 仍保留。
- 遗留风险：本轮未跑 full cold-start / rescan，也未直接执行 `AlembicTest` probe；真实跨仓库验收仍需 `AlembicTest` 重跑 Test-11 同一 probe。
- 下一步建议：可派 `AlembicTest` 重跑 `Test-2026-05-25-11 / PCVM-P3B-N9-Observability-Linkage-Minimal` 同一 probe；重跑通过后再启动 Wave 4 Agent / LLM before-after 优化。

总控验收（2026-05-25 22:36 CST）：

- 验收结论：通过。`Alembic` commit `ae9531ac3315a4491e22e3df156cb05e13fc0879` 精确修复 Test-11 指向的 nested evidence consumer extraction 缺口。
- 证据：回填文档记录 `npm run test:unit -- DaemonJobRunner.test.ts`、`npm run check`、`git diff --check HEAD^ HEAD` 均通过；总控复核 `git -C Alembic diff --check HEAD^ HEAD` 通过，并确认 `PcvObservabilityLinkage.ts` 与 `DaemonJobRunner.test.ts` 均包含 nested `pcvNodeEvidence` identity / sourceRefs 消费和 nested-only unit。
- 节奏判断：这类已定位源码缺口已由源仓库先修复，不再继续让 `AlembicTest` 空跑；现在可以派 `AlembicTest` 做修复后的独立复测。

明确不包含：

- 不修改 `AlembicAgent` producer。
- 不修改 `AlembicCore` schema，除非返修过程中发现本地无法表达的共享 contract 阻塞；若发生需回填阻塞，不自行扩大范围。
- 不做 Dashboard UI / comparison 展示。
- 不跑 full cold-start / rescan。
- 不修改 `AlembicPlugin`、PCV source 或真实测试项目。

### PCVM-P3D-ALEMBICTEST-N9-LINKAGE-RERUN

窗口：`AlembicTest`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 22:36 CST

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-25 23:00 CST

状态：总控验收通过

阶段目标：

- 重跑 `Test-2026-05-25-11 / PCVM-P3B-N9-Observability-Linkage-Minimal` 同一最小 probe，验证 `Alembic` nested evidence consumer extraction 返修已经闭合。
- 证明 nested `metadata.pcvNodeEvidence.nodeId/chainNodeId/sourceRefs` 能进入 `metadata.pcvN9Observability.evidenceLinks.sourceRefs` 与 enriched `traceEnvelope.sourceRefs`，并让 verdict 从 `blocked-by-observability-gap/source_ref_missing` 进入 `linked`，或回填新的精确缺口。

主线动作：

- 先读取本 workspace `AGENTS.md`、`docs/workspace/index.md`、本文档、`docs/workspace/current/alembic-test-exchange.md` 和 `AlembicTest/AGENTS.md`；开始前声明当前窗口是 `AlembicTest`，本轮只做修复后最小复测，不是产品实现。
- 复用或重跑 `AlembicTest/scripts/probe-pcv-n9-observability-linkage.mjs` 同一 probe / fixture；目标 `Alembic` commit 切到 `ae9531ac3315a4491e22e3df156cb05e13fc0879`。
- 不跑 full cold-start / rescan，不修改产品源码或真实测试项目业务源码。

明确不包含：

- 不跑 full cold-start / rescan。
- 不修改 `AlembicAgent`、`Alembic`、`AlembicCore`、`AlembicDashboard`、`AlembicPlugin`、PCV source 或真实测试项目产品源码。
- 不做 Agent prompt / runtime 策略优化。
- 不做 Dashboard UI / comparison drawer。
- 不发布 npm package，不推送远端。

合并 TODO：

- `GTODO-2026-05-25-003`
- `PCVM-TODO-3`
- `PCVM-TODO-4`

依赖前提：

- `AlembicAgent` producer commit `7ab94575ed9b475dc57253c88738e1f061a3c547` 已被 Test-11 证明 nested evidence 可读。
- `Alembic` Wave 3C commit `ae9531ac3315a4491e22e3df156cb05e13fc0879` 已通过总控验收。

下一处真实阻塞点：

- Wave 4 Agent / LLM before-after 优化不能启动，直到 Test-11 重跑证明 N9 baseline evidence chain 已真实 linked，或回填新的精确剩余缺口并返修对应源仓库。

阻塞点之前还能做：

- `AlembicTest` 可以独立重跑同一最小 probe、fixture、JSON evidence 和报告；不需要其它源码仓库继续改动。

验证命令：

- 由 `AlembicTest` 根据自身 AGENTS 和测试策略执行；建议复用 Test-11 原命令组合，至少覆盖 probe 语法 / help、test harness check、主 probe、fixture / JSON evidence 和真实 git 状态收口。

回填要求：

- 重测结论：
- 执行范围：
- 使用配置：
- fixture / JSON evidence / report / plan 路径：
- Agent nested `pcvNodeEvidence` 字段读取结果：
- Alembic job-level carry / traceEnvelope / artifact API 结果：
- N9 scorecard verdict：
- missing-link reason / first fix / 建议归属窗口：
- 真实项目是否干净：
- 详细报告路径：
- 遗留风险和下一步建议：

执行回填（2026-05-25 22:58 CST）：

- 重测结论：通过。主 probe 输出 `conclusion=pass-linked`、`verdict=linked`、`nestedEvidenceConsumedByCarry=true`、`missingLinkReasons=[]`。
- 执行范围：只重跑最小 test-mode probe / fixture；未跑 full cold-start / rescan；未修改产品源码或 BiliDili 业务源码。为支持返修后 linked 记录，`AlembicTest` probe 的 generated fixture 断言已改为记录真实 carry verdict，不再硬编码上一轮失败形态。
- 使用配置：`AlembicTest/scripts/probe-pcv-n9-observability-linkage.mjs --expected-alembic-commit ae9531ac3315a4491e22e3df156cb05e13fc0879`，并使用独立 rerun 输出路径。
- fixture / JSON evidence / report / plan 路径：fixture `AlembicTest/tmp/pcv-n9-observability-linkage-rerun-fixture.json`；JSON evidence `AlembicTest/tmp/pcv-n9-observability-linkage-rerun.json`；generated test `AlembicTest/tmp/pcv-n9-observability-linkage-rerun.generated.test.ts`；generated config `AlembicTest/tmp/pcv-n9-observability-linkage-rerun.vitest.config.mjs`；plan `AlembicTest/tmp/pcv-n9-observability-linkage-rerun-plan.md`；报告 [../../../AlembicTest/docs/pcv-n9-observability-linkage-rerun-2026-05-25.md](../../../AlembicTest/docs/pcv-n9-observability-linkage-rerun-2026-05-25.md)。
- Agent nested `pcvNodeEvidence` 字段读取结果：`nodeId=N9-agent-analyze-quality`；`inputAssemblyRef`、`ledgerRefs`、`acceptedFindingRefs`、`qualityGate`、`sourceRefs` 均存在；`sourceRefs=["src/index.ts:42"]`；producer-side `missingLinkReasons=[]`。
- Alembic job-level carry / traceEnvelope / artifact API 结果：nested-only carry 为 `linkageStatus=linked`、`nodeIdentitySource=agent-explicit`、artifactRef `/api/v1/jobs/job_pcv_p3b/artifacts/llm-input-full-redacted-n9.md`、`traceId=trace-p3b`、`metricsPath=metadata.llmMetrics`、`sourceRefs=["src/index.ts:42"]`；top-level control carry 仍为 `linked`；artifact readback 由 probe 内部 `DaemonJobRunner.test.ts` 覆盖通过。
- N9 scorecard verdict：`linked`。
- missing-link reason / first fix / 建议归属窗口：无 missing-link reason；first fix 无；本 specific linkage gap 无需继续归口返修，`Alembic` Wave 3C 修复已被验证。
- 真实项目是否干净：`Alembic`、`AlembicAgent`、`progressive-chain-validation`、`BiliDili` 工作区均 clean；`Alembic` 为 `main...origin/main [ahead 2]`，`AlembicAgent` 为 `main...origin/main [ahead 1]`，PCV source 与 `BiliDili` 为 `main...origin/main`。
- 验证命令 / 结果：`node --check AlembicTest/scripts/probe-pcv-n9-observability-linkage.mjs` 通过；`node AlembicTest/scripts/probe-pcv-n9-observability-linkage.mjs --help` 通过；主 rerun probe 通过；probe 内部 `npm test -- AgentRuntime llm-input-layering evidence-recording-phase-chain`、`npm run test:unit -- DaemonJobRunner.test.ts` 和 generated Vitest fixture 均通过。
- 遗留风险：本轮仍是最小 test-mode fixture，未证明 full cold-start / rescan、live daemon artifact API 或 Dashboard comparison UI；package/runtime 发布链路不在本轮范围。
- 下一步建议：总控可验收 Wave 3D 并决定是否进入 Wave 4；若进入 Agent / LLM before-after 优化，应先定义 baseline comparison fixture 和验证范围。

总控验收（2026-05-25 23:00 CST）：

- 验收结论：通过。Test-11 rerun 证明 `Alembic` commit `ae9531ac3315a4491e22e3df156cb05e13fc0879` 已消费 nested `metadata.pcvNodeEvidence.sourceRefs`，N9 verdict 由上一轮 `blocked-by-observability-gap/source_ref_missing` 进入 `linked`。
- 证据：详细报告 [../../../AlembicTest/docs/pcv-n9-observability-linkage-rerun-2026-05-25.md](../../../AlembicTest/docs/pcv-n9-observability-linkage-rerun-2026-05-25.md)；JSON evidence `AlembicTest/tmp/pcv-n9-observability-linkage-rerun.json`；probe 输出 `conclusion=pass-linked`、`nestedEvidenceConsumedByCarry=true`、`missingLinkReasons=[]`、`verdict=linked`。
- 边界：本轮是最小 test-mode fixture，不包含 full cold-start / rescan、live daemon artifact API 或 Dashboard comparison UI；这些如果需要，应进入 Wave 4 范围裁决。
- 下一步：不自动派发新窗口。Wave 4 需要先定义 baseline comparison fixture、Agent / LLM before-after 优化范围和验证方式。

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GTODO-2026-05-25-003 | Wave 3D 总控验收通过，Wave 4 待裁决 | agent / llm optimization loop | P0 | PCV source / `AlembicPlugin` / `Alembic` / `AlembicAgent` / `AlembicTest` | 建立 PCV 节点级 baseline / scorecard / comparison，后续用同 fixture 反向优化 Agent / LLM 输入输出。 | 是 | Wave 3D `AlembicTest` 重跑 Test-11 已通过总控验收，nested evidence 已进入 `linked` baseline；等待总控裁决 Wave 4 范围。 | 总控 |
| PCVM-TODO-0 | 已完成 | source-of-truth / submodule | P0 | PCV source / `AlembicPlugin` / `Alembic` | 顶层 PCV canonical source 已拉出且 metrics contract 已实现；父仓库内部 submodule 删除 / 替换需完全清理内部 path ref。 | 是 | PCV source commit `badbf0aa23bbaaff2cf185491a6785a61b74c1d8`；`AlembicPlugin` 通过；`Alembic` workflow path ref P1A 已通过总控验收并经 AlembicTest 重测。 | 总控 |
| PCVM-TODO-1 | 已完成 | producer | P1 | PCV source | 更新 PCV skill / overlay / template 的 scorecard、baseline、comparison 输出点和同步路径。 | 是 | 已由 PCV source commit `badbf0aa23bbaaff2cf185491a6785a61b74c1d8` 完成。 | `progressive-chain-validation` |
| PCVM-TODO-2 | Agent producer 已验证，可读 | consumer fact | P1 | `AlembicAgent` | 确认 N9 analyze quality 的 fixture、quality gate 和 loss 数据来源；后续 Agent 优化必须先绑定真实 baseline / evidence。 | 是 | Test-11 读取 `metadata.pcvNodeEvidence` 成功，`sourceRefs=["src/index.ts:42"]`、input assembly、ledger 和 quality gate 均存在。 | 总控 |
| PCVM-TODO-3 | 总控验收通过 | 验证 | P1 | `AlembicTest` | 设计 N9 真实 baseline 的最小 test-mode 证据；后续 Agent 优化时再补真实 optimized-after。 | 是 | rerun evidence `AlembicTest/tmp/pcv-n9-observability-linkage-rerun.json` 输出 `pass-linked`，已由总控验收。 | 总控 |
| PCVM-TODO-4 | linked baseline 已建立 | 风险 / observability | P1 | `Alembic` / `AlembicAgent` / `AlembicCore` | 为 N9 producer 补 artifact / trace / metrics / source-ref node linkage；没有 linkage 时继续记录 `blocked-by-observability-gap`，不得伪造 score。 | 是 | `Alembic` commit `ae9531ac3315a4491e22e3df156cb05e13fc0879` 已被 rerun probe 证明消费 nested sourceRefs，verdict 为 `linked`。 | 总控 |
| PCVM-TODO-5 | 已回填 | 流程 / test policy | P1 | `AlembicTest` | 定义 AlembicTest 何时默认使用 PCV、何时可 opt out 并写明理由。 | 是 | Test-01 报告已回填 PCV 默认使用 / opt out 规则。 | `AlembicTest` |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `progressive-chain-validation` | 已完成 | 否 | Wave 0 source commit `badbf0aa23bbaaff2cf185491a6785a61b74c1d8` 已验收；当前不再发送 source 任务。 |
| `Alembic` | 已完成 | 否 | `PCVM-P3C-ALEMBIC-NESTED-EVIDENCE-CONSUMER-EXTRACTION` 已通过总控验收；commit `ae9531ac3315a4491e22e3df156cb05e13fc0879`。 |
| `AlembicCore` | 观察中 | 否 | Wave 3A 不先新增共享 schema；只有 `AlembicAgent` 与 `Alembic` 回填证明存在稳定跨包 contract 需求后再评估下沉。 |
| `AlembicAgent` | 已完成 | 否 | Test-11 已读取 nested producer evidence，字段完整；当前不归口返修。 |
| `AlembicDashboard` | 无任务 | 否 | 第一版不做 comparison UI。 |
| `AlembicPlugin` | 已完成 | 否 | Wave 1 总控验收通过；提交 `aa171f31734350ef49efaac56c34588b67f0d924` 已删除内部 PCV submodule。 |
| `AlembicTest` | 已完成 | 否 | Test-11 rerun 已通过总控验收，N9 verdict 为 `linked`。 |
| `BiliDili` | 无任务 | 否 | 不改真实 iOS 项目源码。 |

## 窗口分派

发送给：无

| 窗口 / 状态 | 任务 |
| --- | --- |
| `progressive-chain-validation`<br>已完成 | Wave 0 已验收；当前不发送。 |
| `Alembic`<br>已完成 | `PCVM-P3C-ALEMBIC-NESTED-EVIDENCE-CONSUMER-EXTRACTION` 已通过总控验收；commit `ae9531ac3315a4491e22e3df156cb05e13fc0879`。 |
| `AlembicCore`<br>观察中 | 当前不发送；只有 `AlembicAgent` / `Alembic` 回填证明需要稳定共享 schema 时再评估。 |
| `AlembicAgent`<br>已完成 | Test-11 已证明 nested producer evidence 可读且字段完整；当前不发送。 |
| `AlembicDashboard`<br>无任务 | 第一版不做 comparison UI。 |
| `AlembicPlugin`<br>已完成 | Wave 1 总控验收通过；提交 `aa171f31734350ef49efaac56c34588b67f0d924`。 |
| `AlembicTest`<br>已完成 | Test-11 rerun 已通过总控验收，N9 verdict 为 `linked`。 |
| `BiliDili`<br>无任务 | 不改真实项目源码。 |

## 可复制分派提示词

发送给：无

```text
当前无新的可复制分派提示词。Wave 3D 已通过总控验收；等待总控裁决 Wave 4 范围。
```

发送窗口：无。

观察 / 阻塞 / 无任务窗口：`AlembicCore` 观察是否需要共享 schema；`AlembicAgent` producer 已验证可读；`Alembic` 返修已完成并被 rerun 证明；`AlembicTest` 已完成；`AlembicDashboard`、`AlembicPlugin`、`BiliDili` 当前无任务。

## 测试交接

- 是否需要 `AlembicTest`：本轮已执行、回填并通过总控验收。
- 测试单：`Test-2026-05-25-11 / PCVM-P3B-N9-Observability-Linkage-Minimal` 已由总控验收为有效未通过、完成源仓库返修并完成 rerun；`Test-2026-05-25-10 / PCVM-P2-Canonical-Source-Baseline` 已通过总控验收，作为前置证据。
- 测试交流入口：[alembic-test-exchange.md](alembic-test-exchange.md)。
- 真实项目保护说明：Wave 0 不改真实测试项目；后续若用真实项目做 cold-start / rescan 验证，必须通过 `AlembicTest` 测试单执行。

## 回填区

- 2026-05-25 23:00 CST：总控验收 Wave 3D 通过。已读取 `AlembicTest` rerun 报告和 JSON evidence，确认 `conclusion=pass-linked`、`verdict=linked`、`nestedEvidenceConsumedByCarry=true`、`missingLinkReasons=[]`；`Alembic`、`AlembicAgent`、PCV source 和 `BiliDili` 工作区 clean。当前不自动派发 Wave 4；下一步先裁决 Agent / LLM before-after 优化范围、baseline comparison fixture 和验证方式。
- 2026-05-25 22:58 CST：`AlembicTest` 回填 `PCVM-P3D-ALEMBICTEST-N9-LINKAGE-RERUN`，详细报告见 [../../../AlembicTest/docs/pcv-n9-observability-linkage-rerun-2026-05-25.md](../../../AlembicTest/docs/pcv-n9-observability-linkage-rerun-2026-05-25.md)。重测结论通过：同一 probe 目标 `Alembic` commit `ae9531ac3315a4491e22e3df156cb05e13fc0879` 输出 `conclusion=pass-linked`、`verdict=linked`、`nestedEvidenceConsumedByCarry=true`、`missingLinkReasons=[]`。JSON evidence `AlembicTest/tmp/pcv-n9-observability-linkage-rerun.json`，fixture `AlembicTest/tmp/pcv-n9-observability-linkage-rerun-fixture.json`，plan `AlembicTest/tmp/pcv-n9-observability-linkage-rerun-plan.md`。Agent nested evidence 继续可读，`sourceRefs=["src/index.ts:42"]`；Alembic nested-only carry 已写出 `sourceRefs=["src/index.ts:42"]`、`nodeIdentitySource=agent-explicit`、artifact / trace / metrics 链路完整。`Alembic`、`AlembicAgent`、PCV source 和 `BiliDili` 工作区 clean；本轮未跑 full cold-start / rescan，未修改产品源码。下一步建议总控验收 Wave 3D 并裁决是否进入 Wave 4。
- 2026-05-25 22:36 CST：总控验收 `Alembic` Wave 3C 返修通过。回填文档记录 targeted unit、`npm run check` 和 `git diff --check HEAD^ HEAD` 均通过；总控复核 `git -C Alembic diff --check HEAD^ HEAD` 与 nested `pcvNodeEvidence` 字段扫描通过。当前按用户测试节奏规则：已定位源码缺口先由源仓库修复，修复后再派 `AlembicTest` 做独立复测；现发送给 `AlembicTest` 重跑 Test-11 同一 probe。
- 2026-05-25 22:36 CST：用户确认测试相关可以交给 `AlembicTest`，但总控必须控制节奏：如果派发测试前已经看到具体源码缺口，且不需要真实项目 / 特殊测试环境，应先直接派归属源码仓库修复，再让 `AlembicTest` 做需要环境的验证或修复后复测。当前 Wave 3C / 3D 正是该节奏：Test-11 已定位 `Alembic` nested consumer extraction 缺口，`Alembic` 已先完成返修，现在再派 `AlembicTest` 重跑同一 probe。
- 2026-05-25 22:35 CST：`Alembic` 回填 `PCVM-P3C-ALEMBIC-NESTED-EVIDENCE-CONSUMER-EXTRACTION`，提交 `ae9531ac3315a4491e22e3df156cb05e13fc0879`（`fix: consume nested pcv n9 evidence`）。完成 `lib/daemon/PcvObservabilityLinkage.ts` nested `metadata.pcvNodeEvidence.nodeId/chainNodeId/sourceRefs/referencedFiles` 消费和 `test/unit/DaemonJobRunner.test.ts` nested-only unit；验证 `npm run test:unit -- DaemonJobRunner.test.ts`、`npm run check`、`git diff --check HEAD^ HEAD` 均通过。建议总控验收后派 `AlembicTest` 重跑 Test-11 同一 probe。
- 2026-05-25 22:26 CST：总控验收 `AlembicTest` Test-11 证据有效，测试结果按“未通过”处理；失败归口 `Alembic` consumer extraction。证据显示 Agent nested `metadata.pcvNodeEvidence.sourceRefs=["src/index.ts:42"]` 可读，而 `Alembic` nested-only carry 输出 `sourceRefs=[]` / `source_ref_missing`；top-level control event 可 `linked`，说明应最小修 `Alembic/lib/daemon/PcvObservabilityLinkage.ts` 消费 nested evidence。当前进入 Wave 3C，发送给 `Alembic` 执行 `PCVM-P3C-ALEMBIC-NESTED-EVIDENCE-CONSUMER-EXTRACTION`；Wave 4 暂不启动。
- 2026-05-25 22:14 CST：`AlembicTest` 回填 `Test-2026-05-25-11 / PCVM-P3B-N9-Observability-Linkage-Minimal`，详细报告见 [../../../AlembicTest/docs/pcv-n9-observability-linkage-minimal-2026-05-25.md](../../../AlembicTest/docs/pcv-n9-observability-linkage-minimal-2026-05-25.md)。结论未通过：`AlembicAgent` nested `metadata.pcvNodeEvidence` 可读，`nodeId=N9-agent-analyze-quality`、input assembly、ledger、accepted findings、quality gate 和 `sourceRefs=["src/index.ts:42"]` 均存在；但 `Alembic` nested-only carry 输出 `sourceRefs=[]`、`linkageStatus=blocked-by-observability-gap`、`missingLinkReasons=["source_ref_missing"]`。top-level control event 可 `linked`，说明失败不是 carry 整体不可用，而是 `Alembic` consumer extraction 尚未消费 nested `metadata.pcvNodeEvidence.sourceRefs`。JSON evidence `AlembicTest/tmp/pcv-n9-observability-linkage.json`，fixture `AlembicTest/tmp/pcv-n9-observability-linkage-fixture.json`，plan `AlembicTest/tmp/pcv-n9-observability-linkage-plan.md`；`AlembicAgent`、`Alembic`、PCV source 和 `BiliDili` 工作区 clean。下一步建议总控派 `Alembic` 最小返修 `lib/daemon/PcvObservabilityLinkage.ts`，返修后由 `AlembicTest` 重跑同一 probe；Wave 4 暂不启动。
- 2026-05-25 21:55 CST：总控验收 `AlembicAgent` 与 `Alembic` Wave 3A 代码侧通过。独立复核 `AlembicAgent` commit `7ab94575ed9b475dc57253c88738e1f061a3c547` 和 `Alembic` commit `647a42fc9e499fc9bbbd166e1b9db2a9c96f99f9` 的回填文档、工作区 clean 状态、`git diff --check HEAD^ HEAD` 和关键字段扫描；确认两侧分别完成 node-local evidence producer 与 job-level carry。总控同时发现交界风险：Agent 实际 process event 形态主要是 nested `metadata.pcvNodeEvidence`，Alembic carry 当前主要消费顶层 metadata / traceEnvelope；已将该风险写入 `Test-2026-05-25-11` 验收标准，当前发送给 `AlembicTest` 做 Wave 3B 最小 test-mode 验证。
- 2026-05-25 21:40 CST：`AlembicAgent` 回填 `PCVM-P3A-AGENT-N9-EVIDENCE-LINKAGE` 完成，记录见 [../../AlembicAgent/progressive-chain-validation-n9-observability-linkage-2026-05-25.md](../../AlembicAgent/progressive-chain-validation-n9-observability-linkage-2026-05-25.md)。提交 `7ab94575ed9b475dc57253c88738e1f061a3c547`（`feat: add pcv n9 evidence linkage`）新增 runtime `pcvNodeEvidence` producer、process event compact metadata、quality gate artifact linkage 和 targeted tests；验证 `npm run check`、targeted vitest、`npm run typecheck`、`npm run lint`、`git diff --check` 均通过。当前 Wave 3A 两侧均已回填，等待总控验收后创建 `AlembicTest` Wave 3B 最小 test-mode 验证单。
- 2026-05-25 21:10 CST：用户确认 Wave 3A 范围：只做 N9 producer observability linkage baseline，先打通 N9 的真实 artifact / trace / metrics / source-ref 证据链，不做 Agent prompt 优化、不做 Dashboard UI、不跑 full cold-start；先派 `AlembicAgent` + `Alembic`，`AlembicCore` 观察，完成后由 `AlembicTest` 做最小 test-mode 验证。总控已将当前状态切为 Wave 3A 待启动，发送给 `AlembicAgent` 与 `Alembic`。
- 2026-05-25 20:48 CST：`AlembicTest` 回填 `PCVM-P2R-ALEMBICTEST-CONSUMER-CLEANUP-RERUN`，详细报告见 [../../../AlembicTest/docs/pcv-consumer-cleanup-rerun-2026-05-25.md](../../../AlembicTest/docs/pcv-consumer-cleanup-rerun-2026-05-25.md)。重测结论通过，rerun probe 输出 `pass-source-baseline-with-scoring-blocked-by-observability-gap`，consumer cleanup passed 为 true；JSON evidence `AlembicTest/tmp/pcv-canonical-source-baseline-rerun.json`，plan fixture `AlembicTest/tmp/pcv-canonical-source-baseline-rerun-plan.md`。PCV source commit `badbf0aa23bbaaff2cf185491a6785a61b74c1d8`，`Alembic` commit `92bd976162fb9c1dbc19da1f8afef8756c976c27`，`AlembicPlugin` commit `aa171f31734350ef49efaac56c34588b67f0d924`；`git grep -n -- skills/progressive-chain-validation` 在 `Alembic` / `AlembicPlugin` 均无命中，gitlink 均无输出，真实项目工作区均 clean。N9 scorecard 字段仍完整，`observabilityGapVerdict.triggered=true`，未伪造质量分。遗留风险：真实 N9 artifact / trace / metric / source-ref linkage 仍需后续 producer 任务补齐。
- 2026-05-25 20:37 CST：总控验收 `PCVM-P1A-ALEMBIC-WORKFLOW-PCV-PATH-CLEANUP` 通过；独立复核 `git -C Alembic diff --check HEAD^ HEAD` 通过，`git -C Alembic grep -n -- skills/progressive-chain-validation` 无命中，`rg "skills/progressive-chain-validation|progressive-chain-validation|PCV"` 仅剩 `test/unit/SkillAdapter.test.ts` 的 query 字符串，`git -C Alembic submodule status` 只剩 `vendor/AlembicCore` 与 `vendor/AlembicDashboard`。当前派 `AlembicTest` 重跑最小 cleanup probe。
- 2026-05-25 20:29 CST：`Alembic` 回填 `PCVM-P1A-ALEMBIC-WORKFLOW-PCV-PATH-CLEANUP` 完成，提交 `92bd976162fb9c1dbc19da1f8afef8756c976c27`（`ci: remove pcv workflow checkout`），记录见 [../../Alembic/progressive-chain-validation-workflow-cleanup-2026-05-25.md](../../Alembic/progressive-chain-validation-workflow-cleanup-2026-05-25.md)。完成 `.github/workflows/ci.yml` 与 `.github/workflows/release.yml` 中旧 `Alembic/skills/progressive-chain-validation` checkout 步骤删除；`git grep -n -- "skills/progressive-chain-validation"` 无命中；剩余 `progressive-chain-validation` 只在 `test/unit/SkillAdapter.test.ts` query 字符串中。验证 `git diff --check`、workflow YAML parse、`npm run release:package-guard`、`npm run test:unit -- SkillAdapter.test.ts`、`npm run lint`、`npm run lint:repo-boundary` 均通过。
- 2026-05-25 20:20 CST：`AlembicTest` 回填 Test-2026-05-25-10 / PCVM-P2-Canonical-Source-Baseline，结论未通过，报告见 [../../../AlembicTest/docs/pcv-canonical-source-baseline-2026-05-25.md](../../../AlembicTest/docs/pcv-canonical-source-baseline-2026-05-25.md)。PCV source commit `badbf0aa23bbaaff2cf185491a6785a61b74c1d8` 可用，metrics contract / plan template / N9 baseline example 字段完整；N9 fixture 写出 `usefulUnit`、`qualityGate`、`stageLoss`、`baseline`、`evidenceLinks`、`verdict`，并按缺少真实 artifact / trace / metrics / source-ref node 关联触发 `blocked-by-observability-gap`，未伪造质量分。`AlembicPlugin` consumer cleanup 通过；`Alembic` `.gitmodules` / submodule / gitlink 已清理，但 `.github/workflows/ci.yml:182` 与 `.github/workflows/release.yml:37` 仍引用 `path: Alembic/skills/progressive-chain-validation`。真实项目工作区均 clean。下一步需总控派 `Alembic` 最小返修 workflow 残留，再派 `AlembicTest` 重跑本 probe。
- 2026-05-25 19:57 CST：用户回填 `Alembic` 与 `AlembicPlugin` 完成。总控验收通过：`Alembic` commit `d99d66d0af14fe6e8a51e683d963028ec9d0679a` 与 `AlembicPlugin` commit `aa171f31734350ef49efaac56c34588b67f0d924` 均只删除 `.gitmodules` PCV 条目、`skills/progressive-chain-validation` gitlink 和内部 source fixture test；两个仓库 `status` 均为 `main...origin/main [ahead 1]` 且工作区干净；`ls-files -s skills/progressive-chain-validation` 无输出；`rg "skills/progressive-chain-validation"` 无命中；`diff --check HEAD^ HEAD` 通过。结论：Wave 1 consumer cleanup 完成，当前创建并发送 `AlembicTest` PCVM Test-01。
- 2026-05-25 19:48 CST：`AlembicPlugin` 回填 `PCVM-P1-PLUGIN-SUBMODULE-REMOVAL` 完成，提交 `aa171f31734350ef49efaac56c34588b67f0d924`（`chore: remove internal pcv submodule`）。完成 `.gitmodules` PCV 条目删除、`skills/progressive-chain-validation` gitlink 删除和内部 source fixture test `test/unit/progressive-chain-validation-skill.test.ts` 删除；`git submodule status` 仅剩 `plugins/alembic-codex` / `vendor/AlembicCore`，`rg -n "progressive-chain-validation|skills/progressive-chain-validation|PCV" . --glob '!node_modules/**'` 无命中，`git ls-files -s | rg "progressive-chain-validation|160000"` 仅剩两个合法 gitlink。验证 `git diff --check`、`npm run check`、`npm run test:unit`、`npm run verify:release-package-boundary` 均通过；随后由总控统一验收两边证据后进入 `AlembicTest` Wave 2。
- 2026-05-25 19:49 CST：`Alembic` 回填 `PCVM-P1-ALEMBIC-SUBMODULE-REMOVAL` 完成，提交 `d99d66d0af14fe6e8a51e683d963028ec9d0679a`（`chore: remove internal pcv submodule`），记录见 [../../Alembic/progressive-chain-validation-consumer-cleanup-2026-05-25.md](../../Alembic/progressive-chain-validation-consumer-cleanup-2026-05-25.md)。完成 `.gitmodules` PCV 条目删除、`skills/progressive-chain-validation` gitlink 删除和内部 source fixture test 删除；`git submodule status` 仅剩 `vendor/AlembicCore` / `vendor/AlembicDashboard`，`skills/progressive-chain-validation` 引用无命中。验证 `git diff --check`、`npm run test:unit -- SkillAdapter.test.ts`、`npm run typecheck`、`npm run lint`、`npm run lint:repo-boundary`、`npm run release:package-guard`、`npm run lint:consumer-core-imports`、`npm run lint:agent-extraction-boundary` 均通过。当前 `AlembicPlugin` 也已完成同类 cleanup，等待总控统一验收。
- 2026-05-25 19:40 CST：用户回填 `progressive-chain-validation` 完成。总控验收通过：PCV source commit `badbf0aa23bbaaff2cf185491a6785a61b74c1d8`（`Add PCV metrics contract`）修改 8 个文件，新增 `progressive-chain-validation/references/metrics-contract.md` 和 `examples/alembic-n9-analyze-quality-baseline.md`，同步更新 skill、plan template、cold-start / rescan overlay、plan quality standard 和 README consumer guidance。验收命令 `git -C progressive-chain-validation diff --check HEAD^ HEAD` 通过；工作区为 `main...origin/main [ahead 1]` 且干净。结论：Wave 0 已完成；Wave 1 初始窗口为 `Alembic` 与 `AlembicPlugin`，删除 / 替换内部 PCV submodule。未推送远端记录为后续发布 / 跨机同步风险，不阻塞当前 consumer cleanup。
- 2026-05-25 19:05 CST：按用户确认，将 `progressive-chain-validation` 拉出为 workspace 顶层真实仓库；远端为 `https://github.com/GxFn/progressive-chain-validation.git`，当前 hash `a6c371c8b123fc79f218d362cd6bae61a0679d61`。workspace `.gitignore` 已加入 `/progressive-chain-validation/`，避免误跟踪子仓库。当前 Wave 0 发送给 `progressive-chain-validation`；`Alembic` / `AlembicPlugin` 内部 submodule 删除进入 Wave 1。

<!-- workspace-sync
{
  "status": "Wave 3D 总控验收通过，Wave 4 待裁决",
  "indexPlanDescription": "PCV canonical source Wave 0、consumer cleanup Wave 1 和 AlembicTest Wave 2 均已通过总控验收；Wave 3A `Alembic` / `AlembicAgent` 代码侧已通过总控验收；Wave 3C `Alembic` nested evidence consumer extraction 已通过总控验收；Wave 3D `AlembicTest` rerun 已通过总控验收，nested evidence 进入 linked baseline；Wave 4 范围待裁决。",
  "indexStatusDescription": "PCVM Wave 3D 总控验收通过：`Alembic` commit ae9531ac3315a4491e22e3df156cb05e13fc0879 已让 nested `pcvNodeEvidence` sourceRefs 进入 job-level carry，N9 verdict 为 `linked`；Wave 4 范围待裁决。",
  "currentIndexType": "当前计划",
  "currentIndexDescription": "`GTODO-2026-05-25-003 / Progressive Chain Validation Metrics` Wave 3D 总控验收通过；Wave 4 范围待裁决。",
  "currentStatusSummary": "`GTODO-2026-05-25-003 / Progressive Chain Validation Metrics` Wave 3D 总控验收通过，同一 probe 证明 nested `pcvNodeEvidence.sourceRefs` carry 为 linked；Wave 4 范围待裁决。",
  "indexRows": [
    {
      "type": "PCVM 目标阶段确认",
      "doc": "docs/workspace/current/progressive-chain-validation-metrics-goal-stage-confirmation-2026-05-25.md",
      "status": "已确认",
      "description": "用户已确认 PCV 独立拉出；当前进入 Wave 0 source repo 开发路线。"
    },
    {
      "type": "PCVM 代码实现依赖调研",
      "doc": "docs/requirement-designs/progressive-chain-validation-metrics/code-implementation-dependency-research-2026-05-25.md",
      "status": "已完成",
      "description": "记录 PCV source repo、Alembic / Plugin submodule、artifact / trace / metrics、N9 analyze 和 AlembicTest probe 依赖事实。"
    },
    {
      "type": "PCVM Wave 0 source 验收",
      "doc": "docs/workspace/current/progressive-chain-validation-metrics-wave-0-2026-05-25.md",
      "status": "已验收",
      "description": "PCV source commit badbf0aa23bbaaff2cf185491a6785a61b74c1d8 已提供 metrics contract、N9 baseline example、template scorecard 和 consumer 删除建议。"
    },
    {
      "type": "PCVM Alembic consumer cleanup 回填",
      "doc": "docs/Alembic/progressive-chain-validation-consumer-cleanup-2026-05-25.md",
      "status": "总控验收通过，workflow 残留已拆分返修",
      "description": "`Alembic` 提交 d99d66d0af14fe6e8a51e683d963028ec9d0679a 已删除 gitlink / `.gitmodules` / fixture test；Test-01 发现的 CI / release workflow path ref 已进入独立 P1A 回填。"
    },
    {
      "type": "PCVM AlembicPlugin consumer cleanup 回填",
      "doc": "docs/workspace/current/progressive-chain-validation-metrics-wave-0-2026-05-25.md",
      "status": "总控验收通过",
      "description": "`AlembicPlugin` 提交 aa171f31734350ef49efaac56c34588b67f0d924，删除内部 PCV submodule、`.gitmodules` 条目和内部 source fixture test。"
    },
    {
      "type": "PCVM Test-01",
      "doc": "docs/workspace/current/alembic-test-exchange.md",
      "status": "总控验收通过",
      "description": "`AlembicTest` 已证明 PCV source 和 N9 baseline fixture 可用；最小重测确认 `Alembic` workflow path ref 残留已关闭，consumer cleanup 通过。"
    },
    {
      "type": "PCVM Alembic workflow cleanup",
      "doc": "docs/Alembic/progressive-chain-validation-workflow-cleanup-2026-05-25.md",
      "status": "总控验收通过",
      "description": "`Alembic` 提交 92bd976162fb9c1dbc19da1f8afef8756c976c27，清理 `.github/workflows/ci.yml` 与 `.github/workflows/release.yml` 中旧 `Alembic/skills/progressive-chain-validation` path ref。"
    },
    {
      "type": "PCVM Alembic N9 observability carry 回填",
      "doc": "docs/Alembic/progressive-chain-validation-n9-observability-linkage-2026-05-25.md",
      "status": "已完成",
      "description": "`Alembic` 提交 647a42fc9e499fc9bbbd166e1b9db2a9c96f99f9，新增 N9 job process event observability carry、missing-link metadata 和 daemon unit 覆盖。"
    },
    {
      "type": "PCVM AlembicAgent N9 evidence producer 回填",
      "doc": "docs/AlembicAgent/progressive-chain-validation-n9-observability-linkage-2026-05-25.md",
      "status": "已完成",
      "description": "`AlembicAgent` 提交 7ab94575ed9b475dc57253c88738e1f061a3c547，新增 N9 node-local evidence producer、process event compact metadata、quality gate artifact linkage 和 targeted tests。"
    },
    {
      "type": "PCVM Test-11",
      "doc": "docs/workspace/current/alembic-test-exchange.md",
      "status": "总控验收通过",
      "description": "`AlembicTest` rerun 已通过总控验收，证明 Agent nested evidence 被 `Alembic` job-level carry 消费，N9 verdict 为 `linked`。"
    },
    {
      "type": "PCVM Alembic nested evidence consumer extraction 回填",
      "doc": "docs/Alembic/progressive-chain-validation-n9-observability-linkage-2026-05-25.md",
      "status": "总控验收通过",
      "description": "`Alembic` 提交 ae9531ac3315a4491e22e3df156cb05e13fc0879，修复 nested `metadata.pcvNodeEvidence.nodeId/chainNodeId/sourceRefs` 消费并补 nested-only unit。"
    }
  ],
  "currentIndexRows": [
    {
      "type": "PCVM 目标阶段确认",
      "doc": "docs/workspace/current/progressive-chain-validation-metrics-goal-stage-confirmation-2026-05-25.md",
      "description": "已确认 PCV canonical source 独立拉出和 Wave 0 / Wave 1 阶段路线。"
    },
    {
      "type": "PCVM 代码实现依赖调研",
      "doc": "docs/requirement-designs/progressive-chain-validation-metrics/code-implementation-dependency-research-2026-05-25.md",
      "description": "支撑 PCVM 当前分派的本地代码事实、边界和 producer / consumer 顺序。"
    },
    {
      "type": "PCVM Wave 0 source 验收",
      "doc": "docs/workspace/current/progressive-chain-validation-metrics-wave-0-2026-05-25.md",
      "description": "PCV source commit badbf0aa23bbaaff2cf185491a6785a61b74c1d8 已通过总控验收；Alembic workflow cleanup 也已通过总控验收，Test-01 最小重测已通过总控验收。"
    },
    {
      "type": "PCVM Alembic consumer cleanup 回填",
      "doc": "docs/Alembic/progressive-chain-validation-consumer-cleanup-2026-05-25.md",
      "description": "`Alembic` 内部 PCV submodule gitlink 已删除；CI / release workflow 旧 path ref 已由 P1A 独立回填。"
    },
    {
      "type": "PCVM AlembicPlugin consumer cleanup 回填",
      "doc": "docs/workspace/current/progressive-chain-validation-metrics-wave-0-2026-05-25.md",
      "description": "`AlembicPlugin` 内部 PCV submodule 删除已通过总控验收。"
    },
    {
      "type": "PCVM Test-01",
      "doc": "docs/workspace/current/alembic-test-exchange.md",
      "description": "`AlembicTest` 重测证据已通过总控验收；`Alembic` workflow 残留已关闭，consumer cleanup probe 通过。"
    },
    {
      "type": "PCVM Alembic workflow cleanup",
      "doc": "docs/Alembic/progressive-chain-validation-workflow-cleanup-2026-05-25.md",
      "description": "`Alembic` workflow 残留 path ref 清理已通过总控验收。"
    },
    {
      "type": "PCVM Alembic N9 observability carry 回填",
      "doc": "docs/Alembic/progressive-chain-validation-n9-observability-linkage-2026-05-25.md",
      "description": "`Alembic` job-level N9 observability carry 已通过总控代码侧验收；Test-11 证明还需消费 nested `metadata.pcvNodeEvidence.sourceRefs`。"
    },
    {
      "type": "PCVM AlembicAgent N9 evidence producer 回填",
      "doc": "docs/AlembicAgent/progressive-chain-validation-n9-observability-linkage-2026-05-25.md",
      "description": "`AlembicAgent` node-local N9 evidence producer 已通过总控代码侧验收；Test-11 已证明 nested evidence 可读。"
    },
    {
      "type": "PCVM Test-11",
      "doc": "docs/workspace/current/alembic-test-exchange.md",
      "description": "Wave 3D rerun 已通过总控验收；nested evidence 已进入 linked baseline。"
    },
    {
      "type": "PCVM Alembic nested evidence consumer extraction 回填",
      "doc": "docs/Alembic/progressive-chain-validation-n9-observability-linkage-2026-05-25.md",
      "description": "`Alembic` commit ae9531ac3315a4491e22e3df156cb05e13fc0879 已通过总控验收，nested evidence consumer extraction 缺口关闭。"
    }
  ]
}
-->
