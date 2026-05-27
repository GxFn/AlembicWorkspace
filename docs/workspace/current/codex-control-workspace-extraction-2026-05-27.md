# Codex Control Workspace Extraction

日期：2026-05-27
状态：已完成待归档（通用配置化已推送）
发送给：无
总控定位：本文件是 AlembicWorkspace 当前总控计划；本轮只做 workspace 自身归档、基线提交和通用 `codex-control-workspace` 仓库抽取，不修改 Alembic 产品子仓库。

## 目标判断

- 用户目标：将已经稳定的 workspace 总控 / VAD / 任务包 / skill / template / script 能力抽取为通用 GitHub 仓库 `GxFn/codex-control-workspace`，先按总控节奏推进。
- 最终完成定义：
- 037 当前主线完成态已归档到 `docs/workspace/archive/2026-05/plugin-intent-knowledge-route/`，AlembicWorkspace 当前账本不再停留在已完成待归档状态。
  - AlembicWorkspace 当前变更完成验证并形成可提交基线。
  - 新仓库 `GxFn/codex-control-workspace` 已初始化为通用参考仓库，包含 AGENTS / skills / templates / scripts / docs skeleton / 使用说明，并推送到远端。
- 当前是否已经达到：已达到；新仓库第一版已推送，后续通用配置化补强也已推送。
- 未达到时剩余差距：无。
- 已达到时验收 / 归档判断：新仓库 push 成功且 AlembicWorkspace 基线已提交；通用仓库已把运行脚本、公开 skill / template / test exchange 名称从 Alembic 硬编码迁到 `workspace.config.json` 和通用命名；本计划进入待归档，后续 init / installer 增强进入新仓库 TODO。
- 当前任务分区：规则治理 / skill 治理、归档、仓库抽取。
- 不纳入本轮事项：不启动 038 / 039，不恢复 037 实现，不派发 Alembic 子窗口，不修改产品子仓库，不设计商业化插件。

## 总控决策记录

- 本次决策触发：用户已新建 `GxFn/codex-control-workspace.git`，要求总控按自己的节奏处理。
- 需求 / 测试结果理解：037 已通过完整 VAD 自动化真实主线；当前适合先归档历史完成态，再把 workspace 组成抽为通用参考仓库。
- 已核对证据：归档前 `docs/workspace/index.md` 指向 037 已完成待归档计划；`git ls-remote https://github.com/GxFn/codex-control-workspace.git` 成功且远端为空；037 计划已归档到 `docs/workspace/archive/2026-05/plugin-intent-knowledge-route/`。
- 是否需要先验证 / 重新计划 / 用户确认：不需要额外确认；本轮只做 workspace 自身归档、验证和新仓库初始化。
- 本次允许更新：AlembicWorkspace 当前计划、索引、归档地图、脚本 / skill / template 已有待提交变更、通用仓库临时工作目录和远端新仓库。
- 本次不得更新：Alembic 产品子仓库源码、真实测试项目、私密 thread id、旧 automation runtime 状态。

## Design / 需求来源

- 来源类型：用户直接需求。
- 来源文档：无独立 Design handoff；本轮是 workspace 能力抽取。
- 用户确认状态：已确认可开始；GitHub 远端已创建。
- 总控接收结论：作为当前 workspace 治理 / 抽取主线执行。
- 是否需要目标阶段确认：否，范围明确为通用仓库第一版抽取。
- 是否需要代码实现依赖调研：仅需调研 workspace 自身脚本、skill、模板和当前账本。

## 代码事实与边界

- 相关仓库：`AlembicWorkspace`、新远端 `GxFn/codex-control-workspace`。
- 关键入口：`AGENTS.md`、`scripts/`、`skills/dev/`、`templates/`、`docs/workspace/`。
- producer / consumer 依赖：AlembicWorkspace 是能力来源；新仓库是通用消费方。
- 不可提前消费的上游：037 当前计划必须先从 current 状态归档，避免新仓库继承当前执行态。
- 不允许触碰的目录 / 仓库：所有 Alembic 产品子仓库和真实测试项目。
- 真实测试项目是否涉及：否。

