# Alembic Dashboard Chat Wiki Signal Candidate AI Removal Requirement Design

Status: candidate / user-requested / needs controller intake
Date: 2026-06-11
Design Key: alembic-dashboard-chat-wiki-candidate-ai-removal
Primary Product Windows: AlembicDashboard, AlembicPlugin, AlembicCore
Related Evidence: local Dashboard candidate/chat/wiki code, Plugin HTTP routes,
Plugin MCP tool surface, Core host-agent mission briefing

## Problem

The Dashboard still exposes candidate field completion and refinement concepts
across the candidate page, Chat surfaces, Wiki surfaces, Signal surfaces,
frontend API helpers, help text, i18n strings, backend HTTP routes, MCP admin
tools, and Core host-agent guidance. The user also confirmed that the Dashboard
Chat page, Wiki-related pages, and Signal pages themselves should be deleted,
not merely stripped of refinement, polish, or monitoring controls.

The current code is already partly inconsistent: some backend HTTP routes say
the work is host-managed or no longer done locally, but the frontend and MCP
surface still present completion/refinement as product capabilities. Keeping
disabled buttons, compatibility routes, 501 responses, or old tool schemas
would preserve the confusing contract instead of removing the feature.

The user confirmed the desired direction: delete the frontend field completion
and refinement features from the candidate surface, delete Chat pages/surfaces,
delete Wiki-related pages/surfaces, delete Signal pages/surfaces, and delete
complete backend support that exists for those removed features/pages. No
old-version compatibility is required.

## Goal

Remove candidate field completion, candidate refinement, Dashboard Chat pages,
Dashboard Wiki-related pages, and Dashboard Signal pages as supported Alembic
Dashboard/Plugin/Core surfaces.

The final observable state is:

1. The candidate page no longer has AI field completion or AI refinement
   actions, progress UI, disabled host-managed notices, or completion/refine
   state.
2. Dashboard Chat pages/surfaces are removed: `AiChatView`,
   `GlobalChatDrawer`, page/drawer open controls, chat navigation, chat topic
   UI, chat page state, chat page i18n/help copy, and chat page API calls are
   gone unless a piece is proven to serve a separate non-page product contract.
3. Dashboard Wiki-related pages/surfaces are removed: `WikiView`, Wiki tab
   rendering, Wiki navigation, Wiki page actions, Wiki page API calls, Wiki
   page i18n/help copy, and polish/enhanced metadata display are gone unless a
   piece is proven to serve a separate non-page product contract.
4. Dashboard Signal pages/surfaces are removed: `SignalReportView`, Signals
   tab rendering, Signals navigation, signal trace/stats/reports page API
   calls, signal page i18n/help copy, and page-only report/log display support
   are gone unless a piece is proven to serve a separate non-page product
   contract.
5. The frontend API layer no longer exposes candidate enrich/refine methods,
   refine SSE helpers, Chat page methods, or Wiki page methods for deleted
   surfaces, and no longer exposes Signal page trace/stats/reports methods for
   deleted surfaces.
6. AlembicPlugin no longer mounts or serves candidate enrich/refine HTTP
   routes, including bootstrap refine, preview, stream, events, and apply; it
   also no longer serves page-specific Chat/Wiki/Signal HTTP support that
   exists only for the deleted Dashboard pages.
7. AlembicPlugin no longer exposes `alembic_enrich_candidates` in MCP schemas,
   tool definitions, handler maps, surface catalog, output allowlists, or
   tool-list output.
8. AlembicCore no longer instructs host agents to call
   `alembic_enrich_candidates`.
9. Tests, help pages, i18n, docs, route checks, and scan checks prove the
   removed capabilities/pages are gone while preserved non-page workflows still
   work.

## Non-goals

- Do not remove candidate review, candidate deletion, candidate promotion,
  knowledge submission, validation/check duplicate workflows, or candidate
  list/detail display unless code audit proves a piece is exclusively part of
  the deleted completion/refinement feature.
