# Repository Folder Boundary Restructure Original Plan

创建日期：2026-05-22
状态：用户已确认按总控建议启动
来源：用户希望在主线功能链路相对稳定后，重新调整各仓库文件夹层级关系，并强调不能因为调整导致功能缺失。

## 用户目标

在 Alembic 主线能力相对稳定后，重新整理 `Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin` 等仓库的目录层级，让目录结构更准确表达真实职责边界、交付产物和生成物关系。

## 总控原始理解

这不是一次普通“清理文件夹”，而是一次边界固化工程。目标是让仓库目录与当前产品边界一致：

- `AlembicPlugin` 是 Codex host agent 入口，不应继续因为历史镜像结构显得像本地增强底座。
- `Alembic` 是本地常驻服务与增强底座，承载 CLI、daemon、HTTP/API、Dashboard server、ProjectRegistry、JobStore、internal AI jobs 和 release staging。
- `AlembicCore` 是共享、确定性、可复用的 headless 内核。
- `AlembicAgent` 是 agent runtime、AI provider、tool system、prompt、memory 和执行循环。
- `AlembicDashboard` 是前端应用。
- `AlembicWorkspace` 只做总控文档、计划、验收、模板和跨窗口协作。

## 原始范围

进入范围：

- 各仓库源码目录、测试目录、脚本目录、生成产物目录、release/runtime/channel/skill/template 目录的边界梳理。
- package manifest、tsconfig、build/lint/test/release 脚本中对路径的硬编码清单。
- 迁移顺序、每波验证命令和禁止事项。
- 需要保留的兼容路径、生成物路径和发布路径。

暂不进入范围：

- 不在第一波直接移动源码目录。
- 不删除 CLI、daemon、HTTP/API、Dashboard server、Codex MCP、Skill、channel、release、本地增强底座或平台适配能力。
- 不把 `AlembicPlugin` 的 Codex-facing 能力下沉到 `Alembic`，也不把 `Alembic` resident service 搬进 Plugin。
- 不改真实测试项目源码。
- 不以“结构更干净”为理由削减功能、删除 fallback、改变用户可见 API 或跳过 release/runtime 验证。

## 初始阶段候选

1. RFR-0：总控建立需求、真实代码路径依赖调研和第一波分派计划。
2. RFR-1：各仓库窗口只做路径依赖清单和目标层级建议，不搬文件。
3. RFR-2：优先整理 `AlembicPlugin`，收紧 Codex-facing 源码、plugin shell、channel、runtime artifact 和 cache scripts 的边界表达。
4. RFR-3：整理 `Alembic`，收紧本地增强底座、daemon、HTTP/API、Dashboard server、release staging 和资源目录表达。
5. RFR-4：根据 RFR-1 结果决定是否整理 `AlembicCore` / `AlembicAgent` / `AlembicDashboard` 的内部层级。
6. RFR-5：完成跨仓库 build/test/release/runtime/cache 验证，必要时再创建 AlembicTest 测试单。

## 完成定义

- 每个被调整仓库都保留原有用户可见入口、命令、package exports、release/runtime 产物和测试入口。
- 所有目录移动都有真实调用方、替代路径、更新后的脚本和验证证据。
- 每波变更后都有 import 扫描、build/check/lint/test 或 release/runtime targeted 验证。
- 总控文档记录哪些目录进入迁移、哪些目录保留、哪些目录不得删除、哪些窗口观察或无任务。

## 用户确认

用户已在 2026-05-22 确认：“可以按照你的建议修改，但是要注意保证功能完整性，不都为了调整导致功能缺失，开始执行分配计划吧。”
