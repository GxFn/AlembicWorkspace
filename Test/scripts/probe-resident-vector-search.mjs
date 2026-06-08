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
  primeQuery:
    '在 BiliDili 中修改 VideoFeed 或 Home 页面时，请根据项目 Recipes 说明模块边界、网络 Repository、UI lazy var、SchemeRouter、resident search 和 Guard 约束。',
  searchQuery: 'VideoFeedViewController lazy var UI SchemeRouter route guard',
  semanticQuery: 'BaseViewController setupUI bindViewModel video URL preloader cache',
  activeFile: 'Sources/Features/VideoFeed/VideoFeedViewController.swift',
  language: 'swift',
  searchLimit: 6,
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
      `resident-vector-search-probe-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
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
const client = new Client({
  name: 'alembic-test-resident-vector-search-probe',
  version: '0.1.0',
});
const report = {
  ok: false,
  classification: 'unknown',
  startedAt: new Date(startedAt).toISOString(),
  durationMs: 0,
  project: basename(projectRoot),
  projectRootRelative: relative(workspaceRoot, projectRoot) || '.',
  pluginRootRelative: relative(workspaceRoot, pluginRoot) || '.',
  primeQuery: options.primeQuery,
  searchQuery: options.searchQuery,
  semanticQuery: options.semanticQuery,
  activeFile: options.activeFile,
  language: options.language,
  tools: [],
  status: null,
  diagnostics: null,
  health: null,
  prime: null,
  searches: {},
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
  report.diagnostics = await callJsonTool(
    client,
    'alembic_codex_diagnostics',
    {},
    options.timeoutMs
  );
  if (report.tools.includes('alembic_health')) {
    report.health = await callJsonTool(client, 'alembic_health', {}, options.timeoutMs);
  }

  const primeArgs = {
    operation: 'prime',
    userQuery: options.primeQuery,
    activeFile: options.activeFile,
    language: options.language,
  };
  report.prime = await callJsonTool(client, 'alembic_task', primeArgs, options.timeoutMs);

  report.searches.auto = await callJsonTool(
    client,
    'alembic_search',
    {
      query: options.searchQuery,
      mode: 'auto',
      kind: 'all',
      limit: options.searchLimit,
      language: options.language,
    },
    options.timeoutMs
  );
  report.searches.semantic = await callJsonTool(
    client,
    'alembic_search',
    {
      query: options.semanticQuery,
      mode: 'semantic',
      kind: 'all',
      limit: options.searchLimit,
      language: options.language,
    },
    options.timeoutMs
  );
  report.daemonSearch = await probeDaemonSearch(report.status, {
    limit: options.searchLimit,
    mode: 'semantic',
    query: options.searchQuery,
    timeoutMs: options.timeoutMs,
  });

  const material = report.prime?.data?.primeKnowledgeMaterial ?? null;
  const serviceBoundary = report.prime?.data?.serviceBoundary ?? null;
  const primeSearchMeta = isRecord(material?.searchMeta) ? material.searchMeta : null;
  const searchSummaries = Object.fromEntries(
    Object.entries(report.searches).map(([mode, result]) => [
      mode,
      summarizeSearchPayload(result, mode),
    ])
  );
  const directResidentSummaries = Object.values(searchSummaries).map(
    (summary) => summary.resident
  );
  const bridgeScan = scanRemovedBridge({
    searches: report.searches,
    stderr,
  });
  const nextActionTools = Array.isArray(material?.nextActions)
    ? material.nextActions.map((action) => action?.tool).filter(Boolean)
    : [];
  const acceptedKnowledge = Array.isArray(material?.acceptedKnowledge)
    ? material.acceptedKnowledge
    : [];
  const acceptedGuards = Array.isArray(material?.acceptedGuards) ? material.acceptedGuards : [];

  report.codexVisibleShout = buildCodexVisibleShout(material, directResidentSummaries);
  report.checks = {
    toolCount: report.tools.length,
    toolListContainsAlembicTask: report.tools.includes('alembic_task'),
    toolListContainsAlembicSearch: report.tools.includes('alembic_search'),
    toolListContainsAlembicHealth: report.tools.includes('alembic_health'),
    toolListContainsCodexHostResponse: report.tools.includes('codex_host_response'),
    statusInitialized: report.status?.data?.initialized === true,
    statusProjectScopeIdentity: summarizeProjectScopeIdentity(
      report.status?.data?.projectScopeIdentity
    ),
    diagnosticsProjectScopeIdentity: summarizeProjectScopeIdentity(
      report.diagnostics?.data?.projectScopeIdentity
    ),
    healthSuccess: report.health?.success === true,
    knowledgeStatus: report.status?.data?.knowledge?.status ?? null,
    vectorStatus: report.status?.data?.vectors?.status ?? report.status?.data?.vector?.status ?? null,
    primeSuccess: report.prime?.success === true,
    primeStatus: material?.status ?? null,
    acceptedKnowledgeCount: acceptedKnowledge.length,
    acceptedGuardCount: acceptedGuards.length,
    primeSearchMeta: summarizeResidentMeta(primeSearchMeta),
    primeHasResidentMeta: Boolean(summarizeResidentMeta(primeSearchMeta).route),
    directSearchSummaries: searchSummaries,
    directSearchSuccess: Object.values(report.searches).every((result) => result?.success === true),
    directSearchMessages: Object.fromEntries(
      Object.entries(report.searches).map(([mode, result]) => [mode, result?.message ?? null])
    ),
    directSearchServiceBoundaries: Object.fromEntries(
      Object.entries(searchSummaries).map(([mode, summary]) => [mode, summary.serviceBoundary])
    ),
    directSearchPluginOwned: Object.values(searchSummaries).every(
      (summary) =>
        summary.serviceBoundary?.executionPath === 'plugin-owned-codex-facing' &&
        summary.serviceBoundary?.owner === 'alembic-plugin'
    ),
    directSearchHasResidentMeta: directResidentSummaries.some((summary) =>
      Boolean(summary.route || summary.residentVector)
    ),
    directResidentAttempted: directResidentSummaries.some((summary) => summary.attempted === true),
    directResidentAvailable: directResidentSummaries.some((summary) => summary.available === true),
    directResidentUsed: directResidentSummaries.some((summary) => summary.used === true),
    directSemanticOrVectorUsed: directResidentSummaries.some(
      (summary) => summary.semanticUsed === true || summary.vectorUsed === true
    ),
    directAutoNoValidationFailure: !detectsModeValidationFailure(searchSummaries.auto),
    directAutoModeTranslated: detectsAutoToSemanticTranslation(searchSummaries.auto?.resident),
    directFallbackClear: directResidentSummaries.some(
      (summary) =>
        summary.attempted === true &&
        summary.available === false &&
        Boolean(summary.fallbackReason || summary.reason || summary.residentVector?.reason)
    ),
    baselineResultsAvailable: Object.values(searchSummaries).some(
      (summary) => summary.totalResults > 0 || summary.items.length > 0
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
      serviceBoundary?.tool === 'alembic_task',
    codexVisibleShoutDefaultsDumpEvidenceRefs: detectsEvidenceDump(report.codexVisibleShout),
    daemonSearchSummary: report.daemonSearch,
    daemonSearchHasSearchMeta: Array.isArray(report.daemonSearch?.searchMetaKeys)
      ? report.daemonSearch.searchMetaKeys.length > 0
      : false,
    removedBridgeScan: bridgeScan,
    removedBridgeAbsent: !bridgeScan.containsMcpCallPath && !bridgeScan.containsDaemonCompatBridge,
  };
  report.classification = classify(report.checks);
  report.ok = report.classification === 'resident-success' || report.classification === 'fallback-clear';
} finally {
  report.durationMs = Date.now() - startedAt;
  report.stderrTail = stderr.join('').split(/\n/).filter(Boolean).slice(-60);
  await client.close().catch(() => {});
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ outputPath, ...summarizeReport(report) }, null, 2)}\n`);
}

