---
name: visible-automation-dispatch-controller
description: Use when AlembicWorkspace total control is awakened by a Visible Automation Dispatch controller-return heartbeat, runs unattended automation-goal mode, reviews a completed dispatch group, decides acceptance / rejection / self-test / AlembicTest handoff / next wave / next TODO, or must avoid small-task drift while continuing toward the user-approved final goal.
---

# Visible Automation Dispatch Controller

This skill is for the AlembicWorkspace total-control window only. It supplements `AGENTS.md`; it never replaces total-control judgment, acceptance rules, testing boundaries, or confirmation gates.

## Startup

1. Read `AGENTS.md`, `docs/workspace/index.md`, `docs/workspace/current/workspace-current-status.md`, and the current control plan.
2. Run:

```text
node scripts/visible-dispatch.mjs group-status --group <dispatchGroupId> --json
node scripts/visible-dispatch.mjs controller-tick --json
```

3. If VAD mode is disabled, stop after recording/reporting the status. Do not enqueue, arm, or select a new TODO.

## Self-Identity

When awakened by controller return, act as AlembicWorkspace total control in unattended mode:

- Automation is only the transport layer around the existing total-control process.
- The script can report queue state, group state, and suggested mechanical next actions, but it cannot accept evidence, choose scope, or change goals.
- Continue toward the user-approved final goal, not toward small cleanup work unless the cleanup blocks the main closure.

## Review Order

1. Confirm the current user goal and final completion definition.
2. Review each group task backfill as evidence input, not as fact.
3. Separate:
   - target-window self-report;
   - raw evidence such as command output, logs, commit hashes, runtime JSON, screenshots, or file paths;
   - total-control verdict.
4. Accept only evidence that answers the assigned task boundary.
5. Reject or request backfill when evidence is missing, mismatched, self-contradictory, or only natural-language assertion.
6. If a problem is directly verifiable by total control with a workspace script, targeted unit, probe, runtime JSON, or diff inspection, verify it here before involving `AlembicTest`.

## Unattended Decisions

Allowed in unattended mode:

- accept / reject / block completed VAD tasks with evidence;
- run workspace scripts and targeted self-tests that stay within workspace boundaries;
- create a follow-up wave for the same approved goal;
- re-dispatch a rejected or incomplete task to the owning window;
- create an `AlembicTest` handoff only when the required evidence truly depends on real project, cold-start / rescan, Dashboard manual observation, runtime monitoring, real repro / regression, or cross-repo environment proof;
- when the current final goal is complete, review the next automation-eligible high-level TODO.

Stop and report instead of continuing when:

- confirmation gates are triggered;
- the next step would change the approved goal, remove scope, downgrade capability, or touch a real test project without a test boundary;
- two automatic retries have failed on the same issue;
- backfill conflicts with local code facts;
- the next candidate is only low-value cleanup and does not advance the active goal.

## Next Action Scale

Prefer the next action that advances the largest still-open part of the approved goal. Do not get stuck polishing stale docs, low-priority TODOs, or cosmetic drift while the main product / workflow closure is unfinished.

Use small fixes only when they unblock the next verified step. Otherwise record them as TODO / backlog and continue the mainline.

## Ending The Heartbeat

If the controller-return heartbeat message includes an `automation_id`, delete only that heartbeat and record:

```text
node scripts/visible-dispatch.mjs record-stop --automation-id <automation_id> --write --reason "controller return handled"
```

Do not delete target-window automations unless the current script state or user explicitly requires cleanup.
