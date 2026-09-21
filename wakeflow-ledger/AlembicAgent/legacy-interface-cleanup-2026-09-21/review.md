# Agent owner 测试归属审阅

日期：2026-09-21；直接用户授权旧问题与接口/测试整理。提交 `9bda075a013a4bfd748ece60a38b42e1372fd90b`，基线c5bc99b；Main配套 `43d6ad8d2bd4ce788a7ee7185a43b702b71fcd38`。

Agent在7份既有测试文件接回路由/SDK兼容默认、工具回执与质量门禁、registry/权限、事件响应、trace/SystemRunContext等独特场景。未新增运行时包装或改变业务门槛，Core保持只读。原AGENTS.md/CLAUDE.md改动不在提交中。

需求自审：Main删除的6份内部测试副本都有owner覆盖及实际Main消费测试；详细五文件84-case映射在Main同名目录owner-test-migration-map.json，LLM分类在llm-migration.json。Agent子任务证据见owner-test-migration-review.json，原始子任务快照保留。

质量自审：真实Response验证SDK协议；只有已确认回执计为成功；记录修复与重新分析分开；不自应答RPC；不可变registry视图保留真实handler；拒绝动作在宿主分配前结束；上下文测试使用真实ContextWindow/MemoryCoordinator并仅替代模型循环。未发现本轮P0/P1。

验证：npm run check exit0，76文件1280项通过，包括build/types/public signatures/strict Main consumer/边界/全部Agent测试。17项既有lint警告保留。测试使用受控模型HTTP，不需要真实API key。全量输出full-check.log；先前5个LLM owner文件173项通过见llm-owner-green.log。

后续按owner维护新增合同，Main只保留实际接线与公共入口回归；不重新复制内部测试到消费者仓库。
