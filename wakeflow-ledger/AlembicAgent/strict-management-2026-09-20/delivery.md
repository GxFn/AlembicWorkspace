# Strict gate、生产合同与知识管理 review

用户直接授权继续逐文件review、架构优化、清理与自主提交。本轮从56900c5推进到69ee567，只在AlembicAgent修改/提交；AGENTS.md、CLAUDE.md仍为原有用户改动。

## 三次提交

| Commit | 完成内容 |
| --- | --- |
| `2da01ef` | Strict G2真实Main成功回执适配，拒绝非法/矛盾判定；取消后不再继续内部read/assert/seal；完整transition与预期hash验证先于封印；修复浅冻子数据和非法disposition造成的假fixpoint。 |
| `4070cef` | 知识manage改为明确内容字段许可；拒绝生命周期、staging截止/复核统计及未知字段旁路；校验数字输入；保留Core partial/unknown写入事实、skipped原因；缺管理方法明确返回port-unavailable。 |
| `69ee567` | 生产合同按analysisLoop、analyst、lineage、expressions、gates、primitives六模块分层，原入口保留；增加文件依赖约束与产品说明。 |

[逐文件清单](file-review.md)记录15个文件/模块的实际审查范围。StrictProductionPipeline原94个具名声明全部原样迁移，43个源级出口及type/value属性保持，兼容文件缩为51行。含类型的依赖图也无环。Core的population、cluster、induction、falsification、review、fixpoint与terminal验证链没有被缩成外层hash检查。

## 验证与审查

- 基线：6份相关测试118项与typecheck通过。
- 缺陷修复：实际factory/Pipeline与knowledge.handle入口RED→GREEN；采用真实Core构造器/合同、可控内存IO与临时fixture，不用真实API key或线上写入。
- 字段许可不仅测mock调用次数：通过真实Core repository合并路径证明stagingDeadline、stats复核状态和未知字段被整笔拒绝；正常内容更新仍成功且保留原复核状态。输入对象不被静默删改。
- 迁移：独立AST重比对94/94正文、43导出，人工复核Core调用与跨进程rebuild，另有seal/freeze/hash格式/constructor身份/真实factory的内存probe。
- 最终 `npm run check` exit 0：**66个测试文件、938项通过**；包括typecheck、Biome、Core/Agent/公开入口边界、分层、doctrine、naming、provider-neutral、公开签名、实际strict consumer、validation floor和退役符号检查。
- **15公开入口、451导出绑定**；检查前后374个源码、测试、配置和产品文档文件指纹一致。详细验证见[verification.json](verification.json)。原有scripts console lint警告未扩成无关清理。

测试继续使用现有文件和参数化场景，无新增测试文件。真实Core语义fixture与handler边界互补，不删除权限、取消、部分结果或strict回执守恒测试。字段输入复用现有knowledge/input.ts，不保留临时managementInput文件；Core sustain类型替代重复的宽泛鸭子接口。

## 参考、风险与下一步

[参考判断](research.md)记录RFC 8785与本地实际hash差异；本轮不以名字相似为由替换V1 hash编码。产品使用说明见仓库 `docs/strict-production.md`。

Agent内本轮已确认缺陷均已修复。仍有明确的宿主接入边界：Main当前把原始Core repository注入knowledgeRepo，它不等价于受控管理服务，且缺少getById/reject/score/validate等Agent所需方法。字段许可不是Core服务的tag合并、profile校验或事务实现；下一步需在Main授权范围内注入真正adapter，不能在Agent伪造方法或旁路Core。相邻仓库本轮仅作只读参考。

取消不承诺回滚不响应signal的外部port；STATE_DIVERGENCE或已发写入缺回执要求按Core details读回/修复，不能自动重试。下一轮本仓库review可继续聚焦gate routing与运行时结果投影，宿主接线变更则需相邻仓库的明确授权。
