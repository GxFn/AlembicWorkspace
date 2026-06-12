# 0.3.0 Release Wave Ledger (opened 2026-06-12 by P0)

Status: ACCUMULATING — execution only on the user's release decision.
Releases and version bumps are user-triggered; this ledger only collects
the package list the user will decide on.

| # | Item | Producer | State |
| --- | --- | --- | --- |
| 1 | SD-5 phase-2 deletion: 67 deprecated wildcard keys (67/67 verified zero-consumer, four-repo multi-line-aware scan incl. mocks) + keep-alive fold 36/37 rows (only ./infrastructure/database/drizzle stays, 5 live refs) — staging doc + row-level scan JSON in the P3 state root (sd5-phase2-staging-2026-06-12.md); INTERACTION: flip the MT2 OutputBudget adoption route to ./shared (or promote it with the error-class promotion) BEFORE deleting ./shared/* | staged by P3 step 8 (t13, Core 3111780) | STAGED — ready for the user decision |
| 2 | Taxonomy facade promotion (PersistenceError/DivergenceError onto ./shared — TODO CO3-TAXONOMY-FACADE-PROMOTION) | staged by Train A (IC4, pin test in place) | STAGED — rides the B2 ./shared-contents ruling |
| 3 | Pinned npm runtime publication (@gxfn/alembic-codex-runtime 0.2.0; two thin host shells reference it; live-proven E404 cold-start blocker) | STAGED by P3 t7: pack --dry-run verified 206-file tgz; exact command recorded (npm publish --access public from AlembicPlugin/.tmp/alembic-codex-runtime-package, @gxfn login); zero shell changes needed | STAGED — user publish trigger |
| 4 | Consumer-lint scanner multi-line fix + referenceLimits recalibration (TODO CO1-SCANNER-MULTILINE-BLIND-SPOT) | LANDED P3 step 2 (Core fbaa16c + Agent 11320fe TRUE calibration; TODO closed) | DONE — only the fresh re-scan precondition before SD-5 p2 remains live |
| 5 | release:check note: user-local .claude/settings.json seeds dirty every tree — stash/exclude during release runs (CO5 lesson) | recorded | standing note |

Exit: when P3 + Train A land their stagings, the controller delivers this
list to the user as the 0.3.0 decision package.

## CC1 routed additions (2026-06-12, P3 step 3 accepted tc-20260612065944-0017)

- **Runtime publication is a hard cold-start blocker (live-proven)**: `@gxfn/alembic-codex-runtime@0.2.0` returns npm E404 (never published). Any cacheless install fails at runtime bootstrap for BOTH hosts. Publication is user-directed; ships with this wave.
- **Claude Code marketplace catalog**: no `.claude-plugin/marketplace.json` yet; creating it is a new published surface needing hosting/naming/source-type decision (CC2 distribution sub-wave owns).
- **plugin.json version pin policy**: shell `.claude-plugin/plugin.json` pins version 0.2.0 (Claude Code update detection). Distribution wave must bump it (or drop for SHA-based updates) when shipping — version changes user-directed.
- **Negative-cache trap for support docs**: Claude Code caches a failed plugin MCP start in `mcp-needs-auth-cache.json` and silently skips the server on later runs. Users who attempted install before runtime publication will not see the server afterward until that cache clears — document the clear step in the distribution wave.
