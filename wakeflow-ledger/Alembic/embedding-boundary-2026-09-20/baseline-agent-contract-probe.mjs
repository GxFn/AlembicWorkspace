// Run from AlembicAgent with Node >=22.15. Uses only git-read baseline source and fixture HTTP.
import { registerHooks, createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../../../AlembicAgent/', import.meta.url);
const ts = createRequire(new URL('package.json', root))('typescript');
const sourceRoot = new URL('src/', root).href;
const sources = new Map();
const logger = 'data:text/javascript,export default {getInstance(){return {info(){},warn(){},debug(){},error(){}}}}';
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === '@alembic/core/logging') {
      return { url: logger, shortCircuit: true };
    }
    const alias = specifier.match(/^#(tools|agent|ai|shared)\/(.+)\.js$/);
    if (alias) {
      return { url: new URL(`src/${alias[1]}/${alias[2]}.ts`, root).href, shortCircuit: true };
    }
    if (specifier.startsWith('.') && context.parentURL?.startsWith(sourceRoot) && specifier.endsWith('.js')) {
      const url = new URL(specifier.replace(/\.js$/, '.ts'), context.parentURL);
      if (existsSync(url)) {
        return { url: url.href, shortCircuit: true };
      }
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.startsWith(sourceRoot) && url.endsWith('.ts')) {
      const relative = fileURLToPath(url).slice(fileURLToPath(root).length);
      let source = sources.get(relative);
      if (source === undefined) {
        source = execFileSync('git', ['show', `b303b35:${relative}`], {
          cwd: fileURLToPath(root), encoding: 'utf8',
        });
        sources.set(relative, source);
      }
      return {
        format: 'module',
        source: ts.transpileModule(source, {
          compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
        }).outputText,
        shortCircuit: true,
      };
    }
    return next(url, context);
  },
});

for (const key of Object.keys(process.env)) {
  if (/^ALEMBIC_(AI_|EMBED_|OPENAI_|GOOGLE_|GEMINI_|CLAUDE_|DEEPSEEK_|OLLAMA_)/.test(key) || /^(https?_proxy|all_proxy)$/i.test(key)) {
    delete process.env[key];
  }
}
const { evolutionGateEvaluator } = await import(new URL('src/agent/evaluation/gateEvaluators.ts', root));
const { analysisQualityGate } = await import(new URL('src/agent/evaluation/qualityGates.ts', root));
const { createToolRegistryView } = await import(new URL('src/tools/runtime/selection.ts', root));
const { LLMGateway } = await import(new URL('src/ai/gateway/LLMGateway.ts', root));
const { AgentEventBus } = await import(new URL('src/agent/runtime/AgentEventBus.ts', root));
const { QualityGatePolicy } = await import(new URL('src/agent/policies/QualityGatePolicy.ts', root));
const call = { tool: 'knowledge', name: 'knowledge', args: { action: 'manage', params: { operation: 'skip_evolution', id: 'recipe-1' } } };
const context = { existingRecipes: [{ id: 'recipe-1' }] };
const result = { baseline: 'Agent b303b35 source, installed pinned SDK deps, Core 516e05' };
result.evolutionWithoutReceipt = evolutionGateEvaluator({ toolCalls: [call] }, null, context);
result.evolutionWithReceipt = evolutionGateEvaluator({ toolCalls: [{ ...call, result: { status: 'evolution_skipped' } }] }, null, context);
result.insight = analysisQualityGate({
  metadata: { memoryFindingCount: 0 },
  qualityReport: {
    totalScore: 70, scores: { depthScore: 50, breadthScore: 40, coherenceScore: 60 },
    suggestions: ['Required note_finding calls are missing'],
  },
}, { outputType: 'candidate' });
const handler = () => {};
const registry = { meta: { name: 'meta', description: 'fixture', actions: { review: { description: 'fixture', params: { type: 'object', properties: {} }, handler } } } };
const view = createToolRegistryView(registry);
result.registry = { sameIdentity: view === registry, frozen: Object.isFrozen(view), sameHandler: view.meta.actions.review.handler === handler };
const gateway = new LLMGateway({ providers: { openai: { apiKey: 'fixture-key' } }, maxRetries: 0 });
globalThis.fetch = async () => ({ ok: true, json: async () => ({ choices: [{ message: { content: 'Hello!', tool_calls: null } }], usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 } }) });
result.legacyFetchFixture = await gateway.chat({ modelRef: 'openai:gpt-5.5', prompt: 'fixture' }).then(value => ({ value }), error => ({ error: error.message }));
globalThis.fetch = async () => new Response(JSON.stringify({ choices: [{ index: 0, finish_reason: 'stop', message: { role: 'assistant', content: 'Hello!' } }], usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 } }), { headers: { 'content-type': 'application/json' } });
result.responseFixture = await gateway.chat({ modelRef: 'openai:gpt-5.5', prompt: 'fixture' });
// Shorten only the timeout budget; the request/reply public seam matches Main's failing case.
const bus = new AgentEventBus();
result.requestWithoutReply = await bus.request('test:request', { question: 'meaning' }, { timeout: 10, source: 'test-agent' }).then(value => ({ value }), error => ({ error: error.message }));
const unsubscribe = bus.subscribe('test:request', event => {
  bus.publish('test:reply', { answer: 42 }, { correlationId: String(event.correlationId) });
});
result.requestWithReply = await bus.request('test:request', {}, { timeout: 100 }).then(event => ({ type: event.type, payload: event.payload }));
unsubscribe();
const policy = new QualityGatePolicy({ minEvidenceLength: 0, minFileRefs: 3, minToolCalls: 0 });
result.policyWithoutReceipt = policy.validateAfter({ reply: 'Short reply without any file refs', toolCalls: [{ tool: 'knowledge' }, { tool: 'other_tool' }] });
result.policyWithReceipt = policy.validateAfter({ reply: 'Short reply without any file refs', toolCalls: [{ tool: 'knowledge', args: { action: 'submit' }, result: { status: 'created', id: 'candidate-fixture', lifecycle: 'pending' } }] });
result.baselineModules = sources.size;
result.sourceDiffersFromWorkingTree = [...sources].filter(([path, source]) => readFileSync(new URL(path, root), 'utf8') !== source).map(([path]) => path);
console.log(JSON.stringify(result, null, 2));
