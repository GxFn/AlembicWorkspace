# Small Fix / Cleanup Repair Wave

更新日期：2026-05-23
总控窗口：AlembicWorkspace
状态：直接修复已验收，等待用户确认 / 证据封口
发送给：无

## 目标与完成定义

本计划承接 [small-fix-cleanup-self-check-plan-2026-05-23.md](../../../current/small-fix-cleanup-self-check-plan-2026-05-23.md) 的六仓库自检结果。自检阶段已经完成，结论是：本轮不是“没有问题”，而是发现了一批可直接小修、需要用户确认和适合观察的事项。

用户目标仍是“小问题修复 / 清理修复”，结束条件是自检发现的问题全部有处理结论。本波只派发不触发确认门禁、不会改变产品职责边界、不会触碰真实项目的修复包；需要用户确认或授权的项先留在 TODO / Backlog，不让执行窗口先行删除或改语义。

本波完成定义：

- `Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`、`AlembicTest` 完成本计划分配的直接修复项并回填证据。
- 所有直接修复项要有提交 hash、验证命令和结果。
- 观察项和待确认项保持记录，不被执行窗口顺手删除、迁移或改变默认行为。
- 修复后总控再次验收，并决定是否进入确认项处理、观察归档或最终归档。

## 总控验收结论

2026-05-23 17:55 CST，总控验收 SFC-R1 回填：

- `Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin` 的直接修复项通过证据验收。
- `AlembicTest` 的 SFC-R1 文档小修通过证据验收，但 `AlembicTest` 仓库仍有未跟踪证据文件：`docs/small-fix-cleanup-self-check-2026-05-23.md` 和 `docs/global-function-boundary-evidence-test-2026-05-22.md`。前者是本轮自检证据，后者是本轮前遗留 GFBD 报告，需用户 / 总控确认后封口。
- 当前不再派发新执行窗口；下一步是用户确认待确认 / 待授权项，或确认把它们转入全局 TODO 后归档当前小修主线。

## 自检报告入口

- `Alembic`：[../../Alembic/small-fix-cleanup-self-check-2026-05-23.md](../../../../Alembic/small-fix-cleanup-self-check-2026-05-23.md)
- `AlembicCore`：[../../AlembicCore/small-fix-cleanup-self-check-2026-05-23.md](../../../../AlembicCore/small-fix-cleanup-self-check-2026-05-23.md)
- `AlembicAgent`：[../../AlembicAgent/small-fix-cleanup-self-check-2026-05-23.md](../../../../AlembicAgent/small-fix-cleanup-self-check-2026-05-23.md)
- `AlembicDashboard`：[../../AlembicDashboard/small-fix-cleanup-self-check-2026-05-23.md](../../../../AlembicDashboard/small-fix-cleanup-self-check-2026-05-23.md)
- `AlembicPlugin`：[../../AlembicPlugin/small-fix-cleanup-self-check-2026-05-23.md](../../../../AlembicPlugin/small-fix-cleanup-self-check-2026-05-23.md)
- `AlembicTest`：[../../../AlembicTest/docs/small-fix-cleanup-self-check-2026-05-23.md](../../../../../AlembicTest/docs/small-fix-cleanup-self-check-2026-05-23.md)

## TODO / Backlog

