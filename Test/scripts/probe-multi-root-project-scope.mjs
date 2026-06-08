#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import os from 'node:os';

const workspaceRoot = resolve(import.meta.dirname, '..', '..');

const defaults = {
  controlRoot: '.',
  folders: ['Alembic', 'AlembicCore', 'AlembicPlugin', 'AlembicDashboard'],
  output: join(
    workspaceRoot,
    'Test',
    'tmp',
    `multi-root-project-scope-probe-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  ),
  query: 'ProjectScope folder binding controlRoot dataRoot ghost storage',
  timeoutMs: 10000,
};

const options = parseArgs(process.argv.slice(2));
const controlRoot = resolveWorkspacePath(options.controlRoot);
const folders = options.folders.map(resolveWorkspacePath);
const outputPath = resolve(options.output);
const daemon = resolveDaemonState(options.daemonState);

const report = {
  ok: false,
  startedAt: new Date().toISOString(),
  controlRootRelative: relative(workspaceRoot, controlRoot) || '.',
  foldersRelative: folders.map((folder) => relative(workspaceRoot, folder) || '.'),
  daemon: daemon
    ? {
        dataRootRelative: displayPath(daemon.dataRoot),
        dashboardUrl: daemon.url,
        hasToken: Boolean(daemon.token),
        pid: daemon.pid ?? null,
        projectId: daemon.projectId ?? null,
        projectRootRelative: displayPath(daemon.projectRoot || ''),
        statePathRelative: displayPath(daemon.statePath),
        version: daemon.version ?? null,
      }
    : null,
  endpoints: {},
  summaries: {},
  checks: {},
};

if (!daemon) {
  report.error = 'No active Alembic daemon state found.';
  writeReport();
  process.exit(1);
}

report.endpoints.health = await fetchDaemonJson('/api/v1/daemon/health');
report.endpoints.projectScope = await fetchDaemonJson(
  `/api/v1/project-scope?folderPath=${encodeURIComponent(controlRoot)}`
);
report.endpoints.folders = await fetchDaemonJson(
  `/api/v1/project-scope/folders?folderPath=${encodeURIComponent(controlRoot)}`
);
report.endpoints.resolveControlRoot = await fetchDaemonJson(
  `/api/v1/project-scope/resolve-folder?folderPath=${encodeURIComponent(controlRoot)}`
);
report.endpoints.resolveFolders = {};
for (const folder of folders) {
  const key = relative(workspaceRoot, folder) || folder;
  report.endpoints.resolveFolders[key] = await fetchDaemonJson(
    `/api/v1/project-scope/resolve-folder?folderPath=${encodeURIComponent(folder)}`
  );
}
report.endpoints.resolvePostFirstFolder = await fetchDaemonJson('/api/v1/project-scope/resolve-folder', {
  body: JSON.stringify({ folderPath: folders[0] }),
  headers: { 'content-type': 'application/json' },
  method: 'POST',
});
report.endpoints.search = await fetchDaemonJson(
  `/api/v1/search?q=${encodeURIComponent(options.query)}&mode=semantic&limit=5`
);

const scopeSummary = getData(report.endpoints.projectScope)?.summary ?? null;
const foldersPayload = getData(report.endpoints.folders);
const folderSummaries = Array.isArray(foldersPayload?.folders) ? foldersPayload.folders : [];
const healthData = getData(report.endpoints.health);
const searchData = getData(report.endpoints.search);

report.summaries = {
  health: {
    ok: report.endpoints.health.ok,
    healthVersion: healthData?.version ?? healthData?.healthVersion ?? null,
    residentScopeId:
      healthData?.residentService?.serviceScope?.scopeId ??
      healthData?.residentService?.status?.serviceScope?.scopeId ??
      null,
    projectScopeId:
      healthData?.residentService?.serviceScope?.projectIdentity?.projectScopeId ??
      healthData?.residentService?.status?.serviceScope?.projectIdentity?.projectScopeId ??
      healthData?.projectScopeId ??
      null,
    projectScopeCapabilityAvailable:
      healthData?.capabilities?.projectScope?.available ??
      healthData?.residentService?.status?.capabilities?.projectScope?.available ??
      null,
  },
  projectScope: summarizeScope(scopeSummary),
  folders: folderSummaries.map((folder) => ({
    displayName: folder.displayName ?? null,
    folderId: folder.folderId ?? folder.id ?? null,
    pathRelative: relative(workspaceRoot, folder.path || '') || folder.path,
    role: folder.role ?? null,
    state: folder.state ?? null,
  })),
  resolve: Object.fromEntries(
    Object.entries(report.endpoints.resolveFolders).map(([key, result]) => [
      key,
      summarizeScope(getData(result)?.summary ?? null),
    ])
  ),
  resolveControlRoot: summarizeScope(getData(report.endpoints.resolveControlRoot)?.summary ?? null),
  search: {
    ok: report.endpoints.search.ok,
    mode: searchData?.mode ?? null,
    searchMetaKeys: searchData?.searchMeta ? Object.keys(searchData.searchMeta).sort() : [],
    totalResults: searchData?.totalResults ?? (Array.isArray(searchData?.items) ? searchData.items.length : null),
  },
};

const boundScopeIds = new Set(
  Object.values(report.summaries.resolve).map((summary) => summary.projectScopeId).filter(Boolean)
);
const controlRootInFolders = folderSummaries.some((folder) => samePath(folder.path, controlRoot));
report.checks = {
  daemonReady: report.endpoints.health.ok === true,
  dashboardUrlPresent: Boolean(daemon.url),
  projectScopeAvailable: report.endpoints.projectScope.ok === true && Boolean(scopeSummary),
  folderCount: folderSummaries.length,
  allRequestedFoldersResolve:
    folders.length > 0 &&
    Object.values(report.summaries.resolve).every(
      (summary) => summary.projectScopeId === scopeSummary?.projectScopeId
    ),
  boundScopeIds: [...boundScopeIds],
  sameProjectScopeAcrossFolders: boundScopeIds.size === 1 && boundScopeIds.has(scopeSummary?.projectScopeId),
  controlRootInFolders,
  controlRootIncludedInFolders: scopeSummary?.controlRootIncludedInFolders ?? null,
  ghostStorage: scopeSummary?.storageKind === 'ghost',
  searchHasMeta: report.summaries.search.searchMetaKeys.length > 0,
};
report.ok =
  report.checks.daemonReady &&
  report.checks.projectScopeAvailable &&
  report.checks.folderCount >= 2 &&
  report.checks.sameProjectScopeAcrossFolders &&
  !report.checks.controlRootInFolders &&
  report.checks.controlRootIncludedInFolders === false &&
  report.checks.ghostStorage;

writeReport();
process.exit(report.ok ? 0 : 1);

function summarizeScope(summary) {
  if (!summary || typeof summary !== 'object') {
    return {
      controlRootIncludedInFolders: null,
      dataRootRelative: null,
      folderCount: 0,
      projectId: null,
      projectScopeId: null,
      storageKind: null,
    };
  }
  return {
    controlRootRelative: displayPath(summary.controlRoot || ''),
    controlRootIncludedInFolders: summary.controlRootIncludedInFolders ?? null,
    dataRootRelative: displayPath(summary.dataRoot || ''),
    folderCount: summary.folderCount ?? (Array.isArray(summary.folders) ? summary.folders.length : 0),
    projectId: summary.projectId ?? null,
    projectScopeId: summary.projectScopeId ?? null,
    storageKind: summary.storageKind ?? null,
  };
}

function getData(result) {
  return result?.payload?.data ?? result?.payload ?? null;
}

async function fetchDaemonJson(path, init = {}) {
  const url = new URL(path, daemon.url);
  const headers = {
    accept: 'application/json',
    'x-alembic-daemon-token': daemon.token,
    ...(init.headers ?? {}),
  };
  try {
    const response = await fetch(url, {
      ...init,
      headers,
      signal: options.timeoutMs > 0 ? AbortSignal.timeout(options.timeoutMs) : undefined,
    });
    const payload = await response.json();
    return {
      ok: response.ok,
      path: `${url.pathname}${url.search ? '?<query>' : ''}`,
      payload,
      status: response.status,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
      ok: false,
      path: url.pathname,
      status: 0,
    };
  }
}

function resolveDaemonState(explicitStatePath) {
  if (explicitStatePath) {
    return readDaemonState(resolve(explicitStatePath));
  }
  const runtimeControlPath = join(os.homedir(), '.asd', 'runtime-control.json');
  const runtimeControl = readJsonIfExists(runtimeControlPath);
  const activeProjectId = runtimeControl?.activeProjectId ?? runtimeControl?.selectedProjectId;
  if (activeProjectId) {
    const state = readDaemonState(
      join(os.homedir(), '.asd', 'workspaces', activeProjectId, '.asd', 'daemon.json')
    );
    if (state) return state;
  }
  return null;
}

function readDaemonState(statePath) {
  const state = readJsonIfExists(statePath);
  if (!state?.url || !state?.token) return null;
  return { ...state, statePath };
}

function readJsonIfExists(filePath) {
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function samePath(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  return resolve(left) === resolve(right);
}

function displayPath(filePath) {
  if (!filePath) return filePath;
  const rel = relative(workspaceRoot, filePath);
  return rel.length === 0 ? '.' : rel;
}

function resolveWorkspacePath(value) {
  return resolve(workspaceRoot, value);
}

function parseArgs(args) {
  const options = { ...defaults };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--control-root') {
      options.controlRoot = args[++i];
    } else if (arg === '--folders') {
      options.folders = args[++i].split(',').map((item) => item.trim()).filter(Boolean);
    } else if (arg === '--daemon-state') {
      options.daemonState = args[++i];
    } else if (arg === '--output') {
      options.output = args[++i];
    } else if (arg === '--query') {
      options.query = args[++i];
    } else if (arg === '--timeout-ms') {
      options.timeoutMs = Number.parseInt(args[++i], 10);
    } else if (arg === '-h' || arg === '--help') {
      console.log(`Usage: node Test/scripts/probe-multi-root-project-scope.mjs [options]

Options:
  --control-root <path>  ProjectScope control root. Default: .
  --folders <csv>        Bound source folders to resolve.
  --daemon-state <path>  Explicit daemon.json path.
  --output <path>        Output JSON path.
  --query <text>         Search query. Default: ${defaults.query}
  --timeout-ms <ms>      Fetch timeout. Default: ${defaults.timeoutMs}
`);
      process.exit(0);
    }
  }
  return options;
}

function writeReport() {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(
    `${JSON.stringify(
      {
        outputPath,
        ok: report.ok,
        daemon: report.daemon,
        checks: report.checks,
        summaries: report.summaries,
      },
      null,
      2
    )}\n`
  );
}
