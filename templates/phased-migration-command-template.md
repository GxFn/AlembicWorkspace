# 分阶段迁移指挥长期模板

定位：长期模板
更新日期：2026-05-18
总控窗口：AlembicWorkspace
状态：长期模板

本文提炼自早期分阶段迁移经验，用于之后跨仓库迁移、抽取、收敛、删除和发布封口。模板重点不是先写理想阶段，而是先挖掘真实代码、调用链、导入关系和发布链路，再把事实拆成一波一阶段的稳定推进节奏。使用时复制本文结构，替换占位符，并把新计划挂载到 `docs/workspace/index.md`。

## 1. 迁移经验

### 1.1 先盘点，再计划

有效顺序是：扫真实代码和导入关系，建立源清单、重复清单、删除候选清单，给每类能力明确归属，再拆阶段。不要先写理想架构，再逼代码迎合它。

### 1.2 边界分五类

每次迁移都要明确：

- 进入目标仓库。
- 留在源仓库。
- 留在宿主仓库 / adapter。
- 删除候选。
- 不得删除。

### 1.3 阶段入口要有硬规则

每个阶段开始前必须写明上一阶段证据、当前阶段允许范围、禁止事项、不能顺手删除的能力，以及哪些窗口只观察不执行。

### 1.4 删除永远晚于接入

删除前必须满足：

- import 扫描无遗留。
- 替代入口已接入。
- 代表性 build/check/lint/smoke 已通过。

没有替代入口时，状态只能是“删除候选”，不能写成“可删除”。

### 1.5 每个阶段必须可回填

阶段文档必须预留：完成范围、文件/模块变化、提交 hash、验证命令、验证结果、遗留风险、下一窗口任务。否则后续只有口头状态，无法验收。

### 1.6 发布链路单独成阶段

代码边界完成不等于发布可用。Plugin / Dashboard / runtime 相关迁移要单独验证 packaging、channel、marketplace、daemon、Dashboard live smoke 和真实点击路径。

### 1.7 观察中也是明确状态

不是每个仓库都要动。观察窗口必须写清楚触发条件：什么时候由观察转执行。

### 1.8 从真实代码挖阶段

阶段不是按愿望拆出来的，是从代码事实里长出来的。每次写计划前至少挖四类事实：

- 入口事实：CLI、daemon、HTTP、Dashboard、Plugin、package exports、bin、npx/runtime 真实入口在哪里。
- 调用事实：谁 import 谁，谁通过字符串路由、DI container、HTTP path、event/job、dynamic import 间接调用谁。
- 能力事实：同名能力是否有多份实现，哪份是成熟实现，哪份只是 adapter、facade、compat 或测试替身。
- 验证事实：当前仓库有哪些 build/check/test/smoke/release gate 能证明这一阶段真的成立。

没有代码证据的判断只能写成“待扫描假设”，不能直接进入分派表。

### 1.9 一波一阶段

稳定迁移的节奏是：一波只解决一个阶段问题，验收后再启动下一波。不要把 public surface、外层消费、删除清理、发布 smoke 混在同一波里。每波都要有明确入口条件、可停止边界、验证证据和下一波触发条件。

## 2. 总控计划模板

复制下面结构作为新的 workspace 总控文档：

````markdown
# <Topic> 分阶段迁移总控计划

日期：YYYY-MM-DD
总控窗口：AlembicWorkspace
状态：执行中

本文用于指挥 <repo/window list> 的 <migration topic>。所有阶段完成后必须回填证据，并更新 docs/workspace/index.md。

本计划先记录从真实代码挖出的事实，再按事实拆阶段。没有扫描证据的目标只能作为待确认假设，不能直接分派执行。

## 1. 目标

- <目标 1>
- <目标 2>

不做：

- <明确不做 1>
- <明确不做 2>

## 2. 硬性规则

### 2.1 入口规则

- 进入本计划前必须完成：<前置证据>。
- 未完成 <条件> 前，不得启动 <后续阶段>。

### 2.2 边界规则

