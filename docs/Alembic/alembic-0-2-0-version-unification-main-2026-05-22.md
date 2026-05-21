# Alembic 0.2.0 Version Unification Main Execution

日期：2026-05-22
执行窗口：Alembic
对应总控计划：`docs/workspace/alembic-0-2-0-version-unification-workspace-plan-2026-05-22.md`
阶段：V020-2
状态：已完成

## 完成范围

- 将 Alembic 主仓库 `alembic-ai` 源 manifest 版本从 `0.1.0` 更新为 `0.2.0`。
- 将 `package-lock.json` 中 root `alembic-ai`、本地 `../AlembicAgent`、本地 `../AlembicCore` snapshot 版本统一为 `0.2.0`。
- 重新生成 `.release/alembic-ai` publish staging；staging manifest 为 `alembic-ai@0.2.0`，registry dependency replacement 为 `@alembic/core@0.2.0`、`@alembic/agent@0.2.0`。
- 确认 `.release/alembic-ai/alembic-release-source.json` 记录 `AlembicDashboard` package version 为 `0.2.0`。
- 修正 `scripts/verify-release-package-boundary.mjs` 的边界判断：root 开发 manifest 继续允许 workspace-local `file:../AlembicCore` / `file:../AlembicAgent`，发布失败条件改为检查 `.release/alembic-ai` staging manifest 与 release source metadata，避免把开发态入口误判为发布产物。

## 提交 Hash

- Alembic：`1656c67484b99bf9326af34102e936f18073b9aa`

## 验证命令

- `npm run build:check`
- `npm run build`
- `npm run release:staging:prepare`
- `npm run release:staging:pack`
- `npm run release:package-guard`
- `rg -n '"version": "0\\.1\\.0"|@alembic/(core|agent).*0\\.1\\.0|alembic-ai.*0\\.1\\.0' package.json package-lock.json .release/alembic-ai/package.json .release/alembic-ai/alembic-release-source.json lib bin scripts test`
- `node -e 'const fs=require("fs"); const manifests=["package.json",".release/alembic-ai/package.json"]; const metadata=".release/alembic-ai/alembic-release-source.json"; const failures=[]; for (const p of manifests) { const j=JSON.parse(fs.readFileSync(p,"utf8")); if ((j.name==="alembic-ai"||j.name?.startsWith("@alembic/")) && j.version==="0.1.0") failures.push(p); for (const [name,spec] of Object.entries(j.dependencies||{})) if ((name==="@alembic/core"||name==="@alembic/agent") && spec==="0.1.0") failures.push(p+" dependencies."+name); } const m=JSON.parse(fs.readFileSync(metadata,"utf8")); if (m.packageVersion==="0.1.0") failures.push(metadata+" packageVersion"); for (const [name,spec] of Object.entries(m.registryDependencies||{})) if ((name==="@alembic/core"||name==="@alembic/agent") && spec==="0.1.0") failures.push(metadata+" registryDependencies."+name); for (const [sourceName,source] of Object.entries(m.sources||{})) if (source?.packageVersion==="0.1.0" && ["AlembicCore","AlembicAgent","AlembicDashboard"].includes(sourceName)) failures.push(metadata+" sources."+sourceName); if (failures.length) { console.error(failures.join("\n")); process.exit(1); } console.log("No Alembic-owned 0.1.0 version remnants in current manifests/staging metadata.");'`
- `git diff --check`

## 验证结果

- `npm run build:check`：通过。
- `npm run build`：通过。
- `npm run release:staging:prepare`：通过；输出 `@alembic/core: 0.2.0`、`@alembic/agent: 0.2.0`，Core source 为 `f30beacedf89abab13b91e87e4686d0db38e7d29`，Agent source 为 `9de2cd97c3f4962a8b19595b76eeb7df00f853f5`。
- `npm run release:staging:pack`：通过；dry-run 产物为 `alembic-ai-0.2.0.tgz`。
- `npm run release:package-guard`：通过；保留两条开发态 lockfile workspace entry warning，原因是 root 开发态继续使用本地源码，staging manifest 不复制这些 lockfile entry。
- 计划中的 `rg` 负向扫描：仅剩 `package-lock.json` 内第三方 `powershell-utils@0.1.0` 命中，不属于 Alembic 自有版本位。
- Alembic 自有 manifest / staging metadata 专项扫描：通过，无 Alembic 自有 `0.1.0` 残留。
- `git diff --check`：通过。
- 提交后再次运行 `npm run release:staging:prepare` 并读取 metadata：`sources.Alembic.commit` 为 `1656c67484b99bf9326af34102e936f18073b9aa`，`dirty=false`；Core / Agent / Dashboard package version 均为 `0.2.0`。

## 遗留风险

- `.release/` 是 Alembic 仓库忽略目录，本轮作为本地 publish staging 证据生成与验证，不作为源码提交内容。发布前需要按发布流程重新生成 staging。
- `package-lock.json` 中第三方依赖 `powershell-utils@0.1.0` 属于外部依赖版本，不在本轮自有版本统一范围内。

## 下一步建议

- 等待 `AlembicPlugin` 完成 V020-3：Codex plugin root / manifest / channel / runtime / MCP metadata / cache sync fallback 统一到 `0.2.0`。
- 总控 V020-4 验收时重新运行 Alembic publish staging prepare / pack，并刷新本机 Codex plugin cache 到 `alembic-codex@0.2.0`。
