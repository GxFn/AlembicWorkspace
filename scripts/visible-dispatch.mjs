#!/usr/bin/env node

import { spawn } from "node:child_process";
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  readSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

const rawArgs = process.argv.slice(2);
const command = rawArgs[0] && !rawArgs[0].startsWith("--") ? rawArgs[0] : "status";
const options = rawArgs[0] && !rawArgs[0].startsWith("--") ? rawArgs.slice(1) : rawArgs;
const workspaceRoot = path.resolve(getValue("--root", process.cwd()));
const stateDir = path.resolve(getValue("--state-dir", path.join(workspaceRoot, ".workspace-local/visible-dispatch")));
const write = hasFlag("--write");
const json = hasFlag("--json");

const dispatchWindows = new Set([
  "Alembic",
  "AlembicCore",
  "AlembicAgent",
  "AlembicDashboard",
  "AlembicPlugin",
  "AlembicTest",
]);
const registryWindows = new Set([...dispatchWindows, "AlembicWorkspace"]);
const sendEligibleStatuses = new Set(["待启动", "执行中"]);
const heartbeatRrule = "FREQ=MINUTELY;INTERVAL=1";
const totalControlArmOnlyTargets = new Set(["AlembicTest"]);
const finalSessionEventRe = /(?:turn[./_-]?completed|response[./_-]?completed|final_answer|agent_message)/i;
const runningSessionEventRe = /(?:tool_call|command|exec|turn[./_-]?started|response[./_-]?started|agent_reasoning|agent_progress)/i;
const sessionUuidRe = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.jsonl$/i;

const files = {
  state: path.join(stateDir, "state.json"),
  registry: path.join(stateDir, "window-registry.json"),
  queue: path.join(stateDir, "dispatch-queue.json"),
  runs: path.join(stateDir, "automation-runs.json"),
  groups: path.join(stateDir, "dispatch-groups.json"),
};

const helpText = `
Visible automation dispatch local state manager

Usage:
  node scripts/visible-dispatch.mjs status [--json]
  node scripts/visible-dispatch.mjs mode --enable|--disable --write [--reason <text>] [--no-keep-awake]
  node scripts/visible-dispatch.mjs register --window <name> --thread <threadId> [--cwd <cwd>] --write
  node scripts/visible-dispatch.mjs unregister --window <name> --write [--reason <text>]
  node scripts/visible-dispatch.mjs preflight [--from-plan|--task <taskId>|--group <id>|--window <name>] [--include-controller] [--json]
  node scripts/visible-dispatch.mjs enqueue --from-plan [--plan <path>] [--group <id>] [--return-policy controller-last|target-courier] --write
  node scripts/visible-dispatch.mjs arm --task <taskId> [--json]
  node scripts/visible-dispatch.mjs arm-batch --group <id> [--json]
  node scripts/visible-dispatch.mjs record-arm --task <taskId> --automation-id <id> --write [--lease-minutes <n>]
  node scripts/visible-dispatch.mjs record-return --group <id> --automation-id <id> --write
  node scripts/visible-dispatch.mjs record-stop --automation-id <id> [--task <taskId>] --write [--reason <text>]
  node scripts/visible-dispatch.mjs claim --window <name> --write [--lease-minutes <n>]
  node scripts/visible-dispatch.mjs complete --task <taskId> --write [--backfill <text>]
  node scripts/visible-dispatch.mjs block --task <taskId> --reason <text> --write
  node scripts/visible-dispatch.mjs finish --window <name> [--thread <threadId>] [--task <taskId>] --backfill <text>|--backfill-file <path> --write [--chain-next] [--json]
  node scripts/visible-dispatch.mjs group-status --group <id> [--json]
  node scripts/visible-dispatch.mjs tick [--write] [--json]
  node scripts/visible-dispatch.mjs controller-tick [--json]
  node scripts/visible-dispatch.mjs accept --task <taskId> [--verdict accepted|rejected] [--note <text>] [--allow-active-automation] --write
  node scripts/visible-dispatch.mjs cleanup [--write] [--json]
  node scripts/visible-dispatch.mjs prune-history [--write] [--json]

Safety:
  Runtime files live under .workspace-local/visible-dispatch by default and are
  ignored by git. The script does not call Codex automation APIs directly; arm
  and finish-chain only print payloads that a Codex window can pass to
  codex_app.automation_update. preflight, arm, and arm-batch verify that target
  window thread ids resolve to local Codex session files before payloads are
  used. mode=disabled is the close switch: it stops
  controller loops immediately, and any already-awake target window will record
  completion without receiving another finish-chain wake payload.
  On macOS, mode=enabled starts a local caffeinate keep-awake process unless
  --no-keep-awake or CODEX_VAD_KEEP_AWAKE=0 is set; mode=disabled stops the
  keep-awake process recorded in local runtime state.
`.trim();

function hasFlag(name) {
  return options.includes(name);
}

function getValue(name, fallback = null) {
  const eq = options.find((arg) => arg.startsWith(`${name}=`));
  if (eq) {
    return eq.slice(name.length + 1);
  }
  const index = options.indexOf(name);
  if (index >= 0 && options[index + 1] && !options[index + 1].startsWith("--")) {
    return options[index + 1];
  }
  return fallback;
}

function getAllValues(name) {
  const values = [];
  for (let index = 0; index < options.length; index += 1) {
    const option = options[index];
    if (option === name && options[index + 1] && !options[index + 1].startsWith("--")) {
      values.push(options[index + 1]);
      index += 1;
    } else if (option.startsWith(`${name}=`)) {
      values.push(option.slice(name.length + 1));
    }
  }
  return values;
}

function nowIso() {
  return new Date().toISOString();
}

function fail(message) {
  if (json) {
    console.log(JSON.stringify({ ok: false, error: message }, null, 2));
  } else {
    console.error(message);
  }
  process.exit(1);
}

function ensureWorkspacePath(file, label) {
  const relative = path.relative(workspaceRoot, file);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    fail(`${label} must stay inside workspace: ${file}`);
  }
}

function readJson(file, fallback) {
  if (!existsSync(file)) {
    return structuredClone(fallback);
  }
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (err) {
    fail(`Invalid JSON in ${path.relative(workspaceRoot, file)}: ${err.message}`);
  }
}

function atomicWriteJson(file, value) {
  ensureWorkspacePath(file, "visible dispatch state");
  mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.tmp-${process.pid}-${Date.now()}`;
  try {
    writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`);
    renameSync(temp, file);
  } catch (err) {
    if (existsSync(temp)) {
      unlinkSync(temp);
    }
    throw err;
  }
}

function defaultState() {
  return {
    version: 1,
    mode: "disabled",
    loopEnabled: false,
    updatedAt: null,
    stopRequestedAt: null,
    disablePolicy: "stop-next-chain",
    reason: "",
    keepAwake: defaultKeepAwake(),
  };
}

function defaultKeepAwake() {
  return {
    enabled: true,
    active: false,
    platform: process.platform,
    pid: 0,
    command: "caffeinate",
    args: ["-dimsu"],
    startedAt: null,
    stoppedAt: null,
    stopReason: "",
    lastError: "",
  };
}

function defaultRegistry() {
  return { version: 1, windows: [] };
}

function defaultQueue() {
  return { version: 1, tasks: [] };
}

function defaultRuns() {
  return { version: 1, runs: [] };
}

function defaultGroups() {
  return { version: 1, groups: [] };
}

function readAll() {
  return {
    state: readJson(files.state, defaultState()),
    registry: readJson(files.registry, defaultRegistry()),
    queue: readJson(files.queue, defaultQueue()),
    runs: readJson(files.runs, defaultRuns()),
    groups: readJson(files.groups, defaultGroups()),
  };
}

function output(value, text) {
  if (json) {
    console.log(JSON.stringify(value, null, 2));
  } else {
    console.log(text ?? JSON.stringify(value, null, 2));
  }
}

function relativeToWorkspace(file) {
  return path.relative(workspaceRoot, file).replaceAll(path.sep, "/");
}

function validateWindow(windowName, { allowController = false } = {}) {
  const allowed = allowController ? registryWindows : dispatchWindows;
  if (!allowed.has(windowName)) {
    fail(`Unsupported visible dispatch window: ${windowName}. Allowed: ${[...allowed].join(", ")}`);
  }
}

function validateThreadId(threadId) {
  const error = threadIdValidationError(threadId);
  if (error) {
    fail(error);
  }
}

function threadIdValidationError(threadId) {
  const value = String(threadId ?? "").trim();
  const normalized = value.toLowerCase();
  const placeholderPatterns = [
    /^current[-_\s]*codex[-_\s]*thread$/,
    /^current[-_\s]*thread([-_\s]*id)?$/,
    /^thread[-_\s]*id$/,
    /^unknown$/,
    /^placeholder$/,
    /^todo$/,
    /^tbd$/,
    /^<.*>$/,
    /当前.*线程/,
  ];
  if (!value || placeholderPatterns.some((pattern) => pattern.test(normalized))) {
    return `Invalid visible dispatch thread id placeholder: ${threadId}`;
  }
  return "";
}

function codexHome() {
  return path.resolve(getValue("--codex-home", process.env.CODEX_HOME || path.join(os.homedir(), ".codex")));
}

function codexSessionsRoot() {
  return path.resolve(getValue("--codex-sessions-root", path.join(codexHome(), "sessions")));
}

function listCodexSessionFiles(root) {
  const files = [];
  walkCodexSessions(root, files);
  files.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return files;
}

function walkCodexSessions(dir, files) {
  let entries = [];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkCodexSessions(fullPath, files);
    } else if (entry.isFile() && entry.name.endsWith(".jsonl")) {
      try {
        const stat = statSync(fullPath);
        files.push({ path: fullPath, mtimeMs: stat.mtimeMs });
      } catch {
        // Ignore sessions that disappear while scanning.
      }
    }
  }
}

function readFirstLine(filePath, { maxBytes = 2 * 1024 * 1024 } = {}) {
  const fd = openSync(filePath, "r");
  try {
    const chunks = [];
    let offset = 0;
    let total = 0;
    const chunkSize = 128 * 1024;
    while (total < maxBytes) {
      const buffer = Buffer.alloc(chunkSize);
      const bytesRead = readSync(fd, buffer, 0, buffer.length, offset);
      if (!bytesRead) break;
      const chunk = buffer.subarray(0, bytesRead);
      const newline = chunk.indexOf(10);
      if (newline >= 0) {
        chunks.push(chunk.subarray(0, newline));
        break;
      }
      chunks.push(chunk);
      offset += bytesRead;
      total += bytesRead;
    }
    return Buffer.concat(chunks).toString("utf8").replace(/\r$/, "");
  } finally {
    closeSync(fd);
  }
}

function readLastJsonRecord(filePath) {
  try {
    const stat = statSync(filePath);
    const length = Math.min(stat.size, 256 * 1024);
    const fd = openSync(filePath, "r");
    try {
      const buffer = Buffer.alloc(length);
      readSync(fd, buffer, 0, length, stat.size - length);
      const lines = buffer.toString("utf8").split(/\r?\n/).filter(Boolean).reverse();
      for (const line of lines) {
        try {
          return JSON.parse(line);
        } catch {
          // Try the previous line.
        }
      }
      return null;
    } finally {
      closeSync(fd);
    }
  } catch {
    return null;
  }
}

function idFromSessionPath(filePath) {
  return path.basename(filePath).match(sessionUuidRe)?.[1] || "";
}

function readSessionMeta(filePath) {
  const fallbackId = idFromSessionPath(filePath);
  try {
    const firstLine = readFirstLine(filePath);
    const record = JSON.parse(firstLine);
    if (record.type !== "session_meta") {
      return fallbackId ? { threadId: fallbackId, cwd: "", name: "", source: "path" } : null;
    }
    const payload = record.payload || {};
    const threadId = payload.id || fallbackId;
    if (!threadId) return null;
    return {
      threadId,
      cwd: payload.cwd || "",
      name: payload.name || payload.title || "",
      source: payload.source || "session_meta",
    };
  } catch {
    return fallbackId ? { threadId: fallbackId, cwd: "", name: "", source: "path" } : null;
  }
}

