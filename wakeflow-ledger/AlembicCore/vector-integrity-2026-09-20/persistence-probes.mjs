// Run with Node >=22 from any cwd. Only a unique os.tmpdir() subtree is written and removed.
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { createRequire, syncBuiltinESMExports } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const coreRoot = fileURLToPath(new URL('../../../AlembicCore/', import.meta.url));
const require = createRequire(path.join(coreRoot, 'package.json'));
const ts = require('typescript');
const uri = (source) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const compile = (file) => ts.transpileModule(fs.readFileSync(path.join(coreRoot, file), 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
}).outputText.replace(/(['"])\.\.\/logging\/Logger\.js\1/g,
  JSON.stringify(pathToFileURL(path.join(coreRoot, 'dist/infrastructure/logging/Logger.js')).href));
const binaryUrl = uri(compile('src/infrastructure/vector/BinaryPersistence.ts'));
const { BinaryPersistence } = await import(binaryUrl);
const { HnswIndex } = await import(uri(compile('src/infrastructure/vector/HnswIndex.ts')));
const { VectorMigration } = await import(uri(compile('src/infrastructure/vector/VectorMigration.ts')
  .replace(/(['"])\.\/BinaryPersistence\.js\1/g, JSON.stringify(binaryUrl))));
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'alembic-persistence-review-'));
const originalSync = fs.writeFileSync;
const originalAsync = fsp.writeFile;
const report = {};
const outcome = (operation) => {
  try { return { accepted: true, value: operation() }; }
  catch (error) { return { accepted: false, error: error.code ?? error.message }; }
};
try {
  const index = new HnswIndex({ M: 4 });
  index.addPoint('a', [1, 0]);
  index.addPoint('b', [0, 1]);
  const data = {
    index, quantizer: null,
    metadata: new Map([['a', { label: 'kept' }], ['keyword-only', { label: 'extra' }]]),
    contents: new Map([['a', 'body'], ['keyword-only', 'no ANN node']]),
  };
  const encoded = BinaryPersistence.encode(data);
  const high = index.serialize();
  high.nodes[0].level = 300;
  high.maxLevel = 300;
  high.entryPoint = 0;
  while (high.graphs.length <= 300) high.graphs.push([[0, []]]);
  report.highLevel = BinaryPersistence.decode(BinaryPersistence.encode({
    ...data, index: { serialize: () => high },
  })).indexData.nodes[0].level;

  const binaryPath = path.join(root, 'vector_index.asvec');
  fs.writeFileSync(binaryPath, encoded.subarray(0, 32));
  const jsonPath = path.join(root, 'vector_index.json');
  fs.writeFileSync(jsonPath, JSON.stringify([
    { id: 'recovered', content: 'JSON backup', vector: [1, 0], metadata: {} },
  ]));
  const recovered = [];
  report.truncated = {
    isValid: BinaryPersistence.isValid(binaryPath),
    load: outcome(() => BinaryPersistence.load(binaryPath)).accepted,
    migration: await VectorMigration.migrate(root, { batchUpsert: async (items) => recovered.push(...items) }),
    recoveredIds: recovered.map((item) => item.id),
  };

  const badEntry = Buffer.from(encoded);
  badEntry.writeUInt32LE(99, 18);
  report.entryPoint = outcome(() => {
    const decoded = BinaryPersistence.decode(badEntry);
    return { entryPoint: decoded.indexData.entryPoint, search: HnswIndex.deserialize(decoded.indexData).searchKnn([1, 0], 1) };
  });
  // Fixed v1 fixture: two one-byte IDs, two float32 dimensions, then L0 graph.
  const graphStart = 32 + 2 * (2 + 1 + 1 + 2 * 4);
  const nodeOffset = graphStart + 2 + 4;
  const neighborOffset = nodeOffset + 4 + 2;
  for (const [name, offset] of [['graphNode', nodeOffset], ['graphNeighbor', neighborOffset]]) {
    const damaged = Buffer.from(encoded);
    damaged.writeUInt32LE(99, offset);
    report[name] = outcome(() => BinaryPersistence.decode(damaged).indexData.graphs[0]);
  }
  let cursor = graphStart;
  const levels = encoded.readUInt16LE(cursor); cursor += 2;
  for (let level = 0; level < levels; level++) {
    const entries = encoded.readUInt32LE(cursor); cursor += 4;
    for (let entry = 0; entry < entries; entry++) {
      const neighbors = encoded.readUInt16LE(cursor + 4); cursor += 6 + neighbors * 4;
    }
  }
  const oversized = Buffer.from(encoded);
  oversized.writeUInt32LE(encoded.readUInt32LE(cursor) + 100, cursor);
  report.metadataDeclaredOverrun = outcome(() => BinaryPersistence.decode(oversized).contents.get('a'));
  report.optionalMetadataOmitted = outcome(() => BinaryPersistence.decode(encoded.subarray(0, cursor)).contents.size);

  for (const mode of ['save', 'saveAsync']) {
    const target = path.join(root, `${mode}.asvec`);
    BinaryPersistence.save(target, data);
    const before = fs.readFileSync(target);
    const isProbeWrite = (file, buffer) => typeof file === 'string' && path.dirname(path.resolve(file)) === root && Buffer.isBuffer(buffer);
    const injected = () => Object.assign(new Error('injected partial write'), { code: 'ENOSPC' });
    if (mode === 'save') fs.writeFileSync = (file, buffer, ...rest) => {
      if (isProbeWrite(file, buffer)) { originalSync(file, buffer.subarray(0, 20)); throw injected(); }
      return originalSync(file, buffer, ...rest);
    };
    else fsp.writeFile = async (file, buffer, ...rest) => {
      if (isProbeWrite(file, buffer)) { await originalAsync(file, buffer.subarray(0, 20)); throw injected(); }
      return originalAsync(file, buffer, ...rest);
    };
    syncBuiltinESMExports();
    let errorCode;
    try { await BinaryPersistence[mode](target, data); } catch (error) { errorCode = error.code; }
    fs.writeFileSync = originalSync; fsp.writeFile = originalAsync; syncBuiltinESMExports();
    const after = fs.readFileSync(target);
    report[mode] = { errorCode, oldSnapshotPreserved: before.equals(after), bytesAfter: after.length, validAfter: BinaryPersistence.isValid(target) };
  }
  console.log(JSON.stringify(report, null, 2));
} finally {
  fs.writeFileSync = originalSync; fsp.writeFile = originalAsync; syncBuiltinESMExports();
  fs.rmSync(root, { recursive: true, force: true });
}
