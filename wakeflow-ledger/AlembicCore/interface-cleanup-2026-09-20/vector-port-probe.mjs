// 从 AlembicCore 运行；以真实调用检查窄能力兼容，不写入产品源码或构建产物。
import path from 'node:path';
import { createRequire } from 'node:module';
const ts = createRequire(path.resolve('package.json'))('typescript');
const fileName = path.resolve('test/vector-port-consumer-probe.ts');
const source = `
import type { VectorStore } from '../src/infrastructure/vector/VectorStore.js';
import type { VectorIndexReader, VectorIndexWriter } from '../src/service/vector/VectorIndexPorts.js';
import { syncRecipeSemanticRegionVectors } from '../src/service/vector/RecipeRegionVectorIndex.js';
import { inspectRecipeVectorGeneration } from '../src/service/vector/RecipeVectorGeneration.js';
declare const reader: Pick<VectorIndexReader, 'listIds' | 'getById'>;
declare const writer: Pick<VectorIndexWriter, 'batchUpsert' | 'remove'>;
declare const aggregate: VectorStore;
void inspectRecipeVectorGeneration(reader, [], null);
void syncRecipeSemanticRegionVectors({
  listIds: () => reader.listIds(),
  getById: (id) => reader.getById(id),
  batchUpsert: (items) => writer.batchUpsert(items),
  remove: (id) => writer.remove(id),
}, null, []);
// 现有完整 store 消费者同时保持兼容。
void inspectRecipeVectorGeneration(aggregate, [], null);
void syncRecipeSemanticRegionVectors(aggregate, null, []);
`;
const config = ts.readConfigFile('tsconfig.json', ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, process.cwd());
const options = { ...parsed.options, noEmit: true, rootDir: process.cwd() };
const host = ts.createCompilerHost(options);
const readFile = host.readFile;
const fileExists = host.fileExists;
host.readFile = (name) => name === fileName ? source : readFile(name);
host.fileExists = (name) => name === fileName || fileExists(name);
const program = ts.createProgram([...parsed.fileNames, fileName], options, host);
const diagnostics = ts.getPreEmitDiagnostics(program);
for (const diagnostic of diagnostics) {
  const location = diagnostic.file && diagnostic.start !== undefined
    ? `${path.relative(process.cwd(), diagnostic.file.fileName)}:${diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start).line + 1}`
    : 'compiler';
  console.log(`${location} TS${diagnostic.code}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`);
}
console.log(`Vector port consumer probe: ${diagnostics.length === 0 ? 'PASS' : 'FAIL'} (${diagnostics.length} diagnostics)`);
process.exitCode = diagnostics.length === 0 ? 0 : 1;
