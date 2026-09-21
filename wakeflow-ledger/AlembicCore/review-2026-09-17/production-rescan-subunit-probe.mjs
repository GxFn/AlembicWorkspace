import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL,fileURLToPath } from 'node:url';
import { registerHooks,stripTypeScriptTypes } from 'node:module';
registerHooks({resolve(specifier,context,next){try{return next(specifier,context);}catch(error){if(error.code==='ERR_MODULE_NOT_FOUND'&&specifier.startsWith('.')&&specifier.endsWith('.js')){const candidate=new URL(specifier.slice(0,-3)+'.ts',context.parentURL);if(fs.existsSync(fileURLToPath(candidate)))return{url:candidate.href,shortCircuit:true};}throw error;}},load(url,context,next){if(new URL(url).pathname.endsWith('.ts'))return{format:'module',source:stripTypeScriptTypes(fs.readFileSync(fileURLToPath(url),'utf8'),{mode:'transform'}),shortCircuit:true};return next(url,context);}});
const {createHostAgentKnowledgeRescanIntent}=await import(pathToFileURL(path.join(process.cwd(),'src/workflows/project-index/KnowledgeRescanIntent.ts')).href);
const result=createHostAgentKnowledgeRescanIntent({maxFiles:0.5,contentMaxLines:'0.5'});
console.log(JSON.stringify({probe:'public-rescan-positive-integer-budget',projectAnalysis:result.projectAnalysis,status:result.projectAnalysis.maxFiles===0?'RED':'GREEN'},null,2));
