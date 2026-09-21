/**
 * Static declaration check; no test execution or emitted files.
 * Usage: node review-plugin-vector-types.mjs [Core root] [Plugin root] [Plugin revision]
 * Without a revision, checks the Plugin working-tree file. With a revision,
 * reads that committed test source against the currently installed package types.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const coreRoot = path.resolve(process.argv[2] ?? fileURLToPath(new URL('../../../AlembicCore/', import.meta.url)));
const pluginRoot = path.resolve(process.argv[3] ?? path.join(coreRoot, '../AlembicPlugin'));
const revision = process.argv[4];
const ts = createRequire(path.join(coreRoot, 'package.json'))('typescript');
const relativeFile = 'test/unit/VectorPipeline.test.ts';
const filename = path.join(pluginRoot, relativeFile);
const git = (...args) => execFileSync('git', args, { cwd: pluginRoot, encoding: 'utf8' }).trim();
const source = revision ? git('show', `${revision}:${relativeFile}`) : fs.readFileSync(filename, 'utf8');
const sha = (value) => createHash('sha256').update(value).digest('hex');

const configFile = path.join(pluginRoot, 'tsconfig.json');
const config = ts.readConfigFile(configFile, ts.sys.readFile);
if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, pluginRoot);
const options = { ...parsed.options, noEmit: true, types: ['node', 'vitest/globals'] };
const host = ts.createCompilerHost(options);
const getSourceFile = host.getSourceFile.bind(host);
host.getSourceFile = (name, language, onError, create) => path.resolve(name) === filename
  ? ts.createSourceFile(name, source, language, true)
  : getSourceFile(name, language, onError, create);
const program = ts.createProgram([filename], options, host);
const file = program.getSourceFile(filename);
const groups = file.statements.filter(statement => ts.isExpressionStatement(statement)
  && ts.isCallExpression(statement.expression)
  && statement.expression.expression.getText(file) === 'describe'
  && ts.isStringLiteralLike(statement.expression.arguments[0])
  && statement.expression.arguments[0].text === 'Core vector package integration');
if (groups.length !== 1) throw new Error('Expected exactly one target describe; refusing an empty-scope success.');
const target = groups[0];
const start = target.getStart(file);
const end = target.end;
const allDiagnostics = program.getSemanticDiagnostics(file);
const scoped = allDiagnostics.filter(d => d.start !== undefined && d.start >= start && d.start < end);
const diagnostics = scoped.map(d => ({
  code: d.code,
  category: ts.DiagnosticCategory[d.category],
  file: `AlembicPlugin/${relativeFile}`,
  line: file.getLineAndCharacterOfPosition(d.start).line + 1,
  message: ts.flattenDiagnosticMessageText(d.messageText, '\n')
    .replaceAll(coreRoot, 'AlembicCore').replaceAll(pluginRoot, 'AlembicPlugin'),
}));
const declaration = 'dist/service/search/HybridRetriever.d.ts';
console.log(JSON.stringify({
  status: diagnostics.length === 0 ? 'PASS' : 'FAIL',
  method: 'TypeScript createProgram + getSemanticDiagnostics, noEmit; no Vitest or product execution',
  typescript: ts.version,
  compilerConfig: 'AlembicPlugin/tsconfig.json',
  compilerOverrides: { noEmit: true, types: ['node', 'vitest/globals'], rootNames: [`AlembicPlugin/${relativeFile}`] },
  source: { revision: revision ? git('rev-parse', revision) : 'working-tree', head: git('rev-parse', 'HEAD'), sha256: sha(source) },
  scope: { file: `AlembicPlugin/${relativeFile}`, describe: 'Core vector package integration', lineStart: file.getLineAndCharacterOfPosition(start).line + 1, lineEnd: file.getLineAndCharacterOfPosition(end).line + 1 },
  installedDeclaration: { file: `AlembicCore/${declaration}`, sha256: sha(fs.readFileSync(path.join(coreRoot, declaration))) },
  scopedDiagnosticCount: diagnostics.length,
  diagnostics,
  excludedExistingFileDiagnosticCount: allDiagnostics.length - scoped.length,
  exclusionReason: 'Existing eight tests are outside the new describe and outside this review request.',
}, null, 2));
if (diagnostics.length > 0) process.exitCode = 1;
