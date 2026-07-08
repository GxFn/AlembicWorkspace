# P4 Alembic Embedding Config Runtime Bridge Repair

Status: completed
Target window: Alembic
Task: p4-alembic-embedding-config-runtime-bridge-repair-t1
Task package: p4-alembic-embedding-config-runtime-bridge-repair-p1
State root: .wakeflow-active/current/alembic-panorama-rebuild-2026-07-03
Observed at: 2026-07-07T12:02+08:00

## Verdict

Alembic fixed the runtime bridge defect. BiliDili's v2 `.asd/config.json`
`vector.localEmbedding` config is now projected into the daemon process as a
dedicated embed provider before `AiModule.createEmbedProvider()` runs.

Commit: `76358d9ddbdf3ab9c316718aa841367e4c6f79d5`

## Root Cause

The BiliDili runtime evidence showed `.asd/settings.json` carried only DeepSeek
generation config, while `.asd/config.json` carried:

- `vector.localEmbedding.enabled=true`
- `endpoint=http://127.0.0.1:11434`
- `model=qwen3-embedding:0.6b`

`AppRuntime.loadRuntimeSettings()` only applied `WorkspaceSettingsStore`
settings/secrets into process env. It did not read v2 runtime config
`vector.localEmbedding`, so `ALEMBIC_EMBED_PROVIDER`, `ALEMBIC_EMBED_MODEL`, and
`ALEMBIC_EMBED_BASE_URL` were absent at daemon startup. `AiModule` therefore had
no dedicated embed provider and fell back through the generation provider path,
which made rescan embedding attempt DeepSeek and produced `[deepseek] embed
failed: deepseek API error: 404`.

## Changes

- `lib/Bootstrap.ts`
  - After workspace settings are applied, reads the selected workspace
    resolver's v2 `.asd/config.json`.
  - If `vector.localEmbedding.enabled === true` and no explicit
    `ALEMBIC_EMBED_PROVIDER` is already present, sets:
    `ALEMBIC_EMBED_PROVIDER=ollama`,
    `ALEMBIC_EMBED_MODEL=<localEmbedding.model>`,
    `ALEMBIC_EMBED_BASE_URL=<localEmbedding.endpoint>`.
  - Does not overwrite explicit process/settings embed provider values.
  - Does not write or migrate BiliDili config/settings/secrets.
- `test/unit/BootstrapRuntimeSettings.test.ts`
  - Covers BiliDili-shaped settings + v2 local embedding config.
  - Covers explicit embed provider precedence.
  - Covers the env-config merge path via `collectAiEnvOverrides`.

No Dashboard, BiliDili, or sibling AlembicCore source files were modified.

## Validation

- `npx vitest run --config vitest.unit.config.ts test/unit/BootstrapRuntimeSettings.test.ts`
  - PASS, 3 tests.
- `npm run build:check`
  - PASS, using local AlembicCore source `../AlembicCore`.
- `npm run lint:retired-symbols`
  - PASS, no retired symbols found.
- `npm run lint:repo-boundary`
  - PASS, repository boundary check passed.
- `npm run lint:consumer-core-imports`
  - PASS, scanned 379 files and 470 `@alembic/core` imports.
- `npm run lint:ring-direction`
  - PASS, ring direction clean.
- `npx biome check lib/Bootstrap.ts test/unit/BootstrapRuntimeSettings.test.ts`
  - PASS.
- `npx biome check test/unit/BootstrapRuntimeSettings.test.ts`
  - PASS.
- `npm run lint`
  - PASS exit code 0. Existing warnings remain in
    `lib/recipe-pipeline/generate/execution/AgentRunProjections.ts` and
    `lib/types/handler-runtime.ts`; neither file was touched.
- `git diff --check`
  - PASS.
- Alembic Guard
  - PASS, `guard-public-mra4gcdi-1`, 2 explicit files checked, 0 violations.
- Post-commit targeted rerun:
  - `npx vitest run --config vitest.unit.config.ts test/unit/BootstrapRuntimeSettings.test.ts`
  - PASS, 3 tests.

## Residual Risk And Next Step

- Alembic did not run the P4 final real-machine BiliDili dashboard/rescan gate;
  that remains a controller/Test rerun decision.
- The fix assumes v2 `vector.localEmbedding` denotes the local Ollama embed
  lane. Agent `OllamaProvider` already normalizes a bare
  `http://127.0.0.1:11434` endpoint to OpenAI-compatible `/v1`.
- If a workspace already provides an explicit embed provider, this bridge skips
  v2 local embedding to avoid mixing provider/model/base-url sources.
