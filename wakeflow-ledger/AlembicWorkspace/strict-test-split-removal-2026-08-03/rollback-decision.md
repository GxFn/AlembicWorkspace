# Strict-test Split Removal Decision

## User decision

The independent `strict-test-dimension` design is rejected. Remove the implementation that
created a separate Core profile, Agent receipt lane, Main private orchestrator and HTTP API,
and Dashboard run/status/report consumer.

This removal does not design or implement the replacement test mode. It must not restore
legacy bootstrap, `ALEMBIC_TEST_MODE`, Plugin `testMode`, DaemonJob activation, user dimension
selection, or a fallback route. Historical Wakeflow evidence remains immutable audit history.

## Verified rollback authority

A clean temporary-clone simulation applied each repository's commits in reverse order with
`git revert --no-commit`; every sequence completed without conflicts and passed
`git diff --check`.

### Alembic Main

Revert in this order:

1. `b50bff157448b4986064ddbe20d8d2ad9305c738`
2. `3a591f59d0b3cf598a0cdb8901034672094a5e23`
3. `7df05174c5df6319c3e183405e0655cc556594c9`
4. `07ec74090a633a0d5a0ca9f340a18915fbc76499`
5. `b0f3f31494c991030f4aeae7bff75f99a07253dd`

The revert removes the dedicated HTTP route, provider/generated contract, request/public
contracts, private workspace, runtime/orchestrator, probe and focused tests. Shared strict
production files are restored only by these exact inverse patches.

### AlembicDashboard

Revert `6562eb13e9ccc204021a8580a2045c25a9ad9697`.

The revert removes the strict-test API adapter, controller, hook, status panel, tests and
generated consumer projection, and restores the pre-commit Candidates source. The old cold-start
handler must not be re-enabled as a functional fallback: if the mechanical revert restores the
legacy button call, the window must leave that entry visibly unavailable or fail closed with no
network call, while making no replacement-mode design.

### AlembicAgent

Revert in this order:

1. `8688311c3970054c68a74b0ce30d8f3db4f15be6`
2. `4a2649f0d758a43f0884af5377c8b8531eed0b41`
3. `077f4f6f08da731a40547c90f085460f434087f1`
4. `7dfb4bada72d78a5bc9e65cafa54574cb36ae698`

Preserve the interleaved Wakeflow instruction refresh commit. Remove only the dedicated
strict-test authority, runtime binding, execution receipt, prompt scope, public exports,
probe and fixtures/tests.

### AlembicCore

Revert in this order:

1. `0815eb24944ea0ab3d4f4e2390205fbfe35f59f0`
2. `744616bde2322efa92aecd66b0b4f862f17fe69a`
3. `cd295c728496b917c720c0ce44615d70bf18812c`
4. `a12f0e574ebb9cfd721dd46e5c59b8154ed29ef8`
5. `933920fa214c1ba04787244f073145bcc48e929c`
6. `8383808cce71e80c717b6121235597c24229f10e`

Preserve the later Wakeflow instruction refresh commit. Remove the strict-test dimension profile,
automatic-selection receipt and their exports/tests only.

## Dependency order

1. Alembic Main removes the downstream consumer first.
2. AlembicDashboard and AlembicAgent may remove their consumer/producer surfaces after Main is
   controller-accepted.
3. AlembicCore removes the lowest-level profile only after Agent removal is controller-accepted.

## Completion definition

- Every listed revert is represented in a clean repository commit; unrelated commits remain.
- Repository full checks and focused public-surface checks pass after each phase.
- No runtime route, generated operation, public export, package script, probe, UI handler, hook,
  test or fixture for the independent `strict-test-dimension` split remains.
- Generic strict production/cold-start functionality is not removed merely because the rejected
  split reused it.
- No replacement test mode, legacy fallback, DaemonJob change, Test dispatch or Design work is
  introduced.
