# AlembicAgent 0.2.0 Version Unification

状态：已完成，待总控验收
执行窗口：AlembicAgent
执行日期：2026-05-22
关联计划：`docs/workspace/alembic-0-2-0-version-unification-workspace-plan-2026-05-22.md`

## 完成范围

- 将 `@alembic/agent` 自有 package version 从 `0.1.0` 更新为 `0.2.0`。
- 同步 `package-lock.json` root version 与 root package entry version 到 `0.2.0`。
- 保持 `@alembic/core` 依赖为 `file:../AlembicCore`，未修改相邻 Core 仓库或第三方依赖版本。
- 只修改并提交 `AlembicAgent` 仓库内 `package.json` 与 `package-lock.json`。

## 提交

- AlembicAgent 提交 hash：`39b2ab3`
- 提交信息：`Bump agent package version to 0.2.0`

## 验证命令

```text
npm run build
npm run test
rg -n '"version": "0\\.1\\.0"|@alembic/agent.*0\\.1\\.0|@alembic/core.*0\\.1\\.0' package.json package-lock.json src test scripts
git diff --check
alembic_guard files package.json package-lock.json
```

## 验证结果

- `npm run build` 通过。
- `npm run test` 通过：19 个测试文件 / 87 个测试用例全部通过。
- `git diff --check` 通过。
- 残留扫描仍命中 `package-lock.json:30` 的 `../AlembicCore` package snapshot version `0.1.0`；这是相邻 `AlembicCore/package.json` 当前真实版本读取结果，本窗口只读 Core，不伪造上游版本。
- `alembic_guard` 未能运行：当前 `AlembicAgent` 项目没有可用 Alembic knowledge base，工具返回 `CODEX_ALEMBIC_KNOWLEDGE_REQUIRED`。

## 残留扫描结果

```text
package-lock.json:30:      "version": "0.1.0",
```

解释：该命中属于 lockfile 的 `../AlembicCore` snapshot，当前只读检查到相邻 `AlembicCore/package.json` 仍为 `@alembic/core@0.1.0`。等待 Core 窗口完成 V020-1 后，Agent lockfile 需要由总控或 Agent 窗口按新的 Core 版本二次刷新。

## 遗留风险

- `package-lock.json` 中 `../AlembicCore` snapshot 仍为 `0.1.0`，阻塞最终“无 Alembic 自有 0.1.x 残留”验收。
- 未运行 `npm run check`，本轮只按计划执行 package version 级构建、全量测试、残留扫描和 whitespace 检查。
- Alembic project knowledge / Guard 不可用，合规检查只能记录工具不可用原因。

## 下一步建议

- 等 `AlembicCore` V020-1 完成后刷新 AlembicAgent lockfile 中的 `../AlembicCore` snapshot 到 `0.2.0`。
- 总控在 Core / Agent / Dashboard 三个上游均待验收后启动 `Alembic` V020-2，确保 publish staging 读取到上游 `0.2.0`。
- `AlembicPlugin` 继续等待 Core 版本完成后再生成 Codex runtime，避免 embedded Core snapshot 仍带旧版本。

## V020-1R 返工完成

状态：已完成，待总控验收

### 完成范围

- 在 `AlembicCore` 已完成 `@alembic/core@0.2.0` 后，刷新 `package-lock.json` 中 `packages["../AlembicCore"].version`。
- `@alembic/agent` root package、root lock、`../AlembicCore` lockfile snapshot 均为 `0.2.0`。
- 未修改 `package.json` dependency spec，继续保持 `@alembic/core` 为 `file:../AlembicCore`。
- 未修改第三方依赖版本，未修改其它 Alembic 仓库。

### 提交

- AlembicAgent 返工提交 hash：`9de2cd9`
- 提交信息：`Refresh core snapshot version in agent lockfile`

### 验证命令

```text
node -e "const l=require('./package-lock.json'); console.log(l.packages['../AlembicCore']?.version)"
rg -n '"version": "0\\.1\\.0"|@alembic/agent.*0\\.1\\.0|@alembic/core.*0\\.1\\.0' package.json package-lock.json src test scripts
npm run build
npm run test
git diff --check
```

### 验证结果

- Core snapshot 读取结果为 `0.2.0`。
- 目标残留扫描无命中。
- `npm run build` 通过。
- `npm run test` 通过：19 个测试文件 / 87 个测试用例全部通过。
- `git diff --check` 通过。

### 残留扫描结果

```text
无命中
```

### 遗留风险

- 本窗口只刷新 AlembicAgent lockfile；`Alembic` publish staging、`AlembicPlugin` Codex runtime / channel / cache 仍需下游阶段重新生成并验证。
- Alembic project knowledge / Guard 仍不可用：`alembic_task prime` 返回 `CODEX_ALEMBIC_KNOWLEDGE_REQUIRED`。

### 下一步建议

- 总控复核 `9de2cd9` 后，可解除 V020-2 / V020-3 对 Agent lockfile 残留的阻塞。
- `Alembic` V020-2 应读取 Core / Agent / Dashboard 当前 `0.2.0` 版本生成 publish staging。
- `AlembicPlugin` V020-3 应重新生成 Codex runtime，确认 embedded Core snapshot 和 plugin/channel version 都为 `0.2.0`。
