# AlembicAgent interface boundary optimization Wave 1

日期：2026-05-18

状态：`已完成`

总控入口：`docs/workspace/alembic-core-agent-interface-boundary-workspace-plan-2026-05-18.md`

## 完成范围

- 新增 `@alembic/agent` public API 边界策略和机器检查：
  - `config/agent-public-api-boundary.json`
  - `scripts/lint-agent-public-api-boundary.mjs`
  - `scripts/smoke-agent-public-imports.mjs`
- 新增 Core consumer 边界 allowlist / reference limit：
  - `config/core-import-boundary.json`
  - `npm run lint:core-import-boundary`
  - `npm run check` 已串入 public API boundary 与 Core import boundary。
- 替换可直接收口的 Core imports：
  - `DimensionSop` → `@alembic/core/dimensions`
  - `RecipeDimension` → `@alembic/core/dimensions`
  - `FieldSpec` → `@alembic/core/knowledge`
  - `folder-names` → `@alembic/core/workspace`
  - `RecipeImpactPlanner` deep file → `@alembic/core/service/evolution` provisional facade
- 将 Agent runtime 自有 token 估算与并发 limiter 收到本仓库本地 helper：
  - `src/shared/token-utils.ts`
  - `src/shared/concurrency.ts`
- 未修改 `Alembic`、`AlembicCore`、`AlembicPlugin` 或 `AlembicDashboard`。

## 提交

- AlembicAgent 提交：`b3a57e3a6ff83525332901ad6ceda24cf2fb7d21`

## 验证命令和结果

- `npm run build:check`：通过。
- `npm run lint`：通过，退出码 0；仍打印既有 Biome warnings。
- `npm run lint:agent-import-boundary`：通过。
- `npm run lint:public-api-boundary`：通过，15 个 exact exports，无 wildcard exports。
- `npm run lint:core-import-boundary`：通过；扫描 214 个文件、52 个 `@alembic/core` imports，issueCount 0。
- `npm run test`：通过，9 个 test files / 37 个 tests。
- `npm run check`：通过；已串联 build、lint、Agent import boundary、public API boundary、Core import boundary 和 test。
- `npm run smoke:public-imports`：通过；15 个 public subpaths 均可 import。
- `git diff --check`：通过。

## Public API 分类结果

全部 15 个 package exports 归类为 `stable-public`：

`.`, `./agent`, `./service`, `./runtime`, `./prompts`, `./domain`, `./forge`, `./tasks`, `./profiles`, `./ai`, `./tools`, `./tools/v2`, `./tools/terminal`, `./memory`, `./context`

分类计数：

- `stable-public`: 15
- `provisional-public`: 0
- `transitional-internal`: 0
- wildcard exports: 0

## Core import boundary 处理结果

初始扫描基线：

- refs: 56
- stable: 42
- provisional: 0
- transitional: 14
- issueCount: 14

本轮后带 `config/core-import-boundary.json` 扫描结果：

- refs: 52
- stable: 46
- provisional: 1
- transitional: 5
- issueCount: 0

剩余受控 non-stable imports：

| Specifier | refs | 判断 |
| --- | ---: | --- |
| `@alembic/core/shared/similarity` | 2 | Agent memory retrieval/store 仍需要统一相似度算法；建议 Core 后续提供 stable utility/search/vector facade。 |
| `@alembic/core/infrastructure/database/drizzle/schema` | 2 | Agent memory store 直接使用 Core semantic memory Drizzle schema；建议 Core 后续提供 stable memory repository/schema contract 或明确 adapter allowlist。 |
| `@alembic/core/shared/constants` | 1 | SessionStore 只使用 cache TTL/limit 常量；建议 Core 后续提供 stable runtime/cache constants facade，或允许 Agent 自有配置。 |
| `@alembic/core/service/evolution` | 1 | 已从 deep file import 收敛到 provisional facade；建议 Core 后续抽出 stable evolution audit reason / plan contract。 |

## 遗留风险

- `npm run lint` 仍打印既有 Biome warnings，但命令退出码为 0。
- 剩余 6 个 non-stable Core refs 已被 reference limit 冻结；是否新增 Core stable facade 需要 `AlembicCore` 后续决策。
- 本轮只修改并提交 `AlembicAgent`。

## 下一步建议

- 总控可将 `AlembicAgent` Wave 1 标记为 `已完成`。
- 等 `AlembicCore` 回填后，若 Core 新增 stable facade，再派发 Agent Wave 2 替换剩余 allowlist imports。
- 外层 `Alembic` 后续可将 `@alembic/agent` 15 个 exact subpath 视为 locked consumer surface；不要新增 deep import 或恢复本地 duplicate。
