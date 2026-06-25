# Alembic MCP 状态工具命名与返回内容精简需求设计

状态：候选 / 等待控制台 intake / 不包含实现派发
日期：2026-06-13
Design Key: alembic-mcp-status-tool-rename-compact-output-2026-06-13
所属窗口：Design
接收窗口：AlembicWorkspace

## 设计边界

本文覆盖 MCP 宿主入口中仍带单一平台命名的状态、初始化、bootstrap/rescan 入口清理，以及状态返回内容精简；不扩大到整套 MCP 工具面重构。

本设计不是 controller state root、task package、TODO 更新、dispatch packet、验收记录或产品代码修改。

## 用户澄清

用户意图是：

- 将 `alembic_codex_status` 换成更通用、适合双宿主平台的 MCP 工具命名。
- 将同组仍带 `codex` 平台命名的 MCP 宿主入口纳入清理：`alembic_codex_init`、`alembic_codex_bootstrap`、`alembic_codex_rescan`。
- 精简 status 返回内容。
- 保证 status 工具按自己的语义和职责返回正确数据。
- 补充清理 `codex channel` 概念；当前用户判断该概念已经不需要。
- 补充清理 runtime package source directory 命名：`packages/alembic-codex-runtime` 应改为 `packages/alembic-runtime`；同时检查 `packages/` 是否仍需要。
- 补充清理 Alembic 和 AlembicPlugin 的 `injectable-skills` 目录命名，改为 `skills`；实际产品语义不再使用 injectable-skills 概念。
- 不把范围扩散到所有 `alembic_codex_*` 工具、runtime bin、环境变量、插件发布链或整套工具面删除；只处理本文列出的 MCP 宿主入口命名、channel、runtime package source directory、`injectable-skills` 命名清理任务。

## 问题

当前 `alembic_codex_status` 有两个具体问题：

- 工具名绑定单一宿主平台，不适合作为双宿主通用 MCP 工具名。
- 默认返回内容过大，把普通状态、运行时诊断、模块边界、项目身份深层结构和插件包装诊断混在一起。
- 默认状态和 runtime context 里仍暴露 `codex channel`，但 MCP 标准工具模型本身不需要 AlembicPlugin 维护单独的 channel 身份层。

代码事实显示，这不是随机泄露，而是当前实现主动聚合：

- `StatusService.buildCodexStatus(...)` 返回 `projectRuntime`、`residentService`、`projectScopeIdentity`、`moduleBoundary`、`daemon.health`、`diagnostics` 等大块数据。
- clean-output projector 允许 `daemon`、`projectRuntime`、`statusDiagnostics`、`workspace` 等顶层字段，因此大块嵌套内容会合法通过。
- README 对 status 的描述是检查初始化和 daemon 状态，并突出 `onboarding`，实际输出比这个职责宽很多。

## 目标

- 新状态工具使用宿主中立命名。
- 默认 status 输出变成紧凑、可读、可判断的状态摘要。
- 深诊断内容不再出现在默认 status 输出中。
- 需要排查时仍可通过 diagnostics 工具取得完整诊断。
- 新旧命名不做长期公共兼容；旧工具名是否短期保留仅由 Controller 根据真实宿主发布链决定。
- `codex channel` 不再作为 status 判断、工具可见性、插件身份或下一步建议的概念保留。

## 推荐命名

推荐新状态工具名：`alembic_mcp_status`。

理由：

- `alembic` 表示产品/服务边界。
- `mcp` 表示这是 MCP 宿主入口状态，不是 Alembic 主体 daemon health 或知识库搜索状态。
- `status` 表示只读状态检查。
- 不包含任何单一宿主平台名称，适合两个宿主共用。

备选：`alembic_status`。

风险：名称更短，但容易与 Alembic 主体状态、daemon health、source graph status 混淆。

同组 MCP 宿主入口推荐命名：

| 旧工具名 | 推荐处理 | 说明 |
| --- | --- | --- |
| `alembic_codex_status` | 改为 `alembic_mcp_status` | 表达 MCP 宿主入口状态，不绑定单一平台。 |
| `alembic_codex_init` | 改为 `alembic_mcp_init` | 表达 MCP 宿主入口初始化，不绑定单一平台。 |
| `alembic_codex_bootstrap` | 优先并入或删除，必要时改为宿主中立名称 | 需要先判断它与现有 `alembic_bootstrap` 的语义差异。若只是单宿主别名，应删除旧入口；若确实表示 MCP resident job 路径，应改为 `alembic_mcp_bootstrap_job` 或由 Controller 确认更合适名称。 |
| `alembic_codex_rescan` | 优先并入或删除，必要时改为宿主中立名称 | 需要先判断它与现有 `alembic_rescan` 的语义差异。若只是单宿主别名，应删除旧入口；若确实表示 MCP resident job 路径，应改为 `alembic_mcp_rescan_job` 或由 Controller 确认更合适名称。 |

