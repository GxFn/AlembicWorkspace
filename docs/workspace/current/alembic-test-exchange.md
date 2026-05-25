# AlembicTest Exchange

更新日期：2026-05-25
维护窗口：AlembicWorkspace
状态：`Test-2026-05-25-09 / LLMI-P11-Package-Runtime-Integration` 总控验收通过

## 定位

本文件只保存当前需要 `AlembicTest` 执行或回填的测试单。历史测试交流、测试报告和总控验收入口统一从 [workspace-record-map.md](../workspace-record-map.md#test-records) 查询。

## 当前测试单

### Test-2026-05-25-09：LLMI-P11-Package-Runtime-Integration

状态：总控验收通过
创建日期：2026-05-25
总控来源：[llm-input-optimization-wave-6-2026-05-25.md](../archive/2026-05/llm-input-optimization/llm-input-optimization-wave-6-2026-05-25.md)
执行窗口：AlembicTest
目标项目：Alembic internal Agent package/runtime 或小 cold-start 集成链路；优先使用 staged package / rebuilt runtime 的最小 fixture，不跑 full cold-start，不修改真实测试项目业务源码。

#### 执行说明

`AlembicAgent` Wave 6A 已通过总控验收，回填见 [../../AlembicAgent/llm-input-optimization-agent-runtime-package-2026-05-25.md](../../AlembicAgent/llm-input-optimization-agent-runtime-package-2026-05-25.md)。本测试单只验证下游真实运行链路会消费最新 package/runtime artifact，不扩大到下一轮 Agent / LLM 优化、PCV metrics、Dashboard drawer polish 或 full cold-start 质量评估。

#### 测试目标

- 验证 `AlembicAgent` package/runtime 路径能加载最新 staged / rebuilt runtime artifact，而不是旧 `dist` 或 source-transform-only 路径。
- 验证 package/runtime 链路中存在并消费 `LLMInputAssembly`、runtime layer、Observation Ledger 和 Tool V2 `code.read({ filePaths })` batch read 能力。
- 验证 staged package manifest 不含 local `file:../` dependency，能按 release pack preview 形态被测试 harness 消费。
- 验证最小 package/runtime 或小 cold-start fixture 仍保留 Wave 1-5 关键回归边界：无 `[object Promise]`、无 `Missing required param "path"`、Timeline / artifact / metrics / trace producer-consumer 不因 package runtime 断链。
- 验证运行后没有向 Alembic 系列 source folder 或 BiliDili 写入非预期 runtime 数据。

#### 非目标

- 不跑 full cold-start / rescan。
- 不启动 `GTODO-2026-05-25-003` 的 Agent / LLM 优化循环。
- 不实现 PCV metrics、Artifact Drawer、Recipe drawer 或 Dashboard 新 UI。
- 不修改 `AlembicAgent`、`Alembic`、`AlembicDashboard`、`AlembicPlugin`、`AlembicCore` 产品源码。
- 不操作 BiliDili 产品业务源码、UI、登录、网络或播放逻辑。
- 不发布 npm package；staged package / pack preview 只作为本地验证输入。

#### 前置条件

- `AlembicAgent` tracked source commit：`8970327d73bf6c01476a1aeb5384f014483b68dd`。
- `AlembicAgent` Wave 6A 回填记录：[../../AlembicAgent/llm-input-optimization-agent-runtime-package-2026-05-25.md](../../AlembicAgent/llm-input-optimization-agent-runtime-package-2026-05-25.md)。
- 总控已验收 Wave 6A：ignored `dist/` 关键文件存在，staged package `tmp/release/@alembic-agent` 使用 `@alembic/core@0.2.0` 且无 local `file:../` dependency，pack preview shasum `dbd390be0d13cca816c1bdb6de354b1838aca55f`。
- Wave 1-5 已通过总控验收；Test-05/06/07/08 均为本轮回归边界来源。
- 执行前先读取本 workspace `AGENTS.md`、`docs/workspace/index.md`、本文档、归档后的 `docs/workspace/archive/2026-05/llm-input-optimization/llm-input-optimization-wave-6-2026-05-25.md` 和 `AlembicTest/AGENTS.md`，并声明当前窗口定位和本轮仓库职责。

#### 执行范围

- 触发入口：优先使用 AlembicTest 内最小 package/runtime probe；可消费 `AlembicAgent/tmp/release/@alembic-agent` 或按回填步骤重新 build / pack preview。
- 允许操作：运行 AlembicTest probe、读取 staged package / dist / package manifest、启动必要的最小 local harness、采集 runtime capture / JSON / 日志摘要。
- 禁止操作：不得跑 full cold-start；不得修改产品源码；不得提交产品子仓库；不得把 fixture 写入真实测试项目业务目录；不得用 source test-mode 单元测试替代 package/runtime 证据。
- 允许读取：AlembicWorkspace、AlembicTest、AlembicAgent、Alembic、AlembicDashboard 的测试文档、测试 fixture、staged package、运行日志和 process events。
- 禁止修改：除 AlembicTest 报告、probe 和必要测试运行输出外，不修改产品源码或真实项目源码。

#### 观察点

- Package / runtime：staged package manifest、runtime exports、关键 dist 文件、是否无 local `file:../` dependency。
- Agent runtime capture：`LLMInputAssembly`、runtime layer、Observation Ledger、batch `filePaths` read、Wave 1 / 2 / 3 回归信号。
- Alembic / Dashboard integration：如使用小 cold-start 或 fixture job，确认 artifact refs、metrics、trace 和 Dashboard artifact detail 不因 Agent package runtime 消费旧产物而回退。
- 日志信号：package path、runtime import source、失败分类、是否触发 package fallback 或 source-transform fallback。
- 文件 / 候选产物：staged package路径、输出 JSON、截图 / DOM（如启动 Dashboard）、runtime capture 文件。
- 真实项目 git 状态：Alembic 系列子仓库和 BiliDili 不出现非预期源码改动。

#### 验收标准

- 测试报告证明 package/runtime 链路实际加载 staged / rebuilt runtime artifact，而不是只跑 source test-mode。
- 测试报告证明 `LLMInputAssembly`、Observation Ledger 和 `code.read({ filePaths })` batch read 能力在 package/runtime 范围内存在且可被消费。
- 测试报告证明 staged package manifest 无 local `file:../` dependency，并记录 package path / shasum / source commit。
- 测试报告证明 Wave 1-5 关键回归不破坏，或明确说明本轮只覆盖 package runtime 后还需要哪类小 cold-start 追加验证。
- 若无法形成 package/runtime 证据，必须回填为阻塞并归口到 `AlembicAgent` package scripts、`AlembicTest` harness 或总控计划缺口；不得只用 source unit test 替代。
- 产品仓库和真实测试项目没有非预期源码改动。

#### 建议命令或脚本

```bash
# 由 AlembicTest 窗口按自身 AGENTS 和测试策略选择最小命令执行。
# 建议新增/复用 package-runtime probe，显式记录 import path、manifest、runtime capture 和回归断言。
```

#### 回填要求

- 测试结论：通过 / 未通过 / 阻塞。
- 执行范围：是否只使用 package/runtime probe；是否未跑 full cold-start；是否未操作 BiliDili 业务代码。
- 使用配置：AlembicAgent source commit、staged package path、package manifest 摘要、pack preview shasum、脚本 / fixture 路径、输出 JSON / 日志路径。
- job id / session id：如使用真实 daemon job，记录 job id；如使用 fixture，记录 fixture id。
- Dashboard URL 摘要：如启动 UI，记录本地 URL、页面、关键 DOM / 截图路径。
- 状态变化：runtime import source、package / dist consumption、events / artifact / metrics / trace 回归状态。
- 候选 / 产物数量：runtime capture 数量、artifactRefs 数量、失败 fixture 数量。
- 关键日志信号：package fallback、source-transform fallback、batch read、Observation Ledger、runtime layer、redaction / artifact path。
- 真实项目是否干净：至少说明 `AlembicAgent`、`Alembic`、`AlembicDashboard`、`AlembicCore`、`AlembicPlugin`、BiliDili 和被触达仓库状态。
- 详细报告路径：建议写入 `AlembicTest/docs/llm-input-package-runtime-integration-2026-05-25.md`。
- 遗留风险和下一步建议。
- 建议归属窗口：若失败，明确归属 `AlembicAgent`、`Alembic`、`AlembicDashboard`、`AlembicTest harness` 或总控。

#### AlembicTest 回填（2026-05-25 16:55 CST）

- 测试结论：通过。`AlembicTest` package/runtime probe 以 package-shape `node_modules` harness 导入 staged `@alembic/agent`，证明下游可消费最新 `AlembicAgent/tmp/release/@alembic-agent` runtime artifact；未落回 source transform 或 `src/` 路径。
- 执行范围：只使用最小 package/runtime probe；未跑 full cold-start / rescan；未启动 daemon job；未使用 Dashboard；未操作 BiliDili；未修改任何产品源码。
- 使用配置：`ALEMBIC_TEST_MODE=1`；`AlembicAgent` source commit `8970327d73bf6c01476a1aeb5384f014483b68dd`；`AlembicCore` source commit `b72390f2066f6406ce432b7dc94448dcd05862a3`；staged package `AlembicAgent/tmp/release/@alembic-agent`；probe `AlembicTest/scripts/probe-package-runtime-integration.mjs`。
- Package manifest 摘要：`@alembic/agent@0.2.0`；`dependencies["@alembic/core"]="0.2.0"`；local `file:` / `link:` dependency 数量 `0`；`alembicRelease.sources["@alembic/agent"].sourceCommit` 与 Wave 6A 一致。
- Pack preview 摘要：`alembic-agent-0.2.0.tgz`；entry count `417`；size `450194`；unpacked size `1736153`；shasum `dbd390be0d13cca816c1bdb6de354b1838aca55f`。
- job id / session id：不适用，本轮未启动真实 daemon job；fixture id 为临时 harness `package-runtime-integration-harness-2026-05-25T08-55-46-350Z`。
- Dashboard URL 摘要：未使用 Dashboard，本轮无 URL / DOM / 截图。
- 状态变化 / runtime import source：public import 解析到 `AlembicTest/tmp/package-runtime-integration-harness-2026-05-25T08-55-46-350Z/node_modules/@alembic/agent/dist/...`；symlink target 为 `AlembicAgent/tmp/release/@alembic-agent`；`noSrcResolution=true`。
- package / dist consumption 证据：staged `LLMInputAssembly.js` 含 `buildLlmInputAssembly` / `# LLM input runtime layer`；`AgentRuntime.js` 导入并调用 `buildLlmInputAssembly` 且生成 `kind: 'llm.input'`；`ActiveContext.js` 含 Observation Ledger；`code.js` / `registry.js` 含 batch `filePaths` read 能力。
- Runtime capture 证据：`code.read({ filePaths: ["package.json", "scripts/README.md"] })` 结果 `mode=batch`、`requested=2`、`succeeded=2`、`failed=0`、`maxFiles=5`；Observation Ledger 含 `### evidence` / `### readSet`；LLM input assembly `stageProfile=analyze`、`inputLayerAppended=true`、provider messages `2`。
- Wave 1-5 回归边界：serialized runtime evidence 中 `noObjectPromise=true`、`noMissingRequiredPath=true`；本轮未覆盖 Timeline / artifact / metrics / trace UI，但 package/runtime 不破坏其上游输入产物边界。
- 验证命令：
  - `node --check AlembicTest/scripts/probe-package-runtime-integration.mjs`：通过。
  - `node AlembicTest/scripts/probe-package-runtime-integration.mjs --help`：通过。
  - `npm --prefix AlembicTest run check`：通过，包含新 probe help。
  - `ALEMBIC_TEST_MODE=1 node AlembicTest/scripts/probe-package-runtime-integration.mjs`：通过，输出 `AlembicTest/tmp/llm-input-package-runtime-integration.json`。
- 关键日志 / 证据路径：JSON `AlembicTest/tmp/llm-input-package-runtime-integration.json`；harness output `AlembicTest/tmp/package-runtime-integration-harness-2026-05-25T08-55-46-350Z/runtime-probe-output.json`。
- 真实项目是否干净：`Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicPlugin`、`AlembicDashboard`、`BiliDili` 收口时 `git status --short` 均为空；`AlembicTest` 新增本轮 probe / 报告并保留前序未提交 Test-07 / Test-08 资产；`AlembicWorkspace` 本轮回填当前文档，待总控统一提交。
- Source folder runtime 写入：`AlembicAgent/.asd`、`AlembicCore/.asd`、`AlembicAgent/Alembic`、`AlembicCore/Alembic` 均不存在；runtime 输出只落在 `AlembicTest/tmp/`。
- 详细报告路径：[../../../AlembicTest/docs/llm-input-package-runtime-integration-2026-05-25.md](../../../AlembicTest/docs/llm-input-package-runtime-integration-2026-05-25.md)。
- 提交 hash：无，本轮为 AlembicTest 测试与文档回填，未执行提交。
- 失败归口：无失败归口；未发现需要 `AlembicAgent` / `Alembic` / `AlembicDashboard` / `AlembicPlugin` / `AlembicTest harness` 返工的问题。
- 遗留风险：本轮是 package/runtime 最小集成 probe，不覆盖 full cold-start、真实 provider 长任务或 Dashboard UI；harness 为本地 symlink package-shape，不等同于 npm registry install，但 manifest、pack preview 和 public import 已覆盖 staged package 消费门禁。
- 下一步建议：总控已关闭 LLM 输入优化 Wave 6 package/runtime 下游集成验证门禁；如后续需要 registry install 级别证据，应另起发布前 pack/install smoke，不应扩大本测试单。

#### 总控复核（2026-05-25 17:14 CST）

- 复核结论：Test-09 总控验收通过。按用户 2026-05-25 明确规则，`AlembicTest` 自身未提交 probe / 报告资产不作为验收阻塞；本轮提交 hash 可记录为 `无`。
- 证据判断：package-shape harness 真实消费 staged `@alembic/agent`，runtime import 未落回 `src/`，manifest 无 local dependency，batch `code.read({ filePaths })`、Observation Ledger、LLM input runtime layer、`noObjectPromise` 和 `noMissingRequiredPath` 均满足 Wave 6B 验收目标。
- 边界判断：`Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicPlugin`、`AlembicDashboard`、`BiliDili` 均无非预期源码改动；`AlembicTest` 未提交测试资产只作为测试仓库本地状态记录，不影响 LLM Wave 6 验收。
- 当前处理：关闭 Test-09 验收门，允许总控关闭 `GTODO-2026-05-24-040` 和 `GTODO-2026-05-25-002`；后续如需 registry install 级别证据，另起发布前 pack/install smoke，不扩大本测试单。

### Test-2026-05-25-08：LLMI-P9-Dashboard-Artifact-Detail-TestMode

状态：总控验收通过
创建日期：2026-05-25
总控来源：[llm-input-optimization-wave-5-2026-05-25.md](../archive/2026-05/llm-input-optimization/llm-input-optimization-wave-5-2026-05-25.md)
执行窗口：AlembicTest
目标项目：Alembic internal Agent / Alembic daemon / AlembicDashboard 最小 test-mode 或小 cold-start 链路；优先复用可控 fixture，不跑 full cold-start，不修改真实测试项目业务源码。

#### 执行说明

`AlembicDashboard` Wave 5 已通过总控代码侧验收，提交 `30b376cd3b5539d3fac0db2e019c4136bb98212d`。本测试单只验证 Dashboard 对 Alembic job artifact API / `artifactRefs[].ref` / `llmMetrics` / `traceEnvelope` 的真实消费闭环，不扩大到 Agent 输入继续优化、dist 刷新或全量 Recipe / skill 质量评估。

#### 测试目标

- 验证带 `artifactRefs` 的 `llm.input` / `llm.output` process event 能通过 Dashboard API client 读取完整 redacted artifact。
- 验证 Dashboard Timeline 主列表仍只展示开发者摘要 / projection，不把完整 prompt / output 回塞到事件卡片主体。
- 验证详情侧栏或等价详情面板能展示完整 redacted artifact、artifact metadata、`llmMetrics` 和 `traceEnvelope`。
- 验证 artifact 读取状态可读：成功、读取中、读取失败 / 404、无 artifactRef 回退。
- 验证 UI / API 证据中没有 raw secret 泄漏；如只能检查 redaction marker / fixture secret 不出现，也必须写清覆盖边界。
- 验证 Dashboard 使用 artifact endpoint 内容作为完整 artifact，不把 `content.text` / Timeline projection 当作完整 prompt / output。

#### 非目标

- 不跑 full cold-start / rescan。
- 不修改 `AlembicAgent`、`Alembic`、`AlembicDashboard`、`AlembicPlugin`、`AlembicCore` 产品源码。
- 不操作 BiliDili 产品业务源码、UI、登录、网络或播放逻辑。
- 不处理 `AlembicAgent/dist` 刷新；该项继续保留为 `GTODO-2026-05-25-002`。
- 不启动 `GTODO-2026-05-25-003` 的 Agent / LLM 优化循环。

#### 前置条件

- `Alembic` Wave 4 提交 `aa5419434d51aa4d944c3614ecebd8aff47a009f` 已通过总控验收，具备 job artifact 写入、artifactRef、trace envelope、metrics 和 `GET /api/v1/jobs/:jobId/artifacts/:artifactId`。
- `AlembicDashboard` Wave 5 提交 `30b376cd3b5539d3fac0db2e019c4136bb98212d` 已通过总控代码侧验收。
- Dashboard 回填文档：[../../AlembicDashboard/llm-input-optimization-dashboard-artifact-detail-2026-05-25.md](../../AlembicDashboard/llm-input-optimization-dashboard-artifact-detail-2026-05-25.md)。
- 当前 Wave 文档已记录 Dashboard 总控验收结论：[llm-input-optimization-wave-5-2026-05-25.md](../archive/2026-05/llm-input-optimization/llm-input-optimization-wave-5-2026-05-25.md)。
- 执行前先读取本 workspace `AGENTS.md`、`docs/workspace/index.md`、本文档和 `AlembicTest/AGENTS.md`，并声明当前窗口定位和本轮仓库职责。

#### 执行范围

- 触发入口：优先使用 AlembicTest 内最小 test-mode / fixture / local daemon harness；如需要打开 Dashboard，只做本测试单所需的最小 UI/API 验证。
- 允许操作：读取 Alembic / Dashboard API、运行 AlembicTest 已有或新建的最小 probe、启动必要的本地服务、使用 Browser / DOM / API 摘要采证。
- 禁止操作：不得跑 full cold-start；不得修改产品源码；不得提交产品子仓库；不得把测试 fixture 写入真实测试项目业务目录；不得把失败用单元测试替代真实 UI/API 证据。
- 允许读取：AlembicWorkspace、AlembicTest、Alembic、AlembicDashboard、AlembicAgent 测试文档、测试 fixture、运行日志、process events、Dashboard DOM / 截图 / API 响应摘要。
- 禁止修改：除 AlembicTest 报告、probe 和必要测试运行输出外，不修改产品源码或真实项目源码。

#### 观察点

- API / job 状态：`/api/v1/jobs/:jobId/events` 返回 `artifactRefs`、`llmMetrics`、`traceEnvelope`；`/api/v1/jobs/:jobId/artifacts/:artifactId` 返回完整 redacted text artifact。
- Dashboard 状态：Timeline 主列表为 projection / summary；详情侧栏展示 artifact selector、完整 artifact、metadata、metrics、trace 和失败 / empty 状态。
- 日志信号：artifact fetch 成功 / 失败路径可诊断，不影响 Timeline 基础浏览。
- 文件 / 候选产物：artifact 存在于 dataRoot scoped job artifact 区域；不向 source folder 写 runtime 数据。
- 安全边界：fixture secret 或 raw provider-only 字段不出现在 UI / API 可见 artifact 内容中，或明确说明本轮 fixture 覆盖的 redaction 边界。
- 真实项目 git 状态：Alembic 系列子仓库和 BiliDili 不出现非预期源码改动。

#### 验收标准

- 测试报告给出 API 证据，证明 `artifactRefs[].ref` 可解析并能读取完整 redacted artifact。
- 测试报告给出 Dashboard DOM / 截图 / 可核验摘要，证明 Timeline projection 与完整 artifact 被明确区分。
- 测试报告证明 `llmMetrics`、`traceEnvelope` 和 artifact metadata 在详情面板中可见，字段缺失时不会造假。
- 测试报告证明 artifact fetch 失败 / 404 / missing ref 有可读状态，且不破坏 Timeline 基础浏览。
- 测试报告证明无 raw secret 泄漏或写清当前 redaction fixture 覆盖边界。
- 若无法形成 UI / API 证据，必须回填为阻塞并归口到 `Alembic`、`AlembicDashboard`、`AlembicTest harness` 或总控计划缺口，不得只用 Dashboard contract test 替代。

#### 建议命令或脚本

```bash
# 由 AlembicTest 窗口按自身 AGENTS 和测试策略选择最小命令执行。
# 建议优先复用 Test-05/06/07 的 source test-mode probe 和 Alembic local API harness，
# 只在需要证明 UI 时启动 Dashboard 并采集 DOM / 截图。
```

#### 回填要求

- 测试结论：通过 / 未通过 / 阻塞。
- 执行范围：是否只使用最小 test-mode / fixture / local daemon；是否未跑 full cold-start；是否未操作 BiliDili 业务代码。
- 使用配置：Alembic commit、AlembicDashboard commit、AlembicAgent commit / dist 使用情况、脚本 / fixture 路径、输出 JSON / 截图路径。
- job id / session id：如使用真实 daemon job，记录 job id；如使用 fixture，记录 fixture id / artifact id。
- Dashboard URL 摘要：如启动 UI，记录本地 URL、页面、关键 DOM / 截图路径。
- 状态变化：events API、artifact API、Dashboard 详情面板状态。
- 候选 / 产物数量：artifactRefs 数量、artifact 读取数量、失败 fixture 数量。
- 关键日志信号：artifact fetch 成功 / 失败、redaction / secret 检查、metadata / metrics / trace 展示。
- 真实项目是否干净：至少说明 `Alembic`、`AlembicDashboard`、`AlembicAgent`、BiliDili 和被触达仓库状态。
- 详细报告路径：建议写入 `AlembicTest/docs/llm-input-dashboard-artifact-detail-test-mode-2026-05-25.md`。
- 遗留风险和下一步建议。
- 建议归属窗口：若失败，明确归属 `Alembic`、`AlembicDashboard`、`AlembicAgent`、`AlembicTest harness` 或总控。

#### AlembicTest 回填（2026-05-25 16:09 CST）

- 测试结论：通过。Dashboard artifact detail 在最小 test-mode fixture 中完成 UI/API 闭环：Timeline 主列表只显示 projection / summary，详情侧栏读取完整 redacted artifact，并展示 `llmMetrics`、`traceEnvelope`、artifact metadata、loading / success / 404 / no artifactRef 状态。
- 执行范围：只使用 AlembicTest fixture API、临时 Dashboard Vite server 和 headless Chrome DOM 自动化；未跑 full cold-start / rescan；未启动真实 daemon 长任务；未操作 BiliDili；未修改任何产品源码。
- 使用配置：`ALEMBIC_TEST_MODE=1`；Alembic commit `aa5419434d51aa4d944c3614ecebd8aff47a009f`；AlembicDashboard commit `30b376cd3b5539d3fac0db2e019c4136bb98212d`；Node `v22.22.1`；Headless Chrome `148.0.7778.179`；probe 脚本 `AlembicTest/scripts/probe-dashboard-artifact-detail.mjs`。
- job / session：fixture job id `llmi-p9-dashboard-artifact-fixture`；fixture session id `session-llmi-p9-dashboard-fixture`；artifact ids `llm-input-full-redacted.md`、`llm-output-full-redacted.md`、`missing-artifact.md`。
- Dashboard URL 摘要：临时 URL `http://127.0.0.1:53163/jobs?job=llmi-p9-dashboard-artifact-fixture`；probe 完成后服务关闭，长期证据保存在截图 / DOM / JSON。
- 输出 JSON：`AlembicTest/tmp/llm-input-dashboard-artifact-detail-test-mode.json`。
- DOM / 截图证据：
  - Timeline projection 文本：`AlembicTest/tmp/llm-input-dashboard-artifact-detail-test-mode/dashboard-artifact-detail-timeline.txt`。
  - input success：`AlembicTest/tmp/llm-input-dashboard-artifact-detail-test-mode/dashboard-artifact-detail-success.png`、`dashboard-artifact-detail-success.txt`、`dashboard-artifact-detail-success.html`。
  - output success：`AlembicTest/tmp/llm-input-dashboard-artifact-detail-test-mode/dashboard-artifact-detail-output-success.png`、`dashboard-artifact-detail-output-success.txt`。
  - loading / 404 / no artifactRef：`dashboard-artifact-detail-loading.png`、`dashboard-artifact-detail-error.png`、`dashboard-artifact-detail-empty.png`。
- API 证据：fixture API 记录 `/api/v1/jobs` 2 次、`/api/v1/jobs/:jobId/events?limit=120` 2 次；artifact endpoint 读取 `llm-input-full-redacted.md`、`llm-output-full-redacted.md` 成功，`missing-artifact.md` 返回 404 并被 Dashboard 显示为可读错误。
- 关键断言：`timelineProjectionVisible=true`、`fullArtifactAbsentFromTimeline=true`、`fullArtifactVisibleInDetail=true`、`outputArtifactVisibleInDetail=true`、`loadingStateVisible=true`、`errorStateVisible=true`、`emptyStateVisible=true`、`metricsVisible=true`、`traceVisible=true`、`artifactMetadataVisible=true`、`secretAbsentFromTimeline=true`、`secretAbsentFromDetail=true`、`apiFetchedSuccessArtifact=true`、`apiFetchedOutputArtifact=true`、`apiFetchedMissingArtifact=true`。
- 执行命令和结果：
  - `node --check AlembicTest/scripts/probe-dashboard-artifact-detail.mjs`：通过。
  - `node AlembicTest/scripts/probe-dashboard-artifact-detail.mjs --help`：通过。
  - `npm --prefix AlembicTest run check`：通过，包含新 probe help。
  - `ALEMBIC_TEST_MODE=1 node AlembicTest/scripts/probe-dashboard-artifact-detail.mjs`：通过，`result=PASS`、`failedAssertions=[]`；内部运行 AlembicDashboard `npm run test` 通过 `12/12`。
- Secret / raw 边界：fixture 中控制 secret `sk-test-raw-provider-secret-llmi-p9` 和 provider-only marker `providerRawPromptSecret` 未进入 API artifact、Timeline DOM 或详情 DOM；本轮验证 redacted artifact / projection 的 fixture 边界，不代表真实 provider 全量 redaction 质量评估。
- 真实项目 git 状态：`Alembic`、`AlembicDashboard`、`AlembicAgent`、`AlembicCore`、`AlembicPlugin`、`BiliDili` 收口时 `git status --short` 均为空；`AlembicTest` 新增本轮 probe / 报告并更新脚本索引，同时保留前序 Test-07 未提交资产；`AlembicWorkspace` 本轮回填当前文档，待总控统一提交。
- Source folder runtime 写入：probe 前后 source runtime write 状态一致；`AlembicDashboard` 未出现 `.asd/` 或 nested `Alembic/`；`Alembic` 仓库存在 pre-existing ignored `.asd/`，本轮未新增。
- 详细报告路径：[../../../AlembicTest/docs/llm-input-dashboard-artifact-detail-test-mode-2026-05-25.md](../../../AlembicTest/docs/llm-input-dashboard-artifact-detail-test-mode-2026-05-25.md)。
- 提交 hash：无，本轮为 AlembicTest 复测与文档回填，未提交仓库。
- 失败归口：无失败归口；本轮未发现需要 `Alembic` / `AlembicDashboard` / `AlembicAgent` / `AlembicTest harness` 返工的问题。
- 遗留风险：未覆盖 full cold-start / rescan、真实 provider 长任务、真实 dataRoot artifact lifecycle 或 package/runtime 产物链路；临时 Dashboard URL 已关闭，证据以截图 / DOM / JSON 为准；`AlembicAgent/dist` 未刷新继续保留为 `GTODO-2026-05-25-002`。
- 下一步建议：总控验收 Test-08 后关闭 Wave 5 Dashboard artifact detail test-mode 门；进入 Wave 6 前先处理 `AlembicAgent/dist` / package runtime 产物，再做 package/runtime 或小 cold-start 集成验证。

#### 总控验收（2026-05-25 16:21 CST）

- 复核结论：通过，关闭 Wave 5 Dashboard artifact detail test-mode 门。
- 证据判断：AlembicTest 报告覆盖 API 和 UI 两侧闭环，证明 `artifactRefs[].ref` 可读取完整 redacted artifact；Timeline 主列表只展示 projection / summary；详情侧栏展示完整 artifact、metadata、`llmMetrics`、`traceEnvelope`；loading / success / 404 / no artifactRef 状态可读；fixture secret `sk-test-raw-provider-secret-llmi-p9` 和 provider-only marker `providerRawPromptSecret` 未进入 Timeline、详情 DOM 或 artifact API 可见内容。
- 验证命令证据：`node --check AlembicTest/scripts/probe-dashboard-artifact-detail.mjs`、`node AlembicTest/scripts/probe-dashboard-artifact-detail.mjs --help`、`npm --prefix AlembicTest run check`、`ALEMBIC_TEST_MODE=1 node AlembicTest/scripts/probe-dashboard-artifact-detail.mjs` 均通过；probe 内部 Dashboard tests `12/12` 通过。
- 归口判断：无失败归口，不需要 `Alembic`、`AlembicDashboard`、`AlembicAgent` 或 AlembicTest harness 返工。
- 遗留风险：未覆盖 full cold-start / rescan、真实 provider 长任务、真实 dataRoot artifact lifecycle 或 package/runtime 产物链路；这些不阻塞 Wave 5，`AlembicAgent/dist` / package runtime 门禁已转入 [llm-input-optimization-wave-6-2026-05-25.md](../archive/2026-05/llm-input-optimization/llm-input-optimization-wave-6-2026-05-25.md)。

### Test-2026-05-25-07：LLMI-P6-Agent-Observation-Ledger-TestMode

状态：总控验收通过
创建日期：2026-05-25
总控来源：[llm-input-optimization-wave-3-2026-05-25.md](../archive/2026-05/llm-input-optimization/llm-input-optimization-wave-3-2026-05-25.md)
执行窗口：AlembicTest
目标项目：Alembic internal Agent test-mode / 最小 fixture；不要跑 full cold-start，不修改真实测试项目业务源码。

#### 执行说明

`AlembicAgent` Wave 3 已通过总控代码侧验收，提交 `8970327d73bf6c01476a1aeb5384f014483b68dd`。本测试单只做最小 test-mode 复测，验证真实运行输入 / events 是否消费 Observation Ledger，不扩大到 prompt artifact、Dashboard UI、完整 cold-start 或 Recipe / Skill 质量长链路。

#### 测试目标

- 验证真实 retained `llm.input`、provider message 或等价 runtime capture 中出现 `## Observation Ledger`。
- 验证默认 provider dynamic context 不再出现 raw `## 📂 之前的探索摘要`。
- 验证 ledger 至少包含 `readSet` / `searchSet` / `failureSet` / `nextHints` 中的多类语义，并能体现已读文件、已搜索关键词、失败原因或下一步提示。
- 验证 provider-facing ledger 不包含 `callId`、`parentCallId`、`startedAt`、`durationMs`、`timestamp`、`diagnostics`、`structuredContent`、`_meta` 等 raw debug 字段。
- 验证 scratchpad confirmed findings 仍在 ledger 前输出，`note_finding` / QualityGate 证据链不回退。
- 验证 Wave 1 / Wave 2 关键回归不破坏：无 `[object Promise]`、无 `Missing required param "path"`、`inputLayerAppended=true`、`inputStageProfile="analyze"`、provider runtime layer 仍存在。

#### 非目标

- 不跑 full cold-start / rescan。
- 不验证 Alembic prompt artifact 持久化、Dashboard 展示、JobStore / daemon event persistence 或 project skill runtime export。
- 不修改 `AlembicAgent`、`Alembic`、`AlembicDashboard`、`AlembicPlugin`、`AlembicCore` 产品源码。
- 不操作 BiliDili 产品业务源码、UI、登录、网络或播放逻辑。
- 不处理 `AlembicAgent/dist` 刷新；该项仍归入 `GTODO-2026-05-25-002`。
- 不处理 L4 compaction。

#### 前置条件

- `AlembicAgent` Wave 3 提交 `8970327d73bf6c01476a1aeb5384f014483b68dd` 已通过总控代码侧验收。
- Wave 3 回填文档：[../../AlembicAgent/llm-input-optimization-agent-observation-ledger-2026-05-25.md](../../AlembicAgent/llm-input-optimization-agent-observation-ledger-2026-05-25.md)。
- 当前 Wave 文档已记录总控验收结论：[llm-input-optimization-wave-3-2026-05-25.md](../archive/2026-05/llm-input-optimization/llm-input-optimization-wave-3-2026-05-25.md)。
- 使用测试模式或固定最小 fixture；如需要启动本地 daemon / Agent runner，必须控制任务规模并记录配置。

#### 执行范围

- 允许读取：AlembicWorkspace、AlembicAgent、Alembic、AlembicTest 测试文档、测试 fixture、运行日志和 process events。
- 允许操作：运行 AlembicTest 内已有或新建的最小 test-mode 脚本；可调用 AlembicAgent targeted test / harness；可通过 Alembic 事件 API 或本地日志读取 retained input 证据。
- 禁止操作：不得跑 full cold-start；不得修改产品源码；不得提交产品子仓库；不得扩大到 Dashboard UI 专项；不得把测试 fixture 写入真实测试项目业务目录。

#### 观察点

- Retained `llm.input` / provider message：`## Observation Ledger`、section metadata、provider runtime layer。
- Developer-visible input：无 raw `之前的探索摘要`，有 ledger section。
- Debug field 收敛：`callId`、`startedAt`、`durationMs`、`timestamp` 等不进入 provider-facing ledger。
- Ledger category：`evidence` / `readSet` / `searchSet` / `failureSet` / `nextHints` 的实际出现情况。
- Scratchpad priority：`## 📌 已确认的关键发现` 在 `## Observation Ledger` 前。
- 回归：Wave 1 correctness、Wave 2 input assembly metadata 和 RECORD / PRODUCE profile 不回退。
- 运行边界：测试耗时可控，没有启动全量 cold-start；真实项目 git 状态干净。

#### 验收标准

- 测试报告给出 retained input / provider message / runtime capture 证据，证明 Observation Ledger 在真实运行链路中存在。
- 测试报告证明 raw debug 字段不进入 provider-facing ledger。
- 测试报告证明 scratchpad confirmed findings 仍优先于 ledger。
- 测试报告证明 Wave 1 / Wave 2 关键回归未破坏。
- 若当前 test-mode 无法捕获 provider messages 或 retained `llm.input`，必须回填为阻塞并归口到缺失的 capture / artifact 链路，不得只用单元测试替代真实运行证据。
- 产品仓库和真实测试项目没有非预期源码改动。

#### 建议命令或脚本

```bash
# 由 AlembicTest 窗口按自身 AGENTS 和测试策略选择最小命令执行。
# 可复用 Test-06 runtime capture probe 结构，扩展 Observation Ledger / debug 字段收敛断言。
```

#### 回填要求

- 测试结论：通过 / 未通过 / 阻塞。
- 执行范围：是否只使用 AlembicAgent source test-mode / minimal fixture；是否未跑 full cold-start；是否未操作 BiliDili 业务代码。
- 使用配置：`ALEMBIC_TEST_MODE`、AlembicAgent commit、脚本 / fixture 路径、输出 JSON 路径。
- 执行命令和结果。
- 关键 evidence：retained `llm.input` / provider message / runtime capture 中的 ledger、debug 字段收敛、scratchpad priority、Wave 1 / Wave 2 regression。
- 失败归口：若失败，明确归属 `AlembicAgent`、`Alembic`、`AlembicTest harness` 或总控计划缺口。
- 真实项目 git 状态：至少说明 `AlembicAgent`、BiliDili 和被触达仓库状态。
- 详细报告路径：建议写入 `AlembicTest/docs/llm-input-observation-ledger-test-mode-2026-05-25.md`。
- 遗留风险和下一步建议。

#### AlembicTest 回填（2026-05-25 14:15 CST）

- 测试结论：通过（test-mode / source runtime 范围内通过）。
- 执行范围：只使用 AlembicAgent source test-mode / minimal fixture；未跑 full cold-start / rescan；未启动新的 daemon job；未操作 BiliDili 业务代码；未修改任何产品源码。
- 使用配置：`ALEMBIC_TEST_MODE=1`；AlembicAgent package version `0.2.0`；AlembicAgent commit `8970327d73bf6c01476a1aeb5384f014483b68dd`；probe 脚本 `AlembicTest/scripts/probe-llm-observation-ledger.mjs`。
- 输出 JSON：`AlembicTest/tmp/llm-input-observation-ledger-test-mode-2026-05-25.json`、`AlembicTest/tmp/llm-input-observation-ledger-vitest-2026-05-25.json`、`AlembicTest/tmp/llm-input-observation-ledger-runtime-capture-2026-05-25.json`、`AlembicTest/tmp/llm-input-observation-ledger-runtime-capture-vitest-2026-05-25.json`。
- 执行命令和结果：
  - `node --check AlembicTest/scripts/probe-llm-observation-ledger.mjs`：通过。
  - `node AlembicTest/scripts/probe-llm-observation-ledger.mjs --help`：通过。
  - `npm --prefix AlembicTest run check`：通过，包含新 probe help。
  - `ALEMBIC_TEST_MODE=1 node AlembicTest/scripts/probe-llm-observation-ledger.mjs --out AlembicTest/tmp/llm-input-observation-ledger-test-mode-2026-05-25.json --vitest-output AlembicTest/tmp/llm-input-observation-ledger-vitest-2026-05-25.json --capture-output AlembicTest/tmp/llm-input-observation-ledger-runtime-capture-2026-05-25.json --capture-vitest-output AlembicTest/tmp/llm-input-observation-ledger-runtime-capture-vitest-2026-05-25.json`：通过，内部运行 AlembicAgent targeted Vitest `13/13` 和 runtime capture Vitest `1/1`。
- retained `llm.input` 证据：runtime capture 显示 `containsRuntimeLayer=true`、`containsObservationLedger=true`、`containsRawPreviousSummary=false`、`categoryPresence.evidence/readSet/searchSet/failureSet/nextHints=true`、`scratchpadBeforeLedger=true`；ledger preview 包含 `Read src/agent/memory/ActiveContext.ts`、`Searched Observation Ledger in src/agent/**`、`code.read failed: message: Cannot read file` 和下一步提示。
- provider message 证据：runtime capture 显示 `containsRuntimeLayer=true`、`containsDynamicContext=true`、`containsObservationLedger=true`、`containsRawPreviousSummary=false`、五类 category 均为 true，且 `scratchpadBeforeLedger=true`。
- debug 字段收敛证据：provider-facing ledger 与 retained input ledger 中 `callId`、`parentCallId`、`startedAt`、`durationMs`、`timestamp`、`diagnostics`、`structuredContent`、`_meta` 均为 false / 未出现。
- Wave 1 / Wave 2 回归证据：runtime capture 显示 `containsObjectPromise=false`、`containsMissingRequiredPath=false`、`inputLayerAppended=true`、`inputStageProfile="analyze"`；targeted Vitest `13/13` 覆盖 `llm-input-correctness`、`llm-input-layering` 和 `ActiveContext observation ledger`。
- 失败归口：无失败归口；本轮未发现需要 `AlembicAgent` / `Alembic` / `AlembicTest harness` 返工的问题。
- 真实项目 git 状态：`Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicPlugin`、`AlembicDashboard`、`BiliDili` 收口时 `git status --short` 均为空；`AlembicTest` 新增本轮 probe / 报告并更新脚本索引；`AlembicWorkspace` 本轮回填当前文档，待总控统一提交。
- 详细报告路径：[../../../AlembicTest/docs/llm-input-observation-ledger-test-mode-2026-05-25.md](../../../AlembicTest/docs/llm-input-observation-ledger-test-mode-2026-05-25.md)。
- 提交 hash：无，本轮为 AlembicTest 复测与文档回填，未提交仓库。
- 遗留风险：未覆盖 full cold-start / rescan、真实 provider 长任务、Dashboard 展示、完整 redacted prompt artifact、trace envelope、metrics 或 Recipe / Skill 质量回归；runtime capture 使用 source transform，不代表当前 package `dist` 产物；`AlembicAgent/dist` 未刷新继续保留为 `GTODO-2026-05-25-002`。
- 下一步建议：总控验收 Test-07 后关闭 Wave 3 source test-mode 复测门；后续启动 `Alembic` prompt / output artifact、trace envelope 和 metrics；进入 package/runtime 或 cold-start 集成前先安排 `AlembicAgent` 刷新并验证 `dist/`。

#### 总控复核

- 复核时间：2026-05-25 14:32 CST
- 复核结论：通过，关闭 Wave 3 source test-mode 复测门。
- 证据判断：Test-07 证明 retained `llm.input` 与 provider message 均包含 `## Observation Ledger`，`evidence/readSet/searchSet/failureSet/nextHints` 五类语义均出现；raw `之前的探索摘要` 不再进入 retained input / provider message；`callId`、`parentCallId`、`startedAt`、`durationMs`、`timestamp`、`diagnostics`、`structuredContent`、`_meta` 均未进入 provider-facing ledger；scratchpad confirmed findings 保持在 ledger 前；Wave 1 / Wave 2 regression 继续通过。
- 范围判断：本测试只证明 AlembicAgent source test-mode / minimal fixture，不覆盖 full cold-start / rescan、真实 provider 长任务、Dashboard 展示、完整 redacted prompt artifact、trace envelope、metrics 或 Recipe / Skill 质量回归。
- 遗留归口：`AlembicAgent/dist` 未刷新继续保留为 `GTODO-2026-05-25-002`；进入 package/runtime 或 cold-start 集成验证前必须处理。
- 下一步：当前无新的 `AlembicTest` 测试单；总控转入 [LLM 输入优化 Wave 4](../archive/2026-05/llm-input-optimization/llm-input-optimization-wave-4-2026-05-25.md)，先派 `Alembic` 做 prompt / output artifact、trace envelope 和 metrics。

### Test-2026-05-25-06：LLMI-P4-Agent-Input-Layering-TestMode

状态：总控验收通过
创建日期：2026-05-25
总控来源：[llm-input-optimization-wave-2-2026-05-25.md](../archive/2026-05/llm-input-optimization/llm-input-optimization-wave-2-2026-05-25.md)
执行窗口：AlembicTest
目标项目：Alembic internal Agent test-mode / 最小 fixture；不要跑 full cold-start，不修改真实测试项目业务源码。

#### 执行说明

`AlembicAgent` Wave 2 已通过总控代码侧验收，提交 `bf0a2c2cb0c3d760817ac699e5f47d83e0e5b4d9`。本测试单只做最小 test-mode 复测，验证真实运行输入 / events 是否消费 Wave 2 的 input section assembly 和 stage profile，不扩大到 Observation Ledger、prompt artifact、Dashboard 或完整 cold-start。

#### 测试目标

- 验证真实 retained `llm.input` / process events 中出现 Wave 2 metadata：`inputLayerAppended=true`、`inputStageProfile`、`inputSectionIds` 或等价字段。
- 验证 developer-visible `llm.input` 能看到 section 化内容：`Identity`、`Stage policy`、`Tool contract`、`Task context`、`Evidence context` 和必要的 `Dynamic context` / provider runtime layer。
- 验证 provider 真实输入包含追加的 ephemeral runtime input layer，而不是只在展示文本中出现。
- 验证 RECORD / record-repair 场景仍为 `note_finding` / record-only 语义，不重新注入 `code({ action ... })` / `graph({ action ... })` 探索要求。
- 验证 PRODUCE / producer 场景使用 `produce` profile 和 Producer budget，不包含 Analyst 的探索阶段、结构化查询或 graph 搜索预算。
- 验证 Wave 1 correctness 不回退：无 `[object Promise]`，`code.read({ filePaths })` 不回到 missing `path`。

#### 非目标

- 不跑 full cold-start / rescan。
- 不验证 Observation Ledger、完整 redacted prompt artifact、Dashboard 展示或 Recipe / Skill 质量长链路。
- 不修改 `AlembicAgent`、`Alembic`、`AlembicDashboard`、`AlembicPlugin`、`AlembicCore` 产品源码。
- 不操作 BiliDili 产品业务源码、UI、登录、网络或播放逻辑。
- 不处理 L4 compaction。

#### 前置条件

- `AlembicAgent` Wave 1 提交 `6cff8beac414ca55eab4af85b31dfad0d1898711` 已通过总控验收。
- `AlembicAgent` Wave 2 提交 `bf0a2c2cb0c3d760817ac699e5f47d83e0e5b4d9` 已通过总控代码侧验收。
- Wave 2 回填文档：[../../AlembicAgent/llm-input-optimization-agent-input-layering-2026-05-25.md](../../AlembicAgent/llm-input-optimization-agent-input-layering-2026-05-25.md)。
- 当前 Wave 文档已记录总控验收结论：[llm-input-optimization-wave-2-2026-05-25.md](../archive/2026-05/llm-input-optimization/llm-input-optimization-wave-2-2026-05-25.md)。
- 使用测试模式或固定最小 fixture；如需要启动本地 daemon / Agent runner，必须控制任务规模并记录配置。

#### 执行范围

- 允许读取：AlembicWorkspace、AlembicAgent、Alembic、AlembicTest 测试文档、测试 fixture、运行日志和 process events。
- 允许操作：运行 AlembicTest 内已有或新建的最小 test-mode 脚本；可调用 AlembicAgent targeted test / harness；可通过 Alembic 事件 API 或本地日志读取 retained input 证据。
- 禁止操作：不得跑 full cold-start；不得修改产品源码；不得提交子仓库；不得扩大到 Dashboard UI 专项；不得把测试 fixture 写入真实测试项目业务目录。

#### 观察点

- Retained `llm.input` metadata：`inputLayerAppended`、`inputStageProfile`、`inputSectionIds`、`providerVisibleSectionIds`。
- Developer-visible input：section 标题、runtime layer、redaction 仍生效。
- Provider messages：最后一条或等价 runtime message 包含 `# LLM input runtime layer`。
- RECORD profile：只暴露 record-only / note_finding 语义，不出现探索工具指令。
- PRODUCE profile：Producer budget / profile 生效，不出现 Analyst 探索预算。
- Wave 1 regression：无 `[object Promise]`，无 `Missing required param "path"`。
- 运行边界：测试耗时可控，没有启动全量 cold-start；真实项目 git 状态干净。

#### 验收标准

- 测试报告给出 retained input / events 或等价 artifact 证据，证明 section metadata 和 runtime layer 在真实运行链路中存在。
- 测试报告给出 RECORD / PRODUCE 两类 profile 的真实输入证据。
- 测试报告证明 Wave 1 correctness 未回退。
- 若当前 test-mode 无法捕获 provider messages 或 retained `llm.input` metadata，必须回填为阻塞并归口到缺失的 capture / artifact 链路，不得只用单元测试代替真实运行证据。
- 产品仓库和真实测试项目没有非预期源码改动。

#### 建议命令或脚本

```bash
# 由 AlembicTest 窗口按自身 AGENTS 和测试策略选择最小命令执行。
# 可复用 Test-05 probe 结构，扩展 inputStageProfile / section metadata / provider runtime layer 断言。
```

#### 回填要求

- 测试结论：通过（test-mode / source runtime 范围内通过）。未跑 full cold-start，未启动 daemon，未操作 BiliDili 业务代码，未修改 AlembicAgent 产品源码。
- 执行范围：只使用 AlembicAgent source test-mode / minimal fixture；新增 AlembicTest probe 脚本和报告；用户随后要求提交 AlembicTest 资产，封口提交 hash 为 `6f9514cb3c586d3b3d23e2e52eb7a6ce4b17e40b`。
- 使用配置：`ALEMBIC_TEST_MODE=1`；AlembicAgent package `0.2.0`；AlembicAgent commit `bf0a2c2cb0c3d760817ac699e5f47d83e0e5b4d9`；probe 脚本 `AlembicTest/scripts/probe-llm-input-layering.mjs`。
- 输出 JSON：`AlembicTest/tmp/llm-input-layering-test-mode-2026-05-25.json`、`AlembicTest/tmp/llm-input-layering-vitest-2026-05-25.json`、`AlembicTest/tmp/llm-input-layering-runtime-capture-2026-05-25.json`、`AlembicTest/tmp/llm-input-layering-runtime-capture-vitest-2026-05-25.json`、`AlembicTest/tmp/llm-input-layering-wave1-regression-2026-05-25.json`。
- 执行命令：
  - `node --check AlembicTest/scripts/probe-llm-input-layering.mjs`
  - `node AlembicTest/scripts/probe-llm-input-layering.mjs --help`
  - `npm --prefix AlembicTest run check`
  - `npm --prefix AlembicAgent test -- llm-input-layering --reporter=verbose`
  - `ALEMBIC_TEST_MODE=1 node AlembicTest/scripts/probe-llm-input-layering.mjs --out AlembicTest/tmp/llm-input-layering-test-mode-2026-05-25.json --vitest-output AlembicTest/tmp/llm-input-layering-vitest-2026-05-25.json --capture-output AlembicTest/tmp/llm-input-layering-runtime-capture-2026-05-25.json --capture-vitest-output AlembicTest/tmp/llm-input-layering-runtime-capture-vitest-2026-05-25.json --wave1-output AlembicTest/tmp/llm-input-layering-wave1-regression-2026-05-25.json`
- 验证结果：`llm-input-layering` targeted Vitest `5/5` 通过；runtime capture fixture `3/3` 通过；Wave 1 regression probe 通过。
- 关键 evidence：runtime capture 中 Analyze `llm.input.metadata.inputLayerAppended=true`、`inputStageProfile="analyze"`、`inputSectionIds=["identity","stagePolicy","toolContract","taskContext","evidenceContext","dynamicContext"]`、`providerVisibleSectionIds` 同步；developer-visible input 显示 `Identity`、`Stage policy`、`Tool contract`、`Task context`、`Evidence context`、`Dynamic context` 和 `Provider runtime layer`；provider layer 包含 `# LLM input runtime layer`。RECORD profile 为 `inputStageProfile="record"` 且 `toolSchemaNames=["note_finding"]`，无 code / graph 探索指令。PRODUCE profile 为 `inputStageProfile="produce"`，Producer budget 生效，无 Analyst `探索阶段` / `结构化查询`。Wave 1 regression 显示无 `[object Promise]`、无 `Missing required param "path"`、batch partial failure 为 true。
- 失败归口：source test-mode 验证无失败。发现遗留风险归口 `AlembicAgent` 发布 / 构建产物同步：当前 `dist/` 未刷新，`dist/agent/runtime/LLMInputAssembly.js` 不存在，`dist/agent/runtime/AgentRuntime.js` 仍是旧 dynamicContext-only 路径。
- 真实项目 git 状态：`AlembicAgent` clean，`BiliDili` clean；其它产品仓库未参与本轮修改，抽查 clean；`AlembicTest` 保留前序未提交材料并新增本轮 probe / 报告；`AlembicWorkspace` 本轮回填当前文档，待总控统一提交。
- 详细报告路径：[../../../AlembicTest/docs/llm-input-layering-test-mode-2026-05-25.md](../../../AlembicTest/docs/llm-input-layering-test-mode-2026-05-25.md)。
- 遗留风险：未覆盖 full cold-start / rescan、真实 provider 长任务、Dashboard 展示、Observation Ledger、完整 redacted prompt artifact 或 Recipe / Skill 质量回归；runtime capture 使用 source transform，不代表当前 package `dist` 产物。
- 下一步建议：总控验收本测试单后关闭 Wave 2 source test-mode 复测门；进入 package/runtime 或 cold-start 集成前，安排 `AlembicAgent` 刷新并验证 `dist/`；后续按阶段进入 Wave 3 Observation Ledger。

#### 总控复核

- 复核时间：2026-05-25 13:27 CST
- 复核结论：通过，关闭 Wave 2 source test-mode 复测门。
- 证据判断：Test-06 覆盖 retained `llm.input` metadata、provider runtime layer、Record / Produce profile 和 Wave 1 regression。Analyze `inputLayerAppended=true`，`inputStageProfile="analyze"`，section IDs 覆盖 `identity/stagePolicy/toolContract/taskContext/evidenceContext/dynamicContext`；RECORD 为 `note_finding` only 且无 code / graph 探索指令；PRODUCE 使用 Producer budget 且无 Analyst 探索预算；Wave 1 regression 继续证明无 `[object Promise]`、无 `Missing required param "path"`、batch partial failure 为 true。
- 遗留归口：`AlembicAgent/dist` 未刷新已登记为 `GTODO-2026-05-25-002`，不阻塞本 source test-mode 结论，但 package/runtime 或 cold-start 集成验证前必须处理。
- 下一步：当前无新的 `AlembicTest` 测试单；总控进入 [LLM 输入优化 Wave 3](../archive/2026-05/llm-input-optimization/llm-input-optimization-wave-3-2026-05-25.md)，先派 `AlembicAgent` 做 Observation Ledger。

### Test-2026-05-25-05：LLMI-P2-Agent-Correctness-TestMode

状态：总控验收通过
创建日期：2026-05-25
总控来源：[llm-input-optimization-wave-1-2026-05-25.md](../archive/2026-05/llm-input-optimization/llm-input-optimization-wave-1-2026-05-25.md)
执行窗口：AlembicTest
目标项目：Alembic internal Agent test-mode / 最小 fixture；不要跑 full cold-start，不修改真实测试项目业务源码。

#### 执行说明

`AlembicAgent` Wave 1 已通过总控代码侧验收，提交 `6cff8beac414ca55eab4af85b31dfad0d1898711`。本测试单只做最小 test-mode 复测，验证真实运行输入 / events 是否闭合，不扩大到完整 LLM 输入优化后续 Wave。

#### 测试目标

- 验证真实 retained input、LLM input event 或等价 test-mode 捕获内容中不再出现 `[object Promise]`。
- 验证 `code.read({ filePaths: [...] })` 在真实工具链中可执行，不再触发 `Missing required param "path"`。
- 验证 batch read 返回 per-file 结构，至少覆盖成功读取、missing file 或越界路径的 partial failure。
- 验证 SCAN planning / `toolChoice=none` 的真实输入文案不再要求同一轮立即执行工具，而是表达下一轮或工具开放阶段执行。
- 验证不跑 full cold-start 时仍能用最小 fixture 证明上述 correctness，不依赖真实 provider 长任务自然触发。

#### 非目标

- 不跑全量 cold-start / rescan。
- 不验证 section 化 input assembly、Observation Ledger、完整 redacted prompt artifact 或 Dashboard 展示。
- 不修改 `AlembicAgent`、`Alembic`、`AlembicDashboard`、`AlembicPlugin`、`AlembicCore` 产品源码。
- 不操作 BiliDili 产品业务源码、UI、登录、网络或播放逻辑。
- 不处理 L4 compaction。

#### 前置条件

- `AlembicAgent` 提交 `6cff8beac414ca55eab4af85b31dfad0d1898711` 已通过总控代码侧验收。
- `AlembicAgent` 回填文档：[../../AlembicAgent/llm-input-optimization-agent-correctness-2026-05-25.md](../../AlembicAgent/llm-input-optimization-agent-correctness-2026-05-25.md)。
- 当前 Wave 文档已记录总控验收结论：[llm-input-optimization-wave-1-2026-05-25.md](../archive/2026-05/llm-input-optimization/llm-input-optimization-wave-1-2026-05-25.md)。
- 使用测试模式或固定最小 fixture；如需要启动本地 daemon / Agent runner，必须控制任务规模并记录配置。

#### 执行范围

- 允许读取：AlembicWorkspace、AlembicAgent、Alembic、AlembicTest 测试文档、测试 fixture、运行日志和 process events。
- 允许操作：运行 AlembicTest 内已有或新建的最小 test-mode 脚本；可调用 AlembicAgent targeted test / harness；可通过 Alembic 事件 API 或本地日志读取 retained input 证据。
- 禁止操作：不得跑 full cold-start；不得修改产品源码；不得提交子仓库；不得扩大到 Dashboard UI 专项；不得把测试 fixture 写入真实测试项目业务目录。

#### 观察点

- Retained input / LLM input event：无 `[object Promise]`。
- Tool V2 invocation：`code.read` 的 `params.filePaths` 能通过 registry / router / handler，错误文案不再是缺少 `path`。
- Batch result：成功项带 file path / content 或等价 per-file data；失败项带 per-file error；至少一个成功时整体可为 success / partial success。
- SCAN planning：计划提示只要求下一轮或工具开放阶段执行，不再要求同一轮工具调用。
- 运行边界：测试耗时可控，没有启动全量 cold-start；真实项目 git 状态干净。

#### 验收标准

- 测试报告给出 retained input / events 或等价 artifact 证据，证明 `[object Promise]` 未出现。
- 测试报告给出 `code.read({ filePaths })` 真实执行证据，证明没有 `Missing required param "path"`。
- 测试报告给出 batch partial failure 证据和 SCAN planning 文案证据。
- 若当前 test-mode 无法捕获真实 retained input，必须回填为阻塞并归口到缺失的 capture / artifact 链路，不得用单元测试代替真实运行证据。
- 产品仓库和真实测试项目没有非预期源码改动。

#### 建议命令或脚本

```bash
# 由 AlembicTest 窗口按自身 AGENTS 和测试策略选择最小命令执行。
# 优先使用 test-mode / fixture / retained-events 读取，不跑 full cold-start。
```

#### 回填要求

- 测试结论：通过。最小 test-mode fixture 证明 retained `llm.input` / process events、Tool V2 batch read 和 SCAN planning / `toolChoice=none` correctness 均闭合。
- 执行范围：只运行 AlembicAgent targeted Vitest 和 AlembicTest in-process probe；未跑 full cold-start，未启动新的 daemon 长任务，未操作 BiliDili 业务代码，未改产品源码。
- 使用配置：`ALEMBIC_TEST_MODE=1`；AlembicAgent package version `0.2.0`；AlembicAgent commit `6cff8beac414ca55eab4af85b31dfad0d1898711`；probe 脚本 `AlembicTest/scripts/probe-llm-input-agent-correctness.mjs`。
- 执行命令：
  - `node AlembicTest/scripts/probe-llm-input-agent-correctness.mjs --help`
  - `npm --prefix AlembicAgent test -- llm-input-correctness AgentRuntime --reporter=verbose`
  - `npm --prefix AlembicAgent test -- llm-input-correctness AgentRuntime --reporter=json --outputFile ../AlembicTest/tmp/llm-input-agent-correctness-vitest-2026-05-25.json`
  - `ALEMBIC_TEST_MODE=1 node AlembicTest/scripts/probe-llm-input-agent-correctness.mjs --out AlembicTest/tmp/llm-input-agent-correctness-test-mode-2026-05-25.json`
  - `rg -n "\[object Promise\]|Missing required param \"path\"|visibleInputSecret12345|同一轮|立即开始执行" AlembicTest/tmp/llm-input-agent-correctness-test-mode-2026-05-25.json`
  - `rg -n "containsAsyncGraphContext|containsObjectPromise|containsVisibleInputSecret|requestedToolChoice|effectiveToolChoice|partialFailure|job-retained" AlembicTest/tmp/llm-input-agent-correctness-test-mode-2026-05-25.json`
- 关键 retained input / events 证据：`AlembicTest/tmp/llm-input-agent-correctness-test-mode-2026-05-25.json` 显示 `retainedProcessEvents.kinds=["llm.input","llm.output"]`，`llmInput.retention="job-retained"`，`sourceClass="developer-facing"`，`requestedToolChoice="none"`，`effectiveToolChoice="none"`，`containsAsyncGraphContext=true`，`containsObjectPromise=false`，`containsVisibleInputSecret=false`。
- Targeted test 证据：`AlembicTest/tmp/llm-input-agent-correctness-vitest-2026-05-25.json` 显示 `13` tests passed，覆盖 `llm-input-correctness` 和 `AgentRuntime` process event fixture。
- 四个目标缺口结论：`[object Promise]` 通过；`filePaths` missing path 通过；batch partial failure 通过；SCAN planning / `toolChoice=none` 通过。
- 失败归口：无失败归口；本轮未发现需要 `AlembicAgent` / `Alembic` / `AlembicTest harness` 返工的问题。
- 真实项目 git 状态：`Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicPlugin`、`AlembicDashboard`、`BiliDili` 收口时 `git status --short` 均为空；`AlembicTest` 保留前序未提交材料，本轮新增 probe 脚本和报告；`AlembicWorkspace` 本轮回填当前文档，待总控统一提交。
- 详细报告路径：[../../../AlembicTest/docs/llm-input-agent-correctness-test-mode-2026-05-25.md](../../../AlembicTest/docs/llm-input-agent-correctness-test-mode-2026-05-25.md)。
- 遗留风险：本轮不覆盖 full cold-start、真实 provider 长任务、Dashboard 展示、section 化 input assembly、Observation Ledger 或完整 redacted prompt artifact；probe JSON 位于 `AlembicTest/tmp/`，包含本机临时目录路径，仅作为本轮本地运行证据。
- 下一步建议：总控验收 Test-05 后可关闭 Wave 1 correctness test-mode 复测门，后续按阶段进入 Wave 2 / Agent input layering。

#### 总控复核

- 复核时间：2026-05-25 11:43 CST
- 复核结论：通过，关闭 Wave 1 correctness test-mode 复测门。
- 证据判断：测试报告覆盖了 Test-05 的四个硬目标：retained `llm.input` / `llm.output` process events 产生且 `llm.input.retention=job-retained`；`containsAsyncGraphContext=true` 且 `containsObjectPromise=false`；`code.read({ filePaths })` batch read 未出现 `Missing required param "path"`，并产生 `requested=3/succeeded=1/failed=2/partialFailure=true`；SCAN planning 与 `toolChoice=none` 一致，不再要求同轮立即执行工具。
- 不纳入本次完成定义：full cold-start、真实 provider 长任务、Dashboard 展示、section 化 input assembly、Observation Ledger 和完整 redacted prompt artifact。
- 下一步：当前无新的 AlembicTest 测试单；总控进入 [LLM 输入优化 Wave 2](../archive/2026-05/llm-input-optimization/llm-input-optimization-wave-2-2026-05-25.md)，先派 `AlembicAgent` 做 input layering。

### Test-2026-05-25-04：MRPS-P7-Agent-Folder-Coverage

状态：总控验收通过
创建日期：2026-05-25
总控来源：[multi-root-project-scope-wave-5-2026-05-25.md](../archive/2026-05/multi-root-project-scope/multi-root-project-scope-wave-5-2026-05-25.md)
执行窗口：AlembicTest
目标项目：AlembicWorkspace 作为 multi-folder ProjectScope 真实验证目标；不要修改真实测试项目业务源码。

#### 执行说明

用户已重新派发 P7 五文件夹补测。`AlembicTest` 本轮只补齐 `AlembicAgent` 第五 source folder 覆盖，不扩大测试范围，不改 `AlembicAgent` 内部代码，不跑 full cold-start，不操作 BiliDili。

#### 测试目标

- 补齐 P6 覆盖缺口：把 `AlembicAgent` 作为第五个 source folder 加入 AlembicWorkspace 同一 `ProjectScope`。
- 证明 `Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicPlugin`、`AlembicDashboard` 五个 source folder 都解析到同一 `projectScopeId=project-scope-a8083fdb335c` 或同一当前 ProjectScope。
- 从 `AlembicAgent` folder 至少完整复测 `status` / `diagnostics` / `tools/list` / `alembic_health` / `alembic_task prime` / `alembic_search(auto/semantic)`；同时对另外四个 folder 做最小回归，确认 P6 没有因新增 folder 回退。
- 证明 Dashboard ProjectScope panel 的 folder count / source folder 列表更新为五个 source folder，且 `controlRoot` 仍不进入 `folders[]`。
- 证明五个 source folder 执行期间不创建或修改 `.asd/` / `Alembic/` runtime data。

#### 非目标

- 不修改 `AlembicAgent` 内部 tool root、prompt、runtime 或代码。
- 不跑 full cold-start；若知识库为空，`prime/search` 语义结果可以为 0，但必须成功执行并带 ProjectScope telemetry。
- 不做 folder remove / disable。
- 不做 project-level skill visibility mount；`GTODO-2026-05-24-030` 仍待排期。
- 不修改真实测试项目源码、业务行为、UI、登录、网络或播放逻辑。

#### 前置条件

- `AlembicCore` 已验收：`b72390f Add multi-root project scope contracts`。
- `Alembic` 已验收：`31788bb21b7bba49f571c00949dc02922d6d1c7e feat: add project scope producer`。
- `AlembicPlugin` Wave 5 已通过总控代码侧验收：`2108a36db88bee4805a56b54f04bcfedb37b6cba fix: allow project scope tool execution preflight`。
- AlembicCodex runtime artifact：`ced1bcc091eac2e980c09449e13d98abdda9bc79 chore: refresh project scope preflight runtime`。
- 本机 Codex plugin cache 已由总控刷新到 `gitHead=2108a36db88bee4805a56b54f04bcfedb37b6cba`。
- P6 已证明四个 source folder 的 execution preflight 通过，但缺少 `AlembicAgent`。
- 使用测试模式或最小 smoke，避免全量冷启动长时间运行。

#### 执行范围

- 触发入口：Alembic CLI / daemon / `/api/v1/project-scope*` / Dashboard ProjectScope panel / AlembicPlugin status、diagnostics、tools/list、health、prime、search。
- 允许操作：复用当前 AlembicWorkspace ProjectScope；把 `AlembicAgent` 作为 source folder add 到同一 ProjectScope；从五个绑定 folders 启动 Plugin probes；可启动本地 Alembic daemon 和 Dashboard。
- 禁止操作：不得删除 folder 绑定；不得执行 remove / disable；不得修改真实测试项目业务源码；不得提交子仓库；不得把 workspace 根目录加入 source `folders[]`。
- 允许读取：AlembicWorkspace、Alembic、AlembicCore、AlembicAgent、AlembicPlugin、AlembicDashboard、AlembicTest 测试文档和运行日志。
- 禁止修改：除 AlembicTest 报告和必要测试运行状态外，不修改产品源码或真实项目源码。

#### 观察点

- ProjectScope 绑定：`folderCount=5`，source folders 包含五个 Alembic 系列仓库，`controlRootIncludedInFolders=false`。
- Plugin status / diagnostics：五个 folder 均为 `projectScopeIdentity.mode: "project-scope"`，`projectScopeId` 与 Alembic API 一致。
- Plugin tools/list：五个 folder 在 ProjectScope resident 可用时包含 `alembic_task`、`alembic_search`、`alembic_health`。
- Health / prime / search：五个 folder 均不返回 excluded-project preflight 错误；结果带 `data.codexProjectScopeExecution.enabled=true` 或等价 telemetry。
- Dashboard 状态：ProjectScope panel 外层 folder count 为五个；详情展开后包含 `AlembicAgent`，仍无 remove / disable。
- Source folder 写入：五个绑定 source folder 下不得因 Plugin execution 创建或修改 `.asd/` 或 `Alembic/` runtime data。
- 真实项目 git 状态：Alembic 系列子仓库和测试目标不出现非预期源码改动。

#### 验收标准

- `AlembicAgent` 已加入同一 ProjectScope，五个 source folder 都指向同一 `projectScopeId`。
- 五个 source folder 的 status / diagnostics / tools-list / health / prime / search 均可执行并带 ProjectScope telemetry。
- `controlRoot` 只作为控制入口，不出现在 source folders 列表中。
- Source folders 不被写入 `.asd/` / `Alembic/` runtime data。
- Dashboard 真实 UI 展示五个 source folders，并保持摘要 / 详情折叠结构。
- 测试报告写清命令、配置、日志、截图或 DOM / JSON 摘要、失败归口和真实 git 状态。

#### 建议命令或脚本

```bash
# 由 AlembicTest 窗口按自身 AGENTS 和测试策略选择最小命令执行。
# 建议复用 P6 probes，把 folder list 扩展到 AlembicAgent，并补 Dashboard folder count 断言。
```

#### 回填要求

- 测试结论：通过。`AlembicAgent` 已作为第五个 source folder 加入同一 `ProjectScope`，五个 Alembic 系列 source folder 的 resident-backed tools 均可执行并带 ProjectScope telemetry。
- 执行范围：复用当前 daemon / Dashboard `http://127.0.0.1:58439`；执行 ProjectScope add / list / resolve、daemon API probe、五文件夹 Plugin probes、Dashboard 项目控制弹层 DOM / 截图验证和 source folder 写入对比；未跑 full cold-start，未操作 BiliDili，未改产品源码。
- 使用配置：Dashboard header 显示测试模式；`packageVersion=0.2.0`；`projectScopeId=project-scope-a8083fdb335c`；ghost dataRoot `~/.asd/workspaces/ecf32806`；`controlRoot=/Users/gaoxuefeng/Documents/AlembicWorkspace`；`controlRootIncludedInFolders=false`。
- ProjectScope folder 绑定清单：`folderCount=5`；`Alembic=folder-278cdc6c8560(primary-source)`、`AlembicCore=folder-94c596418c32(source)`、`AlembicAgent=folder-8cd66f5af7fc(source)`、`AlembicPlugin=folder-13b22158ca25(source)`、`AlembicDashboard=folder-b5c9f02bf50a(source)`；`storageKind=ghost`；`projectRootWriteAllowed=false`；`standardWriteAllowed=false`。
- Plugin status / diagnostics / tools/list / health / prime / search 摘要：五个 source folder 均返回 `projectScopeIdentity.mode=project-scope`；tools/list 为 14 个 tools，包含 `alembic_task` / `alembic_search` / `alembic_health`；`alembic_health` 成功；`alembic_task prime` 成功且 `primeStatus=empty`；`alembic_search(auto/semantic)` 成功。
- `codexProjectScopeExecution` / resident telemetry 摘要：五个 folder 的 health / prime / search 结果均带 `enabled=true`、`projectScopeId=project-scope-a8083fdb335c`、`serviceScopeId=project-scope:project-scope-a8083fdb335c`、对应 `currentFolderId`、`dataRoot=~/.asd/workspaces/ecf32806`、`mode=project-scope`；search route 为 `alembic-resident-service` / `alembic-daemon`，`fallbackReason=vector_store_unavailable_or_empty`。
- source folder 是否无 `.asd/` / `Alembic/` 写入：通过。前后 stat 只发现 P7 前已有 `Alembic/.asd/**` 和 `AlembicPlugin/.asd/**` 历史目录；未新增或修改 `AlembicAgent` / `AlembicCore` / `AlembicDashboard` 下 `.asd/` 或 `Alembic/` runtime data，五个 source folder 无新增 `Alembic/` runtime data。
- Dashboard 展示证据：右侧 in-app browser `http://127.0.0.1:58439/recipes` 项目控制弹层显示 `ProjectScope 范围`、`5 个源文件夹`，列表包含 `Alembic`、`AlembicAgent`、`AlembicCore`、`AlembicDashboard`、`AlembicPlugin`；弹层正文未出现 `remove` / `disable` / `移除` / `删除` / `禁用` / `停用`；证据文件 `AlembicTest/tmp/mrps-p7-dashboard-projectscope-popover-body.txt`、`AlembicTest/tmp/mrps-p7-dashboard-projectscope-popover-dom.html`、`AlembicTest/tmp/mrps-p7-dashboard-projectscope-popover.png`。
- 真实项目是否干净：`Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicPlugin`、`AlembicDashboard`、`BiliDili` 收口时 `git status --short` 均为空；`AlembicTest` 和 `AlembicWorkspace` 保留前序未提交文档 / 脚本变更，本轮新增 P7 报告和当前回填。
- 详细报告路径：[../../../AlembicTest/docs/multi-root-project-scope-agent-folder-coverage-2026-05-25.md](../../../AlembicTest/docs/multi-root-project-scope-agent-folder-coverage-2026-05-25.md)。
- 提交 hash：无，本轮测试不提交产品仓库。
- 遗留风险：ProjectScope knowledge / vector store 当前为空，未验证 full cold-start 语义命中；`probe-resident-vector-search.mjs` 顶层 classifier 仍有旧判断误报 `daemon-missing-searchmeta`，原始 tool result 已证明通过；本机 `~/.asd/project-scopes.json` 持久加入 `AlembicAgent`，如需恢复需总控授权；project-level skill visibility mount 仍属于 `GTODO-2026-05-24-030`。
- 下一步建议：总控验收 P7 后可关闭 `GTODO-2026-05-24-036` 的 multi-root ProjectScope 主线完成门；后续另开 project-level skill visibility mount 专项。

#### 总控复核

- 复核时间：2026-05-25 11:06 CST
- 复核结论：通过，关闭 `GTODO-2026-05-24-036` 当前硬门禁。
- 证据判断：P7 覆盖了用户指出的缺口，`AlembicAgent` 已作为第五个 source folder 加入同一 `projectScopeId=project-scope-a8083fdb335c`；五个 source folder 的 `status` / `diagnostics` / `tools/list` / `alembic_health` / `alembic_task prime` / `alembic_search(auto/semantic)` 均成功并带 ProjectScope telemetry；Dashboard 显示 `5 个源文件夹` 且包含 `AlembicAgent`；source folder 无新增或修改 `.asd/` / `Alembic/` runtime data；产品仓库 git 状态 clean。
- 不纳入本次完成定义：ProjectScope knowledge / vector store 当前为空、未跑 full cold-start 语义命中；project-level skill visibility mount 继续保留在 `GTODO-2026-05-24-030`。
- 下一步：当前无新的 AlembicTest 测试单；LLM 输入优化 Wave 1 等 `AlembicAgent` 回填后再创建 test-mode 复测。

### Test-2026-05-25-03：MRPS-P6-Preflight-Retest

状态：四文件夹通过但覆盖不足，已由 `Test-2026-05-25-04` 补齐
创建日期：2026-05-25
总控来源：[multi-root-project-scope-wave-5-2026-05-25.md](../archive/2026-05/multi-root-project-scope/multi-root-project-scope-wave-5-2026-05-25.md)
执行窗口：AlembicTest
目标项目：AlembicWorkspace 作为 multi-folder ProjectScope 真实验证目标；不要修改真实测试项目业务源码。

#### 测试目标

- 复测 P5 最后失败点：`AlembicPlugin` Wave 5 返修后，从 `Alembic`、`AlembicCore`、`AlembicPlugin`、`AlembicDashboard` 四个已绑定 source folder 启动 Plugin，`alembic_health`、`alembic_task prime`、`alembic_search(auto/semantic)` 不再被 excluded-project preflight 拦截。
- 证明 Plugin execution context 使用同一 ProjectScope controlRoot / ghost dataRoot，response 或 telemetry 可定位 `projectScopeId=project-scope-a8083fdb335c`。
- 证明 `health` / `prime` / `search` 执行时不在任一绑定 source folder 下创建 `.asd/` 或 `Alembic/` runtime data。
- 保留 P5 已通过项的最小回归：`status` / `diagnostics` / `tools/list` 仍识别同一 ProjectScope，未绑定临时 folder baseline 仍不暴露 resident tools，Dashboard 摘要 + 详情展开仍可用且无 remove / disable。

#### 非目标

- 不跑 full cold-start；若知识库为空，`prime/search` 语义结果可以为 0，但必须成功执行并带 ProjectScope telemetry。
- 不做 folder remove / disable。
- 不做 project-level skill visibility mount；`GTODO-2026-05-24-030` 仍待排期。
- 不改 AlembicAgent tool root。
- 不修改真实测试项目源码、业务行为、UI、登录、网络或播放逻辑。

#### 前置条件

- `AlembicCore` 已验收：`b72390f Add multi-root project scope contracts`。
- `Alembic` 已验收：`31788bb21b7bba49f571c00949dc02922d6d1c7e feat: add project scope producer`。
- `AlembicPlugin` Wave 5 已通过总控代码侧验收：`2108a36db88bee4805a56b54f04bcfedb37b6cba fix: allow project scope tool execution preflight`。
- AlembicCodex runtime artifact：`ced1bcc091eac2e980c09449e13d98abdda9bc79 chore: refresh project scope preflight runtime`。
- `runtime.tgz` SHA-256：`b964d707e8636e8f1574c72bd7b5ffce44359f76164812e7d1f2e13565ec63fa`。
- 本机 Codex plugin cache 已由总控运行 `npm run dev:codex-plugin:refresh` 刷新；目标 cache 为 `/Users/gaoxuefeng/.codex/plugins/cache/gxfn/alembic-codex/0.2.0`，marker `gitHead=2108a36db88bee4805a56b54f04bcfedb37b6cba`。
- `AlembicDashboard` 第四波已验收：`6621865105878b4b5cc01c4e223304ddf7e5b544 Refine project scope panel summary`。
- 使用测试模式或最小 smoke，避免全量冷启动长时间运行。

#### 执行范围

- 触发入口：Alembic daemon / `/api/v1/project-scope*` / Dashboard ProjectScope panel / AlembicPlugin status、diagnostics、tools/list、health、prime、search。
- 允许操作：复用或重建 AlembicWorkspace ProjectScope 绑定；从 `Alembic`、`AlembicCore`、`AlembicPlugin`、`AlembicDashboard` 四个绑定 folders 启动 Plugin probes；可启动本地 Alembic daemon 和 Dashboard。
- 禁止操作：不得删除 folder 绑定；不得执行 remove / disable；不得修改真实测试项目业务源码；不得提交子仓库；不得把 workspace 根目录加入 source `folders[]`。
- 允许读取：AlembicWorkspace、Alembic、AlembicCore、AlembicPlugin、AlembicDashboard、AlembicTest 测试文档和运行日志。
- 禁止修改：除 AlembicTest 报告和必要测试运行状态外，不修改产品源码或真实项目源码。

#### 观察点

- Plugin status / diagnostics：`projectScopeIdentity.mode: "project-scope"`，`projectScopeId` 与 Alembic API 一致，`hostProjectAlignment.reason` 不再是 `selected-project-differs`。
- Plugin tools/list：ProjectScope resident 可用时包含 `alembic_task`、`alembic_search`、`alembic_health`。
- Health：`success=true`，且 `data.codexProjectScopeExecution.enabled=true` 或等价 telemetry 能证明使用 ProjectScope execution context。
- Prime / search：不返回 `CODEX_MCP_ERROR`、`CODEX_ALEMBIC_KNOWLEDGE_REQUIRED` 或 excluded-project 文案；telemetry 包含同一 `projectScopeId`。语义结果数可以为 0。
- Source folder 写入：四个绑定 source folder 下不得因 Plugin execution 创建 `.asd/` 或 `Alembic/` runtime data。
- Baseline 降级：未绑定临时 folder 或无 resident 场景仍返回 `single-folder-baseline`，不暴露 resident tools，且无崩溃。
- Dashboard 状态：ProjectScope panel 外层为项目级摘要，详情默认收起；展开后可看 source folders 和管理区；无 remove / disable。
- 真实项目 git 状态：Alembic 系列子仓库和测试目标不出现非预期源码改动。

#### 验收标准

- 四个绑定 source folder 的 status / diagnostics / tools-list / health / prime / search 均指向同一 `projectScopeId`。
- `health` / `prime` / `search` 不再被 excluded-project preflight 拦截。
- `controlRoot` 只作为控制入口，不出现在 source folders 列表中。
- Source folders 不被写入 `.asd/` / `Alembic/` runtime data。
- 未绑定 baseline 降级清楚、可读、不中断。
- Dashboard 新摘要外层可读，详情展开后 add / list / resolve 仍可用；无 remove / disable 入口。
- 测试报告写清命令、配置、日志、截图或 DOM / JSON 摘要、失败归口和真实 git 状态。

#### 建议命令或脚本

```bash
# 由 AlembicTest 窗口按自身 AGENTS 和测试策略选择最小命令执行。
# 建议复用 P5 probes 并补 health / prime / search success 和 no source writes 断言。
```

#### 回填要求

- 测试结论：通过。四个绑定 source folder `Alembic`、`AlembicCore`、`AlembicPlugin`、`AlembicDashboard` 的 Plugin `status` / `diagnostics` / `tools/list` / `alembic_health` / `alembic_task prime` / `alembic_search(auto/semantic)` 均可执行并指向同一 `projectScopeId=project-scope-a8083fdb335c`、同一 ghost dataRoot `~/.asd/workspaces/ecf32806`；P5 的 excluded-project preflight 拦截未复现。
- 执行范围：重启 Alembic daemon 并启用 `ALEMBIC_TEST_MODE=1`；复测 daemon health、`/api/v1/project-scope*`、`/api/v1/search`、四个绑定 source folder 的 Plugin probes、未绑定 baseline probe、右侧 in-app browser Dashboard 存活；未跑 full cold-start，未执行 remove / disable，未操作 BiliDili，未改产品源码。
- 使用配置：Dashboard / API URL `http://127.0.0.1:58439`；daemon pid `76180`；daemon version `0.2.0`；Project id `ecf32806`；ProjectScope id `project-scope-a8083fdb335c`；storage `ghost`；dataRoot `~/.asd/workspaces/ecf32806`。`AlembicPlugin` 当前 HEAD `56370cac0a9991e79da04a767d26bd697146f16c` 包含 P6 修复 `2108a36db88bee4805a56b54f04bcfedb37b6cba`；runtime artifact `ced1bcc091eac2e980c09449e13d98abdda9bc79`；本机 Codex plugin cache marker `gitHead=2108a36db88bee4805a56b54f04bcfedb37b6cba`，runtime tarball hash `b964d707e8636e8f1574c72bd7b5ffce44359f76164812e7d1f2e13565ec63fa`。
- ProjectScope folder 绑定清单：`projectScopeId=project-scope-a8083fdb335c`，`serviceScopeId=project-scope:project-scope-a8083fdb335c`，`projectId=ecf32806`，`folderCount=4`，`storageKind=ghost`，`controlRootIncludedInFolders=false`；folders 为 `Alembic`(`folder-278cdc6c8560`, `primary-source`)、`AlembicCore`(`folder-94c596418c32`, `source`)、`AlembicPlugin`(`folder-13b22158ca25`, `source`)、`AlembicDashboard`(`folder-b5c9f02bf50a`, `source`)。
- Plugin status / diagnostics / tools/list / health / prime / search 摘要：四个绑定 folder 的 `tools/list` 均返回 14 个工具并包含 `alembic_task`、`alembic_search`、`alembic_health`；`statusProjectScopeIdentity.mode=project-scope`；`diagnosticsProjectScopeIdentity.mode=project-scope`；`healthSuccess=true`；`primeSuccess=true` 且 `primeStatus=empty`；`alembic_search(auto/semantic)` 均 `success=true`。知识库为空导致结果数 0，不影响 execution preflight 结论。
- `codexProjectScopeExecution` / resident telemetry 摘要：`health` / `prime` / `search` 成功结果均带 `data.codexProjectScopeExecution.enabled=true`、同一 `projectScopeId` / `serviceScopeId` / `controlRoot` / `dataRoot`；search resident telemetry 显示 `route=alembic-resident-service`、`service=alembic-daemon`、`attempted=true`、`available=true`、`actualMode=weighted`、`fallbackReason=vector_store_unavailable_or_empty`、`projectScopeIdentity.projectScopeId=project-scope-a8083fdb335c`。
- source folder 是否无 `.asd/` / `Alembic/` 写入：通过。执行前后 `find ... stat` 输出一致；`Alembic/.asd` 与 `AlembicPlugin/.asd` 为历史遗留目录且 mtime / size 未变化；`AlembicCore`、`AlembicDashboard` 无 `.asd/`；四个 source folder 均未新增 `Alembic/` runtime data。
- baseline 降级证据：`AlembicTest/tmp/mrps-p6-plugin-baseline-unbound.json` 显示未绑定临时 folder `toolCount=11`，不包含 `alembic_task` / `alembic_search` / `alembic_health`，`projectScopeIdentity.mode=single-folder-baseline`，`available=false`，符合未绑定 baseline 降级预期。
- Dashboard 展示证据：右侧 in-app browser 已打开 `http://127.0.0.1:58439/recipes`，页面可见 `AlembicWorkspace`、本地 Alembic、测试模式和 Recipes 空状态；P5 已覆盖摘要 / 详情展开 / 无 remove-disable 的完整 DOM 与截图，本轮未发现回退迹象。
- 真实项目是否干净：`Alembic`、`AlembicCore`、`AlembicPlugin`、`AlembicDashboard`、`BiliDili` 收口时 `git status --short` 均为空。`AlembicWorkspace` 与 `AlembicTest` 仍有前序未提交文档 / 脚本变更，本轮新增 P6 报告和当前总控回填。
- 详细报告路径：[../../../AlembicTest/docs/multi-root-project-scope-preflight-retest-2026-05-25.md](../../../AlembicTest/docs/multi-root-project-scope-preflight-retest-2026-05-25.md)
- 提交 hash：无，本轮测试不提交产品仓库。
- 遗留风险：ProjectScope ghost knowledge/vector 当前为空，prime 为 `empty`、search 结果数为 0；旧 `probe-resident-vector-search.mjs` 顶层仍给出 `ok=false / daemon-missing-searchmeta`，这是旧 resident vector search 总分规则，不适合作为 P6 pass/fail；`Alembic/.asd` 与 `AlembicPlugin/.asd` 历史遗留目录仍存在，但本轮未新增或修改。
- 下一步建议：总控验收本测试单为通过并关闭 `GTODO-2026-05-24-036` 当前硬门禁；`GTODO-2026-05-24-030` project-level skill visibility mount 继续作为后续独立主线；后续可为 P6 增加专用 probe 判定，避免旧分类干扰。

#### 总控复核

- 复核时间：2026-05-25 10:42 CST
- 复核结论：P6 在四个 source folder 范围内通过，但覆盖范围不足，不能关闭 `GTODO-2026-05-24-036`。
- 原因：最初目标要求 `Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin` 五个 Alembic 系列仓库显式绑定为同一抽象 Project；P6 绑定清单只有四个，缺少 `AlembicAgent`。
- 下一步：已由 `Test-2026-05-25-04 / MRPS-P7-Agent-Folder-Coverage` 补齐 `AlembicAgent` 第五 source folder，并已通过总控验收。

### Test-2026-05-25-02：MRPS-P5-MultiRoot-Retest

状态：未通过，已进入 `Test-2026-05-25-03` 复测
创建日期：2026-05-25
总控来源：[multi-root-project-scope-wave-4-2026-05-25.md](../archive/2026-05/multi-root-project-scope/multi-root-project-scope-wave-4-2026-05-25.md)
执行窗口：AlembicTest
目标项目：AlembicWorkspace 作为 multi-folder ProjectScope 真实验证目标；不要修改真实测试项目业务源码。

#### 测试目标

- 复测 `Test-2026-05-25-01` 暴露的 Plugin bound-folder consumer 缺口：从任一已绑定 source folder 启动 Plugin，都能识别同一 ProjectScope resident。
- 证明 `tools/list` 在 ProjectScope resident 可用但知识库为空时仍暴露 `alembic_task`、`alembic_search`、`alembic_health`，而不是返回 `CODEX_ALEMBIC_KNOWLEDGE_REQUIRED`。
- 证明 `prime` / `search` 的 telemetry 包含同一 `projectScopeId`；语义结果可为 0，但不能被误判为 resident unavailable。
- 复测 Dashboard 新面板：外层只展示项目级摘要，详情默认收起；展开后可查看 `controlRoot` / `dataRoot` / `projectScopeId` / source folders，并保留 add / resolve。

#### 非目标

- 不做 folder remove / disable。
- 不做 project-level skill visibility mount；`GTODO-2026-05-24-030` 仍待排期。
- 不改 AlembicAgent tool root。
- 不跑全量 cold-start；若需要知识结果，可只用最小 fixture / test mode 验证 telemetry。
- 不修改真实测试项目源码、业务行为、UI、登录、网络或播放逻辑。

#### 前置条件

- `AlembicCore` 已验收：`b72390f Add multi-root project scope contracts`。
- `Alembic` 已验收：`31788bb21b7bba49f571c00949dc02922d6d1c7e feat: add project scope producer`。
- `AlembicPlugin` 第四波已验收：`4b7196c64a29cf19d8fad66c22ef76b0824067c5 fix: resolve project scope resident from bound folders`；runtime artifact `ff13a1a9b66c9c2ddc358de12b446199f6e85466`。
- `AlembicDashboard` 第四波已验收：`6621865105878b4b5cc01c4e223304ddf7e5b544 Refine project scope panel summary`。
- 使用测试模式或最小 smoke，避免全量冷启动长时间运行。

#### 执行范围

- 触发入口：Alembic CLI / daemon / Dashboard ProjectScope panel / AlembicPlugin status、diagnostics、tools/list、prime、search。
- 允许操作：复用或重建 AlembicWorkspace ProjectScope 绑定；从 `Alembic`、`AlembicCore`、`AlembicPlugin`、`AlembicDashboard` 四个绑定 folders 启动 Plugin probes；可启动本地 Alembic daemon 和 Dashboard。
- 禁止操作：不得删除 folder 绑定；不得执行 remove / disable；不得修改真实测试项目业务源码；不得提交子仓库；不得把 workspace 根目录加入 source `folders[]`。
- 允许读取：AlembicWorkspace、Alembic、AlembicCore、AlembicPlugin、AlembicDashboard、AlembicTest 测试文档和运行日志。
- 禁止修改：除 AlembicTest 报告和必要测试运行状态外，不修改产品源码或真实项目源码。

#### 观察点

- API / job 状态：`/api/v1/project-scope`、`/api/v1/project-scope/folders`、`/api/v1/project-scope/resolve-folder`、`/api/v1/daemon/health`。
- Plugin status / diagnostics：`projectScopeIdentity.mode: "project-scope"`，`projectScopeId` 与 Alembic API 一致，`hostProjectAlignment.reason` 不再是 `selected-project-differs`。
- Plugin tools/list：ProjectScope resident 可用时包含 `alembic_task`、`alembic_search`、`alembic_health`。
- Prime / search：不返回 `CODEX_ALEMBIC_KNOWLEDGE_REQUIRED`；telemetry 或 response metadata 包含同一 `projectScopeId`。
- Baseline 降级：未绑定临时 folder 或无 resident 场景仍返回 `single-folder-baseline`，且无崩溃。
- Dashboard 状态：ProjectScope panel 外层为项目级摘要，详情默认收起；展开后可看 source folders 和管理区；无 remove / disable。
- 真实项目 git 状态：Alembic 系列子仓库和测试目标不出现非预期源码改动。

#### 验收标准

- 绑定两个以上 folder 后，CLI / API / Dashboard / Plugin 四条路径看到同一 `projectScopeId`。
- `controlRoot` 只作为控制入口，不出现在 source folders 列表中。
- Plugin 在任一绑定 folder 下 status / diagnostics / tools/list / search / prime telemetry 均显示 ProjectScope identity；无 resident 情况下 baseline 降级清楚、可读、不中断。
- Dashboard 新摘要外层可读，详情展开后 add / list / resolve 仍可用；无 remove / disable 入口。
- 测试报告写清命令、配置、日志、截图或 DOM / JSON 摘要、失败归口和真实 git 状态。

#### 建议命令或脚本

```bash
# 由 AlembicTest 窗口按自身 AGENTS 和测试策略选择最小命令执行。
# 建议优先 test mode / smoke，不跑全量冷启动。
```

#### 回填要求

- 测试结论：未通过。API / daemon / Dashboard 通过，Plugin `status` / `diagnostics` / `tools/list` 已能识别绑定 folder 的 ProjectScope；但 `alembic_health`、`alembic_task prime` 和 `alembic_search` 仍被 MCP preflight 以 Alembic 源码 / 生态“排除项目”拦截，未产生 prime/search telemetry。
- 执行范围：复用 AlembicWorkspace `controlRoot` 和旧 ProjectScope registry，绑定 `Alembic`、`AlembicCore`、`AlembicPlugin`、`AlembicDashboard` 四个 source folders；执行 daemon health、`/api/v1/project-scope*`、`/api/v1/search`、四个绑定 folder 的 Plugin `tools/list` / status / diagnostics / health / prime / search probes、未绑定 baseline probe、Dashboard 右侧 in-app browser UI 检查；未跑 full cold-start，未执行 remove / disable，未操作 BiliDili。
- 使用配置：`ALEMBIC_TEST_MODE=1`；Dashboard / API URL `http://127.0.0.1:51087`；daemon pid `37436`；`AlembicCore` `b72390f`；`Alembic` `31788bb21b7bba49f571c00949dc02922d6d1c7e`；`AlembicPlugin` `4b7196c64a29cf19d8fad66c22ef76b0824067c5`；AlembicCodex runtime artifact `ff13a1a9b66c9c2ddc358de12b446199f6e85466`；`AlembicDashboard` `6621865105878b4b5cc01c4e223304ddf7e5b544`；复用旧 ProjectScope registry。
- ProjectScope folder 绑定清单：`projectScopeId=project-scope-a8083fdb335c`，`projectId=ecf32806`，`dataRoot=~/.asd/workspaces/ecf32806`，`storageKind=ghost`，`controlRootIncludedInFolders=false`；folders 为 `Alembic`(`primary-source`)、`AlembicCore`(`source`)、`AlembicPlugin`(`source`)、`AlembicDashboard`(`source`)。
- Plugin status / diagnostics / tools/list / prime / search 摘要：四个绑定 folder 的 `status.projectScopeIdentity` 和 `diagnostics.projectScopeIdentity` 均为 `mode=project-scope`、同一 `projectScopeId=project-scope-a8083fdb335c`、`serviceScopeId=project-scope:project-scope-a8083fdb335c`，`hostProjectAlignment.handoffMismatch=null`；`tools/list` 返回 14 tools，包含 `alembic_task`、`alembic_search`、`alembic_health`；但 `health` / `prime` / `search(auto/semantic)` 均返回 `CODEX_MCP_ERROR`，信息为当前绑定 folder 是 Alembic 源码仓库或生态项目，MCP server 拒绝在此目录创建运行时数据。
- Daemon / API 摘要：`AlembicTest/tmp/mrps-p5-daemon-api.json` 显示 `daemonReady=true`、`projectScopeAvailable=true`、`folderCount=4`、`sameProjectScopeAcrossFolders=true`、`controlRootInFolders=false`、`controlRootIncludedInFolders=false`、`ghostStorage=true`、`searchHasMeta=true`。
- Dashboard 展示证据：截图 `AlembicTest/tmp/mrps-p5-dashboard-summary.png` / `AlembicTest/tmp/mrps-p5-dashboard-details.png`，DOM `AlembicTest/tmp/mrps-p5-dashboard-summary-dom.txt` / `AlembicTest/tmp/mrps-p5-dashboard-details-dom.txt`；外层只展示项目级摘要、`ghost`、`4 个源文件夹`、`已绑定` 和 `查看详情与管理`，无 `控制根` / `数据根`；展开后可见 `controlRoot` / `dataRoot` / `projectScopeId` / source folders / add / resolve；未发现 ProjectScope remove / disable 操作。
- baseline 降级证据：`AlembicTest/tmp/mrps-p5-plugin-baseline-unbound.json` 中未绑定临时 folder 返回 `single-folder-baseline`，工具列表不含 `alembic_task` / `alembic_search` / `alembic_health`，prime/search 显示 knowledge tools hidden，不崩溃。
- 真实项目是否干净：`Alembic`、`AlembicCore`、`AlembicPlugin`、`AlembicDashboard`、`BiliDili` 测试后均为 clean；AlembicWorkspace 和 AlembicTest 有前序未提交文档 / 脚本变更，本轮新增 P5 报告并补强 AlembicTest probe。
- 详细报告路径：[../../../AlembicTest/docs/multi-root-project-scope-retest-2026-05-25.md](../../../AlembicTest/docs/multi-root-project-scope-retest-2026-05-25.md)
- 提交 hash：无，本轮为 AlembicTest 复测与文档回填，未提交仓库。
- 遗留风险：`GTODO-2026-05-24-036` 仍未完成，主线不能归档；ProjectScope ghost dataRoot 仍为空，修复 Plugin tool execution 后 prime/search 可能仍为 0 条但必须带 ProjectScope telemetry；本机 `~/.asd/project-scopes.json` 保留测试绑定，未执行 remove / disable。
- 下一步建议：派发 `AlembicPlugin` 继续返修 tool execution preflight，使 status / diagnostics 已解析到 `project-scope` identity 后，`alembic_health` / `alembic_task` / `alembic_search` 使用 ProjectScope controlRoot / ghost dataRoot，而不是继续以当前 Alembic source folder 的 excluded-project 规则拒绝；Dashboard 本轮可由总控验收关闭 `GTODO-2026-05-25-001`。

#### 总控复核

- 复核时间：2026-05-25 本轮
- 复核结论：未通过，当前主线不得归档。
- 通过部分：Alembic producer / daemon API / ProjectScope resolve、Plugin ProjectScope identity / tools-list、Dashboard 摘要与详情 UI、未绑定 baseline。
- 失败部分：Plugin resident-backed tools 执行预检仍按当前 source folder 做 excluded-project 短路，`health` / `prime` / `search` 未进入 ProjectScope resident route。
- 返修计划：[multi-root-project-scope-wave-5-2026-05-25.md](../archive/2026-05/multi-root-project-scope/multi-root-project-scope-wave-5-2026-05-25.md)，当前发送给 `AlembicPlugin`。

### Test-2026-05-25-01：MRPS-P4-MultiRoot-Smoke

状态：未通过，已进入 `Test-2026-05-25-02` 复测
创建日期：2026-05-25
总控来源：[multi-root-project-scope-wave-3-2026-05-24.md](../archive/2026-05/multi-root-project-scope/multi-root-project-scope-wave-3-2026-05-24.md)
执行窗口：AlembicTest
目标项目：AlembicWorkspace 作为 multi-folder ProjectScope 真实验证目标；不要修改真实测试项目业务源码。

#### 测试目标

- 证明 Alembic CLI / Dashboard 能把 AlembicWorkspace 下至少两个 Alembic 系列 folder 显式绑定到同一抽象 ProjectScope。
- 证明从任一绑定 folder 的 Codex / Plugin 入口读取 status / diagnostics / prime / search 时，都指向同一 `projectScopeId` 和 Project 级 ghost dataRoot。
- 证明 Dashboard 能展示 ProjectScope summary / source folders，并且 controlRoot 不进入 source folders。
- 证明无 Alembic resident 或 ProjectScope 不可用时，Plugin 仍保持单 folder baseline，且该降级被标为 `resident project scope unavailable`，不是错误。

#### 非目标

- 不做 folder remove / disable。
- 不做 project-level skill visibility mount；`GTODO-2026-05-24-030` 仍待排期。
- 不改 AlembicAgent tool root。
- 不修改真实测试项目源码、业务行为、UI、登录、网络或播放逻辑。

#### 前置条件

- `AlembicCore` 已验收：`b72390f Add multi-root project scope contracts`。
- `Alembic` 已验收：`31788bb21b7bba49f571c00949dc02922d6d1c7e feat: add project scope producer`。
- `AlembicPlugin` 已验收：`96f941803d71d93b76a4f85fe4014fdbe9257c58 feat: consume resident project scope in codex plugin`；runtime artifact `4ffb1314904ef11b41ddd491aa070bcb5c2b517c`。
- `AlembicDashboard` 已验收：`bd6f4050c18e3b441b87d10efa7734135600fce6 Consume ProjectScope in dashboard`。
- 使用测试模式或最小 smoke，避免全量冷启动长时间运行。

#### 执行范围

- 触发入口：Alembic CLI / daemon / Dashboard ProjectScope panel / AlembicPlugin status、diagnostics、prime、search。
- 允许操作：在 AlembicWorkspace 内选择至少两个 Alembic 系列 folder 做 add / list / resolve / status / search / prime smoke；可启动本地 Alembic daemon 和 Dashboard。
- 禁止操作：不得删除 folder 绑定；不得执行 remove / disable；不得修改真实测试项目业务源码；不得提交子仓库；不得把 workspace 根目录加入 source `folders[]`。
- 允许读取：AlembicWorkspace、Alembic、AlembicCore、AlembicPlugin、AlembicDashboard、AlembicTest 测试文档和运行日志。
- 禁止修改：除 AlembicTest 报告和必要测试运行状态外，不修改产品源码或真实项目源码。

#### 观察点

- API / job 状态：`/api/v1/project-scope`、`/api/v1/project-scope/folders`、`/api/v1/project-scope/resolve-folder`、`/api/v1/daemon/health`。
- Dashboard 状态：ProjectScope panel 显示 `controlRoot`、`dataRoot`、`storageKind=ghost`、`projectScopeId`、source folders；不可用状态不造假。
- Plugin 状态：`alembic_codex_status` / diagnostics 返回 `projectScopeIdentity.mode: "project-scope"`；无 resident baseline 返回 `mode: "single-folder-baseline"`。
- Prime / search：resident search telemetry 或 prime search metadata 包含同一 `projectScopeId`。
- 文件 / 候选产物：ProjectScope registry 写在 Alembic ghost 区；source folders 不被写入产品源码。
- 真实项目 git 状态：Alembic 系列子仓库和测试目标不出现非预期源码改动。

#### 验收标准

- 绑定两个以上 folder 后，CLI / API / Dashboard / Plugin 四条路径看到同一 `projectScopeId`。
- `controlRoot` 只作为控制入口，不出现在 source folders 列表中。
- Plugin 在任一绑定 folder 下 status / diagnostics / search / prime telemetry 均显示 ProjectScope identity；无 resident 情况下 baseline 降级清楚、可读、不中断。
- Dashboard add / list / resolve 可用；无 remove / disable 入口；ProjectScope API 不可用时显示不可用而不是假数据。
- 测试报告写清命令、配置、日志、截图或 JSON 摘要、失败归口和真实 git 状态。

#### 建议命令或脚本

```bash
# 由 AlembicTest 窗口按自身 AGENTS 和测试策略选择最小命令执行。
# 建议优先 test mode / smoke，不跑全量冷启动。
```

#### 回填要求

- 测试结论：未通过，Alembic CLI / daemon / API / Dashboard 的 ProjectScope producer 与 Dashboard consumer 通过；AlembicPlugin 从已绑定 folder `Alembic` / `AlembicCore` 进入时仍降级为 `single-folder-baseline`，未解析到同一 `projectScopeId`。
- 执行范围：以 AlembicWorkspace 根目录作为 `controlRoot`，绑定 `Alembic`、`AlembicCore`、`AlembicPlugin`、`AlembicDashboard` 四个 source folders；执行 CLI add/list/resolve、daemon health、`/api/v1/project-scope*`、`/api/v1/search`、Dashboard ProjectScope panel、Plugin status / diagnostics / prime / search probes；未跑 full cold-start，未执行 remove / disable，未操作 BiliDili。
- 使用配置：`ALEMBIC_TEST_MODE=1`；Alembic CLI / daemon `0.2.0`；`AlembicCore` `b72390f`；`Alembic` `31788bb21b7bba49f571c00949dc02922d6d1c7e`；`AlembicPlugin` `96f941803d71d93b76a4f85fe4014fdbe9257c58`；`AlembicDashboard` `bd6f4050c18e3b441b87d10efa7734135600fce6`。
- ProjectScope folder 绑定清单：`projectScopeId=project-scope-a8083fdb335c`，`projectId=ecf32806`，`dataRoot=~/.asd/workspaces/ecf32806`，`storageKind=ghost`，`controlRootIncludedInFolders=false`；folders 为 `Alembic`(`primary-source`)、`AlembicCore`(`source`)、`AlembicPlugin`(`source`)、`AlembicDashboard`(`source`)。
- daemon / Dashboard URL 摘要：daemon pid `3484`，Dashboard/API URL `http://127.0.0.1:49619`，`/api/v1/daemon/health` ready；`residentService.serviceScope.scopeId=project-scope:project-scope-a8083fdb335c`。
- status / diagnostics / prime / search 摘要：controlRoot 本身 `alembic_codex_status` 可连到 `local-alembic-daemon`；但从 `Alembic` / `AlembicCore` 启动 Plugin probe 时 `projectScopeIdentity.mode=single-folder-baseline`、`projectScopeId=null`、reason 为 `resident project scope unavailable: daemon is not started`，`hostProjectAlignment.reason=selected-project-differs`；`tools/list` 不包含 `alembic_task` / `alembic_search`；prime / search 返回 `CODEX_ALEMBIC_KNOWLEDGE_REQUIRED`，未产生 ProjectScope telemetry。diagnostics 另有既有插件元数据问题 `PLUGIN_RUNTIME_PIN_MISMATCH` / `PLUGIN_METADATA_INCOMPLETE`。
- API JSON 关键字段：`AlembicTest/tmp/mrps-p4-daemon-api.json` 显示 `daemonReady=true`、`projectScopeAvailable=true`、`folderCount=4`、`sameProjectScopeAcrossFolders=true`、`controlRootInFolders=false`、`ghostStorage=true`、`searchHasMeta=true`；`/api/v1/search` 有 `searchMeta` keys，但因未 full cold-start，新 ghost dataRoot 结果数为 `0`。
- Dashboard 展示证据：截图 `AlembicTest/tmp/mrps-p4-dashboard-projectscope.png`，DOM `AlembicTest/tmp/mrps-p4-dashboard-projectscope-dom.txt`；ProjectScope panel 展示 controlRoot、dataRoot、`ghost`、`project-scope-a8083fdb335c` 和 4 个 source folders；DOM 未发现 ProjectScope remove / disable 入口。
- baseline 降级证据：`AlembicTest/tmp/mrps-p4-plugin-baseline-unbound.json` 中未绑定临时 folder 返回 `single-folder-baseline` 且无崩溃，满足 baseline 不报错；但已绑定 folders 也同样落入 baseline，属于失败点。
- 真实项目是否干净：`Alembic`、`AlembicCore`、`AlembicPlugin`、`AlembicDashboard`、`BiliDili` 测试后均为 clean；AlembicWorkspace 和 AlembicTest 存在前序未提交文档/脚本变更，本轮只新增 AlembicTest 报告和只读 probe。
- 详细报告路径：[../../../AlembicTest/docs/multi-root-project-scope-smoke-2026-05-25.md](../../../AlembicTest/docs/multi-root-project-scope-smoke-2026-05-25.md)
- 遗留风险：本机 `~/.asd/project-scopes.json` 保留本次绑定 registry，未执行 remove / disable；ProjectScope ghost dataRoot 为空，后续 prime/search 语义结果需在修复 Plugin bound-folder consumer 后再用小样本知识库复测；Plugin metadata diagnostics 的既有发布健康问题仍需单独处理。
- 下一步建议：先派发 `AlembicPlugin` 修复 ProjectScope-aware resident discovery / HostProjectAlignment，使 active runtime controlRoot 与 bound source folder 被识别为同一 ProjectScope；同时根据用户反馈派发 `AlembicDashboard` 简化 ProjectScope 面板外层信息架构；修复后复跑本报告中的 API probe、Dashboard panel smoke 与 `Alembic` / `AlembicCore` Plugin probes。
- 建议归属窗口：`AlembicPlugin` 主责修复 bound-folder consumer；`AlembicDashboard` 处理面板降噪；`AlembicTest` 复测；`Alembic` 观察。

#### 总控复核

- 复核时间：2026-05-25 02:10 CST
- 复核结论：未通过，当前主线不得归档。
- 通过部分：Core / Alembic producer、Dashboard ProjectScope API 消费和面板展示、controlRoot 不进入 source folders、无 remove / disable。
- 失败部分：Plugin 从绑定 source folder 启动时仍回落 `single-folder-baseline`，未连接同一 ProjectScope resident。
- 追加用户反馈：Dashboard ProjectScope 面板外层信息过重，外层应只放项目级摘要，更多字段和 source folder 操作进入子面板 / 折叠区。
- 返修计划：[multi-root-project-scope-wave-4-2026-05-25.md](../archive/2026-05/multi-root-project-scope/multi-root-project-scope-wave-4-2026-05-25.md)，发送给 `AlembicPlugin` 和 `AlembicDashboard`。

当前待启动测试：

- `Test-2026-05-25-09 / LLMI-P11-Package-Runtime-Integration`：当前发送给 `AlembicTest`；验证 package/runtime 或小 cold-start 链路消费最新 Agent runtime，不跑 full cold-start，不修改产品源码或真实测试项目业务源码。

今日已完成测试：

- `Test-2026-05-25-07 / LLMI-P6-Agent-Observation-Ledger-TestMode`：Wave 3 Observation Ledger source test-mode 复测通过，报告见 [AlembicTest docs](../../../AlembicTest/docs/llm-input-observation-ledger-test-mode-2026-05-25.md)，已通过总控验收；遗留 `AlembicAgent/dist` 未刷新继续保留为 `GTODO-2026-05-25-002`。
- `Test-2026-05-25-06 / LLMI-P4-Agent-Input-Layering-TestMode`：LLM input layering source test-mode 复测通过，报告见 [AlembicTest docs](../../../AlembicTest/docs/llm-input-layering-test-mode-2026-05-25.md)，已通过总控验收；AlembicTest 封口提交 `6f9514cb3c586d3b3d23e2e52eb7a6ce4b17e40b`；遗留 `AlembicAgent/dist` 未刷新风险转 `GTODO-2026-05-25-002`。
- `Test-2026-05-25-05 / LLMI-P2-Agent-Correctness-TestMode`：LLM input Agent correctness 最小 test-mode 复测通过，报告见 [AlembicTest docs](../../../AlembicTest/docs/llm-input-agent-correctness-test-mode-2026-05-25.md)，已通过总控验收。
- `Test-2026-05-24-08 / LOTB-P2-Output-Completeness-TestMode`：LLM output completeness 最小真实复测通过，报告见 [AlembicTest docs](../../../AlembicTest/docs/llm-output-completeness-test-mode-2026-05-24.md)，总控归档见 [llm-output-truncation-bug](../archive/2026-05/llm-output-truncation-bug/)。
- `Test-2026-05-24-05 / CSSD-P4B-TestMode-Test`：project skill runtime delivery 通过，报告见 [AlembicTest docs](../../../AlembicTest/docs/project-skill-runtime-delivery-test-mode-2026-05-24.md)。
- `Test-2026-05-24-07 / SPSR-P5-TestMode-Readability-Retest`：scan progress semantic readability 通过，报告见 [AlembicTest docs](../../../AlembicTest/docs/scan-progress-semantic-readability-retest-2026-05-24.md)。

## 下一步

当前发送给 `AlembicTest` 执行 `Test-2026-05-25-09 / LLMI-P11-Package-Runtime-Integration`。测试回填后，总控再判断 LLM 输入优化主线是否完整闭合，或是否需要按失败归口返修。
