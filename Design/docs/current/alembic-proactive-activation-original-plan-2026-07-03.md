# Original Plan — Alembic 激活链主动化(安装引导 + 冷启动建议 + 四工具消费)

- Design Key: `alembic-proactive-activation-2026-07-03`
- 日期: 2026-07-03
- 状态: **CG-1~8 全批(2026-07-03;CG-8 补冷启动自动同步 WS-6)**;未 deliver / 未 intake
- 需求设计: [alembic-proactive-activation-2026-07-03.md](alembic-proactive-activation-2026-07-03.md)

## 1. 用户原始诉求(2026-07-03)

> 感觉 AlembicPlugin 四个获取 Recipe 的 MCP(prime/search/recipe_map/graph)没有被更积极地使用……深挖真实代码逻辑,思考真实可靠的落地方案;同时考虑前期安装的引导优化,把安装后的冷启动建议和安装主体 Alembic 都做得更积极。

三条合成一个"激活链主动化"需求:① 四工具被更积极触发消费;② 安装引导更积极;③ 安装后冷启动建议更积极。

## 2. 诊断(4-agent 深挖 + 控制器亲验,详见需求设计 §2/§3)

激活链 `安装 → 冷启动 → KB 填充 → per-project skill 生成挂载 → 宿主加载 → prime → 后三工具` 在七处漏:测量不外露 / cc 宿主可能不加载 `.agents/skills` / install→coldstart 手动易跳过 / prime 非自动且缺席执行协议 / 三工具措辞被动 / prime 导流弱且漏 search / 两层引导(生成导向 vs 消费导向)不一致。

## 3. 目标(完成定义,详见需求设计)

四工具在有真实知识的项目中被宿主积极消费;安装后冷启动建议主动触达宿主(不止 CLI 打印);per-project 主动技能对两个宿主都真加载到 LLM;加使用信号让"积极程度"可测。**空项目仍克制不骚扰**(现有门标定不破),四工具对外输出契约/门禁不变。

## 4. 待用户决策(CG,详见需求设计 §6)

- CG-1 测量先行(加使用信号,先能测再改)。
- CG-2 per-project skill 导出 host-aware(修 cc 加载,头号 P0)。
- CG-3 install→coldstart 主动度(宿主可见建议 vs 自动跑;空项目克制)。
- CG-4 三被动工具措辞改主动 + prime 导流补 search。
- CG-5 MCP onboarding 加"消费循环"playbook(与生成流程并列)。
