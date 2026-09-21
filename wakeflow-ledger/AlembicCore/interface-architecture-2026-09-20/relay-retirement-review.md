# 16 个宿主 Core relay 的删除前复核

日期：2026-09-20。Main 基线 `4dc86fb`，Plugin 基线 `e0deb9a`；以同目录 `interface-inventory.json` 的 16 个纯 Core relay 为范围。只读检查源码、包清单、构建发布脚本、计算加载与跨仓引用；没有修改产品、测试、配置或控制状态，没有运行测试/构建/打包，没有提交。

## 决策输入

- **2 个最直接候选**：Plugin 的 TargetClassifier、evolution-prescreen。未发现现行 import/export、清单、脚本或计算加载消费者。
- **9 个需联动清单的候选**：Main 的 4 个无静态消费者文件、Plugin 的 5 个 cache/type 文件，仍被 shared-asset manifest 明确读取。不能仅删文件；应按两宿主成对退休并同步两份 manifest。
- **5 个先迁移消费者的候选**：Main UnifiedCacheAdapter/shutdown，Plugin coverage-ledger-write/generate-event-types/shutdown。所有现行调用均有现存 Core 入口可直接替代。
- 以上“候选”指已检查工作区中的可控删除范围。Main 的 `alembic-ai` 与 Plugin 的公开 `alembic-runtime` 都没有 exports 封装且打包整个 dist，旧深路径在技术上可访问；没有证据证明未知已发布包用户从未使用。清理记录应明确退休旧宿主深路径及替代 Core 入口，不能宣称零外部兼容影响。若发布目标要求保留任意旧深路径，则需继续保留对应 relay；这不是新增 Core export 的理由。

## 11 个无静态消费者 relay，逐项结论

表中命令编号见末尾；每组 typecheck/build 只运行一次，不逐文件重复运行。

| ID | 文件（workspace 相对路径） | 已确认的额外消费者 / 替代入口 | 删除条件与最小验证 |
| --- | --- | --- | --- |
| M1 | `Alembic/lib/infrastructure/cache/CacheService.ts:2` | 两份 manifest 的 `w2-shell-cacheservice`（`:105–109`）；`export *` 来自 `@alembic/core/infrastructure/cache` | 与 P3 成对移除、同步两份 manifest；M-T + D + M-B。不能把它当成只导出 CacheService 一个符号。 |
| M2 | `Alembic/lib/infrastructure/cache/GraphCache.ts:2` | manifest `w2-shell-graphcache`（`:119–123`）；替代 named `GraphCache`，同 Core cache 入口 | 与 P4 成对移除并同步 manifest；M-T + D + M-B。 |
| M3 | `Alembic/lib/types/graph-shared.ts:2` | manifest `w2-shell-graph-shared`（`:126–130`）；替代 `@alembic/core/types/graph-shared` | 与 P6 成对移除并同步 manifest；M-T + D + M-B。Core wire 类型和包入口保持。 |
| M4 | `Alembic/lib/types/search-wire.ts:2` | manifest `w2-shell-search-wire`（`:133–137`）；替代 `@alembic/core/types/search-wire` | 与 P7 成对移除并同步 manifest；M-T + D + M-B。Core Search DTO 保持。 |
| P1 | `AlembicPlugin/lib/host-runtime/mcp/handlers/TargetClassifier.ts:1` | 未发现现行消费者；替代 `inferFilePriority/inferTargetRole` from `@alembic/core/host-agent-workflows` | 工作区内可直接退休，无 manifest 联动；P-T + P-B。旧 Design 文档和 Main 的禁止旧路径测试是历史/负向引用，见下文。 |
| P2 | `AlembicPlugin/lib/host-runtime/mcp/handlers/evolution-prescreen.ts:1–7` | 未发现现行消费者；替代 `buildEvolutionPrescreen` 及 4 个 type from 同 Core facade | 工作区内可直接退休；P-T + P-B。不删除 Core 的实现、类型或转发链。 |
| P3 | `AlembicPlugin/lib/infrastructure/cache/CacheService.ts:2` | 同 M1 的 shared-asset 约束；替代 Core cache 整个 barrel | 与 M1 同批；P-T + D + P-B。 |
| P4 | `AlembicPlugin/lib/infrastructure/cache/GraphCache.ts:2` | 同 M2；替代 Core cache 的 GraphCache | 与 M2 同批；P-T + D + P-B。 |
| P5 | `AlembicPlugin/lib/infrastructure/cache/UnifiedCacheAdapter.ts:2` | manifest `w2-shell-unifiedcacheadapter`（`:112–116`）；另一侧 Main relay 有 HttpServer 调用 | **先处理 M5**，再成对移除并同步 manifest；P-T + D + P-B，Main 补 M-C。不能先删 Plugin 单边而留下 exact 清单。 |
| P6 | `AlembicPlugin/lib/types/graph-shared.ts:2` | 同 M3；替代 Core graph-shared 子路径 | 与 M3 同批；P-T + D + P-B。 |
| P7 | `AlembicPlugin/lib/types/search-wire.ts:2` | 同 M4；替代 Core search-wire 子路径 | 与 M4 同批；P-T + D + P-B。 |