| ID | 状态 | 推荐窗口 | 摘要 | 处理结论 |
| --- | --- | --- | --- | --- |
| SFC-ALEMBIC-001 | 已完成 | `Alembic` | `AGENTS.md` 仍列 `#external/*` 旧 alias。 | 已在 `50dbaef15cf16273d01971e192a318450a0df878` 修文档口径；总控验收通过。 |
| SFC-ALEMBIC-002 | 已完成 | `Alembic` | `lib/external/mcp/handlers/bootstrap` 空目录残留。 | 已删除空目录并保留 `lib/external/mcp/README.md` marker，提交 `50dbaef15cf16273d01971e192a318450a0df878`；总控验收通过。 |
| SFC-ALEMBIC-003 | 已完成 | `Alembic` | `lib/external/ai` deletion-candidate 文案与现状不一致。 | 已在 `50dbaef15cf16273d01971e192a318450a0df878` 改成 retired negative guard 口径并保留负向检测；总控验收通过。 |
| SFC-ALEMBIC-004 | 已完成 | `Alembic` | `/api/v1/ai/env-config` 注释写旧 Dashboard，但当前 vendored Dashboard 仍消费。 | 已在 `50dbaef15cf16273d01971e192a318450a0df878` 改注释且未删除 API；总控验收通过。 |
| SFC-ALEMBIC-005 | 观察 | `Alembic` | Biome warning / info 规模较大。 | 不纳入本波；后续独立 lint debt。 |
| SFC-CORE-001 | 已完成 | `AlembicCore` | Core `AGENTS.md` 外层接入口径偏向 vendor。 | 已在 `69bda3ff6ac413ac1fc318253a840986660a4386` 修成本地源码优先、发布 / snapshot 才看 vendor；总控验收通过。 |
| SFC-CORE-002 | 已完成 | `AlembicCore` | `normalizeLifecycle` 未经 `@alembic/core/knowledge` facade 导出。 | 已在 `69bda3ff6ac413ac1fc318253a840986660a4386` 做 additive export，并补 public API smoke / targeted test；总控验收通过。 |
| SFC-CORE-003 | 已完成 | `AlembicCore` | `concurrency.ts` 注释示例使用外层 `#shared/*`。 | 已在 `69bda3ff6ac413ac1fc318253a840986660a4386` 修注释示例；总控验收通过。 |
| SFC-CORE-004 | 观察 | `AlembicCore` | `release:check` dirty tree 语义与 playbook 可再收敛。 | 本波不强化门禁，避免影响开发态验证；后续 release 专项处理。 |
| SFC-CORE-005 | 观察 | `AlembicCore` | `npm run check` 有一次非致命 git HEAD 输出噪声。 | 本波不阻塞；后续若 CI 受影响再处理。 |
| SFC-Agent-001 | 已完成 | `AlembicAgent` | `npm run lint` 失败，导致 `check` 早停。 | 已在 `68636c40955dd044f74ca8ff8998ae0e49675326` 修复 lint 基线，`npm run check` 通过；总控验收通过。 |
| SFC-Agent-002 | 已完成 | `AlembicAgent` | AI provider 缺 key 文案硬编码 Dashboard AI Settings。 | 已在 `68636c40955dd044f74ca8ff8998ae0e49675326` 改为 host-neutral 错误 metadata 并补缺 key 测试；总控验收通过。 |
| SFC-Agent-003 | 待确认 | `AlembicAgent` | L4 compaction 默认行为仍是临时 opt-in。 | 需要用户 / 总控确认正式行为，本波不改默认。 |
| SFC-Agent-004 | 已完成 | `AlembicAgent` | package asset 常量疑似无消费方兼容残留。 | 已在 `68636c40955dd044f74ca8ff8998ae0e49675326` 完成跨仓库消费方扫描，并将 `package-assets` 收窄为仅保留 `PACKAGE_ROOT`；总控验收通过。 |
| DASH-SFC-001 | 已完成 | `AlembicDashboard` | 缺独立 `typecheck` / lint / test 入口。 | 已在 `a600753` 补安全 `typecheck`；lint / test 框架保留为后续评估；总控验收通过。 |
| DASH-SFC-002 | 已完成 | `AlembicDashboard` | 独立 Dashboard 仓库缺 README / repo-local docs。 | 已在 `a600753` 新增 repo-local `README.md`；总控验收通过。 |
| DASH-SFC-003 | 已完成 | `AlembicDashboard` | mock cleanup 成败只写 console。 | 已在 `a600753` 改为用户可见通知和可诊断错误信息；总控验收通过。 |
| DASH-SFC-004 | 观察 | `AlembicDashboard` | vendor chunk 过大。 | 不纳入小修；后续性能专项。 |
| DASH-SFC-005 | 观察 | `AlembicDashboard` | `any` 类型债。 | 不纳入小修；按业务路径后续收敛。 |
| SFC-PLUGIN-001 | 已完成 | `AlembicPlugin` | `npm run lint` 失败。 | 已在 `cc944f22492cabadb2a67a7b11e007ad817ee684` 修到 lint 退出 0；总控验收通过。 |
| SFC-PLUGIN-002 | 已完成 | `AlembicPlugin` | root generic release 脚本仍像旧 npm 发布入口。 | 已在 `cc944f22492cabadb2a67a7b11e007ad817ee684` 将旧 alias fail-closed 到 artifact-only guard，并收敛 `scripts/release.ts` 口径；总控验收通过。 |
| SFC-PLUGIN-003 | 已完成 | `AlembicPlugin` | SetupService 仍提示插件宿主配置 embedding provider / API key。 | 已在 `cc944f22492cabadb2a67a7b11e007ad817ee684` 改为 resident enhancement / embedded baseline 口径；总控验收通过。 |
| SFC-PLUGIN-004 | 待确认 | `AlembicPlugin` | shipped `config/default.json` 仍暴露外部 AI provider 默认值。 | 需要确认删除、置空或改名策略，本波不改 shipped config 语义。 |
| SFC-PLUGIN-005 | 待确认 | `AlembicPlugin` | real-project 采集脚本和 fixture 归属不清。 | 需要确认迁到 `AlembicTest`、归档或删除，本波不迁移。 |
| SFC-AT-001 | 待确认 | `AlembicTest` | 未跟踪 GFBD 历史报告需决定提交、修正或取消。 | 等总控 / 用户确认，不由测试窗口先提交或删除。 |
| SFC-AT-002 | 待确认 | `AlembicTest` | GFBD 报告引用旧测试交换路径。 | 跟随 SFC-AT-001 处理。 |
| SFC-AT-003 | 待授权 | `AlembicTest` | `tmp/` raw JSON 历史证据需清理策略和授权。 | 本波只补保留 / 清理规则，不删 raw JSON。 |
| SFC-AT-004 | 已完成 | `AlembicTest` | README 常用命令缺安全 `check` 入口。 | 已在 `eae25c4108efe8fbb650a144c4b02704f0c3517d` 修 README；总控验收通过。 |
| SFC-AT-005 | 已完成 | `AlembicTest` | 历史 localhost / cache marker 容易被误读。 | 已在 `eae25c4108efe8fbb650a144c4b02704f0c3517d` 修 docs README 阅读规则；总控验收通过。 |
| SFC-AT-006 | 已完成 | `AlembicTest` | restart preclean 需要继续保持强授权边界。 | 已在 `eae25c4108efe8fbb650a144c4b02704f0c3517d` 补命令分层说明，未运行 restart；总控验收通过。 |