function statusFromSessionRecord(record) {
  if (!record || record.type === "session_meta") return "";
  const payload = record.payload || {};
  const item = record.item || payload.item || payload || {};
  const typeText = [
    record.type,
    record.method,
    payload.type,
    payload.phase,
    item.type,
    item.phase,
    item.status,
  ].filter(Boolean).join(" ");
  const text = `${typeText} ${JSON.stringify({
    message: payload.message || item.message || "",
    role: item.role || payload.role || "",
  })}`;
  if (/final_answer/i.test(text)) return "idle";
  if (/turn[./_-]?completed|response[./_-]?completed/i.test(text)) return "idle";
  if (item.type === "agent_message" || item.type === "message") {
    if (item.phase === "final_answer" || payload.phase === "final_answer") return "idle";
  }
  if (runningSessionEventRe.test(text) && !finalSessionEventRe.test(text)) return "running";
  return "";
}

function detectSessionStatus(sessionPath) {
  if (!sessionPath) return { status: "unknown", reason: "missing session path", lastEventAtMs: 0 };
  let stat;
  try {
    stat = statSync(sessionPath);
  } catch {
    return { status: "unknown", reason: "session file unavailable", lastEventAtMs: 0 };
  }
  const status = statusFromSessionRecord(readLastJsonRecord(sessionPath));
  if (status) {
    return { status, reason: `last event ${status}`, lastEventAtMs: stat.mtimeMs };
  }
  const idleDebounceMs = parsePositiveInteger(getValue("--idle-debounce-ms", "3000"), "--idle-debounce-ms");
  if (Date.now() - stat.mtimeMs < idleDebounceMs) {
    return { status: "running", reason: "recent session write", lastEventAtMs: stat.mtimeMs };
  }
  return { status: "idle", reason: "session file stable", lastEventAtMs: stat.mtimeMs };
}

function findCodexSessionById(threadId) {
  const target = String(threadId || "").trim().toLowerCase();
  if (!target) return null;
  const sessionsRoot = codexSessionsRoot();
  for (const file of listCodexSessionFiles(sessionsRoot)) {
    const meta = readSessionMeta(file.path);
    if (!meta?.threadId) continue;
    if (String(meta.threadId).toLowerCase() !== target) continue;
    const status = detectSessionStatus(file.path);
    return {
      ...meta,
      threadPath: file.path,
      updatedAtMs: file.mtimeMs,
      sessionStatus: status.status,
      sessionStatusReason: status.reason,
      lastEventAtMs: status.lastEventAtMs,
    };
  }
  return null;
}

function cwdMatchesSession(registryCwd, sessionCwd) {
  if (!registryCwd || !sessionCwd) return true;
  try {
    return path.resolve(registryCwd) === path.resolve(sessionCwd);
  } catch {
    return registryCwd === sessionCwd;
  }
}

function deliveryTargetReadiness(entry, { requireIdle = false } = {}) {
  if (!entry) {
    return { ready: false, reason: "No active window registry entry is available." };
  }
  const threadError = threadIdValidationError(entry.threadId);
  if (threadError) {
    return { ready: false, reason: threadError };
  }
  const session = findCodexSessionById(entry.threadId);
  if (!session) {
    return {
      ready: false,
      reason: `No local Codex session was found for ${entry.windowName}; register the real target thread before arming automation.`,
    };
  }
  if (requireIdle && session.sessionStatus !== "idle") {
    return {
      ready: false,
      reason: `${entry.windowName} session is ${session.sessionStatus}; wait for the target Codex window to become idle.`,
      session,
    };
  }
  const warnings = [];
  if (session.sessionStatus === "running") {
    warnings.push(`${entry.windowName} session appears running; automation may wait behind active work.`);
  }
  if (!cwdMatchesSession(entry.cwd, session.cwd)) {
    warnings.push(`${entry.windowName} registry cwd differs from the resolved Codex session cwd.`);
  }
  return { ready: true, reason: "", session, warnings };
}

function parsePositiveInteger(value, label) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    fail(`${label} must be a positive integer.`);
  }
  return parsed;
}

function splitMarkdownRow(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) {
    return [];
  }
  return trimmed
    .slice(1, -1)
    .split("|")
    .map((cell) => cell.trim());
}

function sectionContent(content, heading) {
  const start = content.indexOf(`## ${heading}`);
  if (start < 0) {
    return "";
  }
  const rest = content.slice(start);
  const next = rest.slice(1).search(/\n## /);
  return next >= 0 ? rest.slice(0, next + 1) : rest;
}

function extractFirstLinkTarget(markdown) {
  const match = markdown.match(/\[[^\]]+]\(([^)]+)\)/);
  return match ? match[1] : null;
}

function currentPlanPathFromIndex() {
  const indexPath = path.join(workspaceRoot, "docs/workspace/index.md");
  if (!existsSync(indexPath)) {
    fail("docs/workspace/index.md is missing; pass --plan explicitly.");
  }
  const content = readFileSync(indexPath, "utf8");
  const section = sectionContent(content, "当前总控入口");
  const rows = section
    .split("\n")
    .map(splitMarkdownRow)
    .filter((row) => row.length > 0);
  const planRow = rows.find((row) => row[0] === "当前计划");
  const target = extractFirstLinkTarget(planRow?.[1] ?? "");
  if (!target) {
    fail("Could not resolve current plan from docs/workspace/index.md.");
  }
  return path.resolve(path.dirname(indexPath), target.split("#")[0]);
}

