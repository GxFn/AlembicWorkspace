# Alembic Release / Portable Snapshot Closeout Workspace Plan

日期：2026-05-18

状态：已完成

总控目标：在保留本地开发 `../AlembicCore` / `../AlembicAgent` / `../AlembicDashboard` 优先入口的前提下，把发布、远程 CI、npm package、Codex portable runtime 和文档口径统一收口，避免发布包或 CI 中继续泄漏不可安装的 `file:../...` 本地依赖，也避免把 `vendor/*` 当作日常开发入口。

## 先回答 AlembicPlugin 的差异

`AlembicPlugin` 在本地开发中不是另一套实现，它同样应优先使用 workspace 本地源码：

- root `package.json`：`@alembic/core: file:../AlembicCore`
- build/check：`scripts/local-source-paths.mjs` 优先解析 `../AlembicCore` 和 `../AlembicDashboard`
- Codex plugin runtime：`scripts/prepare-codex-plugin-runtime.mjs` 会把已构建 Core 复制到 `plugins/alembic-codex/runtime/vendor/AlembicCore`

区别只在发布/便携交付：Codex 插件安装后不能假设用户机器上有 `../AlembicCore`，所以 embedded runtime 的 `runtime/package.json` 必须使用 `@alembic/core: file:vendor/AlembicCore`，并把 Core 源提交写入 `runtime/vendor/AlembicCore/.alembic-source.json`。这不是日常开发差异，而是便携 runtime 的离线安装约束。

## 代码事实

本计划基于本轮总控读取的真实文件：

- `Alembic/package.json` 仍是本地开发依赖：`@alembic/core: file:../AlembicCore`、`@alembic/agent: file:../AlembicAgent`。
- `Alembic/package-lock.json` 记录了 `../AlembicCore` 和 `../AlembicAgent` link。
- `Alembic/.github/workflows/release.yml` 当前直接 `npm ci` 并 `npm publish`，但没有 checkout sibling `AlembicCore` / `AlembicAgent` / `AlembicDashboard`，且发布包如果保留 `file:../...` 依赖会不可独立安装。
- `AlembicPlugin/package.json` 仍是本地开发依赖：`@alembic/core: file:../AlembicCore`。
- `AlembicPlugin/package-lock.json` 记录了 `../AlembicCore` link。
- `AlembicPlugin/.github/workflows/release.yml` checkout submodules，但没有 checkout sibling `AlembicCore` / `AlembicDashboard`；root npm package 也不能把 `file:../AlembicCore` 泄漏到发布产物。
- `AlembicPlugin/scripts/prepare-codex-plugin-runtime.mjs` 已正确把 embedded runtime dependency normalize 为 `file:vendor/AlembicCore`。
- `AlembicPlugin/scripts/verify-codex-plugin.mjs` 已检查 embedded runtime package dependency 是 `file:vendor/AlembicCore`，但还没有检查 `.alembic-source.json` 必须存在并记录 source commit。
- `AlembicPlugin/plugins/alembic-codex/RELEASE-PLAYBOOK.md` 仍有旧口径：`Alembic monorepo`、`Commit the updated submodule pointer ... in the Alembic monorepo`。这应改成当前多仓库 / local-source-first / portable runtime snapshot 口径。
- `AlembicAgent/package.json` 仍是本地开发依赖：`@alembic/core: file:../AlembicCore`；CI 已通过 sibling checkout 支撑本地源码模式，但没有 release/publish workflow 或发布依赖归一化。
- `AlembicCore/package.json` 没有本地 file dependency；Core 已新增 `release:check` package baseline guard，CI 最终 package 检查已改为 `npm run release:check`。
- `Alembic` 与 `AlembicPlugin` 目前都声明 npm package name `alembic-ai`。这在发布层面必须收口：不能让两个独立仓库同时用同一个包名无保护地发版。

## 统一规则

