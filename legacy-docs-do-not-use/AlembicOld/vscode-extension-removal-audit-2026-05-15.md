# VSCode Extension Removal Audit

Date: 2026-05-15
Scope: `resources/vscode-ext/` and all Alembic core/dashboard/release paths that still reference the VSCode extension.

This is an investigation document only. No deletion is performed here.

## Executive Summary

The VSCode extension is still a real build and setup artifact, but its currently active surface is narrower than the product/docs copy claims.

Active today:

- Command palette commands: search, create from selection, audit file, audit open project documents, status.
- VS Code Language Model tool: `#alembic`, forwarding requests to `POST /api/v1/task`.
- Status bar health polling against `GET /api/v1/health`.
- Manual Guard diagnostics and Guard code actions.
- File change collector that posts IDE/Git events to `POST /api/v1/file-changes`.
- Reactive popup flow driven by file-change reports.

Disabled, stale, or broken today:

- CodeLens directive UI is commented out in `extension.ts`, and still points to old `asd._executeDirective` command IDs.
- On-save directive detection is commented out.
- Guard "save-time auto check" is documented in Dashboard help, but the active diagnostic provider only runs when commands call it.
- Status bar click uses `asd.status`, while contributed/registered commands are `alembic.status`.
- Guard fix search action calls `asd.search`, while the active command is `alembic.search`.
- README and Dashboard help still describe `asd.*` command/settings names and CodeLens/on-save behavior as if fully active.
- Extension settings such as `alembic.enableDirectiveDetection`, `alembic.enableCodeLens`, and `alembic.enableGuardDiagnostics` are mostly not wired into active runtime behavior.

Deletion is feasible if Codex plugin/MCP is now the primary product surface. The main caution: do not delete `FileChangeDispatcher` or `FileChangeHandler` as part of deleting VSCode extension, because the newer Codex git diff checkpoint path also uses the dispatcher/handler chain.

## File Inventory

### Extension Package

Directory: `resources/vscode-ext/`

- `package.json`
  - Declares VS Code extension metadata, commands, configuration, keybinding, and `languageModelTools`.
  - Activation event: `onStartupFinished`.
  - Main entry: `./out/extension.js`.
  - Commands contributed: `alembic.search`, `alembic.create`, `alembic.audit`, `alembic.auditProject`, `alembic.status`.
  - LM tool name/reference: `alembic`.
- `src/extension.ts`
  - Main activation wiring.
  - Registers task tool, status bar, Guard diagnostics, Guard code actions, and command palette commands.
  - Instantiates `FileChangeCollector`.
  - Contains disabled CodeLens and directive detection code paths.
- `src/apiClient.ts`
  - HTTP client for `/health`, `/search`, `/knowledge`, `/guard/file`, `/guard/batch`, `/file-changes`, `/file-changes/heartbeat`.
  - Uses fixed host/port settings, default `localhost:3000`.
- `src/FileChangeCollector.ts`
  - Watches VS Code file events and periodically samples Git dirty state.
  - Buffers and coalesces events before posting them to Alembic HTTP API.
  - Sends heartbeat every 60 seconds.
- `src/taskTool.ts`
  - Registers VS Code Language Model tool `alembic`.
  - Forwards raw operation payloads to `POST /api/v1/task`.
- `src/guardDiagnostics.ts`
  - Calls `POST /api/v1/guard/file`.
  - Converts violations into VS Code diagnostics.
- `src/guardCodeAction.ts`
  - Adds code actions for Alembic Guard diagnostics.
  - Search action is command-ID broken; disable-next-line action still works mechanically.
- `src/projectScope.ts`
  - Detects whether workspace belongs to Alembic via `Alembic/`, `.asd/`, and `~/.asd/projects.json`.
- `src/statusBar.ts`
  - Polls health and shows `AS` status.
  - Click command is stale: `asd.status`.
- `src/directiveDetector.ts`
  - Parses `// asd:*` and `// as:*` directives.
  - Currently mostly unused because on-save directive detection is disabled.
- `src/codeLensProvider.ts`
  - Provides directive CodeLens commands.
  - Currently unused and command IDs are stale.
