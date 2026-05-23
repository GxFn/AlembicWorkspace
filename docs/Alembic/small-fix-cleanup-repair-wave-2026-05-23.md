# Small Fix / Cleanup Repair Wave — Alembic SFC-R1

日期：2026-05-23
窗口：`Alembic`
状态：待验收
提交：`50dbaef15cf16273d01971e192a318450a0df878`

## 窗口定位

- 当前窗口：`Alembic` 主仓库执行窗口。
- 本轮职责：执行 `SFC-R1-ALEMBIC`，只修总控文档列为 `待修复` 的 `SFC-ALEMBIC-001`、`SFC-ALEMBIC-002`、`SFC-ALEMBIC-003`、`SFC-ALEMBIC-004`。
- 明确不承担：不处理 `SFC-ALEMBIC-005` lint debt 观察项；不删除 `/api/v1/ai/env-config`；不触碰 Dashboard vendored consumer；不操作 BiliDili 或其它真实测试项目。

## 完成范围

- `SFC-ALEMBIC-001`：更新 `AGENTS.md` 中 package imports 说明，移除已删除的 `#external/*` alias。
- `SFC-ALEMBIC-002`：删除本地空目录 `lib/external/mcp/handlers/bootstrap`，并继续保持 `lib/external/mcp/README.md` 作为 retired MCP source entrypoint marker。删除后 `lib/external` 下无空目录。
- `SFC-ALEMBIC-003`：将 `config/agent-extraction-boundary.json` 中 `lib/external/ai/**` 从 deletion-candidate 口径改为 retired negative guard；同时更新 `scripts/lint-agent-extraction-boundary.mjs` 的默认 ignored prefix 和 violation 文案，保留 `#external/ai` / `lib/external/ai` 负向检测，不恢复本地 AI 树。
- `SFC-ALEMBIC-004`：更新 `lib/http/routes/ai.ts` 中 `/api/v1/ai/env-config` 注释，明确 `env-config` 是当前 Dashboard 使用的历史路由名，不是可删旧 Dashboard 入口。

## 验证命令与结果

- `npm run check`：通过。说明：lint 阶段仍输出既有 227 warnings / 25 infos，属于 `SFC-ALEMBIC-005` 观察项，本波未处理。
- `npm run build:check`：通过，使用 workspace 本地 `../AlembicCore`。
- `npm run lint:agent-extraction-boundary`：通过，`local AI provider consumers: 0`，`stale deleted duplicate dist artifacts: 0`。
- `npm run lint:repo-boundary`：通过，`@escape-hatch count: 1 / 75 threshold`。
- `npm run test:unit -- --run test/unit/ResidentServiceBoundary.test.ts test/unit/AgentModuleBoundaries.test.ts`：通过，2 files / 14 tests。
- `git diff --check`：通过，无输出。
- `rg -n '#external/\*|#external/' AGENTS.md package.json lib bin config scripts test`：仅剩 `scripts/lint-agent-extraction-boundary.mjs` 的 `#external/ai` 负向检测和 `test/unit/AgentModuleBoundaries.test.ts` 的 retired fixture。
- `rg -n 'localDeletionCandidate|preserved only as a deletion candidate|lib/external/ai|#external/ai' config/agent-extraction-boundary.json scripts/lint-agent-extraction-boundary.mjs`：无旧 deletion-candidate 文案；仅剩 retired negative guard 与负向检测。
- `rg -n '旧 Dashboard|env-config' lib/http/routes/ai.ts vendor/AlembicDashboard/src/api.ts`：无“旧 Dashboard”命中；确认 vendored Dashboard 仍消费 `/ai/env-config`。
- `find lib/external -maxdepth 4 -type f -o -type d -empty | sort`：仅剩 `lib/external/mcp/README.md`。

## 未处理项理由

- `SFC-ALEMBIC-005`：Biome warnings / infos 是观察项，当前总控文档明确不纳入本波；本轮只记录 `npm run check` 仍会显示这些 warning。
- `/api/v1/ai/env-config` API：当前 vendored Dashboard 仍消费该 endpoint，本波只修注释，不删除 contract。
- Dashboard vendored consumer：不属于 Alembic 主仓库本轮待修事项，未修改。

## 遗留风险

- Alembic 仓库当前 `main` 比 `origin/main` ahead 1，需要后续按总控安排 push 或由用户统一处理。
- `npm run check` 虽通过，但 Biome warning / info 规模仍大；若未来提高 lint 严格度，需要独立 lint debt wave。
- 本波未运行 integration / e2e / daemon / Dashboard 手工 smoke；修复内容为文档、注释、boundary guard 文案和空目录清理，未改变运行时 API contract。

## 下一步建议

- 总控验收 `50dbaef15cf16273d01971e192a318450a0df878` 后，可将 `SFC-ALEMBIC-001` 至 `SFC-ALEMBIC-004` 标为已完成。
- `SFC-ALEMBIC-005` 继续留作观察或后续独立 lint debt 任务，不建议夹在当前小修包里顺手处理。
