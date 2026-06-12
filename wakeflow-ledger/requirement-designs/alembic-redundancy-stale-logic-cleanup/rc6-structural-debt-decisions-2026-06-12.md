# RC6 Structural Debt Decision Register (2026-06-12)

Controller decision record for demand
`alembic-redundancy-stale-logic-cleanup-rc6-structural-debt-decision-gate-2026-06-11`.
Design notes were drafted by the Design window with re-verified evidence
(baselines: Alembic 7a63e7b, AlembicCore ed42960, AlembicAgent dc6d6f7,
AlembicDashboard 11c2c61, AlembicPlugin 41ee2a7) and reviewed by the
controller with independent spot-checks (dashboard/dist gitignore, vendor
gitlinks, staging sibling-read, panorama byte-identity, RC2 amended-hash tree
equality, Core boundary counts 18/24/98).

Scope of these decisions: each "accept" confirms the candidate's recommended
route as the basis for a FUTURE demand (sequence or single demand) with its
own key. No implementation occurred in RC6. Every accepted future demand
still requires user confirmation of its original plan before dispatch —
these records route work, they do not authorize execution.

Reviewed notes (promoted copies): `structural-debt-candidates/*.md`.

| # | Candidate | Decision | Confirmed route | Future demand shape |
| --- | --- | --- | --- | --- |
| SD-1 | Shared layer sinking | ACCEPT | Option C phase 1 (extend RC5 manifest/drift gate to declared lib/ identical-file list; reconcile only incidental 97-99% drift; leave intentional divergence undeclared) with recorded phase-2 trigger toward selective Core sinking ONLY after SD-5 closeout; Option B (new shared package) rejected at current ~16.6k matched-line mass. | Own sequence: Alembic + AlembicPlugin. |
| SD-2 | Dashboard artifact pipeline | ACCEPT | Option A: wire/verify `build:dashboard` in release staging with demonstrated stale-detection failure, unify source resolution, document Alembic vendor-refresh flow (mirroring RC4's plugin one); KEEP the `vendor/AlembicDashboard` submodule; pointer refresh at next release. Option B (published artifact package) deferred until a real registry consumer exists. | Small single-repo demand: Alembic. |
| SD-3 | Agent V1→V2 convergence | ACCEPT | Option B two-phase: (1) contracts-vocabulary extraction to a neutral home, re-point 16 importers (6 type-only first), behavior-preserving; (2) collapse V2ToolRouterAdapter, delete V1 runtime, retire/repoint `./tools` export, deliberate expectedCounts update guarded by the RC3 G5 lint. No dependency on other SDs. | Own sequence: AlembicAgent (+ downstream Alembic build validation). |
| SD-4 | MemoryStore ownership | ACCEPT | Option B: adapter stays in Agent as declared consumer-side adapter; add schema-shape tripwire test (fail+pass proof pair); append Option-C end state + trigger ("next async-capable memory refactor migrates callers to Core MemoryRepository") to the RC3 boundary note. Option A (sink into Core) rejected — doubles Core's own access paths. | Small demand: AlembicAgent. |
| SD-5 | Core Wave 3B export closeout | ACCEPT | Option B two-phase release-aligned: (1) deprecate-mark the 67 zero-consumer candidates with date+removal release, ship one release cycle, deliberate AlembicPlugin vendor refresh (lag 24 commits); (2) delete, expectedCounts 98→31, closeout report shows candidates 0; review-by dates added for the 13 must-keep + 18 keep-provisional. | Own sequence: AlembicCore primary; AlembicPlugin vendor refresh; Alembic/Agent build validation. |
| SD-6 | Daemon observability reuse | ACCEPT | Option C: main-repo-only by policy; register entries in both repos naming owner, policy, and re-open trigger (first REAL plugin job-observability requirement, sequenced after SD-5). Option A rejected as speculative extraction with no second consumer. | Documentation/register-only demand (can bundle with the routed item below). |
| R-1 | Routed: plugin evolution/panorama surfaces (from RC4) | ACCEPT | Option 2: deadline-marked keep via plugin `docs/legacy-register.md` entry (owner AlembicPlugin; trigger: if no consumer named by the next plugin release decision, delete in that release's cleanup wave with the RC4-style proof set). Playbook question: NO standalone GxFn/AlembicCodex doc-only submodule commit; add the AGENTS.md pointer as a rider on the next planned alembic-codex release commit. | One-line register change: AlembicPlugin (bundle with SD-6 register work). |

Decision basis (controller judgment, not Design deference): every accepted
route is the lowest-risk option that satisfies the workspace hard rules —
staged cross-repo deletion (SD-5), no speculative abstraction without a real
caller (SD-6), behavior-preserving phases with mechanical gates (SD-3, SD-1),
repository-boundary and kernel-policy respect (SD-1, SD-4, R-1), and
evidence-corrected premises over stale audit text (SD-2). Two audit premises
were falsified by Design re-verification and are now recorded: SD-2
"no automation / tracked dist / stray vendor copy" (automation exists, dist
gitignored, vendor is a submodule) and SD-1 duplication mass (≈16.6k matched
lines current method, not 27.7k; shared/schemas divergence is intentional).

Sequencing guidance for future intake: SD-2, SD-4, SD-6+R-1 are small and
independent; SD-3 is independent; SD-1 phase 2 and SD-5 phase 2 interact
(Core surface) — SD-5 closes before SD-1 phase 2 evaluates Core sinking.