## 空闲窗口调度

| 窗口 | 调度判断 | 是否发送 |
| --- | --- | --- |
| `Alembic` | 直接修复项已验收通过；剩余 Biome warning debt 为观察项。 | 否 |
| `AlembicCore` | 直接修复项已验收通过；`normalizeLifecycle` additive export 已具备下游替换前置条件。 | 否 |
| `AlembicAgent` | 直接修复项已验收通过；L4 compaction 默认行为仍待确认。 | 否 |
| `AlembicDashboard` | 直接修复项已验收通过；vendor chunk 和类型债为观察项。 | 否 |
| `AlembicPlugin` | 直接修复项已验收通过；shipped AI config 和 real-project fixture 归属仍待确认。 | 否 |
| `AlembicTest` | 文档小修已验收通过；仓库仍有未跟踪自检 / GFBD 证据文件，等待用户确认或封口。 | 否 |
| `BiliDili` | 真实 iOS 项目受保护；本波不进入。 | 否 |

## 阶段任务包

所有任务包的执行前置硬规则：先读取 workspace `AGENTS.md`、本计划和目标仓库 `AGENTS.md`，并在开始修改前明确当前窗口定位 / 仓库职责；只处理本计划列为 `待修复` 的事项。

### SFC-R1-ALEMBIC

窗口：`Alembic`

阶段目标：清理 Alembic 主体中不会改变运行时 contract 的旧口径、空目录和误导注释。

