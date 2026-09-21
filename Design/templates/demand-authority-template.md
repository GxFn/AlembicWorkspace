# Demand Authority Preparation Template

This is a Design preparation checklist, not a `wakeflow_deliver` request or an
executable authority JSON. Keep references portable and resolve every required
role before delivery. A template placeholder is not completed Design input.

**AUTHORITY NEEDED BY A TASKPACKAGE MUST BE INCLUDED IN INITIAL DEMAND CREATION.**
Violating the letter of this rule is violating its spirit.

`wakeflow_deliver` appends a 13-field TODO row and checks row shape/vocabulary,
duplicate ID, and board CAS only. The controller independently validates the
linked inputs and includes immutable `demand-authority.json` in the initial
`wakeflow_create_demand` publication. Public v3 cannot promote authority later;
the first `wakeflow_add_task` requires the already frozen authority tuple.

## Proportional Input Roles

| Demand type | Required inputs |
| --- | --- |
| `requirement` | `original-plan`, `requirement-design`, `code-facts`, `landing-plan`, `non-goals`, `user-confirmation`, and a testing decision. |
| `bug` | `reproduction`, `scope`, `non-goals`, and a testing decision. |
| `supplement` | Existing `requirement-design`, explicit `requirement-delta`, `user-confirmation`, and a testing decision. |
| `research` | `research-question`, `boundaries`, and `testDecision.mode=not-applicable`; no implementation package. |

For each role, record an existing workspace-relative Markdown reference with
an optional anchor. Do not invent IDs, digests, confirmations, or missing
sections. Real-environment testing also requires a `test-environment` reference
that exactly matches `environmentSpecRef`.

## Testing Decision

- `mode`: `controller-only` or `real-environment`; `not-applicable` is for
  research only.
- `summary`: the risk, evidence, and reason for the selected method.
- `environmentSpecRef`: the confirmed environment reference when the mode is
  `real-environment`.

## Controller Publication Boundary

Current public-v3 authority uses `schemaVersion`, `artifactKind`, allocated
`demandId`, `demandRef`, `demandDigest`, `entryMode`, exact ledger-member
`authorityRefs`, and `testDecision`. The old `demandKey` / `demandType` object
with bare role/reference pairs is not the current public-v3 payload.

The controller obtains allocated IDs and exact reference/digest bindings through
the installed creation workflow; Design does not manufacture them. Select
`entryMode=design-delivery`, `controller-inline`, or `pod-design` only for the
actual route. Follow the installed `wakeflow-design/references/design-handoff.md`
and `wakeflow-controller` instructions for publication.

This checklist does not authorize workspace migration, activation, claiming,
TaskPackage creation, or dispatch.
