# AlembicAgent 终端工具检查 + 增强主体 Agent — Original Plan

Date: 2026-06-26
Design Key: alembic-agent-terminal-tools-enhancement-2026-06-26
Source Window: Design
Status: ready-for-intake

## 背景

检查 AlembicAgent 终端工具:现能提供哪些真实有价值好用的终端能力增强主体 in-process Agent,工具系统有何问题。5-agent 跨仓代码级测绘。结论:好用终端大部分已存在端到端通(code.* + terminal.exec 真 Seatbelt),真实工作不是加工具,是三件事(接缺口/收硬化/定双轨)。

## 用户目标

让主体 Agent(尤其 evolution/analysis)能用终端做真实 grounding;收口工具系统的安全/双轨/死壳问题;明确哪些终端能力真有价值。

## 范围

- 拥有:两栈检查结论;E-1 Evolution 证式只读终端(最高 value,衰退判定时间维度证据);E-2 live terminal.exec 硬化+审计+cwd 修复;E-3 双轨去留;E-4 phantom 广告修正;安全暴露原则。
- 不拥有:kernel convergence(已完成);tools/v2 命名(归命名重构);plan 适配(在途);真 Mac 增强(另需求)。
- 跨仓:AlembicAgent + 主体 + Core(BootstrapTerminalToolset)。

## 完成定义

见 [requirement design](alembic-agent-terminal-tools-enhancement-2026-06-26.md)。核心:Evolution 能跑 git/test 取证 grounding;live exec 安全收口(结构化 allowlist+审计必达+沙箱必达+cwd 修复);双轨去留落定;phantom 广告清除;安全原则固化。

## 阶段候选

E-2 硬化(安全前置)→ E-1 Evolution 接缺口 + E-4 phantom 修正 → E-3 双轨去留(CG 后)→ E-5 prompt 引导/grounding 协调。

## 待决策(intake confirm)

CG-1 双轨去留(建议维持 exec-only 或最小接 terminal_run)/ CG-2 Evolution 只读 allowlist / CG-3 结构化安全模型 / CG-4 不给写终端 / CG-5 grounding 强制与 PCV 协调 / CG-6 MacSystemAdapter 保留只读(见 requirement design 决策表)。

## 非目标

不重做 kernel convergence;不在此改 tools/v2 命名;不放松安全(allowlist/沙箱/审计是底线);不复活 PTY/session 富栈除非有真实消费。

## 详细设计

见 requirement design(strict,两栈架构 + 真实终端能力清单 + 工具系统问题 + E-1~5 增强落地 + 安全暴露原则 + CG-1~6 + 风险)。
