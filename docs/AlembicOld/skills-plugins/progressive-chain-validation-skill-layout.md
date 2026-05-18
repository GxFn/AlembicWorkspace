# Progressive Chain Validation Skill 目录与工作空间设计

本文档定义 `progressive-chain-validation` 作为 Alembic 内部维护 Skill 的落地方式：它放在哪里、运行产物放在哪里、如何兼容 Ghost 模式，以及如何避免和面向用户项目注入的 Skill 混在一起。

定位说明：本文是人工计划/设计文档，因此放在 `docs-dev/`。但 `docs-dev/` 不作为本 Skill 的默认运行产物工作区；单次运行记录和证据统一放在 `scratch/chain-runs/`。真实测试项目和 Alembic 运行时数据必须在源码仓库之外或 Ghost dataRoot 中。

命名结论：仓库根目录 `skills/` 更适合作为 Alembic 自身的内部维护 Skill 目录；当前用于注入用户项目的产品 Skill 源应改名为 `injectable-skills/`。原因是 `skills/` 这个名字在源码仓库里天然表示“给本仓库 Agent 使用的技能”，而“会被同步到用户项目、通过 MCP builtin 暴露、随 npm 包发布”的目录需要一个更明确的产品交付语义。

## 总体结论

采用四层目录：

```text
docs-dev/progressive-chain-validation-skill-layout.md # 本计划/设计文档，不跟随 git
skills/progressive-chain-validation/                  # Alembic 内部维护 Skill，跟随 git，不注入用户项目
injectable-skills/<name>/                             # 产品内置注入 Skill 源，跟随 git，随包发布
scratch/chain-runs/<run-id>/                          # 单次运行记录、证据、临时脚本，不跟随 git
$TMPDIR/alembic-chain-workspaces/<run-id>/            # 真实/复制测试工作空间，必须在源码仓库之外
```

对应职责：

| 层级 | 路径 | 职责 | 是否跟随 git |
|------|------|------|--------------|
| Plan doc | `docs-dev/progressive-chain-validation-skill-layout.md` | 开发期目录语义和边界设计 | 否 |
| Internal Skill package | `skills/progressive-chain-validation/` | Alembic 自维护执行协议、模板、引用资料 | 是 |
| Injectable Skill source | `injectable-skills/<name>/` | 产品内置 Skill 源，供 MCP、SkillAdapter、Cursor delivery 使用 | 是 |
| Run workspace | `scratch/chain-runs/<run-id>/` | 计划、节点记录、证据、日志、临时脚本 | 否 |
| External workspace | `$TMPDIR/alembic-chain-workspaces/<run-id>/` 或用户提供路径 | 真实测试项目、复制项目、临时 DB、可运行 Alembic 用户链路 | 否，且不在 Alembic 源码仓库内 |

严格分离原则：

- `docs-dev/` 放人工计划/设计文档；本文属于这一类。
- `skills/` 放 Alembic 仓库内部维护方法，不写入单次运行产物，不默认注入用户项目。
- `injectable-skills/` 放可注入用户项目的产品 Skill，不放 Alembic 自维护流程 Skill。
- `scratch/chain-runs/` 放本 Skill 的临时运行记录和证据。
- 真实测试项目必须在 Alembic 源码仓库之外。

## Skill 语义分层

Alembic 会同时存在多种 Skill，必须用目录语义区分生命周期和暴露面。

| 类型 | 推荐路径 | 消费方 | 是否注入用户项目 | 说明 |
|------|----------|--------|------------------|------|
| Alembic 内部维护 Skill | `skills/<name>/` | Alembic 仓库维护者、Copilot/开发 Agent | 否 | 用于验证、重构、发布、诊断 Alembic 本身；不能默认同步到用户项目 |
| 产品内置注入 Skill | `injectable-skills/<name>/` | `SkillsSyncer`、MCP `list_skills`、`SkillAdapter`、`SkillHooks` | 是 | 当前已有 `alembic-create`、`alembic-recipes` 等，作为 Alembic 产品能力交付给用户项目 |
| 用户项目级 Skill | `<dataRoot>/<kbDir>/skills/<name>/` | MCP、SkillAdapter、Cursor delivery | 是 | 冷启动或工作流生成的项目知识 Skill；Ghost 模式下位于 `~/.asd/workspaces/<id>/<kbDir>/skills/` |
| IDE 镜像 Skill | `<projectRoot>/.cursor/skills/<name>/` | Cursor Agent | 已是注入结果 | 由 delivery pipeline 生成，不是源目录，不应手工维护 |
| Legacy runtime Skill | `<dataRoot>/.asd/skills/<name>/` | UpgradeService | 否 | 旧路径，仅用于迁移到 `<dataRoot>/<kbDir>/skills/` |

`progressive-chain-validation` 归入“内部维护 Skill”，目标路径是 `skills/progressive-chain-validation/`。它可以指导开发 Agent 修复 Alembic 长链路，但不应出现在用户项目的 `.cursor/skills/` 中，也不应通过产品 MCP 的 builtin Skill 列表默认暴露。

## 代码语义建议

