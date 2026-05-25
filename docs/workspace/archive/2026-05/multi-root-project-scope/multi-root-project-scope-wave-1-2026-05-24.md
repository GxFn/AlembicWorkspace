# Multi Root Project Scope Wave 1

状态：第一波 AlembicCore 已验收，进入第二波 Alembic producer
维护窗口：AlembicWorkspace
派发时间（北京时间）：2026-05-24 22:14 CST

## 最终目标

让 Alembic 支持“一抽象 Project 对多实体 Folder”的一致 ProjectScope 模型，使 `AlembicWorkspace` 下的 `Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin` 能被用户显式绑定为同一个 Alembic Project，并在任一绑定 folder 的 Codex 窗口中通过 Plugin 使用同一 Project 级知识库。

硬约束：

- `Project` 是抽象项目边界；`Folder` 是实体源码目录 / 仓库。
- `AlembicWorkspace` 根目录只作为 `controlRoot`，不进入源码 `folders[]`。
- 新 ProjectScope 统一使用 Ghost dataRoot；standard / project-root 写入不做兼容、迁移、降级或分叉。
- 第一版只做 folder add / list / resolve，不做 folder remove / disable。
- Plugin 不是项目控制台；多 folder 绑定由 Alembic / Core 生产，Plugin 消费。

完成定义：

- Core contract 能表达 Project / Folder / controlRoot / Ghost-only storage。
- Alembic 能生产 CLI/API/daemon ProjectScope。
- Plugin 能从当前 folder 解析到 ProjectScope 并消费 project knowledge。
- cold-start / search / prime / project skill 使用 Project 级 dataRoot，并保留 folder 级证据。
- Dashboard 能最小展示 / 添加 Project folders。
- AlembicTest 以 AlembicWorkspace 自身完成 multi-root smoke。

## 前置文档

- 原始计划书：[../../requirement-designs/multi-root-project-scope/original-plan-2026-05-24.md](../../../../requirement-designs/multi-root-project-scope/original-plan-2026-05-24.md)
- 代码实现依赖调研：[../../requirement-designs/multi-root-project-scope/code-implementation-dependency-research-2026-05-24.md](../../../../requirement-designs/multi-root-project-scope/code-implementation-dependency-research-2026-05-24.md)
- 需求设计：[../../requirement-designs/multi-root-project-scope/requirement-design-2026-05-24.md](../../../../requirement-designs/multi-root-project-scope/requirement-design-2026-05-24.md)
- 目标阶段确认：[multi-root-project-scope-goal-stage-confirmation-2026-05-24.md](../../../current/multi-root-project-scope-goal-stage-confirmation-2026-05-24.md)

## 当前阶段

第一波只启动 `AlembicCore`，现已通过总控验收。

下一处真实阻塞点：Core 没有 ProjectScope / Folder / controlRoot / Ghost-only storage contract，导致 Alembic、Plugin、Dashboard、Agent 都只能继续猜字段。

阻塞点之前能完成：Core contract、registry v2 schema、folder add/list/resolve contract、single folder 与 multi-folder 的统一 Ghost-only ProjectScope、WorkspaceResolver facts extension、runtime/resident shared contract extension、sourceRef folder metadata 建议和 targeted tests。

## 任务包

### MRPS-P1-CORE

窗口：`AlembicCore`

阶段目标：生产可被 Alembic / Plugin / Dashboard / Agent 消费的 ProjectScope contract。

主线动作：

- 先读取 workspace `AGENTS.md`、本 wave 文档、`AlembicCore/AGENTS.md`，并声明当前窗口定位和本轮职责。
- 深入读取真实代码入口：`ProjectRegistry`、`WorkspaceResolver`、runtime / resident contracts、project intelligence sourceRef 相关类型。
- 设计并实现 ProjectDescriptor / ProjectFolderDescriptor / ProjectControlRoot / ProjectScopeResolution。
- 升级 registry contract 到 ProjectScope 语义，支持 folder add / list / resolve。
- 新 ProjectScope 固定 Ghost storage；移除或封禁 standard / project-root 写入作为新入口，不做 standard 兼容、迁移、降级或分叉。
- 保持单 folder 和 multi-folder 使用同一 ProjectScope 逻辑；不要另做 single-folder special branch。
- 扩展 WorkspaceResolver facts，使下游能读取 projectScope、controlRoot、folders、currentFolderId、dataRoot。
- 扩展 runtime / resident shared contracts，给 Alembic health、Plugin resident client、Dashboard project summary 留稳定字段。
- 为 sourceRef / evidenceRef 增加 folder metadata contract 建议，第一波可只做 Core 类型 / projection contract，不要求 Alembic 真实产出。
- 更新或新增 targeted tests，覆盖 Ghost-only、folder add/list/resolve、controlRoot 不进入 folders、standard path 不作为新入口。

