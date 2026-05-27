# Multi Root ProjectScope Core Contract

状态：AlembicCore 已完成，等待 Alembic / AlembicPlugin / AlembicDashboard 消费
提交：`b72390f Add multi-root project scope contracts`
日期：2026-05-24

## 本轮定位

本轮只在 `AlembicCore` 建立共享、确定性、可复用的 ProjectScope contract，不实现 Alembic CLI / HTTP / daemon producer，不实现 Plugin resolver，不实现 Dashboard UI，不实现 Agent tool root 扩展。

## 完成范围

- 新增 `src/shared/ProjectScope.ts`，提供抽象 Project 与实体 Folder 的稳定模型。
- `ProjectDescriptor` / `ProjectFolderDescriptor` / `ProjectControlRoot` / `ProjectScopeResolution` 已覆盖 Project、Folder、controlRoot、Ghost-only storage、folder add / list / resolve。
- 新增纯 registry contract：`ProjectScopeRegistryDocument`、`createProjectScopeRegistryDocument`、`addProjectScopeFolderToRegistry`、`resolveProjectScopeRegistryFolder`。
- `WorkspaceResolver` 增加 `projectScope` 输入与 `toFacts()` 投影，保留旧单 `projectRoot` 行为；传入 ProjectScope 后，`projectRoot` 仍是当前源码 folder，`dataRoot` 固定为 Project 级 Ghost dataRoot。
- runtime / resident / project runtime contracts 增加 ProjectScope summary / capability 字段，供 Alembic health、Plugin resident client 和 Dashboard project summary 消费。
- sourceRef / evidenceRef 层预留 `projectScopeId`、`folderId`、`folderPath`、`relativePath`、`sourceKind`，本轮只做 Core contract，不要求 Alembic 真实产出。
- public API smoke 已把 ProjectScope helpers 纳入 `@alembic/core/shared` 稳定入口检查。

## 核心字段

- `ProjectDescriptor.projectScopeId`：抽象 ProjectScope 的稳定 ID。
- `ProjectDescriptor.projectId`：Project identity，可与现有 registry project id 对齐。
- `ProjectDescriptor.controlRoot`：控制入口，例如 workspace 根；`includedInFolders` 固定为 `false`。
- `ProjectDescriptor.folders[]`：源码实体目录列表；第一版只允许 `state: active`，不做 remove / disable。
- `ProjectDescriptor.storage.kind`：固定 `ghost`。
- `ProjectDescriptor.storage.dataRootSource`：固定 `ghost-registry`。
- `ProjectDescriptor.storage.standardWriteAllowed`：固定 `false`。
- `ProjectDescriptor.storage.projectRootWriteAllowed`：固定 `false`。
- `ProjectScopeResolution.currentFolderId`：当前启动目录匹配到的 folder id；支持当前目录位于绑定 folder 内部。
- `ProjectScopeSummary`：给 health / resident / Dashboard 的轻量投影，包含 `controlRoot`、`folders`、`currentFolderId`、`dataRoot`、`storageKind`。
- `ProjectScopeEndpointCapability`：固定支持 `project-scope.read`、`project-folders.add`、`project-folders.list`、`project-folders.resolve`，并显式声明不支持 remove / disable / standard storage。

## 下游消费建议

### Alembic

- 作为 ProjectScope producer，下一波应在 CLI / daemon / API 中创建 ProjectScope，并把 `AlembicWorkspace` 根作为 `controlRoot`，不要放入 `folders[]`。
- 新 ProjectScope 只能写入 Ghost dataRoot；不要增加 standard / project-root 写入兼容分支。
- daemon health 应通过 `createAlembicRuntimeProjectIdentity` / `createAlembicRuntimeCapabilities` 填充 `projectScope` 与 `projectScope` capability。
- CLI 第一版只做 folder add / list / resolve；不要实现 remove / disable。

### AlembicPlugin

- Plugin 不是项目控制台，只消费 Alembic resident / health 提供的 ProjectScope。
- 从当前 cwd / folder 解析出 `projectScopeId`、`currentFolderId`、Project 级 `dataRoot` 后，再进行 search / bootstrap / rescan / project skill 读取。
- 无 Alembic resident producer 时，仍可先维持单 folder Project fallback，但不要伪造 multi-folder 合并。

### AlembicDashboard

- 等 Alembic API producer 完成后，只做最小 folder list / add 展示。
- UI 不应把 `controlRoot` 当源码 folder，也不应提供 remove / disable 控件。

### AlembicAgent

- 第一版观察即可，不扩大 tool root。
- 后续若要把多 folder source evidence 传给 Agent，应使用 Core 的 `ProjectScopeEvidenceRef` / `createProjectScopeSourceRef` 字段，而不是自行发明 folder metadata。

## 验证记录

- `npm run build:check`：通过。
- `npm test -- ProjectScopeContracts WorkspaceResolver RuntimeContracts ResidentServiceContracts ProjectRuntimeContracts`：5 files / 27 tests 通过。
- `npm run lint`：通过。
- `git diff --check`：通过。
- `npm run build`：通过。
- `npm run smoke:public-api`：通过，75 exact public API entrypoints imported。
- `npm run lint:public-api-boundary`：通过，136 package exports classified。
- `npm test`：69 files / 969 tests 通过。

## 遗留风险

- Core 本轮只提供 contract 和纯 helper，实际 registry 持久化、CLI/API route、daemon health 填充仍需 Alembic 实现。
- 现有 `ProjectRegistry` legacy standard 能力仍存在于旧单根路径；新 ProjectScope contract 已封禁 standard 作为新入口，但旧逻辑删除 / 收敛需要 Alembic 后续独立处理。
- Plugin / Dashboard 还没有消费 ProjectScope，不能视为完整 multi-root 闭环完成。
- AlembicTest smoke 需等 Alembic / Plugin / Dashboard 接入后再创建。

## 下一步建议

- 下一波启动 `Alembic`：消费 `@alembic/core/shared` 的 ProjectScope contract，生产 CLI/API/daemon ProjectScope，并回填 fields sample。
- `Alembic` 完成后再启动 `AlembicPlugin`：从 resident health / API 解析当前 folder 到 ProjectScope，消费 Project 级 dataRoot。
- Dashboard 等 Alembic API 字段稳定后再启动；AlembicTest 等实现窗口完成后再做 multi-root smoke。
