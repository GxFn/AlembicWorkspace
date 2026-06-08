#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const workspaceRoot = resolve(import.meta.dirname, '..', '..');
const defaults = {
  contentMaxLines: 80,
  maxFiles: 24,
  pollMs: 2500,
  project: 'BiliDili',
  timeoutMs: 180000,
};

const options = parseArgs(process.argv.slice(2));
if (options.help) {
  process.stdout.write(usage());
  process.exit(0);
}

const projectRoot = resolveWorkspacePath(options.project);
assertDirectory(projectRoot, 'project');

const outputPath = options.output
  ? resolve(options.output)
  : join(
      workspaceRoot,
      'Test',
      'tmp',
      `cold-start-process-timeline-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    );

const startedAt = Date.now();
const report = {
  schemaVersion: 1,
  ok: false,
  classification: 'unknown',
  startedAt: new Date(startedAt).toISOString(),
  durationMs: 0,
  project: basename(projectRoot),
  projectRootRelative: relative(workspaceRoot, projectRoot) || '.',
  config: {
    contentMaxLines: options.contentMaxLines,
    maxFiles: options.maxFiles,
    pollMs: options.pollMs,
    skipGuard: options.skipGuard,
    timeoutMs: options.timeoutMs,
  },
  daemon: null,
  health: null,
  enqueue: null,
  socket: {
    attempted: false,
    connected: false,
    joinedNotifications: false,
    importSource: null,
    events: [],
    errors: [],
  },
  polls: [],
  finalJob: null,
  finalEvents: null,
  checks: {},
  notes: [],
};

try {
  const runtime = resolveRuntime({ projectRoot, dataRoot: options.dataRoot, dashboardUrl: options.url });
  if (!runtime.url) {
    throw new Error('No running Alembic daemon URL found for the target project.');
  }

  report.daemon = {
    dataRootRelative: relative(workspaceRoot, runtime.dataRoot) || runtime.dataRoot,
    daemonPathRelative: relative(workspaceRoot, runtime.daemonPath) || runtime.daemonPath,
    dashboardUrl: runtime.url,
    hasToken: Boolean(runtime.daemon?.token),
    pid: typeof runtime.daemon?.pid === 'number' ? runtime.daemon.pid : null,
    projectRootRelative: relative(workspaceRoot, runtime.daemon?.projectRoot || projectRoot) || '.',
    version: runtime.daemon?.version ?? runtime.daemon?.stateVersion ?? null,
  };

  report.health = await fetchJson(runtime, '/api/v1/daemon/health', { method: 'GET' });

  const socket = await connectSocket(runtime.url, report.socket).catch((error) => {
    report.socket.errors.push(errorMessage(error));
    return null;
  });

  report.enqueue = await fetchJson(runtime, '/api/v1/jobs/bootstrap', {
    body: JSON.stringify({
      contentMaxLines: options.contentMaxLines,
      maxFiles: options.maxFiles,
      skipGuard: options.skipGuard,
    }),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  });

  const jobId = report.enqueue?.data?.jobId;
  if (!jobId) {
    throw new Error('Bootstrap job enqueue response did not include data.jobId.');
  }

  const deadline = startedAt + options.timeoutMs;
  let terminal = false;
  while (Date.now() < deadline && !terminal) {
    await sleep(options.pollMs);
    const jobResponse = await fetchJson(runtime, `/api/v1/jobs/${encodeURIComponent(jobId)}?compact=true`, {
      method: 'GET',
    });
    const eventsResponse = await fetchJson(
      runtime,
      `/api/v1/jobs/${encodeURIComponent(jobId)}/events?limit=240`,
      { method: 'GET' }
    );
    const job = jobResponse?.data?.job ?? null;
    const events = eventsResponse?.data ?? null;
    report.polls.push({
      at: new Date().toISOString(),
      developerViewCount: Array.isArray(events?.developerViews) ? events.developerViews.length : 0,
      hiddenCount: numberOrNull(events?.hiddenCount),
      jobStatus: job?.status ?? null,
      kindCounts: countEventKinds(events?.developerViews),
      lastSequence: numberOrNull(events?.nextSequence),
      retainedCount: numberOrNull(events?.retainedCount),
    });
    terminal = ['completed', 'failed', 'cancelled'].includes(job?.status);
  }

  report.finalJob = await fetchJson(
    runtime,
    `/api/v1/jobs/${encodeURIComponent(jobId)}?compact=false`,
    { method: 'GET' }
  );
  report.finalEvents = await fetchJson(
    runtime,
    `/api/v1/jobs/${encodeURIComponent(jobId)}/events?limit=240`,
    { method: 'GET' }
  );

  if (socket) {
    socket.disconnect();
  }

  report.checks = buildChecks(report);
  report.classification = classify(report.checks);
  report.ok = report.classification === 'pass' || report.classification === 'producer-gap';
} finally {
  report.durationMs = Date.now() - startedAt;
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(redact(report), null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ outputPath, ...summarize(report) }, null, 2)}\n`);
}

