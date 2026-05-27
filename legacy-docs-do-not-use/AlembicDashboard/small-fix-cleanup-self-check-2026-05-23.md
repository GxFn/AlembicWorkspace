# AlembicDashboard Small Fix / Cleanup Self-Check

更新日期：2026-05-23
窗口：`AlembicDashboard`
任务包：`SFC-P1`
状态：自检完成，待总控验收

## 窗口定位

当前窗口是 `AlembicDashboard` 执行窗口。

本轮仓库职责：只自检 Dashboard 前端 UI、API client、前端状态、路由、样式、可视化、构建脚本和前端测试边界中的小问题与清理候选。

明确不是什么：本轮不直接修复产品源码，不改 `Alembic` / `AlembicCore` / `AlembicAgent` / `AlembicPlugin` / `AlembicTest`，不移动目录，不删除兼容层，不跑真实项目链路，不把旧 Plugin 接入作为保留或删除理由。

## 完成范围

- 已读取 workspace `AGENTS.md`、`docs/workspace/index.md`、`docs/workspace/current/workspace-current-status.md`、`docs/workspace/current/small-fix-cleanup-self-check-plan-2026-05-23.md` 和 `AlembicDashboard/AGENTS.md`。
- 已检查 `package.json`、`vite.config.ts`、`tsconfig.json`、`src/api.ts`、`src/App.tsx`、`src/components/`、`src/hooks/`、`src/i18n/`、`src/utils/`、`public/` 和仓库根层配置。
- 已做负向扫描：旧 Dashboard / Plugin 源码路径残留、用户绝对路径、明显密钥、`catch (err: any)`、`as any`、`[object Object]`、测试文件和 README / docs 入口。
- 已运行轻量验证：`npm run build`、`git diff --check`、`git status --short --ignored` 和多组 `rg` 扫描。
- 本轮没有修改 Dashboard 产品源码，没有产生 Dashboard 新提交。

提交 hash：无新增提交。自检基线为 `AlembicDashboard` 当前 HEAD `502b078 Clarify host-managed dashboard AI boundary`。

## 发现的问题

| ID | 严重度 | 类型 | 现象 / 证据 | 影响范围 | 建议修复方式 |
| --- | --- | --- | --- | --- | --- |
| DASH-SFC-001 | 中 | 验证脚本 / 测试缺口 | `package.json:6-10` 只有 `dev`、`build`、`preview`；`AlembicDashboard/AGENTS.md:60-64` 要求新建项目后提供清晰的 build / lint / test / typecheck 脚本；`rg --files -g '!node_modules' -g '*test*' -g '*spec*'` 无源码测试文件。 | 后续 API client、状态管理和复杂 UI 改动缺少独立 lint / test / typecheck 入口；现在只能用 `npm run build` 兼做类型检查。 | 下一阶段补 `typecheck` 脚本；按 Alembic 系列偏好评估是否接入 Biome lint；优先为 API 归一化、错误格式化、host-managed boundary 和复杂状态组件补局部测试。 |
| DASH-SFC-002 | 中 | 仓库文档缺口 | `rg --files | rg '(^|/)README(\\.|$)|(^|/)readme'` 无输出；`rg --files -g '!node_modules' -g '!dist' | rg '(^|/)docs/'` 无输出。 | 独立前端仓库缺 repo-local README / docs，容易让新窗口误用旧 `Alembic/dashboard` 或误判 Dashboard 与 Core / Agent / Plugin 边界。 | 新增不含用户本机绝对路径的 `README.md`，写清 Dashboard-only 职责、常用命令、Vite proxy、API 边界、构建产物和禁止跨仓库修改事项。 |
| DASH-SFC-003 | 中 | 可观测性 / 控制台残留 | `src/components/Layout/Header.tsx:363-372` 在从 mock provider 切出时调用 `api.cleanupMockData()`，成功只 `console.log`，失败只 `console.error`；`rg -n "console\\.(log\\|warn\\|error)" src vite.config.ts --count-matches` 显示生产源码仍有多处 console。 | Mock cleanup 成败对用户不可见；失败路径没有 toast / 可恢复状态，生产 UI 可能留下调试输出。 | 将 mock cleanup 成败改为用户可见通知和可诊断错误信息，使用既有 `notify` / `getErrorMessage`；需要保留开发日志时放到明确 debug 分支。 |
| DASH-SFC-004 | 低 | 构建体积 / 性能观察 | `npm run build` 通过，但 Vite 提示 chunk 超过 `1500 kB`；输出中 `vendor-DXIWy98S.js` 为 `3,987.98 kB`，`du -sh dist/assets/*` 显示 vendor 约 `3.8M`；`vite.config.ts:60-72` 当前把未手动拆分的 node_modules 汇入 `vendor`。 | 不影响本轮构建，但 Dashboard 首屏和慢网络加载存在性能风险；Markdown / Mermaid / syntax highlight 相关依赖可能被过早加载。 | 下一阶段作为性能清理包评估 lazy import 或更细 manualChunks；修改后必须浏览器验证 Wiki、Chat、Recipe Markdown、Mermaid 和代码高亮路径。 |
| DASH-SFC-005 | 低 | 类型债 / API contract 清理候选 | `rg -n "\\bany\\b" src --count-matches` 命中 `src/` 多个文件，其中 `src/components/Shared/MarkdownWithHighlight.tsx` 23 处、`src/App.tsx` 9 处、`src/api.ts` 6 处；未发现实际 `as any` 和代码级 `catch (err: any)`。 | 目前 `strict` build 仍通过，但部分 API / Markdown / 关系数据依赖宽类型，后续 contract 收敛和回归测试定位成本较高。 | 不做一次性大重构；按业务路径分批替换为 `unknown` + 类型守卫、组件 props 类型和 API response view model。优先处理 `api.ts`、search / markdown 渲染和候选关系展示路径。 |