1. 本地开发、总控验收和日常 build/check：继续使用 workspace 本地源码入口。
2. 远程 CI：可以 checkout sibling 仓库来复现 local-source-first，但必须显式记录需要哪些 sibling repo。
3. npm publish / npm pack：发布产物不得包含 `file:../...` dependency。必须在发布前转换为可安装的 registry dependency，或用 hard gate 阻止发布并说明原因。
4. Codex portable runtime：允许且必须使用 `file:vendor/AlembicCore`，但只限 `plugins/alembic-codex/runtime/package.json` 这类 embedded runtime 场景。
5. `vendor/AlembicCore` 和 `vendor/AlembicDashboard` 不回到日常开发入口；只用于 workspace 外 fallback、release snapshot、portable runtime、离线安装或总控明确要求的指针验收。
6. 每次生成 release / portable snapshot，必须记录源仓库 commit hash。

## 执行顺序

这一波不是所有窗口完全无序并发。推荐顺序：

1. `AlembicCore` 先确认 Core package release baseline，因为 `AlembicAgent`、`Alembic`、`AlembicPlugin` 的发布依赖都要指向它。
2. `AlembicAgent` 与 `AlembicCore` 可并行做 package guard，但 Agent 的 publish-ready 结论依赖 Core 的版本/发布口径。
3. `Alembic` 和 `AlembicPlugin` 可以并行修 CI / release guard / playbook；真正解除 npm publish gate 时，依赖 Core 和 Agent 的 publish-ready 结论。
4. `AlembicDashboard` 本轮不单独改代码；它作为 sibling build source 被 `Alembic` / `AlembicPlugin` 的 CI 和 release workflow 消费。

## 窗口分派

| 窗口 | 状态 | 任务 | 文档动作 | 保存位置 | 挂载入口 | 回填位置 | 验证命令 | 阻塞/依赖 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `AlembicCore` | 已完成 | 已建立 Core package release baseline：`@alembic/core@0.1.0` 无 sibling file dependency；新增 `release:check`，验证 package metadata、dist exports、pack contents 和 source commit；CI package step 已改为 `npm run release:check`。未改动下游仓库。 | 已新建 | `docs/AlembicCore/alembic-core-release-package-baseline-2026-05-18.md` | 本文“窗口分派”与 `docs/workspace/index.md` 当前总控入口 | 本文“回填区 / AlembicCore” | `npm run check`；`npm run build`；`npm run smoke:public-api`；`npm run release:check`；`npm --cache <writable-temp-cache> pack --dry-run --json` | 已提交 `abcf84f27d23cae0fbefbb4d7a327f5aae7f1caf`；下游发布解除 gate 依赖后续 registry / staging 决策。 |
| `AlembicAgent` | 已完成 | 已保留 `file:../AlembicCore` 日常开发入口，同时补齐 package release boundary：发布/pack 在 root package 仍含 `file:../AlembicCore` 时被 hard gate 阻断。 | 已新建 | `docs/AlembicAgent/alembic-agent-release-package-boundary-2026-05-18.md` | 本文“窗口分派”与 `docs/workspace/index.md` 当前总控入口 | 本文“回填区 / AlembicAgent” | `npm run check`；`npm run smoke:public-imports`；`npm pack --dry-run`；`npm run release:package-guard` | 已提交 `019022bedf9c910bf7bf64a4fbe5969f833b294f`；发布解除仍依赖 `AlembicCore` package baseline。 |
| `Alembic` | 已完成 | 已收口主仓库 CI / release：远程 CI/release 显式 checkout sibling Core/Agent/Dashboard；npm publish 前通过 hard gate 阻止 `file:../AlembicCore`、`file:../AlembicAgent` 泄漏；已处理与 `AlembicPlugin` 同名 `alembic-ai` 的发布冲突保护。 | 已新建 | `docs/Alembic/alembic-release-local-source-package-boundary-2026-05-18.md` | 本文“窗口分派”与 `docs/workspace/index.md` 当前总控入口 | 本文“回填区 / Alembic” | `npm run build:check`；`npm run lint:core-import-boundary`；`npm run lint:agent-extraction-boundary`；`npm run check`；`npm run build`；`npm run release:package-guard`；workflow YAML parse；静态扫描 | 已提交 `9813101f40774b9e2122f32e7edb75b4a3e94ffd`；发布解除仍依赖 Core/Agent package baseline 和包名归属决策。 |
| `AlembicPlugin` | 已完成 | 已收口插件 release / portable runtime：保留 root local Core dev 入口；embedded runtime 继续使用 `file:vendor/AlembicCore`；`verify:codex-plugin` 已检查 `.alembic-source.json`；release playbook 已改为多仓库 / local-source-first / portable runtime snapshot 口径；root npm publish 由 hard gate 阻断 `file:../AlembicCore` 泄漏。 | 已新建 | `docs/AlembicPlugin/alembic-plugin-release-portable-runtime-boundary-2026-05-18.md` | 本文“窗口分派”与 `docs/workspace/index.md` 当前总控入口 | 本文“回填区 / AlembicPlugin” | `npm run build:check`；`npm run prepare:codex-plugin-runtime`；`npm run verify:codex-channel`；`npm run verify:codex-plugin`；`npm run smoke:codex-plugin`；`npm run verify:release-package-boundary`；publish guard 负向验证；`npm pack --dry-run` preview | 已提交 `3a5a4921398269e7a53c233d200acba8bf6a1f5a`；runtime 快照提交 `7544898b5d5ac6f0128fb80f292bfada29d23521`；embedded Core 来源 `abcf84f27d23cae0fbefbb4d7a327f5aae7f1caf`。 |
| `AlembicDashboard` | 观察中 | 本轮不改 Dashboard 源码；只作为 Alembic / AlembicPlugin 的 sibling build source。若两个外层窗口发现 Dashboard package/build 需要配合，再由总控追加任务。 | 无需新建 | 无 | 本文“窗口分派” | 本文“回填区 / AlembicDashboard” | 无本轮直接命令 | 等待外层 release workflow 消费结果。 |
| `BiliDili` | 无任务 | 当前是 Alembic 发布/便携 runtime 收口，不涉及真实 iOS/Swift 测试项目。 | 无需新建 | 无 | 本文“窗口分派” | 本文“回填区 / BiliDili” | 无 | 默认不进入日常 Alembic 开发流程。 |