function parseDispatchRows(planContent) {
  const dispatchSection = sectionContent(planContent, "窗口分派") || sectionContent(planContent, "窗口覆盖状态");
  const rows = [];
  for (const line of dispatchSection.split("\n")) {
    const cells = splitMarkdownRow(line);
    if (
      cells.length < 2 ||
      cells[0] === "窗口" ||
      cells[0] === "窗口 / 状态" ||
      cells[0].startsWith("---")
    ) {
      continue;
    }
    const window = cells[0].match(/`([^`]+)`/)?.[1] ?? cells[0].replace(/<br\s*\/?>/gi, " ").trim();
    const status = ["待启动", "执行中", "待验收", "阻塞", "已完成", "暂停", "观察中", "无任务"].find((candidate) =>
      cells[0].includes(candidate),
    ) ?? "";
    rows.push({ window, status, task: cells[1] });
  }
  return rows;
}

function taskIdForPlanWindow(planPath, windowName) {
  return `${path.basename(planPath, ".md")}__${windowName}`;
}

function sanitizeGroupId(value) {
  const groupId = String(value ?? "").trim();
  if (!groupId) {
    fail("Dispatch group id is required.");
  }
  if (!/^[a-zA-Z0-9._:-]+$/.test(groupId)) {
    fail(`Invalid dispatch group id: ${groupId}. Use letters, numbers, dot, colon, underscore, or dash.`);
  }
  return groupId;
}

function validateReturnPolicy(value) {
  const policy = String(value ?? "").trim();
  if (!["controller-last", "target-courier"].includes(policy)) {
    fail("--return-policy must be controller-last or target-courier.");
  }
  return policy;
}

function parseStatusLine(content) {
  return content.match(/^状态：(.+)$/m)?.[1]?.trim() ?? "";
}

function parseMarkdownTable(section) {
  const rows = section
    .split("\n")
    .map(splitMarkdownRow)
    .filter((row) => row.length > 0);
  const header = rows.find((row) => row.some((cell) => cell === "ID" || cell === "状态" || cell === "优先级"));
  if (!header) {
    return [];
  }
  const headerLineIndex = rows.indexOf(header);
  return rows
    .slice(headerLineIndex + 1)
    .filter((row) => !row.every((cell) => /^-+$/.test(cell)))
    .map((row) =>
      Object.fromEntries(header.map((key, index) => [key, row[index] ?? ""])),
    );
}

function stripMarkdown(value) {
  return String(value ?? "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)]\(([^)]+)\)/g, "$1")
    .replace(/<br\s*\/?>/gi, " ")
    .trim();
}

function priorityRank(priority) {
  const match = stripMarkdown(priority).match(/^P(\d+)/i);
  return match ? Number.parseInt(match[1], 10) : 99;
}

function isTodoCandidate(row) {
  const status = stripMarkdown(row["状态"]);
  const owner = stripMarkdown(row["归属"]);
  const windowName = stripMarkdown(row["推荐窗口"]);
  if (!row["ID"] || /已完成|已取消|取消|不做|归档|观察中/.test(status)) {
    return false;
  }
  if (/待定/.test(owner) || /待定/.test(windowName)) {
    return false;
  }
  return true;
}

function todoCandidatesFromBoard(limit = 5) {
  const todoPath = path.join(workspaceRoot, "docs/workspace/current/global-todo-board.md");
  if (!existsSync(todoPath)) {
    return [];
  }
  const content = readFileSync(todoPath, "utf8");
  const section = sectionContent(content, "全局 TODO");
  return parseMarkdownTable(section)
    .filter(isTodoCandidate)
    .sort((a, b) => {
      const byPriority = priorityRank(a["优先级"]) - priorityRank(b["优先级"]);
      if (byPriority !== 0) {
        return byPriority;
      }
      return stripMarkdown(a["ID"]).localeCompare(stripMarkdown(b["ID"]));
    })
    .slice(0, limit)
    .map((row) => ({
      id: stripMarkdown(row["ID"]),
      status: stripMarkdown(row["状态"]),
      type: stripMarkdown(row["类型"]),
      priority: stripMarkdown(row["优先级"]),
      owner: stripMarkdown(row["归属"]),
      target: stripMarkdown(row["事项 / 目标"]),
      affectsDispatch: stripMarkdown(row["影响复测 / 派发"]),
      dependency: stripMarkdown(row["依赖 / 触发"]),
      recommendedWindow: stripMarkdown(row["推荐窗口"]),
      mountedAt: stripMarkdown(row["当前挂载"]),
    }));
}

function keepAwakeCommand() {
  return getValue("--keep-awake-command", process.env.CODEX_VAD_KEEP_AWAKE_COMMAND || "caffeinate");
}

function keepAwakeArgs() {
  const explicitArgs = getAllValues("--keep-awake-arg");
  if (explicitArgs.length > 0) {
    return explicitArgs;
  }
  const jsonArgs = process.env.CODEX_VAD_KEEP_AWAKE_ARGS_JSON;
  if (jsonArgs) {
    try {
      const parsed = JSON.parse(jsonArgs);
      if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) {
        return parsed;
      }
    } catch {
      return ["-dimsu"];
    }
  }
  return ["-dimsu"];
}

function keepAwakeEnabled() {
  if (hasFlag("--no-keep-awake")) {
    return false;
  }
  return process.env.CODEX_VAD_KEEP_AWAKE !== "0";
}

function normalizeKeepAwakeState(state) {
  const current = state.keepAwake && typeof state.keepAwake === "object" ? state.keepAwake : {};
  return {
    ...defaultKeepAwake(),
    ...current,
    enabled: keepAwakeEnabled(),
    platform: process.platform,
    command: current.command || keepAwakeCommand(),
    args: Array.isArray(current.args) && current.args.every((item) => typeof item === "string")
      ? current.args
      : keepAwakeArgs(),
  };
}

function isPidRunning(pid) {
  const numericPid = Number(pid);
  if (!Number.isInteger(numericPid) || numericPid <= 0) {
    return false;
  }
  try {
    process.kill(numericPid, 0);
    return true;
  } catch (error) {
    return error.code === "EPERM";
  }
}

function keepAwakeStatus(state, extra = {}) {
  const keepAwake = normalizeKeepAwakeState(state);
  return {
    ...keepAwake,
    active: isPidRunning(keepAwake.pid),
    ...extra,
  };
}

function startKeepAwake(state, { dryRun = false } = {}) {
  const status = keepAwakeStatus(state, {
    command: keepAwakeCommand(),
    args: keepAwakeArgs(),
  });
  if (!status.enabled) {
    return {
      ...status,
      message: status.active ? "disabled; already running" : "disabled",
    };
  }
  if (status.platform !== "darwin") {
    return { ...status, active: false, pid: 0, message: "macOS only" };
  }
  if (status.active) {
    return { ...status, message: "already running" };
  }
  if (dryRun) {
    return { ...status, active: false, pid: 0, message: "would start" };
  }
  try {
    const child = spawn(status.command, status.args, {
      stdio: "ignore",
      detached: false,
    });
    child.unref?.();
    if (!child.pid) {
      return {
        ...status,
        active: false,
        pid: 0,
        lastError: `Failed to start ${status.command}: no child pid returned.`,
        message: "failed",
      };
    }
    return {
      ...status,
      active: true,
      pid: child.pid || 0,
      startedAt: nowIso(),
      stoppedAt: null,
      stopReason: "",
      lastError: "",
      message: "started",
    };
  } catch (error) {
    return {
      ...status,
      active: false,
      pid: 0,
      lastError: error.message,
      message: "failed",
    };
  }
}

function stopKeepAwake(state, { dryRun = false, reason = "" } = {}) {
  const status = keepAwakeStatus(state);
  if (!status.active) {
    return {
      ...status,
      active: false,
      pid: 0,
      stoppedAt: status.stoppedAt || nowIso(),
      stopReason: reason,
      message: status.pid ? "not running" : "not started",
    };
  }
  if (dryRun) {
    return { ...status, message: "would stop" };
  }
  try {
    process.kill(status.pid, "SIGTERM");
    return {
      ...status,
      active: false,
      pid: 0,
      stoppedAt: nowIso(),
      stopReason: reason,
      lastError: "",
      message: "stopped",
    };
  } catch (error) {
    return {
      ...status,
      active: isPidRunning(status.pid),
      lastError: error.message,
      message: "stop failed",
    };
  }
}

function commandStatus() {
  const { state, registry, queue, runs, groups } = readAll();
  const counts = queue.tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] ?? 0) + 1;
    return acc;
  }, {});
  const keepAwake = keepAwakeStatus(state);
  output(
    {
      ok: true,
      stateDir: relativeToWorkspace(stateDir),
      mode: state.mode,
      loopEnabled: Boolean(state.loopEnabled),
      registeredWindows: registry.windows.length,
      taskCounts: counts,
      automationRuns: runs.runs.length,
      dispatchGroups: groups.groups.length,
      disablePolicy: state.disablePolicy ?? "stop-next-chain",
      keepAwake,
    },
    [
      "Visible dispatch status",
      `State dir: ${relativeToWorkspace(stateDir)}`,
      `Mode: ${state.mode}`,
      `Loop enabled: ${Boolean(state.loopEnabled)}`,
      `Disable policy: ${state.disablePolicy ?? "stop-next-chain"}`,
      `Keep awake: ${keepAwake.active ? `active pid=${keepAwake.pid}` : keepAwake.message || "inactive"}`,
      `Registered windows: ${registry.windows.length}`,
      `Tasks: ${Object.entries(counts).map(([key, value]) => `${key}=${value}`).join(", ") || "none"}`,
      `Automation runs: ${runs.runs.length}`,
      `Dispatch groups: ${groups.groups.length}`,
    ].join("\n"),
  );
}

function redactThreadEntry(entry) {
  return {
    ...entry,
    threadId: entry.threadId ? "<local-only>" : "",
  };
}

function redactTaskForOutput(task) {
  if (!task || typeof task !== "object") {
    return task;
  }
  return {
    ...task,
    completedByThreadId: task.completedByThreadId ? "<local-only>" : task.completedByThreadId,
  };
}

function groupSummariesById(groups, queue) {
  return new Map(groups.groups.map((group) => [group.groupId, summarizeGroup(group, queue)]));
}

function controllerDecisionFromQueue(state, registry, queue, groups, currentPlanPath) {
  const observedAt = nowIso();
  const nowMs = Date.parse(observedAt);
  const activeWindows = activeWindowSet(registry);
  const groupSummaries = groupSummariesById(groups, queue);
  const tasks = queue.tasks.map((task) => ({
    taskId: task.taskId,
    targetWindow: task.targetWindow,
    status: task.status,
    controlDoc: task.controlDoc ?? null,
    leaseUntil: task.leaseUntil ?? null,
    armLeaseUntil: task.armLeaseUntil ?? null,
    automationId: task.automationId ?? null,
    hasBackfill: hasBackfill(task),
    groupId: task.groupId ?? null,
    ...classifyTaskForTick(task, state, activeWindows, nowMs, groupSummaries),
  }));
  const historicResolvedTasks = tasks.filter(
    (task) =>
      task.controlDoc &&
      task.controlDoc !== currentPlanPath &&
      ["accepted", "rejected", "blocked"].includes(task.status),
  );
  const actionableTasks = tasks.filter((task) => !historicResolvedTasks.includes(task));
  if (actionableTasks.some((task) => task.nextAction === "acceptanceReview")) {
    return {
      topAction: "review",
      nextAction: "acceptanceReview",
      message: "Completed task has backfill evidence; total control should review before continuing.",
      ignoredHistoricTasks: historicResolvedTasks,
      tasks,
    };
  }
  if (actionableTasks.some((task) => task.waitState === "attention" || task.waitState === "blocked")) {
    return {
      topAction: "attention",
      nextAction: "resolveQueue",
      message: "Dispatch queue has a blocked or attention-needed task; resolve it before selecting more work.",
      ignoredHistoricTasks: historicResolvedTasks,
      tasks,
    };
  }
  if (actionableTasks.some((task) => task.waitState === "waiting")) {
    return {
      topAction: "wait",
      nextAction: "waitForBackfill",
      message: "Dispatch queue has active work; wait for claim or backfill.",
      ignoredHistoricTasks: historicResolvedTasks,
      tasks,
    };
  }
  if (actionableTasks.some((task) => task.nextAction === "arm")) {
    const task = actionableTasks.find((item) => item.nextAction === "arm");
    return {
      topAction: "arm",
      nextAction: "prepareArmPayload",
      message: "Queued task is ready for an automation payload.",
      suggestedCommand: `node scripts/visible-dispatch.mjs arm --task ${task.taskId} --json`,
      ignoredHistoricTasks: historicResolvedTasks,
      tasks,
    };
  }
  return { topAction: null, nextAction: null, message: "", ignoredHistoricTasks: historicResolvedTasks, tasks };
}

function commandControllerTick() {
  const { state, registry, queue, groups } = readAll();
  const planPath = currentPlanPathFromIndex();
  const planContent = existsSync(planPath) ? readFileSync(planPath, "utf8") : "";
  const currentPlan = {
    path: relativeToWorkspace(planPath),
    status: parseStatusLine(planContent),
  };
  const dispatchRows = parseDispatchRows(planContent);
  const sendEligibleRows = dispatchRows.filter((row) => sendEligibleStatuses.has(row.status));
  const existingTaskIds = new Set(queue.tasks.map((task) => task.taskId));
  const missingSendEligibleRows = sendEligibleRows.filter(
    (row) => !existingTaskIds.has(taskIdForPlanWindow(planPath, row.window)),
  );
  const unsupportedRows = sendEligibleRows.filter((row) => !dispatchWindows.has(row.window));
  const queueDecision = controllerDecisionFromQueue(state, registry, queue, groups, currentPlan.path);
  const todoCandidates = todoCandidatesFromBoard();

  let decision;
  if (state.mode !== "enabled") {
    decision = {
      topAction: "stopped",
      nextAction: "modeDisabled",
      message: "Automation mode is disabled; do not enqueue, arm, or select TODO work.",
    };
  } else if (unsupportedRows.length > 0) {
    decision = {
      topAction: "attention",
      nextAction: "fixDispatchCoverage",
      message: `Current plan has send-eligible unsupported windows: ${unsupportedRows.map((row) => row.window).join(", ")}.`,
    };
  } else if (queueDecision.topAction) {
    decision = queueDecision;
  } else if (missingSendEligibleRows.length > 0) {
    decision = {
      topAction: "enqueue",
      nextAction: "enqueueCurrentPlan",
      message: "Current plan has send-eligible Alembic windows without queue tasks; enqueue from plan before selecting TODO work.",
      suggestedCommand: "node scripts/visible-dispatch.mjs enqueue --from-plan --write",
    };
  } else if (sendEligibleRows.length > 0) {
    decision = {
      topAction: "decision",
      nextAction: "closeOrRefreshCurrentPlan",
      message: "Current plan send-eligible rows already have queue tasks; close, refresh, or replan before selecting TODO work.",
    };
  } else if (/阻塞|待裁决|暂停|待确认/.test(currentPlan.status)) {
    decision = {
      topAction: "decision",
      nextAction: "resolveCurrentPlan",
      message: "Current plan is blocked or waiting for a decision; total control must resolve it before choosing a new TODO.",
    };
  } else if (todoCandidates.length > 0) {
    decision = {
      topAction: "mainlineCandidate",
      nextAction: "reviewTodoCandidate",
      message: "No send-eligible current-plan task exists; review the top TODO candidate without bypassing confirmation gates.",
      candidate: todoCandidates[0],
    };
  } else {
    decision = {
      topAction: "idle",
      nextAction: "none",
      message: "No send-eligible current-plan task and no eligible TODO candidate were found.",
    };
  }

  output(
    {
      ok: true,
      observedAt: nowIso(),
      mode: state.mode,
      loopEnabled: Boolean(state.loopEnabled),
      currentPlan,
      sendEligibleWindows: sendEligibleRows.map((row) => ({
        window: row.window,
        status: row.status,
        task: row.task,
        taskId: taskIdForPlanWindow(planPath, row.window),
      })),
      missingSendEligibleWindows: missingSendEligibleRows.map((row) => ({
        window: row.window,
        status: row.status,
        task: row.task,
        taskId: taskIdForPlanWindow(planPath, row.window),
      })),
      queueTaskCount: queue.tasks.length,
      queueDecision,
      todoCandidates,
      ...decision,
    },
    [
      "Visible dispatch controller tick",
      `Mode: ${state.mode}`,
      `Current plan: ${currentPlan.path} (${currentPlan.status || "unknown"})`,
      `Top action: ${decision.topAction}`,
      `Next action: ${decision.nextAction}`,
      decision.message,
    ].join("\n"),
  );
}

function commandMode() {
  const enable = hasFlag("--enable");
  const disable = hasFlag("--disable");
  if (enable === disable) {
    fail("Pass exactly one of --enable or --disable.");
  }
  const state = readJson(files.state, defaultState());
  const reason = getValue("--reason", "");
  const keepAwake = enable
    ? startKeepAwake(state, { dryRun: !write })
    : stopKeepAwake(state, { dryRun: !write, reason });
  const next = {
    ...state,
    mode: enable ? "enabled" : "disabled",
    loopEnabled: enable,
    updatedAt: nowIso(),
    stopRequestedAt: disable ? nowIso() : null,
    disablePolicy: enable ? "" : "stop-next-chain",
    reason,
    keepAwake,
  };
  if (write) {
    atomicWriteJson(files.state, next);
  }
  output(
    {
      ok: true,
      wrote: write,
      state: next,
      keepAwake,
      guidance: enable
        ? "Automation mode is enabled for eligible current-plan dispatch only. Manual Design discussion, total-control planning, or single-window development still requires explicit total-control judgment and must not be treated as unattended work."
        : "Automation mode is disabled. Already-awake target windows may finish once, but finish-chain must not produce another heartbeat payload.",
    },
    [
      `${write ? "Updated" : "Would update"} visible dispatch mode to ${next.mode}.`,
      `Keep awake: ${keepAwake.active ? `active pid=${keepAwake.pid}` : keepAwake.message || "inactive"}`,
      enable
        ? "Manual Design discussion, total-control discussion, and single-window development remain manual unless a current plan explicitly dispatches them."
        : "Finish-chain is closed for the next jump; keep-awake has been stopped when it was owned by this runtime.",
    ].join("\n"),
  );
}

function commandRegister() {
  const windowName = getValue("--window");
  const threadId = getValue("--thread");
  if (!windowName || !threadId) {
    fail("register requires --window and --thread.");
  }
  validateWindow(windowName, { allowController: true });
  validateThreadId(threadId);
  const registry = readJson(files.registry, defaultRegistry());
  const entry = {
    windowName,
    threadId: threadId.trim(),
    cwd: getValue("--cwd", ""),
    role: getValue("--role", windowName),
    status: "active",
    source: getValue("--source", "manual"),
    lastSeenAt: nowIso(),
  };
  registry.windows = registry.windows.filter((item) => item.windowName !== windowName);
  registry.windows.push(entry);
  registry.updatedAt = nowIso();
  if (write) {
    atomicWriteJson(files.registry, registry);
  }
  output(
    { ok: true, wrote: write, entry: redactThreadEntry(entry), storedThreadId: write ? "local-only" : "dry-run" },
    `${write ? "Registered" : "Would register"} ${windowName} for visible dispatch.`,
  );
}

function commandUnregister() {
  const windowName = getValue("--window");
  if (!windowName) {
    fail("unregister requires --window.");
  }
  validateWindow(windowName, { allowController: true });
  const registry = readJson(files.registry, defaultRegistry());
  const before = registry.windows.length;
  registry.windows = registry.windows.filter((item) => item.windowName !== windowName);
  registry.updatedAt = nowIso();
  registry.unregisterReason = getValue("--reason", "");
  const removed = before - registry.windows.length;
  if (write) {
    atomicWriteJson(files.registry, registry);
  }
  output(
    { ok: true, wrote: write, windowName, removed },
    `${write ? "Unregistered" : "Would unregister"} ${windowName} (${removed} entr${removed === 1 ? "y" : "ies"}).`,
  );
}

function addRequiredWindow(required, windowName, reason) {
  validateWindow(windowName, { allowController: true });
  const existing = required.get(windowName);
  if (existing) {
    existing.reasons.push(reason);
    return;
  }
  required.set(windowName, { windowName, reasons: [reason] });
}

function requiredWindowsForPreflight(queue, groups) {
  const required = new Map();
  for (const windowName of getAllValues("--window")) {
    addRequiredWindow(required, windowName, "--window");
  }

  const taskId = getValue("--task");
  if (taskId) {
    const task = queue.tasks.find((item) => item.taskId === taskId);
    if (!task) fail(`Task not found: ${taskId}`);
    addRequiredWindow(required, task.targetWindow, `task:${taskId}`);
  }

  const groupId = getValue("--group");
  if (groupId) {
    const normalizedGroupId = sanitizeGroupId(groupId);
    const group = groups.groups.find((item) => item.groupId === normalizedGroupId);
    if (!group) fail(`Dispatch group not found: ${normalizedGroupId}`);
    const taskIds = new Set(Array.isArray(group.taskIds) ? group.taskIds : []);
    const groupTasks = queue.tasks.filter((task) => task.groupId === normalizedGroupId || taskIds.has(task.taskId));
    for (const task of groupTasks) {
      addRequiredWindow(required, task.targetWindow, `group:${normalizedGroupId}`);
    }
    if (group.returnPolicy === "controller-last" || hasFlag("--include-controller")) {
      addRequiredWindow(required, "AlembicWorkspace", `group-controller:${normalizedGroupId}`);
    }
  }

  if (hasFlag("--from-plan")) {
    const explicitPlan = getValue("--plan");
    const planPath = explicitPlan ? path.resolve(workspaceRoot, explicitPlan) : currentPlanPathFromIndex();
    if (!existsSync(planPath)) {
      fail(`Plan not found: ${relativeToWorkspace(planPath)}`);
    }
    const rows = parseDispatchRows(readFileSync(planPath, "utf8")).filter((row) => sendEligibleStatuses.has(row.status));
    for (const row of rows) {
      addRequiredWindow(required, row.window, `plan:${relativeToWorkspace(planPath)}`);
    }
    if (hasFlag("--include-controller")) {
      addRequiredWindow(required, "AlembicWorkspace", `plan-controller:${relativeToWorkspace(planPath)}`);
    }
  }

  if (required.size === 0) {
    const activeStatuses = new Set(["queued", "claimed", "armed", "running"]);
    for (const task of queue.tasks.filter((item) => activeStatuses.has(item.status))) {
      addRequiredWindow(required, task.targetWindow, `queue:${task.taskId}`);
    }
    for (const group of groups.groups.filter((item) => item.returnPolicy === "controller-last" && item.status !== "returned")) {
      addRequiredWindow(required, "AlembicWorkspace", `group-controller:${group.groupId}`);
    }
  }

  return [...required.values()];
}

function redactSessionForOutput(session) {
  if (!session) return null;
  return {
    found: true,
    threadPath: session.threadPath ? "<local-only>" : "",
    cwd: session.cwd || "",
    name: session.name || "",
    source: session.source || "",
    updatedAtMs: session.updatedAtMs || 0,
    sessionStatus: session.sessionStatus || "unknown",
    sessionStatusReason: session.sessionStatusReason || "",
    lastEventAtMs: session.lastEventAtMs || 0,
  };
}

function computePreflight() {
  const { state, registry, queue, runs, groups } = readAll();
  const requireIdle = hasFlag("--require-idle");
  const allowActiveRuns = hasFlag("--allow-active-runs");
  const required = requiredWindowsForPreflight(queue, groups);
  const issues = [];
  const warnings = [];
  const windows = required.map((item) => {
    const entry = activeRegistryEntry(registry, item.windowName);
    const readiness = deliveryTargetReadiness(entry, { requireIdle });
    if (!entry) {
      issues.push(`No active window registry entry for ${item.windowName}.`);
    } else if (!readiness.ready) {
      issues.push(readiness.reason);
    }
    if (readiness.warnings?.length) {
      warnings.push(...readiness.warnings);
    }
    return {
      windowName: item.windowName,
      reasons: item.reasons,
      registered: Boolean(entry),
      threadId: entry?.threadId ? "<local-only>" : "",
      cwd: entry?.cwd || "",
      ready: readiness.ready,
      issue: readiness.ready ? "" : readiness.reason,
      session: redactSessionForOutput(readiness.session),
    };
  });
  const activeRuns = runs.runs.filter((run) => run.status !== "stopped");
  if (activeRuns.length > 0 && !allowActiveRuns) {
    issues.push(`Active automation run(s) exist: ${activeRuns.map((run) => run.automationId).join(", ")}.`);
  }
  if (required.length === 0) {
    warnings.push("No required dispatch windows were found for preflight.");
  }
  const keepAwake = keepAwakeStatus(state);
  if (state.mode === "enabled" && keepAwake.enabled && !keepAwake.active) {
    warnings.push("Automation mode is enabled but keep-awake is not active.");
  }
  return {
    ok: issues.length === 0,
    ready: issues.length === 0,
    checkedAt: nowIso(),
    stateDir: relativeToWorkspace(stateDir),
    mode: state.mode,
    loopEnabled: Boolean(state.loopEnabled),
    codexSessionsRoot: codexSessionsRoot(),
    requireIdle,
    requiredWindowCount: required.length,
    windows,
    activeAutomationRuns: activeRuns.map((run) => ({
      taskId: run.taskId,
      targetWindow: run.targetWindow,
      automationId: run.automationId,
      status: run.status,
      runType: run.runType || "target",
    })),
    keepAwake,
    warnings,
    issues,
  };
}

function commandPreflight() {
  const result = computePreflight();
  output(
    result,
    [
      `Visible dispatch preflight: ${result.ready ? "ready" : "blocked"}`,
      `Mode: ${result.mode}`,
      `Required windows: ${result.requiredWindowCount}`,
      `Issues: ${result.issues.join("; ") || "none"}`,
      `Warnings: ${result.warnings.join("; ") || "none"}`,
    ].join("\n"),
  );
  if (!result.ready) {
    process.exit(1);
  }
}

function commandEnqueue() {
  if (!hasFlag("--from-plan")) {
    fail("enqueue currently supports only --from-plan.");
  }
  const explicitPlan = getValue("--plan");
  const planPath = explicitPlan ? path.resolve(workspaceRoot, explicitPlan) : currentPlanPathFromIndex();
  if (!existsSync(planPath)) {
    fail(`Plan not found: ${relativeToWorkspace(planPath)}`);
  }
  const planContent = readFileSync(planPath, "utf8");
  const rows = parseDispatchRows(planContent).filter((row) => sendEligibleStatuses.has(row.status));
  const unsupported = rows.filter((row) => !dispatchWindows.has(row.window));
  if (unsupported.length > 0) {
    fail(`Plan has send-eligible non-Alembic windows: ${unsupported.map((row) => row.window).join(", ")}`);
  }
  const queue = readJson(files.queue, defaultQueue());
  const groups = readJson(files.groups, defaultGroups());
  const groupId = getValue("--group");
  const returnPolicy = groupId ? validateReturnPolicy(getValue("--return-policy", "controller-last")) : "";
  const created = [];
  const groupTaskIds = [];
  for (const row of rows) {
    const taskId = taskIdForPlanWindow(planPath, row.window);
    const existing = queue.tasks.find((task) => task.taskId === taskId);
    const task = {
      taskId,
      targetWindow: row.window,
      status: "queued",
      controlDoc: relativeToWorkspace(planPath),
      promptRef: "可复制提示词",
      taskSummary: row.task,
      createdAt: nowIso(),
      claim: null,
      leaseUntil: null,
      backfill: null,
      groupId: groupId ? sanitizeGroupId(groupId) : undefined,
      returnPolicy: returnPolicy || undefined,
    };
    groupTaskIds.push(taskId);
    if (!existing) {
      queue.tasks.push(task);
      created.push(task);
    } else if (!["completed", "blocked"].includes(existing.status)) {
      Object.assign(existing, {
        targetWindow: task.targetWindow,
        controlDoc: task.controlDoc,
        promptRef: task.promptRef,
        taskSummary: task.taskSummary,
        groupId: task.groupId,
        returnPolicy: task.returnPolicy,
        refreshedAt: nowIso(),
      });
    }
  }
  if (groupId) {
    const normalizedGroupId = sanitizeGroupId(groupId);
    const existingGroup = groups.groups.find((group) => group.groupId === normalizedGroupId);
    const nextGroup = {
      groupId: normalizedGroupId,
      controlDoc: relativeToWorkspace(planPath),
      returnPolicy,
      status: "open",
      taskIds: groupTaskIds,
      createdAt: existingGroup?.createdAt ?? nowIso(),
      updatedAt: nowIso(),
    };
    if (existingGroup) {
      Object.assign(existingGroup, nextGroup);
    } else {
      groups.groups.push(nextGroup);
    }
    groups.updatedAt = nextGroup.updatedAt;
  }
  queue.updatedAt = nowIso();
  if (write) {
    atomicWriteJson(files.queue, queue);
    if (groupId) {
      atomicWriteJson(files.groups, groups);
    }
  }
  output(
    {
      ok: true,
      wrote: write,
      plan: relativeToWorkspace(planPath),
      groupId: groupId ? sanitizeGroupId(groupId) : null,
      returnPolicy: returnPolicy || null,
      created,
      taskCount: queue.tasks.length,
    },
    `${write ? "Enqueued" : "Would enqueue"} ${created.length} visible dispatch task(s) from ${relativeToWorkspace(planPath)}.`,
  );
}

function activeRegistryEntry(registry, windowName) {
  return registry.windows.find((item) => item.windowName === windowName && item.status === "active");
}

function buildTaskPrompt(task) {
  const finishCommand = [
    "node scripts/visible-dispatch.mjs finish",
    `--window ${task.targetWindow}`,
    "[--thread <当前窗口 thread id；未知则省略>]",
    "--backfill <完成范围/验证命令/验证结果/风险>",
    "--write",
    "--chain-next",
    "--json",
  ].join(" ");
  return [
    "Visible Automation Dispatch 自动化模式目标任务。",
    "",
    `先读取 AGENTS.md、docs/workspace/index.md、${task.controlDoc}、skills/dev/visible-automation-dispatch-target/SKILL.md，以及你所在窗口/目标仓库的 AGENTS.md。`,
    "",
    `先明确声明当前窗口定位和本轮仓库职责；本条 heartbeat 只允许处理 targetWindow=${task.targetWindow} 的任务。`,
    "",
    `在 AlembicWorkspace 工作目录运行：node scripts/visible-dispatch.mjs claim --window ${task.targetWindow} --write --json`,
    "",
    "只领取属于当前窗口的任务；没有任务或目标窗口不匹配则短退出，不得改用其它 --window 继续执行。完成后按当前总控文档回填完成范围、验证命令、验证结果、遗留风险和下一步建议。",
    "",
    "自动化模式边界：只有本条 heartbeat 和当前总控计划明确分配的任务属于无人值守接续。用户在电脑前发起的普通讨论、Design 需求设计、总控决策讨论或单窗口开发请求，仍按最新用户输入和各自 AGENTS.md 执行，不得因为 visible-dispatch mode 已开启就当作自动化任务领取、续跳或关闭。",
    "",
    "无人值守接续规则：",
    `1. 完成当前任务后运行：${finishCommand}`,
    "2. 若 finish JSON 返回 `chain.nextAction === \"noReturn\"`，说明本批次还有其它窗口未完成；不得创建任何下一跳或总控回跳。",
    "3. 只在 finish JSON 返回 `chain.nextAction === \"armNext\"`、`chain.handoffPolicy === \"target-courier\"`、`chain.payload.courierAllowed === true` 时，才用 `codex_app.automation_update` 按 payload 创建下一条目标窗口 heartbeat。",
    "4. 只在 finish JSON 返回 `chain.nextAction === \"returnToController\"`、`chain.handoffPolicy === \"controller-return\"`、`chain.payload.controllerReturnAllowed === true` 时，才用 `codex_app.automation_update` 按 payload 创建总控回跳 heartbeat。",
    "5. 创建目标窗口 heartbeat 成功后运行 `chain.recordArmCommand`；创建总控回跳 heartbeat 成功后运行 `chain.recordReturnCommand`。把 `<automation-id>` 替换为返回的 automation id；这只是机械投递，不得代替目标窗口或总控执行任务。",
    "6. 如果 finish JSON 返回 `controllerArm`、`modeDisabled`、`registerWindow`、`registerController`、`wait`、`review`，或没有对应 payload / permission flag，不得创建下一跳 automation，改为报告总控。",
    "7. 下一跳目标是 `AlembicTest` 时默认由总控调起；非 `AlembicTest` 窗口不得处理或代领 `AlembicTest` 任务。",
    `8. 关闭开关是 \`node scripts/visible-dispatch.mjs mode --disable --write\`；它同时关闭后续 finish-chain 跳转和本地防睡眠。heartbeat cadence 固定为 \`${heartbeatRrule}\`，真实窗口跳转是分钟级等待。`,
    "9. 结束前，如果本条 heartbeat 消息包含 `automation_id`，只删除本条 automation，并用 `record-stop --automation-id <automation_id> --write --reason \"target completed\"` 记录停止。",
  ].join("\n");
}

