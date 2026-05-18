# 12. 下一阶段推进计划：增量证据编译闭环

> 目标：在已有 `lib/mainline` 主干上继续向上推进，但不急着扩大 IDE/插件/Agent 集成。下一阶段的核心是建立一条最小真实闭环：项目变化先变成稳定 `EvidencePackage`，再进入 `ContentMiningPipeline`，最后写入可被运行期读取的 `ContextIndex`。

## 1. 当前代码实现判断

本轮核对了 `docs-dev/rearchitecture` 的总案、07/09/10/11 号计划，以及当前 `lib/mainline` 真实代码。

整体状态（本轮推进后）：

| 层 | 已经落地 | 主要缺口 | 下一步定位 |
| --- | --- | --- | --- |
| `foundation` | `MainlineKernel`、能力目录、路径、日志、定时器、并发、IO、Git、文件变化、Markdown、test mode | 真实 adapter 少，但底座已经够用 | 暂停扩张，只补必要能力状态 |
| `domain` | `SourceRef`、`Recipe`、`RecipeEdge`、`EvidencePackage`、`ContextBundle`、`GuardFinding` | `RecipeCandidate`、`RescanRequest/CaptureDraft` 还没成为一等对象 | 只在闭环需要时补，不提前建大模型 |
| `data` | `ContextIndex`、artifact store contract、JSON/JSONL store、JobLedger、`FileFingerprintSnapshotStore` | 缺 durable `ContextIndex` | 暂停扩张，只在运行期需要时补持久化 index |
| `language` | 语言 catalog、扩展名识别、源码/文档扫描器、AST 端口 | AST 摘要未接入 | 后续只接 adapter，不改变扫描输出契约 |
| `compile` | `IncrementalEvidenceCompiler`、`SourceRefMaterializer`、`ContentMiningPipeline`、`ContentMiningRunner`、lens、关系挖掘、freshness、report | 还缺运行期 ActiveWorkContext 到 compile request 的回流 | 下一阶段转向 runtime 接入 |
| `runtime` | `ActiveWorkContextBuilder`、`ContextBundleBuilder`、图扩展、GuardFinding builder | 还缺 feedback request 的统一对象 | 继续保持只读，不写 compile artifact |
| `agent` / `surface` / `ai` | `KnowledgeInjectionRunner`、知识注入 planner、IDE/plugin/tool manifest、AI task planner | 多为 DTO/投影，没有接宿主 | 继续保持薄层，不先接重集成 |
| `legacy` | mapper/adapter 边界已存在 | 还没成为旧数据稳定供血通道 | P1 之后再接 |

关键判断：当前最薄弱处已经从“项目变化无法进入内容挖掘”移动到“运行期还没有把当前工作上下文稳定投回编译期”。`ContentMiningPipeline` 已收窄为只消费标准 `EvidencePackage`，项目变化统一由 `IncrementalEvidenceCompiler` 产出 evidence，再由 `ContentMiningRunner` 写入 `ContextIndex`。因此下一阶段不应该回头扩 Dashboard、IDE delivery 或 Agent route，而应该把 runtime 的 ActiveWorkContext 接到这条主线。

## 2. 下一阶段核心主线

新主线从这里开始形成可运行闭环：

```text
GitChangeSet / SourceFileScanner / FileFingerprintSnapshot
  -> IncrementalEvidenceCompiler
  -> EvidencePackage
  -> ContentMiningPipeline
  -> CompileArtifacts
  -> ContextIndexWriter
  -> ContextBundleBuilder
  -> AgentInjectionPlanner
```

这条线有三个好处：

1. 它直接服务“内容挖掘 + 知识注入”，不是旁支功能。
2. 它能复用当前已写好的底层能力，不需要提前接旧 daemon。
3. 它能自然替代旧项目里分散的 bootstrap/rescan/project-intelligence/evolution fallback。

当前主线已经落地的对象不是新的大平台，而是六个小对象：