## 明确保留或暂不升级项

- `src/utils/sourceLabels.ts:24-38` 的 `ide-agent` / `ide-edit` / `agent` 兼容 source label 带 `compatibility: true`，属于历史数据展示兼容；本轮只记录，不建议直接删除。
- `src/api.ts:432-486` 和 `src/api.ts:890-950` 的 host-managed boundary 兼容字段仍服务 Dashboard 对 Codex host agent / local AI unavailable 的展示和错误归一化；不是旧外部 AI 残留。
- `src/api.ts` 中 `/api/v1/ai/*` 仍对应 Alembic 后端 internal AI / provider config / token usage / chat capability 展示；本轮没有足够证据建议删除。
- `vite.config.ts:6` 的 `127.0.0.1:3000` 是本地 dev proxy 默认值，不是用户私密绝对路径或密钥。

## 验证命令

| 命令 | 结果 |
| --- | --- |
| `git status --short` | 通过；Dashboard 工作区无未提交源码改动。 |
| `git status --short --ignored` | 通过；仅显示 ignored 的 `.DS_Store`、`dist/`、`node_modules/`。 |
| `git log -1 --oneline` | `502b078 Clarify host-managed dashboard AI boundary`。 |
| `npm run build` | 通过；`tsc && vite build` 成功，Vite 报 large chunk warning，见 DASH-SFC-004。 |
| `git diff --check` | 通过；无 whitespace error。 |
| `rg --files -g '!node_modules' -g '*test*' -g '*spec*'` | 无输出；确认源码测试入口缺失。 |
| `rg -n "catch \\([^)]*: any\\)" src` | 仅命中 `src/utils/error.ts` 注释示例，没有代码级 `catch (err: any)`。 |
| `rg -n "as any" src` | 无输出。 |
| `rg -n "\\[object Object\\]" src` | 无输出。 |
| `rg -n "dashboard/src\\|dashboard/public\\|AlembicPlugin/dashboard\\|旧 Plugin\\|old Plugin" src public package.json vite.config.ts` | 无输出；产品源码未发现旧 Dashboard / Plugin 路径残留。 |

## 未运行命令理由

- `npm run lint`：未运行，因为 `package.json` 没有 `lint` script；已作为 DASH-SFC-001 记录。
- `npm run test`：未运行，因为 `package.json` 没有 `test` script，源码也没有测试文件；已作为 DASH-SFC-001 记录。
- `npm run typecheck`：未运行，因为 `package.json` 没有独立 `typecheck` script；`npm run build` 已执行 `tsc`。
- `npm run preview` / 浏览器冒烟：未运行，因为本轮只做自检且不修产品源码；启动服务会扩大到运行环境验证，留给下一阶段修复包或总控验收。
- 真实项目 / BiliDili / 后端 live API：未运行，本轮明确不操作真实项目链路。

## 需要升级或用户确认的问题

- 当前没有必须立即升级给用户确认的边界问题。
- 是否在下一阶段引入 Biome lint、测试框架和 README 属于总控修复包决策；不需要改变 Dashboard 仓库职责边界。
- 如果总控决定处理 DASH-SFC-004 的包体问题，需要确认是只做 lazy import 小修，还是另开性能优化任务。

## 遗留风险

- 本轮只自检不修复，发现项仍未进入代码层面处理。
- `npm run build` 通过但存在 large chunk warning；若后续修改 Markdown / Mermaid / syntax highlighter 路径，需要浏览器截图或 smoke 验证。
- 缺少 lint / test 脚本意味着本轮无法给出 lint/test 质量结论。
- workspace 回填文档由总控统一提交；Dashboard 仓库本轮无新增提交。
