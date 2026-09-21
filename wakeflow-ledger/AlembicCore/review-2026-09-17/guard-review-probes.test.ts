import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { expect, it, vi } from '../../../AlembicCore/node_modules/vitest/dist/index.js';
import { openAlembicDatabase } from '../../../AlembicCore/src/database.ts';
import { pathGuard } from '../../../AlembicCore/src/io.ts';
import { createAlembicRepositories } from '../../../AlembicCore/src/repositories.ts';
import { KnowledgeEntry, KnowledgeFileWriter, KnowledgeSyncService } from '../../../AlembicCore/src/knowledge.ts';
import { GuardService, ViolationsStore } from '../../../AlembicCore/src/guard.ts';

async function fixture(run: (runtime: Awaited<ReturnType<typeof openAlembicDatabase>>, root: string) => Promise<void>) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'alembic-guard-review-'));
  pathGuard.configure({projectRoot:root, knowledgeBaseDir:'Alembic'});
  const runtime = await openAlembicDatabase({path:path.join(root,'.asd','alembic.db')});
  try { await run(runtime,root); }
  finally {runtime.close();pathGuard._reset();fs.rmSync(root,{recursive:true,force:true});}
}

it('RED clearing one rule must retain unrelated violation runs', async () => {
  await fixture(async(runtime)=>{
    const store = new ViolationsStore(runtime.sqlite, runtime.connection.getDrizzle());
    store.appendRun({filePath:'a.ts',violations:[{ruleId:'r1',severity:'warning',line:1}]});
    store.appendRun({filePath:'b.ts',violations:[{ruleId:'r2',severity:'warning',line:1}]});
    await store.clear({ruleId:'r1'});
    expect(store.getRuns().map(run=>run.filePath)).toEqual(['b.ts']);
  });
});

it('RED disabling a real persisted Guard rule survives knowledge sync', async () => {
  await fixture(async(runtime,root)=>{
    const {knowledgeRepository:repo}=createAlembicRepositories(runtime.connection);
    const entry=new KnowledgeEntry({title:'Persisted Guard rule',lifecycle:'active',kind:'rule',knowledgeType:'boundary-constraint',
      content:{markdown:'Do not use BAD.'},constraints:{guards:[{pattern:'BAD',message:'Do not use BAD.',severity:'warning'}]}});
    expect(new KnowledgeFileWriter(root).persist(entry)).not.toBeNull();
    await repo.create(entry);
    const guard=new GuardService(repo as never,{log:async()=>{}},null);
    await guard.disableRule(entry.id,'Disabled by reviewer',{userId:'reviewer'});
    expect((await repo.findById(entry.id))?.lifecycle).toBe('deprecated');
    await new KnowledgeSyncService(root).syncAll(runtime.sqlite);
    expect((await repo.findById(entry.id))?.lifecycle).toBe('deprecated');
  });
});

it('RED DB-only Guard reports actual newline-based violation positions', async () => {
  await fixture(async(runtime)=>{
    const {knowledgeRepository:repo}=createAlembicRepositories(runtime.connection);
    await repo.create(new KnowledgeEntry({title:'Line rule',lifecycle:'active',kind:'rule',knowledgeType:'boundary-constraint',
      language:'javascript',content:{markdown:'Do not use BAD.'},constraints:{guards:[{pattern:'BAD'}]}}));
    const matches=await new GuardService(repo as never,{log:async()=>{}},null).checkCode('first\nsecond\nBAD',{language:'javascript'});
    expect(matches[0]?.matches?.[0]?.line).toBe(3);
  });
});

it('RED same-second repeat compares with the latest violation run', async () => {
  vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(1_800_000_000_500);
  try { await fixture(async(runtime)=>{
    const store=new ViolationsStore(runtime.sqlite,runtime.connection.getDrizzle());
    store.appendRun({filePath:'a.ts',violations:[{ruleId:'a',line:1}]});
    const latest=store.appendRun({filePath:'a.ts',violations:[{ruleId:'b',line:2}]});
    const repeat=store.appendRun({filePath:'a.ts',violations:[{ruleId:'b',line:2}]});
    expect(repeat).toBe(latest);
    expect(store.getRunsByFile('a.ts')).toHaveLength(2);
  }); } finally {vi.useRealTimers();}
});

it('RED the supported AST rule shape can be created without a redundant regex pattern', async () => {
  await fixture(async(runtime)=>{
    const {knowledgeRepository:repo}=createAlembicRepositories(runtime.connection);
    const guard=new GuardService(repo as never,{log:async()=>{}},null);
    const created=await guard.createRule({name:'AST-only rule',description:'Unsafe calls require Safe wrapper.',type:'ast',
      astQuery:{queryType:'mustCallThrough',params:{targetAPI:'unsafeCall',wrapperClass:'Safe'}},languages:['typescript']},{userId:'reviewer'});
    expect(await repo.findById(created.id)).not.toBeNull();
  });
});