| 对象 | 位置 | 职责 |
| --- | --- | --- |
| `FileFingerprintSnapshotStore` | `data` | 保存文件 hash 快照，判断 added/modified/deleted/unchanged。 |
| `IncrementalEvidenceCompiler` | `compile` | 汇总 Git、扫描、snapshot diff、文本摘要，产出 `EvidencePackage`。 |
| `SourceRefMaterializer` | `compile` 或 `language` | 把扫描文件、diff、doc/code block 转成 `SourceRef`。 |
| `ContentMiningRunner` | `compile` | 固定串起 evidence 编译、内容挖掘、artifact 写入。 |
| `ActiveWorkContextBuilder` | `runtime` | 把当前任务、文件、diff、错误归一成运行期上下文。 |
| `KnowledgeInjectionRunner` | `agent` | 固定串起上下文归一、bundle 召回、只读注入计划。 |

## 3. P0：FileFingerprintSnapshotStore（已落地）

### 写入范围

```text
lib/mainline/data/FileFingerprintSnapshotStore.ts
test/unit/MainlineIncrementalEvidence.test.ts
```

### 设计

`FileFingerprintSnapshotStore` 应该基于现有 `MainlineJsonDocumentStore` 和唯一的 data 层文件指纹接口，不直接使用旧 `FileDiffSnapshotStore`、Drizzle、workflow session，也不在 compile 层保留第二套 snapshot diff 类型。

建议接口：

```ts
interface FileFingerprintSnapshot {
  id: string;
  projectRoot: string;
  files: Record<string, string>;
  createdAt: number;
}

interface FileFingerprintSnapshotStore {
  load(): Promise<FileFingerprintSnapshot | null>;
  save(snapshot: FileFingerprintSnapshot): Promise<void>;
  diffAndSave(next: FileFingerprintSnapshot): Promise<MainlineFileFingerprintSnapshotDiff>;
}
```

### 完成标准

1. 路径统一使用相对 POSIX path。
2. `docs-dev`、`.asd`、`.git`、`node_modules`、生成文件可以被过滤。
3. 首次无快照时，所有扫描文件进入 `added`。
4. hash 不变的文件进入 `unchanged`，不触发后续挖掘。
5. 只依赖 mainline data/foundation/compile，不 import 旧 workflow。

## 4. P0：IncrementalEvidenceCompiler（已落地）

### 写入范围

```text
lib/mainline/compile/IncrementalEvidenceCompiler.ts
test/unit/MainlineIncrementalEvidence.test.ts
```

### 输入

```ts
interface IncrementalEvidenceCompilerRequest {
  projectRoot: string;
  origin: 'snapshot' | 'diff';
  scanFiles?: boolean;
  gitChangeSet?: MainlineGitChangeSet;
  snapshotDiff?: MainlineFileFingerprintSnapshotDiff;
  diffTextByPath?: Record<string, string>;
  notes?: readonly string[];
}
```

### 输出

输出应是标准 `EvidencePackage`，并带上元数据：

```text
metadata.git.stagedCount
metadata.git.untrackedCount
metadata.snapshot.changeRatio
metadata.diff.tokens
metadata.scan.truncated
```

### 规则

1. `GitChangeSet.files` 是增量入口优先级最高的事实。
2. `MainlineFileFingerprintSnapshotDiff` 用来补 Git 之外的变化，也用来支持无 git 的项目。
3. `SourceFileScanner` 只负责发现源码，不读完整内容、不生成 Recipe。
4. `DiffParser` 只解析 diff token，不调用 git。
5. `GeneratedProjectFiles` 必须在进入 `changedFiles` 前执行，避免 AGENTS/Cursor rules/Copilot 指导文件反向污染 Recipe。
6. 生成的 `SourceRef` 默认 `status: active`，删除文件生成 `status: missing`，rename 生成 `status: renamed` 并记录 `oldPath`。

### 完成标准

