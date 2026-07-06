# 主体生命周期适配 真实验证 + 覆盖回写致命修复 follow-up — Original Plan

Date: 2026-06-26
Design Key: alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26
Source Window: Design
Status: ready-for-intake

## 背景

对主体适配 [[alembic-mainbody-lifecycle-adaptation]] 做"各阶段+最终目标 vs 真实代码"审计(6-agent 对抗,综合 agent 独立全核)+ Design spot-check 得颠覆性结论:**A-F 六阶段已实现并 push 到 main**(Design 亲验:`plan.profile.ts`/`PlanAgentRun.ts`、Core `applyPlanSelection:75`、主体 `runPlanSelectionGate:922`/`runDeepMiningRounds:1020`/`runModuleMiningWorkflow:1160`、`EvolutionMaintenanceSweep.ts`+`KnowledgeModule.ts:241` 注入,主体 main==origin/main)。

**流程状态修正(2026-06-27 核对)**:控制器已把 `alembic-mainbody-lifecycle-adaptation-2026-06-26` **完成、接受并归档**(state idle、delivery 残留已隔离),所以"pending-claim 不一致"已被归档消解。但归档 `developer-progress.md` 只有标题行、**零真机/零 coverage/零 finding#1 证据** → 这是 **post-archive 假完成(false-complete)**:A-F 按"代码在场"接受、没人发现 deepMining 覆盖回写缺失、CD-6 真机从未发生。**本需求 = mainbody 的 post-archive 真实验证+致命修复 follow-up**(与伞形 realverify-followup 同型)。真实剩余只两项。

## 用户目标

把主体适配的真实剩余工作做完:**(1)修一个致命未完成缺陷**——deepMining 缺覆盖账本 in-process 回写(`DaemonJobRunner.ts:1020-1158` 回写链空,vs Plugin `coverage-ledger-write.ts:62/166`)→覆盖永不前进、converged 死代码、"深=覆盖增量"落空;**(2)真 BiliDili 端到端真机验收**(CD-6 从未发生)。**不重做已实现的 A-F。**

## 范围

- 拥有:finding#1 deepMining 覆盖回写致命修复(执行前必修)+ 真 BiliDili 端到端真机验收 + U1-d 真机前置核 ProjectMap.modules。
- 不拥有:不重做已实现 A-F;B4 Plugin gate 双写收敛=独立 PD-7 follow-up;U2-a suffix=Core 域(mainbody 不继承)。
- 跨仓:主体 lib(修)+ codex host-agent(真机)。base 锁 Core `1553e2f`/Alembic `eebe4ad`/Agent `c38d2c4`(无需等任何东西)。

## 完成定义

见 [requirement design](alembic-mainbody-lifecycle-realverify-residual-followup-2026-06-26.md)。核心:**finding#1 回写链修后**真 BiliDili 跑出 coverage_ledger cell grade 晋级(empty→partial/covered)+ covered_count>0 + 可达 converged(修前必证伪:恒 empty/绝不 converged);deepMining 多轮 deep_mining_rounds 多行递减;moduleMining 增量>0;evolution sweep 真维护(decayDetector 注入生效);全程 anti-fabrication 真拦、门禁不放松。真机证据,不接受忠实副本"再验机制"替代。

## 阶段候选

**Phase FIX**(覆盖回写修复,主体+Core[CG-3 选 B 时],base Core HEAD 无前置依赖):按 requirement design §3 集成点(hook 进 KnowledgeRescanWorkflow per-dimension 生成处,镜像 Plugin dimension-completion)+ §3.6 改动清单;验收=build:check 绿 + 定向 unit(cell empty→回写后 grade 晋级/coveredCount>0、adviseCoverageLedger 全覆盖返 converged)+ Plugin 零回归(B 时)+ 门禁守住(不达标 recipe 不进覆盖)。**Phase VERIFY**(真 BiliDili 7 步,codex host-agent):步3=finding#1 GATE(修前证伪恒 empty/绝不 converged、修后 grade 晋级+可达 converged)。U1-d 真机前置核。

## 待决策(已决，2026-06-27 用户拍板)

CG-1 = **真机沙箱边界**(§7 沙箱法:`.backup()` 真 DB 进 `ALEMBIC_HOME` 沙箱、保护真 `~/.asd`)/ CG-2 = **Ollama 接通**(真机本地 Ollama，semantic_memories 真验)/ CG-3 = **B 下沉 Core**(coverage-ledger-write 两函数移 Core、Plugin re-import 零回归、主体共消费;同落分层重构一处下沉)。**流程动作**:本需求不改控制器 index/status(Design 边界);控制器 intake 时须在归档的 mainbody 记录上挂"finding#1 致命残留+CD-6 未真机验收"修正注记,不得把"已归档 completed"当"已真实达成"。

## 非目标

不重做已实现 A-F;不在只读副本"再验机制";B4 收敛不入本包(独立 PD-7);U2-a 不在 mainbody 修;回写修复严禁虚增覆盖放门禁;push/发版用户门。

## 详细设计

见 requirement design(strict):审计结论(spot-check 证实)+ finding#1 致命修复(code-level)+ 残留(B4/U1-d/U2-a)+ base/时序颠覆 + 真 BiliDili 7 步执行指导(命令+SQL+期望)+ CD-1~6 对照 + 板态处理 + 风险。