- Do not remove backend/MCP/automation capabilities merely because they share
  names such as chat, wiki, signal, plan, finalize, trace, report, or context.
  Delete Dashboard Chat/Wiki/Signal pages and their page-specific support;
  preserve or explicitly reroute non-page capabilities unless implementation
  proves they are exclusive support for the deleted pages.
- Do not delete Core `SignalBus`, signal emission in Guard/search/runtime, or
  signal-based ranking/quality internals merely because the Dashboard Signal
  page is removed. Those are runtime infrastructure unless a separate confirmed
  deletion decision says otherwise.
- Do not delete bootstrap/rescan/Recipe/Guard/Decision capabilities merely
  because some Chinese copy uses the broad word "fill". Remove only the
  candidate field completion/refinement product chain plus confirmed
  Dashboard Chat/Wiki/Signal page chains unless a specific code path is proven
  to be part of those chains.
- Do not replace deletion with permissions, feature flags, character limits,
  disabled buttons, 501 compatibility routes, or legacy aliases.
- Do not keep old API compatibility for `enrich`, `refine`, deleted Chat page,
  deleted Wiki page, or deleted Signal page endpoints/tools.

## Local Code Facts

### AlembicDashboard candidate page

`AlembicDashboard/src/components/Views/CandidatesView.tsx` currently contains:

- `RefineProgressBar` import and rendering.
- `api.enrichCandidates(...)` calls for single and batch field completion.
- `globalChat.openRefine(...)` calls for batch and single candidate refinement.
- AI completion/refinement action buttons and host-managed unavailable UI.
- refinement-enhanced info blocks and stale comments stating that refinement
  moved to Global Chat.

Required change: remove the complete completion/refinement UI and state from
the candidate page while preserving candidate navigation, filtering, selection,
review, delete, promote, and detail rendering.

### AlembicDashboard Chat pages and surfaces

`AlembicDashboard/src/App.tsx` currently imports `AiChatView` and renders it
when `activeTab === 'ai'`.

`AlembicDashboard/src/components/Views/AiChatView.tsx` currently implements the
full-screen AI chat page and calls `api.chatStream(...)`.

`AlembicDashboard/src/components/Shared/GlobalChatDrawer.tsx` currently exposes:

- `openChat(...)` and a persistent drawer-style Chat surface.
- `GlobalChatAPI.openRefine(...)`.
- shared chat state used by `AiChatView`.
- ordinary chat streaming through `api.chatStream(...)`.
- refine mode state and automatic refine topic creation.
- refine preview streaming through `api.refinePreviewStream(...)`.
- refine apply through `api.refineApply(...)`.
- refine context cards, preset prompts, preview diff controls, and refine
  action bars.

`AlembicDashboard/src/components/Layout/Sidebar.tsx`,
`AlembicDashboard/src/components/Layout/Header.tsx`, and
`AlembicDashboard/src/components/Layout/CommandPalette.tsx` currently advertise
the `ai` page.

Required change: delete Dashboard Chat pages/surfaces, including `AiChatView`,
Global Chat drawer UI, chat page/drawer open controls, chat navigation entries,
chat topic UI, chat page i18n/help copy, and chat page API calls. Remove
refine mode as part of this deletion. If any chat backend/service code is used
outside Dashboard pages, implementation must document the non-page consumer and
split/preserve only that non-page contract.

### AlembicDashboard Wiki pages and surfaces

`AlembicDashboard/src/App.tsx` currently imports `WikiView` and renders it when
`activeTab === 'wiki'`.

`AlembicDashboard/src/components/Layout/Sidebar.tsx`,
`AlembicDashboard/src/components/Layout/Header.tsx`, and
`AlembicDashboard/src/components/Layout/CommandPalette.tsx` currently advertise
the `wiki` page.

`AlembicDashboard/src/components/Views/WikiView.tsx` currently has:

