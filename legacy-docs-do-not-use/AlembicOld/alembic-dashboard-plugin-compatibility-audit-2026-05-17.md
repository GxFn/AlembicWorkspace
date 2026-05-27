# AlembicDashboard Plugin Compatibility Audit

Date: 2026-05-17

Scope: Dashboard phase D2. Compare `AlembicDashboard` against `AlembicPlugin/dashboard`.

Baseline rule: `AlembicDashboard` keeps the `Alembic/dashboard` implementation as the source of truth. `AlembicPlugin/dashboard` is audit material only and must not overwrite the new frontend repository.

## Summary

- Decision: keep the current `AlembicDashboard` frontend unchanged.
- Main-authoritative additions: AI Assistant tab, Repo Wiki tab, chat stream hooks, chat topic persistence, SignalCollector-backed Skill suggestions, sandbox status badge, and expanded Help/i18n copy.
- Plugin compatibility work belongs in the AlembicPlugin window:
  - Add `/api/v1/ai/env-config` GET/POST aliases or otherwise match the Dashboard LLM config contract.
  - Add or mount `/api/v1/wiki/*` routes before enabling the shared Dashboard in plugin runtime.
  - Add `/api/v1/skills/suggest` and `/api/v1/skills/signal-status`, or return compatible empty responses.
  - Include `codex` in Dashboard `DaemonJobRecord.source` only if shared types need to display Codex-created jobs.

Verification performed:

- Compared `AlembicDashboard` to `AlembicPlugin/dashboard` with generated output and dependency folders excluded.
- Checked critical frontend diffs listed in the migration plan.
- Read-only checked Alembic and AlembicPlugin backend route availability for AI config, chat stream, Wiki, Skill suggestions, and Signal status.
- Ran `npm run build` after the audit; build passed.

## Difference Inventory

Files present only in `AlembicDashboard`:

- `src/components/Views/AiChatView.tsx`
- `src/components/Views/WikiView.tsx`
- `src/hooks/useChatStream.ts`
- `src/hooks/useChatTopics.ts`

Changed files:

- `src/App.tsx`
- `src/api.ts`
- `src/components/Layout/CommandPalette.tsx`
- `src/components/Layout/Header.tsx`
- `src/components/Layout/Sidebar.tsx`
- `src/components/Modals/LlmConfigModal.tsx`
- `src/components/Shared/GlobalChatDrawer.tsx`
- `src/components/Shared/PageOverlay.tsx`
- `src/components/Views/CandidatesView.tsx`
- `src/components/Views/HelpView.tsx`
- `src/components/Views/SkillsView.tsx`
- `src/constants/index.ts`
- `src/i18n/locales/en.ts`
- `src/i18n/locales/zh.ts`

## File Decisions

file: `src/App.tsx`
decision: `main-authoritative`
reason: The Dashboard baseline wires AI and Wiki tabs, SignalCollector polling, Skills recommendation badges, Wiki-specific layout behavior, and the general AI chat surface. The plugin version removes these surfaces and falls back to Help for unknown tabs.
verification: Frontend diff confirms the plugin version removes `AiChatView`, `WikiView`, `signalSuggestionCount`, and `api.getLlmEnvConfig()`. Backend read-only check shows plugin already has AI chat stream but needs config alias and Wiki route compatibility.

file: `src/api.ts`
decision: `main-authoritative` with `plugin-compat-needed`
reason: The Dashboard baseline includes unified SSE consumption, `/ai/chat`, `/ai/chat/stream`, `/ai/env-config`, Skill suggestion/status endpoints, Wiki endpoints, and sandbox fields in test-mode. Plugin frontend uses `/ai/workspace-config`, includes `codex` job source, and lacks several newer client methods.
verification: Backend read-only check shows Alembic has `/ai/env-config`, `/wiki/*`, `/skills/suggest`, and `/skills/signal-status`; AlembicPlugin has `/ai/workspace-config` and `/ai/chat/stream`, but no mounted Wiki route and no Skill suggest/signal-status routes. Plugin window should add API aliases or compatible empty responses.

file: `src/components/Layout/CommandPalette.tsx`
decision: `main-authoritative`
reason: The Dashboard baseline registers command entries for `ai` and `wiki`. Removing them would hide complete mainline features.
verification: Diff shows plugin version removes `ai` and `wiki` tab icon/label mappings.

file: `src/components/Layout/Header.tsx`
decision: `main-authoritative` with `plugin-compat-needed`
reason: The Dashboard baseline keeps the AI chat toggle, sandbox status badges, and `saveLlmEnvConfig`. The plugin version uses `saveLlmWorkspaceConfig` and removes chat/sandbox UI.
verification: Backend route check shows plugin should provide the env-config alias or the shared Dashboard will fail LLM config save/read in plugin runtime.

file: `src/components/Layout/Sidebar.tsx`
decision: `main-authoritative`
reason: The Dashboard baseline exposes AI Assistant, Repo Wiki, and Skill signal badge navigation. These are complete frontend surfaces and should not be removed for plugin compatibility.
verification: Diff shows plugin removes `ai`, `wiki`, and signal badge support.

