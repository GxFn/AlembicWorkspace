# Alembic 主线整合完成记录

用户要求改用主线开发，整合现有开发分支后删除。此次只整理本地Git状态，未向远端推送；实时远端检查仅有main，无远端开发分支需删除。

## 完成状态

| 仓库 | 主线 HEAD | 本地分支 |
| --- | --- | --- |
| AlembicWorkspace | `a764726f4087` | main |
| Alembic | `0708cdec60a8` | main |
| AlembicCore | `516e05ac1121` | main |
| AlembicAgent | `4809b9d56ce1` | main |
| AlembicDashboard | `b6df7904e668` | main |
| AlembicPlugin | `ef25c9f7e1a9` | main |
| AlembicBook | `a93b1500776e` | main |
| AlembicShowcase | `9db39cb47759` | main |

共删除6个已整合开发分支：

- AlembicCore：`codex/core-review-cleanup`（原tip `516e05ac1121`，仍为main祖先）。
- AlembicPlugin：`codex/core-knowledge-writes`（原tip `ef25c9f7e1a9`，仍为main祖先）。
- AlembicAgent：`codex/interface-layering-agent`（原tip `6e25e1ef4420`，仍为main祖先）。
- AlembicAgent：`codex/llm-sdk-adapters`（原tip `9bda075a013a`，仍为main祖先）。
- Alembic：`codex/core-knowledge-writes`（原tip `43d6ad8d2bd4`，仍为main祖先）。
- Alembic：`codex/interface-layering-main`（原tip `fd98899ed24a`，仍为main祖先）。

## 合并依据与验证

Core、Plugin以及Agent/Main当前开发线均经祖先检查快进main。使用期望旧ref进行原子更新，再同树切换工作目录；原AGENTS.md/CLAUDE.md及Core未跟踪coverage入口逐字节保留。

两条interface分支不是整提交patch等价。逐文件比对确认其工作树末态已完整包含在当前实现中，旧提交的可空回执处理已由更完整的结构化回执修复覆盖。Main分支9个文件中8个在吸收提交3832e71逐字相同；其余Strict回执修复与5个WIP文件也都在当前版本中。Agent分支只涉及3个文件，三个WIP末态与9638f25及当前版本完全一致。详细blob与SHA256见absorption-proof.json。

因此两次ours ancestry merge只连接提交历史，不更换代码。合并前后tree OID严格相同；两个parent以及每个待删branch tip均验证可从main到达，随后使用git branch -d删除，没有强删未整合分支。

所有主工作目录现在均在main，8个相关仓库的本地分支列表均仅main。未改变产品源码；Agent/Main代码树与上一轮完整npm run check通过的9bda075/43d6ad8相同，Git元数据整理以tree identity、祖先关系、工作树文件hash和分支清单验收，无需重复执行无源码变动的测试。

## 保留与恢复

完整Git bundle与未提交patch/文件快照位于 `.codex-scratch/mainline-consolidation-2026-09-21/`，四份bundle创建后均通过git bundle verify。备份没有创建额外开发分支。

两个旧interface worktree解除分支占用后保留为detached恢复现场，其未提交内容和原始HEAD不变；内容已经存在于主线，不作为继续开发的位置。历史Test detached worktree保持原状。今后开发使用各仓库主目录的main，不自动创建开发分支或隔离开发worktree。

远端main未更新，主线ahead是原有本地工作与本次历史整合；本轮没有force push或任何推送。
