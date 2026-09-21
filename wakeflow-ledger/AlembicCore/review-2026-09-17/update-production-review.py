import json
from pathlib import Path
from collections import Counter
p=Path('../wakeflow-ledger/AlembicCore/review-2026-09-17')
rows=json.loads((p/'production-review.json').read_text())
lookup={x['file']:x for x in rows}
ranges={
 'test/ColdStartProductionPlanCompiler.test.ts':[[238,366]],
 'test/ProductionPersistenceContracts.test.ts':[[585,743],[936,1013]],
 'test/StrictAnalysisProductionContracts.test.ts':[[36,181],[376,446]],
 'test/StrictDispositionReviewExecutionAuthority.test.ts':[[239,415],[566,696]],
 'test/StrictFactExecution.test.ts':[[118,239],[399,478]],
 'test/StrictSemanticEvidenceAuthority.test.ts':[[410,448],[1184,1248]],
 'src/service/production/SemanticDispositionReviewExecution.ts':[[256,458],[1566,1720],[2153,2261],[2641,2703]],
 'src/service/production/StrictAnalysisContracts.ts':[[892,1072],[1609,1700]],
 'src/service/production/StrictProductionAuthority.ts':[[309,523],[808,912],[1903,2019],[2680,2712],[2740,2847]],
}
for f,rr in ranges.items():
 row=lookup[f];row['reviewDepth']='manual-partial';row['reviewedRanges']=rr
 row['reviewLimitation']='列明范围已人工检查行为/失败/谱系；其他函数保留静态审查，不宣称完整逐行安全审计。'
 if '/test/' in '/'+f: row['stateAndRecoveryNotes']='人工核对代表性正例与重算hash/错误分母/独立评审/恢复谱系反例；这些测试独立保护不同authority，未证明整套冗余。'
modified=['src/shared/similarity.ts','src/shared/index.ts','src/domain/similarity/RecipeSimilarity.ts','src/service/bootstrap/GenerateDedup.ts','src/workflows/surfaces/persistence/FileDiffSnapshotStore.ts','test/FileDiffSnapshotStore.test.ts','test/unit/GenerateDedup.test.ts']
allfiles={x['file']:x for x in json.loads((p/'inventory.json').read_text())}
for f in modified:
 if f not in lookup:
  item=allfiles[f];row={k:item[k] for k in ['file']};row.update({'reviewDepth':'manual-full' if f.endswith('/similarity.ts') else 'manual-partial','role':'Jaccard内部叶算法与公开门面保持，RecipeSimilarity业务权重不变。','findings':[],'disposition':'refactor-reviewed-uncommitted','tests':[],'scope':'additional-shared-refactor','baselineSha256':item['sha256'],'baselineLines':item['lines'],'reviewedRanges':[[1,item['lines']]] if f.endswith('/similarity.ts') else ([[240,355]] if 'RecipeSimilarity' in f else [[69,86]]),'consumerEvidence':{'note':'GenerateDedup 与 RecipeSimilarity 两个真实消费者统一内部ngram实现，shared门面继续仅导出原有4个similarity符号。'},'exports':item['exports'],'functionInventory':[x for x in item['functions'] if x['name']!='<anonymous>'],'duplicateFunctionGroups':[],'stateAndRecoveryNotes':'纯函数抽取保持大小写、标点、空字符串、n=3短文本与上层权重契约。','reviewLimitation':'只对所列范围和本次diff负责，不声称对该模块其他行为全面验证。'})
  rows.append(row);lookup[f]=row
 row=lookup[f];row['disposition']='fixed-or-refactored-pending-root-review';row['implementationEvidence']=['production-file-diff-red.log','production-file-diff-green.log'] if 'FileDiff' in f else ['production-dedup-red.log','production-dedup-green.log','production-ngram-baseline.log','production-ngram-green.log'];row['verificationEvidence']=['production-typecheck.log','production-scoped-lint.log','production-layer-contract.log','production-public-boundary.log'];
 for finding in row['findings']:
  if finding['id'] in ['PROD-004','PROD-005','PROD-007']: finding['status']='implemented-and-targeted-green-pending-root-review'
 if f.startswith('test/'):
  for t in row['tests']:t['status']='passed-targeted';t['log']='production-ngram-green.log'
(p/'production-review.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
counts=dict(Counter(x['reviewDepth'] for x in rows))
summary=(p/'production-findings.md').read_text()
summary=summary.replace('未修改产品源码、测试、exports 或 Wakeflow 状态，未提交。只写本目录报告/最小探针；已运行的探针使用真实源码入口，所有可变数据在独立临时目录，运行后清理；未运行全量测试。','初始只读审查后，根线程明确授权了 FileDiff/Dedup 修复与 ngram 内部复用。当前仅修改下述7个 Core 文件，未更改 Wakeflow 状态、未提交；全部 diff 交根线程独立 review。已运行最小复现及有界测试/类型/边界检查，未运行全量测试。')
summary=summary.replace('- 分配文件：124；额外测试：9；合计：133。',f'- 分配文件：124；额外测试：9；另有3个共享算法/门面改动审查；合计：{len(rows)}。')
import re
summary=re.sub(r'- reviewDepth：[^\n]+',f'- reviewDepth：{counts}。',summary)
summary+='''\n## 根线程后续授权的修复/复用输入\n\n- `FileDiffSnapshotStore.ts` 与对应测试：save/computeDiff 同用 `content ?? disk`；显式空扫描内容保持空。两条真实 SQLite+磁盘回归先 RED(2失败) 后 GREEN(7/7)。\n- `GenerateDedup.ts` 与对应测试：最高分比较使用 raw score，仅返回 DTO 时两位小数；guard 权重测试改为无条件断言。排序回归先 RED(1失败) 后 GREEN(12/12)。\n- `RecipeSimilarity.ts`、`shared/similarity.ts`、`shared/index.ts`：两个重复 ngram 算法统一到内部 helper；门面使用原有4个具名导出防止暴露新 helper；上层分词、大小写、标点与权重不变。行为保持 baseline 4 suites/23 tests；最终5 suites/30 tests通过。\n- 类型检查、7文件 Biome、layer contract、public API boundary 均通过。公开面仍68项(31 stable/8 provisional/29 transitional)。日志由 run-check.py 写入同目录，checks.jsonl 可追溯命令/exit code。\n- PROD-004/005/007 已实现并 targeted GREEN；PROD-001/002/003 根线程处理。PROD-006 仍仅为静态输入边界观察，未新增修复范围。\n- 本代理没有新增或删除测试文件、没有扩大公共符号、没有提交。现有跨仓/全量验证以根线程最终检查为准。\n'''
(p/'production-findings.md').write_text(summary)
print({'entries':len(rows),'counts':counts,'modified':modified})
