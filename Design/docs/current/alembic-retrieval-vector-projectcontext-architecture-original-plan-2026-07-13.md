# Alembic 检索真实性、向量端口隔离与 ProjectContext 实时构建架构 — Original Plan

- Design Key: `alembic-retrieval-vector-projectcontext-architecture-2026-07-13`
- Date: 2026-07-13
- Status: confirmed; ready-for-controller-intake
- Owner Window: Design
- Receiving Window: AlembicWorkspace controller
- Requirement Type: requirement
- Priority: P0

## User Goal

在不改变 Alembic 知识内容、不缩减五个公开知识工具能力、也不把查询答案持久化的前提下，完成以下三条互相关联的架构修复闭环：

1. 修复 BiliDili 宽泛英文查询对「分层依赖方向强制约束」Recipe 的不稳定召回，使固定八条英文改写都能稳定返回权威 Recipe，且 Search 与 Prime 的候选真实性一致。
2. 将当前混合了 embedding、读取、写入、融合、同步和 reconcile 的向量实现拆成明确的只读检索端口与独立维护链；查询不可触发写入或维护。
3. 保持 Graph / Recipe Map 实时读取真实 ProjectContext 事实，但用临时 `ProjectContextBuildSession` 合并同范围构建、提供逐仓增量结果和 opaque continuation，并让超时真正取消底层工作；不维护持久化查询答案。

## Problem

上一轮五工具质量需求已经修复了本地向量可用性、公开 Search 路由、孤儿向量的请求期过滤、SwiftPM target path、Graph 精确标识符、Recipe Map 漂移诊断、Guard 只读与向量生命周期清理。这些结果是本需求的迁移基线，不得重复实现或回退。

最新真实行为仍暴露三个更深层问题：

- BiliDili 八条宽泛英文改写只有四条准确命中目标 Recipe，一条零结果，三条弱相关；`language=swift` 已被排除为根因。
- 向量候选在权威 Recipe 聚合与 DB truth filtering 之前被最终 `topK` 截断；重复 semantic-region 和孤儿向量仍能占满候选窗口。RRF 还把页内最高分归一化为 1，弱结果页会伪装成高置信。
- Graph 与 Recipe Map 虽复用同一个 provider 类型，但每次各自重跑 `buildGraph`；file/symbol 查询仍先收集 space 和全部 repo；10 秒 repo timeout 与 120 秒 MCP deadline 都只放弃 Promise，不会取消底层工作；当前也没有可续取的临时结果会话。

## Confirmed Decisions

### Retrieval correctness

- 扩大底层候选池。
- 在最终 `topK` 前把所有向量/chunk/semantic-region 映射到权威 Recipe ID，过滤 orphan、deprecated，并聚合重复 region。
- 活跃 distinct Recipe 不足时继续有界 refill，直到补足、底层 exhausted、取消或明确达到候选预算；达到预算仍不足必须如实报告，不得静默伪装完整。
- 保留原始 dense similarity、dense rank、sparse score/rank 和 Dense/Sparse RRF contribution；不再把当前页最高 RRF 分归一化为绝对相关度。
- Search、Prime、Recipe Context 共用一个 `KnowledgeRetrievalPolicy` / `KnowledgeRetrievalPort`。Prime 只改变展示分组和数量，不重新定义候选真实性，也不通过独立绝对/相对阈值删除候选。
- 禁止硬编码英文同义词；禁止修改 Recipe 内容来掩盖检索缺陷；禁止先换模型代替修复候选守恒问题。

### Vector architecture

- Core 提供并落地真实实现：`EmbeddingPort`、`VectorIndexReader`、`HybridCandidateRetriever`、`KnowledgeTruthProjector`、`VectorIndexWriter`、`VectorLifecycleCoordinator`。
- `EmbeddingPort` 明确区分 query/document；模型特定格式只存在于 provider adapter，并公开 capability descriptor。
- Search / Prime / Recipe Context 只依赖只读 `KnowledgeRetrievalPort`。它们不可持有 writer、lifecycle coordinator、reconcile 或 indexing pipeline。
- `Markdown → SQLite → vector` 保持单向派生。`knowledge:changed`、显式同步和 reconcile 只进入维护链。
- 向量不可用时只降级 keyword；权威知识为空时返回没有知识。不得增加 MCP 可见性门禁、知识状态门禁、角色/Admin/host-selected-project 门禁或 Git 状态门禁。

### ProjectContext build strategy

- 不持久化维护最终 Graph / Recipe Map 查询答案。
- Plugin 新增可复用、临时的 `ProjectContextBuildSession`；同一 canonical projectRoot 和同一 normalized scope 的 in-flight 构建合并。
- Graph 与 Recipe Map 复用同一事实会话；Recipe Map 只在事实之上挂载权威 Recipe/source refs。
- 会话身份使用源码文件与清单事实指纹，不使用 Git revision、checkpoint 或 dirty state。
- file/symbol/source-slice/anchor 查询直接进入目标文件事实链，不启动全空间构图。
- 全空间按 repo 增量产生结果；首批结果内联，后续通过临时 result ref 和 opaque `nextCursor` 多次续取。
- MCP deadline 必须把 `AbortSignal` 传入 Plugin session 和 Core ProjectContext，真正停止底层扫描；完成消费、取消、过期和异常都清理临时文件。
- 只有上述方案实现并验证后仍不达标，才可把“持久化仓库级派生结构事实”记录为后续待决方案；仍然不得缓存最终查询答案。

