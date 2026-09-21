# strict-test-split-removal-2026-08-03 — Archive Summary

- Title: 移除被否决的独立 strict-test-dimension 实现
- Archived: 2026-08-03T17:36:46.676Z — 已验收并完成纯回滚需求；后续正确的全局测试模式作为独立 supplement 继续。
- Demand goal: 从 Alembic Main、AlembicDashboard、AlembicAgent 和 AlembicCore 中完整删除被用户否决的独立 strict-test-dimension 分叉，不设计替代测试模式，不恢复 legacy bootstrap，不改 DaemonJob。
- Completion definition: 四个仓库按已验证提交归因完成精确回滚并提交；独立 strict-test-dimension 路由、契约、运行时、公共导出、探针、生成操作、UI 消费者、测试/fixtures 零残留；通用 strict production/cold-start 能力保留；Dashboard 不重新触发 legacy bootstrap；所有仓库检查通过且工作树干净。

## Provenance

- Design key: (none recorded)
- Source documents: (none recorded)

## Conclusion

- Completed 2026-08-03T17:35:52.668Z — 四个已授权回滚任务均经控制器独立验收；错误的独立 strict-test-dimension 分叉已删除，通用生产冷启动能力保留，Dashboard 保持无 legacy 网络回退。正确的全局测试模式属于用户新确认的独立 supplement，不续写本需求。
- Evidence: .wakeflow-active/current/strict-test-split-removal-2026-08-03/developer-progress.md
- Evidence: Alembic@d5bfeb128fc86f6447bf9d1f74ebdac7f95e003f
- Evidence: AlembicDashboard@b6df7904e668301013f4d120fb24027d1f1edd6c
- Evidence: AlembicAgent@00a27d7f12b7478a4f6bdf79aabf48b0ebd00a05
- Evidence: AlembicCore@e274e31ea4e4611314124eeb1111a44975c48896

## Task Ledger

| Task | Window | Final | Decision | Dispatches | Reworks | Redesigns |
| --- | --- | --- | --- | --- | --- | --- |
| rollback-strict-test-main-t1 | Alembic | accepted | accept | 1 | 0 | 0 |
| rollback-strict-test-dashboard-t1 | AlembicDashboard | accepted | accept | 1 | 0 | 0 |
| rollback-strict-test-agent-t1 | AlembicAgent | accepted | accept | 1 | 0 | 0 |
| rollback-strict-test-core-t1 | AlembicCore | accepted | accept | 1 | 0 | 0 |

## Test Cards

- (none)

## Where The Rest Lives

- Execution timeline: developer-progress.md (Task Packages / Backfill Summaries / Decisions And Append Log)
- Machine audit trail: controller-events.jsonl + wakeflow-state.json
- Un-redacted original: moved to .wakeflow-local/preserved/ (see archive-manifest.json originalPreservedAt)
- Opaque evidence placeholders: none
- Sensitive path placeholders: none
