# Alembic Dashboard Chat Wiki Signal Candidate AI Removal

Status: candidate / user-requested / needs controller intake
Maintained Window: AlembicWorkspace
Date: 2026-06-11
Design Key: alembic-dashboard-chat-wiki-candidate-ai-removal

## Controller Judgment

The user requested a deletion requirement: remove the frontend field completion
and refinement features from the Dashboard candidate surface, and also remove
the Dashboard Chat pages/surfaces, Wiki-related pages/surfaces, and Signal
pages/surfaces. Related backend support that exists for those removed UI
surfaces must be deleted too.

This is not a UI hide, permission gate, compatibility shim, or legacy
translation task. The expected direction is a real cleanup: delete the
candidate AI completion/refinement entrypoints, delete Chat and Wiki page
entrypoints, delete Signal page entrypoints, delete page-specific API methods
and routes, remove exposed MCP/admin tool support for the removed candidate
completion feature, remove Core guidance that tells agents to call the removed
tool, and remove documentation/i18n/help text that still advertises the deleted
capabilities.

## Entry Points

- Requirement design:
  [alembic-dashboard-chat-wiki-candidate-ai-removal-requirement-design-2026-06-11.md](alembic-dashboard-chat-wiki-candidate-ai-removal-requirement-design-2026-06-11.md)
- Candidate demand sequence:
  [alembic-dashboard-chat-wiki-candidate-ai-removal-demand-sequence-2026-06-11.json](alembic-dashboard-chat-wiki-candidate-ai-removal-demand-sequence-2026-06-11.json)

## Local Evidence Baseline

- `AlembicDashboard/src/components/Views/CandidatesView.tsx` still imports
  `RefineProgressBar`, calls `api.enrichCandidates(...)`, and opens
  `globalChat.openRefine(...)`.
- `AlembicDashboard/src/components/Shared/GlobalChatDrawer.tsx` still exposes
  `openRefine`, refine preview streaming, refine apply, refine topic state,
  refine prompt presets, and refine action UI.
- `AlembicDashboard/src/App.tsx` still imports `AiChatView` and `WikiView`,
  and still renders the `ai` and `wiki` tab pages.
- `AlembicDashboard/src/App.tsx` still imports `SignalReportView` and renders
  the `signals` tab page.
- `AlembicDashboard/src/components/Layout/*` still advertises `ai`, `wiki`,
  and `signals` navigation through Sidebar, Header, and CommandPalette.
- `AlembicDashboard/src/components/Views/WikiView.tsx` still implements the
  Wiki page, reads `polished?: boolean`, and renders AI enhanced badges.
- `AlembicDashboard/src/components/Views/SignalReportView.tsx` still implements
  a Signals/Reports/Logs page.
- `AlembicDashboard/src/api.ts` still exposes candidate enrich/refine HTTP
  methods, refine SSE helpers, AI chat methods, Wiki page methods, and Signal
  report methods.
- `AlembicPlugin/lib/http/routes/candidates.ts` still defines host-managed
  candidate completion/refinement routes, including preview, stream, events,
  and apply.
- `AlembicPlugin/lib/http/routes/signals.ts` still defines
  `/api/v1/signals/trace`, `/api/v1/signals/stats`, and
  `/api/v1/signals/reports`, mounted from `HttpServer.ts`.
- `AlembicPlugin/lib/codex/mcp/*` still exposes
  `alembic_enrich_candidates` through handler map, schema, tool definition,
  surface catalog, and output shaping.
- `AlembicCore/src/workflows/capabilities/host-agent/MissionBriefingSupport.ts`
  still instructs the host agent to call `alembic_enrich_candidates`.

## Required Direction

Delete the complete feature/page chain for candidate field completion,
candidate refinement, Dashboard Chat pages, Dashboard Wiki pages, and Dashboard
Signal pages:

```text
Dashboard candidate AI actions / Chat page / Wiki pages / Signal pages
  -> navigation, routes, page components, drawers, overlays, help, i18n
  -> frontend API methods and SSE helpers for deleted surfaces
  -> Plugin HTTP candidate enrich/refine routes and page-specific chat/wiki/signal routes
  -> MCP enrich tool and output contract
  -> Core host-agent guidance
  -> tests, help copy, i18n, and docs references
```

