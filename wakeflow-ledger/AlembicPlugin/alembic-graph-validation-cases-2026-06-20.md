# alembic_graph 验证案例

日期：2026-06-20

本文档用于验证 AlembicPlugin 仓库中的 `alembic_graph` MCP 工具能力。它面向
Codex/MCP 手工验证、回归定位和能力验收。`alembic_graph` 的输出只能作为
ProjectContext 图谱导航证据；代码行为的最终判断仍然需要读取真实源码并运行匹配的仓库测试。

## 范围

被测仓库：AlembicPlugin。

调用 MCP 工具时，用 `$ALEMBIC_PLUGIN_ROOT` 表示本地 AlembicPlugin 仓库绝对路径。
不要把本机绝对路径写入长期文档、可复用 prompt 或 GitHub 内容。

本案例集准备时参考的源码和测试：

- `lib/shared/schemas/mcp-tools.ts`
- `lib/service/project-knowledge-context/contracts/AlembicGraphOutput.ts`
- `lib/service/project-knowledge-context/project/ProjectGraphProvider.ts`
- `lib/runtime/mcp/knowledge-context-tools/graph-output.ts`
- `test/unit/ProjectGraphTool.test.ts`

2026-06-20 的现场基线：

- AlembicPlugin 的 `alembic_status` 返回 `ready`。
- `stats` 返回 `partial`，包含有界节点和关系，并报告 240 个源文件收集上限导致的截断诊断。
- 合法预算下的 `map` 返回 `partial`，现场结果包含 30 个节点、120 条关系、
  `meta.outputSchema: "AlembicGraphOutput"`，producer 为
  `ProjectContextProjectGraphProvider`。
- `lib/runtime/mcp/HostMcpServer.ts` 的 `file-symbols` 返回文件节点和符号节点，
  包含 `HostMcpServer`、`startHostMcpServer`、
  `attachProjectRuntimeContext` 等符号。
- 同一文件的 `source-slice` 返回了第 1 到 21 行附近的有界源码切片。
- `budget.relationHopLimit: 12` 被拒绝，因为最大值是 `10`。
- 无锚点的 `impact` 现场调用在约 300 秒后超时；单元契约期望它快速返回缺少锚点的
  partial 诊断。该行为应作为性能回归案例单独验证。

## 验收底线

每个成功、partial 或可解释失败的 `alembic_graph` 结果都要满足以下检查：

- 顶层字段包含：`ok`、`status`、`tool`、`toolName`、`queryKind`、`summary`、
  `project`、`nodes`、`relations`、`refs`、`diagnostics`、`nextActions`、
  `limits`、`meta`。
- 工具身份干净：`tool === "alembic_graph"`，`toolName === "alembic_graph"`。
- 输出契约明确：`meta.contractVersion === 1`，
  `meta.outputSchema === "AlembicGraphOutput"`。
- 正常图谱输出的 producer 应为 `ProjectContextProjectGraphProvider`。
- 合法状态为：`ready`、`partial`、`degraded`、`failed`。
- 合法节点类型为：`project`、`package`、`target`、`module`、`directory`、
  `file`、`symbol`。
- 合法关系类型为：`partOf`、`dependsOn`、`imports`、`exports`、
  `definesSymbol`、`referencesSymbol`、`calls`、`calledBy`、`ownsFile`、
  `entrypointFor`。
- 输出必须遵守边界：`nodes.length <= limits.itemLimit`，
  `refs.length <= limits.refLimit`，
  `relations.length <= limits.relationLimit`。
- 输出必须 Recipe-free：序列化结果中不应出现 Recipe id/summary，
  也不应出现 `recipe`、`coveredByKnowledge`、`relationChain`、`mount`、
  `scoreBreakdown` 等 Recipe 或检索评分字段。
- MCP 可见文本只应是 summary，完整数据应在 `structuredContent` 中。
- 默认发现不应暴露生成物：`dist/`、`build/`、`vendor/`、`node_modules/`、
  source map、`.d.ts` 文件都不应在默认图谱导航里出现，除非测试显式指定生成物路径。
- `partial` 可以接受，但必须有诊断解释。没有诊断的 partial 是失败信号。

## 需要覆盖的 queryKind

直接 ProjectContext 视图：

- `space`
- `repo`
- `map`
- `module`
- `module-layers`
- `file-flow`
- `file-symbols`
- `source-slice`
- `anchor-range`

派生图遍历视图：

- `path`
- `impact`
- `neighborhood`
- `stats`

旧版 `operation` 只作为兼容别名：

