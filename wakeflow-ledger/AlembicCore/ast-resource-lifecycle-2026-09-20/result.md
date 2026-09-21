# AST/WASM 资源生命周期修复结果

已完成并提交：`516e05ac11210505eb7fa2d36e87e270391ecdfa`。本提交接续 d6a1b54 的相同 WASM 内容复用，补齐 Parser 释放和异步注册生命周期。转交请求是普通用户授权，没有创建新任务或写入 Wakeflow 派发/验收状态。

## 修改范围

- AstAnalyzer：替换语言、清空缓存及绑定 grammar 失败时释放所属 Parser；已返回的 Tree 继续由调用者拥有，不随 parser 淘汰失效。
- parserInit：合并初始化中的并发调用，成功后才暴露构造函数，失败保持可重试；继续复用相同字节的 Language 加载，内容变化仍生效。
- ast/index：所有调用者等待注册结束；进行中收到的更新安排后续 pass，避免新旧注册交错；稳定请求的失败结束当前轮，后续显式调用可重试。
- 测试按所有权/装配分层：Tree/Parser 生命周期留在原套件，grammar 与异步装配集中到 AstPluginLoading，迁移并扩展原有修复/替换 fixture。生命周期清单同步说明所有者、缓存边界与失效条件，未修改门禁扫描器或阈值。

只提交 Core 的六个文件，完整列表及内容哈希在 [commit.json](commit.json)。Main/Agent/Plugin 产品源码与提交保持接手时状态；原规则文件及 coverage/index.ts 未暂存。Core 68 个 exports 未变化，dist 未提交，未推送或发布。

## 实际验证

所有命令使用 Node 22.23.2 / web-tree-sitter 0.26.8。目录以 workspace 为基准，完整命令、退出码、耗时和日志见 [checks.jsonl](checks.jsonl)。

| 目录 | 命令 | 结果 |
| --- | --- | --- |
| AlembicCore | `npm run check` | build、公共入口/层级/导入/资源边界/生命周期等门禁及 lint 通过；2272 passed / 1 skipped。[日志](core-check-complete.log) |
| AlembicCore | `npm run build:check` | no-emit 类型检查通过。[日志](ast-typecheck.log) |
| AlembicCore | `npm run test -- test/AstAnalyzerTreeLifetime.test.ts test/AstPluginLoading.test.ts` | 最终测试清理后 16 passed。[日志](test-cleanup-check.log) |
| AlembicCore | `node --expose-gc ../wakeflow-ledger/AlembicCore/ast-resource-lifecycle-2026-09-20/resource-probe.mjs 500` | 500 次均为 [2,0,1]；Parser 创建500/删除499，仅1个当前缓存；Language 加载始终11份。[日志](resource-final.log) |
| Alembic | `node scratch/schema-projection-2026-09-20/strict-ast-reload-repro.mjs` | 原始公开入口复现脚本180次全过，超过原118次失败点。[日志](main-original-repro.log) |
| Alembic | `npm run test -- test/integration/StrictRecipePipelineFacade.integration.test.ts` | 完整19项同一进程通过，无用例过滤/跳过/阈值变化；包括原失败的 sanitized config replay。[日志](main-strict-final.log) |
| AlembicAgent | `npm run test -- test/recipe-production-profile-adapter.test.ts test/strict-production-chain.test.ts test/scan-run-production-integration.test.ts` | 三套125项通过。[日志](agent-consumer-tests.log) |

资源基线与结果：d6a1b54 下200次重载创建200、删除0；本次500次始终只保留1个活跃 parser。带显式 GC 的探针第100–499次 RSS 约128–136 MiB，最后两次采样只差32 KiB；原公开入口无强制 GC 的180次脚本后段约146–149 MiB。RSS反映运行时/分配器缓存，不要求立即下降，native 创建/释放配对与不重复加载相同WASM才是本次资源不累积的直接证据。详见 [采样数据](resource-measurements.json)。

先失败再修复的证据：两个 dispose 回归改前均为0次 delete；三个异步回归改前分别暴露重复初始化、提前完成、交错重载；修复后同一用例通过。[dispose RED](parser-disposal-red.log)、[dispose GREEN](parser-disposal-green.log)、[异步 RED](async-loading-red.log)、[异步 GREEN](async-loading-green.log)。前序 d6a1b54 的 WASM越界复现证据保留在 ../interface-layering-2026-09-20，本轮未重新制造已修复的GB级越界。

首次组合检查发现 reloadRevision 未登记生命周期，已在既有 ast-grammar-family 条目中补齐声明；config JSON被Biome现有排除规则忽略的单独检查不算通过，使用JSON解析、规范缩进核对、BlessedSingletons回归与doctrine门禁验证，记录保留。最终产品检查全部通过。

## 下游接入与剩余边界

本 workspace 的 file:../AlembicCore 已使用构建后的修复。Main/Agent 无需代码接线修改。迁移到其它检出时须包含前序 d6a1b54；正常构建 Core 后重启使用旧模块的长期进程即可加载新实现。Main消费者基线999b60d，Agent基线94df98f，均保持不变。

同版本一手源码与两阶段只读自审见 [source-review.md](source-review.md)。未发现本轮阻断 P1/P2。资源稳定性针对重复加载相同 grammar 集合与 Core 所有的 Parser；底层没有 WASM语言模块卸载API，反复引入不同二进制版本仍消耗进程资源，不能宣称任意热更新下内存恒定。插件新增/替换通过现有注册接口生效，没有新增磁盘JavaScript插件代码热更新能力。
