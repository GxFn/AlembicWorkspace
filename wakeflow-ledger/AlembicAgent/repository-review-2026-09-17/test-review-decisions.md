# 测试精简与覆盖保留

本轮减少重复准备代码、无产品行为的断言和重复文件；不以减少用例数量为目标。原有成功、失败、取消、超时、权限、部分结果与独立公开包消费验证均保留。

| 位置 | 处置及依据 |
| --- | --- |
| index.test.ts、remaining-host-contract.test.ts | 合入 contract-surface.test.ts；删除两个小文件，保留各公开入口及宿主适配断言。 |
| style-waiver.test.ts | 删除与 Core 算法测试重复的 7 项枚举；Agent 保留 Core 函数引用一致性及真实 authoring handler 的 waiver/advisory 集成。 |
| ai-provider.test.ts | 删除 TestLocalFakeProvider 及只测试该本地类自身实现的用例；真实 provider/factory/manager 测试保留。 |
| agent-interface-contract.test.ts | 删除手写 partial envelope 再断言自身字段的辅助函数；仍通过真实 contract 查询验证 partial 语义。 |
| evidence-ledger-baseline.characterization.test.ts | 删除 JSON fixture 数字与硬编码自身数字对照的伪回归；历史 fixture 保留作人工比较。其余产品行为断言保留。 |
| ExplorationStrategies.test.ts | 六套相同 Producer 完成语句准备改为参数表，所有文字、提交数量、目标及结束行为断言保留；提前完成拒绝仍独立测试。 |
| evidence-recording-phase-chain.test.ts | 删除零消费者 runtime/tracker helper 及导入，保留真实阶段、schema 与 evidence 接线。 |
| helpers/tempProject.ts | 共用临时项目创建及 afterEach 清理；证据、提交、生产 profile 等测试复用，不替换真实磁盘行为。 |
| Redaction/shared-ai-utils/terminal 等输入矩阵 | 参数化独立边界，补已复现缺陷；保留特定失败原因与成功反例。 |
| agent-lifecycle.test.ts | 新增必要执行链覆盖：主动取消、迟到回复、首轮预算、阻断 hook、运行超时与成功恢复，弥补过去仅直接调用 reactLoop 的缺口。 |

## 审查后保留的测试

- Provider 与 Transport 分别检查公开配置接线和厂商协议归一，不因 mock 响应外形相似就删掉其中一层。未来可局部复用输入 fixture，但不能只留下直接 Transport 测试。
- PCV off/guard、五场景 acceptance 与 runtime 事件/脱敏各有独立输出契约。更大规模合并容易把开关、回滚及观测证据混为同一检查，本轮保留；没有将 observe-only 升格为执行控制。
- `durable-semantic-review-runtime` 的 single/shared/cross-harvest、跨进程恢复、签名、并发与防重放是不同真实拓扑，不用任意 hash mock 代替。重复 setup 可继续局部整理，不能据此删场景。
- Evidence Collector、Ledger authority、提交 freshness、运行时 schema 与 authoring Core gate 检查的事实不同。保留其端到端边界，优先共享临时目录生命周期。
- 公共导出负例、冻结签名和真实宿主新进程消费保留独立 expected 值，避免从被测配置生成期待值而形成自证。
- Golden 与 calibration fixture 是可复现历史输入。本轮明确 frozen 报告的 synthetic calibration / declared stage order 含义，不把重复样本算作独立人工校准，也不降低 min-sample 或 validation-floor 门槛。
- embedding capacity、MemoryStore staleness 等小矩阵可继续表驱动，但没有混合独立失败语义来追求更少行数；它们不属于确定的死测试。

## 数量与含义

起点：73 个测试文件、609 个执行用例。文件合并/删除后新增 lifecycle 文件，最终为 71 个测试文件；缺陷回归使执行用例增加。声明计数脚本现在识别 `it.each`，统计声明块而非展开的数据行，因此声明数与 Vitest 执行数不相等。

最终完整执行结果见 `verification.md`。所有新增 provider 测试使用 mock/fixture，无真实 API 请求。
