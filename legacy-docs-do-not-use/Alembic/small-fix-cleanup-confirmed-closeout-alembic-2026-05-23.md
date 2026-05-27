# Alembic SFC-R3 Codex-Safe Unit Baseline

日期：2026-05-23
窗口：`Alembic`
任务包：`SFC-R3-ALEMBIC`
提交：`69474767c84adc15fccaa9d8a8513bd8ff7f2ee5` (`test: add codex-safe unit baseline`)

## 完成范围

- 新增 `npm run test:unit:codex`，使用 `vitest.unit.codex.config.ts` 作为 Codex desktop sandbox-safe unit baseline。
- 保留完整 `npm run test:unit` 命令不变，仍指向 `vitest.unit.config.ts`。
- 新增 `docs/testing.md`，说明完整 unit 和 Codex-safe unit 的适用环境。
- 未修改 sandbox / terminal 产品逻辑，未删除测试，未改 CI / release check，未操作 BiliDili。

## 新命令与排除清单

新增命令：

```bash
npm run test:unit:codex
```

排除的权限型测试：

- `test/unit/SandboxNetworkProxy.test.ts`：当前 Codex sandbox 无法稳定 `listen 127.0.0.1`。
- `test/unit/TerminalAdapter.test.ts`：当前 Codex sandbox 无法运行 macOS `sandbox-exec`。

完整命令保留证据：

- `test:unit`: `vitest run --config vitest.unit.config.ts`
- `test:unit:codex`: `vitest run --config vitest.unit.codex.config.ts`

## 验证命令与结果

- `npm run test:unit:codex`：通过，110 files / 1068 tests。
- `./node_modules/.bin/biome check package.json vitest.unit.codex.config.ts docs/testing.md`：通过。
- `npm run lint`：通过。
- `npm run check`：通过。
- `npm run build:check`：通过。
- `git diff --check`：通过。

## 仍保留项理由

- `npm run test:unit` 仍保留完整 unit suite；它包括 `SandboxNetworkProxy` 和 `TerminalAdapter`，需要在允许 `127.0.0.1` listen 和 `sandbox-exec` 的环境复跑。
- 本波只新增 Codex-safe baseline，不改变权限型测试的真实断言，也不把 release / CI 语义降级为 reduced baseline。

## 遗留风险与下一步建议

- 总控或用户后续需要完整 unit 证据时，应在 Codex 外或允许本机 listen / seatbelt 的环境运行 `npm run test:unit`。
- 若后续 Codex sandbox 权限模型变化，应复核两个排除文件是否可以重新纳入 `test:unit:codex`。
