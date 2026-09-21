# Foundation contracts 独立审查

44项已人工阅读全文：16个指定shared源码、25个foundation清单直接导入测试，补读CoreContractSpine/FailureTaxonomy/FieldTaxonomy三个同名公共facade行为套件。逐文件职责、不变量、真实导入和保留原因见foundation-contracts-review.json。初始阶段只读，执行不写项目的getter/pure budget/git-read探针；44项落盘后按根线程追加授权，只修改FC-001/002两处源文件并各加一个既有suite回归。

## 已确认

- FC-001 [P2] WorkspaceResolver.memoryEmbeddingsPath硬编码context，忽略既有folderNames.project.context覆盖。只读public constructor probe确认；Plugin KnowledgeState.ts:490真实消费该getter。根线程已授权既有WorkspaceResolver测试加公开入口回归后最小修复。
- FC-002 [P3] OutputBudget末尾恰好完整多字节字符被多裁一次：16381个a+中恰好16384bytes，接上tail后仅返回16381bytes。仍满足编码安全/上限，但丢失完整预算内字符。根线程已授权既有OutputBudget测试加真实入口回归后修复，不改预算表/wire。

## 保留边界

PathGuard是path.resolve后的词法scope，未配置时兼容放行，并非realpath/symlink隔离器；strict private revision另有真实confinement校验。configure的allowList与extraProject sets生命周期不同，未在无真实消费者重配置证据时列bug。Schema与taxonomy检查结构/策略，真实source grounding、runtime redaction、host授权仍在消费链。ProjectRegistry坏JSON回空/无锁read-modify-write为现运行态限制，本阶段不扩写。

readFileAtCommit选项形状输入只读probe在当前仓返回null，两次均未确认额外bug，因此不改gitBlob、不以静态猜测列漏洞。OutputBudget无外层直接函数调用扫描命中，但root公共出口与测试消费者保留，不能夸大在线影响。

所有44项是只读review输入，已有Root/B修改只被阅读，没有覆盖。后续仅执行根线程明确批准FC-001/002两处修复并追加RED/GREEN记录；不commit，根线程独立验收。

## 两项最小修复完成

FC-001 getter现在复用contextDir，默认路径不变；公共workspace facade regression先1 RED。FC-002只在预算边界落入UTF8 continuation时回退，2/3/4-byte字符完整/所有部分边界由同一入口用例覆盖，先1 RED。两suite联合20/20、4文件Biome通过；TypeScript与git diff --check日志分别foundation-contracts-fixes-typecheck.log / foundation-contracts-final-diff.log。没有改预算表、wire形状、gitBlob或其他新产品范围，仍无commit，待Root独立复核。
