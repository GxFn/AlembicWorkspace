import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL,fileURLToPath } from 'node:url';
import { registerHooks,stripTypeScriptTypes } from 'node:module';
registerHooks({resolve(specifier,context,next){try{return next(specifier,context);}catch(error){if(error.code==='ERR_MODULE_NOT_FOUND'&&specifier.startsWith('.')&&specifier.endsWith('.js')){const candidate=new URL(specifier.slice(0,-3)+'.ts',context.parentURL);if(fs.existsSync(fileURLToPath(candidate)))return{url:candidate.href,shortCircuit:true};}throw error;}},load(url,context,next){if(new URL(url).pathname.endsWith('.ts'))return{format:'module',source:stripTypeScriptTypes(fs.readFileSync(fileURLToPath(url),'utf8'),{mode:'transform'}),shortCircuit:true};return next(url,context);}});
const root=fs.mkdtempSync(path.join(os.tmpdir(),'alembic-independent-knowledge-'));
const {KnowledgeFileWriter,parseKnowledgeMarkdown}=await import(pathToFileURL(path.join(process.cwd(),'src/service/knowledge/KnowledgeFileWriter.ts')).href);
const {KnowledgeEntry}=await import(pathToFileURL(path.join(process.cwd(),'src/domain/knowledge/KnowledgeEntry.ts')).href);
const {default:pathGuard}=await import(pathToFileURL(path.join(process.cwd(),'src/shared/PathGuard.ts')).href);
pathGuard.configure({projectRoot:root,knowledgeBaseDir:'Alembic'});
try{
 const results=[];
 for(const [index,key] of ['id','id ',' id'].entries()){
  const entry=new KnowledgeEntry({id:'legacy-'+index,title:'Legacy owner '+index,trigger:'@legacy-'+index,lifecycle:'active',category:'architecture',content:{markdown:'Original content'}});
  const writer=new KnowledgeFileWriter(root);const file=writer.persist(entry);if(!file)throw new Error('fixture persist failed');
  const prior=fs.readFileSync(file,'utf8');const altered=prior.replace(/^id:/m,key+':');fs.writeFileSync(file,altered);
  const parsed=parseKnowledgeMarkdown(altered);entry.description='Updated description';
  const updated=writer.persist(entry);
  results.push({key,parsedOwner:parsed.id,expectedOwner:entry.id,ownerMatchesParser:parsed.id===entry.id,persistAccepted:updated!==null,oldBytesRetained:fs.readFileSync(file,'utf8')===altered});
 }
 console.log(JSON.stringify({probe:'legacy-frontmatter-owner-compatibility',results},null,2));
}finally{pathGuard._reset();fs.rmSync(root,{recursive:true,force:true});}
