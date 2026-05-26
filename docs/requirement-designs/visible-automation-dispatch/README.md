# Visible Automation Dispatch

状态：需求设计已形成，已进入总控目标阶段确认
维护窗口：AlembicWorkspace

## 定位

本需求目录记录“总控通过 Codex thread automation 将任务投递给其它可见 Codex 窗口”的需求设计资产。

目标不是把执行窗口替换为 headless worker，而是在保留 Mac Codex 前端可见性、窗口上下文和现有总控门禁的前提下，减少用户手动复制分派提示词。

## 文档

| 文档 | 状态 | 说明 |
| --- | --- | --- |
| [original-plan-2026-05-25.md](original-plan-2026-05-25.md) | 已确认 | 记录用户从“手动复制提示词”到“可见窗口自动 pull”的原始目标、约束和已验证事实。 |
| [requirement-design-2026-05-25.md](requirement-design-2026-05-25.md) | 已形成 | 设计 armed automation dispatch、窗口注册表、任务队列、claim/lock、回填和验证路线。 |
| [code-implementation-dependency-research-2026-05-25.md](code-implementation-dependency-research-2026-05-25.md) | 已完成 | 确认第一版落在 workspace 脚本和本地运行态，不依赖 Lark Remote，Node 脚本不伪装直接调用 Codex automation 工具。 |
