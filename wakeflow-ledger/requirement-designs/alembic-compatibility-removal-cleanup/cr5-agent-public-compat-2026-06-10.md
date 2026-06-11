# Agent Public Compatibility Semantics Removal

Demand Key: `alembic-compatibility-removal-cleanup-cr5-agent-public-compat-2026-06-10`
Primary Window: AlembicAgent

## Goal

Ensure Agent public results expose only canonical post-D32 contract semantics.

## Completion Definition

Agent public contracts and ordinary output projections do not expose legacy
compatibility semantics. Provider quirks, including DeepSeek text tool-call
handling, remain only as provider-private adapter behavior if current provider
behavior requires them and cannot leak into public branch semantics.

## Validation Floor

- Agent interface contract tests.
- Tool system / terminal contract tests.
- Branch fixtures for success, partial, blocked, timeout, provider-error,
  host-failure, needs-confirmation, and cancellation.
- Forbidden ordinary-output leak checks.