- `operation: "query"` 归一化为 `queryKind: "map"`。
- `operation: "impact"` 归一化为 `queryKind: "impact"`。
- `operation: "path"` 归一化为 `queryKind: "path"`。
- `operation: "stats"` 归一化为 `queryKind: "stats"`。
- `operation: "neighborhood"` 归一化为 `queryKind: "neighborhood"`。
- 如果同时提供 `queryKind` 和 `operation`，以 `queryKind` 为准。

## 通用调用模板

```json
{
  "projectRoot": "$ALEMBIC_PLUGIN_ROOT",
  "queryKind": "stats",
  "detailLevel": "summary",
  "budget": {
    "itemLimit": 20,
    "detailLimit": 20,
    "relationHopLimit": 2,
    "contentCharLimit": 1200
  }
}
```

已确认的 schema 边界：

- `budget.itemLimit`: `1..500`
- `budget.relationHopLimit`: `1..10`
- `budget.contentCharLimit`: `120..20000`
- `radius.maxDepth`: `1..10`
- `radius.relationHops`: `0..10`
- `radius.beforeLines`: `0..400`
- `radius.afterLines`: `0..400`

## 验证矩阵

### G00 - 状态预检

目的：确认 Alembic 插件可用，再开始图谱测试。

工具：`alembic_status`

Payload:

```json
{
  "projectRoot": "$ALEMBIC_PLUGIN_ROOT"
}
```

通过标准：

- `ok === true`。
- 状态为 `ready`，或返回明确可执行的下一步。
- runtime 诊断没有要求先 reload 或 reinstall 插件。

失败信号：

- MCP 工具表面缺失。
- projectRoot 不可信或无法解析。
- runtime 诊断说明 graph 工具不可用。

### G01 - stats 总览

目的：验证图节点数量、关系数量、refs、limits 和有界诊断。

Payload:

```json
{
  "projectRoot": "$ALEMBIC_PLUGIN_ROOT",
  "queryKind": "stats",
  "detailLevel": "summary",
  "budget": {
    "itemLimit": 20,
    "detailLimit": 20,
    "relationHopLimit": 2,
    "contentCharLimit": 1200
  }
}
```

通过标准：

- 输出符合 `AlembicGraphOutput`。
- summary 说明返回的节点和关系数量。
- 本仓库允许 `limits.truncated === true`。
- 诊断中可以包含 240 个源文件收集上限。
- 不出现 Recipe 字段。

失败信号：

- 输出仍是 `KnowledgeContextToolOutput`。
- 缺少 `meta.outputSchema`。
- 实际数量超过 `limits`。

### G02 - space 顶层视图

目的：验证 workspace/repository 顶层导航，不做深源码遍历。

Payload:

```json
{
  "projectRoot": "$ALEMBIC_PLUGIN_ROOT",
  "queryKind": "space",
  "detailLevel": "summary",
  "budget": {
    "itemLimit": 30,
    "detailLimit": 30,
    "relationHopLimit": 2,
    "contentCharLimit": 1200
  }
}
```

通过标准：

- 返回 project、repo、package 级别节点或 refs。
- 不包含无关 workspace ledger、Test 窗口或生成物目录。
- 关系用 `partOf` 或 `ownsFile` 表达归属。

失败信号：

- 兄弟 workspace 目录被当作产品图节点。
- 生成目录或 ignored 目录主导输出。

### G03 - repo 上下文

目的：验证 package、scripts 和仓库入口点导航。

Payload:

```json
{
  "projectRoot": "$ALEMBIC_PLUGIN_ROOT",
  "queryKind": "repo",
  "detailLevel": "standard",
  "budget": {
    "itemLimit": 60,
    "detailLimit": 40,
    "relationHopLimit": 4,
    "contentCharLimit": 2000
  }
}
```

通过标准：

- 返回 AlembicPlugin package、target、module 节点。
- build、check、smoke 等脚本可以作为 `target` 节点出现。
- target/module 与 package/project 之间有关系连接。

失败信号：

- repo 上下文缺少 package 身份。
- script target 断开，或关系类型不在合法枚举里。

### G04 - 带查询词的 map

目的：验证查询排序和架构图选择。

Payload:

```json
{
  "projectRoot": "$ALEMBIC_PLUGIN_ROOT",
  "queryKind": "map",
  "query": "runtime mcp host server graph ProjectContext",
  "detailLevel": "summary",
  "budget": {
    "itemLimit": 30,
    "detailLimit": 30,
    "relationHopLimit": 6,
    "contentCharLimit": 1200
  }
}
```

通过标准：

- 返回相关的 MCP、runtime、ProjectContext 文件或符号。
- 查询排序节点可包含 `queryMatchScore`、`queryMatchedTerms`、
  `rankingSignals`。
- 2026-06-20 现场结果为 `partial`，包含 30 个节点和 120 条关系。
- 对源文件截断或 module layer 不确定性的 partial 诊断可以接受。