## 阶段顺序

1. 建立本抽取计划并同步 current index / status。
2. 归档 037 当前计划，确认 workspace 账本从已完成待归档切换到抽取计划。
3. 验证并提交 AlembicWorkspace 当前基线。
4. 在临时目录初始化通用 `codex-control-workspace` 仓库，抽取 AGENTS / skills / templates / scripts / docs skeleton。
5. 运行新仓库最小验证，提交并推送到 `GxFn/codex-control-workspace.git`。

- 下一处真实阻塞点：无；后续是用户确认是否继续增强通用仓库或归档本抽取计划。
- 阻塞点之前还能做：无。
- 当前可派发窗口：`AlembicWorkspace` 自执行。
- 当前阻塞 / 观察窗口：无。

## 任务包

| 任务包 ID | 窗口 | 摘要 | 状态 |
| --- | --- | --- | --- |
| CCW-P1 | `AlembicWorkspace` | 建立抽取当前计划并归档 037 | 已完成 |
| CCW-P2 | `AlembicWorkspace` | 验证并提交 workspace 基线 | 已完成 |
| CCW-P3 | `AlembicWorkspace` | 初始化、验证并推送通用仓库 | 已完成 |
| CCW-P4 | `AlembicWorkspace` | 新仓库通用配置化补强并推送 | 已完成 |

### CCW-P1：归档与当前计划切换

窗口：`AlembicWorkspace`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-27

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-27

阶段目标：

- 让 037 从 current 计划状态收口到 archive。
- 让当前计划切换为本抽取计划。

主线动作：

- 运行 `sync-current-plan` 写入 index / status。
- 使用 `archive-workspace-docs` 归档 037 当前计划。

合并 TODO：

- `GTODO-2026-05-24-037`：已完成已归档，历史证据入口为 `docs/workspace/archive/2026-05/plugin-intent-knowledge-route/plugin-intent-knowledge-route-stage-1-mainline-2026-05-26.md`。

明确不包含：

- 不启动 038 / 039。
- 不派发任何产品子仓库。

下一处真实阻塞点：

- 已解除：本计划已同步为当前计划，037 计划已归档。

阻塞点之前还能做：

- 已完成。

验证命令：

```text
node scripts/sync-current-plan.mjs --check --json
node scripts/archive-workspace-docs.mjs --topic plugin-intent-knowledge-route --file docs/workspace/current/plugin-intent-knowledge-route-stage-1-mainline-2026-05-26.md --apply
```

回填要求：

- 完成范围：记录归档路径和 index / status 同步结果。
- 提交 hash：本任务包不单独提交。
- 验证命令和结果：记录命令输出摘要。
- 遗留风险：记录未归档文档或 stale current references。
- 下一步建议：进入 workspace 基线验证。

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档和目标仓库自己的 `AGENTS.md`。
- 开始执行前先明确声明当前窗口定位、目标仓库职责、本轮任务职责，以及本仓库明确不承担的职责。
- 若任务包较大，可在当前窗口职责和计划边界内自行判断是否开启 Codex 子 agent 分担工作；最终由当前窗口统一复核和回填。

### CCW-P2：workspace 基线验证与提交

窗口：`AlembicWorkspace`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：待定

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：待定

阶段目标：

- 验证并提交 AlembicWorkspace 当前已完成的 VAD / skill / script / template 变更，形成抽取源基线。

主线动作：

- 运行 workspace 机械验证和 script tests。
- 检查 git status，确认没有产品子仓库误入 workspace git。
- 提交 AlembicWorkspace。

合并 TODO：

- 无。

明确不包含：

- 不 push 产品子仓库。
- 不清理用户未要求删除的历史文档。

下一处真实阻塞点：

- 如果验证失败，必须先按失败链路修复；不得绕过后提交。

