#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const workspaceRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const script = path.join(workspaceRoot, "scripts/visible-dispatch.mjs");
const visibleWindows = [
  "Alembic",
  "AlembicCore",
  "AlembicAgent",
  "AlembicDashboard",
  "AlembicPlugin",
  "AlembicTest",
];

function writeFile(file, content) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${content.trimEnd()}\n`);
}

function makeFixture({
  planStatus = "待启动",
  alembicStatus = "待启动",
  alembicTask = "Fixture task",
  sendTo = "`Alembic`",
  globalTodoRows = "",
} = {}) {
  const root = mkdtempSync(path.join(os.tmpdir(), "visible-dispatch-"));
  writeFile(path.join(root, "AGENTS.md"), "# Fixture\n");
  writeFile(
    path.join(root, "docs/workspace/index.md"),
    `
# Workspace Index

## 当前总控入口

| 类型 | 文档 | 状态 | 说明 |
| --- | --- | --- | --- |
| 当前计划 | [current/plan.md](current/plan.md) | ${planStatus} | Fixture |
`,
  );
  writeFile(
    path.join(root, "docs/workspace/current/plan.md"),
    `
# Fixture Plan

状态：${planStatus}

## 窗口分派

发送给：${sendTo}

| 窗口 / 状态 | 任务 |
| --- | --- |
| \`Alembic\`<br>${alembicStatus} | ${alembicTask} |
| \`AlembicCore\`<br>观察中 | Wait |
| \`AlembicAgent\`<br>无任务 | None |
| \`AlembicDashboard\`<br>无任务 | None |
| \`AlembicPlugin\`<br>无任务 | None |
| \`AlembicTest\`<br>无任务 | None |
| \`BiliDili\`<br>无任务 | None |
`,
  );
  writeFile(
    path.join(root, "docs/workspace/current/global-todo-board.md"),
    `
# Fixture Global TODO

## 全局 TODO

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 | 当前挂载 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${globalTodoRows}
`,
  );
  return root;
}

function writeFullWindowPlan(root, { planFile, round, planStatus = "待启动" }) {
  writeFile(
    path.join(root, "docs/workspace/index.md"),
    `
# Workspace Index

## 当前总控入口

| 类型 | 文档 | 状态 | 说明 |
| --- | --- | --- | --- |
| 当前计划 | [current/${planFile}](current/${planFile}) | ${planStatus} | Fake TODO round ${round} |
`,
  );
  writeFile(
    path.join(root, `docs/workspace/current/${planFile}`),
    `
# Fake TODO Round ${round}

状态：${planStatus}

## 窗口分派

发送给：${visibleWindows.map((windowName) => `\`${windowName}\``).join("、")}

| 窗口 / 状态 | 任务 |
| --- | --- |
${visibleWindows.map((windowName) => `| \`${windowName}\`<br>待启动 | Fake TODO round ${round} for ${windowName} |`).join("\n")}
| \`BiliDili\`<br>无任务 | None |
`,
  );
  writeFile(
    path.join(root, "docs/workspace/current/global-todo-board.md"),
    `
# Fixture Global TODO

## 全局 TODO

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 | 当前挂载 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GTODO-FAKE-${round} | 待排期 | fake visible dispatch | P0 | \`AlembicWorkspace\` | Fake TODO round ${round} | 是 | fixture | \`AlembicWorkspace\` | ${planFile} |
`,
  );
}

function writeTwoWindowPlan(root, { planFile = "batch-return-plan.md", planStatus = "待启动" } = {}) {
  writeFile(
    path.join(root, "docs/workspace/index.md"),
    `
# Workspace Index

## 当前总控入口

| 类型 | 文档 | 状态 | 说明 |
| --- | --- | --- | --- |
| 当前计划 | [current/${planFile}](current/${planFile}) | ${planStatus} | Batch return fixture |
`,
  );
  writeFile(
    path.join(root, `docs/workspace/current/${planFile}`),
    `
# Batch Return Plan

状态：${planStatus}

## 窗口分派

发送给：\`Alembic\`、\`AlembicCore\`

| 窗口 / 状态 | 任务 |
| --- | --- |
| \`Alembic\`<br>待启动 | Batch task for Alembic |
| \`AlembicCore\`<br>待启动 | Batch task for AlembicCore |
| \`AlembicAgent\`<br>无任务 | None |
| \`AlembicDashboard\`<br>无任务 | None |
| \`AlembicPlugin\`<br>无任务 | None |
| \`AlembicTest\`<br>无任务 | None |
| \`BiliDili\`<br>无任务 | None |
`,
  );
  writeFile(
    path.join(root, "docs/workspace/current/global-todo-board.md"),
    `
# Fixture Global TODO

## 全局 TODO

| ID | 状态 | 类型 | 优先级 | 归属 | 事项 / 目标 | 影响复测 / 派发 | 依赖 / 触发 | 推荐窗口 | 当前挂载 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
`,
  );
}

function run(root, args) {
  return spawnSync("node", [script, ...args, "--root", root], {
    cwd: root,
    encoding: "utf8",
  });
}

function readJson(root, relative) {
  return JSON.parse(readFileSync(path.join(root, relative), "utf8"));
}

function writeJson(root, relative, value) {
  writeFile(path.join(root, relative), JSON.stringify(value, null, 2));
}

test("status is read-only and defaults to disabled mode", () => {
  const root = makeFixture();
  const result = run(root, ["status", "--json"]);
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.mode, "disabled");
  assert.equal(parsed.registeredWindows, 0);
});

