# Alembic Prime Output Quality Optimization Requirement Design

Date: 2026-06-16

Design Key: `alembic-prime-output-quality-optimization-2026-06-16`

Design state: confirmed requirement design; ready for controller intake; not
dispatched

Current window: Design

Scope: optimize `alembic_prime` as an independent code-development-only Recipe
priming tool. It should own its direct input normalization and
code-development gate instead of depending on `alembic_intent`. This is an
independent demand and does not change the current `alembic_graph`,
`ProjectContext`, or `alembic_search` demands.

Latest confirmed constraint: do not modify Recipe source files or require a
Recipe model migration first. Prime quality should be improved by deriving,
creating, embedding, saving, and querying semantic-region vector chunks from
existing Recipe content. Recipe content cleanup or authoring improvements may
be discovered by audit, but they are not part of the first implementation
route.

Latest confirmed routing change: remove the mandatory relationship between
`alembic_intent` and `alembic_prime`. `alembic_intent` is temporarily closed
and should not be used in the prime mainline. `alembic_prime` must be designed
as a standalone capability that accepts a direct high-quality requirement /
feature input frame, applies its own eligibility gate, and retrieves Recipe
guidance without requiring `intentRef` or `recognizedIntent`.

Final user confirmations:

- Disconnect and delete the old `alembic_intent` relationship directly; do not
  preserve an ignored compatibility path for `intentRef`, `recognizedIntent`,
  `HostIntentFrame`, or intent persistence records.
- The minimum valid prime input is `taskAction + requirementGoal` plus at least
  one locator facet: capability, scenario, domain objects, integration
  boundary, or quality concerns.
- Semantic region chunks are saved as derived vector items in the existing Core
  `VectorStore`; Recipe source files and Recipe schema are not changed.
- When Alembic main / resident semantic capability is unavailable, Plugin does
  not fabricate strong semantic behavior and reports an honest degraded route.
- Region vector construction is rebuild/refresh oriented and must not generate
  or save chunks during ordinary prime query handling.
- Fresh prime quality testing requires a real generated semantic-region vector
  fixture in the target Alembic data root: all active Recipes must have newly
  generated `recipe_region_*` derived vector items before APQ6 fresh MCP
  validation. A runtime index that contains only legacy `entry_*` whole-entry
  vectors is not a valid test environment for APQ6.
- Do not run full active-Recipe vector generation directly against the target
  data root as the first operation. Run a bounded generation test first,
  validate the generated chunks, metadata, embedding, filtering, and retrieval
  behavior, then run full generation only after the test matches expectations.
  If the generation test fails or produces weak/noisy chunks, stop and rework
  the generation logic before any full operation.
- Trusted-to-use requires both a direct prime requirement frame and
  Recipe locator / region evidence. Whole-entry vectors, active files, source
  refs, or code snippets cannot independently admit trusted material.
- The APQ0-APQ6 phase order in this document is confirmed.

## Entry Conclusion

The user's first hypothesis is correct but needs a stricter entry rule:
`alembic_prime` should not be a general semantic-context tool. It should run
only when the Agent has classified the current turn as a code development task.

The Recipe target is narrow and practical: help an Agent write code using the
project's correct design patterns and architecture norms. Therefore the
invalid-output problem cannot be solved only by adjusting retrieval scores.
Current code selects material from Recipe / knowledge entries, then exposes only
a compact agent package. If the Recipe itself lacks Agent-locating fields for
code-writing situations, the agent receives plausible but unusable titles,
triggers, or generic trust receipts.

This demand should optimize the standalone prime chain:

1. Direct `alembic_prime` input normalization from the host-provided
   requirement / feature frame.
2. A code-development task gate owned by `alembic_prime` before retrieval.
3. Prime retrieval that does not require `alembic_intent`, `intentRef`, or
   `recognizedIntent`.
4. Recipe / knowledge entry fields that help an agent decide whether a design
   pattern or architecture norm applies while writing code.
5. Prime retrieval, accepted-material gating, and compact output projection.
6. Runtime proof that the host agent receives useful, task-specific code
   development context.

## Current Prime Coupling And Target Separation

This section records the current implementation surface and the target
correction. It is not the target contract.

Current implementation has a strong coupling between `alembic_intent` and
`alembic_prime`: shared public input fields, `intentRef`,
`recognizedIntent`, `HostIntentFrame`, intent evidence, and resident handoff
metadata can all influence the prime route. That coupling made sense as an
agent-context experiment, but it now obscures prime's real job: directly
returning design-pattern and architecture Recipe guidance for code development
tasks.

Target correction:

- `alembic_intent` is temporarily closed and must not be a required producer for
  `alembic_prime`.
- `alembic_prime` is the public capability the host agent calls directly before
  coding.
- `intentRef`, `recognizedIntent`, intent records, intent evidence, and
  `HostIntentFrame` are not target inputs and must not be required for prime
  retrieval.
- Existing intent-related parameters should be removed from the target public
  contract and rejected as obsolete input. They must not remain as a supported
  compatibility path.
- Prime owns its own direct input normalization, code-development gate,
  requirement facet extraction, retrieval, trust gating, and output projection.

### Target Standalone Prime Input

The standalone `alembic_prime` input should be a direct requirement / feature
frame supplied by the host agent. It should not require a prior tool call.

Required effective input:

- task action: implementation, fix, refactor, test writing, test repair,
  explicit code edit, or code review that requires concrete code changes;
- requirement goal: what feature, capability, behavior, or user-visible outcome
  the Agent plans to implement;
- scenario: when or where the capability is used;
- capability area: for example auth, search, gateway, cache, lifecycle,
  storage, API, MCP, daemon, testing, or UI interaction;
- domain objects: meaningful project concepts involved, such as user, session,
  Recipe, project, job, service, route, request, or index;
- integration boundary: API, CLI, MCP tool, daemon, resident service, storage,
  workspace, plugin, Core, or host agent;
- lifecycle / data-flow hint when relevant: initialize, request, persist,
  publish, refresh, retry, close, synchronize, validate, or observe;
- quality concerns: safety, boundary, concurrency, performance, persistence,
  error handling, observability, testing, or compatibility;
- project root from the host runtime, used only to resolve project identity and
  the resident route.

Minimum valid input:

- `taskAction` and `requirementGoal` are required;
- at least one locator facet is required: capability, scenario, domain objects,
  integration boundary, or quality concerns;
- if the minimum is not met, prime should return skipped or degraded output
  rather than retrieving generic Recipe material.

Useful optional input:

- curated `keywords` / `labels`;
- `sourceEvidenceRefs` only as verification anchors;
- active file, module, symbol, or source refs only as secondary context or
  validation anchors; they must not become the primary Recipe locator.

Inputs that should not drive Recipe matching:

- `intentRef`;
- `recognizedIntent`;
- `alembic_intent` persistence records;
- raw automation envelopes;
- status / progress / dispatch text;
- host thread, conversation, message, or session ids;
- generic confidence numbers without locator evidence;
- broad host turn metadata;
- general knowledge-search query text that does not imply code development;
- session history unless the host converts it into a concrete direct prime
  requirement frame.

