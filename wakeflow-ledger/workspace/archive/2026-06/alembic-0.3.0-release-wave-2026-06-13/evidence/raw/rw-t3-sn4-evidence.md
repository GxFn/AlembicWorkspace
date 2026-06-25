# RW3 / SN4 evidence — alembic-0.3.0-release-wave rw-t3 (2026-06-13)

## Commits (origin/main fd940f2..a59bbcf), single-purpose per SN0 §6
- e1a4d58 rename wave (32 renames + specifier/path rewrites + gate-config rows + doc comments)
- dfc822d naming-lint src-scope flip active (+13 exceptions)
- a59bbcf .git-blame-ignore-revs append (e1a4d58)

## Rename count + purity
 108 files changed, 170 insertions(+), 170 deletions(-)
git rename-detected (M90): 31/32 (the rest are rename+in-file specifier/comment rewrites)

## Naming lint (src ACTIVE)
naming lint passed (437 files checked; 14 exception(s); parked scopes NOT scanned: none — see config parkedScopes for the C3/SD-5-p2 un-park condition).

## Final stale-name grep — only intentional keeps (behavior strings / log labels / RW2-residue facadeReadiness deep-path doc keys)
KEEP: src/core/ast/ensureGrammars.ts:77:      logger?.warn?.(`[ensure-grammars] Missing .wasm file: ${wasmFile} for language "${lang}"`);
KEEP: src/core/ast/ensureGrammars.ts:83:      `[ensure-grammars] ${result.failed.length} grammar(s) missing. ` +
KEEP: src/core/ast/ensureGrammars.ts:87:    logger?.info?.('[ensure-grammars] All required grammar .wasm files available');
KEEP: src/workflows/capabilities/project-intelligence/IDEAgentAnalysisPacketBuilder.ts:204:    source: 'project-intelligence-result' | 'project-snapshot';
KEEP: src/workflows/capabilities/project-intelligence/IDEAgentAnalysisPacketBuilder.ts:221:  source: 'project-intelligence-result' | 'project-snapshot';
KEEP: src/workflows/capabilities/project-intelligence/IDEAgentAnalysisPacketBuilder.ts:331:      source: options.source ?? 'project-snapshot',
KEEP: src/workflows/capabilities/project-intelligence/IDEAgentAnalysisPacketBuilder.ts:410:    return { source: 'project-snapshot', snapshot: result };
KEEP: test/IDEAgentAnalysisPacketBuilder.test.ts:143:      source: 'project-snapshot',

## Full Core check
Public API boundary OK (prescriptive): 59 package exports classified.
Imported 52 exact public API entrypoints.
Doctrine lint OK: 379 src files clean (null-slot idiom honored; 10 blessed exemptions consumed from config/blessed-singletons.json).
      Tests  1193 passed (1193)
check exit 0

## Downstream builds vs renamed Core HEAD (specifiers stable -> consumers unaffected)
AlembicAgent tsc --noEmit: exit 0 | Alembic build:check: exit 0 | AlembicPlugin build:check: exit 0
NOTE: AlembicPlugin worktree carries the Plugin window concurrent rw-t2 changes (lib/runtime/mcp/source-graph/status.ts +81 etc.) — NOT mine; I ran only read-only build:check (hands-off honored).

## Export-surface invariance
package.json exports unchanged this wave: 0 changed lines (expect 0)
version: 0.2.0 (no bump; publish held)
