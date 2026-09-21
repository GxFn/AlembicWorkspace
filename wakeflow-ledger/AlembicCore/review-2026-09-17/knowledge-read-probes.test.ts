import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { expect, it } from '../../../AlembicCore/node_modules/vitest/dist/index.js';
import { openAlembicDatabase } from '../../../AlembicCore/src/database.ts';
import { pathGuard } from '../../../AlembicCore/src/io.ts';
import { CodeEntityGraph, KnowledgeEntry, KnowledgeFileWriter, KnowledgeService, SourceRefReconciler } from '../../../AlembicCore/src/knowledge.ts';
import { RecipeImpactPlanner } from '../../../AlembicCore/src/sustain.ts';
import { createAlembicRepositories } from '../../../AlembicCore/src/repositories.ts';

async function fixture(run: (service: KnowledgeService, id: string, repositories: ReturnType<typeof createAlembicRepositories>, root: string) => Promise<void>) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'alembic-knowledge-review-'));
  pathGuard.configure({ projectRoot: root, knowledgeBaseDir: 'Alembic' });
  const runtime = await openAlembicDatabase({ path: path.join(root, '.asd', 'alembic.db') });
  try {
    const repositories = createAlembicRepositories(runtime.connection);
    const service = new KnowledgeService(repositories.knowledgeRepository, { log: async () => {} }, null, null, { fileWriter: new KnowledgeFileWriter(root) });
    const entry = await service.create({ title: 'Review real knowledge mutation', content: { markdown: 'Original content' } }, { userId: 'review' });
    await run(service, entry.id, repositories, root);
  } finally {
    runtime.close(); pathGuard._reset(); fs.rmSync(root, { recursive: true, force: true });
  }
}

it('RED KnowledgeService updates structured content through its real file writer', async () => {
  await fixture(async (service, id) => {
    await service.update(id, { content: { markdown: 'Updated content' } }, { userId: 'review' });
    expect((await service.get(id)).content.markdown).toBe('Updated content');
  });
});

it('RED KnowledgeService updates its whitelisted usageGuide field', async () => {
  await fixture(async (service, id) => {
    await service.update(id, { usageGuide: 'Updated usage guide' }, { userId: 'review' });
    expect((await service.get(id)).usageGuide).toBe('Updated usage guide');
  });
});

it('RED KnowledgeService default adoption increments the persisted counter', async () => {
  await fixture(async (service, id) => {
    await service.incrementUsage(id);
    expect((await service.get(id)).stats.adoptions).toBe(1);
  });
});

it('RED KnowledgeService tag filters match literal underscores', async () => {
  await fixture(async (service, id) => {
    await service.update(id, { tags: ['needs_review'] }, { userId: 'review' });
    const result = await service.list({ tag: 'needs_review' });
    expect(result.data.map((entry) => entry.id)).toEqual([id]);
  });
});


it('RED RecipeImpactPlanner matches line-bounded references to a deleted source file', async () => {
  await fixture(async (service, id, repositories, root) => {
    fs.mkdirSync(path.join(root, 'src'));
    fs.writeFileSync(path.join(root, 'src', 'watched.ts'), 'export const watched = 1;\n');
    await service.update(id, { reasoning: { whyStandard: 'Real source', sources: ['src/watched.ts:1'], confidence: 0.9 } }, { userId: 'review' });
    const reconciler = new SourceRefReconciler(root, repositories.recipeSourceRefRepository, repositories.knowledgeRepository);
    await reconciler.reconcileRecipeSourceRefs(await service.get(id));
    fs.unlinkSync(path.join(root, 'src', 'watched.ts'));
    const plan = await new RecipeImpactPlanner(root, repositories.recipeSourceRefRepository, repositories.knowledgeRepository).plan({ added: [], modified: [], deleted: ['src/watched.ts'] });
    expect(plan.candidates).toEqual(expect.arrayContaining([expect.objectContaining({recipeId:id, reason:'source-deleted'})]));
  });
});

it.skip('WITHDRAWN: edge count contract may count processed entries', async () => {
  await fixture(async (_service, _id, repositories) => {
    const edge = {fromId:'A',fromType:'class',toId:'B',toType:'class',relation:'calls'};
    expect(await repositories.knowledgeEdgeRepository.bulkInsertIgnore([edge, edge])).toBe(1);
  });
});

it('RED graph impact traversal does not repeat diamond nodes', async () => {
  await fixture(async (_service, _id, repositories, root) => {
    for (const [fromId,toId] of [['B','A'],['C','A'],['D','B'],['D','C']]) {
      await repositories.knowledgeEdgeRepository.upsertEdge({fromId,fromType:'class',toId,toType:'class',relation:'calls'});
    }
    const graph = new CodeEntityGraph(repositories.codeEntityRepository, repositories.knowledgeEdgeRepository, {projectRoot:root});
    expect((await graph.getImpactRadius('A', 'class', 3)).map((item)=>item.id)).toEqual(['B','C','D']);
  });
});


it('RED writer keeps another entry when a copied sourceFile points at its file', async () => {
  await fixture(async (service, id, _repositories, root) => {
    const owner = await service.get(id);
    const oldPath = path.join(root, owner.sourceFile!);
    const clone = new KnowledgeEntry({...owner.toJSON(), id:'copy-of-source', title:'New copy', trigger:'@new-copy'});
    expect(service._fileWriter!.persist(clone)).not.toBeNull();
    expect(fs.existsSync(oldPath)).toBe(true);
  });
});

it('RED writer removal refuses a sourceFile owned by a different id', async () => {
  await fixture(async (service, id, _repositories, root) => {
    const owner = await service.get(id);
    const impostor = new KnowledgeEntry({...owner.toJSON(), id:'different-owner'});
    expect(service._fileWriter!.remove(impostor)).toBe(false);
    expect(fs.existsSync(path.join(root, owner.sourceFile!))).toBe(true);
  });
});

it('RED writer id-scan removal does not accept an id prefix', async () => {
  await fixture(async (service, id, _repositories, root) => {
    const owner = await service.get(id);
    const prefix = new KnowledgeEntry({id:id.slice(0,8), title:'Different file', trigger:'@missing-file', sourceFile:null});
    expect(service._fileWriter!.remove(prefix)).toBe(false);
    expect(fs.existsSync(path.join(root, owner.sourceFile!))).toBe(true);
  });
});
