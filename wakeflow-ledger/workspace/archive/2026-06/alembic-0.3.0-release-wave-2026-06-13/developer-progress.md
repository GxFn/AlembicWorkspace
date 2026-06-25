# Alembic 0.3.0 release wave (R-group member 1) — publish HELD for user trigger 进度

## 统一状态

<!-- unified-status:start -->
需求: alembic-0.3.0-release-wave-2026-06-13 - Alembic 0.3.0 release wave (R-group member 1) — publish HELD for user trigger
主状态: intake
阶段: 无
当前任务包: 无
窗口: 无
阻塞项: 无
下一步: 由总控判断定义阶段和任务包。
评审: 无
自动化: 未启用
需要用户决策: 无
最后更新: 2026-06-13 14:01 CST
来源状态: revision 1 / event evt-20260613060124-0001
<!-- unified-status:end -->

## 目标

Execute the release-coupled 0.3.0 set per the user's 2026-06-13 rulings (r-group-rulings-2026-06-13.md), publish HELD: (RW1) re-point MT2 OutputBudget + CO3 error imports/docs to the root facade [B2=re-point]; (RW2) SD-5 phase-2 delete the 67 verified-zero-consumer wildcard keys on a fresh re-scan + fold keep-alive (drizzle exact-row survives) [C3]; (RW3) run the parked SN4 Core source-naming wave once SD-5 un-freezes the src-covering wildcards; (RW4) delete the R-1 plugin overlay routes with the RC4 proof set [A3=delete] + close the C2 version-pin tail (exact pins, marketplace confirm, negative-cache install-docs); (RW5) release acceptance — the npm publish stays HELD for the user's explicit trigger; AFAPI-REQ-08 already resolved. All behavior-neutral; deletions git-recoverable with proof.

## 完成定义

./shared re-pointed with valid import paths (downstream builds green); SD-5 67/67 deleted + keep-alive folded, expectedCounts at the closeout target, boundary/smoke/3-consumer scans green, downstream Alembic/Agent/Plugin builds green, zero behavior change; SN4 Core naming landed rename-only with naming lint green + mechanical-diff audit; R-1 overlays deleted with the RC4 proof set (or kept if a consumer is later named); C2 tail closed; all five repos green; the staged publish command verified ready and HELD; 0.3.0 ledger updated. The demand does NOT complete the publish — that is the user's trigger; it completes everything up to and including release-readiness.

## 阶段计划

p1 AlembicCore: SD-5 wave (RW0 fresh re-scan + RW1 ./shared re-point + RW2 67-key delete). p2 AlembicPlugin: RW4 overlay delete + C2 tail (parallel with p1). p3 AlembicCore: RW3 SN4 source naming (after p1). p4 AlembicWorkspace: RW5 release-readiness acceptance + held publish (after p1-p3 + p2).

## 任务包

## 回填摘要

## 决策和追加日志