命名原则：

- `mcp` 表达宿主入口层，不能表达单一平台。
- 已存在的产品通用工具，例如 `alembic_bootstrap`、`alembic_rescan`，如果职责足够准确，不应再新增重复的 `mcp` 包装名。
- 如果旧 `alembic_codex_bootstrap` / `alembic_codex_rescan` 只是在实现上绕行 daemon 或 resident job，但用户语义仍是“生成知识库 / 重扫知识库”，优先收敛到现有通用工具语义。
- 如果必须保留 job-path 差异，工具名要表达真实语义，例如 `*_job` 或 `*_resident_job`，而不是表达宿主平台。

## 返回内容契约

`alembic_mcp_status` 默认应该保留：

| 字段 | 语义 |
| --- | --- |
| `ok` | 工具调用是否成功。 |
| `status` | `ready` / `blocked` / `degraded` / `unavailable` 等紧凑状态。 |
| `summary` | 一句话状态摘要。 |
| `initialized` | MCP 工作区是否初始化。 |
| `project` | 当前项目根、项目识别状态、可信状态的摘要。 |
| `workspace` | mode、ghost/dataRootSource、关键存在性摘要，不返回所有路径树。 |
| `daemon` | ready/status/pidAlive/dashboardUrl 可用性等摘要，不返回完整 health payload。 |
| `knowledge` | usable、hasKnowledge、bootstrapRunning、freshness/count 摘要。 |
| `onboarding` | state、primaryAction、nextActions、notes 的紧凑版本。 |
| `nextActions` | 可执行下一步标签或工具建议。 |
| `meta` | clean-output 元信息。 |

默认应该移出 status：

- `channel`
- `channelId`
- `expectedChannelId`
- `moduleBoundary`
- `residentService` 完整对象
- `projectScopeIdentity` 完整对象
- `projectRuntime.sourceOfTruth`
- `projectRuntime.fallbackIsolation` 全量说明
- `daemon.health.data.capabilities`
- `daemon.health.data.projectRuntimeSourceOfTruth`
- `statusDiagnostics` 全量
- plugin wrapper/cache/manifest/README 深诊断
- 重复出现的 projectScope/projectIdentity/folders 路径树
- `autoInit.marker.results` 的逐步初始化日志

这些内容应由 `alembic_diagnostics` 或后续明确的诊断工具承担。

## 补充任务：清理 `codex channel`

该任务是本需求的附加小任务，不是整套插件发布系统重构。

待清理事实点：

- `AlembicPlugin/lib/shared/channel.ts` 定义 `ALEMBIC_CHANNEL_ID`、`ALEMBIC_CHANNEL` 和 `CODEX_CHANNEL_ID`。
- `AlembicPlugin/lib/runtime/runtime/RuntimeContext.ts` 把 channel 注入 runtime context，并提供 `channelId`、`channelPath`、`expectedChannelId`。
- `AlembicPlugin/lib/runtime/status/StatusService.ts` 把 `channel` 返回到 status。
- `AlembicPlugin/lib/runtime/mcp/codex-local-tools/output.ts` 允许 status 顶层返回 `channel`。
- `AlembicPlugin/channels/codex/channel.json` 和 `channels/README.md` 维护独立 channel 元数据。
- `.mcp.json`、README、release/verify 脚本、测试中仍引用 `ALEMBIC_CHANNEL_ID=codex` 或 `channels/codex`。

推荐处理：

- 从 status 默认输出和 clean-output status 白名单中移除 channel 字段。
- 从 status/onboarding/diagnostics 的下一步语义中移除 channel 判断；保留真正需要的 host/runtime/plugin identity。
- 对 `channels/codex`、`ALEMBIC_CHANNEL_ID`、`CODEX_CHANNEL_ID` 做引用和发布链扫描。
- 如果扫描证明 channel 只服务旧单宿主包装语义，删除 channel 文件、环境变量默认值、校验脚本和文档推荐。
- 如果某个发布脚本或插件安装器仍真实需要该文件，Controller 必须把它记录为发布链阻塞，而不是把 channel 继续当作产品/runtime 概念。