两份清单均为 `config/shared-asset-manifest.json`；行号一致。M1/M2/M3/M4 与 P3/P4/P6/P7 是 4 对；P5 等待 Main M5 的调用迁移。清单不是发布 public-export 列表，它的消费性质是构建门禁读取。

## 5 个有消费者 relay，逐项迁移图

| ID | 文件 | 必须先迁移的实际消费者 | 目标 / 最小验证 |
| --- | --- | --- | --- |
| M5 | `Alembic/lib/infrastructure/cache/UnifiedCacheAdapter.ts:2` | `Alembic/lib/http/HttpServer.ts:14` 的 `initCacheAdapter`；`:119` 仍真实初始化实例 | 导入改到 `@alembic/core/infrastructure/cache`；保留 HttpServer init/cacheAdapter 生命周期，不借机删除。随后与 P5 成对移除、删两清单对应项。M-T + M-C + D + M-B。 |
| M6 | `Alembic/lib/shared/shutdown.ts:2` | `bin/api-server.ts:16`、`bin/cli.ts:46`、`bin/daemon-server.ts:36`、`lib/injection/modules/SignalModule.ts:13`；`test/integration/ShutdownCoordinator.test.ts:24,30` 的 type import 和动态 import | 全部指向既有 `@alembic/core/shared` 的 shutdown 单例；保持 register/execute/LIFO 行为和导入时机。与 P10 同批退役、同步 manifest `w2-shell-shutdown`。M-T + M-S + D + M-B。 |
| P8 | `AlembicPlugin/lib/recipe-pipeline/generate/coverage-ledger-write.ts:8–15` | `lib/recipe-pipeline/generate/dimension-completion.ts:36–39` 的两个函数；`knowledge-rescan.ts:82` 的 write；`test/unit/CoverageLedgerWiring.test.ts:32–36` 的 type 与函数 | 全部从 `@alembic/core/host-agent-workflows` 导入，无 manifest 项。P-T + P-C + P-B。现有行为测试继续执行账本写入、deferred/exhausted、reflow，不只测导出存在。 |
| P9 | `AlembicPlugin/lib/recipe-pipeline/generate/runtime/generate-event-types.ts:6–17` | `GenerateEventEmitter.ts:13` 的 `DimensionCompletePayload/ProgressPayload`，均为 type-only；`:12` 已从 Core knowledge 导入事件常量 | 合并到同一 `@alembic/core/knowledge` import，保持 type 标记；Core `src/knowledge.ts:119–130` 已导出完整这 10 个类型，包括历史异名 alias。P-T + P-B；只迁移类型路径不需要新运行时镜像测试。 |
| P10 | `AlembicPlugin/lib/shared/shutdown.ts:2` | `bin/host-mcp.ts:27` 顶层 await 动态导入；`lib/injection/modules/SignalModule.ts:15`；`test/integration/ShutdownCoordinator.test.ts:24,30` | 动态导入仍保持该位置/形式，仅换 Core specifier；其他消费者同步迁移。与 M6 同批并同步 manifest。P-T + P-S + D + P-B。 |