function buildArmPayload(task, registry) {
  const windowEntry = activeRegistryEntry(registry, task.targetWindow);
  if (!windowEntry) {
    return {
      payload: null,
      reason: `No active window registry entry for ${task.targetWindow}.`,
    };
  }
  const readiness = deliveryTargetReadiness(windowEntry);
  if (!readiness.ready) {
    return {
      payload: null,
      reason: readiness.reason,
    };
  }
  const prompt = buildTaskPrompt(task);
  const payload = {
    kind: "heartbeat",
    destination: "thread",
    targetThreadId: windowEntry.threadId,
    name: `Visible dispatch ${task.targetWindow}`,
    rrule: heartbeatRrule,
    prompt,
    taskId: task.taskId,
    targetWindow: task.targetWindow,
    controlDoc: task.controlDoc,
    cadence: heartbeatRrule,
    chainMode: "finish-chain",
    stopSwitchCommand: "node scripts/visible-dispatch.mjs mode --disable --write",
  };
  return { payload, reason: "" };
}

function buildControllerReturnPrompt(group, completedTask) {
  return [
    `Visible Automation Dispatch unattended controller return for dispatchGroup=${group.groupId}.`,
    "",
    "先读取 AGENTS.md、docs/workspace/index.md、docs/workspace/current/workspace-current-status.md、当前总控计划、skills/dev/visible-automation-dispatch-controller/SKILL.md。",
    "",
    "你是 AlembicWorkspace 总控，当前处于无人值守自动化模式；自动化只是穿插在原总控流程里的投递/回跳层，不替代总控判断。",
    "如果当前输入不是 controller-return heartbeat，或用户在同一窗口开始需求设计、总控讨论、普通问答或单窗口开发，则先按最新用户输入和 AGENTS.md 判断，不得把这些人工交互自动纳入 VAD 循环。",
    "",
    "先运行：",
    `node scripts/visible-dispatch.mjs group-status --group ${group.groupId} --json`,
    "node scripts/visible-dispatch.mjs controller-tick --json",
    "",
    "随后按总控原流程独立验收本 group 所有 backfill：区分窗口自述、原始证据和总控裁决；决定接受、驳回、补证、自测、创建真实测试单、进入下一阶段、继续派发下一批或停止等待用户确认。",
    "",
    "不得因为脚本返回 completed 就关闭目标；不得在小修小补上偏离用户最终目标。若 mode 已关闭、确认门禁触发、证据不足、回填冲突或同一问题循环风险出现，停止自动推进并报告。",
    "关闭无人值守模式使用：node scripts/visible-dispatch.mjs mode --disable --write；关闭后不得再创建下一跳 heartbeat，并会停止本地防睡眠。",
    "",
    `本次最后完成窗口：${completedTask.targetWindow}；任务：${completedTask.taskId}。`,
    "",
    "结束前，如果本条 heartbeat 消息包含 automation_id，只删除本条 controller-return automation，并运行：",
    `node scripts/visible-dispatch.mjs record-stop --automation-id <automation_id> --write --reason "controller return handled"`,
  ].join("\n");
}

