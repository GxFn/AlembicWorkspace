#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const workspaceRoot = resolve(import.meta.dirname, '..', '..');
const defaults = {
  activeFile: 'Sources/Features/VideoFeed/VideoFeedViewController.swift',
  language: 'swift',
  phase: 'resident',
  plugin: 'AlembicPlugin',
  primeQuery:
    '在 BiliDili 中验证 unified resident service：说明 VideoFeed/Home 修改前必须接受的 Recipe、Guard、resident search、Dashboard handoff 和 job 边界。',
  project: 'BiliDili',
  searchLimit: 6,
  searchQuery: 'VideoFeedViewController Home SchemeRouter Recipe Guard resident service',
  semanticQuery: 'BiliDili BaseViewController setupUI bindViewModel video preloader cache',
  timeoutMs: 60000,
};

const options = parseArgs(process.argv.slice(2));
if (options.help) {
  process.stdout.write(usage());
  process.exit(0);
}

const projectRoot = resolveWorkspacePath(options.project);
const pluginRoot = resolveWorkspacePath(options.plugin);
const outputPath = options.output
  ? resolve(options.output)
  : join(
      workspaceRoot,
      'Test',
      'tmp',
      `unified-resident-service-${options.phase}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    );

assertDirectory(projectRoot, 'project');
assertDirectory(pluginRoot, 'plugin');

const pluginRequire = createRequire(join(pluginRoot, 'package.json'));
const { Client } = await import(
  pathToFileURL(pluginRequire.resolve('@modelcontextprotocol/sdk/client/index.js')).href
);
const { StdioClientTransport } = await import(
  pathToFileURL(pluginRequire.resolve('@modelcontextprotocol/sdk/client/stdio.js')).href
);

const stderr = [];
const startedAt = Date.now();
const report = {
  schemaVersion: 1,
  ok: false,
  classification: 'unknown',
  phase: options.phase,
  startedAt: new Date(startedAt).toISOString(),
  durationMs: 0,
  project: basename(projectRoot),
  projectRootRelative: relative(workspaceRoot, projectRoot) || '.',
  pluginRootRelative: relative(workspaceRoot, pluginRoot) || '.',
  config: {
    activeFile: options.activeFile,
    language: options.language,
    primeQuery: options.primeQuery,
    searchLimit: options.searchLimit,
    searchQuery: options.searchQuery,
    semanticQuery: options.semanticQuery,
    timeoutMs: options.timeoutMs,
  },
  versions: collectVersions({ pluginRoot }),
  tools: [],
  status: null,
  diagnostics: null,
  dashboard: null,
  jobs: {},
  prime: null,
  searches: {},
  directDaemon: null,
  checks: {},
  codexVisibleShout: '',
  stderrTail: [],
};

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

const client = new Client({
  name: 'alembic-test-unified-resident-service-probe',
  version: '0.1.0',
});

try {
  await withTimeout(
    client.connect(transport, { timeout: options.timeoutMs }),
    options.timeoutMs + 2000,
    () => `MCP connect timed out\n${stderr.join('')}`
  );

  const tools = await withTimeout(
    client.listTools(undefined, { timeout: options.timeoutMs }),
    options.timeoutMs + 2000,
    () => `MCP tools/list timed out\n${stderr.join('')}`
  );
  report.tools = tools.tools.map((tool) => tool.name).sort();

  report.status = await callJsonTool(client, 'alembic_codex_status', {}, options.timeoutMs);
  report.diagnostics = await callJsonTool(
    client,
    'alembic_codex_diagnostics',
    {},
    options.timeoutMs
  );
  report.dashboard = await callJsonTool(client, 'alembic_codex_dashboard', {}, options.timeoutMs);
  report.jobs.all = await callJsonTool(client, 'alembic_codex_job', { limit: 5 }, options.timeoutMs);
  report.jobs.bootstrap = await callJsonTool(
    client,
    'alembic_codex_job',
    { kind: 'bootstrap', limit: 5 },
    options.timeoutMs
  );
  report.jobs.rescan = await callJsonTool(
    client,
    'alembic_codex_job',
    { kind: 'rescan', limit: 5 },
    options.timeoutMs
  );

  report.prime = await callJsonTool(
    client,
    'alembic_task',
    {
      operation: 'prime',
      userQuery: options.primeQuery,
      activeFile: options.activeFile,
      language: options.language,
    },
    options.timeoutMs
  );
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

  report.directDaemon = await probeDirectDaemon(report.status, {
    limit: options.searchLimit,
    query: options.searchQuery,
    timeoutMs: options.timeoutMs,
  });

  report.codexVisibleShout = buildCodexVisibleShout(report.prime, report.searches);
  report.checks = buildChecks(report, stderr);
  report.classification = classify(report.phase, report.checks);
  report.ok = report.classification === 'pass' || report.classification === 'pass-with-clear-fallback';
} finally {
  report.durationMs = Date.now() - startedAt;
  report.stderrTail = stderr.join('').split(/\n/).filter(Boolean).slice(-80);
  await client.close().catch(() => {});
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ outputPath, ...summarizeReport(report) }, null, 2)}\n`);
}

