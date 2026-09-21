# Alembic Main PC-F adapter rework execution evidence

## Result

Task `i2-1-alembic-main-pcf-adapters-rework1-t1` is complete in one clean Alembic repair commit:

- parent: `b5b63edfc3ee2921d71d67e052f0dbc8fe450afd`
- commit: `7a8c1f1364efca2001fd8452bb919ca7ec735c41`
- tree: `268b4d5f46df1adeb81a5ce320e3380f199f2e3a`
- accepted Core commit/tree: `f82bfec58e36ea71e575a23bee356623a7a28381` / `33f993435e0e52a2f565b12ce47780b5a2b6e074`
- Core package SHA-256: `6df2892d9f87416e5a7aa087f197d3191cb621678be007439578582d066135e0`
- Core repository/loaded `dist/projectContextFoundation.js` SHA-256: `08262be7dbeb2d2777f8d43a9f95c5bf9073112e46e5fd06186a9d359b5a602e`
- Main adapter source SHA-256: `fedff502544fe1a4c23ac36690271f5856e249927dd7b38d2ce21a173ede92c6`

The repair removes central four-projection precomputation from the persisted session carrier. One immutable Core artifact/binding is captured and stored; each Main production consumer independently opens that artifact through `CertifiedProjectFactsConsumerPort` at its real entrypoint. The carrier holds only base identities, receipt ledger, bounded instrumentation, and derived counters—no frozen file bodies and no projection payloads.

## Production call chain

1. `PlanSelectionGate` captures and persists the strict-v2 artifact, then reopens only the `plan` projection at `lib/recipe-pipeline/plan/PlanSelectionGate.js`.
2. The existing cold-start reset order is unchanged. `ColdStartWorkflow` receives the binding and reopens only `recipe-generation` after reset at `lib/recipe-pipeline/generate/ColdStartWorkflow.js`. The reset clears `.asd/context/index`, not the certified store at `dataRoot/context/certified-project-facts/v2`.
3. `AiDimensionPreparation` reopens `dependency-graph` at `lib/recipe-pipeline/generate/execution/AiDimensionPreparation.js`; malformed or missing graph authority propagates as an error on the certified path.
4. `AppModule` gives `ModuleService` the current session carrier plus its data/control roots. `ModuleService` reopens `module-coverage` at `lib/service/module/ModuleService.js`, reuses only an unchanged binding, reopens when a carrier appears or changes, and fails closed if a certified carrier disappears.
5. Generate session serialization carries the bounded binding/receipts. A fresh `GenerateSessionManager` reload is validated before use; deleting the live source tree does not force a filesystem fallback because file bytes are reopened from the immutable store.

Each reopen creates its own Core preparation/lease and completion receipt. No second store, parser, graph platform, Plan platform, or Core authority was added.

## Independent runtime receipt probe

An ESM runtime probe created 13 real temporary source files, invoked the production adapter implementation four times with the exact production entrypoint identifiers, and removed the fixture afterward. This is a temporary real-file capture fixture, **not** an Alembic or BiliDili production run.

- artifact: `cpf-v1:75617f657c618d1f4f7cf45e50a7e29bf7816a059068d1ed2b2634cc1c74a24f`
- shared source vector: `sha256:1f130b6a8abd7340a37e0055448489d2d08ef019cd3ac994a8323145d9ce0162`
- shared facts hash: `sha256:993479d08d33a497657d340458459c2bd4a4ffb76aa7e74f4d8d103f99d4978d`
- shared certification binding: `sha256:9eaa310130074dcd766a81d4ef2e96a652f6ff4476b388a4c9f371ab5766c2da`
- serialized carrier: 5588 bytes; `contentBase64` absent; `projections` absent
- instrumentation: four current consumer-reopen events plus one current module-conservation event

| Consumer | Entrypoint | Receipt hash | Projection hash |
| --- | --- | --- | --- |
| plan | `lib/recipe-pipeline/plan/PlanSelectionGate.js` | `sha256:ea73c86ab51df0ab5c46de0362fb84c72feadd44b9029d34ae628e323150a800` | `sha256:dd964644364c830fa9fecf14189f2a25ade753450d7274d32d7fbc52c6a58ffe` |
| recipe-generation | `lib/recipe-pipeline/generate/ColdStartWorkflow.js` | `sha256:d22eb5da5ab41dec171d381c2016f76bced7f49712aa663105ea478a9c6b21ef` | `sha256:de19a01123bfb346a11feabe38c93896f24cd9b1d603cc1c7dfc4ac68c178623` |
| dependency-graph | `lib/recipe-pipeline/generate/execution/AiDimensionPreparation.js` | `sha256:f4262252167da100e8b3b70a6f75dae437561d2dd011c3b304a6323d4d5a8f0a` | `sha256:4b39c50e417c4f6dddc3f093245ced020641dcb41e4008a966db217cbf83184f` |
| module-coverage | `lib/service/module/ModuleService.js` | `sha256:f3550007f771d923a21cec05c53533bffa15d61fffcc782518ea655826c75cac` | `sha256:fb17ed94a515a949d30025cc9d0584e734c1388e18407a1cc76fbc54d9f9bca1` |

