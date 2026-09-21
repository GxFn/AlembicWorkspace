# Intelligence test review

Bounded read-only review of the 27 files assigned after the knowledge/foundation work. No test edits or runs are made for this review; B/root retain implementation ownership. `intelligence-tests-review.json` records exact completed vs pending files. 27 / 27 assigned suites fully read; no assigned file remains static or partial. No whole-file deletion is justified yet.

- GuardImmuneSystem first uncertainty case is a wiring smoke test; nonnegative count is not a behavioral uncertainty assertion. Preserve its collector instance/capability shape assertions if merging into GuardCheckEngine.
- VectorIndexPorts calls remove/clear without assertions that the adapter delegated them. Preserve reader/write separation, strengthen those two expectations.
- EnhancementGuardRules parity is a public facade contract, not automatically worthless self-comparison. Its final subset-length assertion is redundant after strict equality to the filtered registry set.
- AstGrammar resource availability checks must survive any merge with MultiLanguageParsers; the latter cannot prove packaged WASM discovery from parser output alone.

- Possible whole-file consolidation: migrate AstGrammar’s legacy inferLanguagesFromStats/ensureGrammars/reloadPlugins/isAvailable assertions into PublicProjectIntelligenceEntrypoints’s first grammar/AST case before removing AstGrammar. Do not replace real readiness with merely `isParserReady` being a function.
- ProjectContext Contract/Module/Map/Repo/SourceSlice suites test different consumer projections. Similar temp-tree helpers and seed data do not justify dropping kind-specific output/negative-field/partial-error assertions.

- Concrete deletion candidate: RecipeContextService’s final lifecycle-isolation describe only inspects methods of its own hand-written fake and repeats the first detail ID assertion; it proves no additional behavior. No unique assertion migration is needed.
- Concrete redundant setup: MultiLanguageParsers’s Bazel load group creates/loads a throwaway discoverer in beforeAll, then its only test creates/loads another one. CustomConfigDiscoverer.load writes instance state; remove the discarded calls and beforeAll async marker, retaining every filesystem fixture and target assertion.
- GuardImmuneSystem’s first smoke can merge into GuardCheckEngine’s existing batch audit case only after moving collector-instance and per-file uncertainty-array assertions. The nonnegative total check has no independent value; keep the remaining feedback and RuleLearner behaviors.
- GuardCheckEngine’s final signal case leaves an in-memory DB unclosed; recommend explicit finally cleanup. Vector generation tests use an in-memory runtime correctly for protocol state; they must not be advertised as actual durable filesystem tests.
- MultiLanguageParsers is a build-manifest parser/discoverer suite; the earlier superficial assumption that it also reloads WASM grammar was corrected in the per-file record. Its content is not a substitute for AstGrammar.


## Final review conclusions

- **Reproduced test-only defect IT-SEARCH-ORDER**: `SearchPipeline.test.ts` ensureIndex case fails under `vitest run test/SearchPipeline.test.ts -t ensureIndex`, because beforeAll only constructs the engine and the case assumes a preceding test has built the index. Log: `intelligence-test-order-probe.log`. Minimal repair: establish the index in that case before spying, then call ensureIndex again and assert no rebuild. Do not edit the runtime to satisfy this test dependency.
- **Definite vacuous test**: SearchPipeline semantic-without-AI only asserts `items.length >= 0`. Remove it or move a real mode/fallbackReason/live-ID assertion to the existing SearchEngine missing-provider semantic case; no existing unique meaningful assertion is lost.
- **Tokenizer consolidation**: keep one tokenizer describe in SearchEngine. Before removing the SearchPipeline tokenizer group, move its unique Chinese unigram/bigram and mixed Chinese+URLSession expectations; existing SearchEngine falsy case additionally covers undefined, and URLSession duplicate is identical. Remove SearchEngine's Chinese length>0 case after those stronger checks move.
- **Scorer clear consolidation**: retain SearchRanking `clear resets everything including _idIndex`, adding avgLength=0, empty docFreq, and `search('react')=[]` (react exists in that fixture before clear). Then SearchEngine clear-state case and SearchPipeline clear-search case are redundant. Other incremental removal/update/tombstone/semantic-topic-frequency/compact cases remain independent.
- **Cache suspicion withdrawn**: a probe initially assumed default keyword ranking creates an `r` key segment. The actual default is `options.rank ?? mode !== 'keyword'`, so the existing hardcoded expiry key correctly matches. The initial probe failure disproved the hypothesis; do not list this as a product or test bug. A corrected before/after-TTL probe verifies this. The weaker cacheSize or repeated-ID assertions still do not prove a cache hit and can be folded into a public search + query-spy/fake-clock test.
- **End-to-end preservation**: keep ProjectContext's native-registry ref traversal, all-nine-provider factual coverage, different anchor selectors, scope output containment and command-execution sentinels. Large fixture/setup overlap does not justify reducing it to mock-only DTO tests.

