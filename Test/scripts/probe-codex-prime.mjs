#!/usr/bin/env node

import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const workspaceRoot = resolve(import.meta.dirname, '..', '..');
const defaults = {
  project: 'BiliDili',
  plugin: 'AlembicPlugin',
  timeoutMs: 60000,
  query:
    '在 BiliDili 中修改 VideoFeed 或 Home 页面时，请根据项目 Recipes 说明模块边界、网络 Repository、UI lazy var、SchemeRouter 和 Guard 约束。',
  activeFile: 'Sources/Features/VideoFeed/VideoFeedViewController.swift',
  language: 'swift',
};

const options = parseArgs(process.argv.slice(2));
const projectRoot = resolveWorkspacePath(options.project);
const pluginRoot = resolveWorkspacePath(options.plugin);
const outputPath = options.output
  ? resolve(options.output)
  : join(
      workspaceRoot,
      'Test',
      'tmp',
      `codex-prime-probe-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    );

const pluginRequire = createRequire(join(pluginRoot, 'package.json'));
const { Client } = await import(
  pathToFileURL(pluginRequire.resolve('@modelcontextprotocol/sdk/client/index.js')).href
);
const { StdioClientTransport } = await import(
  pathToFileURL(pluginRequire.resolve('@modelcontextprotocol/sdk/client/stdio.js')).href
);

const stderr = [];
const transport = new StdioClientTransport({
  command: process.execPath,
  args: [join(pluginRoot, 'dist', 'bin', 'codex-mcp.js')],
  cwd: pluginRoot,
  env: {
    ...process.env,
    ALEMBIC_CHANNEL_ID: 'codex',
    ALEMBIC_CODEX_MCP_MODE: '1',
    ALEMBIC_MCP_MODE: '1',
    ALEMBIC_MCP_TIER: 'agent',
    ALEMBIC_PLUGIN_HOST: 'codex',
    ALEMBIC_PROJECT_DIR: projectRoot,
    ALEMBIC_QUIET: '1',
    ALEMBIC_RUNTIME_MODE: 'plugin',
    CODEX_WORKSPACE_DIR: projectRoot,
    INIT_CWD: projectRoot,
    PWD: projectRoot,
  },
  stderr: 'pipe',
});
transport.stderr?.on('data', (chunk) => stderr.push(String(chunk)));

const startedAt = Date.now();
const client = new Client({ name: 'alembic-test-codex-prime-probe', version: '0.1.0' });
const report = {
  ok: false,
  startedAt: new Date(startedAt).toISOString(),
  durationMs: 0,
  project: basename(projectRoot),
  projectRootRelative: relative(workspaceRoot, projectRoot) || '.',
  pluginRootRelative: relative(workspaceRoot, pluginRoot) || '.',
  query: options.query,
  activeFile: options.activeFile,
  language: options.language,
  tools: [],
  status: null,
  prime: null,
  checks: {},
  codexVisibleShout: '',
  stderrTail: [],
};

try {
  await withTimeout(
    client.connect(transport, { timeout: options.timeoutMs }),
    options.timeoutMs + 2000,
    () => `MCP connect timed out\n${stderr.join('')}`
  );

  const toolsResult = await withTimeout(
    client.listTools(undefined, { timeout: options.timeoutMs }),
    options.timeoutMs + 2000,
    () => `MCP tools/list timed out\n${stderr.join('')}`
  );
  report.tools = toolsResult.tools.map((tool) => tool.name).sort();

  report.status = await callJsonTool(client, 'alembic_codex_status', {}, options.timeoutMs);

  const primeArgs = {
    operation: 'prime',
    userQuery: options.query,
    activeFile: options.activeFile,
    language: options.language,
  };
  report.prime = await callJsonTool(client, 'alembic_task', primeArgs, options.timeoutMs);

  const material = report.prime?.data?.primeKnowledgeMaterial ?? null;
  const serviceBoundary = report.prime?.data?.serviceBoundary ?? null;
  const nextActionTools = Array.isArray(material?.nextActions)
    ? material.nextActions.map((action) => action?.tool).filter(Boolean)
    : [];
  const acceptedKnowledge = Array.isArray(material?.acceptedKnowledge)
    ? material.acceptedKnowledge
    : [];
  const acceptedGuards = Array.isArray(material?.acceptedGuards) ? material.acceptedGuards : [];
  const evidenceRefs = [...acceptedKnowledge, ...acceptedGuards].flatMap((item) =>
    Array.isArray(item?.evidenceRefs) ? item.evidenceRefs : []
  );

  report.checks = {
    statusDelivered: material?.status === 'delivered',
    hasPrimeKnowledgeMaterial: Boolean(material),
    acceptedKnowledgeCount: acceptedKnowledge.length,
    acceptedGuardCount: acceptedGuards.length,
    evidenceRefCount: evidenceRefs.length,
    payloadEvidenceRefsRetained: evidenceRefs.length > 0,
    hostResponseAction: material?.hostResponse?.action ?? null,
    hostResponseRequired: material?.hostResponse?.required === true,
    hostResponseTiming: material?.hostResponse?.timing ?? null,
    hostResponseRequiredBeforeNextAction:
      material?.hostResponse?.requiredBeforeNextAction === true,
    hostResponseVisibility: material?.hostResponse?.visibility ?? null,
    hostResponseImmediateDeveloperVisible:
      material?.hostResponse?.timing === 'immediate_after_prime' &&
      material?.hostResponse?.requiredBeforeNextAction === true &&
      material?.hostResponse?.visibility === 'developer_visible',
    shoutInstructionPresent:
      typeof material?.shoutInstruction === 'string' && material.shoutInstruction.length > 0,
    shoutInstructionImmediate:
      typeof material?.shoutInstruction === 'string' &&
      /immediate|before.+next action|先|下一/i.test(material.shoutInstruction),
    shoutInstructionReadable:
      typeof material?.shoutInstruction === 'string' &&
      /short, active knowledge receipt|briefly and actively shout|可见|主动/i.test(
        material.shoutInstruction
      ),
    shoutInstructionNoDefaultEvidenceDump:
      typeof material?.shoutInstruction === 'string' &&
      /do not (?:list|dump).*(?:evidenceRefs|paths|line numbers)|do not call out missing line numbers/i.test(
        material.shoutInstruction
      ),
    nextActionTools,
    nextActionsContainCodexHostResponse: nextActionTools.includes('codex_host_response'),
    serviceBoundaryExecutionPath: serviceBoundary?.executionPath ?? null,
    serviceBoundaryOwner: serviceBoundary?.owner ?? null,
    serviceBoundaryResidentServiceRequested: serviceBoundary?.residentServiceRequested ?? null,
    serviceBoundaryTool: serviceBoundary?.tool ?? null,
    serviceBoundaryPluginOwned:
      serviceBoundary?.executionPath === 'plugin-owned-codex-facing' &&
      serviceBoundary?.owner === 'alembic-plugin' &&
      serviceBoundary?.residentServiceRequested === false &&
      serviceBoundary?.tool === 'alembic_task',
  };
  report.codexVisibleShout = buildCodexVisibleShout(material);
  report.checks.codexVisibleShoutDefaultsDumpEvidenceRefs = detectsEvidenceDump(
    report.codexVisibleShout
  );
  report.ok =
    report.prime?.success === true &&
    report.checks.statusDelivered &&
    report.checks.acceptedKnowledgeCount + report.checks.acceptedGuardCount > 0 &&
    report.checks.evidenceRefCount > 0 &&
    report.checks.hostResponseAction === 'shout_prime_knowledge_receipt' &&
    report.checks.hostResponseRequired &&
    report.checks.hostResponseImmediateDeveloperVisible &&
    report.checks.shoutInstructionReadable &&
    report.checks.shoutInstructionNoDefaultEvidenceDump &&
    !report.checks.codexVisibleShoutDefaultsDumpEvidenceRefs &&
    report.checks.serviceBoundaryPluginOwned &&
    !report.checks.nextActionsContainCodexHostResponse;
} finally {
  report.durationMs = Date.now() - startedAt;
  report.stderrTail = stderr.join('').split(/\n/).filter(Boolean).slice(-40);
  await client.close().catch(() => {});
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ outputPath, ...summarizeReport(report) }, null, 2)}\n`);
}

