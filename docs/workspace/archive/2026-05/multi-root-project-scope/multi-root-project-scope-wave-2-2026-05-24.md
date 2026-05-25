# Multi Root Project Scope Wave 2

状态：第二波 Alembic producer 已验收
维护窗口：AlembicWorkspace
派发时间（北京时间）：2026-05-24 22:58 CST

## 最终目标

让 Alembic 支持“一抽象 Project 对多实体 Folder”的一致 ProjectScope 模型，使 `AlembicWorkspace` 下的 `Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin` 能被用户显式绑定为同一个 Alembic Project，并在任一绑定 folder 的 Codex 窗口中通过 Plugin 使用同一 Project 级知识库。

硬约束：

- `Project` 是抽象项目边界；`Folder` 是实体源码目录 / 仓库。
- `AlembicWorkspace` 根目录只作为 `controlRoot`，不进入源码 `folders[]`。
- 新 ProjectScope 统一使用 Ghost dataRoot；standard / project-root 写入不做兼容、迁移、降级或分叉。
- 第一版只做 folder add / list / resolve，不做 folder remove / disable。
- Plugin 不是项目控制台；多 folder 绑定由 Alembic / Core 生产，Plugin 消费。

## 前置证据

- 原始计划书：[../../requirement-designs/multi-root-project-scope/original-plan-2026-05-24.md](../../../../requirement-designs/multi-root-project-scope/original-plan-2026-05-24.md)
- 需求设计：[../../requirement-designs/multi-root-project-scope/requirement-design-2026-05-24.md](../../../../requirement-designs/multi-root-project-scope/requirement-design-2026-05-24.md)
- 代码实现依赖调研：[../../requirement-designs/multi-root-project-scope/code-implementation-dependency-research-2026-05-24.md](../../../../requirement-designs/multi-root-project-scope/code-implementation-dependency-research-2026-05-24.md)
- 目标阶段确认：[multi-root-project-scope-goal-stage-confirmation-2026-05-24.md](../../../current/multi-root-project-scope-goal-stage-confirmation-2026-05-24.md)
- 第一波执行计划：[multi-root-project-scope-wave-1-2026-05-24.md](../../../current/multi-root-project-scope-wave-1-2026-05-24.md)
- Core contract 回填：[../../AlembicCore/multi-root-project-scope-core-contract-2026-05-24.md](../../../../AlembicCore/multi-root-project-scope-core-contract-2026-05-24.md)

## Core 验收结论

`AlembicCore` 提交 `b72390f Add multi-root project scope contracts` 已通过总控验收。

验收依据：

- `AlembicCore` 工作区干净。
- `src/shared/ProjectScope.ts` 提供 `ProjectDescriptor`、`ProjectFolderDescriptor`、`ProjectControlRoot`、`ProjectScopeResolution`、`ProjectScopeSummary`、`ProjectScopeEndpointCapability`、registry document 和 source evidence helper。
- contract 固定 Ghost-only：`storage.kind = ghost`、`dataRootSource = ghost-registry`、`standardWriteAllowed = false`、`projectRootWriteAllowed = false`。
- `WorkspaceResolver`、runtime / resident / project runtime contracts 已增加 ProjectScope 字段，给 Alembic health、Plugin resident client 和 Dashboard summary 使用。
- Core 回填验证：`npm run build:check`、targeted tests、`npm run lint`、`git diff --check`、`npm run build`、`npm run smoke:public-api`、`npm run lint:public-api-boundary`、`npm test` 均通过。

验收边界：

- Core 只提供 contract 和 helper；完整 multi-root 目标尚未完成。
- 旧 `ProjectRegistry` standard 单根能力在 legacy 路径仍存在；本主线的新入口不做 standard 兼容 / 降级 / 分叉。
- 下一处真实阻塞点是 Alembic 还不能生产 CLI/API/daemon ProjectScope。

## 当前阶段

第二波 `Alembic` producer 已回填，等待总控验收后解除 `AlembicPlugin` / `AlembicDashboard` 下游阻塞。

下一处真实阻塞点：下游 `AlembicPlugin` / `AlembicDashboard` 尚未消费 Alembic 产出的 ProjectScope CLI/API/health 字段；`AlembicTest` 真实多 folder smoke 仍需等下游接入后再启动。

