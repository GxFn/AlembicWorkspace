# AlembicWorkspace Current Status

更新日期：2026-05-24
总控窗口：AlembicWorkspace
状态：multi-root ProjectScope 第一波待启动

## 状态摘要

今日两条主线已完成并归档：

- `cold-start-skill-delivery`：双链路 project skill receipt + Codex 项目级 runtime export 已完成；`AlembicTest` test mode 证明 Alembic route receipt、Plugin route `symlink-first` export、managed marker、runtime load、conflict block、无全局写入和 BiliDili git clean 均闭合。
- `scan-progress-live-output`：cold-start / rescan 前端过程展示主线与旧终端格式化语义补齐 follow-up 已完成；`AlembicTest` P5 证明阶段转换、短 LLM 默认展示、长内容折叠、颜色可读、active card / summary 均闭合。

用户确认：`AlembicDashboard` 侧边栏 polish 不再作为 AlembicWorkspace 当前阻塞；前端窗口随后已提交 `c857bdf`，总控不再发送窗口提示词。

最近完成主线：

- [llm-output-truncation-bug](../archive/2026-05/llm-output-truncation-bug/)：Jobs Timeline `LLM output received` 短内容像被截断的问题已完成并归档。`AlembicAgent`、`Alembic`、`AlembicDashboard` 代码侧通过 targeted 验收；`AlembicTest` 最小真实复测证明短 visible output、tool-call-only、hidden reasoning omission、Alembic bridge truncation 和 Dashboard DOM 展示闭合。

当前新需求：

- [multi-root-project-scope 原始计划书](../../requirement-designs/multi-root-project-scope/original-plan-2026-05-24.md)：用户确认后续四条主线优先级，当前先启动第一条“支持多个目录汇总为一个项目”。用户补充说明最急迫目标是 `AlembicWorkspace` 下的 Alembic 系列仓库需要能用 Plugin 访问自身知识；随后进一步明确“Project 是抽象、Folder 是实体、一对多、默认单 folder、用户显式绑定才合并、Alembic CLI / Dashboard 管理 folders[]”。用户已确认原始计划，并确认 `AlembicWorkspace` 根目录可作为特殊控制入口但不放入源码 `folders[]`、第一版 CLI 优先、Plugin 无 Alembic 时使用单 folder Project、Ghost 是新标准且不再支持转回项目目录写入。
- 需求设计：[multi-root-project-scope/requirement-design-2026-05-24.md](../../requirement-designs/multi-root-project-scope/requirement-design-2026-05-24.md) 已形成；代码调研：[code-implementation-dependency-research-2026-05-24.md](../../requirement-designs/multi-root-project-scope/code-implementation-dependency-research-2026-05-24.md) 已完成。
- 任务级阶段路线已确认：[multi-root-project-scope-goal-stage-confirmation-2026-05-24.md](multi-root-project-scope-goal-stage-confirmation-2026-05-24.md)。当前 wave：[multi-root-project-scope-wave-1-2026-05-24.md](multi-root-project-scope-wave-1-2026-05-24.md)，第一波只发送给 `AlembicCore`。

历史入口：

- Project skill 归档：[cold-start-skill-delivery](../archive/2026-05/cold-start-skill-delivery/)。
- 前端过程展示归档：[scan-progress-live-output](../archive/2026-05/scan-progress-live-output/)。
- 已完成 TODO 和历史记录：[workspace-record-map.md](../workspace-record-map.md)。

## 当前活跃观察 TODO

