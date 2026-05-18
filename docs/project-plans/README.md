# Project Plans

日期：2026-05-18
状态：当前生效目录

## 目标

本目录用于保存工作空间级别的项目开发推进计划。它承载长期、可持续的项目规划，不替代 `docs/workspace/` 的总控 wave 分派文档，也不替代各子仓库自己的执行记录。

## 使用边界

- 跨仓库或跨阶段的项目开发规划可以放在这里。
- 需要长期追踪的路线图、里程碑、版本计划、开发节奏和验收框架可以放在这里。
- 当前正在执行的一波一阶段总控任务仍放在 `docs/workspace/`。
- 单仓库执行记录仍放在 `docs/AlembicCore/`、`docs/AlembicAgent/`、`docs/Alembic/`、`docs/AlembicPlugin/`、`docs/AlembicDashboard/` 或 `docs/BiliDili/`。

## 建议命名

```text
<project-or-topic>-development-plan-YYYY-MM-DD.md
<project-or-topic>-roadmap-YYYY-MM-DD.md
<project-or-topic>-milestone-plan-YYYY-MM-DD.md
```

文档名使用小写 kebab-case。日期使用创建日 `YYYY-MM-DD`。

## 与总控文档关系

`docs/project-plans/` 保存较长期的开发规划；`docs/workspace/` 保存当前总控入口、阶段分派、验收和归档规则。若长期计划被拆成可执行 wave，应在 `docs/workspace/index.md` 挂载对应的当前总控文档。
