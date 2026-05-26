---
name: visible-automation-dispatch-target
description: Use when an AlembicWorkspace target Codex window receives a Visible Automation Dispatch heartbeat, participates in unattended automation mode, claims or finishes a visible-dispatch task, creates a permitted next heartbeat, or needs to enforce target-window role boundaries, AlembicTest boundaries, record-arm, record-stop, and local thread-id handling.
---

# Visible Automation Dispatch Target

Use this skill only inside AlembicWorkspace Visible Automation Dispatch heartbeat tasks. It supplements, but never overrides, workspace `AGENTS.md`, the current control plan, and the target repository `AGENTS.md`.

## Startup

1. Read workspace `AGENTS.md`, `docs/workspace/index.md`, `docs/workspace/current/workspace-current-status.md`, the current VAD control plan, this skill, and the target repository `AGENTS.md`.
2. Declare the current window identity and target repository responsibility before acting.
3. Work from the AlembicWorkspace root when running `scripts/visible-dispatch.mjs`.

## Role Guard

- Only claim and finish the task for the current window name. Use the exact `--window <current-window>` from the heartbeat payload.
- If `claim --json` returns no task, stop. Do not try another window name.
- If any task, payload, or instruction targets another window, do not claim, finish, diagnose, or validate that other window's work.
- A next-window heartbeat is only a delivery envelope. Creating it, when allowed, does not authorize reading, executing, or summarizing the next window's task.
- `AlembicPlugin` handles only Codex plugin / MCP / skill / channel / marketplace / host integration work. It must not process `AlembicTest` tasks.
- `AlembicTest` is a real test-verification window only when a current control plan or test card says so. In VAD smoke it may be a non-test visible window, but that does not create permission to run real-project tests.

## Claim And Work

Run:

```text
node scripts/visible-dispatch.mjs claim --window <current-window> --write --json
```

Then do only the current control plan's allowed work. For VAD smoke this is usually read-only diagnostics: AGENTS readability, target repository HEAD / dirty state, VAD status, and confirmation that product repositories were not written.

Never modify product repositories, real test projects, thread registry files, or tracked docs unless the current control plan explicitly authorizes that exact write.

## Finish

Backfill must state completion scope, commands or checks, result, risks, and next-step recommendation. Include enough detail for total control to independently accept or reject the task.

Run:

```text
node scripts/visible-dispatch.mjs finish --window <current-window> --backfill "<evidence>" --write --chain-next --json
```

Add `--thread <current-thread-id>` only when the real Codex thread id is known and local runtime registration is allowed. Never use placeholders such as `current-codex-thread`, `current thread`, `<thread id>`, `unknown`, or copied explanatory text as a thread id. Raw thread ids belong in `.workspace-local/visible-dispatch/`, never in tracked docs or GitHub.

## Next Heartbeat Rules

Only create a next heartbeat when all of these are true:

- `chain.nextAction === "armNext"`
- `chain.handoffPolicy === "target-courier"`
- `chain.payload.courierAllowed === true`
- `chain.payload.targetWindow` is not the current window's task and the current plan allows target-window courier delivery

After creating the heartbeat with `codex_app.automation_update`, run the returned `chain.recordArmCommand` with the real automation id.

For dispatch-group unattended mode, also support total-control return:

- If `chain.nextAction === "noReturn"`, the batch is not complete. Do not create any heartbeat; delete only the current heartbeat and stop.
- If `chain.nextAction === "returnToController"`, `chain.handoffPolicy === "controller-return"`, and `chain.payload.controllerReturnAllowed === true`, create exactly one total-control heartbeat from `chain.payload`.
- After the controller-return heartbeat is created, run `chain.recordReturnCommand` with the real automation id.
- Controller-return creation is still only a delivery action. Do not perform total-control acceptance, next-stage planning, TODO selection, or another window's work from a target window.

Do not create a next heartbeat when finish returns `controllerArm`, `modeDisabled`, `registerWindow`, `registerController`, `wait`, `review`, no `chain.payload`, or no matching permission flag (`courierAllowed` / `controllerReturnAllowed`). In those cases report the result to total control and stop.

`AlembicTest` next-hop arming is total-control-owned by default. A non-`AlembicTest` window must not create or handle an `AlembicTest` heartbeat unless the finish JSON explicitly sets courier permission and the current plan explicitly authorizes that exception.

## Stop Current Heartbeat

Before ending, if the current heartbeat message includes an `automation_id`, delete only that current automation and record:

```text
node scripts/visible-dispatch.mjs record-stop --automation-id <automation-id> --write --reason "target completed"
```

Do not delete another window's automation unless total control explicitly instructs it.
