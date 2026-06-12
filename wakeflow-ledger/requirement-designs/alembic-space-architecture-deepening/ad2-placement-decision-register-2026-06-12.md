# AD2 — Placement Decision Register (2026-06-12)

Every row is a PER-ITEM USER DECISION. Nothing in this register is implemented
by AD2; the controller enacts a row only after the user rules on it. Sources:
parked registers SD-1p2 / SD-6 / R-1 / SD-4C (structural-debt candidates under
the redundancy-cleanup ledger), P3 train routed items, standing pending
decisions consolidated.

## A. Parked-register absorptions (the four named by the AD design)

| # | Item | Proposal on the table | Trigger / condition | Options for the user |
| --- | --- | --- | --- | --- |
| A1 | SD-1 Phase 2 — Core sinking of the byte-identical lib kernel (Alembic/Plugin shared files) | Evaluate sinking the kernel-eligible byte-identical subset into Core under Core's boundary policy, with deliberate plugin vendor refresh | After SD-5 closeout lands AND SD-1 Phase 1 (drift-gate declared list) is complete | (a) approve evaluation wave; (b) keep dual copies under the drift gate indefinitely |
| A2 | SD-6 — daemon job observability | Policy stands: Alembic owns the full stack; Plugin keeps the minimal variant; extraction parked | Re-opens at the FIRST real plugin job-observability requirement (preferably post-SD-5) | (a) acknowledge standing policy (default); (b) pre-approve extraction evaluation now |
| A3 | R-1 — plugin evolution/panorama HTTP overlay routes (byte-identical twins) | Legacy-register deadline keep | NEXT plugin release decision (= the 0.3.0 wave): if no consumer is named, delete in that release's cleanup wave with RC4-style proof set | (a) name a consumer → keep with owner; (b) confirm delete-in-0.3.0 |
| A4 | SD-4 Option-C — Agent MemoryStore raw-SQL adapter end state | Adapter stands as declared consumer-side exception (tripwire test pinned) | Next async-capable Agent memory refactor → migrate callers to Core MemoryRepository, delete adapter | (a) acknowledge standing trigger (default); (b) schedule the refactor as its own demand |

## B. Charter-derived placement questions (new from AD2)