function buildChecks(value, stderrLines) {
  const status = value.status?.data ?? {};
  const residentServiceSummary = status.residentService?.summary ?? {};
  const enhancementRoute = status.enhancementRoute ?? {};
  const dashboardData = value.dashboard?.data ?? {};
  const primeMaterial = value.prime?.data?.primeKnowledgeMaterial ?? null;
  const acceptedKnowledge = Array.isArray(primeMaterial?.acceptedKnowledge)
    ? primeMaterial.acceptedKnowledge
    : [];
  const acceptedGuards = Array.isArray(primeMaterial?.acceptedGuards)
    ? primeMaterial.acceptedGuards
    : [];
  const searchSummaries = Object.fromEntries(
    Object.entries(value.searches).map(([mode, result]) => [mode, summarizeSearch(result)])
  );
  const directResidentSummaries = Object.values(searchSummaries).map((summary) => summary.resident);
  const jobSummaries = Object.fromEntries(
    Object.entries(value.jobs).map(([kind, result]) => [kind, summarizeJobPayload(result)])
  );
  const removedBridgeScan = scanRemovedPaths({
    report: value,
    stderr: stderrLines,
  });
  const statusText = JSON.stringify({
    diagnostics: value.diagnostics,
    status: value.status,
  });

  return {
    toolCount: value.tools.length,
    toolListContainsCodexHostResponse: value.tools.includes('codex_host_response'),
    packageVersion: status.packageVersion ?? null,
    initialized: status.initialized === true,
    knowledgeStatus: status.knowledge?.status ?? null,
    vectorStatus: status.knowledge?.vector?.status ?? null,
    residentServiceOwner: residentServiceSummary.owner ?? status.residentService?.status?.owner ?? null,
    residentServiceRoute: residentServiceSummary.route ?? status.residentService?.status?.route ?? null,
    residentAvailableFeatures: Array.isArray(residentServiceSummary.availableFeatures)
      ? residentServiceSummary.availableFeatures
      : [],
    enhancementSelected: enhancementRoute.selected ?? null,
    enhancementReason: enhancementRoute.reason ?? null,
    daemonReady: status.daemon?.ready === true,
    daemonStatus: status.daemon?.status ?? null,
    daemonUrl: status.daemon?.state?.url ?? null,
    dashboardSuccess: value.dashboard?.success === true,
    dashboardUrl: dashboardData.dashboardUrl ?? null,
    dashboardServiceBoundary: dashboardData.serviceBoundary ?? null,
    dashboardResidentService: dashboardData.residentService ?? null,
    dashboardFailClosed:
      value.dashboard?.success === false &&
      !dashboardData.dashboardUrl &&
      (/Dashboard handoff requires|handoff|daemon|active Alembic runtime|active-runtime-unavailable/i.test(
        String(value.dashboard?.message || '')
      ) ||
        dashboardData.errorCode === 'CODEX_HOST_PROJECT_DISCONNECTED' ||
        dashboardData.hostProjectAlignment?.handoffMismatch?.reason === 'active-runtime-unavailable'),
    diagnosticsMentionsEmbeddedOrUnavailable:
      /embedded Plugin runtime|resident service is unavailable|daemon API is ready|local Alembic install/i.test(
        statusText
      ),
    primeSuccess: value.prime?.success === true,
    primeStatus: primeMaterial?.status ?? null,
    acceptedKnowledgeCount: acceptedKnowledge.length,
    acceptedGuardCount: acceptedGuards.length,
    primeReceiptId: primeMaterial?.receiptId ?? null,
    primeHostResponse: primeMaterial?.hostResponse ?? null,
    primeServiceBoundary: value.prime?.data?.serviceBoundary ?? null,
    searchSummaries,
    directSearchSuccess: Object.values(value.searches).every((result) => result?.success === true),
    directResidentAttempted: directResidentSummaries.some((summary) => summary.attempted === true),
    directResidentAvailable: directResidentSummaries.some((summary) => summary.available === true),
    directResidentUsed: directResidentSummaries.some((summary) => summary.used === true),
    directResidentSemanticOrVectorUsed: directResidentSummaries.some(
      (summary) => summary.semanticUsed === true || summary.vectorUsed === true
    ),
    directFallbackClear: directResidentSummaries.some(
      (summary) =>
        summary.attempted === true &&
        summary.available === false &&
        Boolean(summary.reason || summary.fallbackReason || summary.residentVector?.reason)
    ),
    directAutoModeTranslated: detectsAutoToSemanticTranslation(searchSummaries.auto?.resident),
    directSearchHasResidentMeta: directResidentSummaries.some((summary) =>
      Boolean(summary.route || summary.residentVector)
    ),
    jobSummaries,
    jobAnyIds: Object.values(jobSummaries).flatMap((summary) => summary.jobIds),
    jobResidentServiceRoutes: Object.values(jobSummaries)
      .map((summary) => summary.residentService?.route)
      .filter(Boolean),
    directDaemonAttempted: value.directDaemon?.attempted === true,
    directDaemonHealthOk: value.directDaemon?.health?.ok === true,
    directDaemonSearchOk: value.directDaemon?.search?.success === true,
    directDaemonSearchMetaKeys: value.directDaemon?.search?.searchMetaKeys ?? [],
    directDaemonResidentVector: value.directDaemon?.search?.residentVector ?? null,
    directDaemonJobsOk: value.directDaemon?.jobs?.success === true,
    directDaemonJobIds: value.directDaemon?.jobs?.jobIds ?? [],
    codexVisibleShoutDefaultsDumpEvidenceRefs: detectsEvidenceDump(value.codexVisibleShout),
    removedBridgeScan,
    removedBridgeAbsent:
      !removedBridgeScan.containsMcpCallPath &&
      !removedBridgeScan.containsProjectsApiPath &&
      !removedBridgeScan.containsDaemonCompatBridge,
  };
}