失败信号：

- 查询词对节点选择没有可见影响。
- 关系数量超过由预算派生的输出边界。
- 输出包含 Recipe 评分或语义检索类别。

### G05 - module 明细

目的：验证聚焦 module 选择以及 module/file 归属。

Payload:

```json
{
  "projectRoot": "$ALEMBIC_PLUGIN_ROOT",
  "queryKind": "module",
  "query": "lib runtime mcp knowledge context graph",
  "detailLevel": "standard",
  "budget": {
    "itemLimit": 50,
    "detailLimit": 40,
    "relationHopLimit": 4,
    "contentCharLimit": 2000
  }
}
```

通过标准：

- 返回 `lib/runtime/mcp` 或附近 graph 实现文件相关的 module、directory、file 节点。
- 归属关系使用 `partOf` 或 `ownsFile`。
- summary 和 diagnostics 能解释 partial 选择。

失败信号：

- 只返回 package 级数据，没有 module 聚焦。
- file 节点缺少 path。

### G06 - module-layers 视图

目的：验证 layer 分组，以及方向不确定时的 partial 诊断。

Payload:

```json
{
  "projectRoot": "$ALEMBIC_PLUGIN_ROOT",
  "queryKind": "module-layers",
  "query": "project knowledge context graph provider",
  "detailLevel": "standard",
  "budget": {
    "itemLimit": 80,
    "detailLimit": 60,
    "relationHopLimit": 6,
    "contentCharLimit": 2000
  }
}
```

通过标准：

- 当方向清晰时返回分层 module/file 组。
- 当方向循环或不确定时，返回 `partial`，并给出类似
  `module-layers local layer direction is cyclic or uncertain` 的诊断。
- 不能在无法证明时伪造确定的 layer 顺序。

失败信号：

- 空输出但没有诊断。
- 诊断显示不确定，却仍声称 layer 顺序确定。

### G07 - file-flow 导入导出

目的：验证文件级 imports、exports 和依赖关系。

Payload:

```json
{
  "projectRoot": "$ALEMBIC_PLUGIN_ROOT",
  "queryKind": "file-flow",
  "filePath": "lib/runtime/mcp/HostMcpServer.ts",
  "detailLevel": "standard",
  "budget": {
    "itemLimit": 80,
    "detailLimit": 60,
    "relationHopLimit": 4,
    "contentCharLimit": 2000
  }
}
```

通过标准：

- 返回文件节点以及可用的 imports、exports、dependsOn 关系。
- 文件路径匹配能兼容图谱规范化后的 lowercase id。
- 如果解析失败，必须以诊断呈现，而不是静默缺失。

失败信号：

- file-scoped 请求退化成无关的 package map。
- 文件无法解析却没有诊断。

### G08 - file-symbols

目的：验证具体 TypeScript 文件的符号抽取。

Payload:

```json
{
  "projectRoot": "$ALEMBIC_PLUGIN_ROOT",
  "queryKind": "file-symbols",
  "filePath": "lib/runtime/mcp/HostMcpServer.ts",
  "detailLevel": "standard",
  "budget": {
    "itemLimit": 80,
    "detailLimit": 80,
    "relationHopLimit": 4,
    "contentCharLimit": 2000
  }
}
```

通过标准：

- 返回文件节点和符号节点。
- 预期至少出现以下符号之一：`HostMcpServer`、`startHostMcpServer`、
  `attachProjectRuntimeContext`、`resolveWorkspaceModeConflict`、`getVisibleTools`。
- 关系包含 `definesSymbol`，也可以包含 `exports`。

失败信号：

- 只有文件节点，没有符号节点，且没有 parser 诊断。
- 文件未变时符号 id 在重复调用之间不稳定。

### G09 - source-slice 小窗口

目的：验证有界源码切片和行范围处理。

Payload:

```json
{
  "projectRoot": "$ALEMBIC_PLUGIN_ROOT",
  "queryKind": "source-slice",
  "filePath": "lib/runtime/mcp/HostMcpServer.ts",
  "line": 1,
  "radius": {
    "beforeLines": 0,
    "afterLines": 20
  },
  "detailLevel": "standard",
  "budget": {
    "itemLimit": 20,
    "detailLimit": 20,
    "relationHopLimit": 2,
    "contentCharLimit": 2000
  }
}
```

通过标准：

- `slices[0].filePath` 匹配请求文件。
- 切片范围从第 1 行开始，结束在第 21 行附近。
- `slices[0].text.length <= contentCharLimit`。
- MCP 可见文本仍然只有 summary。

失败信号：

- 切片文本超过预算。
- 行范围出现负数或不可能的行号。

