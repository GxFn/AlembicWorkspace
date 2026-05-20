# GitHub Actions Failure Recovery Workspace Plan

更新日期：2026-05-19
总控窗口：AlembicWorkspace
状态：已完成

## 目标

恢复两个失败的 GitHub Actions，不把 CI 失败包装成产品功能波次，也不借机改变仓库边界。

- `Alembic`：处理 CI run https://github.com/GxFn/Alembic/actions/runs/26090010486。
- `AlembicPlugin`：处理 CI run https://github.com/GxFn/AlembicPlugin/actions/runs/26089289726；已通过新 run https://github.com/GxFn/AlembicPlugin/actions/runs/26093455839。
- 完成标准：对应仓库提交修复后，新 GitHub Actions run 通过，或明确回填仍然阻塞的权限 / 远端提交 / 发布物原因。

## 已知证据

主控已通过 GitHub public API 读取 run / job 元数据，但当前主控 `gh` token 无法读取完整 job log；执行窗口必须用有效 GitHub 权限补齐完整日志，再动手修复。

`Alembic` 证据：

- run：`26090010486`
- workflow：`CI`
- branch：`main`
- head sha：`edec0a52c1dffb5f8c09fdc4545422995cdad157`
- 失败 job：`Build & Lint (22)` / `76712928043`
- 失败 step：`Run npm run install:vscode-ext`
- 后续 `npm run build`、lint、Dashboard build、`npm run build:vscode-ext` 均被跳过。
- 本地 `.github/workflows/ci.yml` 和 `.github/workflows/release.yml` 仍引用 `install:vscode-ext` / `build:vscode-ext` / `package:vscode-ext`，但当前 `package.json` 没有对应脚本；需判断这是 stale workflow，还是应恢复真实 VSCode extension build 脚本。

`AlembicPlugin` 证据：

- run：`26089289726`
- workflow：`CI`
- branch：`main`
- head sha：`a591367f3b4f3b59b6517e7a149312440ebeef80`
- 失败 job：`Build & Lint (22)` / `76710448559`
- 失败 step：`Checkout AlembicPlugin`
- 后续 sibling checkout、install、build、lint、API smoke、unit / integration tests 均被跳过。
- `.github/workflows/ci.yml` 使用 `actions/checkout@v5` 且 `submodules: true`。
- `.gitmodules` 包含 `plugins/alembic-codex`、`vendor/AlembicCore`、`vendor/AlembicDashboard`、`skills/progressive-chain-validation`。
- 当前 `plugins/alembic-codex` gitlink 为 `0607fb8b8224cb01f83a51e520570d4f250e1b12`；GitHub public commit API 对 `GxFn/AlembicCodex` 该 SHA 返回 `No commit found`，高度疑似 submodule 指针指向本地未推送提交。

## 执行顺序

`Alembic` 和 `AlembicPlugin` 的失败点独立，可以同时执行。

两边都必须先补完整 Actions log，再改代码。若完整日志推翻上述证据，以完整日志为准，并在回填区说明主控公共 API 证据与最终根因的差异。

## 窗口分派

| 窗口 / 状态 | 任务 |
| --- | --- |
| `Alembic`<br>已完成 | 已删除 stale VSCode extension CI / release 步骤，修复 API smoke、unit checkout 和 Core 边界测试，GitHub Actions push run 已通过。 |
| `AlembicPlugin`<br>已完成 | 已修复 `Checkout AlembicPlugin` 失败；AlembicCodex gitlink commit 已发布到远端 main，Core / Dashboard gitlink 已指向远端可达 main；新 CI 通过。 |
| `AlembicCore`<br>观察中 | 本轮不直接派发；只有 AlembicPlugin checkout 证明确实卡在 Core gitlink 或 Alembic CI 进入 sibling build 后暴露 Core 远端提交问题时再启动。 |
| `AlembicAgent`<br>观察中 | 本轮不直接派发；只有 Alembic CI 进入 `Checkout AlembicAgent` / sibling build 后暴露 Agent 远端提交或构建问题时再启动。 |
| `AlembicDashboard`<br>观察中 | 本轮不直接派发；只有 Alembic 或 AlembicPlugin 进入 `build:dashboard` 后暴露 Dashboard 远端提交或构建问题时再启动。 |
| `BiliDili`<br>无任务 | CI 恢复不涉及真实 iOS 测试项目。 |

