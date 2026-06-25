# Plugin 域推进组 — MTC(MCP 表面清理)+ DRR/CCR(决策寄存器/Guard 报告跨 4 仓下线);GMAP/RIC 已完成 进度

## 统一状态

<!-- unified-status:start -->
需求: alembic-four-tool-plugin-cleanup-sequencing-2026-06-18 - Plugin 域推进组 — MTC(MCP 表面清理)+ DRR/CCR(决策寄存器/Guard 报告跨 4 仓下线);GMAP/RIC 已完成
主状态: completed
阶段: 无
当前任务包: mtc-1-plugin-deadcode-delete(accepted), w1-alembic-consumers-drr1-ccr1(accepted), w1-dashboard-consumers-drr1-ccr1(accepted), w2-plugin-entry-ring-mtc2-mtc7c8(accepted), w2-alembic-drr2-decision-register-http(accepted), w2-core-d25-needs-confirmation-relax(accepted), w2-dashboard-apitypes-resync(accepted), w3-plugin-mcp-surface-mtc3-7(accepted), w3-alembic-drr3-decision-register-store(accepted), w3-core-ccr3-analyzer-delete(accepted), w3-ccr-alembic-compliance-route(accepted), w3-ccr-plugin-analyzer-tests(accepted), w4-plugin-realrun-docs-scenarios(accepted), w4-core-outputbudget-jobname(accepted)
窗口: AlembicPlugin(accepted), Alembic(accepted), AlembicDashboard(accepted), AlembicCore(accepted)
阻塞项: 无
下一步: wakeflow-render-progress
评审: demand-completed
自动化: 未启用
需要用户决策: 无
最后更新: 2026-06-18 21:53 CST
来源状态: revision 93 / event evt-20260618135300-0093
<!-- unified-status:end -->

## 目标