test("mode changes require explicit write", () => {
  const root = makeFixture();
  const dryRun = run(root, ["mode", "--enable", "--json"]);
  assert.equal(dryRun.status, 0, dryRun.stderr);
  assert.equal(JSON.parse(dryRun.stdout).wrote, false);

  const written = run(root, ["mode", "--enable", "--write", "--json"]);
  assert.equal(written.status, 0, written.stderr);
  assert.equal(JSON.parse(written.stdout).state.mode, "enabled");
  assert.equal(readJson(root, ".workspace-local/visible-dispatch/state.json").mode, "enabled");
});

test("registry rejects non-Alembic target windows", () => {
  const root = makeFixture();
  const result = run(root, ["register", "--window", "BiliDili", "--thread", "thread-1", "--write"]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unsupported visible dispatch window/);
});

test("register stores thread ids locally without echoing them in JSON output", () => {
  const root = makeFixture();
  const result = run(root, [
    "register",
    "--window",
    "Alembic",
    "--thread",
    "thread-visible-secret",
    "--write",
    "--json",
  ]);
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.entry.threadId, "<local-only>");
  assert.equal(parsed.storedThreadId, "local-only");

  const registry = readJson(root, ".workspace-local/visible-dispatch/window-registry.json");
  assert.equal(registry.windows[0].threadId, "thread-visible-secret");
});

test("register rejects placeholder thread ids and unregister removes polluted entries", () => {
  const root = makeFixture();
  const invalid = run(root, [
    "register",
    "--window",
    "AlembicTest",
    "--thread",
    "current-codex-thread",
    "--write",
    "--json",
  ]);
  assert.notEqual(invalid.status, 0);
  assert.match(JSON.parse(invalid.stdout).error, /Invalid visible dispatch thread id placeholder/);

  const valid = run(root, ["register", "--window", "AlembicTest", "--thread", "thread-valid-test", "--write", "--json"]);
  assert.equal(valid.status, 0, valid.stderr);
  const removed = run(root, ["unregister", "--window", "AlembicTest", "--write", "--json"]);
  assert.equal(removed.status, 0, removed.stderr);
  assert.equal(JSON.parse(removed.stdout).removed, 1);
  assert.equal(readJson(root, ".workspace-local/visible-dispatch/window-registry.json").windows.length, 0);
});

test("enqueue from current plan creates only send-eligible Alembic tasks", () => {
  const root = makeFixture();
  const result = run(root, ["enqueue", "--from-plan", "--write", "--json"]);
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.created.length, 1);
  assert.equal(parsed.created[0].targetWindow, "Alembic");
  const queue = readJson(root, ".workspace-local/visible-dispatch/dispatch-queue.json");
  assert.equal(queue.tasks.length, 1);
});

test("claim leases one task and prevents duplicate active claims", () => {
  const root = makeFixture();
  run(root, ["enqueue", "--from-plan", "--write"]);

  const first = run(root, ["claim", "--window", "Alembic", "--write", "--json"]);
  assert.equal(first.status, 0, first.stderr);
  assert.equal(JSON.parse(first.stdout).claimed.status, "claimed");

  const second = run(root, ["claim", "--window", "Alembic", "--write", "--json"]);
  assert.equal(second.status, 0, second.stderr);
  assert.equal(JSON.parse(second.stdout).claimed, null);
});

test("arm outputs a heartbeat payload without calling automation APIs", () => {
  const root = makeFixture();
  run(root, ["mode", "--enable", "--write"]);
  run(root, ["register", "--window", "Alembic", "--thread", "thread-visible-1", "--write"]);
  run(root, ["enqueue", "--from-plan", "--write"]);

  const queue = readJson(root, ".workspace-local/visible-dispatch/dispatch-queue.json");
  const result = run(root, ["arm", "--task", queue.tasks[0].taskId, "--json"]);
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.payload.kind, "heartbeat");
  assert.equal(parsed.payload.targetThreadId, "thread-visible-1");
  assert.equal(parsed.payload.rrule, "FREQ=MINUTELY;INTERVAL=1");
  assert.equal(parsed.payload.chainMode, "finish-chain");
  assert.match(parsed.payload.prompt, /claim --window Alembic --write/);
  assert.match(parsed.payload.prompt, /finish --window Alembic/);
  assert.match(parsed.payload.prompt, /visible-automation-dispatch-target\/SKILL\.md/);
  assert.match(parsed.payload.prompt, /targetWindow=Alembic/);
  assert.match(parsed.payload.prompt, /courierAllowed === true/);
  assert.match(parsed.payload.prompt, /codex_app\.automation_update/);
  assert.match(parsed.payload.prompt, /recordArmCommand/);
  assert.match(parsed.payload.prompt, /mode --disable --write/);
});

test("arm-batch prepares payloads for every queued task in a dispatch group", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "visible-dispatch-arm-batch-"));
  writeFile(path.join(root, "AGENTS.md"), "# Fixture\n");
  writeTwoWindowPlan(root);
  run(root, ["mode", "--enable", "--write"]);
  run(root, ["register", "--window", "Alembic", "--thread", "thread-Alembic", "--write"]);
  run(root, ["register", "--window", "AlembicCore", "--thread", "thread-AlembicCore", "--write"]);

  const enqueued = run(root, [
    "enqueue",
    "--from-plan",
    "--group",
    "batch-1",
    "--return-policy",
    "controller-last",
    "--write",
    "--json",
  ]);
  assert.equal(enqueued.status, 0, enqueued.stderr);
  assert.equal(JSON.parse(enqueued.stdout).groupId, "batch-1");

  const result = run(root, ["arm-batch", "--group", "batch-1", "--json"]);
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.payloads.length, 2);
  assert.deepEqual(
    parsed.payloads.map((item) => item.targetWindow).sort(),
    ["Alembic", "AlembicCore"],
  );
  assert.equal(parsed.payloads.every((item) => item.payload.chainMode === "finish-chain"), true);
  assert.match(parsed.payloads[0].payload.prompt, /returnToController/);
});

