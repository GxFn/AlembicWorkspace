# I3-I10 Agent strict-test automatic-selection integration controller review

Date: 2026-07-30

## Controller Acceptance

- User goal: strict cold-start test mode must automatically select one applicable dimension and
  prove that the latest strict pipeline actually executes that dimension's complete eligible cell
  set without a second confirmation or legacy bootstrap.
- Scope reviewed: AlembicAgent automatic-selection authority, existing-runtime binding,
  AgentService/PipelineStrategy integration, Agent execution receipt, public production facade,
  tests, runtime probe, cleanup, commit, and repository boundary.
- Original requirement authority:
  `wakeflow-ledger/AlembicWorkspace/recipe-coldstart-production-quality-2026-07-15/i3-i10-agent-strict-test-automatic-selection-integration-controller-contract.md`.
- Target/window: AlembicAgent /
  `i3-i10-agent-strict-test-automatic-selection-integration-t1`.
- Evidence reviewed:
  - target result
    `.wakeflow-active/current/recipe-coldstart-production-quality-2026-07-15/target-results/tr-i3-i10-agent-strict-test-automatic-selection-integration-t1.json`;
  - commit `7dfb4bada72d78a5bc9e65cafa54574cb36ae698`, parent
    `a882f61cad34eed873db5ac52870475e6d71da52`, tree
    `f663d2f66b1690bfddf8984e8665397d112b07b0`;
  - exact five-path recoverable stash
    `fb8af8850b89d5f1aff9ba912991d5bb69343f34`;
  - all twelve changed files and the target evidence ledger;
  - controller reruns of typecheck, 47 focused tests, runtime probe, public imports/signatures,
    Core/public/Agent boundaries, validation floor, retired-symbol scan, and diff check.
- Implementation reality:
  - Core automatic-selection authority is reconstructed and fail-closed.
  - The bound runtime port conserves the exact selected cell set and is revalidated before every
    existing stage/gate port read.
  - Manual-confirmation and legacy activation do not appear in production source or public
    exports.
  - In the actual pipeline, however, the selected-cell authority is consumed only to append an
    immutable JSON scope to the Analyst and Producer prompts. The unchanged callbacks and their
    outputs are not bound to the selected cells, and the pipeline does not create or return the
    new Agent execution receipt.
  - The runtime probe runs a successful two-model-call AgentService path first, then independently
    constructs a separate all-failed execution receipt from synthetic empty fact execution. The
    receipt therefore does not attest the model calls shown in the same report.
  - The valid-route focused test likewise returns success with a runtime port whose fact,
    analysis, Producer, and review results are not converted into per-cell receipt evidence. It
    proves prompt delivery, not selected-cell execution or terminal receipt provenance.
- Validation result:
  - PASS `npm run build:check`.
  - PASS focused strict tests: 4 files / 47 tests.
  - PASS deterministic probe, but its two claimed halves are disconnected as described above.
  - PASS public imports/signatures and repository boundary checks.
  - The known `createProjectContextFileRef` baseline failure is unchanged and is not a blocker for
    this task.
- Blockers:
  - No canonical execution object or adapter owns one continuous chain from the validated bound
    port, through actual AgentService/PipelineStrategy model and gate results, to the
    `StrictTestDimensionAgentExecutionReceiptV1`.
  - No validator proves that the receipt's fact/analysis/Producer/review evidence came from the
    same bound AgentService run and exact selected-cell execution shown by the runtime probe.
- Missing evidence:
  - One deterministic successful runtime probe whose returned receipt is constructed from the
    actual successful run's stage outputs, with a shared run/authority/execution identity.
  - A fail-closed test showing an in-run result or receipt attempting to claim an unselected,
    missing, duplicated, reordered, or cross-run cell is rejected before a terminal success can be
    reported.
- Residual risks: accepting the current adapter would allow Main to compose a valid authority and
  an independently valid receipt while the real Agent pipeline executed different or no per-cell
  work. That is precisely the disconnected-chain failure the package was meant to remove.
- TODO/backlog rollup: no new TODO is authorized. The defect is inside the current Agent task and
  returns to AlembicAgent as its first rework.
- Decision: `request-rework`.
- Next action: keep the accepted authority/runtime/public surfaces, connect the existing
  AgentService/PipelineStrategy result path to one canonical execution result/receipt builder, and
  replace the split probe with a single-chain valid and fail-closed runtime proof. Do not add Main,
  Dashboard, Daemon, Plugin, persistence, serving, a second Agent pipeline, or manual/legacy
  activation.

