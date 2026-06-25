# Alembic Interface Contract Deep Optimization Execution Matrix

Date: 2026-06-10

Demand: `alembic-interface-contract-d8-deep-optimization-control-plane-2026-06-10`

Status: controller-produced input for D9-D14. This matrix authorizes product-window investigation and rewrite tasks only. It does not authorize controller-side product code edits, feature reduction, or deletion without the proof gates below.

## Controller Gates

- D7 status was verified from `.wakeflow-active/current/alembic-interface-contract-d7-acceptance-cleanup/wakeflow-state.json`: state `completed`, revision `12`, no blockers or missing target results.
- D8 inputs reviewed: D0 inventory, D1 ADR and registry, accepted D2-D7 target result envelopes, D7 final acceptance state, and current source scans across AlembicCore, AlembicAgent, Alembic, AlembicPlugin, and AlembicDashboard.
- Version and long-term evolution strategy remain deferred.
- Preserve full existing functionality. A candidate may be deleted only with no-consumer proof, connected replacement proof, and representative validation evidence.
- Compatibility may remain only with a current compatibility owner, current consumer, validation evidence, removal trigger, and cleanup blocker.
- Public outputs may expose only public and consumer-needed fields. Diagnostic fields require diagnostic context. Internal, sensitive, and unrelated derived fields must not leak.
- Large reports, snapshots, logs, diagnostics, and replay payloads must use compact summaries plus `detailRef` or `artifactRef`.

## Accepted Baseline From D2-D7

| Demand | Owner | Accepted baseline |
| --- | --- | --- |
| D2 | AlembicCore | Core contract spine accepted at commit `01f34a371afc2bbfc688c902f943791973f0c5bd`. |
| D3 | Alembic | Provider contract manifest, API spec, event registry, and fixtures accepted at commit `9ba8a32f2509d599d8a98775a82d94692c4d79d8`. |
| D4 | AlembicPlugin | Plugin host MCP manifest, clean output tools, route policies, and provider replay accepted at commit `551ba15db93817fee4095e8fec7f225e8218aa6f`. |
| D5 | AlembicAgent | Agent interface fixtures, partial branch support, and public exports accepted at commit `2c7d1ee03851ce42f8f1ad61a0b842c68d19efb4`. |
| D6 | AlembicDashboard | Provider fixture replay and Dashboard consumer normalizers accepted at commit `1bb9ed9`. |
| D7 | Alembic, AlembicAgent | Partial repair and runtime smoke repair accepted. Alembic is ahead of origin by D7 repair commit `fbcf858`. |

## D9 AlembicCore Matrix

Rows covered: `I01`, `I03`, `I04`, `I05`, `I06`, `I07`, `I08`, `I21`, `I23`.