阻塞点之前还能做：

- 可以读取脚本输出定位失败。

验证命令：

```text
node scripts/verify-control-center.mjs --require-task-packages --with-script-tests
git diff --check
```

回填要求：

- 完成范围：
- 提交 hash：
- 验证命令和结果：
- 遗留风险：
- 下一步建议：

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档和目标仓库自己的 `AGENTS.md`。
- 开始执行前先明确声明当前窗口定位、目标仓库职责、本轮任务职责，以及本仓库明确不承担的职责。
- 若任务包较大，可在当前窗口职责和计划边界内自行判断是否开启 Codex 子 agent 分担工作；最终由当前窗口统一复核和回填。

### CCW-P3：通用仓库第一版抽取

窗口：`AlembicWorkspace`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：待定

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：待定

阶段目标：

- 生成可独立使用的 `codex-control-workspace` 初版仓库。

主线动作：

- 在临时目录初始化新仓库。
- 抽取 AGENTS / skills / templates / scripts / docs skeleton，避免带入 Alembic 历史执行文档和私密 local runtime。
- 写入 README、配置样例和迁移说明。
- 运行新仓库最小验证，提交并 push 到 GitHub。

合并 TODO：

- 无。

明确不包含：

- 不复制 `docs/workspace/archive/` 历史执行记录。
- 不复制 `.workspace-local/`。
- 不写入真实 thread id、绝对私密路径或 token。
- 不把本轮做成 Codex 插件。

下一处真实阻塞点：

- 如果新仓库脚本仍有 Alembic 硬编码导致最小验证失败，需要先记录并改为配置或明确为后续 TODO。

阻塞点之前还能做：

- 可以先完成文档 skeleton 和 README。

验证命令：

```text
node --test scripts/visible-dispatch.test.mjs scripts/workspace-control.test.mjs
node scripts/check-script-docs.mjs
git diff --check
```

回填要求：

- 完成范围：
- 提交 hash：
- 验证命令和结果：
- 遗留风险：
- 下一步建议：

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档和目标仓库自己的 `AGENTS.md`。
- 开始执行前先明确声明当前窗口定位、目标仓库职责、本轮任务职责，以及本仓库明确不承担的职责。
- 若任务包较大，可在当前窗口职责和计划边界内自行判断是否开启 Codex 子 agent 分担工作；最终由当前窗口统一复核和回填。

### CCW-P4：通用配置化补强

窗口：`AlembicWorkspace`

派发时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-27

状态更新时间（北京时间，YYYY-MM-DD HH:mm CST）：2026-05-27

阶段目标：

- 除 legacy regression fixture 外，确保新仓库运行脚本、公开 skill / template / docs skeleton 不依赖 Alembic 项目名。

主线动作：

- 新增共享 `workspace-config` 读取层。
- 将 dispatch windows、repo names、test exchange、Design handoff、runtime process matchers、protected prefixes 等运行参数接入 `workspace.config.json`。
- 将公开 skill 目录、测试交接模板和 current test exchange 改为通用名称。
- 将全链 E2E fixture 改为通用窗口名。

合并 TODO：

- `CCW-TODO-001` 配置化部分已完成；init / installer 另留后续观察项。

明确不包含：

- 不重写提示词治理体系。
- 不制作 Codex 插件。
- 不复制 Alembic 历史执行文档。

下一处真实阻塞点：

- 无。

阻塞点之前还能做：

- 已完成。

验证命令：

```text
npm test
node scripts/verify-control-center.mjs --require-task-packages --with-script-tests
node scripts/run-workspace-pipeline-e2e.mjs --json
rg -n "AlembicWorkspace|AlembicDesign|AlembicTest|AlembicPlugin|AlembicCore|AlembicAgent|AlembicDashboard|BiliDili|\\bAlembic\\b|alembic-workspace-control|alembic-test-exchange|alembic-test-handoff-template" AGENTS.md docs skills templates scripts/README.md scripts/lib $(find scripts -maxdepth 1 -type f -name '*.mjs' ! -name '*.test.mjs') workspace.config.json workspace.config.example.json README.md
```