### Alembic 执行要求

- 先读取 `Alembic/AGENTS.md`、`Alembic/.github/workflows/ci.yml`、`Alembic/.github/workflows/release.yml`、`Alembic/package.json`。
- 用有效 GitHub 权限读取 run `26090010486` 的完整 job log，记录真实 stderr / npm error。
- 扫描 `install:vscode-ext`、`build:vscode-ext`、`package:vscode-ext` 的所有调用点。
- 若 VSCode extension 已不属于当前产品边界，删除或改造 stale CI / release 步骤，不能保留必失败步骤。
- 若 VSCode extension 仍属于主仓库真实发布能力，则恢复真实脚本、真实资源和验证，不允许只加空脚本绕过 CI。
- 同时检查 `release.yml`，避免 CI 修好了但 release 仍保留同一缺口。
- 文档动作：新建或更新执行记录。
- 保存位置：`docs/Alembic/github-actions-failure-recovery-2026-05-19.md`。
- 挂载入口：本文“回填区”和 `docs/workspace/index.md` 当前计划。
- 回填要求：完成范围、提交 hash、完整失败日志摘要、新 run URL、验证命令、验证结果、遗留风险、是否还需要 release workflow 跟进。

建议验证命令：

```bash
npm run build
npm run lint -- --diagnostic-level=error
npm run lint:core-import-boundary
npm run lint:consumer-core-imports
npm run build:dashboard
```

如果现有 unrelated lint debt 阻塞本地完整验证，必须给出具体文件、命令输出摘要和与本次 CI 修复的关系；不能写成已通过。

### AlembicPlugin 执行要求

- 先读取 `AlembicPlugin/AGENTS.md`、`AlembicPlugin/.github/workflows/ci.yml`、`AlembicPlugin/.gitmodules` 和当前 gitlink。
- 用有效 GitHub 权限读取 run `26089289726` 的完整 checkout log，确认具体 submodule / fetch 失败信息。
- 对 `plugins/alembic-codex`、`vendor/AlembicCore`、`vendor/AlembicDashboard`、`skills/progressive-chain-validation` 逐一确认远端仓库可达、gitlink commit 远端存在。
- 优先修复真实 gitlink 可达性：需要推送 `plugins/alembic-codex` 指向的提交就推送对应源仓库；需要改指针就指向已存在且验证通过的远端提交。
- 不要为了让 checkout 通过而盲目关闭 `submodules: true`；如果判断某个 submodule 已不应被 CI checkout，必须解释它的消费方、替代入口和删除边界。
- 文档动作：新建或更新执行记录。
- 保存位置：`docs/AlembicPlugin/github-actions-failure-recovery-2026-05-19.md`。
- 挂载入口：本文“回填区”和 `docs/workspace/index.md` 当前计划。
- 回填要求：完成范围、提交 hash、完整失败日志摘要、各 submodule 远端可达性结果、新 run URL、验证命令、验证结果、遗留风险。

建议验证命令：

```bash
git submodule sync --recursive
git submodule update --init --recursive
npm run build
npm run lint -- --diagnostic-level=error
npm run lint:core-import-boundary
npm run build:dashboard
```

若修复涉及 `plugins/alembic-codex` 源仓库，回填必须包含源仓库提交 hash 和 AlembicPlugin gitlink hash，避免再次出现本地可用但远端 checkout 失败。

## 可复制提示词

发送给：无

```text
当前 GitHub Actions failure recovery 已完成，无需发送执行提示词。
```

不发送给：`Alembic`（已完成）、`AlembicPlugin`（已完成）、`AlembicCore`（观察中）、`AlembicAgent`（观察中）、`AlembicDashboard`（观察中）、`BiliDili`（无任务）。

## 回填区

