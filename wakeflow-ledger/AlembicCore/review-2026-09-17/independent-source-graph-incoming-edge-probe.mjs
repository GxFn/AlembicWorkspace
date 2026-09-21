import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL,fileURLToPath } from 'node:url';
import { registerHooks,stripTypeScriptTypes } from 'node:module';
registerHooks({resolve(specifier,context,next){try{return next(specifier,context);}catch(error){if(error.code==='ERR_MODULE_NOT_FOUND'&&specifier.startsWith('.')&&specifier.endsWith('.js')){const candidate=new URL(specifier.slice(0,-3)+'.ts',context.parentURL);if(fs.existsSync(fileURLToPath(candidate)))return{url:candidate.href,shortCircuit:true};}throw error;}},load(url,context,next){if(new URL(url).pathname.endsWith('.ts'))return{format:'module',source:stripTypeScriptTypes(fs.readFileSync(fileURLToPath(url),'utf8'),{mode:'transform'}),shortCircuit:true};return next(url,context);}});
const {openAlembicDatabase}=await import(pathToFileURL(path.join(process.cwd(),'src/database.ts')).href);
const {createAlembicRepositories}=await import(pathToFileURL(path.join(process.cwd(),'src/repositories.ts')).href);
const {SourceGraphService}=await import(pathToFileURL(path.join(process.cwd(),'src/service/source-graph/index.ts')).href);
const {default:pathGuard}=await import(pathToFileURL(path.join(process.cwd(),'src/shared/PathGuard.ts')).href);
const root=fs.mkdtempSync(path.join(os.tmpdir(),'alembic-source-review-'));pathGuard.configure({projectRoot:root,knowledgeBaseDir:'Alembic'});let runtime;
try{
 runtime=await openAlembicDatabase({path:'.asd/alembic.db'});const repo=createAlembicRepositories(runtime.connection).sourceGraphRepository;const service=new SourceGraphService(repo);
 fs.mkdirSync(path.join(root,'src'));fs.writeFileSync(path.join(root,'src/caller.ts'),"import { oldTarget } from './target';\nexport function run() { return oldTarget(); }\n");fs.writeFileSync(path.join(root,'src/target.ts'),'export function oldTarget() { return 1; }\n');
 await service.buildFullIndex({projectRoot:root,repoId:'probe',generationId:'before',now:1000});
 await repo.upsertEdge({generationId:'before',edgeId:'explicit-call',kind:'calls',fromSymbolId:'src/caller.ts#run',toSymbolId:'src/target.ts#oldTarget',fromFilePath:'src/caller.ts',toFilePath:'src/target.ts',siteFilePath:'src/caller.ts',site:{startLine:2,endLine:2,startColumn:0,endColumn:1},provenance:'deterministic',confidence:1});
 fs.writeFileSync(path.join(root,'src/target.ts'),'export function renamedTarget() { return 222; }\n');
 const after=await service.buildIncrementalIndex({projectRoot:root,repoId:'probe',baseGenerationId:'before',generationId:'after',now:2000});
 console.log(JSON.stringify({changed:after.changedFiles,status:after.snapshot.status,symbols:after.symbols.map(s=>s.symbolId),edges:after.edges.map(e=>({id:e.edgeId,kind:e.kind,from:e.fromSymbolId,to:e.toSymbolId})),danglingEdges:after.edges.filter(e=>e.toSymbolId&&!after.symbols.some(s=>s.symbolId===e.toSymbolId)).map(e=>e.edgeId)},null,2));
}finally{runtime?.close();pathGuard._reset();fs.rmSync(root,{recursive:true,force:true});}