## 补充任务：清理同组 `alembic_codex_*` MCP 入口

该任务只覆盖用户明确点名的四个工具：

- `alembic_codex_status`
- `alembic_codex_init`
- `alembic_codex_bootstrap`
- `alembic_codex_rescan`

处理原则：

- `status` 与 `init` 属于 MCP 宿主入口管理工具，应改成宿主中立的 `alembic_mcp_status`、`alembic_mcp_init`。
- `bootstrap` 与 `rescan` 已存在不带平台名的通用工具：`alembic_bootstrap`、`alembic_rescan`。实现窗口必须先比较语义和调用链，不能简单新增重复工具。
- 如果 `alembic_codex_bootstrap` / `alembic_codex_rescan` 与通用工具只存在包装差异，应删除旧平台名工具，把下一步建议、README、tool description、测试和 MCP tools list 收敛到通用工具。
- 如果它们确实承担“resident job path / daemon-backed job path”的不同职责，应改成宿主中立且语义准确的新名称，并在工具描述中解释与 `alembic_bootstrap` / `alembic_rescan` 的区别。
- 不做长期兼容别名；如果短期迁移必须保留旧名，Controller 需要记录真实消费者、过期条件和清理触发器。

实现前事实扫描需要回答：

- 四个旧工具分别在哪里注册、暴露、分发和测试。
- tool description、onboarding、nextActions 是否仍推荐旧名。
- `alembic_codex_bootstrap` 与 `alembic_bootstrap` 的输入、输出、副作用、daemon/job 路径是否真的不同。
- `alembic_codex_rescan` 与 `alembic_rescan` 的输入、输出、副作用、daemon/job 路径是否真的不同。
- 删除旧名后，双宿主 MCP tools/list 是否只暴露通用入口。

## 补充任务：重命名 runtime package source directory

用户指出 `AlembicPlugin/packages/alembic-codex-runtime` 仍带旧单宿主平台命名，应改为 `AlembicPlugin/packages/alembic-runtime`。同时需要检查 `packages/` 目录是否真的还需要；如果不需要，应删除整个目录。

只读事实：

- `packages/alembic-codex-runtime/package.json` 的 npm 包名已经是 `@gxfn/alembic-runtime`，目录名与包名语义不一致。
- 该目录当前只包含 `package.json` 和 `README.md`，但它不是空壳：`scripts/prepare-codex-runtime-package.mjs` 从该目录读取 runtime package manifest，并复制 README。
- 多个发布、校验、smoke、cache-sync 脚本硬编码 `packages/alembic-codex-runtime`。
- 根 `package.json` 的 `files` 列表也包含 `packages/alembic-codex-runtime`。
- README、release playbook、verify scripts 仍把它描述为 runtime package boundary。

推荐处理：

- 第一优先级：将目录重命名为 `packages/alembic-runtime`，并同步更新脚本、根 `package.json`、README/README_CN、release playbook、verify/smoke/cache-sync 测试引用。
- 将 package README 标题从旧平台专名改为宿主中立的 Alembic runtime package 描述。
- 检查 `packages/` 是否只为这一个 manifest boundary 存在。
- 如果 runtime package manifest 仍需要单独边界，保留 `packages/`，但目录名必须中立。
- 如果实现窗口证明 manifest 可以迁到更合理位置，例如根级 `runtime-package/` 或 `runtime/package.json`，且所有 prepare/verify/release 脚本通过，则可以删除整个 `packages/` 目录。
- 不允许只改目录名而保留脚本、文档或 tarball 校验里的旧路径。

## 补充任务：将 `injectable-skills` 改为 `skills`

用户指出 Alembic 和 AlembicPlugin 中的 `injectable-skills` 概念实际用不到，应统一改为 `skills`。

只读事实：

