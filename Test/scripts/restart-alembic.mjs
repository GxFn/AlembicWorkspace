#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  realpathSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const alembicTestRoot = path.resolve(workspaceRoot, "Test");
const alembicTestScriptsRoot = path.resolve(workspaceRoot, "Test", "scripts");
// 测试运行参数归 Test/config 管理；总控窗口只分派测试，不直接持有测试配置。
const TEST_CONFIG = loadTestConfig();

const DEFAULT_PROJECT = stringConfig(TEST_CONFIG.defaultProject, "BiliDili");
const DEFAULT_ALEMBIC = stringConfig(TEST_CONFIG.defaultAlembic, "Alembic");
const DEFAULT_WAIT_MS = numberConfig(TEST_CONFIG.restart?.waitMs, 10_000);
const DEFAULT_STOP_WAIT_MS = numberConfig(TEST_CONFIG.restart?.stopWaitMs, 5_000);
const DEFAULT_STATUS_TIMEOUT_MS = numberConfig(TEST_CONFIG.restart?.statusTimeoutMs, 3_000);
const DEFAULT_MONITOR_INTERVAL_MS = numberConfig(TEST_CONFIG.restart?.monitorIntervalMs, 20_000);
const DEFAULT_PRECLEAN_ENABLED = booleanConfig(TEST_CONFIG.restart?.preclean?.enabled, true);
const DEFAULT_PRECLEAN_STOP_ALL_SERVICES = booleanConfig(
  TEST_CONFIG.restart?.preclean?.stopAllServices,
  true,
);
const DEFAULT_PRECLEAN_CLEAN_LOGS = booleanConfig(TEST_CONFIG.restart?.preclean?.cleanLogs, true);
const DEFAULT_PRECLEAN_STOP_WAIT_MS = numberConfig(
  TEST_CONFIG.restart?.preclean?.stopWaitMs,
  DEFAULT_STOP_WAIT_MS,
);
const DEFAULT_AI_SOURCE_PROJECT = stringConfig(TEST_CONFIG.ai?.defaultSourceProject, DEFAULT_PROJECT);
const DEFAULT_AI_FALLBACK_ENABLED = booleanConfig(TEST_CONFIG.ai?.fallbackToDefaultProject, true);

const PROVIDER_KEY_ENV = {
  google: "ALEMBIC_GOOGLE_API_KEY",
  openai: "ALEMBIC_OPENAI_API_KEY",
  claude: "ALEMBIC_CLAUDE_API_KEY",
  deepseek: "ALEMBIC_DEEPSEEK_API_KEY",
};

const AI_SETTING_FIELD_TO_ENV = {
  provider: "ALEMBIC_AI_PROVIDER",
  model: "ALEMBIC_AI_MODEL",
  proxy: "ALEMBIC_AI_PROXY",
  reasoningEffort: "ALEMBIC_AI_REASONING_EFFORT",
  embedProvider: "ALEMBIC_EMBED_PROVIDER",
  embedModel: "ALEMBIC_EMBED_MODEL",
  embedBaseUrl: "ALEMBIC_EMBED_BASE_URL",
};

const AI_ENV_KEYS = [
  "ALEMBIC_AI_PROVIDER",
  "ALEMBIC_AI_MODEL",
  "ALEMBIC_GOOGLE_API_KEY",
  "ALEMBIC_OPENAI_API_KEY",
  "ALEMBIC_CLAUDE_API_KEY",
  "ALEMBIC_DEEPSEEK_API_KEY",
  "ALEMBIC_AI_PROXY",
  "ALEMBIC_AI_REASONING_EFFORT",
  "ALEMBIC_EMBED_PROVIDER",
  "ALEMBIC_EMBED_MODEL",
  "ALEMBIC_EMBED_BASE_URL",
  "ALEMBIC_EMBED_API_KEY",
];

const AI_SECRET_ENV_KEYS = new Set([
  "ALEMBIC_GOOGLE_API_KEY",
  "ALEMBIC_OPENAI_API_KEY",
  "ALEMBIC_CLAUDE_API_KEY",
  "ALEMBIC_DEEPSEEK_API_KEY",
  "ALEMBIC_EMBED_API_KEY",
]);

function loadTestConfig() {
  const configPath = path.join(alembicTestRoot, "config", "defaults.json");
  try {
    return JSON.parse(readFileSync(configPath, "utf8"));
  } catch {
    return {};
  }
}