function classify(phase, checks) {
  if (!checks.removedBridgeAbsent) {
    return 'fail-removed-bridge-regression';
  }
  if (checks.toolListContainsCodexHostResponse) {
    return 'fail-fictional-tool-visible';
  }
  if (!checks.primeSuccess || !checks.directSearchSuccess) {
    return 'fail-plugin-owned-tool-call';
  }
  if (checks.codexVisibleShoutDefaultsDumpEvidenceRefs) {
    return 'fail-visible-shout-dumps-evidence';
  }

  if (phase === 'baseline') {
    if (checks.residentServiceRoute === 'local-alembic-daemon' || checks.enhancementSelected === 'local-alembic-daemon') {
      return 'fail-baseline-mislabels-local-resident';
    }
    if (!checks.dashboardFailClosed) {
      return 'fail-baseline-dashboard-not-fail-closed';
    }
    if (!checks.directFallbackClear && !checks.diagnosticsMentionsEmbeddedOrUnavailable) {
      return 'fail-baseline-unavailable-not-clear';
    }
    return 'pass-with-clear-fallback';
  }

  if (checks.enhancementSelected !== 'local-alembic-daemon') {
    return 'fail-resident-route-not-selected';
  }
  if (checks.residentServiceOwner !== 'alembic' || checks.residentServiceRoute !== 'local-alembic-daemon') {
    return 'fail-resident-service-not-owned-by-alembic';
  }
  if (!checks.dashboardSuccess || !checks.dashboardUrl) {
    return 'fail-dashboard-handoff-unavailable';
  }
  if (!checks.directDaemonSearchOk || checks.directDaemonSearchMetaKeys.length === 0) {
    return 'fail-daemon-searchmeta-missing';
  }
  if (!checks.directSearchHasResidentMeta) {
    return 'fail-plugin-search-resident-meta-missing';
  }
  if (!checks.directResidentAvailable && !checks.directFallbackClear) {
    return 'fail-resident-unavailable-without-clear-fallback';
  }
  if (!checks.jobSummaries.all.success) {
    return 'fail-job-read-unavailable';
  }
  return checks.directResidentAvailable && checks.directResidentUsed ? 'pass' : 'pass-with-clear-fallback';
}

