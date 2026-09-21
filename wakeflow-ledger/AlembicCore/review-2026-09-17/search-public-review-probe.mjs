import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL,fileURLToPath } from 'node:url';
import { registerHooks,stripTypeScriptTypes } from 'node:module';
registerHooks({resolve(specifier,context,next){try{return next(specifier,context);}catch(error){if(error.code==='ERR_MODULE_NOT_FOUND'&&specifier.startsWith('.')&&specifier.endsWith('.js')){const candidate=new URL(specifier.slice(0,-3)+'.ts',context.parentURL);if(fs.existsSync(fileURLToPath(candidate)))return{url:candidate.href,shortCircuit:true};}throw error;}},load(url,context,next){if(new URL(url).pathname.endsWith('.ts'))return{format:'module',source:stripTypeScriptTypes(fs.readFileSync(fileURLToPath(url),'utf8'),{mode:'transform'}),shortCircuit:true};return next(url,context);}});
const {FieldWeightedScorer,SearchEngine,HybridCandidateRetriever,KnowledgeTruthProjector,KnowledgeRetrievalPolicy}=await import(pathToFileURL(path.join(process.cwd(),'src/search.ts')).href);
const scorerResults=[];
for(const term of ['factory','constructor']){
 const scorer=new FieldWeightedScorer();scorer.addDocument(term,term,{title:term,tags:[term],description:term});
 scorerResults.push({term,documentCount:scorer.totalDocs,frequencyType:typeof scorer.docFreq[term],results:scorer.search(term)});
}
const {openAlembicDatabase}=await import(pathToFileURL(path.join(process.cwd(),'src/database.ts')).href);
const {createAlembicRepositories}=await import(pathToFileURL(path.join(process.cwd(),'src/repositories.ts')).href);
const {KnowledgeEntry}=await import(pathToFileURL(path.join(process.cwd(),'src/domain/knowledge/KnowledgeEntry.ts')).href);
const {default:pathGuard}=await import(pathToFileURL(path.join(process.cwd(),'src/shared/PathGuard.ts')).href);
const root=fs.mkdtempSync(path.join(os.tmpdir(),'alembic-search-review-'));pathGuard.configure({projectRoot:root,knowledgeBaseDir:'Alembic'});let runtime;
try{
 runtime=await openAlembicDatabase({path:'.asd/alembic.db'});const repos=createAlembicRepositories(runtime.connection);
 for(const term of ['factory','constructor'])await repos.knowledgeRepository.create(new KnowledgeEntry({id:term,title:term,trigger:'@'+term,lifecycle:'active',category:'architecture',tags:[term],content:{markdown:term+' injection pattern'}}));
 const engine=new SearchEngine(runtime.connection);const searchResults=[];
 for(const term of ['factory','constructor'])for(const mode of ['weighted','auto','keyword']){const r=await engine.search(term,{mode,rank:false});searchResults.push({term,mode,ids:r.items.map(i=>i.id),actualMode:r.mode});}
 const laneResults=[];
 for(const syncFailure of [false,true]){
  const sparse=syncFailure?()=>{throw new Error('sparse offline');}:async()=>{throw new Error('sparse offline');};
  const retriever=new HybridCandidateRetriever({embedding:{embedQuery:async()=>[1,0]},reader:{searchVector:async()=>[{item:{id:'live-recipe'},score:0.9}]},sparse});
  const projector=new KnowledgeTruthProjector({findByIds:ids=>ids.map(id=>({id,lifecycle:'active'}))});
  try{const r=await new KnowledgeRetrievalPolicy(retriever,projector).retrieve({query:'find recipe',topK:1});laneResults.push({syncFailure,threw:false,ids:r.candidates.map(c=>c.recipeId),diagnostics:r.diagnostics});}catch(error){laneResults.push({syncFailure,threw:true,message:error.message});}
 }
 console.log(JSON.stringify({scorerResults,searchResults,laneResults},null,2));
}finally{runtime?.close();pathGuard._reset();fs.rmSync(root,{recursive:true,force:true});}
