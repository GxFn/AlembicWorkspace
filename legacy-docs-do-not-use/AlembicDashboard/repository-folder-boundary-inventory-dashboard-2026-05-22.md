# AlembicDashboard Repository Folder Boundary Inventory

日期：2026-05-22
窗口：AlembicDashboard
阶段：RFR-1 路径依赖清单
状态：已通过总控验收

## 完成范围

- 读取 `AlembicDashboard/AGENTS.md`，确认本窗口只做 Dashboard 前端路径依赖清单，不移动文件、不改源码 import、不删目录、不提交 workspace 文档。
- 扫描 Dashboard 根配置、Vite 入口、TypeScript/Tailwind/PostCSS 配置、`public/` 资产、`src/` 主要源码目录、API client、socket hooks、i18n、theme 和页面组件。
- 输出当前目录职责、路径依赖、禁止移动项、可迁移建议、后续最小验证矩阵。

## 当前目录职责

| 路径 | 职责 | 当前判断 |
| --- | --- | --- |
| `index.html` | Vite HTML 入口，直接加载 `/src/main.tsx`，并引用 `/logo.svg?v=codex-plugin`。 | 应保留在项目根；移动会影响 Vite 默认入口。 |
| `package.json` / `package-lock.json` | 前端包名、脚本、依赖复现契约。 | 应保留根目录；第三方依赖版本不属于本轮整理范围。 |
| `vite.config.ts` | Vite React 插件、dev server 代理、build chunk 拆分；依赖 `VITE_API_URL`、`/api`、`/socket.io`。 | 应保留根目录；后续迁移必须验证代理和 build。 |
| `tsconfig.json` | TypeScript 编译入口；`include` 仅包含 `src`，引用 `tsconfig.node.json`。 | 应保留根目录；若移动源码根必须同步更新 `include`。 |
| `tsconfig.node.json` | Vite config 的 TS 编译配置；`include` 仅包含 `vite.config.ts`。 | 应保留根目录。 |
| `tailwind.config.cjs` | Tailwind content 扫描 `./index.html` 与 `./src/**/*.{js,ts,jsx,tsx}`。 | 应保留根目录；若 feature-based 迁移仍在 `src` 内可不改。 |
| `postcss.config.cjs` | Tailwind PostCSS 插件配置。 | 应保留根目录。 |
| `.gitignore` | 忽略 `node_modules/`、`dist/`、`.vite/`。 | 应保留根目录；生成物不提交。 |
| `public/` | PWA/static assets：`logo.svg`、`manifest.json`、`service-worker.js`、`favicon.ico`。 | 应保留为 Vite public 目录；路径被 HTML、manifest、service worker 使用。 |
| `src/main.tsx` | React root entry，挂载 providers 和 `App`，引入 `src/index.css`。 | 应保留为源码入口；移动需同步 `index.html`。 |
| `src/App.tsx` | 顶层状态、路由 tab、页面组合、Modal/Drawer 协调、扫描/候选/知识等工作流入口。 | 当前最大聚合点；可作为后续拆分候选，但不应在 RFR-1 移动。 |
| `src/api.ts` | V3 REST/SSE API client、runtime boundary normalization、job/bootstrap/candidate/knowledge contracts。 | 禁止随意移动；大量页面和 hooks 依赖。 |
| `src/types.ts` | 前端 view model/API contract 类型。 | 禁止随意移动；应与 `src/api.ts` 保持邻近。 |
| `src/lib/` | `socket.ts` 和 `utils.ts`，提供 Socket.IO 单例和 className helper。 | 可保留；socket path 与后端 `/socket.io` 强绑定。 |
| `src/hooks/` | auth、permission、bootstrap socket、refine socket、chat stream/topics、drawer state。 | 应保留；如 feature-based 迁移，跨页面 hooks 仍应留在共享层。 |
| `src/i18n/` | I18n provider、locale resources、locale types；依赖 `/api/v1/ai/lang` 和 localStorage。 | 应保留；locale 文件不适合拆进单页面 feature。 |
| `src/theme/` | theme provider 与 localStorage theme 状态。 | 应保留共享层。 |
| `src/utils/` | 错误归一化、通知、source label、efficiency、evidence status 等前端通用工具。 | 应保留共享层。 |
| `src/constants/` | tabs、categories、icons、language options 等跨页面常量。 | 应保留共享层。 |
| `src/components/Layout/` | Sidebar/Header/Drawer/CommandPalette，负责全局布局和项目控制入口。 | 应保留布局层；Header 依赖 runtime boundary/project APIs。 |
| `src/components/Views/` | 页面级 View 集合：Candidates、Knowledge、Recipes、Jobs、Signals、Skills、Wiki、Panorama 等。 | 可作为后续 feature-based 迁移候选，但需要按页面逐步迁移。 |
| `src/components/Modals/` | Create/Search/RecipeEditor/LlmConfig modal。 | 可保留共享 modal 层；部分可跟随对应 feature，但需谨慎处理 `App.tsx` 状态。 |
| `src/components/Shared/` | Markdown、DrawerContent、GlobalChatDrawer、Pagination、CodeBlock 等共享组件。 | 应保留共享层。 |
| `src/components/ui/` | 基础 UI primitive wrappers。 | 应保留共享层。 |
| `src/components/Panels/` | AuditLogPanel、SignalMonitor 等嵌入式面板。 | 可保留；若迁移 Signal feature 时可一并评估。 |
| `src/components/Charts/` | TokenUsageChart。 | 可保留共享可视化层。 |
| `src/components/Skeletons/` | Loading skeletons。 | 应保留共享层。 |
| `dist/` | Vite build 输出。 | 生成物 / 禁止提交 / 不参与源码迁移。 |
| `.vite/` / `node_modules/` | 本地构建缓存与依赖安装目录。 | 生成物 / 禁止提交。 |

