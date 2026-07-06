# AlembicAgent 借鉴 claude-code-from-scratch — Original Plan

Date: 2026-07-01
Design Key: alembic-agent-cc-scratch-borrow-2026-07-01
Source Window: AlembicWorkspace controller（Design 流程）
Status: CG 已决（2026-07-01）— 暂只落档，待用户决定 deliver 时机（未 intake/未 deliver）

## 背景

用户提供 `claude-code-from-scratch`（从零重建 Claude Code 的开源教程，TS 4318 LOC + Python 4002 LOC，本地下载在 `AlembicWorkspace/claude-code-from-scratch`），要求"认真学习借鉴使用到 AlembicAgent 项目"。AlembicAgent 是 Alembic 的 in-process AI Agent（无人值守、批量生成 Recipe），形态不同于交互式 coding CLI。方法：14 章逐章真读真实 TS 源 + 逐章对 AlembicAgent 真实代码做 fit + scope/boundary/thin-shell 三路对抗 critique + finalize（33 agent）；3 核心锚点 controller 已独立抽查。

## 用户目标

把参考实现中**真正适配 in-process Recipe 生成、且 AlembicAgent 确有缺口、有真实消费点、对应一个已陈述正确性/保真弱点**的工程模式借鉴进来，提升生成质量与写入正确性；**不照搬交互 UX**，不靠后续打回学。

## 范围

- **拥有（in-scope，3 项）**：
  - **A-1** L1 历史截断保留首+尾（`ContextWindow.ts:583`，`substring(0,500)` 丢尾 → head+marker+tail；含 A-1b `limit*` 系列 `:1040/:1185`）。
  - **A-2** 召回记忆陈旧度标注（`MemoryRetriever.ts:194`，render-only，防陈旧知识幻觉进 Recipe）。
  - **B-1** 写前新鲜度门 read-before-write/TOCTOU（`code.ts:767` 无条件写 → 复用既有 `deltaCache` 内容哈希做新鲜度门）。
- **不拥有（Non-goals，详见设计 §4）**：交互/REPL/流式双后端/MCP-client/文件系统配置发现层/文件编辑器/教学产物/AlembicAgent 已有更强等价物；**A-3 召回预取降级 defer**（对抗 critique 判 thin-shell）。
- **跨仓**：仅 **AlembicAgent**（`src/agent/*`、`src/tools/*`）；不改 AlembicCore / AlembicPlugin。

## 完成定义

见 requirement design。核心：三项各自在**真 bootstrap/scan Recipe 生成跑**上以**确定性断言 harness**（grep marker/stamp/rejection 串，非肉眼）验收 + **production-floor parity 不漂**（floor verdict baseline 改前/改后逐字节 diff）+ 单测离线全绿（不依赖真 key）。B-1 须证 `handleRead`/`handleWrite` 运行期共享同一 `ToolContext`，否则判 **blocked，非 done**。

## 阶段候选

Phase 1 A-1（纯渲染、低风险）→ Phase 1b A-1b → Phase 2 A-2（render-only + floor parity）→ Phase 3 B-1（写安全，前置核验 Core WriteZone 无既有新鲜度原语）。三项独立、无强依赖，便于逐阶段在真跑上验收。

## 待决策（intake confirm）

> **2026-07-01 已拍板**：CG-1=`>7d`+软提示+**全 source**（用户选，非荐的 bootstrap-only；**载重**：floor-parity 须覆盖全召回 source 语料）/ CG-2=80%/15% / CG-3=硬拒+重读引导 / CG-4=复用 `deltaCache`（非 mtime）/ CG-5=A-3 defer / CG-6=观察项留痕。**用户选暂只落档、未 intake/未 deliver。**

- **CG-1** A-2 陈旧阈值/措辞/source 范围（建议：`>7d` + 软提示 + 仅 `bootstrap` source）。
- **CG-2** A-1 head/tail 比例（建议：同 read 入口 80%/15%，服从 `keepHead+marker+keepTail ≤ 500` 幂等硬约束）。
- **CG-3** B-1「读后被外部改」处置（建议：硬拒 + 明确重读引导文案）。
- **CG-4** B-1 新鲜度机制（建议：复用既有 `deltaCache` 内容哈希，非新增 mtime map）。
- **CG-5** A-3 处置（建议：移 §4.8 defer，本需求不交付）。
- **CG-6** defer 项留痕（建议：本需求 ledger 观察项留痕，不另起需求）。

## 非目标

不加任何模型往返 / LLM-可调工具；不改进入提交门的 Recipe 内容、validation verdict、production floor 阈值；不破坏工具内核契约（`ToolResult` 信封 / `{tool,action}` 命名）、PCV observe-only 边界、V1-tool 退役登记、压缩配对原子性、维度内重放确定性。

## 详细设计

见 [requirement design](alembic-agent-cc-scratch-borrow-2026-07-01.md)（strict：§1 目标 / §2 动机 / §3 in-scope 3 项 / §4 Non-goals 载重段 / §5 阶段+真闭环完成定义 / §6 真跑验收 + floor parity / §7 边界风险 / 拒绝的批评 / CG-1~6）。
