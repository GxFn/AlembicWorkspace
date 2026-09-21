# Knowledge review — 2026-09-17

Scope: the 125 files in `knowledge-files.json`. Read-only product review; this reviewer edited only this ledger. Findings below are source-confirmed or explicit hypotheses, not executed RED results. Main-thread RED/GREEN and baseline results remain the validation authority. `knowledge-review.json` records per-file depth and consumers. Long data tables, broad facades, and large suites are not marked complete without full reading.

## Highest priority, small fixes

### K-TIMEOUT-UNITS — P1, normal recent recipes can expire immediately

- Source: `src/service/sustain/LifecycleStateMachine.ts:494`; repository writes `updatedAt` using Unix seconds, while `#getRecipeAge` subtracts it directly from `Date.now()` milliseconds.
- State entry metadata also disappears at `Stats` hydration (`src/domain/knowledge/values/Stats.ts:56`), so the fallback is the normal path. Existing `test/LifecycleStateMachineTimeouts.test.ts:10` explicitly seeds millisecond `updatedAt`, hiding real persistence units.
- Real entry: actual `KnowledgeRepositoryImpl.create` → `LifecycleStateMachine.checkTimeouts`; public factories/Plugin sweep consume this path.
- Minimal compatibility direction: normalize persisted seconds/milliseconds consistently at the age-read boundary; keep 7/30 day rules and cap semantics. Retain migration handling for historically millisecond values. Do not silently rewrite the whole stats schema or all stored timestamps.

Regression snippet to add to the existing real-SQLite fixture:

```ts
it('does not expire a newly persisted pending Recipe', async () => {
  const entry = new KnowledgeEntry({ title: 'Fresh pending', content: { markdown: 'Body' } });
  await knowledgeRepo.create(entry);
  const result = await lifecycle.checkTimeouts();
  expect(result.timedOut).toEqual([]);
  expect((await knowledgeRepo.findById(entry.id))?.lifecycle).toBe('pending');
});
```

Also cover a normal seconds `updatedAt` older than 31 days (expires), and legacy milliseconds (existing contract remains).

### K-HASH-NEWLINE — P1, every normal serialized file can look manually edited

- Source: `src/service/knowledge/KnowledgeFileWriter.ts:168` removes the placeholder text but leaves its newline. `computeKnowledgeHash` at `:495` removes the whole hash line including newline. The two inputs differ by one blank line.
- Real entry: `KnowledgeFileWriter.serialize` / `parseKnowledgeMarkdown` / `computeKnowledgeHash`, then `KnowledgeSyncService.syncAll` audit.
- Existing hash round-trip test compares two serializer runs to each other, not stored-vs-actual hash.
- Minimal fix: compute from the serialized placeholder-bearing document through the canonical hasher; it already strips the hash field. Keep field names, hash algorithm, digest length, and rest of serialization unchanged. Consider old buggy hashes separately before treating old files as malicious edits.

```ts
it('embeds the hash of its actual serialized file', () => {
  const md = writer.serialize(makeEntry());
  expect(parseKnowledgeMarkdown(md).contentHash).toBe(computeKnowledgeHash(md));
});
```

Then persist and sync a real file without `force` or `skipViolations`; assert `violations=[]`.

### K-FILENAME-COLLISION — P1, sanitized trigger can overwrite another knowledge file

- Source: `src/service/knowledge/KnowledgeFileWriter.ts:703`; filename contains sanitized/truncated trigger or title only, no identity check before `renameSync`.
- Distinct triggers `@a.b` and `@a:b` both produce `a_b.md`. `KnowledgeService.create` checks title only; cross-request Gateway uniqueness depends on supplied sets. The second write overwrites the first entry's authoritative file, then sync deprecates the orphan.
- Real entry: two `KnowledgeService.create` calls with real repo/writer, or two direct public `KnowledgeFileWriter.persist` calls, followed by sync.
- Minimal compatibility direction: verify an existing destination belongs to the same entry before replacement; a detected collision should fail visibly, retaining the first file. Preserve ordinary historical names; do not rename the entire corpus merely to add UUID suffixes. Cover move collisions and delete fallback ownership too.

