# Internal Skills 与 Injectable Skills 分层实现计划

本文档给出从基础路径设施到上层 `progressive-chain-validation` 内部 Skill 的实现顺序。目标是按小步提交推进：先让目录名有统一来源，再迁移产品注入 Skill，最后落地 Alembic 内部维护 Skill。

关联设计文档：`docs-dev/progressive-chain-validation-skill-layout.md`。

## 目标状态

最终形成以下语义：

```text
skills/<name>/                    # Alembic 仓库内部维护 Skill，不默认发布，不注入用户项目
injectable-skills/<name>/          # 产品内置注入 Skill，随 npm 包发布，供 MCP / SkillAdapter / delivery 使用
<dataRoot>/<kbDir>/skills/<name>/  # 用户项目级 Skill，Ghost 模式下位于 dataRoot
<projectRoot>/.cursor/skills/      # IDE 注入结果，不是源目录
scratch/chain-runs/<run-id>/       # progressive-chain-validation 单次运行产物
```

实现上要避免继续散落硬编码目录名。所有目录段先收口到统一 folder names 层，再由包路径 resolver、WorkspaceResolver、ProjectMarkers 和 delivery resolver 派生具体路径。

## 非目标

- 不在 Alembic 源码仓库里执行用户项目 `alembic setup`、`alembic embed`、`alembic search` 等命令。
- 不在本仓库创建 `.asd/`、`Alembic/candidates/`、`Alembic/wiki/` 等用户项目运行时目录。
- 不把用户项目级 `<dataRoot>/<kbDir>/skills/` 改名。
- 不把 IDE 输出 `.cursor/skills/` 改名。
- 不把 legacy `<dataRoot>/.asd/skills/` 改名，只保留迁移兼容。

## 实施原则

- 基础设施先行：先建立 `folder-names` 和路径派生 API，再改业务调用点。
- 行为兼容优先：每一阶段都保持现有产品 builtin Skill 能被找到、同步和加载。
- 外部契约保守：`.asd`、`Alembic`、`.cursor/skills` 先集中声明，不开放随意改名。
- Ghost 感知：所有用户项目运行时路径以 `dataRoot` 为基准，真实源码分析仍以 `projectRoot` 为基准。
- 分阶段验证：每一阶段至少有单元测试或 typecheck/lint 覆盖，不把所有风险压到最后。

## 当前实现状态

截至本轮实现，Phase 1-7 的主链路已落地：`folder-names.ts`、包内 `INTERNAL_SKILLS_DIR` / `INJECTABLE_SKILLS_DIR`、核心 Ghost resolver 路径、产品 Skill 目录迁移、产品消费点切换、`ide-paths.ts`、内部 `skills/progressive-chain-validation/` 均已完成。检查实际冷启动链路后，确认旧 `bootstrap/skills.ts` 的 coldstart Skill 维度增强已经不再被调用；当前冷启动依赖 `DimensionRegistry`、`LanguageExtensions` 和 `BootstrapConsumers`，因此不补 `alembic-coldstart` 产品 Skill，并移除该遗留 loader。

仍待后续推进：Phase 8 的可选运行工作台脚本、Phase 9 正式文档更新，以及仓库中更老的 `.asd`/`.cursor` 直接拼路径逐步收口到 resolver/helper。当前已覆盖 CLI 中明显的 `WorkspaceResolver` 手写 `.asd` 路径和主要 delivery/MCP/workflow 的 Cursor 输出路径。

## Phase 0：迁移前盘点与保护线

目标：确认当前所有目录名消费点，先补测试保护现有行为。

工作项：

1. 用 `rg` 盘点 `SKILLS_DIR`、`getProjectSkillsPath`、`'.asd'`、`'.cursor'`、`'Alembic'`、`'templates'`、`'resources'`。
2. 记录产品内置 Skill 清单：当前 `skills/alembic-create`、`skills/alembic-devdocs`、`skills/alembic-guard`、`skills/alembic-recipes`、`skills/alembic-structure`。
3. 给关键行为补回归测试，至少覆盖：
   - `SkillAdapter` 默认不搜索内部 `skills/`，只搜索 injectable builtin 和项目级 Skill。
   - `SkillsSyncer` 从 injectable builtin 同步到 `.cursor/skills/`。
   - 项目级 `<dataRoot>/Alembic/skills/` 在 Ghost dataRoot 下仍可加载。
   - `.cursor/skills`、`.asd/skills`、`Alembic/skills` 的既有契约不被改名。

