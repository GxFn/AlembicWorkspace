# AlembicPlugin Claude Code Host Support Requirement Design

Status: candidate / user-requested 2026-06-12 / execution gated on CKG completion (CC0 may run earlier) / needs controller intake
Date: 2026-06-12
Design Key: alembic-plugin-claude-code-host-support
Primary Product Window: AlembicPlugin
Related Windows: Alembic (shared-asset manifest overlay, one coordinated commit), AlembicWorkspace (facts, acceptance), Test (real Claude Code host run when assigned)
Validation Surface: real Claude Code host session (this workspace runs one)

## Problem

AlembicPlugin is a Codex plugin today. The user wants the same Alembic
capability installable as a Claude Code plugin: MCP tools, injectable
skills, the cold-start knowledge experience, and Dashboard handoff —
inside Claude Code.

Evidence ([claude-code-host-findings-2026-06-12.md](claude-code-host-findings-2026-06-12.md))
shows this is a packaging-and-parameterization demand, not a port: the
host contract already enumerates `claude-code`, host identity is one env
var with no logic branching, the MCP wire is standard stdio, only 4 tool
description strings name Codex, and a working local Claude Code plugin
precedent (the installed Wakeflow plugin) demonstrates the exact manifest
and `${CLAUDE_PROJECT_DIR}` wiring needed. The genuinely new surfaces:
the Claude Code packaging artifact set, a Claude Code skill-delivery
convention, host-parameterized guidance/SOP wording, and a real
Claude-Code-host acceptance run.

## Goal

A Claude Code user can install Alembic as a plugin (marketplace or local
path), and:

1. the Alembic MCP server starts from the plugin with
   `ALEMBIC_PLUGIN_HOST=claude-code` and the project root injected from
   `${CLAUDE_PROJECT_DIR}` — same tool surface as the Codex host, no
   third tool list;
2. the injectable skills ship as Claude Code plugin skills (third
   consumer of the RC5 shared-asset manifest, with a claude-code
   overlay and the drift gate extended);
3. cold start works end-to-end driven by a Claude Code agent, consuming
   the CKG bootstrap/SOP contract with the host name as a render
   variable;
4. Project Skill export delivers to the Claude-Code-visible convention
   (CC0-verified against official docs);
5. guidance, initialize instructions, and the 4 Codex-named strings are
   host-parameterized;
6. Dashboard handoff works from a Claude Code session;
7. distribution reuses the runtime-package direction (MPB state
   re-frozen at CC0) — one npm runtime, thin host shells per host.

## Non-goals