function usage() {
  return `Probe Alembic cold-start process timeline on a real project.

Usage:
  node Test/scripts/probe-cold-start-process-timeline.mjs [options]

Options:
  --project <name|path>        Project under the workspace, or absolute path.
                               Default: ${defaults.project}
  --url <dashboardUrl>         Alembic daemon/Dashboard URL. Auto-detected by project when omitted.
  --data-root <path>           Explicit Alembic data root. Auto-detected when omitted.
  --max-files <n>              Bootstrap maxFiles. Default: ${defaults.maxFiles}
  --content-max-lines <n>      Bootstrap contentMaxLines. Default: ${defaults.contentMaxLines}
  --skip-guard                 Pass skipGuard=true to the bootstrap job.
  --timeout-ms <ms>            Polling timeout. Default: ${defaults.timeoutMs}
  --poll-ms <ms>               Polling interval. Default: ${defaults.pollMs}
  --output <path>              JSON evidence path.
  -h, --help                   Show this help.
`;
}

function parseArgs(argv) {
  const parsed = {
    contentMaxLines: defaults.contentMaxLines,
    dataRoot: '',
    help: false,
    maxFiles: defaults.maxFiles,
    output: '',
    pollMs: defaults.pollMs,
    project: defaults.project,
    skipGuard: false,
    timeoutMs: defaults.timeoutMs,
    url: '',
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '-h' || arg === '--help') {
      parsed.help = true;
      continue;
    }
    if (arg === '--skip-guard') {
      parsed.skipGuard = true;
      continue;
    }
    if (
      arg === '--content-max-lines' ||
      arg === '--data-root' ||
      arg === '--max-files' ||
      arg === '--output' ||
      arg === '--poll-ms' ||
      arg === '--project' ||
      arg === '--timeout-ms' ||
      arg === '--url'
    ) {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(`${arg} requires a value`);
      }
      i += 1;
      if (arg === '--content-max-lines') {
        parsed.contentMaxLines = parsePositiveInteger(value, arg);
      } else if (arg === '--data-root') {
        parsed.dataRoot = value;
      } else if (arg === '--max-files') {
        parsed.maxFiles = parsePositiveInteger(value, arg);
      } else if (arg === '--output') {
        parsed.output = value;
      } else if (arg === '--poll-ms') {
        parsed.pollMs = parsePositiveInteger(value, arg);
      } else if (arg === '--project') {
        parsed.project = value;
      } else if (arg === '--timeout-ms') {
        parsed.timeoutMs = parsePositiveInteger(value, arg);
      } else if (arg === '--url') {
        parsed.url = normalizeBaseUrl(value);
      }
      continue;
    }
    throw new Error(`Unknown option: ${arg}`);
  }

  return parsed;
}

function parsePositiveInteger(value, name) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

