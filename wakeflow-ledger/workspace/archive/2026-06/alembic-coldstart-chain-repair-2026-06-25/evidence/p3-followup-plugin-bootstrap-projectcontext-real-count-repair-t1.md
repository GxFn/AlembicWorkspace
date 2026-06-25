# P3 Follow-up Plugin Bootstrap ProjectContext Real Count Repair Evidence

Task: `p3-followup-plugin-bootstrap-projectcontext-real-count-repair-t1`
Window: `AlembicPlugin`
Dispatch group: `p3-followup-plugin-bootstrap-projectcontext-real-count-repair-p1`

## Conclusion

Completed. AlembicPlugin now feeds bootstrap and rescan ProjectContext briefing from real source-file facts and real module ownedFiles instead of the truncated presenter detail file list. The public bootstrap route no longer reports every target as `fileCount=1` for the BiliDili-like fixture.

Commit:

- `b94cc366c4921bc189bfb88f32a4816208466937` (`fix bootstrap project context real counts`)

Changed files:

- `lib/recipe-generation/project-source-facts.ts`
- `lib/recipe-generation/plan-tool.ts`
- `lib/recipe-generation/host-agent-workflows/project-context-analysis.ts`
- `lib/recipe-generation/host-agent-workflows/cold-start.ts`
- `lib/recipe-generation/host-agent-workflows/knowledge-rescan.ts`
- `test/unit/HostAgentProjectContextDirectSwitch.test.ts`
- `test/unit/PlanDrivenGenerationGate.test.ts`
- `test/unit/PlanSelectionGateStateless.test.ts`

## Implementation Notes

- Extracted plan draft source-file scanning and module-owned-file attachment into `project-source-facts.ts`.
- Reused that helper in host-agent ProjectContext analysis, independent of `scale.maxFiles`, so bootstrap/rescan count the real project source universe while keeping presenter detail budgets bounded.
- Preserved ProjectContext target names and inferred real module paths from file refs, including Swift package paths such as `Packages/AOXFoundationKit`.
- Passed `projectMeta.fileCount` and `projectMeta.moduleCount` into Core mission briefing for both bootstrap and rescan.
- Switched rescan audit file input to the real source-file facts.
- Updated gate tests to assert the current two-part contract: compact inline data plus complete full briefing through `meta.fullBriefingRef`.

## Validation

Build and tests:

- `npm run test:unit -- test/unit/HostAgentProjectContextDirectSwitch.test.ts test/unit/PlanDraftTwoBlockProjector.test.ts test/unit/PlanDrivenGenerationGate.test.ts test/unit/PlanSelectionGateStateless.test.ts`
  - Passed: 4 files, 21 tests.
- `npm run test:unit -- test/unit/HostMcpServer.test.ts -t "Codex host-agent bootstrap runs in the Plugin without the daemon MCP bridge"`
  - Passed: 1 focused test, 41 skipped by test filter.
- `npm run build:check`
  - Passed. Core build used `../AlembicCore @ 6477b4aa249b490dcb4d9b2a6e4fdb02c11d00e9`.
- `npm run build`
  - Passed. Rebuilt current `dist` before public-route probing.
- `git diff --check`
  - Passed with no output.

Public route fixture probe:

- Command: `node /private/tmp/alembic-plugin-p3-bootstrap-projectcontext-probe.mjs`
- Result:
  - `draft.fileCount=8`
  - `draft.moduleCount=4`
  - `bootstrap.ok=true`
  - `bootstrap.projectMeta.fileCount=8`
  - `bootstrap.projectMeta.moduleCount=4`
  - `bootstrap.projectIdentity.fileCount=8`
  - `bootstrap.projectIdentity.moduleCount=4`
  - `targets.AOXFoundationKit.fileCount=3`
  - `targets.AOXNetworkKit.fileCount=4`
  - `fullBriefingRef.bytes=198960`

Boundary checks:

- `git diff -- lib/recipe-generation/host-agent-workflows lib/recipe-generation/project-source-facts.ts test/unit | rg -n "domainQueue|currentDomainSop|sopPack|DOMAIN_PLAYBOOKS|projectContextSignature|planningBrief|alembic_plan get|operation: 'get'"`
  - No matches. This did not resurrect the seven-domain onboarding layer or old plan/get fields.
- `PlanDraftTwoBlockProjector.test.ts` passed, so the current alembic_plan draft two-part contract remained covered.

Guard:

- `alembic_code_guard` was attempted with the explicit changed-file list.
- Tool result was an Alembic MCP internal schema failure, not a code finding:
  - `unrecognized_keys`
  - key: `data`
  - status: `internal-error`

## Residual Risks / Deferred Items

- P6 handoff/projectId identity repair remains out of scope for this P3 follow-up.
- The Alembic guard tool internal schema error remains a plugin-surface issue to repair separately.
- A legacy `AlembicPlanTool.test.ts` path still expects retired plan persistence fields; it was not used for this task acceptance. Current plan contract coverage is through the stateless/two-part plan tests listed above.
