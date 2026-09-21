import json,re
from pathlib import Path
from collections import Counter
p=Path('../wakeflow-ledger/AlembicCore/review-2026-09-17')
rows=json.loads((p/'production-review.json').read_text()); indexed={x['file']:x for x in rows}
baseline={x['file']:x for x in json.loads((p/'inventory.json').read_text())}
groups=[
 {'id':'PROD-008','files':['src/service/knowledge/validation/recipe/RecipeParser.ts','test/RecipeParser.test.ts'],'role':'Recipe Markdown和原始源码提取：完整frontmatter、文档分段、fenced snippet与source fallback。','finding':'parseAll 把任意非空源码认成空code Recipe，且按所有---切开同一frontmatter；完整多篇被首篇complete捷径吞并。','consumer':['Alembic/lib/http/routes/extract.ts:72','Alembic/lib/http/routes/extract.ts:148','Alembic/lib/injection/modules/AppModule.ts:29','AlembicPlugin/lib/injection/modules/AppModule.ts:30'],'logs':['production-parser-red.log','production-parser-green.log','production-parser-fenced-compat-red.log','production-parser-batch-compat-red.log','production-parser-final-green.log'],'testCount':8},
 {'id':'PROD-009','files':['src/domain/knowledge/recipe-authoring-spec/depthReview.ts','test/RecipeAuthoringDepthReview.test.ts'],'role':'纯函数深度接地判定；用已解析规范来源身份计数并保守处理歧义后缀。','finding':'同一有效文件的短路径/长路径被当作两个来源，虚增multiSourceCorroboration；歧义短路径会被任意接地。','consumer':['src/service/knowledge/validation/quality/QualityScorer.ts:261','AlembicAgent/src/agent/evaluation/qualityGates.ts:356'],'logs':['production-depth-path-red.log','production-depth-path-green.log'],'testCount':11},
 {'id':'PROD-010','files':['src/service/sustain/EnhancementSuggester.ts','test/PublicEvolutionEntrypoints.test.ts'],'role':'从真实KnowledgeEntry/Relations识别已废弃引用，产生治理建议；保持deprecated_by排除语义。','finding':'Relations实例被Object.entries当普通数组桶读取，只见_b所以所有deprecated_reference建议被跳过。','consumer':['Alembic/lib/http/routes/governance.ts:144','Alembic/lib/injection/modules/KnowledgeModule.ts:287','AlembicPlugin/lib/injection/modules/KnowledgeModule.ts:379'],'logs':['production-enhancement-relations-red.log','production-enhancement-relations-green.log'],'testCount':3},
]
for g in groups:
 for f in g['files']:
  text=Path(f).read_text();old=baseline.get(f,{})
  r={'file':f,'reviewDepth':'manual-full','role':g['role'],'findings':[{'id':g['id'],'priority':'P2','title':g['finding'],'status':'implemented-and-targeted-green-pending-root-review','evidence':g['logs']}],'disposition':'fixed-pending-root-review','tests':[{'file':g['files'][1],'status':'passed-targeted','testCount':g['testCount'],'evidence':g['logs']}],'scope':'additional-authorized-review-and-fix','baselineSha256':old.get('sha256'),'baselineLines':old.get('lines',0),'reviewedRanges':[[1,len(text.splitlines())]],'consumerEvidence':{'verifiedConsumers':g['consumer'],'note':'已读实际消费路径；不使用存在性测试替代行为证明。'},'exports':old.get('exports',[]),'functionInventory':[x for x in old.get('functions',[]) if x['name']!='<anonymous>'],'duplicateFunctionGroups':[],'implementationEvidence':g['logs'],'verificationEvidence':['production-secondary-typecheck.log','production-secondary-final-lint.log','production-secondary-green.log'],'stateAndRecoveryNotes':'保持公开DTO/合法输入与失败恢复语义；仅修已复现路径。','reviewLimitation':'本次局部真实入口回归通过，所有diff仍由根线程独立review和最终验证。'}
  if g['id']=='PROD-009':r['stateAndRecoveryNotes']='validRanges是resolver的rangeText源码正文而非坐标；保留该兼容输入，不能据此验证file:line。该点属于接口语义限制，不是已复现/已修复行号缺陷。'
  if f in indexed: rows[rows.index(indexed[f])]=r
  else:rows.append(r)
(p/'production-review.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
summary=(p/'production-findings.md').read_text()
counts=dict(Counter(r['reviewDepth'] for r in rows))
summary=re.sub(r'- reviewDepth：[^\n]+',f'- reviewDepth：{counts}。',summary)
summary=summary.replace('合计：136。','原合计：136；追加授权审查6文件后合计142。')
summary+='''\n## 追加授权审查与修复：Parser / depth / enhancement\n\n- PROD-008：真实 `RecipeParser.extractFromPath/parseFromText/extractFromText/parseAll` 复现源码code丢失和frontmatter误分段。新增聚焦行为套件 `test/RecipeParser.test.ts`（此前只有公开符号存在性检查）。保留单篇完整Recipe对象返回、多篇数组、intro-only、标题+fence、独立fence snippet、批量fence、fence内部---与正文水平线。原始源码恢复完整code供Main extract/path的AI输入使用。6条初始RED，两个兼容补例各先RED后GREEN，最终8/8。\n- PROD-009：`reviewRecipeDepth`返回命中的有效规范文件身份用于去重；多个有效路径都匹配同一短别名时保留未接地结果，不猜证据归属。两条RED后GREEN，含depth guidance和QualityScorer关联验证共23/23。\n- **纠正validRanges语义**：`resolveGroundedSourcePaths`写入的是`resolved.evidence.rangeText`源码正文片段，不是`file:start-end`坐标；现QualityScorer/Agent主要透传validSourcePaths。本轮保留兼容输入并说明限制，没有臆造行号协议，也不把它计作已修复bug。\n- PROD-010：`EnhancementSuggester`用`Relations.from(...).toFlatArray()`读取真实RelationEntry.target，继续排除deprecated_by。公开evolution入口新增真实KnowledgeEntry值对象行为断言，RED→GREEN 3/3，Main governance/enhancements真实路由会消费该结果。\n- 第二组联合验证6 suites/35 tests通过；随后仅增加独立fence批量兼容用例，Parser最终8/8。TypeScript noEmit与6文件Biome通过，git diff --check通过。完整命令/exit/log见checks.jsonl；未跑全量测试、未commit、未修改file-first链的并行任务文件。\n- 按根线程指示，跨仓file-first设计已停止并把实际DI无环、public update禁止lifecycle/stats、reasoning.sources权威位置等结论通知knowledge_lifecycle代理；没有写跨仓产品源码。\n'''
(p/'production-findings.md').write_text(summary)
print({'entries':len(rows),'counts':counts,'secondaryGroups':[g['id'] for g in groups]})
