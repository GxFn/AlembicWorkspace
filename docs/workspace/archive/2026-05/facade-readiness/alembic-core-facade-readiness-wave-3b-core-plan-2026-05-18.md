# AlembicCore Facade Readiness Wave 3B-Core Plan

日期：2026-05-18
总控窗口：AlembicWorkspace
状态：已完成

## 背景

Wave 3A 已完成：`AlembicCore` 建立 public API closeout inventory 和 no-growth gate，`Alembic` / `AlembicPlugin` 已替换第一批已有 stable facade 可覆盖的 imports。当前剩余 transitional refs 中，最适合快速推进的一组是：

| Export | refs | 消费方 |
| --- | ---: | --- |
| `./shared/*` | 69 | Alembic 37；AlembicPlugin 32 |
| `./infrastructure/config/*` | 18 | Alembic 11；AlembicPlugin 7 |
| `./types/*` | 16 | Alembic 14；AlembicPlugin 2 |
| `./service/candidate/*` | 10 | Alembic 5；AlembicPlugin 5 |

这 113 个 refs 大多是横向 contract：错误类型、配置路径、schema、token / similarity helpers、test mode、WorkspaceSettingsStore、candidate similarity / aggregation、workflow / reactive evolution types。它们不应由消费层各自猜测替换路径，因此本波先只派 `AlembicCore` 开路。

## Wave 3B-Core 目标

1. `AlembicCore` 对 `shared / config / types / candidate` 做真实消费清点，产出 deep specifier 到目标 facade 的替换地图。
2. 补齐或收窄已有 exact facade 的导出能力，让下一波 `Alembic` / `AlembicPlugin` 可以按图替换，而不是继续消费 wildcard deep imports。
3. 决定这四组入口的 public status：`promote-to-stable`、`keep-provisional but consumer-ready`、`split smaller facade` 或 `must-keep-transitional`。
4. 不在本波修改 `Alembic` / `AlembicPlugin` 消费代码；消费层下一波再做批量替换和 allowlist 减量。

## 当前事实

- `@alembic/core` 已有 exact provisional exports：`./config`、`./shared`、`./types`、`./service/candidate`。
- 消费层仍在大量使用 wildcard deep imports，说明 exact facade 的 contract 覆盖或迁移地图还不够明确。
- `AlembicAgent` 当前 Core imports 为 stable 48 / transitional 0，本波不需要参与。
- `AlembicPlugin` 必须继续保持 agent-free 和 artifact-only release 边界；本波不触碰 Plugin release artifact。

## 执行顺序

本波执行时只发送给 `AlembicCore`；当前 Core 已完成并回填，本计划不再发送执行提示词。

`Alembic` / `AlembicPlugin` 保持观察，不在本计划中直接修改消费层；后续应新建 Wave 3B-Consumer 总控文档，再派两个外层窗口按 Core 替换地图执行。

## 窗口分派

