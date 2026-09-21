---
name: evidence-review
description: Use when a Wakeflow Test window is preparing its own evidence and result for recording.
---

# Test Self-Evidence Review

The existing `evidence-review` skill name is retained for local routing. It
means self-review of Test-produced evidence, not product or target review.

**REVIEW ONLY TEST'S OWN EVIDENCE FOR ITS ASSIGNED CARD AND PACKAGE.**
Violating the letter of this rule is violating its spirit.

**REQUIRED:** read the installed
`wakeflow-test/references/self-evidence-review.md`. `wakeflow-target` owns exact
result recording and return transport. The controller owns product-diff and
target-result review, implementation completeness, and acceptance.

## Source Skills Used

- Evidence discipline from `code-reviewer` and `senior-qa`: evidence before
  claims, reproducibility, limitations, and residual risk.
- SRE symptom/cause separation: distinguish observation, causal inference,
  command output, and conclusions the evidence cannot support.

## Workflow

1. Restate the frozen controller question, TestCard, and approved plan.
2. Inventory Test's commands, reports, logs, screenshots, probes, environment
   references, outcomes, and retry/flake facts.
3. Check exact `test-step` mappings: zero-based `planIndex`, byte-matching
   `approvedPlan` step, and one declared evidence locator per `ref`. A completed
   result covers every approved step exactly once and in order; partial results
   remain exact and honest.
4. Check reproducibility, resolving portable references, redaction, missing
   evidence, contradictions, and invalid conclusions. Exclude secrets, private
   handles, raw local absolute paths, and unbounded logs.
5. Choose result readiness; do not recommend product acceptance.

## Review Format

```markdown
## Self-Evidence Review

- Controller question and approved plan:
- Test-produced evidence inventory:
- Test-step mapping check:
- Reproducibility and portability/redaction check:
- Contradictions, flakiness, or missing evidence:
- Invalid conclusions:
- Residual risks:
- Result readiness:
```

| Result readiness | Meaning |
| --- | --- |
| `ready-to-record-completed` | The Test result contract is complete. |
| `ready-to-record-blocked` | A concrete external blocker stopped approved work. |
| `ready-to-record-needs-review` | Scope, authority, mapping, or evidence needs controller judgment. |

## Forbidden Outputs

- No product-completion review, acceptance recommendation, or product decision.
- No product source, test, configuration, or documentation edits. Only explicitly
  approved Test-owned `harnesses/` or `fixtures/` changes may support a mapped
  step; this self-review grants no write permission.
- No TODO/controller-state mutation or dispatch. Return transport follows
  `wakeflow-target` and the current envelope, not this method.

## Quality Bar

Test's result must be honest, reproducible, and reviewable. A passing command is
one observation; the controller independently validates returned evidence before
any acceptance, rework, or routing decision.