test("record-arm persists automation id and prevents duplicate arming", () => {
  const root = makeFixture();
  run(root, ["enqueue", "--from-plan", "--write"]);
  const taskId = readJson(root, ".workspace-local/visible-dispatch/dispatch-queue.json").tasks[0].taskId;

  const recorded = run(root, ["record-arm", "--task", taskId, "--automation-id", "auto-1", "--write", "--json"]);
  assert.equal(recorded.status, 0, recorded.stderr);
  const parsed = JSON.parse(recorded.stdout);
  assert.equal(parsed.task.status, "armed");
  assert.equal(parsed.task.automationId, "auto-1");
  assert.equal(parsed.run.automationId, "auto-1");

  const queue = readJson(root, ".workspace-local/visible-dispatch/dispatch-queue.json");
  const runs = readJson(root, ".workspace-local/visible-dispatch/automation-runs.json");
  assert.equal(queue.tasks[0].status, "armed");
  assert.equal(runs.runs.length, 1);

  const duplicate = run(root, ["record-arm", "--task", taskId, "--automation-id", "auto-1", "--write", "--json"]);
  assert.notEqual(duplicate.status, 0);
  assert.match(duplicate.stdout, /only queued\/claimed tasks can record arming|already recorded/);
});

test("record-stop marks automation runs stopped and removes cleanup noise", () => {
  const root = makeFixture();
  run(root, ["mode", "--enable", "--write"]);
  run(root, ["enqueue", "--from-plan", "--write"]);
  const taskId = readJson(root, ".workspace-local/visible-dispatch/dispatch-queue.json").tasks[0].taskId;
  run(root, ["record-arm", "--task", taskId, "--automation-id", "auto-1", "--write"]);

  const before = run(root, ["cleanup", "--json"]);
  assert.equal(before.status, 0, before.stderr);
  assert.equal(JSON.parse(before.stdout).activeAutomationRuns.length, 1);

  const stopped = run(root, [
    "record-stop",
    "--automation-id",
    "auto-1",
    "--reason",
    "deleted after validation",
    "--write",
    "--json",
  ]);
  assert.equal(stopped.status, 0, stopped.stderr);
  assert.equal(JSON.parse(stopped.stdout).stoppedRuns[0].status, "stopped");

  const runs = readJson(root, ".workspace-local/visible-dispatch/automation-runs.json");
  assert.equal(runs.runs[0].status, "stopped");
  assert.equal(runs.runs[0].previousStatus, "active");
  const queue = readJson(root, ".workspace-local/visible-dispatch/dispatch-queue.json");
  assert.equal(queue.tasks[0].automationStoppedAt.length > 0, true);

  run(root, ["mode", "--disable", "--write"]);
  const after = run(root, ["cleanup", "--json"]);
  assert.equal(after.status, 0, after.stderr);
  const afterParsed = JSON.parse(after.stdout);
  assert.equal(afterParsed.activeAutomationRuns.length, 0);
  assert.deepEqual(afterParsed.stoppedAutomationTasks, [taskId]);

  const tick = run(root, ["tick", "--json"]);
  assert.equal(tick.status, 0, tick.stderr);
  assert.equal(JSON.parse(tick.stdout).tasks[0].nextAction, "reviewStopped");
});

test("block records automation failure as a task blocker", () => {
  const root = makeFixture();
  run(root, ["enqueue", "--from-plan", "--write"]);
  const taskId = readJson(root, ".workspace-local/visible-dispatch/dispatch-queue.json").tasks[0].taskId;

  const blocked = run(root, [
    "block",
    "--task",
    taskId,
    "--reason",
    "heartbeat did not claim",
    "--write",
    "--json",
  ]);
  assert.equal(blocked.status, 0, blocked.stderr);
  const parsed = JSON.parse(blocked.stdout);
  assert.equal(parsed.blocked.status, "blocked");
  assert.equal(parsed.blocked.previousStatus, "queued");
  assert.equal(parsed.blocked.blockedReason, "heartbeat did not claim");

  const tick = run(root, ["tick", "--json"]);
  assert.equal(tick.status, 0, tick.stderr);
  assert.equal(JSON.parse(tick.stdout).tasks[0].nextAction, "resolveBlocker");
});

test("armed tasks wait for target claim and can be claimed", () => {
  const root = makeFixture();
  run(root, ["mode", "--enable", "--write"]);
  run(root, ["register", "--window", "Alembic", "--thread", "thread-visible-1", "--write"]);
  run(root, ["enqueue", "--from-plan", "--write"]);
  const taskId = readJson(root, ".workspace-local/visible-dispatch/dispatch-queue.json").tasks[0].taskId;
  run(root, ["record-arm", "--task", taskId, "--automation-id", "auto-1", "--write"]);

  const tick = run(root, ["tick", "--json"]);
  assert.equal(tick.status, 0, tick.stderr);
  const tickParsed = JSON.parse(tick.stdout);
  assert.equal(tickParsed.topAction, "wait");
  assert.equal(tickParsed.tasks[0].nextAction, "waitForClaim");

  const claimed = run(root, ["claim", "--window", "Alembic", "--write", "--json"]);
  assert.equal(claimed.status, 0, claimed.stderr);
  assert.equal(JSON.parse(claimed.stdout).claimed.status, "claimed");
  assert.equal(readJson(root, ".workspace-local/visible-dispatch/dispatch-queue.json").tasks[0].automationClaimedAt.length > 0, true);
});

