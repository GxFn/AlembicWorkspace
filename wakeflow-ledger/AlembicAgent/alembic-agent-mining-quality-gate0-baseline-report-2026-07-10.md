# 挖掘质量升级 · 门 0 基线报告 v1(2026-07-10)

需求:`alembic-agent-mining-quality-upgrade-requirement-2026-07-10.md`(§4 P0-2 完成定义、§16.2 门 0)。
用户当日提供临时 DeepSeek key 授权真跑,跑完即删;key 仅以进程环境变量传入,未落任何文件(报告与仓库已扫描确认)。

## 1. 方法

- Harness:`npm run eval:mining -- --judge --budget-tokens 800000`;golden set v1(单 fixture `wrapresult-convention`,期望 1 条发现);隔离=临时 fixture 副本+临时 dataRoot+内存 gateway(零触真实 KB)。
- Provider:`deepseek/deepseek-v4-flash`(autoDetect 默认档);judge 同 key 同模型(D1)。
- 对照:基线=65be28f(P0 收官、P1 改动前)构建的 dist;delta=e960eea(P1 全量)。每侧 n=1,LLM 方差警告适用(harness 自带注记:结论看区间不看单点)。
- 共 4 跑:第一对用原 harness;第二对用修正后 harness(见 §2)——**第二对是权威对照**。

## 2. 过程发现:harness 覆盖缺陷(已修,AlembicAgent 2c4a582)

第一对跑完后发现原 harness 直呼 `module-mining-session` profile,**绕过生产入口 `runScopedModuleMining`** 的 normalize/超大模块拆分/contextMap/预算附着——即 P1-B-1/2 根本没参与被测链路,第一对 delta 实际只量到 P1-A。修复:harness 改走生产入口(agentService shim 仅注入隔离 childContexts,请求形状由生产入口构造),两侧用同一把新尺子复跑。第一对数据保留作观测面证据(见 §4)。

## 3. 权威对照(修正 harness,同尺)

| 指标 | 基线 65be28f | HEAD e960eea |
|---|---|---|
| 候选数 | 0 | **5** |
| recall(heuristic) | 0%(期望发现 miss) | **100%**(3 条候选命中期望) |
| precision(heuristic) | n/a | 60% |
| precision(judge) | n/a | 40%(⚠ 全部裁决 invalidCitation,见 §5) |
| triviality | n/a | 20%(1 条 trivial-import-fact) |
| abandoned | 1(`handlers(degraded_no_findings)`) | 0 |
| analyze 阶段 | 20 迭代打满,gate `record_repair`×2 后仍只 2 findings→degraded | **15 迭代一次过门**(evidence=100,memoryFindings=5;预算档上限 18 未触) |
| terminal 调用 | 17 | **2** |
| 工具分布 | code17/evidence11/note_finding5/terminal17 | code8/evidence12/note_finding7/knowledge9/graph5/terminal2 |
| tokens(in/out) | 180k/9k(早退) | 342k/40k(走完 produce+submit) |

方向结论(带 n=1 保留):v4-flash 在无模块图谱时于 4 文件 fixture 上反复空转(terminal 刷屏、findings 不达标、degraded 弃置);注入确定性 contextMap 后首轮即接地并产出全量候选。delta 与 P1-B-1 设计机制吻合,非单纯方差可解释(第一对跑同方向:两侧均 0 但 HEAD 已能把弃置留痕)。

## 4. 第一对跑(原 harness,直呼 profile)保留观测

- 基线:0 候选、**abandoned=0 无留痕**(F2 修复前的静默归零本尊)、session 预算被顶至 124% 触发激进压缩(F1 场景实拍);terminal 38/61 次调用。
- HEAD:0 候选但 **abandoned=1(`handlers(retry_exhausted)`)**——F2 一等化在真机成立;session 峰值 90%,未再爆预算。
- 两跑对照证实:P1-A 的观测修复在旁路链路上也生效;产出能力的翻盘(§3)则需要生产入口的 contextMap 参与。

## 5. 待修观察项(登记,不改变本报告结论)

1. **judge 引用区间校验过严**:5/5 裁决 `invalidCitation` 被判无效(设计如此:无效即 void),但 judge 文本内容质量良好(2 reject 均带具体反证,如"字段是 ok 不是 success")。校验器对 judge 的 citedLines 格式适配待修;在修复前 precision(judge) 数字仅供方向参考。
2. **submitRepairs 双侧空 {}**:HEAD 有 9 次 knowledge 提交仍零修复计数。可能=draft 天然干净(机制上成立:证据扩展已确定性化),也可能=计数经生产入口的归并管道未贯通。**P2-1 裁撤修复层前必须先证伪"假零"**(E2E 或加量真跑确认计数管道)。
3. Harness 无 `--model` 旗标,只能评 autoDetect 默认档(v4-flash);评估生产实际模型档需补旗标。
4. 单 fixture、每侧 n=1:做趋势门槛(如 CI 尺)前需扩 golden set 与重复次数取区间。

## 6. 成本与 P2 门状态

- 4 跑合计约 1.26M 输入(高缓存命中)+ 77k 输出 tokens,成本远低于 ¥10 授权上限。
- **门 0:已完成**(本报告)。P1 前后对比在案,此后改动按需求 §4 附对比。
- **P2-1**:裁撤依据仍不足——当前修复计数为零样本(见 §5-2),需先证伪假零再积累量。
- **P2-2**:晋级门未动——校准需用户导出 staging 人工标记(`npm run eval:judge-calibration -- --input <export.json>`,≥80% 一致 ∧ ≥30 样本 ∧ 无自偏)。