function stringConfig(value, fallback) {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function numberConfig(value, fallback) {
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function booleanConfig(value, fallback) {
  return typeof value === "boolean" ? value : fallback;
}

function usage() {
  return `Restart the local Alembic runtime and print the active Dashboard URL.

Usage:
  node Test/scripts/restart-alembic.mjs [options]

Options:
  --project <name|path>       Project name under this workspace, or a project path.
                              Default: ${DEFAULT_PROJECT}
  --alembic <path>            Alembic repository path. Default: ${DEFAULT_ALEMBIC}
  --wait <ms>                 Wait for daemon ready. Default: ${DEFAULT_WAIT_MS}
  --stop-wait <ms>            Wait for previous runtime stop. Default: ${DEFAULT_STOP_WAIT_MS}
  --status-timeout <ms>       Wait for post-start status probe. Default: ${DEFAULT_STATUS_TIMEOUT_MS}
  --no-preclean               Skip the clean-environment preflight.
  --no-stop-all-services      Do not stop existing Alembic daemon/test monitor processes.
  --no-clean-logs             Do not remove old .asd daemon/log files before restart.
  --preclean-stop-wait <ms>   Wait for service shutdown before SIGKILL. Default: ${DEFAULT_PRECLEAN_STOP_WAIT_MS}
  --no-dev-link               Skip Alembic npm run dev:link before restart.
  --no-runtime-write-check    Skip preflight write check for ~/.asd runtime state.
  --no-status                 Skip the post-start bootstrap status probe.
  --monitor                   After restart, run the read-only bootstrap monitor until Ctrl-C.
  --monitor-once              After restart, print one read-only bootstrap monitor snapshot.
  --monitor-interval <ms>     Polling interval for --monitor. Default: ${DEFAULT_MONITOR_INTERVAL_MS}
  --ai-source-project <name|path>
                              Fallback project whose Alembic Ghost AI config is used when
                              the target project has no usable AI config. Default: ${DEFAULT_AI_SOURCE_PROJECT}
  --no-ai-fallback            Do not inject fallback AI config from the default source project.
  --dry-run                   Print the command without executing it.
  --json                      Print a JSON summary.
  -h, --help                  Show this help.

Examples:
  node Test/scripts/restart-alembic.mjs
  node Test/scripts/restart-alembic.mjs --monitor
  node Test/scripts/restart-alembic.mjs --project BiliDili
  node Test/scripts/restart-alembic.mjs --project ../SomeProject --wait 15000
`;
}

function parseArgs(argv) {
  const options = {
    alembic: DEFAULT_ALEMBIC,
    aiFallback: DEFAULT_AI_FALLBACK_ENABLED,
    aiSourceProject: DEFAULT_AI_SOURCE_PROJECT,
    devLink: booleanConfig(TEST_CONFIG.restart?.devLink, true),
    dryRun: false,
    json: false,
    monitor: false,
    monitorIntervalMs: DEFAULT_MONITOR_INTERVAL_MS,
    monitorOnce: false,
    preclean: DEFAULT_PRECLEAN_ENABLED,
    precleanCleanLogs: DEFAULT_PRECLEAN_CLEAN_LOGS,
    precleanStopAllServices: DEFAULT_PRECLEAN_STOP_ALL_SERVICES,
    precleanStopWaitMs: DEFAULT_PRECLEAN_STOP_WAIT_MS,
    project: DEFAULT_PROJECT,
    runtimeWriteCheck: booleanConfig(TEST_CONFIG.restart?.runtimeWriteCheck, true),
    status: booleanConfig(TEST_CONFIG.restart?.statusProbe, true),
    statusTimeoutMs: DEFAULT_STATUS_TIMEOUT_MS,
    stopWaitMs: DEFAULT_STOP_WAIT_MS,
    waitMs: DEFAULT_WAIT_MS,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "-h" || arg === "--help") {
      options.help = true;
      continue;
    }
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (arg === "--json") {
      options.json = true;
      continue;
    }
    if (arg === "--monitor") {
      options.monitor = true;
      continue;
    }
    if (arg === "--monitor-once") {
      options.monitorOnce = true;
      continue;
    }
    if (arg === "--no-status") {
      options.status = false;
      continue;
    }
    if (arg === "--no-dev-link") {
      options.devLink = false;
      continue;
    }
    if (arg === "--no-preclean") {
      options.preclean = false;
      continue;
    }
    if (arg === "--no-stop-all-services") {
      options.precleanStopAllServices = false;
      continue;
    }
    if (arg === "--no-clean-logs") {
      options.precleanCleanLogs = false;
      continue;
    }
    if (arg === "--no-runtime-write-check") {
      options.runtimeWriteCheck = false;
      continue;
    }
    if (arg === "--no-ai-fallback") {
      options.aiFallback = false;
      continue;
    }
    if (
      arg === "--project" ||
      arg === "--alembic" ||
      arg === "--ai-source-project" ||
      arg === "--wait" ||
      arg === "--stop-wait" ||
      arg === "--status-timeout" ||
      arg === "--monitor-interval" ||
      arg === "--preclean-stop-wait"
    ) {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`${arg} requires a value`);
      }
      i += 1;
      if (arg === "--project") {
        options.project = value;
      } else if (arg === "--alembic") {
        options.alembic = value;
      } else if (arg === "--ai-source-project") {
        options.aiSourceProject = value;
      } else if (arg === "--wait") {
        options.waitMs = parsePositiveInteger(value, arg);
      } else if (arg === "--stop-wait") {
        options.stopWaitMs = parsePositiveInteger(value, arg);
      } else if (arg === "--status-timeout") {
        options.statusTimeoutMs = parsePositiveInteger(value, arg);
      } else if (arg === "--monitor-interval") {
        options.monitorIntervalMs = parsePositiveInteger(value, arg);
      } else if (arg === "--preclean-stop-wait") {
        options.precleanStopWaitMs = parsePositiveInteger(value, arg);
      }
      continue;
    }
    throw new Error(`Unknown option: ${arg}`);
  }

  return options;
}