现有代码里 `SKILLS_DIR` 指向仓库根目录 `skills/`，实际语义却是“产品内置注入 Skill 源”。这正是混淆来源。目标状态应让路径名和语义对齐：

```text
INTERNAL_SKILLS_DIR         # 新增，指向 <packageRoot>/skills
INJECTABLE_SKILLS_DIR       # 新增，指向 <packageRoot>/injectable-skills
SKILLS_DIR                  # 过渡期 deprecated alias，临时指向 INJECTABLE_SKILLS_DIR
PROJECT_SKILLS_DIR          # 运行时解析，指向 <dataRoot>/<kbDir>/skills
IDE_DELIVERED_SKILLS_DIR    # 输出目录，指向 <projectRoot>/.cursor/skills
```

默认行为：

- `SkillsSyncer` 只读取 `INJECTABLE_SKILLS_DIR` 和 `PROJECT_SKILLS_DIR`，不读取仓库内部 `skills/`。
- MCP 的 `list_skills`、`skill_load` 默认只暴露产品内置注入 Skill 和用户项目级 Skill。
- `SkillAdapter`、MCP skill handler、`WorkflowSkillCompletionCapability` 的 builtin 冲突检查都使用 `INJECTABLE_SKILLS_DIR`。
- `SkillHooks` 的产品生命周期 hooks 只从 `INJECTABLE_SKILLS_DIR` 和项目级 Skill 读取；仓库内部 `skills/` 不参与运行时 hooks。
- 内部维护 Skill 如需工具加载，应走开发者显式入口，例如 `internal_skill_load`、VS Code agent customization，或由 Copilot 按文件路径读取。
- 内部维护 Skill 可以引用 Alembic 源码、测试、`docs/`、`docs-dev/` 和 `scratch/`，但不能创建用户项目运行时目录。

## 统一目录名配置

趁这次目录语义重构，应把文件夹名抽取成统一配置，不再让各模块手写 `'skills'`、`'.asd'`、`'Alembic'`、`'.cursor'`、`'templates'`、`'scratch'` 等字符串。目标不是把所有外部契约都随意改名，而是让所有路径段都有单一来源、明确默认值、明确哪些允许覆盖。

建议新增一个共享模块：

```text
lib/shared/folder-names.ts
```

建议导出：

```ts
export interface AlembicFolderNames {
  package: {
    config: string;
    dashboard: string;
    templates: string;
    resources: string;
    internalSkills: string;
    injectableSkills: string;
  };
  dev: {
    docs: string;
    scratch: string;
    chainRuns: string;
  };
  global: {
    root: string;
    cache: string;
    snippets: string;
    workspaces: string;
  };
  project: {
    knowledgeBase: string;
    runtime: string;
    cache: string;
    recipes: string;
    candidates: string;
    skills: string;
    wiki: string;
    context: string;
    logs: string;
  };
  ide: {
    cursorRoot: string;
    cursorRules: string;
    cursorSkills: string;
    vscodeRoot: string;
    githubRoot: string;
  };
}

export const DEFAULT_FOLDER_NAMES: AlembicFolderNames = {
  package: {
    config: 'config',
    dashboard: 'dashboard',
    templates: 'templates',
    resources: 'resources',
    internalSkills: 'skills',
    injectableSkills: 'injectable-skills',
  },
  dev: {
    docs: 'docs-dev',
    scratch: 'scratch',
    chainRuns: 'chain-runs',
  },
  global: {
    root: '.asd',
    cache: 'cache',
    snippets: 'snippets',
    workspaces: 'workspaces',
  },
  project: {
    knowledgeBase: 'Alembic',
    runtime: '.asd',
    cache: 'cache',
    recipes: 'recipes',
    candidates: 'candidates',
    skills: 'skills',
    wiki: 'wiki',
    context: 'context',
    logs: 'logs',
  },
  ide: {
    cursorRoot: '.cursor',
    cursorRules: 'rules',
    cursorSkills: 'skills',
    vscodeRoot: '.vscode',
    githubRoot: '.github',
  },
};
```

### 配置层级

目录名配置建议分三层：

| 层级 | 来源 | 用途 | 是否面向用户 |
|------|------|------|--------------|
| Default | `DEFAULT_FOLDER_NAMES` | 所有路径 resolver 的默认值 | 否，代码默认 |
| Package config | `config/default.json` 的 `paths.folderNames` | Alembic 包自身目录、注入源目录、开发目录默认名 | 主要面向开发者 |
| Project config | `<dataRoot>/.asd/config.json` 或 boxspec 中的 path section | 用户项目知识库子目录，如 recipes、skills、wiki | 面向高级用户，必须有迁移兼容 |

`DEFAULT_FOLDER_NAMES` 是唯一硬编码位置。其他模块只能通过 resolver 或派生常量读取目录名，不能直接写字符串。

### 可配置边界

不是所有路径段都应该同等开放配置：

