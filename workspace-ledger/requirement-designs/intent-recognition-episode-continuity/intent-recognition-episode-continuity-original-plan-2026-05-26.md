# Intent Recognition Episode Continuity 原始计划书

Design Key：INTENT-RECOGNITION-2026-05-26
日期：2026-05-26
状态：用户已确认最终目标方向
维护窗口：AlembicDesign
总控：AlembicWorkspace
Source TODO：`GTODO-2026-05-24-037`

## 用户目标

重建 `GTODO-2026-05-24-037` 的第一阶段目标：先设计 **意图如何被快速识别、如何产出、如何在用户不断开启新会话时保持连续性**。这不是替代消费链路；`INTENT-KNOWLEDGE-2026-05-26` 仍作为第二阶段继续负责 prime / search / evidence / hint 如何消费意图。

现有意图逻辑不做兼容升级，按用户要求直接删除重建。最终目标是让 `prime` 在不等待联网 AI 的前提下，快速产出可解释的当前意图，并把每次意图记录成可跨会话续接的 `IntentEpisode`。

## 用户关键约束

- 不需要做升级，直接删除重建。
- 现在需要明确的不是 `IntentContext` 怎么消费，而是意图怎么得到。
- 必须明确 Plugin 和 Alembic 主体的关系，以及谁使用什么 AI 能力。
- 不是先做知识链路消费设计，而是先设计意图识别与产出。
- `prime` 是快速行为，不能等待 Alembic 去和联网 AI 交互；最多只能使用本地千问。
- 用户开发过程中会不断开启新会话与新意图，因此意图记录必须跨会话连续，而不是只存在当前 MCP session 内存里。

## 当前代码事实摘要

- 当前 Plugin / Alembic 都有 `alembic_task prime`，会从 `userQuery + activeFile + language` 提取轻量意图。
- 当前 `IntentExtractor` 只产出多 query、keyword query、language、module 和 `lint / generate / search / learning` 四类 scenario。
- 当前 `ctx.session.intent` 是内存态；`prime` 会创建新的 active intent，`close / fail` 才会持久化 intent chain。
- 当前 `prime` 注入已能返回 Recipe / Guard 与 `primeKnowledgeMaterial`，但这属于知识注入，不等于可靠的意图识别。
- 当前用户真实开发会跨窗口、跨会话、纠偏、暂停、继续；仅靠 session 内存会丢失意图连续性。

## 最终完成定义草案

第一阶段完成后必须成立：

1. 每次 `prime` 都能快速产出 `RecognizedIntentDraft`，不等待联网 AI。
2. Plugin 必须能用确定性规则完成基础识别；本地千问只允许作为 warm-path refinement，严格限时，超时不阻塞。
3. 每次 `prime` 都立即写入 `IntentEpisode`，不能等 `close / fail` 才记录。
4. 新会话 prime 时能基于 ProjectScope、Design Key、GTODO、文件路径和用户文本，判断本次意图与最近 episodes 的关系：`new / continue / correction / supersede / fork / background`。
5. 意图产出必须带 evidence spans，说明每个判断来自用户原文、代码事实或文档事实的哪一段。
6. 用户纠偏必须能覆盖旧意图，而不是叠加旧误读。
7. Plugin / Alembic 主体 / Core 的职责边界明确，避免 Plugin 自建 AI provider runtime 或 Alembic 主体阻塞 prime。

## 仓库关系初判

| 仓库 / 窗口 | 第一阶段职责 |
| --- | --- |
| AlembicPlugin | 收集 Codex host-agent facts；执行确定性 fast recognizer；写入 / 读取 recent IntentEpisode index；可选调用 resident 本地千问 refinement，但不阻塞 prime。 |
| Alembic | 提供本地 resident 能力；若本地千问已 warm，可提供限时 refinement endpoint；不在 prime path 调联网 AI。 |
| AlembicCore | 暂不先下沉；等 `RecognizedIntentDraft` / `IntentEpisode` 稳定后，再考虑放 schema 和 deterministic helper。 |
| AlembicTest | 后续验证跨会话 continuity 和纠偏覆盖；第一阶段是否需要真实项目由总控决定。 |

## 非目标

- 第一阶段不负责 prime/search/evidence 怎么消费 intent；该目标由 `INTENT-KNOWLEDGE-2026-05-26` 承接。
- 不要求联网 AI 参与 prime。
- 不要求本地千问必须可用。
- 不做 Dashboard UI。
- 不启动 038 file monitor evolution。
- 不启动 039 Plugin no-monitor evolution fallback。

## 总控下一步建议

总控接收后，先做代码事实调研和目标阶段确认：

- 识别当前 `alembic_task prime`、`IntentExtractor`、`IntentState`、SignalBus / JSONL persistence 的真实可替换边界。
- 调研 Plugin 当前可获得的 Codex host-agent facts。
- 调研 Alembic resident 是否已有本地 AI / 千问可用的低延迟路径。
- 确定 `IntentEpisode` 的本地存储位置和跨会话索引策略。
