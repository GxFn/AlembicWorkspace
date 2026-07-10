# 挖掘 Agent 成熟度重评 · 业界对照(2026-07-10,P0+P1 落地后)

前置:`alembic-agent-mining-quality-upgrade-requirement-2026-07-10.md`(需求)、`alembic-agent-mining-quality-gate0-baseline-report-2026-07-10.md`(门 0 实测)。
方法:三路并行联网调研(代码知识挖掘/评估校准/记忆治理,合计 ~100 个一手来源)× 当前代码事实(挖掘链核心 ~6k 行,全仓 204 文件 5 万行,65 测试文件)× 门 0 真实 provider 实测。

## 1. 总评

产出链(接地+门禁)达业界领先档;评估层入业界主流起步档;生命周期治理一处领先(staging)、两处落后(声明级蕴含在线校验、入库后源头漂移失效)。与上次评估的本质区别:每个判断有实测数字支撑。

## 2. 分维度对照

| 维度 | 现状 | 业界对照(来源) | 判定 |
|---|---|---|---|
| 证据防捏造 | sha256 台账+提交时重哈希+judge 引用区间校验 | 三种已知形态:Anthropic Citations API(生成时结构约束);arXiv 2512.12117(生成后区间算术,92% 引用准确率/零幻觉,与我们最同构);Copilot Memory JIT verification(使用时重验)。"哈希证明模型真读过"无直接对标 | 领先 |
| 确定性上下文注入 | ModuleContextAssembler+预算档+超大拆分 | 7 个学术系统(GraphCoder/CodexGraph/RepoGraph/LocAgent/CGM/RANGER/Codebase-Memory)全部确定性建图;arXiv 2601.08773 定量证明 AST 图优于 LLM 抽取图;门 0 实测 contextMap 使 v4-flash 0→5 候选/recall 100% | 同向共识+自证 |
| 提交门禁 | in-process 机器门(do/dont+对比+graph refs)卡入库前 | 业界仅两路:生成前人审(Cursor/Augment/Devin 批准制)或生成后自愈/衰减(Copilot/Claude Code);produce 前代码化质量门未见对标;最接近=Copilot Autofix 修复后校验链(语法→类型→测试→依赖) | 严于已知产品 |
| 评估体系 | harness+judge+校准晋级门(G-B 后含 kappa/负类) | 调研样本中仅 Copilot Memory 公布量化评测(对抗植入+精确/召回/合并率+p 值);≥80%∧≥30 门在主流区间(MT-Bench 80% 锚/Databricks 88%+kappa 0.64/Hamel 30 例起步) | 主流起步档(基建好,数据薄) |
| staging 复核期 | 限时人工复核队列 | 主流产品无此设计(宽进+事后可编辑是主流;Cursor/Devin 逐条批准最接近);保守方向有据:生产 judge 仅抓 ~1/5 真实故障(arXiv 2606.10315) | 少数派领先 |
| 弱模型防空转 | 预算档+覆盖度门+图谱注入 | SWE-smith(arXiv 2504.21798):弱模型 ≥10 步重复≈89% 失败,73% 是翻页读文件——与门 0 基线 terminal17→修后 2 同构 | 直击实证痛点 |
| 知识生命周期 | staging+进化衰减+prime 回流 | 领先半段+落后半段,见 §4 G-C | 结构性缺口 |

## 3. 业界最佳的六个设计(参照库)

1. **GitHub Copilot Memory**(2026-01,唯一有公开量化评测的对标):条目带 file:line citations;刻意放弃离线治理服务,换 **just-in-time verification**(每次命中现场重读 citation 确认仍成立,失效自动存更正版)+ **28 天未使用自动删除**;评测=对抗性植入矛盾记忆+精确率/召回率/PR 合并率 83%→90%(p<0.00001)。
2. **Qodo Merge**:唯一从团队行为学约定的量产管线——每月分析被采纳的 AI 建议生成 best practices("反复采纳=隐式认可"代替人审),学来的规则给最低优先级。
3. **Aider repo-map**:tree-sitter 符号图上跑 PageRank,引用次数/用户提及加权,二分裁剪进 1k token 预算——比我们的目录分组图谱多一层排序智能。
4. **ACE(Stanford,arXiv 2510.04618)**:知识条目带 helpful/harmful 计数器,Reflector 产局部 delta、Curator 确定性合并去重(反对整体重写防 collapse);对照 Zep 纯数值评分门槛 2026-02 被弃用——计数器+确定性合并路线胜出。
5. **源头漂移(Swimm/Fiberplane)**:知识条目绑 file/AST 符号锚点,代码变更触发 CI 级失效检查、可阻合并。
6. **校准协议(LangSmith Align Evals/Databricks)**:人工纠正自动变 judge few-shot+持续跟踪对齐分;报 kappa 非裸一致率;分层抽样+周期性再校准(周金丝雀/月抽查/季全量)。