| Candidate | Old entrypoint or logic | Current consumer | Replacement contract | D9 required action | Validation path | Delete or preserve condition | Risk |
| --- | --- | --- | --- | --- | --- | --- | --- |
| D9-C01 Core wildcard public surface | `AlembicCore/package.json` still exports broad families such as `./daemon/*`, `./core/analysis/*`, `./core/ast/*`, `./core/capability/*`, and `./core/discovery/*` at lines 125-170. | Alembic, AlembicPlugin, AlembicDashboard, and Agent build-time imports may consume subpaths. | Producer-owned public spine and explicit contract exports from D2. | Scan all product imports, classify each broad subpath as public contract, internal-but-currently-consumed, or stale. Add boundary tests where broad subpaths remain public. | Core check/build, public export smoke, repo-wide import scan, and at least one consumer build or fixture replay for each still-used public family. | Delete or narrow only when import scan is clean and replacement export is connected. Preserve with owner and cleanup blocker when a current consumer remains. | Breaking a still-current consumer by narrowing exports too early. |
| D9-C02 File monitor compatibility aliases | `AlembicCore/src/daemon/RuntimeContracts.ts` exposes `compatibilityAliases` on `AlembicFileMonitorCapability` at lines 106-110 and emits aliases at lines 247-251. | Dashboard file monitor capability UI and any provider/runtime boundary consumers. | Explicit capability discovery with canonical event sources and alias policy. | Decide whether aliases are diagnostic-only, consumer-needed public fields, or removable. If kept, name owner and cleanup trigger. | Core runtime contracts tests plus Dashboard contract replay against runtime boundary fixtures. | Delete only if Dashboard and provider fixture replay no longer need aliases. Preserve only with currentCompatibilityOwner and validation. | Dashboard may still display or classify alias data. |
| D9-C03 Project scope legacy path resolution | `AlembicCore/src/shared/ProjectScope.ts` keeps `legacyPath`, `byLegacyPath`, and normalization reasons `unique-legacy-path` / `ambiguous-legacy-path` at lines 140-210. | AlembicAgent source evidence, Alembic provider APIs, Dashboard project-scope UI. | Qualified `projectScopeId` and `qualifiedPath` source refs as the first-class contract. | Make qualified refs mandatory in new contract paths, classify `legacyPath` as compatibility input/output, and add ambiguity behavior evidence. | Project scope unit tests, Agent evidence fixture replay, Alembic provider fixture replay, Dashboard project-scope panel contract test. | Keep legacy only for real current consumers with ambiguity tests and cleanup blocker. Delete after no-consumer scan and replacement fixture pass. | Source ref ambiguity can silently remap evidence to the wrong project. |
| D9-C04 Search scorer legacy aliases | `AlembicCore/src/service/search/SearchTypes.ts` has deprecated aliases `BM25Document`, `BM25SearchResult`, and `BM25DocMeta` at lines 28-32 and 73-74. | Older internal imports and tests may still compile through aliases. | Current scorer names: `ScorerDocument`, `ScorerResult`, and `DocMeta`. | Import scan aliases, rewrite active consumers, and either remove aliases or mark preservation owner. | Core tests, typecheck, alias import scan returning zero active product imports before deletion. | Delete only with clean scan. Preserve temporarily with owner and removal trigger. | Low runtime risk, but broad type exports can keep obsolete interface names alive. |

## D10 AlembicAgent Matrix

Rows covered: `I02`, `I16`, `I17`, `I18`.

| Candidate | Old entrypoint or logic | Current consumer | Replacement contract | D10 required action | Validation path | Delete or preserve condition | Risk |
| --- | --- | --- | --- | --- | --- | --- | --- |
| D10-A01 Provider raw response bag | `AlembicAgent/src/ai/AiProvider.ts` defines `ApiResponse = Record<string, any>` at lines 11-14. | Provider adapters and runtime result classification. | Explicit provider output classifier with public fields, diagnostic fields, hidden provider fields, and artifact/detail refs. | Replace raw bag propagation at boundaries with typed projection and field disposition tests. | Agent unit tests covering success, partial, provider-error, timeout, permission, unavailable, and diagnostic branches. | Preserve raw response only inside provider-private adapter scope, never in public result envelope. | Private provider fields or reasoning payloads can leak through public surfaces. |
| D10-A02 DeepSeek text tool-call compatibility | `AlembicAgent/src/ai/deepseek-tool-call-compat.ts` documents text `<function_calls>` as compatibility, not native tool calls, at lines 6-13 and creates compat call ids at lines 31-34. | DeepSeek provider and transport tests. | Native tool-call branch and explicit compatibility branch with source and call id distinction. | Make compat branch first-class in result classification and prove it cannot be confused with native tool calls. | DeepSeek provider/transport tests and Agent runtime tool-call fixtures for native, compat, malformed, and disallowed tool names. | Keep only while DeepSeek current behavior requires it and owner/cleanup trigger are recorded. | False evidence if compat text parsing is reported as native tool-call support. |
| D10-A03 Tool catalog compatibility stores | `AlembicAgent/src/tools/catalog/UnifiedToolCatalog.ts` scan found `CapabilityManifest`, `InternalToolHandlerStore`, and `ForgedInternalToolStore` compatibility sections. | Agent runtime tool discovery and internal tool execution. | Public tool manifest and handler route contract with explicit capability discovery. | Map each compatibility store to current consumer or replacement. Delete unused stores after scan. | Agent tool catalog tests plus runtime smoke covering discovered tools and blocked unavailable tools. | Delete only after no current import/consumer proof. Preserve with currentCompatibilityOwner. | A thin manifest may leave runtime handlers disconnected. |
| D10-A04 Hidden reasoning handling | Agent scans show `reasoningContent` and `reasoning_content` are kept for DeepSeek round-trip but removed from public transcripts in `tool-transcript.ts`; runtime metadata reports omission. | Agent runtime, provider transport, public target result evidence. | Hidden reasoning may be retained only for provider round-trip or diagnostic summaries, never public output text. | Strengthen branch tests for hidden reasoning in success, partial, provider-error, and tool-call rounds. | `AgentRuntime.test`, provider transport tests, transcript tests, and public envelope leak checks. | Preserve provider round-trip fields only in private transport/context. Public output must expose summary counts or diagnostic refs only. | Chain-of-thought or provider-private data leakage. |

