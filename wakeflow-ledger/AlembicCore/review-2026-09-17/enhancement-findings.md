# Enhancement 补充逐文件审查

intelligence-review-remaining.json 中 enhancement 分组17个源码文件全部人工全文读取，具体职责/函数/不变量/保留原因/输入覆盖限制在 enhancement-review.json，形状兼容B的intelligence-review便于并入；未重复宣称B已full项为新审查成果。

ENH-001：Go单行require合法清单漏grpc/gin。真实临时go.mod→公开resolveEnhancementGuardRulesForProject先1 RED，最小regex兼容后9/9 GREEN。
ENH-002：package.json根为null抛错，数组/string/number根错误推测JavaScript。四种真实manifest与有效requirements共存，先4 RED；现在记录明确warn并跳过单清单，其余生态继续。检测+Guard两suite17/17 GREEN。排序、manifest数组字段和框架词表保持。源码只改detectFrameworks.ts，测试只改现DetectFrameworks.test.ts，已同步B无冲突。

最新TypeScript noEmit、2文件Biome和layer contract通过，初次lint只格式失败后已修正。最终diff两轮核对：只改上述两条输入路径；没有扩增pack/rules/公共exports，也未把advisory启发式改新门禁。无commit，待Root独立review。

各增强包多数基于名称/继承/decorator/import做带confidence的确定性识别，Guard为文件级regex，不能当真实控制流证明。保留如下静态观察供未来限定scope：Vue SFC属性顺序/引号覆盖有限；Vue reactive-destructure包含toRefs、两个router名称在lowercase后与camelCase比较；Django model-str末端有literal Z；部分规则正向匹配健康模式但提示规范。当前没有为这些观察追加probe或产品diff，按Root停止扩范围要求不列作已完成修复。

真实接线校准：15个pack由enhancement/index.ts动态注册，Guard规则链可验证；getExtraDimensions/pack.detectPatterns/Vue preprocessFile在Core+三外层活跃source检索未见调用，AstAnalyzer仅留可注入preprocess seam。因此不把这些hook存在说成已启用的project intelligence能力，也不未经兼容设计删除现Core导出。扫描enhancement-hook-consumer-scan.log。
