# alembic-guard-cross-project-recovery-2026-07-12 — Archive Summary

- Title: Alembic Guard 跨项目写入修复与真实知识库恢复
- Archived: 2026-07-12T06:26:40.050Z — Demand completed after controller acceptance of all four packages and final full-suite/package verification.
- Demand goal: 修复 alembic_code_guard 在显式 projectRoot 双项目调用中把 Workspace checkpoint 写入 BiliDili data root、隐藏辅助维护失败并污染 status 投影的问题；在代码修复后安全恢复 BiliDili 知识库完整性、分别 rescan 两个真实项目，并由总控直接重跑五工具确认结果有价值且无跨项目泄漏。
- Completion definition: 1) AlembicPlugin 的 Guard/commit-driven evolution/checkpoint 全链使用请求级 ProjectScope/dataRoot，顺序与并发双根调用均无 foreign project_root/commit；2) auxiliary maintenance 失败公开降级，不能藏在 outer ready/passed 下；3) Plugin focused/full/build/distribution 与 detached dual-root probe 通过并提交；4) BiliDili live knowledge root 先停写与完整备份，再以可审计恢复副本通过 integrity/FK/count/lifecycle/source-ref gates 后原子替换，移除本轮外来 Workspace checkpoint，不丢可恢复的 BiliDili knowledge；5) AlembicWorkspace 与 BiliDili 分别通过 supported rescan 得到各自完整 current revision posture；6) 总控在现有两个真实项目上直接多轮调用 Search/Graph/Recipe Map/Prime/Code Guard，重复结果稳定、知识与当前源码一致、Guard 无跨根写入，BiliDili database quick_check/integrity_check 为 ok；7) 不修改 BiliDili 产品源码，不派发 Test，不创建额外测试环境，不把旧损坏数据库直接覆盖而无备份。

## Provenance

- Design key: (none recorded)
- Source documents: (none recorded)

## Conclusion

- Completed 2026-07-12T06:26:08.116Z — All four packages are accepted. Guard writes are request-root isolated with truthful degradation; BiliDili recovery and both real-project refreshes passed integrity and scope gates; controller real calls proved Search, Graph, Recipe Map, Prime, and Code Guard useful/current/repeatable on both knowledge bases; remaining refresh/status/Guard truth defects were fixed; the user-authorized legacy Plugin failures are closed with the exact full suite and packaging gates green. No Test environment, BiliDili source change, live-knowledge implementation write, or unresolved in-scope blocker remains.
- Evidence: tr-p1-plugin-guard-request-dataroot-isolation-t1; AlembicPlugin e4b64c25be0258bb5e0734abded8e982628794ac
- Evidence: tr-p2-controller-live-recovery-rescan-five-tool-acceptance-t1; BiliDili recovery/integrity + dual real-root five-tool evidence
- Evidence: tr-p3-plugin-real-refresh-scope-checkpoint-truth-t1; AlembicPlugin 6e3ba4ba6ea818075f64c535fad8b267d794a3c8
- Evidence: tr-p4-plugin-full-unit-suite-closure-t1; AlembicPlugin c2a07d31be4fda4fcaff1161cc952b45c3480927
- Evidence: controller final: 163 unit files / 1816 tests passed; check/build/runtime-package/plugin-distribution/codex-plugin all passed

## Task Ledger

| Task | Window | Final | Decision | Dispatches | Reworks | Redesigns |
| --- | --- | --- | --- | --- | --- | --- |
| p1-plugin-guard-request-dataroot-isolation-t1 | AlembicPlugin | accepted | accept | 1 | 0 | 0 |
| p2-controller-live-recovery-rescan-five-tool-acceptance-t1 | AlembicWorkspace | accepted | accept | 0 | 0 | 0 |
| p3-plugin-real-refresh-scope-checkpoint-truth-t1 | AlembicPlugin | accepted | accept | 1 | 0 | 0 |
| p4-plugin-full-unit-suite-closure-t1 | AlembicPlugin | accepted | accept | 1 | 0 | 0 |

## Test Cards

- (none)

## Where The Rest Lives

- Execution timeline: developer-progress.md (Task Packages / Backfill Summaries / Decisions And Append Log)
- Machine audit trail: controller-events.jsonl + wakeflow-state.json
- Un-redacted original: not needed (archive copy is complete)

## Sanitization Amendments

- 2026-07-12T07:34:34.895Z: archive privacy findings removed — Repair the historical archive that retained user/workspace absolute paths after the prior archive scanner reported zero findings.
- Original preserved at: .wakeflow-local/preserved/2026-07-12-archive-sanitization-original-alembic-guard-cross-project-recovery-2026-07-12
