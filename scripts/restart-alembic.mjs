#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const DEFAULT_PROJECT = "BiliDili";
const DEFAULT_WAIT_MS = 10_000;
const DEFAULT_STOP_WAIT_MS = 5_000;
const DEFAULT_STATUS_TIMEOUT_MS = 3_000;

function usage() {
  return `Restart the local Alembic runtime and print the active Dashboard URL.

Usage:
  node scripts/restart-alembic.mjs [options]

Options:
  --project <name|path>       Project name under this workspace, or a project path.
                              Default: ${DEFAULT_PROJECT}
  --alembic <path>            Alembic repository path. Default: ./Alembic
  --wait <ms>                 Wait for daemon ready. Default: ${DEFAULT_WAIT_MS}
  --stop-wait <ms>            Wait for previous runtime stop. Default: ${DEFAULT_STOP_WAIT_MS}
  --status-timeout <ms>       Wait for post-start status probe. Default: ${DEFAULT_STATUS_TIMEOUT_MS}
  --no-status                 Skip the post-start bootstrap status probe.
  --dry-run                   Print the command without executing it.
  --json                      Print a JSON summary.
  -h, --help                  Show this help.

Examples:
  node scripts/restart-alembic.mjs
  node scripts/restart-alembic.mjs --project BiliDili
  node scripts/restart-alembic.mjs --project ../SomeProject --wait 15000
`;
}

function parseArgs(argv) {
  const options = {
    alembic: "Alembic",
    dryRun: false,
    json: false,
    project: DEFAULT_PROJECT,
    status: true,
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
    if (arg === "--no-status") {
      options.status = false;
      continue;
    }
    if (arg === "--project" || arg === "--alembic" || arg === "--wait" || arg === "--stop-wait" || arg === "--status-timeout") {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`${arg} requires a value`);
      }
      i += 1;
      if (arg === "--project") {
        options.project = value;
      } else if (arg === "--alembic") {
        options.alembic = value;
      } else if (arg === "--wait") {
        options.waitMs = parsePositiveInteger(value, arg);
      } else if (arg === "--stop-wait") {
        options.stopWaitMs = parsePositiveInteger(value, arg);
      } else if (arg === "--status-timeout") {
        options.statusTimeoutMs = parsePositiveInteger(value, arg);
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
  console.log(`Alembic:   ${summary.alembicRoot}`);
  console.log(`Ready:     ${summary.ready ? "yes" : "no"}`);
  console.log(`PID:       ${summary.pid ?? "unknown"}`);
  console.log(`Dashboard: ${summary.dashboardUrl ?? "unavailable"}`);
  console.log(`Duration:  ${Math.round(summary.durationMs / 100) / 10}s`);

  if (summary.bootstrapStatus) {
    const status = summary.bootstrapStatus.data?.status ?? summary.bootstrapStatus.data?.data?.status ?? "unknown";
    const activeJob =
      summary.bootstrapStatus.data?.activeJob?.id ??
      summary.bootstrapStatus.data?.data?.activeJob?.id ??
      "none";
    console.log(`Bootstrap: ${summary.bootstrapStatus.ok ? status : "probe failed"} (active job: ${activeJob})`);
  }

  if (summary.error) {
    console.log(`Error:     ${summary.error}`);
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

  const cliPath = path.join(alembicRoot, "dist/bin/cli.js");
  if (!existsSync(cliPath)) {
    throw new Error(`Alembic CLI is not built: ${cliPath}. Run npm run build in the Alembic repo first.`);
  }

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
      alembicRoot,
      command: process.execPath,
      args: commandArgs,
      projectRoot,
      workspaceRoot,
    };
    if (options.json) {
      console.log(JSON.stringify(dryRunSummary, null, 2));
    } else {
      console.log(`${process.execPath} ${commandArgs.map((arg) => JSON.stringify(arg)).join(" ")}`);
    }
    return;
  }

  const startedAt = Date.now();
  const child = spawnSync(process.execPath, commandArgs, {
    cwd: alembicRoot,
    encoding: "utf8",
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  const cliResult = parseJsonFromStdout(child.stdout);
  const dashboardUrl = dashboardUrlFromResult(cliResult);
  const apiBaseUrl = apiBaseUrlFromResult(cliResult, dashboardUrl);
  const ready = Boolean(cliResult?.ok ?? cliResult?.ready ?? child.status === 0);
  const summary = {
    ok: child.status === 0 && ready,
    alembicRoot,
    apiBaseUrl,
    dashboardUrl,
    durationMs: Date.now() - startedAt,
    exitCode: child.status,
    pid: pidFromResult(cliResult),
    projectRoot,
    ready,
    stderr: child.stderr.trim(),
    workspaceRoot,
  };

  if (summary.ok && options.status && apiBaseUrl) {
    const statusUrl = new URL("/api/v1/modules/bootstrap/status", apiBaseUrl).toString();
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
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