| 窗口 | 状态 | 任务 | 文档动作 | 保存位置 | 挂载入口 | 回填位置 | 验证命令 | 阻塞/依赖 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `AlembicCore` | 已完成 | 已处理 `shared / config / types / candidate` facade readiness：清点真实 consumer imports，补齐 exact facade 导出，更新 public API closeout policy / report，产出下一波消费层可执行替换地图。 | 已新建 | `docs/AlembicCore/alembic-core-facade-readiness-wave-3b-2026-05-18.md` | 本文“窗口分派”；`docs/workspace/index.md` 当前入口 | 本文“回填区 / AlembicCore” | `npm run lint:public-api-boundary`；`npm run report:public-api-closeout`；`npm run smoke:public-api`；`npm run build:check`；`npm run lint`；`npm run check`；Alembic / Plugin consumer scan；`git diff --check`；`git status --short` | 已解除；Core 提交 `75fac5642b6da736a00667539a720172d23b85c3`。 |
| `Alembic` | 观察中 | 暂不修改消费层；Core 替换地图已完成，等待新建 Wave 3B-Consumer 总控文档后再执行。 | 无需新建 | 无 | 本文“窗口分派” | 本文“回填区 / Alembic” | 无 | 依赖已解除；等待下一波分派文档。 |
| `AlembicAgent` | 观察中 | Agent Core imports 已为 stable-only，本波无直接任务；只需后续总控确认 Core public API 没有影响 Agent。 | 无需新建 | 无 | 本文“窗口分派” | 本文“回填区 / AlembicAgent” | 无 | 不发送提示词。 |
| `AlembicDashboard` | 观察中 | 本波不涉及 Dashboard API client 或 UI。 | 无需新建 | 无 | 本文“窗口分派” | 本文“回填区 / AlembicDashboard” | 无 | 不发送提示词。 |
| `AlembicPlugin` | 观察中 | 暂不修改消费层；Core 替换地图已完成，等待新建 Wave 3B-Consumer 总控文档后再执行。继续保持 agent-free / artifact-only 边界。 | 无需新建 | 无 | 本文“窗口分派” | 本文“回填区 / AlembicPlugin” | 无 | 依赖已解除；等待下一波分派文档。 |
| `BiliDili` | 无任务 | 当前是 AlembicCore public facade readiness，不涉及真实测试项目。 | 无需新建 | 无 | 本文“窗口分派” | 本文“回填区 / BiliDili” | 无 | 不发送提示词。 |

## AlembicCore 具体任务

### 1. 真实消费清点

读取 `Alembic` 和 `AlembicPlugin` 的实际 imports，至少覆盖：

- `@alembic/core/shared/*`
- `@alembic/core/infrastructure/config/*`
- `@alembic/core/types/*`
- `@alembic/core/service/candidate/*`

产出表格：

```text
当前 deep specifier -> 当前符号 -> 消费方 / 文件数 -> 建议目标 facade -> 决策 -> 风险
```

### 2. Facade readiness 决策

优先使用已有 exact facades：

- `@alembic/core/shared`
- `@alembic/core/config`
- `@alembic/core/types`
- `@alembic/core/service/candidate`

只有当现有 facade 名称与稳定公共语义明显不匹配时，才允许新增更窄 exact facade；新增前必须说明为什么不能复用现有 exact export。

可选决策类别：

- `consumer-ready-stable`：可作为下一波消费层 stable 目标。
- `consumer-ready-provisional`：可先让消费层收敛到 exact provisional facade，但暂不承诺 stable。
- `split-required`：需要拆成更小 facade，避免把整个 deep 目录稳定化。
- `keep-transitional`：仍是内部实现，不给消费层替换。

### 3. 代码与策略更新

允许的改动：

- 补齐 `src/shared/index.ts`、`src/config.ts`、`src/types/index.ts`、`src/service/candidate/index.ts` 的必要导出。
- 更新 `config/public-api-boundary.json` 的 closeout manual categories / expected counts / status 分类。
- 增强 `scripts/report-public-api-closeout.mjs`，让 report 能输出 target facade / replacement readiness / blocked reason。
- 增加或更新 smoke，证明目标 facades 能真实导入所需符号。

禁止的改动：

- 不删除仍被 Alembic / AlembicPlugin 消费的 wildcard export。
- 不把整个 `shared/*`、`types/*`、`infrastructure/config/*`、`service/candidate/*` 盲目提升为 stable。
- 不新增薄 wrapper 或空 facade 来凑数；facade 必须承载真实公共 contract。
- 不修改 `Alembic`、`AlembicPlugin`、`AlembicAgent`、`AlembicDashboard`、`BiliDili` 代码。
- 不做 npm publish、GitHub release、vendor / remote pointer 同步、runtime artifact refresh。

## 验收标准

`AlembicCore` 完成后必须满足：