## D11 Alembic Matrix

Rows covered: `I03`, `I04`, `I05`, `I06`, `I07`, `I08`, `I09`, `I10`, `I11`, `I21`, `I22`, `I23`.

| Candidate | Old entrypoint or logic | Current consumer | Replacement contract | D11 required action | Validation path | Delete or preserve condition | Risk |
| --- | --- | --- | --- | --- | --- | --- | --- |
| D11-M01 Host intent legacy fallback | `Alembic/lib/service/task/HostIntentContext.ts` states the new Plugin intent frame falls back to legacy `userQuery`, `activeFile`, and `language` at lines 1-7. `Alembic/lib/resident/tool-handlers/task.ts` consumes both optional host intent and legacy args at lines 154-180. | AlembicPlugin public tools and Alembic resident task/prime/search. | Normalized host intent frame with redacted turn metadata and explicit legacy fallback policy. | Separate contract-first host intent path from compatibility fallback, prove redaction, and record current Plugin consumer. | Alembic resident MCP task/search tests, Plugin fixture replay, host-intent success/degraded/missing tests. | Keep legacy args only while real Plugin/current host consumer still sends them. Delete after Plugin emits normalized frame and fallback tests pass as unsupported or blocked. | Plugin and Alembic may disagree on input source, causing silent degraded search. |
| D11-M02 Search route legacy decision meta | `Alembic/lib/http/routes/search.ts` calls `buildLegacySearchMeta` and `legacyDecisionRegisterItems` at lines 385-400. | Dashboard search metadata, Plugin/search tools, old HTTP consumers. | Checked search/decision-register route projection from D3 provider contract. | Replace legacy meta builder in public route outputs or scope it to compatibility detail. | Search route tests, decision-register route tests, provider fixture replay, Dashboard replay. | Delete only when Dashboard and Plugin no longer require legacy meta shape. Preserve with cleanup blocker. | Legacy decision items can look like durable register data when they are only compatibility metadata. |
| D11-M03 Runtime control diagnostics-read semantics | D7 repaired Alembic runtime smoke, but runtime-control must continue separating read-only diagnostics from explicit lifecycle actions. | Dashboard diagnostics, Plugin runtime tools, controller smoke. | Runtime control route with read-only diagnostic mode, explicit action mode, and no implicit mutation on diagnostics read. | Add/keep tests for diagnostics-read, start/stop action, unavailable route, blocked route, and multi-project runtime smoke. | Alembic runtime route tests, `smoke:multi-project-control`, Dashboard diagnostics replay. | No deletion unless replacement route has equivalent action and diagnostic behavior. | Diagnostics request may mutate runtime state or hide unavailable service. |
| D11-M04 Jobs and event artifacts | Scans found legacy rescan reason/dimension handling in jobs tests and artifact/display snapshot paths consumed by Dashboard. | Dashboard JobsView and process timeline. | Compact event summaries plus `artifactRef` or `detailRef` for large payloads. | Classify job event fields as public, diagnostic, internal, or artifact-only. Add fixture coverage for long logs and replay payloads. | Alembic job route tests, job process event tests, Dashboard jobs contract replay. | Delete old fields only after Dashboard artifact/detail replay passes. | Large logs or replay payloads may leak inline or break Dashboard details. |