阻塞点之前能完成：

- Alembic 读取 Core `@alembic/core/shared` ProjectScope contract。
- 在本地增强底座内生产 ProjectScope registry / persistence，固定 Ghost dataRoot。
- CLI 第一版支持 add / list / resolve。
- HTTP / daemon health 输出 ProjectScope summary / capability。
- WorkspaceResolver / ProjectRuntime / JobStore 相关入口使用 Project 级 dataRoot。
- 为 Plugin / Dashboard 后续消费回填稳定 JSON 样例和字段说明。

## 任务包

### MRPS-P2-ALEMBIC

窗口：`Alembic`

阶段目标：让 Alembic 成为 ProjectScope 的真实 producer，提供 CLI/API/daemon health 可消费输出。

主线动作：

- 先读取 workspace `AGENTS.md`、本 wave 文档、`Alembic/AGENTS.md`，并声明当前窗口定位和本轮职责。
- 深入读取真实代码入口：ProjectRegistry / workspace resolver / data root resolver / daemon health / HTTP route / CLI project command / JobStore / ProjectRuntime 相关实现。
- 消费 `@alembic/core/shared` 的 ProjectScope contract，不复制临时类型、不自造字段。
- 建立 ProjectScope 持久化路径：Project 是抽象，Folder 是实体，`controlRoot` 不进入 `folders[]`，storage 固定 Ghost-only。
- 实现或扩展 CLI 第一版 add / list / resolve；命令命名按 Alembic 现有 CLI 风格落地，并在回填里写清示例。
- 实现或扩展 HTTP / daemon route：`/api/v1/project-scope`、`/api/v1/project-scope/folders`、`/api/v1/project-scope/resolve-folder`，以及 daemon health / resident status 中的 ProjectScope summary / capability。
- 确保从任一绑定 folder 启动时，都能 resolve 到同一 `projectScopeId` 和 Project 级 `dataRoot`。
- 让 cold-start / search / prime / project skill 后续可以读取 Project 级 dataRoot；本波至少完成 runtime scope 和 dataRoot 归属，不要求完成 Plugin 消费。
- 更新 targeted tests / fixtures，覆盖 add/list/resolve、controlRoot 不进 folders、Ghost-only、standard 新入口拒绝或不可用、daemon health 字段。

合并 TODO：

- `GTODO-2026-05-24-036`：推进 multi-root ProjectScope 主线第二阶段。
- `GTODO-2026-05-24-030`：仅在 Alembic producer 层保留 project skill 后续 ProjectScope canonical source 所需的 `projectScopeId` / dataRoot 字段，不实现 Plugin visibility mount / runtime export。

明确不包含：

- 不改 `AlembicPlugin` resolver / prime / search / skill 消费逻辑。
- 不改 `AlembicDashboard` UI。
- 不启动 `AlembicTest` smoke。
- 不做 folder remove / disable。
- 不做 standard 兼容、迁移、降级或分叉。
- 不扩大 `AlembicAgent` tool root，不改真实测试项目源码。

验证命令：

- 按 `Alembic/AGENTS.md` 执行 targeted unit / typecheck / lint。
- 至少覆盖 ProjectScope registry / CLI / API route / daemon health / dataRoot resolve 的 targeted tests。
- `git diff --check`。

回填要求：

- 完成范围和提交 hash。
- CLI 命令示例和输出样例。
- API / daemon health JSON 样例，明确 Plugin / Dashboard 后续消费字段。
- ProjectScope registry / dataRoot 保存位置说明，注意不要写入用户私密信息。
- 验证命令和结果。
- 遗留风险、下一波建议，以及 Plugin / Dashboard / Test 是否可以解除阻塞。

## 窗口分派

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>已完成 | `31788bb21b7bba49f571c00949dc02922d6d1c7e` ProjectScope producer 已通过总控验收。 |
| `AlembicCore`<br>已完成 | `b72390f` 已通过总控验收；本波无新任务。 |
| `AlembicPlugin`<br>阻塞 | 等待总控验收 Alembic producer 后消费 resident / health ProjectScope 字段。 |
| `AlembicDashboard`<br>阻塞 | 等待总控验收 Alembic API producer 后消费 ProjectScope summary。 |
| `AlembicAgent`<br>观察中 | 第一版不扩大 tool root，等待后续 multi-folder evidence 需求。 |
| `AlembicTest`<br>观察中 | 等 Alembic / Plugin / Dashboard 接入后再创建 multi-root smoke 测试单。 |

