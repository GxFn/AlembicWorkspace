# 测试整理与保留理由

本轮沿用现有测试文件、Core fixture 和临时项目辅助函数，不新增 `*.test.ts` 文件。

| 文件 | 调整与保留理由 |
| --- | --- |
| test/agent-lifecycle.test.ts | 准备/执行父取消、native/未知宿主、回调重复次数、主动aborted和partial回执属于不同生命周期边界；相同形态用 `it.each` 合并，复用stageOutput。控制signal与挂起Promise，不用真实网络等待。 |
| test/pipeline-outcome-abandoned.test.ts | 把最终回复、快速重试成本加入原管线结果套件；不另建文件或只测helper实现。 |
| test/recipe-production-profile-adapter.test.ts | 同一真实知识入口覆盖创建后的readiness/save失败、取消、标题预算、graph重评；复用fakePort、真实Core gate与既有原生profile/持久化fixture。包含本次抽取新增await竞争的回归。 |
| test/SubmitEvidenceExpansion.test.ts | 超时、取消、成功共用参数化风格修复用例；断言真实30秒默认策略与timer/listener释放。隔离Winston自己的调度器，不放松操作资源断言。 |
| test/provider-facades.test.ts | 通过mock fetch验证plain chat的取消真的到transport，和上面的repair包装测试互补。 |
| test/layer-contract.test.ts | 复用原CLI fixture，增加基于当前实际配置的4个反向依赖失败场景；保留原扫描器边界案例。 |
| test/memory-context.test.ts / test/llm-input-layering.test.ts | 原有81项覆盖共享生命周期提取后的记忆行为，无需再建一套镜像wrapper测试。 |

没有为了减少行数删除真实 Core 生产接口、strict epoch、权限、超时、取消或部分结果断言。原有测试目录维持66个文件。新增回归覆盖本轮确认的不同缺陷；后续若继续整理，应按消费者和行为重复来合并，不按文件长度盲删。

源码侧同步删除不可达的appeal提示，并收回3个仅在input.ts本地消费的helper export；不用“测试只检查名字”来证明行为保留。知识49声明映射、抽取块等价与真实入口验证共同构成迁移证据。