| # | Item | Question | Options |
| --- | --- | --- | --- |
| B1 | Resident MCP registry (UNBOUND: zero importers, no MCP SDK, live tools served via daemon HTTP) | The Alembic charter says "resident MCP host" — bind it, delete it, or re-charter as HTTP-served? | (a) bind a real stdio MCP server; (b) delete registry + amend charter wording to "HTTP/daemon host"; (c) HTTP-certify the 19 resident rows as the contract (Train H sheets exist) |
| B2 | ./shared facade contents at 0.3.0 (t13 sequencing decision) | SD-5 deletes ./shared/* wildcards while MT2 docs use @alembic/core/shared/OutputBudget; CO3 staged PersistenceError/DivergenceError promotion | (a) promote OutputBudget (+CO3 errors) onto ./shared with a budget-raise, then delete wildcards; (b) re-point MT2 docs to root facade and delete as staged |
| B3 | Agent facade preference (p2b note) | AgentInterfaceContract imports the taxonomy via provisional ./shared; Agent policy prefers stable facades | (a) keep (limit=1 calibrated, note stands); (b) migrate to root facade when B2 resolves |
| B4 | Keep-alive drizzle exact-row | Last live transitional export (5 named consumers) | Retires when the in-memory DrizzleDB test facade lands (t1 probe) — acknowledge trigger or schedule the facade work |

## C. Consolidated standing user decisions (unchanged, listed for one-pass review)

| # | Item | Where staged |
| --- | --- | --- |
| C1 | npm publish @gxfn/alembic-codex-runtime 0.2.0 (unblocks BOTH hosts' cacheless cold start; exact command staged) | t7 decision-prep + 0.3.0 ledger |
| C2 | Plugin naming/namespace + version-pin policy | cc2-user-decision-prep doc |
| C3 | SD-5 phase 2 execution (67/67 staged, fresh re-scan precondition) | t13 staging doc + 0.3.0 ledger |
| C4 | Coverage enforcement strategy (wire/raise/leave) | CO4 evidence + TODO board |
| C5 | codex_stop / codex_cleanup destructive-tool sheets + visibility | Train H risks + t12 decision-prep |
| C6 | Scratch-registry cleanup (one stale entry in real ~/.asd) | Train H TODO row |
| C7 | Corrupted ghost-workspace DB in the real data root (tests no longer touch it) | P3 p1 acceptance record |
| C8 | Daemon-route rebuild-confirmation parity (plugin pre-gate vs resident gate vs documented asymmetry) | t12 decision-prep doc |

Controller recommendation (advisory, not a decision): rule on C1+C3+A3+B2
together as the 0.3.0 wave gate — they are the release-coupled set; A1/A2/A4/B3/B4
are acknowledgements unless you want to pull work forward; B1 unblocks the
charter wording and the 15-tool duality drift-gate question (t12).

## B5 — Capability base-contract placement (added by AD3 ta8, 2026-06-12)

| # | Item | Question | Options |
| --- | --- | --- | --- |
| B5 | agent↔tools cycle minority: src/tools/v2/capabilities/CapabilityV2.ts runtime-extends the agent-owned Capability base class (inheritance reach-up, blessed exact exception in AlembicAgent config/layer-contract.json with cleanup trigger) | Where should the Capability base contract live so tools no longer reaches up into agent? | (a) move the base contract to a leaf area (shared/types-adjacent); (b) tools-owned contract with agent implementing; (c) keep the blessed exception standing (re-justify at AD7 exit) |

NOTE: this is inheritance/placement class, NOT AD4 service-locator class — it does not ride the AD4 remediation list.

## B6 — Service-locator floor number (added by AD4 ta10, 2026-06-12)

| # | Item | Question | Options |
| --- | --- | --- | --- |
| B6 | The AD design says locator route sites are "driven to the agreed floor", but NO AD0 artifact carries a number (P0's ~27-30% is a measured baseline, not a target). ta10 remediated the 2 MUST sites + demonstrated the constructed-injection pattern twice; the remaining ~131-site http route-locator class awaits the number. | What is the locator floor? | (a) zero in http routes via a dedicated area-by-area wave (pattern proven, mechanical); (b) a partial target (e.g. workflows/service/tools only, http blessed as host-area idiom); (c) keep current state, re-measure at AD7 exit |

## B7 — Charter-coverage additions for three Alembic areas (added by AD6 ta15, 2026-06-12)

| # | Item | Question | Options |
| --- | --- | --- | --- |
| B7 | AD6 charter completeness found three live Alembic areas with NO explicit charter line: lib/tools host adapters, lib/governance (decision-register), lib/workflows (implicitly under daemon+jobs). All charter lines have code (reverse check clean); these are coverage gaps, not orphan code. | Amend the Alembic charter to name the three areas explicitly? | (a) approve the three additive charter lines (controller drafts, Core config edit at next touch); (b) fold workflows under daemon explicitly and add only two; (c) leave implicit (re-check at AD7) |

## W1 — Core charter wording: contract-types surface (added by AD6 ta16, 2026-06-12)

Core owns a host-integration CONTRACT-TYPES surface (./daemon ResidentServiceContracts etc. — types only, no hosting) that the charter wording does not explicitly name. Absorb at the next charter touch together with B7 (owner: AlembicWorkspace charter custodian; additive wording, no code impact).

## W2 + charter-wording batch (added by AD6 final legs, 2026-06-12)

| # | Item | Question | Options |
| --- | --- | --- | --- |
| W2 | Dashboard: THREE pre-existing stray transport sites outside src/api.ts (hooks/useAuth.ts axios login/me; hooks/usePermission.ts axios probe; i18n/index.tsx fetch /ai/lang ×3) — exact-set-equality pinned by test so the set cannot grow; the strays bypass the normalizer seam | Consolidate into api.ts? | (a) approve a small consolidation wave (Dashboard window, behavior-preserving); (b) bless the three as declared seams (edit pin + doc); (c) leave pinned, revisit at next Dashboard wave |
| W-wording | Charter-touch batch (one Core config edit when ruled): B7 three Alembic areas + W1-core contract-types surface + W1-dashboard "state realized by hooks+theme+i18n" + W1-plugin R-1 overlay middleware | Apply all four wording absorptions in one charter touch? | (a) approve batch (controller drafts, Core window edits config + drift test); (b) rule rows individually |
