# Alembic GitHub Actions Failure Recovery

日期：2026-05-19
窗口：Alembic
状态：已完成

## 完成范围

- 读取并确认原始 CI 失败 run：`https://github.com/GxFn/Alembic/actions/runs/26090010486`。
- 删除 CI / release 中已经失效的 VSCode extension 步骤：`install:vscode-ext`、`build:vscode-ext`、`package:vscode-ext`。
- 将 API smoke 的 Dashboard 模式根路径检查改为稳定 JSON 入口 `/api-spec`。
- 对齐 Alembic 侧 unit test 与 Core 当前契约：`DecayDetector` 保留 legacy `drizzle` 参数但不再从 audit log 产生 `symbol_drift`。
- 修复 CI unit job 对本地 submodule 的隐式依赖：只显式 checkout `progressive-chain-validation` skill 资产；Core 边界测试接受 CI 已 checkout 的 sibling `../AlembicCore`。
- 增加 `workflow_dispatch`，用于 CI recovery 时手动触发同一套 CI。
- 同步检查并修正 `release.yml` 中同类 stale VSCode extension / skill checkout 问题。

## 提交

- 最终提交：`29a3c2ea73a710c79caae24dc06fe610e19e6bae`
- 本轮相关提交链：
  - `291fa3bbe80735859b415ebc9c9081813ead267f` `ci: remove stale vscode extension steps`
  - `0602a16917ab4d07b983bb83ef624eebc6d5ecd2` `ci: satisfy biome lint checks`
  - `4612c48384f879d9ec93f6a2b8154f8ab5317c1a` `ci: restore submodules for workflow tests`
  - `f8ab012e57a7d80a2317b0dcdda51e424e464e84` `ci: allow manual recovery runs`
  - `29a3c2ea73a710c79caae24dc06fe610e19e6bae` `ci: avoid stale vendor submodule checkout`

## 完整失败日志摘要

原始失败 run `26090010486` 的 `Build & Lint (22)` 在 `Run npm run install:vscode-ext` 失败：

- npm 报错：`Missing script: "install:vscode-ext"`。
- 后续 `npm run build`、lint、Dashboard build、VSCode extension build 均被跳过。
- 代码扫描确认当前 `package.json` 不存在 `install:vscode-ext` / `build:vscode-ext` / `package:vscode-ext` 脚本，`resources/vscode-ext` 也已移除。
- 历史提交显示 VSCode extension 能力已经在 `b6549df` / `61621b1` 方向被删除，本次判断为 stale workflow，不恢复空脚本或空资源。

中间 recovery run 暴露的后续失败也已收口：

- `npm run lint -- --diagnostic-level=error` 暴露 Biome import / formatting 问题，已用安全格式化修复。
- API smoke 的 `$API_BASE/../..` 在 Dashboard 模式下取到非 JSON 根页面，已改验 `/api-spec`。
- unit tests 需要 skill 资产和 Core source 证据，已改为 CI 显式 checkout skill repo，并从 sibling `AlembicCore` 校验 Core 归属。
- 尝试 `submodules: recursive` 时暴露 `vendor/AlembicCore` gitlink `e58234c...` 远端不可取；最终 CI 不再依赖 stale vendor submodule checkout。

## 验证命令与结果

- `npm run build`：通过。
- `npm run lint -- --diagnostic-level=error`：通过。
- `npm run lint:core-import-boundary`：通过，扫描 `420` files / `558` imports。
- `npm run lint:consumer-core-imports`：通过，扫描 `420` files / `558` imports。
- `npm run build:dashboard`：通过；仅保留 Vite chunk size warning。
- `npm run test:unit`：通过，`146` files / `2223` tests。默认本机沙箱会阻止 `sandbox-exec` / `127.0.0.1`，已按权限规则在沙箱外重跑。
- focused unit：`test/unit/AgentModuleBoundaries.test.ts`、`test/unit/DecayDetector.test.ts`、`test/unit/progressive-chain-validation-skill.test.ts` 通过。
- 本地 API smoke：`/api/v1/health` ready、`/api/v1/health/ready` ready、`/api-spec` title 为 `Alembic API`。
- `git diff --check`：通过。
- GitHub Actions push run：`https://github.com/GxFn/Alembic/actions/runs/26093217101` 通过。
- GitHub Actions manual recovery run：`https://github.com/GxFn/Alembic/actions/runs/26093228278` 通过。

## 遗留风险

- `release.yml` 已去除 stale VSCode extension 步骤并补齐 skill checkout，但未创建 release tag 触发发布链路；下一次 release tag 需要自然验证 release workflow。
- `vendor/AlembicCore` gitlink 的 `e58234c...` 远端不可取问题未在本轮修正；当前 CI / release 走 sibling source checkout，不依赖该 vendor gitlink。若未来恢复全量 submodule checkout，需要单独清理 vendor 指针。

## 下一步建议

- Alembic 侧无需继续派发。
- AlembicPlugin 仍需按总控文档处理自己的 checkout/submodule 失败，并回填独立 run URL。