- `src/codeInserter.ts`
  - Inserts selected search result code into editor and highlights inserted range.
  - Header/import insertion support exists in helper form but is not active.

### Core/Repo References

- `package.json`
  - `install:vscode-ext`
  - `build:vscode-ext`
  - `package:vscode-ext`
  - `check` includes `npm run build:vscode-ext`
- `.github/workflows/ci.yml`
  - Installs and builds VSCode extension in build and API smoke jobs.
- `.github/workflows/release.yml`
  - Installs/builds/packages VSCode extension and uploads VSIX artifact.
- `scripts/release.ts`
  - Release checker builds VSCode extension as a release artifact.
- `lib/cli/deploy/FileManifest.ts`
  - Manifest entry `vscode-extension` runs on setup.
- `lib/cli/deploy/FileDeployer.ts`
  - Generator `installVSCodeExtension()` compiles, packages, and installs the VSIX into `code`, `cursor`, and `codex` CLIs.
- `dashboard/src/components/Views/HelpView.tsx`
  - Renders VSCode Extension help section.
- `dashboard/src/i18n/locales/zh.ts` and `dashboard/src/i18n/locales/en.ts`
  - Product copy still includes VSCode Extension, CodeLens, save-time Guard, and `asd.*` commands.
- `AGENTS.md`
  - Lists `resources/vscode-ext/` as a subproject.
- `CHANGELOG.md`
  - Historical mention only. Usually safe to leave as history unless the deletion change also adds a new changelog entry.

## Runtime Flow

### Activation

`activate(context)` in `extension.ts` runs after VS Code startup.

Flow:

1. Register VS Code LM task tool via `registerTaskTool(context)`.
2. Read extension config:
   - `alembic.serverHost`
   - `alembic.serverPort`
3. Create `ApiClient`.
4. If current workspace has an Alembic marker, show/poll status bar.
5. Register Guard diagnostics and Guard code actions.
6. Register command palette commands.
7. Watch configuration/workspace/editor changes.
8. Construct `FileChangeCollector`.

The collector constructor returns early when no Alembic project is detected, but the extension itself still activates on every VS Code startup.

### Command Palette

`alembic.search`

- Requires server connection.
- Prompts query.
- Requires active editor.
- Calls `/api/v1/search`.
- Shows QuickPick.
- Inserts selected code block at trigger line or cursor.
- Header/import insertion is disabled by current code.

`alembic.create`

- Requires server connection.
- Requires selected text.
- Prompts title.
- Calls `/api/v1/knowledge`.
- Payload marks lifecycle as `draft` and source as `vscode:<file>`.

`alembic.audit`

- Requires server connection and active editor.
- Calls Guard diagnostics.
- Calls `/api/v1/guard/file` again for summary, so current file audit performs duplicate HTTP checks.
- Also deletes first detected audit directive line when directive scope is not project, even though directive execution is otherwise disabled.

`alembic.auditProject`

- Requires server connection.
- Only audits currently open text documents under active Alembic project roots.
- It does not traverse the project file tree.
- Calls `/api/v1/guard/file` for each document, then re-checks documents with violations through diagnostics, causing repeated requests for failing files.

`alembic.status`

- Checks status bar health.
- If disconnected, offers to open a terminal and run `asd ui`.
- Status bar itself currently points to `asd.status`, so clicking the bar does not invoke this command.

### Language Model Tool

`taskTool.ts` registers an LM tool named `alembic`.

Flow:

1. VS Code/Copilot invokes the tool with an operation payload.
2. Extension forwards payload to `POST /api/v1/task`.
3. HTTP route calls the MCP task handler with a minimal MCP context.

Boundary notes:

- No project scope check in the tool itself.
- No auth or token handshake.
- Depends entirely on configured localhost host/port.
- Tool schema only requires `operation`; description mentions several operations, and runtime has special response shaping for `prime` and `record_decision`.

### Guard Diagnostics And Code Actions

Diagnostics:

- The extension creates `DiagnosticCollection('alembic-guard')`.
- Diagnostics are cleared when a document closes.
- Checks happen when extension commands call `guardDiagnostics.checkFile(document)`.
- The configuration setting `alembic.enableGuardDiagnostics` is declared, but not effectively read to enable/disable active checks.

