# Strict gate 与知识管理端口优化

用户继续授权逐文件review、架构优化、清理与自主提交。基线56900c5；工作区仅AGENTS.md/CLAUDE.md原有改动。窗口=AlembicAgent，不接管无关Wakeflow计划；邻仓只读。

1. 基线：6份相关测试118项和typecheck通过。
2. 先修实际链路缺陷：strict G2适配真实Main的continue/pass；非法/矛盾gate结果失败关闭；取消后的内部epoch/seal不继续；完整transition校验与日程hash检查先于封印。保留Core权威验证和旧seal无参入口。
3. Strict immutable snapshot在浅冻容器下仍须冻结子记录，覆盖公共constructor与真实Core构造的context，不用外层Object.isFrozen代替深层不变性。
4. 知识manage统一输入/错误边界：禁止通用update绕过生命周期管理；规范化confidence/score；review读写错误、取消和STATE_DIVERGENCE按真实Core事实返回；skipped不能报告为新proposal。宿主缺失的管理端口明确报告，不在Agent复制Core状态机或伪造能力。
5. 行为修复先提交；随后把StrictProductionPipeline的context/analysis-loop、analyst、producer lineage、producer expressions及内部primitive按实际依赖分层，原文件保留完整兼容出口。使用现有AST fileBoundaries与公开签名/实际宿主probe约束迁移，hash编码与Core再验证顺序保持。
6. 每项真实入口RED→GREEN，源码/测试按明确所有权并行，root逐项复核；最终完整check、逐文件记录、风险与提交hash归档。

不修改Core/Main/插件/UI，不退役旧tool，不引入真实API或线上写入。知识服务接线缺口须标明下游所需接口，不能靠危险仓储旁路或新的假服务覆盖。
