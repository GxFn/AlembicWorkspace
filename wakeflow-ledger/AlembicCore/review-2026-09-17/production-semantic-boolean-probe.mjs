import fs from 'node:fs';
import path from 'node:path';
import { generateKeyPairSync } from 'node:crypto';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { registerHooks, stripTypeScriptTypes } from 'node:module';
const fixturePath=path.join(process.cwd(),'test/SharedHarvestSemanticEvidenceAuthority.test.ts');
registerHooks({
 resolve(specifier,context,next){try{return next(specifier,context);}catch(error){if(error.code==='ERR_MODULE_NOT_FOUND'&&specifier.startsWith('.')&&specifier.endsWith('.js')){const candidate=new URL(specifier.slice(0,-3)+'.ts',context.parentURL);if(fs.existsSync(fileURLToPath(candidate)))return{url:candidate.href,shortCircuit:true};}throw error;}},
 load(url,context,next){if(new URL(url).pathname.endsWith('.ts')){let source=fs.readFileSync(fileURLToPath(url),'utf8');if(fileURLToPath(url)===fixturePath){source=source.replace("import { afterEach, describe, expect, it } from 'vitest';","const afterEach=()=>{}; const describe=()=>{}; const expect=()=>{}; const it=()=>{};");source+='\nexport const reviewFixtures={createCrossHarvestFixture,createSharedHarvestSemanticRequest,passingDecisionV4,roots};\n';}return{format:'module',source:stripTypeScriptTypes(source,{mode:'transform'}),shortCircuit:true};}return next(url,context);}
});
const {reviewFixtures:f}=await import(pathToFileURL(fixturePath).href);
const {createAgentSemanticDispositionReviewDurableGatewayV5}=await import(pathToFileURL(path.join(process.cwd(),'src/host-agent-workflows.ts')).href);
const {hashCanonicalJson}=await import(pathToFileURL(path.join(process.cwd(),'src/projectContextFoundation.ts')).href);
try{
 const fixture=await f.createCrossHarvestFixture();
 const request=f.createSharedHarvestSemanticRequest(fixture);
 const {privateKey}=generateKeyPairSync('ed25519');
 const gateway=createAgentSemanticDispositionReviewDurableGatewayV5({trustRootId:'review-boolean-trust',keyId:'review-boolean-key',privateKey,reviewerHost:{reviewerModelLoadReceipt:request.calibration.reviewerModelLoadReceipt,invoke:async call=>{const decision=f.passingDecisionV4(call.request);decision.evidenceFindings[0].supportsVerdict='false';return{evaluatorRunId:'review-boolean-evaluator',invocationId:'review-boolean-invocation',responseOutput:JSON.stringify(decision),status:'success',toolCallCount:0};}},evidenceStore:{evidenceStoreId:'review-boolean-store',evidenceStoreConfigHash:hashCanonicalJson('review-boolean-store'),load:async call=>({loadOperationId:'review-boolean-load',evidenceEntry:fixture.evidenceEntry,evidenceLedgerSnapshot:fixture.evidenceLedgerSnapshot,witnessBinding:fixture.witnessBinding,semanticRole:call.evidence.semanticRole})}});
 const attestation=await gateway.execute(request);
 console.log(JSON.stringify({probe:'semantic-review-boolean-type',schemaVersion:attestation.schemaVersion,verdict:attestation.execution.decision.verdict,supportsVerdict:attestation.execution.decision.evidenceFindings[0].supportsVerdict,supportType:typeof attestation.execution.decision.evidenceFindings[0].supportsVerdict,status:'RED'},null,2));
}catch(error){console.log(JSON.stringify({probe:'semantic-review-boolean-type',rejected:error.message,status:'rejected-needs-classification'},null,2));}
finally{for(const root of f.roots.splice(0))fs.rmSync(root,{recursive:true,force:true});}