## Repository Coverage And Phase Order

| Order | Window | Status | Responsibility |
| --- | --- | --- | --- |
| 1 | `AlembicCore` | required producer | 共享检索/向量端口、truth projection、refill policy、兼容 façade，以及 ProjectContext 可选取消契约；完成独立提交。 |
| 2 | `AlembicPlugin` | required consumer | request-scoped read-only retrieval wiring、Search/Prime/Recipe Context 同源、MCP continuation schema、BuildSession、Graph/Recipe Map 复用、真实 deadline cancellation；基于已接受 Core 提交完成独立提交。 |
| regression | `Alembic` | conditional no-task | 它是真实 Core `SearchEngine/VectorService/ProjectContext` 消费者。默认不改源码，但必须通过旧 façade 兼容回归；若 Core 无法保持兼容，停止并由 controller 判定最小同步，不能静默扩仓。 |
| regression | `AlembicAgent` | no-task | 没有新端口直接消费；只需证明现有 `@alembic/core/search` helper 未被破坏。 |
| regression | `AlembicDashboard` | no-task | 无 `@alembic/*` package 依赖；本需求不改变 Alembic HTTP wire 或 UI。 |

同一需求中每个仓库只创建一个 combined task package，由仓库窗口内部按本文阶段自排序；不得把同一仓拆成并行任务。依赖顺序固定为 Core commit → Plugin commit → controller 双项目真实验收。

## Fixed BiliDili English Recall Matrix

以下八条是本需求冻结的真实英文改写，不得在实现时替换为更容易命中的文本：

1. `How do we enforce clean architecture boundaries across Swift packages?`
2. `What architecture rules should guide modular boundaries in a Swift app?`
3. `How should layered dependencies flow across app, feature, service, and core modules?`
4. `What are the modularization constraints for independently removable features?`
5. `Where are dependencies allowed between UI features and shared core modules?`
6. `How should an iOS application structure feature modules to avoid coupling?`
7. `How do I keep SwiftPM feature packages independent from each other?`
8. `What prevents one feature module from importing another feature directly?`

权威预期项：

- Title: `分层依赖方向强制约束`
- Current authoritative Recipe ID: `eed49092-3cc8-4a2a-9a5d-29ead96e267b`
- Trigger: `@layered-dependency-direction`

验收必须以权威 Recipe ID 比较，不得只做标题字符串模糊判断。

## Completion Definition

需求只在以下全部成立时完成：

1. 固定八条英文改写通过 public Search 和 Prime 运行时全部非空；目标权威 Recipe 在每条结果 Top 3。
2. 相同 query、filter、candidate topK 下，Search 与 Prime 公布的 ordered candidate Recipe IDs 一致；Prime 的 knowledge/rule 展示分组不得改变该候选序列。
3. orphan、deprecated、重复 semantic-region 在最终 `topK` 前被权威聚合/过滤；首个候选窗口不足时存在真实的多轮 refill，不是固定 2x/3x overfetch 的文字重命名。
4. public retrieval evidence 保留 raw dense similarity/rank、sparse score/rank 和两路 RRF contribution；不存在“页首必须等于 1”的归一化契约。
5. provider missing、provider error、circuit open 三种情况均在有关键词候选时返回 keyword truth；只有权威知识为空时返回 knowledge empty。
6. query-time Search、Prime、Recipe Context 对 `VectorIndexWriter`、`VectorLifecycleCoordinator`、reconcile、index build 的调用数为 0；维护链仍能通过知识事件与显式命令正确写入。
7. query/document embedding 的调用目的由端口和 provider adapter 明确区分，capability descriptor 可观察；不得由上层拼模型特定 prompt。
8. Graph 与 Recipe Map 对同一 projectRoot/scope 共享同一个事实会话；并发同 key 只执行一次底层构建。
9. BiliDili 的 file/symbol 查询不执行 space 或无关 repo 的全量收集；AlembicWorkspace 全空间查询按五仓增量返回，并可通过多个 opaque cursor 无丢失、无重复地重组。
10. 现有 120 秒 heavy-tool deadline 不提高；超时触发真实 abort，底层 repo/file 探针停止，不留下后台工作或临时文件。
11. continuation 不暴露本地路径；临时数据不写入项目根或 Alembic data root；终页消费、取消、异常、TTL 过期后临时目录清零。
12. Core 与 Plugin 各自有独立提交、干净 worktree 和原始测试证据；Core 先于 Plugin。
13. controller 在现有 AlembicWorkspace 与 BiliDili 两个真实项目上完成五工具只读回归，且 DB/WAL/SHM/config/vector 的 before/after 指纹完全相同。
14. 没有修改真实知识库、Recipe 内容或 BiliDili 产品源码；没有 init/rescan/reconcile；没有 Test 窗口、持久答案缓存、Git 查询门禁或新角色/可见性门禁。