## 可复制分派提示词

发送给：无

```text
先读取 AGENTS.md、docs/workspace/index.md、docs/workspace/current/multi-root-project-scope-wave-2-2026-05-24.md，以及 Alembic/AGENTS.md；先明确声明当前窗口定位和本轮仓库职责，再按照文档领取并完成分配给 Alembic 的任务；完成后回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。
```

不发送给：`AlembicCore`、`Alembic`、`AlembicPlugin`、`AlembicDashboard`、`AlembicAgent`、`AlembicTest`。先由总控验收 Alembic 回填，再启动下游窗口。

## 回填区

### AlembicCore 验收

- 状态：已验收
- 提交 hash：`b72390f Add multi-root project scope contracts`
- 验收时间：2026-05-24 22:58 CST
- 总控结论：Core 已完成 ProjectScope contract 职责；下一阶段启动 Alembic producer。

### Alembic producer 回填

- 状态：已通过总控验收
- 提交 hash：`31788bb21b7bba49f571c00949dc02922d6d1c7e` (`feat: add project scope producer`)
- 完成时间：2026-05-24 23:23 CST
- 完成范围：
  - 新增 `lib/project-scope/ProjectScopeRegistry.ts`，消费 `@alembic/core/shared` 的 ProjectScope contract，提供 Alembic 本地 `project-scopes.json` registry、Ghost-only dataRoot、folder add/list/resolve 和 ProjectScope-aware workspace / daemon path resolver。
  - 新增 HTTP route：`GET /api/v1/project-scope`、`GET|POST /api/v1/project-scope/folders`、`GET|POST /api/v1/project-scope/resolve-folder`，并挂载到 resident API。
  - 新增 CLI 第一版：`alembic project-scope add <folder>`、`alembic project-scope list`、`alembic project-scope resolve [folder]`；只支持 add/list/resolve，不做 remove/disable。
  - daemon health / resident service / search workspace identity / ProjectRuntimeControl / DaemonSupervisor / daemon-server / bootstrap / JobStore factory 已使用 ProjectScope-aware resolver，绑定 folder 可解析到同一 `projectScopeId` 和 Project 级 `dataRoot`。
  - Project skill delivery 仅确认 resolver 已接入 ProjectScope-aware 路径；Plugin visibility mount / runtime export 仍属于 `GTODO-2026-05-24-030`，不能视为本波完成。
- CLI 示例：

```bash
alembic project-scope add ./Alembic --control-root . --role primary-source --json
alembic project-scope add ./AlembicCore --project-scope-id <projectScopeId> --json
alembic project-scope list --json
alembic project-scope resolve ./AlembicCore --json
```

- CLI 输出关键字段样例：

```json
{
  "summary": {
    "projectScopeId": "project-scope:<stable-id>",
    "projectId": "project:<stable-id>",
    "controlRoot": "<workspace-control-root>",
    "controlRootIncludedInFolders": false,
    "dataRoot": "<ghost-data-root>",
    "dataRootSource": "ghost-registry",
    "storageKind": "ghost",
    "standardWriteAllowed": false,
    "projectRootWriteAllowed": false,
    "folders": [
      { "path": "./Alembic", "role": "primary-source", "state": "active" },
      { "path": "./AlembicCore", "role": "source", "state": "active" }
    ]
  }
}
```

- API / daemon health 后续消费字段：

```json
{
  "capabilities": {
    "projectScope": {
      "available": true,
      "storageKind": "ghost",
      "endpoints": {
        "readScope": "/api/v1/project-scope",
        "listFolders": "/api/v1/project-scope/folders",
        "addFolder": "/api/v1/project-scope/folders",
        "resolveFolder": "/api/v1/project-scope/resolve-folder"
      },
      "supportedOperations": [
        "project-scope.read",
        "project-folders.add",
        "project-folders.list",
        "project-folders.resolve"
      ]
    }
  },
  "projectScopeId": "project-scope:<stable-id>",
  "projectScope": {
    "controlRootIncludedInFolders": false,
    "dataRootSource": "ghost-registry",
    "storageKind": "ghost",
    "folders": []
  },
  "residentService": {
    "serviceScope": {
      "scopeId": "project-scope:<stable-id>",
      "projectIdentity": {
        "projectScopeId": "project-scope:<stable-id>",
        "projectScope": {}
      }
    }
  }
}
```

