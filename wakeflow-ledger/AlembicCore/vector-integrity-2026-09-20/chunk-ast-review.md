# Chunker / AST 独立差分复核

日期：2026-09-20。基线：`9e8d033ac4dbab4e3555d243fc711269b48eeab9`，复核对象为该基线上的当前未提交修改。

本次只读审查产品代码，以公开 `src/vector.ts` 入口做小型受控 probe，并记录证据；未修改产品或测试、未运行全量测试/构建、未创建提交。提交和最终门禁由主审统一处理。

## 结论

发现并即时报告 1 项 P2：`chunk` 的 auto/section 路径绕过无效预算验证。主审已将共享验证放到 `chunk` / `chunkByAST` 两个公开入口，独立重跑确认修复。当前未发现其他 P1/P2 阻断。

有效输入的文本保真、统一估算预算、重叠与终止通过；常规 JS/TS/Python AST 输出与基线逐值一致；超大 AST 混合文本的原文跨度与行号通过。原生树在成功和物化异常路径均恰好释放一次。

这不是全语言、全仓或性能验收。分块预算仍是现有 `estimateTokens` 估算值，不是外部 tokenizer 的精确 token 数；AST 输出仍以语法节点为单位，不承诺把不同节点之间未入组的空白拼回整份源文件。

## 实际读取范围

| 文件 | 深度 | 职责与本次判断 |
| --- | --- | --- |
| `src/infrastructure/vector/Chunker.ts`，210 行 | 全文及最终差分 | 策略选择、section 合并和 metadata。已知分块策略在选择前验证；whole、未知策略、空输入保留原样返回语义。fixed 只负责将真实跨度物化为已有 DTO。 |
| `src/infrastructure/vector/ASTChunker.ts`，451 行 | 全文及最终差分 | 解析器准备、语法节点分组、名称/行号、树所有权。preamble 和递归分组从同一原文跨度取内容与位置；超大叶子进入共享文本算法。普通声明路径的 DTO 与基线相同。 |
| `src/infrastructure/vector/TextChunkRanges.ts`，82 行 | 全文 | 内部参数验证和确定性文本跨度；共享估算器收紧 CJK/emoji 预算，避免代理对切断，保留行边界优先、overlap 达到预算时不重叠前进以及最终块终止。没有增加 package 导出。 |
| `test/VectorPipeline.test.ts`，552 行 | 本批全部差分；正文 1–245 行；其余用例仅名称/范围定位 | 新断言替换了旧的“相邻字符串长度大于零”弱 overlap 检查；覆盖精确块内容/metadata、混合文本重组与预算、非法预算和真实 AST 超大叶子。未将其余 pipeline 测试声称为全文审查。 |
| `src/vector.ts`、`src/infrastructure/vector/index.ts` | 公共转发链读取 | probe 通过正式 vector facade 调用 `chunk`、`chunkByAST`、`ensureParser`、`estimateTokens`；内部 helper 不在这两层转发中。 |
| `src/shared/tokenUtils.ts` | 全文 | 现有估算器按 Unicode 码点计数，最后向上取整；保留原算法。 |
| `src/core/AstAnalyzer.ts:565–586` | 局部调用追踪 | `parseToTree` 把真实树所有权交给调用方；解析失败时自行释放已创建的树。 |
| `docs/vector-chunking.md` | 全文 | 公开同步/异步边界、估算预算、原文跨度、树释放和旧索引 force/fullBuild 建议与实现一致。 |

外层 Main/Plugin 的真实装配和参数边界沿用同目录 [consumer-boundaries.md](consumer-boundaries.md)，本次没有重新完整审查宿主。

## P2-CHUNK-001：无效预算被策略分支绕过，已修复

初始实现仅在 `fixedTextRanges` 内验证，`chunk` 的 whole/section 快路径没有进入此函数。通过公开 facade 已观察到：

| 输入 | 修复前实际输出 |
| --- | --- |
| `chunk('# 标题\n中文正文'.repeat(3), {}, { strategy: 'auto', maxChunkTokens: NaN, overlapTokens: 0 })` | 不抛异常；1 块，估算 12 tokens |
| `chunk('# 标题\n中文正文', {}, { strategy: 'section', maxChunkTokens: NaN, overlapTokens: 0 })` | 不抛异常；1 块，估算 4 tokens |
| `chunk('short', {}, { strategy: 'auto', maxChunkTokens: 20, overlapTokens: -1 })` | 不抛异常；1 块，估算 2 tokens |

原因是 `tokens <= NaN` / `sectionTokens > NaN` 都为 false；短文本 auto 则直接走 whole。显式 whole 原本忽略预算，不能据此改变其兼容语义。