This was read-only review of the 27 product test files. Only narrow ledger probes and the existing isolated ensureIndex execution were run to evaluate review claims. None of these 27 files was edited by this agent during this review; previously authorized tests in other scopes are recorded separately. B/root still own test consolidation and fixes.


## Authorized cleanup completed

Root explicitly authorized these test-only changes after the review. No product implementation was changed in this cleanup. B/root additions already present in SearchEngine/GuardCheckEngine were preserved.

| Removed/reduced material | Retained replacement / evidence |
| --- | --- |
| AstGrammar.test.ts whole file (two cases) | PublicProjectIntelligenceEntrypoints first case now includes legacy inferLanguagesFromStats + ensureGrammars results, reloadPlugins/isAvailable, and actual legacy analyzeFile class detection, alongside the generic public resource and AST entrypoints. No skip/availability relaxation. |
| SearchPipeline tokenizer describe | Exact Chinese unigram/bigram and mixed Chinese/URLSession assertions moved to SearchEngine tokenize; its existing URLSession/falsy cases retain duplicates plus undefined coverage. |
| SearchEngine weak Chinese length-only case | Replaced by the migrated concrete token expectations. |
| SearchEngine and SearchPipeline duplicate clear cases | SearchRanking final clear test additionally verifies avgLength, docFreq and search('react') empty after removing a previously matching corpus. |
| SearchPipeline semantic fallback length>=0 case | Existing SearchEngine semantic fallback case retains mode + fallback metadata and now additionally asserts actual r1 result. |
| RecipeContextService final mock-self-definition case | First detail test already covers r1 readback; the mock method-key assertion only restated its factory definition and had no distinct runtime behavior. |
| GuardImmuneSystem first smoke + dead mock DB helper | GuardCheckEngine real SQLite batch test retains collector instance, capability report, per-file uncertainResults arrays and totalUncertain field assertion. Other feedback/RuleLearner tests stay. |
| MultiLanguageParsers Bazel beforeAll throwaway load | The actual target test still creates a fresh discoverer, detects and loads the same fixture, and asserts both App and NetworkKit targets. Only unused instance work was removed. |
| SearchPipeline ensureIndex hidden prior-case dependency | This case explicitly ensures the index exists before installing the no-rebuild spy; no runtime workaround. |

Validation: `intelligence-cleanup-before.log` 9 suites / 226 pass; `intelligence-cleanup-after.log` 8 suites / 218 pass. These are observed suite snapshots, not a performance claim (timing/warmup differs). The grammar entrypoints ran in both. `intelligence-test-order-probe.log` was isolated RED, `intelligence-test-order-green.log` is isolated GREEN. Final preservation assertions in SearchEngine/GuardCheckEngine passed 83 tests in `intelligence-cleanup-final.log`. Scoped Biome and git diff --check passed. No commit: parent owns final independent review and commit.
