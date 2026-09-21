# Production 审查清理替代映射

所有删除已获根线程明确授权；无 commit，均待独立 review。

| 删除/精简项 | 真实替代/保留行为 | 证据 |
| --- | --- | --- |
| PlanSelectionProjection 最后纯 typeof 四符号测试 | `assertPlanSelectionShape`：accepts a single-dimension selection and rejects empty or malformed selections | 同文件公共 `../src/plans.js` import；production-plan-selection-cleanup-before.ts.txt |
| 同上 `assertPlanSelectionStageRequirements` | enforces module×dimension targets only for deepMining and moduleMining selections；rejects stage-required bindings；expected-stage positive/negative | production-plan-selection-cleanup-green.log，含 PublicApiInventory，总10通过 |
| 同上 `planSelectionRequiresModuleTargets` | enforces module×dimension targets only for deepMining and moduleMining selections，实际调用coldStart/deepMining/moduleMining并断言布尔 | 同上 |
| 同上 `applyPlanSelection` | projects execution dimensions, module scope, budgets, and unknown ids；test-mode override边界 | 同上 |
| SnapshotViews.toResponseData及专属说明 | 真实toSessionCache保留，GenerateSessionManager/PublicHostAgentWorkflowEntrypoints/IDEAgentAnalysisPacketBuilder三suite34通过 | production-snapshot-view-consumer-scan.log / production-snapshot-view-public-reachability.json / production-snapshot-view-removal-green.log |
| GenerateDedup + RecipeSimilarity相同ngram循环 | shared/similarity内部helper，外层权重、token化和现四公开导出保持 | production-ngram-baseline.log / production-ngram-green.log / production-public-boundary.log |
| V3/V4 semantic gateway完整executions Map value保留 | 仅存execution hash Set；V2仍Map回读原execution | production-semantic-execution-retention-scan.log / production-semantic-retention-{baseline,green}.log |