Code actions:

- For diagnostics from source `Alembic Guard`, it offers:
  - Search Alembic knowledge for the rule.
  - Insert `// alembic-disable-next-line: <ruleId>`.
- Search action is broken because it calls `asd.search`, not `alembic.search`.
- Disable comment always uses `//`, which is wrong for languages that do not use slash comments.

### File Change Collector

`FileChangeCollector` is the extension's most important runtime side effect.

Sources:

- `onDidRenameFiles`
- `onDidSaveTextDocument`
- `onDidDeleteFiles`
- `onDidCreateFiles`
- Git HEAD comparison
- Git working tree dirty-set sampling

Outbound endpoints:

- `POST /api/v1/file-changes`
- `POST /api/v1/file-changes/heartbeat`

Buffer behavior:

- Flush delay: 3 seconds.
- Modified-file cooldown: 30 seconds.
- Coalesces created+deleted into no event.
- Prioritizes `ide-edit` over Git sources when merging same path events.

Reactive popup:

- Only opens for reports with:
  - `eventSource === 'ide-edit'`
  - `suggestReview === true`
  - details with direct/pattern impact and needs-review/deprecate action.
- Global cooldown: 2 minutes.
- Per Recipe dismiss backoff grows in days and caps at 7 days.
- "Review" opens VS Code chat with a prompt asking the agent to call MCP `alembic_evolve`.
- "Auto Check" opens terminal and runs `asd evolve-check --recipes <ids>`.
- "Don't Show Again" is session-only.

## Boundary Cases

### Project Scope

Detection:

- Workspace folder is considered in scope when it has `Alembic/` or `.asd/`.
- Ghost registry `~/.asd/projects.json` can also mark roots.

Problems:

- `isFileInScope()` uses string `startsWith(root)`, so path prefix collisions are possible, for example `/repo/app2` matching `/repo/app`.
- Rename/create/delete file events do not call `isDocumentInScope()`; if any workspace folder is an Alembic project, events from unrelated multi-root folders can leak into the collector.
- `vscode.workspace.asRelativePath()` can be ambiguous in multi-root workspaces.
- Scope cache invalidates on workspace folder changes, but not immediately when `.asd/`, `Alembic/`, or registry contents change.

### Server And API Coupling

- Extension assumes HTTP server at configured `host:port`, default `localhost:3000`.
- No daemon discovery.
- No project-root negotiation.
- No auth token.
- Disconnected remediation still suggests `asd ui`/`asd start`, reflecting older CLI naming.

### Git Detection

- Git HEAD watcher watches `.git/HEAD`; normal commits on the same branch often update `.git/refs/heads/<branch>`, not the `.git/HEAD` file content.
- Worktrees with `.git` file are not supported by the extension collector.
- Git diff classification collapses many changes into `modified`.
- Working tree sampling only reports paths newly appearing in dirty set. If an already dirty file changes again, extension does not re-dispatch that change.
- First dirty scan sends all dirty paths.
- Ignore list is narrow: `.asd/`, `.git/`, `node_modules/`. It does not ignore `dist/`, `build/`, cache/log/vendor outputs like the newer Codex git diff checkpoint does.

### Guard Audit Semantics

- Project audit only checks open documents, not actual project files.
- File audit double-calls the Guard endpoint.
- Disable-next-line action uses slash comments in every language.
- Search-fix code action uses stale command ID.
- Guard docs claim save-time automatic checking, but active registration does not attach on-save checks.

### Directive And CodeLens Semantics

- Parser supports `// asd:search`, `// as:s`, `// asd:create`, `// asd:audit`.
- On-save detector is disabled.
- CodeLens provider is disabled.
- Provider still emits `asd._executeDirective`, not `alembic._executeDirective`.
- `cmdExecuteDirective()` and `doCreate()` directive code paths remain in `extension.ts`, but are effectively dead unless registration is restored.

### UI/Docs Drift

- README and Dashboard help advertise CodeLens and save-time Guard as active.
- Dashboard copy names `#asd Agent` and `asd.*` commands while extension package contributes `alembic.*`.
- Product install step says VSCode Extension is installed as part of setup.

