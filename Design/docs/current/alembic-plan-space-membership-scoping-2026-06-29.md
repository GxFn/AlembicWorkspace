# Alembic 完整项目空间使用逻辑修复（删 workspace.config.json + project-scopes 提升为前置 + 子仓→整空间 recipe + 全 5 仓）— Requirement Design (strict)

Date: 2026-06-29
Design Key: alembic-plan-space-membership-scoping-2026-06-29
Source Window: Design
Status: ready-for-intake
Repos: Alembic 主体 + AlembicCore + AlembicPlugin + AlembicAgent + AlembicDashboard（删除耦合在 Core+Plugin；前置/写侧/双宿主跨 Core+Plugin+主体；Agent/Dashboard 校验）

> **2026-06-29 重大订正①**：初稿误把 `workspace.config.json`（实为 **Wakeflow 控制器配置**）当 Alembic 空间清单。经用户订正 + 真实代码核验，**Alembic 有自己的原生项目空间配置 = ProjectScope（`~/.asd/project-scopes.json`，运行时 reader 在主体 `Alembic/lib/project-scope/ProjectScopeRegistry.ts`）**，且对本工作空间**早已完整存在**（`project-scope-a8083fdb335c`，5 成员）。

> **2026-06-29 重大订正②（范围扩展，用户指令）**：用户把本需求从"接线 cold-start 加载原生 scope"**扩展为完整项目空间使用逻辑重整**：① **删除** Alembic 中所有使用/关联 `workspace.config.json` 的代码逻辑 ② 把 **project-scopes 提升为重要的前置** ③ 检查所有"该用空间信息却没用"的站点 ④ **插件在子仓库使用时能拿到整个空间的 Recipe 信息** ⑤ 覆盖 **Alembic 项目空间全部仓库**。**§11（11.0–11.10）为权威扩展设计**（11-agent 深度测绘 + 双轮对抗 critique：file:line 删除清单/前置 chokepoint/全站点 gap/子仓→整空间/分阶段验收/critique 修正）。§1–§10 为原始较窄框架——**根因证据仍有效，但修复范围、分层修复集、阶段计划以 §11 为准**。§6 的 F-1~F-5 被 §11.8 的 G-1~G-4 + F-1~F-7 取代。

---

## 1. 症状（真实证据）

整体 Alembic 项目空间冷启动目标 = workspace root `/Users/.../AlembicWorkspace`（ghost project `ecf32806`，DeepSeek 生成 + Ollama qwen3-embedding 向量）。`alembic_plan {operation:draft, generationStage:coldStart, projectRoot:<workspace root>, hints:{focusModules:[5 仓]}}` 实测产出污染 ProjectContext：

| 字段 | 实测值 | 应为 |
|---|---|---|
| `primaryLanguage` | **swift** | typescript |
| `fileCount` | **5000**（撞上限） | 真实成员源文件数 |
| `moduleCount` | **120** | 5 成员仓（或其真实子模块） |
| 顶层 children | `Test`(1557)/`wakeflow-ledger`(1618)/`legacy-docs-do-not-use`(349)/`Test/tmp/*BiliDili` Swift 副本/`workspace-ledger`(183) | Alembic/AlembicCore/AlembicPlugin/AlembicDashboard/AlembicAgent |

真实 5 仓规模（排除 node_modules/dist/vendor）：Alembic 345 / AlembicCore 661 / AlembicPlugin 401 / AlembicDashboard 27 / AlembicAgent 235 TS 文件。**影响**：host-agent（含此前 codex）在污染基座冷启动 → Recipe 语言/模块/取材错位 → 质量不足。此为冷启动质量问题的**上游输入域根因**。

---

## 2. 根因（真实代码，file:line，已订正）

### 2.1 Alembic 原生项目空间配置 = ProjectScope（已存在且完整填充）

**Alembic 自有一等公民项目空间配置**，与 Wakeflow 的 `workspace.config.json` 无关：

- 类型契约：`ProjectDescriptor`（`AlembicCore/src/shared/ProjectScope.ts:65-78`：`folders: ProjectFolderDescriptor[]` + `projectId` + `projectScopeId` + `storage:ghost` + `currentFolderId`）、`ProjectFolderDescriptor`（`:53-63`：每成员仓一条 `path`/`displayName`/`role:primary-source|source`/`repositoryId`/`state:active`）。
- API 契约：`ALEMBIC_PROJECT_SCOPE_ENDPOINTS`（`ProjectScope.ts:26-31`）`addFolder`/`listFolders`/`readScope`/`resolveFolder`；操作 `project-folders.add/list/resolve` + `project-scope.read`。
- 持久化：**`~/.asd/project-scopes.json`**（ghost registry，`storagePolicy:ghost-only`，`projectRootWriteAllowed:false` 不写进仓库）；项目注册表 `~/.asd/projects.json` 映射 projectRoot→projectId；持久化/解析层 `AlembicCore/src/shared/ProjectRegistry.ts`。
- **本工作空间的原生 scope 早已配好**（`~/.asd/project-scopes.json` → `project-scope-a8083fdb335c`，projectId=`ecf32806`，controlRoot=AlembicWorkspace，创建 2026-05-24/25，`producer:alembic`）：
  ```
  folders[] = 正好 5 个成员仓：
    Alembic          role=primary-source   folder-278cdc6c8560
    AlembicCore      role=source           folder-94c596418c32
    AlembicPlugin    role=source           folder-13b22158ca25
    AlembicDashboard role=source           folder-b5c9f02bf50a
    AlembicAgent     role=source           folder-8cd66f5af7fc
  ```
- 原生 scope **确被多路径消费**：daemon（`ProjectRuntimeContracts.ts`/`RuntimeContracts.ts`）、resident（`AlembicResidentServiceClient.ts`）、`AlembicPlugin/lib/runtime/HostProjectAlignment.ts`、**`AlembicPlugin/lib/service/project-knowledge-context/project/ProjectScopeFolders.ts`**、bootstrap/SetupService/StatusService。

**结论：原生项目空间配置存在、正确、已填充 5 成员，且已有现成加载消费方——不需新造、不需填充。**

### 2.2 缺陷 = cold-start/plan/draft 承重扫描路径不加载原生 ProjectScope

承重扫描血统**完全不碰** ProjectRegistry/原生 scope（grep 证实 `plan-tool.ts`/`GenericDiscoverer.ts`/`workflows/project-index/*.ts` 均非消费方；`plan-tool.ts` 内 `readScope*` 仅无关本地 `readScopeFilePath` helper `:1541`）。`repo.ts` 虽在消费列表但只用 ProjectRegistry 给 root **打 identity 标签**（`repo.ts:423`），不约束扫描。具体：

- **`space` handler 不读持久化原生 scope**：`space.ts:211-239` 的 folder 来源 = (1) **请求 `payload.sourceFolders`**（plan/draft 没传）→ (2) 回落 `readProjectScopeFromWorkspaceConfig(projectRoot)`（`ProjectScope.ts:270-292`，默认读 `workspace.config.json`=**Wakeflow 文件**，字段碰巧兼容 `repositories[]`/`repoNames[]`）→ (3) 单 folder 全根 fallback。**三条路都不是已填充的原生 ProjectScope。** `configFileName` 从不被改写（恒 `workspace.config.json`），故"原生 scope"在此路径上从未被加载。
- **承重字段取自不域路径**：`primaryLanguage`←`inferPrimaryLanguage`←`repo.languages`（`plan-tool.ts:1447` / Core `repo.ts:1240`），`repo` 查询 repoRoot 解析为 `.`→absoluteRoot=workspace root（`repo.ts:385-402`）→**裸根扫**；`fileCount`←含 Plugin 全根 walk `collectProjectSourceFileFacts`（`project-source-facts.ts:30`，cap 5000）。
- **`focusModules` 死输入**：仅 schema `mcp-tools.ts:887` 声明，`collectPlanProjectContext(projectRoot,_hints)`（`plan-tool.ts:1220-1222` 下划线故意不用）零消费 → 我传的 5 仓没生效。
- **discoverer 裸根分桶**：无根 package.json→回落 `GenericDiscoverer`（`DiscovererRegistry.ts:47-50`）把顶层 `src/lib/test` 名目录当模块（`GenericDiscoverer.ts:58-82`）；语言无权重 argmax（`LanguageService.ts:543`）Swift 副本压过；fallback 模块按 `filePath.split('/')[0]` 分桶（`plan-tool.ts:994-1001`）→ Test/ledger/legacy 成"模块"。三排除集（`SourceScanExclusions.ts:8`/`space.ts:36`/`project-source-facts.ts:20`）仅 deps/build，漏噪声目录。
- **下游同病**：bootstrap project-index full-mode（`ProjectIndexPlan.ts:53-78`）仅 `maxFiles` 封顶，**无成员 folder 约束** → 生成也从裸根/噪声取材。

### 2.3 一句话根因

**Alembic 原生项目空间配置（ProjectScope，5 成员已填充）存在且被 resident/daemon 路径正常消费，但承重的 cold-start/`alembic_plan`/bootstrap 扫描路径从不加载它**——转而裸根扫描或回落借读 Wakeflow 的 `workspace.config.json`。属"原生配置就绪但承重路径未接线"，**修复=接线加载既有原生 scope，不新造、不填充、不依赖 Wakeflow 文件**。

---

## 3. 用户假设确认

"应该是有项目空间概念的 / workspace.config.json 是 wakeflow 的、要重新确认 Alembic 项目空间配置" —— **完全确认且已定位**：Alembic 原生空间配置 = ProjectScope（`~/.asd/project-scopes.json` 经 `ProjectRegistry`），对本空间为 `project-scope-a8083fdb335c`，5 成员（Alembic=primary-source）。初稿误用 Wakeflow 文件已订正。

---

## 4. 用户目标 / 完成定义

让 `alembic_plan draft` 及其下游 cold-start/bootstrap 生成所共享的 ProjectContext **加载并 honor Alembic 原生 ProjectScope**：

1. **draft 干净**：workspace root 重跑 draft → 经 `ProjectRegistry` 解析 projectId=ecf32806 → 加载 `project-scope-a8083fdb335c` 的 5 成员 folder → `primaryLanguage=typescript`；顶层模块=5 成员仓（Test/ledger/legacy 噪声**不出现**）；`fileCount/moduleCount` 反映真实成员源。
2. **生成同 scope**：confirm→bootstrap→project-index full-mode 生成扫描同样限定原生 scope 成员 folder（非仅 draft 展示层）。
3. **不依赖 Wakeflow 文件**：原生 ProjectScope 为 single source of truth；`workspace.config.json` 读取降为最后兜底（仅当无原生 scope 的非托管根），不作为 Alembic 托管空间的主路径。
4. **双宿主 parity**：Plugin host-agent 与主体 in-process plan 路径一致加载原生 scope。
5. **非回归**：单仓冷启动（projectRoot 即单仓、无原生 scope）行为不变。门禁/freeze/floor 不破。

---

## 5. 范围

- 拥有：F-1（Core：承重扫描 honor 原生 ProjectScope）+ F-2（Plugin：`collectPlanProjectContext` 加载原生 scope + focusModules 接活）+ F-3（下游 bootstrap/project-index full-mode 生成 scope）+ F-4（双宿主 in-process parity）+ F-5（Wakeflow-config 回落降级 + 可选 defense-in-depth）。
- 不拥有：**不新造空间概念、不填充已存在的原生 scope**；不改单仓行为；不改 freeze；不动 production floor；不重做架构重构已成功主体。
- 跨仓：AlembicCore + AlembicPlugin（主）+ AlembicAgent/主体（parity 校验）。

---

## 6. 修复设计（分层 F-1~F-5）

> 总原则：**承重 cold-start 扫描血统从"裸 projectRoot / 借读 workspace.config.json"改为"经 `ProjectRegistry` 加载原生 ProjectScope 的成员 folder 后逐成员扫描聚合"**。复用既有消费方（`ProjectScopeFolders.ts`/`HostProjectAlignment.ts` 已会加载原生 scope），勿另造。plumbing 多已存在（`repo.ts:385-390` 已 honor `repoRoot`/`sourceFolder`；`space.ts:228` 已 honor `payload.sourceFolders`）——缺的是把原生 scope 的 folders 喂进去。

- **F-1 [AlembicCore] 承重扫描 honor 原生 ProjectScope**
  - 在 cold-start discoverer/repo 扫描入口（`repo.ts:516-562` `collectDiscoveryFacts`；`GenericDiscoverer.load` `:41-96`）接受/解析原生 scope 成员 folder allowlist：经 `ProjectRegistry`（projectRoot→projectId→`readScope`）得 `ProjectDescriptor.folders[]`，**逐成员 folder 运行 discoverer 后聚合**，替代单根全扫。
  - 语言 argmax 在成员域聚合后算 → typescript 自然胜。复用 `ProjectGraph.resolveProjectGraphSourceRoots`/`SourceGraphIndexer.resolveSourceGraphSourceRoots` 既有 membership 模式。
  - `space` handler：在 `payload.sourceFolders` 与 `workspace.config.json` 之间**新增"加载持久化原生 ProjectScope"为优先来源**（`space.ts:214` 决策点）。

- **F-2 [AlembicPlugin] `collectPlanProjectContext` 加载原生 scope + 接活 focusModules**（收口点 `plan-tool.ts:1220-1299`）
  1. `:1222` 停止丢弃 hints；经 `ProjectRegistry`/复用 `ProjectScopeFolders.ts` 加载原生 scope 成员 folder 作为 scope 集；`hints.focusModules` 作可选**收窄** override（成员子集，见 CG-4）。
  2. `:1244` `repo` 查询：把成员 folder 作 `payload.sourceFolders` / 逐成员 `repoRoot` 传入（`space.ts:228`/`repo.ts:385-390` 已支持），替代单根 `{projectRoot}` 查询。
  3. `:1246` `collectProjectSourceFileFacts`：传成员 allowlist，walk 限定成员子树。

- **F-3 [Core/Plugin] 下游 bootstrap/project-index full-mode 生成 scope**
  - 把原生 scope 成员域从 confirm 的 planSelection 贯穿进 intent → `ProjectIndexPlan.ts:53-78` full-mode 扫描，使**生成**限定成员 folder。

- **F-4 [双宿主] 主体 in-process plan 路径 parity**
  - 校验主体 in-process（@alembic/agent）plan 前置组件是否同样经 `ProjectRegistry` 加载原生 scope；不一致则一并接入。F-1（Core 层）若为共享 discoverer 修复则两宿主自动受益。真测两宿主同 space root draft 成员模块集合相等、primaryLanguage 一致。

- **F-5 [Wakeflow-config 回落降级 + 可选兜底]**
  - `readProjectScopeFromWorkspaceConfig`（读 `workspace.config.json`=Wakeflow 文件）**降为最后兜底**：仅当 `ProjectRegistry` 无原生 scope 的非托管根才用；Alembic 托管空间走原生 scope。明确记注释边界（这是 Wakeflow 文件、非 Alembic 配置）。可选扩三处排除集 + 尊重 `.gitignore` 作兜底，不单独依赖。

---

## 7. 阶段候选 + 验收

- **P1 [Core F-1]**：承重扫描 honor 原生 ProjectScope + 单测。验收：单测覆盖"有原生 scope（ProjectRegistry 解析出 folders）→ 仅成员 folder 进扫描、聚合后 typescript、噪声不进 target"；"无原生 scope 单仓 → 行为不变"。Core `npm test` 绿（Node≥22）。
- **P2 [Plugin F-2]**：`collectPlanProjectContext` 加载原生 scope + focusModules 接活 + draft 重跑验收。验收：workspace root 真跑 `alembic_plan draft` → `primaryLanguage=typescript`、顶层=5 成员仓、无 Test/ledger/legacy、`moduleCount/fileCount` 合理；focusModules 显式收窄子集时 draft 反映该子集。Plugin build/freshness 绿。
- **P3 [F-3+F-4]**：bootstrap/full-mode 生成 scope + 双宿主 parity。验收：生成扫描限定成员 folder（job artifacts 证据）；两宿主 draft 成员模块集合相等。
- **P4 [真机闭环]**：真实 Alembic 空间根（rebuild 授权）重跑 draft→干净 ProjectContext→冷启动→抽查生成 Recipe `language=typescript`、`sourceRefs` 指向成员仓真实文件、无噪声引用（DeepSeek 生成 + 千问向量）。

真机测试主体 = **真实 Alembic 项目空间 ecf32806（5 成员，见 §12.R）**；单仓非回归用 synthetic 单仓 fixture。**BiliDili 不可作本需求测试主体**（单仓 + 空 ProjectMap，结构上测不了多仓空间逻辑）。DeepSeek=生成、千问=向量（不可错配）；Alembic 空间 recipes 可删可重建。

---

## 8. CG 决策（✅ 全部已决 2026-06-29）

> 用户确认 CG-3=整条生成血统、CG-5=双宿主一并修；CG-1/2/4 按推荐。订正后 CG-1/CG-2 语义随原生 scope 框架更新。下列均为**已定决策**，实现窗口直接执行。

- **CG-1 空间配置来源 = (a) 原生 ProjectScope（ProjectRegistry/project-scopes.json）为 single source of truth**；存在即默认 scope 到其成员 folder。`workspace.config.json`（Wakeflow）降为非托管根的最后兜底（F-5）。无任何 scope 即单仓现状（非回归）。focusModules 作可选收窄。
- **CG-2 噪声排除策略 = (a) 原生 scope 成员 allowlist 为主**（直接锚定已填充的 5 成员真相）；.gitignore/扩黑名单为兜底（F-5 可选，不单独依赖）。
- **CG-3 修复深度 = (a) 整条 cold-start 生成血统**（draft+bootstrap+project-index full-mode 全 honor 原生 scope）。仅修 draft 展示层会令 Recipe 仍从噪声生成，已排除。
- **CG-4 focusModules = (a) 接活为可选收窄 override**（在原生 scope 成员域内进一步收窄；schema 已声明，接线即可）；不删字段。
- **CG-5 双宿主 parity = (a) 本需求内一并校验修复**（含 AlembicAgent/主体 in-process plan 路径加载原生 scope 的 parity 真测）。

---

## 9. 风险 / 非回归

- **R-非回归（最高）**：单仓冷启动（无原生 scope、无 workspace.config.json）必须行为不变——修复 gate 在"ProjectRegistry 解析出原生 scope folders"上，无则走现状血统。P1 单测必须覆盖。
- **R-勿破既有消费方**：原生 scope 已被 daemon/resident/HostProjectAlignment/ProjectScopeFolders 正常消费——接线 cold-start 时复用、勿改坏其行为。
- **R-projectId 解析**：plan/draft 的 projectRoot 须经 `ProjectRegistry`（projects.json）正确解析到 projectId/projectScope；ghost 模式下 dataRoot 来自 ghost-registry。注意我误建的 AlembicCore 单仓 project（94c59641，knowledge=0）是 projects.json 中独立条目，与原生 scope 的 `folder-94c596418c32`（同 path-hash）不冲突但勿混淆——可清理（见小注）。
- **R-submodule**：Alembic 主体含 `vendor/AlembicCore`、`vendor/AlembicDashboard` submodule（vendor 已在排除集）；原生 scope 的 5 成员 folder 已是顶层仓 path，勿把 vendor 副本当成员重复计。
- **R-freeze/floor**：不改 freeze 字面量；production floor 不放松；不改 R-2 cleanup 语义。
- **R-双血统残留**：本需求只接线承重 cold-start 血统加载原生 scope；不强求合并 discoverer 与 ProjectContext 两血统（更大重构，非本目标）。

