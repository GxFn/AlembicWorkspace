# Final Validation Acceptance: Dashboard Chat/Wiki/Candidate AI Removal

Date: 2026-06-11
Controller: AlembicWorkspace
Sequence: `alembic-dashboard-chat-wiki-candidate-ai-removal`
Final demand: `alembic-dashboard-chat-wiki-candidate-ai-removal-dcr7-validation-acceptance-2026-06-11`

## Outcome

Accepted. DCR0-DCR7 are completed.

The sequence removed Dashboard candidate AI/refine controls, Dashboard Chat,
Wiki, and Signal page surfaces, page-specific Plugin HTTP routes/schemas,
Plugin MCP `alembic_enrich_candidates`, and Core host-agent guidance that
pointed to the removed MCP tool.

Preserved flows remain in place: candidate review/lifecycle, knowledge
submission, Recipe/Guard/Decision, bootstrap/rescan, MCP/source graph tools,
and Core signal/report infrastructure.

## Final Evidence

State-root final acceptance:

`.workspace-active/workspace/current/alembic-dashboard-chat-wiki-candidate-ai-removal-dcr7-validation-acceptance/evidence/dcr7-final-validation-acceptance-2026-06-11.md`

Accepted product heads:

- AlembicDashboard: `0a61a00137079f1951934683ce521dc95d5b60b9`
- AlembicPlugin: `b8982d0933f3be69d98cadf07e5606201fb238ac`
- AlembicCore: `5ae117f481345e82921429371bc1427df52ac06d`

Controller reran final representative validation:

- Dashboard `npm run check`: passed.
- Plugin `npm run build:check`: passed using latest Core commit.
- Plugin `npm run smoke:codex-plugin`: passed install, stdio, and npxRuntime.
- Core `npm run check`: passed, including 84 files / 1045 tests.
- Current-code negative searches for removed Dashboard, Plugin HTTP, Plugin MCP,
  and Core guidance surfaces: clean.

## Residual Notes

- No Test handoff was needed; controller/product evidence answered the final
  runtime and source questions.
- Dashboard Vite chunk-size warning is non-blocking and unrelated to the
  deletion sequence.
- Plugin/Core local branches are ahead of origin by owning-window commits.
