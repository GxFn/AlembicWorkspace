# AI-MOCK Wave 3 Real AI Smoke

日期：2026-05-28
窗口：AlembicTest
任务：AI-MOCK-W3-ALEMBICTEST-REAL-AI-SMOKE
状态：通过，待总控验收

## 测试结论

通过。BiliDili Ghost workspace 的最小 runtime smoke 使用真实 / 默认 AI 配置进入 `deepseek` provider 路径；daemon health、AI config API、providers API、provider probe、combined log 和 Codex 内置浏览器 Dashboard UI 均未观察到 product `mock` provider / fallback。

无配置分支做了最小 CLI fixture 复核：空配置 fixture 的 `ai status` 返回 `ok=false`、`source=empty`、`provider=null`、`model=null`，未回落到 `mock`。

## 执行范围

- 目标项目：`BiliDili`，作为真实 iOS/Swift 业务项目保护，只读验证。
- 运行时：本地 Alembic daemon / Dashboard。
- 不包含：full cold-start、PCVM N0-N14、产品源码修复、BiliDili 业务源码修改。
- UI 观察：已按 AlembicTest 规则使用 Codex 内置 browser 打开 `Dashboard / jobs` 页面。

## 使用配置

- 配置来源：BiliDili Ghost workspace settings。
- provider/model：`deepseek / deepseek-v4-pro`。
- key presence：`ALEMBIC_DEEPSEEK_API_KEY=true`，未记录 secret 值。
- embedding：`ollama / qwen3-embedding:0.6b`。
- fallback：未使用默认项目 fallback，原因是目标项目配置可用。

## 命令与结果

```bash
node scripts/visible-dispatch.mjs claim --window AlembicTest --write --json
```

结果：claimed task `ai-mock-removal-real-ai-smoke-wave-3-2026-05-28__AlembicTest__AI-MOCK-W3-ALEMBICTEST-REAL-AI-SMOKE`。

```bash
node AlembicTest/scripts/restart-alembic.mjs --project BiliDili --json --wait 12000
```

第一次尝试因 Codex shell 默认 PATH 不含 `npm`，触发 AlembicTest restart 脚本错误 `Cannot read properties of undefined (reading 'trim')`。这是 AlembicTest 脚本健壮性缺口，不是 product runtime 结论。

```bash
PATH="<node-22-bin>:$PATH" node AlembicTest/scripts/restart-alembic.mjs --project BiliDili --json --wait 12000
```

结果：通过。dev-link 成功，daemon ready，Dashboard/API 为 `http://127.0.0.1:63488`，pid `43964`。

```bash
curl -sS --max-time 8 http://127.0.0.1:63488/api/v1/daemon/health
```

结果：通过。`capabilities.internalAi.available=true`，`configSource=workspace-settings`，`provider=deepseek`，`model=deepseek-v4-pro`。

```bash
GET /api/v1/ai/config
GET /api/v1/ai/env-config
GET /api/v1/ai/providers
POST /api/v1/ai/probe {"provider":"deepseek"}
```

结果：通过。`/api/v1/ai/probe` 返回 `status=connected`，latency 约 `1779ms`；providers 列表不包含 `mock`，active provider 为 `deepseek`。

```bash
node Alembic/dist/bin/cli.js ai status -d /private/tmp/alembic-ai-mock-w3-empty-fixture --json
```

结果：通过。空配置 fixture 返回 `ok=false`、`source=empty`、`provider=null`、`model=null`。

## 证据路径

- Runtime API 摘要：`AlembicTest/tmp/ai-mock-w3-real-ai-smoke-2026-05-28.json`
- Codex browser DOM：`AlembicTest/tmp/ai-mock-w3-codex-browser-dom-2026-05-28.txt`
- Codex browser 截图：`AlembicTest/tmp/ai-mock-w3-codex-browser-jobs-2026-05-28.png`
- daemon combined log tail：`AlembicTest/tmp/ai-mock-w3-combined-log-tail-2026-05-28.txt`
- 空配置 fixture AI status：`AlembicTest/tmp/ai-mock-w3-empty-fixture-ai-status-2026-05-28.json`

关键证据摘要：

- `mockSignals.aiConfigIsMock=false`
- `mockSignals.providersIncludeMock=false`
- `mockSignals.activeProviderIsMock=false`
- `mockSignals.healthInternalAiProviderIsMock=false`
- `mockSignals.probeProviderIsMock=false`
- combined log 出现 `AI provider injected into container`，`provider=DeepSeekProvider`。
- combined log 未出现 `mock`。
- Codex browser DOM 包含 `BiliDili`、`后台任务`、`deepseek-v4-pro`。

## Dashboard 观察

Codex 内置 browser 打开 `http://127.0.0.1:63488/jobs`，页面顶部项目为 `BiliDili`，AI selector 显示 `deepseek-v4-pro`，Jobs 页面可见。

过程中曾误用 macOS `open` 打开外部 Chrome。该步骤不作为本轮主 UI 证据；最终 UI 证据以 Codex 内置 browser DOM / 截图为准。

## Git 状态

- `BiliDili`：clean。
- `Alembic`：clean。
- `AlembicAgent`：clean。
- `AlembicDashboard`：clean。
- `AlembicTest`：存在历史未提交测试窗口配置 / 文档 / 脚本变更，本轮新增 ignored `tmp/` 证据；未修改产品源码。

版本证据：

- `Alembic`：`c46e09d8f0ca689fe43d83488f860d9d0e3a400d`
- `AlembicAgent`：`26fe915366ea7198ffc37889752644fc5028be3c`
- `AlembicDashboard`：`7fdb4863c61a714963fa8dc4b30d9b2296555e5a`

## 失败归口

- Product runtime：未发现失败；真实 provider probe 通过，无 mock fallback。
- AlembicTest harness：restart 脚本在 `npm` 不在 PATH 时会因 `child.stderr` 为空触发 `.trim()` TypeError，建议 AlembicTest 后续修脚本健壮性。
- 截图采集：macOS `screencapture` 在当前 Codex 环境返回 `could not create image from display`；最终使用 Codex browser screenshot API 补齐。

## 遗留风险

- 本轮是最小 runtime smoke，不覆盖 full cold-start、rescan、PCVM N0-N14 或长任务 token/LLM output 质量。
- `/api/v1/ai/probe` 证明 provider 连通，但未执行完整 Agent workflow。
- 空配置分支只做 CLI config status 级别复核，未另启一个无配置 daemon。

## 下一步建议

- 总控可基于本报告验收 AI-MOCK Wave 3，并恢复 PCVM 真实 AI runtime baseline。
- AlembicTest 可后续修 `restart-alembic.mjs` 的 `child.stderr?.trim?.()` 类健壮性问题，避免 PATH 缺 npm 时错误遮蔽真实原因。
