import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL,fileURLToPath } from 'node:url';
import { registerHooks,stripTypeScriptTypes } from 'node:module';
registerHooks({resolve(specifier,context,next){try{return next(specifier,context);}catch(error){if(error.code==='ERR_MODULE_NOT_FOUND'&&specifier.startsWith('.')&&specifier.endsWith('.js')){const candidate=new URL(specifier.slice(0,-3)+'.ts',context.parentURL);if(fs.existsSync(fileURLToPath(candidate)))return{url:candidate.href,shortCircuit:true};}throw error;}},load(url,context,next){if(new URL(url).pathname.endsWith('.ts'))return{format:'module',source:stripTypeScriptTypes(fs.readFileSync(fileURLToPath(url),'utf8'),{mode:'transform'}),shortCircuit:true};return next(url,context);}});
const {openAlembicDatabase}=await import(pathToFileURL(path.join(process.cwd(),'src/database.ts')).href);
const {createAlembicRepositories}=await import(pathToFileURL(path.join(process.cwd(),'src/repositories.ts')).href);
const {createSearchEngine}=await import(pathToFileURL(path.join(process.cwd(),'src/search.ts')).href);
const {default:pathGuard}=await import(pathToFileURL(path.join(process.cwd(),'src/shared/PathGuard.ts')).href);
const root=fs.mkdtempSync(path.join(os.tmpdir(),'alembic-search-types-'));pathGuard.configure({projectRoot:root,knowledgeBaseDir:'Alembic'});let runtime;
try{
 runtime=await openAlembicDatabase({path:'.asd/alembic.db'});const repos=createAlembicRepositories(runtime.connection);
 runtime.sqlite.prepare("INSERT INTO knowledge_entries (id,title,content,kind,knowledgeType,lifecycle,createdAt,updatedAt) VALUES ('factory-recipe','Factory injection','{}','pattern','code-pattern','active',1800000000,1800000000)").run();
 const results=[];
 for(const adapter of ['raw','repository']){
  const engine=createSearchEngine(runtime.sqlite,adapter==='repository'?{knowledgeRepo:repos.knowledgeRepository}:{});
  for(const type of ['all','knowledge','recipe','solution'])for(const mode of ['weighted','auto','keyword']){
   const response=await engine.search('Factory',{type,mode,rank:false});results.push({adapter,type,mode,ids:response.items.map(r=>r.id)});
  }
 }
 console.log(JSON.stringify({results},null,2));
}finally{runtime?.close();pathGuard._reset();fs.rmSync(root,{recursive:true,force:true});}
