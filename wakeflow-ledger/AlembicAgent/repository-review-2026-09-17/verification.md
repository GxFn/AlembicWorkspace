# 验证与实际限制

最终复验于 2026-09-18 完成，命令退出码 0。完整原始输出在仓库 ignored `tmp/repository-review-2026-09-17/full-check-final.log`；便于长期保留的 [门禁摘要](evidence/full-check-summary.log) 已去除本机绝对路径和冗长 fixture 输出。

## 基线与最终结果

| 项目 | 起点 | 最终 |
| --- | --- | --- |
| 环境 | 默认 Node 24.19.0，已有 native 模块为 Node 22 ABI | Node 22.23.2，与 workspace native 模块及 CI 一致 |
| 测试 | 73 文件、609 用例；576 通过、33 失败 | 71 文件、740 用例；全部通过 |
| 基线失败解释 | 13 项 SQLite ABI 不匹配；20 项错误的 Core 公共子路径导入 | 使用匹配 Node 验证，并修正实际过期 import |
| TypeScript | 通过 | 通过 |
| Biome | 通过，有 21 个 warning | 通过，有 17 个非阻断 warning |
| 公共包入口 | 固定 15 个 | 15 个 exact exports、451 个导出绑定与快照一致 |
| 工作区差异 | AGENTS.md、CLAUDE.md 已有修改 | 两文件既有改动保留；本轮产品 diff 未提交 |

17 个 Biome 提示为脚本中的显式 console 输出及用于测试源码/攻击输入的字面 `${...}`，不是失败门禁；没有通过关闭 lint 规则掩盖它们。

## 执行过的命令

使用本仓 ignored 缓存中的 Node 22.23.2：

```sh
PATH="$PWD/tmp/npm-cache/_npx/52027bd8fc0022aa/node_modules/.bin:$PATH" npm run check
```

该命令实际完成：typecheck、Biome、Agent/public/Core import boundary、space-edge、layer-contract、side-effect doctrine、命名、provider-neutral kernel、clean build、公共签名、真实相邻 Alembic strict consumer、新进程证据/生产链探针、validation floor、全量 Vitest、retired-symbol 检查。

额外执行并通过：

```sh
node scripts/smoke-agent-public-imports.mjs
node scripts/eval-strict-production.mjs --out tmp/repository-review-2026-09-17/strict-eval-report.json
git diff --check
```

以上 Node 命令同样使用 Node 22 PATH。公共导入检查验证 15 个允许入口和 11 个禁止入口。Frozen 评估通过，但只代表 fixture 接线和确定性合同，不代表真实模型质量或人工校准。

发布脚本在隔离的临时 Agent/Core Git fixture 中验证了：registry Core 版本转换、源 manifest 不变、中英文 README 均被 staging 和 pack、Core dirty 时拒绝且不覆盖已有 staging，结束后临时根清理。见 [发布验证记录](evidence/release-stage-fixture.log)。

真实 workspace 运行 `node scripts/stage-agent-publish-package.mjs` 按设计拒绝：相邻 Core 有未提交改动，无法给出明确 source commit。本轮没有发布需求，也没有修改相邻 Core 或绕过该发布门禁。

## 修复证据与验证诚实性

- 大多数缺陷先增加实际行为回归并记录 RED，再修复及记录 GREEN；最终全部执行验证统一收口。
- 风格 JSON 与搜索 cache 两条最初新增 fixture 形状有误，不能将最初失败计作缺陷证据。已纠正，并用 HEAD 原实现重新记录 `style-json-baseline-red.log`、`search-cache-baseline-red.log`。
- 复审发现的嵌套恢复、中文预算、写/读缓存混淆、build symlink、codemod 级联、无效 sources、工具失败优先级和超时恢复均补入回归。
- 最后一次批量结果不可变性回归先出现 1 fail / 20 pass，修复后纳入最终 740 项通过；没有通过删掉失败场景让测试变绿。
- 逐文件审阅、代理静态复核和历史产物本身不等于测试执行通过。三份 disposition 报告已明确各自的证据边界，最终运行结果由上述总门禁提供。

## 保留的边界与后续

1. Provider 验证全程使用本地 mock/fixture，没有使用真实 API key；没有声称验证远端服务可用性。
2. 当前 native 依赖在 Node 22 下验证。切换 Node major 需匹配安装或重建 native 模块；本轮未为了 Node 24 在相邻 Core 执行重建。
3. 宿主继续负责 sandbox、approval、持久化端口注入。现有可观测降级路径保留，基础参数校验不冒充完整递归 JSON Schema。
4. 仍有真实消费者的公开 contract/barrel/adapter，以及 PCV 默认观测语义保留；进一步改变它们属于契约设计，不作为无引用代码删除。
5. 未在远程 CI 实际发起运行，CI 配置与本地对应命令已验证。Core 或真实宿主随后变更时，需要重跑联调门禁。
6. 正式发布前让 Core owner 提供干净且明确的来源状态，再执行 staging。本轮改动留为可审阅 diff，no-commit 原因是保留用户既有变更并避免未经请求混合提交。