---

## 10. 与其它需求关系

- 与 [[alembic-recipe-lifecycle-refactor-residual-followup]]（已 deliver pending-claim）**正交**：那是 coverage module-id/code_guard schema/docs；本需求是冷启动**输入域**未加载原生 ProjectScope，独立缺陷、独立需求。
- 修好后方可在干净基座（原生 5 成员 scope）重做整体 Alembic 空间高质量冷启动——被本问题阻塞的原任务。

## §11 完整项目空间使用逻辑修复(深挖订正)

> 本节由 7 路并行测绘(A1 删除清单 / A2 native ProjectScope 前置 / A3 全空间 recipe 访问 / A4 全站点 should-use GAP / A5 双宿主 in-process / A6 cold-start 接线 / A7 Dashboard·init·config)综合而成,全部 file:line 经真实源码复核。所有锚点区分 **exists-and-works** / **exists-but-unused(死代码)** / **absent**。验证基线:本 workspace 的 native scope `project-scope-a8083fdb335c`(projectId `ecf32806`,5 个 member folder,dataRoot `~/.asd/workspaces/ecf32806`)已存在且填满(6 knowledge_entries + 19 recipe_source_refs,跨 Alembic/AlembicPlugin/AlembicAgent/AlembicCore 四仓),由 5 次手工 `project-scope add` 于 2026-05-24 建立,**与 workspace.config.json 无关**。

### 11.0 核心订正(纠正 SHARED CONTEXT 与 dossier 间分歧)

复核后必须先记录三处与原始 SHARED CONTEXT 框架不符、且 dossier 间互相纠正的事实(取证据更强的一方):

1. **native ProjectScope 的 store/persistence/addFolder 不在 AlembicCore,而在 Alembic 主体。** `AlembicCore/src/shared/ProjectScope.ts` 是**纯函数,无任何文件 I/O**;真正读写 `~/.asd/project-scopes.json` 的唯一运行时代码是 `Alembic/lib/project-scope/ProjectScopeRegistry.ts`(`ProjectScopeRegistryStore`)。全 5 仓 `grep "project-scopes"`(排除 node_modules/dist/vendor)只命中这一个运行时文件(其余是 `ProjectScope.ts`/`index.ts`/测试)。**任何"提升 project-scopes 为前置"若假设 Core 拥有持久化,即 mis-scoped。**(A2/A4/A6 一致,纠正 SHARED CONTEXT 的 "persistence ... live in AlembicCore" 措辞。)

2. **SHARED CONTEXT 称 native scope 已被 `HostProjectAlignment.ts + ProjectScopeFolders.ts` 消费 — 半错且关键。** 复核:`AlembicPlugin/.../ProjectScopeFolders.ts:12` 读的是 **Wakeflow `workspace.config.json`**(`readProjectScopeFromWorkspaceConfig`),不是 native registry;`HostProjectAlignment.ts:8-15` 用的是 `ProjectRegistry`(`~/.asd/projects.json`,identity-only),不是 member-folder 列表。**Core/Plugin 中没有任何代码读 `~/.asd/project-scopes.json`。**(A6 纠正,A3/A4 佐证。)

3. **`repo.ts:423` 的 "identity-only" 争议 reconcile。** A1/A2 称 identity-only,A5 称 "NOT identity-only"。真实代码(repo.ts:423-449):Wakeflow-file scope 读出的 `scopeFolder` **只喂 `repoId`/`repoName`/`projectScopeFolderId` 三个 identity 字段**,不影响扫描覆盖。结论:**用途是 identity-only(A1/A2 对),但数据源仍耦合 Wakeflow 文件(A5 对)** — 两者不矛盾,删除时按 identity 级风险处理但源必须切 native。

此外纠正 A5 的一处 over-claim(见 §11.6):in-process `ProjectMapModules.ts` 并非"保留裸 module.id" — 它在 :29-31/:46 用同一 canonical 函数**丢弃**无 name/无 id 的 module;真实分歧是**不对称修复**(Plugin 端从 sourceFileFacts 推断 modulePath,in-process 端不推断)。

---

### 11.1 删除清单 — 全部 Alembic workspace.config.json 代码/逻辑(含删除顺序与 native 替换)

分布:**workspace.config.json 耦合只存在于 AlembicCore + AlembicPlugin**。Alembic 主体 / AlembicAgent / AlembicDashboard **零** workspace.config.json scope 代码(grep 命中 `Alembic/lib/http/routes/ai.ts:891` 是 "LLM workspace config" 日志串;`AlembicAgent/.../CapabilityManifest.ts:83` 的 `'workspace-config'` 是 capability-source 枚举字面量,均与本文件无关)。

#### 11.1.A 定义块(AlembicCore/src/shared/ProjectScope.ts — 一次性删整段)
全部属同一 workspace-config 关注点,且无外部复用:
- `WorkspaceConfigProjectScopeOptions` 接口 — **:245-252**(`configFileName?:` 在 :246,即 SHARED CONTEXT 指出"从不被覆盖"的 `'workspace.config.json'` 开关 — 已复核 :277 `options.configFileName ?? 'workspace.config.json'`,全仓无任何 caller 传 `configFileName`)。
- `readProjectScopeFromWorkspaceConfig(controlRoot, options)` — **:270-292**(唯一带字面量的 reader)。
- `createProjectScopeFromWorkspaceConfig` — **:294-325**(`metadata.source='workspace.config.json'` 在 :320)。
- `resolveWorkspaceConfigProjectFolders` — **:327-375**(全 5 仓唯一从 JSON config 读 `repositories[]`/`repoNames[]` 的代码,:338-339;`dispatchWindows`/`controllerWindow`/`designWindow` 从不被 Alembic 读)。
- 私有助手 `normalizeWorkspaceConfigRepositories` **:891-912**、`isInternalRepository` **:914-918**、`normalizeStringArray` **:920-926**、`resolveWorkspaceConfigFolderPath` **:928-932**(`normalizeStringArray` 仅被 `resolveWorkspaceConfigProjectFolders` 使用 — 删除前最后确认无他用)。
- barrel:`AlembicCore/src/shared/index.ts:59` 移除 `readProjectScopeFromWorkspaceConfig` 导出(其余三函数不在 barrel)。
- **KEEP(同文件 native,勿删):** `createProjectScopeRegistryDocument`(:711)、`upsertProjectScopeInRegistry`(:724)、`addProjectScopeFolderToRegistry`(:742)、`resolveProjectScopeRegistryFolder`(:754,已复核为正确的纯解析器:遍历全 scope→`resolveProjectScopeForFolder`→最长 folder.path 前缀胜)、`listProjectScopeFolders`(:459)、`resolveProjectScopeForFolder`(:463)、`createProjectDescriptor`(:396)、`addProjectScopeFolder`(:426)。这些是 native API 基底。
- **KEEP:** `ALEMBIC_PROJECT_SCOPE_ENDPOINTS`(:26-31)是存活的 native HTTP 契约(由 `Alembic/lib/http/routes/project-scope.ts` 提供),勿与 config reader 一并删。

#### 11.1.B 消费站点(call chain + native 替换)
| # | 站点 | 当前 | 替换 | 风险 |
|---|---|---|---|---|
| 2a **承重** | `AlembicCore/.../space/space.ts:211-239`(+projectId fallback :253-257) | `:212-213` 字面量探测 + `:214` `readProjectScopeFromWorkspaceConfig` + `:215-225` query-unavailable 错误 | repoint 到 native loader(见 11.2);`hasExplicitFolders`(:211)与 `readExplicitFolderInputs`(:228)已支持注入 → 优先**注入 payload.sourceFolders** | **CRITICAL** — 无 sourceFolders 的 cold-start 调用,删 :214 后静默退化为单 whole-root(:231-239)=swift/5000/120 噪声。loader 必须先落地 |
| 2b | `AlembicCore/.../repo/repo.ts:423-449` | `:423` Wakeflow read → `:425` resolveProjectScopeForFolder → `repoId/repoName/projectScopeFolderId`(identity-only 用途,Wakeflow 源) | 同 native loader;null fallback `createRepoIdFromPath` 已存在 | 低(仅 identity label 退化) |
| 2c | `AlembicCore/src/core/ast/ProjectGraph.ts:806-811`(option field :60) | `workspaceConfigProjectScope!==false` 门(**无 caller 设 false** → fallback 恒活)→ `:807` Wakeflow read | 删 :806-811 块 + 删 :60 option;`listProjectScopeFolders` 路径(:799/:809)KEEP | 默认扫描边界从 Wakeflow→native,本 workspace 等价(同 5 folder),测试需重基线 |
| 2d | `AlembicCore/.../source-graph/SourceGraphIndexer.ts:447-456`(field :36) | 镜像 2c:`input.workspaceConfigProjectScope!==false` 门(同恒活)→ `:448` Wakeflow read;descriptor 路径(:439/:449 `activeProjectScopeFolders`)KEEP | 同 2c | 同 2c |
| 2e **死码** | `AlembicPlugin/.../project/ProjectScopeFolders.ts:1-53` | `:12` `readProjectScopeFromWorkspaceConfig` + sub-dir-only 过滤(:22-27) | **整文件删除** — 已复核全 5 仓**零外部 importer**(grep 命中均为 Core 自身的 `listProjectScopeFolders`,非本模块);无需 native 接线 | 零 |
| 2f | `AlembicPlugin/.../project/ProjectGraphProvider.ts:1985` | `['package.json','tsconfig.json','workspace.config.json'].includes(basename)` filename-启发式 allowlist(不读文件) | 仅从数组删 `'workspace.config.json'` 串 | 零 |

#### 11.1.C 测试(迁移而非删除,以免丢覆盖)
- `AlembicCore/test/ProjectScopeContracts.test.ts:18,25,26,126-157` — 断言被删函数 → **删该 test**,保留同文件 native 契约。
- `AlembicCore/test/ProjectContextProjectSpace.test.ts:180,214-216,297,304` — **多 folder 空间真实覆盖**;**迁移**到 native `project-scopes.json` fixture,勿删。
- `AlembicCore/test/ProjectContextEndToEnd.test.ts:781,802` — fixture 写 workspace.config.json+repoNames helper;迁移到 native registry 或改走 `payload.sourceFolders`。
- `AlembicCore/test/SourceGraphIndexer.test.ts:79-84` — `'uses workspace.config repoNames...'`;迁移到 native fixture。
- `AlembicPlugin/test/unit/ProjectGraphTool.test.ts:350,500-503` — 迁移到 native,或改为断言 native-seeded space 结果。

#### 11.1.D 孤儿 population 路径 flag + fix
**孤儿风险:删 workspace.config.json reader 后,本 workspace 的现存 scope 不受影响**(它由手工 addFolder 建立,metadata `producer:"alembic"`/`storagePolicy:"ghost-only"`,非 `source:"workspace.config.json"`)。但**新 workspace 的唯一存活 population 路径**只剩手工 `addFolder`(见 11.7)。Wakeflow-file 那条"临时便利 fallback"消失后,fresh checkout 在人工 `project-scope add` 之前 scope registry 为空 → 必须在 init 补一等公民 population(见 11.7)。

#### 11.1.E 安全删除顺序(强制 sequencing)
1. **先删死/装饰码(零风险):** ProjectScopeFolders.ts 整文件;ProjectGraphProvider.ts:1985 串。
2. **落地 native Core loader**(见 11.2 的 `loadProjectScopeForFolder`/D-2)— **必须先于触碰 2a**。
3. **逐个 repoint 承重扫描站点 + 同步迁移其测试:** 2a → 2b → 2c → 2d;删 `workspaceConfigProjectScope` option(ProjectGraph.ts:60 / SourceGraphIndexer.ts:36)。
4. **同步迁移 5 个测试文件**(11.1.C)。
5. **最后删定义块:** barrel(index.ts:59)→ ProjectScope.ts:245-375 + 助手 :891-932(确认无他用后)。
6. **残留扫描:** Core `build:check`+`test`,Plugin `build:check`+`test:unit`,全 5 仓 `git grep 'workspace.config.json|WorkspaceConfig|repoNames'` 应只剩 `ai.ts:891` 日志串 + `CapabilityManifest.ts:83` 枚举。

---

### 11.2 project-scopes 提升为前置(canonical chokepoint + path→space + dataRoot keying)

#### 11.2.A 今天两条平行 resolution 血统(只有一条吃 native registry)
- **血统 1 — 主体 in-process(已 native-scope-aware,工作):** chokepoint = `Alembic/lib/project-scope/ProjectScopeRegistry.ts:160` `resolveFolder(path)` → Core `resolveProjectScopeRegistryFolder` + `resolveControlRoot` fallback;`:178-188` `resolveWorkspace` → `WorkspaceResolver` 携 `projectScope`;`:277` `resolveAlembicWorkspace` 是全 workspace 前置入口,被 `Bootstrap.ts:219`、`InfraModule.ts:93/98`、`DaemonJobServices.ts:55/72`、`ProjectRuntimeControl.ts:506/574/596/879`、`http/routes/{daemon.ts:78,search.ts:544}`、CLI 广泛消费。扫描桥 `ProjectScopeAnalysis.ts:93` + `attachProjectScopeToScanOptions(:112)`。
- **血统 2 — Core ProjectContext + source-graph + Plugin(不吃 native):** space.ts:214 / repo.ts:423 / ProjectGraph.ts:807 / SourceGraphIndexer.ts:448 / ProjectScopeFolders.ts:12 全读 Wakeflow 文件或单根 fallback。

#### 11.2.B path→space 解析机制(已实测,sub-repo→whole-space 在血统 1 已成立)
**走的是 walk-down 前缀匹配,不是 walk-up,但效果等同 walk-up。** 链:`resolveFolder` → `resolveProjectScopeRegistryFolder`(ProjectScope.ts:754,遍历全 scope,最长 folder.path 前缀胜)→ `resolveProjectScopeForFolder`(:463)→ `findBestProjectScopeFolder`(:829)→ `isSameOrInsidePath(folderPath, folder.path)`(:939)。对 `…/AlembicCore/src/foo.ts`,`path.relative('…/AlembicCore', '…/AlembicCore/src/foo.ts')='src/foo.ts'`(无 `..`)⇒ inside ⇒ 命中 `folder-94c596418c32` ⇒ 返回**整个 SPACE scope**。`projects.json` 的 per-repo ghost(`94c59641`)**不参与 scope 解析**(`resolveFolder` 只查 `project-scopes.json`)。**实测 dist 探针:** `AlembicCore/src/foo.ts`→scope `a8083fdb335c`/dataRoot `ecf32806`/folder `94c596418c32`/matched-folder;`controlRoot`(workspace 根)→matched:false/folder-not-bound(`assertFolderCanEnterScope` 禁 controlRoot 作 folder,ProjectScope.ts:812-817);`BiliDili`→null(正确隔离)。

#### 11.2.C dataRoot keying — 每 SPACE 一个,5 member 共享
`dataRoot` 是 `ProjectDescriptor` 单字段(ProjectScope.ts:71),非 per-folder。创建时 `ProjectScopeRegistry.ts:217-221` `createScope` → `projectId=generateProjectId(controlRoot)`(controlRoot 默认 = 首 folder 的 dirname = `AlembicWorkspace`)→ `dataRoot=getGhostWorkspaceDir(projectId)`(`ProjectRegistry.ts:119-126` = `~/.asd/workspaces/<projectId>`)。`addFolder` 保留既有 dataRoot(`addProjectScopeFolder` ProjectScope.ts:451-457)。`WorkspaceResolver` 构造(WorkspaceResolver.ts:110-116):`projectScope` 存在 ⇒ 强制 `ghost=true`、`projectId=scope.projectId`(`ecf32806`)、**`dataRoot=scope.dataRoot`(共享)**,而 `projectRoot` 仍是 sub-repo 源码路径。**⇒ 5 member 共读写同一 `alembic.db`/recipes/knowledge/coverage,whole-space 访问结构性保证。**