```ts
it('does not overwrite another entry at a sanitized trigger collision', () => {
  const first = makeEntry({ id: 'collision-a', title: 'First', trigger: '@a.b' });
  const second = makeEntry({ id: 'collision-b', title: 'Second', trigger: '@a:b' });
  const firstPath = writer.persist(first)!;
  const before = fs.readFileSync(firstPath, 'utf8');
  expect(writer.persist(second)).toBeNull(); // existing nullable failure contract
  expect(fs.readFileSync(firstPath, 'utf8')).toBe(before);
  expect(parseKnowledgeMarkdown(before).id).toBe(first.id);
});
```

### K-UOW-RETURN — P1, nullable file failures still commit DB changes

- Source: `src/repository/knowledge/KnowledgeUnitOfWork.ts:163`; `persist`/`moveOnLifecycleChange` return `string|null`, `remove` returns boolean (`KnowledgeFileStore.ts:28`), but return values are ignored.
- Real entry: public UoW commit with real file writer failing on missing title; current success mocks in `test/FailureSemanticsCO3.test.ts:88` return void instead of satisfying the public port.
- Minimal fix: check declared failure sentinels at this single boundary and throw `FileWriteError` before DB commit; keep DB-failure DivergenceError semantics. Update success mocks to return paths/true; do not make failure tests depend only on a fake throwing implementation.

```ts
const writer = new KnowledgeFileWriter(tmpDir);
const writeDb = vi.fn();
const uow = new KnowledgeUnitOfWork(connection.getDrizzle(), writer);
uow.registerFileOp({ type: 'write', entry: new KnowledgeEntry({ id: 'invalid', title: '' }) });
uow.registerDbChange(writeDb);
expect(() => uow.commit()).toThrow(FileWriteError);
expect(writeDb).not.toHaveBeenCalled();
```

The UoW currently has no production use found inside Core beyond its export; it is still a public package contract and must not be deleted solely for that reason.

### K-VALIDATOR-TYPE — P1, one malformed candidate aborts a whole batch

- Source: `src/domain/knowledge/UnifiedValidator.ts:150`, `:166`, `:261`; it records missing/type errors but continues with string methods on unchecked `unknown`. `RecipeCandidateValidator.ts:118`, `:126`, `:151` has the same class of fault.
- Real entry: `RecipeProductionGateway.create` schema loop has no per-item catch; `validateCandidatesUnified` accepts `Record<string,unknown>[]` but can throw before returning structured invalids.
- Minimal fix: string/object guards before semantic checks, preserving existing errors/warnings for valid/legacy string inputs. Do not normalize numbers into accepted strings or widen schema.

```ts
const malformed = { ...validItem, title: 'Malformed trigger', trigger: 123 };
const result = await gateway.create({ source: 'mcp', items: [malformed, validItem] });
expect(result.rejected).toEqual(expect.arrayContaining([expect.objectContaining({ index: 0 })]));
expect(result.created).toEqual(expect.arrayContaining([expect.objectContaining({ index: 1 })]));
```

Use an unknown-input cast only at the boundary. Add table cases for `language`, `category`, title, content markdown/pattern, and reasoning.whyStandard as wrong primitive/object types; assert structured failure and no batch-wide TypeError. Keep byte-identical stage-3 corpus checks for previously supported inputs.

## Other actionable functional issues