All four receipt hashes and projection hashes are distinct while their four base identities are equal and non-empty.

## Conservation and fail-closed evidence

The permanent regression suite uses real temporary filesystem capture fixtures:

- 13 source files prove the session carrier remains below 32 KiB without repeated bodies/projections.
- 81 real owned Swift modules prove 81 non-empty module projections and exact owned-file union with no 80 cap.
- a ProjectScope control root plus four member repositories proves five canonical repository tuples, five real projected paths, and the same scope/vector binding; nested member paths are excluded from the root inventory to prevent overlap while retaining the root itself.
- a non-`.` repository `relativeRoot` proves projected paths resolve beneath the real control root instead of `${repoId}/${relativePath}`.
- fresh session reload plus live source deletion proves immutable frozen-file replay.
- ModuleService probes legacy→certified, certified A→certified B, and certified→missing; it rebinds for the first two transitions and rejects the last.
- presenter output that is not a ProjectContext envelope, missing completed map authority, and malformed declared graph edges all fail closed.
- partial identity, facts-hash, source-vector, canonical-scope, stale-binding, deleted-artifact, and mutated-persisted-payload probes all fail closed.

Strict counters are reduced from instrumentation events rather than assigned literals:

- production/reopen probe: `directProjectContextCallCount=0`
- production/reopen probe: `rawFilesystemFallbackCount=0`
- production/reopen probe: `synthesizedProjectScopeFactCount=0`
- production/reopen probe: `cappedModuleProjectionCount=0`

A reproducible nonzero reducer probe observes one direct call, one raw fallback, one synthesized scope route, and a projected 80/expected 83 module event, producing `1/1/1/3`. A separate assertion rejects an unobserved nonzero carrier counter. These probes demonstrate that zero means no observed reachable bypass, rather than a hard-coded success constant.

## RED → GREEN

Before implementation, four focused tests were added and run with:

`npx vitest run test/unit/ProjectContextCertifiedAdapters.test.ts -t 'keeps ...|records ...|rebinds ...|uses ...'`

All four failed for the expected existing defects:

- carrier serialized `contentBase64` and precomputed projections;
- the four receipts named the central generic entrypoint;
- ModuleService stayed bound to legacy data after a certified carrier appeared;
- projected disk paths used opaque repo IDs instead of manifest `relativeRoot`.

The same behaviors now pass through the final focused suite.

## Validation

- `npm run build:check`: passed before implementation and after the final commit.
- corrected focused PC-F/ProjectContext/plan/session/ModuleService command: 11 files, 94 tests passed.
- `npm run check`: passed; 1085 unit tests, 462 integration tests passed with 10 skipped, 11 coverage tests, 17 shared-asset checks, Core import/layer/ring/retired-symbol gates all passed. Biome reported only five existing warnings outside the changed files and no errors.
- `npm run test`: 173 files; 1569 passed, 10 skipped.
- post-commit highest-signal suite: 2 files, 38 tests passed.
- `git diff --check`: passed; post-commit Alembic working tree clean.

## Two-stage self-review

Requirement review checked §§7.1–7.3, 18.0, and 18.3 only for the assigned Main PC-F2 sub-scope. It mapped one stored binding, four real consumer entrypoints, bounded session persistence, accepted relative roots, strict-zero measured bypasses, large inventory/ProjectScope conservation, and fail-closed mutations to the package. It does not claim the later reset authorization, Plan cognition, mining, persistence, vector, publication, Plugin, or Graph/Map work in those broader sections.

Code review checked actual call placement, Core public-port use, receipt/base invariants, carrier size, graph/presenter error propagation, ModuleService rebinding, synchronous stale-binding rejection, reset/store separation, path confinement, root+member overlap, fresh reload, instrumentation bounds, large-inventory behavior, compatibility isolation, performance, repository scope, and diff hygiene. No further defect remained after direct source inspection and final validation.

## Boundary and remaining risk

This result completes only `i2-1-alembic-main-pcf-adapters-rework1-t1` in Alembic Main. Global PC-F still requires the controller-owned Plugin and Graph/Map packages and controller acceptance. This evidence does not assert `PCFBaselineReceipt`, global PC-F completion, or authorization to enter I3+.