#### 11.2.D canonical chokepoint 推荐 + Core/host 边界决策(D-1 vs D-2)
跨仓可达性是本节核心架构约束:唯一 native loader(`ProjectScopeRegistryStore`)在主体 `Alembic/lib`,**Core 与 Plugin 都不能 import 它**(Core 在两者之下;Plugin 只消费 `@alembic/core`)。两条出路:
- **D-1(注入):** 解析方(主体 cold-start 入口 / Plugin host)先解析 scope,总是把 `payload.sourceFolders`(+ per-folder `repoRoot`)注入 `space`/`repo` query。Core 改动最小(只删 :214/:423 Wakeflow fallback)。但 Plugin 路径今天无主体依赖 → Plugin 仍需自带 native reader。
- **D-2(推荐,把 read 下沉 Core):** 在 `@alembic/core/shared` 新增只读 `loadProjectScopeForFolder(folderPath): ProjectDescriptor|null`(读 `join(getProjectRegistryDir(),'project-scopes.json')`,复用已存在的纯解析器 `resolveProjectScopeRegistryFolder` ProjectScope.ts:754;只缺**从磁盘 load document** 这一步),让 space.ts:214/repo.ts:423 直接调用。这使 native scope 成为 Core 内部的前置(目标 #2),并让 plan/draft(Plugin)与 bootstrap/rescan(Core workflows)统一吃 native,无需各 caller 重实现。

**注:** D-2 须遵守 Core CLAUDE "Core 不做宿主 I/O" — 但读 `~/.asd/project-scopes.json` 与 Core 既有 `getGhostWorkspaceDir`/`ProjectRegistry` 读 `~/.asd` 同级(Core 已读 `~/.asd`),故 D-2 不破边界。这是 **OPEN 决策点**(见末)。

**前置门(precondition gate)落点:** 主体侧 `Bootstrap.initializeWorkspaceResolver`(Bootstrap.ts:214-225)已调 `resolveAlembicWorkspace` 并把 space dataRoot 加入 PathGuard allowlist — in-process 前置**大部分已就位**。缺:(1)"scope 必须解析否则显式失败"的强制门(今天 registry 空时静默退化单仓);(2)把 Core ProjectContext handlers 路由进它。`controlRoot` 返回 `folder-not-bound` 须被当作"space 已解析,无 currentFolder"而非"无 scope"。

---

### 11.3 sub-repo → whole-space recipe/knowledge 访问(含 folder-scoped 子集视图 + 94c59641 碰撞)

#### 11.3.A 存储模型 — per-space DB 是唯一 scoping
recipe/knowledge 的 scope **纯由打开哪个 `alembic.db` 决定**(resolver 的 dataRoot)。`DatabaseConnection.ts:59,65-69` 在 `workspaceResolver.dataRoot + /.asd/alembic.db` 开 DB;knowledge/recipe 仓库**无 project/folder WHERE 列**(`RecipeSourceRefRepository.ts:80` `select().from(recipeSourceRefs).all()` 返回该 DB 全行;`schema.ts` 中 `projectScope`/`folderId` 只在 `source_graph_generations:486`/`git_diff_checkpoints:642`,knowledge 表无)。**⇒ "看到哪些 recipe" == "resolver 算出哪个 dataRoot"。**

**实测磁盘(5 个 per-repo ghost DB 真实存在):** space `ecf32806`=6 knowledge/19 recipe(跨 4 仓:Alembic 10/Plugin 5/Agent 3/Core 1);per-repo `94c59641`(AlembicCore,**今天 2026-06-29 新建**)=0/0;`13b22158`(Plugin)=5 自有 knowledge;`278cdc6c`(Alembic)=0/0。**`94c59641` 正是需求警告的 per-repo 分歧,且正在正常使用中产生。**

#### 11.3.B 唯一开关 + folder-scoped 子集视图设计
开关 = `WorkspaceResolver` 构造(WorkspaceResolver.ts:110-132):`projectScope` 传入 ⇒ space DB;否则 ghost ⇒ per-repo(空)DB;否则 standard ⇒ `isOwnDevRepo.ts:31-62`+`DatabaseConnection.ts:74-84` 检测 dev-repo 标记 → 重定向 `/tmp/alembic-dev/alembic.db`(第三种失败模式)。

**设计:让 native `project-scopes.json` 解析成为 Core resolver 层的前置**,使每个 `WorkspaceResolver.fromProject(memberPath)` 在无显式 scope 时自加载 space(D-2),一次解决 `inspectKnowledge`、single-folder baseline、所有裸 `fromProject` 站点 → 无需 daemon round-trip。

**folder-scoped(本仓子集)视图仍可行:** `currentFolderId` 已被携带(WorkspaceResolver.ts:104-108;`resolveProjectScopeForFolder` ProjectScope.ts:463)。dataRoot 仍是 SPACE DB(所有 recipe 可达),per-folder 收窄靠**过滤 `recipe_source_refs.source_path` 前缀 / `currentFolderId`**,而非切 DB。`git_diff_checkpoints.folderId`/`source_graph_generations.projectScope` 列证明 per-folder 维度已存在。

#### 11.3.C 我之前 per-repo init(94c59641)碰撞的纠正
`94c59641` 是 AlembicCore 被独立 ghost-register(`projects.json`,2026-06-29)产生的 per-repo dataRoot。它**不破坏 scope 解析**(解析忽略 `projects.json`),但若任何 consumer 用 `ProjectRegistry.inspect().dataRoot` 而非 scope store 解析 member sub-repo 的 dataRoot,会得到 `~/.asd/workspaces/94c59641`(空)而非共享 `ecf32806`。**fix:** init/population 必须 **idempotent detect-then-resolve**(先解析既存 space,命中则不创建 per-repo ghost),且 §11.4 审计须确认无扫描路径走 `inspect().dataRoot` 解 member 路径。`cleanup.projectRoot` 选择(ProjectIndexPlan.ts:68 host-agent→dataRoot)须确认不会 wipe 错目录(顶级陷阱)。

#### 11.3.D daemon 依赖现状(Plugin 路径的脆弱点)
Plugin 工具(`alembic_recipe_map/prime/search/graph` ∈ `RESIDENT_PROJECT_SCOPE_TOOL_NAMES`,ToolPolicy.ts:79-83)今天 whole-space-from-sub-repo **完全 load-bearing 在运行的 space-bound resident daemon + 正确 `runtime-control.json`** 上:`HostMcpServer.ts:996-1024` 非 scope-aware 工具→`projectScopeIdentity:null`;scope-aware→`residentClients().projectScope.resolveProjectScopeIdentity`;`AlembicResidentServiceClient.ts:533-605` 仅当 live resident 才用 space scope,否则 `buildSingleFolderBaselineIdentity`(:563-568);recovery `:687-715` 读 `runtime-control.json` 找 space daemon hit `/resolve-folder`;结果经 env `ALEMBIC_CODEX_PROJECT_SCOPE_SUMMARY`(embedded-executor.ts:134-138)→`bootstrap.ts:191-194`。**daemon 一停,每个 sub-repo 的 recipe/knowledge 工具静默退化到空 per-repo ghost DB(干净零结果无报错)= 用户可见"看不到空间 recipe"症状。** D-2 的磁盘前置可消除此 daemon 依赖。

---

### 11.4 全站点 GAP INVENTORY(should-use-space-but-doesnt)

> severity: HIGH=破坏目标 #4 或承重扫描;MED=工具看不到空间但非承重;LOW=报告/下游继承。

| tool/service | file:line | current | shouldBe | sev |
|---|---|---|---|---|
| space handler(**承重**) | `AlembicCore/.../space/space.ts:211-225` | Wakeflow file → 单 folder fallback(:231-239) | native `project-scopes.json` by member-folder(注入 sourceFolders) | **HIGH-CRIT** |
| projectId 解析 | `space.ts:253-257` | Wakeflow-derived `projectScope.projectId` | native scope projectId | HIGH |
| repo handler(identity) | `repo.ts:423-449` | Wakeflow file → repoId/repoName/projectScopeFolderId | native scope(用途仍 identity-only) | MED |
| resolveProjectRoot | `AlembicCore/src/shared/resolveProjectRoot.ts:30-36` | `_projectRoot`→`ALEMBIC_PROJECT_DIR`→`cwd`,单 folder | 把 member sub-repo 折叠到 space controlRoot | HIGH(~15 handler 总入口) |
| resolveDataRoot | `resolveProjectRoot.ts:47-59` | `WorkspaceResolver.fromProject` 无 projectScope → ghost dataRoot | 从 registry 解析 space dataRoot | HIGH |
| WorkspaceResolver.fromProject | `WorkspaceResolver.ts:139-156` | 仅当 caller 传 projectScope 才 space-aware | 新增 `fromProjectScopeRegistry`/自加载(D-2) | HIGH(缺失前置) |
| SourceGraphIndexer | `SourceGraphIndexer.ts:447-456` | `workspaceConfigProjectScope` fallback 读 Wakeflow | 删该分支;descriptor 路径(:439)KEEP | MED |
| ProjectGraph | `ProjectGraph.ts:806-811` | 同上 | 同上 | MED |
| ProjectContextCapabilities | `AlembicCore/src/project-context-capabilities.ts`(被 plan-tool.ts:1229 / project-context-analysis.ts:206 调) | 透传 `scope:{projectRoot}`,无折叠 | 注入 space sourceFolders | HIGH |
| search identity | `AlembicCore/src/service/search/SearchTypes.ts:338-362` | `ProjectRegistry.inspect(projectRoot)` → 自/standard dataRoot | space dataRoot | HIGH(目标 #4) |
| DatabaseConnection | `DatabaseConnection.ts:59-65` | `dataRoot ?? projectRoot` | space-aware resolver 上游 | HIGH(下游) |
| ProjectRootResolver(host) | `AlembicPlugin/.../ProjectRootResolver.ts:76-125,273-292` | env/cwd 单 member root,不检测 space | native-scope 折叠 | HIGH(目标 #4 直接 blocker) |
| safeProjectRootFallback | `lib/runtime/mcp/host/project-root.ts:4-10` | cwd/PWD/home | 下游(LOW) | LOW |
| project-root-scope | `lib/runtime/mcp/host/project-root-scope.ts:30-72` | 收 args.projectRoot,不折叠 | space 折叠 | MED |
| Plugin bootstrap | `AlembicPlugin/lib/bootstrap.ts:186-201` | space-aware 仅当 env 设置;无磁盘 fallback | 磁盘 load `project-scopes.json` | HIGH |
| resident scope identity | `AlembicResidentServiceClient.ts:533-619` | 仅 live resident;否则 single-folder baseline | daemon-captive(post-PDR-3 默认单 folder) | HIGH |
| readJob daemon | `HostMcpServer.ts:815-820` | `const daemon=null` 硬编码 → identity 恒 null | 死 true-branch | HIGH |
| ProjectScopeFolders(死) | `AlembicPlugin/.../ProjectScopeFolders.ts:11-40` | 零 consumer + 读 Wakeflow file | 删 | (死码) |
| project-context-analysis | `AlembicPlugin/.../host-agent-workflows/project-context-analysis.ts:206-213` | 只传 `input.projectRoot` 给 space 请求,无 sourceFolders | 注入 space member folders | HIGH(rescan/cold-start) |
| SetupService(init) | `AlembicPlugin/lib/cli/SetupService.ts:156-166` | `ProjectRegistry.register` ghost,无 createProjectDescriptor/addFolder | init 填 project-scopes.json membership | HIGH |
| submit_knowledge | `AlembicPlugin/.../handlers/knowledge.ts:22` | 单 root → 写入单 folder dataRoot | 写共享 space DB | HIGH(碎片化) |
| consolidate | `handlers/candidate.ts:144` | `resolveDataRoot\|\|resolveProjectRoot` 单 root | space dataRoot | HIGH |
| search tool | `handlers/search.ts:184` | `args.projectRoot ?? resolveProjectRoot` 单 root | space-aware container | MED-HIGH |
| recipe_map | `handlers/recipe-map.ts:102` | 单 root | space | MED |
| graph/structure | `handlers/structure.ts:90,211,239` | 单 root | space | MED |
| code_guard | `handlers/guard.ts:240,333,608` | 单 root | space | MED |
| prime/work | `handlers/agent-public-tools.ts:2327` | 单 root | space | MED |
| tool-router | `handlers/tool-router.ts:238` | 单 root | space | MED |
| status/system | `handlers/system.ts:111` | 单 root | space | LOW |
| cold-start | `host-agent-workflows/cold-start.ts:109-110` | 单 root 扫描 | scan space folders | HIGH |
| knowledge-rescan | `host-agent-workflows/knowledge-rescan.ts:199-200` | 单 root 扫描 | scan space folders | HIGH |
| KnowledgeState.inspect | `AlembicPlugin/lib/runtime/KnowledgeState.ts:194-213` | `fromProject(projectRoot)` 无 scope → 读空 per-repo DB | space dataRoot | HIGH(驱动 initialized/hasKnowledge 门) |
| inferPrimaryLanguage | `AlembicPlugin/.../plan-tool.ts:1447` | whole-tree argmax → swift | per-folder argmax(上游 bound 后自动正确) | (继承) |
| ProjectIndexPlan full-mode | `AlembicCore/.../project-index/ProjectIndexPlan.ts:72` | `projectAnalysis.projectRoot=input.projectRoot`,无 member 列表 | plumb native member folders | HIGH(bootstrap) |
| **OK** HostProjectAlignment | `AlembicPlugin/.../HostProjectAlignment.ts:87,468-470` | 消费 `projectScopeIdentity.folders/controlRoot` | (真 space-aware,但 daemon-captive) | ok |
| **OK** Dashboard | `AlembicDashboard/.../ProjectScopePanel.tsx:61-348`,`api.ts:3159-3188` | 全消费 native ProjectScope REST | 无需改 | ok |
| **OK(死)** native 纯解析器 | `AlembicCore/src/shared/ProjectScope.ts:743-790` | 正确纯 space 解析器,**无生产 caller** | D-2 接 disk store 即用 | unused |

---

### 11.5 承重 cold-start 接线(合并 plug-in points)

承重链:`alembic_plan(draft)` → `collectPlanProjectContext`(plan-tool.ts:1220) → 3 个 ProjectContext query(space/repo/map) → Core space.ts/repo.ts → `GenericDiscoverer`/`LanguageService` argmax。逐点:

- **PLUG 1a — `plan-tool.ts:1243`** `push('space',{includeProjectTree:true})` 无 sourceFolders → 函数入口先解析 native scope,传 `sourceFolders`(5 member 相对路径)+ `projectId`。
- **PLUG 1b — `plan-tool.ts:1244`** `push('repo',{includeMapSummary:true})` 无 repoRoot → repo.ts:385 defaults `'.'` → 整树扫描(swift/5000/120 来源)。改为**每 member folder 一个 repo query**(或绑 primary-source folder),传 `repoRoot=<member-folder>`。repo.ts:385-390 已 honor `payload.repoRoot`(含 containment :391 + realpath :413 检查)→ **复用,无需改 repo.ts 内部**。
- **PLUG 1c — `project-source-facts.ts:30`** `collectProjectSourceFileFacts(projectRoot)` 整根 BFS(只排 `.asd/.git/.wakeflow/DerivedData/node_modules`,cap 5000,:18)→ 加 `sourceFolders?:string[]` 选项,scan root 迭代 member folders(per-folder budget 防大仓饿死小仓);caller :1246 传 scope folders。
- **PLUG 1d — dead inputs:** `collectPlanProjectContext(projectRoot, _hints)`(:1220-1222,`_hints` 下划线未用)+ schema `focusModules`(`mcp-tools.ts:887`,max 40,"draft-only hints",**从不被扫描读**)。steering 应来自 native scope,非 hints。`focusModules`:要么 wire 为 member-folder 子集 filter,要么删该公开 schema 字段(visible API 变更,须确认 — 见 OPEN)。
- **PLUG 1e — `plan-tool.ts:994`** `groupFilesIntoFallbackModules` 按 `filePath.split('/')[0]` 分桶 → 整根扫描时 top segment 是仓名+噪声。scope-bounded 后须确认 bucket key 相对每 member folder 计算(module id per repo 稳定)。
- **PLUG 2 — `space.ts:214`(priority-source 插入,目标 #2):** 替为优先级梯:(1)native registry by projectRoot →(2)`payload.sourceFolders` 显式覆盖(保留)→(3)[删]Wakeflow。删 :215-225 存在性错误 + :255 projectId fallback。
- **PLUG 3 — `repo.ts:423`:** 替为 native-registry resolution;保留 :425 `resolveProjectScopeForFolder` 匹配。`collectDiscoveryFacts`(:516-562)/`GenericDiscoverer.load`(:41-96,moduleCount=120 来源,exclude :20 不排 Test/wakeflow-ledger)/`DiscovererRegistry.detect`(:43-53)/`LanguageService.detectPrimary`(:530-549)**均无需改** — 它们正确扫描给定 `absoluteRoot`,bound 上游(PLUG 1b/2)后输入即正确。
- **PLUG 4 — `ProjectIndexPlan.ts:72`(bootstrap/full-mode):** plumb native member folders(给 `ColdStartWorkflowIntent.projectAnalysis` 加 `sourceFolders` 在 :71-88 消费,或 per-folder 跑分析),使 bootstrap/rescan 也吃 native。`cleanup.projectRoot`(:68 host-agent→dataRoot)不变。

**复用资产(勿重建):** repo.ts:385-390 payload.repoRoot;space.ts:227-228 `readExplicitFolderInputs`;`ProjectScopeRegistryStore.resolveFolder`(:160)/`resolveWorkspace`(:178)canonical 解析器;`ProjectScopeFolders.ts:19` 的 `listProjectScopeFolders→相对路径` transform(其源须从 Wakeflow 换 native)。

---

### 11.6 双宿主 parity — in-process(Alembic 主体 + @alembic/agent)gap

**结构性颠倒:in-process 是两宿主中唯一原生加载 `~/.asd/project-scopes.json` 的,却在扫描前丢弃它。**

#### 11.6.A in-process 已解析、却丢弃(承重 break)
- 解析:`ProjectScopeRegistry.ts:178-188` `resolveWorkspace` 真实读 native registry;`Bootstrap.ts:214-225` boot 时 wire 全 5-folder descriptor;`ProjectScopeAnalysis.ts:93-110` `resolveProjectScopeAnalysisContext` 返回完整 7 字段 scope。**dataRoot=`projectScope.dataRoot`(共享 `ecf32806`)** ⇒ **目标 #4 数据读取侧(recipe/knowledge)已 MET**。
- 丢弃:`ColdStartWorkflow.ts:111-162` 与 `KnowledgeRescanWorkflow.ts:200-283` 解析 `analysisScope` 后只 destructure `{dataRoot,projectRoot}`,把 `analysisScope` 传入 `buildProjectContextWorkflowFacts` 而该函数**声明 `analysisScope?`(:130)却从不读**(grep 确认 :162-340 无引用)。每个 `executeProjectContextRequest` 只用 `input.projectRoot`(:174-249);`space` payload 仅 `{includeProjectTree:true}`(:179);`executeProjectContextRequest`(:714-732)建 `scope:{projectRoot}` 无 sourceFolders。⇒ 到达 Core space.ts:211 时 `hasExplicitFolders=false` ⇒ 走 Wakeflow fallback。**grep 全 `Alembic/lib` 仅 2 处 `sourceFolders`:类型守卫(:1123)+ 日志投影(ProjectScopeAnalysis.ts:135)— 零 producer。** `attachProjectScopeToScanOptions`(ProjectScopeAnalysis.ts:112-123)会注入但**扫描路径无 caller**(死)。

#### 11.6.B @alembic/agent 零 scope 感知
`AgentRuntimeBuilder.ts:44-64` `projectRoot=process.cwd()`,`dataRoot=projectRoot`,无 ProjectScope/ProjectRegistry/sourceFolders。其唯一 space 输入是主体喂的 `projectScopeSourceIdentities`(`PipelineStrategy.ts:911-917`,`PcvNodeEvidence.ts:217`)— 但**退化为空**:`buildWorkflowFiles`(ProjectContextWorkflowFacts.ts:808-822)的 file 无 `sourceIdentity` 字段 ⇒ `collectProjectScopeSourceIdentities`(ProjectScopeAnalysis.ts:144-159)返 `[]` ⇒ `RuntimeInitializer.ts:63-112` 喂空 map。**plumbing 完整真实,payload 空。** parity 修复必须落在主体 facts/runtime builders,不在 Agent。

#### 11.6.C parity 表(已复核 + 订正 R-1)
| # | 维度 | Plugin host-agent | in-process | status |
|---|---|---|---|---|
| P1 | native scope load | 不读 native,读 Wakeflow | 读 native registry,boot wire 完整 descriptor | **颠倒**(in-process 更 native,随即丢弃) |
| P2 | 扫描 folder 集 | 单 projectRoot | 单 projectRoot(忽略 analysisScope) | **双破,同症** |
| P3 | dataRoot/recipe 根 | resident/HostProjectAlignment 用 native dataRoot | `dataRoot=projectScope.dataRoot` 共享 | **MET**(双方读 whole-space) |
| P4 | moduleId canonical(R-1) | `knowledge-rescan.ts:625+` 第二 target-axis builder **从 sourceFileFacts 推断 modulePath**(:52 `inferTargetModulePathFromSourceFacts`),无 modulePath 则 `continue`(:53-54) | `ProjectMapModules.ts:22-46` 仅取 `module.ref?.scope.filePath`,**不推断**;无 id/name 经同一 canonical fn(`buildCanonicalCoverageLedgerModuleId` :29-31,:46 filter)被**丢弃** | **BROKEN(订正 A5)**:并非"保留裸 id" — 同样丢弃,真实分歧是**不对称修复**(Plugin 推断 modulePath 救回 module,in-process 不救)⇒ 非空 ProjectMap 上 module 轴分歧 |
| P5 | sourceIdentity stamping | space 请求可携 sourceFolders → folder 得 repositoryId/folderId | file 无 sourceIdentity(空 map) | **BROKEN** |
| P6 | repoId provenance | Wakeflow file(repo.ts:423) | 同 repo.ts:423(Wakeflow) | 一致但双方 Wakeflow 耦合 |

**canonical fn 已复核:** `CoverageLedgerBuilder.ts:82-121` `buildCanonicalCoverageLedgerModuleId` — `target:name:path` 仅当 name+path 双在(:95-106),否则 `existingId ?? moduleName ?? modulePath`(:120)。parity 全靠每宿主一致供 modulePath — 而它们不一致(P4)。**BiliDili(单仓/空 ProjectMap)掩盖 P2/P4 — 任何 parity test 必须用多 folder/非空 ProjectMap fixture。**

#### 11.6.D in-process 删除耦合(强 sequencing 风险)
主体/Agent **无直接 workspace.config.json 读**,但 in-process 扫描经 Core space.ts:214/repo.ts:423 **传递性依赖** Wakeflow file。**删 Wakeflow file(目标 #1)前,必须先把 native `sourceFolders` 接入 `buildProjectContextWorkflowFacts`,否则 in-process 扫描退化单 folder + in-process repoId provenance 断。** 修复点:`ProjectContextWorkflowFacts.ts:714-732`(注入 sourceFolders)+ `:808-822`(stamp per-folder sourceIdentity)+ `ProjectMapModules.ts:16-46`(对齐 Plugin 的 modulePath 推断)。`RuntimeInitializer.ts:63-112` 是正确注入 seam,scan stamp 后自动交付 whole-space identity 给 Agent。

---

### 11.7 init/population 路径(workspace.config.json 删除后 space 如何获得 member)+ stale config 修复

#### 11.7.A 现状 — population 仅手工两入口,init 不填 scope
唯一写 `project-scopes.json` 的 mutation = `ProjectScopeRegistryStore.addFolder`(`ProjectScopeRegistry.ts:129-158`),仅两 caller:(a)`Alembic/bin/cli.ts:510` `project-scope add <folder>`;(b)`Alembic/lib/http/routes/project-scope.ts:117` `POST /api/v1/project-scope/folders`(Dashboard "Add Folder")。**init/setup 从不创建/填充 native scope**(grep `addFolder|createScope|writeScope|registerScope` 于 init 路径无命中;init 中 ProjectScope 提及均为 resident 消费)。`SetupService` 只 `ProjectRegistry.register(projectRoot, ghost)`(identity)+ 建 `WorkspaceResolver` 无 projectScope ⇒ **init 与 native ProjectScope 是两个脱节宇宙**。

#### 11.7.B 双 init writer + stale single-repo/swift defaults(已复核 byte-identical)
两处 `stepRuntime` 写**逐字相同**的 stale v2 `.asd/config.json`:
- `AlembicPlugin/lib/cli/SetupService.ts:294-320`(`alembic_init`/`codex_init`,经 `HostMcpServer.ts:627`)。
- `Alembic/lib/cli/SetupService.ts:251-268`(主体 CLI `setup`,经 `bin/cli.ts:128-147`;多 `ai:{provider}`)。
两者写硬编码 `core.dir=DEFAULT_KNOWLEDGE_BASE_DIR`('Alembic',`ProjectMarkers.ts:26`)、`core.constitution`、`watch.extensions:['.swift','.m','.h']`、`watch.paths:['Sources','src']`、`guard.enabled`。**这是单仓 swift 风味 config,与 5-member TS 空间矛盾。**

**v2 `.asd/config.json` 的 `watch.*` 是死配置:** grep `watch.extensions/paths/enabled` consumer 零真命中(`watch` 仅命中生命周期 verdict 枚举 `'healthy'|'watch'|'decay'|'severe'`)。该文件**无 Zod schema 无 typed loader**(Core 的 `AppConfigSchema` config.ts:130-145 校验的是 Core 包 `config/default.json`,不是 per-workspace `.asd/config.json`)。唯一存活 reader = `core.subRepoDir`/`subRepoUrl`(`ProjectMarkers.ts:88-118`)。`core.dir`/`watch.*`/`version`/`projectName`/`database`/`guard`/`core.constitution` **全无运行时 reader**。

#### 11.7.C 修复
1. **删两 init writer 的 stale 单仓块**(SetupService.ts 主体 :251-268 + Plugin :294-320,**lockstep 否则两路 init shape 漂移**):删 `core.dir`、`watch.*`(死)、`core.constitution`(死);**保留 `core.subRepoDir`/`subRepoUrl`**(唯一存活 reader,删则断 recipes sub-repo 解析)。
2. **init 补一等公民 native-ProjectScope 前置(今 absent):** `alembic_init`/`setup` 必须 detect/populate 多仓 scope(或 refuse/resolve against 既存 `project-scopes.json`)而非写单仓 config。**idempotent detect-then-resolve**:命中既存 `project-scope-a8083fdb335c`(2026-05-24)则不盲建/不重复(避免 §11.3.C 的 `94c59641` 碰撞)。这是让"project-scope 成前置"在首次使用真正触发的唯一落点。
3. **member→scope 解析下沉 Core(D-2):** 今仅主体 `ProjectScopeRegistryStore.resolveWorkspace`(:178-188)scope-aware;Core 的 `WorkspaceResolver.fromProject`/`resolveDataRoot` 不是。下沉后 Plugin/Agent/cold-start 从 member sub-repo 也得 whole-space dataRoot(目标 #4 覆盖**全路径**,非仅 HTTP/daemon)。
4. **Dashboard 无需 scope 改动** — 已正确 surface native ProjectScope(`ProjectScopePanel.tsx:61-348`)+ 全空间 recipe(`api.ts:2402,3074-3085` 无 folder/repo/scope filter,whole DB 镜像)。后端解析统一 scope-aware 后 Dashboard 自动正确。(per-folder recipe 过滤若需 = **新功能**,非本审计 gap。)
5. **(可选)给存活的 v2 `.asd/config.json` 加 typed schema**,否则 stale 单仓字段会经手工编辑/旧 init binary 复现。
6. **constitution 无 space 关联(absent):** `config.core.constitution` 无 runtime reader(存活 constitution 走 Core 包 `config.constitution.path` config.ts:53-56);随 stale 块一并清理即可。

---

### 11.8 分层修复集(G-* / F-*)、分阶段计划、真机验收、非回归、风险

(fSet 与 phases 见结构化字段;此处给设计依据)

**分层逻辑:** G-*(地基/承重,必须先行,跨仓阻塞)→ F-*(随地基落地的具体站点修复)。**最强 sequencing 不变量:native Core loader(G-1)必须先于任何 Wakeflow 删除/repoint;init 双 writer 必须 lockstep。**

**真机验收(沿用架构重构 §12 G4 覆盖门 + realverify anti-fab):**
- **基线护真:** `ALEMBIC_HOME` sandbox 护住真 `~/.asd`(忠实副本法:clone + `.backup()` 真 DB,只改 `git_diff_checkpoints.project_root`→沙箱);daemon.json `.url` 动态端口。
- **生成验收:** DeepSeek 生成 + 千问(Qwen)向量(`semantic_memories` 需 Ollama),anti-fabrication 真拦(production floor 拒未接地)。
- **synthetic 单仓 fixture(非回归基准,非 BiliDili):** 确认 single-repo 行为不变;parity 验收**必须用真 5-member 非空-ProjectMap 项目**(本 workspace `ecf32806`)重测 dual-host parity predicate。**BiliDili(单仓/空 ProjectMap)掩盖 P2/P4,且结构上测不了多仓空间逻辑,不可作本需求任何测试主体。**
- **whole-space 访问验收:** 从 `AlembicCore/src/foo.ts`(任一 member sub-repo)调 plugin → 解析到 `ecf32806` dataRoot,`alembic_search`/`recipe_map` 返回 19 recipe 全量(daemon 开/关两态都须过 — 验证 D-2 磁盘前置消除 daemon 依赖)。

**非回归:**
- single-repo/非空间项目(BiliDili)不受影响:无 `project-scopes.json` 时须有确定性单根 fallback + 明确日志(native scope missing vs present)。
- freeze/floor 不破:production floor 硬门、coverage freeze 语义、staging cap、`decayScore` 量纲(F-B 残留→Design,见 §-1)不在本需求改。
- 保留 DTO/排序/预算/状态机/错误语义/持久化:`metadata.source` provenance tag 消失须确认无 deleted-test 外 consumer。

**风险(reconcile 后汇总):**
1. **承重单点(space.ts:214):** 无 sourceFolders cold-start 的唯一多 folder 源;loader 先于 flip(G-1 先于 F-*)。
2. **跨仓可达性:** loader 在主体不可被 Core/Plugin import → D-2(下沉 Core)或 D-1(注入)二选一(OPEN)。
3. **`project-scopes.json` 无 writer 在 in-process 链:** 删 Wakeflow 后须 BOTH writer(init populate)+ reader(D-2),否则前置解析空/陈旧 registry。
4. **resolveProjectRoot 是 ~15 handler 总入口:** 改折叠语义影响每个工具的 projectId/dataRoot;须保留 per-call `args.projectRoot` 覆盖 + 不破单根独立项目。
5. **`94c59641` per-repo ghost 碰撞:** idempotent detect-then-resolve;审计无扫描路径用 `ProjectRegistry.inspect().dataRoot` 解 member 路径(cleanup.projectRoot wipe-错目录类风险)。
6. **5 个 per-repo ghost DB 已存分歧数据**(Plugin `13b22158` 有 5 自有 knowledge):promote space-only 须定义迁移/废弃,否则旧 per-repo 写入的 recipe 搁浅。
7. **R-1 非空 map parity:** ProjectMapModules.ts 须对齐 Plugin 的 modulePath 推断;parity test 用非空 ProjectMap fixture。
8. **inspectKnowledge/baseline 切 space dataRoot 改变 initialized/hasKnowledge 门**(`shouldRunStagingAccessSweep` HostMcpServer.ts:982-994):须重验无假"already initialized"。
9. **`focusModules` 删除是 visible API 变更**(alembic_plan schema):须确认 vs wire。
10. **`/tmp/alembic-dev/alembic.db` dev-repo 重定向**(DatabaseConnection.ts:74-84):任何回退 standard-mode dataRoot 重触发,第三失败模式。

---

### 11.9 exists / unused / absent 总账(快速校验)
- **exists-and-works:** native scope load + sub-repo→space 解析(主体 `ProjectScopeRegistry`);共享 dataRoot recipe 访问(`WorkspaceResolver` ghost 分支);source-identity plumbing 入 Agent(`RuntimeInitializer`→`AgentRunInputBuilders`);Dashboard native scope 消费;主体 HTTP/daemon 路径 member→space 解析。
- **exists-but-unused(死):** Plugin `ProjectScopeFolders.ts`(零 importer + Wakeflow 源);Core `resolveProjectScopeRegistryFolder`/`createProjectScopeRegistryDocument`(无生产 caller);`analysisScope` 入 `buildProjectContextWorkflowFacts`(传而不读);`attachProjectScopeToScanOptions`(无 scan caller);v2 `.asd/config.json` `watch.*`/`core.dir`/`core.constitution`(无 reader);`focusModules`/`_hints`(plan 死输入);`HostMcpServer.ts:815` daemon 死 true-branch。
- **absent:** Core/Plugin 中读 `~/.asd/project-scopes.json` 的代码;in-process `payload.sourceFolders` producer;`buildWorkflowFiles` per-file sourceIdentity;@alembic/agent 任何 space 感知;init-time native-scope detect/populate;v2 config 的 typed schema。

### 11.10 完整性 critique 修正（HIGH/MED/LOW，已并入设计）

> §11 由综合 agent 产出后经独立完整性 critic 复核，发现并修正以下问题。本节为对 §11.0–§11.9 的**生效订正**，实现以本节为准。

#### 11.10.A [HIGH·决策已拍] canonical 前置点 = `WorkspaceResolver.fromProject`（消除 D-2 locus 自相矛盾 + 一举覆盖全部裸 fromProject 站点）

§11.2.D 把自动解析落在"具名站点(space.ts:214/repo.ts:423，~6 处)"，而 §11.3.B 又说"落在 `WorkspaceResolver.fromProject`(~18 处)"——两者爆破半径不同、设计从未拍定，导致下列 ~10 个裸 `fromProject` 站点是否被修**未定义**。**拍定：自动解析落在 `WorkspaceResolver.fromProject`**（无显式 `projectScope`/env 覆盖时经 G-1 `loadProjectScopeForFolder` 自加载 space scope；单根 standalone 项目走 per-call **opt-out** + native-missing 单根 fallback）。这样**所有裸 `fromProject` 站点统一变 space-aware**，`space.ts:214`/`repo.ts:423` 退化为薄封装。这也正是用户"把 project-scopes 提升为前置"的字面落点（`fromProject` 是 dataRoot/scope 解析的总入口）。§11.2.D 与 §11.3.B 据此统一。

#### 11.10.B [HIGH·补全] §11.4 GAP 清单漏的裸 `WorkspaceResolver.fromProject` 站点（goal #4 的 per-repo dataRoot 泄漏正源）

下列站点产出 **per-repo（非 space）dataRoot**，§11.4 表缺失，全部由 11.10.A 的 `fromProject` 前置**传递性覆盖**（仍须逐一登记验收）：

| 站点 | 作用 | 严重度 |
|---|---|---|
| `AlembicCore/src/infrastructure/io/WriteZone.ts:72` | **写目标** dataRoot —— per-repo 会把 recipe/knowledge 写进错 DB，直接破坏 goal #4 | **HIGH（写侧）** |
| `AlembicPlugin/lib/recipe-generation/host-agent-workflows/project-data-root.ts:10` | `resolveHostAgentDataRoot` —— cold-start/rescan 的 dataRoot | **HIGH** |
| `AlembicPlugin/lib/runtime/runtime/ProjectRuntimeContext.ts:179`(+fallback :230) | per-tool runtime context 的 dataRoot，daemon-captive `single-folder-baseline` 退化 | **HIGH** |
| `AlembicCore/src/core/discovery/DiscovererRegistry.ts:76` 与 `:112` | discovery 内解析 dataRoot | MED |
| `AlembicCore/src/daemon/DaemonState.ts:50` | 裸 fromProject | MED |
| `AlembicPlugin/lib/shared/transient-transport.ts:54` | 裸 fromProject().dataRoot | MED |
| `AlembicPlugin/lib/runtime/status/StatusService.ts:152` | status/local-embedding | MED |
| `AlembicPlugin/lib/runtime/ProjectRootResolver.ts:218` 与 `:253` | host projectRoot 解析 | MED |

**写侧安全**：`WriteZone.ts:72` 与 `project-data-root.ts:10` 必须 space-aware，否则 reads 走 space、writes 留 per-repo → 数据静默分裂（5 个既存 per-repo ghost DB 含真实 knowledge，迁移/废弃见 openDecisions）。

#### 11.10.C [HIGH·验收命令修正] 残留 grep 必须排除 vendor/dist/node_modules

§11.1.E step-6 的 `git grep 'workspace.config.json|WorkspaceConfig|repoNames'` 会**误报**：被删代码在 vendor 快照里有副本（实测 `Alembic/vendor/AlembicCore/src/shared/ProjectScope.ts`、`.../space/space.ts`、`.../repo/repo.ts`、`.../core/ast/ProjectGraph.ts`、`.../source-graph/SourceGraphIndexer.ts`、`.../shared/index.ts`、`.../test/ProjectScopeContracts.test.ts` + `AlembicPlugin/vendor/AlembicCore/*` 全有）。

- 修正命令：加 `-- ':!*/vendor/*' ':!*/dist/*' ':!*/node_modules/*'`（或显式路径列 `Alembic/lib AlembicCore/src AlembicPlugin/lib AlembicAgent/src AlembicDashboard/src` + test 目录）。预期残留只剩 `Alembic/lib/http/routes/ai.ts:891`（"LLM workspace config" 日志串）+ `AlembicAgent/.../CapabilityManifest.ts:83`（`'workspace-config'` 枚举字面量）两处无关命中。
- **vendor 刷新要求**：`Alembic/` 与 `AlembicPlugin/` 的 `vendor/AlembicCore` 仍含 workspace.config.json reader，**须经 `npm run build:core` vendor 同步刷新（勿手改）**，否则下次 vendor sync 会把依赖带回。

#### 11.10.D [MED·订正设计自身的订正]

- **P4 parity 订正本身偏了**：§11.0/§11.6 称 in-process `ProjectMapModules.ts` 不推断 modulePath、Plugin 推断——**错**。in-process 有两个 builder 均在用（`ProjectContextWorkflowFacts.ts:269` `buildProjectMapModules`(map.modules 轴不推断,:16-47) **与** `:274` `buildProjectMapModulesFromTargets`(target 轴,:49-95,经 `inferTargetModulePath` :98-130 **确有**推断)）。真实分歧是**逐轴**（哪个轴胜/merge 顺序），不是"推断 vs 不推断"。**F-5 改为**：在非空 ProjectMap 上把 in-process 合并模块集(`:269-280` 去重后)与 Plugin knowledge-rescan 双轴输出**实测对比**，先定位真实 canonical-id 分歧再开方，**勿加已存在的推断**。
- **"ProjectScope.ts 纯函数无 I/O" 是错的**（强化而非削弱 D-2）：`ProjectScope.ts:2` import `{existsSync, readFileSync}`，被删的 reader 自身就在做 fs 读(:279/:286)。订正为"ProjectScope.ts 本就有 fs I/O（即被删的 reader）；registry document load 是唯一**新增**读"——这反而**坐实** D-2 在层内。
- **D-2 "Core no-host-I/O 边界"顾虑作废**：Core 早已读写 `~/.asd`（`ProjectRegistry.ts:93-114` `fs.read/writeFileSync` on `~/.asd/projects.json`，经 `getProjectRegistryDir()`）。读同目录 `project-scopes.json` 严格在既有先例内。**D-1 vs D-2 仅保留"确定性注入 vs 自动加载"设计偏好轴，删去边界违规轴；D-2 边界顾虑降为 RESOLVED-SAFE。**

#### 11.10.E [LOW]

- **focusModules 删除是 visible API 变更，须确认**：`mcp-tools.ts:887` 的 `focusModules`（public alembic_plan schema，max 40，读处为零）删除会改 alembic_plan 工具面 → 按 workspace confirmation-gate 须用户/Design 明确决定。**默认 KEEP-but-wire**（与 member folder 交集，赋真实收窄语义），除非确认删除。（已并入 openDecisions。）
- **A4 "无源读 project-scopes.json" 需标注作用域**：该判断仅对 Core/Plugin 成立；**主体 `Alembic/lib/project-scope/ProjectScopeRegistry.ts` 就是 live reader**（`read()` :86、`resolveFolder()` :160），被 Bootstrap/Infra/daemon/http/CLI 消费。§11.0 已记，此处再钉一句防下游误读"registry 完全无人消费"。

---

### 11.11 安全 / 非回归 critique（实现前必备 guard，部分修正 §11.10.A）

> 独立 safety critic 对 §11 六维真实代码核验。诊断与 file:line 准确,但 **写侧被严重低估**。本节为实现前**硬 guard**,§11.11.A 修正 §11.10.A 的 chokepoint 机制。

#### 11.11.A [修正 §11.10.A] chokepoint = 新增 `fromProjectScopeRegistry` 方法,**不改 `WorkspaceResolver.fromProject` 语义**

§11.10.A 说"自动解析落在 `WorkspaceResolver.fromProject`"——**机制需收紧**。实测:Core+Plugin 共 **26 个 `fromProject(` 调用点**,且 `fromProject` 自身**不读 `project-scopes.json`**(它经 `inspect()` 读 `projects.json`)。若直接改 `fromProject` 语义 = 26 站点行为**一次性全翻**(含故意单根的,如 `project-data-root.ts:10` 注释明言"从显式 projectRoot 取以避免 resident bleed")。**改为:新增显式 `fromProjectScopeRegistry(path,{singleRoot?})`(读 project-scopes.json),逐一迁移 26 站点(每站点定 space / 显式 singleRoot),并加 repo-boundary lint 禁止 scan/write 路径出现新的裸 `fromProject(`。** chokepoint 的"概念正确"不等于"今天是单一漏斗"——必须显式迁移。

#### 11.11.B [HIGH·写侧·最被低估] 5 成员仓全 `isExcludedProject`-true → 写丢 space dataRoot 会落 `/tmp` 共享 DB 碰撞

实测 5 成员仓 package 全命中 dev/ecosystem 排除(Alembic `alembic-ai`+SOUL/Core `@alembic/core`/Agent `@alembic/agent`/Plugin `alembic-`前缀/Dashboard `alembic-dashboard`);只 BiliDili(无 package.json)不排除。`DatabaseConnection.ts:74-81`:`effectiveRoot = dataRoot ?? pathGuard.projectRoot`,`isExcludedProject(effectiveRoot)` 真则 DB 重定向到 `/tmp/alembic-dev/alembic.db`。**今天不触发仅因 dataRoot 先被设为 ghost 目录;一旦任一写路径丢 space dataRoot 回落到成员仓 projectRoot → 排除触发 → 写落共享 `/tmp/alembic-dev/alembic.db` = 静默跨仓数据碰撞。对这 5 仓这是默认失败态,不是尾部风险。** 写侧 bypass 站点(必须经 space resolver 或显式 singleRoot,**升 BLOCKING**):
- `AlembicPlugin/.../host-agent-workflows/project-data-root.ts:10` `resolveHostAgentDataRoot`(host-agent cold-start **写根**,无 projectScope;消费者 cold-start.ts:43/dimension-completion.ts:33/tool-router.ts:21)
- `AlembicPlugin/lib/runtime/KnowledgeState.ts:197`(驱动 `initialized`/`hasKnowledge` 门 :212-213;读走 space 而此处留 per-repo → 门误判"未初始化")
- `WriteZone.fromProjectRoot`(WorkspaceResolver.ts:72 无 scope)+ `resolveDataRoot` fallback(`resolveProjectRoot.ts:55-58`)
- **写侧 guard**:断言"成员仓路径命中已解析 scope 时,绝不写自己的 projectRoot 也不写 `/tmp/alembic-dev`"。

#### 11.11.C [HIGH·删除孤儿·删除顺序硬门] init populator + Core loader 必须先绿,才能删 Wakeflow reader

实测**两个 SetupService(主体+Plugin)都不写 `project-scopes.json`**——init 与原生 scope 真断开(§11.7.A 准)。唯二 writer 是 `Alembic/bin/cli.ts` `project-scope add` 与 `Alembic/lib/http/routes/project-scope.ts:117`(Dashboard),均手工。**fresh checkout 在任何 `project-scope add` 前 registry 空 → 删 Wakeflow reader 后退化单根 → 而这单根正是被排除仓(11.11.B)→ 复合失败。** GUARD:§11.7.C #2 idempotent init populate 升 **G-tier 硬前置,排在 §11.1.E step-5 任何删除之前**;验收测试:空 `~/.asd` → 对 2-repo fixture 跑 `alembic_init` → 断言 `project-scopes.json` 新增两 member。该测试绿前,Wakeflow reader 不可删。

#### 11.11.D [MED] ghost dataRoot 碰撞(scope 解析稳健,但 dataRoot 侧有坑)

resolver 稳健已证(`findBestProjectScopeFolder` 按 path.length desc :845;`resolveProjectScopeRegistryFolder` 按 currentFolder.path.length desc :765-769 → 嵌套 member 最深胜、重叠 scope 最长前缀胜、无 folder 返 null;`isSameOrInsidePath` :939-942 正确)。**但**:`resolveFolder` 只读 project-scopes.json(stray ghost 不参与 **scope** 解析,对),**而 `ProjectRegistry.inspect`(读 projects.json)正是 `fromProject` 在无 projectScope 时取 dataRoot 用的(:99/:147)→ stray ghost `94c59641` 输了 scope 解析却赢了每次裸 `fromProject(memberPath)` 的 dataRoot(=空 `~/.asd/workspaces/94c59641`)**。且 per-repo ghost projectId 与 member folderId 后缀**字节相同**(`94c59641`↔`folder-94c596418c32`/`278cdc6c`↔`folder-278cdc6c8560`/`13b22158`↔`folder-13b22158ca25`,同 `generateProjectId(path)`)——迁移脚本若 string-match/log 易混 folder 与 ghost project。GUARD:解析命中 space scope 时 resolver 必须**优先 `scope.dataRoot` 而非 `inspect().dataRoot`**;删 stray ghosts(`94c59641` 等)或文档化为 inert。

#### 11.11.E [LOW] 不变量

5 触碰文件(ProjectScope/space/WorkspaceResolver/WriteZone/project-data-root)对 `productionFloor|freeze|stagingCap|decayScore` **零命中**——不变量逻辑不在 scope/dataRoot 解析里,只需"dataRoot flip 后值不变"回归断言。双宿主 parity **间接**受影响(改喂两宿主的 dataRoot→改 parity 测读的 DB);**BiliDili(空 ProjectMap)会掩盖分歧 → parity 验收必须用非空多成员 ProjectMap(`ecf32806`),升硬门**(§11.8 已主张,这里钉死)。

#### 11.11.F SAFE-TO-IMPLEMENT 清单（实现前必备,9 项)

1. **[G-1 blocking]** 删任何 workspace.config.json reader **前**,Core registry-aware loader **与** init populator 必须先建+测绿(§11.1.E step-5 门控)。
2. **[chokepoint]** 新增 `fromProjectScopeRegistry`(读 project-scopes.json),**勿改 `fromProject` 语义**;枚举+迁移全 26 个 `fromProject(` 站点逐站定 space/singleRoot。
3. **[write-side blocking]** 写路径经 space resolver:`project-data-root.ts:10`/`KnowledgeState.ts:197`/`WriteZone.fromProjectRoot`/`resolveDataRoot` fallback;断言成员仓命中 scope 时绝不写自身 projectRoot 或 `/tmp/alembic-dev`。
4. **[ghost hygiene]** 决定+执行 per-repo ghost 处置(`94c59641`/`278cdc6c`/`13b22158`)及 `13b22158` 5 条真实 knowledge 迁移,先于 promote space-only。
5. **[opt-out]** 提供并审计 per-call `singleRoot` opt-out;验 **synthetic 单仓 fixture**(非 BiliDili)等故意单根仍单根 + 清晰诊断日志。
6. **[boundary lint]** 禁 scan/write 路径出现新裸 `fromProject(`,防 chokepoint 回归。
7. **[acceptance]** daemon-OFF 从成员子仓路径全空间 recipe/knowledge 真测(证磁盘前置已脱 daemon 依赖,§11.3.D)。
8. **[acceptance]** 双宿主 parity 用非空多成员 ProjectMap(`ecf32806`)非 BiliDili。
9. **[init lockstep]** 主体+Plugin 两 SetupService 加 native-scope population 须 lockstep,否则 init 形态漂移。

**底线**:诊断准确但**写侧被低估**——最危险的单点遗漏 = 5 成员仓全 `isExcludedProject`-true,写侧 chokepoint 任何缺口不是回落无害 per-repo DB 而是**共享 `/tmp/alembic-dev` 碰撞**或空 ghost。读侧 `fromProject` chokepoint 必要但不充分,**必须同时到达写侧 + init populator(二者今 absent),Wakeflow reader 才可安全删除**。

### 11.12 最终决策锁定（2026-06-29 用户拍板，覆盖 §11.8/§11.10.E/§11.11 openDecisions）

| 决策 | 锁定 | 说明 / 对设计的影响 |
|---|---|---|
| **D-1 注入 vs D-2 下沉 Core** | **D-2** | loader 下沉 `@alembic/core`(新增 `loadProjectScopeForFolder` + `fromProjectScopeRegistry`);边界顾虑作废(Core 早经 `ProjectRegistry.ts:93-114` 读写 `~/.asd`)= RESOLVED-SAFE。 |
| **focusModules** | **KEEP-but-wire** | 接活为成员域内收窄 override(public alembic_plan schema 保留,不删);§11.5 PLUG-1d / §11.10.E 据此定。 |
| **旧 per-repo ghost DB** | **标 inert 不迁,整空间重生成** | **不迁** `13b22158`(AlembicPlugin)的 5 条自有 knowledge;promote space-only 后旧 per-repo knowledge 声明废弃,**整空间冷启动重新生成**(更高质量)。**删 stray ghost**(`94c59641` 等误建/空)。⇒ §11.11.D guard #4 简化为"删 stray + 标旧 per-repo DB inert",**取消数据迁移交付项**;promote 后成员子仓 recipe 访问全部来自 `ecf32806` 空间 DB,旧 per-repo DB 不再读。 |
| **init population 策略** | **detect-or-refuse** | init 检测无 native scope → **refuse + 提示人工 `project-scope add`**,**不**自动扫 sibling 猜成员。⇒ G-3 从"auto-populate writer"改为"**detect-or-refuse guard**"(更轻、杜绝误种);两 SetupService 仍须 lockstep 加该 guard(§11.11.F #9)。 |
| **v2 `.asd/config.json` Zod schema** | **是** | 加 typed schema 防 stale 单仓字段(core.dir/swift watch)经手工编辑或旧 init binary 复现(§11.7.B/§11.10.E)。 |

#### 11.12.A 删除硬门 reconcile（detect-or-refuse 下的安全删除前置）

§11.11.C 原门控"init populator 先绿才可删 Wakeflow reader"——因 population 改为 **detect-or-refuse**(无 auto-populator),门控调整为:

**删 `workspace.config.json` reader 的前置 = 全部满足才可删:**
1. **G-1 Core loader 绿**:`loadProjectScopeForFolder`/`fromProjectScopeRegistry` 建好+测绿(从成员子仓解析到 space scope)。
2. **detect-or-refuse 干净退化**:fresh checkout(无 project-scopes.json)在任何 `project-scope add` 前,init/cold-start **明确 refuse 并提示**,**绝不**静默退化到单根→落排除→写 `/tmp/alembic-dev`(§11.11.B 写侧 guard 必须先到位)。验收:空 `~/.asd` + fresh 2-repo fixture 跑 init → 得到清晰 "no project scope, run `project-scope add`" 而非 swift/单根/`/tmp` 写入。
3. **写侧 chokepoint 到位**(§11.11.F #3,BLOCKING):`project-data-root.ts:10`/`KnowledgeState.ts:197`/`WriteZone.fromProjectRoot`/`resolveDataRoot` 经 space-aware 解析或显式 singleRoot。

⇒ §11.1.E step-5(删定义块)排在以上三者之后;§11.8 Phase 0 的 G-3 验收改为 detect-or-refuse 测试。其余 §11.11.F 9 项 guard 不变(chokepoint 新方法 #2、ghost hygiene #4 改为纯删 stray、opt-out #5、boundary lint #6、daemon-OFF 验收 #7、非空 ProjectMap parity #8、init lockstep #9)。

**本节为实现权威决策面;§11 其余 openDecisions 视为已闭合。**

---

## §12 代码级分阶段实现指南（synthesis lead 综合，append to requirement doc）

> 本节把 §11.0–§11.12（权威设计 + 锁定决策）落为可直接执行的代码级指南：精确 file:line、新方法签名、26-site census 表、before→after 编辑草图、每阶段可运行验收。所有行号于 2026-06-29 对真实源码复核（非 vendor/dist）。执行者按本节顺序实施，无需再次推导。**8 个 IG cluster 的矛盾已在此 reconcile（见 §12.0）。**

### 12.0 关键 reconcile（cluster 间矛盾的最终裁定，先读）

实现前必须采纳以下裁定（取证据更强的一方，全部经真实代码核验）：

1. **chokepoint census = 19 个 `WorkspaceResolver.fromProject(` 站点（NOT 26，NOT 24）。** 实测（`grep 'WorkspaceResolver.fromProject(' + 'WR.fromProject(' --exclude vendor/dist/node_modules` = 19）：18 直写 + **1 个别名 `WR.fromProject` 在 `AlembicCore/src/infrastructure/io/WriteZone.ts:72`**（`import { WorkspaceResolver: WR }`）。§11.11.A 的 "26" = vendor 子模块副本（`Alembic/vendor` + `AlembicPlugin/vendor`），由 `npm run build:core` 刷新，**不手改**。另有 **6 个 `WorkspaceSettingsStore.fromProject`**（`AlembicCore/src/shared/WorkspaceSettingsStore.ts:90` 的不同类，读 AI/env 设置非 dataRoot：`Alembic/lib/Bootstrap.ts:135`、`ProjectRuntimeControl.ts:788`、`http/routes/daemon.ts:422`、`http/routes/ai.ts:778`、`AlembicPlugin/lib/bootstrap.ts:124`）——**全部 OUT OF SCOPE，boundary lint 必须排除它们**，否则误报。

2. **loader 签名标准化 = `loadProjectScopeForFolder(folderPath: string): ProjectDescriptor | null`**（IG-0/2/4/5/6/7 的形态，胜出 IG-1/3 的 `{descriptor, currentFolderId}` 富返回）。理由：`WorkspaceResolver` 构造器（`:108-117` 已复核）在 `projectScope` 传入时**自己重新派生** `currentFolderId`（`resolveProjectScopeForFolder(this.projectScope, this.projectRoot)` at `:101-102`），故 chokepoint 无需 loader 返回 currentFolderId。富返回是冗余。

3. **F-5 双宿主 parity = 实测先行（§11.10.D 权威，覆盖 §11.0/§11.6 的初稿）。** in-process **有** target-axis 推断（`ProjectContextWorkflowFacts.ts:269 buildProjectMapModules`（map 轴不推断）+ `:274 buildProjectMapModulesFromTargets`（target 轴经 `inferTargetModulePath` 推断）；后者仅在 `:272 length===0` fallback 触发）。**勿加已存在的推断**——在非空 ProjectMap 上实测对比合并集，定位真实 canonical-id 分歧再开方。

4. **Core 不知 `project-scopes.json` 文件名（verify-found）。** `getProjectScopeRegistryPath`/`PROJECT_SCOPE_REGISTRY_FILENAME` 仅在主体 `Alembic/lib/project-scope/ProjectScopeRegistry.ts`；`grep project-scopes AlembicCore/src` = 0。新 Core loader **必须自带文件名常量**，路径经 Core 既有 `getProjectRegistryDir()`（`AlembicCore/src/shared/ProjectRegistry.ts:64`，barrel `shared/index.ts:33 export *`）。**勿假设 Core 能 import 主体 helper。**

5. **SetupService 双 writer 非 byte-identical（IG-2 对，IG-3/7 措辞修正）。** 主体 `Alembic/lib/cli/SetupService.ts:252-268` 有 `ai:{provider}` 块（`:261`）；Plugin `AlembicPlugin/lib/cli/SetupService.ts:295-322` 有 `vector:{localEmbedding}` 块。**但 `core`/`watch`/`guard` 块逐字相同**——lockstep 仍必须。

6. **stray ghost = `94c59641` + `278cdc6c`（空）+ `02a25032`（BiliDili）。** 实测 `~/.asd/workspaces/` 有 5 目录：`ecf32806`（space）、`13b22158`（Plugin，5 自有 knowledge，标 inert）、`94c59641`（AlembicCore stray，今建）、`278cdc6c`（Alembic stray）、`02a25032`（BiliDili）。§11.12 锁定：删 stray、`13b22158` 标 inert 不迁、`~/.asd` 删除前逐次用户确认。

7. **残留 grep 精确模式** = `workspace\.config\.json|readProjectScopeFromWorkspaceConfig|resolveWorkspaceConfigProjectFolders|WorkspaceConfigProjectScopeOptions|workspaceConfigProjectScope|repoNames`，**排除 vendor/dist/node_modules**。裸 `WorkspaceConfig` 会误报（`AlembicDashboard/.../LlmConfigModal.tsx` 的 `hasWorkspaceConfig`、`AlembicPlugin/.../ServiceContainer.ts:92` 的 `getWorkspaceConfigPath`=`.asd/config.json` reader）。预期残留 = `Alembic/lib/http/routes/ai.ts:891`（日志串）+ `AlembicAgent/.../CapabilityManifest.ts:83`（枚举字面量）。

### 12.A 实现纪律前言（每阶段开工前重读）

三条硬纪律贯穿全程，违反任一即停：

**(1) 写侧 `/tmp` 碰撞（§11.11.B，最危险）。** 5 成员仓 package 全 `isExcludedProject`-true（`alembic-ai`+SOUL / `@alembic/core`+AGENTS / `alembic-codex-plugin-runtime` / `@alembic/agent` / `alembic-dashboard`，复核 `isOwnDevRepo.ts:98-114`）。`DatabaseConnection.ts:74-84`（复核）：`effectiveRoot = (workspaceResolver.dataRoot ?? pathGuard.projectRoot) || path.resolve('.')`；`isExcludedProject(effectiveRoot).excluded` 真 → DB 重定向 `os.tmpdir()/alembic-dev/alembic.db`。**任一写路径丢 space dataRoot 回落成员 projectRoot = 静默跨仓共享 `/tmp` DB 碰撞。对这 5 仓这是默认失败态。** 写侧 BLOCKING 站点（`resolveProjectRoot.ts:55`、`WriteZone.ts:72`、`project-data-root.ts:10`、`KnowledgeState.ts:197`）必须先于删除落地。

**(2) 删除硬门（§11.12.A）。** 删 Wakeflow reader（`ProjectScope.ts:270-375`）**仅当三者全满足**：(a) G-1 Core loader 测绿；(b) detect-or-refuse 干净退化（fresh checkout refuse，绝不静默单根→`/tmp`）；(c) 写侧 chokepoint 到位。乱序删 = fresh checkout 落共享 `/tmp` DB。

**(3) 勿改 `fromProject` 语义（§11.11.A）。** 19 站点（含故意单根，如 `project-data-root.ts` 注释 "derive from explicit projectRoot to avoid resident bleed"）会一次性全翻。新增 `fromProjectScopeRegistry`，逐站迁移，加 boundary lint 禁 scan/write 路径出现新裸 `fromProject(`。

---

### 12.P0 — 地基 + 零风险删除（G-1 loader + F-3 dead-code）

**顺序（§11.1.E step 1-2）：先零风险删除 → 再落 loader/chokepoint。P0 必须先于任何 2a/2b 触碰。**

#### P0-step1 F-3 零风险删除（零 importer）

**(a) 整文件删** `AlembicPlugin/lib/service/project-knowledge-context/project/ProjectScopeFolders.ts`（53 行；exports `resolveProjectScopeSourceFolders` + `ProjectScopeSourceFolder`；`:3` import `readProjectScopeFromWorkspaceConfig`，`:12` 调用）。实测零外部 importer——grep 命中的 `AlembicDashboard/src/types.ts:234 ProjectScopeFoldersResponse` / `api.ts:3172` 是 Dashboard 自有无关类型，非本模块。`git rm` 即可，无 import-site 编辑。

**(b) `AlembicPlugin/.../ProjectGraphProvider.ts:1985`**（复核 `:1983-1986`）——纯字符串数组元素删除：
```ts
// before
['package.json', 'tsconfig.json', 'workspace.config.json'].includes(basename)
// after
['package.json', 'tsconfig.json'].includes(basename)
```

#### P0-step2 G-1a NEW Core loader（D-2，`AlembicCore/src/shared/ProjectScope.ts`）

文件已 `:2 import { existsSync, readFileSync } from 'node:fs'`（被删 reader 自身在 `:279/:286` 读盘）→ D-2 严格在既有 I/O 足迹内（§11.10.D RESOLVED-SAFE）。纯解析器 `resolveProjectScopeRegistryFolder`（`:754-772`，复核：遍历 scope、按 `currentFolder.path.length` desc 排序、最长前缀胜、返回 `ProjectScopeResolution | null`）已存在——**只缺从磁盘 load document 这一步**。

`:3` 后加 import：
```ts
import { getProjectRegistryDir } from './ProjectRegistry.js';
```

`:772`（`resolveProjectScopeRegistryFolder` 之后）加：
```ts
// 原生 ProjectScope 注册表文件名。与 projects.json 同目录（~/.asd），主体 ProjectScopeRegistryStore 写、Core 只读。
export const PROJECT_SCOPE_REGISTRY_FILENAME = 'project-scopes.json';

export function resolveProjectScopeRegistryPath(): string {
  return path.join(getProjectRegistryDir(), PROJECT_SCOPE_REGISTRY_FILENAME);
}

/** 只读 load。缺失/损坏/版本不符 → 空文档（容错语义对齐主体 ProjectScopeRegistryStore.read:86-101，绝不抛）。 */
export function readProjectScopeRegistryDocument(
  registryPath: string = resolveProjectScopeRegistryPath()
): ProjectScopeRegistryDocument {
  try {
    if (!existsSync(registryPath)) return createProjectScopeRegistryDocument();
    const parsed = JSON.parse(readFileSync(registryPath, 'utf8')) as ProjectScopeRegistryDocument;
    if (parsed.version !== PROJECT_SCOPE_CONTRACT_VERSION || !parsed.scopes || !parsed.folderIndex) {
      return createProjectScopeRegistryDocument();
    }
    return parsed;
  } catch {
    return createProjectScopeRegistryDocument();
  }
}

/** D-2 主入口：成员子仓（或其内任意文件）路径 → 整 SPACE descriptor（5 成员、共享 dataRoot）；无 scope → null（单仓 fallback 由调用方负责）。 */
export function loadProjectScopeForFolder(
  folderPath: string,
  options: { registryPath?: string } = {}
): ProjectDescriptor | null {
  const resolution = resolveProjectScopeRegistryFolder(
    readProjectScopeRegistryDocument(options.registryPath),
    folderPath
  );
  return resolution?.projectScope ?? null;
}
```
in-file 已有 `createProjectScopeRegistryDocument`（`:711`）、`PROJECT_SCOPE_CONTRACT_VERSION`（`:5`）、`ProjectScopeRegistryDocument`（`:214`）、`ProjectDescriptor` 类型——除 `getProjectRegistryDir` 外无新 import。`{ registryPath? }` 选项使单测可对临时 fixture 跑而不碰 `~/.asd`。

barrel `AlembicCore/src/shared/index.ts`（`:38-65` 的 `from './ProjectScope.js'` 块）按字母位加：
```ts
  loadProjectScopeForFolder,
  PROJECT_SCOPE_REGISTRY_FILENAME,
  readProjectScopeRegistryDocument,
  resolveProjectScopeRegistryPath,
```
**保留** `:59 readProjectScopeFromWorkspaceConfig`（P4 删）。

#### P0-step3 G-1b NEW chokepoint `WorkspaceResolver.fromProjectScopeRegistry`

`AlembicCore/src/shared/WorkspaceResolver.ts`（`:25-28` 已 import `resolveProjectScopeForFolder` + `ProjectDescriptor`）。`:14-16` import 加 `loadProjectScopeForFolder`。`fromProject`（结束 `:158`）之后加：
```ts
/**
 * 注册表感知入口（§11.11.A chokepoint）。从 ~/.asd/project-scopes.json 解析该路径所属 SPACE，
 * 命中 → 携 projectScope 构造（构造器 :108-117 强制 ghost=true、dataRoot=scope.dataRoot=共享 ecf32806）；
 * 未命中 / singleRoot → 退化为裸 fromProject 单仓 fallback（非回归）。不改 fromProject 语义。
 */
static fromProjectScopeRegistry(
  projectRoot: string,
  opts: {
    singleRoot?: boolean;
    folderNames?: PartialAlembicFolderNames;
    registryPath?: string;
  } = {}
): WorkspaceResolver {
  if (opts.singleRoot === true) {
    return WorkspaceResolver.fromProject(projectRoot, { folderNames: opts.folderNames });
  }
  const projectScope = loadProjectScopeForFolder(projectRoot, { registryPath: opts.registryPath });
  // native-missing → 确定性单仓 fallback（上游 detect-or-refuse 守门）。
  return WorkspaceResolver.fromProject(projectRoot, {
    projectScope,
    folderNames: opts.folderNames,
  });
}
```
**注：构造器 `:101-102` 已对传入的 `projectScope` 自派生 `currentFolderId`，故无需 loader 富返回，也无需在此显式传 `currentFolderId`。** `fromProject` 字节不变。

#### P0-step4 新建单测 `AlembicCore/test/ProjectScopeRegistryLoader.test.ts`

temp-dir fixture（仿 `ProjectScopeContracts.test.ts` 用 `createProjectDescriptor` + `createProjectScopeRegistryDocument` → `JSON.stringify` 到临时 `project-scopes.json` → 传 `{ registryPath }`）：缺失/损坏 → null（不抛）；成员子仓路径 → 5-folder descriptor；最长前缀嵌套胜；controlRoot 路径 → null（`assertFolderCanEnterScope`）。**additive，不是 §11.1.C 的 5 个迁移测试（那是 P2/F-6）。**

#### P0 新方法签名
- `AlembicCore/src/shared/ProjectScope.ts: export const PROJECT_SCOPE_REGISTRY_FILENAME = 'project-scopes.json'`
- `export function resolveProjectScopeRegistryPath(): string`
- `export function readProjectScopeRegistryDocument(registryPath?: string): ProjectScopeRegistryDocument`
- `export function loadProjectScopeForFolder(folderPath: string, options?: { registryPath?: string }): ProjectDescriptor | null`
- `AlembicCore/src/shared/WorkspaceResolver.ts: static fromProjectScopeRegistry(projectRoot: string, opts?: { singleRoot?: boolean; folderNames?: PartialAlembicFolderNames; registryPath?: string }): WorkspaceResolver`

#### P0 可运行验收
| criterion | command | expected |
|---|---|---|
| loader 空/缺失 registry → null（不抛） | `cd AlembicCore && npx vitest run test/ProjectScopeRegistryLoader.test.ts -t 'empty'` | PASS：`loadProjectScopeForFolder('/x', {registryPath:<nonexistent>}) === null`，missing-file 不抛 |
| 成员子仓 → 整空间（5 folders） | `cd AlembicCore && npx vitest run test/ProjectScopeRegistryLoader.test.ts -t 'member'` | PASS：返回 `folders.length===5`、单共享 dataRoot；controlRoot 路径返回 null |
| 最长前缀嵌套胜 | `cd AlembicCore && npx vitest run test/ProjectScopeRegistryLoader.test.ts -t 'nested'` | PASS：嵌套 folder 最深胜 |
| Core type-check + 全测绿（Node≥22） | `cd AlembicCore && nvm use 22 && npm run build:check && npm test` | tsc no-emit exit 0；全 Vitest 绿（含新 loader 测） |
| 真机 ecf32806 dist 探针 | `cd AlembicCore && npm run build && node -e "import('./dist/shared/index.js').then(m=>console.log(JSON.stringify({pid:m.loadProjectScopeForFolder(process.env.HOME+'/Documents/AlembicWorkspace/AlembicCore/src')?.projectId, folders:m.loadProjectScopeForFolder(process.env.HOME+'/Documents/AlembicWorkspace/AlembicCore/src')?.folders.length, ctrlNull:m.loadProjectScopeForFolder(process.env.HOME+'/Documents/AlembicWorkspace')===null})))"` | `{"pid":"ecf32806","folders":5,"ctrlNull":true}` |
| `fromProjectScopeRegistry` 绑共享 dataRoot；`{singleRoot:true}` 不绑 | `cd AlembicCore && node -e "const{WorkspaceResolver:W}=require('./dist/shared/index.js');const a=W.fromProjectScopeRegistry(process.env.HOME+'/Documents/AlembicWorkspace/AlembicCore/src');const b=W.fromProjectScopeRegistry(process.env.HOME+'/Documents/AlembicWorkspace/AlembicCore/src',{singleRoot:true});console.log(a.dataRoot.includes('ecf32806'), a.dataRoot!==b.dataRoot)"` | `true true`（space 含 `/workspaces/ecf32806`，single 不含） |
| F-3：ProjectScopeFolders 零 importer | `grep -rn 'from.*ProjectScopeFolders' AlembicPlugin/lib AlembicPlugin/test Alembic/lib AlembicAgent/src AlembicDashboard/src AlembicCore/src --include='*.ts' \| grep -v '/vendor/' \| grep -v '/dist/'` | 空（安全 `git rm`） |
| F-3：Plugin 仍构建 | `cd AlembicPlugin && npm run build:check` | tsc no-emit exit 0 |
| P0 未删仍被消费的定义块 | `grep -rn 'readProjectScopeFromWorkspaceConfig' AlembicCore/src/shared/index.ts AlembicCore/src/service/project-context/space/space.ts AlembicCore/src/core/ast/ProjectGraph.ts AlembicCore/src/service/source-graph/SourceGraphIndexer.ts AlembicCore/src/service/project-context/repo/repo.ts` | 仍在 space.ts:214/repo.ts:423/ProjectGraph.ts:807/SourceGraphIndexer.ts:448/index.ts:59 |
| `fromProject` 语义未动 | `cd AlembicCore && grep -c 'static fromProject(' src/shared/WorkspaceResolver.ts && grep -c 'static fromProjectScopeRegistry(' src/shared/WorkspaceResolver.ts` | 各 `1`，`fromProject` body 不变 |

---

### 12.P1 — 前置门 + 写侧承重接线（G-2 chokepoint 迁移 + 写侧 guard）

#### 12.P1 完整 19-site census 表

class：scan=驱动发现/file-walk；**write**=选 DB/数据写根（§11.11.B BLOCKING）；read=开 space DB 读 recipe/knowledge；identity=标签/marker；runtime=per-tool 运行态。

| # | file:line | resolves | class | 决策 | 理由 |
|---|---|---|---|---|---|
| C1 | `AlembicCore/src/core/discovery/DiscovererRegistry.ts:76` | dataRoot（discoverer-preference store） | scan | **→ fromProjectScopeRegistry** | preference 应 space-keyed |
| C2 | `DiscovererRegistry.ts:112` | 同 store | scan | **→ fromProjectScopeRegistry** | 与 C1 一致 |
| C3 | `AlembicCore/src/shared/resolveProjectRoot.ts:55`（`resolveDataRoot` fallback） | dataRoot | **write**+read | **→ fromProjectScopeRegistry · BLOCKING** | 通用 dataRoot fallback 喂写路径，excluded 成员→`/tmp` |
| C4 | `resolveProjectRoot.ts:75`（`resolveKnowledgeScanDirs`） | recipes/candidates dirs resolver | read/scan | **→ fromProjectScopeRegistry** | scan dirs 须指 space dataRoot |
| C5 | `AlembicCore/src/daemon/DaemonState.ts:50` | daemon state/jobs 路径 | runtime | **保留 singleRoot（注解）** | daemon 按启动 projectRoot 绑定；PDR-3 后基本缺席 |
| C6 | `AlembicCore/src/infrastructure/io/WriteZone.ts:72`（别名 `WR.fromProject`） | 所有 Zone.Data 写的 resolver | **write** | **→ fromProjectScopeRegistry · BLOCKING** | §11.11.B 顶级 hazard；**注意别名拼写** |
| C7 | `AlembicCore/src/shared/WorkspaceSettingsStore.ts:91`（内部委托） | AI/env 设置 resolver | identity | **保留 singleRoot（注解）** | env/AI 配置非 dataRoot scoping |
| C8 | `Alembic/lib/cli/SetupService.ts:141` | init 路径 resolver | identity/init | **保留 singleRoot（注解）** | init=detect-or-refuse；勿在此 flip |
| C9 | `Alembic/lib/project-scope/ProjectScopeRegistry.ts:182`（no-match 分支） | 单仓 fallback resolver | read | **保留原样** | 主体 native chokepoint 的预期单根 fallback |
| C10 | `ProjectScopeRegistry.ts:184`（match 分支） | 携 projectScope resolver | read | **保留原样** | 已 space-aware，D-2 的参考实现 |
| C11 | `AlembicPlugin/lib/bootstrap.ts:192` | env `projectScopeRuntime?.descriptor` resolver | runtime | **保留，env-absent 分支接 disk loader** | env 携 descriptor 时已 space-aware；null 时改 `fromProjectScopeRegistry`（脱 daemon 依赖 §11.3.D） |
| C12 | `AlembicPlugin/lib/recipe-generation/host-agent-workflows/project-data-root.ts:10`（`resolveHostAgentDataRoot`） | cold-start/rescan **写** dataRoot | **write** | **→ fromProjectScopeRegistry · BLOCKING** | 消费者 cold-start.ts:110 / dimension-completion.ts:314 / tool-router.ts:168 全写；保留"按显式 projectRoot 解析"意图——解析该 projectRoot 的 SPACE，勿回退 container |
| C13 | `AlembicPlugin/lib/runtime/ProjectRootResolver.ts:218`（`getInitMarkerPath`） | `codex-init.json` runtimeDir | identity | **保留 singleRoot（注解）** | init marker 是 per-folder identity artifact |
| C14 | `ProjectRootResolver.ts:253`（`writeInitMarker`） | init marker 写 | identity/write | **保留 singleRoot（注解）** | 同 C13 |
| C15 | `AlembicPlugin/lib/runtime/runtime/ProjectRuntimeContext.ts:179` | runtime identity `.toFacts()` | runtime | **→ fromProjectScopeRegistry** | 已 thread `currentFolderId`；space-resolve 使非 daemon 路径报 space 身份 |
| C16 | `AlembicPlugin/lib/runtime/KnowledgeState.ts:197`（`inspectKnowledge`） | initialized/hasKnowledge 门 resolver | **read+gate** | **→ fromProjectScopeRegistry · BLOCKING** | 读 per-repo（空）DB → 假"未初始化"；须读 space DB；re-verify `shouldRunStagingAccessSweep` 不翻假"已初始化" |
| C17 | `AlembicPlugin/lib/runtime/status/StatusService.ts:152` | status/local-embedding `.toFacts()` | runtime | **→ fromProjectScopeRegistry** | 报成员所属 space；低爆破半径 |
| C18 | `AlembicPlugin/lib/shared/transient-transport.ts:54` | transient transport tmp dataRoot | runtime | **保留 singleRoot（注解）** | 已优先显式 `input.dataRoot`；fallback 仅 tmp-file 位置 |
| C19 | `AlembicPlugin/lib/service/resident/AlembicResidentServiceClient.ts:1385`（`resolveSingleFolderBaseline`） | 无 resident 时 baseline `.toFacts()` | read | **保留 singleRoot（注解）** | 函数名即 single-folder baseline；space 解析在上游；daemon-OFF whole-space 来自 C12/C16 磁盘前置 |

**汇总：** 迁移 space-aware（10）：C1,C2,C3,C4,C6,C12,C15,C16,C17 + C11(env-absent)。保留 singleRoot 注解（7）：C5,C7,C8,C13,C14,C18,C19。保留原样（2）：C9,C10。**写侧 BLOCKING（删除前必落，§11.12.A）：C3,C6,C12,C16。**

#### 12.P1 per-cluster before→after 草图

**Cluster A — 裸 `.dataRoot` getter（C1,C2,C3,C12）：**
```ts
// DiscovererRegistry.ts:76 before
const dataRoot = WorkspaceResolver.fromProject(projectRoot).dataRoot;
// after
const dataRoot = WorkspaceResolver.fromProjectScopeRegistry(projectRoot).dataRoot;
```
C12（`project-data-root.ts:8-18`，保留 resident-bleed 注释 `:3-7`，只换 resolver）：
```ts
// before  return WorkspaceResolver.fromProject(projectRoot).dataRoot;
// after — 仍从显式 projectRoot 派生（无 container），现 space-aware
return WorkspaceResolver.fromProjectScopeRegistry(projectRoot).dataRoot;
```

**Cluster B — 写根（C6，`WriteZone.ts:70-73`，BLOCKING，注意别名）：**
```ts
// before  return new WriteZone(WR.fromProject(projectRoot));
// after   return new WriteZone(WR.fromProjectScopeRegistry(projectRoot));
```

**Cluster C — env/identity 分支（C11，`AlembicPlugin/lib/bootstrap.ts:191-194`）：**
```ts
// after — env descriptor 胜；disk fallback 脱 daemon 依赖（§11.3.D）
const projectScopeRuntime = readProjectScopeRuntimeFromEnv();
const resolver = projectScopeRuntime?.descriptor
  ? WorkspaceResolver.fromProject(projectRoot, { projectScope: projectScopeRuntime.descriptor })
  : WorkspaceResolver.fromProjectScopeRegistry(projectRoot);
```

**Cluster D — gate read（C16，`KnowledgeState.ts:194-200`，BLOCKING）：**
```ts
// before  try { resolver = WorkspaceResolver.fromProject(projectRoot); } catch { resolver = new WorkspaceResolver({ projectRoot }); }
// after   try { resolver = WorkspaceResolver.fromProjectScopeRegistry(projectRoot); } catch { resolver = new WorkspaceResolver({ projectRoot }); }
```
flip 后 `resolver.dataRoot`=space → `countProjectDatabaseRecipes`/`countProjectSkillKnowledgeEntries`（`:212-213`）读 space DB。re-verify 无假"already initialized"。

**Cluster E — 保留 singleRoot + 注解（C5,C7,C8,C13,C14,C18,C19）：**
```ts
// @scope-singleroot(permanent) — daemon state is per-runtime-instance, not space-scoped
const resolver = WorkspaceResolver.fromProject(projectRoot);
```
**这 7 站点的注解必须先于 lint 提交落地，否则 lint 首跑即红。**

#### 12.P1 写侧 guard（§11.11.B 安全网，`DatabaseConnection.ts`）

`:74` 计算 `effectiveRoot` 后、`:75` `isExcludedProject` 重定向**之前**插入。把最危险的静默失败转为 loud-fail（满足 §11.12.A gate (c)）：
```ts
// effectiveRoot = projectRoot || path.resolve('.') 已在 :74。
// 携 projectScope 的 resolver 时,DB 必须落 scope.dataRoot。此处若 exclusion 触发=上游丢了 space dataRoot。
const exclusion = isExcludedProject(effectiveRoot); // 已在 :75
if (exclusion.excluded && this.#workspaceResolver?.projectScope) {
  throw new Error(
    `[DatabaseConnection] member '${effectiveRoot}' is in project-scope ` +
    `${this.#workspaceResolver.projectScope.projectScopeId} but resolved to an excluded root ` +
    `(would write ${path.join(os.tmpdir(), 'alembic-dev', 'alembic.db')}). Space dataRoot lost upstream.`
  );
}
```
（`projectScope` 是 `WorkspaceResolver` 的 public readonly 字段 `:74`。真正 standalone excluded 仓（无 scope）仍走既有重定向。）

#### 12.P1 boundary lint（§11.11.F #6）

新建 `AlembicCore/scripts/lint-scope-resolution.mjs`：`grep -rnE '\bfromProject\s*\(' src/`，跳过 `WorkspaceSettingsStore.fromProject`（不同类）+ `fromProjectScopeRegistry` + 方法定义；只 gate scan/write 目录（`src/core/discovery/`、`src/infrastructure/io/`、`src/service/project-context/`、`src/shared/resolveProjectRoot`、`src/core/ast/`、`src/service/source-graph/`）；放行 `// @scope-singleroot(permanent|temporary) — reason`（含前一行注解）；裸 `@scope-singleroot` 拒。匹配子句须含 `WR.fromProject`（捕获 WriteZone 别名）。wire：`AlembicCore/package.json` 加 `"lint:scope-resolution": "node scripts/lint-scope-resolution.mjs"` 并 append 到 `check` 组合（`:288`）。Plugin 端同模式扩 `AlembicPlugin/scripts/lint-repo-boundary.mjs`（`SCAN_WRITE_DIRS=['lib/recipe-generation/host-agent-workflows/','lib/runtime/']`），wire 进已含 `lint:repo-boundary` 的 `check`（`:90/:95`）。注解约定 `// @scope-singleroot(permanent|temporary) — reason`（区别于 Plugin 既有 `@escape-hatch`）。

#### 12.P1 新方法签名
- `AlembicCore/src/infrastructure/database/DatabaseConnection.ts`：写侧 guard——`resolver.projectScope` 存在 AND `isExcludedProject(effectiveRoot).excluded` → throw
- `AlembicCore/scripts/lint-scope-resolution.mjs`：scan/write 路径裸 `fromProject` 缺 `@scope-singleroot` 注解则 exit 1
- `AlembicCore/package.json`：`"lint:scope-resolution"` appended to `check` (`:288`)

#### 12.P1 可运行验收
| criterion | command | expected |
|---|---|---|
| 成员写路径绑 space DB，非 `/tmp`/per-repo | `cd AlembicCore && npm run build && node -e "const{WorkspaceResolver:W}=require('./dist/shared/index.js');const r=W.fromProjectScopeRegistry(process.env.HOME+'/Documents/AlembicWorkspace/AlembicPlugin');console.log(r.databasePath)"` | path 含 `~/.asd/workspaces/ecf32806/.asd/alembic.db`；非 `/tmp/alembic-dev`，非 `94c59641`/`13b22158` |
| 写侧 guard THROW（member-in-scope → excluded root） | `cd AlembicCore && npm test -- DatabaseConnection`（新测：挂 projectScope 的 resolver 且 effectiveRoot excluded → expect throw） | guard 抛 `in project-scope ... resolved to an excluded root`；无 `/tmp/alembic-dev` DB 生成 |
| boundary lint：scan/write 路径植入裸 `fromProject` → FAIL；移除/注解后 PASS | `cd AlembicCore && printf '\nconst _p=WorkspaceResolver.fromProject("/x").dataRoot;\n' >> src/core/discovery/DiscovererRegistry.ts && (npm run lint:scope-resolution; echo EXIT=$?); git checkout src/core/discovery/DiscovererRegistry.ts` | lint 报 DiscovererRegistry 违规 EXIT=1；checkout 后 exit 0 |
| census 闭合：无裸 scan/write `fromProject` | `cd AlembicCore && npm run lint:scope-resolution && cd ../AlembicPlugin && npm run lint:repo-boundary` | 双 exit 0 |
| Core 全测绿（Node≥22，写侧 + guard 后） | `cd AlembicCore && nvm use 22 && npm run build:check && npm test` | tsc clean；全 Vitest 绿 |
| 19-site count（vendor 排除） | `cd /Users/gaoxuefeng/Documents/AlembicWorkspace && { grep -rn 'WorkspaceResolver.fromProject(' Alembic/lib AlembicCore/src AlembicPlugin/lib --include='*.ts'; grep -rn 'WR.fromProject(' AlembicCore/src --include='*.ts'; } \| grep -vE '/(vendor\|dist\|node_modules)/' \| wc -l` | `19` |

---

### 12.P2 — repoint 承重 Core 消费方 + 测试迁移（F-2 + F-6）

#### P2-2a `space.ts:211-257`（承重 CRITICAL）

```ts
// before (:211-214)
const hasExplicitFolders = (input.payload.sourceFolders?.length ?? 0) > 0;
const workspaceConfigPath = path.join(projectRoot, 'workspace.config.json');
const workspaceConfigExists = await pathExists(workspaceConfigPath);
const projectScope = hasExplicitFolders ? null : readProjectScopeFromWorkspaceConfig(projectRoot);
// after — 优先级梯：explicit sourceFolders → native registry → single-folder
const hasExplicitFolders = (input.payload.sourceFolders?.length ?? 0) > 0;
const projectScope = hasExplicitFolders ? null : loadProjectScopeForFolder(projectRoot);
// 删 :212-213 workspaceConfig 探测 + :215-225 query-unavailable 块
```
`folderInputs`（`:227-239`）与 projectId fallback（`:253-257`，`projectScope?.projectId`）不变（两者都消费 `ProjectDescriptor`，shape 一致）。

#### P2-2b `repo.ts:423`（identity-only）
```ts
// before  const projectScope = readProjectScopeFromWorkspaceConfig(projectRoot);
// after   const projectScope = loadProjectScopeForFolder(projectRoot);
```
保留 `:425 resolveProjectScopeForFolder` + identity 用途（`:428-444`）。`repo.ts:385-390` 已 honor `payload.repoRoot`（containment `:391`、realpath `:402`）——复用，repo.ts 内部不改。

#### P2-2c/2d ProjectGraph + SourceGraphIndexer 门
- `ProjectGraph.ts`：删 `:806-811` 的 `if (options.workspaceConfigProjectScope !== false) { …readProjectScopeFromWorkspaceConfig… }` 块 + 删 option 字段 `:60`。保留 `listProjectScopeFolders(options.projectScope)` 路径（`:799/:809`）。
- `SourceGraphIndexer.ts`：镜像——删 `:447-456` 块 + 字段 `:36`。保留 `activeProjectScopeFolders(input.projectScopeDescriptor)`（`:439/:449/:461`）。
- **风险（IG-4）**：2c/2d 是 delete-only，不调 loader——native 边界依赖上游 caller 注入 `options.projectScope`/`projectScopeDescriptor`（不同 cluster）。今天无人注入 `projectScopeDescriptor` → 删后默认 flip Wakeflow→单根。测试须重基线（F-6），且依赖 P2-2a 的注入路径覆盖。无 caller 设 `workspaceConfigProjectScope:false`（已核），故 fallback 历来恒活，删除使 native-via-descriptor 成唯一路径。

#### P2 F-2 Plugin `collectPlanProjectContext`（`plan-tool.ts:1220-1246`）

实测：`_hints` 弃用（`:1222`）；`push` 建 `scope:{projectRoot}`（`:1237`）；`push('space',{includeProjectTree:true})`（`:1243`，无 sourceFolders）；`push('repo',{includeMapSummary:true})`（`:1244`，repoRoot 解析 `'.'` → 裸根扫）；`collectProjectSourceFileFacts(projectRoot)`（`:1246`）。

```ts
// after — 入口解析 native scope（一次），thread 成员 folder
async function collectPlanProjectContext(projectRoot: string, hints: PlanArgs['hints']) {
  const scope = loadProjectScopeForFolder(projectRoot); // @alembic/core/shared
  // 子仓→整空间：scope 命中时 folder 路径是 controlRoot 下绝对路径，非 sub-repo projectRoot 下。
  // RECOMMENDATION(IG-3): native scope 命中时,space/repo/facts 的 scan-base 改用 scope.controlRoot.path,
  // 成员 folder 相对 THAT 计算,否则 sub-repo projectRoot 下 path.relative 产 '../AlembicPlugin' 逃逸。
  const scanBase = scope ? scope.controlRoot.path : projectRoot;
  let memberFolders = scope
    ? scope.folders.filter((f) => f.state === 'active')
        .map((f) => path.relative(scanBase, f.path)).filter((r) => r && !r.startsWith('..'))
    : [];
  // focusModules KEEP-but-wire（成员域内交集，schema mcp-tools.ts:887 保留）
  if (hints?.focusModules?.length) {
    memberFolders = memberFolders.filter((m) =>
      hints.focusModules!.some((fm) => m === fm || m.startsWith(`${fm}/`)));
  }
  const sourceFolders = memberFolders.length ? memberFolders : undefined;
  await push('space', { includeProjectTree: true, sourceFolders, projectId: scope?.projectId });
  // 每成员一个 repo query（或绑 primary-source）；repo.ts:385-390 已 honor payload.repoRoot
  const repoEnvelope = await push('repo', { includeMapSummary: true, repoRoot: sourceFolders?.[0] });
  // ...
  const sourceFileFacts = await collectProjectSourceFileFacts(scanBase, sourceFolders ? { sourceFolders } : {});
}
```

#### P2 `collectProjectSourceFileFacts`（`project-source-facts.ts:30`，加 `sourceFolders`）
现签名 `(projectRoot, { maxFiles? })`（`:30-32`），cap 5000（`:18`），exclude `:20-28`（`.asd/.git/.wakeflow-active/.wakeflow-local/DerivedData/node_modules`，已含噪声目录）。
```ts
export async function collectProjectSourceFileFacts(
  projectRoot: string,
  options: { maxFiles?: number; sourceFolders?: readonly string[] } = {}
): Promise<ProjectSourceFileFact[]> {
  const maxFiles = normalizePositiveInteger(options.maxFiles, DEFAULT_PROJECT_SOURCE_SCAN_MAX_FILES);
  const roots = options.sourceFolders?.length
    ? options.sourceFolders.map((rel) => path.resolve(projectRoot, rel))
    : [path.resolve(projectRoot)];
  const perFolderBudget = Math.max(1, Math.floor(maxFiles / roots.length)); // 防大仓饿死小仓
  // ... per-root BFS,relativePath 须 PREFIX 成员名（AlembicCore/src/x.ts），否则
  //     plan-tool.ts:1001 groupFilesIntoFallbackModules 的 split('/')[0] bucket key 错（moduleCount 塌）
}
```

#### P2 F-6 测试迁移（迁移非删除，§11.1.C，5 文件已核存在）
- `ProjectScopeContracts.test.ts:18,25,26,126-157` — 删被删函数断言，保留 native 契约。
- `ProjectContextProjectSpace.test.ts:180,214-216,297,304` — **迁移**多 folder fixture 到临时 `project-scopes.json`（`ALEMBIC_HOME` 指临时；用新 `readProjectScopeRegistryDocument`）。这是真实多 folder 覆盖，必须存活。
- `ProjectContextEndToEnd.test.ts:781,802`、`SourceGraphIndexer.test.ts:79-84`、`AlembicPlugin/test/unit/ProjectGraphTool.test.ts:350,500-503` — 迁移到 native fixture 或 `payload.sourceFolders`。

#### P2 新方法签名
- `AlembicCore/.../space/space.ts:214`：`const projectScope = hasExplicitFolders ? null : loadProjectScopeForFolder(projectRoot)`
- `AlembicCore/.../repo/repo.ts:423`：`const projectScope = loadProjectScopeForFolder(projectRoot)`
- `AlembicCore/src/core/ast/ProjectGraph.ts:60`：REMOVE `workspaceConfigProjectScope?: boolean`
- `AlembicCore/src/service/source-graph/SourceGraphIndexer.ts:36`：REMOVE `workspaceConfigProjectScope?: boolean`
- `AlembicPlugin/.../project-source-facts.ts`：`collectProjectSourceFileFacts(projectRoot, options?: { maxFiles?: number; sourceFolders?: readonly string[] })`
- `AlembicPlugin/.../plan-tool.ts`：`collectPlanProjectContext(projectRoot, hints)`（停弃 `_hints`，scanBase=controlRoot, focusModules narrowing）

#### P2 可运行验收
| criterion | command | expected |
|---|---|---|
| F-2 site 2a 后 Core 编译 + 单仓非回归绿 | `cd AlembicCore && nvm use 22 && npm run build:check && npx vitest run test/ProjectContextProjectSpace.test.ts` | tsc exit 0；含 single-folder fallback 测 PASS；space.ts 无 `readProjectScopeFromWorkspaceConfig` |
| 2c/2d option 删除 + descriptor 路径保留 | `cd AlembicCore && nvm use 22 && npm run build:check && npm run test && npm run lint && grep -rn workspaceConfigProjectScope src` | 全 exit 0；grep 空 |
| 真机 draft（workspace ROOT）干净 ProjectContext | `alembic_plan {operation:draft, generationStage:coldStart, projectRoot:/Users/gaoxuefeng/Documents/AlembicWorkspace}` 检视返回 JSON | `primaryLanguage='typescript'`；顶层模块={Alembic,AlembicCore,AlembicPlugin,AlembicDashboard,AlembicAgent}；无 Test/wakeflow-ledger/legacy；fileCount≠5000，moduleCount≠120，非 swift |
| focusModules 收窄子集 | `alembic_plan {operation:draft, projectRoot:<workspace root>, hints:{focusModules:["AlembicCore"]}}` | draft 收窄到 AlembicCore；schema（mcp-tools.ts:887）保留未删 |
| 迁移测试保留多 folder 覆盖 | `cd AlembicCore && npx vitest run test/ProjectScopeContracts.test.ts test/ProjectContextProjectSpace.test.ts test/ProjectContextEndToEnd.test.ts test/SourceGraphIndexer.test.ts && cd ../AlembicPlugin && npm run test:unit -- ProjectGraphTool` | 全绿；fixture seed `project-scopes.json`，无 workspace.config.json fixture |

---

### 12.P3 — Plugin host + 双宿主 parity（F-4 + F-5）

#### P3 F-4 in-process 停止丢弃 `analysisScope`（`Alembic/lib/workflows/project-context/ProjectContextWorkflowFacts.ts`）

实测：`buildProjectContextWorkflowFacts` 声明 `analysisScope?`（`:130`）却从不读；每 `executeProjectContextRequest`（`:174-249`）只传 `input.projectRoot`；`executeProjectContextRequest`（`:714`）建 `scope:{projectRoot}` 无 sourceFolders；唯一 `sourceFolders` 提及是类型守卫 `:1123`（零 producer）。修：
- `buildProjectContextWorkflowFacts`：从 `input.analysisScope?.projectScope?.folders` 派生 `sourceFolders`（相对 controlRoot），thread 进 `executeProjectContextRequest` 第 5 参。
- `executeProjectContextRequest:714-732`：加 `sourceFolders?: readonly string[]` 参，**注入 payload 非 scope**（space.ts:211 读 `input.payload.sourceFolders`）：`payload: { ...payload, ...(sourceFolders?.length ? { sourceFolders } : {}) }`。
- `buildWorkflowFiles`（`:808-822`）：stamp per-file `sourceIdentity`（owning 成员 folder），使 `collectProjectScopeSourceIdentities`（`ProjectScopeAnalysis.ts:144-159`）停返 `[]`、`RuntimeInitializer.ts:63-67` 喂 Agent 非空 identity map。**@alembic/agent 无需改**（`AgentRuntimeBuilder.ts:51` 纯 sink）。

#### P3 F-5 module-axis parity（§11.10.D 权威——实测先行，勿加推断）
in-process `ProjectMapModules.ts` 两 builder 均在用：`buildProjectMapModules`（map 轴不推断，`ProjectContextWorkflowFacts.ts:269`）+ `buildProjectMapModulesFromTargets`（target 轴经 `inferTargetModulePath:98-130` 推断，仅 `:272 length===0` fallback 触发——故非空 ProjectMap 上 target 轴**永不到达**）。Plugin `knowledge-rescan.ts` 双轴中 target 轴**确推断**（`inferTargetModulePathFromSourceFacts`）。canonical fn `CoverageLedgerBuilder.buildCanonicalCoverageLedgerModuleId:82` = `target:name:path`（name+path 双在时，`:95-106`）否则 `existingId ?? moduleName ?? modulePath`（`:120`）。**F-5 = 在非空 `ecf32806` 上把 in-process 合并集（`:269-280` 去重）与 Plugin 双轴集实测对比，定位真实 canonical-id 分歧再对齐 merge 顺序。**

#### P3 C11 Plugin bootstrap + 其余 runtime 站点
`bootstrap.ts:192` env-absent → `fromProjectScopeRegistry`（脱 daemon 依赖 §11.3.D）；`ProjectRootResolver.ts:218,253`（保留 singleRoot）、`ProjectRuntimeContext.ts:179`（C15→space）、`StatusService.ts:152`（C17→space）、`transient-transport.ts:54`（保留 singleRoot）、`AlembicResidentServiceClient.ts:1385`（保留 singleRoot）按 census 决策迁移。

#### P3 F-3 generation scope（`ProjectIndexPlan.ts`）
full-mode（`:63-90`，复核）：`projectAnalysis.projectRoot = input.projectRoot`（`:72`）无成员列表 → plumb native 成员 folder 进 `ColdStartWorkflowIntent.projectAnalysis`（加 `sourceFolders`，`scan` 消费）使生成（非仅 draft）受 scope。**`cleanup.projectRoot`（`:68` = `host-agent ? input.dataRoot : input.projectRoot`）不变,但断言永不指成员 projectRoot（full-reset wipe-wrong-dir，顶级陷阱 §11.3.C）。**

#### P3 可运行验收
| criterion | command | expected |
|---|---|---|
| daemon-OFF 从成员子仓全空间访问 | 停 resident → `alembic_search`/`alembic_recipe_map` projectRoot=`.../AlembicCore/src` | 解析 ecf32806 dataRoot，返回全空间 19 recipe_source_refs（跨 4 仓），与 daemon-ON 一致；非空 per-repo ghost |
| 双宿主 parity（非空 ecf32806，**非 BiliDili**） | in-process draft（@alembic/agent）vs Plugin host-agent draft，diff 成员模块集 + primaryLanguage | 成员模块集相等；primaryLanguage 同（typescript）；canonical module id 匹配；BiliDili 不可作 parity subject |
| RuntimeInitializer 收非空 sourceIdentity map | in-process cold-start 时 log `_projectScopeSourceIdentityMap` | 每成员 folder 一条 identity（repositoryId/folderId/role），证 `buildWorkflowFiles` 已 stamp |
| full-mode 生成限定成员 folder | `alembic_bootstrap`（confirm→cold-start on ecf32806）检视 job artifacts scan roots | scan roots=成员 folder；无 Test/ledger/legacy 路径 |

---

### 12.P4 — 删定义块 + init detect-or-refuse + 非回归（F-1 + G-3 + F-7）

**前置门（§11.12.A 全满足）：G-1 loader 绿 + detect-or-refuse 干净退化 + 写侧 chokepoint（C3/C6/C12/C16）到位。**

#### P4 F-1 删定义块（`AlembicCore/src/shared/ProjectScope.ts`，最后）
1. barrel `index.ts:59` 移除 `readProjectScopeFromWorkspaceConfig`。
2. 删 `WorkspaceConfigProjectScopeOptions`（`:245-252`，含 `:246` 永不覆盖的 `configFileName`）、`readProjectScopeFromWorkspaceConfig`（`:270-292`）、`createProjectScopeFromWorkspaceConfig`（`:294-325`，`metadata.source='workspace.config.json'` 在 `:320`）、`resolveWorkspaceConfigProjectFolders`（`:327-375`）、私有 `normalizeWorkspaceConfigRepositories`（`:891`）/`isInternalRepository`（`:914`）/`normalizeStringArray`（`:920`，**删前确认仅 `resolveWorkspaceConfigProjectFolders` 用**）/`resolveWorkspaceConfigFolderPath`（`:928`）。
3. **KEEP native API**：`createProjectScopeRegistryDocument`(`:711`)、`upsertProjectScopeInRegistry`(`:724`)、`addProjectScopeFolderToRegistry`(`:742`)、`resolveProjectScopeRegistryFolder`(`:754`)、`listProjectScopeFolders`(`:459`)、`resolveProjectScopeForFolder`(`:463`)、`createProjectDescriptor`(`:396`)、`ALEMBIC_PROJECT_SCOPE_ENDPOINTS`(`:26`) + P0 新 loader。
4. **`node:fs` import（`:2`）`existsSync/readFileSync` 仍被 P0 新 loader 用——勿删**（IG-4 的"删 fs import"错，被新 loader 否决）。
5. 删 P2-2a/2b 若曾加临时 `?? readProjectScopeFromWorkspaceConfig` 尾巴（本指南 P2 直接替换无尾巴，故无）。

#### P4 G-3 init detect-or-refuse（两 SetupService lockstep）
config 块实测（核）：主体 `Alembic/lib/cli/SetupService.ts:251-268`（`ai:{provider}` 在 `:261`）；Plugin `AlembicPlugin/lib/cli/SetupService.ts:294-322`（`vector:{localEmbedding}`）。两者 `core.{dir,constitution,subRepoDir,subRepoUrl?}` + `guard.enabled` + `watch.{enabled:false,paths:['Sources','src'],extensions:['.swift','.m','.h']}` 块逐字相同。
1. **删 stale 块（两文件 lockstep）**：`core.dir`、`core.constitution`、`watch.*`（全死——`watch.*` 零 consumer，`core.dir`/`constitution` 无 runtime reader）。**KEEP `core.subRepoDir`/`subRepoUrl`**（唯一存活 reader = `ProjectMarkers.ts:88-114 readSubRepoDirFromConfig`/`readSubRepoUrlFromConfig`）。保留主体 `ai` / Plugin `vector` 块。
2. **detect-or-refuse guard**（`run()`/`stepRuntime` 起始）：`loadProjectScopeForFolder(projectRoot)`；命中既存 scope → idempotent no-op（不建 per-repo ghost，避免 §11.3.C `94c59641` 碰撞）；多仓形状但无 scope → REFUSE "No native project scope for <controlRoot>. Run `project-scope add <folder>` for each member, then re-run init."。**不自动扫 sibling。**
3. **v2 `.asd/config.json` Zod schema（net-new）**：现 `AppConfigSchema`（`config.ts:130`）校验 Core PACKAGE `config/default.json`，非 per-workspace 文件。新增 `WorkspaceRuntimeConfigSchema = z.object({ version: z.literal(2), projectName: z.string(), database: z.string(), core: z.object({ subRepoDir: z.string(), subRepoUrl: z.string().optional() }).passthrough(), guard: z.object({ enabled: z.boolean() }).optional(), vector: ...optional() }).passthrough()`——拒 stale `core.dir`/swift `watch.extensions`。wire 进唯一 ad-hoc reader（`ProjectMarkers.ts`）。

#### P4 ghost hygiene（§11.12 标 inert 不迁）
删 stray `94c59641` + `278cdc6c`（projects.json 行 + `~/.asd/workspaces/{94c59641,278cdc6c}`，**逐次用户确认**）。`13b22158`（5 自有 knowledge）标 inert——不迁，space cold-start 重生成。ghost projectId 后缀与 folderId 后缀字节相同（`94c59641`↔`folder-94c596418c32`），迁移/log 脚本勿 string-match 混淆。resolver 须优先 `scope.dataRoot` 而非 `inspect().dataRoot`（P1 chokepoint 已闭合）。

#### P4 vendor 刷新（§11.10.C）
`Alembic/vendor/AlembicCore` + `AlembicPlugin/vendor/AlembicCore` 仍含被删 reader——经 `npm run build:core` vendor 同步刷新，**勿手改**。残留 grep 必须排除 vendor/dist/node_modules。

#### P4 新方法签名
- DELETE `AlembicCore/src/shared/ProjectScope.ts`：`WorkspaceConfigProjectScopeOptions`(`:245-252`)、`readProjectScopeFromWorkspaceConfig`(`:270-292`)、`createProjectScopeFromWorkspaceConfig`(`:294-325`)、`resolveWorkspaceConfigProjectFolders`(`:327-375`)、私有助手(`:891-932`)
- REMOVE `AlembicCore/src/shared/index.ts:59` 的 `readProjectScopeFromWorkspaceConfig` export
- NEW `AlembicCore/src/shared/schemas/config.ts`（或新文件）：`export const WorkspaceRuntimeConfigSchema = z.object({...})`
- `Alembic/lib/cli/SetupService.ts` + `AlembicPlugin/lib/cli/SetupService.ts`：detect-or-refuse guard（lockstep），删 `core.dir`/`core.constitution`/`watch.*`

#### P4 可运行验收
| criterion | command | expected |
|---|---|---|
| 定义块全删；残留 grep（vendor 排除）只剩 2 无关 | `cd /Users/gaoxuefeng/Documents/AlembicWorkspace && git grep -nE 'workspace\.config\.json\|readProjectScopeFromWorkspaceConfig\|resolveWorkspaceConfigProjectFolders\|WorkspaceConfigProjectScopeOptions\|workspaceConfigProjectScope\|repoNames' -- Alembic/lib AlembicCore/src AlembicPlugin/lib AlembicAgent/src AlembicDashboard/src AlembicCore/test AlembicPlugin/test ':!*/vendor/*' ':!*/dist/*' ':!*/node_modules/*'` | 只 `ai.ts:891`（日志串）+ `CapabilityManifest.ts:83`（枚举）；零 reader/option/folder-resolution |
| Core check（含 naming/layer/space-edges/scope-resolution lint）绿 | `cd AlembicCore && grep -c 'readProjectScopeFromWorkspaceConfig' src/shared/ProjectScope.ts src/shared/index.ts; npm run check` | grep 双 0；check 全过 |
| Plugin check 绿（ProjectScopeFolders 已 P0 删） | `cd AlembicPlugin && npm run build:check && npm run test:unit && npm run lint:repo-boundary` | 全 exit 0 |
| init detect-or-refuse（fresh checkout 绝不静默单根→`/tmp`） | `ALEMBIC_HOME=$(mktemp -d) <alembic_init> --project-root <fresh-2repo-fixture>` | 清晰 "no project scope, run `project-scope add`" refuse；无 swift config 写；无 `/tmp/alembic-dev` DB；无单根扫 |
| v2 Zod 拒 stale swift 字段；既存 ecf32806 idempotent | `cd AlembicCore && npm test -- config`；`ALEMBIC_HOME=<sandbox-with-ecf32806> <alembic_init> --project-root /Users/.../AlembicWorkspace` | safeParse `{version:2,...,core:{dir:'Alembic'},watch:{extensions:['.swift']}}` = false；idempotent init 无新 projects.json/project-scopes.json 行 |
| 非回归：synthetic 单仓（temp，无 project-scopes.json 条目）行为不变 | `cd AlembicCore && npm test -- WorkspaceResolver resolveProjectRoot` | `fromProjectScopeRegistry(tmp)` == `fromProject(tmp)` 单根；clear "native scope missing → single-root" 日志；freeze/floor 不变 |
| 全套绿；production floor/freeze 不变 | `cd AlembicCore && nvm use 22 && npm run check && cd ../AlembicPlugin && npm run build:check && npm run test:unit` | 全绿；无 productionFloor/freeze/stagingCap/decayScore 字面量变；dataRoot flip 后值不变 |

---

### 12.R 真机验收 — 唯一 subject = 真实 Alembic 项目空间 ecf32806（5 成员）

**唯一有效真机 subject = `ecf32806`（multi-repo，5 成员）**——它是唯一能 exercise 项目空间逻辑（membership、子仓→整空间 recipe 访问、多成员 parity、多仓根干净 draft）且本需求的实际交付物。**禁用 BiliDili**：单仓 + 空 ProjectMap，结构性无法测任何项目空间行为，会假绿。**单仓非回归 = synthetic 单仓单测 fixture（temp dir，无 project-scopes.json 条目），NOT BiliDili。** DeepSeek=生成 / Qwen=embedding。**勿放松 production floor / freeze。**

基线护真：`ALEMBIC_HOME` sandbox（忠实副本：clone + `.backup()` 真 DB，只改 `git_diff_checkpoints.project_root`→沙箱，护真 `~/.asd`）；daemon.json `.url` 动态端口。

| # | 真机验收项 | command | expected |
|---|---|---|---|
| R1 | 从 workspace ROOT 干净 draft | `ALEMBIC_HOME=<sandbox> alembic_plan {operation:draft, generationStage:coldStart, projectRoot:/Users/gaoxuefeng/Documents/AlembicWorkspace}` | primaryLanguage=typescript；顶层=5 成员仓；无 Test/wakeflow-ledger/legacy/BiliDili；fileCount≠5000，moduleCount≠120 |
| R2 | 从成员 SUB-REPO 干净 draft（子仓→整空间） | `ALEMBIC_HOME=<sandbox> alembic_plan {operation:draft, generationStage:coldStart, projectRoot:/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore}` | 解析 ecf32806；顶层=全 5 成员（非仅 AlembicCore）；与 R1 同干净集 |
| R3 | 子仓→整空间 recipe 访问（daemon ON+OFF） | 停 resident → `alembic_search`/`alembic_recipe_map` projectRoot=`.../AlembicCore/src`；再 daemon ON | 两态都解析 ecf32806 dataRoot，返回全空间 19 recipe_source_refs（跨 4 仓）；daemon-OFF 不退化空 per-repo ghost |
| R4 | cold-start 重建（DeepSeek 生成 + Qwen embed，anti-fab 真拦） | `ALEMBIC_HOME=<sandbox>` 授权 rebuild/cold-start → 抽查生成 recipes | recipe language=typescript，sourceRefs 指成员仓真实文件；production floor 拒未接地输出；真 `~/.asd` 未动 |
| R5 | 非空 ProjectMap 双宿主 parity | in-process draft vs Plugin host-agent draft，rooted at workspace；diff 成员模块集 + primaryLanguage | 成员模块集相等；primaryLanguage 同；canonical coverage-ledger module id 匹配；非空 ProjectMap（非 BiliDili） |
| R6 | 单仓非回归（synthetic，非 BiliDili） | `cd AlembicCore && npx vitest run test/SingleRepoNonRegression.test.ts`（temp 单仓 fixture，无 project-scopes.json 条目） | `fromProjectScopeRegistry(tmp,{singleRoot:true})` == 旧 `fromProject(tmp)`；确定性单根，"native scope missing" 日志；freeze/floor 不变 |

---

### 12.M 阶段→验收矩阵

| Phase | Gate | 关键可运行验收 |
|---|---|---|
| **P0** | G-1 loader 绿 + F-3 死码删 | loader 单测（empty/member/nested）+ `build:check`；真机 dist 探针 `{pid:ecf32806,folders:5,ctrlNull:true}`；`git grep ProjectScopeFolders` 空（vendor 排除）；`fromProject` count===1 |
| **P1** | chokepoint 迁移（19-site census）+ 写侧 guard + boundary lint | member 写路径 DB 含 `ecf32806` 非 `/tmp`；guard THROW 测；lint 植入裸 `fromProject` 报 EXIT=1；19-count |
| **P2** | repoint space/repo/ProjectGraph/SourceGraphIndexer + plan-tool native + 5 测迁移 | 真机 ROOT draft typescript/5 成员/无噪声；focusModules 收窄；迁移测保留多 folder 覆盖；grep `workspaceConfigProjectScope` 空 |
| **P3** | in-process parity + F-5 module-axis + full-mode generation | daemon-OFF 子仓全空间 19 refs；非空 ecf32806 parity 集相等；`_projectScopeSourceIdentityMap` 非空；job artifacts 成员 folder scan |
| **P4** | 删定义块（硬门后）+ detect-or-refuse + Zod + 非回归 | 残留 grep 只剩 2 无关；Core/Plugin `check` 绿；fresh checkout refuse 无 `/tmp`；Zod 拒 swift；synthetic 单仓不变；floor/freeze 不变 |
| **真机 R** | ecf32806（5 成员，**非 BiliDili**） | R1 ROOT draft / R2 子仓 draft / R3 子仓→整空间 recipe(daemon ON+OFF) / R4 cold-start 重建 anti-fab / R5 非空 parity / R6 synthetic 单仓非回归 |

**全程贯穿不变量**：写侧 `/tmp` hazard（5 仓全 excluded，写侧 BLOCKING 站点 C3/C6/C12/C16 必先于删除）· 删除硬门（§11.12.A 三件）· 勿改 `fromProject`（19 站点 + WriteZone 别名 `WR.fromProject`）· loader 容错绝不抛 · vendor 经 `npm run build:core` 刷新勿手改 · Node≥22（nvm use 22）判门前置 · 真机唯一 subject = ecf32806，单仓非回归 = synthetic fixture。

### 12.Z 实现指南 critique 修正（实现前生效，覆盖 §12 对应处）

> 独立完整性 critic 对 §12 真实代码复核：**覆盖判定 COMPLETE**(19 个 fromProject 站点全有决策、4 个写侧 BLOCKING 全覆盖、G-1~G-4/F-1~F-7 全落代码级、行号全部 spot-check PASS、§11.12 锁定决策零违反、BiliDili 排除全程遵守)。下列为对 §12 的**可执行性修正**(2 HIGH)，实现以本节为准。

- **Z1 [HIGH] 验收 node 探针用动态 import,非 `require`**:Core 是 `"type":"module"`,§12 部分验收命令写 `node -e "const{WorkspaceResolver}=require('./dist/shared/index.js')..."` → `ERR_REQUIRE_ESM` 不可运行。**改为** `node -e "import('./dist/shared/index.js').then(m=>{const W=m.WorkspaceResolver; ...})"`(P0 dist 探针/IG-1/IG-6 已用此正确形式)。涉及 P0 "fromProjectScopeRegistry 绑共享 dataRoot"、P1 "成员写路径绑 space DB"、P1 "guard THROW" 三处探针(其 `npm test` 路径不受影响)。构建产物路径确认为 `dist/shared/index.js`(package.json:101 `./shared` export)。
- **Z2 [HIGH] 残留 grep 精确模式预期 = 0,非 2**:精确模式 `workspace\.config\.json|readProjectScopeFromWorkspaceConfig|resolveWorkspaceConfigProjectFolders|WorkspaceConfigProjectScopeOptions|workspaceConfigProjectScope|repoNames`(排除 vendor/dist/node_modules)在 P4 删除后应返回 **0**。`ai.ts:891`("LLM workspace config updated" 日志串)与 `CapabilityManifest.ts:83`(`'workspace-config'` 连字符枚举)**都不匹配精确模式**——它们只在更宽松的裸 `WorkspaceConfig` grep 下出现。**P4 验收订正**:精确模式 → 0 命中;那"2 处已知噪声"仅作宽松 grep 的标注,勿当精确门预期(否则执行者会误判 P4 失败或去放松模式追假阳)。
- **Z3 [MED] Plugin `check` 不含 `lint:repo-boundary`,须显式加**:§12.P1 称 "wire 进已含 lint:repo-boundary 的 check" 对 Plugin **错**——Plugin `check`(package.json:95)= typecheck && lint && lint:core-import-boundary && lint:layer-boundary && check:shared-asset-drift && check:cross-shell-drift && lint:doctrine && lint:naming,**无 lint:repo-boundary**。**修**:把新 scope/boundary lint(禁 scan/write 路径新裸 `fromProject(`)**显式加入 Plugin `check` 组合**;Core 端 `check`(:288)确实已列其 lints,不变。
- **Z4 [MED] §12.0.1 census "6 个 WorkspaceSettingsStore.fromProject" → "5 external + 1 内部委派(已在 19 内)"**:实测外部站点恰 5(`Bootstrap.ts:135`/`ProjectRuntimeControl.ts:788`/`daemon.ts:422`/`ai.ts:778`/`AlembicPlugin/bootstrap.ts:124`);第 6 是 `WorkspaceSettingsStore.ts:91` 内部对 `WorkspaceResolver.fromProject` 的委派(已计入 19,**勿重复计**)。boundary lint 排除清单(5 站点 + 该类)正确,不变。
- **Z5 [MED] 写侧消费方行号统一用 call-site(非 import 行)**:`project-data-root.ts` 消费者标准化为 **call sites `cold-start.ts:110` / `dimension-completion.ts:314` / `tool-router.ts:168`**(已核验正确);`:43/:33/:21` 是 import 行,§12 个别 SIGNATURES/风险文字仍回显旧值,统一改 call-site。
- **Z6 [LOW] DatabaseConnection guard 字段名确认**:throw 串用 `this.#workspaceResolver.projectScope.projectScopeId`——`ProjectDescriptor.projectScopeId` 字段已核存在;`os`(:2)/`isExcludedProject`(:8)/`#workspaceResolver`(:42)/`effectiveRoot`(:74)/`exclusion`(:75)均已具备,guard 可植入。
- **Z7 [LOW] `space.ts` 删 `:212-225` query-unavailable 是有意**:删后 `:231-239` 单 folder fallback 成为"native-missing → 单根"的预期路径;**fresh-checkout 的静默单根由 detect-or-refuse(P4/G-3)拦,勿在 space.ts 回补诊断**。
- **Z8 [LOW] P3 双宿主 parity 验收补可运行命令**:§12.P3/R5 parity 当前为散文,补具体 harness——新增 `AlembicCore/test/DualHostParity.ecf32806.test.ts`(或 `node -e` 构两侧 module-id 集断言 set-equality),expected=成员模块集相等 + primaryLanguage 相等 + canonical coverage-ledger module id 匹配(非空 ecf32806;`:272 length===0` 故 target-axis 在非空 map 不触发,实测对比合并集)。

**结论**:§12 实现就绪。逐站点决策完整、写侧 4 BLOCKING 全覆盖、行号 PASS、锁定决策零违反;采纳 Z1~Z8 后每阶段验收均可运行。

---

## 小注：误建 workspace 清理

我在定位过程中误把 AlembicCore 当独立仓 `alembic_init`，在 `~/.asd/projects.json` 留下 `94c59641`（AlembicCore，knowledge=0，ghost）。整体空间是 `ecf32806`（workspace root），AlembicCore 应只作其原生 scope 的成员 folder。该误建条目无害可清理（删 `~/.asd/workspaces/94c59641` + projects.json 对应行），非本需求范围，执行前经用户确认。
