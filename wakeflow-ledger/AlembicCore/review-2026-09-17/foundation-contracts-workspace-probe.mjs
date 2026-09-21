import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL,fileURLToPath } from 'node:url';
import { registerHooks,stripTypeScriptTypes } from 'node:module';
registerHooks({resolve(specifier,context,next){try{return next(specifier,context);}catch(error){if(error.code==='ERR_MODULE_NOT_FOUND'&&specifier.startsWith('.')&&specifier.endsWith('.js')){const candidate=new URL(specifier.slice(0,-3)+'.ts',context.parentURL);if(fs.existsSync(fileURLToPath(candidate)))return{url:candidate.href,shortCircuit:true};}throw error;}},load(url,context,next){if(new URL(url).pathname.endsWith('.ts'))return{format:'module',source:stripTypeScriptTypes(fs.readFileSync(fileURLToPath(url),'utf8'),{mode:'transform'}),shortCircuit:true};return next(url,context);}});
const {WorkspaceResolver}=await import(pathToFileURL(path.join(process.cwd(),'src/shared/WorkspaceResolver.ts')).href);
const resolver=new WorkspaceResolver({projectRoot:'/tmp/foundation-contract-readonly',folderNames:{project:{context:'custom-context'}}});
console.log(JSON.stringify({probe:'workspace-context-override',contextDir:resolver.contextDir,memoryEmbeddingsPath:resolver.memoryEmbeddingsPath,pathUsesResolvedContext:resolver.memoryEmbeddingsPath.startsWith(resolver.contextDir+'/')},null,2));
