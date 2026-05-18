# AlembicCore Release Package Baseline

日期：2026-05-18

状态：已完成

执行窗口：`AlembicCore`

## 目标

建立 `@alembic/core` 的 package release baseline，供 `AlembicAgent`、`Alembic` 和 `AlembicPlugin` 的发布依赖收口使用。

本轮只处理 Core 自身，不改动任何下游仓库。

## 基线结论

- 当前发布包名：`@alembic/core`
- 当前版本：`0.1.0`
- 当前 source commit：`abcf84f27d23cae0fbefbb4d7a327f5aae7f1caf`
- Core package 不依赖 workspace sibling package，没有 `file:../...` 发布泄漏。
- Core 是下游发布链路的第一发布包：Agent / Alembic / AlembicPlugin 的 publish-ready 结论必须依赖这个包的 registry version 或明确的 publish staging manifest。
- Core `dist/` 仍是构建产物，不提交；发布包通过 `npm run build` 生成 `dist/` 后再由 release guard 验证。

## 代码变更

新增 `scripts/check-release-readiness.mjs`，并接入 `package.json` 和 CI。

检查范围：

- `package.json` 必须是 `@alembic/core`，版本必须是 semver-like。
- `dependencies`、`optionalDependencies`、`peerDependencies`、`devDependencies` 不得包含 `file:../...` 或 `link:../...`。
- `package-lock.json` 不得包含 `file:../...`。
- 所有 exact exports 的 `types` / `import` target 必须指向 `dist/`，对应文件必须存在，并且必须进入 npm pack 输出。
- npm pack 输出必须包含 `package.json`、`README.md`、`config/public-api-boundary.json`、`dist/index.js`、`dist/index.d.ts`、grammar resource 和 public API / release guard 脚本。
- guard 会读取 git `HEAD` 并输出 source commit，作为 release / portable snapshot 的源提交记录。
- guard 内部为 `npm pack --dry-run --json` 使用临时 npm cache，避免本机 npm cache 权限状态影响 package 验证。

CI 变化：

- `.github/workflows/ci.yml` 的最终 package 检查由裸 `npm pack --dry-run` 改为 `npm run release:check`。
- `release:check` 内部仍执行 npm pack dry run，并额外验证 package baseline。

## Package 内容证据

`npm run release:check` 结果：

```text
Core release readiness OK: @alembic/core@0.1.0.
Source commit: abcf84f27d23cae0fbefbb4d7a327f5aae7f1caf.
Pack file: alembic-core-0.1.0.tgz; entries=716; unpackedSize=22477521.
Working tree dirty: no.
```

Public API boundary：

```text
Public API boundary OK: 136 package exports classified.
Exact exports: 75; wildcard exports: 61.
Status summary: stable=17, provisional=21, transitional=98.
```

Public API smoke：

```text
Imported 75 exact public API entrypoints.
```

## 验证命令

- `npm run build:check`
- `npm run check`
- `npm run build`
- `npm run smoke:public-api`
- `npm run release:check`
- `npm --cache <writable-temp-cache> pack --dry-run --json`
- `node --check scripts/check-release-readiness.mjs`

## 验证结果

- `npm run build:check`：通过。
- `npm run check`：通过；60 test files / 919 tests；仍有既有测试输出 `error: Could not access 'HEAD'` 和 `[TestMode] bootstrap dimension filter: arch (1/2)`，未导致失败。
- `npm run build`：通过。
- `npm run smoke:public-api`：通过，75 exact public API entrypoints imported。
- `npm run release:check`：通过，pack entries 716，source commit 为 `abcf84f27d23cae0fbefbb4d7a327f5aae7f1caf`，working tree dirty 为 `no`。
- `npm --cache <writable-temp-cache> pack --dry-run --json`：通过，pack entries 716，包含新增 release readiness 脚本。
- `node --check scripts/check-release-readiness.mjs`：通过。

## 遗留风险

- Core 已具备 package baseline，但还没有实际 npm publish workflow；下游只能把本提交作为 publish-ready baseline，不能假设 registry 上已经存在对应版本。
- `@alembic/core@0.1.0` 版本尚未提升；如果下游要解除 publish hard gate，需要先决定 Core registry 发布节奏和版本号。
- 现有 wildcard exports 仍是 transitional/internal migration surface，不能作为下游新增长期依赖的优先入口。

## 下一步建议

1. `AlembicAgent` 可以基于 Core commit `abcf84f27d23cae0fbefbb4d7a327f5aae7f1caf` 继续保留 hard gate，或进入 publish staging manifest 设计。
2. `Alembic` 和 `AlembicPlugin` 的 release guard 应明确：日常开发继续 `file:../...`，root npm publish 不能泄漏 sibling path。
3. `AlembicPlugin` portable runtime 继续允许 `file:vendor/AlembicCore`，但必须记录 Core source commit，并验证 `.alembic-source.json`。
4. 真正 release 前，先发布或明确模拟发布 `@alembic/core`，再处理 `@alembic/agent`，最后处理外层 `alembic-ai` 包名归属。