- 进入 <target repo>：<能力清单>。
- 留在 <source repo>：<能力清单>。
- 留在 host / adapter：<能力清单>。
- 删除候选：<路径 / 模块>。
- 不得删除：<路径 / 模块>。

### 2.3 删除规则

- 删除前必须有 import 扫描。
- 删除前必须有替代入口。
- 删除前必须有 build/check/lint/smoke 证据。

### 2.4 一波一阶段节奏规则

- 当前 wave 只推进一个阶段目标。
- 未完成当前 wave 验收前，不启动下一阶段执行任务。
- contract、外层消费、删除清理、发布/live smoke 分成不同 wave。
- 阻塞项独立记录为 `阻塞`，不把下游任务伪装成可启动。
- 每波结束后新建 acceptance / next plan，再派发下一波。

## 3. 当前真实扫描基线

### 3.1 工作区状态

| 仓库 | git status | 最新提交 | 备注 |
| --- | --- | --- | --- |
| `Alembic` |  |  |  |
| `AlembicCore` |  |  |  |
| `AlembicAgent` |  |  |  |
| `AlembicDashboard` |  |  |  |
| `AlembicPlugin` |  |  |  |

### 3.2 Import / 调用扫描

记录命令：

```text
<rg / lint / script commands>
```

扫描结论：

- <结论 1>
- <结论 2>

### 3.3 入口 / 发布链路扫描

| 链路 | 真实入口 | 下游依赖 | 相关仓库 | 验证方式 | 风险 |
| --- | --- | --- | --- | --- | --- |
| CLI / bin |  |  |  |  |  |
| daemon / job |  |  |  |  |  |
| HTTP / Dashboard |  |  |  |  |  |
| Plugin / npx runtime |  |  |  |  |  |
| package exports |  |  |  |  |  |

### 3.4 源清单

| 能力 | 当前路径 | 文件数 / 行数 | 当前归属 | 目标归属 | 备注 |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

### 3.5 删除候选清单

| 路径 | 删除条件 | 替代入口 | 当前状态 |
| --- | --- | --- | --- |
|  |  |  |  |

### 3.6 代码事实到阶段拆分

每个阶段都必须能回到真实代码事实：

| 代码事实 | 影响 / 风险 | 应拆阶段 | 启动条件 | 验收证据 |
| --- | --- | --- | --- | --- |
| <事实> | <风险> | Phase <N> | <条件> | <命令 / 记录> |

## 4. 分阶段计划

阶段拆分原则：

- Phase 0 只负责挖清事实，不做行为迁移。
- Phase 1 只建立目标仓库 contract / public surface。
- Phase 2 只让外层开始消费新入口。
- Phase 3 只删除已经被替代且扫描无遗留的旧实现。
- Phase 4 只做发布、runtime、Dashboard、Plugin live 联动封口。
- 如果某一阶段过大，继续切成 Wave N.1 / N.2，但仍然保持“一波只验收一个目标”。

### Phase 0：基线盘点

目标：

- 建立真实源清单。
- 建立删除候选清单。
- 建立 import / 调用扫描基线。
- 挖清 CLI、daemon、HTTP、Dashboard、Plugin、package exports、runtime packaging 的真实入口和连通性。

允许：

- 只读扫描。
- 写文档。
- 添加边界扫描脚本。

禁止：

- 删除实现。
- 改运行行为。

验收命令：

```text
<commands>
```

完成标准：

- 能用代码事实解释每个阶段为什么存在。
- 每个待迁移能力都有当前路径、目标归属、调用方和验证方式。
- 没有证据的判断已标记为待扫描假设，没有进入执行分派。

### Phase 1：目标仓库 public surface / contract

目标：

- 在目标仓库建立可消费入口。
- 补类型、exports、contract tests。

禁止：

- 外层仓库立即删除旧实现。

验收命令：

```text
npm run build:check
npm run check
```

完成标准：

- package exports 可 self-reference import。
- contract tests 通过。

### Phase 2：外层消费替换

目标：

