# AlembicPlugin Claude Code Host Support

Status: candidate / user-requested 2026-06-12 / all three CC0 user gates adopted 2026-06-12 (local-path install first, MCP + skills only, ALEMBIC_CHANNEL_ID=claude-code) / CC0 may run pre-gate, CC1-CC4 gated on CKG completion / needs controller intake
Maintained Window: AlembicWorkspace
Date: 2026-06-12
Design Key: alembic-plugin-claude-code-host-support

## Controller Judgment

The user wants Alembic installable as a Claude Code plugin. The
host-coupling census shows this is packaging-and-parameterization, not a
port: the public tool contract already enumerates
`['codex','claude-code','generic-host-agent']`, host identity is one env
var (`ALEMBIC_PLUGIN_HOST`) with zero logic branching, the MCP wire is
standard stdio, and only 4 tool-description strings name Codex. The
installed Wakeflow plugin is a working local precedent for the exact
Claude Code packaging shape (`.claude-plugin/plugin.json`, `.mcp.json`
with `${CLAUDE_PLUGIN_ROOT}`/`${CLAUDE_PROJECT_DIR}` substitution — the
latter feeds `ALEMBIC_PROJECT_DIR` directly). Genuinely new: the Claude
Code packaging artifact set, a claude-code overlay in the RC5
shared-asset manifest (third skills consumer), a Claude Code Project
Skill export convention, host-parameterized guidance/SOP wording, and a
real Claude-Code-agent acceptance run. One MCP server serves both hosts —
no third tool list.

TIMING SIGNAL for the in-flight CKG work: the staged-SOP renderer should
keep the host name as a render variable (the host slot already exists in
env + contract) so Claude Code reuses the same SOP pack — relay to the
CKG side before wording hardens Codex-only.

## Entry Points

- Findings evidence base:
  [claude-code-host-findings-2026-06-12.md](claude-code-host-findings-2026-06-12.md)
- Requirement design:
  [alembic-plugin-claude-code-host-support-requirement-design-2026-06-12.md](alembic-plugin-claude-code-host-support-requirement-design-2026-06-12.md)
- Candidate demand sequence:
  [alembic-plugin-claude-code-host-support-demand-sequence-2026-06-12.json](alembic-plugin-claude-code-host-support-demand-sequence-2026-06-12.json)

## Candidate Demand Order

| Order | Demand | Primary Window | Purpose |
| --- | --- | --- | --- |
| 0 | `...-cc0-packaging-facts-scope-freeze-2026-06-12` | AlembicWorkspace (pre-gate OK) | Official spec vs local precedent; post-CKG census re-freeze; skill-export convention; execute within the three adopted gates (local-path package shape, skills-only artifact list, claude-code channel); CKG SOP host-variable signal. |
| 1 | `...-cc1-host-parameterization-completion-2026-06-12` | AlembicPlugin — **gate: CKG paused-clean (2026-06-12)** | claude-code identity end-to-end; 4 Codex strings + SOP/guidance host-parameterized (against the landed CKG1-CKG3 contract); cross-host readiness; Codex parity gate. |
| 2 | `...-cc2-claude-code-plugin-packaging-2026-06-12` | AlembicPlugin (+ Alembic manifest commit) | Manifest + .mcp.json wiring; shared-manifest skills with claude-code overlay + drift gate; thin shell over pinned npm runtime; marketplace artifact. |
| 3 | `...-cc3-cold-start-skill-delivery-claude-code-2026-06-12` | AlembicPlugin (+ Alembic) | Host-rendered CKG cold start; Claude Code Project Skill export; Dashboard handoff; honest failure semantics. |
| 4 | `...-cc4-real-claude-code-acceptance-2026-06-12` | AlembicWorkspace (+ Test, Plugin) | Fresh install; tools/list parity; real Claude-Code-agent cold start to CKG7 standard; skills; failure branches; Codex regression smoke; archive. |

## Cross-Demand Boundaries

- Plugin hands-off holds: CC1-CC4 dispatch only after the controller
  verifies CKG completion (queue position vs IC5 decided at intake);
  CC0 is controller-window facts only.
- Consumes, never forks: the CKG bootstrap/SOP contract (host slot), the
  RC5 shared-asset manifest (claude-code overlay, drift gate extension,
  one coordinated Alembic commit), the MPB runtime-package direction
  (state re-frozen at CC0).
- No interaction with IC's resident-vs-plugin tool duality work — this
  demand adds no tool list; the same server serves both hosts with a
  byte-stable Codex parity gate per demand.
- Version bumps, marketplace publication, and release timing stay
  user-directed.
- Portfolio plan note (2026-06-12): per
  [the portfolio execution plan](../alembic-portfolio-execution-plan/index.md),
  CC0 merges into P0; CC1-CC4 ride the P3 Plugin unified train (CC2
  joins the distribution sub-wave that absorbs the MPB remainder; CC4
  forms the train acceptance together with IC6).

## Validation Backbone

Per demand: AlembicPlugin full check + representative MCP smoke on both
host identities + the Codex parity gate; CC2+ add install-from-artifact
proof; CC3/CC4 require a real Claude Code session with raw MCP outputs
and transcript evidence; CC4 ends with Wakeflow verification.

## Stop Conditions

- Any Plugin edit before CKG completes (CC0 excepted).
- The Codex host surface or behavior changes (parity gate failure).
- A third tool list or host-specific tool fork appears.
- Skill single-sourcing bypassed (hand-copied skills instead of the
  manifest overlay).
- Official Claude Code plugin spec contradicts the local precedent and
  CC0 cannot reconcile — pending decision.
- Prose-only evidence.
