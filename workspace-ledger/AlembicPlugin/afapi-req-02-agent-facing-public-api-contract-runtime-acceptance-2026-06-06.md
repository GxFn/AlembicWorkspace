# AFAPI REQ 02 Plugin Agent-Facing Public API Contract Runtime Acceptance

日期：2026-06-06
窗口：AlembicPlugin
任务：AFAPI-REQ-02-AGENT-FACING-PUBLIC-API-CONTRACT-RUNTIME-ACCEPTANCE-T2

## 范围

- 本轮只在 AlembicPlugin 仓库边界内执行 runtime / packaged acceptance。
- 复核对象：当前 packaged Codex plugin cache、MCP tools/list public surface、六个 agent-facing public tools 的 runtime result envelope、legacy `alembic_task` active surface absence、cross-host contract focused checks。
- 本轮不做产品实现，不物理删除 legacy direct-call compatibility，不提交 runtime bundle / submodule，不代领 Alembic / Core / Agent / Dashboard / Design / Test / 真实项目职责。
- 当前 TargetResultEnvelope 只作为目标窗口回填，不能替代总控验收。

## 结论

- 当前 AlembicPlugin HEAD packaged runtime 已刷新到本机 Codex plugin cache，并通过 packaged wrapper probe。
- Installed-cache public tools runtime readback 通过：
  - tools/list 在 init 前可见六个 public tools：`alembic_intent`、`alembic_prime`、`alembic_work_start`、`alembic_work_finish`、`alembic_code_guard`、`alembic_decision_record`。
  - init 前 / init 后均未暴露 legacy `alembic_task`。
  - 六个 public tools 均返回 `data.result` envelope，且 `usesLegacyTaskHandler=false`。
  - `alembic_code_guard` 无 scope 场景按预期 `blocked / missing-guard-scope`。
  - `alembic_decision_record` 无 resident Decision Register 场景按预期 `blocked / decision-register-unavailable`。
  - 六工具 description 均包含 `Non-goal:`，且未包含旧 public primary wording：`operation=prime`、`operation=create`、`operation=close`、`Task and decision management (5 operations)`、`primary action is \`alembic_task\``。
- Focused contract / active surface / cross-host readiness / legacy cleanup / schema tests 通过，证明同一 public contract 对 Codex / Claude Code / generic host 不产生 schema fork。

## Runtime 证据

### Packaged Cache Refresh And Probe

报告：

- `AlembicPlugin/scratch/afapi-req-02-runtime-acceptance-2026-06-06/codex-plugin-dev-verify-packaged-report.json`

关键结果：

- `ok=true`
- `mode=packaged-runtime`
- `entryMode=packaged-wrapper`
- cache marker `gitHead=8ba07705cfa9b655317309a1a3f1194f6117ccab`
- runtime tarball hash：`af3162eb27be0bd75ea25facbe3a1023677731238e2a64576ab874fa31c3843a`
- packaged runtime readback `readinessState=degraded`，原因是 resident daemon / jobs / api-ai / dashboard / file-monitor 不可用；这符合 Plugin packaged wrapper 在无 resident Alembic 场景下的降级边界。
- project identity 来源为 `codex-current-project`，selected / active / local-jobstore / embedded fallback 未允许覆盖 effective identity。

### Public Tools Runtime Readback

报告：

- `AlembicPlugin/scratch/afapi-req-02-runtime-acceptance-2026-06-06/agent-public-tools-runtime-readback.json`

关键结果：

- `ok=true`
- cache marker `gitHead=8ba07705cfa9b655317309a1a3f1194f6117ccab`
- init 前 tools/list 包含六个 required public tools。
- init 后 tools/list 仍不包含 `alembic_task`，`legacyTaskCompatibility.hiddenDirectCallOnly=true`。

六工具 runtime call 摘要：

| Tool | Status | Reason | Envelope | Legacy handler |
| --- | --- | --- | --- | --- |
| `alembic_intent` | `ready` | none | present | false |
| `alembic_prime` | `degraded` | `resident-unavailable` | present | false |
| `alembic_work_start` | `ready` | none | present | false |
| `alembic_work_finish` | `ready` | none | present | false |
| `alembic_code_guard` | `blocked` | `missing-guard-scope` | present | false |
| `alembic_decision_record` | `blocked` | `decision-register-unavailable` | present | false |

## 验证命令