- `Alembic/injectable-skills/` 存在 5 个 skill：`alembic-create`、`alembic-devdocs`、`alembic-guard`、`alembic-recipes`、`alembic-structure`。
- `AlembicPlugin/injectable-skills/` 存在 4 个 skill：`alembic-create`、`alembic-guard`、`alembic-recipes`、`alembic-structure`。
- Alembic 和 AlembicPlugin 的 `config/default.json` 均定义 `package.injectableSkills: "injectable-skills"` 与 `package.internalSkills: "skills"`。
- 两仓 `lib/shared/package-assets.ts` 都通过 `DEFAULT_FOLDER_NAMES.package.injectableSkills` 暴露 `INJECTABLE_SKILLS_DIR`，并把 `SKILLS_DIR` 作为 deprecated alias 指向它。
- 两仓 `lib/service/skills/SkillHooks.ts` 文案和加载逻辑都写着“内置 injectable-skills -> 项目级 Alembic/skills”。
- AlembicPlugin 的 runtime package prepare 脚本、根 `package.json.files`、shared-asset manifest、probe 脚本和 AGENTS 规则仍引用 `injectable-skills`。

推荐处理：

- 将两仓顶层 `injectable-skills/` 重命名为顶层 `skills/`，作为产品内置 skills 源目录。
- 删除或改名 `package.injectableSkills` 配置键，避免继续表达 injectable 概念。
- 将 package asset 常量收敛为 `PACKAGE_SKILLS_DIR` 或同等中立命名；不再使用 `INJECTABLE_SKILLS_DIR` 作为主名。
- 更新 `SkillHooks` 加载顺序文案和代码：内置 package `skills/` -> 项目级 `Alembic/skills/`。
- 明确区分三类 skills：产品内置 package `skills/`、项目级 dataRoot `Alembic/skills/`、宿主插件 shell `plugins/<host>/skills/`。
- AlembicPlugin 需要同步更新 runtime package prepare、root `files`、shared-asset manifest、release/smoke/probe 脚本和 AGENTS 资源边界。
- 生成或历史目录中的旧路径，例如 `.tmp/**`、`.release/**`、vendor 快照，按实现窗口的扫描结果决定是否重建、排除或删除；不能作为 active source 保留理由。
- 如果顶层 `skills/` 已经存在且承载不同语义，实现窗口必须先合并/迁移语义，不能覆盖删除。

## 行为要求

- 状态工具不启动 daemon。
- 状态工具不写入项目或数据根。
- 状态工具不返回敏感信息。
- 状态工具只判断“当前 MCP 宿主入口能否安全继续”和“下一步应该调用什么”。
- 如果诊断异常影响状态，status 只返回压缩后的 issue 摘要和 diagnostics next action，不内联完整诊断树。
- 状态工具不使用 channel 作为身份、能力、可见性或 readiness 判断。

## 测试决策

应补充或更新测试：

- `tools/list` 中出现 `alembic_mcp_status`，不再以旧平台名作为推荐状态工具。
- `tools/list` 中不再出现用户点名的旧平台名入口，除非 Controller 明确记录短期迁移例外：`alembic_codex_status`、`alembic_codex_init`、`alembic_codex_bootstrap`、`alembic_codex_rescan`。
- `alembic_mcp_init` 或确认后的新初始化入口能通过同一输入 schema 在两个宿主配置下工作。
- `alembic_codex_bootstrap` 与 `alembic_codex_rescan` 的删除/改名必须有语义对照表，证明它们已被 `alembic_bootstrap` / `alembic_rescan` 或新的宿主中立 job 工具覆盖。
- `alembic_mcp_status` 能通过同一输入 schema 在两个宿主配置下工作。
- 默认输出不包含 `moduleBoundary`、完整 `residentService`、完整 `projectRuntime.sourceOfTruth`、完整 `daemon.health.data.capabilities`。
- 默认输出不包含 `channel`、`channelId`、`expectedChannelId`。
- diagnostics 工具仍能返回上述深诊断内容。
- channel 清理有引用扫描和发布链扫描；旧 `channels/codex` 或 `ALEMBIC_CHANNEL_ID=codex` 若保留，必须有真实消费者和清理触发器。
- runtime package source directory 清理有引用扫描；旧 `packages/alembic-codex-runtime` 不能留在 active scripts、package files、README、release playbook 或 tests 中。
- 如果删除整个 `packages/`，必须证明 runtime package manifest/README 已有新所有者，且 prepare/verify/release/smoke 链路全部通过。
- `injectable-skills` 清理有 Alembic 和 AlembicPlugin 双仓引用扫描；active source、config、package files、shared manifest、SkillHooks、runtime package prepare、probe/smoke/release 脚本中不再保留该概念。
- 内置 package skills 与项目级 `Alembic/skills`、宿主插件 shell `plugins/*/skills` 的语义边界清楚，测试覆盖加载顺序。
- 旧平台名状态工具不作为正常公共入口成功执行，除非 Controller 明确批准短期迁移例外。
- 用户点名的旧平台名 MCP 入口不作为正常公共入口成功执行，除非 Controller 明确批准短期迁移例外。
- README/Skill/tool description/onboarding/nextActions 中推荐的新状态工具名一致。