- No new tools and no third tool catalog — the same MCP server serves
  both hosts (IC5's duality work is about resident-vs-plugin, untouched).
- No `lib/codex/` path rename (cosmetic; routed to a future cleanup if
  ever — churn without behavior value now).
- No Codex-host behavior changes; the Codex plugin keeps working
  identically (parity gate).
- No slash commands or hooks in the first version unless CC0 confirms
  them in scope (recommended: MCP + skills only first).
- No Plugin edits before CKG completes (CC0 excepted: controller-window
  facts only); no version bumps or publication without user direction.

## Candidate Demand Sequence

### CC0 - Packaging Facts And Scope Freeze (AlembicWorkspace; may run pre-gate)

- verify the current official Claude Code plugin + marketplace spec
  (docs) against the local Wakeflow-plugin precedent; record manifest,
  mcp.json substitution vars, skills/commands layout, marketplace
  registration shape;
- re-freeze the Plugin host-coupling census on the post-CKG committed
  state (the 4 Codex strings, packaging env set, ProjectSkillDelivery
  target, MPB packaging state);
- determine the Claude Code Project Skill export convention from
  official docs;
- execute within the three user gates recorded 2026-06-12 (see
  Decisions): local-path install first (marketplace later as a user
  release decision), MCP + skills only,
  `ALEMBIC_CHANNEL_ID=claude-code` — CC0 specifies the local-path
  install package shape and the skills-only artifact list under these
  rulings;
- relay the CKG timing signal: the staged-SOP renderer must keep the
  host name as a render variable (send to the controller for the CKG
  side now).

### CC1 - Host Parameterization Completion (AlembicPlugin; post-CKG gate)

- the `claude-code` host value works end-to-end: runtime context,
  diagnostics, status, clean output all carry the right host identity
  with no codex-default leakage when `ALEMBIC_PLUGIN_HOST=claude-code`;
- the 4 Codex-named tool-description strings and any briefing/SOP/
  initialize wording become host-parameterized (consuming the CKG
  contract's host slot);
- cross-host-readiness checks extended to assert claude-code readiness;
- Codex parity gate: the Codex host surface is byte-stable
  (tools/list + representative callTool snapshots before/after).

### CC2 - Claude Code Plugin Packaging (AlembicPlugin)

- `.claude-plugin/plugin.json` manifest + plugin `.mcp.json` wiring the
  Alembic MCP server with `${CLAUDE_PLUGIN_ROOT}` paths,
  `ALEMBIC_PROJECT_DIR=${CLAUDE_PROJECT_DIR}`,
  `ALEMBIC_PLUGIN_HOST=claude-code`, and the CC0-confirmed channel id;
- plugin `skills/` populated from the shared-asset manifest with a
  claude-code overlay (Alembic-side manifest + drift-gate extension as
  one coordinated commit; tool-contract hunks stay host-divergent per
  the RC5 rule);
- distribution shell per the CC0-frozen MPB state: thin Claude Code
  shell + the shared pinned npm runtime (no embedded node_modules/
  tarballs; dev keeps file: links);
- marketplace artifact per the CC0 distribution ruling; local-path
  install path documented.

### CC3 - Cold Start And Skill Delivery On Claude Code (AlembicPlugin + Alembic)

- real cold start driven from a Claude Code session: status → bootstrap
  → staged SOPs (host-rendered) → submit/dimension gates → post-bootstrap
  knowledge use, against the CKG contract;
- Project Skill export to the CC0-verified Claude Code convention, with
  the Ghost/source-repo skip policy preserved;
- Dashboard handoff verified from the Claude Code session;
- failure semantics on this host: wrong-scope, missing project dir
  (CLAUDE_PROJECT_DIR absent), degraded states — clean problem output
  parity with the Codex host.

### CC4 - Real Claude Code Host Acceptance (AlembicWorkspace + Test as assigned)

- fresh install from the CC0-chosen distribution route into a real
  Claude Code session; `tools/list` parity vs the Codex surface
  (identical tool set + schemas, host field differs);
- a real Claude-Code-agent cold-start run on a sample project (CKG7
  standard: raw tool outputs, transcript evidence, Recipe quality audit,
  rejected-sample audit);
- skills visible and invocable as plugin skills; Dashboard handoff;
  representative failure branches with raw MCP outputs;
- second-launch reuse without reinstall; Codex-host regression smoke
  stays green; controller acceptance from raw evidence; archive.

## Producer/Consumer Order

CC0 (pre-gate allowed) → [CKG completion gate] → CC1 → CC2 → CC3 → CC4.
CC2's skills overlay includes the one coordinated Alembic-side manifest
commit. Recommended intake: CC0 can run now; CC1+ queue behind the CKG
gate alongside IC5.

## Completion Definition

- A Claude Code user installs the plugin (CC0-chosen route), the MCP
  server starts with the right host identity and project root, and the
  full tool surface works with clean-output parity.
- Skills ship and invoke as Claude Code plugin skills from the shared
  manifest with the drift gate covering the new overlay.
- A real Claude Code agent completes a cold start under the CKG contract
  with host-rendered SOPs, and Project Skill export lands at the Claude
  Code convention.
- Dashboard handoff works; failure branches are honest; the Codex host
  is regression-proven unchanged; acceptance from raw evidence; archived.

## Validation Requirements

Per demand: AlembicPlugin full check + representative MCP smoke on BOTH
host identities; CC2+ add install-from-artifact proof; CC3/CC4 require a
real Claude Code session (this workspace) with raw MCP outputs and
transcript evidence; the Codex parity gate runs in every demand; Wakeflow
verification at CC4.

## Stop Conditions

- Any Plugin edit before CKG completes (CC0 excepted).
- The Codex host surface or behavior changes (parity gate failure).
- A third tool list or host-specific tool fork appears.
- Skill single-sourcing is bypassed (hand-copied skills instead of the
  manifest overlay).
- Official Claude Code plugin spec contradicts the precedent and CC0
  cannot reconcile — pending decision.
- Prose-only evidence.

## Decisions And Open Items

Inherited: Plugin hands-off until CKG completes; version bumps and
publication user-directed; write-strict/read-tolerant posture.

Resolved by user confirmation on 2026-06-12 (all three CC0 gates, as
recommended):

- Distribution route: local-path install first; the marketplace entry
  (own Alembic marketplace repo vs `gxfn`) follows later as a user
  release decision.
- First-version scope: MCP + skills only; slash commands/hooks deferred
  until a real need is named.
- Channel identity: `ALEMBIC_CHANNEL_ID=claude-code`.

For intake: CC0 timing (can run now), CC1-CC4 queue position relative to
IC5 after the CKG gate opens.
