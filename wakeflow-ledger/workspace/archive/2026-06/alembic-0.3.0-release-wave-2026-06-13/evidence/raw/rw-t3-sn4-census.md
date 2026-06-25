# RW3 / SN4 Core src-naming census + rename map (2026-06-13)

Base: Core fd940f2 (RW2 landed; exports 126->59). Convention: SN0 §1
export-shape (classes/contracts/models->PascalCase; functions/utils->camelCase;
migrations NNN_snake EXEMPT). Codemod: scripts/codemod-rename.mjs (fa464c7
lineage, a43519e printing restoration). Saved BEFORE --apply.

## Census: 44 kebab-case src .ts (0 snake outside the 9 exempt migrations)

## Decision: 31 RENAME (all internal — zero export-target/key change) + 13 EXEMPT

RENAME — camelCase (functions/utils, 13):
- shared/: content-hash, developer-identity, diff-parser, folder-names,
  markdown-utils, package-root, recipe-tokens, source-contracts, test-mode,
  token-utils  (util/helper modules)
- core/ast/: ensure-grammars, parser-init  (functions)
- types/project-snapshot-builder  (exports buildProjectSnapshot function)

RENAME — PascalCase (class/contract/model, 18):
- core/enhancement/ x14 -> exact internal class name (AndroidEnhancement,
  DjangoEnhancement, FastAPIEnhancement, GoGrpcEnhancement, GoWebEnhancement,
  LangChainEnhancement, MLEnhancement, NextjsEnhancement, NodeServerEnhancement,
  ReactEnhancement, RustTokioEnhancement, RustWebEnhancement, SpringEnhancement,
  VueEnhancement); each defines `class X extends EnhancementPack`, exports
  `const pack`; loaded via literal import('./X-enhancement.js') in
  enhancement/index.ts (codemod rewrites all 14 dynamic imports — verified in
  dry-run).
- types/: knowledge-wire->KnowledgeWire, project-snapshot->ProjectSnapshot,
  snapshot-views->SnapshotViews, reactive-evolution->ReactiveEvolution
  (type/interface/wire models)

EXEMPT — lint exception {file,owner,reason} (13):
- core/ast/lang-{dart,go,java,javascript,kotlin,objc,python,rust,swift,
  typescript}.ts (10): DELIBERATE grammar-plugin family. The kebab "lang-<id>"
  name mirrors the grammar registry langId in core/ast/index.ts, which loads
  each via `await import(entry.module)` where entry.module = './lang-<id>.js'
  is a registry-string (NOT a literal import the codemod can rewrite). Renaming
  would desync the langId<->file correspondence and require hand-editing the
  registry strings for zero behavior/convention benefit. Exempt like the
  migrations family.
- project-intelligence.ts, source-graph.ts, host-agent-workflows.ts (3):
  package-facade ENTRY BARRELS that mirror the public kebab export subpaths
  (./project-intelligence, ./source-graph, ./host-agent-workflows) and are the
  export targets. Barrel re-exports (source-graph.ts has empty primary export),
  not class-position stragglers; renaming would churn the public dist targets
  and ripple into consumer/test references via the export path. Exempt like
  index.ts barrels; KEYS and targets stay byte-stable.

## Dry-run plan: 31 git mv + 108 specifier rewrites + 19 path-string rewrites
(rw-t3-sn4-dryrun-plan.txt). Codemod auto-handles gate-config path-strings:
blessed-singletons (parser-init, developer-identity), wire-type-manifest
(knowledge-wire), CoreContractSpine sourceFiles (source-contracts), test
path-strings. Bare-basename descriptive mentions (e.g. "parser-init.ts" in a
blessed module note) need a manual pass — caught by the post-apply stale grep.
