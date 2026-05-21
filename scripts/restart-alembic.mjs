#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
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
  --no-dev-link               Skip Alembic npm run dev:link before restart.
  --no-runtime-write-check    Skip preflight write check for ~/.asd runtime state.
  --no-status                 Skip the post-start bootstrap status probe.
  --monitor                   After restart, run the read-only bootstrap monitor until Ctrl-C.
  --monitor-once              After restart, print one read-only bootstrap monitor snapshot.
  --monitor-interval <ms>     Polling interval for --monitor. Default: 20000
  --dry-run                   Print the command without executing it.
  --json                      Print a JSON summary.
  -h, --help                  Show this help.

Examples:
  node scripts/restart-alembic.mjs
  node scripts/restart-alembic.mjs --monitor
  node scripts/restart-alembic.mjs --project BiliDili
  node scripts/restart-alembic.mjs --project ../SomeProject --wait 15000
`;
}

function parseArgs(argv) {
  const options = {
    alembic: "Alembic",
    devLink: true,
    dryRun: false,
    json: false,
    monitor: false,
    monitorIntervalMs: 20_000,
    monitorOnce: false,
    project: DEFAULT_PROJECT,
    runtimeWriteCheck: true,
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
    if (arg === "--no-runtime-write-check") {
      options.runtimeWriteCheck = false;
      continue;
    }
    if (arg === "--project" || arg === "--alembic" || arg === "--wait" || arg === "--stop-wait" || arg === "--status-timeout" || arg === "--monitor-interval") {
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
      } else if (arg === "--monitor-interval") {
        options.monitorIntervalMs = parsePositiveInteger(value, arg);
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
  console.log(`Data root: ${summary.dataRoot ?? "unknown"}`);
  console.log(`Alembic:   ${summary.alembicRoot}`);
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
    env: process.env,
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

function runMonitor({ dashboardUrl, projectRoot, dataRoot, intervalMs, once }) {
  const monitorPath = path.join(workspaceRoot, "scripts", "monitor-alembic-bootstrap.mjs");
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
    env: process.env,
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
      alembicRoot,
      devLink: options.devLink ? runDevLink({ alembicRoot, dryRun: true }) : { skipped: true },
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
                path.join(workspaceRoot, "scripts", "monitor-alembic-bootstrap.mjs"),
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

  const devLink = options.devLink
    ? runDevLink({ alembicRoot, dryRun: false })
    : { ok: true, skipped: true };
  if (!devLink.ok) {
    const summary = {
      ok: false,
      alembicRoot,
      devLink,
      durationMs: devLink.durationMs ?? 0,
      error: firstString(devLink.stderr, devLink.stdout, "Alembic dev:link failed"),
      exitCode: devLink.exitCode ?? 1,
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
      intervalMs: options.monitorIntervalMs,
      once: options.monitorOnce && !options.monitor,
    });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