主线动作：

- 修正 `AGENTS.md` 中 `#external/*` 旧 alias 说明。
- 删除 `lib/external/mcp/handlers/bootstrap` 空目录，只保留 `lib/external/mcp/README.md` marker。
- 将 `lib/external/ai` 相关 boundary config 文案收敛为 retired negative guard，不恢复本地 AI 树，也不删除负向检测。
- 修正 `/api/v1/ai/env-config` 注释，明确这是当前 Dashboard API contract / 历史路径名，不是可删旧 Dashboard 入口。

合并 TODO：`SFC-ALEMBIC-001`、`SFC-ALEMBIC-002`、`SFC-ALEMBIC-003`、`SFC-ALEMBIC-004`。

明确不包含：不删除 `/api/v1/ai/env-config`；不清理 Biome warnings；不触碰 Dashboard vendored consumer。

下一处真实阻塞点：若修复发现 `env-config` contract 需要 Dashboard 同步，必须停下回填阻塞。

阻塞点之前还能做：上述文档 / 注释 / 空目录 / guard 文案可一次完成。

验证命令：`npm run check`、`npm run lint:agent-extraction-boundary`、targeted boundary tests、`git diff --check`、相关 `rg` 负向扫描。

回填要求：提交 hash、修复项对应 TODO、验证命令结果、是否仍有 lint warnings 观察项。

### SFC-R1-CORE

窗口：`AlembicCore`

阶段目标：修复 Core 本地源码接入口径和 additive public facade，给后续 consumer 收敛创造上游条件。

主线动作：

- 修正 `AGENTS.md`：日常 workspace 本地开发优先 `file:../AlembicCore`；发布、portable runtime、vendor snapshot 或总控明确要求时再处理 vendor / submodule 指针。
- 将 `normalizeLifecycle` 通过 `src/domain/knowledge/index.ts` 和 `src/knowledge.ts` additive 导出，补 public facade smoke 或 targeted test。
- 修正 `src/shared/concurrency.ts` 注释示例，避免使用外层 `#shared/*`。

合并 TODO：`SFC-CORE-001`、`SFC-CORE-002`、`SFC-CORE-003`。

明确不包含：不删除 deep export / allowlist；不强改 `release:check` dirty tree 门禁；不处理 git HEAD 输出噪声。

下一处真实阻塞点：Alembic consumer 替换必须等待 Core 回填提交 hash 和验证结果。

阻塞点之前还能做：Core producer additive export 与文档注释修复可一次完成。

验证命令：`npm run check`、`npm run build`、`npm run smoke:public-api`、public API closeout / consumer import boundary scan、`git diff --check`。

回填要求：提交 hash、导出路径、测试 / smoke 结果、是否允许下一波派 Alembic 替换 deep import。

### SFC-R1-AGENT

窗口：`AlembicAgent`

阶段目标：恢复 Agent lint/check 绿色，并把 provider 缺 key 语义从 Dashboard UI 文案中解耦。

主线动作：

- 修复 `npm run lint` 当前 error 和同范围 warning，确保 `npm run check` 可执行并通过或回填真实阻塞。
- 将 AI provider 缺 key 错误改为 host-neutral 错误码 / metadata / 通用配置提示，由具体 host / Dashboard adapter 自己渲染 UI 指引。
- 对 `src/shared/package-assets.ts` 常量做跨仓库消费者扫描；确认无消费方后，删除或收窄未用常量，保留真实消费的 `PACKAGE_ROOT`。

合并 TODO：`SFC-Agent-001`、`SFC-Agent-002`、`SFC-Agent-004`。

明确不包含：不改变 L4 compaction 默认行为；不删除 deprecated 模型；不改 Dashboard / Plugin 仓库。

下一处真实阻塞点：如果 package asset 常量存在跨仓库消费方，必须停止删除并回填消费证据。

阻塞点之前还能做：lint 修复、provider 文案测试和只读消费者扫描可以并行完成。

