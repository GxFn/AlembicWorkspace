# 研究验证记录

日期：2026-09-20。对象为当前接口分层与消费者证据；没有实施拟议重构，不作运行时功能验收。本轮没有产品源码、测试、配置、依赖或公共入口变更，因此不需要产品构建，也没有重跑全量 Vitest。

## 已运行检查

以下 npm 命令在 AlembicCore 目录、现有 Node.js 22 运行时执行，逐项退出码为 0。命令与耗时保存在 [checks.jsonl](checks.jsonl)。

| 命令 | 结果 | 原始日志 |
| --- | --- | --- |
| `npm run lint:layer-contract` | 496 个跨区运行时 import 符合允许矩阵；298 个 type-only bridge 按规则豁免 | [layer-contract.log](layer-contract.log) |
| `npm run lint:public-api-boundary` | 68 个路径完成分类；61 exact / 7 wildcard；31 stable / 8 provisional / 29 transitional；无增长规则通过 | [public-api.log](public-api.log) |
| `npm run lint:consumer-core-imports` | AlembicAgent、Alembic、AlembicPlugin 的 Core import issues 均为 0 | [consumer-imports.log](consumer-imports.log) |
| `git diff --check`，分别在 Core、Main、Plugin、Tencent 目录执行 | 均为退出码 0，无输出 | [final-state.json](final-state.json) |

consumer import gate 纳入测试/脚本等范围，并额外检查 AlembicAgent；其 files/refs 数量不能与本次三仓“已跟踪生产文件”的 AST 盘点混用。分层检查通过也不表示所有架构重复已经消除。

## 静态清单的复现与限制

在 AlembicCore 目录执行：

```sh
node ../wakeflow-ledger/AlembicCore/interface-architecture-2026-09-20/inventory-interfaces.mjs
```

脚本使用本仓已安装的 TypeScript 解析 tracked source，读取 package imports/exports 和已有 public API policy，输出 [interface-inventory.json](interface-inventory.json)。不安装依赖，不生成产品构建，不删除文件。

清单中可重算的结论：Core/Main/Plugin 生产文件为 590/214/206；两宿主纯 relay 为 6/10，合计 16；其中 5 个有生产消费者、11 个无静态消费者。计算导入单列，未纳入外部消费者；这些结果仅提供删除候选，不足以证明路径可删。

本地腾讯仓库只读，基线 `06414ac10766b9bd61e4a69f3cf0ea414afb6d4f`；没有运行其服务、安装依赖或执行测试。腾讯源码中的初始化与关闭观察是静态分析，不是并发故障的已运行复现。

## 工作树与提交

四仓最终 HEAD 和工作树状态记录于 final-state.json。Core/Main/Plugin 保留原有 AGENTS.md、CLAUDE.md 修改，Core 另有原有未跟踪 `src/repository/coverage/index.ts`；本轮未修改、暂存或提交这些文件。腾讯工作树干净。

无新 commit 的原因：本轮最低闭环为架构研究与可执行整理建议，新增材料仅在 workspace ledger；没有产品实现可提交。下游继续通过现有 `file:../AlembicCore` 接入，无 vendor/release 变更。

## 交付物自检

报告链接、JSON 可解析性、计数相加与候选列表一致性、文档空白和长期文档敏感路径检查由 [artifact-check.json](artifact-check.json) 记录。报告中的后续验收条件均明确为未执行，未复用前一轮测试结果充当本轮证据。
