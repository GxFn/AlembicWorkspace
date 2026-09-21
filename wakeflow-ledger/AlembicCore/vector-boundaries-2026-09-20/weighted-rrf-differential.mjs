/**
 * Read-only product comparison: git baseline versus current RRF entrypoints.
 * Usage: Node >=22.15 weighted-rrf-differential.mjs [Core root] [baseline ref]
 * Uses Core's installed TypeScript to transpile in memory. No dependency install,
 * product edits, dist output, network, or server. HNSW scratch files are removed.
 * HNSW dense reads are controlled inputs; sparse reads use the real private
 * keyword path over seeded store contents. This is not an ANN quality test.
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
const baseline = process.argv[3] ?? 'f39e139';
const requireFromCore = createRequire(path.join(coreRoot, 'package.json'));
const ts = requireFromCore('typescript');
process.env.ALEMBIC_QUIET = '1';

const compile = (source) => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;

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
      return { format: 'module', source: compile(fs.readFileSync(fileURLToPath(url), 'utf8')), shortCircuit: true };
    }
    return next(url, context);
  },
});

const git = (...args) => execFileSync('git', args, { cwd: coreRoot, encoding: 'utf8' }).trim();
async function loadVersion(relativePath, old) {
  const source = old ? git('show', `${baseline}:${relativePath}`) : fs.readFileSync(path.join(coreRoot, relativePath), 'utf8');
  const parent = pathToFileURL(path.join(coreRoot, relativePath));
  const code = compile(source).replace(/\bfrom\s*(['"])(\.[^'"]+)\1/g,
    (_, quote, specifier) => `from ${quote}${new URL(specifier, parent).href}${quote}`)
    + `\n//# sourceURL=rrf-${old ? 'old' : 'new'}-${path.basename(relativePath)}`;
  return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
}

const failures = [];
let hybridChecks = 0;
let hnswChecks = 0;
let densePayloadReferenceChecks = 0;
function compare(before, after, label) {
  try {
    // deepStrictEqual distinguishes NaN, -0, undefined-own versus absent keys.
    assert.deepStrictEqual(before, after);
    for (let index = 0; index < before.length; index++) {
      assert.deepStrictEqual(Object.keys(before[index]), Object.keys(after[index]));
      if (before[index].data) assert.strictEqual(before[index].data, after[index].data);
    }
  } catch (error) {
    failures.push({ label, message: error.message.slice(0, 1500) });
  }
}

const ks = [undefined, 0, NaN, Infinity, -Infinity, -2, 1.5, 1e16];
const alphas = [undefined, 0, 1, 0.4, NaN, Infinity, -1];
const limits = [undefined, 0, 1, 3, -1, NaN, Infinity];

async function run() {
  const relativeHybrid = 'src/service/search/HybridRetriever.ts';
  const OldHybrid = (await loadVersion(relativeHybrid, true)).HybridRetriever;
  const NewHybrid = (await loadVersion(relativeHybrid, false)).HybridRetriever;
  const hole = [];
  hole[2] = { id: 'a', score: undefined };
  const dense = { id: 'a', item: { id: 'a', marker: 'dense' }, score: 0.4 };
  const sticky = { id: 'a', item: { id: 'sticky' }, score: 5 };
  const families = [
    [[], []],
    [[dense], []],
    [[], [{ id: 'a', score: 2 }]],
    [[{}, dense, { id: 'a', score: 0.1 }], [{}, sticky, { id: 'a', score: 3 }]],
    [[{ id: 'a', score: 1 }], [{ id: 'a', score: 3 }, { id: 'a', score: 4 }]],
    [[dense, { ...dense, score: 0.1 }], [{ id: 'a', score: 8 }, { id: 'a', score: 2 }]],
    [hole, [{ item: { id: 'ignored' } }, { id: 's', score: 7 }]],
    [[{ id: 'b', item: { id: '' }, score: 0 }, { id: '__proto__', score: NaN }], [{ id: 'constructor', score: Infinity }]],
    [[{ id: 'b', score: 1 }, { id: 'a', score: 1 }], [{ id: 'a', score: 2 }, { id: 'b', score: 2 }]],
    [[{ id: 'a', item: {}, score: 1 }], [{ id: 'a', score: 9 }]],
    [[], [sticky, { id: 'a', item: { id: 'later' }, score: 2 }]],
  ];
  for (const k of ks) for (const alpha of alphas) for (const topK of limits) {
    for (let index = 0; index < families.length; index++) {
      const [denseResults, sparseResults] = families[index];
      const input = { denseResults, sparseResults, topK, alpha };
      compare(new OldHybrid({ rrfK: k, alpha: 0.9 }).fuse(input),
        new NewHybrid({ rrfK: k, alpha: 0.9 }).fuse(input),
        `Hybrid:${index}:k=${k}:alpha=${alpha}:topK=${topK}`);
      hybridChecks++;
    }
  }

  const pathGuard = (await import(pathToFileURL(path.join(coreRoot, 'src/shared/PathGuard.ts')).href)).default;
  const Logger = (await import(pathToFileURL(path.join(coreRoot, 'src/infrastructure/logging/Logger.ts')).href)).default;
  Logger.getInstance().silent = true;
  const relativeHnsw = 'src/infrastructure/vector/HnswVectorAdapter.ts';
  const OldHnsw = (await loadVersion(relativeHnsw, true)).HnswVectorAdapter;
  const NewHnsw = (await loadVersion(relativeHnsw, false)).HnswVectorAdapter;
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'rrf-differential-'));
  pathGuard.configure({ projectRoot: scratch, knowledgeBaseDir: 'Alembic' });
  const options = { walEnabled: false, flushIntervalMs: 1000000 };
  const oldStore = new OldHnsw(scratch, { ...options, indexDir: path.join(scratch, '.asd', 'old') });
  const newStore = new NewHnsw(scratch, { ...options, indexDir: path.join(scratch, '.asd', 'new') });
  const originalNow = Date.now;
  Date.now = () => 1700000000000;
  try {
    oldStore.initSync();
    newStore.initSync();
    for (const id of ['a', 'b', 's']) {
      const item = { id, content: 'q common', vector: [], metadata: { marker: id } };
      await oldStore.upsert(item);
      await newStore.upsert(item);
    }
    const sparseDense = [];
    sparseDense[2] = { item: { id: 'b', content: 'hole', vector: [], metadata: {} }, score: NaN };
    const groups = [
      [],
      [{ item: { id: 'a', content: 'dense', vector: [1], metadata: { marker: 'dense' } }, score: 0.7 }],
      [{ item: { id: 'a', content: 'first', vector: [1], metadata: {} }, score: 0.8 },
        { item: { id: 'a', content: 'last', vector: [1], metadata: {} }, score: 0.3 }],
      [{ item: { id: undefined, content: 'missing', vector: [], metadata: {} }, score: undefined }],
      sparseDense,
    ];
    for (const k of ks) for (const alpha of alphas) for (const topK of limits) for (const query of ['q', '']) {
      for (let index = 0; index < groups.length; index++) {
        const denseResults = groups[index];
        oldStore.searchVector = async () => denseResults;
        newStore.searchVector = async () => denseResults;
        const input = { rrfK: k, alpha, topK };
        const before = await oldStore.hybridSearch([1], query, input);
        const after = await newStore.hybridSearch([1], query, input);
        const label = `Hnsw:${index}:query=${query}:k=${k}:alpha=${alpha}:topK=${topK}`;
        compare(before, after, label);
        hnswChecks++;
        for (const hit of before) {
          if (denseResults.some(result => result?.item === hit.item)) {
            densePayloadReferenceChecks++;
            try {
              assert.strictEqual(after.find(result => result.item.id === hit.item.id)?.item, hit.item);
            } catch (error) {
              failures.push({ label, message: `dense payload identity: ${error.message.slice(0, 1000)}` });
            }
          }
        }
      }
    }
    await oldStore.flush();
    await newStore.flush();
  } finally {
    Date.now = originalNow;
    oldStore.destroy();
    newStore.destroy();
    pathGuard._reset();
    fs.rmSync(scratch, { recursive: true, force: true });
  }
}

try {
  await run();
  const sourceFiles = ['src/shared/WeightedRrfAccumulator.ts', 'src/service/search/HybridRetriever.ts', 'src/infrastructure/vector/HnswVectorAdapter.ts'];
  console.log(JSON.stringify({
    status: failures.length === 0 ? 'PASS' : 'FAIL',
    baseline: git('rev-parse', baseline),
    currentHead: git('rev-parse', 'HEAD'),
    node: process.version,
    timestamp: new Date().toISOString(),
    sourceSha256: Object.fromEntries(sourceFiles.map(file => [file, createHash('sha256').update(fs.readFileSync(path.join(coreRoot, file))).digest('hex')])),
    matrix: { ks: ks.map(String), alphas: alphas.map(String), topKs: limits.map(String), hybridFamilies: 11, hnswDenseFamilies: 5, hnswQueries: ['q', ''] },
    hybridChecks, hnswChecks, totalChecks: hybridChecks + hnswChecks, densePayloadReferenceChecks,
    differenceCount: failures.length,
    differences: failures,
    scope: 'Fusion equivalence only; controlled dense reads, real HNSW sparse reads; canonical retrieval untouched.',
  }, null, 2));
  if (failures.length > 0) process.exitCode = 1;
} catch (error) {
  console.log(JSON.stringify({ status: 'HARNESS_ERROR', name: error.name, message: error.message, hybridChecks, hnswChecks }, null, 2));
  process.exitCode = 1;
}