function buildControllerReturnPayload(group, completedTask, registry) {
  const controllerEntry = activeRegistryEntry(registry, "AlembicWorkspace");
  if (!controllerEntry) {
    return {
      payload: null,
      reason: "No active AlembicWorkspace controller registry entry is available for controller return.",
    };
  }
  const readiness = deliveryTargetReadiness(controllerEntry);
  if (!readiness.ready) {
    return {
      payload: null,
      reason: readiness.reason,
    };
  }
  const payload = {
    kind: "heartbeat",
    destination: "thread",
    targetThreadId: controllerEntry.threadId,
    name: `Visible dispatch controller ${group.groupId}`,
    rrule: heartbeatRrule,
    prompt: buildControllerReturnPrompt(group, completedTask),
    groupId: group.groupId,
    targetWindow: "AlembicWorkspace",
    controlDoc: group.controlDoc,
    cadence: heartbeatRrule,
    chainMode: "controller-return",
    controllerReturnAllowed: true,
  };
  return { payload, reason: "" };
}

function commandArm() {
  const taskId = getValue("--task");
  if (!taskId) {
    fail("arm requires --task.");
  }
  const { state, registry, queue } = readAll();
  if (state.mode !== "enabled") {
    fail("Visible dispatch mode is disabled; enable it before arming automation.");
  }
  const task = queue.tasks.find((item) => item.taskId === taskId);
  if (!task) {
    fail(`Task not found: ${taskId}`);
  }
  if (!["queued", "claimed"].includes(task.status)) {
    fail(`Task ${taskId} is ${task.status}; only queued/claimed tasks can be armed.`);
  }
  const { payload, reason } = buildArmPayload(task, registry);
  if (!payload) {
    fail(reason);
  }
  output({ ok: true, payload }, `Prepared arm payload for ${task.targetWindow} / ${taskId}.`);
}

function commandArmBatch() {
  const groupId = sanitizeGroupId(getValue("--group"));
  const { state, registry, queue, groups } = readAll();
  if (state.mode !== "enabled") {
    fail("Visible dispatch mode is disabled; enable it before arming automation.");
  }
  const group = groups.groups.find((item) => item.groupId === groupId);
  if (!group) {
    fail(`Dispatch group not found: ${groupId}`);
  }
  const groupTasks = queue.tasks.filter((task) => task.groupId === groupId);
  const payloads = [];
  const skipped = [];
  for (const task of groupTasks) {
    if (!["queued", "claimed"].includes(task.status)) {
      skipped.push({ taskId: task.taskId, targetWindow: task.targetWindow, status: task.status });
      continue;
    }
    const { payload, reason } = buildArmPayload(task, registry);
    if (payload) {
      payloads.push({ taskId: task.taskId, targetWindow: task.targetWindow, payload });
    } else {
      skipped.push({ taskId: task.taskId, targetWindow: task.targetWindow, status: task.status, reason });
    }
  }
  output(
    { ok: true, group, payloads, skipped },
    [
      `Prepared ${payloads.length} arm payload(s) for dispatch group ${groupId}.`,
      `Skipped: ${skipped.map((item) => `${item.taskId}:${item.reason ?? item.status}`).join(", ") || "none"}`,
    ].join("\n"),
  );
}

function commandRecordArm() {
  const taskId = getValue("--task");
  const automationId = getValue("--automation-id");
  if (!taskId || !automationId) {
    fail("record-arm requires --task and --automation-id.");
  }
  const queue = readJson(files.queue, defaultQueue());
  const runs = readJson(files.runs, defaultRuns());
  const task = queue.tasks.find((item) => item.taskId === taskId);
  if (!task) {
    fail(`Task not found: ${taskId}`);
  }
  if (!["queued", "claimed"].includes(task.status)) {
    fail(`Task ${taskId} is ${task.status}; only queued/claimed tasks can record arming.`);
  }
  const duplicate = runs.runs.find(
    (run) => run.taskId === taskId && run.automationId === automationId && run.status !== "stopped",
  );
  if (duplicate) {
    fail(`Automation ${automationId} is already recorded for ${taskId}.`);
  }

  const armedAt = nowIso();
  const leaseMinutes = parsePositiveInteger(getValue("--lease-minutes", "15"), "--lease-minutes");
  const run = {
    runId: `${taskId}__${automationId}`,
    taskId,
    targetWindow: task.targetWindow,
    automationId,
    status: getValue("--automation-status", "active"),
    createdAt: armedAt,
    controlDoc: task.controlDoc,
  };
  task.status = "armed";
  task.automationId = automationId;
  task.armedAt = armedAt;
  task.armLeaseUntil = new Date(Date.parse(armedAt) + leaseMinutes * 60 * 1000).toISOString();
  task.lastArmRunId = run.runId;
  queue.updatedAt = armedAt;
  runs.runs = [...runs.runs, run];
  runs.updatedAt = armedAt;
  if (write) {
    atomicWriteJson(files.queue, queue);
    atomicWriteJson(files.runs, runs);
  }
  output(
    { ok: true, wrote: write, task, run },
    `${write ? "Recorded" : "Would record"} automation ${automationId} for ${taskId}.`,
  );
}

function commandRecordReturn() {
  const groupId = sanitizeGroupId(getValue("--group"));
  const automationId = getValue("--automation-id");
  if (!automationId) {
    fail("record-return requires --automation-id.");
  }
  const groups = readJson(files.groups, defaultGroups());
  const runs = readJson(files.runs, defaultRuns());
  const group = groups.groups.find((item) => item.groupId === groupId);
  if (!group) {
    fail(`Dispatch group not found: ${groupId}`);
  }
  const activeControllerReturn = runs.runs.find(
    (run) => run.groupId === groupId && run.runType === "controller-return" && run.status !== "stopped",
  );
  if (activeControllerReturn) {
    fail(
      `Controller return automation ${activeControllerReturn.automationId} is already active for ${groupId}; stop it before recording another controller return.`,
    );
  }
  const duplicate = runs.runs.find(
    (run) => run.groupId === groupId && run.automationId === automationId && run.status !== "stopped",
  );
  if (duplicate) {
    fail(`Controller return automation ${automationId} is already recorded for ${groupId}.`);
  }
  const recordedAt = nowIso();
  const run = {
    runId: `${groupId}__controller-return__${automationId}`,
    taskId: `controller-return:${groupId}`,
    groupId,
    targetWindow: "AlembicWorkspace",
    automationId,
    status: "active",
    createdAt: recordedAt,
    controlDoc: group.controlDoc,
    runType: "controller-return",
  };
  group.controllerReturnAutomationId = automationId;
  group.controllerReturnRecordedAt = recordedAt;
  group.status = "return-armed";
  group.updatedAt = recordedAt;
  groups.updatedAt = recordedAt;
  runs.runs = [...runs.runs, run];
  runs.updatedAt = recordedAt;
  if (write) {
    atomicWriteJson(files.groups, groups);
    atomicWriteJson(files.runs, runs);
  }
  output(
    { ok: true, wrote: write, group, run },
    `${write ? "Recorded" : "Would record"} controller return automation ${automationId} for ${groupId}.`,
  );
}