## 各窗口禁止事项

- 不要把 `file:../...` 从日常开发里删掉后直接改成远程 registry 依赖，除非文档明确是在 publish staging manifest 中处理。
- 不要为了让 release workflow 过而把 `vendor/AlembicCore` 重新作为日常 build/check 第一入口。
- 不要修改旧 Wave 2C 文档来承载本轮新任务。
- 不要在 `AlembicDashboard` 或 `BiliDili` 新建文档，除非总控追加了真实任务。
- 不要把 `AlembicPlugin` embedded runtime 的 `file:vendor/AlembicCore` 当作错误删除。

## 验收标准

总控验收必须看到：

1. 本地开发依赖仍优先 `../AlembicCore` / `../AlembicAgent` / `../AlembicDashboard`。
2. 发布/pack guard 能识别并阻止或转换 root package 中的 `file:../...`。
3. `AlembicPlugin` embedded runtime 仍保留 `@alembic/core: file:vendor/AlembicCore`，并有 source metadata 检查。
4. CI/release workflow 若继续执行 npm install/build，必须有 sibling checkout 或明确的 release staging 目录。
5. `alembic-ai` 包名冲突已有硬性保护或明确归属结论。
6. 每个执行窗口回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。

## 可复制分派提示词

发送窗口：无

`Alembic` 已执行完成并回填，当前不再重复发送。

`AlembicPlugin` 已执行完成并回填，当前不再重复发送。

已发送并由 `AlembicAgent` 执行完成，当前不再重复发送。

已发送并由 `AlembicCore` 执行完成，当前不再重复发送。

不发送窗口：`AlembicDashboard`、`BiliDili`

```text
读取 docs/workspace/alembic-release-portable-snapshot-closeout-workspace-plan-2026-05-18.md，按照文档，领取并完成分配给你所在窗口的任务；完成后回填完成范围、提交 hash、验证命令、验证结果、遗留风险和下一步建议。
```

## 回填区

### AlembicCore

