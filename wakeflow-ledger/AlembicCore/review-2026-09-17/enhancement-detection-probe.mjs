import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL,fileURLToPath } from 'node:url';
import { registerHooks,stripTypeScriptTypes } from 'node:module';
registerHooks({resolve(specifier,context,next){try{return next(specifier,context);}catch(error){if(error.code==='ERR_MODULE_NOT_FOUND'&&specifier.startsWith('.')&&specifier.endsWith('.js')){const candidate=new URL(specifier.slice(0,-3)+'.ts',context.parentURL);if(fs.existsSync(fileURLToPath(candidate)))return{url:candidate.href,shortCircuit:true};}throw error;}},load(url,context,next){if(new URL(url).pathname.endsWith('.ts'))return{format:'module',source:stripTypeScriptTypes(fs.readFileSync(fileURLToPath(url),'utf8'),{mode:'transform'}),shortCircuit:true};return next(url,context);}});
const {detectProjectFrameworks}=await import(pathToFileURL(path.join(process.cwd(),'src/core/enhancement/detectFrameworks.ts')).href);
const root=fs.mkdtempSync(path.join(os.tmpdir(),'alembic-enhancement-readonly-'));
try {
 const single=path.join(root,'single'),block=path.join(root,'block'),nullNode=path.join(root,'null-node');
 for(const dir of [single,block,nullNode])fs.mkdirSync(dir);
 fs.writeFileSync(path.join(single,'go.mod'),'module demo\n\ngo 1.23\n\nrequire google.golang.org/grpc v1.70.0\n');
 fs.writeFileSync(path.join(block,'go.mod'),'module demo\n\ngo 1.23\n\nrequire (\n google.golang.org/grpc v1.70.0\n)\n');
 fs.writeFileSync(path.join(nullNode,'package.json'),'null');
 fs.writeFileSync(path.join(nullNode,'requirements.txt'),'fastapi==0.100.0\n');
 let nullResult;try{nullResult={result:await detectProjectFrameworks(nullNode)};}catch(error){nullResult={error:error.message};}
 console.log(JSON.stringify({singleRequire:await detectProjectFrameworks(single),blockRequire:await detectProjectFrameworks(block),nullPackage:nullResult},null,2));
}finally{fs.rmSync(root,{recursive:true,force:true});}
