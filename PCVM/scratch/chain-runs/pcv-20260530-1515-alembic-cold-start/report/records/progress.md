# PCVM Progress Records: Current LLM I/O Optimization

Run ID: `pcv-20260530-1515-alembic-cold-start`
Owner: `PCVM`
Status: `current`

| Date | Actor | Action | Result |
| --- | --- | --- | --- |
| 2026-05-31 | PCVM | Shifted current target to LLM input/output optimization. | New plan uses external best-practice research plus AlembicAgent/Alembic source facts. |
| 2026-05-31 | PCVM | Implemented Package A source/unit measurement surface in AlembicAgent. | Added `LLMInputMeasurement` with deterministic token estimator, section measurements, and duplicate block ratio for LLM input assemblies and standalone prompts. |
| 2026-05-31 | PCVM | Added analyze and Producer baseline fixtures. | `test/llm-input-layering.test.ts` now measures analyze input assembly and Producer v2 prompt duplicate blocks without provider calls. |
| 2026-05-31 | PCVM | Verified Package A. | `npm test -- test/llm-input-layering.test.ts` passed 10 tests; `npm run build` passed; `npm run lint` passed. |
| 2026-05-31 | PCVM | Recorded source/unit fixture baseline. | Analyze fixture: estimated tokens 839, duplicate ratio 0.1292, duplicate estimated tokens 80; Producer fixture: estimated tokens 964, duplicate ratio 0.0527, duplicate estimated tokens 75. |
| 2026-05-31 | PCVM | Implemented Package B input compaction in AlembicAgent. | `LLMInputAssembly` now dedupes later repeated long blocks across input sections and records compaction metadata; Producer v2 now compacts repeated long lines across analysis text, findings, and evidence map. |
| 2026-05-31 | PCVM | Implemented Package C output contract instructions in AlembicAgent. | Analyze final text is constrained to verified finding ids or next evidence action; Producer final text is constrained to submit counts and blockers; summary avoids replaying full evidence text. |
| 2026-05-31 | PCVM | Verified Package B/C source-unit candidate. | `npm test -- test/llm-input-layering.test.ts test/evidence-recording-phase-chain.test.ts` passed 21 tests; `npm run build` passed; `npm run lint` passed. |
| 2026-05-31 | PCVM | Recorded Package B/C same-fixture comparison. | Analyze fixture: tokens 839 -> 805, duplicate ratio 0.1292 -> 0.0239; Producer fixture: tokens 964 -> 848, duplicate ratio 0.0527 -> 0.0161. |
| 2026-05-31 | PCVM | Implemented Package D runtime context wiring compaction in Alembic. | Bulky project/evidence facts are owned by `strategyContext`; `systemRunContext` is compacted to runtime references and PCV mapping fields before entering `AgentRunInput`. |
| 2026-05-31 | PCVM | Verified Package D. | `npm run build` passed; `npm run test:unit -- test/unit/BootstrapDimensionRuntimeBuilder.test.ts test/unit/BootstrapInputBuilder.test.ts` passed 5 tests; `npm run build:check` passed; `npm run lint` passed. |
| 2026-05-31 | PCVM | Advanced to Package E gate. | Packages A-D pass source/unit gates; same-input live comparison is blocked until explicit approval to send BiliDili project content to the configured external provider. |