function resolveWorkspacePath(value) {
  return resolve(pathIsAbsolute(value) ? value : join(workspaceRoot, value));
}

function pathIsAbsolute(value) {
  return value.startsWith('/');
}

function assertDirectory(dir, label) {
  if (!existsSync(dir)) {
    throw new Error(`${label} does not exist: ${dir}`);
  }
}

function readJsonFile(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function normalizeBaseUrl(value) {
  return String(value || '').replace(/\/+$/, '');
}

function discoverDaemonRecords() {
  const asdRoot = join(os.homedir(), '.asd', 'workspaces');
  if (!existsSync(asdRoot)) {
    return [];
  }
  const { readdirSync } = createRequire(import.meta.url)('node:fs');
  return readdirSync(asdRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const dataRoot = join(asdRoot, entry.name);
      const daemonPath = join(dataRoot, '.asd', 'daemon.json');
      const daemon = existsSync(daemonPath) ? readJsonFile(daemonPath) : null;
      return daemon ? { dataRoot, daemon, daemonPath } : null;
    })
    .filter(Boolean);
}

function resolveRuntime({ projectRoot, dataRoot, dashboardUrl }) {
  const daemonRecords = discoverDaemonRecords();
  const explicitDataRoot = dataRoot
    ? daemonRecords.find((record) => resolve(record.dataRoot) === resolve(dataRoot))
    : null;
  const matchedByProject = daemonRecords.find(
    (record) => resolve(record.daemon?.projectRoot || '') === projectRoot
  );
  const latest = [...daemonRecords].sort((a, b) =>
    String(b.daemon?.lastReadyAt || b.daemon?.startedAt || '').localeCompare(
      String(a.daemon?.lastReadyAt || a.daemon?.startedAt || '')
    )
  )[0];
  const record =
    explicitDataRoot ||
    matchedByProject ||
    (dataRoot
      ? {
          dataRoot,
          daemon: readJsonFile(join(dataRoot, '.asd', 'daemon.json')) || {},
          daemonPath: join(dataRoot, '.asd', 'daemon.json'),
        }
      : latest);
  const url = normalizeBaseUrl(dashboardUrl || record?.daemon?.dashboardUrl || record?.daemon?.url || '');
  return {
    dataRoot: record?.dataRoot || dataRoot || '',
    daemon: record?.daemon || null,
    daemonPath: record?.daemonPath || '',
    url,
  };
}