- `GTODO-2026-05-21-003`：观察 prime / Recipe evidence projection 是否需要下沉为 Core 共享 contract。
- `GTODO-2026-05-21-004`：观察 Alembic resident service API / capability / contract version 是否需要进入后续主线。
- `GTODO-2026-05-21-005`：观察 Recipe evidenceRef 行号级证据是否需要补强。
- `GTODO-2026-05-23-019`：Core `normalizeLifecycle` additive 导出后的 Alembic test-only allowance 是否需要 consumer 收敛。
- `GTODO-2026-05-23-022`：Dashboard `src/api.ts` 剩余动态 contract `any` 类型化。
- `GTODO-2026-05-23-023`：Dashboard Mermaid async chunk 性能专项。
- `GTODO-2026-05-23-024`：AlembicAgent L4 compaction 低优等待用户再次提及。
- `GTODO-2026-05-24-030`：多文件夹项目 / 多 root 的 project skill runtime export 绑定，等待真正支持多项目 / 多 root 时一起设计。
- `GTODO-2026-05-24-029`：live append 批量延迟 / 更细实时性观察；后续只有用户要求严格逐条终端式输出时再提升为新主线。
- `GTODO-2026-05-24-033`：LOTB-P2 发现 process events restart recovery 返回 0 条；待 Alembic 后续归口。
- `GTODO-2026-05-24-034`：LOTB-P2 发现 job progress 长时间停在 `filling/0%`；待 Alembic / Dashboard 后续归口。
- `GTODO-2026-05-24-035`：provider `finishReason=length` 未自然触发；待 AlembicAgent / AlembicTest 后续提供可控 fixture。
- `GTODO-2026-05-24-036`：multi-root ProjectScope，多目录汇总为一个 Alembic 项目；当前模型是“一抽象 Project 对多实体 Folder”，默认单 folder Project，用户显式绑定多个 folder 后才共享知识库；`AlembicWorkspace` 根目录作为特殊控制入口，不放入源码 `folders[]`；Ghost 是唯一标准，不再支持 standard 兼容 / 降级 / 分叉；第一版硬门禁是 AlembicWorkspace 自用 Plugin 闭环；当前第一波发送给 `AlembicCore`。
- `GTODO-2026-05-24-037`：Plugin 意图同步与意图下知识注入 / 检索；等待 ProjectScope 设计。
- `GTODO-2026-05-24-038`：Alembic file monitor 驱动知识进化；等待 ProjectScope 设计。
- `GTODO-2026-05-24-039`：Plugin 无文件监控下的知识进化 fallback；等待 ProjectScope 与意图链路设计。

## 窗口分派

当前发送给：`AlembicCore`。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>阻塞 | 等待 `AlembicCore` ProjectScope contract 和提交 hash；下一阶段消费 Core contract 生产 CLI/API/daemon health。 |
| `AlembicCore`<br>待启动 | 第一波执行 [multi-root-project-scope-wave-1-2026-05-24.md](multi-root-project-scope-wave-1-2026-05-24.md) 中的 `MRPS-P1-CORE`。 |
| `AlembicAgent`<br>观察中 | 等待 Core contract；第一版不扩大 tool root。 |
| `AlembicDashboard`<br>阻塞 | 等待 Alembic API producer。 |
| `AlembicPlugin`<br>阻塞 | 等待 Alembic resident ProjectScope producer。 |
| `AlembicTest`<br>无任务 | `Test-2026-05-24-08 / LOTB-P2-Output-Completeness-TestMode` 已通过总控验收。 |
| `BiliDili`<br>无任务 | 不改真实 iOS 项目源码。 |

## 可复制提示词

发送给：`AlembicCore`。

```text
先读取 AGENTS.md、docs/workspace/index.md、docs/workspace/current/multi-root-project-scope-wave-1-2026-05-24.md，以及 AlembicCore/AGENTS.md；先明确声明当前窗口定位和本轮仓库职责，再按照文档领取并完成分配给 AlembicCore 的任务；完成后回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。
```

## 回填区