function summarizeSearch(result) {
  const data = isRecord(result?.data) ? result.data : {};
  const searchMeta = isRecord(data.searchMeta) ? data.searchMeta : {};
  const items = Array.isArray(data.items) ? data.items : [];
  return {
    success: result?.success === true,
    mode: stringFrom(data.mode) ?? null,
    totalResults: numberFrom(data.totalResults) ?? items.length,
    searchMetaKeys: Object.keys(searchMeta).sort(),
    resident: summarizeResidentMeta(searchMeta),
    serviceBoundary: isRecord(data.serviceBoundary)
      ? {
          executionPath: stringFrom(data.serviceBoundary.executionPath) ?? null,
          owner: stringFrom(data.serviceBoundary.owner) ?? null,
          residentServiceRequested: booleanFrom(data.serviceBoundary.residentServiceRequested),
          tool: stringFrom(data.serviceBoundary.tool) ?? null,
        }
      : null,
    hits: items.slice(0, 5).map(summarizeHit),
  };
}

function summarizeJobPayload(result) {
  const data = isRecord(result?.data) ? result.data : {};
  const jobs = Array.isArray(data.jobs)
    ? data.jobs
    : Array.isArray(data.data?.jobs)
      ? data.data.jobs
      : Array.isArray(data.value?.data?.jobs)
        ? data.value.data.jobs
        : [];
  return {
    success: result?.success === true,
    message: result?.message ?? null,
    count: jobs.length,
    jobIds: jobs.map((job) => stringFrom(job.id)).filter(Boolean),
    jobs: jobs.slice(0, 5).map((job) => ({
      completedAt: stringFrom(job.completedAt) ?? null,
      createdAt: stringFrom(job.createdAt) ?? null,
      id: stringFrom(job.id) ?? null,
      kind: stringFrom(job.kind) ?? null,
      source: stringFrom(job.source) ?? null,
      status: stringFrom(job.status) ?? null,
    })),
    residentService: isRecord(data.residentService)
      ? {
          ok: booleanFrom(data.residentService.ok),
          owner: stringFrom(data.residentService.owner) ?? null,
          route: stringFrom(data.residentService.route) ?? null,
          feature: stringFrom(data.residentService.telemetry?.feature) ?? null,
        }
      : null,
    serviceBoundary: isRecord(data.serviceBoundary)
      ? {
          executionPath: stringFrom(data.serviceBoundary.executionPath) ?? null,
          owner: stringFrom(data.serviceBoundary.owner) ?? null,
          residentServiceRequested: booleanFrom(data.serviceBoundary.residentServiceRequested),
          tool: stringFrom(data.serviceBoundary.tool) ?? null,
        }
      : null,
  };
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
      : {};
  const residentVector = isRecord(meta.residentVector)
    ? meta.residentVector
    : isRecord(residentSearch.residentVector)
      ? residentSearch.residentVector
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
      stringFrom(innerSearchMeta.codexRequestedMode) ??
      null,
    residentRequestMode:
      stringFrom(residentSearch.residentRequestMode) ??
      stringFrom(meta.residentRequestMode) ??
      stringFrom(innerSearchMeta.residentRequestMode) ??
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
    residentVector: residentVector
      ? {
          available: booleanFrom(residentVector.available),
          reason: stringFrom(residentVector.reason) ?? null,
          stats: isRecord(residentVector.stats)
            ? {
                count: numberFrom(residentVector.stats.count) ?? null,
                dimension: numberFrom(residentVector.stats.dimension) ?? null,
                embedProviderAvailable: booleanFrom(residentVector.stats.embedProviderAvailable),
                hasIndex: booleanFrom(residentVector.stats.hasIndex),
                indexSize: numberFrom(residentVector.stats.indexSize) ?? null,
              }
            : null,
        }
      : null,
  };
}

