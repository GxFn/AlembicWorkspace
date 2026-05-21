# AlembicCore 0.2.0 Version Unification

状态：已完成
窗口：AlembicCore
日期：2026-05-22
对应总控计划：`docs/workspace/alembic-0-2-0-version-unification-workspace-plan-2026-05-22.md`
提交 hash：`f30beacedf89abab13b91e87e4686d0db38e7d29`

## 完成范围

- 将 `@alembic/core` 源 package version 从 `0.1.0` 更新为 `0.2.0`。
- 同步 `package-lock.json` 顶层版本和 root package version 到 `0.2.0`。
- 更新 `RuntimeContracts` 中与 runtime health version 口径绑定的测试断言到 `0.2.0`。
- 未修改第三方依赖版本、Node engine、历史文档或构建产物。

## 文件变化

- `package.json`
- `package-lock.json`
- `test/RuntimeContracts.test.ts`

## 验证命令与结果

```bash
npm run build:check
npm run test
npm run build
rg -n '"version": "0\\.1\\.0"|@alembic/core.*0\\.1\\.0' package.json package-lock.json src test scripts
npm run lint -- package.json package-lock.json test/RuntimeContracts.test.ts
git diff --check
```

结果：

- `npm run build:check` 通过。
- `npm run test` 通过：63 个测试文件，943 tests passed。
- `npm run build` 通过。
- 目标残留扫描无命中。
- `npm run lint -- package.json package-lock.json test/RuntimeContracts.test.ts` 通过。
- `git diff --check` 通过。
- `npm run test` 期间仍打印既有提示 `error: Could not access 'HEAD'`，但命令退出码为 0，未阻塞本次提交。

## 残留说明

- `RELEASE-PLAYBOOK.md` 中仍有 `v0.1.0`，但它是 tag 格式示例 `v<package.version>` 的示例文本，不是当前版本源、manifest、runtime artifact 或测试断言，本轮未修改。
- 未扫描或修改 `dist/`，因为 Core 规则明确 `dist/` 是 ignored 构建产物，不提交。

## 遗留风险

- `Alembic` publish staging 仍需等待 V020-1 上游统一结果经总控验收后再重新生成。
- `AlembicPlugin` runtime / channel 仍需等 Core `0.2.0` 提交被下游消费后再重新生成，不能提前生成旧版本 embedded Core snapshot。
- `AlembicAgent` 回填中提到的 `../AlembicCore` lockfile snapshot 残留，需要在 Core `0.2.0` 完成后由 Agent 或总控安排二次刷新。

## 下一步建议

- 总控复核 `AlembicCore`、`AlembicAgent`、`AlembicDashboard` 的 V020-1 回填后，再启动 `Alembic` V020-2。
- `AlembicPlugin` 可在 Core `0.2.0` 回填后准备 V020-3，但 runtime 生成仍应按总控依赖顺序执行，避免与 release staging 口径错位。