### Target Prime Retrieval Input

Prime should send its retrieval pipeline the fields it derives directly from
the standalone prime input:

- requirement / feature query variants;
- task action;
- scenario;
- capability area;
- domain objects;
- integration boundary;
- lifecycle / data-flow hint;
- quality concerns;
- language;
- project root;
- secondary verification refs.

The resident handoff may include the normalized prime requirement frame and
compact diagnostics, but it must not depend on `alembic_intent` records.

### Inputs That Reach Prime Output

The public prime output should expose:

- accepted Recipe compact items: id, title, trigger, kind, score, matched
  region classes, and evidence ref count;
- prime material: accepted Recipes, trust posture, next actions only when
  useful, resident prime injection package, and retrieval consumer metadata;
- detail refs and source refs;
- project-context guidance only as a hint;
- skipped / degraded / empty / delivered trust posture.

Design implication: even when the agent sends useful standalone prime input,
the final prime package can still be invalid if the Recipe content does not
contain clear applicability, design purpose, architecture convention,
negative boundary, source anchor, or verification meaning.

Additional design implication: the standalone prime input must first prove that
the turn is a code development task. If the turn is design/planning,
status-only, project navigation, ordinary knowledge lookup, or generic
read-only analysis, `prime` should skip or return not-applicable guidance
instead of retrieving Recipes.

## Confirmed Design Corrections

The user confirmed that `alembic_prime` serves only code development tasks. Its
output target is the design patterns and architecture norms relevant to the
current coding task, not general project knowledge.

### Target Prime Input Contract

The future `prime` contract should be high-quality-input only. Parameters that
do not materially improve task classification, Recipe location, or evidence
trust should be removed from the public target contract or rejected as
unsupported input.

Required effective input is a direct requirement / feature frame, not code:

- code development action: implementation, fix, refactor, test writing, test
  repair, explicit code edit, or review that requires code changes;
- requirement goal: what feature, capability, behavior, or user-visible outcome
  the Agent plans to implement;
- scenario: when or where the capability is used;
- capability area: for example auth, search, gateway, cache, lifecycle,
  storage, API, MCP, daemon, testing, or UI interaction;
- domain objects: the meaningful project concepts involved, such as user,
  session, Recipe, project, job, service, route, request, or index;
- integration boundary: the surfaces the feature touches, such as API, CLI,
  MCP tool, daemon, resident service, storage, workspace, plugin, or host
  agent;
- lifecycle / data-flow hint when relevant: initialize, request, persist,
  publish, refresh, retry, close, synchronize, validate, or observe;
- quality concerns: safety, boundary, concurrency, performance, persistence,
  error handling, observability, testing, or compatibility;
- project root from the host runtime, used only to resolve project identity and
  the resident route.

Useful optional input:

- `keywords` / `labels` only when they are curated task hints;
- `sourceEvidenceRefs` only as verification anchors;
- active file, module, symbol, or source refs only as secondary context or
  validation anchors; they must not become the primary Recipe locator.

Inputs that should not drive Recipe matching:

- `intentRef`;
- `recognizedIntent`;
- `alembic_intent` records or persistence receipts;
- raw automation envelopes;
- status / progress / dispatch text;
- host thread, conversation, message, or session ids;
- generic `confidence` numbers without locator evidence;
- broad `hostTurnMeta`;
- general knowledge-search query text that does not imply code development;
- session history unless it is converted into a concrete requirement / feature
  direct prime requirement frame.

Implementation should remove these fields from the public target contract and
delete old coupling code directly. If an old caller still sends them during
transition, the handler should reject the obsolete input with a clear
diagnostic; it must not treat that as a supported compatibility mode. The
design target remains narrow input, not broad best-effort interpretation.

### Recipe Semantic Region Slicing

Recipe content should be split into semantic regions for `prime` retrieval.
Recipe is not a source-code matcher. It should contain design patterns and
architecture conventions, then expose the parts that connect a feature /
requirement frame to the relevant pattern.

The target matching unit is `Recipe title + design/architecture region`, not a
code fragment and not only the whole Recipe document.

Required region classes:

- identity: title, trigger, dimension, language, knowledge type;
- applicability: what requirement scenario or capability this Recipe applies
  to;
- pattern purpose: what design problem the Recipe solves, such as registry,
  middleware chain, dependency injection, gateway envelope, lifecycle hook,
  cache coordinator, or publication route;
- architecture convention: the structural rule or boundary the project expects,
  such as ownership, layer direction, route ordering, state ownership, or
  service responsibility;
- integration boundary: which surfaces or systems are involved, such as API,
  MCP, CLI, daemon, storage, host agent, plugin, or Core;
- quality concern: the quality property protected by the Recipe, such as
  concurrency, safety, resilience, performance, observability, testing, or
  compatibility;
- negative boundary: when not to apply the Recipe, from `dontClause`,
  boundaries, constraints, and false-positive guards;
- evidence: source refs, reasoning sources, source file anchors, and validation
  anchors used for trust and follow-up verification.

`coreCode`, snippets, and examples can stay as illustrative support inside a
Recipe, but they are not a primary semantic region for `prime` matching. If a
Recipe is only useful because a code snippet matches, it is not a good prime
Recipe; it belongs in project context or source reading, not in design-pattern
priming.

Each region vector should carry the parent Recipe id, title, trigger, region
class, dimension, language, and trust/evidence refs. `prime` can then ask
different semantic questions: "what architecture pattern applies to this
capability", "what convention governs this integration boundary", "what quality
concern is relevant", and "what must the Agent avoid".

### Current Recipe Support And Derived-Index Principle

Current AlembicWorkspace Recipe data is good enough to start a derived
semantic-region index, but not good enough to treat existing category-like
fields as authoritative routing.

Observed support:

- active Recipes already carry `title`, `trigger`, `description`, `tags`,
  `dimensionId`, `whenClause`, `doClause`, `dontClause`, `content`,
  `constraints`, `reasoning`, and `quality`;
- `reasoning.sources` and the `recipe_source_refs` bridge provide source
  evidence even when frontmatter `sourceRefs` are absent;
- existing Core vector storage already persists items as `id`, `content`,
  `vector`, and `metadata`, which can store derived Recipe semantic-region
  chunks without changing Recipe markdown;
- Alembic main already has the resident vector route and embedding provider
  position needed for the stronger prime path;
- AlembicPlugin embedded runtime can keep a degraded non-resident path and
  should not pretend region vectors were used when they were not available.

Observed limits:

- `category` and `topicHint` are currently too generic to be trusted as strong
  feature or architecture routing signals;
- `usageGuide` exists in type-level contracts but is not currently reliable as
  persisted Recipe data;
- whole Recipe vectors and generic `entry_*` vectors do not prove that a Recipe
  applies to the user's feature requirement;
- code snippets and active files are insufficient primary locators for prime,
  because prime is about design patterns and architecture conventions for a
  planned coding task.

Therefore this demand should create a derived semantic-region vector index from
the existing Recipe rows. The derived index is allowed to be persisted under
Alembic's vector storage, but it must be treated as generated search material,
not as Recipe source truth.