- a complete Wiki page for generation/status/file list/file reading/update;
- `polished?: boolean` on `WikiMetaFile`.
- tree-level AI enhanced sparkle rendering for polished files.
- reader toolbar AI badge rendering through `wiki.aiBadge`.

Required change: delete Dashboard Wiki-related pages/surfaces, including
`WikiView`, Wiki tab rendering, Wiki navigation entries, Wiki page actions,
Wiki page i18n/help copy, Wiki page API calls, and polish/enhanced metadata
display. If any Wiki backend/service code is used outside Dashboard pages,
implementation must document the non-page consumer and split/preserve only that
non-page contract.

### AlembicDashboard Signal pages and surfaces

`AlembicDashboard/src/App.tsx` currently imports `SignalReportView` and renders
it when `activeTab === 'signals'`.

`AlembicDashboard/src/components/Layout/Sidebar.tsx`,
`AlembicDashboard/src/components/Layout/Header.tsx`, and
`AlembicDashboard/src/components/Layout/CommandPalette.tsx` currently advertise
the `signals` page.

`AlembicDashboard/src/components/Views/SignalReportView.tsx` currently
implements a Signals/Reports/Logs page and calls:

- `api.getSignalTrace(...)`
- `api.getSignalStats(...)`
- `api.getReports(...)`

Required change: delete Dashboard Signal pages/surfaces, including
`SignalReportView`, Signals tab rendering, Signals navigation entries, signal
trace/stats/report page API calls, signal page i18n/help copy, and page-only
report/log display support. If the underlying Core signal infrastructure is
used outside Dashboard pages, preserve it and remove only the page-facing query
contract or split ownership with a named non-page consumer.

### AlembicDashboard API, help, and i18n

`AlembicDashboard/src/api.ts` currently exposes:

- `enrichCandidates(...)`.
- `bootstrapRefine(...)`.
- `refinePreview(...)`.
- `refineApply(...)`.
- `refinePreviewStream(...)` with `/api/v1/candidates/refine-preview-stream`
  and `/api/v1/candidates/refine-preview/events/:sessionId`.
- `chat(...)` and `chatStream(...)` for `/ai/chat` and
  `/api/v1/ai/chat/*`.
- Wiki page methods: `wikiGenerate(...)`, `wikiUpdate(...)`, `wikiAbort(...)`,
  `wikiStatus(...)`, `wikiFiles(...)`, and `wikiFileContent(...)`.
- Signal page methods: `getSignalTrace(...)`, `getSignalStats(...)`, and
  `getReports(...)` for `/signals/trace`, `/signals/stats`, and
  `/signals/reports`.

Dashboard i18n/help currently includes candidate AI completion/refinement,
Chat page and drawer copy, Wiki page copy, Signal page copy, Wiki AI badge,
low-quality refinement hints, and help copy for candidate enrichment, Chat
agent, Wiki doc generation, and Signals/Reports/Logs surfaces.

Required change: delete these methods and user-facing strings when no longer
used. Update help tables so the dashboard does not advertise a removed MCP tool
or removed candidate AI, Chat page, Wiki page, or Signal page workflow.

### AlembicPlugin HTTP support

`AlembicPlugin/lib/http/routes/candidates.ts` currently defines the
host-managed candidate completion/refinement backend boundary:

- `/api/v1/candidates/enrich`
- `/api/v1/candidates/bootstrap-refine`
- `/api/v1/candidates/refine-preview`
- `/api/v1/candidates/refine-preview-stream`
- `/api/v1/candidates/refine-preview/events/:sessionId`
- `/api/v1/candidates/refine-apply`

`AlembicPlugin/lib/http/HttpServer.ts` mounts the candidates router under
`/api/v1/candidates`.

Required change: delete the routes, route module, request schemas, helper
functions, stream/event support, and server mount when they are exclusively for
the removed feature. Do not keep 501 or host-managed compatibility endpoints.
Also delete Plugin HTTP support that is exclusively for deleted Dashboard Chat
or Wiki pages.