| 路径段 | 默认值 | 配置策略 | 原因 |
|--------|--------|----------|------|
| `package.internalSkills` | `skills` | 可在包内配置，但不建议 npm 发布时覆盖 | Alembic 自维护 Skill 目录 |
| `package.injectableSkills` | `injectable-skills` | 可在包内配置 | 产品内置注入 Skill 源，当前重构重点 |
| `dev.docs` | `docs-dev` | 只作为开发约定配置，不由 Skill 自动写入 | 用户用来存人工计划文档 |
| `dev.scratch` | `scratch` | 可配置 | 本地临时产物根目录 |
| `global.root` | `.asd` | 集中声明，谨慎覆盖 | 全局 registry、cache、Ghost workspace 依赖它 |
| `project.knowledgeBase` | `Alembic` | 已支持探测和覆盖，继续保留 | 用户项目知识库根目录 |
| `project.runtime` | `.asd` | 集中声明，谨慎覆盖 | 大量历史路径和迁移依赖 |
| `project.cache` | `cache` | 集中声明，谨慎覆盖 | 项目运行时缓存目录 `<dataRoot>/.asd/cache` |
| `project.skills` | `skills` | 可配置但默认保持 | 用户项目级 Skill 源，属于 Alembic 知识库结构 |
| `ide.cursorRoot` / `ide.cursorSkills` | `.cursor` / `skills` | 集中声明，不建议改默认 | Cursor Agent Skills 输出契约 |

### Resolver 规则

目录名配置要落到 resolver，而不是让业务代码自己拼路径：

- `package-root.ts` 负责包内路径：`INTERNAL_SKILLS_DIR`、`INJECTABLE_SKILLS_DIR`、`TEMPLATES_DIR`、`RESOURCES_DIR`。
- `WorkspaceResolver` 负责用户项目和 Ghost 模式路径：`runtimeDir`、`skillsDir`、`recipesDir`、`wikiDir`、`candidatesDir`。
- `ProjectMarkers` 负责项目探测：`knowledgeBase`、`runtime`、`spec` 等 marker 名称。
- `Paths.ts` 只保留对 resolver 的薄封装，不再直接写 `'skills'`、`'.asd'`。
- `ide-paths.ts` 负责 IDE 输出路径：`.cursor`、`.cursor/skills`、`.cursor/rules` 以及 WriteZone 相对路径。
- delivery 相关模块只通过 `ide-paths.ts` 或 resolver 获取 `.cursor/skills`、`.cursor/rules`。

实现上要避免让 `package-root.ts` 直接依赖运行时 `ConfigService`。建议拆成两类 API：

```text
DEFAULT_FOLDER_NAMES                         # 纯默认值，无 I/O，无依赖
resolveFolderNames(overrides?)               # 合并默认值和显式 override
createPackagePaths(packageRoot, names)        # 包内路径派生
createWorkspacePaths(projectRoot, dataRoot, names) # 项目/Ghost 路径派生
```

静态导出的 `PACKAGE_ROOT`、`INTERNAL_SKILLS_DIR`、`INJECTABLE_SKILLS_DIR` 可以先使用 `DEFAULT_FOLDER_NAMES`。需要项目级 override 的服务，通过 `WorkspaceResolver` 或依赖注入拿到已合并的 folder names。这样既能集中配置，又不会把底层 shared 模块绑到配置加载生命周期上。

### 目录名硬编码盘点

这次不只改 `skills`，还应该把同类目录名统一收口：

| 目录名 | 当前典型位置 | 目标收口 |
|--------|--------------|----------|
| `skills` | `WorkspaceResolver`、`Paths.ts`、`SkillsSyncer`、`SkillAdapter`、MCP skill handler | 区分 `package.internalSkills`、`package.injectableSkills`、`project.skills`、`ide.cursorSkills` |
| `.asd` | `WorkspaceResolver`、`ProjectRegistry`、`PathGuard`、`WriteZone`、`TerminalArtifacts`、report/log/session 相关模块 | 统一为 `global.root` 和 `project.runtime`，由 resolver 派生 |
| `Alembic` | `ProjectMarkers`、`SetupService`、`FileDeployer`、wiki/skill path 构造 | 统一为 `project.knowledgeBase`，保持探测兼容 |
| `.cursor` | `SkillsSyncer`、`RulesGenerator`、`DeliveryVerifier`、`CursorDeliveryPipeline`、MCP skill index 生成 | 统一为 `ide.cursorRoot`，子目录用 `ide.cursorSkills` / `ide.cursorRules` |
| `templates` / `resources` / `config` | `package-root.ts`、delivery/deploy 模块 | 统一为 `package.templates`、`package.resources`、`package.config` |
| `scratch` / `chain-runs` | 本 Skill 设计文档和未来初始化脚本 | 统一为 `dev.scratch`、`dev.chainRuns` |

路径段必须作为单段目录名校验，不能允许包含 `..`、绝对路径、路径分隔符或空字符串。需要支持自定义绝对路径的场景，应新增单独的 `PathOverrides`，不要混进 folder names。

### 兼容策略

迁移时要避免一次性破坏旧路径：