- **K-PARSER-RAW-LOSS / P1** — `RecipeParser.ts:121`: `parseAll` returns a parsed record for arbitrary nonempty source text, making raw-source fallback in `extractFromPath`/`extractFromText` unreachable. The result has empty code (and potentially undefined language). Real consumer `../Alembic/lib/http/routes/extract.ts:93` sends `file.code || ''` to extraction. RED: `extractFromText('export const answer = 42;', {language:'typescript'})` and a real `.ts` file must preserve source code and language. Preserve complete Markdown parsing and multi-recipe frontmatter boundaries; avoid replacing this with an empty stub.
- **K-ENHANCEMENT-RELATIONS / P2** — `EnhancementSuggester.ts:190`: enumerating a `Relations` instance yields `_b`, not buckets; arrays are never found, so deprecated-reference advice is absent. RED with actual repository entries and a `knowledge:<id>`/plain-id reference to deprecated knowledge. Read the value object's `toFlatArray` or `toJSON` and normalize real target form. Other enhancement categories must remain intact.
- **K-PATCH-SOURCE-TRUTH / P1** — `ContentPatcher.ts:417`: sourceRefs patch updates only `recipe_source_refs`, not `reasoning.sources`; the next `SourceRefReconciler` rebuild discards the new refs from unchanged authoritative reasoning. RED: real patch → repository readback → reconcile; new paths must survive and old ones must remain gone. Preserve other reasoning fields and region fingerprints. This can be separated from the broader file-first redesign.
- **K-DEPTH-ALIASES / P2** — `depthReview.ts:160`: groundedFileCount uses raw cited strings, although suffix aliases may point to the same resolved file; `validRanges` is accepted but ignored. `src/a.ts:1` plus `a.ts:999999` can become two grounded files. RED via public reviewRecipeDepth with one canonical resolved path/range. Preserve path-only compatibility callers if ranges absent; canonicalize before distinct counting, and enforce ranges only when available with explicit semantics.
- **K-SYNC-ERROR-ORPHAN / P2 hypothesis** — `KnowledgeSyncService.ts:230`: unreadable/unparseable existing file gets skipped then may be considered deleted because orphan detection uses successfully parsed IDs. RED needs true file read failure with existing DB truth; don't deprecate on unknown file state.
- **K-RENAME-RANGE / P2** — `SourceRefReconciler.ts:633` looks up `src/a.ts:1-3` in Git's bare-path rename map. RED real Git rename + bounded source ref; preserve the range suffix and content fingerprint when rewriting.
- **K-SCALAR-ESCAPE / P2 hypothesis** — `KnowledgeFileWriter.ts:647` hand-unescapes quote/newline but not all serializer backslash escapes. Add quoted backslash/regex/coreCode roundtrip before changing YAML handling.
- **K-SOURCE-SYMLINK / P2 hypothesis** — `FsSourceRefResolver.ts:52` checks lexical containment, while stat/read follows a symlink outside root. Test a project symlink pointing to a sibling file; require the intended evidence root boundary without blocking intentional canonical multi-root callers.

## Requires compatibility design / boundary decision

- **K-FILE-FIRST-EVOLUTION / P1 source-confirmed gap, not yet runtime-reproduced**: `LifecycleStateMachine.transition` directly calls SQL `updateLifecycle` (`:173`); `ContentPatcher` directly calls repo.update (`:417`); `StagingManager` also writes directly. The repository constructor and mutators contain no file hook. Real Plugin `KnowledgeModule.ts:394/:406` constructs these classes; its event bindings only refresh search/source refs, not `.md`. RED: create staging with real writer → promote → syncAll; active should not revert to staging. Similarly patch→sync must not restore old text. A Core optional persistence port alone is not a production fix until external DI is wired. Do not mark this resolved with a mock-only optional adapter. Keep existing constructors compatible; obtain compatible downstream wiring design before claiming full repair.
- **K-STATS-META / P1–P2**: Stats fixed schema loses lifecycle timestamps, stagingReview, decayScore, lastVerifiedAt that are written elsewhere. Fixing timeout units does not establish all metadata truth. Trace each producer before adding fields or retaining arbitrary untrusted keys.
- **K-DRIFT-ACK / semantics question**: detected content drift writes current fingerprint, and the next unchanged force reconcile marks active without Recipe review. Clarify whether drift is an event or a durable stale condition; current tests expect fingerprint refresh but do not exercise the subsequent tick.
- **K-SWEEP-STARVATION / hypothesis**: fixed oldest-first cap with healthy/waiting entries remaining eligible can consume every later sweep and starve younger actionable entries. Need a fairness contract/cursor design, not an invented cap change.

## Safe cleanup candidates and deletion evidence

No exact duplicate-function group in `exact-duplicate-functions.json` contains an assigned knowledge file. The following local redundancies were found by full reading:

