# 未提交内容审阅与提交记录

用户授权检查并提交Alembic相关仓库已有内容；沿用main-only，不创建分支、不推送远端。

## 产品仓库

| 仓库 | 提交 | 内容 |
| --- | --- | --- |
| AlembicAgent | `be0a4dd0d2ae2d1f1e8a1681610e51285a934506` | 维护规则：review inputs、确认读回与职责边界 |
| Alembic | `b6b0ecede712c54dc4c2f69666b616502f64f13b` | 维护规则：review inputs、确认读回与职责边界 |
| AlembicPlugin | `a0a18e4e3c818f8ed4d6f9d4ff78b8c834ca723a` | 维护规则：review inputs、确认读回与职责边界 |
| AlembicDashboard | `6b5985cf97f257e7613f7d9f899616895314372e` | 维护规则：review inputs、确认读回与职责边界 |
| AlembicCore | `0308cf936cd04ebc7e4e9a80bb83fc40913f454e` | 维护规则同步及coverage目录既有类重导出 |

五仓的AGENTS/CLAUDE维护段归一化增删内容一致；未改变产品职责。Core的3行目录barrel曾被无根锚coverage/规则忽略，符合现有repository子目录约定；保留已有源码并补入版本控制，没有新增package exports。构建、2文件7测试、公共API边界、Biome、编译后namespace import均通过。其余产品只改说明文件，检查diff、敏感信息与Codex/Claude宿主差异，无需重复运行产品构建。

## 工作区文档与规则

正式规则、需求/学习文档提交：`5c76ea2e04c7fa0d6483460daac7e6c9779b786f`。

- 修正Design handoff与authority模板：TODO append只验证13字段/词汇、重复ID与CAS，完整authority必须初始create_demand发布。
- 修正Test evidence-review及路由说明：只自查Test自己的材料与步骤映射，产品审查和验收归controller；产品源码/测试/配置/文档只读，明确批准的Test-owned harnesses/fixtures除外。
- 与已安装Wakeflow 0.9.6静态核对；没有通过Git提交执行任何派送、激活或历史业务状态修改。
- 把用户明确的main-only开发要求写入AGENTS/CLAUDE的workspace-local区，位于managed block之外。
- 补齐现有.gitignore对恢复scratch、Test scratch、strict运行数据以及独立AlembicShowcase仓库的保护，未把嵌套Git仓库纳入父仓。

## 记录筛选与保留

发现212个包含本机信息或属于原始运行快照的历史文件，已按19个精确本地排除项保留；原始文件未改写或删除。它们包括带用户home路径的旧归档、5个SQLite运行数据库及其完整快照、一个不完整JSON索引等。恢复Git bundle和旧worktree也保留本地。

这些精确例外记录在本地.git/info/exclude，而非把整个ledger从版本控制排除。可版本化的正式记录、研究结果和无私有值的历史归档纳入Git，历史快照字节不做格式清洗。提交历史材料不等于验证其旧业务结论或将其激活为当前authority。

存储约束依据：已读取的wakeflow-governance/SKILL.md及references/wakeflow-ledgers.md要求，不将用户home/工作区绝对路径、私有handle或secret放入长期文档；对旧污染归档的原文要求为“Never hand-edit it or move it back into current state.”。本轮遵守原样保留，不手工清洗旧archive。

## 验证与限制

- 正式Design/Test文档静态合同、128份新增Markdown本地链接检查通过；4处UUID为Recipe业务ID，不是host handle。
- 已选文本的凭据、私钥、用户home路径、临时机器路径和裸v7 thread handle扫描通过；两处authorization字段是自然语言权限说明。两张历史媒体解码对比图片也已检查，无本机路径或凭据。
- JSON/JSONL按类型解析，损坏的原始运行索引随完整运行快照排除；没有修改证据摘要或历史hash来伪造完整性。
- 维护文件git diff --check通过。导入资料的默认diff check报告13处EOF空行和1662处行尾空白（30文件）；保留Markdown断行及历史原始字节。仅在导入批次中放行blank-at-eol/blank-at-eof后，结构性diff check通过，未发现冲突标记。
- 当前wakeflow_view(storage)真实返回wakeflow-public-v3-config：旧desired model尚未迁到public v3。本轮只做Git审阅和静态规则修订，不把它声称为v3运行验收，也没有擅自迁移控制配置。
- Book、Showcase原本干净，无需空提交。所有仓库均保持main。

## 下一步

本次可提交改动已保存；本地保留记录如需外部发布，先由相应迁移/归档owner处理。当前Wakeflow legacy配置兼容性是独立迁移事项，不属于本轮Git保存操作。