- 外层生产调用切到新 public surface。
- 保留宿主 adapter / wiring。

禁止：

- 未扫描前删除旧目录。
- 删除 CLI / daemon / HTTP / Dashboard / Plugin delivery。

验收命令：

```text
<boundary lint>
<build/check>
```

完成标准：

- local production consumers 降到预期值。
- 保留项均有解释。

### Phase 3：删除候选清理

目标：

- 删除已被替代的重复实现。
- 清理 package imports / aliases / tests。

入口条件：

- Phase 2 验收通过。
- import 扫描无遗留。
- 替代入口和代表性验证通过。

禁止：

- 删除 host-owned adapter。
- 删除仍有真实调用的能力。

验收命令：

```text
<boundary lint>
<build/check>
<representative tests>
```

完成标准：

- 删除候选路径不存在或只剩明确保留文件。
- package imports 不再暴露已删除别名。

### Phase 4：发布 / live 联动封口

目标：

- 验证 packaging、runtime、Dashboard、daemon、plugin/channel。

验收命令：

```text
npm run build:check
npm run verify:codex-plugin
npm run smoke:codex-plugin
npm run build
```

完成标准：

- release gate 通过。
- live smoke 有记录；无法执行时写明原因。

## 5. 阶段任务包

派发前先识别下一处真实阻塞点，并把阻塞点之前同阶段、同窗口、同边界、同验证链路下可推进的主线动作和可关闭 TODO 合成任务包。不要每次只派一个很小的动作；如果只能派一个小任务，必须写明原因。

| 任务包 ID | 窗口 | 阶段目标 | 主线动作 | 合并 TODO | 明确不包含 | 阻塞 / 依赖 | 验证命令 | 回填要求 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PKG-1 | `Repo` |  |  | `TODO-ID` / 无 |  |  |  |  |

组包判断：

- 当前真实阻塞点：
- 阻塞点之前还能做：
- 本轮必须合入的 TODO：
- 本轮不合入的 TODO 及原因：
- 是否需要运行 `node scripts/check-task-packages.mjs --require`：

## 6. 窗口分派表

派发视图只放两列，方便总控和用户快速判断谁该收到提示词，并把横向空间尽量留给任务。保存位置、验证命令、挂载入口和回填细节放到下方“派发细节”、各窗口执行要求或回填区，不放进这张表。

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>状态 |  |
| `AlembicCore`<br>状态 |  |
| `AlembicAgent`<br>状态 |  |
| `AlembicDashboard`<br>状态 |  |
| `AlembicPlugin`<br>状态 |  |
| `AlembicTest`<br>状态 |  |

### 派发细节

- `Alembic`：文档动作；保存位置；挂载入口；回填位置；验证命令；阻塞 / 依赖。
- `AlembicCore`：文档动作；保存位置；挂载入口；回填位置；验证命令；阻塞 / 依赖。
- `AlembicAgent`：文档动作；保存位置；挂载入口；回填位置；验证命令；阻塞 / 依赖。
- `AlembicDashboard`：文档动作；保存位置；挂载入口；回填位置；验证命令；阻塞 / 依赖。
- `AlembicPlugin`：文档动作；保存位置；挂载入口；回填位置；验证命令；阻塞 / 依赖。
- `AlembicTest`：测试单动作；保存位置；挂载入口；回填位置；验证命令；阻塞 / 依赖；真实测试项目只作为目标项目。

## 7. TODO / Backlog

当本计划需要承载用户讨论中的待办、风险、候选优化、验证点、问题修复或下一波派发调整时，必须保留本节。单一线性迁移且没有 TODO 子模式时，可以写“无”并说明原因。

| ID | 状态 | 类型 | 严重度 / 优先级 | 归属 | 事项 / TODO | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TODO-1 | 主线 / 可并行 / 阻塞 / 观察 | 需求 / 设计 / 风险 / 修复 / 验证 / 文档 / 清理 | P0 / P1 / P2 | `Repo` |  | 是 / 否 |  | `Repo` |

