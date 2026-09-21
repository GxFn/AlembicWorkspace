// Static check for the newly authored fixture only; no product/test execution.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const coreRoot = path.resolve(process.argv[2] ?? fileURLToPath(new URL('../../../AlembicCore/', import.meta.url)));
const ts = createRequire(path.join(coreRoot, 'package.json'))('typescript');
const relative = 'test/HnswVector.test.ts';
const filename = path.join(coreRoot, relative);
const config = ts.readConfigFile(path.join(coreRoot, 'tsconfig.json'), ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, coreRoot);
const program = ts.createProgram([filename], {
  ...parsed.options, rootDir: coreRoot, noEmit: true, types: ['node', 'vitest/globals'],
});
const source = program.getSourceFile(filename);
const scopes = [];
const names = ['adapter quantization restore', 'HnswVectorAdapter JSON migration recovery'];
function find(node) {
  if (ts.isCallExpression(node) && node.expression.getText(source) === 'describe'
      && ts.isStringLiteralLike(node.arguments[0]) && names.includes(node.arguments[0].text)) {
    scopes.push(node);
  }
  ts.forEachChild(node, find);
}
find(source);
if (scopes.length !== names.length) throw new Error('Expected all authorized new fixture scopes.');
const diagnostics = program.getSemanticDiagnostics(source)
  .filter(item => scopes.some(scope => item.start >= scope.getStart(source) && item.start < scope.end))
  .map(item => ({
    code: item.code,
    line: source.getLineAndCharacterOfPosition(item.start).line + 1,
    message: ts.flattenDiagnosticMessageText(item.messageText, '\n').replaceAll(coreRoot, 'AlembicCore'),
  }));
console.log(JSON.stringify({
  file: relative, scopes: names, diagnostics,
  sourceBytes: fs.statSync(filename).size,
  status: diagnostics.length === 0 ? 'PASS' : 'FAIL',
}, null, 2));
if (diagnostics.length > 0) process.exitCode = 1;
