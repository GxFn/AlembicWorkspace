# AFAPI 11 Dashboard Runtime Diagnostics UI 落地方案

Design Key：`PLUGIN-AGENT-FACING-PUBLIC-API-REDESIGN-2026-06-04`
独立需求：`AFAPI-REQ-11-DASHBOARD-RUNTIME-DIAGNOSTICS-UI`
状态：landing-doc-ready / code-fact-reviewed
维护窗口：AlembicWorkspace

## Design 来源

- `AlembicDesign/docs/current/plugin-mcp-multi-project-runtime-requirement-design-2026-06-03.md`
- `AlembicDesign/docs/current/plugin-agent-facing-public-api-redesign-workspace-handoff-2026-06-04.md`

## 独立定位

本需求是条件型下游需求：只有 runtime identity、sourceOfTruth、detailRefs、readiness、stateCleanup 或 diagnostics 需要用户可见解释时，Dashboard 才承接只读 UI。Dashboard 不决定 Plugin effective identity，不写 ProjectRuntimeControl，不替代 Alembic source of truth。

## 真实需求

- Dashboard 只能消费 Alembic `/api/v1/projects/current` 或相关 projects API 的真实 backend fields。
- UI 必须展示 sourceOfTruth、readiness、requiredService、route、failure、diagnostics、stateCleanup 或 next action。
- 如果 backend 未提供 sourceOfTruth，Dashboard 不展示伪造诊断。
- UI 是 read-only diagnostics；不能让用户误以为 Dashboard selected project 会覆盖 Codex host agent effective project identity。
- 需要 tests 证明 sourceOfTruth / diagnostics 不被 API client normalize 丢掉。

## 代码事实复核

- `Alembic/lib/http/routes/projects.ts` 的 `/api/v1/projects/current` 已返回 `sourceOfTruth`、`activeRuntimeProject`、`selectedProject` 和 `state`。
- `AlembicDashboard/src/types.ts` 已定义 DashboardProjectRuntimeSourceOfTruth 等 runtime diagnostics 类型。
- `AlembicDashboard/src/api.ts` 已 normalize `sourceOfTruth`、`diagnostics` 和 `stateCleanup`，不再强制置 null。
- `AlembicDashboard/src/components/Layout/Header.tsx` 已读取 `projectsSnapshot?.sourceOfTruth`、readiness、operation、failure、requiredService、detail refs / source refs，并展示 runtime diagnostics。
- `AlembicDashboard/src/i18n/locales/en.ts` / `zh.ts` 已有 runtime diagnostics 文案。
- `AlembicDashboard/scripts/dashboard-contract.test.mjs` 已有 `projects runtime control source-of-truth diagnostics are preserved and visible` 测试。

## 落地方案

1. Stage 0 UI necessity check：
   - 只有当 AFAPI runtime diagnostics 需要用户可见观察时才启动 Dashboard。
   - 若 backend 没有新增 sourceOfTruth / diagnostics 字段，不创建 UI mock。
2. Stage 1 API client contract：
   - types / normalizer 保留 sourceOfTruth、diagnostics、stateCleanup、failure、sourceRefs / detailRefs。
   - 不丢 unknown diagnostics fields；必要时保守显示。
3. Stage 2 read-only component：
   - Header / diagnostics panel 展示 readiness、route、requiredService、readOnly / writePolicy、failure reason、diagnostics list。
   - sourceOfTruth missing 时显示 unavailable hint，不伪造。
4. Stage 3 state boundary：
   - Dashboard 可显示 selected / active state，但不能表达为 Codex effective identity。
   - 任何 write action / cleanup action 必须由 Alembic runtime-control route 明确提供，不由本需求新增。
5. Stage 4 tests：
   - dashboard-contract test 覆盖 fields preserved and visible。
   - 不允许 sourceOfTruth 被 normalizer 重置为 null。

## 验收定义

- Backend 返回 sourceOfTruth 时，Dashboard UI 可见 readiness / route / operation / requiredService / diagnostics / failure / cleanup。
- Backend 不返回 sourceOfTruth 时，UI 显示 unavailable，不展示假数据。
- API normalizer 保留 diagnostics 和 stateCleanup。
- UI 文案明确 read-only diagnostics，不暗示 Dashboard state 可覆盖 Plugin runtime identity。
- Contract test 覆盖类型、API client、UI component 和 i18n。

## 边界和非目标

- 不新增 Dashboard 写 runtime identity 的能力。
- 不把 Dashboard selected project 当 Codex host current project。
- 不展示 mock diagnostics。
- 不承担 public tool contract、intent、prime、work、guard、decision 实现。

## 当前裁决

当前 Dashboard 已实现 runtime diagnostics 只读 UI，并通过 contract test。后续若 Alembic sourceOfTruth schema 变化，本需求必须重开 API normalizer 和 UI field preservation 复核。

