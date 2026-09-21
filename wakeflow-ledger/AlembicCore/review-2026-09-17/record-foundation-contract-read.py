import json,sys
from pathlib import Path
p=Path('../wakeflow-ledger/AlembicCore/review-2026-09-17/foundation-contracts-review.json')
rows=json.loads(p.read_text())
packet=json.load(sys.stdin)
for update in packet:
 row=next(r for r in rows if r['file']==update['file'])
 ranges=sorted(row.get('reviewedRanges',[])+update['ranges'])
 merged=[]
 for start,end in ranges:
  if merged and start<=merged[-1][1]+1:merged[-1][1]=max(merged[-1][1],end)
  else:merged.append([start,end])
 row['reviewedRanges']=merged
 if update.get('role'):row['role']=update['role']
 if update.get('invariants'):row['invariants']=update['invariants']
 current_lines=len(Path(row['file']).read_text().splitlines())
 full=merged and merged[0][0]==1 and merged[0][1]>=current_lines
 row['reviewDepth']='manual-full' if full else 'manual-partial'
 row.setdefault('semanticReviewNotes',[]).extend(update['notes'])
 if update.get('consumers'):row['consumerEvidence'].setdefault('verifiedConsumers',[]).extend(update['consumers'])
 if not row['findings']:row['disposition']='retain-reviewed' if full else 'retain-pending-deeper-review'
 row['reviewLimitation']='已分段人工阅读全文；保留理由见semanticReviewNotes。只对实际探针/测试声明行为验证，不将阅读等同无缺陷证明。' if full else '已人工检查列明范围与关键链路；其余范围仍待语义阅读。'
p.write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
print([{ 'file':u['file'],'depth':next(r['reviewDepth'] for r in rows if r['file']==u['file'])} for u in packet])