编排文档 alembic-four-tool-plugin-cleanup-sequencing-2026-06-18 的 4 需求推进组,按 P0~P9 依赖序执行。重锚:GMAP(四工具+ProjectContext/RecipeContext 地基)与 RIC(接口职责清理)本 session 已完成验收;剩余实质 = MTC(AlembicPlugin MCP 表面命名规整+退役清理+碎片合并,28 active→~18)+ DRR/CCR(决策寄存器 decisionRegister 与 Guard 覆盖/合规 coverage·compliance 跨 4 仓彻底下线,用户 C9=B)。共 4 仓:AlembicPlugin/Alembic/AlembicCore/AlembicDashboard。共享 Plugin 入口环(MTC-2=DRR-2、MTC-7C8=CCR-2)组级只执行一次、两需求账各回填。不改四工具核心语义、不破 prime/code_guard 主体、不改 MCP 协议实现(C6 保留 McpServer 类名+#codex import key)。

## 完成定义

MTC:① 删退役死代码(handlers/panorama+task、整个 lib/runtime/mcp/source-graph/ 目录、死路由、project_matrix/submit_knowledge_batch 残留;保留 structure.graph());② 删 alembic_intent(C2a 连 intake 拆,work/code_guard 主逻辑不破)+ alembic_decision_record(C2b Plugin 入口);③ graph 唯一结构入口;④ status 合一(alembic_mcp_status+alembic_codex_diagnostics+alembic_health→alembic_status,跨 server gate OR、cold-start 态不触 resident-only);⑤ 去 codex 命名(Host*、CodexMcpServer→HostMcpServer、bin/codex-mcp→host-mcp、host-neutral 文案;保留双壳分发层专属);⑥ 去 mcp 命名(C6 保留 McpServer 协议类+#codex key);⑦ 合并(job 3→1、stop+cleanup→runtime、guard check/review 并 code_guard、coverage/compliance 下线 Plugin=CCR-2、work_start+finish→work;evolve/consolidate/dimension_complete 保留);⑧ 硬切无别名、同步 7 处 100+ 引用、双壳 tools/list parity 重建。
DRR(decisionRegister 全下线):删消费者(Alembic PrimeInjectionPackage decisionRegister section+retrievalQuality 输入+IntentEvidence、Dashboard decision-register surface;prime 主体不破)→ 删入口(Plugin decision_record=共享环、Alembic decision-register.ts HTTP+挂载+daemon route+provider-contracts)→ 删实现(Alembic DecisionRegisterStore+DI+schema+dashboard-api-types 残留)。
CCR(coverage/compliance 全下线;CCR-0 已证 check 独立→CCR-3 全删):删消费者(Dashboard 覆盖率视图、Alembic guardReport.ts HTTP+挂载)→ 删入口(Plugin coverage_matrix/compliance_report=共享环+schema)→ 删实现(Core CoverageAnalyzer/ComplianceReporter/SourceFileCollector+guard/index 导出+Alembic GuardModule/ServiceMap DI;顺手清 2 处注释)。
全局:每删除双闭包 reachable 验证;先消费者→入口→实现不倒置;prime/code_guard 主体绿;各仓 build/check/lint 绿;嵌入式 daemon 契约+双壳 parity 不破;各仓改动由其窗口提交、只在 main。RR-DONE:4 仓无残留 import、各 build 绿。

## 阶段计划

P0 控制器只读盘点 = 已完成(独立核实)。基线 HEAD:Plugin 513b6ac、Alembic ea07190、Core bb1f192(均 post-GMAP/RIC)、Dashboard 937893d。证据见 evidence/p0-pdg-inventory-2026-06-18.md。

四个 P0 结论(全部独立核实):
- 重锚:GMAP+RIC 两 track 已完成验收 → 编排 P1/P3(GMAP)、P2-RIC-7、P7(RIC-2/3/4/5)、P0-RIC-0/1、P9-RIC-6 满足;三闸门 GMAP-2/GMAP-8 已过,只剩 CCR-0(已证)。
- CCR-0(关键)= clean:GuardCheckEngine 不引用 CoverageAnalyzer/ComplianceReporter/SourceFileCollector;ComplianceReporter:282 反向调 engine.auditFiles;SourceFileCollector 仅 ComplianceReporter 用;两 repo 的 CoverageAnalyzer 仅注释(KnowledgeRepositoryImpl:800/GuardViolationRepository:287);check 的 checkCoverage(:1724) 是自有指标 → code_guard check 独立,CCR-3 可全删三 analyzer。
- MTC-2 前置 = 满足:prime 已解耦 intent(buildPrimeRequirementIntake 独立、用共享 extractIntent、不调 intent 工具,GMAP-8 注释确认)→ MTC-2 可删 intent。
- MTC-0 基线:28 active(19 tools.ts+9 codex-local)确认;死代码 panorama/task/source-graph(0 引用)确认;RIC-7/MTC-1 无重叠;CodexMcpServer(bin/codex-mcp:32)→HostMcpServer 锚点。
- DRR-0 = clean:prime decisionRegister section + retrievalQuality 可干净移除(主体不破);Dashboard decision 视图仅 policy 桩(无 active projector/UI)可删;DRR-1 消费者清单(10 Alembic+2 Dashboard)定位完。
- C6 = 保留(用户 2026-06-18):McpServer 协议类名 + #codex import key 保留,MTC-6 只去工具名冗余 mcp。

Wave 排期(依赖驱动、阻断清单不倒置、共享环只做一次):
W1(P2+P4 消费者,并行,无前置):MTC-1 删 Plugin 死代码(panorama/task/source-graph 整目录/死路由/project_matrix 残留;保留 structure.graph();双闭包)→ AlembicPlugin。DRR-1+CCR-1 删 Alembic 消费者(PrimeInjectionPackage decision section+retrievalQuality+IntentEvidence;guardReport.ts HTTP+挂载)→ Alembic。DRR-1+CCR-1 删 Dashboard 消费者(decision-register surface/policy/api-types;覆盖率视图)→ AlembicDashboard(需确认窗口注册)。
W2(P5 共享 Plugin 入口环,只做一次;前置 W1 的 DRR-1/CCR-1):Plugin 删 alembic_intent(连 intake)+ alembic_decision_record(=DRR-2)+ 下线 coverage_matrix/compliance_report(=CCR-2);Alembic 删 decision-register.ts/guardReport 残留 HTTP 入口 → AlembicPlugin + Alembic。
W3(P6+P8 并行;前置 W2 入口已删):MTC-3/4/5/6/7 Plugin 表面整合(graph 唯一入口、status 合一 gate OR、Host*+HostMcpServer、去 mcp、job/runtime/work/guard 合并)→ AlembicPlugin;DRR-3 删 DecisionRegisterStore+DI+schema → Alembic;CCR-3 全删 Core CoverageAnalyzer/ComplianceReporter/SourceFileCollector+guard/index 导出 → AlembicCore(+ Alembic GuardModule/ServiceMap DI)。
W4(P9):MTC-8 硬切+同步 7 处 100+ 引用+双壳 tools/list parity 重建;RR-DONE 4 仓无残留 import 验收;各仓 build/check 绿。

硬决策(不回头):C9=B 逐仓下线;CCR-3 全删(CCR-0 已证);C6 保留;硬切无别名;先消费者→入口→实现不倒置;prime/code_guard 主体不破;双壳 parity+嵌入式 daemon 契约不破;各仓窗口各自提交、只在 main、不开分支。GMAP/RIC 已完成不重做。每 wave 仍走各需求 confirmation gate。

## 任务包

## 回填摘要

## 决策和追加日志
