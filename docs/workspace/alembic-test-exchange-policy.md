# AlembicTest Exchange Policy

状态：长期规则
维护窗口：AlembicWorkspace
适用范围：总控窗口与 `AlembicTest` 测试验证窗口之间的测试任务、测试结果和证据交流

## 总控职责调整

总控窗口负责：

- 判断是否需要测试、测试目标是什么、为什么现在测试。
- 明确测试输入、触发入口、观察点、完成标准、风险和禁止事项。
- 在专门测试交流文档中创建或更新测试单。
- 把可执行测试任务派发给 `AlembicTest`。
- 验收 `AlembicTest` 回填的结果、证据、风险和下一步建议。
- 根据测试结论调整总控计划、TODO、后续分派或返工任务。

总控窗口不负责：

- 直接启动 / 重启 Alembic 测试运行时。
- 直接点击或触发 cold-start、rescan、clean rebuild。
- 直接监控 Dashboard、Jobs API、daemon 日志或候选产出。
- 直接对真实测试项目做 smoke、复现或回归；这些动作必须通过 `AlembicTest` 测试单执行。
- 在总控窗口内保存测试脚本、测试配置、长期测试报告。

## AlembicTest 职责

`AlembicTest` 负责：

- 读取总控测试交流文档中的测试单。
- 使用 `AlembicTest` 仓库内脚本、配置和文档执行测试。
- 按测试单限制执行，不扩大范围、不修改真实项目业务代码。
- 回填测试结果、证据、日志摘要、失败分类和下一步建议。
- 如果发现产品问题，指出归属仓库和最小复现路径，不在测试仓库内修产品实现。

## 专门测试交流文档

统一测试交流文档是：

```text
docs/workspace/current/alembic-test-exchange.md
```

这个文档用于：

- 总控创建测试单。
- 标记测试任务状态。
- 给出统一可复制提示词。
- 接收 `AlembicTest` 的结果回填摘要。
- 链接 `AlembicTest/docs/` 中的详细测试报告。

注意：

- `AlembicTest` 是独立仓库，不进入 AlembicWorkspace git 跟踪。
- `AlembicTest` 可以按测试单回填 workspace 测试交流文档，但不得提交 AlembicWorkspace 仓库。
- 详细测试报告、脚本配置和测试资产应保存在 `AlembicTest` 仓库内；workspace 交流文档只保留总控需要验收和派发的摘要。
- `AlembicTest` 自身新增或修改的 probe、报告、脚本索引和临时测试资产不要求每轮提交；只要回填证据足够、产品仓库和真实测试项目没有非预期改动，总控不得把 `AlembicTest` 未提交测试资产当作验收阻塞。提交 hash 可以记录为 `无`。

## 测试流程

1. 总控判断需要测试，但不直接测试。
2. 总控在 `docs/workspace/current/alembic-test-exchange.md` 新建或更新测试单。
3. 总控把测试单状态设为 `待启动`，并在当前总控计划 / index 中把 `AlembicTest` 改为可发送。
4. 用户把统一提示词发送给 `AlembicTest` 窗口。
5. `AlembicTest` 按测试单执行，详细记录写入 `AlembicTest/docs/`。
6. `AlembicTest` 在交流文档中回填摘要、证据、报告路径和下一步建议。
7. 总控验收回填，决定：
   - 测试通过，推进下一阶段。
   - 测试失败，分派给对应产品仓库修复。
   - 证据不足，要求 `AlembicTest` 补测。
   - 测试风险不适合继续，暂停并等待用户确认。

## 状态

测试单状态只使用：

- `待确认`：测试目标或数据策略还需要用户确认。
- `待启动`：测试单已经可执行，可以发送给 `AlembicTest`。
- `执行中`：`AlembicTest` 正在执行。
- `待验收`：`AlembicTest` 已回填，等待总控验收。
- `已完成`：总控验收通过。
- `阻塞`：缺权限、缺上游、缺配置或等待用户决策。
- `暂停`：用户或总控明确暂停。

## 最小回填标准

每个测试单至少回填：

- 测试结论：通过 / 失败 / 取消 / 阻塞 / 未执行。
- 触发入口和执行范围。
- 使用配置或关键参数。
- job id / session id / Dashboard URL 摘要。
- 状态变化：active / completed / failed / cancelled / timeout。
- 候选数量或关键产物数量。
- 关键日志信号。
- 真实项目是否保持干净。
- 详细报告路径。
- 建议下一步和归属窗口。