1. 无 Git、无快照时可以从源码扫描生成 snapshot evidence。
2. 有 Git diff 时可以生成 diff evidence。
3. 结果可以作为 `evidencePackage` 直接传入 `ContentMiningPipeline.compile()`。
4. 不执行 AI、不写数据库、不触发 runtime。

## 5. P1：把 Evidence 写入 ContextIndex（已落地）

### 写入范围

```text
lib/mainline/compile/ContentMiningPipeline.ts
lib/mainline/compile/CompileArtifactWriter.ts
test/unit/MainlineContentMining.test.ts
```

### 目标

`ContentMiningPipeline` 现在只接标准 `EvidencePackage`，不再接原始 `changedFiles/sourceRefs`。标准 runner 已经收敛成轻量 orchestration：

```ts
class ContentMiningRunner {
  compileAndWrite(request): Promise<ContentMiningPipelineArtifacts>
}
```

它只做三件事：

1. 调用 `IncrementalEvidenceCompiler` 得到 `EvidencePackage`。
2. 调用 `ContentMiningPipeline` 得到 artifacts。
3. 通过 `CompileArtifactWriter` 写 `ContextIndexWriter`。

它不能做：

1. Wiki 生成。
2. Dashboard 通知。
3. ToolForge。
4. ReverseGuard。
5. 旧 workflow finalizer。

## 6. P1：SourceRefMaterializer（已落地）

### 写入范围

```text
lib/mainline/compile/SourceRefMaterializer.ts
test/unit/MainlineIncrementalEvidence.test.ts
```

### 目标

把不同材料统一转成 `SourceRef`：

| 输入 | SourceRef kind | 说明 |
| --- | --- | --- |
| 扫描到的源码文件 | `file` | 带 `contentHash`、language metadata。 |
| Git diff hunk | `diff` | 带 diff token metadata。 |
| Markdown 文档 | `doc` | 可带 heading/code block metadata。 |
| 测试文件 | `test` | 默认不进主线，除非显式 `includeTests`。 |
| Guard finding | `guard-finding` | 后续 feedback 闭环再接。 |

这个对象不应该生成 Recipe，它只负责证据锚点。

## 7. P2：运行期接入

运行期现在已有 `ActiveWorkContextBuilder -> ContextBundleBuilder -> AgentInjectionPlanner` 的对象基础。P0/P1 让 `ContextIndex` 变得可靠后，运行期接入已经形成薄闭环：

1. `ActiveWorkContextBuilder`：从当前文件、任务文本、diff、错误构造 `ActiveWorkContext`，并强制携带 `projectRoot`。
2. `KnowledgeInjectionRunner`：调用 `ContextBundleBuilder`，再调用 `AgentInjectionPlanner`，返回 plan 和 Markdown。
3. `CaptureDraft` / `RescanRequest`：把 GuardFinding 和用户反馈回流成 compile request。

运行期依然不能默认触发全量 rescan，只能生成 request。`ActiveWorkContextBuilder` 和 `KnowledgeInjectionRunner` 都只做路径归一、bundle 召回和注入投影，不扫描项目、不写 `ContextIndex`、不调用 AI。

## 8. P2：Legacy 供血

旧系统接入顺序应该后置：

1. 旧 Knowledge/Search -> `Recipe` / `RecipeEdge` / `SourceRef` mapper。
2. 旧 Guard result -> `GuardFinding` mapper。
3. 旧 ProjectIntelligence/KnowledgeRescan -> `IncrementalEvidenceCompiler` adapter。

不要反过来让 `IncrementalEvidenceCompiler` 直接 import 旧 service。旧系统只能在边缘投影成 mainline DTO。

## 9. 明确继续剪掉的东西

下一阶段不要做这些：

