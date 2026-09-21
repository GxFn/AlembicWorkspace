// Read-only AST inventory. Run from AlembicCore; source facts, not a deletion authorization.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
const ts=createRequire(path.resolve('package.json'))('typescript');
const workspace=path.dirname(process.cwd());
const report={scope:'tracked production lib/bin/src; test/scripts references counted separately; literal imports only',repositories:{}};
for(const name of ['AlembicCore','Alembic','AlembicPlugin']){
 const root=path.join(workspace,name);
 const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
 const names=execFileSync('git',['ls-files'],{cwd:root,encoding:'utf8'}).trim().split('\n')
  .filter(f=>/\.(?:ts|mts|js|mjs)$/.test(f) && /^(src|lib|bin|test|scripts)\//.test(f));
 const production=f=>f.startsWith(name==='AlembicCore'?'src/':'lib/') || f.startsWith('bin/');
 const tracked=new Set(names);
 const records=[];
 const references=[];
 const computedImports=[];
 function resolveLocal(from,spec){
  let candidate;
  if(spec.startsWith('.'))candidate=path.posix.normalize(path.posix.join(path.posix.dirname(from),spec));
  else if(spec.startsWith('#')){
   for(const [key,value] of Object.entries(pkg.imports??{})){
    const [prefix,suffix='']=key.split('*');
    if((key.includes('*')&&spec.startsWith(prefix)&&spec.endsWith(suffix))||key===spec){
     const target=typeof value==='string'?value:value?.['alembic-dev']??value?.import??value?.default;
     if(typeof target==='string')candidate=target.replace('*',key.includes('*')?spec.slice(prefix.length,suffix? -suffix.length:undefined):'').replace(/^\.\/dist\//,'').replace(/^\.\//,'');
    }
   }
  }
  if(!candidate)return null;
  for(const c of [candidate,candidate.replace(/\.js$/,'.ts'),candidate.replace(/\.mjs$/,'.mts'),`${candidate}/index.ts`])if(tracked.has(c))return c;
  return null;
 }
 for(const file of names){
  const source=fs.readFileSync(path.join(root,file),'utf8');
  const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true);
  const own=[];
  let dynamicNonLiteral=0;
  function visit(node){
   let spec,kind,typeOnly=false;
   if(ts.isImportDeclaration(node)&&ts.isStringLiteral(node.moduleSpecifier)){
    spec=node.moduleSpecifier.text;kind='import';typeOnly=node.importClause?.isTypeOnly??false;
   } else if(ts.isExportDeclaration(node)&&node.moduleSpecifier&&ts.isStringLiteral(node.moduleSpecifier)){
    spec=node.moduleSpecifier.text;kind='re-export';typeOnly=node.isTypeOnly;
   } else if(ts.isCallExpression(node)&&node.expression.kind===ts.SyntaxKind.ImportKeyword){
    if(node.arguments.length&&ts.isStringLiteral(node.arguments[0])){spec=node.arguments[0].text;kind='dynamic-import';}
    else {dynamicNonLiteral++;computedImports.push({file,line:ast.getLineAndCharacterOfPosition(node.getStart(ast)).line+1,expression:node.arguments[0]?.getText(ast),production:production(file)});}
   } else if(ts.isImportTypeNode(node)&&ts.isLiteralTypeNode(node.argument)&&ts.isStringLiteral(node.argument.literal)){
    spec=node.argument.literal.text;kind='type-import';typeOnly=true;
   }
   if(spec){
    const record={file,line:ast.getLineAndCharacterOfPosition(node.getStart(ast)).line+1,specifier:spec,kind,typeOnly,production:production(file)};
    if(spec==='@alembic/core'||spec.startsWith('@alembic/core/'))own.push(record);
    const local=resolveLocal(file,spec);
    if(local)references.push({...record,target:local});
   }
   ts.forEachChild(node,visit);
  }
  visit(ast);
  const statements=ast.statements.filter(s=>!ts.isEmptyStatement(s));
  const pureCoreRelay=statements.length>0&&statements.every(s=>ts.isExportDeclaration(s)&&s.moduleSpecifier&&ts.isStringLiteral(s.moduleSpecifier)&&(s.moduleSpecifier.text==='@alembic/core'||s.moduleSpecifier.text.startsWith('@alembic/core/')));
  records.push({file,production:production(file),lines:source.split('\n').length-1,pureCoreRelay,dynamicNonLiteral,coreReferences:own});
 }
 const prod=records.filter(r=>r.production);
 const relays=prod.filter(r=>r.pureCoreRelay).map(r=>({...r,productionConsumers:[...new Set(references.filter(x=>x.target===r.file&&x.production).map(x=>x.file))],testScriptConsumers:[...new Set(references.filter(x=>x.target===r.file&&!x.production).map(x=>x.file))]}));
 const coreRefs=prod.flatMap(r=>r.coreReferences);
 const bySpecifier={};for(const ref of coreRefs)bySpecifier[ref.specifier]=(bySpecifier[ref.specifier]??0)+1;
 const byArea={};for(const r of prod){const area=r.file.split('/')[1];byArea[area]=(byArea[area]??0)+1;}
 report.repositories[name]={commit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),productionFiles:prod.length,coreReferenceSites:coreRefs.length,coreSpecifiers:Object.keys(bySpecifier).length,bySpecifier,byArea,pureCoreRelayCount:relays.length,relayProductionUsed:relays.filter(r=>r.productionConsumers.length).length,relayTestScriptOnly:relays.filter(r=>!r.productionConsumers.length&&r.testScriptConsumers.length).length,relayNoStaticConsumers:relays.filter(r=>!r.productionConsumers.length&&!r.testScriptConsumers.length).length,relayFiles:relays,coreReferences:coreRefs,computedImports,nonLiteralDynamicImports:prod.reduce((n,r)=>n+r.dynamicNonLiteral,0)};
}
const corePackage=JSON.parse(fs.readFileSync(path.join(workspace,'AlembicCore/package.json'),'utf8'));
const policy=JSON.parse(fs.readFileSync(path.join(workspace,'AlembicCore/config/public-api-boundary.json'),'utf8'));
const exportKeys=Object.keys(corePackage.exports);
report.exportPolicy={exportEntries:exportKeys.length,stable:policy.expectedCounts['stable-public'],provisional:policy.expectedCounts['provisional-public'],transitional:policy.expectedCounts['transitional-internal'],wildcards:exportKeys.filter(k=>k.includes('*')).length};
for(const repo of Object.values(report.repositories)){
 const counts={stable:0,provisional:0,transitional:0,unmapped:0};
 for(const ref of repo.coreReferences){
  const key=ref.specifier==='@alembic/core'?'.':'./'+ref.specifier.slice('@alembic/core/'.length);
  const matched=exportKeys.find(candidate=>{const [prefix,suffix='']=candidate.split('*');return candidate.includes('*')?key.startsWith(prefix)&&key.endsWith(suffix):key===candidate;});
  let status='unmapped';
  for(const [list,label] of [['stablePublicExports','stable'],['provisionalPublicExports','provisional'],['transitionalInternalExports','transitional']])if(policy[list].includes(matched)){status=label;break;}
  if(status==='unmapped'&&matched?.includes('*'))status='transitional';
  ref.matchedExport=matched;ref.apiStatus=status;counts[status]++;
 }
 repo.apiStatusReferenceSites=counts;
}
const out=new URL('./interface-inventory.json',import.meta.url);fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(Object.fromEntries(Object.entries(report.repositories).map(([key,r])=>[key,{productionFiles:r.productionFiles,coreReferenceSites:r.coreReferenceSites,coreSpecifiers:r.coreSpecifiers,pureCoreRelayCount:r.pureCoreRelayCount,relayProductionUsed:r.relayProductionUsed,relayTestScriptOnly:r.relayTestScriptOnly,relayNoStaticConsumers:r.relayNoStaticConsumers,nonLiteralDynamicImports:r.nonLiteralDynamicImports}]))));