## D12 AlembicPlugin Matrix

Rows covered: `I10`, `I11`, `I12`, `I13`, `I14`, `I15`, `I21`, `I22`, `I24`.

| Candidate | Old entrypoint or logic | Current consumer | Replacement contract | D12 required action | Validation path | Delete or preserve condition | Risk |
| --- | --- | --- | --- | --- | --- | --- | --- |
| D12-P01 Public tool legacy input source | `AlembicPlugin/lib/codex/mcp/public-tools/contract.ts` keeps `legacy-compatibility` in `AGENT_INPUT_SOURCES` at lines 16-24 and field dispositions at lines 50-90. | Public MCP tools, host agents, Alembic task/search consumer. | Per-tool input/output schemas, field dispositions, and projector tests. | For every public tool, prove ordinary output is clean and diagnostics are contextual. Classify whether `legacy-compatibility` is still a current input. | Public tool contract tests, golden output tests, and real MCP sampling for representative tools. | Keep `legacy-compatibility` only with current consumer and cleanup trigger. Delete after no current host input uses it. | Legacy source can become a catch-all that masks unsupported host behavior. |
| D12-P02 Guard/router compatibility boundary | `AlembicPlugin/lib/codex/mcp/handlers/tool-router.ts` routes no-arg guard requests to structured blocker after old whole-diff fallback was disabled at lines 161-184. `guard.ts` returns `legacyBoundary.noArgsWholeDiffDisabled` at lines 335-355. | Host public guard tool and existing user workflows. | Explicit scoped guard input contract, blocked result for missing scope, clean diagnostic-only compatibility metadata. | Preserve fail-closed behavior and verify no unscoped whole-diff fallback remains. | Plugin guard tests, code guard smoke, real MCP call with no args and with explicit files. | Do not delete blocker while old no-arg calls exist. Delete legacy metadata only when callers no longer need it. | Reintroducing broad unscoped source scanning. |
| D12-P03 Project root fallback trust | `AlembicPlugin/lib/codex/ProjectRootResolver.ts` marks fallback candidates as `trust: 'fallback'` and asks for explicit `projectRoot` at lines 116-132. | Codex local workflows and project-scoped tools. | Explicit project root requirement and diagnostic-only fallback candidate. | Ensure fallback trust cannot initialize or write project state. Make blocked result ordinary output clean and diagnostic fields contextual. | Project root resolver tests plus real MCP project-scoped call without explicit root. | Preserve fallback diagnostic only while host discovery can be missing. Delete only after host always supplies trusted root. | Tools may operate on the wrong project if fallback is treated as trusted. |
| D12-P04 Local refresh and tool output surface | Scans found `dev:codex-plugin:refresh` legacy refresh alias and D4 clean-output tests already exist. | Local plugin development and host MCP tools. | Clean output contract per tool, compact summaries, `detailRef` or `artifactRef` for heavy diagnostics. | Re-probe real MCP tools after any rewrite, including public, embedded/core, and Codex-local surfaces. | `npm run smoke:codex-plugin`, contract tests, `tools/list`, and representative real `callTool` samples. | Keep alias only if local developer workflow still consumes it, with owner and cleanup trigger. | Passing docs/tests without real MCP runtime sampling. |

## D13 AlembicDashboard Matrix

Rows covered: `I03`, `I04`, `I05`, `I06`, `I07`, `I08`, `I19`, `I20`, `I21`, `I22`, `I23`.

