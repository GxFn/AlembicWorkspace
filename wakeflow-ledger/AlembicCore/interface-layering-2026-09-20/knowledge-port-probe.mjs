// 从 AlembicCore 运行；以真实调用检查窄能力兼容，不写入产品源码或构建产物。
import path from 'node:path';
import { createRequire } from 'node:module';
const ts = createRequire(path.resolve('package.json'))('typescript');
const fileName = path.resolve('test/knowledge-port-consumer-probe.ts');
const source = `
import type { KnowledgeRepository } from '../src/domain/knowledge/KnowledgeRepository.js';
import type { KnowledgeFileStore } from '../src/repository/knowledge/KnowledgeFileStore.js';
import { KnowledgeService } from '../src/service/knowledge/KnowledgeService.js';
import { RecipeProductionGateway, type CreatedRecipeInfo } from '../src/service/knowledge/RecipeProductionGateway.js';
import { SearchEngine } from '../src/service/search/SearchEngine.js';
import type { DatabaseConnection } from '../src/infrastructure/database/DatabaseConnection.js';
import type { KnowledgeEntry } from '../src/domain/knowledge/KnowledgeEntry.js';
import type { KnowledgeRepositoryImpl } from '../src/repository/knowledge/KnowledgeRepositoryImpl.js';
import type { KnowledgeServiceRepository } from '../src/service/knowledge/KnowledgeServiceDependencies.js';
declare const repository: KnowledgeRepository;
declare const fileWriter: KnowledgeFileStore;
declare const skillHooks: { run(hook: string, ...args: unknown[]): Promise<unknown> };
const options: ConstructorParameters<typeof KnowledgeService>[4] = { fileWriter, skillHooks };
const graph = { async addEdge() { return { success: true }; } };
void new KnowledgeService(repository, { async log() {} }, null, graph, options);
declare const actual: KnowledgeRepositoryImpl;
const port: KnowledgeServiceRepository = actual;
const service = new KnowledgeService(port, { async log() {} }, null, graph, options);
const nullableUpdate: Awaited<ReturnType<typeof service.update>> = null;
const nullablePublish: Awaited<ReturnType<typeof service.publish>> = null;
const rows: Promise<KnowledgeEntry[]> = actual.findWithPagination().then(page => page.data);
const stats: Promise<Record<string, unknown>> = actual.getStats();
const gateway = new RecipeProductionGateway({ knowledgeService: service, projectRoot: '.' });
const nullableGatewayPublish: Awaited<ReturnType<typeof gateway.publish>> = null;
const nullableRaw: CreatedRecipeInfo['raw'] = null;
declare const database: DatabaseConnection;
void new SearchEngine(database);
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
console.log(`Knowledge dependency probe: ${diagnostics.length === 0 ? 'PASS' : 'FAIL'} (${diagnostics.length} diagnostics)`);
process.exitCode = diagnostics.length === 0 ? 0 : 1;