## Non-goals

- 不提高 120 秒 deadline 来掩盖构建问题。
- 不持久化 Graph / Recipe Map 最终查询答案。
- 不使用 Git revision、checkpoint、dirty state 或分支作为查询/复用门禁。
- 不把向量维护塞进用户查询主链。
- 不修改 Recipe 内容、添加英文同义词表或用模型替换掩盖候选问题。
- 不新增登录、Admin、角色、host-selected-project、知识状态或 MCP 可见性门禁。
- 不创建新测试环境、不派发 Wakeflow Test 窗口。
- 不修改 BiliDili 源码或真实知识库。
- 不为 Alembic、AlembicAgent、AlembicDashboard 制造形式性提交。
- 不在 Design 阶段修改产品代码、创建 state root、task package 或 dispatch packet。

## User-Confirmation Ledger

| Decision | Status | Source / boundary |
| --- | --- | --- |
| 作为一个新架构实现需求推进 | confirmed | 用户明确“按照建议架构实现”。 |
| 固定八条英文改写全部非空、目标 Recipe Top 3 | confirmed | 用户确认召回修复完成定义。 |
| `language=swift` 不是根因 | confirmed | 真实对照矩阵已验证。 |
| 禁止硬编码同义词、禁止改 Recipe 掩盖缺陷 | confirmed | 用户确认的非目标。 |
| Search/Prime 共用 KnowledgeRetrievalPolicy | confirmed | 用户确认 Prime 只改变展示。 |
| 六个向量职责接口与读写隔离 | confirmed | 用户确认的架构方向。 |
| Markdown → SQLite → vector 单向派生 | confirmed | 用户确认的知识真相边界。 |
| Graph/Map 继续实时查询，使用临时 BuildSession | confirmed | 用户确认不维护查询答案。 |
| file/symbol 快路径、逐仓增量、cursor、真取消、临时清理 | confirmed | 用户确认的构图健壮性方案。 |
| Core 先、Plugin 后；其它三仓默认 no-task | confirmed | 用户确认的仓库顺序与条件边界。 |
| no Test；controller 直接双项目只读验收 | confirmed | 用户确认现有环境足够。 |
| Core/Plugin 分别提交 | confirmed | 用户明确提交要求。 |
| 未决产品问题 | none | 所有影响范围、行为和验收的决定均已确认。 |

## Testing Decision

- Decision: `no Test window`。
- Reason: 风险可由产品仓的确定性单元/契约测试、controller 复跑，以及现有两个真实知识项目的只读公共工具调用证明；不需要 Test 专属环境或长期观察。
- Real acceptance roots: AlembicWorkspace 多仓模式；`BiliDili/` 独立项目模式。
- Forbidden during real acceptance: init、bootstrap、rescan、reconcile、知识提交、向量重建、配置修改、真实数据写入。
- Required zero-write proof: 对运行时解析出的 DB、WAL、SHM、config、vector index 记录 `exists + size + mtime + sha256`，在整套调用前后逐项一致；缺失文件也必须保持缺失。
- 若 MCP 需要加载新构建，可由 controller 使用刷新后的新临时 Codex host 窗口/进程取证；这不是 Wakeflow Test 窗口，也不创建新测试环境。

## Source Baseline

| Repository | Audited HEAD | Worktree | Role |
| --- | --- | --- | --- |
| `AlembicCore` | `6b7de17494bac4236822d8a0baaa61cc3b01b670` | clean | producer |
| `AlembicPlugin` | `be7bc058fcd188f38b48ee551f912377c2d19f1d` | clean | consumer |
| `Alembic` | `ac4921580ec1bbfb644886b6a201baeb1c1a2921` | clean | compatibility regression |
| `AlembicAgent` | `8aa184b88cbe99f07349ce8bfff69443dd98143d` | clean | no-task regression |
| `AlembicDashboard` | `f26427682f45cce6ce5ce4304ce9dfde84c26f17` | clean | no-task boundary |
| `BiliDili` | `12c0531cbf1bea36102f9d2d2b8ad4e1cef09221` | clean | existing read-only acceptance fixture |

The previous completed demand `alembic-plugin-five-tool-vector-quality-2026-07-12` is an inherited accepted baseline, not a dependency to reopen. Its accepted Core/Plugin heads are the baseline shown above.

## Design Exit Gate

- Code-fact reconciliation: complete against current Core/Plugin source and direct consumers.
- Per-window landing plan and `designIntent`: complete in the linked Requirement Design.
- Non-goals: complete and user-confirmed.
- User-confirmation ledger: complete; no open product question.
- Test decision: complete; no Test window, existing dual-project read-only controller validation.
- Controller intake status: ready; Design may formally deliver with `autoClaim=true`.

## Linked Requirement Design

`Design/docs/current/alembic-retrieval-vector-projectcontext-architecture-requirement-design-2026-07-13.md`
