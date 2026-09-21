import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { expect, it } from '../../../AlembicCore/node_modules/vitest/dist/index.js';
import { openAlembicDatabase } from '../../../AlembicCore/src/database.ts';
import { pathGuard } from '../../../AlembicCore/src/io.ts';
import { createAlembicRepositories } from '../../../AlembicCore/src/repositories.ts';
import { SourceGraphService } from '../../../AlembicCore/src/service/source-graph/index.ts';
import { collectJobDisplaySnapshotLlmIoEntries, createJobProcessEvent, createJobDisplaySnapshot, validateJobDisplaySnapshot } from '../../../AlembicCore/src/daemon/index.ts';
import { LanguageProfiles } from '../../../AlembicCore/src/shared/LanguageProfiles.ts';
import { createProjectDescriptor, createCanonicalSourceIdentity, buildProjectScopeSourceRefIndex, resolveProjectScopeSourceRef } from '../../../AlembicCore/src/shared/ProjectScope.ts';

it('RED published import patterns accept valid JVM wildcard imports without throwing', () => {
  const candidates: string[] = [];
  for (const pattern of LanguageProfiles.importPatterns) {
    const match = pattern.regex.exec('import com.example.api.*;');
    if (match) candidates.push(...pattern.extract(match));
  }
  expect(candidates).toContain('api');
});

it('RED same display-name folders cannot silently resolve qualified evidence to the last folder', () => {
  const scope = createProjectDescriptor({ controlRoot: '/workspace', dataRoot: '/runtime/data',
    folders: [{path:'/workspace/apps/common'}, {path:'/workspace/tools/common'}] });
  const identities = scope.folders.map((folder) => createCanonicalSourceIdentity({
    folderDisplayName: folder.displayName, folderId: folder.id, folderPath: folder.path,
    projectRoot: scope.controlRoot.path, projectScopeId: scope.projectScopeId, sourcePath:'src/index.ts',
  }));
  const result = resolveProjectScopeSourceRef('common/src/index.ts', buildProjectScopeSourceRefIndex(identities));
  expect(result.status).toBe('ambiguous');
  expect(result.identity).toBeNull();
});

it('RED replacement DB fault must preserve the previous source graph generation', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'foundation-source-graph-'));
  pathGuard.configure({ projectRoot: root, knowledgeBaseDir: 'Alembic' });
  const runtime = await openAlembicDatabase({ path: path.join(root, '.asd', 'alembic.db') });
  try {
    const { sourceGraphRepository: repo } = createAlembicRepositories(runtime.connection);
    const service = new SourceGraphService(repo);
    const snapshot = { generationId: 'same-generation', projectRoot: root, status: 'indexed' as const };
    const file = (repoRelativePath: string) => ({ generationId: snapshot.generationId, projectRoot: root,
      repoRelativePath, language: 'typescript', contentHash: 'unchanged', sizeBytes: 5, mtimeMs: 1, indexedAt: 1,
      classification: 'source' as const, parseStatus: 'parsed' as const });
    await service.replaceSnapshot({ snapshot, files: [file('src/original.ts')] });
    runtime.connection.getDb().exec(`CREATE TRIGGER reject_second_file BEFORE INSERT ON source_graph_files
      WHEN NEW.repo_relative_path = 'src/failing.ts' BEGIN SELECT RAISE(ABORT, 'injected storage fault'); END;`);
    await expect(service.replaceSnapshot({ snapshot, files: [file('src/replacement.ts'), file('src/failing.ts')] })).rejects.toThrow('injected storage fault');
    expect((await repo.listFiles(snapshot.generationId)).map((node) => node.repoRelativePath)).toEqual(['src/original.ts']);
    expect((await repo.getSnapshot(snapshot.generationId))?.fileCount).toBe(1);
  } finally {
    runtime.close(); pathGuard._reset(); fs.rmSync(root, { recursive: true, force: true });
  }
});

it.skip('DEFERRED: summary-only versus LLM snapshot projection needs a policy decision', () => {
  const event = createJobProcessEvent({ createdAt: '2026-09-18T00:00:00Z', id: 'evt', jobId: 'job',
    kind: 'llm.input', sequence: 1, title: 'Summary-only prompt', summary: 'Safe summary',
    displayPolicy: 'summary-only', content: { text: 'Full details deliberately omitted from developer view' } });
  expect(collectJobDisplaySnapshotLlmIoEntries([event])[0]?.content).toBeNull();
});

it('RED snapshot checksum remains valid after the JSON file persistence boundary', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'foundation-snapshot-'));
  try {
    const event = createJobProcessEvent({ createdAt: '2026-09-18T00:00:00Z', id: 'evt', jobId: 'job',
      kind: 'workflow', sequence: 1, title: 'Progress', metadata: { optionalValues: ['known', undefined] } });
    const createdAt = '2026-09-18T00:00:00Z';
    const snapshot = createJobDisplaySnapshot({ events: [event],
      job: { bootstrapSessionId: null, completedAt: null, createdAt, dataRoot: root, id: 'job', kind: 'bootstrap',
        projectId: null, projectRoot: root, startedAt: null, status: 'running', updatedAt: createdAt },
      producer: { modules: ['probe'], name: 'alembic', producedAt: createdAt, version: null },
      snapshot: { createdAt, jobId: 'job', ref: 'snapshot.json', snapshotId: 'snapshot', snapshotVersion: 1,
        sourceJobUpdatedAt: createdAt, updatedAt: createdAt },
      summary: { title: 'Progress', message: null, phase: null, progress: null, statusText: null } });
    expect(validateJobDisplaySnapshot(snapshot).valid).toBe(true);
    const filePath = path.join(root, 'snapshot.json');
    fs.writeFileSync(filePath, JSON.stringify(snapshot));
    expect(validateJobDisplaySnapshot(JSON.parse(fs.readFileSync(filePath, 'utf8'))).valid).toBe(true);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
