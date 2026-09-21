# 主线整合计划

用户明确要求所有Alembic相关仓库转为主线开发，整合后删除开发分支。本轮因此获准跨仓执行Git维护；不扩展产品功能、不推送远端、不删除未迁移内容。

范围：AlembicWorkspace、Alembic、AlembicCore、AlembicAgent、AlembicDashboard、AlembicPlugin、AlembicBook、AlembicShowcase。既有main为主线；实时远端检查发现产品origin只有main，Showcase无remote。

1.记录refs/工作树/本地更改，先创建并验证bundle及未提交文件备份。
2.Core/Plugin及当前Agent/Main开发线先只作经祖先检查的fast-forward：用期望旧值更新main，再同树切换，逐字节保留未提交文件。
3.两个interface worktree另行比对提交与WIP；只有被当前代码覆盖的内容才能以相应合并策略整合，保留历史并避免恢复已修复的旧语义。
4.确认所有待删tip都是main祖先，解除旧worktree的分支占用并保留其现场，再用安全branch -d删除已整合分支。既有detached测试worktree不属于开发分支，不清理。
5.验证每仓只剩main、主目录在main、未提交内容不丢失。没有源码变化则用tree identity与上轮完整检查证据，不重跑无关测试。

恢复材料位于.codex-scratch/mainline-consolidation-2026-09-21。旧工作树和个人规则变更未经用户要求不清空。
