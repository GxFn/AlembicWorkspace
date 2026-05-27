# Alembic VS Code Extension Marketplace 发布准备

## 目标状态

让普通用户可以在 VS Code 的 Extensions 视图和 Web Marketplace 中搜索到 Alembic，安装后不需要全局安装 `alembic-ai`，即可通过 VS Code / Copilot Agent Mode 使用 Alembic MCP、Ghost 初始化、Bootstrap、Rescan、Dashboard 和 Guard 能力。

发布渠道分两层：

- Visual Studio Marketplace：官方 VS Code 扩展市场，VS Code 默认使用这里。发布后地址形如 `https://marketplace.visualstudio.com/items?itemName=<publisher>.alembic`。
- Open VSX Registry：开源 VS Code 生态市场，常被 VS Code forks、云 IDE、部分企业发行版使用。它不是 VS Code 默认市场，但对触达 Cursor / VSCodium / Eclipse Theia 类用户更有价值。

## 当前仓库状态

已经具备的基础：

- `resources/vscode-ext/package.json` 已有 extension manifest、命令、设置项、MCP provider contribution、README、LICENSE 和 `vsce` 脚本。
- 根目录已有脚本：
  - `npm run install:vscode-ext`
  - `npm run build:vscode-ext`
  - `npm run package:vscode-ext`
  - `npm run release:vscode-ext`
  - `npm run publish:vscode-ext`
  - `npm run publish:open-vsx`
- 拓展逻辑已接入 managed runtime、Ghost 初始化、daemon job、MCP provider。
- `.vscodeignore` 已排除 `src/`、`node_modules/`、`.vsix`、source map 等不需要进入 VSIX 的内容。

发布前仍需补齐：

- 确认最终 `publisher`。当前是 `"publisher": "alembic"`，这个 ID 需要在 Visual Studio Marketplace publisher 管理页真实创建并可用；publisher ID 一旦创建不可改。
- 增加 Marketplace 展示资产：`icon`、`galleryBanner`、`CHANGELOG.md`、`SUPPORT.md`，并完善 `homepage`、`bugs`、`qna`、`capabilities` 等 manifest 字段。
- 确认 `alembic-ai` npm runtime 的发布版本。拓展当前默认安装 `alembic-ai@0.1.0`，外部用户安装时会依赖 npm registry 上这个版本的完整可用性。
- 做跨平台冒烟测试：macOS、Windows、Linux；至少覆盖没有全局 `alembic`、但有 `npm` 的干净环境。
- 清理 packaging 输出目录。`tsc` 不会自动删除已移除源码对应的旧 `out/*.js`，正式打包前应先清空 `resources/vscode-ext/out` 再编译，避免历史文件被打进 VSIX。
- 准备发布密钥和 CI：`VSCE_PAT`、`OVSX_PAT` 只能放在本地密钥库或 CI secrets，不能进入仓库。

## Marketplace 账号准备

Visual Studio Marketplace：

1. 使用 Microsoft / Azure DevOps 账号创建 Personal Access Token。
2. PAT 需要选择 `All accessible organizations`，scope 需要 `Marketplace: Manage`。
3. 到 Marketplace publisher 管理页创建 publisher。
4. 创建时确定 publisher ID 和显示名。ID 会进入 extension URL，创建后不可修改。
5. 本地验证：

```bash
npx vsce login <publisher>
```

也可以不在本机保存登录状态，在 CI 里用：

```bash
npm run publish:vscode-ext -- -p "$VSCE_PAT"
```

Open VSX：

1. 创建 Eclipse 账号。
2. 登录 open-vsx.org 并签署 Publisher Agreement。
3. 生成 Open VSX access token。
4. 创建 namespace，namespace 必须等于 extension manifest 的 `publisher` 字段：

```bash
npx ovsx create-namespace <publisher> -p "$OVSX_PAT"
```

5. 发布 VSIX：

```bash
npm run publish:open-vsx -- -p "$OVSX_PAT"
```

## Manifest 准备清单

发布前建议把 `resources/vscode-ext/package.json` 补齐到下面状态。

必须确认：

- `name`: `alembic`。这是 extension name，和 publisher 一起组成 `<publisher>.alembic`。
- `displayName`: 建议保持 `Alembic`。
- `publisher`: 改成真实拥有的 Marketplace publisher ID。
- `version`: 首发建议从 `0.1.0` 或下一个明确版本开始；发布后每次都必须递增。
- `engines.vscode`: 当前 `^1.100.0`，需要确认 MCP provider API 在这个版本满足运行目标。
- `repository`: 当前指向 GitHub repo 和 `resources/vscode-ext`，保持。
- `license`: 当前 MIT，保持。