### Semantic Matching Role

Keyword and field matching remain necessary for exact anchors such as trigger,
dimension, known pattern name, integration surface, capability name, and
project-specific terms. They are not enough for `prime`, because development
tasks are usually described as feature requirements rather than Recipe names.

The stronger `prime` path should use Alembic main / resident semantic and vector
capabilities when the main service is available. This differentiates tool
levels:

- `alembic_search`: direct knowledge lookup, precise summaries and refs;
- `alembic_graph`: ProjectContext-backed project information and relations;
- `alembic_prime`: requirement-to-Recipe priming for code development tasks,
  with classified design / architecture semantic regions and stronger resident
  semantic matching.

When Alembic main is unavailable, `prime` should degrade honestly to the
available Plugin/Core field and keyword path. It must not pretend that strong
semantic region matching ran.

### Lean Prime Injection

Prime injection should not over-explain every match. The Agent can analyze the
Recipe content. The output should stay compact and provide:

- selected Recipe id, title, trigger, kind, and score;
- matched region classes and minimal evidence that the result was selected by
  the right route;
- enough design / architecture Recipe slices for the Agent to understand the
  pattern, convention, applicability, and negative boundary;
- source refs or detail refs for follow-up reading;
- trust/degraded status only where it changes how the Agent should use the
  content.

Avoid verbose "why selected" prose in the primary injected content. Detailed
diagnostics can remain in structured metadata or evidence refs for tests,
debugging, and controller review.

## Problem

`alembic_prime` can return content that is technically structured but not useful
to the agent:

- it may run for non-code-development turns where Recipe guidance should not be
  injected at all;
- it may deliver unrelated or generic knowledge for a concrete task;
- it currently permits a generic knowledge-query route to run prime even when
  the turn is not a code development task;
- it may degrade without telling the agent what is missing from Recipe content;
- the visible receipt can become process wording rather than actionable
project guidance;
- accepted material can lack clear applicability to the feature or requirement
  the Agent plans to implement;
- Recipe title/trigger/summary may not align with how agents describe tasks;
- Recipe applicability, pattern purpose, architecture convention, quality
  concern, negative boundary, rationale, and source evidence are not yet modeled
  as independent semantic regions for matching;
- current field scoring emphasizes `trigger`, `title`, `tags`, `description`,
  `content`, and facets, but does not independently weight the feature
  applicability, pattern-purpose, architecture-convention, quality-concern, and
  negative-boundary regions that matter most to prime;
- `sourceRefs` and evidence refs may exist but not explain the applicability of
  the Recipe;
- low-information or envelope turns can produce either empty/degraded output or
  weak context without a clear repair path.

This is not just a runtime bug. It is a classification and content-contract
mismatch between standalone prime requirement input and Recipe fields.

## Goal

Make `alembic_prime` return a compact context package only for code development
turns, and make that package immediately useful and safe while the Agent writes
code:

- non-code-development turns are skipped before retrieval;
- broad or low-quality prime input is removed from the target public contract
  or rejected as unsupported input;
- selected Recipes are relevant to the current code development task;
- every accepted item carries the Recipe content slices needed for the Agent to
  analyze which design pattern or architecture convention applies to the
  feature / requirement, what boundary to respect, what to avoid, and what to
  verify;
- degraded output says whether the issue is missing direct prime input, missing
  anchors, retrieval failure, or weak Recipe locator metadata;
- Recipe content is indexed by semantic regions for applicability, pattern
  purpose, architecture convention, integration boundary, quality concern,
  negative boundary, and evidence;
- semantic-region vector chunks are generated and persisted as derived index
  artifacts without editing Recipe source files;
- Alembic main / resident semantic-vector capability is used as the stronger
  `prime` route when available, with honest degradation when absent;
- final host-visible behavior is proven through real standalone
  `alembic_prime` probes.

## Non-goals

- Do not redesign ProjectContext.
- Do not turn `alembic_prime` into project map, source graph, file flow, symbol,
  or impact-radius query.
- Do not make `prime` replace `alembic_search`; search remains direct knowledge
  lookup. Prime should not be used for ordinary knowledge lookup.
- Do not keep broad, low-quality public prime parameters merely because current
  schema accepts them.
- Do not make `prime` run for general knowledge queries.
- Do not locate Recipes primarily by active file, symbol, code snippet, or file
  flow. Those belong to ProjectContext, graph, search, or raw source reading.
- Do not enable prime for general Design planning, status reports, project
  navigation, source graph questions, documentation reading, or other non-code
  development turns.
- Do not rely on whole-document vector similarity as the final prime match
  explanation when semantic region evidence is missing.
- Do not modify Recipe source files, frontmatter, or authoring schema in the
  first implementation route; region chunks are generated index artifacts.
- Do not make the primary prime injection verbose. The Agent should analyze the
  selected Recipe content; prime should deliver compact, relevant slices and
  refs.
- Do not add Recipe mutation or admin publishing behavior to the agent tier.
- Do not make prime create/finish work, run Guard, or record decisions.
- Do not introduce a new public MCP tool.
- Do not solve invalid output by broadening recall alone.

## Primary Actors

- Host agent: calls `alembic_prime` directly when the current task requires
  code development guidance before writing or editing code.
- AlembicPlugin: owns public MCP schema, standalone prime input normalization,
  prime handler, trust receipt, resident projection, and clean output.
- Alembic main: owns resident search and prime injection package metadata when
  daemon route is available.
- AlembicCore: owns knowledge entry structure, search/ranking/vector behavior,
  Recipe parsing/writing, and base field semantics.
- Controller: decides implementation phases and acceptance after raw evidence
  review.

## User Stories

- As a host agent, when I am about to implement, fix, refactor, or write tests,
  prime returns the exact design-pattern and architecture Recipes that apply to
  the code I am about to write.
- As a host agent, when I am doing design discussion, status reporting, project
  navigation, or ordinary read-only analysis, prime does not inject Recipe
  context.
- As a host agent, I can tell from each accepted item why it applies, when to
  obey it, and what evidence I must verify later.
- As a host agent, if prime cannot find useful material, I get a specific
  degraded reason and a repair action, not a generic "no usable knowledge"
  message.
- As a Recipe maintainer, I can see which existing fields support standalone
  prime matching and which authoring gaps should become later Recipe quality
  work.
- As a maintainer, I can test prime quality through an SQ matrix that separates
  code-development turns from non-code-development turns.

## Proposed Behavior

### 1. Code Development Task Gate

`alembic_prime` should begin with task classification, not retrieval.

Prime is eligible only when the normalized standalone prime input indicates one
of these code development actions:

- implementation task;
- fix task;
- refactor task;
- test-writing or test-repair task;
- explicit code-editing task;
- code review only when the requested outcome includes concrete code changes or
  architecture-rule application to code.

Prime should skip or return not-applicable guidance for:

- design/planning discussion without code-change purpose;
- status-only turns;
- project navigation / project map / source graph questions;
- general knowledge lookup;
- ordinary Recipe search, rule discovery, or "what rules exist" exploration;
- documentation reading or summarization;
- mechanical automation envelopes without a curated code-development prime
  requirement frame;