## 路径依赖清单

### Build / Config

- `package.json` scripts：
  - `dev` -> `vite`
  - `build` -> `tsc && vite build`
  - `preview` -> `vite preview`
- `index.html` 直接引用 `/src/main.tsx`；若源码入口迁移，必须同步修改。
- `tsconfig.json` 的 `include` 固定为 `src`，`references` 指向 `./tsconfig.node.json`。
- `tsconfig.node.json` 的 `include` 固定为 `vite.config.ts`。
- `tailwind.config.cjs` 的 content 固定扫描 `./index.html` 和 `./src/**/*.{js,ts,jsx,tsx}`。
- `vite.config.ts`：
  - 读取 `VITE_API_URL`，默认代理到 `http://127.0.0.1:3000`。
  - 代理 `/api`，并设置长 timeout。
  - 代理 `/socket.io` websocket。
  - `manualChunks` 对 `framer-motion`、`lucide-react`、`axios`、`yaml` 做 chunk 命名，其余 node_modules 进 `vendor`。

### Runtime / API / Socket

- `src/api.ts` 使用 `axios.create({ baseURL: '/api/v1' })`，并有多处 `fetch('/api/v1/...')` 与 `EventSource('/api/v1/...')`。
- `src/lib/socket.ts` 使用 `io(window.location.origin, { path: '/socket.io' })`，与 Vite proxy 和后端 realtime service 绑定。
- `src/hooks/useAuth.ts` / `src/hooks/usePermission.ts` 使用 `VITE_AUTH_ENABLED` 与 `/api/v1/auth/*`。
- `src/i18n/index.tsx` 读写 `/api/v1/ai/lang`，并用 localStorage 保存语言。
- `src/App.tsx` 使用 localStorage/sessionStorage 保存 project-scoped UI 状态：scan results、target、guard audit、自定义目录。

### Public Assets / PWA

- `index.html` 引用 `/logo.svg?v=codex-plugin`。
- `public/manifest.json` 引用 `/logo.svg`，并包含 `/candidates`、`/recipes`、`/rules` shortcut URL。
- `public/service-worker.js` 缓存 `/manifest.json`、`/logo.svg`，导航 fallback 到 `/index.html`，API fallback 只匹配 `/api/`。
- `public/favicon.ico` 作为静态 asset 保留。