建议补齐：

```json
{
  "icon": "images/icon.png",
  "galleryBanner": {
    "color": "#0F172A",
    "theme": "dark"
  },
  "homepage": "https://github.com/GxFn/Alembic/tree/main/resources/vscode-ext#readme",
  "bugs": {
    "url": "https://github.com/GxFn/Alembic/issues"
  },
  "qna": false,
  "preview": true,
  "pricing": "Free",
  "categories": ["Machine Learning", "Linters", "Other"]
}
```

说明：

- 官方允许的 category 不包含 `AI`，Alembic 更接近 `Machine Learning` + `Linters` + `Other`。
- icon 必须是 PNG，至少 128x128，Retina 建议 256x256。
- README / CHANGELOG 里的远程图片必须是 HTTPS；SVG icon 和非受信 badge 可能被拒。
- 关键词最多 30 个；当前关键词数量安全。
- 如果短期想降低用户预期，可以首发保留 `"preview": true`，等 runtime 安装和跨平台验证稳定后移除。

## 内容与信任准备

Marketplace 页面会直接使用 extension 根目录下的 README。首发前 README 需要覆盖：

- 一句话定位：Alembic 是 project memory + Recipes + Guard + MCP for Copilot Agent Mode。
- 首次使用路径：安装拓展、初始化 Ghost、安装 managed runtime、在 Copilot Agent Mode 中启用 MCP。
- 系统依赖：当前 managed runtime 通过 `npm install` 安装，所以用户机器需要可执行的 `npm`。
- 数据边界：Ghost 数据写到用户本机 VS Code/global 或 Alembic Ghost 路径；说明是否写入项目目录。
- 网络边界：首次安装 managed runtime 时访问 npm registry；正常使用时 daemon/MCP 默认本地运行。
- 隐私边界：如果没有 telemetry，明确写 “Alembic VS Code extension does not collect telemetry”。如果未来加 telemetry，需要补隐私说明和关闭开关。
- Copilot 关系：拓展注册 MCP server，Copilot Agent Mode 可调用；不是 GitHub Copilot 官方内置功能，也不替代 Copilot 账号。
- 排错入口：MCP output、Alembic output channel、Dashboard、GitHub issues。

建议新增：

- `resources/vscode-ext/CHANGELOG.md`
- `resources/vscode-ext/SUPPORT.md`
- `resources/vscode-ext/images/icon.png`
- 可选：`resources/vscode-ext/images/demo-bootstrap.png` 或短 GIF，但需要注意 Marketplace 图片链接/体积和 HTTPS 规则。

## Runtime 发布依赖

VS Code 拓展本身不内置完整 Alembic runtime，而是按配置安装 npm 包：

- package: `alembic-ai`
- version: 当前默认 `0.1.0`
- install root: VS Code extension global storage
- command: `npm install --prefix <storage> alembic-ai@<version> --omit=dev --no-audit --no-fund`

因此 Marketplace 首发之前必须先确认 npm runtime：

- `alembic-ai@<version>` 已经公开发布。
- 包内包含 `dist/bin/cli.js`、`dist/bin/mcp-server.js`，且 `bin.alembic`、`bin.alembic-mcp` 正确。
- `alembic setup --profile=vscode-plugin --ghost --json` 在外部项目可跑通。
- `alembic daemon ensure --json` 能启动 daemon 并返回 dashboard URL。
- `alembic daemon bootstrap --json` 和 `alembic daemon rescan --json` 能返回 job id。
- macOS、Windows、Linux 的 Node/npm 环境都可安装，尤其关注 `better-sqlite3` 这类 native dependency 的预构建和 fallback 编译体验。

如果希望“安装拓展后完全不要求用户已有 npm”，需要另开实现：把 runtime 打进 VSIX，或提供平台特定 VSIX。当前实现仍依赖用户机器上可执行的 `npm`。

## 打包与验证流程

本地首发前建议走下面流程：

```bash
npm run typecheck
npm run lint -- --files-ignore-unknown=true
npm run build
npm run install:vscode-ext
rm -rf resources/vscode-ext/out
npm run build:vscode-ext
npm run package:vscode-ext -- --out /private/tmp/alembic-vscode-release/alembic-0.1.0.vsix
```

