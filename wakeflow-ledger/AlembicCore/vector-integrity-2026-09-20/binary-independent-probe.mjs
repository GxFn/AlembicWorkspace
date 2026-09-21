// Run from AlembicCore using Node.js 22. Only a unique temporary directory is written.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { registerHooks, stripTypeScriptTypes, syncBuiltinESMExports } from 'node:module';

process.env.ALEMBIC_LOG_LEVEL = 'error';
const coreRoot = process.cwd();
const baselineUrl = `${pathToFileURL(path.join(coreRoot, 'src/infrastructure/vector/BinaryPersistence.ts')).href}?baseline`;
const baselineSource = execFileSync('git', ['show', '9e8d033:src/infrastructure/vector/BinaryPersistence.ts'], { encoding: 'utf8' });
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'review:baseline-binary') return { url: baselineUrl, shortCircuit: true };
    try { return nextResolve(specifier, context); }
    catch (error) {
      if (error.code === 'ERR_MODULE_NOT_FOUND' && specifier.startsWith('.') && specifier.endsWith('.js')) {
        const candidate = new URL(`${specifier.slice(0, -3)}.ts`, context.parentURL);
        if (fs.existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      }
      throw error;
    }
  },
  load(url, context, nextLoad) {
    if (new URL(url).pathname.endsWith('.ts')) {
      const source = url === baselineUrl ? baselineSource : fs.readFileSync(fileURLToPath(url), 'utf8');
      return { format: 'module', source: stripTypeScriptTypes(source, { mode: 'transform' }), shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});

const { BinaryPersistence, HnswIndex, ScalarQuantizer } = await import(pathToFileURL(path.join(coreRoot, 'src/vector.ts')).href);
const { BinaryPersistence: Baseline } = await import('review:baseline-binary');
const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'alembic-binary-independent-'));
const results = [];
const check = async (label, action) => {
  try { results.push({ label, status: 'pass', ...await action() }); }
  catch (error) { results.push({ label, status: 'fail', error: `${error.name}: ${error.message}`.replaceAll(coreRoot, 'AlembicCore').replaceAll(temporaryRoot, '<temporary>') }); }
};
const index = new HnswIndex({ M: 4 });
index.addPoint('a', [1, 0]);
index.addPoint('b', [0, 1]);
const data = { index, quantizer: null, metadata: new Map([['keyword-only', { tag: '保留' }]]), contents: new Map([['a', 'body'], ['keyword-only', '没有 ANN 节点']]) };
try {
  await check('ordinary-v1-encoding-and-decoding-stay-byte-compatible', () => {
    for (const quantized of [false, true]) {
      const quantizer = quantized ? new ScalarQuantizer(2) : null;
      quantizer?.train([[1, 0], [0, 1]]);
      const input = { ...data, quantizer };
      const current = BinaryPersistence.encode(input);
      const previous = Baseline.encode(input);
      assert.deepEqual(current, previous);
      assert.deepEqual(BinaryPersistence.decode(previous), Baseline.decode(previous));
    }
    return { cases: 2 };
  });
  const encoded = BinaryPersistence.encode(data);
  const graphStart = 32 + 2 * 12;
  let metadataStart = graphStart + 2;
  for (let level = 0; level < encoded.readUInt16LE(graphStart); level++) {
    const entries = encoded.readUInt32LE(metadataStart);
    metadataStart += 4;
    for (let entry = 0; entry < entries; entry++) {
      const neighbors = encoded.readUInt16LE(metadataStart + 4);
      metadataStart += 6 + neighbors * 4;
    }
  }
  await check('every-truncated-prefix-rejected-except-omitted-optional-metadata', () => {
    for (let length = 0; length < encoded.length; length++) {
      const prefix = encoded.subarray(0, length);
      if (length === metadataStart) assert.equal(BinaryPersistence.decode(prefix).metadata.size, 0);
      else assert.throws(() => BinaryPersistence.decode(prefix));
    }
    return { prefixes: encoded.length, acceptedOptionalMetadataBoundary: metadataStart };
  });
  await check('large-counts-and-invalid-references-rejected-before-allocation', () => {
    const modifications = [
      [10, 0xffffffff, 4], [18, 0xffffffff, 4], [graphStart, 0xffff, 2],
      [graphStart + 2, 0xffffffff, 4], [graphStart + 6, 2, 4],
      [graphStart + 10, 0xffff, 2], [graphStart + 12, 2, 4],
      [metadataStart, 0xffffffff, 4],
    ];
    const file = path.join(temporaryRoot, 'invalid.asvec');
    for (const [offset, value, width] of modifications) {
      const bad = Buffer.from(encoded);
      if (width === 4) bad.writeUInt32LE(value, offset); else bad.writeUInt16LE(value, offset);
      fs.writeFileSync(file, bad);
      assert.throws(() => BinaryPersistence.decode(bad));
      assert.equal(BinaryPersistence.isValid(file), false);
    }
    return { cases: modifications.length };
  });
  await check('complete-bad-json-is-optional-and-historical-zero-dimension-survives', () => {
    const malformed = Buffer.from(encoded);
    malformed.fill('x', metadataStart + 4);
    const decoded = BinaryPersistence.decode(malformed);
    assert.equal(decoded.indexData.nodes.length, 2);
    assert.equal(decoded.metadata.size, 0);
    assert.equal(decoded.contents.size, 0);
    const historical = BinaryPersistence.encode({ ...data, index: new HnswIndex({ M: 4 }) });
    historical.writeUInt16LE(3, 6);
    const restored = BinaryPersistence.decode(historical);
    assert.deepEqual(restored.quantizerData, { dimension: 0, mins: [], maxs: [] });
    assert.equal(restored.contents.get('keyword-only'), '没有 ANN 节点');
    return { cases: 2 };
  });
  await check('isValid-and-load-each-read-exactly-once', () => {
    const file = path.join(temporaryRoot, 'read-once.asvec');
    BinaryPersistence.save(file, data);
    const original = fs.readFileSync;
    let reads = 0;
    fs.readFileSync = function (target, ...rest) { if (target === file) reads++; return original.call(this, target, ...rest); };
    syncBuiltinESMExports();
    try {
      assert.equal(BinaryPersistence.isValid(file), true);
      assert.equal(reads, 1);
      reads = 0;
      assert.equal(BinaryPersistence.load(file).contents.get('a'), 'body');
      assert.equal(reads, 1);
    } finally { fs.readFileSync = original; syncBuiltinESMExports(); }
    return { cases: 2 };
  });
  await check('mode-preparation-failure-occurs-before-body-and-preserves-target', async () => {
    const directory = path.join(temporaryRoot, 'mode');
    const file = path.join(directory, 'old.asvec');
    BinaryPersistence.save(file, data);
    fs.chmodSync(file, 0o600);
    const before = fs.readFileSync(file);
    const originalChmod = fs.chmodSync;
    const originalWrite = fs.writeFileSync;
    let bodyWrites = 0;
    fs.chmodSync = function (target, ...rest) {
      if (path.dirname(String(target)) === directory && target !== file) throw Object.assign(new Error('injected chmod failure'), { code: 'EACCES' });
      return originalChmod.call(this, target, ...rest);
    };
    fs.writeFileSync = function (target, body, ...rest) {
      if (Buffer.isBuffer(body) && path.dirname(String(target)) === directory) bodyWrites++;
      return originalWrite.call(this, target, body, ...rest);
    };
    syncBuiltinESMExports();
    try {
      for (const method of ['save', 'saveAsync']) {
        await assert.rejects(async () => BinaryPersistence[method](file, data), { code: 'EACCES' });
        assert.equal(bodyWrites, 0);
        assert.deepEqual(fs.readFileSync(file), before);
        assert.deepEqual(fs.readdirSync(directory), ['old.asvec']);
      }
    } finally { fs.chmodSync = originalChmod; fs.writeFileSync = originalWrite; syncBuiltinESMExports(); }
    return { cases: 2, bodyWrites };
  });
} finally {
  fs.rmSync(temporaryRoot, { recursive: true, force: true });
}
console.log(JSON.stringify({ baseline: '9e8d033', node: process.version, passed: results.filter((result) => result.status === 'pass').length, failed: results.filter((result) => result.status === 'fail').length, results }, null, 2));
process.exitCode = results.some((result) => result.status === 'fail') ? 1 : 0;
