#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { closeSync, existsSync, openSync, readFileSync, readSync, readdirSync, statSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const alembicTestRoot = path.resolve(workspaceRoot, "Test");
// 测试默认值归 Test/config 管理，避免总控窗口把监控参数散落在根目录脚本或文档里。
const TEST_CONFIG = loadTestConfig();
const DEFAULT_PROJECT = stringConfig(TEST_CONFIG.defaultProject, "BiliDili");
const DEFAULT_INTERVAL_MS = numberConfig(TEST_CONFIG.monitor?.intervalMs, 20_000);
const DEFAULT_TIMEOUT_SECONDS = numberConfig(TEST_CONFIG.monitor?.timeoutSeconds, 8);
const DEFAULT_SIGNAL_LINES = numberConfig(TEST_CONFIG.monitor?.signalLines, 12);
const DEFAULT_TAIL_BYTES = numberConfig(TEST_CONFIG.monitor?.tailBytes, 24_000);

const SIGNAL_PATTERN = regexpConfig(
  TEST_CONFIG.monitor?.signalPattern,
  "AgentService|AgentRuntime|LLM call|tool calls received|Dimension child result|Bootstrap tier|Bootstrap agent session|coding-standards|QualityGate|note_finding|quality_gate|quality_gate_failed|failed|error|timeout|abort|cancel|RECORD|analysis_retry|l4",
);

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

function regexpConfig(value, fallback) {
  try {
    return new RegExp(stringConfig(value, fallback), "i");
  } catch {
    return new RegExp(fallback, "i");
  }
}

function usage() {
  return `Monitor Alembic bootstrap without starting, stopping, or cancelling it.

The monitor uses Alembic's compact jobs API for live status and only falls back
to the local latest job file when the API is unavailable. It must not poll the
heavy Dashboard bootstrap status endpoint.

Usage:
  node Test/scripts/monitor-alembic-bootstrap.mjs [options]

Options:
  --project <name|path>     Project name under this workspace, or a project path.
                            Default: ${DEFAULT_PROJECT}
  --data-root <path>        Alembic data root. Overrides daemon discovery.
  --url <url>               Dashboard/API base URL. Overrides daemon discovery.
  --watch                   Keep polling until interrupted with Ctrl-C.
  --keep-going              In watch mode, keep polling after a terminal job state.
  --interval <ms>           Watch polling interval. Default: ${DEFAULT_INTERVAL_MS}
  --timeout <seconds>       curl timeout for status API. Default: ${DEFAULT_TIMEOUT_SECONDS}
  --signals <count>         Number of matching log signal lines to print. Default: ${DEFAULT_SIGNAL_LINES}
  --tail-bytes <bytes>      Log bytes to scan from the end of each log file. Default: ${DEFAULT_TAIL_BYTES}
  --json                    Print JSON snapshots.
  -h, --help                Show this help.

Examples:
  node Test/scripts/monitor-alembic-bootstrap.mjs
  node Test/scripts/monitor-alembic-bootstrap.mjs --watch
  node Test/scripts/monitor-alembic-bootstrap.mjs --url http://127.0.0.1:54254 --watch
`;
}

function parseArgs(argv) {
  const options = {
    dataRoot: "",
    intervalMs: DEFAULT_INTERVAL_MS,
    json: false,
    keepGoing: false,
    project: DEFAULT_PROJECT,
    signalLines: DEFAULT_SIGNAL_LINES,
    tailBytes: DEFAULT_TAIL_BYTES,
    timeoutSeconds: DEFAULT_TIMEOUT_SECONDS,
    url: "",
    watch: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "-h" || arg === "--help") {
      options.help = true;
      continue;
    }
    if (arg === "--watch") {
      options.watch = true;
      continue;
    }
    if (arg === "--json") {
      options.json = true;
      continue;
    }
    if (arg === "--keep-going") {
      options.keepGoing = true;
      continue;
    }
    if (
      arg === "--project" ||
      arg === "--data-root" ||
      arg === "--url" ||
      arg === "--interval" ||
      arg === "--timeout" ||
      arg === "--signals" ||
      arg === "--tail-bytes"
    ) {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`${arg} requires a value`);
      }
      i += 1;
      if (arg === "--project") {
        options.project = value;
      } else if (arg === "--data-root") {
        options.dataRoot = path.resolve(value);
      } else if (arg === "--url") {
        options.url = normalizeBaseUrl(value);
      } else if (arg === "--interval") {
        options.intervalMs = parseNonNegativeInteger(value, arg);
      } else if (arg === "--timeout") {
        options.timeoutSeconds = parseNonNegativeInteger(value, arg);
      } else if (arg === "--signals") {
        options.signalLines = parseNonNegativeInteger(value, arg);
      } else if (arg === "--tail-bytes") {
        options.tailBytes = parseNonNegativeInteger(value, arg);
      }
      continue;
    }
    throw new Error(`Unknown option: ${arg}`);
  }

  return options;
}

