#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const alembicTestRoot = path.resolve(workspaceRoot, "Test");
const TEST_CONFIG = loadTestConfig();

const DEFAULT_PROJECT = stringConfig(TEST_CONFIG.defaultProject, "BiliDili");
const DEFAULT_TIMEOUT_MS = 5_000;

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

function usage() {
  return `Verify the current Alembic test daemon environment without starting or stopping jobs.

Usage:
  node Test/scripts/verify-test-environment.mjs [options]

Options:
  --project <name|path>       Project name under this workspace, or a project path.
                              Default: ${DEFAULT_PROJECT}
  --url <url>                 Dashboard/API base URL. Overrides daemon discovery.
  --data-root <path>          Alembic data root. Overrides daemon discovery.
  --timeout-ms <ms>           API request timeout. Default: ${DEFAULT_TIMEOUT_MS}
  --expect-test-mode          Require /api/v1/modules/test-mode enabled. Default.
  --no-expect-test-mode       Do not require test mode.
  --json                      Print JSON only.
  -h, --help                  Show this help.

Examples:
  node Test/scripts/verify-test-environment.mjs --json
  node Test/scripts/verify-test-environment.mjs --url http://127.0.0.1:60870 --json
`;
}

function parseArgs(argv) {
  const options = {
    dataRoot: "",
    expectTestMode: true,
    json: false,
    project: DEFAULT_PROJECT,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    url: "",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "-h" || arg === "--help") {
      options.help = true;
      continue;
    }
    if (arg === "--json") {
      options.json = true;
      continue;
    }
    if (arg === "--expect-test-mode") {
      options.expectTestMode = true;
      continue;
    }
    if (arg === "--no-expect-test-mode") {
      options.expectTestMode = false;
      continue;
    }
    if (arg === "--project" || arg === "--url" || arg === "--data-root" || arg === "--timeout-ms") {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`${arg} requires a value`);
      }
      i += 1;
      if (arg === "--project") {
        options.project = value;
      } else if (arg === "--url") {
        options.url = normalizeBaseUrl(value);
      } else if (arg === "--data-root") {
        options.dataRoot = path.resolve(value);
      } else if (arg === "--timeout-ms") {
        options.timeoutMs = parseNonNegativeInteger(value, arg);
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

// 只读定位当前 daemon：优先尊重显式 URL/dataRoot，其次按目标项目匹配，最后才用最近 daemon。
function resolveRuntime(options) {
  const projectRoot = resolveProject(options.project);
  const records = discoverDaemonRecords();
  const explicitDataRoot = options.dataRoot
    ? records.find((record) => path.resolve(record.dataRoot) === path.resolve(options.dataRoot))
    : null;
  const matchedByProject = records.find(
    (record) => path.resolve(record.daemon?.projectRoot || "") === projectRoot,
  );
  const latest = [...records].sort((a, b) =>
    String(b.daemon?.lastReadyAt || b.daemon?.startedAt || "").localeCompare(
      String(a.daemon?.lastReadyAt || a.daemon?.startedAt || ""),
    ),
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

  return {
    dataRoot: options.dataRoot || record?.dataRoot || "",
    daemon: record?.daemon || null,
    daemonPath: record?.daemonPath || "",
    projectRoot,
    url: normalizeBaseUrl(options.url || record?.daemon?.dashboardUrl || record?.daemon?.url || ""),
  };
}

// 环境检查需要区分“真实 daemon 不可用”和“Codex 沙箱拦截 localhost API”。
async function requestJson(baseUrl, endpoint, timeoutMs) {
  const url = `${baseUrl}${endpoint}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      return {
        ok: false,
        status: response.status,
        endpoint,
        url,
        error: "response-json-parse-failed",
        text: text.slice(0, 500),
      };
    }
    return {
      ok: response.ok,
      status: response.status,
      endpoint,
      url,
      data,
      error: response.ok ? "" : `http-${response.status}`,
    };
  } catch (error) {
    return {
      ok: false,
      endpoint,
      url,
      data: null,
      error: classifyRequestError(error),
      message: error instanceof Error ? error.message : String(error),
      cause: error?.cause
        ? {
            code: error.cause.code,
            errno: error.cause.errno,
            syscall: error.cause.syscall,
            address: error.cause.address,
            port: error.cause.port,
          }
        : null,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function classifyRequestError(error) {
  const cause = error?.cause;
  const text = `${error?.message || ""} ${cause?.message || ""} ${cause?.code || ""}`;
  if (/EPERM|operation not permitted/i.test(text)) {
    return "codex-localhost-sandbox-blocked";
  }
  if (/ECONNREFUSED|connection refused/i.test(text)) {
    return "daemon-connection-refused";
  }
  if (/AbortError|aborted|timeout/i.test(text)) {
    return "api-timeout";
  }
  return "api-request-failed";
}

function processAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) {
    return null;
  }
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code === "EPERM" ? "unknown-eperm" : false;
  }
}

function extractJobs(data) {
  if (Array.isArray(data)) {
    return data;
  }
  for (const key of ["jobs", "items", "data", "results"]) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }
  if (Array.isArray(data?.jobs?.items)) {
    return data.jobs.items;
  }
  return [];
}

function summarizeTestMode(data) {
  const source = data?.data?.testMode || data?.data || data?.testMode || data || {};
  return {
    enabled: Boolean(source.enabled),
    bootstrapDims: source.bootstrapDims || source.bootstrapDimensions || source.dimensions?.bootstrap || null,
    rescanDims: source.rescanDims || source.rescanDimensions || source.dimensions?.rescan || null,
  };
}

function summarizeLatestJob(data) {
  const job = extractJobs(data)[0] || null;
  if (!job) {
    return null;
  }
  return {
    id: job.id || job.jobId || null,
    kind: job.kind || job.type || null,
    status: job.status || null,
    phase: job.phase || job.stage || job.progress?.phase || null,
    activeTask: job.activeTask || job.progress?.activeTask || null,
    updatedAt: job.updatedAt || job.lastUpdatedAt || null,
  };
}

// 输出给总控 / Test 快速判断：ready 才能继续具体测试，blocked 要给出下一步。
async function verifyEnvironment(options) {
  const runtime = resolveRuntime(options);
  const pid = Number(runtime.daemon?.pid);
  const result = {
    ok: false,
    verdict: "blocked",
    project: options.project,
    projectRoot: runtime.projectRoot,
    dashboardUrl: runtime.url || null,
    dataRoot: runtime.dataRoot || null,
    daemonPath: runtime.daemonPath || null,
    daemon: runtime.daemon
      ? {
          pid: Number.isInteger(pid) ? pid : null,
          processAlive: processAlive(pid),
          version: runtime.daemon.version || null,
          startedAt: runtime.daemon.startedAt || null,
          lastReadyAt: runtime.daemon.lastReadyAt || null,
          projectRoot: runtime.daemon.projectRoot || null,
        }
      : null,
    checks: {},
    failures: [],
    warnings: [],
    nextSteps: [],
  };

  if (!runtime.url) {
    result.failures.push("dashboard-url-unresolved");
    result.nextSteps.push("Run restart-alembic.mjs or pass --url from the current Dashboard/API.");
    return result;
  }

  const [health, testMode, jobs] = await Promise.all([
    requestJson(runtime.url, "/api/v1/health", options.timeoutMs),
    requestJson(runtime.url, "/api/v1/modules/test-mode", options.timeoutMs),
    requestJson(runtime.url, "/api/v1/jobs?kind=bootstrap&limit=1&compact=true", options.timeoutMs),
  ]);

  result.checks.health = {
    ok: health.ok,
    status: health.status || null,
    error: health.error || "",
    data: health.data || null,
  };
  result.checks.testMode = {
    ok: testMode.ok,
    status: testMode.status || null,
    error: testMode.error || "",
    summary: testMode.ok ? summarizeTestMode(testMode.data) : null,
  };
  result.checks.compactJobs = {
    ok: jobs.ok,
    status: jobs.status || null,
    error: jobs.error || "",
    latestJob: jobs.ok ? summarizeLatestJob(jobs.data) : null,
  };

  const blockedBySandbox = [health, testMode, jobs].some(
    (check) => check.error === "codex-localhost-sandbox-blocked",
  );
  if (blockedBySandbox) {
    result.verdict = "codex-localhost-sandbox-blocked";
    result.failures.push("localhost-api-blocked-by-codex-sandbox");
    result.nextSteps.push("Rerun this script with escalated Codex permissions, or use direct curl snapshots.");
    return result;
  }

  if (!health.ok) {
    result.failures.push(`health-${health.error || "failed"}`);
  }

  if (options.expectTestMode) {
    if (!testMode.ok) {
      result.failures.push(`test-mode-${testMode.error || "failed"}`);
    } else if (!summarizeTestMode(testMode.data).enabled) {
      result.failures.push("test-mode-disabled");
    }
  } else if (!testMode.ok) {
    result.warnings.push(`test-mode-check-unavailable:${testMode.error || "failed"}`);
  }

  if (!jobs.ok) {
    result.warnings.push(`compact-jobs-unavailable:${jobs.error || "failed"}`);
  }

  result.ok = result.failures.length === 0;
  result.verdict = result.ok ? (result.warnings.length ? "ready-with-warnings" : "ready") : "unavailable";
  if (result.ok) {
    result.nextSteps.push("Open the Dashboard in Codex in-app browser and run the assigned test route.");
  } else {
    result.nextSteps.push("Check daemon pid/state/logs, then restart with restart-alembic.mjs if the target is wrong.");
  }
  return result;
}

function printHuman(result) {
  console.log(`Verdict:   ${result.verdict}`);
  console.log(`Project:   ${result.project}`);
  console.log(`Dashboard: ${result.dashboardUrl || "unresolved"}`);
  console.log(`Data root: ${result.dataRoot || "unresolved"}`);
  if (result.daemon) {
    console.log(`Daemon:    pid=${result.daemon.pid ?? "unknown"} alive=${result.daemon.processAlive}`);
  }
  console.log(`Health:    ${result.checks.health?.ok ? "ok" : result.checks.health?.error || "missing"}`);
  const testMode = result.checks.testMode?.summary;
  console.log(
    `TestMode:  ${
      testMode ? `enabled=${testMode.enabled} bootstrap=${JSON.stringify(testMode.bootstrapDims)}` : result.checks.testMode?.error || "missing"
    }`,
  );
  const latestJob = result.checks.compactJobs?.latestJob;
  console.log(
    `LatestJob: ${latestJob ? `${latestJob.id || "unknown"} status=${latestJob.status || "unknown"}` : "none"}`,
  );
  if (result.failures.length) {
    console.log(`Failures:  ${result.failures.join(", ")}`);
  }
  if (result.warnings.length) {
    console.log(`Warnings:  ${result.warnings.join(", ")}`);
  }
  if (result.nextSteps.length) {
    console.log(`Next:      ${result.nextSteps.join(" ")}`);
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }

  const result = await verifyEnvironment(options);
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printHuman(result);
  }
  process.exitCode = result.ok ? 0 : result.verdict === "codex-localhost-sandbox-blocked" ? 2 : 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exitCode = 1;
});