验证命令：`npm run lint`、`npm run check` 或等价拆分命令、相关 provider 缺 key测试、跨仓库 `rg` 消费方扫描、`git diff --check`。

回填要求：提交 hash、lint/check 结果、provider 文案测试结果、package asset scan 证据和删除 / 保留理由。

### SFC-R1-DASHBOARD

窗口：`AlembicDashboard`

阶段目标：补 Dashboard 仓库基础使用说明和安全类型检查入口，并让 mock cleanup 成败对用户可见。

主线动作：

- 新增 repo-local `README.md`，写清 Dashboard-only 职责、常用命令、Vite proxy、API 边界、构建产物和禁止跨仓库修改事项。
- 增加不引入新依赖的安全 `typecheck` script；lint / test 框架仅记录后续评估，不在本波强行接入。
- 将 mock cleanup 成功 / 失败从 `console.log/error` 改为用户可见通知和可诊断错误信息，优先使用既有 notify / error utils。

合并 TODO：`DASH-SFC-001`、`DASH-SFC-002`、`DASH-SFC-003`。

明确不包含：不做 vendor chunk 性能优化；不做 `any` 大规模类型债收敛；不启动 live backend 或真实项目。

下一处真实阻塞点：如果没有现成通知机制可复用，先回填阻塞并给出最小 UI 方案，不新建大型状态系统。

阻塞点之前还能做：README、typecheck script 和 mock cleanup 小修可独立完成。

验证命令：`npm run typecheck`、`npm run build`、`git diff --check`，必要时补最小源码扫描。

回填要求：提交 hash、README 入口、typecheck/build 结果、mock cleanup 成败 UI 路径说明。

### SFC-R1-PLUGIN

窗口：`AlembicPlugin`

阶段目标：恢复 Plugin lint 绿色，收敛 artifact-only release 入口语义，并移除 SetupService 对插件宿主配置 embedding provider 的误导提示。

主线动作：

- 修复 `npm run lint` 失败项，尤其 `lib/bootstrap.ts` 非空断言和 `SetupService` CLI 输出规则；不要用吞错可选链掩盖初始化问题。
- 收敛 `release:patch/minor/major` 和 `scripts/release.ts` 的旧 npm 发布入口语义，保持 root registry publish disabled 和 Codex plugin artifact / channel release 边界。
- 修正 `SetupService.stepVectorIndex()` reason / hint：embedded runtime 没有可执行 embedding provider；语义增强由 Alembic resident service / resident search 提供，baseline search 继续可用。

合并 TODO：`SFC-PLUGIN-001`、`SFC-PLUGIN-002`、`SFC-PLUGIN-003`。

明确不包含：不删除或改名 `config/default.json` 的 AI 字段；不迁移 / 删除 real-project 脚本和 fixture；不刷新本机 Codex 插件缓存。

下一处真实阻塞点：如果 release script 改动会影响 Codex channel / marketplace 验证，必须停下回填阻塞。

阻塞点之前还能做：lint、release 入口文案 / 脚本收敛和 SetupService 提示可一次完成。

验证命令：`npm run lint`、`npm run build:check`、`npm run verify:release-package-boundary`、`npm run verify:codex-plugin`、`npm run verify:codex-channel`、`npm run report:agent-extraction-boundary`、`git diff --check`。

回填要求：提交 hash、lint 结果、release boundary 验证、SetupService 文案负向扫描结果。

### SFC-R1-TEST

窗口：`AlembicTest`

阶段目标：加固测试仓库自检入口和历史证据阅读规则，不运行真实项目、不删除 raw evidence。

主线动作：

- 更新 `README.md`，把 `npm --prefix AlembicTest run check` / 仓库内 `npm run check` 放到常用命令首位，并标为自检 / 封口优先命令。
- 更新 `docs/README.md`，说明历史报告中的 localhost URL、pid、cache marker、mtime、本机路径只代表当次证据，新测试必须重新发现当前入口。
- 补命令分层说明：`check` / `--dry-run` 是普通自检路径，restart / probe / monitor 属于授权测试路径。

合并 TODO：`SFC-AT-004`、`SFC-AT-005`、`SFC-AT-006`。