- read-only analysis unless the host explicitly says the next action is code
  development.

The gate should use standalone prime input signals first:

- `taskAction`;
- requirement goal;
- scenario;
- feature / behavior;
- capability, domain objects, integration boundary, lifecycle hint, and quality
  concerns when present;
- curated labels / keywords;
- active file / source refs only as secondary evidence, not as primary Recipe
  locators;
- lifecycle classification.

If the gate does not pass, `prime` should not run Recipe retrieval. The output
should explain that Recipe priming is reserved for code development and should
point to the right tool class: project information, search, or normal code
reading.

Implementation must remove the current generic `knowledge-ready-user-query`
positive path from prime eligibility. A knowledge query may use
`alembic_search`; it may not trigger `alembic_prime` unless the host calls
prime with a concrete code development requirement frame.

### 2. Recipe Agent Locator Content

Each Recipe intended for prime selection should describe when it helps an Agent
write code with the correct project pattern or architecture norm. The existing
fields are broadly enough shaped for this, but they must be indexed and audited
as locator regions rather than treated as whole-document text:

- `trigger`: short task-oriented key phrase or command-like anchor.
- `title`: human-readable behavior or rule name.
- `description`: one-sentence applicability summary.
- `tags`: search synonyms, subsystem names, tool names, and cross-language
  aliases.
- `topicHint`: weak routing hint until it is made semantically specific.
- `whenClause`: the feature / requirement scenario where this design pattern
  or architecture convention applies.
- `doClause`: the architecture or design action the Agent should follow while
  implementing the requirement.
- `dontClause`: negative boundary / false-positive guard.
- `usageGuide` / content steps: how to apply the convention at design level,
  not a source-code search target.
- `sourceRefs` / reasoning sources: verification anchors and trust evidence,
  not primary semantic locators.
- `category`, `kind`, `knowledgeType`, `language`, `scope`, `dimensionId`:
  filters and routing, not prose decoration.

Observed current AlembicWorkspace data has strong coverage for `trigger`,
`description`, `tags`, `whenClause`, `doClause`, and `dontClause`, but weak
frontmatter coverage for `usageGuide` and explicit `sourceRefs`, and weak
semantic value in broad `category` / `topicHint` values such as `Utility`.
Therefore the target design should:

- use `dimensionId`, `trigger`, `tags`, `whenClause`, `doClause`,
  `dontClause`, pattern purpose, architecture convention, integration boundary,
  quality concern, and requirement-facing text as primary locator evidence;
- treat `category` and `topicHint` as weak routing hints until their semantics
  are corrected;
- derive source refs from `reasoning.sources` and the active
  `recipe_source_refs` bridge where frontmatter `sourceRefs` are absent;
- avoid adding new schema fields until region slicing proves existing fields are
  insufficient.

### 2A. Requirement-To-Recipe Semantic Vector Index

Prime should build semantic vectors from Recipe design / architecture regions,
not from source-code snippets and not only from complete Recipe documents. A
vector item should represent `Recipe title + one semantic region`.

Region classes:

- identity region: title, trigger, dimension, language, kind, knowledge type;
- applicability region: description, tags, topic hint, when clause;
- pattern-purpose region: the design problem solved by the Recipe;
- architecture-convention region: ownership, boundary, layer, lifecycle,
  ordering, state, route, or responsibility convention;
- integration-boundary region: API, CLI, MCP, daemon, plugin, Core, storage,
  host agent, workspace, or resident service boundary;
- quality-concern region: safety, concurrency, performance, persistence,
  resilience, observability, testing, compatibility, or validation concern;
- negative-boundary region: don't clause, boundaries, constraints;
- rationale region: why-standard, reasoning, architecture explanation;
- evidence region: source refs, reasoning sources, source file anchors.

The resident semantic path should support class-aware matching so a feature
requirement can ask for applicable patterns, architecture conventions,
integration boundaries, quality concerns, and forbidden approaches separately.
Whole-Recipe vector matches may remain as a fallback or context signal, but
accepted prime material should prefer same-class requirement-to-Recipe region
evidence.

### 2B. Semantic Region Chunk Creation And Persistence

The implementation should add a dedicated Recipe semantic-region chunk builder
and save its output as derived vector items. This is a generation/indexing
capability, not a Recipe mutation capability.

Creation input:

- active Recipe / knowledge rows from the existing knowledge repository;
- existing scalar locator fields: `title`, `trigger`, `description`,
  `dimensionId`, `language`, `kind`, `knowledgeType`, `tags`, `whenClause`,
  `doClause`, and `dontClause`;
- structured fields: `content`, `constraints`, `reasoning`, `quality`, and
  `relations` only where they describe design / architecture meaning;
- evidence bridge data from `recipe_source_refs` and `reasoning.sources`;
- project identity / data root supplied by the Alembic runtime, not stored as a
  new Recipe fact.

Creation rules:

- create one candidate semantic chunk per non-empty region class;
- prepend the Recipe title and trigger to each region chunk so the vector item
  remains anchored to the parent standard;
- keep region text short and purpose-built: the content should describe
  applicability, pattern purpose, architecture convention, boundary, quality
  concern, negative rule, rationale, or evidence;
- skip empty or purely generic regions instead of embedding noise;
- include source/evidence refs in metadata and only include short evidence text
  in the vector content when it helps identify applicability;
- do not use `coreCode` as a primary region; snippets can appear only as
  illustrative support metadata or behind detail refs;
- produce deterministic chunk ids from Recipe id, region class, and region
  content hash so rebuilds update the same logical chunk and can remove stale
  chunks.

Saved vector item contract:

- `id`: namespaced generated id, for example
  `recipe_region_<recipeId>_<regionClass>_<regionHash>`;
- `content`: generated region text used for embedding;
- `vector`: embedding vector when the resident embed provider is available, or
  an empty vector only when the implementation deliberately records a degraded
  sparse/metadata-only fallback;
- `metadata.type`: `recipe-semantic-region`;
- `metadata.recipeId` / `entryId`: parent Recipe id;
- `metadata.regionClass`: one of the approved region classes;
- `metadata.regionHash`: hash of the generated region text and source fields;
- `metadata.sourceHash`: hash of the parent Recipe row fields used to generate
  this chunk;
- `metadata.title`, `trigger`, `dimensionId`, `language`, `kind`,
  `knowledgeType`, `lifecycle`, and compact `tags`;
- `metadata.evidenceRefs` / `sourceRefs`: compact refs derived from
  `recipe_source_refs` and `reasoning.sources`;
- `metadata.schemaVersion`: stable generated-index contract version, without
  putting a version label in the user-facing Recipe model.

Persistence route:

- reuse the existing Core `VectorStore` item contract and batch upsert path;
- build and save region chunks through explicit rebuild / refresh / knowledge
  sync flows, not during ordinary `alembic_prime` query handling;
- provide an explicit full active-Recipe generation route for validation
  environments. The route must load the target project's active Recipe rows,
  generate fresh semantic-region chunks for every active Recipe, embed and
  upsert those chunks into the target data root, and return machine-readable
  counts for active Recipes, distinct Recipe ids covered, generated chunks,
  embedded vectors, upserted vectors, skipped-empty regions, skipped-generic
  regions, stale removals, and degraded / failed reasons;