- 新建执行记录 `docs/AlembicCore/alembic-core-facade-readiness-wave-3b-2026-05-18.md`。
- `shared / config / types / candidate` 的每个实际 deep specifier 都有明确决策：可替换目标、拆分原因或保留 transitional 原因。
- 至少让一批高频 deep imports 变成下一波可替换状态；目标是覆盖 50+ refs 的消费层替换潜力。
- `npm run lint:public-api-boundary` 通过，并保持 no-growth 或明确降低上限。
- `npm run report:public-api-closeout` 输出可复核的 replacement readiness 信息。
- `npm run smoke:public-api`、`npm run build:check`、`npm run lint`、`npm run check` 通过。
- Alembic / AlembicPlugin consumer scan issue 0，且不要求消费层本波提前改代码。

## 下一波判断

Wave 3B-Core 通过后，总控再决定是否开启 Wave 3B-Consumer：

- 如果 Core 已给出 50+ refs 的明确替换地图：派发 `Alembic` 和 `AlembicPlugin` 做批量 consumer replacement。
- 如果 Core 发现多数入口仍需拆分：先让 Core 做 3B-Core-2，不让消费层空转。
- 如果只有少量安全替换：消费层下一波缩小目标，不追求数字。

## 可复制提示词

发送给：无

不发送窗口：`AlembicCore`、`Alembic`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`、`BiliDili`

```text
本波已完成，不再发送执行提示词。下一波如启动，应新建 Wave 3B-Consumer 总控文档后再发送给 Alembic / AlembicPlugin。
```

## 回填区

### AlembicCore

- 状态：已完成
- 完成范围：补齐 `@alembic/core/config` exact facade 直接导出；新增 `closeout.facadeReadiness` 替换地图；增强 public API closeout report 输出 replacement readiness；扩展 public API smoke 覆盖 `config / shared / types / service/candidate` facade；新建执行记录 `docs/AlembicCore/alembic-core-facade-readiness-wave-3b-2026-05-18.md`。
- 提交 hash：`75fac5642b6da736a00667539a720172d23b85c3`
- 验证命令：`npm run lint:public-api-boundary`；`npm run report:public-api-closeout`；`npm run smoke:public-api`；`npm run build:check`；`npm run lint`；`npm run check`；Alembic / AlembicPlugin / AlembicAgent consumer scan；`git diff --check`；`git status --short`。
- 验证结果：全部通过。`report:public-api-closeout` 输出 replacement readiness `113/113`，其中 `consumer-ready-stable=6`、`consumer-ready-provisional=107`、`split-required=0`、`keep-transitional=0`；Alembic / AlembicPlugin / AlembicAgent consumer scan issue 均为 0；`npm run check` 中 Vitest 60 files / 919 tests passed，期间有既有 `Could not access 'HEAD'` 提示但退出码为 0；Core 提交后工作区干净。
- 遗留风险：本波目标 facade 多数仍为 provisional，不是 stable 承诺；下游 dynamic import / mock 需要跟随 facade 入口替换；`@alembic/core/types` 替换必须保持 `import type`；本波不删除 Core wildcard exports。
- 下一步建议：新建 Wave 3B-Consumer 总控文档后，仅派 `Alembic` 和 `AlembicPlugin` 按执行记录替换 deep imports，并同步收紧各自 Core import boundary allowlist/reference limits。

### Alembic

- 状态：观察中
- 观察结论：等待 Core 输出替换地图；本波不发送提示词。

### AlembicAgent

- 状态：观察中
- 观察结论：Agent 当前 Core imports stable-only，本波不发送提示词。

### AlembicDashboard

- 状态：观察中
- 观察结论：本波不涉及 Dashboard API client / UI，不发送提示词。

### AlembicPlugin

- 状态：观察中
- 观察结论：等待 Core 输出替换地图；本波不发送提示词。

### BiliDili

- 状态：无任务
- 判断理由：当前是 AlembicCore public facade readiness，不涉及真实测试项目。