1. 先新增 `folder-names.ts` 和新常量，不移动目录。
2. 让 `SKILLS_DIR` 过渡期指向 `INJECTABLE_SKILLS_DIR`，保证现有 product builtin 行为不变。
3. 新增 `INTERNAL_SKILLS_DIR` 指向根 `skills/`，但先只给开发 Agent 使用，不接入产品运行时。
4. 将现有产品 Skill 目录复制或移动到 `injectable-skills/`，保留一轮兼容检查。
5. 修改 `package.json.files` 发布 `injectable-skills`，默认不发布内部 `skills`。
6. 修改所有产品 builtin 读取点使用 `INJECTABLE_SKILLS_DIR`。
7. 最后将 `SKILLS_DIR` 标记为 deprecated，后续移除或改成仅内部 alias。

### Progressive Chain Validation 的使用方式

`progressive-chain-validation` 不直接写死目录名，而是读取同一份 folder names：

```text
folderNames.package.internalSkills/progressive-chain-validation/
folderNames.dev.scratch/folderNames.dev.chainRuns/<run-id>/
folderNames.global.root/workspaces/<project-id>/
folderNames.project.knowledgeBase/folderNames.project.skills/
folderNames.ide.cursorRoot/folderNames.ide.cursorSkills/
```

这样后续如果 `injectable-skills/`、`scratch/` 或项目知识库名有调整，Skill 的文档、模板、初始化脚本和校验脚本都能从同一个配置面更新。

## 修改点盘点

如果采用“`skills/` 内部化、注入源改为 `injectable-skills/`”的目标语义，需要改动以下位置。

| 模块 | 当前行为 | 目标修改 |
|------|----------|----------|
| `lib/shared/folder-names.ts` | 不存在，目录名分散在多个模块 | 新增统一 `DEFAULT_FOLDER_NAMES`、类型和读取/合并函数 |
| `skills/` 目录 | 存放 `alembic-create`、`alembic-recipes` 等产品内置 Skill | 移动现有产品 Skill 到 `injectable-skills/`；`skills/` 改放 Alembic 内部维护 Skill |
| `package.json.files` | 发布 `skills` | 改为发布 `injectable-skills`；默认不发布内部 `skills` |
| `config/default.json` | 没有统一 folder names 配置 | 新增 `paths.folderNames`，覆盖包内和开发目录默认名 |
| `lib/shared/package-root.ts` | `SKILLS_DIR = <root>/skills`，其他包目录也直接写字符串 | 从 `DEFAULT_FOLDER_NAMES.package` 派生 `INTERNAL_SKILLS_DIR`、`INJECTABLE_SKILLS_DIR`、`TEMPLATES_DIR` 等；`SKILLS_DIR` 过渡期指向 `INJECTABLE_SKILLS_DIR` |
| `lib/shared/ProjectMarkers.ts` | `DEFAULT_KNOWLEDGE_BASE_DIR`、`RUNTIME_DIR`、`SPEC_FILENAME` 分散为常量 | 从 folder names / path conventions 派生，保持旧导出兼容 |
| `lib/shared/WorkspaceResolver.ts` | 直接拼 `'.asd'`、`'skills'`、`'wiki'`、`'candidates'` | 从 folder names 派生所有 runtime 和知识库子目录 |
| `lib/infrastructure/config/Paths.ts` | 直接拼 `'.asd'`、`'skills'` 等项目路径 | 改为 resolver 薄封装或 folder names 派生函数 |
| `lib/shared/ide-paths.ts` | 不存在，`.cursor` 路径散落在 delivery/MCP/CLI 中 | 新增 IDE path helper，派生 Cursor root/rules/skills 和相对路径 |
| `lib/service/delivery/SkillsSyncer.ts` | 从包内 `skills/` 同步 builtin 到 `.cursor/skills/` | 从 `INJECTABLE_SKILLS_DIR` 同步 |
| `lib/tools/adapters/SkillAdapter.ts` | builtin Skill 来自 `SKILLS_DIR` | builtin Skill 来自 `INJECTABLE_SKILLS_DIR`；内部 `skills/` 不参与 `skill_search` |
| `lib/external/mcp/handlers/skill.ts` | `listSkills`、`loadSkill`、builtin 冲突检查读取 `SKILLS_DIR` | 改读 `INJECTABLE_SKILLS_DIR`；内部 Skill 需要单独开发入口 |
| `lib/workflows/capabilities/execution/WorkflowSkillCompletionCapability.ts` | 创建项目 Skill 时用 `SKILLS_DIR` 做 builtin 冲突检查 | 改用 `INJECTABLE_SKILLS_DIR` 做产品 Skill 冲突检查 |
| `lib/service/skills/SkillHooks.ts` | 启动时扫描内置 `skills/*/hooks.js` 和项目级 hooks | 改为扫描 `injectable-skills/*/hooks.js` 和项目级 hooks；内部 `skills/*/hooks.js` 不自动执行 |
| `lib/external/mcp/handlers/bootstrap/skills.ts` | 遗留 coldstart Skill loader，当前冷启动主链路未调用 | 移除，不补 `injectable-skills/alembic-coldstart`；维度定义由 `DimensionRegistry` / `LanguageExtensions` / `BootstrapConsumers` 承担 |
| `lib/bootstrap.ts` 注释 | 描述扫描 `skills/*/hooks.js` | 改为扫描 `injectable-skills/*/hooks.js` 和项目级 Skill hooks |
| `lib/core/enhancement/EnhancementPack.ts` 注释 | Reference Skill 路径相对于 `skills/` | 如果指产品 reference Skill，改为相对于 `injectable-skills/`；如果指内部维护 Skill，明确相对于 `skills/` |
| `docs/development*.md` | 根目录 `skills/` 被描述为 Agent Skill 包 | 改为内部维护 Skill；新增 `injectable-skills/` 说明产品注入 Skill |
| `docs/cli-reference*.md`、`docs/configuration*.md` | 用户项目 `Alembic/skills` 说明 | 保持不变；这是用户项目级 Skill 源，不是仓库根目录 |
| `test/unit/SkillAdapter.test.ts` | 默认 adapter 使用包内 builtin 路径 | 增加测试：`injectable-skills` 可作为 builtin，内部 `skills` 不被默认搜索 |
| `test/unit/CursorDeliveryPipeline.test.ts` | `SkillsSyncer` 行为假设内置 Skill 源为包内 `skills` | 更新为 `injectable-skills`；保持项目级 `Alembic/skills` 到 `.cursor/skills` 的转换测试 |

