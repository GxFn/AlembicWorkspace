import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const ts=createRequire(path.resolve('package.json'))('typescript');
const reports={};
function canonical(node){
 if(ts.isParenthesizedExpression(node))return canonical(node.expression);
 if(ts.isShorthandPropertyAssignment(node)&&!node.objectAssignmentInitializer&&node.name.text!=='__proto__')return [ts.SyntaxKind.PropertyAssignment,null,[canonical(node.name),canonical(node.name)]];
 const children=[];ts.forEachChild(node,c=>{children.push(canonical(c));});
 return [node.kind,ts.isIdentifier(node)||ts.isStringLiteralLike(node)||ts.isNumericLiteral(node)?node.text:null,children];
}
function scan(files){
 const map=new Map();
 for(const [file,source]of files){
  const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,removeComments:true}}).outputText;
  const ast=ts.createSourceFile(file,js,ts.ScriptTarget.Latest,true);
  function walk(n){
   if(ts.isCallExpression(n)&&ts.isPropertyAccessExpression(n.expression)&&['c','ct'].includes(n.expression.expression.getText(ast))&&['register','singleton'].includes(n.expression.name.text)&&ts.isStringLiteral(n.arguments[0])){
    const key=n.arguments[0].text;
    if(map.has(key))throw new Error('Duplicate registration '+key);
    map.set(key,{file,method:n.expression.name.text,hash:createHash('sha256').update(JSON.stringify(canonical(n))).digest('hex')});
   }ts.forEachChild(n,walk);
  }walk(ast);
 }
 return map;
}
for(const [label,root,base]of [
 ['Main',path.resolve('../.codex-scratch/interface-layering-2026-09-20/Alembic'),'bea42bb'],
 ['Plugin',path.resolve('../AlembicPlugin'),'0f7d203'],
]){
 const oldFiles=['lib/injection/modules/InfraModule.ts','lib/injection/modules/KnowledgeModule.ts'];
 const newFiles=[...oldFiles,'lib/injection/modules/KnowledgeRetrievalModule.ts','lib/injection/modules/KnowledgeEvolutionModule.ts'];
 const before=scan(oldFiles.map(f=>[f,execFileSync('git',['show',base+':'+f],{cwd:root,encoding:'utf8'})]));
 const after=scan(newFiles.map(f=>[f,fs.readFileSync(path.join(root,f),'utf8')]));
 const removed=[...before.keys()].filter(k=>!after.has(k));const added=[...after.keys()].filter(k=>!before.has(k));
 const changed=[...before.keys()].filter(k=>after.has(k)&&before.get(k).hash!==after.get(k).hash);
 reports[label]={baseline:base,registrations:after.size,removed,added,runtimeFactoryChanges:changed,ownership:Object.fromEntries([...after].map(([k,v])=>[k,v.file]))};
 if(removed.length||added.length||changed.some(k=>k!=='searchEngine'))throw new Error(label+': unexpected factory change '+JSON.stringify({removed,added,changed}));
}
const out=new URL('./factory-check.json',import.meta.url);fs.writeFileSync(out,JSON.stringify(reports,null,2)+'\n');
console.log(JSON.stringify(Object.fromEntries(Object.entries(reports).map(([k,r])=>[k,{registrations:r.registrations,removed:r.removed,added:r.added,runtimeFactoryChanges:r.runtimeFactoryChanges}]))));