合并 TODO：

- `GTODO-2026-05-24-030`：仅在 Core contract 层预留 projectScopeId / skill target roots 所需字段，不实现 Plugin runtime export。

明确不包含：

- 不实现 Alembic CLI / HTTP / daemon。
- 不改 Plugin / Dashboard / Agent 代码。
- 不做 file monitor / knowledge evolution。
- 不做 folder remove / disable。
- 不做 standard 兼容、迁移、降级或分叉。

验证命令：

- 按 `AlembicCore/AGENTS.md` 执行 targeted unit / typecheck / lint。
- 至少运行与 ProjectRegistry / WorkspaceResolver / daemon contract 相关的 targeted tests。
- `git diff --check`。

回填要求：

- 完成范围。
- 提交 hash。
- 验证命令和结果。
- ProjectScope contract 字段说明。
- 明确哪些字段给 Alembic、Plugin、Dashboard、Agent 下游消费。
- 遗留风险和下一波建议。

## 窗口分派

| 窗口 / 状态 | 任务 |
| --- | --- |
| `AlembicCore`<br>已完成 | `MRPS-P1-CORE` 已通过总控验收，提交 `b72390f`。 |
| `Alembic`<br>待启动 | 第二波 producer 接入见 [multi-root-project-scope-wave-2-2026-05-24.md](../../../current/multi-root-project-scope-wave-2-2026-05-24.md)。 |
| `AlembicPlugin`<br>阻塞 | 等待 Alembic resident ProjectScope producer。 |
| `AlembicDashboard`<br>阻塞 | 等待 Alembic API。 |
| `AlembicAgent`<br>观察中 | 等待 Core contract，第一版不扩大 tool root。 |
| `AlembicTest`<br>观察中 | 等待实现窗口完成后创建 smoke 测试单。 |

## 可复制分派提示词

发送给：`Alembic`

```text
先读取 AGENTS.md、docs/workspace/index.md、docs/workspace/current/multi-root-project-scope-wave-2-2026-05-24.md，以及 Alembic/AGENTS.md；先明确声明当前窗口定位和本轮仓库职责，再按照文档领取并完成分配给 Alembic 的任务；完成后回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。
```

不发送给：`AlembicCore` 已完成；`AlembicPlugin`、`AlembicDashboard`、`AlembicAgent`、`AlembicTest` 仍等待 Alembic producer。

## 回填区

### AlembicCore

- 状态：已回填，待总控验收
- 提交 hash：`b72390f Add multi-root project scope contracts`
- 详细记录：[../../AlembicCore/multi-root-project-scope-core-contract-2026-05-24.md](../../../../AlembicCore/multi-root-project-scope-core-contract-2026-05-24.md)
- 完成范围：
  - 新增 `src/shared/ProjectScope.ts`，实现 `ProjectDescriptor`、`ProjectFolderDescriptor`、`ProjectControlRoot`、`ProjectScopeResolution`、`ProjectScopeSummary`、`ProjectScopeEndpointCapability`。
  - 新增 ProjectScope 纯 registry contract：`ProjectScopeRegistryDocument`、`createProjectScopeRegistryDocument`、`addProjectScopeFolderToRegistry`、`resolveProjectScopeRegistryFolder`。
  - 新 ProjectScope 固定 Ghost storage：`storage.kind = ghost`、`dataRootSource = ghost-registry`、`standardWriteAllowed = false`、`projectRootWriteAllowed = false`；`storage.kind = standard` 会被拒绝。
  - `WorkspaceResolver` 支持传入 `projectScope`，`toFacts()` 输出 `projectScope`、`projectScopeId`、`controlRoot`、`folders`、`currentFolderId`、Project 级 `dataRoot`。
  - runtime / resident / project runtime contracts 增加 ProjectScope summary / capability 字段，供 Alembic health、Plugin resident client 和 Dashboard summary 消费。
  - sourceRef / evidenceRef 增加 `projectScopeId`、`folderId`、`folderPath`、`relativePath`、`sourceKind` contract helper。
  - public API smoke 已把 ProjectScope helper 纳入 `@alembic/core/shared` 检查。