test("tick write marks expired armed tasks as stale", () => {
  const root = makeFixture();
  run(root, ["mode", "--enable", "--write"]);
  run(root, ["enqueue", "--from-plan", "--write"]);
  const queue = readJson(root, ".workspace-local/visible-dispatch/dispatch-queue.json");
  queue.tasks[0].status = "armed";
  queue.tasks[0].automationId = "auto-1";
  queue.tasks[0].armLeaseUntil = "2000-01-01T00:00:00.000Z";
  writeJson(root, ".workspace-local/visible-dispatch/dispatch-queue.json", queue);

  const result = run(root, ["tick", "--write", "--json"]);
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.wrote, true);
  assert.equal(parsed.tasks[0].status, "stale");
  assert.equal(readJson(root, ".workspace-local/visible-dispatch/dispatch-queue.json").tasks[0].previousStatus, "armed");
});

test("tick reports stopped mode without mutating state", () => {
  const root = makeFixture();
  const result = run(root, ["tick", "--json"]);
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.mode, "disabled");
  assert.equal(parsed.topAction, "stopped");
  assert.equal(parsed.tasks.length, 0);
});

test("tick reports queued tasks as ready to arm when enabled and registered", () => {
  const root = makeFixture();
  run(root, ["mode", "--enable", "--write"]);
  run(root, ["register", "--window", "Alembic", "--thread", "thread-visible-1", "--write"]);
  run(root, ["enqueue", "--from-plan", "--write"]);

  const result = run(root, ["tick", "--json"]);
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.topAction, "arm");
  assert.equal(parsed.tasks[0].nextAction, "arm");
});

test("controller and tick wait for active automation before arming more queued tasks", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "visible-dispatch-wait-before-arm-"));
  writeFile(path.join(root, "AGENTS.md"), "# Fixture\n");
  writeFullWindowPlan(root, { planFile: "fake-todo-round-wait.md", round: "wait" });
  run(root, ["mode", "--enable", "--write"]);
  for (const windowName of visibleWindows) {
    const registered = run(root, [
      "register",
      "--window",
      windowName,
      "--thread",
      `thread-${windowName}`,
      "--write",
      "--json",
    ]);
    assert.equal(registered.status, 0, registered.stderr);
  }
  run(root, ["enqueue", "--from-plan", "--write"]);

  const queue = readJson(root, ".workspace-local/visible-dispatch/dispatch-queue.json");
  const firstTask = queue.tasks.find((task) => task.targetWindow === "Alembic");
  assert.ok(firstTask);
  const armed = run(root, ["arm", "--task", firstTask.taskId, "--json"]);
  assert.equal(armed.status, 0, armed.stderr);
  const recorded = run(root, [
    "record-arm",
    "--task",
    firstTask.taskId,
    "--automation-id",
    "auto-wait-before-arm",
    "--write",
    "--json",
  ]);
  assert.equal(recorded.status, 0, recorded.stderr);

  const tick = run(root, ["tick", "--json"]);
  assert.equal(tick.status, 0, tick.stderr);
  const tickParsed = JSON.parse(tick.stdout);
  assert.equal(tickParsed.topAction, "wait");
  assert.equal(tickParsed.tasks.some((task) => task.nextAction === "arm"), true);
  assert.equal(tickParsed.tasks.some((task) => task.waitState === "waiting"), true);

  const controller = run(root, ["controller-tick", "--json"]);
  assert.equal(controller.status, 0, controller.stderr);
  const controllerParsed = JSON.parse(controller.stdout);
  assert.equal(controllerParsed.topAction, "wait");
  assert.equal(controllerParsed.nextAction, "waitForBackfill");
});

test("controller-tick stops cleanly when automation mode is disabled", () => {
  const root = makeFixture();
  const result = run(root, ["controller-tick", "--json"]);
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.mode, "disabled");
  assert.equal(parsed.topAction, "stopped");
  assert.equal(parsed.nextAction, "modeDisabled");
});

test("controller-tick enqueues send-eligible current-plan tasks before TODO work", () => {
  const root = makeFixture({
    globalTodoRows:
      "| GTODO-1 | 待排期 | feature | P0 | `AlembicWorkspace` | Candidate | 是 | 无 | `AlembicWorkspace` | board |",
  });
  run(root, ["mode", "--enable", "--write"]);

  const result = run(root, ["controller-tick", "--json"]);
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.topAction, "enqueue");
  assert.equal(parsed.nextAction, "enqueueCurrentPlan");
  assert.equal(parsed.sendEligibleWindows[0].window, "Alembic");
  assert.match(parsed.suggestedCommand, /enqueue --from-plan --write/);
});

test("controller-tick stops at blocked current-plan decision gates", () => {
  const root = makeFixture({
    planStatus: "Wave 4 阻塞",
    alembicStatus: "观察中",
    sendTo: "无",
  });
  run(root, ["mode", "--enable", "--write"]);

  const result = run(root, ["controller-tick", "--json"]);
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.topAction, "decision");
  assert.equal(parsed.nextAction, "resolveCurrentPlan");
});

