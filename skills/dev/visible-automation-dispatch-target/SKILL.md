---
name: visible-automation-dispatch-target
description: Use when an AlembicWorkspace target Codex window receives a Visible Automation Dispatch heartbeat, participates in unattended automation mode, claims or finishes a visible-dispatch task, creates a permitted next heartbeat, or needs to enforce target-window role boundaries, AlembicTest boundaries, record-arm, record-stop, and local thread-id handling.
---

# Visible Automation Dispatch Target

Use only inside a VAD target heartbeat. Workspace `AGENTS.md`, the current control plan, and the target repository `AGENTS.md` remain higher authority.

## Three Steps

1. **Orient**
   - Read workspace `AGENTS.md`, workspace index/status, current control plan, this skill, and target repository `AGENTS.md`.
   - State current window identity and repository responsibility.

2. **Claim and execute**
   - From AlembicWorkspace root:

```text
node scripts/visible-dispatch.mjs claim --window <current-window> --write --json
```

   - If no task is returned, stop.
   - Do only the claimed task and only within the control plan boundary.
   - Do not touch another window's task, product repo, test project, thread registry, or tracked docs unless this task explicitly authorizes it.

3. **Finish and deliver**
   - Backfill completion scope, commands/checks, results, risks, and next-step recommendation:

```text
node scripts/visible-dispatch.mjs finish --window <current-window> --backfill "<evidence>" --write --chain-next --json
```

   - Add `--thread <real-thread-id>` only if known. Never use placeholders. Raw thread ids stay under `.workspace-local/visible-dispatch/`.

## Delivery Permissions

Creating a heartbeat is only courier delivery; it does not grant permission to do another window's work.

Create a next target heartbeat only if finish JSON says:

- `chain.nextAction === "armNext"`
- `chain.handoffPolicy === "target-courier"`
- `chain.payload.courierAllowed === true`

Create a controller-return heartbeat only if finish JSON says:

- `chain.nextAction === "returnToController"`
- `chain.handoffPolicy === "controller-return"`
- `chain.payload.controllerReturnAllowed === true`

After creating any heartbeat with `codex_app.automation_update`, run the matching record command from finish JSON.

## Stop Conditions

Stop without creating another heartbeat when finish returns `noReturn`, `modeDisabled`, `registerWindow`, `registerController`, `wait`, `review`, no payload, or no permission flag. `AlembicTest` next-hop is total-control-owned unless both the current plan and finish JSON explicitly allow it.

Before ending, if this heartbeat has `automation_id`, delete only this automation and run:

```text
node scripts/visible-dispatch.mjs record-stop --automation-id <automation-id> --write --reason "target completed"
```

If total control later audits this automation as non-compliant, its deletion
overrides target-window continuation. A target window must not recreate or
work around an automation that total control deleted.
