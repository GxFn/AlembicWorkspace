# ProjectScope Cold-Start Source Identity Requirement Design

日期：2026-06-01
状态：confirmed / ready-for-workspace-plan
来源：用户真实 cold-start 测试反馈 + 总控代码事实分析

## 用户问题

用户在 Alembic 项目空间冷启动测试中发现：

1. `vendor` 数据被 cold-start 扫描，但这些是 fallback / release snapshot，不是真实日常源码位置。
2. Alembic 项目空间包含多个仓库，例如 `AlembicPlugin`、`AlembicCore`、`Alembic`；如果 AI 输出的代码路径只从 `lib`、`src` 等仓库内部路径开始，总控和 Codex 都无法确认准确仓库。
3. 对这类 workspace / 子仓库嵌套场景，需要检查是否还有其它 cold-start、rescan、sourceRef、IDE packet 问题。

## 真实目标

让 Alembic cold-start / rescan 在多仓库 ProjectScope 工作空间中只扫描真实源码 folder，并把所有面向 AI、Recipe、rescan 和 evidence 的代码引用升级为可定位的 ProjectScope source identity。

目标不是只给某个 discoverer 增加一个 `vendor` 排除项；那只能修复表面污染，不能解决多仓库路径歧义。

## 最终完成定义

- `vendor`、构建产物、依赖目录和 release snapshot 不再进入 cold-start 的真实源码集合。
- 多仓库 ProjectScope 下，每个源码文件都携带 folder 身份：至少包含 `projectScopeId`、`folderId`、folder 显示名、folder-local `relativePath` 和供 Codex 读取的 `qualifiedPath`。
- AI packet、requiredReadSet、sourceRefs、localPackageModules、Mission Briefing 和后续 progress / completion contract 都不再只依赖短路径。
- Recipe sourceRef reconciliation、rescan relevance audit、file monitor / evolution path matching 不会因为多个仓库拥有同名 `src/...` 或 `lib/...` 而误判。
- 单仓库项目保持兼容：旧 `path` 字段可以继续存在，但新字段成为多仓库场景的确定性定位依据。
- AlembicWorkspace 真实 cold-start 回归证明：
  - 没有 `vendor/AlembicCore`、`vendor/AlembicDashboard` 等 fallback / snapshot 文件进入分析输入。
  - packet 中针对 `AlembicPlugin/lib/...` 一类路径可以明确定位仓库。
  - rescan / sourceRef audit 不把短路径误归到其它仓库。

## 不纳入本轮

- 不重做 AI 产出质量评分体系。
- 不改变知识库质量判断、Recipe 内容语义或维度调度策略。
- 不把 ProjectScope skill visibility mount 一并实现；该事项已在 `GTODO-2026-05-24-030` 单独保留。
- 不改真实测试项目业务代码。
- 不把 control workspace 根目录当作源码仓库扫描。

## 代码事实基线

- `Alembic/AGENTS.md` 明确 `vendor/AlembicCore` 只作为 workspace 外 fallback、release snapshot 或便携交付校验入口。
- `AlembicCore/src/core/discovery/NodeDiscoverer.ts` 的 `EXCLUDE_DIRS` 缺少 `vendor`，递归扫描会收集 `vendor/**` 中的源码文件。
- `AlembicCore/src/core/discovery/GenericDiscoverer.ts` 和 `GoDiscoverer.ts` 已排除 `vendor`，但 Node / Python / Rust / JVM / Dart / SPM / CustomConfig 不一致，说明排除策略分裂。
- `AlembicCore/src/workflows/capabilities/project-intelligence/ProjectIntelligenceRunner.ts` 的 Phase 1 使用 `registry.detect(projectRoot)` 单根扫描，文件条目只保存 `relativePath`、`targetName` 等短身份。
- `AlembicCore/src/shared/ProjectScope.ts` 已有 `ProjectScopeEvidenceRef` 和 `createProjectScopeSourceRef`，但 cold-start / IDE packet 没有消费这套 folder-aware source identity。
- `AlembicCore/src/workflows/capabilities/project-intelligence/IDEAgentAnalysisPacketBuilder.ts` 的 `IDEAgentSourceRef` 只有 `path`，`requiredReadSet` 只来自 `sourceRef.path`。
- `SourceRefReconciler`、`KnowledgeRescanPlanner`、`FileChangeHandler` 等仍以纯字符串路径匹配 sourceRef，存在跨仓库短路径误判风险。

## 功能需求

### R1：统一扫描排除策略

Core 必须提供 discoverer 共享的源码扫描排除策略，覆盖至少：

- VCS / editor：`.git`、`.cursor`、`.idea`、`.vscode`
- dependency：`node_modules`、`.venv`、`venv`、`Pods`、`Carthage`
- build output：`dist`、`build`、`out`、`.build`、`target`、`DerivedData`
- cache：`.cache`、`.turbo`、`.next`、`.nuxt`、`__pycache__`
- snapshot / vendor：`vendor`

各语言 discoverer 可以追加语言专属排除，但不能遗漏共享排除。

### R2：ProjectScope-aware cold-start 输入