test("controller-tick selects the top TODO candidate only after the current plan is clear", () => {
  const root = makeFixture({
    planStatus: "已完成",
    alembicStatus: "无任务",
    sendTo: "无",
    globalTodoRows: [
      "| GTODO-2 | 待排期 | feature | P1 | `AlembicWorkspace` | Later | 是 | 无 | `AlembicWorkspace` | board |",
      "| GTODO-1 | 待排期 | feature | P0 | `AlembicWorkspace` | First | 是 | 无 | `AlembicWorkspace` | board |",
    ].join("\n"),
  });
  run(root, ["mode", "--enable", "--write"]);

  const result = run(root, ["controller-tick", "--json"]);
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.topAction, "mainlineCandidate");
  assert.equal(parsed.nextAction, "reviewTodoCandidate");
  assert.equal(parsed.candidate.id, "GTODO-1");
});

test("controller-tick reports but does not block on historic resolved tasks from old plans", () => {
  const root = makeFixture({
    planStatus: "已完成",
    alembicStatus: "无任务",
    sendTo: "无",
    globalTodoRows:
      "| GTODO-1 | 待排期 | feature | P0 | `AlembicWorkspace` | First | 是 | 无 | `AlembicWorkspace` | board |",
  });
  run(root, ["mode", "--enable", "--write"]);
  writeJson(root, ".workspace-local/visible-dispatch/dispatch-queue.json", {
    version: 1,
    tasks: [
      {
        taskId: "old-plan__AlembicTest",
        targetWindow: "AlembicTest",
        status: "blocked",
        controlDoc: "docs/workspace/current/old-plan.md",
        blockedReason: "old heartbeat did not claim",
      },
    ],
  });

  const result = run(root, ["controller-tick", "--json"]);
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.topAction, "mainlineCandidate");
  assert.equal(parsed.queueDecision.ignoredHistoricTasks[0].taskId, "old-plan__AlembicTest");
});

test("prune-history removes old terminal tasks without touching current or active history", () => {
  const root = makeFixture({
    planStatus: "已完成",
    alembicStatus: "无任务",
    sendTo: "无",
  });
  writeJson(root, ".workspace-local/visible-dispatch/dispatch-queue.json", {
    version: 1,
    tasks: [
      {
        taskId: "old-blocked__AlembicTest",
        targetWindow: "AlembicTest",
        status: "blocked",
        controlDoc: "docs/workspace/current/old-plan.md",
        automationId: "auto-old-blocked",
      },
      {
        taskId: "old-accepted__Alembic",
        targetWindow: "Alembic",
        status: "accepted",
        controlDoc: "docs/workspace/current/older-plan.md",
      },
      {
        taskId: "old-active__AlembicCore",
        targetWindow: "AlembicCore",
        status: "blocked",
        controlDoc: "docs/workspace/current/old-plan.md",
        automationId: "auto-old-active",
      },
      {
        taskId: "plan__Alembic",
        targetWindow: "Alembic",
        status: "blocked",
        controlDoc: "docs/workspace/current/plan.md",
      },
      {
        taskId: "old-completed__AlembicDashboard",
        targetWindow: "AlembicDashboard",
        status: "completed",
        controlDoc: "docs/workspace/current/old-plan.md",
      },
    ],
  });
  writeJson(root, ".workspace-local/visible-dispatch/automation-runs.json", {
    version: 1,
    runs: [
      {
        runId: "old-blocked__auto-old-blocked",
        taskId: "old-blocked__AlembicTest",
        targetWindow: "AlembicTest",
        automationId: "auto-old-blocked",
        status: "stopped",
      },
      {
        runId: "old-active__auto-old-active",
        taskId: "old-active__AlembicCore",
        targetWindow: "AlembicCore",
        automationId: "auto-old-active",
        status: "active",
      },
    ],
  });

  const dryRun = run(root, ["prune-history", "--json"]);
  assert.equal(dryRun.status, 0, dryRun.stderr);
  const dryParsed = JSON.parse(dryRun.stdout);
  assert.equal(dryParsed.wrote, false);
  assert.deepEqual(
    dryParsed.prunedTasks.map((task) => task.taskId),
    ["old-blocked__AlembicTest", "old-accepted__Alembic"],
  );
  assert.deepEqual(dryParsed.skippedHistoricActiveTasks.map((task) => task.taskId), ["old-active__AlembicCore"]);
  assert.equal(readJson(root, ".workspace-local/visible-dispatch/dispatch-queue.json").tasks.length, 5);

  const written = run(root, ["prune-history", "--write", "--json"]);
  assert.equal(written.status, 0, written.stderr);
  const parsed = JSON.parse(written.stdout);
  assert.equal(parsed.wrote, true);
  assert.deepEqual(
    parsed.prunedStoppedAutomationRuns.map((run) => run.automationId),
    ["auto-old-blocked"],
  );

  const queue = readJson(root, ".workspace-local/visible-dispatch/dispatch-queue.json");
  assert.deepEqual(
    queue.tasks.map((task) => task.taskId),
    ["old-active__AlembicCore", "plan__Alembic", "old-completed__AlembicDashboard"],
  );
  const runs = readJson(root, ".workspace-local/visible-dispatch/automation-runs.json");
  assert.deepEqual(runs.runs.map((run) => run.runId), ["old-active__auto-old-active"]);
});

