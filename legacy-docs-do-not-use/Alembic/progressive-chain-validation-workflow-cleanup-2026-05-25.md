# Progressive Chain Validation Workflow Cleanup

日期：2026-05-25
窗口：`Alembic`
任务包：`PCVM-P1A-ALEMBIC-WORKFLOW-PCV-PATH-CLEANUP`
状态：待验收

## 完成范围

- 删除 `.github/workflows/ci.yml` 中 checkout `GxFn/progressive-chain-validation` 到 `Alembic/skills/progressive-chain-validation` 的步骤。
- 删除 `.github/workflows/release.yml` 中 checkout `GxFn/progressive-chain-validation` 到 `Alembic/skills/progressive-chain-validation` 的步骤。
- 未恢复 `.gitmodules` PCV 条目、未恢复 `skills/progressive-chain-validation` gitlink、未恢复内部 source fixture test。
- 未新增新的 PCV install / release 集成；如后续 workflow 需要 PCV，应走顶层 canonical source、release 或 install contract 的独立设计。

## 提交

- Alembic 提交：`92bd976162fb9c1dbc19da1f8afef8756c976c27`
- 提交信息：`ci: remove pcv workflow checkout`

## Workflow Path Ref 清理证据

```text
git diff -- .github/workflows/ci.yml .github/workflows/release.yml
```

结果：仅删除两个 workflow 中的 `Checkout progressive-chain-validation skill` 步骤，共 11 行。

```text
git grep -n -- "skills/progressive-chain-validation"
```

结果：无命中，命令返回 1 是预期的 no-match 结果。

```text
rg -n "skills/progressive-chain-validation|progressive-chain-validation|PCV" .github test package.json scripts README.md README_CN.md -S
```

结果：仅剩 `test/unit/SkillAdapter.test.ts:111` 的搜索 query 字符串。

```text
rg -n "progressive-chain-validation|PCV" . -S -g '!node_modules' -g '!dist' -g '!vendor'
```

结果：仅剩 `test/unit/SkillAdapter.test.ts:111`。

```text
git submodule status
```

结果：仅剩 `vendor/AlembicCore` 与 `vendor/AlembicDashboard`，PCV submodule 不再出现。

## 剩余 progressive-chain-validation / PCV 引用及保留理由

- `test/unit/SkillAdapter.test.ts:111`：保留。该字符串作为 `skill_search` query，用来断言默认不搜索 internal repository skills；它不是 `skills/progressive-chain-validation` path ref，也不会 checkout 或消费内部 source copy。

## 验证命令和结果

```text
git diff --check
```

结果：通过。

```text
node -e "const fs=require('node:fs'); const yaml=require('js-yaml'); for (const p of ['.github/workflows/ci.yml','.github/workflows/release.yml']) yaml.load(fs.readFileSync(p,'utf8')); console.log('workflow yaml ok');"
```

结果：通过，输出 `workflow yaml ok`。

```text
npm run release:package-guard
```

结果：通过；保留既有 dev lockfile warning：`../AlembicAgent` 与 `../AlembicCore` 是本地 workspace package entry，不应复制到 publish staging manifest。

```text
npm run test:unit -- SkillAdapter.test.ts
```

结果：通过，1 file / 6 tests passed。

```text
npm run lint
```

结果：通过，Checked 212 files。

```text
npm run lint:repo-boundary
```

结果：通过。

## Release / CI 行为影响

- CI / release 不再 checkout `GxFn/progressive-chain-validation` 到已删除的 `Alembic/skills/progressive-chain-validation` 内部路径。
- CI / release 仍保留 `Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard` checkout 和原有 Node / npm / package guard / test / publish 流程。
- 本轮不改变 npm publish staging、trusted publishing、Core / Agent / Dashboard checkout 或 release package boundary。

## 遗留风险

- 需要 `AlembicTest` 重跑最小 PCVM consumer cleanup probe，确认 Test-01 发现的 workflow path ref 残留已闭合。
- 顶层 PCV source commit `badbf0aa23bbaaff2cf185491a6785a61b74c1d8` 的远端同步风险沿用 Wave 0 记录；本轮不处理 PCV source 发布 / 同步。
- N9 baseline 仍处于 source shape + observability gap verdict 阶段，Agent 优化需等待 AlembicTest 重测通过后再启动。

## 下一步建议

- 由总控派 `AlembicTest` 重跑 `PCVM-P2-Canonical-Source-Baseline` 的最小 consumer cleanup probe。
- 若重测通过，再进入后续 N9 baseline / Agent 输入输出优化阶段。
- 若未来 release / CI 需要 PCV source，应新增显式顶层 source / release / install contract，而不是恢复内部 `skills/progressive-chain-validation` path。
