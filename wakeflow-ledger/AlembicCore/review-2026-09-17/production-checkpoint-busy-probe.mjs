import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { registerHooks, stripTypeScriptTypes } from 'node:module';
registerHooks({
  resolve(specifier, context, next) {
    try { return next(specifier, context); } catch(error) {
      if (error.code==='ERR_MODULE_NOT_FOUND' && specifier.startsWith('.') && specifier.endsWith('.js')) {
        const candidate=new URL(specifier.slice(0,-3)+'.ts', context.parentURL);
        if(fs.existsSync(fileURLToPath(candidate))) return {url:candidate.href,shortCircuit:true};
      }
      throw error;
    }
  },
  load(url,context,next) {
    if(url.endsWith('.ts'))return {format:'module',source:stripTypeScriptTypes(fs.readFileSync(fileURLToPath(url),'utf8'),{mode:'transform'}),shortCircuit:true};
    return next(url,context);
  }
});
const source=p=>import(pathToFileURL(path.join(process.cwd(),p)).href);
const { WorkspaceResolver }=await source('src/shared/WorkspaceResolver.ts');
const { createProjectDescriptor }=await source('src/shared/ProjectScope.ts');
const { default:pathGuard }=await source('src/shared/PathGuard.ts');
const { hashCanonicalJson, hashBytes }=await source('src/service/project-context/foundation/canonical.ts');
const { readAlembicMigrationBundleManifest }=await source('src/infrastructure/database/DatabaseConnection.ts');
const { openAlembicDatabase }=await source('src/infrastructure/database/openAlembicDatabase.ts');
const { initializePrivateCorpusRevisionV1, openPrivateCorpusRevisionDatabaseV1, createPrivateCorpusRevisionCheckpointV1 }=await source('src/service/production/ProductionPersistenceContracts.ts');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'alembic-checkpoint-busy-review-'));
let runtime,reader,copy;
try {
 pathGuard.configure({projectRoot:root,knowledgeBaseDir:'Alembic'});
 const folderId='review-folder';
 const scope=createProjectDescriptor({controlRoot:path.dirname(root),dataRoot:root,projectId:'review-project',projectScopeId:'review-scope',currentFolderId:folderId,folders:[{id:folderId,path:root}]});
 const resolver=new WorkspaceResolver({projectRoot:root,projectScope:scope,currentFolderId:folderId});
 const context={runId:'review-run',revisionId:'review-revision',analysisFixpointHash:`sha256:${'a'.repeat(64)}`,configReceiptHash:`sha256:${'b'.repeat(64)}`,runtimeReceiptHash:`sha256:${'c'.repeat(64)}`};
 const initialized=await initializePrivateCorpusRevisionV1(resolver,{...context,credentialLocationSymbol:'config-ref:review',acceptedMigrationBundleSemanticHash:hashCanonicalJson(readAlembicMigrationBundleManifest())});
 runtime=initialized.runtime;
 runtime.sqlite.exec('CREATE TABLE review_checkpoint_probe (id INTEGER); INSERT INTO review_checkpoint_probe VALUES (1);');
 runtime.sqlite.pragma('wal_checkpoint(TRUNCATE)');
 reader=await openPrivateCorpusRevisionDatabaseV1(initialized.handle);
 reader.sqlite.exec('BEGIN');
 reader.sqlite.prepare('SELECT COUNT(*) AS count FROM review_checkpoint_probe').get();
 runtime.sqlite.exec('INSERT INTO review_checkpoint_probe VALUES (2)');
 runtime.sqlite.pragma('busy_timeout = 1');
 const before=hashBytes(fs.readFileSync(initialized.handle.resolver.databasePath));
 const checkpoint=createPrivateCorpusRevisionCheckpointV1(initialized.handle,runtime,context);
 const wal=runtime.sqlite.pragma('wal_checkpoint(FULL)');
 const liveRows=runtime.sqlite.prepare('SELECT COUNT(*) AS count FROM review_checkpoint_probe').get().count;
 const copyPath=path.join(root,'.asd','receipt-database-only.db');
 fs.copyFileSync(initialized.handle.resolver.databasePath,copyPath);
 copy=await openAlembicDatabase({path:copyPath},{runMigrations:false});
 const checkpointRows=copy.sqlite.prepare('SELECT COUNT(*) AS count FROM review_checkpoint_probe').get().count;
 console.log(JSON.stringify({probe:'private-revision-busy-checkpoint',receiptIssued:true,wal,mainFileHashUnchanged:before===checkpoint.databaseHash,liveRows,checkpointRows,status:checkpointRows===liveRows?'GREEN':'RED'},null,2));
} finally {
 try { reader?.sqlite.exec('ROLLBACK'); } catch {}
 copy?.close();reader?.close();runtime?.close();fs.rmSync(root,{recursive:true,force:true});
}