| 不做 | 原因 |
| --- | --- |
| Dashboard 主屏重做 | 现在还没有稳定 evidence/index，先做 UI 会倒逼领域模型漂移。 |
| IDE 自动部署和 VSIX | 属于宿主 adapter，不是当前最短闭环。 |
| Skill create/update/delete/hooks | 有副作用，等只读 Skill catalog 稳定后再决定。 |
| Vector/HNSW 增量 | 旧实现仍偏重，且当前需要的是可解释 SourceRef，不是向量召回。 |
| Wiki 默认生成 | 文档导出，不进入主路径。 |
| ReverseGuard 全量审计 | 用 SourceRef freshness 和 snapshot diff 覆盖核心价值。 |
| AI 自动生成 Recipe | AI 只能先做 task plan 或 candidate proposal，不能成为证据入口。 |

## 10. 多窗口推进拆分

如果继续开多个任务窗口，建议这样拆：

| 窗口 | 写入边界 | 任务 |
| --- | --- | --- |
| 数据窗口 | `lib/mainline/data`, `test/unit/MainlineData*.test.ts` | 实现 `FileFingerprintSnapshotStore`，补 snapshot 持久化测试。 |
| 编译窗口 | `lib/mainline/compile`, `test/unit/MainlineIncrementalEvidence.test.ts` | 实现 `IncrementalEvidenceCompiler` 和 `SourceRefMaterializer`。 |
| 语言窗口 | `lib/mainline/language`, `test/unit/MainlineLanguage*.test.ts` | 增强扫描结果 metadata，后续准备 AST summary adapter。 |
| 运行期窗口 | `lib/mainline/runtime`, `lib/mainline/agent`, `test/unit/MainlineRuntime*.test.ts` | 已接 `ActiveWorkContextBuilder` 和 `KnowledgeInjectionRunner`；下一步接 feedback request 对象。 |
| Legacy 窗口 | `lib/mainline/legacy`, 旧 adapter tests | 只做 mapper，不改旧 workflow 默认行为。 |

共享规则：

1. 每个窗口只通过 `lib/mainline/index.ts` 暴露公共接口。
2. 每个新增能力都登记到 `MainlineKernel` capability。
3. 每个新增对象都要说明“它不做什么”。
4. 新代码不得 import `ServiceContainer`、`FileDeployer`、`GuardCheckEngine`、`ToolForge`、`AgentRuntime`、`WikiGenerator`、`PanoramaScanner`。

## 11. 推荐提交顺序

1. `Add file fingerprint snapshot store`：已完成。
2. `Add incremental evidence compiler`：已完成。
3. `Connect content mining runner to context index`：已完成。
4. `Add source ref materializer`：已完成。
5. `Add active work context builder`：已完成。
6. `Add context bundle injection runner`：已完成。
7. `Add feedback request objects`：下一步。
8. `Map legacy knowledge into mainline artifacts`：后置。

前六步已经完成，Alembic 新主干现在有第一条真正可运行的内容挖掘闭环，也有运行期知识注入薄闭环。之后再接 feedback request 和 IDE/插件，方向会稳很多。

## 12. 成功标准

当前已用测试证明：

1. 一个临时项目目录经过扫描后能生成 snapshot evidence。
2. 修改文件后能通过 hash diff 找到 changed files。
3. Git name-status + diff 能生成 diff evidence。
4. `ContentMiningPipeline` 能消费该 evidence 并产出 artifacts。
5. artifacts 能写入 `InMemoryContextIndex` 或 JSON-backed store。
6. `ActiveWorkContextBuilder` 能把当前文件、diff、错误位置统一成项目相对 POSIX path。
7. `KnowledgeInjectionRunner` 能把当前现场转成 `ContextBundle`、只读 injection plan 和 Markdown。
8. 全流程不启动旧 daemon、不跑 Dashboard、不生成 Wiki、不调用 AI mock。

下一阶段继续补：

1. feedback request 对象能表达 `CaptureDraft` 和 focused `RescanRequest`。
2. GuardFinding 和用户反馈能只生成请求，不直接触发 compile writer。
3. 运行期只读 `ContextIndexReader`，不直接触碰 compile writer。

这就是下一阶段最清晰的核心主线：先让项目变化稳定变成知识证据，再让知识证据进入索引；运行期和 Agent 都应该建立在这条线之后。