明确不包含：不提交、修改或删除未跟踪 GFBD 报告；不清理 `tmp/` raw JSON；不运行 restart / probe / monitor；不操作 BiliDili。

下一处真实阻塞点：GFBD 报告处理和 raw JSON 删除需要用户 / 总控授权。

阻塞点之前还能做：README 和 docs README 文档加固可独立完成。

验证命令：`npm --prefix AlembicTest run check`、`git -C AlembicTest diff --check`、`git diff --check`。

回填要求：提交 hash、文档改动范围、check 结果、未处理 GFBD / tmp raw evidence 状态。

## 窗口分派

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>已完成 | 已执行 `SFC-R1-ALEMBIC`；提交 `50dbaef15cf16273d01971e192a318450a0df878`，报告 `docs/Alembic/small-fix-cleanup-repair-wave-2026-05-23.md`。 |
| `AlembicCore`<br>已完成 | 已执行 `SFC-R1-CORE`；提交 `69bda3ff6ac413ac1fc318253a840986660a4386`，报告 `docs/AlembicCore/small-fix-cleanup-repair-2026-05-23.md`。 |
| `AlembicAgent`<br>已完成 | 已执行 `SFC-R1-AGENT`；提交 `68636c40955dd044f74ca8ff8998ae0e49675326`，报告 `docs/AlembicAgent/small-fix-cleanup-repair-wave-agent-2026-05-23.md`。 |
| `AlembicDashboard`<br>已完成 | 已执行 `SFC-R1-DASHBOARD`；提交 `a600753`。 |
| `AlembicPlugin`<br>已完成 | 已执行 `SFC-R1-PLUGIN`；提交 `cc944f22492cabadb2a67a7b11e007ad817ee684`，报告 `docs/AlembicPlugin/small-fix-cleanup-repair-wave-plugin-2026-05-23.md`。 |
| `AlembicTest`<br>阻塞 | 已执行 `SFC-R1-TEST`；提交 `eae25c4108efe8fbb650a144c4b02704f0c3517d`。阻塞点：`AlembicTest/docs/small-fix-cleanup-self-check-2026-05-23.md` 与 `AlembicTest/docs/global-function-boundary-evidence-test-2026-05-22.md` 仍未跟踪，需要用户确认提交 / 修正 / 清理口径。 |
| `BiliDili`<br>无任务 | 真实 iOS 项目受保护，本波不作为执行窗口。 |

## 可复制提示词

发送给：无。

当前没有可复制提示词。直接修复项已验收；剩余项进入用户确认 / 授权口径，不派发执行窗口。

不发送给：`Alembic`（已完成）、`AlembicCore`（已完成）、`AlembicAgent`（已完成）、`AlembicDashboard`（已完成）、`AlembicPlugin`（已完成）、`AlembicTest`（等待用户确认 / 证据封口）、`BiliDili`。

## 回填区

