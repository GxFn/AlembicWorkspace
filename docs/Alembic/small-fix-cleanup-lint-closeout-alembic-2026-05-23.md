# Alembic SFC-R2 Lint Closeout

日期：2026-05-23
窗口：`Alembic`
任务包：`SFC-R2-ALEMBIC`
提交：`c7cc12c3d28af74e522680f582fb2e3b0b03d2f7` (`fix: close alembic lint diagnostics`)

## 完成范围

- 关闭 `SFC-ALEMBIC-005`：将 Alembic 主仓库 Biome diagnostics 从基线 `227 warnings / 25 infos` 收敛到 `npm run lint` 无 warning / info。
- 增加 Biome overrides，将 CLI / scripts / `lib/cli` 的用户可见 `console` 输出、脚本动态类型、resident DI container 和 internal agent projection 动态 artifact 标为显式保留边界。
- 清理真实代码问题：未使用变量 / import、可安全替换的非空断言、宽 `any`、隐式 any、literal-key / parseInt / banned type / confusing void 等。
- 用局部 guard 和明确类型替代非空断言，涉及 bootstrap、HTTP routes、resident handlers、monitoring、wiki、search rerank、skill hooks、rescan workflow 等路径。
- 未修改 HTTP/API contract，未启动 daemon / Dashboard live smoke，未操作 BiliDili。

## Lint Diagnostics 前后对比

前置基线（Biome JSON 扫描）：

- 总数：`227 warnings / 25 infos`
- 主要类别：`noConsole` 86、`noExplicitAny` 67、`noNonNullAssertion` 55、`useLiteralKeys` 19、未使用变量 / import 10、其它安全小项。
- 主要集中：`bin/cli.ts`、`scripts/*`、`lib/bootstrap.ts`、resident tool schema / handlers、HTTP routes、wiki render/generator。

完成后：

- `npm run lint`：通过，`Checked 207 files ... No fixes applied.`
- Biome JSON 摘要：`0 warnings / 0 infos`

## 仍保留项理由

- `bin/**`、`scripts/**`、`lib/cli/**` 的 `console`：CLI / repo utility 的用户可见 stdout / stderr 输出，删除会改变命令行为。
- `bin/**`、`scripts/**` 的少量动态类型 / 非空断言规则：脚本和 CLI glue 仍存在动态外部输入，已由 `typecheck` 和脚本验证兜底，本波不做大范围架构重写。
- `lib/resident/tool-schema/types.ts` 的 DI `get<T = any>`：resident service container 是动态服务注册边界，改为 `unknown` 会让既有调用方大面积丢失真实服务形状；保留为显式动态边界。
- `BootstrapProjections.ts` 的 phase artifact `any`：Agent runtime phase artifact 是策略可扩展 payload，当前没有稳定封闭 schema；本波只保留边界，不扩大为 runtime contract 改造。

## 验证命令与结果

- `npm run lint`：通过。
- `npm run check`：通过。
- `npm run build:check`：通过。
- `git diff --check`：通过。
- `./node_modules/.bin/vitest run --config vitest.unit.config.ts test/unit/CrossEncoderReranker.test.ts test/unit/WikiGenerator.test.ts test/unit/WorkflowSkillCompletionCapability.test.ts test/unit/BootstrapProjection.test.ts test/unit/SearchRouteTelemetry.test.ts test/unit/ResidentServiceBoundary.test.ts test/unit/BootstrapRuntimeInitializer.test.ts test/unit/WorkflowResultPersistence.test.ts`：通过，8 个 test files / 45 tests。
- `npm run test:unit`：当前 sandbox 下未通过；失败集中在 `SandboxNetworkProxy.test.ts` 的 `listen EPERM 127.0.0.1` 和 `TerminalAdapter.test.ts` 的 `sandbox-exec: sandbox_apply: Operation not permitted`，属于当前执行环境的网络监听 / seatbelt 权限限制。其余 110 个 test files / 1076 tests 已通过。

## 遗留风险与下一步建议

- Alembic 主仓库已形成 lint / check 基线，后续新增 warning / info 应按本次 allowlist 边界判断：优先修真实代码问题，只有 CLI 输出或动态 contract 边界才进入显式 override。
- 全量 `test:unit` 需要在允许 `127.0.0.1` listen 和 `sandbox-exec` 的本机环境复跑，确认 Terminal / SandboxNetworkProxy 既有测试状态。
- `GTODO-2026-05-23-019`（consumer allowance 收敛）仍按总控计划观察，本波未处理。