### Source Import Shape

- 当前没有 `paths` alias；源码全部使用相对 import。
- `src/App.tsx` 对页面级 Views、Modals、Layout 集中相对 import，是后续 feature-based 迁移的主要 import 风险点。
- `src/components/Views/*` 大量使用 `../../api`、`../../types`、`../../i18n`、`../../utils/*` 和 `../Shared/*`，说明 `api/types/i18n/utils/shared/ui` 是事实共享层。
- `src/components/ui/*` 依赖 `../../lib/utils`，如果移动 `ui` 或 `lib`，会牵动所有 primitive。

## 分类判断

### 可迁移目录

- `src/components/Views/`：可作为后续 feature-based 迁移候选，例如逐步迁到 `src/features/<feature>/View.tsx`。建议一波只迁一个页面，并保留 re-export 过渡，先从低耦合页面如 `HelpView` 或 `JobsView` 试点。
- `src/components/Panels/`：若 Signal/observability feature 成熟，可跟随对应 feature 迁移。
- `src/components/Modals/`：可按消费方评估，但 `CreateModal`、`SearchModal`、`RecipeEditor` 当前由 `App.tsx` 顶层状态驱动，不建议先动。

### 应保留目录

- `src/api.ts`、`src/types.ts`：前端 contract 中心。
- `src/hooks/`、`src/i18n/`、`src/theme/`、`src/utils/`、`src/constants/`、`src/components/Shared/`、`src/components/ui/`、`src/components/Layout/`：共享层和全局体验层。
- 根配置文件：`package.json`、`package-lock.json`、`vite.config.ts`、`tsconfig*.json`、`tailwind.config.cjs`、`postcss.config.cjs`、`index.html`。

### 生成物 / 发布物目录

- `dist/`：Vite production build output，ignored，不提交。
- `.vite/`：Vite cache，ignored。
- `node_modules/`：依赖安装目录，ignored。

### 禁止移动目录 / 文件

- `public/`：Vite public root，manifest/service worker/html 均引用其中的根路径资产。
- `src/main.tsx`：HTML 入口引用路径固定。
- `vite.config.ts`：dev server proxy、websocket、chunk strategy 都是 Dashboard 运行边界。
- `src/api.ts` / `src/types.ts` / `src/lib/socket.ts`：后端 contract 与 realtime path 中心，不应在未建立 alias/re-export 前移动。

### 需要总控确认目录

- `src/components/Views/` 是否迁为 `src/features/`：建议等待 RFR-1 总控验收后再决定。Dashboard 当前结构可运行，迁移收益主要是降低 `App.tsx` 聚合度，不是功能阻塞。
- `src/App.tsx` 是否拆分 routing/state：这是内部架构优化，实际拆分会影响多页面状态、modal、scan/cache、bootstrap socket，必须另开单仓库波次。

## 建议目标层级

当前建议：RFR-2/RFR-3 不优先改 Dashboard。若总控后续要求 Dashboard 也做内部收敛，建议采用低风险渐进目标：

```text
src/
  app/
    App.tsx              # 后续从现有 App.tsx 拆出，保留全局 providers/routing/state
  api/
    client.ts            # 从 src/api.ts 迁移，需保留兼容 re-export
    types.ts             # 可从 src/types.ts 迁移或继续保持根级 contract
  features/
    jobs/
    knowledge/
    candidates/
    recipes/
    signals/
  components/
    layout/
    shared/
    ui/
  hooks/
  i18n/
  theme/
  utils/
  constants/
```

执行顺序建议：

1. 先建立 alias 或 re-export 兼容层，不立即修改所有 import。
2. 选择单个低耦合 View 试点迁移。
3. 跑 `npm run build`、UI smoke、`rg` import 残留扫描。
4. 再决定是否继续迁移更多 feature。