**P8 测试迁移注意**：`CoverageLedgerWiring.test.ts:81–84` 只断言 relay 函数与 Core 函数为同一引用。relay 退休后应删除这一个同义断言以及 `:21–22` 两个 alias imports；不能机械改 import 后留下“Core 函数等于自身”的测试。保留 `:86` 起的行为用例和真实 dimension-completion 接线用例。

**M6/P10 测试注意**：ShutdownCoordinator 现有测试用 `vi.resetModules` + 动态 import 隔离单例；直接迁移后必须用各宿主现行 Vitest 配置复跑，不能仅靠 tsc 或默认 singleton 复用假定通过。这里只读取了相关测试，未执行验证。

## 包、构建与发布证据

1. Main `package.json:6,10–54,107–108,157–165`：main 为 Bootstrap，bin 为 cli；imports 是 `#shared/*/#infra/*/#types/*` 等模式，没有精确 relay 条目；没有 exports；files 含整个 dist。`tsconfig.json` include `lib/**/*.ts`，并生成 declaration。因此删除 source 必须 clean build，不能让陈旧 `.js/.d.ts` 留在包中。
2. Main `scripts/prepare-publish-staging.mjs:104–135` 克隆 manifest、替换依赖/生命周期脚本，不补 exports；`:138–154` 递归复制 files 内容。relay 不是 required 单文件，但随 dist 进入 staging。`postbuild.mjs:18–30` 仅修复三个 bin 的 shebang/mode，无 relay 注册。
3. Plugin 根 `package.json:4` private **不代表**最终 runtime private。`packages/alembic-runtime/package.json:3–34,64–76` 是 public runtime manifest，无 exports，main/bootstrap 与 host-mcp bin 固定，files 含 dist。`prepare-codex-runtime-package.mjs:86–99` 使用此 manifest 并删除 private；`:57,110–129` 复制整个 dist、仅跳过 `.d.ts`。所以 Plugin type relay 的声明本就不进入此 runtime，但其空/转发 `.js` 路径仍被打包。
4. Plugin requiredBuildArtifacts 只列 `dist/bin/host-mcp.js` 与 `dist/lib/host-runtime/mcp/HostMcpServer.js`（prepare 脚本 `:22–28`），没有 10 个 relay。`:31–46` 还检查 source/dist provenance，删除后必须正常 clean build/postbuild 生成新 provenance；不能只手动删 dist 绕过 freshness。
5. 两端 clean-dist 都会删除完整 dist；无 relay 专属构建生成逻辑。Plugin postbuild 只处理 host-mcp 与 build manifest。Codex/Claude plugin shell 通过固定 runtime 包/entrypoint 启动，没有按 handler 文件名枚举导入 relay。
6. 两份 shared manifest `:105–144` 约束 6 对文件，`:10` 还将 manifest 自身纳入 self-check。Main gate `scripts/check-shared-asset-drift.mjs:268–283` 对缺一侧或两侧文件都报告 drift，`:401–418` 验证两份清单一致，`:467–471` 非零退出。Plugin wrapper 反向调用 Main 权威 gate；不能靠同时删文件但保留条目“自然通过”。

删除后应退休清单中相应 **relay 对齐约束**，保留其余共享资产约束和 Core 包边界；不要放宽 gate 为“缺文件自动忽略”。

## 计算路径、文档与兄弟仓核对