function commandRecordStop() {
  const automationId = getValue("--automation-id");
  const taskId = getValue("--task");
  if (!automationId) {
    fail("record-stop requires --automation-id.");
  }

  const queue = readJson(files.queue, defaultQueue());
  const runs = readJson(files.runs, defaultRuns());
  const groups = readJson(files.groups, defaultGroups());
  const activeMatches = runs.runs.filter(
    (run) => run.automationId === automationId && (!taskId || run.taskId === taskId) && run.status !== "stopped",
  );
  const stoppedControllerMatches = runs.runs.filter(
    (run) =>
      run.automationId === automationId &&
      (!taskId || run.taskId === taskId) &&
      run.status === "stopped" &&
      run.runType === "controller-return" &&
      run.groupId,
  );
  if (activeMatches.length === 0 && stoppedControllerMatches.length === 0) {
    fail(`No active automation run found for ${automationId}${taskId ? ` / ${taskId}` : ""}.`);
  }

  const stoppedAt = nowIso();
  const reason = getValue("--reason", "");
  const touchedTaskIds = new Set(activeMatches.map((run) => run.taskId));
  for (const run of activeMatches) {
    run.previousStatus = run.status;
    run.status = "stopped";
    run.stoppedAt = stoppedAt;
    run.stopReason = reason;
  }
  for (const task of queue.tasks) {
    if (touchedTaskIds.has(task.taskId) && task.automationId === automationId) {
      task.automationStoppedAt = stoppedAt;
      task.automationStopReason = reason;
    }
  }
  const stoppedGroups = [];
  const controllerReturnStops = new Map(
    [...activeMatches, ...stoppedControllerMatches]
      .filter((run) => run.runType === "controller-return" && run.groupId)
      .map((run) => [
        run.groupId,
        {
          stoppedAt: run.stoppedAt || stoppedAt,
          reason: reason || run.stopReason || "",
        },
      ]),
  );
  for (const group of groups.groups) {
    const controllerStop = controllerReturnStops.get(group.groupId);
    if (!controllerStop || group.status === "returned") {
      continue;
    }
    group.previousStatus = group.status;
    group.status = "returned";
    group.controllerReturnStoppedAt = controllerStop.stoppedAt;
    group.controllerReturnStopReason = controllerStop.reason;
    group.updatedAt = stoppedAt;
    stoppedGroups.push(group);
  }
  if (activeMatches.length > 0) {
    queue.updatedAt = stoppedAt;
    runs.updatedAt = stoppedAt;
  }
  if (stoppedGroups.length > 0) {
    groups.updatedAt = stoppedAt;
  }
  if (write) {
    if (activeMatches.length > 0) {
      atomicWriteJson(files.queue, queue);
      atomicWriteJson(files.runs, runs);
    }
    if (stoppedGroups.length > 0) {
      atomicWriteJson(files.groups, groups);
    }
  }
  output(
    {
      ok: true,
      wrote: write,
      stoppedAt,
      stoppedRuns: activeMatches,
      alreadyStoppedControllerRuns: stoppedControllerMatches,
      stoppedGroups,
    },
    `${write ? "Recorded" : "Would record"} stopped automation ${automationId}.`,
  );
}

function summarizeGroup(group, queue) {
  const queueById = new Map(queue.tasks.map((task) => [task.taskId, task]));
  const declaredTaskIds = Array.isArray(group.taskIds) ? group.taskIds : [];
  const groupTasks =
    declaredTaskIds.length > 0
      ? declaredTaskIds.map((taskId) => queueById.get(taskId)).filter(Boolean)
      : queue.tasks.filter((task) => task.groupId === group.groupId);
  const missingTaskIds = declaredTaskIds.filter((taskId) => !queueById.has(taskId));
  const terminalStatuses = new Set(["completed", "accepted", "rejected", "blocked"]);
  const taskSummaries = groupTasks.map((task) => ({
    taskId: task.taskId,
    targetWindow: task.targetWindow,
    status: task.status,
    hasBackfill: hasBackfill(task),
    automationId: task.automationId ?? null,
    completedAt: task.completedAt ?? null,
  }));
  const unfinished = taskSummaries.filter((task) => !terminalStatuses.has(task.status));
  const completed = taskSummaries.filter((task) => task.status === "completed");
  const blocked = taskSummaries.filter((task) => task.status === "blocked");
  return {
    groupId: group.groupId,
    returnPolicy: group.returnPolicy,
    status: group.status,
    controlDoc: group.controlDoc,
    taskCount: taskSummaries.length,
    declaredTaskCount: declaredTaskIds.length || taskSummaries.length,
    missingTaskCount: missingTaskIds.length,
    missingTaskIds,
    completedCount: completed.length,
    blockedCount: blocked.length,
    unfinishedCount: unfinished.length,
    terminal: missingTaskIds.length === 0 && unfinished.length === 0 && taskSummaries.length > 0,
    tasks: taskSummaries,
  };
}

function commandGroupStatus() {
  const groupId = sanitizeGroupId(getValue("--group"));
  const { queue, groups } = readAll();
  const group = groups.groups.find((item) => item.groupId === groupId);
  if (!group) {
    fail(`Dispatch group not found: ${groupId}`);
  }
  const summary = summarizeGroup(group, queue);
  output(
    { ok: true, group: summary },
    [
      `Dispatch group ${groupId}`,
      `Return policy: ${summary.returnPolicy}`,
      `Tasks: ${summary.taskCount}, completed: ${summary.completedCount}, blocked: ${summary.blockedCount}, unfinished: ${summary.unfinishedCount}`,
      `Terminal: ${summary.terminal}`,
    ].join("\n"),
  );
}

function commandClaim() {
  const windowName = getValue("--window");
  if (!windowName) {
    fail("claim requires --window.");
  }
  validateWindow(windowName);
  const queue = readJson(files.queue, defaultQueue());
  const now = Date.now();
  const leaseMinutes = parsePositiveInteger(getValue("--lease-minutes", "30"), "--lease-minutes");
  const task = queue.tasks.find((item) => {
    if (item.targetWindow !== windowName) {
      return false;
    }
    if (item.status === "queued" || item.status === "armed") {
      return true;
    }
    if (["claimed", "running"].includes(item.status) && item.leaseUntil) {
      return Date.parse(item.leaseUntil) <= now;
    }
    return false;
  });
  if (!task) {
    output({ ok: true, wrote: false, claimed: null }, `No visible dispatch task available for ${windowName}.`);
    return;
  }
  const claimedAt = nowIso();
  task.status = "claimed";
  task.claim = { windowName, claimedAt };
  task.leaseUntil = new Date(now + leaseMinutes * 60 * 1000).toISOString();
  if (task.automationId) {
    task.automationClaimedAt = claimedAt;
  }
  queue.updatedAt = claimedAt;
  if (write) {
    atomicWriteJson(files.queue, queue);
  }
  output(
    { ok: true, wrote: write, claimed: task },
    `${write ? "Claimed" : "Would claim"} visible dispatch task ${task.taskId} for ${windowName}.`,
  );
}

function commandComplete() {
  const taskId = getValue("--task");
  if (!taskId) {
    fail("complete requires --task.");
  }
  const queue = readJson(files.queue, defaultQueue());
  const task = queue.tasks.find((item) => item.taskId === taskId);
  if (!task) {
    fail(`Task not found: ${taskId}`);
  }
  task.status = "completed";
  task.completedAt = nowIso();
  task.backfill = getValue("--backfill", task.backfill ?? "");
  queue.updatedAt = task.completedAt;
  if (write) {
    atomicWriteJson(files.queue, queue);
  }
  output({ ok: true, wrote: write, completed: task }, `${write ? "Completed" : "Would complete"} ${taskId}.`);
}

function commandBlock() {
  const taskId = getValue("--task");
  const reason = getValue("--reason");
  if (!taskId || !reason) {
    fail("block requires --task and --reason.");
  }
  const queue = readJson(files.queue, defaultQueue());
  const task = queue.tasks.find((item) => item.taskId === taskId);
  if (!task) {
    fail(`Task not found: ${taskId}`);
  }
  if (["accepted", "rejected"].includes(task.status)) {
    fail(`Task ${taskId} is ${task.status}; accepted/rejected tasks cannot be blocked.`);
  }
  const blockedAt = nowIso();
  task.previousStatus = task.status;
  task.status = "blocked";
  task.blockedAt = blockedAt;
  task.blockedReason = reason;
  queue.updatedAt = blockedAt;
  if (write) {
    atomicWriteJson(files.queue, queue);
  }
  output({ ok: true, wrote: write, blocked: task }, `${write ? "Blocked" : "Would block"} ${taskId}.`);
}

function readBackfillText() {
  const inline = getValue("--backfill", "");
  const file = getValue("--backfill-file");
  if (inline && file) {
    fail("Pass only one of --backfill or --backfill-file.");
  }
  if (file) {
    const resolved = path.resolve(workspaceRoot, file);
    ensureWorkspacePath(resolved, "backfill file");
    if (!existsSync(resolved)) {
      fail(`Backfill file not found: ${relativeToWorkspace(resolved)}`);
    }
    return readFileSync(resolved, "utf8").trim();
  }
  return inline.trim();
}

function selectCompletableTask(queue, windowName, taskId) {
  if (taskId) {
    const task = queue.tasks.find((item) => item.taskId === taskId);
    if (!task) {
      fail(`Task not found: ${taskId}`);
    }
    if (task.targetWindow !== windowName) {
      fail(`Task ${taskId} targets ${task.targetWindow}, not ${windowName}.`);
    }
    return task;
  }
  const active = queue.tasks.find(
    (task) => task.targetWindow === windowName && ["claimed", "running"].includes(task.status),
  );
  if (active) {
    return active;
  }
  return queue.tasks.find(
    (task) => task.targetWindow === windowName && ["armed", "queued"].includes(task.status),
  );
}