- gate the full route behind a bounded generation test. The first generation
  operation must run on a representative subset or an isolated copy of the data
  root, prove expected region classes, metadata, vector shapes, filterability,
  stale cleanup behavior, and sample resident retrieval, and record the result.
  Only a passing generation test may authorize the full active-Recipe run;
- if the bounded generation test does not match expectations, do not proceed to
  full generation. The correct next action is to rework the chunk builder,
  metadata contract, embedding route, cleanup route, or retrieval filter, then
  rerun the bounded generation test;
- treat full generation as a test and refresh precondition, not as an ordinary
  prime query side effect. It may run during rebuild / refresh / knowledge-sync
  flows, controller-requested validation setup, or an explicitly assigned
  product self-validation package;
- after full generation, the persisted vector index must contain
  `recipe_region_*` items with `metadata.type=recipe-semantic-region`.
  Coverage must be checked against the active Recipe count. An index containing
  only `entry_*` whole-entry vectors is a generation failure for APQ testing;
- filter prime region search by `metadata.type=recipe-semantic-region`;
- do not reuse existing generic `entry_*` whole-entry vectors as the trusted
  prime region index;
- keep generated ids outside the `entry_*` prefix so existing entry-vector
  reconciliation does not confuse region chunks with Recipe rows;
- add a region-index reconciliation step that removes generated
  `recipe_region_*` chunks when the parent Recipe is deleted, deprecated, or
  regenerates to a different region set;
- when Alembic main / resident embedding is unavailable, report
  `resident-semantic-region-index-unavailable` or equivalent degraded reason
  instead of silently falling back to whole-entry semantic matches.

Query route:

- convert the high-quality direct prime requirement frame into separate
  semantic queries
  for applicability, pattern purpose, architecture convention, integration
  boundary, quality concern, and negative boundary;
- query the vector store with a region-class filter where the vector store can
  filter metadata;
- merge region hits by parent Recipe id;
- preserve the matched region classes and top region snippets for the final
  compact prime package;
- require at least one task-relevant region match before a Recipe can be
  trusted-to-use. Whole-entry vector hits, file/source similarity, or code
  snippets may support verification, but they cannot by themselves admit a
  trusted prime Recipe.

### 3. Prime Applicability Explanation

Accepted prime material should expose enough structured signal for the agent:

- matched requirement terms;
- matched locator fields or semantic regions;
- matched requirement facets such as feature goal, capability, scenario,
  domain objects, integration boundary, lifecycle, or quality concern;
- code development action / task phase match only as a gate and routing signal;
- trust layer: obey, use, context-only, requires-verification, degraded;
- negative boundary from `dontClause` when available.

This should be available in structured output and diagnostics, but the primary
prime injection should be lean. It should not turn match reasoning into a long
explanation that competes with the Recipe content itself.

### 4. Prime Requirement-To-Recipe Alignment

Standalone prime input and Recipe locator fields should use the same
vocabulary:

- task action should determine whether this is a code development task, but
  should not be the only Recipe locator.
- requirement goal, summary, and behavior should align with Recipe
  applicability and pattern-purpose regions.
- capability, domain objects, lifecycle, data flow, and integration boundary
  should align with Recipe tags, dimension, architecture-convention region, and
  integration-boundary region.
- quality concerns should align with quality-concern and negative-boundary
  regions.
- `labels` and `keywords` should be treated as explicit matching hints for code
  development, but not as trusted project facts.
- Chinese/English synonyms should be placed in Recipe locator fields where
  needed, not only in runtime synonym expansion.

### 5. Prime Skipped And Degraded Output

Skipped prime output should be normal for non-code-development turns. It should
not be treated as a failure.

Skipped output should distinguish:

- non-code-development request;
- status-only turn;
- project-information query;
- general knowledge lookup;
- raw automation envelope without curated code-development prime requirement
  frame.

Degraded prime output should distinguish:

- missing direct prime requirement frame;
- raw automation envelope without curated prime requirement frame;
- missing source refs for automation envelope;
- low-information query without a concrete feature / requirement goal,
  capability, scenario, integration boundary, or quality concern;
- resident search unavailable;
- resident semantic region index unavailable;
- retrieval succeeded but Recipe locator metadata is weak;
- semantic region match exists only at whole-document level and cannot identify
  applicability, pattern purpose, architecture convention, integration
  boundary, quality concern, or negative-boundary evidence;
- candidate found but not trusted;
- accepted material exists but only as verification-required context.

The output should tell the agent which input or Recipe field would repair the
failure.

### 6. Output Compactness

Prime should remain compact. It should not dump full Recipe bodies, and it
should not over-explain why each item was selected. The compact package should
include enough Recipe content slices for the Agent to analyze the pattern:

- id;
- title;
- trigger;
- kind;
- score;
- matched region classes;
- compact Recipe slices, especially applicability, pattern purpose,
  architecture convention, integration boundary, quality concern, and negative
  boundary when present;
- action hint when available;
- verification refs;
- trust layer.

Full Recipe content can remain behind detail refs.

## Unified Landing Strategy

The complete target flow is:

1. The host calls `alembic_prime` directly with a high-quality requirement /
   feature frame.
2. `alembic_prime` normalizes that direct input and applies the
   code-development gate before any retrieval.
3. Eligible turns are normalized into locator facets: feature goal, scenario,
   capability area, domain objects, integration boundary, lifecycle / data
   flow, quality concerns, language, and optional verification anchors.
4. Exact anchors use existing field / keyword matching for title, trigger,
   dimension, tags, capability names, and integration surfaces.
5. Alembic main / resident route uses saved Recipe semantic-region vector
   chunks for class-aware requirement-to-Recipe matching.
6. Results are merged by parent Recipe id, gated by region evidence, and
   downgraded when only weak metadata, whole-document similarity, active-file
   similarity, or code snippet similarity exists.
7. `alembic_prime` returns a lean package with Recipe ids, titles, triggers,
   matched region classes, compact content slices, trust layer, and refs.
8. Detail refs remain available for full Recipe reading; search remains the
   ordinary Recipe lookup tool.

This route keeps the engineering simple: one generated region-index capability
under the existing vector infrastructure, one prime eligibility gate, one
region-aware retrieval/merge path, and one compact output projection. It does
not introduce a new MCP tool, a Recipe admin workflow, or a broad project
context abstraction.

## Implementation Decisions

### Candidate Package APQ0: Real Prime Input, Classification, And Output Baseline

Owner suggestion: AlembicPlugin, read-only first.

Purpose:

- record current `alembic_prime` call shapes for typical Codex turns;
- inventory current `alembic_intent` coupling points that must be disconnected
  and deleted;
- record which turns are currently prime-eligible and which should be skipped;
- prove which fields are agent-provided, MCP-server injected, handler-derived,
  and resident-derived;
- classify every current input field as target input, obsolete rejected input,
  or deletion target;
- identify which fields are truly needed for high-quality requirement /
  feature prime input;
