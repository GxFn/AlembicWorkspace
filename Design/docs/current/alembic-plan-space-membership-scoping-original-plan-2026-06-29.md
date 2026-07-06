# alembic_plan / 冷启动 honor 原生 ProjectScope 项目空间配置 修复 — Original Plan

Date: 2026-06-29
Design Key: alembic-plan-space-membership-scoping-2026-06-29
Source Window: Design
Status: ready-for-intake

## 背景

为整体 Alembic 项目空间（workspace root `/Users/.../AlembicWorkspace`，ghost project `ecf32806`）做高质量冷启动时发现：`alembic_plan draft` 产出**污染** ProjectContext——`primaryLanguage=swift`（应 typescript）、`fileCount=5000`、`moduleCount=120`，顶层"模块"是 `Test`/`wakeflow-ledger`/`legacy-docs`/`Test/tmp/*BiliDili` Swift 副本等噪声，5 个真 Alembic TS 仓被淹没。codex 此前基于同一污染基座冷启动质量不足，根因即此。

经用户订正 + 真实代码核验：`workspace.config.json` 实为 **Wakeflow 控制器配置**（非 Alembic 空间清单）；**Alembic 有自己的原生项目空间配置 = ProjectScope**（`~/.asd/project-scopes.json` 经 `AlembicCore/src/shared/ProjectRegistry.ts`），且对本空间**早已完整存在**：`project-scope-a8083fdb335c`（projectId=ecf32806）声明了正好 5 个成员 folder（Alembic=primary-source，AlembicCore/AlembicPlugin/AlembicDashboard/AlembicAgent=source，创建 2026-05-24/25）。原生 scope 已被 daemon/resident/`HostProjectAlignment`/`ProjectScopeFolders.ts` 正常消费——**但承重的 cold-start/`alembic_plan` 扫描路径从不加载它**，转而裸根扫描或回落借读 Wakeflow 文件。

## 用户目标

新建需求修复：让 `alembic_plan draft` 及其下游 cold-start/bootstrap 生成所共享的 ProjectContext **加载并 honor 已存在的 Alembic 原生 ProjectScope**（5 成员 folder），从而扫描被 scope 到真实成员仓、排除噪声、语言正确识别为 typescript，在干净基座生成高质量 Recipe。**不新造空间概念、不填充已存在的原生 scope、不依赖 Wakeflow 的 workspace.config.json。**

## 范围

- 拥有：AlembicCore（承重扫描 honor 原生 ProjectScope）+ AlembicPlugin（`collectPlanProjectContext` 加载原生 scope + focusModules 接活）+ 下游 bootstrap/project-index full-mode 生成 scope + 双宿主（主体 in-process）parity + Wakeflow-config 回落降级。
- 不拥有：不新造/不填充空间配置（已存在）；不改单仓行为（无原生 scope 时维持现状）；不改 freeze；production floor 不放松。
- 跨仓：AlembicCore + AlembicPlugin（主）+ AlembicAgent/主体（parity）。

## 完成定义

见 [requirement design](alembic-plan-space-membership-scoping-2026-06-29.md)。核心：workspace root 重跑 `alembic_plan draft` → 经 ProjectRegistry 加载 `project-scope-a8083fdb335c` 的 5 成员 → `primaryLanguage=typescript`、顶层=5 成员仓、无噪声；下游生成同 scope；原生 scope 为 single source of truth（Wakeflow 文件降兜底）；两宿主一致；单仓不回归；门禁/freeze 不破。

## 阶段候选

P1（Core：承重扫描 honor 原生 ProjectScope + 单测）→ P2（Plugin：`collectPlanProjectContext` 加载原生 scope + focusModules + draft 重跑验收）→ P3（下游 bootstrap/full-mode 生成 scope + 双宿主 parity）→ P4（真实 Alembic 空间根重跑 draft+冷启动验证干净基座→高质量 Recipe）。真机直接真测（DeepSeek 生成 + 千问向量，rebuild 授权）。

## CG 决策（✅ 全部已决 2026-06-29，详见 requirement design §8）

- CG-1 = **原生 ProjectScope 为 single source of truth**（存在即默认 scope 成员；Wakeflow 文件降非托管根兜底）。
- CG-2 = 原生 scope 成员 allowlist 为主（.gitignore/黑名单兜底，F-5 可选）。
- CG-3 = **整条 cold-start 生成血统**（draft+bootstrap+project-index，用户确认）。
- CG-4 = focusModules 接活为可选收窄 override。
- CG-5 = **双宿主一并校验修复**（含 AlembicAgent/主体 in-process parity，用户确认）。

## 非目标

不新造/不填充空间配置；不改单仓行为；不依赖 Wakeflow workspace.config.json 作主路径；不改 freeze 值；production floor 不放松；不在只读快照"再验机制"（须真机重跑 draft+冷启动）；push/发版用户门。

## 详细设计

见 requirement design（strict）：症状证据 + 原生 ProjectScope 已存在+已填充证据（project-scopes.json/ProjectRegistry file:line）+ 承重路径不加载缺口 + 修复分层 F-1~F-5 + 分阶段验收 + CG + 非回归风险 + 误建 workspace 清理小注。