不建议在同一轮里修改用户项目路径 `<dataRoot>/<kbDir>/skills/` 或 IDE 输出路径 `.cursor/skills/`。前者是 Alembic 知识库结构的一部分，后者是 IDE Agent Skills 的事实标准输出目录；这两个“skills”名称有外部契约意义，不应该为了仓库内部命名一并改掉。

以下文件涉及 `skills` 字样，但主要指用户项目或 IDE 契约路径，迁移时应保持路径不变，只按需要更新注释，避免误伤：

| 模块 | 路径语义 | 处理建议 |
|------|----------|----------|
| `lib/shared/WorkspaceResolver.ts` | `runtimeSkillsDir = <dataRoot>/.asd/skills`，`skillsDir = <dataRoot>/<kbDir>/skills` | 保持；前者是 legacy 迁移路径，后者是项目级 Skill 源 |
| `lib/infrastructure/config/Paths.ts` | `getProjectSkillsPath(dataRoot)` 返回 `<dataRoot>/<kbDir>/skills` | 保持；这是用户项目知识库路径 |
| `lib/cli/SetupService.ts`、`lib/cli/deploy/FileDeployer.ts` | 初始化或确保用户项目 `Alembic/skills/` | 保持；必要时注释改为“Project Skills” |
| `lib/cli/UpgradeService.ts` | `.asd/skills/` 迁移到 `Alembic/skills/` | 保持；这是 runtime legacy 到项目知识库的迁移 |
| `lib/service/cleanup/CleanupService.ts` | 清理用户项目 `skills/` | 保持；它操作的是 `<dataRoot>/<kbDir>/skills` |
| `lib/service/bootstrap/DeliveryVerifier.ts` | 校验 `.cursor/skills/` 和项目级 Skill 交付 | 保持；`.cursor/skills` 是 IDE 输出契约 |
| `lib/service/delivery/CursorDeliveryPipeline.ts` | 读取项目级 `Alembic/skills`，镜像 `.cursor/skills` 到其他 IDE | 保持；不应改成 `injectable-skills` |
| `lib/service/wiki/WikiGenerator.ts`、`lib/external/mcp/handlers/wiki-external.ts` | 处理 `.cursor/skills/alembic-devdocs` 或 wiki 同步路径 | 保持；它们不是包内产品注入源 |
| `docs/cli-reference*.md`、`docs/configuration*.md`、`docs/technical-reference*.md` | 描述用户项目 `Alembic/skills` 或 `.cursor/skills` | 保持；只在描述仓库根目录时新增 `injectable-skills` |
| `test/unit/PathGuard.test.ts` | 断言用户项目 `Alembic/skills` 可写 | 保持；它验证的是项目写入白名单 |

## 内部 Skill 本体目录

首版建议新增：

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

### `SKILL.md`

`SKILL.md` 是开发 Agent 的入口，保持短而清晰，描述何时触发、输入契约、执行循环和安全边界。它不内嵌 Alembic N0-N14 的全部细节，只说明：如果目标是 Alembic 冷启动或 rescan，需要读取 Alembic adapter 和已有链路文档。

建议 frontmatter：

```yaml
---
name: progressive-chain-validation
description: Use when validating or repairing a complex long-running workflow by decomposing it into small nodes, generating a test plan, running node-by-node checks, creating simulated data, fixing failures, and reporting evidence.
---
```

正文保持通用：启动握手、只读建模、生成节点计划、逐节点执行、补观测优先、最小修复、同节点重验、记录证据和最终交接。

### `templates/`

模板目录只放可复制模板，不放真实运行结果。

- `plan.md`：运行计划模板。
- `round.md`：单节点记录模板。
- `final-report.md`：最终报告模板。
- `commands.md`：命令记录模板。
- `nodes.json`：节点定义骨架。

