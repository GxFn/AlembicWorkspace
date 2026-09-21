# Dashboard strict-test 冷启动入口触发与实现边界决策

- Decision date: 2026-08-03
- Decision owner: user
- Controller window: AlembicWorkspace
- Target window: AlembicDashboard
- Upstream accepted target: `v2-alembic-main-strict-test-private-pipeline-t1`

## User Goal

用户明确要求进入下一消费者阶段 AlembicDashboard，把 Candidates 页面现有冷启动入口连接到 Alembic Main 已接受的 `strict-test-dimension` API，不再从该入口走 legacy bootstrap。

本决策触发 Requirement Design §18.5 的 Dashboard conditional branch。它不启动 Test，不处理 DaemonJob 架构整改，也不改变正式 production/public 状态。

## Verified Concrete Gap

- `AlembicDashboard/src/App.tsx#handleColdStart` 仍调用 `api.bootstrap()`，并把返回的 legacy `bootstrapSession` 交给 Socket/DaemonJob 进度面板。
- `AlembicDashboard/src/api/modules.ts#bootstrap` 仍固定调用 `POST /api/v1/modules/bootstrap`。
- Candidates 页面“冷启动”和“清理重建”共用同一个 legacy handler；后者的 destructive 文案与 strict-test 的私有、非破坏语义冲突。
- `npm run check:api-types-drift` 已在 Dashboard 仓库复现失败：当前 `src/generated/api-types.ts` 与已接受 Main commit `b50bff157448b4986064ddbe20d8d2ad9305c738` 的 canonical artifact 不一致。
- Main 已接受并注册四个独立操作：`POST /strict-test-dimension/preflight`、`POST /strict-test-dimension/runs`、`GET /strict-test-dimension/runs/{runId}`、`GET /strict-test-dimension/runs/{runId}/report`。该 router 不依赖 DaemonJob 或 legacy bootstrap。

## Controller Implementation Decision

Dashboard 本阶段按以下唯一链路实现，避免目标窗口自行改变产品语义：

1. 从已接受 Main canonical artifact 机械同步 `src/generated/api-types.ts` 与 SHA-256 pin；不得手改生成文件，也不得通过 sibling source import 或新增 `@alembic/*` runtime dependency 消费合同。
2. 新增独立 strict-test API family。每个请求和每个实际 HTTP status 响应都通过生成的 operation validator；`projectRoot` 只接受 Dashboard 已从 Main runtime/project-info contract 得到的原始非空值，format validator 以该 provider-issued exact value 为 authority，不在浏览器猜 Node path dialect。
3. Candidates 冷启动 handler 生成一个唯一 `runId`，使用稳定产品级 `demandKey=dashboard-strict-test-dimension`，依次执行 preflight → 检查 `canAutoSelect` → start。维度由 Main 自动选择；UI 不提供维度选择器和确认门。
4. start 是长运行操作：发送后并行轮询同 run 的 status，直到 `STRICT_TEST_COMPLETED_PRIVATE` 或 `STRICT_TEST_FAILED`；随后读取 report。保存同一 run 的最小 authority（demandKey/runId/preflightHash/projectRoot identity）到 project-scoped session storage，刷新页面时只用同一 authority 幂等恢复，不创建第二 run。
5. Candidates 页面展示 backend-authoritative preflight、推荐/自动选中维度、full-universe 数量、phase、terminal、failure 和 report，并始终显示 `productionFinalized=false`、`publicRouteChanged=false`。不得用前端百分比、候选数量或通知文案制造完成态。
6. Candidates 页面原“清理重建”入口改成准确的非破坏 strict-test 重跑文案和图标；它与无 Recipe 时的冷启动按钮都进入同一 strict-test handler。Jobs 页通用 DaemonJob bootstrap、rescan 和 DaemonJob 过度设计整改不在本包。
7. 任何 request/response schema drift、缺失 projectRoot、`canAutoSelect=false`、普通 ProblemEnvelope 或 durable failed start 都 fail closed 并展示安全错误；禁止回退 `/modules/bootstrap`、`/jobs/bootstrap`、环境 test mode 或 Plugin briefing。

## Completion And Evidence

- Contract/adapter tests 覆盖精确请求、200/202/400/404/409/422 矩阵、422 durable failed status、schema drift、projectRoot authority、自动选择和禁止 legacy fallback。
- Hook/view-model tests 覆盖 preflight→start→poll→report、长运行、刷新恢复、success/failure/not-ready/404 与重复点击幂等。
- `npm run check` 全绿，包含生成工件 byte/hash drift gate。
- 使用真实 Alembic Main 服务做浏览器验收：点击 Candidates 冷启动后，网络链路只出现 strict-test 四操作族；没有 `/modules/bootstrap`、`/jobs/bootstrap` 或 DaemonJob 创建。保存成功或失败终态截图及请求/响应摘要。
- AlembicDashboard 提交本仓代码并回填 commit、命令输出、浏览器证据和剩余风险；Controller 独立复核后才决定下一阶段。Test 继续暂停。

## Forbidden Conclusions

- strict-test private 完成不等于 production finalized、正式 Recipe 已发布或完整 26 维生产覆盖。
- 本包不证明 DaemonJob 设计已修复，也不授权删除通用 Jobs 页面功能。
- mock/fixture 只能证明前端状态机，不得替代真实 Main HTTP 连通性证据。