- 状态：已完成
- 完成范围：新增 `scripts/check-release-readiness.mjs`；新增 `release:check` package script；将 `scripts/check-release-readiness.mjs` 纳入 package `files`；Core CI 的 package 检查从裸 `npm pack --dry-run` 改为 `npm run release:check`；新建执行记录 `docs/AlembicCore/alembic-core-release-package-baseline-2026-05-18.md`。未改动下游仓库，未提交 `dist/`。
- 提交 hash：`abcf84f27d23cae0fbefbb4d7a327f5aae7f1caf`（`chore: add core release readiness guard`）
- 验证命令：`npm run build:check`；`npm run check`；`npm run build`；`npm run smoke:public-api`；`npm run release:check`；`npm --cache <writable-temp-cache> pack --dry-run --json`；`node --check scripts/check-release-readiness.mjs`
- 验证结果：全部通过。`npm run check` 通过，60 test files / 919 tests；public API boundary 为 136 exports classified、75 exact、61 wildcard、stable 17 / provisional 21 / transitional 98；public API smoke imported 75 exact entrypoints；`release:check` 输出 `@alembic/core@0.1.0`、source commit `abcf84f27d23cae0fbefbb4d7a327f5aae7f1caf`、pack entries 716、unpackedSize 22477521、working tree dirty `no`；pack dry-run 通过并包含新增 release readiness 脚本。
- 遗留风险：Core 已具备 package baseline，但没有实际 npm publish workflow，也未提升版本；下游解除 hard gate 仍需要先决定 Core registry 发布节奏或 publish staging manifest。Wildcard exports 仍是 transitional/internal migration surface。
- 下一步建议：总控可允许 `Alembic` / `AlembicPlugin` 继续 release guard / portable runtime 收口；若后续进入真实 publish，先发布或模拟发布 `@alembic/core`，再处理 `@alembic/agent`，最后处理外层 `alembic-ai` 包名归属。

### AlembicAgent

- 状态：待验收
- 完成范围：保留 AlembicAgent 日常开发入口 `@alembic/core: file:../AlembicCore`；新增 `scripts/guard-agent-release-package.mjs`；新增 `release:package-guard` 与 `prepack`，在 root package 仍含 `file:../` workspace dependency 时阻断 `npm pack` / `npm publish`；未复制 Core 源码，未修改其它仓库。
- 提交 hash：`019022bedf9c910bf7bf64a4fbe5969f833b294f`（`Guard agent package release manifest`）
- 验证命令：`npm run build:check`；`npm run smoke:public-imports`；`npm run check`；`npm run release:package-guard`；`npm pack --dry-run`；`git diff --check`
- 验证结果：`npm run build:check` 通过；`npm run smoke:public-imports` 通过，15 public subpaths imported；`npm run check` 通过，9 test files / 37 tests，Biome 仍输出 23 条既有 warning；`npm run release:package-guard` 预期失败并识别 `package.json` / root `package-lock.json` 中的 `@alembic/core=file:../AlembicCore`；`npm pack --dry-run` 预期失败，`prepack` 阻断 pack/publish 生命周期；`git diff --check` 通过。
- 遗留风险：Agent 当前不是 publish-ready；解除 hard gate 依赖 AlembicCore package release baseline 和后续 publish staging manifest。本轮未处理既有 Biome warning。
- 下一步建议：总控复核 Agent 提交与执行记录 `docs/AlembicAgent/alembic-agent-release-package-boundary-2026-05-18.md`；等 Core baseline 完成后，再决定是否进入 Agent publish staging manifest 阶段。

### Alembic

- 状态：已完成
- 完成范围：
  - 已更新 `.github/workflows/ci.yml`，远程 CI 改为显式 checkout `Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard` sibling layout，默认工作目录为 `Alembic`。
  - 已让 CI 通过 `../AlembicCore`、`../AlembicAgent`、`../AlembicDashboard` 复现 local-source-first 结构；不把 vendor/submodule 恢复为日常入口。
  - 已更新 `.github/workflows/release.yml`，release workflow 同样显式 checkout sibling Core / Agent / Dashboard，并记录三个 source commit。
  - 已新增 `scripts/verify-release-package-boundary.mjs` 和 `npm run release:package-guard`，阻断 root package 泄漏 `file:../...`、root package 使用 `file:vendor/...`，检查 root lockfile local links，并对 `alembic-ai` 同名包冲突加硬闸。
  - 已将 release workflow 的 npm publish 前置到 `release:package-guard` 之后；当前 guard 预期失败，publish step 不会触达。
  - 已更新 `scripts/release.ts`，让本地 `release:check` / `release:patch|minor|major` 同步运行 package boundary guard。
