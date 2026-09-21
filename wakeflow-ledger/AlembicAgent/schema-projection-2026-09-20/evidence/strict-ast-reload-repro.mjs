// Diagnostic reproducer only. Repeated reload previously exceeded 1 GB; run only with Core-owner authorization.
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

for (let iteration = 0; iteration < 180; iteration++) {
  await reloadProjectAstPlugins();
  const summaries = inputs.map((text) => analyzeSourceFile(text, 'typescript'));
  const counts = summaries.map(count);
  if (counts.some((value) => value === null) || counts[0] === 0 || counts[1] !== 0 || counts[2] === 0) {
    console.log(JSON.stringify({ event: 'fixture-failure', iteration, counts, summaries, rss: process.memoryUsage().rss }));
    process.exitCode = 1;
    break;
  }
  if (iteration % 30 === 0 || iteration === 179) {
    console.log(JSON.stringify({ event: 'progress', iteration, counts, rss: process.memoryUsage().rss }));
  }
}
