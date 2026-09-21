# 分块与向量恢复完整性审查结果

日期：2026-09-20。Core 基线 `9e8d033`。本批承接用户持续逐文件 review、架构整合与测试清理要求，完成分块、快照、量化和 JSON 恢复链的真实问题修复，并同步整理必要的插件只读接线。

## 结果与提交

| 仓库 | 提交 | 结果 |
| --- | --- | --- |
| Core | `e28fafc30131a76ce5e33cdf342476da6a2a4266` | 共用文本跨度计算，修复预算、重叠尾块、AST 叶子与原文行号 |
| Core | `f580f755b8326c811872bf0f1dd001558c0dcda7` | 统一快照验证/恢复，安全发布文件，修复量化状态与 JSON 归档顺序 |
| Core | `4a0b27786775f7c8568a21823a6ef6217d9146b9` | 强化 WAL 恢复用例，使新增数据只能由日志重放得到 |
| Plugin | `e0deb9ad0d69f402d2ef52d4c308b465ba324241` | 请求快照由 reader 一次加载，保留缺失/损坏降级与只读性 |
| Main | no-commit | 既有 file 依赖已消费修复；类型与 22 项相关接入测试通过，无需改接线 |

以上为本地提交，没有 push、发布、vendor 指针或实际安装更新。Core 与 Plugin 均完成构建；dist 不提交。原有 AGENTS.md/CLAUDE.md 和 Core 未跟踪 coverage/index.ts 保留。

## 已复现并修复的问题

| 问题 | 真实证据与修复 |
| --- | --- |
| 零预算导致固定分块无法前进 | 在 64MB 受限子进程中，预算 1 正常，预算 0 进入入口后 heap 耗尽并 SIGABRT。两个公开分块入口现在使用同一规则拒绝非法预算；内部子块不重复验证。 |
| overlap 生成冗余尾块 | 40 字符样本原来输出 3 个完整窗口再加单独 `abcd` 后缀；替换弱断言后 RED，新实现到达原文结尾即停止。 |
| 中文/emoji 与 AST 叶子超预算 | 混合文本不能按固定四字符估算；320 字符 AST 叶子原来达到 80 tokens 而预算为 16。现在复用现有估算器和码点完整的跨度算法。 |
| AST 内容/行号不真实 | 旧分组插入原文没有的换行，出现 startLine=1/endLine=0。现在按实际节点跨度取原文，行号与内容来源一致。 |
| magic-only 检查误接受截断快照 | 真实 ASVEC 仅剩 32 字节仍被 isValid 接受，阻断有效 JSON 回退。decode 集中校验布局、计数和引用，isValid 复用它；header 不得引用不存在的图层。 |
| 保存失败损坏旧目标 | 原 save/saveAsync 在部分写 ENOSPC 后把 144B 旧快照变成 20B。现在先写同目录临时文件再 rename；部分写/发布失败保留旧目标并清理临时文件。 |
| 清空后重开恢复出零维量化模型 | 原模型恢复为 trained，重新写入四维向量后 408 次粗排距离全为 NaN。新文件不写无效模型，旧零维文件仍可读，但模型不激活，后续按原训练时机恢复。 |
| quantize:none 被快照覆盖 | 原来 none 重开仍调用 SQ8 distance 69 次；现在恢复尊重配置，保持原始向量检索。正常 SQ8 编码和查询顺序有正向等价对照。 |
| JSON 归档早于成功保存、同步保存失败被吞 | 真实 EISDIR 覆盖两种初始化×数组/对象输入：失败报告并保留 JSON；失败实例先销毁，清障后新实例可以恢复并只发布一次，再归档。 |
| 重复读取/解析 | Core init/initSync 共用一次恢复入口；Plugin 不再先 isValid 再构造 reader。有效、损坏、缺失三态都只尝试读取一次。 |

原子保存实现的自审还补齐了临时权限：旧 0600 快照的临时文件在正文写入前就是 0600，不只在发布前修 mode。原文件的新建默认 mode 保留。

## 职责与兼容设计

[file-review.json](file-review.json) 记录 19 份源码/测试的实际全文或局部范围及最终 SHA256。外层配置与调用追踪见 [consumer-boundaries.md](consumer-boundaries.md)，没有将局部读取声称为全仓审计。