- 提交 hash：`9813101f40774b9e2122f32e7edb75b4a3e94ffd`
- 验证命令：
  - `npm run build:check`
  - `npm run lint:core-import-boundary`
  - `npm run lint:agent-extraction-boundary`
  - `npm run check`
  - `npm run build`
  - `npm run release:package-guard`
  - `node -e "const fs=require('fs'); const yaml=require('yaml'); for (const p of ['.github/workflows/ci.yml','.github/workflows/release.yml']) { yaml.parse(fs.readFileSync(p,'utf8')); console.log(p+' ok'); }"`
  - `rg -n "file:\.\./AlembicCore\|file:\.\./AlembicAgent\|repository: GxFn/Alembic(Core\|Agent\|Dashboard)\|release:package-guard\|npm publish" package.json package-lock.json scripts .github/workflows`
  - `git diff --cached --check`
- 验证结果：
  - `npm run build:check`：通过；`build:core` 使用 `../AlembicCore`。
  - `npm run lint:core-import-boundary`：通过；使用本地 Core scanner，扫描 454 files / 598 Core imports，issue 0。
  - `npm run lint:agent-extraction-boundary`：通过；local Agent relative imports 0，local service/runtime/prompts/domain consumers 0。
  - `npm run check`：通过；Biome 仍打印既有 warning/info，但 exit code 为 0。
  - `npm run build`：通过。
  - `npm run release:package-guard`：预期失败；阻断 `@alembic/agent: file:../AlembicAgent`、`@alembic/core: file:../AlembicCore`、lockfile local links，以及 `alembic-ai` 包名归属未确认。
  - workflow YAML parse：通过；`.github/workflows/ci.yml` 与 `.github/workflows/release.yml` 均可解析。
  - 静态扫描：通过；本地开发依赖仍在 package/lockfile，CI/release 明确 checkout sibling，release workflow 在 publish 前运行 guard。
  - `git diff --cached --check`：通过。
- 遗留风险：
  - Alembic root package 仍不是 publish-ready；发布解除依赖 `@alembic/core`、`@alembic/agent` registry 版本和 `alembic-ai` 包名归属结论。
  - GitHub Actions sibling checkout 当前使用各 sibling 仓库默认 ref；未来 release snapshot 需要 pin / 记录具体 source commit 到 staging 元数据。
  - `npm run check` 仍输出既有 Biome warning/info，本轮未处理历史 lint warning。
  - 本轮未运行 live GitHub Actions，只做了 workflow YAML 解析和本地命令验证。
- 下一步建议：
  - 等 `AlembicPlugin` 完成 portable runtime verify / playbook / root publish guard 后，由总控统一复核 release / portable snapshot closeout。
  - 若主仓库继续发布 `alembic-ai`，先完成包名归属决策并生成 registry dependency staging manifest；若主仓库不再拥有该包名，则保留 hard gate 并调整发布目标。

### AlembicPlugin

- 状态：已完成
- 完成范围：
  - 保留 root 日常开发入口 `@alembic/core: file:../AlembicCore`。
  - 保留 Codex embedded runtime 便携入口 `@alembic/core: file:vendor/AlembicCore`。
  - 新增 `scripts/verify-release-package-boundary.mjs`、`verify:release-package-boundary` 和 `release:package-boundary:publish`；普通验证模式确认 local-source-first / portable runtime / root publish blocked，publish 模式阻断 `file:../AlembicCore` 泄漏。
  - `prepublishOnly` 已改为先运行 `release:package-boundary:publish`，再运行 `release:codex-plugin`。
  - `scripts/verify-codex-plugin.mjs` 已补 `.alembic-source.json` source、40 位 commit、`packageDependency=file:vendor/AlembicCore` 检查。
  - `.github/workflows/ci.yml` 与 `.github/workflows/release.yml` 已显式 checkout sibling `AlembicCore` / `AlembicDashboard`，并在 `AlembicPlugin` 工作目录运行 root 命令。
  - release workflow 的 `npm publish` 前已加 `release:package-boundary:publish` hard gate。
  - `plugins/alembic-codex/RELEASE-PLAYBOOK.md` 已移除旧 monorepo 口径，改为 AlembicPlugin 多仓库 / local-source-first / portable runtime snapshot / root publish hard gate 口径。
  - 已刷新 `plugins/alembic-codex/runtime` 与 `runtime.tgz`，embedded Core 来源为 `../AlembicCore @ abcf84f27d23cae0fbefbb4d7a327f5aae7f1caf`。