`AlembicPlugin/lib/http/routes/signals.ts` currently defines:

- `GET /api/v1/signals/trace`
- `GET /api/v1/signals/stats`
- `GET /api/v1/signals/reports`

`AlembicPlugin/lib/http/HttpServer.ts` mounts the signals router under
`/api/v1/signals`.

Required change: delete the signals router, request parsing, mount, tests, and
Dashboard-facing report/log query support when the only consumer is the deleted
Signal page. If a non-page API is found in the same module during
implementation, split and preserve only that non-page API with a named
consumer.

### AlembicPlugin MCP support

The MCP surface still exposes `alembic_enrich_candidates` through:

- `AlembicPlugin/lib/codex/mcp/McpServer.ts`
- `AlembicPlugin/lib/codex/mcp/handlers/candidate.ts`
- `AlembicPlugin/lib/shared/schemas/mcp-tools.ts`
- `AlembicPlugin/lib/codex/mcp/tools.ts`
- `AlembicPlugin/lib/codex/mcp/PluginToolSurfaceCatalog.ts`
- `AlembicPlugin/lib/codex/mcp/core-tools/output.ts`

Required change: remove `alembic_enrich_candidates` from handler routing,
schema exports, tool definitions, tool catalog, output projector/allowlists, and
any generated or static tool list. If `candidate.ts` also contains unrelated
validation/duplicate code, preserve that code only if it has a real current
consumer and a non-refine product contract.

### AlembicCore guidance

`AlembicCore/src/workflows/capabilities/host-agent/MissionBriefingSupport.ts`
still tells agents to call `alembic_enrich_candidates(candidateIds)` to fill
missing fields.

Required change: remove or replace that guidance with the current supported
workflow. The replacement must not point to a removed tool or imply that
candidate field completion remains available through another hidden channel.

## Proposed Implementation Sequence

### DCR0 Delete Map And Preserve Map

Before code edits, produce a short delete map from live searches:

- all frontend imports, states, handlers, components, i18n keys, and help rows
  tied to candidate completion/refinement, Chat pages/surfaces, and Wiki
  pages/surfaces, and Signal pages/surfaces;
- Dashboard navigation and routing entries for `ai`, `wiki`, and `signals`;
- frontend API methods for deleted candidate, Chat, Wiki, and Signal surfaces;
- all HTTP routes, schemas, mounts, helpers, and tests tied to candidate
  completion/refinement or deleted page-specific Chat/Wiki/Signal support;
- all MCP schemas, tools, catalogs, handlers, output projectors, and docs tied
  to `alembic_enrich_candidates`;
- all Core guidance references;
- preserved non-page workflows and their representative validation commands.

This phase prevents accidental deletion of unrelated candidate lifecycle,
bootstrap/rescan, knowledge-submission, Recipe/Guard/Decision, Core SignalBus
runtime behavior, or non-page MCP/automation behavior.

### DCR1 Candidate Page Frontend Deletion

Remove from `CandidatesView.tsx`:

- single and batch AI field completion handlers;
- single and batch AI refinement handlers;
- `RefineProgressBar` import/rendering and the component file if unused;
- host-managed candidate AI unavailable state and notices if only used for
  completion/refinement;
- completion/refinement action buttons and related disabled states;
- refine-enhanced display blocks and stale refine comments.

Then remove unused API calls, types, icons, state variables, and i18n keys.
The candidate page should remain a clean candidate review surface.

### DCR2 Dashboard Chat Page Deletion

Remove Dashboard Chat page/surface support:

- `AiChatView` and its route/render branch;
- `GlobalChatDrawer` UI and page/drawer open controls if no non-page consumer
  remains;
- Sidebar/Header/CommandPalette `ai` navigation;
- chat topic UI and page state;
- chat page API methods and stream helpers;
- chat i18n/help copy;
- `openRefine` API and consumers;
- refine mode state and refine topic prefix behavior;
- refine context card;
- refine preset prompt buttons;
- refine preview streaming branch;
- refine diff/field toggle controls;
- refine apply action;
- refine-specific success/failure messages.