验收：

```text
npx vitest run test/unit/SkillAdapter.test.ts
npx vitest run test/unit/CursorDeliveryPipeline.test.ts
npx vitest run test/unit/PathGuard.test.ts
```

## Phase 1：Folder Names 基础设施（已完成）

目标：新增无 I/O、无 ConfigService 依赖的目录名默认值和派生函数。

新增文件：

```text
lib/shared/folder-names.ts
test/unit/folder-names.test.ts
```

建议 API：

```ts
export interface AlembicFolderNames { ... }
export type PartialAlembicFolderNames = DeepPartial<AlembicFolderNames>;
export const DEFAULT_FOLDER_NAMES: AlembicFolderNames;
export function resolveFolderNames(overrides?: PartialAlembicFolderNames): AlembicFolderNames;
export function validateFolderNameSegment(name: unknown, label: string): string;
```

规则：

- `DEFAULT_FOLDER_NAMES` 是唯一默认目录名来源。
- `resolveFolderNames()` 做深合并，且校验每个目录段。
- folder name 只能是单段目录名，禁止空字符串、绝对路径、`..`、`/`、`\\`。
- 需要绝对路径覆盖时，未来另建 `PathOverrides`，不混进 folder names。

测试重点：

- 默认值完整。
- 深合并不会丢失未覆盖字段。
- 非法目录段会抛出 `Error` 实例。
- 不依赖文件系统、环境变量或 ConfigService。

## Phase 2：包内路径常量收口（已完成）

目标：让包内目录常量从 folder names 派生，并引入 internal/injectable 双语义。

修改文件：

```text
lib/shared/package-root.ts
package.json
config/default.json
```

目标导出：

```ts
export const CONFIG_DIR = path.join(PACKAGE_ROOT, DEFAULT_FOLDER_NAMES.package.config);
export const INTERNAL_SKILLS_DIR = path.join(PACKAGE_ROOT, DEFAULT_FOLDER_NAMES.package.internalSkills);
export const INJECTABLE_SKILLS_DIR = path.join(PACKAGE_ROOT, DEFAULT_FOLDER_NAMES.package.injectableSkills);
/** @deprecated Use INJECTABLE_SKILLS_DIR for product builtin skills. */
export const SKILLS_DIR = INJECTABLE_SKILLS_DIR;
export const TEMPLATES_DIR = path.join(PACKAGE_ROOT, DEFAULT_FOLDER_NAMES.package.templates);
export const RESOURCES_DIR = path.join(PACKAGE_ROOT, DEFAULT_FOLDER_NAMES.package.resources);
export const DASHBOARD_DIR = path.join(PACKAGE_ROOT, DEFAULT_FOLDER_NAMES.package.dashboard);
```

`config/default.json` 新增：

```json
{
  "paths": {
    "folderNames": {
      "package": {
        "config": "config",
        "dashboard": "dashboard",
        "internalSkills": "skills",
        "injectableSkills": "injectable-skills",
        "resources": "resources",
        "templates": "templates"
      },
      "dev": {
        "scratch": "scratch",
        "chainRuns": "chain-runs"
      }
    }
  }
}
```

实际落地时 `config/default.json` 同步包含 `global`、`project`、`ide` 分组，保持与 `DEFAULT_FOLDER_NAMES` 完整对齐；`package-root.ts` 仍只读取纯默认值，不读取配置文件。

注意：`package-root.ts` 先只使用 `DEFAULT_FOLDER_NAMES`，不读 `config/default.json`，避免 shared 层依赖配置加载生命周期。

验收：

```text
npm run typecheck
npx vitest run test/unit/folder-names.test.ts
```

## Phase 3：项目路径与 Ghost Resolver 收口（核心已完成）

目标：把用户项目和 Ghost dataRoot 相关路径也改为从 folder names 派生，但保留现有导出兼容。