以下命令均在 `AlembicPlugin/` 执行：

```bash
git status --short
git status --short # in plugins/alembic-codex
node scripts/probe-agent-public-tools-evaluation.mjs --project-root scratch/afapi-req-02-runtime-acceptance-2026-06-06/project --report-path scratch/afapi-req-02-runtime-acceptance-2026-06-06/agent-public-tools-runtime-readback.json --mcp-timeout-ms 60000
npm test -- --run test/unit/AgentPublicToolsContract.test.ts test/unit/AgentPublicToolsActive.test.ts test/unit/AgentPublicToolsEvaluation.test.ts test/unit/AgentPublicToolsCrossHostReadiness.test.ts test/unit/AgentPublicSkillLegacyCleanup.test.ts test/integration/ZodSchemas.test.ts
npm run build:check
npm run lint:repo-boundary
npm run verify:codex-plugin
npm run dev:codex-plugin:verify -- --refresh-only --packaged --project-root scratch/afapi-req-02-runtime-acceptance-2026-06-06/project --report-path scratch/afapi-req-02-runtime-acceptance-2026-06-06/codex-plugin-dev-verify-packaged-report.json
node scripts/probe-agent-public-tools-evaluation.mjs --project-root scratch/afapi-req-02-runtime-acceptance-2026-06-06/project --report-path scratch/afapi-req-02-runtime-acceptance-2026-06-06/agent-public-tools-runtime-readback.json --mcp-timeout-ms 60000
git diff --check
git diff --check # in plugins/alembic-codex
git rev-parse HEAD
git rev-parse HEAD # in plugins/alembic-codex
```

## 验证结果

- Initial installed-cache public tools probe：通过；随后发现 cache marker 仍指向旧安装 commit，因此继续刷新当前 packaged cache。
- Packaged cache refresh 第一次在普通 sandbox 下失败，原因是写入 `~/.codex/plugins/cache/...` 被拒绝；同一命令在用户允许的提升权限下重跑通过。
- Packaged cache refresh / probe：通过，`ok=true`，marker 指向当前 AlembicPlugin HEAD。
- Final installed-cache public tools probe：通过，`ok=true`，marker 指向当前 AlembicPlugin HEAD。
- Focused public tools tests：通过，6 files / 96 tests。
- `npm run build:check`：通过；Core build 使用 `../AlembicCore @ 9e51506be3c9078e44643346fa4a7d4d1271e716`。
- `npm run lint:repo-boundary`：通过，`@escape-hatch count: 0 / 75 threshold`。
- `npm run verify:codex-plugin`：通过，`./runtime.tgz -> alembic-codex-plugin-runtime@0.2.0`。
- `git diff --check`：AlembicPlugin 父仓库和 embedded plugin 子仓库均无输出。
- `git status --short`：AlembicPlugin 父仓库和 embedded plugin 子仓库最终均为空。

当前提交基线：

- AlembicPlugin HEAD：`8ba07705cfa9b655317309a1a3f1194f6117ccab`
- embedded plugin HEAD：`7036b3281cc894bd2373d729c7a6e264a7bd923f`
- 本轮无产品代码提交；no-commit 理由：T2 是 runtime acceptance / closeout，不要求产品实现，所有产品仓库 tracked diff 为空。

## 未修改范围

- 未修改 AlembicPlugin 产品源码、embedded submodule pointer 或 channel assets。
- 未物理删除 legacy `alembic_task` direct-call compatibility。
- 未修改 Alembic / AlembicCore / AlembicAgent / AlembicDashboard / AlembicDesign / AlembicTest / 真实项目。
- 未创建目标窗口下一跳。

## 风险与下一步建议

- 风险：`alembic_task` 仍作为 hidden direct-call compatibility handler / schema / tests 存在；本轮只证明它不在 active public surface，不裁决物理删除。
- 风险：`alembic_prime` 在无 resident Alembic 服务时按预期 degraded，`alembic_decision_record` 在无 durable Decision Register route 时按预期 blocked；这证明 envelope 和 reason kind 成立，不等于 resident producer 能力由 Plugin 单独提供。
- 建议：总控可基于 T1 code fact + 本轮 runtime/package readback 判断 REQ-02 completion definition 是否已满足；若后续要删除 hidden legacy direct-call compatibility，应另开删除任务并先确认旧 direct-call consumers。