### G10 - source-slice 最大 radius 边界

目的：验证合法上限 radius 不触发 schema 失败。

Payload:

```json
{
  "projectRoot": "$ALEMBIC_PLUGIN_ROOT",
  "queryKind": "source-slice",
  "filePath": "lib/runtime/mcp/HostMcpServer.ts",
  "line": 120,
  "radius": {
    "beforeLines": 400,
    "afterLines": 400
  },
  "detailLevel": "summary",
  "budget": {
    "itemLimit": 5,
    "detailLimit": 5,
    "relationHopLimit": 1,
    "contentCharLimit": 20000
  }
}
```

通过标准：

- schema 接受 `beforeLines: 400` 和 `afterLines: 400`。
- 返回文本仍受 `contentCharLimit` 限制。
- 如果发生截断，诊断或 limits 能说明。

失败信号：

- 合法边界值被拒绝。
- 整个文件越过 `contentCharLimit` 泄露。

### G11 - anchor-range 行锚点

目的：验证行锚点附近的符号、切片和关系。

Payload:

```json
{
  "projectRoot": "$ALEMBIC_PLUGIN_ROOT",
  "queryKind": "anchor-range",
  "filePath": "lib/runtime/mcp/HostMcpServer.ts",
  "line": 120,
  "radius": {
    "beforeLines": 8,
    "afterLines": 8,
    "relationHops": 1
  },
  "detailLevel": "standard",
  "budget": {
    "itemLimit": 40,
    "detailLimit": 40,
    "relationHopLimit": 2,
    "contentCharLimit": 2000
  }
}
```

通过标准：

- 返回有界源码切片和附近图谱 refs。
- 节点和关系保持在文件锚点附近。
- 如果该行不在已知符号内，诊断能说明缺失的符号锚点。

失败信号：

- 返回与该行无关的广泛仓库 map。
- 对合法文件和行号不返回 slice 信息。

### G12 - 按 ref 查询 neighborhood

目的：验证围绕已知文件节点的关系半径遍历。

前置条件：先运行 `file-symbols` 或 `map`，从 `nodes[].id` 复制真实文件节点 id。
示例 id 可能被规范化为 lowercase，例如 `file:lib/runtime/mcp/hostmcpserver.ts`。

Payload:

```json
{
  "projectRoot": "$ALEMBIC_PLUGIN_ROOT",
  "queryKind": "neighborhood",
  "refId": "file:lib/runtime/mcp/hostmcpserver.ts",
  "relationType": "ownsFile",
  "direction": "in",
  "radius": {
    "maxDepth": 1
  },
  "detailLevel": "summary",
  "budget": {
    "itemLimit": 20,
    "detailLimit": 20,
    "relationHopLimit": 2,
    "contentCharLimit": 1200
  }
}
```

通过标准：

- 包含锚点文件节点，或清楚说明 ref 无法解析。
- incoming `ownsFile` 或相近归属关系指向 owning module。
- 不越过声明的半径。

失败信号：

- 用语义检索结果代替图谱关系。
- ref 无法解析却没有诊断或下一步建议。

### G13 - 无锚点 impact 必须快速失败

目的：验证缺少锚点时的处理，并防止慢失败。

Payload:

```json
{
  "projectRoot": "$ALEMBIC_PLUGIN_ROOT",
  "queryKind": "impact",
  "detailLevel": "summary",
  "budget": {
    "itemLimit": 20,
    "detailLimit": 20,
    "relationHopLimit": 4,
    "contentCharLimit": 1200
  }
}
```

通过标准：

- 快速完成。
- 返回 `partial` 或 `failed`，诊断包含
  `project-graph-anchor-required` 或等价的 missing-anchor 诊断。
- 提供调用 `map`、`file-symbols` 或具体锚点查询的下一步。

已观察风险：

- 2026-06-20 现场调用约 300 秒超时。修复或有新证据解释前，应把这视为性能回归。

失败信号：

- 报告缺少锚点前进行长时间图扫描。
- 返回空的成功结果。

### G14 - 带文件锚点的 impact

目的：验证提供具体 ref 后的 impact 遍历。

前置条件：复用前面 `map` 或 `file-symbols` 响应中的真实文件节点 id。

Payload:

```json
{
  "projectRoot": "$ALEMBIC_PLUGIN_ROOT",
  "queryKind": "impact",
  "refId": "file:lib/runtime/mcp/hostmcpserver.ts",
  "direction": "both",
  "radius": {
    "maxDepth": 2
  },
  "detailLevel": "summary",
  "budget": {
    "itemLimit": 40,
    "detailLimit": 40,
    "relationHopLimit": 4,
    "contentCharLimit": 1200
  }
}
```

通过标准：

