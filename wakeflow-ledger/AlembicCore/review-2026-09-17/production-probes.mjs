import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { registerHooks, stripTypeScriptTypes } from 'node:module';
process.env.ALEMBIC_QUIET = '1';
registerHooks({
  resolve(specifier, context, nextResolve) {
    try { return nextResolve(specifier, context); }
    catch (error) {
      if (error.code === 'ERR_MODULE_NOT_FOUND' && specifier.startsWith('.') && specifier.endsWith('.js')) {
        const target = new URL(specifier.slice(0,-3)+'.ts', context.parentURL);
        if (fs.existsSync(fileURLToPath(target))) return {url:target.href,shortCircuit:true};
      }
      throw error;
    }
  },
  load(url, context, nextLoad) {
    if(url.endsWith('.ts')) return {format:'module',source:stripTypeScriptTypes(fs.readFileSync(fileURLToPath(url),'utf8'),{mode:'transform'}),shortCircuit:true};
    return nextLoad(url,context);
  }
});
const root = process.cwd();
const load = p=>import(pathToFileURL(path.join(root,p)).href);
const { GenerateSessionManager, GenerateSession } = await load('src/workflows/surfaces/host-agent/session/GenerateSession.ts');
const { saveDimensionCheckpoint, loadDimensionCheckpoints } = await load('src/workflows/surfaces/persistence/DimensionCheckpoint.ts');
const { persistWorkflowResult } = await load('src/workflows/surfaces/persistence/WorkflowResultPersistence.ts');
const { MiningSessionStore } = await load('src/workflows/surfaces/host-agent/session/MiningSessionStore.ts');
const dimensions = [{id:'architecture',label:'Architecture',guide:'Review architecture'}, {id:'quality',label:'Quality',guide:'Review quality'}];
const temp = fs.mkdtempSync(path.join(os.tmpdir(),'alembic-review-production-'));
const results=[];
try {
 const leaseRoot=path.join(temp,'lease');
 const manager=new GenerateSessionManager({dataRoot:leaseRoot});
 const projectRoot=path.join(temp,'project');
 const active=manager.createSession({projectRoot,dimensions});
 let leaseRefused=false;
 try { manager.createSession({projectRoot,dimensions}); } catch(e) {leaseRefused=e.name==='GenerateSessionLeaseError';}
 active.markDimensionComplete('architecture',{analysisText:'Architecture analysis',referencedFiles:['src/main.ts']});
 const fresh=new GenerateSessionManager({dataRoot:leaseRoot}).getSession(active.id);
 results.push({id:'PROD-001',leaseRefused,expectedCompleted:1,actualCompleted:fresh.getProgress().completed,originalCompleted:active.getProgress().completed,status:fresh.getProgress().completed===1?'GREEN':'RED'});
 const checkpointRoot=path.join(temp,'checkpoint');
 await saveDimensionCheckpoint(checkpointRoot,'s','architecture',{analysisText:'recoverable'});
 const output=await persistWorkflowResult({ctx:{container:{get:()=>({})}},dataRoot:checkpointRoot,projectRoot,projectInfo:{name:'probe',fileCount:0,lang:'typescript'},sessionId:'s',allFiles:[],sessionStore:new MiningSessionStore(),dimensionStats:{},candidateResults:{created:0,failed:0,errors:[]},skillResults:{created:0,failed:0},consolidationResult:null,skippedDims:[],incrementalSkippedDims:[],enableParallel:false,concurrency:1,startedAtMs:Date.now(),createFileDiffPlanner:()=>({saveSnapshot(){throw new Error('injected snapshot failure')}})});
 const checkpoints=await loadDimensionCheckpoints(checkpointRoot);
 results.push({id:'PROD-002',snapshotStatus:output.snapshot.status,expectedCheckpointRetained:true,actualCheckpointRetained:checkpoints.has('architecture'),status:checkpoints.has('architecture')?'GREEN':'RED'});
 const unknown=new GenerateSession({projectRoot,dimensions:[dimensions[0]]});
 unknown.markDimensionComplete('unknown',{analysisText:'Unknown dimension'});
 results.push({id:'PROD-003',expectedComplete:false,actualComplete:unknown.isComplete,remaining:unknown.getProgress().remainingDimIds,status:unknown.isComplete?'RED':'GREEN'});
} finally { fs.rmSync(temp,{recursive:true,force:true}); }
console.log(JSON.stringify({probe:'production-review',results},null,2));
