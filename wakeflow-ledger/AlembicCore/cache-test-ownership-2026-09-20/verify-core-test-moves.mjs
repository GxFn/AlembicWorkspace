// 从 Core 根目录执行；只验证本批搬移的完整 describe 与基线 token 一致，不成为产品 gate。
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
const ts = createRequire(path.resolve('package.json'))('typescript');
const manifest = JSON.parse(fs.readFileSync(new URL('./core-test-moves.json', import.meta.url), 'utf8'));
// 直接核对完整 describe 源文本，包含模板字符串及注释；不依赖简化 scanner。
function hash(text) {
  return createHash('sha256').update(text).digest('hex');
}
const baselineText = execFileSync('git', ['show', `${manifest.baseline}:test/HnswVector.test.ts`], {encoding:'utf8'});
const baselineAst = ts.createSourceFile('baseline.ts', baselineText, ts.ScriptTarget.Latest, true);
for (const statement of baselineAst.statements) {
  if (ts.isExpressionStatement(statement) && ts.isCallExpression(statement.expression) && statement.expression.expression.getText(baselineAst) === 'describe') {
    const title = statement.expression.arguments[0].text;
    const move = manifest.moves.find(m => m.describe === title);
    assert.ok(move, title);
    move.sourceSha256 = hash(statement.getText(baselineAst));
    delete move.tokenSha256;
  }
}
fs.writeFileSync(new URL('./core-test-moves.json', import.meta.url), JSON.stringify(manifest, null, 2)+'\n');
const allGroups = [];
for (const file of new Set(manifest.moves.map(m => m.to))) {
  const ast = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  for (const statement of ast.statements) {
    if (ts.isExpressionStatement(statement) && ts.isCallExpression(statement.expression) && statement.expression.expression.getText(ast) === 'describe') allGroups.push({file, title: statement.expression.arguments[0].text, hash: hash(statement.getText(ast))});
  }
}
for (const move of manifest.moves) {
  const found = allGroups.filter(g => g.title === move.describe);
  assert.equal(found.length, 1, `${move.describe}: unique owner`);
  assert.equal(found[0].file, move.to);
  assert.equal(found[0].hash, move.sourceSha256, `${move.describe}: unchanged assertions/hooks`);
}
console.log(JSON.stringify({status:'PASS',groups:manifest.moves.length,files:new Set(manifest.moves.map(m=>m.to)).size,assertionsAndHooks:'unchanged'}));