修改文件：

```text
lib/shared/ProjectMarkers.ts
lib/shared/ProjectRegistry.ts
lib/shared/WorkspaceResolver.ts
lib/infrastructure/config/Paths.ts
```

目标行为：

- `DEFAULT_KNOWLEDGE_BASE_DIR` 仍导出，值来自 `DEFAULT_FOLDER_NAMES.project.knowledgeBase`。
- `RUNTIME_DIR` 仍导出，值来自 `DEFAULT_FOLDER_NAMES.project.runtime`。
- `WorkspaceResolver.runtimeDir` 使用 `folderNames.project.runtime`。
- `WorkspaceResolver.skillsDir` 使用 `folderNames.project.skills`。
- `WorkspaceResolver.wikiDir`、`recipesDir`、`candidatesDir` 同理。
- `ProjectRegistry` 的全局 registry 根使用 `folderNames.global.root` 和 `folderNames.global.workspaces`。
- `Paths.ts` 逐步变成兼容薄封装，不新增直接硬编码。

实现策略：

1. 给 `WorkspaceResolver` constructor 增加可选 `folderNames?: PartialAlembicFolderNames`。
2. 默认用 `DEFAULT_FOLDER_NAMES`，所以现有调用点无需一次性修改。
3. `fromProject()` 保持签名兼容，后续可加 overload 或 options。
4. 不在本阶段修改业务服务里的所有 `.asd` 手写路径，只先建立统一入口和关键 resolver。

测试重点：

- 标准模式路径完全等价于现有路径。
- Ghost 模式 `dataRoot` 下的 `runtimeDir`、`skillsDir`、`wikiDir` 正确。
- 传入自定义 `project.skills` 后，resolver 派生路径改变，但默认外部契约不变。

验收：

```text
npx vitest run test/unit/WorkspaceResolver.test.ts
npx vitest run test/unit/PathGuard.test.ts
npm run typecheck
```

## Phase 4：Injectable Skills 目录迁移（已完成）

目标：把产品内置注入 Skill 从根 `skills/` 迁移到 `injectable-skills/`，根 `skills/` 留给内部维护 Skill。

目录操作：

```text
skills/alembic-create      -> injectable-skills/alembic-create
skills/alembic-devdocs     -> injectable-skills/alembic-devdocs
skills/alembic-guard       -> injectable-skills/alembic-guard
skills/alembic-recipes     -> injectable-skills/alembic-recipes
skills/alembic-structure   -> injectable-skills/alembic-structure
不新增 `alembic-coldstart`：旧 coldstart Skill loader 已移除，冷启动不再通过产品 Skill 注入维度 guide
```

同时修改：

```text
package.json files: "skills" -> "injectable-skills"
```

兼容检查：

- 迁移后 `INJECTABLE_SKILLS_DIR` 存在且包含上述 Skill。
- 根 `skills/` 可以暂时为空，或只包含后续内部 Skill。
- `SKILLS_DIR` 过渡期仍指向 `INJECTABLE_SKILLS_DIR`，所以未迁移完的读取点不立即断。

验收：

```text
npm run typecheck
npm run build
```

## Phase 5：产品 Skill 消费点切换（已完成）

目标：把所有“产品 builtin Skill”读取点显式改为 `INJECTABLE_SKILLS_DIR`，减少对 deprecated `SKILLS_DIR` 的依赖。

修改文件：

```text
lib/service/delivery/SkillsSyncer.ts
lib/tools/adapters/SkillAdapter.ts
lib/external/mcp/handlers/skill.ts
lib/workflows/capabilities/execution/WorkflowSkillCompletionCapability.ts
lib/service/skills/SkillHooks.ts
lib/external/mcp/handlers/bootstrap/skills.ts
lib/bootstrap.ts
lib/core/enhancement/EnhancementPack.ts
```

行为要求：