然后在干净 VS Code profile 里安装 VSIX：

```bash
code --user-data-dir /private/tmp/alembic-vscode-user \
  --extensions-dir /private/tmp/alembic-vscode-extensions \
  --install-extension /private/tmp/alembic-vscode-release/alembic-0.1.0.vsix
```

手动冒烟测试：

- Command Palette 能看到 Alembic 命令。
- `Alembic: Initialize Workspace (Ghost Mode)` 成功。
- 没有全局 `alembic` 时，`Alembic: Install Managed Runtime` 成功。
- `Alembic: Refresh MCP Server` 后，VS Code MCP server list 能看到 Alembic。
- Copilot Agent Mode 能看到 Alembic MCP tools。
- `Alembic: Bootstrap Project` 返回 job id。
- `Alembic: Rescan Project` 返回 job id。
- `Alembic: Open Dashboard` 打开本地 dashboard。
- 卸载拓展后不会破坏用户项目文件；Ghost 数据是否保留要在 README 中说明。

包内容检查：

```bash
npm --prefix resources/vscode-ext exec vsce ls
```

需要确认 VSIX 中不包含：

- `node_modules/`
- `src/`
- `*.map`
- 旧的 `out/codeLensProvider.js`、`out/directiveDetector.js`、`out/remoteCommandPoller.js`、`out/taskTool.js`
- `.vsix`
- secret、token、本地绝对路径、测试缓存

## 首次发布流程

Visual Studio Marketplace：

```bash
npm run release:vscode-ext
npm run publish:vscode-ext -- -p "$VSCE_PAT"
```

或先生成 VSIX，然后在 publisher 管理页手动上传：

```bash
npm run release:vscode-ext -- --out /private/tmp/alembic-vscode-release/alembic-0.1.0.vsix
```

Open VSX：

```bash
npx ovsx create-namespace <publisher> -p "$OVSX_PAT"
npm run publish:open-vsx -- -p "$OVSX_PAT"
```

发布后检查：

- Marketplace 页面能打开。
- VS Code Extensions 搜索 `Alembic`、`MCP`、`project memory` 能搜到。
- 安装数、版本号、README、icon、publisher、repository、license 显示正确。
- 在 Marketplace 页面点击安装能跳转 VS Code。
- Open VSX 页面 metadata 和 VS Code Marketplace 一致。

## CI 发布建议

建议后续加 GitHub Actions，而不是长期手工发布：

- PR 阶段：typecheck、lint、build、VSIX package、VSIX content audit。
- tag 阶段：发布 npm runtime，再发布 VS Code Marketplace，再发布 Open VSX。
- secrets：
  - `NPM_TOKEN`
  - `VSCE_PAT`
  - `OVSX_PAT`
- 发布顺序：
  1. publish `alembic-ai`
  2. smoke install `alembic-ai@version`
  3. update extension runtime pin if needed
  4. package VSIX
  5. publish Marketplace
  6. publish Open VSX

## 风险与决策点

- Publisher ID：`alembic` 可能已被占用，且 ID 不可改。需要尽早决定最终品牌 ID。
- Runtime 依赖 npm：这比“全局 npm install”优雅，但仍要求用户机器有 npm。若目标是零依赖安装，需要后续改为内置 runtime 或平台 VSIX。
- Native dependency：`better-sqlite3` 的安装体验决定 managed runtime 成败。发布前必须在 Windows 和 Linux 清洁环境验证。
- MCP API 版本：当前 `engines.vscode` 是 `^1.100.0`，要确认目标用户群的 VS Code 版本足够新；否则需降低能力或提供 fallback。
- Marketplace 分类：官方分类没有 `AI`，需要靠 display name、description、keywords 和 README 文案提升搜索可见性。
- Copilot 预期：Marketplace 发布只让用户能安装拓展；Copilot Agent Mode 是否可用还取决于用户 VS Code、Copilot 账号和 MCP 开关状态。

## 官方参考

- VS Code Publishing Extensions: https://code.visualstudio.com/api/working-with-extensions/publishing-extension
- VS Code Extension Manifest: https://code.visualstudio.com/api/references/extension-manifest
- VS Code MCP Developer Guide: https://code.visualstudio.com/api/extension-guides/ai/mcp
- Open VSX Publishing Extensions: https://github.com/eclipse-openvsx/openvsx/wiki/Publishing-Extensions