1. `FieldSpec.getRequiredFieldsDescription:330-333`: both branches return the same expression; remove the redundant conditional, preserve output exactly.
2. `SimilarityService.ts:91`: `_fmMatch` unused; delete local regex computation only.
3. `RecipeParser.ts:38`: `_SNIPPET_HEADING_RE` unused; remove local constant.
4. `LifecycleEventRepository.findRecent:94-104`: mapping matches existing `#mapRow:169`; reuse helper and retain return type and ordering.
5. `EnhancementSuggester.#signalBus:43`: only assigned, never read; remove private field/assignment while retaining accepted options.signalBus for compatibility.

Do not remove KnowledgeUnitOfWork, KnowledgeRepository, root/index facades, BaseDimension adapters, Cursor aliases, lifecycle aliases, or legacy proposal/source type names solely because direct internal references are sparse. Package exports and real external consumers remain compatibility evidence. RecipeParser is consumed by real HTTP extraction despite weak local tests.

## Test consolidation recommendations

- `DomainLifecycle.test.ts` is largely weaker duplication of `Lifecycle.test.ts` + `KnowledgeEntry.test.ts`, and still calls the model three-state. Move its comprehensive inferKind cases and invalid-constructor-lifecycle case into the canonical suites, add evolving→staging and self-transition matrix coverage, then this file can be removed without deleting unique behavior.
- Remove the duplicate standalone Lifecycle group in `KnowledgeEntry.test.ts:215-237` after canonical matrix coverage exists; retain all value-object and entity behavioral tests.
- `RecipeAuthoringDepthGuidance.test.ts:48` tests an old `.slice(0,12)` consumer transformation that actual DimensionCatalogPayload removed; verify no active consumers still slice, then delete this stale test. Keep real builder transmission coverage in `DimensionSubmissionSpecCollapse.test.ts:44` and the other guidance/depth tests.
- CandidateValidationFacade's two direct parity tests can be one compact contract test; retain independent weak candidate rejection and add malformed batch isolation rather than only self-comparing production helpers.
- Keep real SQLite/file/strict recovery floors: KnowledgeProductizationLifecycle, StrictKnowledgePersistenceFaults, StrictPreparedRecipeGateway, FailureSemanticsCO3, StagingManager, and ProposalExecutorBounding. Similar fixture setup is not evidence these behavior seams are redundant.
- Do not replace regression tests with implementation-mirroring snapshots or change timestamp fixtures to mask real persisted seconds. Existing lifecycle timeout test comments explicitly document the dangerous workaround.

## Authorized implementation progress (same review task)

The root task subsequently authorized implementation of K-TIMEOUT-UNITS, K-UOW-RETURN, K-HASH-NEWLINE, K-FILENAME-COLLISION, and UnifiedValidator's K-VALIDATOR-TYPE. All five now have independent RED/GREEN logs (`knowledge-timeout-*`, `knowledge-uow-*`, `knowledge-hash-*`, `knowledge-collision-*`, `knowledge-validator-*`). Eight owned files pass scoped Biome; `knowledge-typecheck.log` passes TypeScript. No commit; root task reviews and commits. The legacy RecipeCandidateValidator malformed-input issue is separate and was not claimed fixed.

The user then explicitly authorized necessary Alembic/AlembicPlugin wiring for the file-first evolution gap. Both repositories started with only user AGENTS.md/CLAUDE.md edits, recorded in `knowledge-cross-repo-start.json`. Work plan: (1) real SQLite/file RED for promotion/review/rollback/patch and fault boundaries; (2) internal shared file-first update helper plus explicit optional fileStore injection in LifecycleStateMachine/ContentPatcher/StagingManager; (3) whitelist only actual Stats metadata producers, with absent fields omitted for serialization compatibility; (4) two KnowledgeModule factories wire the existing writer; (5) focused Core/consumer verification. No asynchronous UoW transaction and no package-export expansion.

### File-first and root-review follow-through