- 包含锚点文件及相关图节点。
- 关系是真实图边，不是推断出的 Recipe 链接。
- 如果没有可用 impact 边，诊断说明原因，并建议更窄或不同的锚点。

失败信号：

- 锚点被忽略，返回广泛 map 结果。
- `direction` 或 `radius` 对遍历无影响。

### G15 - 已知 refs 之间的 path

目的：验证关系路径搜索，并确认不伪造路径。

前置条件：从前面图输出复制两个真实 id。优先选择有明显归属路径的 id，例如文件 id 和 owning module id。

Payload:

```json
{
  "projectRoot": "$ALEMBIC_PLUGIN_ROOT",
  "queryKind": "path",
  "fromRefId": "module:lib",
  "toRefId": "file:lib/runtime/mcp/hostmcpserver.ts",
  "detailLevel": "summary",
  "budget": {
    "itemLimit": 30,
    "detailLimit": 30,
    "relationHopLimit": 6,
    "contentCharLimit": 1200
  }
}
```

通过标准：

- 当 bounded relations 能连接 refs 时返回路径。
- 如果没有路径，返回明确诊断，而不是猜测路线。
- 路径中的关系类型都在合法枚举里。

失败信号：

- path 中出现不在 `nodes` 里的节点。
- 在没有显式输入的情况下跨入无关 repo 或生成物目录。

### G16 - operation 别名：stats

目的：验证旧版 operation 归一化。

Payload:

```json
{
  "projectRoot": "$ALEMBIC_PLUGIN_ROOT",
  "operation": "stats",
  "detailLevel": "summary",
  "budget": {
    "itemLimit": 20,
    "detailLimit": 20,
    "relationHopLimit": 2,
    "contentCharLimit": 1200
  }
}
```

通过标准：

- 输出 `queryKind` 为 `stats`。
- 输出仍符合 `AlembicGraphOutput`。

失败信号：

- 公共输出模式暴露为 `operation`。
- 旧路径返回 Recipe 或 KnowledgeContext envelope。

### G17 - operation query 归一化为 map

目的：验证 `operation: "query"` 映射到公开的 `map` queryKind。

Payload:

```json
{
  "projectRoot": "$ALEMBIC_PLUGIN_ROOT",
  "operation": "query",
  "query": "HostMcpServer graph",
  "detailLevel": "summary",
  "budget": {
    "itemLimit": 20,
    "detailLimit": 20,
    "relationHopLimit": 2,
    "contentCharLimit": 1200
  }
}
```

通过标准：

- 输出 `queryKind` 为 `map`。
- 查询词影响节点选择。

失败信号：

- 输出 `queryKind` 是 `query`。
- query 字符串被忽略。

### G18 - queryKind 优先于 operation

目的：验证现代显式字段优先。

Payload:

```json
{
  "projectRoot": "$ALEMBIC_PLUGIN_ROOT",
  "queryKind": "stats",
  "operation": "query",
  "query": "this should not force map",
  "detailLevel": "summary",
  "budget": {
    "itemLimit": 20,
    "detailLimit": 20,
    "relationHopLimit": 2,
    "contentCharLimit": 1200
  }
}
```

通过标准：

- 输出 `queryKind` 为 `stats`。

失败信号：

- `operation` 覆盖 `queryKind`。

### G19 - hostDeclaredIntent 查询兜底

目的：验证缺省 `query` 时，host intent 可以提供查询语义。

Payload:

```json
{
  "projectRoot": "$ALEMBIC_PLUGIN_ROOT",
  "queryKind": "map",
  "hostDeclaredIntent": {
    "goal": "inspect graph implementation",
    "query": "ProjectContext graph provider",
    "keywords": ["ProjectContext", "graph", "provider"],
    "confidence": 0.8
  },
  "detailLevel": "summary",
  "budget": {
    "itemLimit": 30,
    "detailLimit": 30,
    "relationHopLimit": 4,
    "contentCharLimit": 1200
  }
}
```

通过标准：

- 输出是合法 map 结果。
- 选择的节点与 ProjectContext/graph provider 查询词相关。
- 不泄露允许字段以外的私有 host 元数据。

失败信号：

- 缺少 query 导致可避免的 schema 失败。
- 诊断中复制过多 host intent 或私有信息。

### G20 - sourceRefs 与 sourceEvidenceRefs

目的：验证 graph 接受有界 source refs 作为上下文提示。

前置条件：从先前图输出的 `refs[].id` 复制安全、非私密的 refs。

Payload:

