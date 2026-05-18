# docs-dev 分类索引

`docs-dev/` 是本地开发资料区，当前被 `.gitignore` 忽略，适合沉淀调研、设计草案、执行复盘和临时方案。

## 目录

- `agent-runtime/`：AgentRuntime、Agent 模块目录、沙箱、Ghost Mode、运行时统一化等设计。
- `tool-system/`：Agent 工具体系、工具能力、工具系统重构与落地计划。
- `workflows-scan/`：冷启动、增量扫描、扫描生命周期、workflow 主链路和长链路验证资料。
- `evolution/`：Recipe 进化、KnowledgeMetabolism、ContentImpactAnalyzer、文件变更驱动进化管线。
- `skills-plugins/`：Internal Skills、Progressive Chain Validation、workflow-to-skill 沉淀等插件/skill 设计。
- `platform-infrastructure/`：WriteZone、LLM Provider、Token/Budget、Timer 等基础设施设计。
- `video/`：Alembic 介绍视频、Codex 插件视频链路、HyperFrames 生产复盘。
- `research-notes/`：外部项目对比、竞品分析、面试/答辩素材和专项研究笔记。

## 使用约定

- 新文档优先放入对应分类目录，避免回到根目录平铺。
- 如果文档同时属于多个主题，放到最主要的执行入口目录，并在文档开头注明相关目录。
- 被代码、skill 或模板引用的开发资料移动后，要同步更新引用路径。
- 临时实验输出、大体积渲染产物和机器生成附件不要直接放在根目录；按项目在对应分类下再建子目录。