- `knowledge-evolution-file-first-red.log`: 6 expected failures through real SQLite/Markdown. Corrected the patch fixture to the existing `PatchChange.newValue:string` JSON-array encoding, then reran the original ContentPatcher in `knowledge-patch-truth-red.log` before verifying the candidate implementation. No public entrypoint or outcome was weakened.
- `knowledge-evolution-file-first-green-2.log`: 101 tests / 6 files pass, including previous DB-only call patterns.
- Both hosts' real registration tests use public Core imports, real ServiceContainer/KnowledgeModule, real SQLite and writer. Unwired factories were RED (`knowledge-main-wiring-red.log`, `knowledge-plugin-wiring-red.log`), injected factories GREEN (`knowledge-main-wiring-green-2.log`, `knowledge-plugin-wiring-green.log`). Both host typechecks and scoped Biome pass. No exports/constructor positions were removed.
- Root review identified nullable DB readback: `knowledge-mutation-readback-red.log` uses a real SQL DELETE between real UPDATE and readback; previously the operation returned true. Same entrypoint is GREEN after same-id readback validation, with typed DivergenceError and sync repair.
- Root review identified destructive UoW compensation: `knowledge-uow-partial-truth-red.log` proves both existing and newly created knowledge files were deleted after a later file failure. GREEN now retains completed writes, reports entryIds/completion count/reconcileVia, does not execute DB callbacks, and does not claim atomic file rollback. Error class remains FileWriteError. No snapshot API was invented.

### Continued full-file reading: reproduced Service defects

`knowledge-read-service-red.log` contains three failures with the actual KnowledgeService + SQLite + KnowledgeFileWriter, defined in `knowledge-read-probes.test.ts` (no production code changed for these probes):

- K-UPDATE-VALUE-OBJECT / P1, `KnowledgeService.ts:503`: structured update overwrites Content/Reasoning/Relations/Constraints instances with plain objects; writer serialization calls missing `.toJSON()`. Minimal direction: construct a prospective `KnowledgeEntry.fromJSON({...old.toJSON(), ...updates})`, as quality/lifecycle paths already do, before persistence. Keep all existing metadata and file-failure semantics.
- K-UPDATE-USAGE-GUIDE / P2, `:429`: usageGuide is declared updatable but omitted from the switch, so a single-field update fails. Minimal direction: handle it with the other scalar fields and verify actual readback.
- K-USAGE-COUNTER / P1, `:807`: default `adoption` and real outer `application` use singular operation names while Stats counters are plural. Main `GatewayActionRegistry.ts:91/:96` and HTTP `/knowledge/:id/usage` exercise this interface. Normalize approved operation names to existing counters before incrementing; preserve accepted plural aliases and reject unknown types explicitly. Current unit test only asserts repo.update was called.

The remainder of LifecycleStateMachine revealed the same timestamp-unit fault in health queries. `knowledge-health-clock-red.log` / `green.log` now proves fresh persisted pending/evolving/decaying entries are neither expired nor reported stuck; both paths share one age function and avoid repeated DB reads.

Correction to K-DEPTH-ALIASES: `validRanges` contains source-text snippets, not coordinate ranges. It cannot safely provide an allowed-line-number gate. Keep the canonical-file distinct-count defect; the root task independently fixed that and documented the input meaning. The earlier suggested `validRanges` line-number probe was invalid and is withdrawn.

K-UPDATE-VALUE-OBJECT, K-UPDATE-USAGE-GUIDE, and K-USAGE-COUNTER are now implemented after authorization. Existing real SQLite/file tests contain the RED cases; four suites / 122 tests pass (`knowledge-service-mutations-green-2.log`) and typecheck passes. Usage persists through file sync, so each real counter operation now incurs the existing durable Markdown write before DB update; this intentionally prevents the prior silent counter reset. Feedback remains audit-only with no counter/file mutation. The remaining no-fileWriter constructor retains the legacy DB-only diagnostic path. The readiness fixture with two independent IDs had reused one trigger/file; its second trigger was made unique, leaving its active-transition and fingerprint assertions unchanged.

K-BULK-COUNT correction: the probe demonstrated attempted-vs-inserted counts, but did not establish an actual-insert contract. Root supplied `CodeEntityRepositoryFloor.test.ts:83` explicitly preserving processed counts for the same repository API family; no KnowledgeEdge consumer or dedicated test requires a different unit. The proposed semantic change is withdrawn. `bulkInsertIgnore` retains its return value; only its private variable and comment now accurately say processed. The exploratory assertion is skipped as withdrawn, not relabeled a fixed failure.