```json
{
  "projectRoot": "$ALEMBIC_PLUGIN_ROOT",
  "queryKind": "map",
  "query": "graph output contract",
  "sourceRefs": ["file:AlembicPlugin:lib/service/project-knowledge-context/contracts/AlembicGraphOutput.ts"],
  "sourceEvidenceRefs": ["file:AlembicPlugin:lib/runtime/mcp/knowledge-context-tools/graph-output.ts"],
  "detailLevel": "summary",
  "budget": {
    "itemLimit": 30,
    "detailLimit": 30,
    "relationHopLimit": 4,
    "contentCharLimit": 1200
  }
}
```

通过标准：

- 合法 refs 被接受，不触发 schema 错误。
- 输出仍然有界且 Recipe-free。
- 如果 refs 无法解析，应出现在 diagnostics 里。

失败信号：

- source refs 被解释为 Recipe ids。
- 无法解析的 refs 静默改变范围。

### G21 - file-scoped 查询缺少 filePath

目的：验证文件级查询必须有文件锚点。

Payload:

```json
{
  "projectRoot": "$ALEMBIC_PLUGIN_ROOT",
  "queryKind": "file-symbols",
  "detailLevel": "summary",
  "budget": {
    "itemLimit": 20,
    "detailLimit": 20,
    "relationHopLimit": 2,
    "contentCharLimit": 1200
  }
}
```

通过标准：

- 返回 partial 或 failed，诊断包含类似
  `project-graph-file-anchor-required` 的文件锚点要求。
- nextActions 建议调用 `map` 或提供 `filePath`。
- 不应把该请求当作合法 broad map 执行。

失败信号：

- 空成功结果。
- 没有诊断却返回广泛无关结果。

### G22 - 非法 relationHopLimit

目的：验证 graph budget 的严格 schema 边界。

Payload:

```json
{
  "projectRoot": "$ALEMBIC_PLUGIN_ROOT",
  "queryKind": "map",
  "query": "graph",
  "budget": {
    "itemLimit": 20,
    "detailLimit": 20,
    "relationHopLimit": 11,
    "contentCharLimit": 1200
  }
}
```

通过标准：

- 工具在执行图查询前拒绝 payload。
- validation error 指向 `budget.relationHopLimit`，并说明最大值为 `10`。

失败信号：

- graph 用越界 hop limit 执行。
- 错误信息隐藏非法字段路径。

### G23 - 非法 source-slice radius

目的：验证 source radius 的严格 schema 边界。

Payload:

```json
{
  "projectRoot": "$ALEMBIC_PLUGIN_ROOT",
  "queryKind": "source-slice",
  "filePath": "lib/runtime/mcp/HostMcpServer.ts",
  "line": 120,
  "radius": {
    "beforeLines": 401,
    "afterLines": 0
  },
  "budget": {
    "itemLimit": 5,
    "detailLimit": 5,
    "relationHopLimit": 1,
    "contentCharLimit": 1200
  }
}
```

通过标准：

- 工具在执行前拒绝 payload。
- validation error 指向 `radius.beforeLines`，并说明最大值为 `400`。

失败信号：

- source slice 用越界 radius 执行。
- 错误丢失字段路径。

### G24 - 非法 Recipe 时代 queryKind

目的：验证 graph 不再接受 Recipe/coverage queryKind。

Payload:

```json
{
  "projectRoot": "$ALEMBIC_PLUGIN_ROOT",
  "queryKind": "coverage",
  "detailLevel": "summary",
  "budget": {
    "itemLimit": 20,
    "detailLimit": 20,
    "relationHopLimit": 2,
    "contentCharLimit": 1200
  }
}
```

通过标准：

- schema 拒绝该 queryKind。
- 不执行图查询。

失败信号：

- `coverage`、`recipe` 或其他 Recipe 时代模式可以通过 `alembic_graph` 执行。

### G25 - 非法 Recipe 时代 nodeType

目的：验证旧版 Recipe graph 字段被拒绝。

Payload:

```json
{
  "projectRoot": "$ALEMBIC_PLUGIN_ROOT",
  "operation": "neighborhood",
  "nodeType": "recipe",
  "nodeId": "recipe:example",
  "budget": {
    "itemLimit": 20,
    "detailLimit": 20,
    "relationHopLimit": 2,
    "contentCharLimit": 1200
  }
}
```

通过标准：

- schema 拒绝 `nodeType: "recipe"`。
- 不返回 Recipe neighborhood。

失败信号：

- Recipe 节点出现在 graph 输出中。

### G26 - 生成物过滤

目的：验证默认图谱发现会过滤生成物。

Payload:

```json
{
  "projectRoot": "$ALEMBIC_PLUGIN_ROOT",
  "queryKind": "map",
  "query": "runtime mcp",
  "detailLevel": "standard",
  "budget": {
    "itemLimit": 120,
    "detailLimit": 80,
    "relationHopLimit": 6,
    "contentCharLimit": 2000
  }
}
```

