# AlembicCore 阶段 10 完成记录：Guard 免疫系统迁移

日期：2026-05-17

状态：Core 内部迁移完成；外层接入与删除由其他窗口按本文执行。

Core 提交：`a1b93ec Migrate guard immune system core`

## 范围

阶段 10 已在 `AlembicCore` 内完成 Guard 免疫系统迁移。迁移方式是从 `Alembic/lib/service/guard/**` 完整复制真实实现到 Core，再做最小 import/export 和 lint 机械修正；没有把 Guard 做成薄 facade。

Core 现在拥有：

- Guard 规则生命周期服务：创建、启用、禁用、列表、搜索、统计、audit log 集成。
- `GuardCheckEngine`：内置规则、数据库规则、scope filtering、跨文件检查、code-level checks、AST layer、uncertainty collector、SignalBus 命中信号。
- `ReverseGuard`：Recipe/Rule 到代码事实的反向漂移检测。
- Guard 免疫闭环：`CoverageAnalyzer`、`GuardFeedbackLoop`、`RuleLearner`、`ComplianceReporter`、`ViolationsStore`、`SourceFileCollector`。
- Guard 违规仓储：`GuardViolationRepositoryImpl`。

明确不进入 Core 的内容：

- HTTP route / MCP handler / CLI 命令注册。
- Codex MCP tool exposure、preflight、transport、权限策略。
- Dashboard 展示和 daemon wiring。
- Alembic internal agent、tool system、多渠道交付。

## 已迁入文件

Guard service：

- `src/service/guard/ComplianceReporter.ts`
- `src/service/guard/CoverageAnalyzer.ts`
- `src/service/guard/ExclusionManager.ts`
- `src/service/guard/GuardCheckEngine.ts`
- `src/service/guard/GuardCodeChecks.ts`
- `src/service/guard/GuardCrossFileChecks.ts`
- `src/service/guard/GuardFeedbackLoop.ts`
- `src/service/guard/GuardPatternUtils.ts`
- `src/service/guard/GuardService.ts`
- `src/service/guard/ReverseGuard.ts`
- `src/service/guard/RuleLearner.ts`
- `src/service/guard/SourceFileCollector.ts`
- `src/service/guard/UncertaintyCollector.ts`
- `src/service/guard/ViolationsStore.ts`
- `src/service/guard/index.ts`

Repository：

- `src/repository/guard/GuardViolationRepository.ts`
- `src/repository/guard/index.ts`

Package/API：

- `src/service/index.ts` 导出 `guard/index.js`。
- `package.json` 新增 `@alembic/core/service/guard` 与 `@alembic/core/service/guard/*` exports。

测试：

- `test/unit/GuardScopeFiltering.test.ts`
- `test/unit/ReverseGuard.test.ts`
- `test/GuardCheckEngine.test.ts`
- `test/GuardImmuneSystem.test.ts`

## 关键实现决策

- `GuardViolationRepository.ts` 在 Core 中已存在，且与 Alembic 主源行为一致；本阶段没有覆盖 Core 里更安全的既有实现。
- `GuardService` 保留 knowledgeRepository + auditLogger 的依赖注入边界；外层只需要把自己的 repository/audit 实例传给 Core。
- `GuardCheckEngine` 保留 raw DB fallback：外层可以传完整 `DatabaseConnection`，也可以传 raw SQLite DB。
- `ComplianceReporter` 继续通过 `SourceFileCollector` 扫描真实项目文件；宿主只负责提供 projectRoot 和外层触发入口。
- `RuleLearner` 仍走 `PathGuard` 保护写入范围；Core 只写知识库目录内的 `guard-learner.json`。
- SignalBus 保持可选依赖；Core 产出信号，外层决定是否订阅、展示或转发。

## 验证

- `npm run build:check` 通过。
- 阶段 10 Guard 测试通过：4 个测试文件、33 个测试。
- `npm run test` 通过：49 个测试文件、880 个测试。
- `npm run build` 通过。
- 阶段 10 变更文件 Biome 检查通过，无 warnings。
- package self-reference smoke 通过：
  - `@alembic/core/service/guard`
  - `@alembic/core/service/guard/GuardCheckEngine`
  - `@alembic/core/repository/guard`

说明：全量 `npm run test` 期间仍会打印一行既有非阻断 stderr：`error: Could not access 'HEAD'`；命令退出码为 0，测试全部通过。本阶段未处理该既有测试输出。

## 外层接入任务

两个外层仓库先把 `vendor/AlembicCore` 或模块依赖更新到阶段 10 提交或之后。

推荐 Core import：

- `@alembic/core/service/guard`
- `@alembic/core/service/guard/GuardService`
- `@alembic/core/service/guard/GuardCheckEngine`
- `@alembic/core/service/guard/ReverseGuard`
- `@alembic/core/service/guard/ComplianceReporter`
- `@alembic/core/service/guard/ViolationsStore`
- `@alembic/core/repository/guard`

Alembic 外层：

- CLI `guard` 命令改用 Core `GuardCheckEngine`、`ComplianceReporter`、`RuleLearner`、`ViolationsStore`。
- HTTP guard routes 只保留请求解析、权限、响应格式和 Dashboard/daemon wiring；具体 check/audit/report 调 Core。
- ServiceContainer 中 guardService / guardCheckEngine / complianceReporter 的实例化改为 Core class。
- Bootstrap/project-intelligence 中若触发 Guard audit，改为调用 Core `GuardCheckEngine.auditFile/auditFiles`。
- 外层保留 CLI/HTTP/Dashboard adapter、权限策略、日志展示和 agent/tool 调度。

AlembicPlugin 外层：

- Codex MCP guard handler 改用 Core `GuardCheckEngine`、`ComplianceReporter`、`ReverseGuard`。
- MCP tool schema、tool policy、preflight、projectRoot override、Codex transport 继续留在 Plugin。
- 插件只把 Core 的 violations/report/capabilityReport 转为 MCP tool response，不复制 Guard 内核逻辑。
- Plugin 的 status/diagnostics 中如需显示 Guard 可用性，读取 Core export smoke 或实例化结果。

## 接入后扫描

在 Alembic / AlembicPlugin 分别执行：

```bash
rg -n "lib/service/guard|service/guard/Guard|service/guard/ReverseGuard|service/guard/ComplianceReporter|service/guard/RuleLearner|repository/guard/GuardViolationRepository" lib bin test
```

确认不再直接引用外层重复 Guard 实现后，再扫描 Core import：

```bash
rg -n "@alembic/core/service/guard|@alembic/core/repository/guard" lib bin test
```

## 删除计划

接入完成、扫描无遗留、代表测试通过后，才删除外层重复实现。

可删除候选：

- `lib/service/guard/**`
- `lib/repository/guard/**`

不删除：

- CLI command registration。
- HTTP routes / MCP handlers。
- Codex tool schema、preflight、transport、权限策略。
- Dashboard/daemon wiring。
- 外层 ServiceContainer 中对 Core class 的装配代码。
- Alembic internal agent/tool system。