回填要求：

- 完成范围：记录配置化范围、提交 hash、验证结果和剩余非目标。
- 提交 hash：`f444449`。
- 验证命令和结果：记录命令输出摘要。
- 遗留风险：legacy Alembic test fixture 仍作为回归数据保留；init / installer 未做。
- 下一步建议：归档本计划，后续新仓库问题作为独立 TODO。

执行前置硬规则：

- 先读取本 workspace `AGENTS.md`、当前总控文档和目标仓库自己的 `AGENTS.md`。
- 开始执行前先明确声明当前窗口定位、目标仓库职责、本轮任务职责，以及本仓库明确不承担的职责。
- 若任务包较大，可在当前窗口职责和计划边界内自行判断是否开启 Codex 子 agent 分担工作；最终由当前窗口统一复核和回填。

## TODO / Backlog

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CCW-TODO-001 | 已完成 | generic workspace | P2 | `codex-control-workspace` | 把更多 Alembic 项目参数收敛为配置项，公开运行面改为通用命名。 | 否 | `f444449`。 | 新仓库 |
| CCW-TODO-002 | 观察中 | generic workspace | P3 | `codex-control-workspace` | 后续增加安装 / init 脚本，支持一键生成项目专属命名 skeleton。 | 否 | 用户后续确认。 | 新仓库 |

## 空闲窗口调度

| 窗口 | 调度 | 是否发送 | 原因 |
| --- | --- | --- | --- |
| `AlembicWorkspace` | 自执行 | 否 | 总控本窗口直接执行，不作为可发送子窗口。 |
| `Alembic` | 无任务 | 否 | 不修改产品子仓库。 |
| `AlembicCore` | 无任务 | 否 | 不修改产品子仓库。 |
| `AlembicAgent` | 无任务 | 否 | 不修改产品子仓库。 |
| `AlembicDashboard` | 无任务 | 否 | 不修改产品子仓库。 |
| `AlembicPlugin` | 无任务 | 否 | 不修改产品子仓库。 |
| `AlembicTest` | 无任务 | 否 | 不需要真实场景测试。 |

## 窗口分派

发送给：无

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>无任务 | 不发送。 |
| `AlembicCore`<br>无任务 | 不发送。 |
| `AlembicAgent`<br>无任务 | 不发送。 |
| `AlembicDashboard`<br>无任务 | 不发送。 |
| `AlembicPlugin`<br>无任务 | 不发送。 |
| `AlembicTest`<br>无任务 | 不发送。 |
| `BiliDili`<br>无任务 | 不触碰真实项目。 |

## 可复制提示词

发送给：无

```text
本轮是 AlembicWorkspace 自执行，不生成子窗口分派提示词。
```

## 测试交接

- 是否需要 `AlembicTest`：否。
- 总控自测结论：本轮验证对象是 workspace 脚本、文档账本和新仓库 skeleton，总控可以直接用脚本测试完成。
- 需要真实场景的理由：无。
- 测试前边界与多条件判断：
  - 测试要回答的问题：workspace 账本是否可归档并同步；新仓库 skeleton 是否可运行最小脚本验证。
  - 测试对象 / 目标窗口 / 线程 / 项目边界：仅 AlembicWorkspace 和 `/private/tmp/codex-control-workspace`。
  - 成功能推出的结论：第一版通用仓库可作为可复制参考提交并 push。
  - 失败能推出的结论：失败只说明 workspace 抽取脚本 / docs skeleton / 验证命令仍需修复，不能否定 037 产品结论。
  - 不能推出的结论：不能证明新仓库已经适配所有第三方项目，不能证明后续插件化完成。
  - 停止或不开始条件：发现私密 thread id、token、产品子仓库误提交、或远端无法访问。
