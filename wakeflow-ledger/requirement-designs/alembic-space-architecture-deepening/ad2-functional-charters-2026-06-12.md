# AD2 — Functional Charters Confirmed (2026-06-12)

Status: controller-confirmed against real code; config `charterRefs.status` flip in
AlembicCore rides the next Core packet after the user reviews the companion
decision register. Sources: canonical `config/space-allowed-edges.json` drafts,
P0 unified fact freeze §2/§7, IC0/AD0 censuses, Train H certification evidence,
P3 train acceptance evidence (13 candidates), AD2 read-only sweeps.

## Per-Repo Charters (owns / consumes / must-never)

### @alembic/core (AlembicCore) — CONFIRMED
- Owns: knowledge/search/graph/guard/vector/evolution engine, persistence +
  migrations, shared taxonomy/errors/OutputBudget, importable analysis-leaf
  `core/`. Evidence: package exports map; layer-contract direction rules;
  blessed analysis-leaf; error/wire registries (Train A).
- Consumes: zero space packages (space-edge gate enforced, blocking-demoed).
- Must-never: host/UI/transport specifics — CONFIRMED (no HTTP hosting in src;
  gates forbid space edges; bin = local CLI tooling only).
- Post-SD-5 target surface: 31 exports (67 staged deletions, zero-served proof
  at t13; execution rides the user-triggered 0.3.0 wave).

### @alembic/agent (AlembicAgent) — CONFIRMED with one declared exception
- Owns: LLM provider/tool runtime (V2 catalog, transports, classification);
  14 stable public exports (validation floor asserts the exact set).
- Consumes: @alembic/core only (space-edge gate; core-import boundary at
  specifier depth; `@alembic/core/shared` taxonomy ×1 = IC4 adoption surface).
- Must-never: knowledge persistence; HTTP surface.
  - DECLARED EXCEPTION (standing contract, not drift): the raw-SQL
    `semantic_memories` read adapter (SD-4, RC3 boundary note; Option-C
    end-state trigger = next async-capable memory refactor migrates callers to
    Core MemoryRepository and deletes the adapter; schema tripwire test in
    place per RC6).

### alembic-ai (Alembic, main) — CONFIRMED with one wording amendment pending
- Owns: HTTP API + routes (incl. 6 wiki routes), daemon + jobs + FULL job
  observability stack (SD-6 policy: main owns; Plugin keeps minimal variant),
  CLI, injection/sandbox, injectable-skills assets, shared-asset manifest
  authority (Plugin copy synced, copies-match gate), generated api-types
  producer (SD-2 wiring).
- Consumes: @alembic/core + @alembic/agent (file: links; both-direction set
  equality gate).
- Must-never: re-implement Core engine capabilities; direct DB schema
  ownership — CONFIRMED (repo-boundary lint + space gates).
- AMENDMENT PENDING USER: the draft says "resident MCP … host". Train H proved
  the resident MCP registry is UNBOUND (zero importers, no MCP SDK, no stdio
  transport); live tools are served via daemon HTTP. The charter wording
  ("resident MCP") follows the standing resident-registry user decision
  (bind / delete / HTTP-certify) — register item E.

### alembic-dashboard (AlembicDashboard) — CONFIRMED
- Owns: views/api/state UI projection over the HTTP contract; normalizer seam.
- Consumes: zero space packages (420 specifiers scanned clean); data via HTTP +
  sha256-pinned generated api-types artifact (drift gate).
- Must-never: @alembic package imports; business logic beyond projection —
  CONFIRMED (space-boundary gate, blocking-demoed).

### @alembic/plugin (AlembicPlugin) — CONFIRMED
- Owns: dual-host plugin shells (AlembicCodex = Codex-only; AlembicClaudeCode =
  Claude Code, user-decided split), tier-composed MCP surface (agent 26 /
  usable 39), 5 delivered skills, clean-output + error-envelope layer (F1 fix),
  data-loss workflow gates (t6), runtime packaging + marketplace distribution.
- Consumes: @alembic/core (file: link dev path; vendor gitlink runtime
  fallback) at TRUE-count allowlists (drizzle 4 / 004 3 / 001 1 / schema 1).
- Must-never: fork Core semantics; main-repo route duplication beyond the
  declared overlay — CONFIRMED; the declared overlay is exactly the R-1 pair
  (evolution/panorama routes, byte-identical, legacy-register deadline:
  delete at next release unless a consumer is named — register item C).
  Never writes Alembic-owned surfaces (runtime-control.json read-only,
  re-verified at t6/t12).

## Interface → Charter Mapping

| Interface | Producer charter line | Consumers | Gate |
| --- | --- | --- | --- |
| Core package facades (root, ./shared, post-SD-5 31 keys) | Core "importable engine" | Alembic, Agent, Plugin | consumer-import + space-edge gates |
| Agent stable exports (14) | Agent "tool runtime" | Alembic | validation floor + space gate |
| HTTP API + wiki routes | Alembic "owns routes" | Dashboard (generated types), Plugin overlay (R-1 pair only) | api-types drift gate; R-1 register |
| Daemon jobs + observability | Alembic "daemon" (SD-6 policy) | Plugin minimal variant (declared) | SD-6 register |
| MCP plugin surface (26/39 tiers) | Plugin "MCP surface" | Codex + Claude Code hosts | parity snapshots + cross-shell drift gate |
| Resident MCP registry | UNMAPPABLE — pending user disposition | none live (unbound) | register item E |
| Shared-asset manifest | Alembic authority | Plugin synced copy | copies-match self-check |
| Generated api-types artifact | Alembic producer (SD-2) | Dashboard | sha256 pin + drift gate |

Every census interface maps to a charter line except the resident MCP registry
(placement question = register item E).