### Final knowledge query/ownership review batch

- **K-WRITER-OWNER / P1 fixed**: `_cleanupOldFile`, remove(sourceFile)/fallback, and recursive ID scan now require exact full frontmatter ID ownership before deleting. A cloned wire entry inheriting someone else’s sourceFile preserves the original; different IDs sharing a normalized filename still fail before replacement. RED/GREEN: `knowledge-writer-ownership-red.log` / `knowledge-writer-ownership-green.log` (4 suites / 91 tests). Quoted IDs use JSON string decoding; duplicate/missing IDs are not ownership proof. Existing path/write guards remain.
- **K-TAG-LITERAL / P2 fixed**: public KnowledgeService.list with literal underscore, percent, backslash and quote tags through real SQLite proves the LIKE escaping defect. Query now applies JSON string encoding plus SQL LIKE escaping and explicit ESCAPE; API shape, sorting and original LIKE casing retained. `knowledge-tag-filter-red.log` / `knowledge-tag-filter-green.log` (2 suites / 30 tests).
- **K-RANGE-REF-LOOKUP / P1 fixed**: real SourceRefReconciler writes bounded refs while diff paths are bare. Repository bare lookups now include valid range suffixes with final case-sensitive exact file identity, preserving sourcePath and result order; explicit bounded queries remain exact. The existing public stripSourceRangeSuffix export remains via re-export after moving only its shared pure implementation to `src/shared/sourceRefPath.ts` (not added to shared/index). `knowledge-range-refs-red.log` / `knowledge-range-refs-green-2.log` (5 suites / 74 tests).
- **K-DELETED-SOURCES / P1 fixed with explicit root approval**: source-deleted means *all source files lost*. Previous per-file exclusion considered each concurrently deleted peer still active. Entire diff.deleted now determines remaining health; the old partial assertion in RecipeImpactPlanner unit tests was acknowledged as a bug, not a metrics compatibility contract. activeRefCount still counts only healthy active refs. Surviving drifted or renamed-to-existing files keep partial and do not trigger the existing deterministic deprecate route; no policy thresholds changed. Real ref/files RED: `knowledge-range-survivors-red.log` (2 failures), same GREEN batch as above. Unknown stat errors preserve the renamed source conservatively and diagnose it; definite ENOENT/ENOTDIR does not.
- **K-GRAPH-DIAMOND / P2 fixed**: getDescendants/getImpactRadius emitted D twice for A←B/C←D because visited was set only on dequeue. Mark-on-enqueue preserves the first BFS path, shortest depth, node type, root exclusion and requested depth bound. Real SQLite inheritance diamond+cycle: `knowledge-graph-diamond-red.log` (2 failures), `knowledge-graph-diamond-green.log` (3 suites / 21 tests). getCallers/getCallees were not changed because their edge-list semantics require a separate contract decision.
- All latest owned query/ownership files passed scoped Biome and Core tsc: `knowledge-query-ownership-format.log`, `knowledge-query-ownership-typecheck.log`. No commit; root owns independent review/commit. Existing root sinceEpoch gte edit was preserved.

### File-by-file completion and precise test consolidation proposals

All 125 assigned baseline files now have manual-code-complete records. This means full implementation/type/data/test-body reading, not a blanket claim that no defects remain. All initial static-inventory placeholders have been replaced by specific responsibilities and retain/compatibility rationale. Recently added internal files and consumer fixtures were independently read/verified as implementation work; they are not falsely counted as part of the original 125.

Safe test-case consolidation proposals (root to review; not deleted by this agent):