The deletion must preserve unrelated core workflows unless code audit proves a
specific piece is page-exclusive support for the deleted Chat/Wiki/Signal UI:
candidate review, candidate deletion/promotion, knowledge submission,
bootstrap/rescan, Recipe/Guard/Decision flows, Core SignalBus/runtime signal
emission, and MCP/automation paths that are not Dashboard page contracts.

## Candidate Demand Order

| Order | Demand | Primary Window | Purpose |
| --- | --- | --- | --- |
| 1 | `alembic-dashboard-chat-wiki-candidate-ai-removal-dcr0-delete-map-2026-06-11` | AlembicWorkspace | Build the exact delete map and preserve map from current code so implementation removes Chat/Wiki/Signal pages without deleting unrelated core/MCP capabilities by accident. |
| 2 | `alembic-dashboard-chat-wiki-candidate-ai-removal-dcr1-dashboard-candidate-page-2026-06-11` | AlembicDashboard | Remove candidate page AI completion/refinement actions, state, progress bar, unavailable notices, API calls, and i18n/help copy. |
| 3 | `alembic-dashboard-chat-wiki-candidate-ai-removal-dcr2-dashboard-chat-page-2026-06-11` | AlembicDashboard | Remove Dashboard Chat page/drawer surfaces, navigation, page-specific state, chat API calls, chat i18n/help copy, and page-only support code. |
| 4 | `alembic-dashboard-chat-wiki-candidate-ai-removal-dcr3-dashboard-wiki-pages-2026-06-11` | AlembicDashboard | Remove Wiki-related Dashboard pages, navigation, page API calls, Wiki help/i18n copy, polish metadata display, and page-only support code. |
| 5 | `alembic-dashboard-chat-wiki-candidate-ai-removal-dcr4-dashboard-signal-pages-2026-06-11` | AlembicDashboard | Remove SignalReportView, Signals navigation, signal page API calls, signal help/i18n copy, and page-only report/log display support. |
| 6 | `alembic-dashboard-chat-wiki-candidate-ai-removal-dcr5-plugin-http-support-2026-06-11` | AlembicPlugin | Delete candidate enrich/refine HTTP routes plus page-specific Chat/Wiki/Signal HTTP support, schemas, stream/events/apply support, and server mounts that exist only for deleted surfaces. |
| 7 | `alembic-dashboard-chat-wiki-candidate-ai-removal-dcr6-mcp-core-tool-cleanup-2026-06-11` | AlembicPlugin + AlembicCore | Remove `alembic_enrich_candidates` from MCP schemas/tools/catalog/output/handlers and remove Core mission briefing guidance. |
| 8 | `alembic-dashboard-chat-wiki-candidate-ai-removal-dcr7-validation-acceptance-2026-06-11` | AlembicDashboard + AlembicPlugin + AlembicCore + AlembicWorkspace | Prove deleted pages/entrypoints are gone, preserved non-page workflows still work, and controller can accept the deletion from raw evidence. |

## Stop Conditions

- Implementation only hides buttons but leaves callable HTTP routes, MCP tools,
  schemas, or Core instructions.
- Implementation keeps backend stubs, 501 compatibility routes, or legacy
  aliases for deleted features.
- Implementation leaves Chat/Wiki navigation, routes, page components, drawers,
  page API methods, or help/i18n copy after declaring the pages deleted.
- Implementation leaves Signal navigation, route, `SignalReportView`, signal
  page API methods, page-specific `/signals/*` routes, or signal page help/i18n
  copy after declaring the page deleted.
- Implementation deletes unrelated candidate review/publish/delete,
  bootstrap/rescan, knowledge submission, Core SignalBus/runtime signal
  emission, or non-page MCP/automation behavior without proving that code is
  exclusive support for the deleted UI surfaces.
- Tool lists, help pages, i18n strings, or mission briefings still advertise
  candidate completion/refinement, Dashboard Chat pages, Dashboard Wiki pages,
  or Dashboard Signal pages after implementation.
- Acceptance is based on search-only evidence without representative UI/build,
  tool-list, page-route-negative, and API-route-negative validation.