- `Alembic`：已完成。执行记录：[../Alembic/github-actions-failure-recovery-2026-05-19.md](../../../../Alembic/github-actions-failure-recovery-2026-05-19.md)。
  - 完成范围：删除 stale `install:vscode-ext` / `build:vscode-ext` / `package:vscode-ext` CI / release 步骤；API smoke 改验 `/api-spec`；unit job 显式 checkout `progressive-chain-validation` skill；Core 边界测试改为接受 sibling `../AlembicCore`；补 `workflow_dispatch` 用于 recovery。
  - 提交 hash：最终 `29a3c2ea73a710c79caae24dc06fe610e19e6bae`；相关提交链 `291fa3b`、`0602a16`、`4612c48`、`f8ab012`、`29a3c2e`。
  - 完整失败日志摘要：原始 run `26090010486` 在 `Run npm run install:vscode-ext` 报 `Missing script: "install:vscode-ext"`；代码扫描确认 VSCode extension 已删除，判断为 stale workflow。中间 run 暴露的 Biome lint、Dashboard 根路径 smoke、unit skill/Core source 边界问题均已收口。
  - 验证命令：`npm run build`、`npm run lint -- --diagnostic-level=error`、`npm run lint:core-import-boundary`、`npm run lint:consumer-core-imports`、`npm run build:dashboard`、`npm run test:unit`、focused unit、local API smoke、`git diff --check`。
  - 验证结果：本地命令通过；`npm run test:unit` 为 `146` files / `2223` tests；GitHub Actions push run `https://github.com/GxFn/Alembic/actions/runs/26093217101` 通过；手动 recovery run `https://github.com/GxFn/Alembic/actions/runs/26093228278` 通过。
  - 遗留风险：`release.yml` 已同步修复但未发 tag 验证 release workflow；`vendor/AlembicCore` gitlink `e58234c...` 远端不可取，本轮不依赖 vendor，若未来恢复全量 submodule checkout 需单独清理。
  - 下一步建议：Alembic 侧无需继续派发；等待 `AlembicPlugin` 独立回填。
- `AlembicPlugin`：已完成。执行记录：[../AlembicPlugin/github-actions-failure-recovery-2026-05-19.md](../../../../AlembicPlugin/github-actions-failure-recovery-2026-05-19.md)。
  - 完成范围：补齐完整 checkout log；确认 `plugins/alembic-codex` gitlink `0607fb8b8224cb01f83a51e520570d4f250e1b12` 原先远端不可达；将 AlembicCodex 快进发布到 `main`；将 AlembicPlugin 的 `vendor/AlembicCore` / `vendor/AlembicDashboard` gitlink 改为远端可达 `main/HEAD`；修复 Build & Lint 后暴露的格式问题和 Unit Tests 迁移后失败。
  - 提交 hash：AlembicCodex `0607fb8b8224cb01f83a51e520570d4f250e1b12`；AlembicPlugin `3824290`、`1f0c44f`。
  - 完整失败日志摘要：原始 run `26089289726` 在 `Checkout AlembicPlugin` 执行 `git submodule update --init --force --depth=1` 时报 `not our ref 0607fb8b8224cb01f83a51e520570d4f250e1b12`，导致 `plugins/alembic-codex` 直接 fetch 失败。
  - 各 submodule 远端可达性：`plugins/alembic-codex@0607fb8`、`vendor/AlembicCore@ab5e332`、`vendor/AlembicDashboard@bf493c9`、`skills/progressive-chain-validation@a6c371c` 均已对应远端 `main/HEAD` 可达。
  - 验证命令：`git submodule sync --recursive`、`git submodule update --init --recursive`、`npm run build`、`npm run lint -- --diagnostic-level=error`、`npm run lint:core-import-boundary`、`npm run build:dashboard`、targeted vitest、`npm run test:unit`、`git diff --check`。
  - 验证结果：本地命令通过；`npm run test:unit` 为 `95` files / `1474` tests；最终 GitHub Actions push run https://github.com/GxFn/AlembicPlugin/actions/runs/26093455839 通过。
  - 遗留风险：无 AlembicPlugin CI 阻塞；旧 Core/Dashboard detached gitlink 不再被 AlembicPlugin 引用。
  - 下一步建议：总控统一提交 workspace 文档；后续刷新 submodule gitlink 前先确认远端可达引用。
- `AlembicCore`：观察中，无需回填。
- `AlembicAgent`：观察中，无需回填。
- `AlembicDashboard`：观察中，无需回填。
- `BiliDili`：无任务。
