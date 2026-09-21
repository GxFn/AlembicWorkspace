// Pin legacy empty/invalid-only migration behavior without running Vitest.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire, registerHooks } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = path.resolve(process.argv[2] ?? fileURLToPath(new URL('../../../AlembicCore/', import.meta.url)));
const revision = process.argv[3] ?? '9e8d033';
const ts = createRequire(path.join(root, 'package.json'))('typescript');
process.env.ALEMBIC_QUIET = '1';
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
      const file = fileURLToPath(url);
      const relative = path.relative(root, file);
      const source = relative.startsWith('src/') && revision !== 'working-tree'
        ? execFileSync('git', ['show', `${revision}:${relative}`], { cwd: root, encoding: 'utf8' })
        : fs.readFileSync(file, 'utf8');
      return { format: 'module', shortCircuit: true, source: ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
      }).outputText };
    }
    return next(url, context);
  },
});
const load = relative => import(pathToFileURL(path.join(root, relative)).href);
const { HnswVectorAdapter } = await load('src/infrastructure/vector/HnswVectorAdapter.ts');
const pathGuard = (await load('src/shared/PathGuard.ts')).default;
(await load('src/infrastructure/logging/Logger.ts')).default.getInstance().silent = true;
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'migration-legacy-edge-'));
pathGuard.configure({ projectRoot: scratch, knowledgeBaseDir: 'Alembic' });
const results = [];
try {
  for (const method of ['init', 'initSync']) {
    for (const [name, json] of [['empty-array', '[]'], ['empty-object', '{}'], ['invalid-array', '[{}]'], ['invalid-object', '{"":{"content":"orphan"}}']]) {
      const indexDir = path.join(scratch, '.asd', method, name);
      fs.mkdirSync(indexDir, { recursive: true });
      const jsonPath = path.join(indexDir, 'vector_index.json');
      fs.writeFileSync(jsonPath, json);
      const store = new HnswVectorAdapter(scratch, { indexDir, walEnabled: false });
      try {
        await store[method]();
        results.push({ method, fixture: name, count: (await store.listIds()).length,
          jsonExists: fs.existsSync(jsonPath), bakExists: fs.existsSync(`${jsonPath}.bak`),
          snapshotExists: fs.existsSync(path.join(indexDir, 'vector_index.asvec')) });
      } finally { store.destroy(); }
    }
  }
  console.log(JSON.stringify({ revision, results }, null, 2));
} finally { pathGuard._reset(); fs.rmSync(scratch, { recursive: true, force: true }); }