- TextChunkRanges 是内部算法；Chunker 保留策略/metadata，ASTChunker 保留语法边界/树所有权，IndexingPipeline 保留扫描和索引编排。包入口仍同步 chunk、异步 ensureParser。
- BinaryPersistence 的三种写入入口共用同一输入类型，格式校验只在 decode；模型是否启用由 Adapter 决定。同步/异步初始化复用快照恢复，但保留各自 WAL/JSON 时序。
- ASVEC v1 不变。可选 metadata、完整但坏 JSON 的旧容错、额外 keyword-only metadata/contents、删除后空高层图、历史零维模型均保留兼容。
- JSON 的读取/解析降级与目标存储失败不再混为一谈；操作性失败现在传播，这是修复虚报成功的有意变化。旧空/invalid-only 输入的 async/sync 差异经固定基线 8 组对照保留，没有为被反证的“应生成空快照”假设增加状态。
- Core package exports 的 68 个 key/映射与基线完全一致，没有增加公共 helper、宿主 provider 或新文件格式。

随源码维护的职责文档：[vector-chunking.md](../../../AlembicCore/docs/vector-chunking.md)、[vector-snapshots.md](../../../AlembicCore/docs/vector-snapshots.md)。

## 测试整理与验证

本批沿用上一批的测试归属，不恢复宿主算法副本。替换了无效 overlap 断言、未真正设置高 level 的 clamp 用例、关闭量化却声称验证 qvector 的用例；WAL 用例明确恢复旧快照并保留真实新日志，避免 destroy 自动保存掩盖重放缺失。新增故障/兼容场景集中为参数矩阵，覆盖不同入口的实际风险。

| 验证 | 结果 |
| --- | --- |
| Core npm run check | 2241 tests passed / 1 原有 skipped；196 suites passed / 1 skipped；构建、公共 API、分层、边界、lint 等均通过 |
| 后续仅增强 WAL 测试 | VectorPersistence 53 项复验通过；产品源码未再变更 |
| Main 相关消费 | 22 项通过，no-emit 通过 |
| Plugin 向量接入与只读/真相 | 22 + 6 项通过，no-emit、修改测试文件语义检查与 scoped lint 通过 |
| Plugin 标准 build | 通过，构建当前 Core 提交并刷新真实溯源记录 |
| verify:codex-plugin / verify:plugin-distribution | 通过 |
| smoke:codex-plugin | 打包、临时安装、startup、shellBootstrap、MCP stdio 全部通过 |
| 独立复核 | chunk/AST 22 检查组、binary 6 检查组；真实树正常/异常各释放一次；普通 AST 与正常量化样本对照一致 |

第一次 smoke 被旧 build provenance 正确挡住，原因是直接 tsc 没有执行 postbuild；按标准 build 刷新后通过，没有绕过溯源。完整命令、RED/GREEN 和限制见 [verification.md](verification.md)、[checks.jsonl](checks.jsonl)。

独立与实现证据：[chunk-ast-review.md](chunk-ast-review.md)、[independent-binary-review.md](independent-binary-review.md)、[persistence-review.md](persistence-review.md)、[quantization-review.md](quantization-review.md)。这些是明确范围的审查输入，根审已结合最终 diff、运行结果及提交复核；当前修改范围内无遗留 P1/P2。

## 使用与后续边界

- 旧索引仍可读。需要把新分块结果用于内容未变的文件时，使用既有 force/fullBuild；普通增量 sourceHash 判断可能继续跳过它们。
- 预算仍是统一估算器值，不是外部模型 tokenizer 精确计数。AST 块保留各自连续源跨度，不承诺拼接出节点之间未入组的全部空白。
- 原子 rename 是完整文件的发布方式；不新增 fsync、链接/inode/ACL 保持或跨进程事务协议。目录权限与文件系统行为仍是边界。
- 验证没有覆盖两个宿主全部测试、远程发布或实际 Codex 会话安装。smoke 使用临时项目/临时安装并检测本机 provider，不代表模型质量或 ANN 性能验收。
- 下一批可审查 Plugin 的纯只读 HNSW 实现与 Core reader 的职责、阈值、过滤和同分排序差异，再判断可共享部分；也可把剩余随机召回/边界用例改成确定性输入。它们是审查发现的后续方向，不是本批已经实现的能力。