async function probeDirectDaemon(statusPayload, request) {
  const daemon = statusPayload?.data?.daemon;
  const statePath = typeof daemon?.statePath === 'string' ? daemon.statePath : null;
  if (!statePath || !existsSync(statePath)) {
    return {
      attempted: false,
      reason: 'daemon_state_path_missing',
    };
  }
  let state = null;
  try {
    state = JSON.parse(readFileSync(statePath, 'utf8'));
  } catch (error) {
    return {
      attempted: true,
      reason: `daemon_state_read_failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
  if (!state?.url || !state?.token) {
    return {
      attempted: true,
      reason: 'daemon_url_or_token_missing',
    };
  }

  const health = await fetchDaemonJson(state, '/api/v1/daemon/health', request.timeoutMs);
  const searchUrl = new URL('/api/v1/search', state.url);
  searchUrl.searchParams.set('q', request.query);
  searchUrl.searchParams.set('mode', 'semantic');
  searchUrl.searchParams.set('limit', String(request.limit));
  const searchPayload = await fetchDaemonUrl(state, searchUrl, request.timeoutMs);
  const jobsUrl = new URL('/api/v1/jobs', state.url);
  jobsUrl.searchParams.set('kind', 'bootstrap');
  jobsUrl.searchParams.set('limit', '5');
  jobsUrl.searchParams.set('compact', 'true');
  const jobsPayload = await fetchDaemonUrl(state, jobsUrl, request.timeoutMs);

  return {
    attempted: true,
    health: summarizeDaemonHealth(health),
    jobs: summarizeDaemonJobs(jobsPayload),
    search: summarizeDaemonSearch(searchPayload),
  };
}

async function fetchDaemonJson(state, path, timeoutMs) {
  return fetchDaemonUrl(state, new URL(path, state.url), timeoutMs);
}

async function fetchDaemonUrl(state, url, timeoutMs) {
  try {
    const response = await fetch(url, {
      headers: {
        accept: 'application/json',
        'x-alembic-daemon-token': state.token,
      },
      signal: timeoutMs > 0 ? AbortSignal.timeout(timeoutMs) : undefined,
    });
    const payload = await response.json();
    return {
      ok: response.ok,
      payload,
      status: response.status,
      path: `${url.pathname}${url.search ? '?<query>' : ''}`,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      status: 0,
      path: url.pathname,
    };
  }
}

function summarizeDaemonHealth(response) {
  const data = isRecord(response.payload?.data) ? response.payload.data : {};
  const resident = isRecord(data.residentService) ? data.residentService : null;
  return {
    ok: response.ok && response.payload?.success !== false,
    httpStatus: response.status,
    path: response.path,
    version: stringFrom(data.version) ?? null,
    residentService: resident
      ? {
          owner: stringFrom(resident.owner) ?? null,
          route: stringFrom(resident.route) ?? null,
          availableFeatures: Array.isArray(resident.availableFeatures)
            ? resident.availableFeatures
            : [],
        }
      : null,
  };
}

function summarizeDaemonSearch(response) {
  const data = isRecord(response.payload?.data) ? response.payload.data : {};
  const items = Array.isArray(data.items) ? data.items : [];
  const searchMeta = isRecord(data.searchMeta) ? data.searchMeta : {};
  return {
    success: response.ok && response.payload?.success !== false,
    httpStatus: response.status,
    path: response.path,
    mode: stringFrom(data.mode) ?? null,
    total: numberFrom(data.total) ?? numberFrom(data.totalResults) ?? items.length,
    itemCount: items.length,
    searchMetaKeys: Object.keys(searchMeta).sort(),
    residentVector: isRecord(searchMeta.residentVector)
      ? {
          available: booleanFrom(searchMeta.residentVector.available),
          reason: stringFrom(searchMeta.residentVector.reason) ?? null,
          stats: isRecord(searchMeta.residentVector.stats)
            ? {
                count: numberFrom(searchMeta.residentVector.stats.count) ?? null,
                dimension: numberFrom(searchMeta.residentVector.stats.dimension) ?? null,
                hasIndex: booleanFrom(searchMeta.residentVector.stats.hasIndex),
                indexSize: numberFrom(searchMeta.residentVector.stats.indexSize) ?? null,
              }
            : null,
        }
      : null,
    semanticUsed: booleanFrom(searchMeta.semanticUsed),
    vectorUsed: booleanFrom(searchMeta.vectorUsed),
    hits: items.slice(0, 5).map(summarizeHit),
  };
}

function summarizeDaemonJobs(response) {
  const data = isRecord(response.payload?.data) ? response.payload.data : {};
  const jobs = Array.isArray(data.jobs) ? data.jobs : [];
  return {
    success: response.ok && response.payload?.success !== false,
    httpStatus: response.status,
    path: response.path,
    count: jobs.length,
    jobIds: jobs.map((job) => stringFrom(job.id)).filter(Boolean),
    jobs: jobs.slice(0, 5).map((job) => ({
      id: stringFrom(job.id) ?? null,
      kind: stringFrom(job.kind) ?? null,
      source: stringFrom(job.source) ?? null,
      status: stringFrom(job.status) ?? null,
    })),
  };
}

function buildCodexVisibleShout(primeResult, searches) {
  const material = primeResult?.data?.primeKnowledgeMaterial ?? null;
  const knowledge = Array.isArray(material?.acceptedKnowledge) ? material.acceptedKnowledge : [];
  const guards = Array.isArray(material?.acceptedGuards) ? material.acceptedGuards : [];
  const searchSummaries = Object.values(searches).map((result) => summarizeSearch(result).resident);
  const available = searchSummaries.find((summary) => summary.available === true);
  const fallback = searchSummaries.find(
    (summary) =>
      summary.attempted === true &&
      summary.available === false &&
      Boolean(summary.reason || summary.fallbackReason || summary.residentVector?.reason)
  );
  const receipt =
    material?.status === 'delivered'
      ? `我已接收到 BiliDili 的 ${knowledge.length} 条 Recipe / ${guards.length} 条 Guard 摘要，会先按模块边界、路由解耦、UI lazy var、Repository 网络层和 Guard 约束判断后续动作。`
      : '我没有接收到可用的 BiliDili Recipe / Guard 知识，不会假装已经加载项目约束。';
  if (available) {
    return `${receipt} Resident service 已接通，payload 里保留 ${available.route} 的 searchMeta / residentVector 证据；可见响应只喊知识摘要和判断依据，不默认倾倒 evidenceRefs 路径或行号。`;
  }
  if (fallback) {
    return `${receipt} Resident service 已尝试但降级，原因是 ${fallback.reason || fallback.fallbackReason || fallback.residentVector?.reason}；后续只把该 telemetry 留在 payload 里。`;
  }
  return `${receipt} Resident telemetry 未形成可用命中，本轮按 Plugin baseline 结果继续，只把路径证据留给后续核验。`;
}

function scanRemovedPaths(input) {
  const haystack = `${JSON.stringify(input.report)}\n${input.stderr.join('\n')}`;
  return {
    containsDaemonCompatBridge: /daemon-mcp-compat-bridge/.test(haystack),
    containsMcpCallPath: /\/api\/v1\/mcp\/call/.test(haystack),
    containsProjectsApiPath: /\/api\/v1\/projects(?:\/|["'\s?]|$)/.test(haystack),
  };
}

function detectsEvidenceDump(value) {
  if (typeof value !== 'string') {
    return false;
  }
  const pathLikeMatches = value.match(/(?:^|\s)[\w./-]+\.(?:swift|md|ts|js)(?::\d+)?/g) ?? [];
  return pathLikeMatches.length >= 2 || /missing line|行号缺失/i.test(value);
}

function detectsAutoToSemanticTranslation(resident) {
  if (!resident) {
    return false;
  }
  const codexMode = resident.codexRequestedMode ?? resident.requestedMode;
  return codexMode === 'auto' && resident.residentRequestMode === 'semantic';
}

function summarizeHit(item) {
  if (!isRecord(item)) {
    return { title: String(item) };
  }
  return {
    id: stringFrom(item.id) ?? null,
    kind: stringFrom(item.kind) ?? stringFrom(item.type) ?? null,
    score: numberFrom(item.score) ?? null,
    title: stringFrom(item.title) ?? stringFrom(item.trigger) ?? null,
    trigger: stringFrom(item.trigger) ?? null,
  };
}

function summarizeReport(value) {
  return {
    ok: value.ok,
    classification: value.classification,
    durationMs: value.durationMs,
    phase: value.phase,
    project: value.project,
    packageVersion: value.checks.packageVersion,
    enhancementSelected: value.checks.enhancementSelected,
    residentServiceOwner: value.checks.residentServiceOwner,
    residentServiceRoute: value.checks.residentServiceRoute,
    daemonReady: value.checks.daemonReady,
    dashboardSuccess: value.checks.dashboardSuccess,
    dashboardUrl: value.checks.dashboardUrl,
    primeStatus: value.checks.primeStatus,
    acceptedKnowledgeCount: value.checks.acceptedKnowledgeCount,
    acceptedGuardCount: value.checks.acceptedGuardCount,
    directSearchSummaries: value.checks.searchSummaries,
    directDaemonSearchMetaKeys: value.checks.directDaemonSearchMetaKeys,
    jobAnyIds: value.checks.jobAnyIds,
    removedBridgeScan: value.checks.removedBridgeScan,
    codexVisibleShout: value.codexVisibleShout,
  };
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

async function withTimeout(promise, timeoutMs, onTimeout) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(onTimeout())), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

function collectVersions({ pluginRoot }) {
  const runtimePackagePath = join(pluginRoot, 'plugins', 'alembic-codex', 'runtime', 'package.json');
  const pluginPackagePath = join(pluginRoot, 'package.json');
  return {
    pluginPackage: readPackageVersion(pluginPackagePath),
    runtimePackage: readPackageVersion(runtimePackagePath),
  };
}

function readPackageVersion(packagePath) {
  try {
    return JSON.parse(readFileSync(packagePath, 'utf8')).version ?? null;
  } catch {
    return null;
  }
}

function assertDirectory(dir, label) {
  if (!existsSync(dir)) {
    throw new Error(`${label} does not exist: ${dir}`);
  }
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function stringFrom(value) {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function numberFrom(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function booleanFrom(value) {
  return typeof value === 'boolean' ? value : null;
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
    if (arg === '-h' || arg === '--help') {
      parsed.help = true;
    } else if (arg === '--phase') {
      parsed.phase = args[index + 1] || parsed.phase;
      index += 1;
    } else if (arg === '--project') {
      parsed.project = args[index + 1] || parsed.project;
      index += 1;
    } else if (arg === '--plugin') {
      parsed.plugin = args[index + 1] || parsed.plugin;
      index += 1;
    } else if (arg === '--output') {
      parsed.output = args[index + 1] || parsed.output;
      index += 1;
    } else if (arg === '--timeout-ms') {
      parsed.timeoutMs = parsePositiveInteger(args[index + 1], arg);
      index += 1;
    } else if (arg === '--search-limit') {
      parsed.searchLimit = parsePositiveInteger(args[index + 1], arg);
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
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  if (parsed.phase !== 'baseline' && parsed.phase !== 'resident') {
    throw new Error('--phase must be baseline or resident');
  }
  return parsed;
}

function parsePositiveInteger(value, flag) {
  const parsed = Number.parseInt(value || '', 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${flag} must be a non-negative integer`);
  }
  return parsed;
}

function usage() {
  return `Probe Alembic unified resident service behavior for a real project.

Usage:
  node Test/scripts/probe-unified-resident-service.mjs [options]

Options:
  --phase <baseline|resident> Baseline unavailable route or resident daemon route.
                              Default: ${defaults.phase}
  --project <path|name>       Target project. Default: ${defaults.project}
  --plugin <path|name>        AlembicPlugin repo. Default: ${defaults.plugin}
  --output <path>             JSON evidence output path.
  --timeout-ms <ms>           MCP/API timeout. Default: ${defaults.timeoutMs}
  --search-limit <n>          Search result limit. Default: ${defaults.searchLimit}
  --prime-query <text>        Prime user query.
  --search-query <text>       Direct auto search query.
  --semantic-query <text>     Direct semantic search query.
  --active-file <path>        Active file hint. Default: ${defaults.activeFile}
  --language <id>             Language hint. Default: ${defaults.language}
  -h, --help                  Show this help.
`;
}
