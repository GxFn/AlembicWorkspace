import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL,fileURLToPath } from 'node:url';
import { registerHooks,stripTypeScriptTypes } from 'node:module';
registerHooks({resolve(specifier,context,next){try{return next(specifier,context);}catch(error){if(error.code==='ERR_MODULE_NOT_FOUND'&&specifier.startsWith('.')&&specifier.endsWith('.js')){const candidate=new URL(specifier.slice(0,-3)+'.ts',context.parentURL);if(fs.existsSync(fileURLToPath(candidate)))return{url:candidate.href,shortCircuit:true};}throw error;}},load(url,context,next){if(new URL(url).pathname.endsWith('.ts'))return{format:'module',source:stripTypeScriptTypes(fs.readFileSync(fileURLToPath(url),'utf8'),{mode:'transform'}),shortCircuit:true};return next(url,context);}});
const {openAlembicDatabase}=await import(pathToFileURL(path.join(process.cwd(),'src/database.ts')).href);
const {createAlembicRepositories}=await import(pathToFileURL(path.join(process.cwd(),'src/repositories.ts')).href);
const {KnowledgeEntry}=await import(pathToFileURL(path.join(process.cwd(),'src/domain/knowledge/KnowledgeEntry.ts')).href);
const {ContentPatcher}=await import(pathToFileURL(path.join(process.cwd(),'src/service/sustain/ContentPatcher.ts')).href);
const {KnowledgeFileWriter}=await import(pathToFileURL(path.join(process.cwd(),'src/service/knowledge/KnowledgeFileWriter.ts')).href);
const {default:pathGuard}=await import(pathToFileURL(path.join(process.cwd(),'src/shared/PathGuard.ts')).href);
const root=fs.mkdtempSync(path.join(os.tmpdir(),'alembic-independent-legacy-refs-'));
pathGuard.configure({projectRoot:root,knowledgeBaseDir:'Alembic'});let runtime;
try{
 runtime=await openAlembicDatabase({path:'.asd/alembic.db'});const repos=createAlembicRepositories(runtime.connection);const results=[];
 fs.mkdirSync(path.join(root,'src'));fs.writeFileSync(path.join(root,'src','example.ts'),'export const source = true;\n');
 for(const useWriter of [false,true]){
  const entry=new KnowledgeEntry({id:'legacy-ref-'+useWriter,title:'Legacy bridge '+useWriter,trigger:'@legacy-ref-'+useWriter,lifecycle:'active',category:'architecture',content:{markdown:'Original'}});
  const writer=useWriter?new KnowledgeFileWriter(root):null;if(writer&&!writer.persist(entry))throw new Error('fixture file failed');
  await repos.knowledgeRepository.create(entry);repos.recipeSourceRefRepository.upsert({recipeId:entry.id,sourcePath:'src/example.ts:1',status:'active',verifiedAt:1});
  const before=await repos.knowledgeRepository.findById(entry.id);const refsBefore=repos.recipeSourceRefRepository.findByRecipeId(entry.id).map(row=>row.sourcePath);
  const patcher=new ContentPatcher(repos.knowledgeRepository,repos.recipeSourceRefRepository,{projectRoot:root,...(writer?{fileStore:writer}:{})});
  const result=await patcher.applyProposal({id:'legacy-patch',type:'update',targetRecipeId:entry.id,evidence:[{suggestedChanges:JSON.stringify({patchVersion:1,changes:[{field:'content.markdown',action:'replace',newValue:'Only the prose was edited'}]})}]});
  results.push({useWriter,reasoningSourcesBefore:before.reasoning.sources,refsBefore,patchSucceeded:result.success,patchedFields:result.fieldsPatched,refsAfter:repos.recipeSourceRefRepository.findByRecipeId(entry.id).map(row=>row.sourcePath)});
 }
 console.log(JSON.stringify({probe:'content-only-patch-legacy-bridge-refs',results},null,2));
}finally{runtime?.close();pathGuard._reset();fs.rmSync(root,{recursive:true,force:true});}