function parsePositiveInteger(value, name) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${name} must be a non-negative integer`);
  }
  return parsed;
}

function resolveInsideWorkspaceOrPath(value) {
  if (path.isAbsolute(value)) {
    return path.resolve(value);
  }
  return path.resolve(workspaceRoot, value);
}

function resolveProject(value) {
  const direct = resolveInsideWorkspaceOrPath(value);
  if (existsSync(direct)) {
    return direct;
  }

  const byName = path.resolve(workspaceRoot, value);
  if (existsSync(byName)) {
    return byName;
  }

  return direct;
}

function assertDirectory(dir, label) {
  if (!existsSync(dir)) {
    throw new Error(`${label} does not exist: ${dir}`);
  }
  if (!statSync(dir).isDirectory()) {
    throw new Error(`${label} is not a directory: ${dir}`);
  }
}

function parseJsonFromStdout(stdout) {
  const trimmed = stdout.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("Alembic start did not return parseable JSON");
  }
}

function firstString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }
  return null;
}

function dashboardUrlFromResult(result) {
  return firstString(
    result?.handoff?.dashboardUrl,
    result?.targetProject?.dashboardUrl,
    result?.state?.dashboardUrl,
    result?.dashboardUrl,
    result?.url,
  );
}

function apiBaseUrlFromResult(result, dashboardUrl) {
  return firstString(
    result?.handoff?.apiBaseUrl,
    result?.targetProject?.apiBaseUrl,
    result?.state?.url,
    result?.apiBaseUrl,
    dashboardUrl,
  );
}

function pidFromResult(result) {
  return (
    result?.targetProject?.daemon?.pid ??
    result?.targetProject?.daemon?.state?.pid ??
    result?.state?.pid ??
    result?.pid ??
    null
  );
}

function safeReadJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function safeRealpathOrResolve(value) {
  return path.resolve(value);
}

function uniqueBy(items, keyFn) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const key = keyFn(item);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(item);
  }
  return result;
}

function knownGlobalAlembicRoot() {
  return path.join(os.homedir(), ".asd");
}

function discoverDataRoots(projectRoot) {
  const roots = new Set();
  const homeAlembicRoot = knownGlobalAlembicRoot();
  const workspacesRoot = path.join(homeAlembicRoot, "workspaces");

  // 真实测试通常走 ghost workspace；同时保留 projectRoot/.asd 兼容旧本地数据布局。
  if (existsSync(path.join(projectRoot, ".asd"))) {
    roots.add(safeRealpathOrResolve(projectRoot));
  }

  const projects = safeReadJson(path.join(homeAlembicRoot, "projects.json"));
  const entries = projects && typeof projects === "object" ? Object.values(projects.projects || {}) : [];
  for (const entry of entries) {
    if (entry && typeof entry === "object" && typeof entry.id === "string") {
      const dataRoot = path.join(workspacesRoot, entry.id);
      if (existsSync(path.join(dataRoot, ".asd"))) {
        roots.add(safeRealpathOrResolve(dataRoot));
      }
    }
  }

  if (existsSync(workspacesRoot)) {
    for (const entry of readdirSync(workspacesRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }
      const dataRoot = path.join(workspacesRoot, entry.name);
      if (existsSync(path.join(dataRoot, ".asd"))) {
        roots.add(safeRealpathOrResolve(dataRoot));
      }
    }
  }

  return [...roots].sort();
}

function isProcessAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function sleepSync(ms) {
  if (ms <= 0) {
    return;
  }
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function terminateProcess(pid, waitMs, reason) {
  if (!Number.isInteger(pid) || pid <= 0 || pid === process.pid) {
    return { ok: false, pid, reason, status: "skipped-invalid-pid" };
  }
  if (!isProcessAlive(pid)) {
    return { ok: true, pid, reason, status: "already-exited" };
  }

  try {
    process.kill(pid, "SIGTERM");
  } catch (error) {
    return {
      ok: false,
      pid,
      reason,
      status: "sigterm-failed",
      error: error instanceof Error ? error.message : String(error),
    };
  }

  const startedAt = Date.now();
  while (Date.now() - startedAt < waitMs) {
    if (!isProcessAlive(pid)) {
      return { ok: true, pid, reason, status: "terminated" };
    }
    sleepSync(100);
  }

  try {
    process.kill(pid, "SIGKILL");
  } catch {
    return { ok: true, pid, reason, status: "exited-before-sigkill" };
  }
  return { ok: !isProcessAlive(pid), pid, reason, status: "killed" };
}

function daemonRuntimeDir(dataRoot) {
  return path.join(dataRoot, ".asd");
}

function removeDaemonRuntimeState(dataRoot) {
  const runtimeDir = daemonRuntimeDir(dataRoot);
  const removed = [];
  for (const name of ["daemon.json", "daemon.pid"]) {
    const target = path.join(runtimeDir, name);
    if (existsSync(target)) {
      rmSync(target, { force: true });
      removed.push(target);
    }
  }
  const lockDir = path.join(runtimeDir, "daemon.lock");
  if (existsSync(lockDir)) {
    rmSync(lockDir, { recursive: true, force: true });
    removed.push(lockDir);
  }
  return removed;
}

function stopDaemonsFromState(dataRoots, waitMs, dryRun) {
  const stopped = [];
  const removedState = [];
  for (const dataRoot of dataRoots) {
    const runtimeDir = daemonRuntimeDir(dataRoot);
    const statePath = path.join(runtimeDir, "daemon.json");
    const state = safeReadJson(statePath);
    const pid = Number(state?.pid);
    if (Number.isInteger(pid) && pid > 0) {
      if (dryRun) {
        stopped.push({ dataRoot, pid, reason: "daemon-state", status: "dry-run" });
      } else {
        stopped.push(terminateProcess(pid, waitMs, `daemon-state:${dataRoot}`));
      }
    }
    if (!dryRun) {
      removedState.push(...removeDaemonRuntimeState(dataRoot));
    } else if (existsSync(runtimeDir)) {
      removedState.push(path.join(runtimeDir, "daemon.json"));
      removedState.push(path.join(runtimeDir, "daemon.pid"));
      removedState.push(path.join(runtimeDir, "daemon.lock"));
    }
  }
  return { removedState, stopped };
}

function listProcessMatches() {
  const result = spawnSync("ps", ["-axo", "pid=,command="], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0 || result.error) {
    return {
      error: result.error?.message || result.stderr.trim() || "ps failed",
      matches: [],
      ok: false,
    };
  }

  const currentPid = process.pid;
  const matches = result.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const firstSpace = line.search(/\s/);
      const pid = Number(firstSpace >= 0 ? line.slice(0, firstSpace) : line);
      const command = firstSpace >= 0 ? line.slice(firstSpace).trim() : "";
      return { command, pid };
    })
    .filter((entry) => Number.isInteger(entry.pid) && entry.pid > 0 && entry.pid !== currentPid)
    .filter((entry) => {
      // 只兜底 Alembic 自己的 daemon 和旧 Test monitor，避免误杀其它 node 服务。
      const daemonServer = /(?:^|\s|\/)(?:dist\/bin\/)?daemon-server\.js\b/.test(entry.command);
      const alembicOwned = /Alembic|alembic-ai|alembic-codex/i.test(entry.command);
      const staleMonitor = /Test\/scripts\/monitor-alembic-bootstrap\.mjs/.test(entry.command);
      return (daemonServer && alembicOwned) || staleMonitor;
    });

  return { matches, ok: true };
}

function stopAlembicProcesses(waitMs, dryRun) {
  const processScan = listProcessMatches();
  if (!processScan.ok) {
    return { error: processScan.error, stopped: [] };
  }

  const stopped = uniqueBy(processScan.matches, (entry) => entry.pid).map((entry) => {
    if (dryRun) {
      return { command: entry.command, ok: true, pid: entry.pid, reason: "process-scan", status: "dry-run" };
    }
    return {
      command: entry.command,
      ...terminateProcess(entry.pid, waitMs, "process-scan"),
    };
  });
  return { stopped };
}

function countPathEntries(target) {
  if (!existsSync(target)) {
    return { dirs: 0, files: 0 };
  }
  const stat = statSync(target);
  if (!stat.isDirectory()) {
    return { dirs: 0, files: 1 };
  }
  let dirs = 1;
  let files = 0;
  for (const entry of readdirSync(target, { withFileTypes: true })) {
    const child = path.join(target, entry.name);
    if (entry.isDirectory()) {
      const counted = countPathEntries(child);
      dirs += counted.dirs;
      files += counted.files;
    } else {
      files += 1;
    }
  }
  return { dirs, files };
}

function cleanLogs(dataRoots, dryRun) {
  const cleaned = [];
  for (const dataRoot of dataRoots) {
    const runtimeDir = daemonRuntimeDir(dataRoot);
    const daemonLog = path.join(runtimeDir, "daemon.log");
    const logsDir = path.join(runtimeDir, "logs");
    const targets = [daemonLog, logsDir].filter((target) => existsSync(target));
    const before = targets.map((target) => ({ target, ...countPathEntries(target) }));

    if (!dryRun) {
      rmSync(daemonLog, { force: true });
      rmSync(logsDir, { recursive: true, force: true });
      mkdirSync(logsDir, { recursive: true });
    }

    cleaned.push({
      dataRoot,
      dirs: before.reduce((sum, item) => sum + item.dirs, 0),
      files: before.reduce((sum, item) => sum + item.files, 0),
      status: dryRun ? "dry-run" : "cleaned",
      targets: before.map((item) => item.target),
    });
  }
  return cleaned;
}

function runPreclean({ dryRun, projectRoot, stopAllServices, cleanLogFiles, waitMs }) {
  const dataRoots = discoverDataRoots(projectRoot);
  const summary = {
    cleanLogs: cleanLogFiles ? [] : null,
    dataRoots,
    ok: true,
    processScanError: null,
    removedState: [],
    stopAllServices,
    stopped: [],
  };

  if (stopAllServices) {
    const byState = stopDaemonsFromState(dataRoots, waitMs, dryRun);
    const byProcess = stopAlembicProcesses(waitMs, dryRun);
    summary.removedState = byState.removedState;
    summary.stopped = [...byState.stopped, ...byProcess.stopped];
    summary.processScanError = byProcess.error || null;
  }

  if (cleanLogFiles) {
    summary.cleanLogs = cleanLogs(dataRoots, dryRun);
  }

  summary.ok =
    dryRun ||
    (!summary.processScanError &&
      summary.stopped.every((entry) => entry.ok !== false || entry.status === "already-exited"));
  return summary;
}

async function fetchJsonWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    const body = await response.text();
    let data = null;
    try {
      data = body ? JSON.parse(body) : null;
    } catch {
      data = { raw: body };
    }
    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function printHuman(summary) {
  console.log("Alembic restart completed.");
  console.log(`Project:   ${summary.projectRoot}`);
  console.log(`Data root: ${summary.dataRoot ?? "unknown"}`);
  console.log(`Alembic:   ${summary.alembicRoot}`);
  if (summary.aiConfig) {
    const provider = summary.aiConfig.target?.settings?.ALEMBIC_AI_PROVIDER ||
      summary.aiConfig.fallback?.settings?.ALEMBIC_AI_PROVIDER ||
      "not configured";
    const source = summary.aiConfig.source || "unknown";
    console.log(`AI config: ${summary.aiConfig.ready ? "ready" : "missing"} (${source}, provider=${provider})`);
  }
  if (summary.preclean?.skipped) {
    console.log("Preclean: skipped");
  } else if (summary.preclean) {
    const stopped = summary.preclean.stopped?.length ?? 0;
    const cleanedRoots = summary.preclean.cleanLogs?.length ?? 0;
    const cleanedFiles =
      summary.preclean.cleanLogs?.reduce((sum, entry) => sum + (entry.files ?? 0), 0) ?? 0;
    console.log(
      `Preclean: services=${stopped} logRoots=${cleanedRoots} logFiles=${cleanedFiles} ${summary.preclean.ok ? "ok" : "check"}`
    );
  }
  console.log(`Dev link:  ${summary.devLink?.skipped ? "skipped" : summary.devLink?.ok ? "ok" : "failed"}`);
  console.log(`Runtime:   ${summary.runtimeState?.skipped ? "check skipped" : summary.runtimeState?.ok ? "writable" : "not writable"}`);
  console.log(`Ready:     ${summary.ready ? "yes" : "no"}`);
  console.log(`PID:       ${summary.pid ?? "unknown"}`);
  console.log(`Dashboard: ${summary.dashboardUrl ?? "unavailable"}`);
  console.log(`Duration:  ${Math.round(summary.durationMs / 100) / 10}s`);

  if (summary.bootstrapStatus) {
    const job = summary.bootstrapStatus.data?.data?.jobs?.[0] ?? null;
    const status = job?.progress?.status ?? job?.status ?? "idle";
    const activeJob = ["running", "queued"].includes(job?.status) ? job.id : "none";
    console.log(`Bootstrap: ${summary.bootstrapStatus.ok ? status : "probe failed"} (active job: ${activeJob})`);
  }

  if (summary.error) {
    console.log(`Error:     ${summary.error}`);
  }
}

function checkRuntimeStateWritable() {
  const dir = path.join(os.homedir(), ".asd");
  const target = path.join(dir, "runtime-control.json");
  const probe = path.join(dir, `runtime-control.preflight.${process.pid}.tmp`);

  try {
    mkdirSync(dir, { recursive: true });
    writeFileSync(probe, `preflight ${new Date().toISOString()}\n`);
    unlinkSync(probe);
    return { ok: true, dir, target, skipped: false };
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error ? ` (${String(error.code)})` : "";
    throw new Error(
      `Alembic runtime state is not writable${code}: ${target}. ` +
        "Alembic start must register the active runtime there; in Codex, run this restart script with elevated sandbox permissions."
    );
  }
}

function runDevLink({ alembicRoot, dryRun }) {
  const args = ["run", "dev:link"];
  if (dryRun) {
    return { command: "npm", args, cwd: alembicRoot, skipped: false };
  }

  const startedAt = Date.now();
  const child = spawnSync("npm", args, {
    cwd: alembicRoot,
    encoding: "utf8",
    env: cleanNpmPrefixEnv(process.env),
    stdio: ["ignore", "pipe", "pipe"],
  });

  return {
    args,
    command: "npm",
    cwd: alembicRoot,
    durationMs: Date.now() - startedAt,
    exitCode: child.status,
    ok: child.status === 0,
    skipped: false,
    stderr: child.stderr.trim(),
    stdout: child.stdout.trim(),
  };
}

function cleanNpmPrefixEnv(env) {
  const next = { ...env };
  // `npm --prefix Test run ...` 会把 prefix 传给子 npm；这里清掉，
  // 避免 Alembic 的 `npm install -g .` 被错误安装到 Test/bin 和 lib/。
  for (const key of Object.keys(next)) {
    if (key.toLowerCase() === "npm_config_prefix") {
      delete next[key];
    }
  }
  delete next.PREFIX;
  return next;
}

function buildRuntimeEnv(aiConfig) {
  const base = cleanNpmPrefixEnv(process.env);
  return { ...base, ...(aiConfig?.env || {}) };
}

function resolveAiRuntimeConfig({ fallbackEnabled, fallbackProject, projectRoot }) {
  const processEnv = collectAiEnv(process.env);
  if (isAiEnvReady(processEnv)) {
    return {
      env: {},
      fallbackEnabled,
      fallbackProject: fallbackProject || null,
      ready: true,
      reason: "explicit process env already provides a usable AI config",
      source: "process-env",
      target: describeAiStore(projectRoot),
    };
  }

  const target = describeAiStore(projectRoot);
  if (isAiEnvReady(target.env)) {
    return {
      env: target.env,
      fallbackEnabled,
      fallbackProject: fallbackProject || null,
      ready: true,
      reason: "target project Alembic workspace AI config is usable",
      source: "target-project",
      target,
    };
  }

  if (!fallbackEnabled || !fallbackProject) {
    return {
      env: {},
      fallbackEnabled,
      fallbackProject: fallbackProject || null,
      ready: false,
      reason: "target project AI config is not ready and fallback is disabled",
      source: "missing",
      target,
    };
  }

  const fallbackRoot = resolveProject(fallbackProject);
  const fallback = describeAiStore(fallbackRoot);
  if (pathsEqual(fallbackRoot, projectRoot)) {
    return {
      env: {},
      fallback,
      fallbackEnabled,
      fallbackProject,
      ready: false,
      reason: "fallback project resolves to the same target and target AI config is not ready",
      source: "missing",
      target,
    };
  }
  if (isAiEnvReady(fallback.env)) {
    return {
      env: fallback.env,
      fallback,
      fallbackEnabled,
      fallbackProject,
      ready: true,
      reason: "target project has no usable AI config; injected fallback project AI config",
      source: "fallback-project",
      target,
    };
  }

  return {
    env: {},
    fallback,
    fallbackEnabled,
    fallbackProject,
    ready: false,
    reason: "neither target project nor fallback project has usable AI config",
    source: "missing",
    target,
  };
}

function describeAiStore(projectRoot) {
  const inspection = inspectGhostProject(projectRoot);
  const runtimeDir = path.join(inspection.dataRoot, ".asd");
  const settingsPath = path.join(runtimeDir, "settings.json");
  const secretsPath = path.join(runtimeDir, "secrets.json");
  const env = readAiEnvFromStore(settingsPath, secretsPath);
  return {
    dataRoot: inspection.dataRoot,
    dataRootSource: inspection.ghost ? "ghost-registry" : "project-root",
    env,
    ghost: inspection.ghost,
    hasSettingsFile: existsSync(settingsPath),
    hasSecretsFile: existsSync(secretsPath),
    projectId: inspection.projectId,
    projectRoot,
    ready: isAiEnvReady(env),
    runtimeDir,
    settingsPath,
    secretsPath,
  };
}

function readAiEnvFromStore(settingsPath, secretsPath) {
  const settings = readJson(settingsPath);
  const secrets = readJson(secretsPath);
  const env = {};
  const aiSettings = settings.ai && typeof settings.ai === "object" ? settings.ai : {};
  for (const [field, envKey] of Object.entries(AI_SETTING_FIELD_TO_ENV)) {
    const value = aiSettings[field];
    if (typeof value === "string" && value.length > 0) {
      env[envKey] = value;
    }
  }

  const providerKeys =
    secrets.ai && typeof secrets.ai === "object" && secrets.ai.providerKeys
      ? secrets.ai.providerKeys
      : {};
  for (const [provider, envKey] of Object.entries(PROVIDER_KEY_ENV)) {
    const value = providerKeys[provider];
    if (typeof value === "string" && value.length > 0) {
      env[envKey] = value;
    }
  }

  if (
    secrets.ai &&
    typeof secrets.ai === "object" &&
    typeof secrets.ai.embedApiKey === "string" &&
    secrets.ai.embedApiKey.length > 0
  ) {
    env.ALEMBIC_EMBED_API_KEY = secrets.ai.embedApiKey;
  }

  return env;
}

function inspectGhostProject(projectRoot) {
  const realpath = normalizeProjectPath(projectRoot);
  const registry = readJson(path.join(getAlembicGlobalRoot(), "projects.json"));
  const entry = registry.projects && registry.projects[realpath] ? registry.projects[realpath] : null;
  const projectId = entry?.id || generateProjectId(projectRoot);
  const ghost = entry?.ghost === true;
  return {
    dataRoot: ghost ? path.join(getAlembicGlobalRoot(), "workspaces", projectId) : projectRoot,
    ghost,
    projectId: ghost ? projectId : null,
    realpath,
  };
}

function readJson(filePath) {
  try {
    if (!existsSync(filePath)) {
      return {};
    }
    const parsed = JSON.parse(readFileSync(filePath, "utf8"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function collectAiEnv(env) {
  const result = {};
  for (const key of AI_ENV_KEYS) {
    const value = env[key];
    if (typeof value === "string" && value.length > 0) {
      result[key] = value;
    }
  }
  return result;
}

function isAiEnvReady(env) {
  const provider = env.ALEMBIC_AI_PROVIDER || "";
  const neededKey = PROVIDER_KEY_ENV[provider] || "";
  return Boolean(provider && (!neededKey || env[neededKey]));
}

function publicAiConfig(aiConfig) {
  const toPublicStore = (store) =>
    store
      ? {
          dataRootSource: store.dataRootSource,
          ghost: store.ghost,
          hasSecretsFile: store.hasSecretsFile,
          hasSettingsFile: store.hasSettingsFile,
          projectId: store.projectId,
          projectRoot: store.projectRoot,
          ready: store.ready,
          settingsPath: store.settingsPath,
          secretProviders: secretProviderFlags(store.env),
          settings: publicAiSettings(store.env),
        }
      : null;

  return {
    fallbackEnabled: aiConfig.fallbackEnabled,
    fallbackProject: aiConfig.fallbackProject || null,
    fallback: toPublicStore(aiConfig.fallback),
    ready: aiConfig.ready,
    reason: aiConfig.reason,
    source: aiConfig.source,
    target: toPublicStore(aiConfig.target),
  };
}

function publicAiSettings(env) {
  const out = {};
  for (const [key, value] of Object.entries(env || {})) {
    if (AI_SECRET_ENV_KEYS.has(key)) {
      continue;
    }
    out[key] = value;
  }
  return out;
}

function secretProviderFlags(env) {
  const flags = {};
  for (const [provider, envKey] of Object.entries(PROVIDER_KEY_ENV)) {
    if (env?.[envKey]) {
      flags[provider] = true;
    }
  }
  if (env?.ALEMBIC_EMBED_API_KEY) {
    flags.embed = true;
  }
  return flags;
}

function getAlembicGlobalRoot() {
  return path.join(process.env.ALEMBIC_HOME || os.homedir(), ".asd");
}

function normalizeProjectPath(projectRoot) {
  try {
    return realpathSync(projectRoot);
  } catch {
    return path.resolve(projectRoot);
  }
}

function generateProjectId(projectRoot) {
  return createHash("sha256").update(normalizeProjectPath(projectRoot)).digest("hex").slice(0, 8);
}

function pathsEqual(a, b) {
  return path.resolve(a) === path.resolve(b);
}

function runMonitor({ dashboardUrl, projectRoot, dataRoot, env, intervalMs, once }) {
  const monitorPath = path.join(alembicTestScriptsRoot, "monitor-alembic-bootstrap.mjs");
  if (!existsSync(monitorPath)) {
    throw new Error(`Monitor script not found: ${monitorPath}`);
  }

  const args = [monitorPath, "--project", projectRoot];
  if (dataRoot) {
    args.push("--data-root", dataRoot);
  }
  if (dashboardUrl) {
    args.push("--url", dashboardUrl);
  }
  if (once) {
    // default monitor mode is one snapshot
  } else {
    args.push("--watch", "--keep-going", "--interval", String(intervalMs));
  }

  const child = spawnSync(process.execPath, args, {
    cwd: workspaceRoot,
    encoding: "utf8",
    env: env || cleanNpmPrefixEnv(process.env),
    stdio: "inherit",
  });
  if (child.status !== 0) {
    process.exitCode = child.status ?? 1;
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }

  const alembicRoot = resolveInsideWorkspaceOrPath(options.alembic);
  const projectRoot = resolveProject(options.project);
  assertDirectory(alembicRoot, "Alembic repository");
  assertDirectory(projectRoot, "Project");
  const aiConfig = resolveAiRuntimeConfig({
    fallbackEnabled: options.aiFallback,
    fallbackProject: options.aiSourceProject,
    projectRoot,
  });
  const runtimeEnv = buildRuntimeEnv(aiConfig);

  const cliPath = path.join(alembicRoot, "dist/bin/cli.js");

  const commandArgs = [
    cliPath,
    "start",
    "--dir",
    projectRoot,
    "--restart",
    "--no-open",
    "--json",
    "--wait",
    String(options.waitMs),
    "--stop-wait",
    String(options.stopWaitMs),
  ];

  if (options.dryRun) {
    const dryRunSummary = {
      aiConfig: publicAiConfig(aiConfig),
      alembicRoot,
      devLink: options.devLink ? runDevLink({ alembicRoot, dryRun: true }) : { skipped: true },
      preclean: options.preclean
        ? runPreclean({
            cleanLogFiles: options.precleanCleanLogs,
            dryRun: true,
            projectRoot,
            stopAllServices: options.precleanStopAllServices,
            waitMs: options.precleanStopWaitMs,
          })
        : { skipped: true },
      runtimeState: options.runtimeWriteCheck
        ? { target: path.join(os.homedir(), ".asd", "runtime-control.json"), preflight: true }
        : { skipped: true },
      command: process.execPath,
      args: commandArgs,
      monitor:
        options.monitor || options.monitorOnce
          ? {
              command: process.execPath,
              args: [
                path.join(alembicTestScriptsRoot, "monitor-alembic-bootstrap.mjs"),
                "--project",
                projectRoot,
                ...(options.monitor ? ["--watch", "--keep-going", "--interval", String(options.monitorIntervalMs)] : []),
              ],
            }
          : null,
      projectRoot,
      workspaceRoot,
    };
    if (options.json) {
      console.log(JSON.stringify(dryRunSummary, null, 2));
    } else {
      if (options.devLink) {
        console.log(`npm run dev:link  # cwd=${JSON.stringify(alembicRoot)}`);
      }
      console.log(`${process.execPath} ${commandArgs.map((arg) => JSON.stringify(arg)).join(" ")}`);
      if (dryRunSummary.monitor) {
        console.log(
          `then ${process.execPath} ${dryRunSummary.monitor.args.map((arg) => JSON.stringify(arg)).join(" ")}`
        );
      }
    }
    return;
  }

  const runtimeState = options.runtimeWriteCheck
    ? checkRuntimeStateWritable()
    : { ok: true, skipped: true };

  const preclean = options.preclean
    ? runPreclean({
        cleanLogFiles: options.precleanCleanLogs,
        dryRun: false,
        projectRoot,
        stopAllServices: options.precleanStopAllServices,
        waitMs: options.precleanStopWaitMs,
      })
    : { skipped: true };

  if (!preclean.skipped && preclean.ok === false) {
    const summary = {
      ok: false,
      aiConfig: publicAiConfig(aiConfig),
      alembicRoot,
      devLink: { skipped: true },
      durationMs: 0,
      error:
        "Alembic preclean failed; rerun with elevated sandbox permissions so the script can inspect and stop existing services.",
      exitCode: 1,
      preclean,
      projectRoot,
      ready: false,
      runtimeState,
      workspaceRoot,
    };
    if (options.json) {
      console.log(JSON.stringify(summary, null, 2));
    } else {
      printHuman(summary);
    }
    process.exitCode = 1;
    return;
  }

  const devLink = options.devLink
    ? runDevLink({ alembicRoot, dryRun: false })
    : { ok: true, skipped: true };
  if (!devLink.ok) {
    const summary = {
      ok: false,
      aiConfig: publicAiConfig(aiConfig),
      alembicRoot,
      devLink,
      durationMs: devLink.durationMs ?? 0,
      error: firstString(devLink.stderr, devLink.stdout, "Alembic dev:link failed"),
      exitCode: devLink.exitCode ?? 1,
      preclean,
      projectRoot,
      ready: false,
      runtimeState,
      workspaceRoot,
    };
    if (options.json) {
      console.log(JSON.stringify(summary, null, 2));
    } else {
      printHuman(summary);
    }
    process.exitCode = devLink.exitCode ?? 1;
    return;
  }

  if (!existsSync(cliPath)) {
    throw new Error(`Alembic CLI is not built after dev:link: ${cliPath}.`);
  }

  const startedAt = Date.now();
  const child = spawnSync(process.execPath, commandArgs, {
    cwd: alembicRoot,
    encoding: "utf8",
    env: runtimeEnv,
    stdio: ["ignore", "pipe", "pipe"],
  });

  const cliResult = parseJsonFromStdout(child.stdout);
  const dashboardUrl = dashboardUrlFromResult(cliResult);
  const apiBaseUrl = apiBaseUrlFromResult(cliResult, dashboardUrl);
  const ready = Boolean(cliResult?.ok ?? cliResult?.ready ?? child.status === 0);
  const summary = {
    ok: child.status === 0 && ready,
    aiConfig: publicAiConfig(aiConfig),
    alembicRoot,
    apiBaseUrl,
    dataRoot:
      cliResult?.targetProject?.dataRoot ||
      cliResult?.state?.dataRoot ||
      cliResult?.dataRoot ||
      null,
    dashboardUrl,
    durationMs: Date.now() - startedAt,
    devLink,
    exitCode: child.status,
    pid: pidFromResult(cliResult),
    preclean,
    projectRoot,
    ready,
    runtimeState,
    stderr: child.stderr.trim(),
    workspaceRoot,
  };

  if (summary.ok && options.status && apiBaseUrl) {
    const statusUrl = new URL("/api/v1/jobs?kind=bootstrap&limit=1&compact=true", apiBaseUrl).toString();
    summary.bootstrapStatus = await fetchJsonWithTimeout(statusUrl, options.statusTimeoutMs);
  }

  if (child.status !== 0 || !ready) {
    summary.error = firstString(cliResult?.error, child.stderr.trim(), "Alembic restart failed");
  }

  if (options.json) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    printHuman(summary);
  }

  if (!summary.ok) {
    process.exitCode = 1;
    return;
  }

  if (options.monitor || options.monitorOnce) {
    runMonitor({
      dashboardUrl: summary.dashboardUrl,
      projectRoot: summary.projectRoot,
      dataRoot: summary.dataRoot,
      env: runtimeEnv,
      intervalMs: options.monitorIntervalMs,
      once: options.monitorOnce && !options.monitor,
    });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
