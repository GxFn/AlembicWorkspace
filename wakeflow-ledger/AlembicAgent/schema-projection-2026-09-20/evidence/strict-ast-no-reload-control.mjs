// Control: one load, then the same 1000 sets of parser fixtures.
import { analyzeSourceFile, reloadProjectAstPlugins } from '@alembic/core/core/ast';

const inputs = [
  'export class FixtureClass { run(): void {} }',
  'export const fixtureValue = 1;',
  'export interface FixtureContract { run(): void }',
];
const count = (summary) => summary
  ? ['classes', 'protocols', 'categories', 'methods', 'properties']
    .reduce((total, key) => total + (Array.isArray(summary[key]) ? summary[key].length : 0), 0)
  : null;

await reloadProjectAstPlugins();
for (let iteration = 0; iteration < 1000; iteration++) {
  const counts = inputs.map((text) => count(analyzeSourceFile(text, 'typescript')));
  if (counts.some((value) => value === null) || counts[0] === 0 || counts[1] !== 0 || counts[2] === 0) {
    console.log(JSON.stringify({ event: 'fixture-failure', iteration, counts, rss: process.memoryUsage().rss }));
    process.exitCode = 1;
    break;
  }
  if (iteration === 0 || iteration === 999) {
    console.log(JSON.stringify({ event: 'progress', iteration, counts, rss: process.memoryUsage().rss }));
  }
}