file: `src/components/Modals/LlmConfigModal.tsx`
decision: `main-authoritative` with `plugin-compat-needed`
reason: The Dashboard baseline uses `getLlmEnvConfig` and `saveLlmEnvConfig`, matching the main repo route name retained for compatibility with older Dashboard behavior. Plugin currently uses workspace-config naming.
verification: AlembicPlugin route check shows `/ai/workspace-config`; plugin window should add `/ai/env-config` aliases or an adapter.

file: `src/components/Shared/GlobalChatDrawer.tsx`
decision: `main-authoritative`
reason: The Dashboard baseline turns the drawer into both general AI chat and candidate refinement, with topic persistence and stream event handling. The plugin version is a candidate refinement panel only.
verification: Diff shows plugin removes `openChat`, `toggle`, `newTopic`, topic hooks, chat history, and chat stream handling.

file: `src/components/Shared/PageOverlay.tsx`
decision: `main-authoritative`
reason: Text/comments differ to describe the broader AI Chat panel. No plugin behavior should overwrite it.
verification: Diff is naming/comment-only around the right offset behavior.

file: `src/components/Views/AiChatView.tsx`
decision: `main-authoritative`
reason: This is a mainline AI Assistant view absent from the plugin snapshot. It is part of the extracted source of truth.
verification: File exists only in `AlembicDashboard`; plugin backend has chat stream routes, so plugin should support it rather than remove the UI.

file: `src/components/Views/CandidatesView.tsx`
decision: `main-authoritative`
reason: Differences are wording around AI chat refinement versus candidate refinement panel. The mainline wording matches the shared GlobalChatDrawer role.
verification: Diff is comment-only; no runtime compatibility concern.

file: `src/components/Views/HelpView.tsx`
decision: `main-authoritative`
reason: The Dashboard baseline documents Wiki generation, VS Code extension surfaces, and wiki MCP flow. Plugin version has older/smaller capability text.
verification: Diff shows plugin removes Wiki doc generation, wiki MCP rows, and VS Code extension sections.

file: `src/components/Views/SkillsView.tsx`
decision: `main-authoritative` with `plugin-compat-needed`
reason: The Dashboard baseline includes SignalCollector-backed Skill recommendations and AI-generated Skill creation. The plugin version only has manual Skills CRUD.
verification: Plugin route check shows Skills CRUD exists, but `/skills/suggest` and `/skills/signal-status` are absent. Plugin window should add compatible routes or empty-response fallbacks.

file: `src/components/Views/WikiView.tsx`
decision: `main-authoritative` with `plugin-compat-needed`
reason: Repo Wiki is a mainline Dashboard feature and must remain in the shared frontend.
verification: File exists only in `AlembicDashboard`. Alembic has mounted `/wiki/*` routes; AlembicPlugin has Wiki services but no mounted route in the checked route list.

file: `src/constants/index.ts`
decision: `main-authoritative`
reason: `validTabs` includes `ai` and `wiki` in the Dashboard baseline. These tabs are part of the new frontend repository contract.
verification: Diff shows plugin excludes `ai` and `wiki`.

file: `src/hooks/useChatStream.ts`
decision: `main-authoritative`
reason: Required by the general AI chat stream UI in `GlobalChatDrawer`.
verification: File exists only in `AlembicDashboard`.

file: `src/hooks/useChatTopics.ts`
decision: `main-authoritative`
reason: Required by chat topic persistence for general AI chat and refinement sessions.
verification: File exists only in `AlembicDashboard`.

file: `src/i18n/locales/en.ts`
decision: `main-authoritative`
reason: English copy includes AI Assistant, Repo Wiki, sandbox labels, Skill recommendations, and Help text matching mainline Dashboard capabilities.
verification: Diff shows plugin removes those translation sections and has older capability counts.

file: `src/i18n/locales/zh.ts`
decision: `main-authoritative`
reason: Chinese copy mirrors the mainline capabilities and should stay aligned with the source-of-truth Dashboard.
verification: Diff shows plugin removes AI Assistant, Repo Wiki, sandbox, and Skill recommendation strings.

## AlembicPlugin Window Follow-Up

After Dashboard D3 is complete, the AlembicPlugin window should not patch the Dashboard frontend down to the plugin snapshot. Instead it should:

1. Add `vendor/AlembicDashboard` and keep plugin source consumption external.
2. Add `/api/v1/ai/env-config` GET/POST compatibility aliases that call the existing workspace-config implementation.
3. Mount or implement `/api/v1/wiki/generate`, `/api/v1/wiki/update`, `/api/v1/wiki/abort`, `/api/v1/wiki/status`, `/api/v1/wiki/files`, and `/api/v1/wiki/file/:path`.
4. Add `/api/v1/skills/suggest` and `/api/v1/skills/signal-status`, returning empty compatible data if full SignalCollector behavior is not ready.
5. Decide whether `DaemonJobRecord.source` should include `codex` in the shared Dashboard client type; if plugin jobs can return `codex`, this is a small frontend compatibility patch for a later Dashboard round.
6. Run the plugin validation sequence from the migration plan before removing `AlembicPlugin/dashboard` source.
