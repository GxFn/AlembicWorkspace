#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
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
  node scripts/visible-dispatch.mjs mode --enable|--disable --write [--reason <text>]
  node scripts/visible-dispatch.mjs register --window <name> --thread <threadId> [--cwd <cwd>] --write
  node scripts/visible-dispatch.mjs unregister --window <name> --write [--reason <text>]
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
  node scripts/visible-dispatch.mjs accept --task <taskId> [--verdict accepted|rejected] [--note <text>] --write
  node scripts/visible-dispatch.mjs cleanup [--write] [--json]
  node scripts/visible-dispatch.mjs prune-history [--write] [--json]

Safety:
  Runtime files live under .workspace-local/visible-dispatch by default and are
  ignored by git. The script does not call Codex automation APIs directly; arm
  and finish-chain only print payloads that a Codex window can pass to
  codex_app.automation_update. mode=disabled is the close switch: it stops
  controller loops immediately, and any already-awake target window will record
  completion without receiving another finish-chain wake payload.
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
    fail(`Invalid visible dispatch thread id placeholder: ${threadId}`);
  }
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

function commandStatus() {
  const { state, registry, queue, runs, groups } = readAll();
  const counts = queue.tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] ?? 0) + 1;
    return acc;
  }, {});
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
    },
    [
      "Visible dispatch status",
      `State dir: ${relativeToWorkspace(stateDir)}`,
      `Mode: ${state.mode}`,
      `Loop enabled: ${Boolean(state.loopEnabled)}`,
      `Disable policy: ${state.disablePolicy ?? "stop-next-chain"}`,
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

function controllerDecisionFromQueue(state, registry, queue, currentPlanPath) {
  const observedAt = nowIso();
  const nowMs = Date.parse(observedAt);
  const activeWindows = activeWindowSet(registry);
  const tasks = queue.tasks.map((task) => ({
    taskId: task.taskId,
    targetWindow: task.targetWindow,
    status: task.status,
    controlDoc: task.controlDoc ?? null,
    leaseUntil: task.leaseUntil ?? null,
    armLeaseUntil: task.armLeaseUntil ?? null,
    automationId: task.automationId ?? null,
    hasBackfill: hasBackfill(task),
    ...classifyTaskForTick(task, state, activeWindows, nowMs),
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
  const { state, registry, queue } = readAll();
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
  const queueDecision = controllerDecisionFromQueue(state, registry, queue, currentPlan.path);
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
  const next = {
    ...state,
    mode: enable ? "enabled" : "disabled",
    loopEnabled: enable,
    updatedAt: nowIso(),
    stopRequestedAt: disable ? nowIso() : null,
    disablePolicy: enable ? "" : "stop-next-chain",
    reason: getValue("--reason", ""),
  };
  if (write) {
    atomicWriteJson(files.state, next);
  }
  output(
    { ok: true, wrote: write, state: next },
    `${write ? "Updated" : "Would update"} visible dispatch mode to ${next.mode}.`,
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
    "无人值守接续规则：",
    `1. 完成当前任务后运行：${finishCommand}`,
    "2. 若 finish JSON 返回 `chain.nextAction === \"noReturn\"`，说明本批次还有其它窗口未完成；不得创建任何下一跳或总控回跳。",
    "3. 只在 finish JSON 返回 `chain.nextAction === \"armNext\"`、`chain.handoffPolicy === \"target-courier\"`、`chain.payload.courierAllowed === true` 时，才用 `codex_app.automation_update` 按 payload 创建下一条目标窗口 heartbeat。",
    "4. 只在 finish JSON 返回 `chain.nextAction === \"returnToController\"`、`chain.handoffPolicy === \"controller-return\"`、`chain.payload.controllerReturnAllowed === true` 时，才用 `codex_app.automation_update` 按 payload 创建总控回跳 heartbeat。",
    "5. 创建目标窗口 heartbeat 成功后运行 `chain.recordArmCommand`；创建总控回跳 heartbeat 成功后运行 `chain.recordReturnCommand`。把 `<automation-id>` 替换为返回的 automation id；这只是机械投递，不得代替目标窗口或总控执行任务。",
    "6. 如果 finish JSON 返回 `controllerArm`、`modeDisabled`、`registerWindow`、`registerController`、`wait`、`review`，或没有对应 payload / permission flag，不得创建下一跳 automation，改为报告总控。",
    "7. 下一跳目标是 `AlembicTest` 时默认由总控调起；非 `AlembicTest` 窗口不得处理或代领 `AlembicTest` 任务。",
    `8. 关闭开关是 \`node scripts/visible-dispatch.mjs mode --disable --write\`；heartbeat cadence 固定为 \`${heartbeatRrule}\`，真实窗口跳转是分钟级等待。`,
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
    "",
    "先运行：",
    `node scripts/visible-dispatch.mjs group-status --group ${group.groupId} --json`,
    "node scripts/visible-dispatch.mjs controller-tick --json",
    "",
    "随后按总控原流程独立验收本 group 所有 backfill：区分窗口自述、原始证据和总控裁决；决定接受、驳回、补证、自测、创建真实测试单、进入下一阶段、继续派发下一批或停止等待用户确认。",
    "",
    "不得因为脚本返回 completed 就关闭目标；不得在小修小补上偏离用户最终目标。若 mode 已关闭、确认门禁触发、证据不足、回填冲突或同一问题循环风险出现，停止自动推进并报告。",
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
  const matches = runs.runs.filter(
    (run) => run.automationId === automationId && (!taskId || run.taskId === taskId) && run.status !== "stopped",
  );
  if (matches.length === 0) {
    fail(`No active automation run found for ${automationId}${taskId ? ` / ${taskId}` : ""}.`);
  }

  const stoppedAt = nowIso();
  const reason = getValue("--reason", "");
  const touchedTaskIds = new Set(matches.map((run) => run.taskId));
  for (const run of matches) {
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
  queue.updatedAt = stoppedAt;
  runs.updatedAt = stoppedAt;
  if (write) {
    atomicWriteJson(files.queue, queue);
    atomicWriteJson(files.runs, runs);
  }
  output(
    { ok: true, wrote: write, stoppedAt, stoppedRuns: matches },
    `${write ? "Recorded" : "Would record"} stopped automation ${automationId}.`,
  );
}

function summarizeGroup(group, queue) {
  const groupTasks = queue.tasks.filter((task) => task.groupId === group.groupId);
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
    completedCount: completed.length,
    blockedCount: blocked.length,
    unfinishedCount: unfinished.length,
    terminal: unfinished.length === 0 && taskSummaries.length > 0,
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
    { ok: true, wrote: write, registeredThread: Boolean(threadId), completed: task, chain },
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
  return new Set(registry.windows.filter((entry) => entry.status === "active").map((entry) => entry.windowName));
}

function classifyTaskForTick(task, state, activeWindows, nowMs) {
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
  const { state, registry, queue } = readAll();
  const observedAt = nowIso();
  const nowMs = Date.parse(observedAt);
  const activeWindows = activeWindowSet(registry);
  let changed = false;
  const tasks = queue.tasks.map((task) => {
    const summary = classifyTaskForTick(task, state, activeWindows, nowMs);
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
        ...classifyTaskForTick(task, state, activeWindows, nowMs),
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
    { ok: true, wrote: write, task },
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

  if (write && prunableTasks.length > 0) {
    queue.tasks = queue.tasks.filter((task) => !prunableTaskIds.has(task.taskId));
    queue.updatedAt = nowIso();
    atomicWriteJson(files.queue, queue);
  }
  if (write && prunableRuns.length > 0) {
    runs.runs = runs.runs.filter((run) => !(prunableTaskIds.has(run.taskId) && run.status === "stopped"));
    runs.updatedAt = nowIso();
    atomicWriteJson(files.runs, runs);
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
      `Prunable stopped automation runs: ${prunableRuns.map((run) => run.automationId).join(", ") || "none"}`,
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
