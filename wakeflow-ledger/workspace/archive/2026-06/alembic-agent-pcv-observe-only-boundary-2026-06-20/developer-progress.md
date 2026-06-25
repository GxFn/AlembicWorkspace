# AlembicAgent PCV/PCVM Observe-Only Boundary Convergence 进度

## 统一状态

<!-- unified-status:start -->
需求: alembic-agent-pcv-observe-only-boundary-2026-06-20 - AlembicAgent PCV/PCVM Observe-Only Boundary Convergence
主状态: completed
阶段: 无
当前任务包: ap-0-pcv-baseline-characterization-factchecks(accepted), ap-1-extract-provider-toolchoice-policy(accepted), ap-2-extract-analyze-grounding-guard(accepted), ap-3-grounding-enforcement-default-off(accepted), ap-4-evidence-purify-enforcement-marker(accepted), ap-5-agent-five-scenario-acceptance(accepted), ap-6-main-consumer-audit-semantics(accepted), ap-7-quality-run-guard-optin-wiring(accepted)
窗口: AlembicAgent(accepted), Alembic(accepted)
阻塞项: 无
下一步: wakeflow-render-progress
评审: demand-completed
自动化: 未启用
需要用户决策: 无
最后更新: 2026-06-21 24:36 CST
来源状态: revision 36 / event evt-20260620163610-0036
<!-- unified-status:end -->

## 目标

把 AlembicAgent 内 PCV 从「默认占用并控制 LLM 主循环」收敛为「默认 observe-only 旁路证据层」。grounding enforcement（analyze 阻断+nudge+grounding-policy 指令注入）默认关闭、改名归位独立 AnalyzeGroundingGuard（显式 groundingEnforcement='guard' 开启）；DeepSeek V4 tool-choice 作为 provider 正确性收敛独立 ProviderToolChoicePolicy（默认保留、不回归、与 grounding 解耦）；PcvNodeEvidence 保留为纯观察、剥离 provider mode 计算。跨仓：AlembicAgent(主实现) + Alembic主体(lib/workflows/ai-execution 证据消费改判审计语义) + PCVM/Test(per-run opt-in 开 guard)；AlembicCore observing 无改动。不改四工具/LLM 循环对外业务语义；不删 PCV/PCVM 证据结构；不关 insightGate quality gate(PD3)。开关粒度=全局默认 off + per-run/per-invocation 覆盖(PD7)。

## 完成定义

① 默认 observe-only：默认下主循环行为(prompt/toolChoice/graceful-exit/阶段推进/成功条件)与「完全不读 PCV」一致(除少量 trace 字段)。② enforcement 显式化且改名归位：grounding 阻断/nudge/政策注入收敛进默认关闭的 AnalyzeGroundingGuard(命名去 Pcv 前缀)。③ provider 与 grounding 解耦：ProviderToolChoicePolicy 默认保留、DeepSeek V4 不回归。④ 证据契约不破+additive enforcement-mode 标记：PcvNodeEvidenceSummary 及被主体/PCVM/Test 消费字段继续产出。⑤ 主体跨仓 consumer 对齐：ai-execution observe-only 下 grounding summary 改判审计语义、不误判回归、消费 enforcement-mode 标记。⑥ guard 有真实消费者：≥1 条质量运行链路(PCVM/Test)显式开 guard、回路端到端非空开关。⑦ 测试覆盖五场景：observe-only 默认/guard-enabled/DeepSeek V4/graceful exit/analyze 无证据；跨仓证据回归通过。⑧ 可观测性不降：sourceRef diagnostics/quality gate metadata/missing-link diagnostics 仍可审计读取。

## 阶段计划

AP-0~7（执行序 AP-0→AP-1→AP-2→AP-3→AP-4→(AP-5∥AP-6∥AP-7)；AP-1/2 须在 AP-3 切默认前；AP-6 依赖 AP-4 标记、AP-7 依赖 AP-3 per-run；先能力后接入不裸断）。AP-0 盘点+锁基线：四控制点(grounding-policy 注入 LLMInputAssembly.ts:440-442/523-534、DeepSeek V4 toolChoice AgentRuntime.ts:884-905/2207-2241、抑制例外 :1129-1151、analyze 阻断+nudge :1576-1605/1707-1732)写表征测试 + 4 项事实核实(insightGate↔grounding 是否彻底解耦【或有用户决策】、主体 buildPcvAnalyzeGroundingLedgerSummary 聚合字段、groundingEnforcement 配置挂载层+per-run、PCVM/Test Agent-run 注入点)。AP-1 抽 ProviderToolChoicePolicy(行为对等默认生效)。AP-2 抽 AnalyzeGroundingGuard(迁阻断/nudge/政策文本注入，不含证据 ref 列表 PD5；暂仍开)。AP-3 引 groundingEnforcement 默认 off(guard+政策注入仅 guard 生效；provider 不受控)。AP-4 证据纯化+additive enforcement-mode 标记(生产者/消费者分界)。AP-5 Agent 五场景测试+验收。AP-6 主体跨仓 consumer 更新+跨仓回归(依赖 AP-4 标记)。AP-7 PCVM/Test guard opt-in wiring+端到端(依赖 AP-3 per-run)。跨仓 Agent+主体+PCVM+Test，Core observing。

## 任务包

## 回填摘要

## 决策和追加日志
