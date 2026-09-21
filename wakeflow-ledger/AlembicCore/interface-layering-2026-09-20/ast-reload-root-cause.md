# 重载语法导致 strict 集成失效的根因与修复

入口：Main 的 StrictRecipePipelineFacade.integration.test.ts，原有 18 项全部通过；增加一次真实发布后丢回执的用例后，19 项序列连续两次只有最后一项失败。该用例单独运行通过，失败点是 Core verifyAstBackendFixtures，尚未到知识写入。没有修改旧断言、跳过 strict 事实门或增加业务重试。

独立复现：ast-reload-probe.mjs 调用真实 dist 的 reloadProjectAstPlugins 与 class/empty/interface 三种 analyzeSourceFile。50 次通过；500 次目标在 iteration=118 得到 positive summary=null。对真实 Language.load 仅加错误记录、保持异常重抛，发现 memory access out of bounds。相同入口的现有 AST lifetime 套件新增 140 次重载回归，改前 iteration=117 失败，改后通过。

根因：每个 AST backend 首次执行都重载全部语法，parserInit 每轮都 Language.load 相同二进制。安装版本 web-tree-sitter 0.26.8 的动态 WASM 模块加载分配内存与函数表，并不能靠丢弃 JS 引用卸载。依据是本地 node_modules/web-tree-sitter/web-tree-sitter.js 的 Language.load/loadWebAssemblyModule 路径和上述真实失败；[官方 Web binding 说明](https://github.com/tree-sitter/tree-sitter/blob/master/lib/binding_web/README.md) 提供初始化、语言装载与 parser 使用背景，未将第三方问题单当成本仓根因。

最小修复位于 Core parserInit：每个资源路径保留当前字节 sha256 和同一加载 Promise；相同内容复用成功或在途结果，内容变化重新加载。失败按 entry 身份移除，仍返回原 null 结果；失败与复用有诊断。没有缓存整个 reload 或 fixture 校验结果，没有修改 parser 行为。生产调用方是固定语言注册表；语法热更新仍读取真实文件字节，未用 mtime 代替内容。

验证：

- ast-reload-regression-red.log / ast-reload-regression-green.log：相同真实入口 RED → GREEN。
- ast-reload-cache-compat.log：72 项 AST/严格事实/多语言/大工程重复扫描验证通过；修复损坏语法与同路径 TS→JS 替换仍生效。
- ast-reload-stress-green.log：500 次真实重载和三类声明分析通过。
- core-final-with-ast-cache.log：2266 passed / 1 skipped，组合检查通过。
- main-integrated-strict-final.log：原工作树完整 19 项 strict 测试通过，包括之前稳定失败的最后一项。

独立观察：AstAnalyzer 注册/清空 parser 缓存时没有调用 native Parser.delete。此问题没有混入本次根因修复，也没有宣称 500 次通过证明进程资源永久有界。后续应单独复现资源所有权，再设计释放时机；这属于现有用户优化目标下的代码观察，不是新增产品需求。
