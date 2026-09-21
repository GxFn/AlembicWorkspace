import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
const product = new URL('../../../Alembic/', import.meta.url);
const { createEmbeddingProvider } = await import(new URL('dist/lib/injection/EmbeddingProvider.js', product));
const { executeDashboardOperation } = await import(new URL('dist/lib/http/utils/dashboard-operation.js', product));
let networkCalls = 0;
globalThis.fetch = async () => { networkCalls++; throw new Error('Unexpected network request'); };
const calls = [];
const vector = {
  async clear() { calls.push('clear'); },
  async fullBuild(options) { assert.equal(options.force, true); calls.push('build'); return { scanned: 1, chunked: 1, embedded: 1, upserted: 1, skipped: 0, errors: 0 }; }
};
const container = {
  singletons: { _embedProvider: createEmbeddingProvider({}, { ALEMBIC_EMBED_PROVIDER: 'ollama' }) },
  services: { vectorService: () => vector },
  get(name) { assert.equal(name, 'vectorService'); calls.push('get'); return vector; }
};
const request = { headers: {} };
const positive = await executeDashboardOperation(container, request, 'dashboard.rebuild_semantic_index', { force: true });
assert.equal(positive.ok, true, positive.text);
assert.deepEqual(calls, ['get', 'clear', 'build']);
calls.length = 0;
container.singletons._embedProvider = null;
container.singletons.aiProvider = { name: 'openai', model: 'fixture', embed() { throw new Error('Legacy LLM embedding must not be used'); } };
const negative = await executeDashboardOperation(container, request, 'dashboard.rebuild_semantic_index', { force: true });
assert.equal(negative.ok, false);
assert.match(negative.text, /^Independent embedding provider unavailable/);
assert.deepEqual(calls, []);
assert.equal(networkCalls, 0);
const report = { compiledEsm: true, withoutLlm: positive.status, missingEmbedding: negative.status, missingEmbeddingMutations: calls.length, networkCalls };
writeFileSync(new URL('compiled-entry-probe.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
