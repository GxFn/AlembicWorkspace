// Run from AlembicCore with Node.js 22. Read-only public API probe; no build required.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { registerHooks, stripTypeScriptTypes } from 'node:module';

process.env.ALEMBIC_LOG_LEVEL = 'error';
const coreRoot = process.cwd();
const baselineAstUrl = `${pathToFileURL(path.join(coreRoot, 'src/infrastructure/vector/ASTChunker.ts')).href}?review-baseline`;
const baselineAst = execFileSync('git', ['show', '9e8d033:src/infrastructure/vector/ASTChunker.ts'], { cwd: coreRoot, encoding: 'utf8' });
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'review:baseline-ast') return { url: baselineAstUrl, shortCircuit: true };
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (error.code === 'ERR_MODULE_NOT_FOUND' && specifier.startsWith('.') && specifier.endsWith('.js')) {
        const candidate = new URL(`${specifier.slice(0, -3)}.ts`, context.parentURL);
        if (fs.existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      }
      throw error;
    }
  },
  load(url, context, nextLoad) {
    if (new URL(url).pathname.endsWith('.ts')) {
      const source = url === baselineAstUrl ? baselineAst : fs.readFileSync(fileURLToPath(url), 'utf8');
      return { format: 'module', source: stripTypeScriptTypes(source, { mode: 'transform' }), shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});

const results = [];
async function check(label, run) {
  try {
    const detail = await run();
    results.push({ label, status: 'pass', ...detail });
  } catch (error) {
    results.push({ label, status: 'fail', error: `${error.name}: ${error.message}`.replaceAll(coreRoot, 'AlembicCore') });
  }
}

const { chunk, chunkByAST, ensureParser, estimateTokens } = await import(pathToFileURL(path.join(coreRoot, 'src/vector.ts')).href);
const fixedFixtures = [
  ['ascii', '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcd'],
  ['cjk', '中文分块预算保留全部原文'.repeat(4)],
  ['emoji', '🙂🧪🚀🌏'.repeat(12)],
  ['mixed-lf', '中文🙂abc\n第二行xyz🧪\n'.repeat(6)],
  ['mixed-crlf', '中文🙂abc\r\n第二行xyz🧪\r\n'.repeat(6)],
  ['mixed-cr', '中文🙂abc\r第二行xyz🧪\r'.repeat(6)],
];
for (const [name, source] of fixedFixtures) {
  await check(`fixed-${name}-no-overlap`, () => {
    let samples = 0;
    for (const budget of [1, 1.9, 2, 4, 7, Infinity]) {
      const parts = chunk(source, { probe: name }, { strategy: 'fixed', maxChunkTokens: budget, overlapTokens: 0 });
      assert.equal(parts.map((part) => part.content).join(''), source);
      assert(parts.length <= [...source].length);
      for (const [index, part] of parts.entries()) {
        assert(part.content.length > 0);
        assert(part.content.isWellFormed());
        assert(estimateTokens(part.content) <= budget);
        assert.deepEqual(part.metadata, { probe: name, chunkIndex: index, totalChunks: parts.length });
      }
      samples++;
    }
    return { samples };
  });
}
await check('fixed-ascii-overlap-exact', () => {
  const parts = chunk(fixedFixtures[0][1], {}, { strategy: 'fixed', maxChunkTokens: 4, overlapTokens: 1 });
  assert.deepEqual(parts.map((part) => part.content), ['0123456789ABCDEF', 'CDEFGHIJKLMNOPQR', 'OPQRSTUVWXYZabcd']);
  return { chunks: parts.length };
});
await check('overlap-at-or-above-budget-is-nonoverlapping', () => {
  for (const overlap of [1, 2, Infinity]) {
    const parts = chunk('中文🙂abcdef🧪第二行', {}, { strategy: 'fixed', maxChunkTokens: 1, overlapTokens: overlap });
    assert.equal(parts.map((part) => part.content).join(''), '中文🙂abcdef🧪第二行');
    assert(parts.every((part) => part.content.isWellFormed() && estimateTokens(part.content) <= 1));
  }
  return { samples: 3 };
});
await check('mixed-overlap-progress-and-coverage', () => {
  // Unique content makes source offsets observable without confusing equal periodic spans.
  const sources = [
    fixedFixtures[0][1],
    '中文分块预算保留全部原始信息覆盖正确顺序结束',
    '🙂🧪🚀🌏🤖🍋🎈🐙🪐🏔️📚🍀🌊🦊💡🔭',
    'A🙂B中C\nD🧪E文F\nG🚀H块I\nJ🌏K原L',
    'A🙂B中C\r\nD🧪E文F\r\nG🚀H块I\r\nJ🌏K原L',
    'A🙂B中C\rD🧪E文F\rG🚀H块I\rJ🌏K原L',
  ];
  for (const source of sources) {
    for (const overlap of [0.5, 1, 2]) {
      const parts = chunk(source, {}, { strategy: 'fixed', maxChunkTokens: 4, overlapTokens: overlap });
      let previousStart = -1;
      let previousEnd = 0;
      for (const part of parts) {
        const start = source.indexOf(part.content, previousStart + 1);
        assert(start >= 0 && start > previousStart && start <= previousEnd);
        assert(estimateTokens(source.slice(start, previousEnd)) <= overlap);
        assert(part.content.length > 0 && part.content.isWellFormed());
        assert(estimateTokens(part.content) <= 4);
        previousStart = start;
        previousEnd = start + part.content.length;
      }
      assert.equal(previousEnd, source.length);
      assert(parts.length <= source.length);
    }
  }
  return { samples: sources.length * 3 };
});

for (const [strategy, source, budget, overlap] of [
  ['auto', '# 标题\n中文正文'.repeat(3), NaN, 0],
  ['section', '# 标题\n中文正文', NaN, 0],
  ['auto', 'short', 20, -1],
]) {
  await check(`invalid-options-${strategy}-${String(budget)}-${overlap}`, () => {
    assert.throws(() => chunk(source, {}, { strategy, maxChunkTokens: budget, overlapTokens: overlap }), RangeError);
    return { maxChunkTokens: String(budget), overlapTokens: overlap };
  });
}
await check('whole-unknown-and-empty-retain-pass-through', () => {
  for (const strategy of ['whole', 'unknown-strategy']) {
    const parts = chunk('abc', {}, { strategy, maxChunkTokens: 0, overlapTokens: -1 });
    assert.equal(parts.length, 1);
    assert.equal(parts[0].content, 'abc');
  }
  assert.deepEqual(chunk('', {}, { strategy: 'fixed', maxChunkTokens: 0 }), []);
  assert.deepEqual(chunk(' \n ', {}, { strategy: 'fixed', maxChunkTokens: NaN }), []);
  return { samples: 4 };
});

const ready = await ensureParser();
assert.equal(ready, true, 'real parser initialization required; no mock fallback');
const baseline = await import('review:baseline-ast');
assert.equal(await baseline.ensureParser(), true);
const astFixtures = [
  ['normal-javascript', 'function sum(a,b) { return a + b; }\nclass Counter { inc() { return 1; } }', 'javascript'],
  ['normal-typescript', 'interface Item { name: string; }\nfunction getName(item: Item): string { return item.name; }', 'typescript'],
  ['normal-python', 'def sum_values(a, b):\n    return a + b\n\nclass Counter:\n    def inc(self):\n        return 1\n', 'python'],
];
for (const [name, source, language] of astFixtures) {
  await check(`ast-baseline-equality-${name}`, () => {
    const current = chunkByAST(source, language, { owner: 'probe' }, { maxChunkTokens: 512 });
    const previous = baseline.chunkByAST(source, language, { owner: 'probe' }, { maxChunkTokens: 512 });
    assert.deepEqual(current, previous);
    assert(current?.length > 0);
    return { chunks: current.length };
  });
}

function validateAstSpans(source, parts, budget) {
  assert(parts?.length > 0);
  let endCursor = 0;
  for (const [index, part] of parts.entries()) {
    assert(part.content.length > 0);
    const offset = source.indexOf(part.content, endCursor);
    assert(offset >= 0, 'chunk is not an ordered original-source span');
    const end = offset + part.content.length;
    assert.equal(part.metadata.startLine, source.slice(0, offset).split('\n').length);
    assert.equal(part.metadata.endLine, source.slice(0, end).split('\n').length);
    assert(estimateTokens(part.content) <= budget);
    assert(part.content.isWellFormed());
    assert.equal(part.metadata.chunkStrategy, 'ast');
    assert.equal(part.metadata.chunkIndex, index);
    assert.equal(part.metadata.totalChunks, parts.length);
    endCursor = end;
  }
}
for (const newline of ['\n', '\r\n', '\r']) {
  await check(`ast-original-spans-${JSON.stringify(newline)}`, () => {
    const literal = '中文🙂abc🧪'.repeat(24);
    const source = `// leading note${newline}${newline}import data from 'sample';${newline}export const text = \`${literal}${newline}${literal}\`;${newline}function next() {${newline}  return text;${newline}}`;
    const parts = chunkByAST(source, 'javascript', {}, { maxChunkTokens: 8 });
    validateAstSpans(source, parts, 8);
    assert(parts.map((part) => part.content).join('').includes(literal));
    return { chunks: parts.length };
  });
}

const { parseToTree } = await import(pathToFileURL(path.join(coreRoot, 'src/core/AstAnalyzer.ts')).href);
const seed = parseToTree('const seed = 1;', 'javascript');
assert(seed);
let deleteOwner = seed.tree;
while (deleteOwner && !Object.hasOwn(deleteOwner, 'delete')) deleteOwner = Object.getPrototypeOf(deleteOwner);
assert(deleteOwner, 'native Tree.delete owner must exist');
const originalDelete = deleteOwner.delete;
seed.tree.delete();
let deletes = 0;
deleteOwner.delete = function () { deletes++; return originalDelete.call(this); };
try {
  await check('native-tree-delete-on-success', () => {
    const before = deletes;
    const result = chunkByAST('function f() { return 1; }', 'javascript');
    assert(result?.length > 0);
    assert.equal(deletes - before, 1);
    return { deletes: deletes - before };
  });
  await check('native-tree-delete-on-materialization-error', () => {
    const before = deletes;
    const metadata = { get tripwire() { throw new Error('metadata-access-fault'); } };
    assert.throws(() => chunkByAST('function f() { return 1; }', 'javascript', metadata), /metadata-access-fault/);
    assert.equal(deletes - before, 1);
    return { deletes: deletes - before };
  });
  await check('native-tree-delete-on-direct-ast-nan-error', () => {
    const before = deletes;
    assert.throws(() => chunkByAST('function f() { return 1; }', 'javascript', {}, { maxChunkTokens: NaN }), RangeError);
    assert(deletes - before === 0 || deletes - before === 1);
    return { deletes: deletes - before };
  });
} finally {
  deleteOwner.delete = originalDelete;
}

console.log(JSON.stringify({ baseline: '9e8d033', node: process.version, passed: results.filter((item) => item.status === 'pass').length, failed: results.filter((item) => item.status === 'fail').length, results }, null, 2));
process.exitCode = results.some((item) => item.status === 'fail') ? 1 : 0;
