# Visible Automation Dispatch Operations

Use this reference when total control is starting, stopping, inspecting, or
debugging Visible Automation Dispatch (VAD). `AGENTS.md` owns hard safety
rules; VAD controller / target skills own heartbeat role behavior; this file
owns the workspace script operating map.

## Automation Types

- **Controller self heartbeat**: current task belongs to `AlembicWorkspace`.
  Use a Codex heartbeat on the current thread. Do not enqueue VAD target tasks.
- **Target fan-out**: current plan has child-window tasks. Use
  `visible-dispatch` queue / group / arm commands after thread preflight.
- **Controller return**: final target in a group wakes `AlembicWorkspace` for
  acceptance. Total control reviews evidence before accepting or dispatching the
  next wave.
- **Manual discussion**: normal user interaction. Never claim or chain VAD
  tasks from an ordinary discussion turn.

## Read-Only Orientation

```text
node scripts/visible-dispatch.mjs status --json
node scripts/visible-dispatch.mjs controller-tick --json
node scripts/visible-dispatch.mjs group-status --group <dispatchGroupId> --json
node scripts/visible-dispatch.mjs audit-automation --automation-id <automationId> --json
```

`controller-tick` is a classifier, not a verdict. If it says `modeDisabled`
during a controller self heartbeat, that can be correct; VAD mode only governs
target fan-out / finish-chain behavior.

## Automation Compliance And Deletion

Total control owns the authority to delete a non-compliant Codex automation.
Before trusting a heartbeat that looks stale, cross-window, off-plan, or
unexpected, run:

```text
node scripts/visible-dispatch.mjs audit-automation --automation-id <automationId> [--window <windowName>] [--group <dispatchGroupId>] [--role target|controller-return] --json
node scripts/workspace-control.mjs vad audit --automation-id <automationId> --json
```

The audit only judges local VAD state. It does not call Codex automation APIs.
When it reports `deleteRecommended: true`, total control should delete the
automation with `codex_app.automation_update` (`mode=delete`). If the audit
found an active local VAD run, then record the local stop:

```text
node scripts/visible-dispatch.mjs record-stop --automation-id <automationId> --write --reason "<why total control deleted it>"
```

Delete immediately when an automation is not tied to the current plan, current
task / dispatch group, expected target window, true thread id, allowed
`AlembicTest` boundary, enabled VAD mode, or authorized next-hop policy.
Deleting a non-compliant automation is a total-control correction, not a user
confirmation gate.

## Mode And Runtime

```text
node scripts/visible-dispatch.mjs mode --enable --write
node scripts/visible-dispatch.mjs mode --disable --write
```

- Enable mode only when the current plan explicitly allows unattended VAD
  target fan-out or finish-chain continuation.
- Disable mode when the user stops automation, a hard gate triggers, or the
  current plan is no longer automation-owned.
- On macOS, enabled mode starts a local `caffeinate -dims` keep-awake process.
  Disabled mode must stop it. If stop fails, report an automation readiness risk
  and fix or manually stop the process before claiming reliability.

## Target Fan-Out

```text
node scripts/visible-dispatch.mjs preflight --from-plan --json
node scripts/visible-dispatch.mjs enqueue --from-plan --group <dispatchGroupId> --return-policy controller-last --write
node scripts/visible-dispatch.mjs arm-batch --group <dispatchGroupId> --json
node scripts/visible-dispatch.mjs record-arm --task <taskId> --automation-id <automationId> --write
```

Preflight must pass before payloads are used. Thread ids are local runtime data
under `.workspace-local/visible-dispatch/`; never copy them into tracked docs.
The script prints heartbeat payloads but does not call Codex automation APIs.

## Target Finish

Target windows use:

```text
node scripts/visible-dispatch.mjs claim --window <windowName> --write --json
node scripts/visible-dispatch.mjs finish --window <windowName> --backfill "<evidence>" --write --chain-next --json
```

Only create another heartbeat when finish JSON explicitly includes the matching
permission flag:

- target courier: `chain.nextAction === "armNext"`,
  `chain.handoffPolicy === "target-courier"`,
  `chain.payload.courierAllowed === true`;
- controller return: `chain.nextAction === "returnToController"`,
  `chain.handoffPolicy === "controller-return"`,
  `chain.payload.controllerReturnAllowed === true`.

`AlembicTest` next-hop is total-control-owned by default.

## Acceptance And Cleanup

```text
node scripts/visible-dispatch.mjs tick --write --json
node scripts/visible-dispatch.mjs accept --task <taskId> --verdict accepted --note "<evidence>" --write
node scripts/visible-dispatch.mjs block --task <taskId> --reason "<reason>" --write
node scripts/visible-dispatch.mjs record-stop --automation-id <automationId> --write --reason "<reason>"
node scripts/visible-dispatch.mjs prune-history --write --json
```

Total control accepts only after reviewing raw evidence. `record-stop` records
external deletion / pause of Codex automations; it is not proof that a task
finished. Use `block` for stopped, failed, or manually abandoned tasks that
should not continue. Use `prune-history` only after current plan switches and
historic terminal residue should no longer affect controller decisions.

## Aggregated Entrypoint

For common checks, use:

```text
node scripts/workspace-control.mjs vad status
node scripts/workspace-control.mjs vad controller
node scripts/workspace-control.mjs vad preflight
node scripts/workspace-control.mjs vad enable --write
node scripts/workspace-control.mjs vad disable --write
node scripts/workspace-control.mjs vad prune --write
```

`workspace-control.mjs` only orchestrates existing scripts. It still requires
write gates and never calls Codex automation APIs.