function summarizeSearchPayload(result, requestedMode) {
  const data = isRecord(result?.data) ? result.data : {};
  const items = Array.isArray(data.items) ? data.items : [];
  const searchMeta = isRecord(data.searchMeta) ? data.searchMeta : null;
  const serviceBoundary = isRecord(data.serviceBoundary) ? data.serviceBoundary : null;
  return {
    requestedMode,
    success: result?.success === true,
    actualMode: stringFrom(data.mode) ?? requestedMode,
    degraded: data.degraded === true,
    degradedReason: stringFrom(data.degradedReason) ?? null,
    searchMetaKeys: searchMeta ? Object.keys(searchMeta).sort() : [],
    totalResults: numberFrom(data.totalResults) ?? items.length,
    items: items.slice(0, 5).map(summarizeHit),
    resident: summarizeResidentMeta(searchMeta),
    serviceBoundary: serviceBoundary
      ? {
          executionPath: stringFrom(serviceBoundary.executionPath) ?? null,
          owner: stringFrom(serviceBoundary.owner) ?? null,
          operation: stringFrom(serviceBoundary.operation) ?? null,
          residentServiceRequested: booleanFrom(serviceBoundary.residentServiceRequested),
          sharedContractCandidate: booleanFrom(serviceBoundary.sharedContractCandidate),
          tool: stringFrom(serviceBoundary.tool) ?? null,
        }
      : null,
  };
}