## 8. 空闲窗口调度

| 窗口 | 当前调度 | 理由 | 是否发送 |
| --- | --- | --- | --- |
| `Alembic` | 主线 / 可并行 / 阻塞 / 观察 / 无任务 / 已完成 |  | 是 / 否 |
| `AlembicCore` |  |  |  |
| `AlembicAgent` |  |  |  |
| `AlembicDashboard` |  |  |  |
| `AlembicPlugin` |  |  |  |
| `AlembicTest` |  |  |  |

## 9. 回填模板

每个执行窗口完成后回填：

```text
窗口：
阶段：
状态：
完成范围：
文件 / 模块变化：
提交 hash：
验证命令：
验证结果：
未运行命令及原因：
遗留风险：
需要其它窗口处理：
下一步建议：
```

## 10. 验收矩阵

| 验收项 | Alembic | AlembicCore | AlembicAgent | AlembicDashboard | AlembicPlugin |
| --- | --- | --- | --- | --- | --- |
| 工作区干净 |  |  |  |  |  |
| 替代入口已接入 |  |  |  |  |  |
| import 扫描无遗留 |  |  |  |  |  |
| build/check 通过 |  |  |  |  |  |
| tests/smoke 通过 |  |  |  |  |  |
| 文档已回填 |  |  |  |  |  |
| 下一步已分派 |  |  |  |  |  |

## 11. 当前可复制分派提示词

```text
先读取 AGENTS.md、docs/workspace/<this-doc>.md，以及你所在窗口/目标仓库的 AGENTS.md；先明确声明当前窗口定位和本轮仓库职责，再按照文档领取并完成分配给你所在窗口的任务；完成后回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。
```
````

## 3. 单阶段执行记录模板

适合放在 `docs/<Repo>/` 或 `docs/workspace/`：

````markdown
# <Topic> <Repo> Phase N

日期：YYYY-MM-DD
窗口：<Repo>
阶段：Phase N - <name>
状态：执行中
来源任务：<workspace doc path> 第 <section>

## 1. 领取任务

目标：

- <目标>

范围：

- <允许改动>

禁止：

- <禁止事项>

## 2. 执行前扫描

命令：

```text
<commands>
```

结论：

- <结论>

## 3. 实现记录

完成内容：

- <内容>

文件变化：

- `<path>`：<说明>

边界判断：

- 进入本仓库：<能力>
- 留在其它仓库：<能力>
- 删除候选：<路径>
- 不得删除：<路径>

## 4. 验证记录

```text
<command>: <passed/failed/skipped>
```

未运行命令：

- `<command>`：<原因>

## 5. 提交

```text
<hash> <message>
```

## 6. 遗留风险

- <风险>

## 7. 回填给总控

状态：
完成范围：
提交 hash：
验证结果：
遗留风险：
下一步建议：
````

## 4. 验收 / 下一波模板

适合每一波结束后新建：

````markdown
# <Topic> Wave N Acceptance And Next Plan

日期：YYYY-MM-DD
总控窗口：AlembicWorkspace
状态：执行中

本文承接 `<previous-doc>`。用户口径为 <summary>；本文件记录总控验收结果并派发下一波任务。

## 1. 本轮验收结论

| 窗口 | 结论 | 提交 / 记录 | 说明 |
| --- | --- | --- | --- |
| `Alembic` |  |  |  |
| `AlembicCore` |  |  |  |
| `AlembicAgent` |  |  |  |
| `AlembicDashboard` |  |  |  |
| `AlembicPlugin` |  |  |  |

## 2. 验收命令

| 仓库 | 命令 | 结果 |
| --- | --- | --- |
|  |  |  |

## 3. 边界复核

### 3.1 已切换

- <内容>

### 3.2 仍保留

- <内容>

### 3.3 删除候选

- <内容>

### 3.4 不得删除

- <内容>

## 4. 下一波分派表