## Deletion Impact Map

### Safe Direct Extension Removal Candidates

These are part of the VSCode extension product surface and can be removed if the extension is retired:

- `resources/vscode-ext/`
- Root scripts:
  - `install:vscode-ext`
  - `build:vscode-ext`
  - `package:vscode-ext`
- `package.json` `check` dependency on `build:vscode-ext`.
- CI install/build VSCode extension steps.
- Release workflow VSIX package/upload steps.
- `scripts/release.ts` VSCode extension build step.
- `FileManifest` entry `vscode-extension`.
- `FileDeployer.installVSCodeExtension()`.
- Dashboard Help VSCode Extension section.
- i18n strings that mention VSCode Extension, save-time Guard, CodeLens, `#asd Agent`, and `asd.*` extension commands.
- `AGENTS.md` subproject entry for VSCode Extension.

### Do Not Remove Just Because Extension Is Removed

These are shared or still independently useful:

- `FileChangeDispatcher`
  - Used by Codex git diff checkpoint.
- `FileChangeHandler`
  - Still the domain subscriber that reacts to file-change events.
- `/api/v1/search`
  - Used by Dashboard/MCP/other clients.
- `/api/v1/knowledge`
  - Used by Dashboard/API/knowledge management.
- `/api/v1/guard/file` and `/api/v1/guard/batch`
  - Still generally useful HTTP Guard APIs.
- `.vscode/mcp.json` deployment support.
  - This is MCP/Copilot integration, not the VSCode extension.
- `scripts/install-vscode-copilot.ts`
  - This configures VS Code/Copilot MCP and instructions; it is separate from the VSIX extension.

### Conditional Removal Candidates

These should be removed only after confirming there are no non-extension clients:

- `/api/v1/file-changes/heartbeat`
  - Appears extension-specific after Codex watcher removal.
- `FileChangeSourceTracker`
  - Currently only used by file-change heartbeat route.
  - Its comments still refer to daemon fallback gating, but the Codex daemon watcher path has been removed.
- `/api/v1/task`
  - Route comment explicitly says it exists for VS Code Extension `taskTool.ts`.
  - Need confirm no dashboard/scripts/non-extension consumers before deletion.
- Tests targeting `/api/v1/task`, if the HTTP route is removed while MCP task handler remains.

## Recommended Full Deletion Sequence

1. Remove extension package and build/release wiring.
   - Delete `resources/vscode-ext/`.
   - Remove extension scripts from `package.json`.
   - Remove VSCode extension steps from CI and Release workflows.
   - Remove `build:vscode-ext` from `npm run check`.
   - Remove `scripts/release.ts` VSCode extension build.

2. Remove setup-time VSIX installation.
   - Delete `vscode-extension` manifest entry.
   - Delete `installVSCodeExtension()` generator.
   - Keep `.vscode/mcp.json` deployment and VSCode Copilot MCP configuration unless the product is also dropping VS Code MCP/Copilot support.

3. Update user-facing docs and Dashboard copy.
   - Remove VSCode Extension help section.
   - Remove install-step copy that promises VSIX installation.
   - Remove stale CodeLens/save-time Guard copy.
   - Update `AGENTS.md`.

4. Clean extension-only daemon compatibility.
   - Remove `/api/v1/file-changes/heartbeat`.
   - Remove `FileChangeSourceTracker`.
   - Keep `/api/v1/file-changes` only if git diff checkpoint or other non-extension pathways still need external event ingestion.

5. Re-evaluate `/api/v1/task`.
   - If only VSCode LM tool used it, remove the HTTP route and tests.
   - Keep MCP task handler if MCP tools still expose task behavior.

6. Validate.
   - `npm run typecheck`
   - `npm run lint -- --diagnostic-level=error`
   - `npm run build`
   - `npm run build:dashboard`
   - `npm run test:unit`
   - `npm run test:integration`

## Current Verification

Read-only compile check:

```bash
npm --prefix resources/vscode-ext run compile
```

Result: passed.

This only proves the extension TypeScript still compiles. It does not catch stale command IDs such as `asd.status`, `asd.search`, or disabled CodeLens/on-save flows.

