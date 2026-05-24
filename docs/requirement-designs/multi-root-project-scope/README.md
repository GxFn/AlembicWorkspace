# Multi Root Project Scope

状态：需求设计已确认，Wave 1 待启动
维护窗口：AlembicWorkspace

## 定位

本需求目录记录“多个目录汇总为一个 Alembic 项目”的需求设计资产。

本需求与历史 [alembic-multi-project-control-redesign](../alembic-multi-project-control-redesign/) 有关联，但目标不同：

- 历史需求重点是 `Alembic` 如何管理多个项目、项目切换、daemon / Dashboard / jobs 的项目隔离。
- 本需求重点是一个抽象 Project 如何由多个实体 Folder / repo / directory 组成，并被 cold-start、prime、search、skill export、file monitor 和 knowledge evolution 共同消费。`AlembicWorkspace` 根目录作为控制 / 协作入口单独建模，不混入源码 `folders[]`。

新 ProjectScope 以 Ghost dataRoot 作为唯一标准形态；旧 standard / project-root 写入不再作为兼容路线或迁移分支，不支持转回项目目录写入。

## 文档

| 文档 | 状态 | 说明 |
| --- | --- | --- |
| [original-plan-2026-05-24.md](original-plan-2026-05-24.md) | 已确认 | 用户四条后续主线中的第一优先级：支持 Project / Folder 一对多，第一版以 AlembicWorkspace 自用闭环为硬门禁。 |
| [code-implementation-dependency-research-2026-05-24.md](code-implementation-dependency-research-2026-05-24.md) | 已完成 | 基于 Core / Alembic / Plugin / Dashboard / Agent 真实代码，确认当前单 `projectRoot` 假设和 ProjectScope 实现依赖链。 |
| [requirement-design-2026-05-24.md](requirement-design-2026-05-24.md) | 已形成 | 设计 Project / Folder / controlRoot / Ghost-only storage 数据模型、跨仓库职责、阶段候选和完成定义。 |
