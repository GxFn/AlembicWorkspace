# Resident Vector Search Release Core Record

状态：已完成
窗口：AlembicCore
日期：2026-05-21
对应总控计划：`docs/workspace/archive/2026-05/resident-vector-search-release/resident-vector-search-release-workspace-plan-2026-05-21.md`
提交 hash：`39bcebe94c451f92e405b0da38d2cbe67e8e0f82`

## 完成范围

- 在 `SearchResponse` 上新增可选 `searchMeta`，旧客户端仍可继续读取 `items`、`total`、`query`、`mode`、`type`、`ranked` 和 `byKind`。
- 新增共享 telemetry contract：`SearchResponseMeta`、`SearchRoute`、`SearchWorkspaceIdentity`、`SearchTimingMeta`、`ResidentVectorMeta`、`BuildSearchResponseMetaInput`。
- 新增 `buildSearchResponseMeta()`、`inferSearchSemanticUsage()`、`inferSearchVectorUsage()` helper，供 Alembic resident HTTP response 和 Plugin resident search adapter 复用同一字段语义。
- `SearchEngine.search()` 自动写入 `searchMeta.route="core-search-engine"`、`requestedMode`、`actualMode`、`semanticUsed`、`vectorUsed`、`resultCount`、`durationMs` 和降级原因。
- `VectorService.hybridSearch()` 返回结果附带 `vectorUsed`、`semanticUsed` 和 `fallbackReason`，避免 embed 失败后 sparse-only RRF 被外层误判为真实 vector 命中。
- `auto` 模式在 VectorService 返回 sparse-only RRF 时把 `actualMode` 标为 `auto(sparse-rrf,conf=...)`，并在 `searchMeta` 中明确 `vectorUsed=false`。
- 更新 `@alembic/core/search` 和 `@alembic/core/vector` facade 导出，让外层仓库不用直连内部路径。

## Contract Shape

Alembic / AlembicPlugin 后续应优先消费或透传以下 shape：

```ts
interface SearchResponse {
  items: SearchResultItem[];
  total: number;
  query: string;
  mode?: string;
  type?: string;
  ranked?: boolean;
  byKind?: Record<string, SearchResultItem[]>;
  searchMeta?: {
    route: 'core-search-engine' | 'resident-service' | 'plugin-embedded' | string;
    requestedMode: string;
    actualMode: string;
    semanticUsed: boolean;
    vectorUsed: boolean;
    resultCount: number;
    durationMs: number;
    fallbackReason?: string;
    workspace?: {
      projectId?: string;
      projectRoot?: string;
      dataRoot?: string;
      workspaceMode?: string;
    };
    residentVector?: {
      available: boolean;
      reason?: string;
      endpoint?: string;
      serviceVersion?: string;
    };
    timings?: {
      totalMs?: number;
      embedMs?: number;
      vectorMs?: number;
      fuseMs?: number;
    };
  };
}
```

## 文件变化

- `src/service/search/SearchTypes.ts`
- `src/service/search/SearchEngine.ts`
- `src/service/vector/VectorService.ts`
- `src/search.ts`
- `src/vector.ts`
- `test/SearchEngine.test.ts`
- `test/VectorService.test.ts`
- `test/PublicSearchVectorGuardEntrypoints.test.ts`

## 验证命令与结果

```bash
npm run build:check
npm run test -- test/SearchEngine.test.ts test/PublicSearchVectorGuardEntrypoints.test.ts test/VectorService.test.ts
git diff --check
npm run check
```

结果：

- `npm run build:check` 通过。
- 目标测试 3 个文件通过，75 tests passed。
- `git diff --check` 通过。
- `npm run check` 通过：public API boundary OK；全量 63 个测试文件通过，943 tests passed；lint 通过。
- `npm run check` 期间仍出现既有提示 `error: Could not access 'HEAD'`，但命令退出码为 0，未阻塞本次提交。

## 遗留风险

- Core 已沉淀 resident search telemetry contract，但还没有验证 Alembic daemon `/api/v1/search` 是否实际透传 `searchMeta.route="resident-service"`、workspace identity、residentVector 和真实 semantic/vector 证据。
- Plugin 仍处于阻塞状态；必须等待 Alembic 窗口回填 API shape、HTTP response 示例和真实 HNSW / Ollama semantic search 证据后再执行 VEC-2。
- `searchMeta` 是兼容新增字段；外层若仍使用自有 wire type，需要在各自仓库同步类型或改为消费 Core facade。

## 下一步建议

- `Alembic` 窗口接入 Core `buildSearchResponseMeta()` 或等价 shape，在 `/api/v1/search` response 中暴露 `route="resident-service"`、requested/actual mode、semantic/vector 使用状态、workspace identity、residentVector 与耗时。
- `Alembic` 窗口必须提供真实 `mode=semantic` 查询证据，证明 Ollama / qwen3 embedding 到 HNSW 的链路返回实际 Recipe 命中。
- 总控在 Alembic 回填前不要派发 `AlembicPlugin`；Plugin 不应猜 API shape，也不应继续把 placeholder embed 当作可执行向量能力。