最终处理位置为 `Chunker.ts:66–70`、`ASTChunker.ts:186–189`、`TextChunkRanges.ts:4–12`：空输入先返回；auto/section/fixed/ast 验证同一规则；whole 与未知策略继续忽略分块预算。直接 AST 在请求树之前验证。内部跨度函数接受已验证参数，section/AST 子块不再逐块重复验证。

本次 probe 再次确认 auto/section 的 NaN、短文本 auto 的负 overlap 均抛 `RangeError`；whole/未知策略及空输入继续保持旧行为。对应产品回归位于 `test/VectorPipeline.test.ts:116–137`。

## 独立公共入口证据

可复跑脚本：[chunk-ast-public-probe.mjs](chunk-ast-public-probe.mjs)。从 `AlembicCore` 根目录使用 Node.js 22 执行：

```sh
node --disable-warning=ExperimentalWarning ../wakeflow-ledger/AlembicCore/vector-integrity-2026-09-20/chunk-ast-public-probe.mjs
```

执行环境为 Node `v22.23.2`；本次调用设置了 45 秒子进程上限，实际少于 1 秒。结果：[chunk-ast-public-probe.log](chunk-ast-public-probe.log)，**22 个检查组通过，0 失败，子进程退出码 0**。脚本只从 Git 读取基线 AST 源码到内存做对照，不生成产品源码或 dist。

| 检查组 | 实际输入与结果 |
| --- | --- |
| 文本预算与完整性 | ASCII、CJK、emoji、混合 LF/CRLF/CR 共 6 类，分别使用 1、1.9、2、4、7、Infinity 预算；36 个组合逐块满足估算预算、非空、码点完整，零 overlap 拼接精确等于原文，metadata 连续。 |
| 精确 overlap | 唯一 ASCII 原文、预算 4、overlap 1，恰好得到 3 个预期块，无独立重复尾块。 |
| 大 overlap | overlap 为 1、2、Infinity，预算 1；3 个组合均不重叠并完整覆盖原文。 |
| 混合 overlap | 6 类可唯一定位的文本 × overlap 0.5/1/2，共 18 个组合；实际源跨度有序前进、不漏字符、重叠估算不超过给定值，最终块到达原文末尾。 |
| 无效选项与兼容 | auto/section NaN、短文本 auto 负 overlap 抛错；显式 whole、未知策略、空/纯空白保持旧行为。 |
| 正常 AST 差分 | 使用真实 grammar 的 JS 函数+类、TS 接口+函数、Python 函数+类，各 2 块；与 `9e8d033` AST 实现的 content 与完整 metadata 深度相等。 |
| AST 混合跨度 | 含注释/import、长 CJK+emoji 模板字符串及函数，分别使用 LF、CRLF、CR；预算 8，各 27 块。每块是按顺序出现的原文连续片段、码点完整、不超预算；startLine/endLine 与原文偏移相符且大于零；完整长字面量未丢失。 |
| 原生树所有权 | 临时包裹真实 Tree 原型的 `delete` 并在 finally 恢复：正常 AST 返回 1 次；metadata getter 抛出物化异常时 1 次；NaN 前置拒绝时 0 次，未请求解析树。没有用 mock 树替代原生 grammar。 |

首轮持久化 probe 日志 [chunk-ast-public-probe-initial.log](chunk-ast-public-probe-initial.log) 为 21 通过 / 1 失败。该失败来自 probe 用 `indexOf` 在周期性重复文本上错误识别源偏移，并非产品缺陷；改用可唯一定位的 overlap 文本后 18 个组合通过。没有把这个测量歧义计为产品 RED。

`git diff --check` 本次退出码为 0。没有重复主审已完成的 Vitest 或全仓门禁。

## 最终复核文件指纹

以下 SHA-256 仅记录本次检查的快照，便于区分后续改动，不是新的运行时门禁：

```text
d5e3e255d4febb7a55ef6e0441ba1ef3d372a537642f3b9d77c3e2768d645765  src/infrastructure/vector/Chunker.ts
035e1be822f2b227724d4c0f95a0bf335872922e17538110196af8ff6258158e  src/infrastructure/vector/ASTChunker.ts
868bcb32e6cc99a14f3e46cc33785a69fda30b6146b9d49ed35a6aaa56148f57  src/infrastructure/vector/TextChunkRanges.ts
fdffe2da56618723096ee10617f1ae1f1e3a3a13591d27acf87593cdb89d4b11  test/VectorPipeline.test.ts
```

后续由主审合入其产品修改和门禁证据；本复核没有要求扩大到其他语法、持久化格式、宿主接口或全量性能工作。
