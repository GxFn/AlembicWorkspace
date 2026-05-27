# AlembicAgent SFC-R1 Repair Wave

日期：2026-05-23
窗口定位：`AlembicAgent` 执行窗口
目标仓库：`AlembicAgent`
任务包：`SFC-R1-AGENT`
状态：已完成，待总控验收
提交 hash：`68636c40955dd044f74ca8ff8998ae0e49675326`

## 完成范围

- `SFC-Agent-001`：修复 `npm run lint` 基线；Biome 从 1 个 error / 19 个 warnings 恢复为 0 问题，并让 `npm run check` 可完整执行。
- `SFC-Agent-002`：将 AI provider 缺 key 错误从 Dashboard UI 文案中解耦，改为 host-neutral message + metadata：`code`、`provider`、`envVar`、`hostAction`。
- `SFC-Agent-004`：完成 package asset 消费方扫描；未发现其它仓库消费 `@alembic/agent` 的 `shared/package-assets` 深路径，因此收窄 `src/shared/package-assets.ts`，只保留真实消费的 `PACKAGE_ROOT`。

## 主要代码变化

- `src/external/ai/AiProvider.ts` 新增 `createMissingApiKeyError()` 和 `MissingApiKeyError`，provider / transport 缺 key 只暴露宿主中立的配置元数据。
- `src/external/ai/providers/*Provider.ts` 与 `src/external/ai/transport/LLMTransport.ts` 改用统一缺 key 错误，不再提示 Alembic Dashboard / AI Settings。
- `test/ai-provider.test.ts` 新增缺 key 单测，覆盖 OpenAI、Claude、DeepSeek、Google Gemini，并断言错误不包含 `Dashboard` 或 `AI Settings`。
- `src/shared/package-assets.ts` 删除无仓库内消费的 `CONFIG_DIR`、`INTERNAL_SKILLS_DIR`、`INJECTABLE_SKILLS_DIR`、deprecated `SKILLS_DIR`、`TEMPLATES_DIR`、`RESOURCES_DIR`、`DASHBOARD_DIR`，保留 `PACKAGE_ROOT`。
- 修复 Biome 报出的非空断言、未使用 import / 变量 / 私有方法、可选链、Hook return 类型和格式问题。

## 消费方扫描证据

- 仓库内扫描：`rg -n "DASHBOARD_DIR|SKILLS_DIR|INJECTABLE_SKILLS_DIR|INTERNAL_SKILLS_DIR|CONFIG_DIR|RESOURCES_DIR|TEMPLATES_DIR" src test scripts config package.json` 无命中。
- 跨仓库扫描：`rg -n "@alembic/agent/(shared|dist/shared|src/shared|.*package-assets)|@alembic/agent.*package-assets|AlembicAgent/.*/package-assets|AlembicAgent/src/shared/package-assets|agent/dist/shared/package-assets|agent/src/shared/package-assets" Alembic AlembicCore AlembicDashboard AlembicPlugin ...` 无命中。
- 广义 `package-assets` 扫描会命中 `Alembic` / `AlembicPlugin` / `AlembicCore` 各自仓库内部的同名 adapter；这些不是 `@alembic/agent` package asset 消费方。

## 验证命令与结果

| 命令 | 结果 |
| --- | --- |
| `npm run lint` | 通过；Biome 检查 230 个文件，无问题。 |
| `npm run build:check` | 通过。 |
| `npm run test -- test/ai-provider.test.ts` | 通过；1 个文件、9 个测试。 |
| `npm run check` | 通过；build、lint、三条边界 lint、19 个测试文件、88 个测试全部通过。 |
| `rg -n "Alembic Dashboard|AI Settings|Dashboard 和 API|Dashboard/Routes|Gateway、Dashboard" src scripts test --glob '!test/ai-provider.test.ts'` | 无命中；剩余 `AI Settings` 只在新增负向测试断言中出现。 |
| `git diff --check` | 通过。 |

## 未处理项理由

- `SFC-Agent-003`：L4 compaction 默认行为为 `待确认`，本波按计划不改变默认开关、不启用自动 L4、不改运行时语义。
- deprecated 模型条目：不属于当前 repair wave 的 `待修复` 项，本波未删除。
- Dashboard / Plugin / Alembic 主仓库：只做只读扫描，不修改相邻仓库。
- BiliDili：未操作。

## 遗留风险

- 本波未运行发布 staging / pack preview；当前任务要求修复 lint、provider 文案和 package asset 清理，`npm run check` 已覆盖 package public API / import boundary。
- Alembic Codex 本地知识仍不可用：项目未初始化，且诊断显示 plugin runtime pin / metadata 问题；本次修复未依赖 Recipe 知识。

## 下一步建议

- 总控验收本提交后，可关闭 `SFC-Agent-001`、`SFC-Agent-002`、`SFC-Agent-004`。
- `SFC-Agent-003` 仍需单独确认 L4 默认行为，再决定正式化 opt-in 还是恢复自动触发。