## 后续实际迁移最小验证矩阵

| 变更类型 | 最小验证 | 额外验证 |
| --- | --- | --- |
| 只移动单个 View | `npm run build`、`git diff --check`、针对旧路径 `rg` 残留扫描 | 浏览器打开对应 route，确认 loading/error/empty 状态。 |
| 移动 API client / types | `npm run build`、`rg "../../api|./api|../api"`、`rg "../../types|./types|../types"` | 后端真实 API smoke：项目列表、Knowledge、Candidates、Jobs。 |
| 移动 socket hooks / lib | `npm run build`、`rg "/socket.io|useBootstrapSocket|useRefineSocket|getSocket"` | Bootstrap/Refine realtime smoke。 |
| 移动 public assets / PWA | `npm run build`、检查 `dist` asset 引用 | 浏览器刷新、service worker unregister/register、manifest icon 检查。 |
| 拆分 `App.tsx` state/routing | `npm run build`、全 route smoke、`git diff --check` | 扫描、候选、知识、modal、project switch、bootstrap progress 回归。 |

## 验证命令

```bash
git status --short
rg --files -g '!*node_modules*' -g '!dist/**' -g '!coverage/**'
find . -maxdepth 3 -type d -not -path './node_modules*' -not -path './.git*' -not -path './dist*' | sort
rg -n "lib/|src/|dist/|\\.release|runtime|vendor/|plugins/alembic-codex|channels/codex|injectable-skills|templates|resources|dashboard|public/|/api|/socket\\.io|VITE_API_URL|\\.\\.\\/|\\.\\/" package.json tsconfig*.json vite.config.* tailwind.config.* postcss.config.* index.html public src
rg -n "from ['\\\"](\\.\\./|\\./)|import\\(['\\\"](\\.\\./|\\./)" src --glob '*.ts' --glob '*.tsx'
rg -n "VITE_|/api/v1|/socket\\.io|EventSource|fetch\\(|axios\\.|baseURL|sessionStorage|localStorage|service-worker|manifest\\.json|logo\\.svg|favicon\\.ico" src public vite.config.ts index.html
git diff --check
```

## 验证结果

- `git status --short`：Dashboard 仓库无源码改动；本轮只在 workspace `docs/AlembicDashboard/` 写清单。
- 文件/目录扫描：确认 Dashboard 主要目录为 `public/`、`src/components/*`、`src/hooks`、`src/i18n`、`src/lib`、`src/theme`、`src/utils`、`src/constants`，无 `lib/`、`bin/`、`config/`、`test/`、`scripts/` 产品目录。
- 路径依赖扫描：确认根配置、Vite proxy、`/api/v1`、`/socket.io`、`public` assets、相对 imports 为主要路径依赖。
- `git diff --check`：通过。

## 遗留风险

- `App.tsx` 是当前最大聚合点，后续若拆分 feature 或 route，需要专门验证 project-scoped cache、modal 状态、scan state、bootstrap socket 和 route sync。
- 当前没有 import alias；任何大规模目录移动都会产生大量相对 import churn。建议先建立兼容 re-export 或 alias，再做实际迁移。
- `public/service-worker.js` 对 `/index.html`、`/api/`、`/manifest.json`、`/logo.svg` 有硬编码路径；如移动 public assets，容易造成旧 bundle/cache 滞留。
- Dashboard 与后端 API contract 强绑定，目录整理不能替代后端 contract 变更；移动 `src/api.ts` 前必须保证消费方全部同步。

## 下一步建议

- RFR-2/RFR-3 优先处理 `AlembicPlugin` 和 `Alembic` 的路径表达；Dashboard 暂不建议进入实际目录移动。
- 若后续确实要优化 Dashboard 内部结构，建议单独开 Dashboard 波次，从低耦合 View 试点 feature-based 迁移，并先保留旧路径 re-export。
- 任何 Dashboard 实际迁移都至少运行 `npm run build`、对应旧路径残留扫描、`git diff --check`，涉及 UI 的再补浏览器 route smoke。