async function fetchJson(runtime, apiPath, init) {
  const headers = {
    ...(init.headers || {}),
  };
  if (runtime.daemon?.token) {
    headers['x-alembic-daemon-token'] = runtime.daemon.token;
  }
  const res = await fetch(new URL(apiPath, runtime.url), {
    ...init,
    headers,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${apiPath}: ${JSON.stringify(json).slice(0, 500)}`);
  }
  return json;
}

async function connectSocket(url, socketReport) {
  socketReport.attempted = true;
  const socketClient = await loadSocketClient();
  socketReport.importSource = socketClient.source;
  const socket = socketClient.io(url, {
    path: '/socket.io',
    reconnection: false,
    timeout: 5000,
    transports: ['websocket'],
  });

  socket.on('job:process-event', (payload) => {
    socketReport.events.push(summarizeSocketPayload(payload));
  });
  socket.on('notification-joined', () => {
    socketReport.joinedNotifications = true;
  });
  socket.on('connect_error', (error) => {
    socketReport.errors.push(errorMessage(error));
  });

  await new Promise((resolveConnect, rejectConnect) => {
    const timer = setTimeout(() => rejectConnect(new Error('socket connect timeout')), 6000);
    socket.on('connect', () => {
      clearTimeout(timer);
      socketReport.connected = true;
      socket.emit('join-notifications');
      resolveConnect();
    });
  });
  await sleep(250);
  return socket;
}

async function loadSocketClient() {
  const candidates = [
    join(workspaceRoot, 'AlembicDashboard', 'package.json'),
    join(workspaceRoot, 'Alembic', 'package.json'),
  ];
  for (const packageJson of candidates) {
    try {
      const req = createRequire(packageJson);
      const resolved = req.resolve('socket.io-client');
      const mod = await import(pathToFileURL(resolved).href);
      return { io: mod.io, source: relative(workspaceRoot, resolved) || resolved };
    } catch {
      /* try next package root */
    }
  }
  throw new Error('socket.io-client is unavailable in Alembic/AlembicDashboard dependencies');
}

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

function buildChecks(value) {
  const healthData = value.health?.data ?? value.health ?? {};
  const healthJobs = healthData?.capabilities?.jobs ?? {};
  const processEvents = healthJobs?.processEvents ?? {};
  const enqueueData = value.enqueue?.data ?? {};
  const finalEventData = value.finalEvents?.data ?? {};
  const developerViews = Array.isArray(finalEventData.developerViews)
    ? finalEventData.developerViews
    : [];
  const kinds = countEventKinds(developerViews);
  const requiredKinds = ['llm.input', 'llm.output', 'llm.reflection', 'tool'];
  return {
    daemonHealthSuccess: value.health?.success === true,
    developerViewsReturned: developerViews.length > 0,
    enqueueHasEventsUrl: typeof enqueueData.eventsUrl === 'string' && enqueueData.eventsUrl.includes('/events'),
    endpointCapabilityAvailable: finalEventData.endpointCapability?.available === true,
    eventKinds: kinds,
    eventsApiHasCounts:
      typeof finalEventData.hiddenCount === 'number' &&
      typeof finalEventData.retainedCount === 'number' &&
      typeof finalEventData.count === 'number',
    healthProcessEventsAvailable: processEvents.available === true,
    healthProcessEventsEndpoint: processEvents.endpoint ?? null,
    jobId: enqueueData.jobId ?? null,
    missingProducerKinds: requiredKinds.filter((kind) => !kinds[kind]),
    socketConnected: value.socket.connected,
    socketJoinedNotifications: value.socket.joinedNotifications,
    socketObservedMatchingEvents: value.socket.events.some((event) => event.jobId === enqueueData.jobId),
  };
}

function classify(checks) {
  const apiPass =
    checks.daemonHealthSuccess &&
    checks.enqueueHasEventsUrl &&
    checks.eventsApiHasCounts &&
    checks.endpointCapabilityAvailable &&
    checks.developerViewsReturned;
  const socketPass = checks.socketConnected && checks.socketObservedMatchingEvents;
  if (apiPass && socketPass && checks.missingProducerKinds.length === 0) {
    return 'pass';
  }
  if (apiPass && socketPass && checks.missingProducerKinds.length > 0) {
    return 'producer-gap';
  }
  return 'fail';
}

function summarize(value) {
  return {
    checks: value.checks,
    classification: value.classification,
    durationMs: value.durationMs,
    jobId: value.enqueue?.data?.jobId ?? null,
    ok: value.ok,
  };
}

function countEventKinds(events) {
  const counts = {};
  if (!Array.isArray(events)) {
    return counts;
  }
  for (const event of events) {
    const kind = typeof event?.kind === 'string' ? event.kind : 'unknown';
    counts[kind] = (counts[kind] || 0) + 1;
  }
  return counts;
}

function numberOrNull(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function summarizeSocketPayload(payload) {
  const event = payload?.event || {};
  return {
    eventId: payload?.eventId ?? event.eventId ?? null,
    jobId: payload?.jobId ?? event.jobId ?? null,
    kind: event.kind ?? null,
    phase: event.phase ?? null,
    sequence: payload?.sequence ?? event.sequence ?? null,
    title: event.title ?? null,
  };
}

function redact(value) {
  return JSON.parse(
    JSON.stringify(value, (key, inner) => {
      if (/token|secret|authorization/i.test(key)) {
        return typeof inner === 'string' ? '[redacted]' : inner;
      }
      return inner;
    })
  );
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