- run real probes for code-development task, non-code design/planning query,
  status-only query, low-information query, automation envelope,
  direct requirement frame with secondary source refs, and Chinese mixed feature
  requirement;
- capture raw structured output and visible receipt quality.

Exit evidence:

- schema/handler line refs;
- raw MCP outputs;
- classification verdict for each probe;
- whether accepted material was usable, empty, or degraded;
- high-quality standalone prime input contract proposal and removal list for
  extra public parameters;
- intent-coupling deletion inventory;
- list of missing or weak Recipe locator fields observed in returned items.

### Candidate Package APQ1: Code Development Classification Gate

Owner suggestion: AlembicPlugin.

Purpose:

- implement / refine the prime eligibility gate;
- treat standalone task action, requirement goal, scenario, active file,
  sourceRefs, curated labels/keywords, and lifecycle classification as gate
  evidence;
- remove generic `knowledge-ready-user-query` from the prime positive path;
- make skipped prime output a clean, expected outcome for non-code-development
  turns;
- keep automation-envelope blocking unless a curated code-development prime
  requirement frame and source refs are present.

Exit evidence:

- gate matrix with positive and negative examples;
- clean skipped output examples;
- tests proving retrieval is not called when the gate fails.

### Candidate Package APQ2: Recipe Locator Field Audit And Region Readiness

Owner suggestion: AlembicCore with AlembicPlugin evidence refs.

Purpose:

- audit current active Recipes for locator completeness using existing fields;
- identify Recipes with generic title/trigger/description, missing
  `whenClause` / `doClause` / `dontClause`, missing tags, or weak source refs;
- measure region readiness for identity, applicability, pattern purpose,
  architecture convention, integration boundary, quality concern, negative
  boundary, rationale, and evidence regions;
- inspect whether `reasoning.sources` and `recipe_source_refs` provide usable
  source evidence when frontmatter `sourceRefs` are absent;
- record broad / low-value classification fields such as generic
  `category=Utility` or `topicHint=Utility`;
- define a Recipe locator checklist and readiness score;
- do not auto-rewrite Recipes without controller/user authorization.

Exit evidence:

- inventory by Recipe id;
- missing-field distribution;
- semantic-region readiness distribution;
- source-ref bridge coverage;
- list of fields that are good enough for prime matching and fields that should
  be weak hints only;
- examples of good and bad locator shape;
- proposed checklist for future Recipe creation and rescan output.

### Candidate Package APQ3: Semantic Region Chunk Builder And Persisted Index

Owner suggestion: AlembicCore with Alembic main integration.

Purpose:

- implement the derived Recipe semantic-region chunk builder;
- generate deterministic chunks from existing Recipe rows without editing Recipe
  markdown or requiring a Recipe schema migration;
- implement or expose the full active-Recipe generation path needed by test
  setup: load all active Recipes from the target project data root and write
  fresh generated `recipe_region_*` vector items for every active Recipe that
  has region content;
- add a bounded generation-test mode before full generation. The test mode must
  run on a representative sample or isolated data-root copy, prove expected
  chunk content / metadata / embedding / filtering / retrieval behavior, and
  leave reviewable counts and sample ids;
- create region chunks for identity, applicability, pattern purpose,
  architecture convention, integration boundary, quality concern, negative
  boundary, rationale, and evidence when those regions have real content;
- save generated chunks through the existing VectorStore contract with
  `metadata.type=recipe-semantic-region`;
- create deterministic `recipe_region_*` ids and stale-region cleanup for
  parent Recipe delete/deprecate/regenerate cases;
- expose stats for generated, embedded, skipped-empty, skipped-generic,
  upserted, removed, and degraded chunks;
- expose coverage stats that tests can assert: active Recipe count, distinct
  Recipe ids represented by generated region chunks, `recipe_region_*` item
  count, legacy `entry_*` item count, and whether any active Recipe lacks even
  an identity chunk;
- ensure generated region chunks do not collide with existing `entry_*`
  whole-entry vectors.

Validation:

- unit tests for region extraction from representative Recipe rows;
- vector item contract tests for id, content, metadata, hash, evidence refs,
  and source hash;
- rebuild tests proving deterministic ids and stale chunk removal;
- bounded generation-test evidence proving the sample / isolated run matches
  expected chunk quality and retrieval behavior before any full target data-root
  generation is allowed;
- full-generation proof against the real AlembicWorkspace target data root, or
  an explicitly isolated copy of it, showing that all active Recipes are
  represented by fresh `recipe_region_*` items before APQ6 testing starts;
- vector-index parse proof showing the persisted index is not legacy-only:
  `recipeRegionIds > 0`, `distinctRecipeIdsWithRegionMetadata` equals the
  active Recipe count unless a named Recipe has no generatable content, and
  `metadata.type=recipe-semantic-region` is present on generated chunks;
- embed-unavailable tests proving saved degraded metadata does not claim vector
  matching;
- no-Recipe-mutation tests proving markdown/frontmatter remains unchanged.

### Candidate Package APQ4: Resident Requirement-To-Recipe Semantic Retrieval

Owner suggestion: Alembic and AlembicCore.

Purpose:

- build or expose Recipe design / architecture semantic vectors by region class
  for prime;
- make resident prime retrieval distinguish identity, applicability,
  pattern-purpose, architecture-convention, integration-boundary,
  quality-concern, negative-boundary, rationale, and evidence matches;
- build typed semantic queries from standalone prime requirement / feature
  input;
- filter vector search to `recipe-semantic-region` items and, where possible,
  to target region classes;
- merge region hits by parent Recipe id and expose per-region scores;
- preserve region-class match evidence in the prime injection package;
- ensure Core search/ranking still supports exact anchors such as `trigger`,
  title, tags, dimensions, capability names, and integration surfaces;
- verify the resident semantic path is stronger when Alembic main is available
  and honestly degraded when it is unavailable;
- avoid hiding weak locator evidence behind whole-document vector similarity.

Validation:

- resident search / prime injection package tests;
- Core vector search tests for metadata filtering and region-class ranking;
- vector-unavailable fallback tests.

### Candidate Package APQ5: Prime Selection, Region Gating, And Lean Projection

Owner suggestion: AlembicPlugin with AlembicCore/Alembic evidence refs.

Purpose:

- use Recipe locator fields and semantic region matches in accepted-material
  gating;
- prefer region-index evidence over whole Recipe vector evidence for
  trusted-to-use output;
- preserve compact match evidence without over-explaining in the primary
  injection;
- include matched design / architecture region classes, useful Recipe slices,
  action hint, trust status, and verification refs in compact output;
- keep low-information and automation-envelope blocks strict;
- avoid returning generic accepted knowledge when locator or region match is
  weak.

Validation:

- unit tests for `PrimeKnowledgeMaterial`;
- handler tests for standalone prime requirement input, fallback direct query,
  rejected/deleted `intentRef` / `recognizedIntent` routes, sourceRef anchors,
  and automation-envelope sourceRef requirement;
- output schema tests for delivered, empty, degraded, skipped,
  vector-unavailable, and verification-required packages;
- resident package tests proving matched region classes survive Plugin
  projection.

