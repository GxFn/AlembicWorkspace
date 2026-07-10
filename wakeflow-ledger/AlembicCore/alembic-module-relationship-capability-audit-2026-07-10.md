# 模块关系分析能力深审与修复(BiliDili 实证)— 2026-07-10

## 背景与触发

用户出示 BiliDili 冷启动登记缺口截图(Swift SPM 模块解析未修:`repo.ts:66` 检测到
Package.swift 但元数据抽取硬编码 package.json;`source_graph_files=0`),并判断
"模块关系分析能力出问题很久了"。本审计对能力全链分层定位,修复实证断点,登记
不盲改项。

## 分层诊断结论

| 层 | 状态 | 事实 |
| --- | --- | --- |
| 语法资产 | ✅ 完整 | `resources/grammars/tree-sitter-swift.wasm` 等 11 语言在库 |
| AST walker | ✅ 完整 | `src/core/ast/lang-swift.ts` 支持 import_declaration + callSites |
| SPM 发现器 | ✅ 完整 | `SpmDiscoverer` 全量解析 Package.swift(targets/products/deps),已注册 DiscovererRegistry,repo.ts 消费 discovery.targets |
| **fileFlow 适配** | ❌ 自诞生断 | 私有 `resolveParserLanguage` 白名单只认 ts/js 四型(2026-06-15 c4f8bed 起),Swift 恒 `parser is unavailable` |
| **fileSymbols 适配** | ❌ 自诞生断 | 同型私有白名单(第 4 处实例) |
| **moduleLayers 枚举** | ❌ 自诞生断 | `isSupportedModuleFile` 只认 .ts/.js/.json → Swift 包 ownedFiles 恒空,module 种子报误导性 `ownedFiles or modulePath is required` |
| source_graph 服务 | ❌ 全语言孤儿 | `sourceGraphResult` 全仓零赋值;BiliDili DB 四表+code_entities 全 0 行(见后续登记 D) |

关键定性:**底层能力完整,中间适配层三处白名单把它整体挡在门外**;这不是 Swift
专属缺陷,ObjC/Kotlin/Python/Go/Rust/Dart 同断。

## 修复(Core 4d6bbc4)

- 新增 `src/service/project-context/shared/parserLanguage.ts` 单源映射(扩展名→AST
  语言,11 语言;新增语言只改这里)。
- fileFlow 分流:JS 家族保留行级正则+AST 补充;非 JS 走 `collectAstImportsDirect`
  (AST import 结构直出 + `findImportLine` 行定位,超长行 ReDoS 防线沿用)。
- fileSymbols 委托单源解析;`isSupportedModuleFile` 扩到 18 种源码扩展名。
- 回归:`test/ProjectContextFileFlowGuards.test.ts` 新增 Swift describe,14/14 绿。

### 真机探针(BiliDili 只读,新 dist)

- file-flow `BiliDili/AppCoordinator.swift`:9 imports 行号精确
  (UIKit@L1/OSLog@L2/AOXUIKit@L3/…/Account@L9),无 unavailable。
- module `Packages/AOXFoundationKit`:ownedFiles=20(全 Swift)。修复前两面恒空。

## 伴生修复

- **门面重指(Core 9440997 + Plugin d40faa2)**:19ae7f6 曾把 gitBlob 通配导出加进
  冻结的 `./shared` 门面(shrink-only 预算 192)使符号到 193。按 SD-5 B2=re-point
  先例撤出,`readFileAtCommit` 经 ROOT 门面具名导出;Plugin KnowledgeModule 改根
  门面导入。预算未提,冻结门面未扩。
- **门禁假绿根修(Core 61f0eb2)**:`lint:public-api-boundary` 与 `smoke:public-api`
  经 `await import` 读已构建 dist(check-public-api-boundary.mjs:223),而 check 链
  只跑 noEmit——dist 陈旧即假绿(19ae7f6 事故成因)。check 链首步 build:check→build,
  dist 依赖门从此永远读当次源码产物。全链复跑 exit 0(169 files/1608 tests)。

## 登记不盲改(后续项,需独立证据/需求)

- **(C) repo.ts 包元数据只读 package.json**:SpmDiscoverer 的 ParsedPackage 已有
  全量数据,待接线到 repo 元数据面(截图登记缺口的另一半)。
- **(D) source_graph 服务孤儿**:`buildFull`/`buildIncremental`/`sourceGraphResult`
  全仓零调用方,影响所有语言;接线进冷启动/rescan 属独立需求(增加冷启动耗时,
  需要用户决策)。
- 冷启动遗留(前场分析未完):ui-interaction 维度 depth-grounded 门与全 100 gate
  分矛盾(summary_rewrite 不收敛);14/15 成功仍报 "Bootstrap job failed" 的语义
  属产品决策。

## 验证与提交

- Core:`npm run build && npm run check` exit 0(边界门 OK 66 exports;Swift 回归含)。
- Plugin:`npm run build:check` exit 0 + `test:unit` 156 files/1735 tests 绿 + `npm run build` exit 0(dist 已刷新,下次服务/会话重启生效)。
- 提交:Core 9440997/4d6bbc4/61f0eb2,Plugin d40faa2(均未 push,推送归用户门)。
