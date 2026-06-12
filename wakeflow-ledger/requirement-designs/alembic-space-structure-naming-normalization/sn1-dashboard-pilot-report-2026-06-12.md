# SN1 Dashboard pilot report (2026-06-12)

Target window: AlembicDashboard. Wave commits `9710a14..18837ef` (4 commits,
pushed): codemod tooling, rename wave, `.git-blame-ignore-revs`, naming-lint
wiring — single-purpose per the SN0 §6 protocol. Full check green at the true
baseline after every commit; zero behavior change (renames at 100% git
similarity; the JobProcessEvents localStorage cache key byte-unchanged).

## Wave facts

- Rename set (census-confirmed, all case-only): `src/knowledgePayload.ts →
  KnowledgePayload.ts`, `src/runtimeDiagnosticsPanelModel.ts →
  RuntimeDiagnosticsPanelModel.ts`, `src/utils/{evidenceStatus,
  jobProcessEvents, sourceLabels}.ts → PascalCase` — all five are model/
  presenter modules in class positions. Generic helpers (`code.ts`,
  `error.ts`, `efficiency.ts`, `notification.tsx`) and `index.ts` barrels
  correctly stay camelCase; hooks already conform; the only non-conforming
  filename left is `src/generated/api-types.ts`, exempted as the repo's
  generated-artifact family (drift-gate-guarded codegen output).
- Mechanical rewrites: 12 src import specifiers + 8 contract-test path
  strings, all produced by the codemod plan; 0 hand-fixed specifiers.

## Tooling built (reusable)

`scripts/codemod-rename.mjs` — map-driven `git mv` + import-specifier rewrite
(resolves relative specifiers, rewrites only ones that resolve to a renamed
file) + repo-relative path-string rewrite (only strings containing `/`),
dry-run by default, `--apply` to execute. Repo-neutral: no Dashboard names
hardcoded; SN2/SN3 can copy it into their `scripts/` unchanged.

## Tooling defects / lessons (for SN2/SN3 packets)

1. **File-stem-derived config keys are invisible to the codemod by design.**
   The path-shaped-only rewrite rule protected the localStorage cache key and
   a test regex (correct), but it also means semantic rows — layer-contract
   AREA names derived from file stems, prose in lint headers/rationale — need
   a manual same-commit pass. Each wave packet should quote its repo's
   semantic rows explicitly, not just path rows.
2. **Mandatory post-apply stale-name grep.** A repo-wide grep for the old
   names (excluding known behavior strings) caught two missed prose lines in
   `layerRationale` after the first manual pass. Make the negative grep a
   required step before the rename commit.
3. **Case-only renames need case-sensitive existence checks.** On this
   case-insensitive filesystem `existsSync` reports the *target* of a
   case-only rename as already existing; the codemod validates via
   `readdirSync` name comparison instead. SN2/SN3 must not pre-check with
   plain `existsSync`. `git mv` itself handles case-only renames in one step,
   and `forceConsistentCasingInFileNames` makes tsc the enforcement backstop.
4. **Report regeneration is part of the gate-config protocol.** The committed
   AD3 as-is report is stem-sensitive; regenerate it (`--report`) in the same
   rename commit or the contract and report diverge.

## Gate-config update pattern (Dashboard rows from SN0 §4)

| Row | Handling |
| --- | --- |
| layer-contract.json area names + rationale | manual semantic pass, same commit |
| layer-contract report | regenerated via `--report`, same commit |
| dashboard-contract.test.mjs path strings | automatic (codemod path-string rewrite) |
| check-generated-api-types.mjs 3 path constants | checked — unaffected (generated paths not renamed) |
| W2 stray-transport exact-set pin | out of scope per packet — untouched, verified |
| doctrine-lint.json blessed rows | checked — unaffected (MermaidBlock already PascalCase) |

## Time-per-file

End-to-end wave (census → tooling build → dry-run → apply → gate-config rows
→ 3 full-check runs → 4 commits → push): ≈ 25 minutes wall, of which tooling
build ≈ 10 and full-check runs ≈ 6. Marginal cost per renamed file is seconds
(plan + apply are instantaneous); fixed costs dominate. Implication: batch the
SN2 (17 files) and SN3 (8 files) waves as single commits each — wall time will
be close to the pilot's, not linear in file count.

## Recommendations for SN2/SN3

- Copy `codemod-rename.mjs` as-is; feed it a reviewed rename map; paste the
  dry-run plan into wave evidence before `--apply`.
- Quote the repo's §4 rows (path rows AND semantic/stem rows) in the packet;
  end with the stale-name negative grep + full check before committing.
- Keep the commit quartet: tooling (first wave only) / renames+rows /
  blame-ignore-revs / naming-lint wiring.
- Naming lint shape used here (per-artifact-type patterns, barrel allowance,
  exempt scopes, owner/reason exceptions) ports directly; Agent adds the
  `.profile.ts` exempt family, Core adds migrations.