test("finish registers the current thread, completes evidence, and prepares the next wake payload", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "visible-dispatch-finish-"));
  writeFile(path.join(root, "AGENTS.md"), "# Fixture\n");
  writeFullWindowPlan(root, { planFile: "fake-todo-round-1.md", round: 1 });
  run(root, ["mode", "--enable", "--write"]);
  run(root, ["register", "--window", "AlembicCore", "--thread", "thread-AlembicCore", "--write"]);
  run(root, ["enqueue", "--from-plan", "--write"]);

  const claimed = run(root, ["claim", "--window", "Alembic", "--write", "--json"]);
  assert.equal(claimed.status, 0, claimed.stderr);
  assert.equal(JSON.parse(claimed.stdout).claimed.taskId, "fake-todo-round-1__Alembic");

  const finished = run(root, [
    "finish",
    "--window",
    "Alembic",
    "--thread",
    "thread-Alembic",
    "--backfill",
    "commit abc; npm test passed",
    "--chain-next",
    "--write",
    "--json",
  ]);
  assert.equal(finished.status, 0, finished.stderr);
  const parsed = JSON.parse(finished.stdout);
  assert.equal(parsed.completed.status, "completed");
  assert.equal(parsed.completed.previousStatus, "claimed");
  assert.equal(parsed.completed.completedByThreadId, "thread-Alembic");
  assert.equal(parsed.chain.nextAction, "armNext");
  assert.equal(parsed.chain.handoffPolicy, "target-courier");
  assert.equal(parsed.chain.payload.targetThreadId, "thread-AlembicCore");
  assert.equal(parsed.chain.payload.taskId, "fake-todo-round-1__AlembicCore");
  assert.equal(parsed.chain.payload.courierAllowed, true);
  assert.match(parsed.chain.recordArmCommand, /record-arm --task fake-todo-round-1__AlembicCore/);

  const registry = readJson(root, ".workspace-local/visible-dispatch/window-registry.json");
  assert.equal(registry.windows.find((entry) => entry.windowName === "Alembic").threadId, "thread-Alembic");
  const queue = readJson(root, ".workspace-local/visible-dispatch/dispatch-queue.json");
  assert.equal(queue.tasks.find((task) => task.taskId === "fake-todo-round-1__Alembic").status, "completed");
});

test("controller-last dispatch group returns to total control only after the final target finishes", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "visible-dispatch-controller-last-"));
  writeFile(path.join(root, "AGENTS.md"), "# Fixture\n");
  writeTwoWindowPlan(root);
  run(root, ["mode", "--enable", "--write"]);
  run(root, ["register", "--window", "AlembicWorkspace", "--thread", "thread-controller", "--write"]);
  run(root, [
    "enqueue",
    "--from-plan",
    "--group",
    "batch-return",
    "--return-policy",
    "controller-last",
    "--write",
    "--json",
  ]);

  run(root, ["claim", "--window", "Alembic", "--write"]);
  const firstFinish = run(root, [
    "finish",
    "--window",
    "Alembic",
    "--backfill",
    "Alembic evidence complete",
    "--chain-next",
    "--write",
    "--json",
  ]);
  assert.equal(firstFinish.status, 0, firstFinish.stderr);
  const firstParsed = JSON.parse(firstFinish.stdout);
  assert.equal(firstParsed.chain.nextAction, "noReturn");
  assert.equal(firstParsed.chain.handoffPolicy, "controller-last");
  assert.equal(firstParsed.chain.group.unfinishedCount, 1);
  assert.equal(firstParsed.chain.payload, undefined);

  run(root, ["claim", "--window", "AlembicCore", "--write"]);
  const secondFinish = run(root, [
    "finish",
    "--window",
    "AlembicCore",
    "--backfill",
    "AlembicCore evidence complete",
    "--chain-next",
    "--write",
    "--json",
  ]);
  assert.equal(secondFinish.status, 0, secondFinish.stderr);
  const secondParsed = JSON.parse(secondFinish.stdout);
  assert.equal(secondParsed.chain.nextAction, "returnToController");
  assert.equal(secondParsed.chain.handoffPolicy, "controller-return");
  assert.equal(secondParsed.chain.payload.targetWindow, "AlembicWorkspace");
  assert.equal(secondParsed.chain.payload.targetThreadId, "thread-controller");
  assert.equal(secondParsed.chain.payload.controllerReturnAllowed, true);
  assert.match(secondParsed.chain.recordReturnCommand, /record-return --group batch-return/);

  const recorded = run(root, [
    "record-return",
    "--group",
    "batch-return",
    "--automation-id",
    "controller-return-1",
    "--write",
    "--json",
  ]);
  assert.equal(recorded.status, 0, recorded.stderr);
  const groupStatus = run(root, ["group-status", "--group", "batch-return", "--json"]);
  assert.equal(groupStatus.status, 0, groupStatus.stderr);
  const statusParsed = JSON.parse(groupStatus.stdout);
  assert.equal(statusParsed.group.terminal, true);
  assert.equal(statusParsed.group.completedCount, 2);
  const runs = readJson(root, ".workspace-local/visible-dispatch/automation-runs.json");
  assert.equal(runs.runs.some((run) => run.runType === "controller-return"), true);
});

test("finish rejects placeholder thread registration", () => {
  const root = makeFixture();
  writeFullWindowPlan(root, { planFile: "fake-todo-round-1.md", round: 1 });
  run(root, ["mode", "--enable", "--write"]);
  run(root, ["enqueue", "--from-plan", "--write"]);
  run(root, ["claim", "--window", "Alembic", "--write"]);

  const finished = run(root, [
    "finish",
    "--window",
    "Alembic",
    "--thread",
    "<thread id>",
    "--backfill",
    "should fail before registry write",
    "--write",
    "--json",
  ]);
  assert.notEqual(finished.status, 0);
  assert.match(JSON.parse(finished.stdout).error, /Invalid visible dispatch thread id placeholder/);
});