function buildFinishChain({ state, registry, queue, groups, completedTask, chainNext }) {
  if (!chainNext) {
    return {
      enabled: false,
      nextAction: "none",
      message: "No next automation payload generated because --chain-next was not provided.",
    };
  }
  if (state.mode !== "enabled") {
    return {
      enabled: true,
      nextAction: "modeDisabled",
      message: "Visible dispatch mode is disabled; completion is recorded but no next heartbeat payload is emitted.",
    };
  }
  if (completedTask.groupId) {
    const group = groups.groups.find((item) => item.groupId === completedTask.groupId);
    if (!group) {
      return {
        enabled: true,
        nextAction: "inspect",
        message: `Task ${completedTask.taskId} belongs to missing dispatch group ${completedTask.groupId}.`,
      };
    }
    if (group.returnPolicy === "controller-last") {
      const summary = summarizeGroup(group, queue);
      group.lastCompletedTaskId = completedTask.taskId;
      group.lastCompletedAt = completedTask.completedAt;
      group.updatedAt = nowIso();
      if (summary.missingTaskCount > 0) {
        group.status = "needs-inspection";
        return {
          enabled: true,
          nextAction: "inspect",
          handoffPolicy: "controller-last",
          message: `Dispatch group ${group.groupId} references missing task(s): ${summary.missingTaskIds.join(", ")}.`,
          group: summary,
        };
      }
      if (!summary.terminal) {
        group.status = "open";
        return {
          enabled: true,
          nextAction: "noReturn",
          handoffPolicy: "controller-last",
          message: `Dispatch group ${group.groupId} still has ${summary.unfinishedCount} unfinished task(s); do not return to total control yet.`,
          group: summary,
        };
      }
      if (group.status === "return-armed" || group.status === "returned") {
        return {
          enabled: true,
          nextAction: "review",
          handoffPolicy: "controller-return",
          message: `Dispatch group ${group.groupId} already has a recorded controller return; do not create another heartbeat.`,
          group: summary,
        };
      }
      const { payload, reason } = buildControllerReturnPayload(group, completedTask, registry);
      if (!payload) {
        group.status = "needs-controller-registration";
        return {
          enabled: true,
          nextAction: "registerController",
          handoffPolicy: "controller-last",
          message: reason,
          group: summary,
        };
      }
      group.status = summary.blockedCount > 0 ? "return-ready-with-blockers" : "return-ready";
      group.returnReadyAt = nowIso();
      return {
        enabled: true,
        nextAction: "returnToController",
        handoffPolicy: "controller-return",
        message: `Dispatch group ${group.groupId} is terminal; create exactly one controller-return heartbeat.`,
        group: summary,
        payload,
        recordReturnCommand: `node scripts/visible-dispatch.mjs record-return --group ${group.groupId} --automation-id <automation-id> --write`,
      };
    }
  }
  const activeWindows = activeWindowSet(registry);
  const nowMs = Date.now();
  const classified = queue.tasks.map((task) => ({
    taskId: task.taskId,
    targetWindow: task.targetWindow,
    status: task.status,
    ...classifyTaskForTick(task, state, activeWindows, nowMs),
  }));
  const blockers = classified.filter(
    (task) =>
      task.taskId !== completedTask.taskId &&
      task.status !== "queued" &&
      (task.waitState === "attention" || task.waitState === "blocked") &&
      !(task.status === "completed" && task.nextAction === "acceptanceReview"),
  );
  if (blockers.length > 0) {
    return {
      enabled: true,
      nextAction: blockers[0].nextAction,
      message: `Queue needs attention before chaining: ${blockers[0].message}`,
      blockingTask: blockers[0],
    };
  }
  const nextQueued = queue.tasks.find((task) => task.status === "queued");
  if (!nextQueued) {
    const waiting = classified.find((task) => task.waitState === "waiting");
    return {
      enabled: true,
      nextAction: waiting ? "wait" : "review",
      message: waiting
        ? "Another task is already active; no new payload was generated."
        : "No queued task remains; completed tasks still require total-control acceptance.",
    };
  }
  if (totalControlArmOnlyTargets.has(nextQueued.targetWindow) && completedTask.targetWindow !== nextQueued.targetWindow) {
    return {
      enabled: true,
      nextAction: "controllerArm",
      handoffPolicy: "total-control-only",
      message: `Next queued task targets ${nextQueued.targetWindow}; previous target window must not create this heartbeat. Total control should arm the next task.`,
      taskId: nextQueued.taskId,
      targetWindow: nextQueued.targetWindow,
      armCommand: `node scripts/visible-dispatch.mjs arm --task ${nextQueued.taskId} --json`,
      recordArmCommand: `node scripts/visible-dispatch.mjs record-arm --task ${nextQueued.taskId} --automation-id <automation-id> --write`,
    };
  }
  const { payload, reason } = buildArmPayload(nextQueued, registry);
  if (!payload) {
    return {
      enabled: true,
      nextAction: "registerWindow",
      message: reason,
      taskId: nextQueued.taskId,
      targetWindow: nextQueued.targetWindow,
    };
  }
  return {
    enabled: true,
    nextAction: "armNext",
    handoffPolicy: "target-courier",
    message: `Next queued task can be armed for ${nextQueued.targetWindow}.`,
    taskId: nextQueued.taskId,
    targetWindow: nextQueued.targetWindow,
    payload: { ...payload, courierAllowed: true },
    recordArmCommand: `node scripts/visible-dispatch.mjs record-arm --task ${nextQueued.taskId} --automation-id <automation-id> --write`,
  };
}

function commandFinish() {
  const windowName = getValue("--window");
  if (!windowName) {
    fail("finish requires --window.");
  }
  validateWindow(windowName);
  const backfill = readBackfillText();
  if (!backfill) {
    fail("finish requires non-empty --backfill or --backfill-file evidence.");
  }

  const state = readJson(files.state, defaultState());
  const registry = readJson(files.registry, defaultRegistry());
  const queue = readJson(files.queue, defaultQueue());
  const groups = readJson(files.groups, defaultGroups());
  const threadId = getValue("--thread");
  const finishedAt = nowIso();

  if (threadId) {
    validateThreadId(threadId);
    registry.windows = registry.windows.filter((item) => item.windowName !== windowName);
    registry.windows.push({
      windowName,
      threadId: threadId.trim(),
      cwd: getValue("--cwd", ""),
      role: getValue("--role", windowName),
      status: "active",
      source: "finish",
      lastSeenAt: finishedAt,
    });
    registry.updatedAt = finishedAt;
  }

  const task = selectCompletableTask(queue, windowName, getValue("--task"));
  if (!task) {
    fail(`No queued, armed, claimed, or running task is available for ${windowName}.`);
  }
  if (!["queued", "armed", "claimed", "running"].includes(task.status)) {
    fail(`Task ${task.taskId} is ${task.status}; finish can only complete queued, armed, claimed, or running tasks.`);
  }

  const previousStatus = task.status;
  if (["queued", "armed"].includes(task.status)) {
    task.claim = { windowName, claimedAt: finishedAt };
    if (task.automationId) {
      task.automationClaimedAt = finishedAt;
    }
  }
  task.previousStatus = previousStatus;
  task.status = "completed";
  task.completedAt = finishedAt;
  task.completedByThreadId = threadId || task.completedByThreadId || "";
  task.completionSource = "finish";
  task.backfill = backfill;
  queue.updatedAt = finishedAt;

  const chain = buildFinishChain({
    state,
    registry,
    queue,
    groups,
    completedTask: task,
    chainNext: hasFlag("--chain-next"),
  });

  if (write) {
    if (threadId) {
      atomicWriteJson(files.registry, registry);
    }
    atomicWriteJson(files.queue, queue);
    if (task.groupId) {
      groups.updatedAt = finishedAt;
      atomicWriteJson(files.groups, groups);
    }
  }

  output(
    { ok: true, wrote: write, registeredThread: Boolean(threadId), completed: redactTaskForOutput(task), chain },
    [
      `${write ? "Finished" : "Would finish"} ${task.taskId} for ${windowName}.`,
      `Previous status: ${previousStatus}`,
      `Chain next action: ${chain.nextAction}`,
      chain.message,
    ].join("\n"),
  );
}

function hasBackfill(task) {
  if (typeof task.backfill === "string") {
    return task.backfill.trim().length > 0;
  }
  return Boolean(task.backfill);
}

function activeWindowSet(registry) {
  return new Set(
    registry.windows
      .filter((entry) => entry.status === "active" && deliveryTargetReadiness(entry).ready)
      .map((entry) => entry.windowName),
  );
}

function classifyTaskForTick(task, state, activeWindows, nowMs, groupSummaries = new Map()) {
  if (task.status === "queued") {
    if (state.mode !== "enabled") {
      return {
        waitState: "paused",
        nextAction: "modeDisabled",
        message: "Loop is disabled; do not arm automation.",
      };
    }
    if (!activeWindows.has(task.targetWindow)) {
      return {
        waitState: "blocked",
        nextAction: "registerWindow",
        message: `No active registry entry for ${task.targetWindow}.`,
      };
    }
    return {
      waitState: "ready",
      nextAction: "arm",
      message: "Task is queued and target window is registered.",
    };
  }

  if (task.status === "armed") {
    if (task.automationStoppedAt) {
      return {
        waitState: "attention",
        nextAction: "reviewStopped",
        message: `Automation ${task.automationId ?? "(unknown)"} was stopped before claim; total control should requeue, block, or close the task.`,
      };
    }
    if (state.mode !== "enabled") {
      return {
        waitState: "attention",
        nextAction: "stopAutomation",
        message: "Task has an armed automation while the loop is disabled.",
      };
    }
    if (!task.automationId) {
      return {
        waitState: "attention",
        nextAction: "recordArm",
        message: "Task is armed but has no recorded automationId.",
      };
    }
    const leaseMs = Date.parse(task.armLeaseUntil ?? "");
    if (!Number.isFinite(leaseMs)) {
      return {
        waitState: "attention",
        nextAction: "repairArmLease",
        message: "Task is armed but has no valid armLeaseUntil.",
      };
    }
    if (leaseMs <= nowMs) {
      return {
        waitState: "attention",
        nextAction: "markStale",
        message: `Armed automation was not claimed before ${task.armLeaseUntil}.`,
      };
    }
    return {
      waitState: "waiting",
      nextAction: "waitForClaim",
      message: `Automation ${task.automationId} is armed; waiting for target window claim until ${task.armLeaseUntil}.`,
    };
  }

  if (task.status === "claimed" || task.status === "running") {
    const leaseMs = Date.parse(task.leaseUntil ?? "");
    if (!Number.isFinite(leaseMs)) {
      return {
        waitState: "attention",
        nextAction: "repairLease",
        message: "Task is active but has no valid leaseUntil.",
      };
    }
    if (leaseMs <= nowMs) {
      return {
        waitState: "attention",
        nextAction: "markStale",
        message: `Lease expired at ${task.leaseUntil}.`,
      };
    }
    return {
      waitState: "waiting",
      nextAction: "wait",
      message: `Lease active until ${task.leaseUntil}.`,
    };
  }

  if (task.status === "stale") {
    return {
      waitState: "attention",
      nextAction: "reviewStale",
      message: "Task lease expired earlier; total control should review or requeue.",
    };
  }

  if (task.status === "completed") {
    const groupSummary = task.groupId ? groupSummaries.get(task.groupId) : null;
    if (groupSummary?.returnPolicy === "controller-last" && !groupSummary.terminal) {
      return {
        waitState: "waiting",
        nextAction: "waitForGroup",
        message: `Task is complete, but dispatch group ${groupSummary.groupId} still has ${groupSummary.unfinishedCount} unfinished task(s); wait for the final target before total-control review.`,
      };
    }
    if (hasBackfill(task)) {
      return {
        waitState: "ready",
        nextAction: "acceptanceReview",
        message: "Task has completion backfill and is ready for total-control acceptance.",
      };
    }
    return {
      waitState: "attention",
      nextAction: "requestBackfill",
      message: "Task is completed but has no backfill evidence.",
    };
  }

  if (task.status === "blocked") {
    return {
      waitState: "blocked",
      nextAction: "resolveBlocker",
      message: "Task is blocked by the target window.",
    };
  }

  if (task.status === "accepted") {
    return {
      waitState: "done",
      nextAction: "none",
      message: "Task was accepted by total control.",
    };
  }

  if (task.status === "rejected") {
    return {
      waitState: "attention",
      nextAction: "followUp",
      message: "Task was rejected by total control and needs follow-up.",
    };
  }

  return {
    waitState: "attention",
    nextAction: "inspect",
    message: `Unknown task status: ${task.status}`,
  };
}