| Candidate | Old entrypoint or logic | Current consumer | Replacement contract | D13 required action | Validation path | Delete or preserve condition | Risk |
| --- | --- | --- | --- | --- | --- | --- | --- |
| D13-D01 Legacy source labels and aliases | `AlembicDashboard/src/utils/sourceLabels.ts` marks `ide-agent`, `ide-edit`, and `agent` as compatibility labels at lines 11-38. `AlembicDashboard/src/types.ts` keeps `compatibilityAliases` on file monitor capability at lines 126-132. | Dashboard UI for old/new source labels and runtime capability display. | Provider fixture-driven labels and explicit capability discovery. | Convert legacy labels to consumer display compatibility only, not backend source-of-truth. Record current provider fields that still need them. | Dashboard tests, provider fixture replay, UI states for current and legacy labels. | Delete labels/aliases only when provider fixtures and source scans no longer emit them. Preserve with owner and cleanup blocker. | Dashboard could present compatibility labels as authoritative source truth. |
| D13-D02 Knowledge save V3 field bag | `AlembicDashboard/src/App.tsx` creates `const v3Data: Record<string, any>` for Knowledge API writes at lines 889-910. | Dashboard Knowledge save flow and Alembic Knowledge API. | Typed Knowledge write DTO aligned with producer contract. | Replace or fence the untyped bag with a typed DTO and fixture coverage for invalid/missing fields. | Dashboard typecheck/tests plus Alembic Knowledge API contract replay. | Keep an internal bag only if immediately projected through a typed boundary. | Unrelated derived fields can leak into producer API writes. |
| D13-D03 Chat stream tool args bag | `AlembicDashboard/src/hooks/useChatStream.ts` reads `args: Record<string, any>` and extracts display summaries at lines 22-100. | Dashboard chat progress UI. | Typed tool event summaries with compact display fields. | Classify args as display-only diagnostic context and avoid storing or rendering raw payloads. | Dashboard stream event tests for tool start/end/error, unknown tools, large args, and missing args. | Preserve raw args only inside local event adapter, not user-visible output or persisted state. | Tool payloads may include sensitive or large internal fields. |
| D13-D04 Runtime diagnostics and artifacts | Dashboard APIs and tests already normalize `detailRefs`, `artifactRefs`, `sourceOfTruth`, and capability availability, but D13 must cover loading/error/partial/unavailable UI states. | Dashboard header, JobsView, ProjectScopePanel, runtime diagnostics. | Consumer-only fixture adapters that never invent provider truth. | Extend fixture matrix for available, unavailable, partial, stale, missing capability, and artifact/detail states. | Dashboard contract test, component/unit tests, and fixture replay from Alembic provider outputs. | Delete compatibility fallbacks only after provider fixtures cover equivalent states. | Dashboard may hide failure states or fabricate capabilities. |

## D14 Final Acceptance Criteria

D14 may accept the deep optimization sequence only when D9-D13 each produce raw evidence for:

- Candidate status: `rewritten`, `deleted`, `preserved-with-owner`, `already-solved`, or `blocked`.
- For every deletion: clean import/consumer scan, connected replacement proof, and representative validation.
- For every preserved compatibility path: current consumer, currentCompatibilityOwner, validation evidence, cleanup blocker, and removal trigger.
- For every output contract: ordinary output field whitelist, diagnostic context gate, hidden/internal/sensitive field exclusion, and `detailRef` or `artifactRef` for large payloads.
- For every consumer: explicit capability discovery instead of guessed provider support.
- For success and non-success branches: success, partial, unavailable, blocked, timeout, permission/provider error, malformed input, missing capability, large artifact, and diagnostic-only context.
- Repository status and commit evidence from the owning product windows.

## Dispatch Order

1. D9 AlembicCore first. It owns the shared spine, project scope, and export surface that later product windows consume.
2. D10 AlembicAgent after D9 acceptance or after D9 explicitly preserves the needed Core contracts.
3. D11 Alembic after D9 and D10 evidence is available enough to validate provider and Agent-facing branches.
4. D12 AlembicPlugin after D11 provides the route/provider contract evidence required for real MCP sampling.
5. D13 AlembicDashboard after D11 provides provider fixtures and D12 provides host/MCP output contract evidence.
6. D14 controller acceptance after all product evidence is reviewed raw.

Parallel dispatch is not authorized by this matrix unless the controller has already accepted the producer dependency evidence named above.
