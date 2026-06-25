# RG-0 Recipe Generation migrate-EARLY Plan

日期：2026-06-21
窗口：AlembicPlugin
任务：rg0-plugin-recipe-generation-skeleton-t1

## 范围

本文件是 RG-0 的迁移证据，不是执行记录。RG-0 只建立未来 Recipe generation 的内部绿地位置与 contract：

- 新内部根目录：`lib/recipe-generation/`
- 新内部 import alias：`#recipe-generation/*`
- ProjectContext 是项目事实来源。
- Plan 是确认后的意图权威与 living ledger。
- generation-state 只能从数据库事实读取时投影，不做双写。
- 当前 public MCP 语义不变，不注册 `alembic_plan`。
- 当前不新增 `plans` 表，不改 Core 架构理解，不迁移生产路径。

## 不变量

- B 阶段（Core 架构理解）必须先于 C 阶段（Plan 存储与 `alembic_plan`）。
- C 阶段必须先于 D 阶段（Plan-driven generation）。
- RG-6 的向量可用性修复可与 D 并行，但不能绕开 confirmed Plan precondition。
- 每个 slice 只允许 leaf-first 迁移；handler adapter 可以短期薄 re-export，但不能形成 shim 自导入循环。
- 每个 slice 的绿色检查至少包含：`npm run build:check`、`npm run test:unit`、`npm run lint:layer-boundary`、`npm run lint:core-import-boundary`。

## 8-Slice leaf-first 迁移计划

| 顺序 | Slice | 移动范围 | 显式依赖 | 回滚边界 | Green check |
| --- | --- | --- | --- | --- | --- |
| 1 | 叶子基础设施 | `LocalEmbedding`、`ContextualEnricher`、`project-data-root`、`recipe-region-vector`、`bootstrap-event-types` 迁入 `lib/recipe-generation/` 子树；调用方改用 `#recipe-generation/*` | RG-0 alias 已存在 | 单 slice revert 后旧路径仍可恢复；不删除旧 public surface | build/typecheck/unit/layer/core-import 全绿 |
| 2 | Bootstrap 事件链 | `BootstrapEventEmitter`、knowledge-index-rebuild 与 VectorModule 的 Recipe generation 相关 leaf 逻辑迁入新根 | Slice 1 | 保留旧 handler import adapter；失败时退回旧 imports | build/typecheck/unit/layer/core-import；bootstrap 事件 fixture 通过 |
| 3 | ProjectContext 证据闸 | `project-context-analysis`、`recipe-evidence-gate` 与 tool-router 内相关纯服务依赖迁入新根 | Slice 1、2 | tool-router 只改 import；失败时回滚 import 与新 leaf | build/typecheck/unit/layer/core-import；graph/search/recipe_map characterization 通过 |
| 4 | 生成入口服务 | cold-start、knowledge-rescan、dimension-completion 的 Recipe generation 服务迁入；handler 保持薄 adapter/re-export | Slice 1-3 | adapter 回指旧路径；不改 MCP tool schema | build/typecheck/unit/layer/core-import；cold-start/rescan/dimension tests 通过 |
| 5 | Project knowledge context 树 | `project-knowledge-context` tree 及 recipe_map/search/structure/kc-tools 相关 ProjectContext 投影迁入 | Slice 3、4 | 四工具 public surface 保持不变；失败时按目录整体 revert | build/typecheck/unit/layer/core-import；四工具行为测试通过 |
| 6 | Opportunistic evolution | `PluginOpportunisticEvolution`、git-diff-checkpoint 与 presenter 中 Recipe evolution 相关逻辑迁入 | Slice 1、3 | evolution presenter import 单点回滚；不改变 proposal 状态机 | build/typecheck/unit/layer/core-import；evolution proposal tests 通过 |
| 7 | BootstrapTaskManager | Recipe generation 的任务编排移入新根，保持外部 job contract 不变 | Slice 2、4 | job handler 保持旧 contract；失败时回滚 manager import | build/typecheck/unit/layer/core-import；bootstrap task manager tests 通过 |
| 8 | 旧路径清理 | 删除已替换旧路径、清理 adapter、更新 README/skills 中路径说明 | Slice 1-7 全绿 | 只删除已无 import 的旧实现；import scan 不干净则停止 | build/typecheck/unit/layer/core-import；repo-boundary；runtime package verification |

## 后续包依赖

- RG-1 / RG-2：先补 Core architecture intelligence 与 ProjectContext 建设能力，这是 B 阶段。
- RG-3：在 B 阶段可用后再加入 `plans` 表与 `alembic_plan` draft/confirm/get，这是 C 阶段。
- RG-4 / RG-5：在 confirmed Plan 可用后，把 cold-start/rescan/module mining 改为 Plan-driven generation，这是 D 阶段。
- RG-6：修复向量可用性与时机，可与 D 并行，但不能替代 Plan authority。
- RG-8：统一 evolution 到 Plan/ProjectContext/Recipe 链路。
- RG-9 / RG-10：最后做清理、完整测试与 BiliDili 验证。

## RG-0 验收证据目标

- `lib/recipe-generation/contracts.ts` 只描述 future contract，无生产 side effect。
- `#recipe-generation/*` 能在 unit test 中被解析。
- 当前 `TOOLS`、`PLUGIN_TOOL_SURFACE_CATALOG`、`TOOL_SCHEMAS` 均不包含 `alembic_plan`。
- 四个 public knowledge navigation tools 仍为 `alembic_recipe_map`、`alembic_graph`、`alembic_search`、`alembic_prime`。