- 2026-05-23 17:50 CST：`AlembicAgent` 完成 `SFC-R1-AGENT` 并提交 `68636c40955dd044f74ca8ff8998ae0e49675326`（`Fix agent lint and host-neutral provider errors`）。完成范围：修复 Biome lint 基线并让 `npm run check` 不再早停；将 OpenAI / Claude / DeepSeek / Google Gemini / generic LLM transport 缺 key 错误改为 host-neutral metadata（`API_KEY_MISSING`、`provider`、`envVar`、`hostAction`），去除 Dashboard AI Settings 文案并补测试；跨仓库扫描未发现 package asset deep consumer 后，将 `src/shared/package-assets.ts` 收窄为仅保留 `PACKAGE_ROOT`。验证：`npm run lint`、`npm run build:check`、`npm run test -- test/ai-provider.test.ts`、`npm run check`、相关 host 文案负向扫描、package asset consumer scan、常量负向扫描、`git diff --check` 均通过。未处理项：`SFC-Agent-003` L4 compaction 默认行为为待确认项，按计划不改；deprecated models 不在本修复波范围；未修改其它 Alembic 仓库和 BiliDili。遗留风险：未做 release staging / package preview；Alembic Codex 本机诊断仍显示插件 runtime pin / metadata 问题，未作为本轮产品修复项处理。回填文档：[../../AlembicAgent/small-fix-cleanup-repair-wave-agent-2026-05-23.md](../../../../AlembicAgent/small-fix-cleanup-repair-wave-agent-2026-05-23.md)。
- 2026-05-23 17:39 CST：`AlembicCore` 完成 `SFC-R1-CORE` 并提交 `69bda3ff6ac413ac1fc318253a840986660a4386`（`fix: tighten core facade cleanup`）。完成范围：修正 `AGENTS.md` 外层接入规则为日常本地开发优先 `file:../AlembicCore`、封版场景才处理 `vendor/AlembicCore`；通过 `src/domain/knowledge/index.ts` 与 `src/knowledge.ts` additive 导出 `normalizeLifecycle`；补 `test/PublicKnowledgeEntrypoints.test.ts` targeted 断言和 `scripts/smoke-public-api.mjs` smoke 检查；修正 `src/shared/concurrency.ts` 注释示例为 `@alembic/core/shared`。验证：`npm run check`、`npm run build`、`npm run smoke:public-api`、`npm run report:public-api-closeout`、三仓库 `lint-consumer-core-imports` consumer scan、`git diff --check` 均通过；consumer scans 对 `Alembic` / `AlembicPlugin` / `AlembicAgent` 均为 `issueCount=0`。未处理项：`SFC-CORE-004` release:check dirty tree 语义和 `SFC-CORE-005` git HEAD 输出噪声均为观察项，按计划不处理；验证中仍有一次非致命 `Could not access 'HEAD'` 输出但 `npm run check` 通过。回填文档：[../../AlembicCore/small-fix-cleanup-repair-2026-05-23.md](../../../../AlembicCore/small-fix-cleanup-repair-2026-05-23.md)。
- 2026-05-23 17:23 CST：总控验收六份自检报告，确认自检阶段完成；将可直接处理项组成 SFC-R1 修复 wave，把 L4 默认行为、Plugin shipped AI config、Plugin real-project fixture 归属、AlembicTest GFBD 报告处置和 tmp raw evidence 删除列为待确认 / 待授权。
- 2026-05-23 17:36 CST：`Alembic` 完成 `SFC-R1-ALEMBIC` 并提交 `50dbaef15cf16273d01971e192a318450a0df878`（`fix: clean alembic repair wave docs`）。完成范围：移除 `AGENTS.md` 中已删除的 `#external/*` alias 说明；删除 `lib/external/mcp/handlers/bootstrap` 和空父目录，只保留 `lib/external/mcp/README.md` marker；将 `lib/external/ai/**` 从 deletion-candidate 口径改为 retired negative guard，并保留 `#external/ai` / `lib/external/ai` 负向检测；修正 `/api/v1/ai/env-config` 注释，明确它是当前 Dashboard 使用的历史路由名，不删除 API。验证：`npm run check`、`npm run build:check`、`npm run lint:agent-extraction-boundary`、`npm run lint:repo-boundary`、`npm run test:unit -- --run test/unit/ResidentServiceBoundary.test.ts test/unit/AgentModuleBoundaries.test.ts`、`git diff --check`、相关 `rg` 负向扫描和 `find lib/external -maxdepth 4 -type f -o -type d -empty | sort` 均通过或符合预期。未处理项：`SFC-ALEMBIC-005` Biome warnings / infos 仍为观察项；未删除 `/api/v1/ai/env-config`；未触碰 Dashboard vendored consumer；未运行 integration / e2e / daemon / Dashboard 手工 smoke。遗留风险：Alembic `main` ahead origin 1，需要后续 push；`npm run check` 虽返回 0 但仍输出既有 227 warnings / 25 infos，后续独立 lint debt 处理。
- 2026-05-23 17:41 CST：`AlembicDashboard` 完成 `SFC-R1-DASHBOARD` 并提交 `a600753`（`Repair dashboard cleanup basics`）。完成范围：新增 repo-local `README.md`，写清 Dashboard-only 职责、常用命令、Vite proxy、API 边界、构建产物和禁止跨仓库修改事项；在 `package.json` 增加无新依赖 `typecheck` script；将 Header mock cleanup 成功 / 失败从 `console.log/error` 改为既有 `notify` toast 和 `getErrorMessage` 诊断，并补中英文文案。验证：`npm run typecheck`、`npm run build`、`git diff --check` 通过；`rg` 确认 mock cleanup 不再使用 console。未处理项：未接入 lint / test 框架，未做 vendor chunk 性能优化，未做 `any` 类型债收敛，未启动 live backend 或真实项目。遗留风险：`npm run build` 仍有既有 large chunk warning，后续性能专项处理；lint / test 框架仍需后续评估。
- 2026-05-23 17:36 CST：`AlembicTest` 完成 `SFC-R1-TEST` 并提交 `eae25c4108efe8fbb650a144c4b02704f0c3517d`（`docs: clarify AlembicTest command tiers`）。完成范围：`AlembicTest/README.md` 增加安全 `check` / `--dry-run` 自检入口，并把 restart / monitor / probe 标为授权测试路径；`AlembicTest/docs/README.md` 增加历史证据阅读规则，说明 localhost URL、pid、cache marker、mtime、本机路径只代表当次证据，新测试必须重新发现当前入口。验证：`npm --prefix AlembicTest run check`、`git -C AlembicTest diff --check`、`git diff --check` 均通过。未处理项：未提交、修改或删除未跟踪 GFBD 报告；未清理 `tmp/` raw JSON；未运行 restart / monitor / probe；未操作 BiliDili。遗留风险：AlembicTest 仍有未跟踪 `docs/global-function-boundary-evidence-test-2026-05-22.md` 和 `docs/small-fix-cleanup-self-check-2026-05-23.md`，其中 GFBD / raw JSON 处理仍需总控或用户确认 / 授权。
- 2026-05-23 17:41 CST：`AlembicPlugin` 完成 `SFC-R1-PLUGIN` 并提交 `cc944f22492cabadb2a67a7b11e007ad817ee684`（`fix: close plugin small cleanup repair items`）。报告路径 `docs/AlembicPlugin/small-fix-cleanup-repair-wave-plugin-2026-05-23.md`。完成范围：用显式 bootstrap component 断言替代 `lib/bootstrap.ts` 非空断言，避免可选链吞掉初始化错误；将 `SetupService.printSummary()` 直接 console 输出收敛到类内 stdout / stderr helpers；运行 Biome 安全格式 / import 修复；把 root `release:patch/minor/major` alias fail-closed 到 `release:root-npm-publish:disabled`，并将 `scripts/release.ts` 收敛为 check-only / artifact-only 口径；在 `verify-release-package-boundary` 中断言旧 release alias 必须 fail-closed；将 `SetupService.stepVectorIndex()` 文案改为 embedded baseline / Alembic resident service semantic enhancement。验证：`npm run lint`、`npm run lint -- --diagnostic-level=error`、`npm run build:check`、`npm run verify:release-package-boundary`、`npm run verify:codex-plugin`、`npm run verify:codex-channel`、`npm run report:agent-extraction-boundary`、`git diff --check` 和相关 `rg` 负向扫描通过。未处理项：未改 `config/default.json` AI 字段；未迁移 / 删除 real-project 采集脚本和 fixture；未刷新本机 Codex 插件缓存；未生成新的 portable runtime artifact。遗留风险：`npm run lint` 仍有既有 warning / info 输出但退出 0；若后续进入发布封口，需另跑 `release:codex-plugin` 或总控指定的 artifact refresh / smoke。
- 2026-05-23 17:55 CST：总控验收 SFC-R1 直接修复项：`Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin` 通过；`AlembicTest` 文档小修通过，但仓库仍有未跟踪 `docs/small-fix-cleanup-self-check-2026-05-23.md` 与 `docs/global-function-boundary-evidence-test-2026-05-22.md`，需用户确认提交 / 修正 / 清理口径后才能最终归档当前小修主线。