通过标准：

- 序列化输出不包含默认生成目录：`/dist/`、`/build/`、`/vendor/`、
  `/node_modules/`。
- 序列化输出不包含生成后缀：`.d.ts`、`.d.ts.map`、`.js.map`、`.mjs.map`、
  `.cjs.map`、`.jsx.map`、`.mts.map`、`.cts.map`。

失败信号：

- 生成文件主导默认导航。
- 没有显式生成物输入时输出 source map 或声明文件。

### G27 - freshnessPolicy preferFresh

目的：验证 freshness 元数据可接受，且不会绕过诊断。

Payload:

```json
{
  "projectRoot": "$ALEMBIC_PLUGIN_ROOT",
  "queryKind": "stats",
  "freshnessPolicy": {
    "policy": "preferFresh",
    "maxAgeMs": 60000
  },
  "detailLevel": "summary",
  "budget": {
    "itemLimit": 20,
    "detailLimit": 20,
    "relationHopLimit": 2,
    "contentCharLimit": 1200
  }
}
```

通过标准：

- schema 接受 freshness policy。
- 如果 provider 不能证明 freshness，诊断或元数据能说明。
- freshness policy 不会压掉 partial 诊断。

失败信号：

- freshness 字段被忽略，却声称 stale 数据是 fresh。
- `preferFresh` 下出现 snapshot-only 行为。

### G28 - snapshotOnly 缺少 snapshot

目的：验证缺失 snapshot 的处理。

Payload:

```json
{
  "projectRoot": "$ALEMBIC_PLUGIN_ROOT",
  "queryKind": "stats",
  "freshnessPolicy": {
    "policy": "snapshotOnly",
    "snapshotRef": "missing-test-snapshot"
  },
  "detailLevel": "summary",
  "budget": {
    "itemLimit": 20,
    "detailLimit": 20,
    "relationHopLimit": 2,
    "contentCharLimit": 1200
  }
}
```

通过标准：

- 返回清晰的 missing-snapshot 诊断，或明确说明 snapshot policy 当前只是 advisory。
- 不应静默声称使用了指定 snapshot。

失败信号：

- 伪造 snapshot 来源。
- freshness policy 导致无界 fallback traversal。

### G29 - 输出契约投影失败探针

目的：验证 clean-output projector 在收到不符合契约的数据时能报告 contract mismatch。

执行方式：

- 用单元或集成 harness 调用 `alembic_graph` 的 projector 路径，并传入非法 structured content。
- 不要为了执行本案例修改生产 MCP handler。

通过标准：

- fallback 输出为 `ok: false`、`status: "failed"`、`queryKind: "map"`。
- diagnostics 包含 `alembic-graph-output-contract-mismatch`。
- `meta.producer` 为 `alembic-graph-clean-output-projector`。

失败信号：

- 非法 graph payload 以成功 MCP 结果逃逸。
- 可见文本包含原始非法 JSON，而不是 summary。

### G30 - 重复调用稳定性

目的：验证相同调用在源码未变时 ids 和 refs 稳定。

Payload:

```json
{
  "projectRoot": "$ALEMBIC_PLUGIN_ROOT",
  "queryKind": "file-symbols",
  "filePath": "lib/runtime/mcp/HostMcpServer.ts",
  "detailLevel": "summary",
  "budget": {
    "itemLimit": 80,
    "detailLimit": 80,
    "relationHopLimit": 4,
    "contentCharLimit": 1200
  }
}
```

步骤：

1. 在不修改文件的情况下运行两次。
2. 比较排序后的 `nodes[].id`、`relations[]` 和 `refs[].id`。

通过标准：

- 未改源码时 ids 和关系集合稳定。
- 如果存在 `meta.generatedAt`，它可以不同。

失败信号：

- 两次调用之间 symbol ids 抖动。
- 没有诊断时关系随机出现或消失。

### G31 - 预算截断

目的：验证极小预算会产生有界且可见的截断。

Payload:

```json
{
  "projectRoot": "$ALEMBIC_PLUGIN_ROOT",
  "queryKind": "map",
  "query": "runtime mcp graph",
  "detailLevel": "summary",
  "budget": {
    "itemLimit": 3,
    "detailLimit": 3,
    "relationHopLimit": 1,
    "contentCharLimit": 120
  }
}
```

通过标准：

- 在适用限制下，最多返回 3 个 nodes 和 3 个 refs。
- 关系数量不超过 `limits.relationLimit`。
- 如果存在更多数据，`limits.truncated` 或 diagnostics 能说明有界选择。

失败信号：

- 小预算被忽略。
- 发生截断但没有任何 limit 元数据。

### G32 - detailLevel 对比