| 窗口 | 状态 | 任务 | 文档动作 | 保存位置 | 挂载入口 | 回填位置 | 验证命令 | 阻塞/依赖 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `Alembic` |  |  |  |  |  |  |  |  |
| `AlembicCore` |  |  |  |  |  |  |  |  |
| `AlembicAgent` |  |  |  |  |  |  |  |  |
| `AlembicDashboard` |  |  |  |  |  |  |  |  |
| `AlembicPlugin` |  |  |  |  |  |  |  |  |

## 5. 总控决策

下一步启动顺序：

1. <窗口 / 任务>

禁止事项：

- <禁止事项>
````

## 5. 常用扫描命令清单

按需使用，必须替换路径和 specifier：

```text
git status --short
git log --oneline -8
rg -n "<specifier>|<old alias>|<delete candidate>" lib bin scripts test package.json config
rg -l "<old import prefix>" lib bin scripts test
rg -n "from ['\"]<specifier>|import\\(['\"]<specifier>|require\\(['\"]<specifier>" lib bin scripts test
rg -n "<http path>|<job name>|<router key>|<container token>|<package export>" lib bin scripts test package.json
find <path> -type f | sort
find <path> -type f -name "*.ts" | xargs wc -l
npm run build:check
npm run check
npm run lint:agent-extraction-boundary
npm run report:agent-extraction-boundary
npm run verify:codex-plugin
npm run smoke:codex-plugin
npm run build
```

## 6. 总控使用流程

1. 读 `AGENTS.md` 和当前 `docs/workspace/index.md`。
2. 找到当前总控入口和相关历史文档。
3. 跑工作区状态、import、入口、路由、exports、runtime packaging 和验证命令扫描。
4. 先写真实代码基线和阶段拆分理由，再写或更新分阶段迁移总控文档。
5. 更新 `docs/workspace/index.md`。
6. 给用户输出一条可复制分派提示词；提示词必须要求执行窗口先读目标仓库 `AGENTS.md` 并明确当前窗口定位。
7. 窗口回填后，新建 wave acceptance 文档验收并派发下一波。

## 7. 反模式清单

不要这样做：

- 没有扫描就写删除计划。
- 只读历史文档，不读真实代码和调用链。
- 凭感觉把大目标一次性塞进同一波。
- 一波同时做 contract、外层消费、删除清理和发布 smoke。
- 用空壳 facade 冒充迁移完成。
- 为了边界好看删除宿主 adapter。
- 把发布 smoke 混在代码迁移阶段里悄悄跳过。
- 把“未运行”写成“通过”。
- 把 `待启动` 直接改成 `已完成`，但没有提交和验证证据。
- 当前阶段未验收，就把下游阶段写成可启动任务。
- 多仓库计划只覆盖被点名仓库，忘记 Dashboard、Plugin、Core 或发布链路。

## 8. 来源文档

本模板主要参考今天以下文档的结构和经验：

- `docs/AlembicOld/alembic-core-public-api-boundary-construction-plan-2026-05-17.md`
- `docs/AlembicOld/alembic-core-stage-14-outer-convergence-and-finalization-plan-2026-05-17.md`
- `docs/AlembicOld/alembic-outer-repositories-post-migration-audit-and-next-plan-2026-05-17.md`
- `docs/AlembicOld/alembic-plugin-agent-ai-tool-cleanup-implementation-plan-2026-05-17.md`
- `docs/AlembicAgent/alembic-agent-extraction-boundary-plan-2026-05-17.md`
- `docs/AlembicAgent/alembic-agent-phase-0-inventory-2026-05-17.md`
- `docs/AlembicAgent/alembic-agent-phase-6-contract-surface-2026-05-17.md`
- `docs/AlembicAgent/alembic-agent-tool-v2-contract-2026-05-17.md`
- `docs/workspace/alembic-agent-extraction-boundary-acceptance-next-plan-2026-05-17.md`
- `docs/workspace/alembic-agent-extraction-boundary-wave-2-acceptance-next-plan-2026-05-17.md`
- `docs/workspace/alembic-plugin-npx-runtime-packaging-fix-2026-05-17.md`