### Candidate Package APQ6: End-To-End Agent Prime SQ Proof

Owner suggestion: controller decides Plugin or Test.

Purpose:

- run a fresh installed/local MCP validation after implementation;
- require APQ3 generation-test proof before accepting any full generated vector
  fixture as test-ready. If the test proof is absent or failed, APQ6 must stop
  before full-generation-dependent positive probes;
- run a preflight vector-fixture check before positive prime probes. The
  preflight must parse the target project data root's vector index and prove
  that newly generated `recipe_region_*` semantic-region vectors exist for the
  active Recipe set. If the index contains only legacy `entry_*` vectors, APQ6
  must stop as test-environment-not-ready instead of treating empty prime output
  as a Plugin-only product failure;
- verify exactly what a host agent sees in visible receipt and structured
  content;
- confirm that prime improves agent behavior, not only schema validity.

Probe matrix:

- concrete implementation task with relevant architecture Recipe expected;
- fix task with relevant design-pattern Recipe expected;
- refactor task with relevant architecture-boundary Recipe expected;
- feature requirement with capability + integration boundary, expected relevant
  architecture convention Recipe;
- feature requirement with quality concern, expected relevant quality / boundary
  Recipe;
- test-writing or test-repair task when project testing patterns exist;
- ordinary knowledge query about rules, expected skip or search-route guidance;
- review / Guard-oriented task with no code-change outcome, expected skip;
- design/planning task, expected skip;
- project navigation / map query, expected skip;
- low-information query, such as `where do I start`;
- Wakeflow automation-envelope style prompt with curated standalone prime
  requirement frame and `sourceRefs`, expected eligible only when
  code-development purpose exists;
- requirement task with only source refs and no feature goal, expected degraded
  or skipped until a direct prime requirement frame is supplied;
- Chinese query describing a feature / requirement that needs architecture or
  design-pattern guidance;
- query requiring prohibition guidance, expected `dontClause` /
  negative-boundary region evidence;
- query requiring architecture pattern guidance, expected pattern-purpose or
  architecture-convention evidence;
- query that should return no accepted material.

## Testing Decisions

Testing should focus on agent-visible usefulness:

- Schema tests prove allowed input fields and blocking behavior.
- Input contract tests prove broad / low-quality parameters are removed or
  rejected before matching.
- Classification tests prove prime eligibility and non-eligibility before
  retrieval.
- Handler tests prove standalone prime input behavior, removed/rejected
  `intentRef` / `recognizedIntent` routes, sourceRef merge, skipped non-code
  turns, and automation-envelope blocking.
- Material tests prove compact design / architecture Recipe slices, matched
  region classes, trust layer placement, and degraded reasons.
- Recipe audit tests prove locator completeness is measurable using existing
  fields.
- Search/ranking tests prove locator fields and semantic regions affect
  retrieval in the intended priority.
- Region chunk builder tests prove semantic vector chunks are created and saved
  from existing Recipe data without changing Recipe source files.
- Region index persistence tests prove saved items use the expected vector item
  metadata and can be filtered by type / region class.
- Resident semantic tests prove requirement-to-Recipe region-class vector
  matching works only when Alembic main / resident capability is available, and
  degrades honestly when it is absent.
- End-to-end MCP probes prove visible receipt and structured content are useful
  to a real host agent.

## Acceptance Criteria

The demand is complete only when:

- The current Agent inputs to `prime` and the old intent-coupling points are
  documented and tested.
- `prime` target input is reduced to high-quality code-development requirement
  frame: feature goal, behavior/scenario, capability, domain objects,
  integration boundary, lifecycle/data-flow hint, quality concerns, project
  root, and optional verification anchors; extra fields are removed or rejected
  as matching evidence.
- `prime` requires `taskAction + requirementGoal + at least one locator facet`
  before retrieval; otherwise it returns skipped or degraded output.
- `prime` retrieval runs only for classified code development tasks.
- Ordinary knowledge-query turns do not run `prime` retrieval.
- Non-code-development turns return clean skipped / not-applicable output and do
  not retrieve Recipes.
- `prime` does not require or support `intentRef`, `recognizedIntent`, or
  `alembic_intent` state; old routes are disconnected and deleted, or rejected
  as obsolete input during parser cleanup.
- `prime` has verified fallback behavior for direct `query` only when it still
  forms a concrete code-development requirement frame.
- Automation-envelope prime remains blocked without source refs.
- Automation-envelope prime is eligible only with curated code-development
  prime requirement frame plus source refs.
- Recipe locator checklist is explicitly about design patterns, architecture
  norms, and code-writing constraints, and uses current fields unless a real
  audit proves a minimal new field is necessary.
- Recipe source files are not modified as part of the first prime optimization
  route.
- Recipe semantic region slicing exists for identity, applicability,
  pattern-purpose, architecture-convention, integration-boundary,
  quality-concern, negative-boundary, rationale, and evidence regions, or the
  implementation records exactly why a region cannot be built from existing
  content.
- Recipe semantic-region chunks are generated deterministically from existing
  Recipe rows and saved as derived vector items with parent Recipe id, region
  class, content hash, source hash, dimension, language, tags, and evidence
  refs.
- Generated region chunks are stored under a namespace that cannot be confused
  with existing `entry_*` whole-entry vectors.
- Region-index rebuild or reconciliation removes stale generated chunks for
  deleted, deprecated, or changed Recipes.
- Region chunk generation and persistence run only in rebuild / refresh /
  knowledge sync flows, not during normal prime queries.
- Prime resident semantic matching filters to generated
  `recipe-semantic-region` chunks and preserves matched region classes through
  the final output.
- Prime accepted items include matched requirement facets, matched design /
  architecture region classes, compact Recipe content slices, action hint when
  available, trust layer, and verification refs.
- Prime does not require verbose match explanations in the primary injection;
  detailed reasons live in diagnostics / structured metadata / evidence refs.
- Weak locator metadata cannot produce trusted-to-use material by itself.
- Whole-document vector similarity cannot produce trusted-to-use material
  without locator or semantic-region evidence.
- Code snippet, active file, or source-ref similarity cannot produce
  trusted-to-use Recipe material without requirement-to-design / architecture
  region evidence.
- Degraded prime output names the missing input or missing Recipe locator
  evidence.
- Low-information queries do not produce generic trusted material.
- Chinese/English mixed queries can match Recipes through explicit locator
  fields, not only runtime synonym expansion.
- Full Recipe bodies remain behind detail refs; compact output stays bounded.
- Alembic main / resident semantic-vector path provides a demonstrably stronger
  requirement-to-Recipe prime route when available; Plugin-only fallback is
  labeled as degraded or lower-capability when region semantic matching is
  unavailable.
- APQ6 fresh MCP validation is run only after the target Alembic data root has
  a fresh all-active-Recipe semantic-region vector fixture. The evidence must
  include active Recipe count, `recipe_region_*` count, distinct covered Recipe
  ids, vector index path / timestamp, and confirmation that a legacy-only
  `entry_*` index was not used as the semantic-region test fixture.
