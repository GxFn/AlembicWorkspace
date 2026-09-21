import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const { Parser, Language } = await import(pathToFileURL(resolve('node_modules/web-tree-sitter/web-tree-sitter.js')).href);
let created = 0;
let deleted = 0;
let loads = 0;
const live = new Set();
const initialize = Parser.prototype.initialize;
const dispose = Parser.prototype.delete;
const load = Language.load;
Parser.prototype.initialize = function (...args) {
  const result = initialize.apply(this, args);
  created++;
  live.add(this);
  return result;
};
Parser.prototype.delete = function (...args) {
  if (!live.delete(this)) throw new Error('Unexpected repeated parser disposal');
  const result = dispose.apply(this, args);
  deleted++;
  return result;
};
Language.load = async function (...args) { loads++; return load.apply(this, args); };
const { analyzeSourceFile, reloadProjectAstPlugins } = await import(pathToFileURL(resolve('dist/core/ast/index.js')).href);
const inputs = [
  'export class FixtureClass { run(): void {} }',
  'export const fixtureValue = 1;',
  'export interface FixtureContract { run(): void }',
];
const rounds = Number(process.argv[2] ?? 500);
const samples = [];
for (let iteration = 0; iteration < rounds; iteration++) {
  await reloadProjectAstPlugins();
  const counts = inputs.map((source) => {
    const summary = analyzeSourceFile(source, 'typescript');
    return summary ? ['classes','protocols','categories','methods','properties']
      .reduce((sum, key) => sum + (summary[key]?.length ?? 0), 0) : null;
  });
  if (JSON.stringify(counts) !== '[2,0,1]') throw new Error(JSON.stringify({iteration,counts}));
  if (iteration % 100 === 0 || iteration === rounds - 1) {
    globalThis.gc?.();
    const memory = process.memoryUsage();
    const sample = { iteration, counts, created, deleted, live: live.size, loads, rss: memory.rss, heapUsed: memory.heapUsed, external: memory.external };
    samples.push(sample);
    console.log(JSON.stringify(sample));
  }
}
console.log(JSON.stringify({summary: { rounds, live: live.size, loads, nativeParserBalance: created-deleted, rssAfterWarmupDelta: samples.at(-1).rss - (samples[1]?.rss ?? samples[0].rss) }}));
if (live.size !== 1 || created-deleted !== 1 || loads !== 11) process.exitCode = 1;
