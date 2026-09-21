import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// 只读调研探针：先核对 AI 构建产物与源码，再以 fetch fixture 观察合同。
// 不读取真实凭据，不向模型服务发请求，不修改产品源码。
const root = path.resolve(process.argv[2] ?? process.cwd());
const require = createRequire(path.join(root, 'package.json'));
const ts = require('typescript');
const printer = ts.createPrinter({ removeComments: true });
const normalize = (source) => printer.printFile(ts.createSourceFile('check.js', source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS));
const verified = [];
for (const relative of fs.readdirSync(path.join(root, 'src/ai'), { recursive: true })) {
  if (!relative.endsWith('.ts')) continue;
  const source = fs.readFileSync(path.join(root, 'src/ai', relative), 'utf8');
  const emitted = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText;
  const distPath = path.join(root, 'dist/ai', relative.replace(/\.ts$/, '.js'));
  assert.equal(normalize(fs.readFileSync(distPath, 'utf8')), normalize(emitted), `stale AI build: ${relative}`);
  verified.push(`src/ai/${relative}`);
}

const load = (relative) => import(pathToFileURL(path.join(root, relative)).href);
const { OpenAiProvider } = await load('dist/ai/providers/OpenAiProvider.js');
const { LLMGateway } = await load('dist/ai/gateway/LLMGateway.js');
const { ReliabilityController } = await load('dist/ai/shared/reliability.js');
const { classifyLlmError } = await load('dist/ai/shared/errorClassify.js');
const originalFetch = globalThis.fetch;
const calls = [];
globalThis.fetch = async (_url, init) => {
  calls.push({ transportSignalAborted: init?.signal?.aborted ?? null });
  return new Response(JSON.stringify({ choices: [{ message: { content: '{"wrong":true}' }, finish_reason: 'stop' }], usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } }), { status: 200, headers: { 'content-type': 'application/json' } });
};
const config = { apiKey: 'fixture-not-a-credential', baseUrl: 'https://fixture.invalid/v1', model: 'gpt-5.5', maxRetries: 0 };
const settle = async (fn) => {
  try { return { result: await fn() }; }
  catch (err) { return { errorName: err.name, errorCode: err.code ?? null }; }
};
const observed = [];
try {
  const controller = new AbortController();
  controller.abort();
  for (const operation of ['chat', 'chatWithStructuredOutput']) {
    const before = calls.length;
    const provider = new OpenAiProvider(config);
    const outcome = await settle(() => provider[operation]('fixture', { abortSignal: controller.signal }));
    observed.push({ operation, ...outcome, fetchCalls: calls.length - before, captures: calls.slice(before) });
  }
  const gateway = new LLMGateway({ providers: { openai: config }, maxRetries: 0 });
  const before = calls.length;
  const outcome = await settle(() => gateway.chatStructured({ modelRef: 'openai:gpt-5.5', prompt: 'fixture', abortSignal: controller.signal }));
  observed.push({ operation: 'gateway.chatStructured', ...outcome, fetchCalls: calls.length - before });
  const provider = new OpenAiProvider(config);
  observed.push({ operation: 'schemaMissingRequired', ...await settle(() => provider.chatWithStructuredOutput('fixture', { schema: { type: 'object', properties: { requiredField: { type: 'string' } }, required: ['requiredField'], additionalProperties: false } })) });
  for (const reason of ['caller stop', new Error('caller stop')]) {
    const gate = new ReliabilityController({ maxConcurrency: 1, maxRetries: 0, circuitThreshold: 1 });
    const abort = new AbortController();
    let executed = 0;
    await gate.acquireSlot();
    const pending = settle(() => gate.run(async () => { executed++; return 'unexpected'; }, undefined, undefined, { abortSignal: abort.signal }));
    await new Promise((resolve) => setImmediate(resolve));
    abort.abort(reason);
    const result = await pending;
    gate.releaseSlot();
    observed.push({ operation: 'queuedAbort', reasonType: typeof reason === 'string' ? 'string' : 'Error', ...result, executed, circuitFailures: gate.circuitFailures, circuitState: gate.circuitState, activeRequests: gate.activeRequests });
  }
  observed.push({ operation: 'sdkStatusCodeShape', input: { name: 'AI_APICallError', statusCode: 401 }, classification: classifyLlmError({ name: 'AI_APICallError', statusCode: 401 }) });
} finally {
  globalThis.fetch = originalFetch;
}
assert.equal(observed[0].fetchCalls, 0);
assert.equal(observed[1].fetchCalls, 1);
assert.equal(observed[2].fetchCalls, 0);
assert.deepEqual(observed[3].result, { wrong: true });
assert.equal(observed[4].circuitFailures, 0);
assert.equal(observed[5].executed, 0);
assert.equal(observed[5].circuitFailures, 1);
const report = { kind: 'characterization-not-fix-validation', sourceAndDistMatched: verified, observations: observed, realModelCalls: 0 };
fs.mkdirSync(path.join(root, 'tmp/llm-integration-study-2026-09-20'), { recursive: true });
fs.writeFileSync(path.join(root, 'tmp/llm-integration-study-2026-09-20/local-probe.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ verifiedAiModules: verified.length, observations: observed, realModelCalls: 0 }, null, 2));
