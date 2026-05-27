# 需求设计

日期：2026-05-18
状态：当前生效目录

## 目标

本目录用于保存工作空间级别的需求设计资产。它不承载具体 wave 派发，也不替代 `docs/workspace/` 的总控入口。

总控标准流程是：

1. 按用户需求在 `docs/requirement-designs/<需求名>/` 新建需求目录。
2. 先保存原始计划书 `original-plan-YYYY-MM-DD.md`，并与用户商量确认原始计划书。
3. 原始计划书确认前，不创建或激活需求设计文档、目标阶段确认或执行 wave。
4. 用户确认原始计划书后，再基于真实代码调研形成 `requirement-design-YYYY-MM-DD.md`，写清需求目标、实现方案和分阶段步骤。
5. 基于需求设计文档，按 `docs/goal-stage-confirmation/` 流程在 `docs/workspace/` 新建任务级最终目标与分阶段确认文档。
6. 用户确认目标阶段后，再在 `docs/workspace/` 新建或激活具体 wave 分派文档。

`docs/requirement-designs/` 不替代 `docs/workspace/` 的总控 wave 分派文档，也不替代各子仓库自己的执行记录。

所有需求都按完整功能模块处理。原始计划书必须先由用户确认，确认后才能进入代码调研、目标设计和阶段设计。需求设计文档必须写清用户场景、功能闭环、输入输出、状态变化、生产方、消费方、验证方式和完成定义；不明确时只记录确认问题，不进入派发。不得把抽象接口、空 adapter、空 provider 或无真实调用方的代码连接当作需求实现。

## 使用边界

- 跨仓库、跨阶段或会影响多个窗口的需求设计可以放在这里。
- 用户提出较大需求后，原始计划书必须先放在 `<需求名>/` 并等待用户确认；确认后，代码调研、真实能力盘点、差距分析、实现方案和阶段草案再放入同一需求目录。
- 长期路线图、里程碑、版本计划和验收框架如果不属于具体需求，应放在 `docs/workspace/` 的长期路线或契约文档中，不混入本目录。
- 当前正在执行的一波一阶段总控任务仍放在 `docs/workspace/`。
- 单仓库执行记录仍放在 `docs/AlembicCore/`、`docs/AlembicAgent/`、`docs/Alembic/`、`docs/AlembicPlugin/`、`docs/AlembicDashboard/` 或 `docs/BiliDili/`。

## 建议命名

```text
<requirement-slug>/README.md
<requirement-slug>/original-plan-YYYY-MM-DD.md
<requirement-slug>/requirement-design-YYYY-MM-DD.md
```

文档名使用小写 kebab-case。日期使用创建日 `YYYY-MM-DD`。

## 与总控文档关系

`docs/requirement-designs/` 保存需求级原始计划书和需求设计文档；`docs/goal-stage-confirmation/` 保存长期目标阶段确认流程；`templates/` 保存可复用模板；`docs/workspace/` 保存当前总控入口、具体目标阶段确认、阶段分派、验收和归档规则。若需求设计文档被拆成可执行 wave，应在 `docs/workspace/index.md` 挂载对应的当前总控文档。

## 当前需求

- [visible-automation-dispatch/](visible-automation-dispatch/)：当前主线候选，原始计划书已确认，需求设计和代码实现依赖调研已形成；目标是通过 Codex thread automation 把总控任务自动投递到目标可见 Codex 窗口，减少用户手动复制提示词，并支持默认关闭 / 离开时开启 / 普通输入关闭的自动化模式生产线。2026-05-26 已追加 unattended controller 需求设计，补 dispatch group、最后窗口回跳和总控 automation-goal 自我决策边界。
- [multi-root-project-scope/](multi-root-project-scope/)：当前活动需求，原始计划书已确认，代码实现依赖调研和需求设计已形成，等待任务级目标阶段确认。
- [alembic-multi-project-control-redesign/](alembic-multi-project-control-redesign/)：历史多项目控制需求，需求设计完成并作为本次 ProjectScope 设计的背景材料。

## 模板

- [../../codex-control-workspace/templates/requirement-design-template.md](../../codex-control-workspace/templates/requirement-design-template.md)：需求设计文档模板。
