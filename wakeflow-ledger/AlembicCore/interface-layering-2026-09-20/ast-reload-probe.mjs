import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const { analyzeSourceFile, reloadProjectAstPlugins } = await import(
  pathToFileURL(resolve('dist/core/ast/index.js')).href
);
const { Language, Parser } = await import(
  pathToFileURL(resolve('node_modules/web-tree-sitter/web-tree-sitter.js')).href
);
const loadLanguage = Language.load;
Language.load = async function (...args) {
  try { return await loadLanguage.apply(this, args); }
  catch (error) { console.log('Language.load failed:', error.message); throw error; }
};
const setLanguage = Parser.prototype.setLanguage;
Parser.prototype.setLanguage = function (...args) {
  try { return setLanguage.apply(this, args); }
  catch (error) { console.log('Parser.setLanguage failed:', error.message); throw error; }
};
const fixtures = [
  ['positive', 'export class FixtureClass { run(): void {} }', 'classes'],
  ['negative', 'export const fixtureValue = 1;', null],
  ['edge', 'export interface FixtureContract { run(): void }', 'protocols'],
];
const iterations = Number(process.argv[2] ?? 50);
for (let iteration = 0; iteration < iterations; iteration++) {
  await reloadProjectAstPlugins();
  for (const [name, source, key] of fixtures) {
    const summary = analyzeSourceFile(source, 'typescript');
    const declarations = ['classes', 'protocols', 'categories', 'methods', 'properties']
      .flatMap((field) => summary?.[field] ?? []);
    if (!summary || (key ? !summary[key]?.length : declarations.length !== 0)) {
      console.log(JSON.stringify({ iteration, name, summary }));
      process.exitCode = 1;
      process.exit();
    }
  }
}
console.log(`PASS: ${iterations} reloads; class, empty and interface fixtures remain stable.`);