- `SkillsSyncer` builtin 来源为 `INJECTABLE_SKILLS_DIR`。
- `SkillAdapter` 默认 builtin 来源为 `INJECTABLE_SKILLS_DIR`。
- MCP `listSkills`、`loadSkill`、builtin 冲突检查使用 `INJECTABLE_SKILLS_DIR`。
- `WorkflowSkillCompletionCapability` 创建项目 Skill 时只检查 injectable builtin 冲突。
- `SkillHooks` 只扫描 injectable builtin 和项目级 Skill hooks，不扫描内部 `skills/`。
- Bootstrap 不再通过 `alembic-coldstart` Skill 增强维度；旧 loader 应移除，避免缺失文件被误判为需要补齐的产品能力。

测试重点：

- 根 `skills/progressive-chain-validation` 不出现在产品 MCP `listSkills`。
- 根 `skills/progressive-chain-validation` 不被 `SkillAdapter` 默认搜索到。
- `injectable-skills/alembic-create` 仍可被 MCP/SkillAdapter 加载。
- 项目级 Skill 仍优先覆盖同名 builtin。
- `SkillHooks` 不执行内部 Skill 的 `hooks.js`。

验收：

```text
npx vitest run test/unit/SkillAdapter.test.ts
npx vitest run test/unit/CursorDeliveryPipeline.test.ts
npx vitest run test/unit/WorkflowSkillCompletionCapability.test.ts
npx vitest run test/unit/SkillRecommendation.test.ts
npm run typecheck
```

## Phase 6：IDE 与 delivery 路径收口（主要消费点已完成）

目标：把 `.cursor`、`.cursor/skills`、`.cursor/rules` 的路径段集中声明，但保持默认契约不变。

修改文件：

```text
lib/service/delivery/SkillsSyncer.ts
lib/service/delivery/RulesGenerator.ts
lib/service/bootstrap/DeliveryVerifier.ts
lib/service/delivery/CursorDeliveryPipeline.ts
lib/external/mcp/handlers/skill.ts
lib/workflows/capabilities/execution/WorkflowSkillCompletionCapability.ts
```

可新增薄工具：

```text
lib/shared/ide-paths.ts
```

建议 API：

```ts
export function getCursorRoot(projectRoot: string, names = DEFAULT_FOLDER_NAMES): string;
export function getCursorSkillsDir(projectRoot: string, names = DEFAULT_FOLDER_NAMES): string;
export function getCursorRulesDir(projectRoot: string, names = DEFAULT_FOLDER_NAMES): string;
export function getCursorRulesRelativePath(...segments: string[]): string;
export function getCursorSkillsRelativePath(...segments: string[]): string;
```

验收：

```text
npx vitest run test/unit/CursorDeliveryPipeline.test.ts
npx vitest run test/unit/PathGuard.test.ts
npm run typecheck
```

## Phase 7：内部 Skill 包落地（已完成）

目标：在根 `skills/` 下创建 Alembic 内部维护 Skill，不进入产品 builtin 注入链路。

新增目录：

```text
skills/progressive-chain-validation/
  SKILL.md
  templates/
    plan.md
    round.md
    final-report.md
    commands.md
    nodes.json
  references/
    artifact-layout.md
    alembic-adapter.md
    data-location-preflight.md
    safety-boundaries.md
```

Skill 内容要求：

- `SKILL.md` 只放触发条件、执行循环、输入输出契约和安全边界。
- Alembic 专用细节放 `references/alembic-adapter.md`。
- Ghost dataRoot 检测协议放 `references/data-location-preflight.md`。
- 运行产物模板只初始化到 `scratch/chain-runs/<run-id>/`，不写回 `docs-dev/` 或内部 Skill 目录。
- 禁止在 Alembic 源码仓库内执行用户项目命令或创建用户项目运行时目录。

测试/校验：

- 文档 lint 无错误。
- MCP/SkillAdapter 默认列表不包含 `progressive-chain-validation`。
- `package.json.files` 不发布根 `skills/`。

## Phase 8：Progressive Chain Validation 运行工作台（待实施）

目标：让内部 Skill 可以实际指导 Agent 做长链路节点化验证，同时不污染源码仓库。

建议新增可选开发脚本或模板，不作为用户命令：

```text
scripts/dev/init-chain-run.mjs        # 可选：初始化 scratch/chain-runs/<run-id>/
scratch/chain-runs/<run-id>/report/   # 实际运行时生成，不跟随 git
```