## 4. 剩余缺口(按价值排序)

- **G-A 声明级蕴含校验缺在管线内**(最大残余,门 0 实锤):judge 拒掉的 2 条候选均为真实引用上的错误泛化("字段名 success"实为 `ok`;"固定双函数导出"实有第三个)——台账挡捏造引用,挡不住错误概括。业界对应:Vertex Check Grounding"完全蕴含才算 grounded"、MiniCheck(近 GPT-4 精度/便宜 400 倍)。**P2-2 critic 即此缺口的答案**,门 0 已证明其抓真问题。
- **G-B 校准口径缺陷 → 已修(AlembicAgent 7fa216b)**:percent agreement 类不均衡虚高(实测 TPR>96%/TNR<25% 可过 80% 门);晋级门补 Cohen's kappa ≥0.6 ∧ 负类召回 ≥0.6(人工负例 ≥5,全正语料=语料不合格)。
- **G-C 知识入库后无源头漂移失效**(最大结构性缺口):新鲜度检查止步提交时刻,代码后续演进不会使已入库知识失效。两个成熟参照:Copilot JIT 重验+使用驱动过期(便宜);Swimm 式锚点绑定+commit 触发失效(彻底)。**P3 重定义**:增量挖掘的高价值半段是"知识失效传播"——条目已有 file:line sources,commit 触发对被引区间重哈希即可复用台账机制(本次已在需求 §8 登记方向,实施仍属 P3 独立需求)。
- **G-D 评估数据薄**:单 fixture/每侧 n=1/无 --model 旗标/无方差协议;业界扩样判据="新增样本不再暴露新失败模式",防过拟合=held-out 切片+时间演进重验(SWE-bench Verified/LiveCodeBench 范式)。
- **G-E judge 异构对照未做**:同模型+校准是业界接受形态(Databricks/Vertex 同款),最便宜补强=校准语料就绪时同批跑一遍 Ollama judge 对照一致率(回退路已设计,只差执行)。

## 5. 结论

作为个人/团队本地知识库挖掘引擎,**产出链现在够成熟可用**(staging 人工复核兜底,业界证据支持该保守姿态);不够成熟的是"入库之后"的保鲜与失效(G-C);评估基建就位但缺语料喂养。下一步序:G-B(✅已修)→ P2-2 critic(等 staging 人工标记 ≥30 含 ≥5 负例)→ G-C(P3 头项)→ G-D/G-E 随跑量补。

## 6. 关键来源索引

判定承重来源:arXiv 2601.08773(AST 图 vs LLM-KG)、2512.12117(citation-grounded,92%/零幻觉)、2504.21798(SWE-smith 空转定量)、2510.11822(agreeableness 陷阱 TNR<25%)、2306.05685(MT-Bench 80% 锚点)、2404.13076/2508.06709(自偏量化 5-20pp)、2405.09935(DEBATE refute-first 实证)、2606.10315(judge 抓 1/5 故障)、2510.04618(ACE)、2504.19413(Mem0)、2501.13956(Zep bi-temporal);产品一手:github.blog Copilot Memory 工程文、docs.qodo.ai best-practices、aider.chat/docs/repomap、sourcegraph.com(弃 embeddings)、claude.com(反索引立场)、cursor.com(Merkle 索引)、anthropic.com Citations API、cloud.google.com Check Grounding、swimm.io/fiberplane(漂移检测)、langchain.com Align Evals、openai.com SWE-bench Verified。完整来源见会话调研记录。