当 `projectRoot` 属于 ProjectScope 时，cold-start / rescan 不能把 control root 当源码根。正确行为是：

1. 读取 ProjectScope descriptor。
2. 遍历 `folders` 中启用的 source folder。
3. 对每个 folder 独立运行合适 discoverer。
4. 文件输出带上 folder 身份。
5. control root 只作为 workspace 边界和路径显示基准，不参与源码扫描。

### R3：Canonical Source Identity

Core 需要定义统一 source identity，供 cold-start、IDE packet、rescan、Recipe sourceRefs 和 evolution 复用。

建议字段：

```ts
interface CanonicalSourceIdentity {
  projectScopeId?: string | null;
  folderId?: string | null;
  folderDisplayName?: string | null;
  folderRelativeRoot?: string | null;
  relativePath: string;
  qualifiedPath: string;
  legacyPath: string;
}
```

`qualifiedPath` 面向 Codex / 人类读取，建议形态为 `<folderDisplayName>/<relativePath>`，例如 `AlembicPlugin/lib/codex/ide-agent/IDEAgentAnalysisSurface.ts`。`legacyPath` 保持旧单仓库兼容。

### R4：IDE Agent packet 升级

`IDEAgentSourceRef`、unit key、requiredReadSet、structuralEvidenceRefs 和 retrieval hints 必须能携带或展示 canonical identity。

要求：

- `path` 可保留为兼容字段。
- 新增 `qualifiedPath` 或等价字段作为多仓库场景的默认读取路径。
- `requiredReadSet` 在 ProjectScope 场景中输出 repo-qualified path。
- stable key 必须包含 folder 身份或 qualified path，避免 `lib/index.ts` 跨仓库碰撞。
- Plugin surface 不重建 Core 投影，只透传并展示新字段。

### R5：rescan / sourceRef / evolution 路径匹配升级

sourceRef existence、stale 判断、rename / delete / modify impact planning，不能只用短字符串路径。

要求：

- 新 Recipe 优先保存 canonical source identity 或 repo-qualified path。
- 旧 Recipe 的短路径兼容必须保留，但只能在路径唯一时自动映射。
- 出现短路径多仓库冲突时，标记为 ambiguous，不得自动改写或误判 stale。

### R6：Mission Briefing 和 localPackageModules 去歧义

Mission Briefing 中的 local package、keyFiles、targets summary 必须让 Codex 能知道文件来自哪个 repo / folder。

要求：

- localPackageModules 的 keyFiles 使用 `qualifiedPath` 或额外 folder metadata。
- targetName 不能被当作唯一仓库身份；同名 target 时必须可区分。
- Briefing 中对多仓库 workspace 给出明确提示：读取文件时使用 repo-qualified path。

### R7：兼容单仓库和旧数据

单仓库项目不得因为新增 ProjectScope identity 破坏现有接口。

要求：

- 没有 ProjectScope 时，行为保持单根扫描。
- 旧 `path`、旧 `sourceRefs`、旧 Recipe 仍可读取。
- 新增字段只增强定位，不要求所有旧消费者一次性迁移。

### R8：测试覆盖

必须覆盖：

- Node 项目 `vendor` 排除。
- 多 discoverer 共享排除策略。
- ProjectScope 两个 folder 均含 `lib/index.ts` 时，packet sourceRefs 和 unit key 不碰撞。
- control root 不进入源码扫描。
- Plugin IDE surface 透传 repo-qualified requiredReadSet。
- rescan / SourceRefReconciler 对唯一短路径兼容、歧义短路径阻塞。
- AlembicWorkspace 真实 cold-start smoke。

## 仓库职责

- `AlembicCore`：source identity contract、discoverer 排除策略、ProjectIntelligenceRunner、IDEAgentAnalysisPacketBuilder、snapshot / rescan / sourceRef planner 单元测试。
- `Alembic`：把 ProjectScope descriptor / folder 信息传入 cold-start / rescan；确保 daemon / internal workflow / resident tool 使用正确 project identity。
- `AlembicPlugin`：Codex MCP / Mission Briefing / IDE surface 透传和展示新 source identity；提交 / dimension complete 仍保持 legacy 入参兼容。
- `AlembicTest`：在产品仓库完成后进行真实 AlembicWorkspace cold-start / rescan 回归。
- `AlembicDashboard`：本轮默认无任务；只有 UI 消费新 source identity 时再进入。
- `AlembicAgent`：本轮默认无任务；除非 internal AI prompt 也消费 sourceRefs 并出现短路径歧义。

## 阶段建议

1. Stage 0：Core 契约与 fixture 测试先行。
2. Stage 1：Core 扫描、packet、source identity 投影实现。
3. Stage 2：Alembic wiring，传递 ProjectScope 到 ProjectIntelligenceCapability。
4. Stage 3：Plugin surface 兼容新字段。
5. Stage 4：rescan / sourceRef / evolution 路径匹配补齐。
6. Stage 5：AlembicTest 真实 AlembicWorkspace cold-start / rescan 回归。

## 需要用户确认的事项

当前方案不需要删减能力或改变用户可见目标。进入实现派发前，总控只需要用户确认是否按上述阶段启动第一波 `AlembicCore` 优先任务包。
