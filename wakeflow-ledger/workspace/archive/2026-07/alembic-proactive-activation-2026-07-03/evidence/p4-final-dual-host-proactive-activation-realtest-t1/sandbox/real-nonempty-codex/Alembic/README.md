# real-nonempty-codex — Alembic Knowledge Base

此目录是项目的 **核心知识库**，`recipes/` 目录存放核心知识数据。

## 目录结构

```
Alembic/
├── constitution.yaml   入口安全策略（兼容文件；不定义运行时角色）
├── boxspec.json        项目规格
├── recipes/            ★ 知识目录 — 统一知识实体（Source of Truth）
│   ├── _template.md    格式参考
│   └── ...             代码模式/调用链/数据流/约束/风格/...
├── candidates/         候选知识（待审批）
├── skills/             Project Skills（冷启动自动生成 + 手动创建）
│   └── <name>/SKILL.md AI Agent 知识增强文档
└── README.md
```

## 统一知识模型

所有知识统一为 **Recipe** 实体，由 `dimensionId` 表示维度归属，`knowledgeType` 表示知识类型：

| knowledgeType | 说明 |
|---------------|------|
| code-standard | 代码规范 |
| code-pattern | 代码模式 |
| code-relation | 代码关联 |
| inheritance | 继承与接口 |
| call-chain | 调用链路 |
| data-flow | 数据流向 |
| module-dependency | 模块与依赖 |
| architecture | 模式与架构 |
| best-practice | 最佳实践 |
| boundary-constraint | 边界约束（含 Guard 规则） |
| code-style | 代码风格 |
| solution | 问题解决方案 |

## 入口安全模型

AlembicPlugin 不使用运行时角色、登录身份或中央权限矩阵作为写入裁决。
写入安全由具体入口负责：请求 schema 校验、删除/批量写入确认、路径与项目范围校验、dry-run/force 语义以及持久化前置条件。

## Recipes 知识库

`recipes/` 目录随主仓库提交。如需独立管理（团队权限控制），由 IDE 插件适配层提供 recipes 远端配置入口。

> 运行时缓存（DB 索引、Candidates、Snippets、审计日志）在 `.asd/alembic.db`。
> **核心数据的唯一真实来源是 `recipes/` 目录中的文件**，DB 仅做缓存。