function buildCodexVisibleShout(material) {
  if (!material) {
    return '我没有收到 primeKnowledgeMaterial，因此不能声称接收到了 BiliDili 的 Recipe 或 Guard 知识。';
  }
  if (material.status === 'empty') {
    return '我已执行 Alembic prime，但这次没有匹配到可用的 BiliDili Recipe 或 Guard；后续只能继续做显式代码阅读与验证。';
  }
  if (material.status === 'degraded') {
    return '我已执行 Alembic prime，但 prime 降级，未交付可用的 BiliDili Recipe 或 Guard；我不会假装已经接收项目知识。';
  }

  const knowledge = Array.isArray(material.acceptedKnowledge) ? material.acceptedKnowledge : [];
  const guards = Array.isArray(material.acceptedGuards) ? material.acceptedGuards : [];
  const acceptedItems = [...knowledge, ...guards];
  const lines = [
    `Prime 收到了 BiliDili 的关键约束：${knowledge.length} 条 Recipe 和 ${guards.length} 条 Guard 已就位。`,
  ];
  for (const item of acceptedItems.slice(0, 6)) {
    const title = item.title || item.trigger || item.id;
    const hint = item.actionHint || item.summary || item.trigger || '';
    lines.push(`- ${title}: ${summarizeActionHint(hint)}`);
  }
  if (material.hostResponse?.required) {
    lines.push(
      '接下来我会先按这些约束判断模块边界、路由入口、初始化时机、UI 构建方式和命名规则；证据路径保留在 payload 中，需要复核时再展开。'
    );
  }
  return lines.join('\n');
}