function scanRemovedBridge(input) {
  const haystack = `${JSON.stringify(input.searches)}\n${input.stderr.join('\n')}`;
  return {
    containsMcpCallPath: /\/api\/v1\/mcp\/call/.test(haystack),
    containsDaemonCompatBridge: /daemon-mcp-compat-bridge/.test(haystack),
  };
}

async function probeDaemonSearch(statusPayload, request) {
  const daemon = statusPayload?.data?.daemon;
  const statePath = typeof daemon?.statePath === 'string' ? daemon.statePath : null;
  const daemonUrl = typeof daemon?.state?.url === 'string' ? daemon.state.url : null;
  if (!statePath || !daemonUrl) {
    return {
      attempted: false,
      reason: 'daemon_state_path_or_url_missing',
    };
  }

  let state = null;
  try {
    const { readFileSync } = await import('node:fs');
    state = JSON.parse(readFileSync(statePath, 'utf8'));
  } catch (error) {
    return {
      attempted: true,
      reason: `daemon_state_read_failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
  if (!state?.token) {
    return {
      attempted: true,
      reason: 'daemon_token_missing',
    };
  }

  const url = new URL('/api/v1/search', state.url || daemonUrl);
  url.searchParams.set('q', request.query);
  url.searchParams.set('mode', request.mode);
  url.searchParams.set('limit', String(request.limit));
  try {
    const response = await fetch(url, {
      headers: {
        accept: 'application/json',
        'x-alembic-daemon-token': state.token,
      },
      signal: request.timeoutMs > 0 ? AbortSignal.timeout(request.timeoutMs) : undefined,
    });
    const payload = await response.json();
    const data = isRecord(payload?.data) ? payload.data : {};
    const items = Array.isArray(data.items) ? data.items : [];
    const searchMeta = isRecord(data.searchMeta) ? data.searchMeta : null;
    return {
      attempted: true,
      httpStatus: response.status,
      success: payload?.success === true,
      query: request.query,
      requestedMode: request.mode,
      actualMode: stringFrom(data.mode) ?? null,
      total: numberFrom(data.total) ?? numberFrom(data.totalResults) ?? items.length,
      itemCount: items.length,
      searchMetaKeys: searchMeta ? Object.keys(searchMeta).sort() : [],
      searchMeta: searchMeta ? sanitizeForReport(searchMeta) : null,
      resident: summarizeResidentMeta(searchMeta),
      hits: items.slice(0, 5).map(summarizeHit),
      // token 不进入输出；这里只记录 endpoint 的路径语义，避免长期报告带本机私密细节。
      endpoint: '/api/v1/search',
    };
  } catch (error) {
    return {
      attempted: true,
      reason: `daemon_search_failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

function summarizeResidentMeta(searchMeta) {
  const meta = isRecord(searchMeta) ? searchMeta : {};
  const residentSearch = isRecord(meta.residentSearch)
    ? meta.residentSearch
    : meta.route === 'alembic-resident-service' || meta.route === 'resident-search'
      ? meta
      : {};
  const innerSearchMeta = isRecord(residentSearch.searchMeta)
    ? residentSearch.searchMeta
    : isRecord(meta.searchMeta)
      ? meta.searchMeta
      : null;
  const residentVector = isRecord(meta.residentVector)
    ? meta.residentVector
    : isRecord(residentSearch.residentVector)
      ? residentSearch.residentVector
      : isRecord(meta.vector)
        ? meta.vector
        : null;

  return {
    route: stringFrom(residentSearch.route) ?? stringFrom(meta.route) ?? null,
    coreRoute: stringFrom(residentSearch.coreRoute) ?? stringFrom(meta.coreRoute) ?? null,
    service: stringFrom(residentSearch.service) ?? stringFrom(meta.service) ?? null,
    attempted: booleanFrom(residentSearch.attempted),
    available: booleanFrom(residentSearch.available),
    used: booleanFrom(residentSearch.used),
    codexRequestedMode:
      stringFrom(residentSearch.codexRequestedMode) ??
      stringFrom(meta.codexRequestedMode) ??
      stringFrom(innerSearchMeta?.codexRequestedMode) ??
      null,
    residentRequestMode:
      stringFrom(residentSearch.residentRequestMode) ??
      stringFrom(meta.residentRequestMode) ??
      stringFrom(innerSearchMeta?.residentRequestMode) ??
      null,
    semanticUsed: booleanFrom(residentSearch.semanticUsed) ?? booleanFrom(meta.semanticUsed),
    vectorUsed: booleanFrom(residentSearch.vectorUsed) ?? booleanFrom(meta.vectorUsed),
    requestedMode: stringFrom(residentSearch.requestedMode) ?? stringFrom(meta.requestedMode) ?? null,
    actualMode: stringFrom(residentSearch.actualMode) ?? stringFrom(meta.actualMode) ?? null,
    fallbackReason:
      stringFrom(residentSearch.fallbackReason) ?? stringFrom(meta.fallbackReason) ?? null,
    reason: stringFrom(residentSearch.reason) ?? stringFrom(residentVector?.reason) ?? null,
    resultCount:
      numberFrom(residentSearch.resultCount) ?? numberFrom(meta.resultCount) ?? null,
    durationMs: numberFrom(residentSearch.durationMs) ?? numberFrom(meta.durationMs) ?? null,
    searchMetaKeys: Object.keys(meta).sort(),
    innerSearchMetaKeys: innerSearchMeta ? Object.keys(innerSearchMeta).sort() : [],
    residentVector: residentVector
      ? {
          available: booleanFrom(residentVector.available),
          reason: stringFrom(residentVector.reason) ?? null,
          stats: summarizeVectorStats(residentVector.stats),
        }
      : null,
  };
}

function summarizeVectorStats(stats) {
  if (!isRecord(stats)) {
    return null;
  }
  return {
    count: numberFrom(stats.count) ?? null,
    dimension: numberFrom(stats.dimension) ?? null,
    embedProviderAvailable: booleanFrom(stats.embedProviderAvailable),
    hasIndex: booleanFrom(stats.hasIndex),
    indexSize: numberFrom(stats.indexSize) ?? null,
    quantized: booleanFrom(stats.quantized),
  };
}

function summarizeHit(item) {
  if (!isRecord(item)) {
    return { title: String(item) };
  }
  return {
    id: stringFrom(item.id) ?? null,
    title: stringFrom(item.title) ?? stringFrom(item.trigger) ?? null,
    kind: stringFrom(item.kind) ?? stringFrom(item.type) ?? null,
    score: numberFrom(item.score) ?? null,
    trigger: stringFrom(item.trigger) ?? null,
  };
}

function buildCodexVisibleShout(material, residentSummaries) {
  const knowledge = Array.isArray(material?.acceptedKnowledge) ? material.acceptedKnowledge : [];
  const guards = Array.isArray(material?.acceptedGuards) ? material.acceptedGuards : [];
  const available = residentSummaries.find((summary) => summary.available === true);
  const fallback = residentSummaries.find(
    (summary) =>
      summary.attempted === true &&
      summary.available === false &&
      Boolean(summary.reason || summary.fallbackReason || summary.residentVector?.reason)
  );

  const receipt =
    material?.status === 'delivered'
      ? `Prime 收到了 BiliDili 的关键约束：${knowledge.length} 条 Recipe 和 ${guards.length} 条 Guard 已就位；我会先按 SchemeRouter 解耦、RouteError/RouteResult、AnalyticsMiddleware 注入、Feature UI lazy var、ModuleManager 生命周期和 Protocol 命名后缀来判断后续动作。`
      : 'Prime 没有交付可用的 BiliDili 知识，我不会假装已经收到 Recipe / Guard 约束。';
  if (available) {
    return `${receipt} Resident search telemetry 留在 payload 中：本轮看到 ${available.route} 可用，semanticUsed=${available.semanticUsed === true}，vectorUsed=${available.vectorUsed === true}，used=${available.used === true}；正文不默认倾倒 evidenceRefs 或 path:line。`;
  }
  if (fallback) {
    return `${receipt} Resident search 已尝试但降级，原因是 ${fallback.reason || fallback.fallbackReason || fallback.residentVector?.reason}；baseline search 结果仍会用作后续判断，telemetry 只留在 payload。`;
  }
  return `${receipt} Direct search 的 resident metadata 尚未形成可用证据；后续只依据 payload 里的 route/fallback 字段归类，不把 telemetry 当作可见呐喊主体。`;
}

function detectsEvidenceDump(value) {
  if (typeof value !== 'string') {
    return false;
  }
  const pathLikeMatches = value.match(/(?:^|\s)[\w./-]+\.(?:swift|md|ts|js)(?::\d+)?/g) ?? [];
  return pathLikeMatches.length >= 2 || /行号缺失|missing line/i.test(value);
}

function classify(checks) {
  if (!checks.removedBridgeAbsent) {
    return 'mcp-bridge-regression';
  }
  if (!checks.primeSuccess || !checks.directSearchSuccess) {
    const messages = Object.values(checks.directSearchMessages || {});
    if (messages.some((message) => /POST \/api\/v1\/mcp\/call/.test(String(message)))) {
      return 'mcp-bridge-route-not-found';
    }
    return 'mcp-call-failed';
  }
  if (checks.toolListContainsCodexHostResponse || checks.nextActionsContainCodexHostResponse) {
    return 'tool-boundary-regression';
  }
  if (!checks.directSearchPluginOwned) {
    return 'search-boundary-regression';
  }
  if (!checks.directAutoNoValidationFailure) {
    return 'auto-mode-validation-regression';
  }
  if (!checks.directAutoModeTranslated) {
    return 'missing-auto-mode-normalization-evidence';
  }
  if (!checks.daemonSearchHasSearchMeta) {
    return 'daemon-missing-searchmeta';
  }
  if (!checks.directSearchHasResidentMeta) {
    return 'missing-resident-metadata';
  }
  if (checks.directResidentAvailable && checks.directResidentUsed && checks.directSemanticOrVectorUsed) {
    return 'resident-success';
  }
  if (checks.directResidentAvailable && checks.directResidentUsed) {
    return 'resident-telemetry-missing';
  }
  if (checks.directFallbackClear && checks.baselineResultsAvailable) {
    return 'fallback-clear';
  }
  if (checks.directResidentAvailable && !checks.directResidentUsed) {
    return 'resident-available-no-hit';
  }
  return 'resident-inconclusive';
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
    classification: value.classification,
    durationMs: value.durationMs,
    project: value.project,
    initialized: value.status?.data?.initialized,
    toolCount: value.checks.toolCount,
    toolListContainsAlembicTask: value.checks.toolListContainsAlembicTask,
    toolListContainsAlembicSearch: value.checks.toolListContainsAlembicSearch,
    toolListContainsAlembicHealth: value.checks.toolListContainsAlembicHealth,
    statusProjectScopeIdentity: value.checks.statusProjectScopeIdentity,
    diagnosticsProjectScopeIdentity: value.checks.diagnosticsProjectScopeIdentity,
    healthSuccess: value.checks.healthSuccess,
    knowledgeStatus: value.checks.knowledgeStatus,
    vectorStatus: value.checks.vectorStatus,
    primeStatus: value.checks.primeStatus,
    acceptedKnowledgeCount: value.checks.acceptedKnowledgeCount,
    acceptedGuardCount: value.checks.acceptedGuardCount,
    primeResident: value.checks.primeSearchMeta,
    directSearchSummaries: value.checks.directSearchSummaries,
    directSearchMessages: value.checks.directSearchMessages,
    directSearchServiceBoundaries: value.checks.directSearchServiceBoundaries,
    directAutoNoValidationFailure: value.checks.directAutoNoValidationFailure,
    directAutoModeTranslated: value.checks.directAutoModeTranslated,
    daemonSearchSummary: value.checks.daemonSearchSummary,
    removedBridgeScan: value.checks.removedBridgeScan,
    serviceBoundaryExecutionPath: value.checks.serviceBoundaryExecutionPath,
    serviceBoundaryOwner: value.checks.serviceBoundaryOwner,
    serviceBoundaryResidentServiceRequested: value.checks.serviceBoundaryResidentServiceRequested,
    nextActionsContainCodexHostResponse: value.checks.nextActionsContainCodexHostResponse,
    codexVisibleShoutDefaultsDumpEvidenceRefs:
      value.checks.codexVisibleShoutDefaultsDumpEvidenceRefs,
    codexVisibleShout: value.codexVisibleShout,
  };
}

function summarizeProjectScopeIdentity(identity) {
  if (!isRecord(identity)) {
    return null;
  }
  return {
    available: booleanFrom(identity.available),
    controlRootRelative: displayWorkspacePath(identity.controlRoot),
    currentFolderPathRelative: displayWorkspacePath(identity.currentFolderPath),
    dataRootRelative: displayWorkspacePath(identity.dataRoot),
    folderCount: numberFrom(identity.folderCount) ?? null,
    mode: stringFrom(identity.mode) ?? null,
    projectId: stringFrom(identity.projectId) ?? null,
    projectScopeId: stringFrom(identity.projectScopeId) ?? null,
    reason: stringFrom(identity.reason) ?? null,
    serviceScopeId: stringFrom(identity.serviceScopeId) ?? null,
    source: stringFrom(identity.source) ?? null,
    storageKind: stringFrom(identity.storageKind) ?? null,
  };
}

function displayWorkspacePath(value) {
  if (typeof value !== 'string' || value.length === 0) {
    return null;
  }
  const rel = relative(workspaceRoot, value);
  return rel.length > 0 && !rel.startsWith('..') ? rel : value;
}

function detectsModeValidationFailure(summary) {
  if (!summary) {
    return false;
  }
  const resident = summary.resident ?? {};
  const text = [
    summary.degradedReason,
    resident.fallbackReason,
    resident.reason,
    resident.residentVector?.reason,
  ]
    .filter(Boolean)
    .join('\n');
  return /Query parameter validation failed|mode=.*auto|validation/i.test(text);
}

function detectsAutoToSemanticTranslation(resident) {
  if (!resident) {
    return false;
  }
  const codexMode = resident.codexRequestedMode ?? resident.requestedMode;
  return codexMode === 'auto' && resident.residentRequestMode === 'semantic';
}

function sanitizeForReport(value) {
  return JSON.parse(JSON.stringify(value));
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
    } else if (arg === '--prime-query') {
      parsed.primeQuery = args[index + 1] || parsed.primeQuery;
      index += 1;
    } else if (arg === '--search-query') {
      parsed.searchQuery = args[index + 1] || parsed.searchQuery;
      index += 1;
    } else if (arg === '--semantic-query') {
      parsed.semanticQuery = args[index + 1] || parsed.semanticQuery;
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
    } else if (arg === '--search-limit') {
      const parsedLimit = Number.parseInt(args[index + 1] || '', 10);
      if (Number.isFinite(parsedLimit) && parsedLimit > 0) {
        parsed.searchLimit = parsedLimit;
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
  process.stdout.write(`Probe Alembic Codex MCP resident vector search for a real project.

Usage:
  node Test/scripts/probe-resident-vector-search.mjs [options]

Options:
  --project <path>          Target project. Default: BiliDili
  --plugin <path>           AlembicPlugin repository. Default: AlembicPlugin
  --prime-query <text>      Prime userQuery.
  --search-query <text>     Direct alembic_search auto query.
  --semantic-query <text>   Direct alembic_search semantic query.
  --search-limit <number>   Direct search limit. Default: 6
  --active-file <path>      Active file passed to prime.
  --language <name>         Language passed to prime/search. Default: swift
  --timeout-ms <ms>         MCP call timeout. Default: 60000
  --output <path>           JSON report output path. Default: Test/tmp/...
  -h, --help                Show this help.
`);
  process.exit(0);
}

function isRecord(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function stringFrom(value) {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function numberFrom(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function booleanFrom(value) {
  return typeof value === 'boolean' ? value : undefined;
}

function withTimeout(promise, timeoutMs, messageFactory) {
  let timer = null;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(messageFactory())), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
