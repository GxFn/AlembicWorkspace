---
name: design-handoff
description: Use when a Wakeflow Design window has clarified inputs ready for handoff review or an explicitly confirmed controller submission.
---

# Design Handoff

Prepare a concise, evidence-backed handoff from Design to the Wakeflow
controller. A handoff is an intake artifact, not an execution plan and not a
final product decision.

## Source Skills Used

- `mattpocock/skills/productivity/handoff`: compact summary, suggested skills,
  avoid duplicating existing artifacts, and redact sensitive data.
- `planning-with-files`: keep notes and deliverables separate; reference source
  artifacts instead of copying them.
- Wakeflow governance: Design signals become executable only after controller
  intake.

## Wakeflow Role

Use this skill when:

- Design has clarified a requirement enough for controller review;
- a requirement design is ready for intake;
- an option comparison needs a controller/user decision;
- open questions or risks should be preserved without becoming TODOs.

## Interaction First

Default to conversation. Use this skill to summarize handoff readiness, separate
facts from recommendations, name missing upstream Design work, and recommend the
next skill or controller action before writing any tracked handoff artifact.

Do not create or update handoff documents, deliver to the controller TODO
board, or write workspace intake records as the first action. Write files only
when the user/controller explicitly asks for a tracked artifact, confirms that
the proposed content should be recorded, or a controller state root assigns a
write deliverable. If a write is justified, state what will be written and why
before editing.

## Workflow

1. Read the source artifacts.
   - clarification notes;
   - original plan;
   - requirement design;
   - option plan;
   - prior Design signal;
   - relevant code/docs references.
2. Deduplicate.
   - Do not copy full documents already available by path.
   - Quote only short decision-critical snippets when necessary.
3. Separate fact, suggestion, and decision.
   - Facts are verified from source artifacts or code/docs.
   - Suggestions are Design recommendations.
   - Decisions belong to user/controller.
4. State readiness.
   - `ready-for-controller-intake`;
   - `needs-user-decision`;
   - `needs-option-planning`;
   - `needs-requirement-design`;
   - `blocked`.
5. Recommend the next Wakeflow skill or controller action; when ready, deliver
   to the controller TODO board (see Delivering to the Controller TODO).

## Handoff Format

```markdown
## Design Handoff

- Source:
- Goal:
- Confirmed decisions:
- Design recommendations:
- Open questions:
- Non-goals:
- Risks:
- Required controller judgment:
- Suggested next action:
- Suggested skills:
- Source artifacts:
- Redaction notes:
- Intake status:
```

## Delivering to the Controller TODO

**NO DELIVERY UNTIL THE DESIGN AND ITS SUBMISSION ARE EXPLICITLY CONFIRMED.**
Violating the letter of this rule is violating its spirit.

Design must check the complete proportional inputs itself; use
`templates/demand-authority-template.md` as a preparation checklist, not a tool payload.
Incomplete references, unanswered decisions, or missing Test decisions stay upstream.

Follow the installed `wakeflow-design/references/design-handoff.md` procedure:

1. Resolve this Design window and the sole controller from `wakeflow_view`
   with `operation: "config"`; use typed window IDs, never private thread handles.
2. Inspect `wakeflow_next_work` and retain its exact `contentDigest` as
   `expectedBoardDigest`.
3. Build one row with exactly these 13 string fields:
   `ID`, `Status`, `Type`, `Priority`, `Owner`, `Item / Goal`,
   `Affects Retest / Dispatch`, `Dependency / Trigger`, `Recommended Window`,
   `Current Mount`, `Auto Claim`, `Testing Decision`, `Documents`.
   Use the installed reference's exact vocabulary: ready work is `pending-claim`,
   an explicitly confirmed dependency wait is `parked`, `Current Mount` is `none`,
   and boolean cells use `yes|no`. `Documents` contains portable relative Markdown
   authority links, not URLs, absolute paths, or private host identities.
4. Call `wakeflow_deliver` once with
   `{ root, operation: "append", request: { row, expectedBoardDigest } }`.
   Report the result; never edit, re-status, claim, or dispatch the delivered row.

| Boundary | Owner and meaning |
| --- | --- |
| Design readiness | Design verifies complete inputs and explicit confirmation before submission. |
| TODO append | `wakeflow_deliver` validates the row shape/vocabulary, duplicate ID and board CAS only. It does not resolve document targets, validate their digests/role completeness, or freeze authority. |
| Demand authority | If TaskPackages will be needed, the controller independently resolves the inputs and includes immutable `demand-authority.json` in the initial `wakeflow_create_demand` publication. Public v3 has no later authority-promotion operation; the first `wakeflow_add_task` cannot supply missing authority. |

Set the `Auto Claim` cell to `yes` only when unattended claiming is explicitly
authorized for already-ready work; otherwise use `no`. A parked row uses `no`.
Auto Claim changes claim timing, never readiness or confirmation.

## Redaction Rules

Never include:

- API keys, tokens, secrets, or private credentials;
- real thread ids;
- local runtime-only transport data;
- unrelated personal information;
- large duplicated source artifacts.

Keep external research URLs in the referenced Design artifact; the delivery
row's `Documents` field uses portable relative Markdown references only.

## Allowed Outputs

- Conversational handoff-ready summary and suggested next action.
- Design handoff document; one `wakeflow_deliver` of a ready item to the
  controller TODO board.
- Controller intake summary.
- Suggested Wakeflow skill list.

## Forbidden Outputs

- No dispatch.
- No task package creation.
- No hand-edited TODO mutation or delivered-row maintenance; only the confirmed append above is allowed.
- No product code edits.
- No acceptance or archive decision.
- No unconfirmed recommendation presented as final scope.
- No tracked handoff document or controller-TODO delivery as the first action
  without an explicit write request or confirmation.

## Quality Bar

A good handoff lets the controller quickly answer: what is the goal, what has
actually been decided, what is still a suggestion, what evidence exists, and
what the next judgment should be. It fails if it duplicates whole plans,
forgets open questions, or hides a scope change inside prose.
