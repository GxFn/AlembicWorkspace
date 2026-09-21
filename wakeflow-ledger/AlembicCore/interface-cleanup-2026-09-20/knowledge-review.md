# 知识接口切片自审

范围：ConfidenceRouter、KnowledgeService、内部评分字段投影、persistKnowledgeUpdate，以及既有 KnowledgeService / RecipeAuthoringGroundedPaths 测试。上一个向量切片已提交为 `25fd9f9`。

## 范围与行为

- 18 个共有 scorer 字段由内部纯函数投影，不加入任何公开 barrel 或 package exports。保留原有 `||` 默认值、对象判定和数组引用。
- Router 仍在基础门之后、原 try 内评分；Service 保留 `_adaptForScorer` 和构造参数，继续追加 engagement、深度与 grounding，并保留 doClause 用法回退。没有复用最终分数、改公式或改变失败处理。
- 内部更新 port 精确声明两个方法及 nullable 返回，替代对具体仓储 class 的类型依赖；函数体完全不变。公共 KnowledgeRepository 运行时 class/type、DB-only、file-first、SQL 与分歧语义保持。
- 测试清理：makeEntry 复用每次新建的 wire fixture；两个路由评分用例改为参数表并覆盖 scorer 失败；接地测试合并重复 repo/scorer setup，补全 port 缺席与已就位零接地的区别。原有真实 SQLite/文件故障矩阵全部保留。

## 证据与质量

原六文件基线 153 tests 通过。强化后的两个业务入口测试在产品修改前通过（63 tests），比较 scorer 完整共同输入、Service 的附加字段和三种 usageGuide 来源；接地范围比较的是 resolver 回传的 rangeText。初次新增断言误把 rangeText 当成位置字符串，已在实现前修正并保留初次日志，不记为产品缺陷。

改后六文件 157 tests 通过、build:check 通过、六文件 Biome 通过。属于保持行为的重构，GREEN 对照不冒充运行时 RED；窄 port 类型签名与旧 Pick 等价，由真实调用方的全项目类型检查验证，不新增同义 mock 测试。

自审未发现 P0/P1/P2 阻断项。共享 helper 未携带额外准入/装配/持久化职责，旧公共适配方法保留。外层无需修改本切片接线；继续消费本地 Core 包。组合检查结果及提交 hash 在最终记录补充。