- 提交 hash：
  - AlembicPlugin 外层：`3a5a4921398269e7a53c233d200acba8bf6a1f5a`（`chore: gate plugin release portable snapshots`）
  - `plugins/alembic-codex` runtime 快照：`7544898b5d5ac6f0128fb80f292bfada29d23521`（`build: refresh portable runtime release metadata`）
  - embedded Core 来源：`abcf84f27d23cae0fbefbb4d7a327f5aae7f1caf`
- 验证命令：
  - `node --check scripts/verify-release-package-boundary.mjs`
  - `node --check scripts/verify-codex-plugin.mjs`
  - `npm run verify:release-package-boundary`
  - `node scripts/verify-release-package-boundary.mjs --publish`
  - `npm run build:check`
  - `npm run prepare:codex-plugin-runtime`
  - `npm run verify:codex-channel`
  - `npm run verify:codex-plugin`
  - `npm run check`
  - `HUSKY=0 npm_config_cache=<writable-temp-cache> npm pack --dry-run --ignore-scripts`
  - `npm run smoke:codex-plugin`
  - `git diff --check`
  - `git -C plugins/alembic-codex diff --check`
- 验证结果：
  - 两个 `node --check` 均通过。
  - `npm run verify:release-package-boundary` 通过；输出 `rootPublishBlocked=true`，root local dependency 为 `@alembic/core=file:../AlembicCore`，embedded runtime dependency 为 `file:vendor/AlembicCore`，source metadata 指向 `abcf84f27d23cae0fbefbb4d7a327f5aae7f1caf`。
  - `node scripts/verify-release-package-boundary.mjs --publish` 预期失败；阻断 `dependencies.@alembic/core: file:../AlembicCore`。
  - `npm run build:check` 通过；Core build 使用 `../AlembicCore @ abcf84f27d23cae0fbefbb4d7a327f5aae7f1caf`。
  - `npm run prepare:codex-plugin-runtime` 通过；runtime 与 tarball 已刷新。
  - `npm run verify:codex-channel` 通过。
  - `npm run verify:codex-plugin` 通过；新增 source metadata 检查已纳入。
  - `npm run check` 通过；Biome 仍输出既有 warning/info，Core import boundary 扫描 320 files / 517 Core imports。
  - `HUSKY=0 npm_config_cache=<writable-temp-cache> npm pack --dry-run --ignore-scripts` 通过；package preview 为 `alembic-ai-0.1.2.tgz`，package size 25.1 MB，total files 1317。
  - `npm run smoke:codex-plugin` 通过；install、stdio、npxRuntime 通过；recovery / daemon smoke 按脚本条件跳过。
  - 两层 `git diff --check` 均通过。
- 遗留风险：
  - AlembicPlugin root package 当前仍不是 publish-ready；解除 `release:package-boundary:publish` 需要 Core registry package baseline 和 publish staging manifest 决策。
  - `alembic-ai` 包名仍需总控确认归属；Plugin 侧当前用 hard gate 防止误发。
  - 本轮未运行 GitHub Actions，只做 workflow 静态改造与本地命令验证。
  - `npm run check` 仍输出既有 Biome warning/info；本轮不处理历史 lint warning。
  - 本地普通 `npm pack --dry-run` 在沙箱内会触发 `prepare`/Husky 写 git config，需使用 `HUSKY=0` 与 writable npm cache 做本地 pack preview。
- 下一步建议：总控统一复核四个执行窗口证据；若进入真实发布阶段，先完成 `@alembic/core` registry 发布或 staging manifest 策略，再决定 `alembic-ai` 包名归属与 Plugin root publish gate 的解除方式。

### AlembicDashboard

- 状态：观察中
- 观察结论：

### BiliDili

- 状态：无任务
- 判断理由：
