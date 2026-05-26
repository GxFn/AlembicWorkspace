# Progressive Chain Validation Consumer Cleanup

日期：2026-05-25
窗口：`Alembic`
任务包：`PCVM-P1-ALEMBIC-SUBMODULE-REMOVAL`
状态：待验收

## 完成范围

- 删除 `skills/progressive-chain-validation` gitlink，不再让 `Alembic` 主仓库保留 PCV source checkout。
- 从 `.gitmodules` 删除 `skills/progressive-chain-validation` submodule 条目；当前 `.gitmodules` 只保留 `vendor/AlembicCore` 与 `vendor/AlembicDashboard`。
- 删除 `test/unit/progressive-chain-validation-skill.test.ts`，移除对内部 PCV source copy 的 fixture / contract 断言。
- 保留 `injectable-skills`、runtime skill infrastructure、ProjectScope skill 逻辑和其它 skill 目录；未改顶层 PCV source、AlembicPlugin、AlembicAgent 或 AlembicTest。

## 提交

- Alembic 提交：`d99d66d0af14fe6e8a51e683d963028ec9d0679a`
- 提交信息：`chore: remove internal pcv submodule`

## git submodule status / 引用清理证据

```text
git submodule status
```

结果：仅剩两个 vendor submodule，PCV 不再出现。

```text
e58234c6c587b07e73239ae975b821698d8524ae vendor/AlembicCore (heads/main-31-ge58234c)
d25624d6545fc7218f9115e732ba72291c7bd960 vendor/AlembicDashboard (heads/main-10-gd25624d)
```

```text
git config --get-regexp '^submodule\.'
```

结果：本地 git config 只剩 `vendor/AlembicCore` 与 `vendor/AlembicDashboard` submodule 配置，无 PCV submodule 配置。

```text
rg -n "skills/progressive-chain-validation" .
```

结果：无命中，命令返回 1 是预期的 no-match 结果。

```text
rg -n "progressive-chain-validation|PCV" .
```

结果：只剩 `test/unit/SkillAdapter.test.ts` 中的搜索 query 字符串，用来断言默认不搜索 internal repository skills；它不是内部 source checkout 路径或运行 / 测试依赖。

## 验证命令和结果

```text
git diff --check
```

结果：通过。

```text
npm run test:unit -- SkillAdapter.test.ts
```

结果：通过，1 file / 6 tests passed。

```text
npm run typecheck
```

结果：通过。

```text
npm run lint
```

结果：通过，Checked 212 files。

```text
npm run lint:repo-boundary
```

结果：通过。

```text
npm run release:package-guard
```

结果：通过；保留既有 dev lockfile warning：`../AlembicAgent` 与 `../AlembicCore` 是本地 workspace package entry，不应复制到 publish staging manifest。

```text
npm run lint:consumer-core-imports
```

结果：通过，scanned 369 files and 451 `@alembic/core` imports。

```text
npm run lint:agent-extraction-boundary
```

结果：通过。

## 是否仍保留外部 PCV source / release / 文档引用

- `Alembic` 主仓库不再保留内部 PCV source checkout。
- 当前未新增 release / install copy，也未把 PCV source 重新放进 package builtin skill exports。
- 若后续 Alembic 需要测试或消费 PCV availability，应消费顶层 canonical source、release / install artifact 或总控指定 contract，不应恢复内部 divergent copy。

## 遗留风险

- `AlembicPlugin` 的 `PCVM-P1-PLUGIN-SUBMODULE-REMOVAL` 仍需独立完成；两边都完成后才能进入 AlembicTest 的 PCVM Test-01。
- 顶层 PCV source commit `badbf0aa23bbaaff2cf185491a6785a61b74c1d8` 在总控文档中记录为 `ahead 1`，发布 / 跨机消费前仍需同步远端。
- 当前只是 consumer cleanup，不验证 N9 baseline 或 Agent 优化质量；这应由后续 AlembicTest / AlembicAgent 阶段承担。

## 下一步建议

- 等 `AlembicPlugin` 完成同类 submodule cleanup 后，由总控创建 PCVM Test-01。
- AlembicTest Test-01 应验证两边 consumer 不再依赖内部 PCV checkout，并确认默认 PCV 使用规则、N9 baseline 字段和 observability gap verdict。
- 后续若需要把 PCV 暴露给安装体验，应走 release / install contract，而不是恢复 `skills/progressive-chain-validation` submodule。