- 测试单：无。
- 测试交流入口：[alembic-test-exchange.md](alembic-test-exchange.md)
- 真实项目保护说明：不触碰真实测试项目。

## 回填区

- 2026-05-27：用户已新建远端 `GxFn/codex-control-workspace.git`。总控创建本计划，准备先切换 current plan、归档 037，再抽取通用仓库。
- 2026-05-27：已运行 `node scripts/sync-current-plan.mjs --plan docs/workspace/current/codex-control-workspace-extraction-2026-05-27.md --write --json`，同步 `docs/workspace/index.md`、`docs/workspace/current/index.md` 和 `docs/workspace/current/workspace-current-status.md`。随后运行 `node scripts/archive-workspace-docs.mjs --topic plugin-intent-knowledge-route --file docs/workspace/current/plugin-intent-knowledge-route-stage-1-mainline-2026-05-26.md --apply`，037 计划已归档到 `docs/workspace/archive/2026-05/plugin-intent-knowledge-route/plugin-intent-knowledge-route-stage-1-mainline-2026-05-26.md`。
- 2026-05-27：AlembicWorkspace 基线验证通过：`node scripts/verify-control-center.mjs --require-task-packages --with-script-tests` 全部 PASS，workspace script tests 88 项通过；`node scripts/visible-dispatch.mjs post-run-audit --json` 返回 `ok=true`，VAD mode disabled 且无 active automation；`git diff --check` 通过。
- 2026-05-27：AlembicWorkspace 基线已提交：`ed8026e chore: prepare control workspace extraction`。随后在 `/private/tmp/codex-control-workspace` 初始化通用仓库，提交 `c213e70 Initial codex control workspace template` 并成功 push 到 `https://github.com/GxFn/codex-control-workspace.git`。新仓库包含 generic `AGENTS.md`、`workspace.config.json`、docs skeleton、skills、templates、scripts 和 package scripts；验证通过：`node scripts/verify-control-center.mjs --require-task-packages --with-script-tests`，workspace script tests 88 项通过；`git diff --cached --check` 通过。
- 2026-05-27：按用户要求继续通用化新仓库，提交并 push `f444449 Generalize control workspace configuration`。本次新增共享 `scripts/lib/workspace-config.mjs`，将窗口 / repo / test exchange / Design handoff / runtime process / protected prefix 等接入 `workspace.config.json`；公开 skill 目录改为 `skills/dev/control-workspace-governance/`，测试交接模板改为 `templates/test-handoff-template.md`，current 测试交流改为 `docs/workspace/current/test-exchange.md`，全链 E2E fixture 改为通用窗口名。验证通过：`npm test` 88 项通过；`node scripts/verify-control-center.mjs --require-task-packages --with-script-tests` 全部 PASS；`node scripts/run-workspace-pipeline-e2e.mjs --json` 返回 `ok=true` 且 16 步全绿；非测试运行面 hardcode 扫描只剩 README 说明 legacy Alembic regression fixture。

<!-- workspace-sync
{
  "status": "已完成待归档（codex-control-workspace 通用配置化已推送）",
  "indexPlanDescription": "通用 codex-control-workspace 抽取和配置化补强已完成：037 已归档，AlembicWorkspace 基线已提交，新仓库 GxFn/codex-control-workspace 已推送到 f444449。",
  "indexStatusDescription": "codex-control-workspace 抽取和通用配置化已完成待归档；新仓库已推送到 f444449，后续 init / installer 进入新仓库 TODO。",
  "currentIndexType": "当前计划",
  "currentIndexDescription": "codex-control-workspace 通用仓库抽取和配置化补强已完成待归档；新仓库已 push 到 f444449。",
  "currentStatusSummary": "codex-control-workspace 通用仓库抽取和配置化补强已完成：037 已归档，AlembicWorkspace 基线提交 ed8026e，新仓库 GxFn/codex-control-workspace 已 push 到 f444449；后续 init / installer 进入新仓库 TODO。",
  "indexRows": [],
  "currentIndexRows": []
}
-->
