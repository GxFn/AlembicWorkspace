# Cold-start Project Skill Delivery Goal Stage Confirmation

状态：已确认，进入 Wave 1
维护窗口：AlembicWorkspace
确认时间：2026-05-24 14:23 CST
对应 TODO：`GTODO-2026-05-23-026`
上游设计：[cold-start-skill-delivery-workspace-plan-2026-05-23.md](cold-start-skill-delivery-workspace-plan-2026-05-23.md)
代码依赖调研：[../../requirement-designs/cold-start-skill-delivery/code-implementation-dependency-research-2026-05-24.md](../../../../requirement-designs/cold-start-skill-delivery/code-implementation-dependency-research-2026-05-24.md)

## 用户原始目标

冷启动 / rescan 过程中生成的 project skills 是 Recipe 的另一种交付物。双链路产出包括 `Alembic` resident 冷启动路线和 `AlembicPlugin` host-agent 冷启动路线。目标不是继续让 Codex 通过旧 `alembic_skill(load)` 手动读取，而是在用户项目级允许后，把这些 skill 作为当前项目 Codex runtime skill 直接可见、可触发、可使用的能力。

## 最终完成定义

本主线只有同时满足以下条件才算完成：

- `AlembicCore` 提供共享 `ProjectSkillDeliveryReceipt` / runtime export receipt / managed marker / authorization / conflict contract，并有 normalizer、validator 和 public export。
- `Alembic` 冷启动 / rescan / dimension completion 的 skill 生成链路在成功后产出 receipt，并从旧 `alembic_skill(load)` hint 切换到 receipt/export 语义。
- `AlembicPlugin` 能消费 Alembic route receipt，也能为 Plugin route skill 生成 receipt。
- `AlembicPlugin` 在用户项目级授权后，以 `symlink-first` 把 skill export 到当前项目 `.agents/skills/<skill-name>`，默认 symlink target 指向 Ghost data root 的 Alembic-managed skill store。
- Codex 在 prime / bootstrap 接收阶段能喊出 developer-readable skill 摘要；默认不展示证据路径，证据保留在 receipt。
- 自动生成 skill 有稳定标记；同 scope 自动生成项可更新覆盖，非自动生成或标记不匹配项进入 conflict，不静默覆盖。
- 旧 `alembic_skill` Codex-facing 默认管理入口被删除、替换或明确降级为非默认只读路径。
- `AlembicTest` 在真实项目验证 Alembic route 与 Plugin route：Codex 可见 / 可用、receipt 可追证、symlink 不污染其它项目或用户全局 skill。

## 非目标

- 不支持多文件夹 / 多 root project skill export；该事项保留 `GTODO-2026-05-24-030`。
- 不写用户全局 `$HOME/.agents/skills`。
- 不修改 Codex plugin cache 或 `~/.codex/config.toml`。
- 不把 project skill asset 继续描述成已安装 runtime skill。
- 不直接让 `AlembicPlugin` 控制项目或替代 Alembic resident 底座。

## Producer / Consumer 依赖链

1. `AlembicCore` 是 contract producer：必须先完成共享 receipt/export/marker contract。
2. `Alembic` 是 resident producer：依赖 Core contract，产出 Alembic route receipt。
3. `AlembicPlugin` 是 Codex-facing consumer/exporter，也是 Plugin route producer：依赖 Core contract；消费 Alembic route receipt需要 Alembic 回填真实 payload。
4. `AlembicTest` 是真实验证 consumer：等待 Alembic 与 Plugin 完成后验证双 route 与 Codex runtime 可见性。

## 阶段计划

### Wave 1 Phase 1：Core contract

当前可派发，只发送 `AlembicCore`。

目标：定义共享 receipt/export contract、managed marker、授权 / 冲突状态、normalizer / validator，并替换 Core briefing 中旧 `alembic_skill(load)` 口径。

### Wave 1 Phase 2：Alembic producer

等待 Phase 1 验收后启动。

目标：把 Alembic 冷启动 / rescan / dimension completion 的 project skill 生成结果升级为 receipt，并暴露给 Plugin 可读取的 job / workflow result 面。

### Wave 1 Phase 3：Plugin consumer/exporter + Plugin producer

等待 Phase 1 验收后启动；其中 Alembic route 消费验收等待 Phase 2 回填。

目标：实现项目级授权、symlink-first export、Codex 呐喊摘要、Plugin route receipt、旧 `alembic_skill` 替代。

### Wave 1 Phase 4：真实项目验证

等待 Phase 2 / Phase 3 完成后启动 `AlembicTest`。

目标：验证双 route、project-scoped runtime skill 可见 / 可用、symlink 和 git 状态、冲突保护、developer-facing shout。

## 当前阶段判断

当前目标已清楚，用户已确认 runtime export 进入第一版、symlink-first、Ghost store 默认、项目级授权和冲突策略。下一阶段不是继续讨论，而是启动 Wave 1 Phase 1：`AlembicCore` contract。

## 验证策略

- Core 阶段：contract tests、public API smoke、build/typecheck/lint、`git diff --check`。
- Alembic 阶段：skill generation targeted tests、workflow/job result tests、resident payload tests、build/typecheck/lint。
- Plugin 阶段：project root / Ghost resolver tests、export conflict tests、symlink behavior tests、MCP schema/tool visibility tests、runtime package verification。
- Test 阶段：通过 `AlembicTest` 在真实项目验证 Codex 新窗口或可用路径下的 skill discovery 和 shout。

## 确认结论

2026-05-24 14:23 CST：用户要求“推进到下一阶段”，总控将 `GTODO-2026-05-23-026` 从旁路设计提升为当前主线，进入 Wave 1 Phase 1。
