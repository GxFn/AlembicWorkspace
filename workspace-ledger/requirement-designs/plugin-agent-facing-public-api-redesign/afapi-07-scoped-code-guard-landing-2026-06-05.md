# AFAPI 07 Scoped Code Guard 落地方案

Design Key：`PLUGIN-AGENT-FACING-PUBLIC-API-REDESIGN-2026-06-04`
独立需求：`AFAPI-REQ-07-SCOPED-CODE-GUARD`
状态：landing-doc-ready / code-fact-reviewed
维护窗口：AlembicWorkspace

## Design 来源

- `AlembicDesign/docs/current/plugin-codex-task-lifecycle-redesign-requirement-design-2026-06-03.md`
- `AlembicDesign/docs/current/plugin-task-public-api-split-addendum-2026-06-04.md`
- `AlembicDesign/docs/current/plugin-codex-public-api-discussion-sequence-2026-06-04.md`

## 独立定位

本需求定义 `alembic_code_guard` 为独立 scoped Recipe adherence check。它只检查明确 files / inline code / workRef scope 下的代码是否符合本轮相关 Recipe / Guard / accepted rules，不再用旧 no-args `guard` 扫描整个 dirty diff，也不承担 lint、安全审计或通用代码质量评审。

## 真实需求

- code guard 必须由 host agent 显式调用，不能由 work_finish 隐式运行。
- 输入应包含明确 scope：files、inline code、diffRef、workRef、primeRef、acceptedGuards 或 applicableRecipe。
- 无 files / code / diffRef / work scope 时返回 structured blocked / skip，例如 missing-guard-scope、no-code-scope、docs-only、unrelated-dirty-diff。
- Guard 检查的是 Recipe adherence / accepted guards，不是全局 lint、安全扫描或所有代码风格问题。
- Guard 输出必须有 guardResultRef、detailRefs、status、reason 和 scoped diagnostics。

## 代码事实复核

- `AlembicPlugin/lib/shared/schemas/mcp-tools.ts` 已定义 `CodeGuardInput`，公开 `intentRef`、`workRef`、`files`、`code`、`filePath`、`language`、`operation`，并说明 omitted scope 返回 structured blocker，不再 whole-diff fallback。
- `AlembicPlugin/lib/codex/mcp/handlers/agent-public-tools.ts` 已实现 `codeGuardHandler` 并返回 guardResultRef / result envelope。
- `AlembicPlugin/lib/service/task/TaskLifecyclePolicy.ts` 的 `decideGuardTrigger` 已处理 no task anchor、no-code-diff、docs-only-diff、unrelated-dirty-diff、task-scoped-code-diff。
- `AlembicPlugin/lib/codex/mcp/handlers/guard.ts` 仍是底层 guard handler，public `alembic_code_guard` 应只通过 explicit scope 调用。
- `AlembicPlugin/test/unit/AgentPublicToolsActive.test.ts` 与 `AgentPublicToolsEvaluation.test.ts` 覆盖 missing-guard-scope、explicit file guard、guardResultRef。
- 代码差异边界：原 Design 提到的 `diffRef`、`primeRef`、`acceptedGuards`、`applicableRecipe` 未全部作为当前 `CodeGuardInput` 的 public 字段公开；当前实现主轴是 files / inline code / workRef。后续如果按原 Design 全字段实现，必须重开 schema 扩展和 tests。

## 落地方案

1. Stage 0 guard surface inventory：
   - 复核旧 `alembic_guard` / `alembic_task guard` / public `alembic_code_guard` 三者可见性、description、schema 和 handler path。
   - 列出 no-args dirty diff 行为是否仍能从 active guidance 触发。
2. Stage 1 explicit scope contract：
   - 支持 files / inline code 为最小 P0。
   - 对 diffRef / primeRef / acceptedGuards / applicableRecipe 做字段级裁决：公开、internal derived、或暂不做。
3. Stage 2 skip / blocker taxonomy：
   - missing-guard-scope、no-code-scope、docs-only、unrelated-dirty-diff、guard-not-relevant 必须结构化输出。
4. Stage 3 handler wiring：
   - public code_guard 只向底层 guard handler传入明确 scope。
   - 不从 repo dirty state 自动扩大检查范围。
5. Stage 4 evidence and reporting：
   - 返回 guardResultRef、detailRefs、checked files / code summary、reasonCode 和 outputBudget。

## 验收定义

- 无参数调用 `alembic_code_guard` 不扫描 whole diff，返回 missing-guard-scope blocker。
- explicit files 或 inline code 调用返回 guardResultRef / detailRefs。
- docs-only / unrelated dirty / no task anchor 场景不会被误判为当前代码失败。
- guard description 明确 non-goal：不是 lint、安全审计或通用 review。
- 若宣称支持 diffRef / primeRef / acceptedGuards，必须有 schema、handler、tests 和 real result evidence。

## 边界和非目标

- 不替代 repo lint、typecheck、security scan。
- 不在 work_finish 自动运行。
- 不基于 sourceRef 生产 gate 拦截 Recipe / candidate 生成。
- 不把全仓库 dirty diff 当作本轮用户任务 scope。

## 当前裁决

当前代码已完成 scoped code guard 的 P0 行为：explicit files / inline code 与 no-scope blocker。但原 Design 中更丰富的 diffRef / primeRef / acceptedGuards / applicableRecipe 字段未完全公开；若后续用户要求完整字段契约，应按本需求重新开 Stage 0。