- ProjectScope registry / dataRoot 保存位置：
  - registry：`$ALEMBIC_HOME/.asd/project-scopes.json`；未设置 `ALEMBIC_HOME` 时使用用户 home 下的 `.asd/project-scopes.json`。
  - dataRoot：`$ALEMBIC_HOME/.asd/workspaces/<projectId>`；未设置 `ALEMBIC_HOME` 时使用用户 home 下的 `.asd/workspaces/<projectId>`。
  - `controlRoot` 只作为抽象 Project 控制边界，不写入 `folders[]`，不会把 workspace 根当成源码扫描 folder。
- 验证命令和结果：
  - `npm run typecheck`：通过。
  - `npm run lint`：通过。
  - `npm run test:unit -- ProjectScopeRegistry.test.ts DaemonCapabilities.test.ts ProjectRuntimeControl.test.ts`：15 tests / 3 files 通过。
  - `npm run lint:agent-extraction-boundary`：通过。
  - `npm run lint:consumer-core-imports`：通过。
  - `git diff --check`：通过。
- 遗留风险：
  - 本波未做 folder remove / disable，符合第一版约束；后续若要解绑 folder 需新增 contract 和迁移策略。
  - ProjectScope registry 首版是本地 JSON 文件，未做跨进程复杂并发合并；当前 add/list/resolve 和 daemon 启动场景可用。
  - HTTP route 已有 targeted handler 测试；当前沙箱禁止本地端口 listen，未在本轮执行真实端口 smoke。
- 下一步建议：
  - 总控验收 Alembic producer 后，解除 `AlembicPlugin` / `AlembicDashboard` 阻塞，启动下游消费 `/api/v1/project-scope`、health `capabilities.projectScope`、`projectScope` / `projectScopeId`。
  - 下游接入完成后再启动 `AlembicTest`，做真实 `AlembicWorkspace` 多 folder 绑定与任一 folder Codex 窗口共享 Project dataRoot 的 smoke。

### 总控验收

- 验收时间：2026-05-24 23:33 CST
- 验收结论：通过，可解除 `AlembicPlugin` / `AlembicDashboard` 下游阻塞。
- 代码事实：
  - `Alembic/lib/project-scope/ProjectScopeRegistry.ts` 消费 `@alembic/core/shared` ProjectScope contract，持久化 `$ALEMBIC_HOME/.asd/project-scopes.json`，固定 Ghost-only `dataRoot`，并实现 folder add / list / resolve。
  - `Alembic/bin/cli.ts` 暴露 `alembic project-scope add/list/resolve`；第一版没有 remove / disable，符合用户确认范围。
  - `Alembic/lib/http/HttpServer.ts` 挂载 `/api/v1/project-scope`；`Alembic/lib/http/routes/project-scope.ts` 暴露 read/list/add/resolve HTTP producer。
  - `Alembic/lib/http/routes/daemon.ts` 在 health / resident service capability 中声明 `capabilities.projectScope`，并让 service scope 使用 `project-scope:<id>`。
  - `Alembic/lib/daemon/ProjectRuntimeControl.ts`、`DaemonSupervisor.ts`、`bin/daemon-server.ts`、`lib/bootstrap.ts`、`lib/http/routes/search.ts` 已切到 ProjectScope-aware workspace / daemon path resolver。
  - `Alembic/test/unit/ProjectScopeRegistry.test.ts` 覆盖 Ghost-only、controlRoot 不进入 `folders[]`、同 ProjectScope 多 folder 解析到同一 dataRoot、HTTP add/list/resolve。
  - `Alembic/test/unit/DaemonCapabilities.test.ts` 覆盖 daemon capability、resident service scope 和 ProjectScope identity。
- 验收风险：
  - 本波未做真实端口 smoke，保留到 `AlembicTest` multi-root smoke。
  - Project-level skill visibility mount 没有关闭，继续保留在 `GTODO-2026-05-24-030`；下游不得把本波视为 multi-root project skill runtime 可见性完成。
