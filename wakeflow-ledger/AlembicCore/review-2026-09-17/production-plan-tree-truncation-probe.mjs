import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL,fileURLToPath } from 'node:url';
import { registerHooks,stripTypeScriptTypes } from 'node:module';
registerHooks({resolve(specifier,context,next){try{return next(specifier,context);}catch(error){if(error.code==='ERR_MODULE_NOT_FOUND'&&specifier.startsWith('.')&&specifier.endsWith('.js')){const candidate=new URL(specifier.slice(0,-3)+'.ts',context.parentURL);if(fs.existsSync(fileURLToPath(candidate)))return{url:candidate.href,shortCircuit:true};}throw error;}},load(url,context,next){if(new URL(url).pathname.endsWith('.ts'))return{format:'module',source:stripTypeScriptTypes(fs.readFileSync(fileURLToPath(url),'utf8'),{mode:'transform'}),shortCircuit:true};return next(url,context);}});
const {buildPlanFactsProjection}=await import(pathToFileURL(path.join(process.cwd(),'src/service/plan/facts/projectInfoTree.ts')).href);
const root=fs.mkdtempSync(path.join(os.tmpdir(),'alembic-plan-tree-truncation-'));
try{
 const filePath='src/main.ts';
 const analysis={contextStatus:'complete',dimensions:[],envelopes:[],factSource:'project-context',fileCount:1,frameworks:[],moduleCount:1,moduleSeeds:[{moduleName:'source',modulePath:'src',ownedFiles:[filePath]}],presenterInput:{modules:[],map:null,files:[{filePath,language:'typescript',lineCount:1}],fileSymbols:[{file:{filePath},symbols:[{filePath,name:'largeSignature',kind:'function',signature:'veryLongType'.repeat(500)}]}]},primaryLanguage:'typescript',projectType:'library',requestKinds:['file-symbols'],secondaryLanguages:[],sourceFileFacts:[{filePath,language:'typescript',sizeBytes:9000}],understandingGaps:[]};
 const projection=await buildPlanFactsProjection(analysis,{budgetBytes:2000,scope:{projectRoot:root}});
 const tree=projection.projectInfoTree;
 console.log(JSON.stringify({probe:'plan-tree-truncation-after-externalization',omitted:tree.meta.omitted,truncated:tree.meta.truncated,fullTreeRefExists:!!tree.meta.fullTreeRef&&fs.existsSync(tree.meta.fullTreeRef.path),bytes:Buffer.byteLength(JSON.stringify(tree)),budget:tree.meta.budgetBytes,status:Object.keys(tree.meta.omitted).length&&!tree.meta.truncated?'RED':'GREEN'},null,2));
}finally{fs.rmSync(root,{recursive:true,force:true});}
