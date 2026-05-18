# Alembic Runtime Contract Consumption Wave 2 Daemon Health

日期：2026-05-18
窗口：Alembic
状态：待验收
总控计划：[`docs/workspace/alembic-runtime-contract-consumption-wave-2-workspace-plan-2026-05-18.md`](../workspace/alembic-runtime-contract-consumption-wave-2-workspace-plan-2026-05-18.md)

## 完成范围

- `/api/v1/daemon/health` 改为使用 `@alembic/core/daemon` 的 canonical helper 构建主体字段：
  - `createAlembicRuntimeCapabilities()`
  - `createAlembicRuntimeHealthData()`
  - Core file monitor event source / job kind / endpoint constants
- `lib/daemon/RuntimeBoundary.ts` 改为消费 Core runtime/capability 类型与常量，不再本地手写 route、file monitor sources、job kinds 和 internal AI capability shape。
- health data 补充稳定消费字段：
  - `dataRootSource`
  - `runtimeDir`
  - top-level `runtimeBoundary`
  - compatibility `capabilities.runtimeBoundary`
- `runtimeBoundary` 保留为 Alembic-owned adapter 摘要，但其 file monitor、jobs、internal AI 字段从 Core-generated capabilities 派生。
- `buildDaemonCapabilities()` 现在返回 Core canonical `AlembicRuntimeCapabilities`，测试显式确认其本体不包含 `runtimeBoundary`。

## 边界判定

- Alembic 仍拥有 daemon、WorkspaceResolver / ProjectRegistry 消费、JobStore、Dashboard server、file monitor 和 internal AI job 主实现。
- Core 负责 headless runtime/capability contract；Alembic 只消费 helper 生成 health 的 canonical 字段。
- Plugin / Dashboard 可优先消费 canonical `enhancement`、`capabilities`、project identity，并在需要 Alembic-owned 归属摘要时读取 `runtimeBoundary`。

## 提交

- Alembic 提交 hash：`9ea629fc03a3e5de2d2c449ada6ca77dbeccb45c`
- 提交标题：`feat: consume core runtime contracts in daemon health`

## 验证命令与结果

- `npm run build:check`
  - 通过；使用本地 `../AlembicCore` 构建 Core 后完成 Alembic TypeScript no-emit 检查。
- `npm run test:unit -- test/unit/DaemonCapabilities.test.ts test/unit/DaemonFileChangeCollector.test.ts`
  - 通过；2 个测试文件、5 个测试通过。
- `npm run lint:consumer-core-imports`
  - 通过；扫描 416 个文件、559 个 `@alembic/core` imports。
- `npx biome check --diagnostic-level=error lib/daemon/RuntimeBoundary.ts lib/http/routes/daemon.ts lib/http/routes/file-changes.ts test/unit/DaemonCapabilities.test.ts`
  - 通过。
- `git diff --check`
  - 通过。
- `git diff --check HEAD~1..HEAD`
  - 通过。

## 遗留风险

- Core `AlembicRuntimeHealthData` 当前未包含 `dataRootSource` / `runtimeDir`；Alembic 本波以 health extension 方式补充。若 Plugin / Dashboard 后续证明需要 canonical 类型，下一波应在 Core 补入 project identity 字段。
- 为兼容 Wave 1 consumer，Alembic 同时输出 top-level `runtimeBoundary` 和 `capabilities.runtimeBoundary`；下一波可在 Plugin / Dashboard 完成 canonical consumption 后收敛兼容位置。

## 下一波建议

- `AlembicPlugin` 优先通过 Core `summarizeAlembicRuntimeCapabilities()` 消费 `capabilities`，只把 `runtimeBoundary` 当 Alembic-owned attribution / handoff 摘要。
- `AlembicDashboard` view model 优先对齐 canonical health fields，再以 fallback 读取 `runtimeBoundary` owner 信息。
- 若两个消费者都需要 `dataRootSource` / `runtimeDir` 的 typed contract，下一波由 `AlembicCore` 扩展 `AlembicRuntimeProjectIdentity` 或新增 project identity helper。