Delete page-specific backend support if code audit proves it exists only for
Dashboard Chat. If an underlying chat or context capability is used by a
non-page MCP/automation path, split the ownership and keep only that non-page
contract.

### DCR3 Dashboard Wiki Page Deletion

Remove Dashboard Wiki page/surface support:

- `WikiView` and its route/render branch;
- Sidebar/Header/CommandPalette `wiki` navigation;
- Wiki page action buttons, search/list/reader UI, generation/update/abort UI,
  and status banners;
- Wiki page API methods;
- Wiki page i18n/help copy;
- `polished?: boolean` from Wiki frontend metadata if it is only used for UI
  polish indicators;
- AI enhanced sparkle/badge rendering;
- `wiki.aiBadge` and related i18n keys if unused;
- quality refinement copy that suggests Wiki/candidate polish as a follow-up.

Delete page-specific backend support if code audit proves it exists only for
Dashboard Wiki. If an underlying Wiki planning/finalization or documentation
capability is used by a non-page MCP/automation path, split the ownership and
keep only that non-page contract.

### DCR4 Dashboard Signal Page Deletion

Remove Dashboard Signal page/surface support:

- `SignalReportView` and its route/render branch;
- Sidebar/Header/CommandPalette `signals` navigation;
- signal trace/stats/reports UI;
- signal page API methods;
- signal page i18n/help copy;
- page-only report/log display types and helpers.

Delete page-specific backend support if code audit proves it exists only for
Dashboard Signals. Preserve Core `SignalBus`, signal emission, signal-based
ranking, Guard feedback, and other runtime internals unless they have no
non-page consumer and the controller accepts their removal.

### DCR5 Plugin HTTP Deletion

Remove candidate completion/refinement and deleted page HTTP support from
AlembicPlugin:

- delete `lib/http/routes/candidates.ts` if it contains only deleted routes;
- otherwise split out and remove only completion/refinement routes;
- remove the `/api/v1/candidates` mount when no route remains;
- delete request body schemas for enrich/refine when unused;
- delete stream/event session plumbing for refine preview;
- delete tests or fixtures that assert 501/410 host-managed refine behavior.
- delete Chat/Wiki page-specific HTTP routes, schemas, stream/event helpers,
  and tests when code audit proves they only serve deleted Dashboard pages.
- delete Signal page-specific HTTP routes, schemas, report/query helpers, and
  tests when code audit proves they only serve the deleted Dashboard Signal
  page.

The desired result is no reachable HTTP endpoint for the removed
completion/refinement feature or deleted Dashboard Chat/Wiki/Signal pages.

### DCR6 MCP And Core Tool Cleanup

Remove `alembic_enrich_candidates` from:

- MCP handler map;
- `candidateHandlers.enrichCandidates` when unused;
- MCP input schemas and type exports;
- MCP static tool definitions;
- Plugin tool surface catalog;
- output allowlists/projectors;
- help docs and dashboard tool tables;
- Core mission briefing support.

Then verify `tools/list` and representative tool calls do not mention or route
to the removed tool.

### DCR7 Validation And Acceptance

Minimum validation evidence:

- Dashboard typecheck/build passes.
- Dashboard UI smoke or route/component validation proves the candidate page
  still renders without deleted AI actions and that Chat/Wiki/Signal page
  routes, navigation entries, and open controls are gone.
- Negative search proves no live references to:
  - `enrichCandidates`
  - `bootstrapRefine`
  - `refinePreview`
  - `refineApply`
  - `refinePreviewStream`
  - `openRefine`
  - `RefineProgressBar`
  - `AiChatView`
  - live `WikiView` route/navigation references
  - `SignalReportView`
  - live `signals` route/navigation references
  - `getSignalTrace`
  - `getSignalStats`
  - live Dashboard `getReports` signal-page consumer
  - `alembic_enrich_candidates`
  - candidate refine HTTP route names