test("finish leaves AlembicTest next-hop arming to total control", () => {
  const root = makeFixture();
  writeFullWindowPlan(root, { planFile: "fake-todo-round-1.md", round: 1 });
  run(root, ["mode", "--enable", "--write"]);
  run(root, ["register", "--window", "AlembicTest", "--thread", "thread-AlembicTest", "--write"]);
  run(root, ["enqueue", "--from-plan", "--write"]);

  const queue = readJson(root, ".workspace-local/visible-dispatch/dispatch-queue.json");
  for (const task of queue.tasks) {
    if (["Alembic", "AlembicCore", "AlembicAgent", "AlembicDashboard"].includes(task.targetWindow)) {
      task.status = "completed";
      task.completedAt = "2026-05-26T00:00:00.000Z";
      task.backfill = `${task.targetWindow} completed`;
    }
    if (task.targetWindow === "AlembicPlugin") {
      task.status = "claimed";
    }
  }
  writeJson(root, ".workspace-local/visible-dispatch/dispatch-queue.json", queue);

  const finished = run(root, [
    "finish",
    "--window",
    "AlembicPlugin",
    "--backfill",
    "plugin completed its own target",
    "--chain-next",
    "--write",
    "--json",
  ]);
  assert.equal(finished.status, 0, finished.stderr);
  const parsed = JSON.parse(finished.stdout);
  assert.equal(parsed.chain.nextAction, "controllerArm");
  assert.equal(parsed.chain.handoffPolicy, "total-control-only");
  assert.equal(parsed.chain.targetWindow, "AlembicTest");
  assert.equal(parsed.chain.payload, undefined);
  assert.match(parsed.chain.armCommand, /arm --task fake-todo-round-1__AlembicTest --json/);
  assert.match(parsed.chain.recordArmCommand, /record-arm --task fake-todo-round-1__AlembicTest/);
});

test("finish does not chain when the next queued target has no registered thread", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "visible-dispatch-finish-missing-"));
  writeFile(path.join(root, "AGENTS.md"), "# Fixture\n");
  writeFullWindowPlan(root, { planFile: "fake-todo-round-1.md", round: 1 });
  run(root, ["mode", "--enable", "--write"]);
  run(root, ["enqueue", "--from-plan", "--write"]);
  run(root, ["claim", "--window", "Alembic", "--write"]);

  const finished = run(root, [
    "finish",
    "--window",
    "Alembic",
    "--thread",
    "thread-Alembic",
    "--backfill",
    "done with evidence",
    "--chain-next",
    "--write",
    "--json",
  ]);
  assert.equal(finished.status, 0, finished.stderr);
  const parsed = JSON.parse(finished.stdout);
  assert.equal(parsed.chain.nextAction, "registerWindow");
  assert.equal(parsed.chain.targetWindow, "AlembicCore");
  assert.equal(parsed.chain.payload, undefined);
});

test("finish respects disabled automation mode and refuses next wake payloads", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "visible-dispatch-finish-disabled-"));
  writeFile(path.join(root, "AGENTS.md"), "# Fixture\n");
  writeFullWindowPlan(root, { planFile: "fake-todo-round-1.md", round: 1 });
  run(root, ["register", "--window", "AlembicCore", "--thread", "thread-AlembicCore", "--write"]);
  run(root, ["enqueue", "--from-plan", "--write"]);
  run(root, ["claim", "--window", "Alembic", "--write"]);

  const finished = run(root, [
    "finish",
    "--window",
    "Alembic",
    "--thread",
    "thread-Alembic",
    "--backfill",
    "done while mode disabled",
    "--chain-next",
    "--write",
    "--json",
  ]);
  assert.equal(finished.status, 0, finished.stderr);
  const parsed = JSON.parse(finished.stdout);
  assert.equal(parsed.completed.status, "completed");
  assert.equal(parsed.chain.nextAction, "modeDisabled");
  assert.equal(parsed.chain.payload, undefined);
});

test("disabling mode after a payload is armed drains the current target without chaining", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "visible-dispatch-finish-disable-after-arm-"));
  writeFile(path.join(root, "AGENTS.md"), "# Fixture\n");
  writeFullWindowPlan(root, { planFile: "fake-todo-round-1.md", round: 1 });
  run(root, ["mode", "--enable", "--write"]);
  run(root, ["register", "--window", "Alembic", "--thread", "thread-Alembic", "--write"]);
  run(root, ["register", "--window", "AlembicCore", "--thread", "thread-AlembicCore", "--write"]);
  run(root, ["enqueue", "--from-plan", "--write"]);

  const armed = run(root, ["arm", "--task", "fake-todo-round-1__Alembic", "--json"]);
  assert.equal(armed.status, 0, armed.stderr);
  assert.equal(JSON.parse(armed.stdout).payload.targetThreadId, "thread-Alembic");

  run(root, ["record-arm", "--task", "fake-todo-round-1__Alembic", "--automation-id", "auto-before-disable", "--write"]);
  run(root, ["mode", "--disable", "--write"]);

  const finished = run(root, [
    "finish",
    "--window",
    "Alembic",
    "--thread",
    "thread-Alembic",
    "--backfill",
    "current target completed after disable",
    "--chain-next",
    "--write",
    "--json",
  ]);
  assert.equal(finished.status, 0, finished.stderr);
  const parsed = JSON.parse(finished.stdout);
  assert.equal(parsed.completed.status, "completed");
  assert.equal(parsed.chain.nextAction, "modeDisabled");
  assert.equal(parsed.chain.payload, undefined);
});

