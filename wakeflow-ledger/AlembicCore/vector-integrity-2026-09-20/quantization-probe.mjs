/**
 * Reproduce only the quantization findings against immutable Core 9e8d033.
 * Usage: Node >=22.15 quantization-probe.mjs [Core root] [revision]
 * No product changes, dependency installs, network, service, or Vitest.
 * Temporary files are removed; prototype observers delegate without changing results.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { createRequire, registerHooks } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const coreRoot = path.resolve(process.argv[2] ?? fileURLToPath(new URL('../../../AlembicCore/', import.meta.url)));
const revision = process.argv[3] ?? '9e8d033';
const ts = createRequire(path.join(coreRoot, 'package.json'))('typescript');
const git = (...args) => execFileSync('git', args, { cwd: coreRoot, encoding: 'utf8' });
const compile = source => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const sourceCache = new Map();
function pinnedSource(relative) {
  if (!sourceCache.has(relative)) sourceCache.set(relative, git('show', `${revision}:${relative}`));
  return sourceCache.get(relative);
}
process.env.ALEMBIC_QUIET = '1';
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('file:') || (specifier.startsWith('.') && context.parentURL?.startsWith('file:'))) {
      const url = new URL(specifier, context.parentURL);
      if (url.pathname.endsWith('.js') && !fs.existsSync(fileURLToPath(url))) {
        url.pathname = `${url.pathname.slice(0, -3)}.ts`;
        if (fs.existsSync(fileURLToPath(url))) return { url: url.href, shortCircuit: true };
      }
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.startsWith('file:') && url.endsWith('.ts')) {
      const filename = fileURLToPath(url);
      const relative = path.relative(coreRoot, filename);
      const source = relative.startsWith('src/') ? pinnedSource(relative) : fs.readFileSync(filename, 'utf8');
      return { format: 'module', source: compile(source), shortCircuit: true };
    }
    return next(url, context);
  },
});

const load = relative => import(pathToFileURL(path.join(coreRoot, relative)).href);
const { HnswVectorAdapter } = await load('src/infrastructure/vector/HnswVectorAdapter.ts');
const { ScalarQuantizer } = await load('src/infrastructure/vector/ScalarQuantizer.ts');
const { HnswIndex } = await load('src/infrastructure/vector/HnswIndex.ts');
const { BinaryPersistence } = await load('src/infrastructure/vector/BinaryPersistence.ts');
const pathGuard = (await load('src/shared/PathGuard.ts')).default;
(await load('src/infrastructure/logging/Logger.ts')).default.getInstance().silent = true;

let seed = 12345;
const originalRandom = Math.random;
Math.random = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};
const vectors = Array.from({ length: 128 }, (_, index) => {
  const values = [Math.cos(index * 0.31), Math.sin(index * 0.31), Math.sin(index * 0.73), 0.4 + Math.cos(index * 0.17)];
  const norm = Math.hypot(...values);
  return new Float32Array(values.map(value => value / norm));
});
const items = vectors.map((vector, index) => ({ id: `v${index}`, content: `point ${index}`, vector, metadata: {} }));
const queryIndices = [0, 7, 31, 63, 95, 127];
const options = { M: 8, efConstruct: 40, efSearch: 16, quantize: 'sq8', quantizeThreshold: 64, walEnabled: false, flushIntervalMs: 1000000 };
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'quantization-review-'));
pathGuard.configure({ projectRoot: scratch, knowledgeBaseDir: 'Alembic' });
const opened = [];
let snapshots = [];
const rebuild = HnswIndex.prototype.setQuantizedVectors;
HnswIndex.prototype.setQuantizedVectors = function (quantizer) {
  rebuild.call(this, quantizer);
  snapshots.push(this.nodes.filter(Boolean).map(node => ({ id: node.id, q: Array.from(node.qvector) })));
};
const distance = ScalarQuantizer.prototype.distance;
let distanceCalls = 0;
let nonFiniteCalls = 0;
let quantizerDimensions = new Set();
ScalarQuantizer.prototype.distance = function (a, b) {
  distanceCalls++;
  quantizerDimensions.add(this.dimension);
  const result = distance.call(this, a, b);
  if (!Number.isFinite(result)) nonFiniteCalls++;
  return result;
};
function resetDistanceStats() {
  distanceCalls = 0;
  nonFiniteCalls = 0;
  quantizerDimensions = new Set();
}
async function open(mode, name, overrides = {}) {
  const store = new HnswVectorAdapter(scratch, {
    ...options, ...overrides, indexDir: path.join(scratch, '.asd', mode, name),
  });
  opened.push(store);
  if (mode === 'async-init') await store.init();
  else store.initSync();
  return store;
}
async function portableStats(store) {
  const { indexPath: ignored, ...stats } = await store.getStats();
  return stats;
}
async function selfQueries(store) {
  const result = [];
  for (const index of queryIndices) {
    result.push({ query: `v${index}`, top: (await store.searchVector(vectors[index], { topK: 1 }))[0]?.item.id ?? null });
  }
  return result;
}

const cases = [];
try {
  for (const mode of ['async-init', 'sync-init']) {
    seed = 12345;
    snapshots = [];
    const normal = await open(mode, 'normal');
    await normal.batchUpsert(items);
    const before = await normal.searchVector(vectors[31], { topK: 5 });
    const initialCodes = snapshots[0];
    await normal.flush();
    normal.destroy();
    const reopened = await open(mode, 'normal');
    resetDistanceStats();
    const after = await reopened.searchVector(vectors[31], { topK: 5 });
    const positive = {
      stats: await portableStats(reopened),
      rebuiltQvectorCount: snapshots.at(-1).length,
      allQuantizedCodesEqual: JSON.stringify(initialCodes) === JSON.stringify(snapshots.at(-1)),
      top5Before: before.map(hit => hit.item.id), top5After: after.map(hit => hit.item.id),
      sq8DistanceCalls: distanceCalls,
    };
    assert.equal(positive.allQuantizedCodesEqual, true);
    assert.deepEqual(positive.top5Before, positive.top5After);
    assert.ok(positive.sq8DistanceCalls > 0);
    reopened.destroy();

    const disabled = await open(mode, 'normal', { quantize: 'none' });
    resetDistanceStats();
    await disabled.searchVector(vectors[31], { topK: 5 });
    const disabledRoundtrip = { quantized: (await disabled.getStats()).quantized, sq8DistanceCalls: distanceCalls };
    disabled.destroy();

    const empty = await open(mode, 'empty');
    await empty.batchUpsert(items);
    for (const item of items) await empty.remove(item.id);
    await empty.flush();
    const emptySnapshot = BinaryPersistence.load(path.join(scratch, '.asd', mode, 'empty', 'vector_index.asvec'));
    const legacySnapshotBase64 = fs.readFileSync(path.join(scratch, '.asd', mode, 'empty', 'vector_index.asvec')).toString('base64');
    empty.destroy();
    const recycled = await open(mode, 'empty');
    seed = 76543;
    await recycled.batchUpsert(items);
    resetDistanceStats();
    const queries = await selfQueries(recycled);
    const emptyRoundtrip = {
      savedDimension: emptySnapshot.dimension, savedQuantizer: emptySnapshot.quantizerData,
      legacySnapshotBase64,
      stats: await portableStats(recycled), sq8DistanceCalls: distanceCalls, nonFiniteCalls,
      quantizerDimensions: [...quantizerDimensions], selfQueries: queries,
    };
    const control = await open(mode, 'control', { quantize: 'none' });
    seed = 76543;
    await control.batchUpsert(items);
    emptyRoundtrip.controlSelfQueries = await selfQueries(control);
    assert.ok(emptyRoundtrip.controlSelfQueries.every(query => query.query === query.top));
    cases.push({ mode, positive, disabledRoundtrip, emptyRoundtrip,
      confirmedFindings: {
        disabledSettingIgnored: disabledRoundtrip.sq8DistanceCalls > 0,
        emptySnapshotRestoresInvalidQuantizer: emptyRoundtrip.savedQuantizer?.dimension === 0 && emptyRoundtrip.nonFiniteCalls > 0,
      },
    });
  }
  const reviewed = ['ScalarQuantizer.ts', 'HnswIndex.ts', 'HnswVectorAdapter.ts', 'BinaryPersistence.ts'];
  console.log(JSON.stringify({
    baseline: git('rev-parse', revision).trim(), node: process.version,
    sourceSha256: Object.fromEntries(reviewed.map(file => {
      const relative = `src/infrastructure/vector/${file}`;
      return [relative, createHash('sha256').update(pinnedSource(relative)).digest('hex')];
    })),
    fixture: { vectors: 128, dimension: 4, data: 'deterministic Float32 unit vectors', options },
    cases,
  }, null, 2));
} finally {
  for (const store of opened) {
    await store.flush().catch(() => {});
    store.destroy();
  }
  Math.random = originalRandom;
  ScalarQuantizer.prototype.distance = distance;
  HnswIndex.prototype.setQuantizedVectors = rebuild;
  pathGuard._reset();
  fs.rmSync(scratch, { recursive: true, force: true });
}