- Negative route/API probes prove deleted Chat/Wiki/Signal page endpoints are
  gone when they are page-exclusive routes.
- AlembicPlugin build/test passes.
- MCP `tools/list` output does not contain `alembic_enrich_candidates`.
- HTTP route negative probe returns normal 404/no-route behavior for deleted
  enrich/refine endpoints, not 501 compatibility stubs.
- AlembicCore build/test or targeted check passes after mission briefing
  cleanup.
- Representative preserved non-page workflows pass:
  - candidate list/review/delete/promote path;
  - knowledge submission or Recipe-related MCP smoke;
  - bootstrap/rescan or other non-page capability smoke when touched.

## Acceptance Criteria

- The deleted candidate AI feature has no visible UI entrypoint in the
  candidate page.
- Dashboard Chat pages/surfaces have no visible navigation, route, open
  control, component render branch, API method, page-specific backend route, or
  help/i18n copy.
- Dashboard Wiki-related pages/surfaces have no visible navigation, route,
  component render branch, API method, page-specific backend route, or help/i18n
  copy.
- Dashboard Signal pages/surfaces have no visible navigation, route, component
  render branch, API method, page-specific backend route, or help/i18n copy.
- The deleted feature has no frontend API method or SSE helper.
- The deleted feature has no Plugin HTTP endpoint, server mount, route helper,
  request schema, or compatibility response.
- The deleted feature has no MCP tool, schema, handler, catalog entry, output
  shaping, or tools/list surface.
- AlembicCore does not instruct agents to use the removed tool.
- Help, i18n, docs, and user-facing copy do not advertise candidate
  completion/refinement, Dashboard Chat pages, Dashboard Wiki pages, or
  Dashboard Signal pages.
- Preserved non-page workflows remain functionally complete and validated.
- No compatibility layer remains for old enrich/refine endpoint/tool names.
- Controller acceptance reviews raw diffs, negative searches, build/test logs,
  tools/list output, UI route negatives, HTTP negative probes, and preserved
  non-page workflow evidence.

## Risks And Required Care

- The word "fill" appears in other legitimate workflows such as rescan gap
  filling and rejected knowledge-field repair. Those must not be deleted unless
  they are directly part of candidate AI field completion/refinement.
- `candidate.ts` may contain validation and duplicate-check helpers that are
  not the same as completion/refinement. Remove the enrich tool chain, but do
  not delete still-supported validation behavior without a separate confirmed
  deletion decision.
- Chat code may share state, SSE utilities, or topic persistence with other
  runtime flows. Removing Dashboard Chat pages must not silently remove a
  non-page consumer.
- Wiki metadata and Wiki planning/finalization may be generated by backend or
  file processors. Removing Dashboard Wiki pages must not silently remove a
  non-page MCP/automation contract unless the deletion map proves it is
  page-exclusive or the controller accepts the replacement.
- Signal code may be runtime infrastructure, not only a page. Removing the
  Dashboard Signal page must not silently remove Core SignalBus, Guard/search
  signal emission, signal aggregation used by non-page diagnostics, or MCP
  runtime behavior unless ownership proof shows it is page-exclusive.
- The backend currently has host-managed boundary routes. These should be
  deleted, not preserved as "clean" unavailable responses.

## Forbidden Conclusions

- "Buttons are hidden, so the feature is deleted."
- "Backend returns 501/410, so the feature is deleted."
- "The MCP tool is undocumented, so it can remain."
- "Chat navigation is hidden, so the Chat page is deleted."
- "Wiki navigation is hidden, so the Wiki page is deleted."
- "Dashboard Wiki pages are deleted, so MCP wiki planning/finalization can be
  deleted without ownership proof."
- "Dashboard Signal pages are deleted, so Core SignalBus or all signal emission
  can be deleted without ownership proof."
- "A broad search for Chinese `fill` found unrelated rescan text, so all fill
  wording should be removed."