function commandTick() {
  const { state, registry, queue, groups } = readAll();
  const observedAt = nowIso();
  const nowMs = Date.parse(observedAt);
  const activeWindows = activeWindowSet(registry);
  const groupSummaries = groupSummariesById(groups, queue);
  let changed = false;
  const tasks = queue.tasks.map((task) => {
    const summary = classifyTaskForTick(task, state, activeWindows, nowMs, groupSummaries);
    if (write && summary.nextAction === "markStale") {
      task.previousStatus = task.status;
      task.status = "stale";
      task.staleAt = observedAt;
      changed = true;
      return {
        taskId: task.taskId,
        targetWindow: task.targetWindow,
        status: task.status,
        previousStatus: task.previousStatus,
        ...classifyTaskForTick(task, state, activeWindows, nowMs, groupSummaries),
      };
    }
    return {
      taskId: task.taskId,
      targetWindow: task.targetWindow,
      status: task.status,
      leaseUntil: task.leaseUntil ?? null,
      armLeaseUntil: task.armLeaseUntil ?? null,
      automationId: task.automationId ?? null,
      hasBackfill: hasBackfill(task),
      ...summary,
    };
  });

  if (write && changed) {
    queue.updatedAt = observedAt;
    atomicWriteJson(files.queue, queue);
  }

  const waitCounts = tasks.reduce((acc, task) => {
    acc[task.waitState] = (acc[task.waitState] ?? 0) + 1;
    return acc;
  }, {});
  const actionCounts = tasks.reduce((acc, task) => {
    acc[task.nextAction] = (acc[task.nextAction] ?? 0) + 1;
    return acc;
  }, {});
  const topAction = tasks.some((task) => task.nextAction === "stopAutomation")
    ? "cleanup"
    : tasks.some((task) => task.nextAction === "acceptanceReview")
      ? "review"
      : tasks.some((task) => task.waitState === "attention" || task.waitState === "blocked")
          ? "attention"
          : state.mode !== "enabled"
            ? "stopped"
            : tasks.some((task) => task.waitState === "waiting")
              ? "wait"
              : state.mode === "enabled" && tasks.some((task) => task.nextAction === "arm")
                ? "arm"
                : "wait";

  output(
    {
      ok: true,
      wrote: write && changed,
      observedAt,
      mode: state.mode,
      loopEnabled: Boolean(state.loopEnabled),
      activeWindows: [...activeWindows],
      topAction,
      waitCounts,
      actionCounts,
      tasks,
    },
    [
      "Visible dispatch tick",
      `Mode: ${state.mode}`,
      `Top action: ${topAction}`,
      `Tasks: ${tasks.length}`,
      `Wait states: ${Object.entries(waitCounts).map(([key, value]) => `${key}=${value}`).join(", ") || "none"}`,
      `Actions: ${Object.entries(actionCounts).map(([key, value]) => `${key}=${value}`).join(", ") || "none"}`,
      changed && write ? "Marked expired active tasks as stale." : "No persistent tick changes.",
    ].join("\n"),
  );
}

function commandAccept() {
  const taskId = getValue("--task");
  if (!taskId) {
    fail("accept requires --task.");
  }
  const verdict = getValue("--verdict", "accepted");
  if (!["accepted", "rejected"].includes(verdict)) {
    fail("--verdict must be accepted or rejected.");
  }
  const queue = readJson(files.queue, defaultQueue());
  const runs = readJson(files.runs, defaultRuns());
  const task = queue.tasks.find((item) => item.taskId === taskId);
  if (!task) {
    fail(`Task not found: ${taskId}`);
  }
  if (task.status !== "completed") {
    fail(`Task ${taskId} is ${task.status}; only completed tasks can be accepted or rejected.`);
  }
  if (verdict === "accepted" && !hasBackfill(task)) {
    fail(`Task ${taskId} has no backfill evidence; reject it or request backfill before accepting.`);
  }
  const activeRuns = runs.runs.filter((run) => run.taskId === taskId && run.status !== "stopped");
  if (verdict === "accepted" && activeRuns.length > 0 && !hasFlag("--allow-active-automation")) {
    fail(
      `Task ${taskId} still has active automation run(s): ${activeRuns.map((run) => run.automationId).join(", ")}. Delete/record-stop them before accepting, or pass --allow-active-automation with a reason.`,
    );
  }

  const decidedAt = nowIso();
  task.status = verdict;
  task.acceptance = {
    verdict,
    decidedAt,
    note: getValue("--note", ""),
  };
  if (verdict === "accepted") {
    task.acceptedAt = decidedAt;
  } else {
    task.rejectedAt = decidedAt;
  }
  queue.updatedAt = decidedAt;
  if (write) {
    atomicWriteJson(files.queue, queue);
  }
  output(
    { ok: true, wrote: write, task: redactTaskForOutput(task), activeRuns },
    `${write ? "Recorded" : "Would record"} total-control ${verdict} verdict for ${taskId}.`,
  );
}

function commandCleanup() {
  const { state, queue, runs } = readAll();
  const now = Date.now();
  const staleTasks = queue.tasks.filter((task) => {
    if (["claimed", "running"].includes(task.status) && task.leaseUntil) {
      return Date.parse(task.leaseUntil) <= now;
    }
    if (task.status === "armed" && task.automationStoppedAt) {
      return false;
    }
    if (task.status === "armed" && task.armLeaseUntil) {
      return Date.parse(task.armLeaseUntil) <= now;
    }
    return false;
  });
  const stoppedAutomationTasks = queue.tasks.filter((task) => task.status === "armed" && task.automationStoppedAt);
  const activeAutomationRuns = runs.runs.filter((run) => run.status !== "stopped");
  const shouldStop = state.mode === "disabled";
  const result = {
    ok: true,
    wrote: write,
    mode: state.mode,
    shouldStop,
    staleTasks: staleTasks.map((task) => task.taskId),
    stoppedAutomationTasks: stoppedAutomationTasks.map((task) => task.taskId),
    activeAutomationRuns: activeAutomationRuns.map((run) => ({
      runId: run.runId,
      taskId: run.taskId,
      targetWindow: run.targetWindow,
      automationId: run.automationId,
    })),
    automationRuns: runs.runs.length,
  };
  output(
    result,
    [
      `Visible dispatch cleanup ${write ? "checked" : "dry-run"}.`,
      `Mode: ${state.mode}`,
      `Stop arming new automation: ${shouldStop}`,
      `Stale claimed tasks: ${result.staleTasks.join(", ") || "none"}`,
      `Stopped automation tasks: ${result.stoppedAutomationTasks.join(", ") || "none"}`,
      `Active automation runs: ${result.activeAutomationRuns.map((run) => run.automationId).join(", ") || "none"}`,
      "Note: actual Codex automation deletion is performed by total control with codex_app.automation_update.",
    ].join("\n"),
  );
}

function commandPruneHistory() {
  const queue = readJson(files.queue, defaultQueue());
  const runs = readJson(files.runs, defaultRuns());
  const groups = readJson(files.groups, defaultGroups());
  const currentPlanPath = relativeToWorkspace(currentPlanPathFromIndex());
  const terminalHistoricStatuses = new Set(["accepted", "rejected", "blocked"]);
  const activeRunTaskIds = new Set(
    runs.runs.filter((run) => run.status !== "stopped").map((run) => run.taskId),
  );
  const prunableTasks = queue.tasks.filter(
    (task) =>
      task.controlDoc &&
      task.controlDoc !== currentPlanPath &&
      terminalHistoricStatuses.has(task.status) &&
      !activeRunTaskIds.has(task.taskId),
  );
  const prunableTaskIds = new Set(prunableTasks.map((task) => task.taskId));
  const prunableRuns = runs.runs.filter((run) => prunableTaskIds.has(run.taskId) && run.status === "stopped");
  const skippedHistoricActiveTasks = queue.tasks.filter(
    (task) =>
      task.controlDoc &&
      task.controlDoc !== currentPlanPath &&
      terminalHistoricStatuses.has(task.status) &&
      activeRunTaskIds.has(task.taskId),
  );
  const remainingTaskIdsAfterPrune = new Set(
    queue.tasks.filter((task) => !prunableTaskIds.has(task.taskId)).map((task) => task.taskId),
  );
  const activeRunGroupIds = new Set(
    runs.runs.filter((run) => run.groupId && run.status !== "stopped").map((run) => run.groupId),
  );
  const prunableGroups = groups.groups.filter((group) => {
    if (!group.controlDoc || group.controlDoc === currentPlanPath || activeRunGroupIds.has(group.groupId)) {
      return false;
    }
    const taskIds = Array.isArray(group.taskIds) ? group.taskIds : [];
    return taskIds.length > 0 && taskIds.every((taskId) => !remainingTaskIdsAfterPrune.has(taskId));
  });
  const prunableGroupIds = new Set(prunableGroups.map((group) => group.groupId));
  const prunableGroupRuns = runs.runs.filter(
    (run) => run.groupId && prunableGroupIds.has(run.groupId) && run.status === "stopped",
  );
  const prunableRunIds = new Set([...prunableRuns, ...prunableGroupRuns].map((run) => run.runId));

  if (write && prunableTasks.length > 0) {
    queue.tasks = queue.tasks.filter((task) => !prunableTaskIds.has(task.taskId));
    queue.updatedAt = nowIso();
    atomicWriteJson(files.queue, queue);
  }
  if (write && prunableRunIds.size > 0) {
    runs.runs = runs.runs.filter((run) => !prunableRunIds.has(run.runId));
    runs.updatedAt = nowIso();
    atomicWriteJson(files.runs, runs);
  }
  if (write && prunableGroups.length > 0) {
    groups.groups = groups.groups.filter((group) => !prunableGroupIds.has(group.groupId));
    groups.updatedAt = nowIso();
    atomicWriteJson(files.groups, groups);
  }

  output(
    {
      ok: true,
      wrote: write,
      currentPlan: currentPlanPath,
      prunedTasks: prunableTasks.map((task) => ({
        taskId: task.taskId,
        targetWindow: task.targetWindow,
        status: task.status,
        controlDoc: task.controlDoc,
        automationId: task.automationId ?? null,
      })),
      prunedStoppedAutomationRuns: prunableRuns.map((run) => ({
        runId: run.runId,
        taskId: run.taskId,
        targetWindow: run.targetWindow,
        automationId: run.automationId,
      })),
      prunedGroups: prunableGroups.map((group) => ({
        groupId: group.groupId,
        status: group.status,
        controlDoc: group.controlDoc,
      })),
      prunedStoppedControllerRuns: prunableGroupRuns.map((run) => ({
        runId: run.runId,
        groupId: run.groupId,
        targetWindow: run.targetWindow,
        automationId: run.automationId,
      })),
      skippedHistoricActiveTasks: skippedHistoricActiveTasks.map((task) => ({
        taskId: task.taskId,
        targetWindow: task.targetWindow,
        status: task.status,
        controlDoc: task.controlDoc,
        automationId: task.automationId ?? null,
      })),
      remainingTaskCount: write ? queue.tasks.length : queue.tasks.length - prunableTasks.length,
    },
    [
      `Visible dispatch history prune ${write ? "applied" : "dry-run"}.`,
      `Current plan: ${currentPlanPath}`,
      `Prunable historic terminal tasks: ${prunableTasks.map((task) => task.taskId).join(", ") || "none"}`,
      `Prunable stopped automation runs: ${[...prunableRuns, ...prunableGroupRuns].map((run) => run.automationId).join(", ") || "none"}`,
      `Prunable dispatch groups: ${prunableGroups.map((group) => group.groupId).join(", ") || "none"}`,
      `Skipped historic tasks with active runs: ${skippedHistoricActiveTasks.map((task) => task.taskId).join(", ") || "none"}`,
    ].join("\n"),
  );
}

switch (command) {
  case "help":
  case "--help":
  case "-h":
    console.log(helpText);
    break;
  case "status":
    commandStatus();
    break;
  case "mode":
    commandMode();
    break;
  case "register":
    commandRegister();
    break;
  case "unregister":
    commandUnregister();
    break;
  case "preflight":
    commandPreflight();
    break;
  case "enqueue":
    commandEnqueue();
    break;
  case "arm":
    commandArm();
    break;
  case "arm-batch":
    commandArmBatch();
    break;
  case "record-arm":
    commandRecordArm();
    break;
  case "record-return":
    commandRecordReturn();
    break;
  case "record-stop":
    commandRecordStop();
    break;
  case "claim":
    commandClaim();
    break;
  case "complete":
    commandComplete();
    break;
  case "block":
    commandBlock();
    break;
  case "finish":
    commandFinish();
    break;
  case "group-status":
    commandGroupStatus();
    break;
  case "tick":
    commandTick();
    break;
  case "controller-tick":
    commandControllerTick();
    break;
  case "accept":
    commandAccept();
    break;
  case "cleanup":
    commandCleanup();
    break;
  case "prune-history":
    commandPruneHistory();
    break;
  default:
    fail(`Unknown visible-dispatch command: ${command}\n\n${helpText}`);
}