function parseNonNegativeInteger(value, name) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${name} must be a non-negative integer`);
  }
  return parsed;
}

function normalizeBaseUrl(value) {
  return String(value || "").replace(/\/+$/, "");
}

function resolveProject(value) {
  if (path.isAbsolute(value)) {
    return path.resolve(value);
  }
  return path.resolve(workspaceRoot, value);
}

function readJsonFile(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function discoverDaemonRecords() {
  const asdRoot = path.join(os.homedir(), ".asd", "workspaces");
  if (!existsSync(asdRoot)) {
    return [];
  }

  return readdirSync(asdRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const dataRoot = path.join(asdRoot, entry.name);
      const daemonPath = path.join(dataRoot, ".asd", "daemon.json");
      const daemon = existsSync(daemonPath) ? readJsonFile(daemonPath) : null;
      return daemon ? { dataRoot, daemon, daemonPath } : null;
    })
    .filter(Boolean);
}

function resolveRuntime(options) {
  const projectRoot = resolveProject(options.project);
  const daemonRecords = discoverDaemonRecords();
  const explicitDataRoot = options.dataRoot
    ? daemonRecords.find((record) => path.resolve(record.dataRoot) === path.resolve(options.dataRoot))
    : null;
  const matchedByProject = daemonRecords.find(
    (record) => path.resolve(record.daemon?.projectRoot || "") === projectRoot
  );
  const latest = [...daemonRecords].sort((a, b) =>
    String(b.daemon?.lastReadyAt || b.daemon?.startedAt || "").localeCompare(
      String(a.daemon?.lastReadyAt || a.daemon?.startedAt || "")
    )
  )[0];
  const record =
    explicitDataRoot ||
    matchedByProject ||
    (options.dataRoot
      ? {
          dataRoot: options.dataRoot,
          daemon: readJsonFile(path.join(options.dataRoot, ".asd", "daemon.json")) || {},
          daemonPath: path.join(options.dataRoot, ".asd", "daemon.json"),
        }
      : latest);

  const dataRoot = options.dataRoot || record?.dataRoot || "";
  const url = normalizeBaseUrl(
    options.url || record?.daemon?.dashboardUrl || record?.daemon?.url || ""
  );

  return {
    dataRoot,
    daemon: record?.daemon || null,
    daemonPath: record?.daemonPath || "",
    projectRoot,
    url,
  };
}

function curlJson(url, timeoutSeconds) {
  if (!url) {
    return { ok: false, error: "No dashboard/API URL resolved", data: null, statusText: "" };
  }

  try {
    const stdout = execFileSync("curl", ["-sS", "--max-time", String(timeoutSeconds), url], {
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { ok: true, error: "", data: JSON.parse(stdout), statusText: "" };
  } catch (error) {
    const stderr = error?.stderr?.toString?.().trim?.();
    const message = stderr || (error instanceof Error ? error.message : String(error));
    return {
      ok: false,
      error: annotateApiError(message, url),
      data: null,
      statusText: "",
    };
  }
}

function annotateApiError(message, url) {
  if (
    /127\.0\.0\.1|localhost/.test(url || "") &&
    /failed to connect|couldn't connect|connection refused/i.test(message || "")
  ) {
    return `${message} (standalone monitor may be blocked by the Codex sandbox; use restart-alembic --monitor with elevated permissions for live API status)`;
  }
  return message;
}

function bootstrapJobsUrl(baseUrl) {
  return baseUrl
    ? `${baseUrl}/api/v1/jobs?kind=bootstrap&limit=1&compact=true`
    : "";
}

function listFilesRecursive(dir) {
  const files = [];
  if (!existsSync(dir)) {
    return files;
  }
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFilesRecursive(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

function countCandidates(dataRoot) {
  const roots = [
    path.join(dataRoot, "Alembic", "candidates"),
    path.join(dataRoot, "candidates"),
  ].filter((dir, index, arr) => existsSync(dir) && arr.indexOf(dir) === index);
  const byDimension = {};
  let total = 0;
  for (const root of roots) {
    for (const file of listFilesRecursive(root)) {
      if (!file.endsWith(".md")) {
        continue;
      }
      total += 1;
      const relative = path.relative(root, file);
      const dimension = relative.split(path.sep)[0] || "root";
      byDimension[dimension] = (byDimension[dimension] || 0) + 1;
    }
  }
  return { total, byDimension };
}

function latestBootstrapJob(dataRoot) {
  const jobsDir = path.join(dataRoot, ".asd", "jobs");
  if (!existsSync(jobsDir)) {
    return null;
  }
  const jobs = readdirSync(jobsDir)
    .filter((name) => name.startsWith("bootstrap_") && name.endsWith(".json"))
    .map((name) => {
      const filePath = path.join(jobsDir, name);
      const data = readJsonFile(filePath);
      const updatedAt = Date.parse(data?.updatedAt || data?.createdAt || "") || 0;
      return data ? { filePath, data, updatedAt } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.updatedAt - a.updatedAt);
  return jobs[0] || null;
}

function tailFile(filePath, maxBytes) {
  if (!existsSync(filePath)) {
    return "";
  }
  const stat = statSync(filePath);
  const start = Math.max(0, stat.size - maxBytes);
  const length = stat.size - start;
  if (length <= 0) {
    return "";
  }
  const fd = openSync(filePath, "r");
  try {
    const buffer = Buffer.alloc(length);
    readSync(fd, buffer, 0, length, start);
    return buffer.toString("utf8");
  } finally {
    closeSync(fd);
  }
}

function collectSignals(dataRoot, maxLines, tailBytes) {
  const logFiles = [
    path.join(dataRoot, ".asd", "logs", "combined.log"),
    path.join(dataRoot, ".asd", "daemon.log"),
  ];
  const lines = [];
  for (const filePath of logFiles) {
    const text = tailFile(filePath, tailBytes);
    const matched = text
      .split("\n")
      .filter((line) => SIGNAL_PATTERN.test(line))
      .map((line) => ({ file: path.relative(dataRoot, filePath), line: line.trim() }));
    lines.push(...matched);
  }
  return lines.slice(-maxLines);
}

function summarizeStatus(statusData) {
  const data = statusData?.data || null;
  const tasks = Array.isArray(data?.tasks) ? data.tasks : [];
  const active = tasks
    .filter((task) => !["skeleton", "completed", "failed", "cancelled", "aborted"].includes(task.status))
    .map((task) => ({
      id: task.id,
      status: task.status,
      events: task.eventCount || 0,
      toolCalls: task.result?.toolCallCount || 0,
      error: task.error || null,
    }));
  const completed = tasks
    .filter((task) => task.status === "completed")
    .map((task) => ({
      id: task.id,
      status: task.result?.status || task.status,
      created: task.result?.created ?? null,
      toolCalls: task.result?.toolCallCount ?? null,
      degraded: Boolean(task.result?.degraded),
    }));
  const failed = tasks
    .filter(
      (task) =>
        task.status !== "cancelled" &&
        (task.status === "failed" || task.error || task.result?.status === "quality_gate_failed")
    )
    .map((task) => ({
      id: task.id,
      status: task.result?.status || task.status,
      error: task.error || task.result?.reason || null,
    }));
  const cancelled = tasks
    .filter((task) => task.status === "cancelled")
    .map((task) => ({
      id: task.id,
      status: task.status,
      error: task.error || null,
    }));

  return {
    id: data?.id || null,
    status: data?.status || "unknown",
    progress: data?.progress ?? null,
    total: data?.total ?? null,
    completed: data?.completed ?? null,
    failed: countStatusValue(data?.failed, failed.length),
    cancelled: countStatusValue(data?.cancelled, cancelled.length),
    filling: data?.filling ?? null,
    skeleton: data?.skeleton ?? null,
    totalToolCalls: data?.totalToolCalls ?? null,
    updatedAt: data?.updatedAt ?? null,
    userCancelled: Boolean(data?.userCancelled),
    activeJob: data?.activeJob
      ? {
          id: data.activeJob.id,
          status: data.activeJob.status,
          updatedAt: data.activeJob.updatedAt,
        }
      : null,
    active,
    completedTail: completed.slice(-8),
    cancelledTail: cancelled.slice(-8),
    failed,
  };
}

function summarizeJobStatus(jobData, apiError) {
  const finalSession = jobData?.result?.finalSession || null;
  const bootstrapSession = jobData?.result?.bootstrapSession || null;
  const summary = finalSession?.summary || jobData?.result?.summary || null;
  const tasks = Array.isArray(finalSession?.tasks)
    ? finalSession.tasks
    : Array.isArray(bootstrapSession?.tasks)
      ? bootstrapSession.tasks
      : [];
  const completed = summary?.completed ?? tasks.filter((task) => task.status === "completed").length;
  const failed = summary?.failed ?? tasks.filter((task) => task.status === "failed").length;
  const cancelled =
    summary?.cancelled ??
    tasks.filter((task) => task.status === "cancelled" || /cancel/i.test(String(task.error || ""))).length;
  const filling = tasks.filter((task) => task.status === "filling").length;
  const skeleton = tasks.filter((task) => task.status === "skeleton").length;

  const derived = summarizeStatus({
    data: {
      id: finalSession?.sessionId || bootstrapSession?.id || jobData?.id || null,
      status: normalizeJobStatus(jobData?.status || finalSession?.status || bootstrapSession?.status),
      progress: jobData?.status === "running" ? bootstrapSession?.progress ?? null : 100,
      total: (summary?.totalTasks ?? bootstrapSession?.total ?? tasks.length) || null,
      completed,
      failed,
      cancelled,
      filling,
      skeleton,
      totalToolCalls:
        summary?.efficiency?.toolCalls ??
        tasks.reduce((total, task) => total + (task.result?.toolCallCount || 0), 0),
      tasks,
      userCancelled:
        jobData?.status === "cancelled" ||
        finalSession?.summary?.aborted ||
        /cancel/i.test(String(summary?.reason || "")),
    },
  });
  return { ...derived, apiError, source: "job-file-fallback" };
}

function summarizeJobsApi(statusData) {
  const job = statusData?.data?.jobs?.[0] || null;
  if (!job) {
    return {
      id: null,
      status: "idle",
      progress: null,
      total: null,
      completed: 0,
      failed: 0,
      cancelled: 0,
      filling: 0,
      skeleton: 0,
      totalToolCalls: 0,
      userCancelled: false,
      activeJob: null,
      active: [],
      completedTail: [],
      cancelledTail: [],
      failed: [],
      source: "jobs-compact-api",
    };
  }

  const progress = job.progress || {};
  const summary = job.summary || {};
  const diagnostics = summary.diagnostics || {};
  const issues = Array.isArray(diagnostics.issues) ? diagnostics.issues : [];
  const failedIssues = issues
    .filter((issue) => issue.status !== "cancelled")
    .map((issue) => ({
      id: issue.taskId || issue.id || "unknown",
      status: issue.status || "failed",
      error: issue.reason || null,
    }));
  const cancelledIssues = issues
    .filter((issue) => issue.status === "cancelled")
    .map((issue) => ({
      id: issue.taskId || issue.id || "unknown",
      status: "cancelled",
      error: issue.reason || null,
    }));
  const status = progress.status || summary.status || job.status || "unknown";

  return {
    id: progress.sessionId || job.bootstrapSessionId || job.id || null,
    status,
    progress: progress.percent ?? null,
    total: progress.total ?? summary.totalTasks ?? null,
    completed: countStatusValue(progress.completed, countStatusValue(summary.completed, 0)),
    failed: countStatusValue(progress.failed, countStatusValue(summary.failed, failedIssues.length)),
    cancelled: countStatusValue(
      progress.cancelled,
      countStatusValue(summary.cancelled, cancelledIssues.length)
    ),
    filling: progress.filling ?? null,
    skeleton: progress.skeleton ?? null,
    totalToolCalls: progress.totalToolCalls ?? summary.efficiency?.toolCalls ?? null,
    updatedAt: progress.updatedAt || job.updatedAt || null,
    userCancelled:
      job.status === "cancelled" || summary.aborted === true || /cancel/i.test(String(summary.reason || "")),
    activeJob: ["running", "queued"].includes(job.status)
      ? { id: job.id, status: job.status, updatedAt: job.updatedAt || null }
      : null,
    active: progress.activeTaskId
      ? [
          {
            id: progress.activeTaskId,
            status: progress.activeTaskStatus || "active",
            events: progress.activeTaskEventCount || 0,
            toolCalls: progress.totalToolCalls || 0,
            updatedAt: progress.activeTaskUpdatedAt || null,
            error: null,
          },
        ]
      : [],
    completedTail: [],
    cancelledTail: cancelledIssues.slice(-8),
    failed: failedIssues,
    source: "jobs-compact-api",
  };
}

function normalizeJobStatus(status) {
  if (status === "cancelled") {
    return "cancelled";
  }
  if (status === "running") {
    return "running";
  }
  if (status === "completed" || status === "failed" || status === "aborted") {
    return status;
  }
  return status || "unknown";
}

function countStatusValue(value, fallback) {
  if (Array.isArray(value)) {
    return value.length;
  }
  if (typeof value === "number") {
    return value;
  }
  if (value && typeof value === "object") {
    return Object.keys(value).length;
  }
  return fallback;
}

function formatStatusCount(value) {
  if (Array.isArray(value)) {
    return String(value.length);
  }
  if (value && typeof value === "object") {
    return String(Object.keys(value).length);
  }
  return String(value ?? "-");
}

function buildSnapshot(runtime, options) {
  const statusUrl = bootstrapJobsUrl(runtime.url);
  const statusResponse = curlJson(statusUrl, options.timeoutSeconds);
  const job = runtime.dataRoot ? latestBootstrapJob(runtime.dataRoot) : null;
  const statusSummary = statusResponse.ok
    ? summarizeJobsApi(statusResponse.data)
    : job
      ? summarizeJobStatus(job.data, statusResponse.error)
      : {
          status: "unreachable",
          error: statusResponse.error,
        };

  return {
    time: new Date().toISOString(),
    projectRoot: runtime.projectRoot,
    dataRoot: runtime.dataRoot || null,
    dashboardUrl: runtime.url || null,
    daemon: runtime.daemon
      ? {
          pid: runtime.daemon.pid ?? null,
          startedAt: runtime.daemon.startedAt ?? null,
          lastReadyAt: runtime.daemon.lastReadyAt ?? null,
          version: runtime.daemon.version ?? null,
        }
      : null,
    status: statusSummary,
    candidates: runtime.dataRoot ? countCandidates(runtime.dataRoot) : { total: 0, byDimension: {} },
    latestJob: job
      ? {
          id: job.data.id || path.basename(job.filePath, ".json"),
          status: job.data.status || null,
          source: job.data.source || null,
          updatedAt: job.data.updatedAt || null,
          resultSummary: job.data.result?.summary || job.data.result?.finalSession?.summary || null,
          filePath: job.filePath,
        }
      : null,
    signals: runtime.dataRoot
      ? collectSignals(runtime.dataRoot, options.signalLines, options.tailBytes)
      : [],
  };
}

function printHuman(snapshot) {
  const s = snapshot.status;
  console.log("");
  console.log(`[${new Date(snapshot.time).toLocaleTimeString("zh-CN", { hour12: false })}] Alembic bootstrap monitor`);
  console.log(`Project:   ${snapshot.projectRoot}`);
  console.log(`Data root: ${snapshot.dataRoot || "unresolved"}`);
  console.log(`Dashboard: ${snapshot.dashboardUrl || "unresolved"}`);
  if (snapshot.daemon) {
    console.log(`Daemon:    pid=${snapshot.daemon.pid ?? "unknown"} version=${snapshot.daemon.version ?? "unknown"}`);
  }
  if (s.source) {
    console.log(`Source:    ${s.source}`);
  }
  console.log(
    `Status:    ${s.status} progress=${formatStatusCount(s.progress)} completed=${formatStatusCount(s.completed)} failed=${formatStatusCount(s.failed)} cancelled=${formatStatusCount(s.cancelled)} filling=${formatStatusCount(s.filling)} skeleton=${formatStatusCount(s.skeleton)} tools=${formatStatusCount(s.totalToolCalls)}`
  );
  if (s.updatedAt) {
    console.log(`Heartbeat: updated=${s.updatedAt} stale=${formatAge(Date.parse(s.updatedAt))}`);
  }
  if (s.error) {
    console.log(`Error:     ${s.error.split("\n")[0]}`);
  }
  if (s.apiError) {
    console.log(`API note:  ${s.apiError.split("\n")[0]}`);
  }
  if (s.activeJob) {
    console.log(`Job:       ${s.activeJob.id} ${s.activeJob.status} updated=${s.activeJob.updatedAt}`);
  } else if (snapshot.latestJob) {
    console.log(`Job file:  ${snapshot.latestJob.id} ${snapshot.latestJob.status} updated=${snapshot.latestJob.updatedAt}`);
  }
  console.log(
    `Candidates: ${snapshot.candidates.total} ${formatByDimension(snapshot.candidates.byDimension)}`
  );

  if (Array.isArray(s.active) && s.active.length > 0) {
    console.log("Active:");
    for (const task of s.active) {
      const updated =
        typeof task.updatedAt === "number"
          ? ` updated=${new Date(task.updatedAt).toISOString()} stale=${formatAge(task.updatedAt)}`
          : "";
      console.log(`  - ${task.id}: ${task.status} events=${task.events} tools=${task.toolCalls}${updated}`);
    }
  }
  if (Array.isArray(s.failed) && s.failed.length > 0) {
    console.log("Failed:");
    for (const task of s.failed) {
      console.log(`  - ${task.id}: ${task.status}${task.error ? ` (${task.error})` : ""}`);
    }
  }
  if (Array.isArray(s.cancelledTail) && s.cancelledTail.length > 0) {
    console.log("Recently cancelled:");
    for (const task of s.cancelledTail) {
      console.log(`  - ${task.id}${task.error ? ` (${task.error})` : ""}`);
    }
  }
  if (Array.isArray(s.completedTail) && s.completedTail.length > 0) {
    console.log("Recently completed:");
    for (const task of s.completedTail) {
      console.log(
        `  - ${task.id}: ${task.status} created=${task.created ?? "-"} tools=${task.toolCalls ?? "-"} degraded=${task.degraded}`
      );
    }
  }
  if (snapshot.signals.length > 0) {
    console.log("Signals:");
    for (const signal of snapshot.signals) {
      console.log(`  - ${signal.file}: ${signal.line}`);
    }
  }
}

function isTerminalSnapshot(snapshot) {
  const status = snapshot.status?.status;
  const terminal = new Set(["aborted", "cancelled", "completed", "failed"]);
  return terminal.has(status);
}

function formatByDimension(byDimension) {
  const entries = Object.entries(byDimension || {}).sort((a, b) => a[0].localeCompare(b[0]));
  if (entries.length === 0) {
    return "";
  }
  return `(${entries.map(([k, v]) => `${k}:${v}`).join(", ")})`;
}

function formatAge(timestampMs) {
  if (!Number.isFinite(timestampMs)) {
    return "unknown";
  }
  const ageMs = Math.max(0, Date.now() - timestampMs);
  if (ageMs < 60_000) {
    return `${Math.round(ageMs / 1000)}s`;
  }
  return `${Math.round(ageMs / 60_000)}m`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }

  const runtime = resolveRuntime(options);
  const emit = () => {
    const snapshot = buildSnapshot(runtime, options);
    if (options.json) {
      console.log(JSON.stringify(snapshot, null, 2));
    } else {
      printHuman(snapshot);
    }
    return snapshot;
  };

  emit();
  if (!options.watch) {
    return;
  }

  const interval = setInterval(() => {
    const snapshot = emit();
    if (!options.keepGoing && isTerminalSnapshot(snapshot)) {
      clearInterval(interval);
      process.exit(0);
    }
  }, options.intervalMs);
  process.on("SIGINT", () => {
    clearInterval(interval);
    process.exit(0);
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
