import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { registerHooks, stripTypeScriptTypes } from 'node:module';
const fixturePath=path.join(process.cwd(),'test/StrictFactExecution.test.ts');
registerHooks({
 resolve(specifier,context,next){try{return next(specifier,context);}catch(error){if(error.code==='ERR_MODULE_NOT_FOUND'&&specifier.startsWith('.')&&specifier.endsWith('.js')){const candidate=new URL(specifier.slice(0,-3)+'.ts',context.parentURL);if(fs.existsSync(fileURLToPath(candidate)))return{url:candidate.href,shortCircuit:true};}throw error;}},
 load(url,context,next){if(new URL(url).pathname.endsWith('.ts')){let source=fs.readFileSync(fileURLToPath(url),'utf8');if(fileURLToPath(url)===fixturePath){source=source.replace("import { afterEach, describe, expect, it } from 'vitest';","const afterEach=()=>{}; const describe=()=>{}; const expect=()=>{}; const it=()=>{};");source+='\nexport const reviewFixtures={createStrictArtifact,factFamily,scheduleFor,planningFacts,subjectBindings,witnessBindings,witnessAuthority,AST_QUERY_PACK,roots};\n';}return{format:'module',source:stripTypeScriptTypes(source,{mode:'transform'}),shortCircuit:true};}return next(url,context);}
});
const { reviewFixtures:f }=await import(pathToFileURL(fixturePath).href);
const core=await import(pathToFileURL(path.join(process.cwd(),'src/host-agent-workflows.ts')).href);
const { buildFactQueryCatalogSnapshot }=await import(pathToFileURL(path.join(process.cwd(),'src/plans.ts')).href);
const { hashCanonicalJson }=await import(pathToFileURL(path.join(process.cwd(),'src/projectContextFoundation.ts')).href);
try {
 const artifact=await f.createStrictArtifact();
 const family=f.factFamily();
 const bindings=f.witnessBindings(artifact);
 const [source,target]=bindings;
 const {bindingHash:_old,...semantic}=target;
 const reboundSemantic={...semantic,evidenceEntryId:source.evidenceEntryId,evidenceSessionId:source.evidenceSessionId,evidenceContentHash:source.evidenceContentHash,evidenceEntryHash:source.evidenceEntryHash,evidenceEntry:source.evidenceEntry,evidenceLedgerSnapshotHash:source.evidenceLedgerSnapshotHash};
 const rebound={...reboundSemantic,bindingHash:hashCanonicalJson(reboundSemantic)};
 const result=await core.executeStrictFactScheduleV1({artifact,planningFacts:f.planningFacts(artifact),catalog:buildFactQueryCatalogSnapshot([family]),schedule:f.scheduleFor(family),subjectBindings:f.subjectBindings(artifact),witnessBindings:[source,rebound],witnessAuthority:f.witnessAuthority(artifact),registry:core.createStrictFactBackendRegistryV1([core.createAstFactQueryBackendV1({family,queryPack:f.AST_QUERY_PACK})])});
 const targetFact=result.facts.find(fact=>fact.witnesses.some(w=>w.kind==='direct'&&w.anchor.relativePath===target.relativePath));
 console.log(JSON.stringify({probe:'strict-witness-rebinding',usesExistingCaptureFixture:true,realAstBackend:true,manifestVerdict:result.manifest.verdict,factCount:result.facts.length,expectedEvidenceEntryId:target.evidenceEntryId,actualEvidenceEntryId:targetFact?.witnesses[0]?.evidenceEntryId,targetFile:target.relativePath,reboundEvidenceFile:source.evidenceEntry.file,status:result.manifest.verdict==='passed'&&targetFact?.witnesses[0]?.evidenceEntryId!==target.evidenceEntryId?'RED':'GREEN'},null,2));
} catch(error){console.log(JSON.stringify({probe:'strict-witness-rebinding',rejected:error.message,status:'rejected-needs-classification'},null,2));}
finally{for(const root of f.roots.splice(0))fs.rmSync(root,{recursive:true,force:true});}
