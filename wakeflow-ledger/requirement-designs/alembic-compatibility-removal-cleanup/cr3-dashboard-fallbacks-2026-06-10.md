# Dashboard Compatibility Fallback Removal

Demand Key: `alembic-compatibility-removal-cleanup-cr3-dashboard-fallbacks-2026-06-10`
Primary Window: AlembicDashboard

## Goal

Replace Dashboard compatibility fallbacks with canonical provider/capability and
problem taxonomy fields.

## Completion Definition

Dashboard adapters consume canonical fields for runtime status, problem
details, source labels, file-monitor capability, and SSE projections. Legacy
labels/aliases/fallback policies are deleted or moved to test-only fixtures
after provider replay proves canonical coverage.

## Validation Floor

- Dashboard contract tests.
- D24-style provider fixture replay with injected sensitive/private fields.
- Narrow-screen/runtime diagnostics UI model checks.
- No Dashboard UI state loses loading/empty/error/partial/unavailable behavior.
