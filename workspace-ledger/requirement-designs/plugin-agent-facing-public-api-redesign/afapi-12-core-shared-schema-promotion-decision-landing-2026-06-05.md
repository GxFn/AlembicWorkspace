# AFAPI 12 Core Shared Schema Promotion Decision Progress

Design Key：`PLUGIN-AGENT-FACING-PUBLIC-API-REDESIGN-2026-06-04`
Demand Key：`AFAPI-REQ-12-CORE-SHARED-SCHEMA-PROMOTION-DECISION`
Sequence Order：12
Template Version：`control-state-machine/developer-progress-v1`
Maintainer：AlembicWorkspace
Document Role：standard developer-readable demand progress document
State Authority：controller state-root JSON; scripts may update only the Unified Status block and append-only log sections.

## Unified Status

<!-- unified-status:start -->
Demand: AFAPI-REQ-12-CORE-SHARED-SCHEMA-PROMOTION-DECISION - AFAPI 12 Core Shared Schema Promotion Decision
Main state: not-claimed
Stage: sequence-ready
Current task packages: none
Windows: none
Blockers: none
Next action: Claim this demand with `node scripts/workspace-control.mjs sequence claim-next --root .. --manifest workspace-ledger/requirement-designs/plugin-agent-facing-public-api-redesign/afapi-independent-demand-sequence-2026-06-06.json --write --json`.
Review: none
Automation: disabled
User decisions needed: none
Last updated: 2026-06-06 CST
Source state: sequence manifest / no state-root
<!-- unified-status:end -->

## Goal

本需求不是“必须把 AFAPI contract 放进 Core”，而是定义何时应该把 Plugin 内的 agent-facing public schema、enums、result envelope 或 runtime identity pieces 提升到 AlembicCore。原则是：只有真实多消费者需要、当前分散实现已经造成阻塞、并且 Core 职责匹配时才 promotion；不得为了显得干净而提前创建空 shared layer。

### Requirements

- AlembicCore 承担共享、确定性、可复用、可运行的 headless contract。
- Plugin-first public agent contract 可以先在 AlembicPlugin 内独立目录实现。
- 当 Alembic、AlembicPlugin、AlembicDashboard、AlembicAgent 或其它 host adapter 真实共同消费同一 schema 时，才评估迁移到 Core。
- Promotion 必须保留真实调用方、替代入口、版本策略、tests 和 migration plan。
- 禁止提前造无调用方 shared schema、空 adapter、空 provider 或未来可能需要的中间层。

## Completion Definition

- 若决定不 promotion：文档必须说明现有 Core contracts 已满足哪些共享需求，agent-facing schema 为什么仍留 Plugin，且不存在当前阻塞。
- 若决定 promotion：至少两个真实消费者 import Core schema，并有 tests 证明行为一致。
- 不出现无业务语义的 empty shared layer。
- 任何 migration 都保留 backward compatibility 或明确 breaking cleanup 用户裁决。
- Core package public exports、Alembic / Plugin build 和 focused tests 通过。

## Stage Plan

1. Stage 0 promotion trigger review：
   - 列出每个 public contract type 的真实消费者。
   - 判断是否已经出现重复实现、版本漂移、无法测试或跨仓库 blocking。
2. Stage 1 split decision：
   - Core 保留 runtime / ProjectScope / sourceRef / Recipe / Guard / search / failure envelope 等 headless shared contracts。
   - Plugin 保留 host-agent-facing tool contract、descriptions、cross-host prompt snapshots，除非出现第二个真实 host adapter 需要直接复用。
3. Stage 2 promotion candidate design：
   - 若要上移，先写 migration doc：source module、target module、exports、version、compat alias、consumer migration、tests。
   - 禁止只移动 types 不迁移真实 consumer。
4. Stage 3 contract tests：
   - Core public API boundary test。
   - Plugin import path / package export test。
   - Alembic / Dashboard / Agent consumer tests。
5. Stage 4 cleanup：
   - 删除旧 duplicate schema 或建立 temporary adapter；adapter 必须有真实 migration deadline。

## Current Evidence Baseline

### Design Sources

- `AlembicDesign/docs/current/plugin-task-public-api-split-addendum-2026-06-04.md`
- `AlembicDesign/docs/current/plugin-mcp-multi-project-runtime-requirement-design-2026-06-03.md`
- `AlembicDesign/docs/current/plugin-agent-facing-public-api-redesign-workspace-handoff-2026-06-04.md`

### Code Facts

- `AlembicCore/src/daemon/ProjectRuntimeContracts.ts` 已提供 runtime identity、service readiness、failure envelope、ProjectRuntimeControlSnapshot 等共享 contract。
- `AlembicCore/src/service/search/SearchTypes.ts` 已提供 search response、resident vector meta、sourceRefs、searchMeta 等基础搜索 contract。
- `AlembicCore/src/shared/ProjectScope.ts`、Recipe / Guard / sourceRef 相关模块已是 Alembic / Plugin / Dashboard 可复用基础。
- `AlembicPlugin/lib/codex/mcp/public-tools/contract.ts` 当前承载 agent-facing public tool contract，直接服务 Plugin MCP surface。
- 当前代码没有发现 AlembicCore 必须承载 `alembic_intent` / `alembic_prime` / work / guard / decision public agent schema 的硬阻塞；旧总控计划也把 shared schema promotion 判为未触发。

### Current Judgment

当前 AFAPI 代码事实不触发 Core shared schema promotion。Core 已承载 runtime / search / sourceRef / Recipe / Guard 等共享基础；六个 agent-facing tool contract 仍由 AlembicPlugin 承载。后续如出现第二个真实 consumer 或 schema drift，本需求再重开。

## Boundaries And Non-goals

- 不为了“架构更干净”迁移。
- 不把 Plugin host-facing prompt / descriptions 放进 Core，除非它们变成多个 host adapter 的通用产品 contract。
- 不把 AlembicAgent 与 host agent 概念混淆；AlembicAgent 不是本 public MCP contract 的默认消费者。

## Task Packages

<!-- append-only: task-package entries belong below this line; do not edit previous entries without total-control judgment. -->

## Backfill Summaries

<!-- append-only: target result and evidence summaries belong below this line. -->

## Decisions And Append Log

<!-- append-only: controller decisions, user confirmations, and template migrations belong below this line. -->