## 验收标准

- 新状态工具名适合双宿主，不包含单一宿主平台名称。
- 同组 MCP 宿主入口不再使用 `codex` 作为工具名语义。
- 默认 status 输出可在一屏内判断状态和下一步。
- 深诊断内容与默认 status 输出分离。
- `codex channel` 不再出现在默认 status 契约、推荐状态路径或工具可见性判断中。
- runtime package source directory 不再使用旧平台专名 `alembic-codex-runtime`。
- Alembic 和 AlembicPlugin active source 中不再使用 `injectable-skills` 作为产品目录或配置概念，统一为 `skills`。
- 旧状态工具名从正常工具选择、文档推荐和默认调度路径中移除。
- `alembic_codex_init`、`alembic_codex_bootstrap`、`alembic_codex_rescan` 从正常工具选择、文档推荐和默认调度路径中移除，或被 Controller 明确记录为短期迁移例外。
- 代表性测试证明状态工具只读、不启动 daemon、不返回深诊断树。
- 如果保留任何旧名例外，必须有 Controller 记录的真实宿主发布链阻塞、过期条件和清理触发器。

## 控制台 intake 备注

Design 建议将此作为 AlembicPlugin 的小范围后续包：只处理 status 工具命名与输出契约，不扩散到其他 MCP 工具族。

推荐第一步是 AlembicPlugin 窗口做实现前事实表：

- 旧状态工具定义位置。
- 新状态工具应改动的位置。
- `alembic_codex_init`、`alembic_codex_bootstrap`、`alembic_codex_rescan` 的定义、分发、tool description、测试和文档引用位置。
- `alembic_codex_bootstrap` 对比 `alembic_bootstrap`、`alembic_codex_rescan` 对比 `alembic_rescan` 的语义差异结论。
- 输出字段保留/移出表。
- diagnostics 承接字段表。
- `codex channel` 引用表和删除/保留裁决。
- `packages/alembic-codex-runtime` 引用表、重命名补丁范围、以及 `packages/` 是否可删除的证据结论。
- Alembic 和 AlembicPlugin 的 `injectable-skills` 引用表、目录重命名范围、`skills` 目录冲突检查、加载顺序验证计划。
- 旧名删除或短期例外决策。

## 来源引用

- `AlembicPlugin/lib/runtime/status/StatusService.ts`
- `AlembicPlugin/lib/runtime/mcp/codex-local-tools/output.ts`
- `AlembicPlugin/lib/runtime/mcp/host/local-tool-dispatcher.ts`
- `AlembicPlugin/lib/runtime/mcp/CodexMcpServer.ts`
- `AlembicPlugin/lib/runtime/mcp/PluginToolSurfaceCatalog.ts`
- `AlembicPlugin/lib/runtime/ToolPolicy.ts`
- `AlembicPlugin/lib/shared/channel.ts`
- `AlembicPlugin/lib/runtime/runtime/RuntimeContext.ts`
- `AlembicPlugin/channels/codex/channel.json`
- `AlembicPlugin/plugins/alembic-codex/.mcp.json`
- `AlembicPlugin/packages/alembic-codex-runtime/package.json`
- `AlembicPlugin/packages/alembic-codex-runtime/README.md`
- `AlembicPlugin/scripts/prepare-codex-runtime-package.mjs`
- `AlembicPlugin/scripts/verify-codex-runtime-package-boundary.mjs`
- `AlembicPlugin/scripts/verify-release-package-boundary.mjs`
- `AlembicPlugin/package.json`
- `AlembicPlugin/plugins/alembic-codex/README.zh-CN.md`
- `Alembic/injectable-skills/`
- `AlembicPlugin/injectable-skills/`
- `Alembic/lib/shared/package-assets.ts`
- `AlembicPlugin/lib/shared/package-assets.ts`
- `Alembic/lib/service/skills/SkillHooks.ts`
- `AlembicPlugin/lib/service/skills/SkillHooks.ts`
- `Alembic/config/default.json`
- `AlembicPlugin/config/default.json`
- `Alembic/config/shared-asset-manifest.json`
- `AlembicPlugin/config/shared-asset-manifest.json`
- MCP Tools specification: `https://modelcontextprotocol.io/specification/draft/server/tools`
