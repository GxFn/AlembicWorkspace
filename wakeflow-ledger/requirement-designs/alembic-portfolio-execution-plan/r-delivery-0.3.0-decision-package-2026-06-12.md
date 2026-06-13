# R — 0.3.0 Decision Package (delivered 2026-06-12/13)

Portfolio phase R per the execution plan: the package list is DELIVERED to
the user; execution happens only on the user's release decision. Nothing in
this document executes anything. Version bumps and publishes are
user-triggered.

Portfolio state at delivery: P0, Train H, Trains A+B (P1), P2 (AD1-AD7),
P3 (Plugin train steps 1-9), P4 (SN train SN0-SN4a+SN6) ALL COMPLETED with
controller acceptance. Parked on user gates: SN4 (opens with C3), SN5 +
CKG resumption, SD-1 phase-2 evaluation (A1).

## 1. Release-coupled decision set (advisory: rule together as the 0.3.0 gate)

| Key | Decision | Staged where |
| --- | --- | --- |
| C1 | Publish @gxfn/alembic-codex-runtime 0.2.0 — closes the LIVE-PROVEN cacheless cold-start E404 for BOTH hosts; exact command staged (npm publish --access public from AlembicPlugin/.tmp/alembic-codex-runtime-package, @gxfn login); zero shell changes | P3 t7 decision prep + ledger row 3 |
| C3 | Execute SD-5 phase-2: delete 67/67 verified-zero-consumer wildcard keys + keep-alive fold 36/37 (drizzle exact-row survives, 5 consumers). PRECONDITION: fresh re-scan. SIDE EFFECT: un-parks SN4 (Core src naming wave — resumption pointer in sn6-terminal-census-review) | P3 t13 staging doc (sd5-phase2-staging) + ledger row 1 |
| B2 | ./shared facade contents BEFORE the deletion: (a) promote OutputBudget + CO3 PersistenceError/DivergenceError onto ./shared w/ budget raise, or (b) re-point MT2 docs to the root facade and delete as staged | AD2 register B2 + t13 sequencing decision |
| A3 | R-1 plugin evolution/panorama HTTP overlay routes (byte-identical twins): name a consumer → keep with owner, or confirm delete-in-0.3.0 with RC4-style proof | AD2 register A3 (legacy deadline-keep) |
| C2 | Plugin naming/namespace + version-pin policy (plugin.json 0.2.0 pin: bump vs SHA-based) + marketplace.json hosting/naming + negative-cache clear step in install docs | cc2-user-decision-prep + CC1 routed additions |

## 2. Acknowledge-or-pull-forward (defaults stand if acknowledged)

A1 SD-1 phase-2 kernel-sinking evaluation (after SD-5 closeout + SD-1 p1);
A2 daemon job observability policy (re-opens at first real requirement);
A4 SD-4C MemoryStore adapter end state (trigger: next async memory
refactor); B3 Agent facade preference (resolves with B2); B4 keep-alive
drizzle row (retires when the in-memory DrizzleDB test facade lands).

## 3. Standing per-item decision rows (rule when ready)

B1 resident MCP registry disposition (bind / delete+re-charter /
HTTP-certify; unblocks charter wording AND the 15-tool duality question);
B5 Capability base-contract placement; B6 locator floor number (a/b/c);
B7+W-wording charter-touch batch (one Core config edit); W2 Dashboard
3 stray transports; C4 coverage enforcement; C5 codex_stop/cleanup
destructive-tool sheets; C6 scratch-registry cleanup; C7 corrupted
ghost-workspace DB in the real data root; C8 daemon-route
rebuild-confirmation parity. Full options per row:
alembic-space-architecture-deepening/ad2-placement-decision-register.

## 4. Open TODO rows riding future waves (no decision needed now)

CC4-FIRST-SESSION-MCP-CONNECT (P2), CC4-TIER-FLIP-CONNECT-CACHE (P3/MT4),
TEST-INFRA-STALE-DIST-ALIAS (+ Agent clean-build-before-pack-gate
candidate), MT1-EDGE-ARGS-REGISTRY, TRAIN-H-SCRATCH-REGISTRY-CLEANUP
(user OK'd), CO4-CONSUMER-GATE-SIBLING-DRILL, AFAPI-REQ-08 release-hold.

## 5. Pushed heads at delivery

Core fa464c7 / Alembic 720dc28 / Agent 9c2a4b3 / Dashboard 18837ef /
Plugin e96dbf1 / AlembicClaudeCode be36846 / AlembicCodex 481ab71 — all
even with origin; every train's evidence in its state root and ledger.

## 6. Organized into requirement designs (controller intake 2026-06-13)

This flat decision package has been re-stated as a proper requirement-design
group so each remainder is ready to become real work the moment the user
rules — see
[alembic-post-portfolio-followthrough](../alembic-post-portfolio-followthrough/index.md):

- §1 release-coupled set (C1/C3/B2/A3 + C2 tail + AFAPI-REQ-08 snapshot
  judgment) → [alembic-0.3.0-release-wave](../alembic-0.3.0-release-wave/index.md)
- §2/§3 AD2 register decisions (A1/A2/A4/B1/B3/B4/B5/B6/B7/W1/W2/C5/C8) →
  [alembic-governance-decision-enactment](../alembic-governance-decision-enactment/index.md)
- §3/§4 quality + test-infra TODO debt (C4/C6/C7 + TEST-INFRA-STALE-DIST,
  CODE-GUARD-SCHEMA, CC4 connect, CO4 drill, residuals) →
  [alembic-quality-debt-burndown](../alembic-quality-debt-burndown/index.md)
- CKG re-stated separately for the Codex window →
  [ckg-v2](../alembic-codex-cold-start-knowledge-graph-experience/ckg-v2-requirement-design-2026-06-13.md)

Partition verified complete and exclusive at intake (the AFAPI-REQ-08 gap was
closed). Members 1-3 await user rulings; member 4 awaits the user's CKG
reorganization → Codex window. Subsequent pushed heads (post-R execution):
Core `2823939` / Alembic `fca6e6a` / Agent `9c2a4b3` / Dashboard `18837ef` /
Plugin `1256b1d` (CC shell `6c39111`, Codex shell `c452de3`).