这些模板的目标是让 Agent 每次运行时可以快速初始化 `scratch/chain-runs/<run-id>/report/`，而不是在内部 Skill 目录里直接改模板。

### `references/`

引用资料目录放较长、较稳定的说明，避免 `SKILL.md` 过大。

- `artifact-layout.md`：运行产物结构、命名规则和恢复方式。
- `alembic-adapter.md`：Alembic 专用适配说明，包含禁止在源码仓库执行用户 `asd` 命令、如何使用外部真实测试项目、如何关联 N0-N14 文档。
- `data-location-preflight.md`：Ghost 模式感知的数据位置检测协议，明确 `projectRoot`、`dataRoot`、`runtimeDir`、`knowledgeDir`、DB 和日志路径。
- `safety-boundaries.md`：权限分级、禁止路径、破坏性操作确认、生产数据边界。

## 运行产物目录

每次使用 Skill 都生成一个 run。Run ID 建议：

```text
pcv-YYYYMMDD-HHMM-<target-slug>
```

例如：

```text
pcv-20260506-1430-alembic-rescan
```

默认目录：

```text
scratch/chain-runs/<run-id>/
  report/
    plan.md
    nodes.json
    rounds/
      N0-data-location.md
      N1-entry.md
    patches.md
    commands.md
    final-report.md
    handoff.md
  evidence/
    N0-data-location.json
    N1-entry.json
  logs/
  fixtures/
  temp-tests/
  command-output/
  snapshots/
```

`report/` 放可读、可交接、可恢复的记录；`evidence/`、`logs/`、`fixtures/`、`temp-tests/` 放可删除的原始材料。`scratch/` 仍在 Alembic 源码仓库内，所以只能记录和辅助验证，不能作为外部用户项目执行完整 `asd` 链路。

## N0 数据位置检测

Ghost 模式让“项目在哪里”和“数据写到哪里”不再总是同一个目录。因此 `progressive-chain-validation` 的第一个节点必须从环境检查升级为数据位置检测，命名为 `N0-data-location`。

N0 的目标不是跑业务链路，而是建立路径事实表。只有 N0 通过并获得用户确认后，后续节点才允许执行会读取或写入 Alembic 运行时数据的命令。

N0 evidence 至少包含：

```json
{
  "targetProjectRoot": "/absolute/path/to/target-project",
  "projectRealpath": "/absolute/realpath/to/target-project",
  "isAlembicDevRepo": false,
  "isExcludedProject": false,
  "registryPath": "/Users/example/.asd/projects.json",
  "registered": true,
  "ghost": true,
  "projectId": "1a2b3c4d",
  "dataRoot": "/Users/example/.asd/workspaces/1a2b3c4d",
  "runtimeDir": "/Users/example/.asd/workspaces/1a2b3c4d/.asd",
  "databasePath": "/Users/example/.asd/workspaces/1a2b3c4d/.asd/alembic.db",
  "knowledgeBaseDir": "Alembic",
  "knowledgeDir": "/Users/example/.asd/workspaces/1a2b3c4d/Alembic",
  "recipesDir": "/Users/example/.asd/workspaces/1a2b3c4d/Alembic/recipes",
  "candidatesDir": "/Users/example/.asd/workspaces/1a2b3c4d/Alembic/candidates",
  "wikiDir": "/Users/example/.asd/workspaces/1a2b3c4d/Alembic/wiki",
  "writeMode": "ghost",
  "requiresUserConfirmation": true
}
```

结构化 evidence 必须保存展开后的绝对路径，不保存 `~`、`$HOME` 或相对路径。人类可读报告可以额外展示缩短路径，但不能替代 evidence 中的绝对路径。

N0 判定规则：

- 如果 `targetProjectRoot` 是 Alembic 源码仓库或被 `isExcludedProject()` 排除，禁止把它当作用户项目运行链路命令。
- 如果 `ghost = true`，后续所有运行时数据判断都以 `dataRoot` 为准，不再假设 `projectRoot/.asd` 或 `projectRoot/Alembic`。
- 如果 `ghost = true` 但 registry 中没有 `projectId`，停止执行，并要求先完成 Ghost setup 或重新选择目标项目。
- 如果 `ghost = false`，`dataRoot` 等于 `targetProjectRoot`，但仍要确认这不是 Alembic 源码仓库。
- 如果 `dataRoot` 位于 Alembic 源码仓库内，停止执行。这说明路径解析或测试项目选择有问题。
- 如果链路会写入 DB、候选、Recipe、Wiki 或 `.asd/context`，必须在 `scratch/chain-runs/<run-id>/report/plan.md` 中写明写入路径并请求用户确认。

N0 的记录位置：

```text
scratch/chain-runs/<run-id>/report/rounds/N0-data-location.md
scratch/chain-runs/<run-id>/evidence/N0-data-location.json
```

落地实现时，应以 `WorkspaceResolver.fromProject(projectRoot)` 的语义为准：