目的：验证 `summary`、`standard`、`detailed` 改变信息量，但不改变契约形状。

Payload A:

```json
{
  "projectRoot": "$ALEMBIC_PLUGIN_ROOT",
  "queryKind": "stats",
  "detailLevel": "summary",
  "budget": {
    "itemLimit": 20,
    "detailLimit": 20,
    "relationHopLimit": 2,
    "contentCharLimit": 1200
  }
}
```

Payload B:

```json
{
  "projectRoot": "$ALEMBIC_PLUGIN_ROOT",
  "queryKind": "stats",
  "detailLevel": "detailed",
  "budget": {
    "itemLimit": 20,
    "detailLimit": 20,
    "relationHopLimit": 2,
    "contentCharLimit": 1200
  }
}
```

通过标准：

- 两个输出都满足同一公开契约。
- detailed 输出可以有更丰富的 refs/diagnostics，但必须仍然有界。

失败信号：

- detailLevel 改变输出 schema。
- detailed 模式泄露 Recipe 内容。

### G33 - 未知字段拒绝

目的：验证输入严格解析。

Payload:

```json
{
  "projectRoot": "$ALEMBIC_PLUGIN_ROOT",
  "queryKind": "stats",
  "unexpectedField": true,
  "budget": {
    "itemLimit": 20,
    "detailLimit": 20,
    "relationHopLimit": 2,
    "contentCharLimit": 1200
  }
}
```

通过标准：

- schema 在执行前拒绝未知字段。

失败信号：

- 公开工具 schema 静默接受未知字段。

### G34 - projectRoot 边界

目的：验证图谱停留在请求的 AlembicPlugin 项目内。

Payload:

```json
{
  "projectRoot": "$ALEMBIC_PLUGIN_ROOT",
  "queryKind": "map",
  "query": "plugin runtime tools",
  "detailLevel": "standard",
  "budget": {
    "itemLimit": 100,
    "detailLimit": 80,
    "relationHopLimit": 6,
    "contentCharLimit": 2000
  }
}
```

通过标准：

- `project.projectRoot` 指向请求的项目根。
- 返回文件属于 AlembicPlugin 源码、测试、配置或 package 文件。
- workspace ledger、active Wakeflow state、无关兄弟仓库不应作为图节点出现。

失败信号：

- `projectRoot` 为 AlembicPlugin 时，图谱漂移到 workspace 协作文档或兄弟仓库。

## 建议执行顺序

1. 先运行 G00。
2. 运行 G01-G04，建立 graph 可用性和广义导航基线。
3. 针对 `HostMcpServer.ts` 运行 G07-G11，验证文件、符号和切片能力。
4. 从前面输出复制真实 ids，再运行 G12-G15。
5. 运行 G16-G20，验证兼容别名和上下文提示。
6. 运行 G21-G25，验证 schema、缺锚点和非法输入失败路径。
7. 运行 G26-G34，验证边界、freshness、投影、稳定性、预算和 projectRoot containment。

不要在硬 schema 失败后继续链式执行，除非该案例本来就是负向案例。派生遍历必须优先使用当前图谱输出中的真实 ids，不要依赖手写示例 id。

## 证据记录模板

```text
案例:
工具:
Payload:
耗时:
ok/status/queryKind:
nodes/relations/refs:
limits:
diagnostics:
nextActions:
通过/失败:
备注:
```

性能案例要记录 wall-clock 耗时，以及是否快速失败。partial 案例要复制 diagnostic code 和一句消息。schema 失败要复制被拒绝的字段路径。

## 回归信号

以下任一情况都应视为回归，除非有源码证据解释：

- `alembic_graph` 返回 Recipe、KnowledgeContext 或 search envelope 字段。
- 缺少锚点或非法预算触发昂贵扫描，而不是快速校验。
- `impact`、`path` 或 `neighborhood` 在没有真实关系时伪造路径。
- 默认导航输出出现生成物。
- 工具缺少 `meta.outputSchema: "AlembicGraphOutput"`。
- `limits` 与实际数组长度不一致。
- partial 输出缺少 diagnostics。
- freshness 或 snapshot policy 声称无法证明的来源。
- 未改文件时重复调用出现 ids 或 refs 抖动。
- projectRoot 范围漂移到 workspace 协作 ledger 或兄弟仓库。

## 失败后的修复优先级

1. 先修 schema validation：非法输入必须在执行图查询前失败。
2. 修 clean-output 契约投影：公开输出必须保持 `AlembicGraphOutput`。
3. 修锚点处理：派生遍历在没有具体 refs 时必须快速失败。
4. 修 project/generated-file 边界。
5. 修稳定性和性能。
6. 最后再调 `map` 和 `module` 查询结果的排序质量。