- Full active-Recipe generation evidence is accepted only when preceded by a
  passing bounded generation test. If the bounded test fails, the result is not
  a validation failure of prime quality; it is a generation implementation
  blocker that must be reworked before full generation or APQ6 probes continue.
- Vector-unavailable, empty-region-index, metadata-only, and whole-entry-only
  cases are diagnosed honestly and cannot be reported as strong prime semantic
  matches.
- Fresh MCP probe evidence shows the host agent receives useful content.

## Risks And Open Questions

- If Recipe content quality is poor, runtime scoring changes will only move the
  problem around.
- Adding too many new Recipe fields would increase authoring cost and migration
  churn. Start with existing fields.
- Over-trusting host-supplied requirement fields can make prime obey caller
  guesses instead of project knowledge. Prime input remains navigation input,
  not truth.
- Misclassifying design/status/search turns as code development would recreate
  the invalid-output problem by injecting Recipes where they do not belong.
- Misclassifying real implementation turns as non-code would remove useful
  architecture guidance before coding.
- Vector similarity can select plausible but wrong Recipes unless locator
  evidence is visible and gated.
- Region slicing can increase indexing and storage cost; it must stay tied to
  concrete design / architecture Recipe fields and must not become another
  broad document expansion.
- Saving generated region chunks into the shared vector store can mix ordinary
  whole-entry vectors with prime-specific region vectors unless the metadata
  namespace and filters are enforced.
- Existing vector reconciliation focuses on `entry_*` ids; generated
  `recipe_region_*` ids need their own cleanup path.
- Removing broad input fields may require staged Plugin contract cleanup if
  host callers still send them.
- Over-minimizing prime injection can hide debugging evidence; keep diagnostics
  structured while keeping the primary Agent payload compact.
- Old Recipes may need staged cleanup or rescan output changes before the final
  quality bar can be met.
- If APQ2 proves Recipe authoring gaps, controller should record them as a
  follow-up Recipe quality demand instead of expanding this implementation
  route into Recipe content migration.

## Controller Intake Notes

This is a Design requirement draft, not an execution packet.

Recommended controller route:

1. Run APQ0 read-only baseline to lock the real input/output behavior.
2. Run APQ1 classification gate so prime stops running for non-code turns.
3. Run APQ2 Recipe locator audit to measure what can be derived from current
   Recipe data.
4. Run APQ3 derived semantic-region chunk builder and persistence. This phase
   must not edit Recipe files. It must first run a bounded generation test; only
   if that test matches expectations may it produce the full active-Recipe
   generated vector fixture. If the bounded test fails, rework APQ3 and do not
   run full generation.
5. Run APQ4 resident requirement-to-Recipe region retrieval.
6. Run APQ5 Plugin prime gating and lean output projection.
7. Before APQ6 positive probes, verify that the current target data root is not
   legacy-only: parse the persisted vector index and prove that all active
   Recipes are represented by fresh `recipe_region_*` semantic-region vectors.
8. Run APQ6 end-to-end SQ proof in a fresh MCP validation path.

Do not dispatch Recipe content migration in this demand. If APQ2/APQ6 finds
Recipe authoring gaps, record them as a follow-up Recipe quality demand after
this prime infrastructure route proves the derived-region index and output
contract.

## Source References

Intent-related source references below are historical coupling evidence for
isolation / cleanup. They are not target entrypoints for the optimized
`alembic_prime` route.

- `AlembicPlugin/lib/shared/schemas/mcp-tools.ts:38`
- `AlembicPlugin/lib/shared/schemas/mcp-tools.ts:120`
- `AlembicPlugin/lib/shared/schemas/mcp-tools.ts:162`
- `AlembicPlugin/lib/shared/schemas/mcp-tools.ts:167`
- `AlembicPlugin/lib/runtime/mcp/handlers/agent-public-tools.ts:273`
- `AlembicPlugin/lib/runtime/mcp/handlers/agent-public-tools.ts:344`
- `AlembicPlugin/lib/runtime/mcp/handlers/agent-public-tools.ts:712`
- `AlembicPlugin/lib/runtime/mcp/handlers/agent-public-tools.ts:1728`
- `AlembicPlugin/lib/runtime/mcp/handlers/agent-public-tools.ts:1868`
- `AlembicPlugin/lib/runtime/mcp/handlers/agent-public-tools.ts:1903`
- `AlembicPlugin/lib/service/task/HostIntentFrame.ts:149`
- `AlembicPlugin/lib/service/task/HostIntentFrame.ts:196`
- `AlembicPlugin/lib/service/task/HostIntentFrame.ts:286`
- `AlembicPlugin/lib/service/task/HostIntentFrame.ts:310`
- `AlembicPlugin/lib/service/task/IntentExtractor.ts:152`
- `AlembicPlugin/lib/service/task/PrimeSearchPipeline.ts:106`
- `AlembicPlugin/lib/service/task/PrimeSearchPipeline.ts:221`
- `AlembicPlugin/lib/service/task/PrimeKnowledgeMaterial.ts:215`
- `AlembicPlugin/lib/service/task/PrimeKnowledgeMaterial.ts:323`
- `AlembicPlugin/lib/service/task/PrimeKnowledgeMaterial.ts:378`
- `AlembicPlugin/lib/service/task/TaskLifecyclePolicy.ts:35`
- `AlembicPlugin/lib/service/task/TaskLifecyclePolicy.ts:360`
- `AlembicCore/src/types/KnowledgeWire.ts:95`
- `AlembicCore/src/domain/knowledge/KnowledgeEntry.ts:27`
- `AlembicCore/src/service/knowledge/KnowledgeFileWriter.ts:43`
- `AlembicCore/src/service/search/FieldWeightedScorer.ts:11`
- `AlembicCore/src/service/search/SearchEngine.ts:557`
- `AlembicCore/src/service/search/SearchEngine.ts:890`
- `AlembicCore/src/service/search/SearchEngine.ts:1088`
- `AlembicCore/src/service/search/SearchTypes.ts:432`
- `AlembicCore/src/service/knowledge/SourceRefReconciler.ts:4`
- `AlembicCore/src/infrastructure/vector/VectorStore.ts:18`
- `AlembicCore/src/infrastructure/vector/JsonVectorAdapter.ts:44`
- `AlembicCore/src/infrastructure/vector/IndexingPipeline.ts:125`
- `AlembicCore/src/service/vector/VectorService.ts:156`
- `AlembicCore/src/service/vector/VectorService.ts:303`
- `AlembicCore/src/service/vector/SyncCoordinator.ts:114`
- `Alembic/lib/service/task/HostIntentContext.ts:1`
- `Alembic/lib/service/task/IntentSearchPlan.ts:1`
- `Alembic/lib/service/task/IntentEvidence.ts:1`
- `Alembic/lib/service/task/PrimeInjectionPackage.ts:1`
- `Alembic/lib/injection/modules/KnowledgeModule.ts:131`
- `Alembic/lib/injection/modules/VectorModule.ts:32`
- Local AlembicWorkspace data scan on 2026-06-16: active Recipe files,
  `knowledge_entries`, and `recipe_source_refs` counts checked without writing
  product state.