```text
projectRoot  -> 真实项目目录，用于源码分析
dataRoot     -> 数据根目录，用于 .asd/ 和知识库写入
runtimeDir   -> dataRoot/.asd
knowledgeDir -> dataRoot/<knowledgeBaseDir>
```

## 工作空间设计

### Alembic 源码工作空间

当前仓库是 Alembic 的核心开发仓库，只适合做这些事情：

- 修改 Alembic 源码。
- 新增或修改单元测试、集成测试。
- 运行 `npm run test:unit`、`npx vitest run ...` 等开发测试。
- 读取 `docs/`、`docs-dev/`、`skills/`、`injectable-skills/` 中的设计文档和 Skill。
- 保存本次 Skill 运行的记录和证据到 `scratch/chain-runs/`。

不允许做这些事情：

- 在仓库根目录或其子目录执行面向用户项目的 `asd setup`、`asd embed`、`asd search` 等命令。
- 在仓库根目录创建 `.asd/`。
- 在仓库根目录创建运行时 `Alembic/recipes/`、`Alembic/candidates/`、`Alembic/wiki/`。
- 把 `scratch/` 下的临时目录当成用户项目执行 Alembic 用户命令。

### 外部真实测试项目

当 Skill 用来验证 Alembic 的真实冷启动或增量扫描链路时，目标项目必须由用户提供，或由用户明确授权复制到 Alembic 源码仓库之外。

推荐路径形式：

```text
/Users/<user>/Documents/test-projects/<project-name>
$TMPDIR/alembic-chain-workspaces/<run-id>/<project-name>
```

标准模式下，目标项目自己的运行时目录位于：

```text
<targetProjectRoot>/.asd/
<targetProjectRoot>/Alembic/recipes/
<targetProjectRoot>/Alembic/candidates/
<targetProjectRoot>/Alembic/wiki/
```

Ghost 模式下，这些目录不会出现在 `targetProjectRoot` 下，而会出现在：

```text
~/.asd/workspaces/<project-id>/.asd/
~/.asd/workspaces/<project-id>/Alembic/recipes/
~/.asd/workspaces/<project-id>/Alembic/candidates/
~/.asd/workspaces/<project-id>/Alembic/wiki/
```

此时 Skill 必须把 `targetProjectRoot` 和 `dataRoot` 同时写进计划。后续节点描述路径时，必须说明是在读源码目录还是读写数据目录。

## 文件放置决策表

| 内容 | 推荐位置 | 原因 |
|------|----------|------|
| 本计划/设计文档 | `docs-dev/progressive-chain-validation-skill-layout.md` | 开发期设计，不进入正式 docs |
| 内部 Skill 指令 | `skills/progressive-chain-validation/SKILL.md` | 供开发 Agent 调用，不注入用户项目 |
| 内部 Skill 模板 | `skills/progressive-chain-validation/templates/` | 可复用但不被运行改写 |
| Alembic 适配说明 | `skills/progressive-chain-validation/references/alembic-adapter.md` | Skill 激活后按需读取 |
| 产品内置注入 Skill | `injectable-skills/<name>/` | 会被同步到用户项目 `.cursor/skills/`，也会作为 builtin 暴露 |
| 用户项目级 Skill | `<dataRoot>/<kbDir>/skills/<name>/` | 由冷启动或工作流生成，Ghost 模式以 `dataRoot` 为准 |
| 单次运行可读记录 | `scratch/chain-runs/<run-id>/report/` | 可读、可恢复，但不进入 docs-dev |
| 原始 evidence | `scratch/chain-runs/<run-id>/evidence/*.json` | 可删除、可能较大 |
| 临时测试脚本 | `scratch/chain-runs/<run-id>/temp-tests/` | 不污染正式测试目录 |
| 需要保留的测试 | `test/unit/` 或 `test/integration/` | 修复 Alembic 后纳入长期回归 |
| 外部测试项目 | 用户提供路径或 `$TMPDIR/alembic-chain-workspaces/<run-id>/` | 避免污染源码仓库 |

## 禁止放置位置

| 路径 | 禁止原因 |
|------|----------|
| `docs-dev/chain-runs/` | `docs-dev/` 保留给人工计划文档，本 Skill 不默认写入运行产物 |
| `.asd/` | Alembic 源码仓库禁止用户运行时目录 |
| `Alembic/candidates/` | 源码仓库不能被当成用户知识库 |
| `Alembic/wiki/` | 运行时 Wiki 不应生成在源码仓库内 |
| `injectable-skills/progressive-chain-validation/` | 注入源会被同步到用户项目，内部维护 Skill 不能放这里 |
| `skills/progressive-chain-validation/runs/` | 内部 Skill 本体目录必须保持纯净 |
| `docs/chain-runs/` | 单次运行记录不是正式文档 |
| `scratch/` 下执行完整用户命令链路 | `scratch/` 在源码仓库内，不能绕开 dev repo 边界 |
| 未确认 `dataRoot` 就运行链路命令 | Ghost 模式下会误判 `.asd/` 和知识库位置 |
| 手动假设 `projectRoot/.asd` | Ghost 模式下运行时数据在 `~/.asd/workspaces/<project-id>/.asd/` |

