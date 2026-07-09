# P4 Real Existing-KB Check

Task: `p4-final-dual-host-proactive-activation-realtest-t1`

This note replaces the earlier sandbox-submission runner as the primary evidence shape. The earlier runner is kept as a test-script precheck artifact only; it is not used as a product failure conclusion because it attempted to create a new sandbox knowledge base before fully following the cold-start submission contract.

## Scope

- Checked real existing projects only, without knowledge submission, rescan, refresh, deletion, plugin reload, or product-code edits.
- Project roots read:
  - `/Users/gaoxuefeng/Documents/AlembicWorkspace`
  - `/Users/gaoxuefeng/Documents/AlembicWorkspace/BiliDili`
- Existing Alembic data roots observed through status/managed markers:
  - `/Users/gaoxuefeng/.asd/workspaces/ecf32806`
  - `/Users/gaoxuefeng/.asd/workspaces/02a25032`

## Existing KB Status

- `BiliDili` has an existing usable KB:
  - `knowledge.usable=true`
  - `recipeCount=16`
  - `databaseEntryCount=16`
  - status reported selected/active mismatch: host project is BiliDili, selected/active project is AlembicWorkspace.
- `AlembicWorkspace` has an existing usable KB:
  - `knowledge.usable=true`
  - `recipeCount=96`
  - `databaseEntryCount=96`
  - status reported active runtime disconnected.

## Host Projection File Check

- Codex project skills exist for AlembicWorkspace under `.agents/skills/*/SKILL.md` with `.alembic-managed.json` markers.
- Codex project skills exist for BiliDili under `BiliDili/.agents/skills/*/SKILL.md` with `.alembic-managed.json` markers.
- Claude Code project skills were not found under:
  - `.claude/skills`
  - `BiliDili/.claude/skills`
- `BiliDili/CLAUDE.md` was not present.
- `AGENTS.md` / `CLAUDE.md` root files did not contain `alembic:managed-guidance` markers in the checked snippets.

## Existing KB Consumption Check

On BiliDili, with no new knowledge submission:

- `alembic_prime` returned BiliDili VideoFeed-related Recipe/Guard knowledge, including pagination, Feature ViewController, Rx ViewModel, lifecycle, BaseViewController, and module lifecycle entries.
- `alembic_search` returned 5 direct matches, using resident semantic/vector search, including Feature module isolation, Feature ViewController, AppCoordinator, SPM layering, and RouterModule routing.
- Both `alembic_prime` and `alembic_search` reported retrieval freshness risk: git diff checkpoint `1943f406e6a4...` is behind current BiliDili HEAD `fc66261158d5...`; next action is `alembic_rescan`.
- `alembic_graph(queryKind=file-flow, filePath=Sources/Features/VideoFeed/VideoFeedViewController.swift)` returned partial output and could not match a ProjectContext file node.
- `alembic_graph(queryKind=map)` returned target/module-level nodes including `target:videofeed`, but ProjectContext remained partial.
- `alembic_recipe_map(focus=file: Sources/Features/VideoFeed/VideoFeedViewController.swift)` located the file region, but returned `0` recipe mounts and warned that retrieval freshness requires git-diff checkpoint catch-up.

## Conclusion

Blocked / needs review for P4 final acceptance.

Positive evidence:

- Existing KBs are present and usable.
- BiliDili existing KB can be consumed by `prime` and `search`.
- Codex `.agents/skills` projections are present for AlembicWorkspace and BiliDili.

Blocking evidence:

- Claude Code projections are not present for the real checked BiliDili project (`BiliDili/CLAUDE.md` and `BiliDili/.claude/skills` absent).
- Active/selected project state is not aligned with BiliDili; BiliDili status reports host project mismatch.
- BiliDili retrieval freshness is stale against current HEAD for prime/search evidence, even though status-level freshness projection says current.
- ProjectContext/RecipeMap is partial for the VideoFeed file focus and does not mount Recipes onto that file region.

Invalid conclusion:

- Do not conclude that knowledge submission or cold-start generation is broken from the earlier sandbox runner. That runner used an incomplete submission/completion contract and is not product acceptance evidence.
