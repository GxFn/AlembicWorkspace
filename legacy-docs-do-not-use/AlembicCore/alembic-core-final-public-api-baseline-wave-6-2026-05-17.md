# AlembicCore Final Public API Baseline Wave 6

日期：2026-05-17
窗口：AlembicCore
状态：已完成

## 1. 完成范围

本轮按 `docs/workspace/alembic-agent-cutover-final-integration-readiness-wave-6-plan-2026-05-17.md` 的 AlembicCore 分派执行 Final Core baseline。

完成内容：

- 复验 Core public API boundary 未因外层 Agent / terminal / Plugin cutover 发生漂移。
- 复验 Core tests、lint、typecheck、public API smoke 均稳定。
- 复验 package build output 可生成。
- 确认 Core 未承接 Agent runtime、terminal runtime 或 Plugin runtime。

本轮没有修改 Core 业务实现。

## 2. 提交 Hash

- Core 基线提交：`6b7b52a17fe214816c41344860caeb8bf35f1923`
- 短 hash：`6b7b52a`
- 提交标题：`chore: add public api boundary governance`
- 本轮新增代码提交：无

## 3. 验证命令与结果

| 命令 | 结果 | 说明 |
| --- | --- | --- |
| `npm run check` | 通过 | 包含 `build:check`、`lint:public-api-boundary`、`test`、`lint`。 |
| `npm run build` | 通过 | TypeScript package output 构建成功。 |
| `npm run smoke:public-api` | 通过 | `Imported 73 exact public API entrypoints.` |
| `npm --cache <temporary-npm-cache> pack --dry-run` | 通过 | package dry run 生成 715 个文件的 tarball 清单，package size 约 2.5 MB，unpacked size 约 22.5 MB。 |

`npm run check` 细节：

- Public API boundary：134 个 package exports 已分类。
- Exact exports：73。
- Wildcard exports：61。
- Status summary：Stable 15、Provisional 21、Transitional 98。
- Vitest：60 个 test files、926 个 tests 全部通过。
- Biome：检查 415 个文件，无修复。

## 4. 观察到的非阻塞输出

- `npm run test` 阶段仍输出 `error: Could not access 'HEAD'`，但测试退出码为 0，所有测试通过。该输出此前已出现，当前不构成 Wave 6 阻塞。
- 直接运行 `npm pack --dry-run` 会命中本机全局 npm cache 权限问题：npm cache 中存在 root-owned 文件。为避免修改用户全局环境，本轮使用临时 npm cache 复验 package 内容，结果通过。

## 5. 遗留风险

- Core package 仍保留 61 个 wildcard exports，按当前 public API policy 均为 Transitional Internal。Wave 6 未改变该状态。
- Core 仍有 Provisional / Transitional import surface，后续外层仓库应继续通过 boundary checker 避免新增 deep import。
- 本机全局 npm cache 权限问题不是 Core 代码问题，但如果后续本机需要直接运行 `npm pack`，需要修复 npm cache 权限或继续使用临时 cache。

## 6. 下一步建议

- 等待 `Alembic` host terminal/sandbox smoke、`AlembicPlugin` agent-free release gate、`AlembicDashboard` build/live smoke 完成后，再判断是否需要 Core 补充任何 public contract。
- Core 不主动接收 Agent runtime、terminal runtime、Plugin runtime。
- 若外层窗口反馈真实 Core API 缺口，仍按既有规则处理：必须有真实调用方、行为边界、测试、迁移说明，禁止新增薄 facade。