function summarizeActionHint(value) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return '已作为后续判断依据接收。';
  }
  const normalized = value.replace(/\s+/g, ' ').trim();
  const arrowIndex = normalized.indexOf('→');
  const actionable = arrowIndex >= 0 ? normalized.slice(arrowIndex + 1).trim() : normalized;
  return actionable.length > 180 ? `${actionable.slice(0, 177)}...` : actionable;
}

function detectsEvidenceDump(value) {
  if (typeof value !== 'string') {
    return false;
  }
  const pathLikeMatches = value.match(/(?:^|\s)[\w./-]+\.(?:swift|md|ts|js)(?::\d+)?/g) ?? [];
  return pathLikeMatches.length >= 2 || /行号缺失|missing line/i.test(value);
}

async function callJsonTool(client, name, args, timeoutMs) {
  const result = await withTimeout(
    client.callTool({ name, arguments: args }, undefined, { timeout: timeoutMs }),
    timeoutMs + 2000,
    () => `MCP ${name} timed out\n${stderr.join('')}`
  );
  const text = result.content?.find((item) => item.type === 'text')?.text;
  if (typeof text !== 'string' || text.length === 0) {
    throw new Error(`MCP ${name} returned no text content: ${JSON.stringify(result)}`);
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`MCP ${name} returned invalid JSON: ${error.message}\n${text}`);
  }
}

function summarizeReport(value) {
  return {
    ok: value.ok,
    durationMs: value.durationMs,
    project: value.project,
    initialized: value.status?.data?.initialized,
    status: value.prime?.data?.primeKnowledgeMaterial?.status,
    acceptedKnowledgeCount: value.checks.acceptedKnowledgeCount,
    acceptedGuardCount: value.checks.acceptedGuardCount,
    evidenceRefCount: value.checks.evidenceRefCount,
    payloadEvidenceRefsRetained: value.checks.payloadEvidenceRefsRetained,
    hostResponseAction: value.checks.hostResponseAction,
    hostResponseTiming: value.checks.hostResponseTiming,
    hostResponseRequiredBeforeNextAction: value.checks.hostResponseRequiredBeforeNextAction,
    hostResponseVisibility: value.checks.hostResponseVisibility,
    shoutInstructionReadable: value.checks.shoutInstructionReadable,
    shoutInstructionNoDefaultEvidenceDump: value.checks.shoutInstructionNoDefaultEvidenceDump,
    codexVisibleShoutDefaultsDumpEvidenceRefs:
      value.checks.codexVisibleShoutDefaultsDumpEvidenceRefs,
    serviceBoundaryExecutionPath: value.checks.serviceBoundaryExecutionPath,
    serviceBoundaryOwner: value.checks.serviceBoundaryOwner,
    serviceBoundaryResidentServiceRequested: value.checks.serviceBoundaryResidentServiceRequested,
    nextActionsContainCodexHostResponse: value.checks.nextActionsContainCodexHostResponse,
    codexVisibleShout: value.codexVisibleShout,
  };
}

function resolveWorkspacePath(input) {
  if (input.startsWith('/')) {
    return resolve(input);
  }
  return resolve(workspaceRoot, input);
}

function parseArgs(args) {
  const parsed = { ...defaults, output: '' };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--project') {
      parsed.project = args[index + 1] || parsed.project;
      index += 1;
    } else if (arg === '--plugin') {
      parsed.plugin = args[index + 1] || parsed.plugin;
      index += 1;
    } else if (arg === '--query') {
      parsed.query = args[index + 1] || parsed.query;
      index += 1;
    } else if (arg === '--active-file') {
      parsed.activeFile = args[index + 1] || parsed.activeFile;
      index += 1;
    } else if (arg === '--language') {
      parsed.language = args[index + 1] || parsed.language;
      index += 1;
    } else if (arg === '--timeout-ms') {
      const parsedTimeout = Number.parseInt(args[index + 1] || '', 10);
      if (Number.isFinite(parsedTimeout) && parsedTimeout > 0) {
        parsed.timeoutMs = parsedTimeout;
      }
      index += 1;
    } else if (arg === '--output') {
      parsed.output = args[index + 1] || '';
      index += 1;
    } else if (arg === '-h' || arg === '--help') {
      printHelpAndExit();
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return parsed;
}

function printHelpAndExit() {
  process.stdout.write(`Probe Alembic Codex MCP prime for a real project.

Usage:
  node Test/scripts/probe-codex-prime.mjs [options]

Options:
  --project <path>       Target project. Default: BiliDili
  --plugin <path>        AlembicPlugin repository. Default: AlembicPlugin
  --query <text>         Prime userQuery.
  --active-file <path>   Active file passed to prime.
  --language <name>      Language passed to prime. Default: swift
  --timeout-ms <ms>      MCP call timeout. Default: 60000
  --output <path>        JSON report output path. Default: Test/tmp/...
  -h, --help             Show this help.
`);
  process.exit(0);
}

function withTimeout(promise, timeoutMs, messageFactory) {
  let timer = null;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(messageFactory())), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