- Main `bin/cli.ts:1723–1725` 的非字面量 import 只枚举 better-sqlite3/commander/express。
- 两端 `lib/service/skills/SkillHooks.ts:126–129,400–417` 只扫描包/project skills 子目录中的固定 `hooks.js`。没有把 cache、types 或 handler 目录作为模块注册表。
- Plugin `scripts/rebuild-local-knowledge-indexes.mjs:41–62` 计算路径为 bootstrap、ServiceContainer、knowledge-index-rebuild；`smoke-codex-plugin.mjs:108–110` 为 HostMcpServer；`verify-codex-plugin-tools-local.mjs:53–54,72–73,814–815` 的调用实参为 HostMcpServer、output-contract、tool-router。未指向候选。
- 两宿主现行 README/docs/scripts/.github 中未找到这 16 个 relay 的加载或 API 示例；CHANGELOG 对 UnifiedCacheAdapter 的描述是历史实现变更，不是路径消费。没有为删除而建议改写历史 CHANGELOG。
- 跨仓文字扫描使用 git tracked 文本，排除 vendor/node_modules/dist/scratch 和超过 1.5 MB/非文本文件：Main 497、Plugin 507、Agent 387、Showcase 23、Test 41，共 1455 个文件。对 `alembic-ai|alembic-runtime|Alembic|AlembicPlugin` + 可选 dist + 本批 lib 路径，未找到兄弟仓实际深路径消费。另一轮 basename 搜索与 import/export inventory 交叉核对了内部别名与相对路径。
- Agent `test/EvidenceLedgerStore.test.ts:36–51`、`test/Redaction.test.ts:51` 的 graph-shared 路径只是测试文字样本；Main `test/unit/AgentModuleBoundaries.test.ts:409–415` 的 TargetClassifier/evolution-prescreen 是禁止旧 handler import 的比较字符串。不能把这些当运行时消费者，也无需随删除改掉。
- Design 旧结构图、迁移计划有历史 KEEP/冻结描述和旧目录路径。这些不是当前执行中的产品消费者，当前用户已确认的架构整理方案是本轮范围依据；本次不改历史设计/控制文档，也不把它们解释为新增权限要求。
- 未查询 npm 已发布 tarball或工作区外下游。因此“发布过的所有版本均没有外部深路径用户”不在结论内；发布前可基于现有 release 记录决定兼容说明，不新增无证据的阻断流程。

## 最小验证命令（本次均未执行）

全部使用 Node.js 22，在注明的宿主根目录执行；Core dist 先由主审完成对应构建。相同命令按删除批次合并，不对 16 个文件重复运行。

| 编号 | 工作目录 | 命令 | 验证目标 |
| --- | --- | --- | --- |
| M-T | Alembic | `npm run typecheck`；`npm run lint:consumer-core-imports` | 所有 source/type 消费者已迁移，仍使用合法 Core 入口。 |
| P-T | AlembicPlugin | `npm run typecheck`；`npm run lint:consumer-core-imports` | 同上；包含 emitter type-only 导入。 |
| D | Alembic | `node scripts/check-shared-asset-drift.mjs --sibling ../AlembicPlugin` | 两清单同步、删除项已退休，其他 exact/shared 约束保持；无需再运行 Plugin wrapper 重复同一比较。 |
| M-C | Alembic | `node node_modules/vitest/vitest.mjs run test/integration/HttpApi.test.ts -t 'Health Endpoints'` | 真实 HttpServer 启动通过 Core cache 导入；保留初始化行为。 |
| M-S | Alembic | `node node_modules/vitest/vitest.mjs run test/integration/ShutdownCoordinator.test.ts` | 直接 Core 单例在 Main test module 隔离下仍满足 LIFO/防重入/失败隔离。 |
| P-S | AlembicPlugin | `node node_modules/vitest/vitest.mjs run test/integration/ShutdownCoordinator.test.ts test/unit/ServiceContainerShutdown.test.ts` | Plugin 单例行为以及 service drain→store flush/destroy 的宿主关闭顺序。 |
| P-C | AlembicPlugin | `node node_modules/vitest/vitest.mjs run test/unit/CoverageLedgerWiring.test.ts test/unit/HostAgentDimensionCompletionWorkflow.test.ts -t 'coverage ledger|writeCoverageLedgerForCompletion|reflowDeepMiningRound'` | 账本写入与完成链消费保持；不增加同义 wrapper 测试。 |
| M-B | Alembic | `npm run build:self` | clean dist 后重编本宿主，避免旧 relay 编译产物掩盖漏迁移。 |
| P-B | AlembicPlugin | `npm run build` | clean build 与 postbuild provenance 一起更新，确认 bin/HostMcpServer 仍可编译。 |

打包只在这批进入 release staging 时追加现有命令，不是每个 relay 的最小单测：Main `npm run release:staging:pack`；Plugin `npm run prepare:codex-runtime-package` 后对生成目录执行 `npm pack --dry-run --json --ignore-scripts` 并核对 file list。它们会创建 staging 产物，当前只读研究没有执行，也不需要真正发布。

全程不改或删除 `@alembic/core` 的公共 exports；Core 真实能力与 DTO 的现有验证继续归 Core。