- 字段样例：
  - `ProjectDescriptor.projectScopeId`: `scope-alembic`
  - `ProjectDescriptor.controlRoot.path`: workspace 控制根，且 `includedInFolders: false`
  - `ProjectDescriptor.folders[]`: `{ id, path, displayName, role, state: active, repositoryId, realpath }`
  - `ProjectDescriptor.storage`: `{ kind: ghost, dataRoot, dataRootSource: ghost-registry, standardWriteAllowed: false, projectRootWriteAllowed: false }`
  - `ProjectScopeResolution`: `{ matched, currentFolderId, currentFolder, projectScopeId, dataRoot, reason }`
  - `ProjectScopeSummary`: `{ projectScopeId, projectId, controlRoot, folders, currentFolderId, dataRoot, storageKind: ghost }`
- 下游消费字段：
  - `Alembic`：生产 `ProjectDescriptor`，CLI/API/daemon health 填充 `projectScope`、`ProjectScopeEndpointCapability`、Project 级 `dataRoot`。
  - `AlembicPlugin`：消费 resident / health 的 `projectScopeId`、`currentFolderId`、`dataRoot`，从当前 folder 解析到同一 Project。
  - `AlembicDashboard`：消费 `ProjectScopeSummary.folders[]` 与 add/list/resolve capability，最小展示和添加 folder。
  - `AlembicAgent`：后续如需多 folder 证据，使用 `ProjectScopeEvidenceRef`，第一版不扩大 tool root。
- 验证命令：
  - `npm run build:check`
  - `npm test -- ProjectScopeContracts WorkspaceResolver RuntimeContracts ResidentServiceContracts ProjectRuntimeContracts`
  - `npm run lint`
  - `git diff --check`
  - `npm run build`
  - `npm run smoke:public-api`
  - `npm run lint:public-api-boundary`
  - `npm test`
- 验证结果：
  - `npm run build:check`：通过。
  - targeted tests：5 files / 27 tests 通过。
  - `npm run lint`：通过。
  - `git diff --check`：通过。
  - `npm run build`：通过。
  - `npm run smoke:public-api`：通过，Imported 75 exact public API entrypoints。
  - `npm run lint:public-api-boundary`：通过，136 package exports classified。
  - `npm test`：69 files / 969 tests 通过。
- 遗留风险：
  - Core 本轮只提供 contract 和纯 helper；Alembic CLI/API/daemon producer 尚未实现。
  - 旧 `ProjectRegistry` 的 standard 单根能力仍存在于 legacy 路径；新 ProjectScope contract 已封禁 standard 作为新入口，但旧路径收敛需要 Alembic 后续处理。
  - Plugin、Dashboard、AlembicTest 还未消费，不能视为完整 multi-root 闭环完成。
- 下一步建议：
  - 总控验收 Core 后启动 `Alembic` 下一波，消费 Core contract 生产 CLI/API/daemon ProjectScope。
  - `Alembic` 回填 health/API 字段后，再启动 `AlembicPlugin` resolver 和 `AlembicDashboard` 最小 folder 管理。
  - `AlembicTest` 等 Alembic / Plugin / Dashboard 接入后再创建 multi-root smoke 测试单。

### 总控验收

- 状态：已验收
- 验收时间：2026-05-24 22:58 CST
- 结论：`AlembicCore` 提交 `b72390f` 工作区干净，ProjectScope contract、Ghost-only storage、WorkspaceResolver facts、runtime / resident summary、source evidence helper 和验证记录完整。第一波完成，但 multi-root 主线尚未完成；当前已创建第二波计划 [multi-root-project-scope-wave-2-2026-05-24.md](../../../current/multi-root-project-scope-wave-2-2026-05-24.md)，发送给 `Alembic`。