test("fake TODO multi-window rounds complete without duplicate enqueue loops", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "visible-dispatch-full-window-"));
  writeFile(path.join(root, "AGENTS.md"), "# Fixture\n");
  run(root, ["mode", "--enable", "--write"]);
  for (const windowName of visibleWindows) {
    const registered = run(root, [
      "register",
      "--window",
      windowName,
      "--thread",
      `thread-${windowName}`,
      "--write",
      "--json",
    ]);
    assert.equal(registered.status, 0, registered.stderr);
  }

  for (let round = 1; round <= 3; round += 1) {
    const planFile = `fake-todo-round-${round}.md`;
    writeFullWindowPlan(root, { planFile, round });

    const before = run(root, ["controller-tick", "--json"]);
    assert.equal(before.status, 0, before.stderr);
    const beforeParsed = JSON.parse(before.stdout);
    assert.equal(beforeParsed.topAction, "enqueue");
    assert.equal(beforeParsed.missingSendEligibleWindows.length, visibleWindows.length);
    assert.equal(beforeParsed.queueDecision.ignoredHistoricTasks.length, (round - 1) * visibleWindows.length);

    const enqueued = run(root, ["enqueue", "--from-plan", "--write", "--json"]);
    assert.equal(enqueued.status, 0, enqueued.stderr);
    assert.equal(JSON.parse(enqueued.stdout).created.length, visibleWindows.length);

    for (const windowName of visibleWindows) {
      const taskId = `fake-todo-round-${round}__${windowName}`;
      const armed = run(root, ["arm", "--task", taskId, "--json"]);
      assert.equal(armed.status, 0, armed.stderr);
      const payload = JSON.parse(armed.stdout).payload;
      assert.equal(payload.targetWindow, windowName);
      assert.equal(payload.targetThreadId, `thread-${windowName}`);

      const recorded = run(root, [
        "record-arm",
        "--task",
        taskId,
        "--automation-id",
        `auto-${round}-${windowName}`,
        "--write",
        "--json",
      ]);
      assert.equal(recorded.status, 0, recorded.stderr);

      const claimed = run(root, ["claim", "--window", windowName, "--write", "--json"]);
      assert.equal(claimed.status, 0, claimed.stderr);
      assert.equal(JSON.parse(claimed.stdout).claimed.taskId, taskId);

      const completed = run(root, [
        "complete",
        "--task",
        taskId,
        "--backfill",
        `fake round ${round} ${windowName} complete`,
        "--write",
        "--json",
      ]);
      assert.equal(completed.status, 0, completed.stderr);

      const accepted = run(root, [
        "accept",
        "--task",
        taskId,
        "--note",
        `fake round ${round} evidence reviewed`,
        "--write",
        "--json",
      ]);
      assert.equal(accepted.status, 0, accepted.stderr);
      assert.equal(JSON.parse(accepted.stdout).task.status, "accepted");
    }

    const after = run(root, ["controller-tick", "--json"]);
    assert.equal(after.status, 0, after.stderr);
    const afterParsed = JSON.parse(after.stdout);
    assert.equal(afterParsed.topAction, "decision");
    assert.equal(afterParsed.nextAction, "closeOrRefreshCurrentPlan");
    assert.equal(afterParsed.missingSendEligibleWindows.length, 0);
  }

  run(root, ["mode", "--disable", "--write"]);
  const queue = readJson(root, ".workspace-local/visible-dispatch/dispatch-queue.json");
  assert.equal(queue.tasks.length, visibleWindows.length * 3);
  assert.equal(queue.tasks.every((task) => task.status === "accepted"), true);
});

test("tick write marks expired active tasks as stale", () => {
  const root = makeFixture();
  run(root, ["enqueue", "--from-plan", "--write"]);
  const queue = readJson(root, ".workspace-local/visible-dispatch/dispatch-queue.json");
  queue.tasks[0].status = "claimed";
  queue.tasks[0].leaseUntil = "2000-01-01T00:00:00.000Z";
  writeJson(root, ".workspace-local/visible-dispatch/dispatch-queue.json", queue);

  const result = run(root, ["tick", "--write", "--json"]);
  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.wrote, true);
  assert.equal(parsed.tasks[0].status, "stale");

  const updated = readJson(root, ".workspace-local/visible-dispatch/dispatch-queue.json");
  assert.equal(updated.tasks[0].status, "stale");
  assert.equal(updated.tasks[0].previousStatus, "claimed");
});

test("completed tasks with backfill can be accepted by total control", () => {
  const root = makeFixture();
  run(root, ["enqueue", "--from-plan", "--write"]);
  const queue = readJson(root, ".workspace-local/visible-dispatch/dispatch-queue.json");
  const taskId = queue.tasks[0].taskId;
  const completed = run(root, ["complete", "--task", taskId, "--backfill", "commit abc; tests passed", "--write", "--json"]);
  assert.equal(completed.status, 0, completed.stderr);

  const tick = run(root, ["tick", "--json"]);
  assert.equal(tick.status, 0, tick.stderr);
  assert.equal(JSON.parse(tick.stdout).tasks[0].nextAction, "acceptanceReview");

  const accepted = run(root, ["accept", "--task", taskId, "--note", "evidence reviewed", "--write", "--json"]);
  assert.equal(accepted.status, 0, accepted.stderr);
  assert.equal(JSON.parse(accepted.stdout).task.status, "accepted");
  assert.equal(readJson(root, ".workspace-local/visible-dispatch/dispatch-queue.json").tasks[0].status, "accepted");
});

test("accept refuses completed tasks without backfill evidence", () => {
  const root = makeFixture();
  run(root, ["enqueue", "--from-plan", "--write"]);
  const queue = readJson(root, ".workspace-local/visible-dispatch/dispatch-queue.json");
  const taskId = queue.tasks[0].taskId;
  run(root, ["complete", "--task", taskId, "--write"]);

  const result = run(root, ["accept", "--task", taskId, "--write", "--json"]);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /no backfill evidence/);
});