- 2026-05-24：总控按用户确认归档今日两条主线：`cold-start-skill-delivery` 与 `scan-progress-live-output`。前端 polish 已由前端窗口提交 `c857bdf`，不再作为 workspace 当前阻塞。
- 2026-05-24 20:34 CST：用户反馈 `LLM output received` 内容很少、像被截断；总控启动 [llm-output-truncation-bug](../archive/2026-05/llm-output-truncation-bug/) bug wave，当前发送给 `AlembicAgent`、`Alembic`、`AlembicDashboard`。
- 2026-05-24 20:46 CST：`AlembicDashboard` 回填完成，提交 `6bd14e0`，Jobs Timeline 已展示 `llm.output` 完整性提示并锁定展开内容不二次截断；仍等待 `AlembicAgent` / `Alembic` 上游 metadata 和 bridge 字段回填。
- 2026-05-24 20:46 CST：`AlembicAgent` 回填完成，提交 `bdd77335e1904a8bc91342a71d6348a64862eafe`，Agent 侧已补 `llm.output` 完整性 metadata、DeepSeek `finishReason` 透传和单测；专项记录见 [../../AlembicAgent/llm-output-truncation-agent-output-completeness-2026-05-24.md](../../AlembicAgent/llm-output-truncation-agent-output-completeness-2026-05-24.md)。当时三仓库进入总控验收，后续已由 20:52 记录推进到 `AlembicTest` 最小复测。
- 2026-05-24 20:52 CST：总控完成 `AlembicAgent`、`Alembic`、`AlembicDashboard` targeted 代码验收，三仓库 `git status --short` 均干净；验收命令包括 `AlembicAgent` targeted tests（3 files / 15 tests）、`Alembic` targeted unit tests（2 files / 20 tests）、`AlembicDashboard npm run check`（通过，保留既有 Vite chunk warning）。已创建 `Test-2026-05-24-08 / LOTB-P2-Output-Completeness-TestMode`，当前发送给 `AlembicTest`。
- 2026-05-24 21:20 CST：`AlembicTest` 回填 LOTB 最小真实复测，报告见 [../../../AlembicTest/docs/llm-output-completeness-test-mode-2026-05-24.md](../../../AlembicTest/docs/llm-output-completeness-test-mode-2026-05-24.md)。核心链路通过：真实 events API 与 Dashboard DOM 覆盖短 visible output、tool-call-only、hidden reasoning omission、Alembic bridge truncation；遗留 provider `finishReason=length` 未自然触发、process events restart recovery 返回 0 条、job progress 长时间停在 `filling/0%`。
- 2026-05-24 21:26 CST：总控验收 LOTB 最小复测通过，主线完成并归档到 [llm-output-truncation-bug](../archive/2026-05/llm-output-truncation-bug/)；后续缺口已进入 `GTODO-2026-05-24-033/034/035`。
- 2026-05-24 21:40 CST：用户确认四条后续主线优先级，并要求把需求计入 TODO、开始第一条需求设计。总控新增 `GTODO-2026-05-24-036/037/038/039`，创建 [multi-root ProjectScope 原始计划书](../../requirement-designs/multi-root-project-scope/original-plan-2026-05-24.md)，当前等待用户确认。
- 2026-05-24 21:45 CST：用户补充最主要需求是 `AlembicWorkspace` 下的 Alembic 系列仓库急需使用 Alembic 自身，但多文件夹现在无法使用 Plugin。总控已把原始计划收紧为“第一版以 AlembicWorkspace 自用闭环为硬门禁”。
- 2026-05-24 21:50 CST：用户进一步明确项目 / 文件夹模型：Project 是抽象，Folder 是实体，Project 对 Folder 一对多；Plugin 默认确认当前 folder 的单 folder Project，用户通过 Alembic CLI / Dashboard 显式绑定多个 folder，未声明则不自动合并。总控已同步更新原始计划书和全局 TODO。
- 2026-05-24 21:56 CST：用户确认三个剩余点：`AlembicWorkspace` 根目录可以包含但需要特殊字段、第一版 CLI 优先且 Dashboard 最小展示 / 添加、Plugin 无 Alembic 主体时使用单 folder Project。总控已把原始计划标为已确认，进入真实代码调研和需求设计。
- 2026-05-24 22:03 CST：总控完成 multi-root ProjectScope 真实代码调研和需求设计，新增 [代码实现依赖调研](../../requirement-designs/multi-root-project-scope/code-implementation-dependency-research-2026-05-24.md)、[需求设计](../../requirement-designs/multi-root-project-scope/requirement-design-2026-05-24.md) 和 [目标阶段确认草案](multi-root-project-scope-goal-stage-confirmation-2026-05-24.md)。当前等待用户确认第一波是否只启动 `AlembicCore`，folder remove / disable 是否暂不做。
- 2026-05-24 22:08 CST：用户补充 Ghost 应成为新标准，旧 standard / project-root 写入方式被抛弃，且不再支持转回项目目录以避免多文件夹冲突。总控已同步更新原始计划、代码调研、需求设计和目标阶段确认草案；该项作为第一波 Core contract 硬约束。
- 2026-05-24 22:14 CST：用户确认第一波只启动 `AlembicCore`，第一版不做 folder remove / disable，只做 add / list / resolve；并进一步确认 standard 不做兼容，按照新逻辑做一致性闭环，不做降级和分叉。总控已创建 [multi-root-project-scope-wave-1-2026-05-24.md](multi-root-project-scope-wave-1-2026-05-24.md)，当前发送给 `AlembicCore`。
