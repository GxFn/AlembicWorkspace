# Recipe 生命周期架构重构 完成后真实校验 + 残留修复矫正 follow-up — Original Plan

Date: 2026-06-28
Design Key: alembic-recipe-lifecycle-refactor-residual-followup-2026-06-28
Source Window: Design
Status: ready-for-intake

## 背景

架构重构 [[alembic-recipe-lifecycle-naming-layering-refactor]] 已 COMPLETE+ARCHIVED（rev 272，71 task 全 accepted）且已 push（四仓 HEAD==origin）。用户要求对真实代码 vs 需求校验、产残留修复需求。3-agent post-completion 审计：**核心高度成功（全 frozen 决策+6 不变量在 codex P1-P15 大量 repair churn 中干净存活、BiliDili parity 真过、DB 健康）**，但有真实残留，两个 HIGH。

## 用户目标

把架构重构完成后与需求不一致/有问题的地方修掉矫正：① 双宿主覆盖 module-id 派生真正统一（现只在空-ProjectMap 的 BiliDili 形态成立）② alembic_code_guard public schema drift（OPEN）③ §10.2 文档地图陈旧 ④ host coverageLedgerSeed projection fragility ⑤ 若干 LOW 整洁。不重做已成功主体。

## 范围

- 拥有：R-1~R-4（HIGH+MED 必修）+ R-5~R-9（LOW 可选）。不拥有：不重做 P1-P15 已验证存活的主体、不改 freeze 值、R-2 ternary 语义不动。
- 跨仓：Core + Plugin + 主体 + 一处文档。

## 完成定义

见 [requirement design](alembic-recipe-lifecycle-refactor-residual-followup-2026-06-28.md)。核心：R-1 两 adapter（in-process/host/dimension-completion）module-id 派生收口单 canonical + 在**非空-ProjectMap 项目**重跑 host/in-process coverage parity 真集合相等（BiliDili 单形态不足）；R-2 public code_guard 响应过 schema、verdict 可读；R-3 三处文档地图修真；R-4 host seed 与 SQLite 独立一致。门禁不放松、freeze 不破。

## 阶段候选

R-1（覆盖 module-id canonical 收口，Core+Plugin+主体，载重）+ R-2（code_guard public schema，Plugin）先 → R-3（docs）/R-4（host seed projection）次 → R-5~R-9（plan-tool 续拆/别名收口/R-2 ternary 文档化/lint:naming/ledger projection）整洁可选。真机沿用直接真测（DeepSeek+Qwen，rebuild 授权，R-1 须额外一个非空-map 项目）。

## 待决策（已决，2026-06-28 用户"全部按推荐"）

CG-1 = **`target:name:path` 全统一**（三 adapter module-id 派生收口）/ CG-2 = **文档化 dataRoot-only + 订正 plan ternary 契约**（不 honor projectRoot，主体删 dataRoot 是安全行为）/ CG-3 = **R-5 纳入（可选续拆）+ R-8 豁免登记**。

## 非目标

不重做已成功 P1-P15 主体；不改 freeze 字面量值；不动 R-2 三元语义（仅文档化/honor）；不在只读快照"再验机制"（R-1 须真机非空-map 项目真测）；push/发版用户门。

## 详细设计

见 requirement design（strict，审计结论 + R-1~R-9 残留分级 file:line+修复方向 + 推进顺序/验收 + CG + 风险）。
