# P4-Agent (p4-agent-inprocess-parity) — controller independent verification

Date: 2026-06-30
Controller: AlembicWorkspace (claude-code host)
Result: **VERIFIED-READY** (formal accept bundled with p4-plugin-drift-parity,
because the open-controller-review scope groups the whole P4 wave-2 — p4-plugin
was still in-flight at verification time).

## Independently verified (not trusting backfill)

- **Commit f8ddddd on AlembicAgent main** (baseline eab6c88 P1.4b): `git show --stat`
  proves ONLY `test/recipe-authoring-inprocess-parity.test.ts` added (176 insertions).
  `git diff --stat eab6c88 f8ddddd` on `recipeAuthoringGate.ts` + `knowledge.ts` +
  `insightProducer.ts` = **EMPTY** → the P1.4b wrapper + all gate paths are
  byte-unchanged. Gates NOT relaxed. 2 commits ahead of origin → LOCAL UNPUSHED.
- **Re-ran the parity test myself → 3/3 PASS.**
- **Read the test body — REAL, non-vacuous, with an anti-trivial guard:**
  - Real temp project (alpha/beta/gamma.ts, 20 lines each) so the injected fs
    resolver deterministically fires NOT_FOUND / LINE_OUT_OF_RANGE.
  - `directCoreVerdict` mirrors EXACTLY what the wrapper composes (single item,
    stage:'all', path:'in-process', same `createInProcessSourceRefResolver()` +
    projectRoot, the profile + dimensionId the wrapper resolves).
  - Case 1 (opportunistic): per-item `wrapperVerdict).toEqual(coreVerdict)` over a
    5-item corpus (clean / stage-1 / stage-2 / fs NOT_FOUND / fs LINE_OUT_OF_RANGE)
    + non-vacuous (`totalViolations>0` AND `cleanItems>0`).
  - **Case 2 (anti-trivial):** a single-file rule item — wrapper (dimensionless)
    `toEqual` opportunistic AND **`not.toEqual` cold-start** (cold-start adds the
    3-file floor). Proves the two profiles genuinely diverge and the wrapper
    correctly selects opportunistic — the parity is NOT vacuously true.
  - Case 3 (cold-start): dimension-bearing item → wrapper `toEqual` direct Core
    cold-start, proving the profile-resolution branch also doesn't mutate.
- `npm run check` exit 0; full suite 43 files / 311 tests (was 42/308; +1 file/+3).

## §12.5 transitive closure (the three legs)

1. Core path-parity (tr-p4-core-drift-parity, ACCEPTED rev 50): `validateAgainst`
   path:'host-cold-start' == path:'in-process' under a fixed profile.
2. **In-process leg (this): `runInProcessRecipeAuthoringGate` == Core validateAgainst(path:in-process).**
3. Host leg (p4-plugin-drift-parity, pending): host wrapper == Core validateAgainst(host path).

⇒ host-wrapper == in-process-wrapper transitively (both equal the same Core gate).
AlembicAgent cannot import AlembicPlugin internals, so the closure is transitive
(via Core), which is the correct architecture — not a defect.

## Conclusion

P4-Agent meets every acceptance criterion. Accept it together with p4-plugin
once that result lands (single reduce candidate over the wave).