1. `test/ProposalExecutorBounding.test.ts`: the first observing-only query spy seam is a strict subset of the later P3-Core-2 spy seam (same empty DB, cap=3 and no cap; later test asserts both observing and pending). Remove the earlier test without moving assertions. Keep actual budget-draining/shared-budget/GC/reentry/observation-window outcomes.
2. `test/unit/ConsolidationAdvisor.test.ts`: the well-formed substance test repeats exactly `new ConsolidationAdvisor(mockRepo([])).analyze(makeCandidate())`; first create/no-related test asserts action=create and confidence, strictly stronger than `not insufficient`. Remove the later duplicate. Reorganize and partial merge tests currently allow multiple outcomes; tightening their fixtures needs an explicit algorithm boundary, not deletion.
3. `test/unit/ContentPatcher.test.ts`: snapshots and DB persistence tests repeat first coreCode replacement input. Move their unique doClause/sourceRefs beforeSnapshot and update argument assertions into that first case, then delete the two duplicate invocations. Preserve multi-field, section preservation, sourceRefs, append, whitelist, missing recipe and unstructured rejection.
4. `test/KnowledgeFileWriter.test.ts`: exact duplicate description assertion inside one roundtrip can be deleted. Keep serialize syntax versus parse/domain roundtrip boundaries, which detect different regressions.
5. `test/unit/KnowledgeService.test.ts`: high-confidence grace defined-only assertion can join the concrete 24-hour case; do not remove public legacy alias tests or mistake the weak mock incrementUsage check for persistence coverage.

Public compatibility surfaces not safe to remove: KnowledgeService lifecycle aliases; BaseDimension/RecipeDimension and old public stripSourceRangeSuffix entrance; KnowledgeUnitOfWork/KnowledgeFileStore despite no internal production UoW caller; optional old no-fileStore constructors; processed-unit bulkInsertIgnore result. No exact duplicate-function candidate belongs to the original knowledge scope.


### Final legacy candidate validation repair

Root authorized the remaining RecipeCandidateValidator/CandidateValidationFacade malformed-input issue. Actual facade batch RED used malformed first candidate plus a well-formed next candidate; good-item full outputs were compared to an isolated good call. Title tokenization now ignores wrong types for dedup only, leaving original candidates intact for structured errors. V3 nested/string checks no longer call string methods on arbitrary values. Core Scope verification included the existing UnifiedValidatorStage3ByteIdentical suite. Logs: knowledge-candidate-malformed-red/green and foundation-scope-core-green.


### Final Stage-3 enforcement matrix reconciliation

Root's final full Core run exposed one stale inventory assertion: UnifiedValidator now contains **12** `errors.push` sites, while the Stage-3 enforcement matrix still listed 11. The newly added `STAGE3_OPTIONAL_FIELD_TYPE_INVALID` matrix item describes the real branch at `src/domain/knowledge/UnifiedValidator.ts:121–124`; it is the K-VALIDATOR-TYPE malformed-input rejection补齐, not an unchanged-rule-count refactor. The source rule and root's appended fixture item were read-only cross-checked; this agent did not change source, matrix tests, or frozen Stage-3 expected outputs.

Precise scope: for a `V3_FIELD_SPEC` field whose level is **EXPECTED or OPTIONAL**, and which is **not listed in `options.systemInjectedFields`**, a non-null/non-undefined provided value must have its declared string/array/object outer type. Wrong types add `字段类型错误: <name> — 应为 <type>` and reject that candidate structurally. Currently non-REQUIRED entries are dimensionId/topicHint/scope/complexity/content.pattern/sourceFile/tags. Missing/null values and correctly typed empty optional strings remain permitted; missing EXPECTED fields keep their existing warning. Array element schemas and unknown keys are not newly validated. REQUIRED fields keep the existing missing-field diagnostic. System-injected fields continue to bypass the field loop.

The fixture description “provided non-REQUIRED V3_FIELD_SPEC field has the wrong declared type; missing optional values remain allowed” is accurate at the rule-inventory level; “always” describes Stage-3 execution on both submit paths, not unconditional rejection of all optional fields. A maximally precise wording can add “not explicitly skipped via systemInjectedFields”. The matrix count guard correctly forced the new real rejection to be inventoried; it must remain intact. Existing `UnifiedValidatorStage3ByteIdentical` is compatibility evidence for its pre-existing fixture corpus only, not a claim that all Stage-3 accepted/rejected inputs or the number of rules stayed unchanged. Gateway malformed+good batch regressions establish that a bad optional content.pattern is rejected without aborting the next valid item.

No tests were rerun for this read-only confirmation/documentation update; root owns the final matrix + byte-baseline/full-suite rerun.