## 推荐流程

当用户说“使用 progressive-chain-validation 检测修复 Alembic rescan 链路”时，Agent 应按以下顺序落盘和执行：

1. 激活 `skills/progressive-chain-validation/SKILL.md`。
2. 读取 `skills/progressive-chain-validation/references/alembic-adapter.md` 和相关链路文档。
3. 在 `scratch/chain-runs/<run-id>/report/` 创建 `plan.md`、`nodes.json`、`commands.md`。
4. 在 `scratch/chain-runs/<run-id>/` 创建 `evidence/`、`logs/`、`temp-tests/`。
5. 执行 `N0-data-location`，确认 `targetProjectRoot`、Ghost 状态、`dataRoot`、`runtimeDir`、`knowledgeDir`。
6. 将 N0 摘要写入 `report/plan.md`，将结构化结果写入 `evidence/N0-data-location.json`。
7. 如果后续节点会读写运行时数据，请用户确认 N0 的数据位置。
8. 只读探查 Alembic 源码，识别本轮要验证的节点和测试入口。
9. 如果只需要源码级修复，直接在 Alembic 源码中补测试、修代码、跑单元或集成测试。
10. 如果需要真实用户项目链路，要求用户提供外部测试项目路径或授权创建 `$TMPDIR` 复制工作空间。
11. 在外部测试项目中执行用户命令，并把摘要写回 `scratch/chain-runs/<run-id>/report/commands.md`。
12. 节点失败时，先补 evidence 或测试，再回到 Alembic 源码做最小修复。
13. 同一节点重验通过后，再推进下一节点。
14. 完成或暂停时写 `report/final-report.md` 和 `report/handoff.md`。

## 首版落地边界

首版建议只做这些文件：

```text
skills/progressive-chain-validation/SKILL.md
skills/progressive-chain-validation/templates/plan.md
skills/progressive-chain-validation/templates/round.md
skills/progressive-chain-validation/templates/final-report.md
skills/progressive-chain-validation/references/alembic-adapter.md
skills/progressive-chain-validation/references/data-location-preflight.md
skills/progressive-chain-validation/references/safety-boundaries.md
```

暂时不做：

- 自动创建 run 目录的脚本。
- 自动汇总 evidence 的脚本。
- Dashboard UI 集成。
- 新的 runtime harness 代码。
- 自动执行 `asd` 用户命令。

首版重点是稳定 Agent 工作法：拆节点、写计划、收证据、修当前节点、同节点重验。等 2 到 3 次真实链路验证后，再把重复动作沉淀为脚本和 harness。

## 后续演进

### P1：Skill 包落地

新增 `skills/progressive-chain-validation/`，让开发 Agent 可以显式激活内部维护 Skill。产品内置注入 Skill 改放 `injectable-skills/`，避免 `SkillsSyncer` 误复制内部维护 Skill。

### P2：Run 初始化脚本

如果多次运行后目录创建重复，可以新增：

```text
skills/progressive-chain-validation/scripts/init-run.mjs
```

该脚本只负责创建 `scratch/chain-runs/<run-id>/` 的骨架，并初始化 `N0-data-location` 模板；不执行链路命令，不创建 `.asd/`，不写入 `docs-dev/chain-runs/`。

### P3：Evidence 校验脚本

新增轻量脚本检查每个节点是否有：目标、命令、证据、通过标准、结果、重验记录。它还应检查 N0 是否记录了 `targetProjectRoot`、`dataRoot`、`runtimeDir`、`knowledgeDir` 和用户确认状态。它只读产物文件，不访问目标项目。

### P4：Alembic harness 对接

当 `WorkflowTestControl`、`WorkflowNodeProbe`、stopAt 和 evidence bundle 成熟后，让 Skill 优先使用 harness 输出，减少手工日志解析。

## 判断标准

这个目录设计成立，需要满足：

- 本计划/设计文档保留在 `docs-dev/`。
- 内部 Skill 本体可跟随源码版本演进，不被运行产物污染。
- 根目录 `skills/` 只承载 Alembic 内部维护 Skill，不被默认注入用户项目。
- `injectable-skills/` 承载产品内置注入 Skill，并被 package、MCP builtin、SkillAdapter、SkillsSyncer 使用。
- 本 Skill 的自动运行产物不写入 `docs-dev/chain-runs/`。
- 每次运行都能在 `scratch/chain-runs/<run-id>/` 留下可读记录和 evidence。
- 真实测试项目和 `.asd` 运行时目录不会出现在 Alembic 源码仓库内。
- Ghost 模式下，Skill 能准确区分 `projectRoot` 和 `dataRoot`，并在运行前确认实际数据位置。
- 用户可以中途暂停，下一次 Agent 能通过 `report/plan.md`、`report/nodes.json`、`report/handoff.md` 接着推进。

一句话：`docs-dev/` 放人工计划/设计，`skills/` 放 Alembic 自维护方法，`injectable-skills/` 放可注入用户项目的产品 Skill，`scratch/chain-runs/` 放运行过程和证据，源码仓库外放真实运行环境。