# Controller revision 201 response — Alembic strict public lineage

Task: `i3-i8-alembic-public-lineage-integrity-rootcause5-reissue1-t1`

Commit: `8f7e179f11e5c48366e6a26c9d1ce519f1f45ea2`

## Point-by-point response

1. **Replace the synthetic expansion head.** `StrictAnalysisExecutionResultV1` now carries the sealed Core `FinalExpandedMiningScheduleReceiptV1` and its authoritative ledger head. Expanded runs use the last sealed `expansionReceiptHash`; no-expansion runs derive their identity from the canonical empty `expansionReceiptHashes` array inside the verified Core receipt. `StrictFinalizationRuntime` no longer uses `hashCanonicalJson([])`.
2. **Preserve the exact fact-manifest identity.** Finalization now consumes `analysis.factExecutionManifest.manifestHash` after `assertCodeFactGenerationManifestV1` validates the facts, receipts, and manifest together. It no longer hashes fact IDs into a replacement identity.
3. **Bind one lineage through every Main boundary.** The exact expansion head, final schedule hash, and fact manifest hash are equal in the analysis checkpoint, `ServingSnapshotValidation`, `PublicKnowledgeRoute`, runtime report, and physical `lineage.json`. Core `ServingSnapshotManifestV1` has an exact-key v1 schema, so Main binds the complete lineage receipt via `servingSnapshotValidationHash` rather than adding host-only keys to the Core manifest.
4. **Fail closed before publication.** Missing final schedule lineage, a tampered fact manifest, and checkpoint/finalization divergence are rejected before `PUBLIC_CAS_PREPARED`. Finalized replay revalidates analysis lineage, finalization validation/route/manifest bindings, and runtime-report identities.
5. **Exercise the real multi-epoch path.** The retained raw run has two analysis epochs, one expansion receipt, and 15 final obligations. The real Facade/Generate/ColdStart path reaches one public CAS with the exact receipt identities below.
6. **Provide collision-recovery evidence.** Evidence contains both the deterministic base snapshot and the recovered physical UUID-suffix snapshot. The active public route selects the UUID-suffix snapshot.
7. **Exclude synthetic Plugin evidence.** `RuntimeArtifactManifestFixture` now returns an explicit `synthetic-runtime-load-fixture` boundary with `exactPluginArtifact=false` and `crossRepositoryAcceptance=forbidden`. Its synthetic `plugin-entry` tgz is not claimed as an AlembicPlugin artifact or cross-repository PC-F evidence.

## Exact runtime identities

- Expansion ledger head: `sha256:168eaa2540b57e5d4456c18bed9cd5a4f3ea29673830ccb32494b39e6c7481c4`
- Final expanded schedule: `sha256:a4d9864adea07a0081ee714b8bc9a80e75040267a8f2e9fac6c3c74c29d34845`
- Final CodeFactGeneration manifest: `sha256:924b7a2f52f36d02b1c54cc71d91b77474af72cdb687b6707a63343c2e1dfb16`
- Serving validation receipt: `sha256:70bd9d914c2e4c093a606d12892a52cbaaa329c524879a8ba94d03ea63c68bc1`
- Recovered physical snapshot: `snapshot-1c056d6127d3837c33332ce987a39a5d79000648a5921a8333543fc6a154e31a-b887cd22-1e3a-4c53-846d-b6b095316f2b`

Raw evidence root:

`wakeflow-ledger/Alembic/i3-i8-alembic-public-lineage-integrity-rootcause5-reissue1-t1/runtime-evidence`

Key readbacks:

- `runtime-evidence/checkpoint.json`
- `runtime-evidence/runtime-report.json`
- `runtime-evidence/public-route.json`
- `runtime-evidence/recipe-publications/snapshots/<uuid-suffix>/serving-snapshot-validation.json`
- `runtime-evidence/recipe-publications/snapshots/<uuid-suffix>/manifest.json`
- `runtime-evidence/recipe-publications/snapshots/<uuid-suffix>/lineage.json`

## Test-first and validation evidence

- RED: the new real-chain equality assertion failed because `finalExpandedSchedule` was absent from Main analysis output, directly exposing the analysis-to-finalization disconnect.
- Focused GREEN: 3 files, 23 tests passed after the Guard-driven fixture split.
- `npm run check`: passed on the final diff — 157 unit files / 1194 tests; 32 integration files / 472 passed and 10 skipped; coverage gate 11 tests; shared-asset drift, retired-symbol, ring-direction, lint and repository/architecture boundaries passed.
- `npm run build:check`: passed.
- `npm run release:package-guard`: passed with only the expected development-workspace lockfile warnings.
- `git diff --check`: passed.
- Alembic Guard: `guard-public-ms227u2w-5`, 6 files checked, 0 violations.

## Self-review

- Requirements review: all revision 201 repair points and reissue task evidence kinds are covered; no sibling repository was changed.
- Failure-path review: missing, tampered, resumed, reconstructed, and public-CAS-preparation boundaries were checked.
- Cross-repository contract review: the accepted Core exact-key manifest schema is preserved; the accepted Agent expansion receipt and exact fact manifest identities are consumed without host recomputation.
- Severity review: no known correctness, security, recovery, or integration defect remains in the assigned Alembic boundary.
- Residual boundary: exact AlembicPlugin artifact validation remains the downstream Plugin window’s responsibility; this result deliberately provides a real Main UUID-suffix snapshot and does not substitute the synthetic fixture tgz.