首版可以先不写自动脚本，由 Skill 模板指导 Agent 手工创建运行目录。若写脚本，必须满足：

- 只写 `scratch/chain-runs/`。
- 不创建 `.asd/`。
- 不创建 `Alembic/` 知识库目录。
- 不执行用户项目 `alembic` 命令。

运行流程节点：

1. `N0-data-location`：记录 `projectRoot`、`dataRoot`、Ghost registry、DB、knowledge、skills、wiki、candidates 路径。
2. `N1-readonly-model`：只读建模长链路。
3. `N2-node-plan`：生成节点图和验收点。
4. `N3-observability`：补日志、报告或测试入口。
5. `N4..Nn`：逐节点验证、修复、重验。
6. `Final`：生成 evidence summary、风险清单和后续建议。

## Phase 9：文档与发布检查（部分完成）

目标：把目录语义写进正式文档和开发文档，并确认 npm 包发布内容正确。

修改文件：

```text
docs/development.md
docs/development.en.md
docs/technical-reference.md
docs/technical-reference.en.md
README.md 或 README_CN.md 中的相关路径说明
```

检查项：

- 根 `skills/` 被描述为内部维护 Skill。
- `injectable-skills/` 被描述为产品内置注入源。
- 用户项目 `Alembic/skills` 和 IDE `.cursor/skills` 说明保持不变。
- npm `files` 只包含 `injectable-skills`，不包含内部 `skills`。

验收：

```text
npm run build
npm run lint
npm run test:unit
```

## 建议实现顺序

建议按以下小步推进，每一步都可以独立验证：

1. `folder-names.ts` + 单元测试。
2. `package-root.ts` 新增 `INTERNAL_SKILLS_DIR` / `INJECTABLE_SKILLS_DIR`，`SKILLS_DIR` deprecated alias。
3. `WorkspaceResolver` / `ProjectMarkers` / `Paths.ts` 用 folder names 派生默认路径。
4. 新建 `injectable-skills/` 并迁移现有产品 Skill，更新 `package.json.files`。
5. 将产品 builtin 消费点改为 `INJECTABLE_SKILLS_DIR`。
6. 把 `.cursor` 相关路径收口到 IDE path helper。
7. 新建 `skills/progressive-chain-validation/` 内部 Skill 包。
8. 补正式文档、跑完整验证。

## 风险与回滚

| 风险 | 表现 | 缓解 |
|------|------|------|
| builtin Skill 迁移后找不到 | MCP `listSkills` 为空或 SkillAdapter 加载失败 | `SKILLS_DIR` 过渡期指向 `INJECTABLE_SKILLS_DIR`，并给 injectable 目录补测试 |
| 内部 Skill 被误注入用户项目 | `.cursor/skills/progressive-chain-validation` 出现 | `SkillsSyncer`、MCP、SkillAdapter 全部只读 `INJECTABLE_SKILLS_DIR` |
| Ghost 路径回退到 projectRoot | 用户项目被写入 `.asd` 或 `Alembic/skills` | `WorkspaceResolver` 测试覆盖 `dataRoot !== projectRoot` |
| folder names 过度可配置 | 外部契约路径被用户改坏 | `.asd`、`.cursor/skills` 先集中声明并谨慎覆盖，不作为普通用户配置入口 |
| import cycle | shared 层依赖 ConfigService | `DEFAULT_FOLDER_NAMES` 保持纯常量，运行时 override 通过 resolver/DI 注入 |

## 已完成验证切片

本轮代码实现已覆盖以下验证切片：

```text
lib/shared/folder-names.ts
test/unit/folder-names.test.ts
lib/shared/package-root.ts
config/default.json
lib/shared/WorkspaceResolver.ts
lib/shared/ide-paths.ts
test/unit/WorkspaceResolver.test.ts
test/unit/ProjectPaths.test.ts
test/unit/ide-paths.test.ts
```

验证命令以 targeted 方式执行：`npm run typecheck`，以及 folder names、WorkspaceResolver、ProjectPaths、ide-paths、SkillAdapter、CursorDeliveryPipeline、WorkflowSkillCompletionCapability 相关单元测试。