# Alembic note_finding Closure Standard

状态：长期判定标准
维护窗口：AlembicWorkspace
更新日期：2026-05-23

本文只保留长期判定口径。历史形成过程和当时运行证据统一从 [workspace-record-map.md](workspace-record-map.md#note-finding-closure-standard) 查询。

## 判定口径

`note_finding` 的单维度结构化证据写入闭环，不能等同于完整 cold-start 产候选闭环。

三类闭环必须分开判断：

- `note_finding` 单维度写入闭环：模型通过 native tool call 或 runtime 可识别的兼容路径写入 `note_finding`，运行时写入 ActiveContext / memory，QualityGate 读到足够 `memoryFindings` 并让该维度通过。
- native tool call 闭环：必须额外证明 provider 响应里是原生 `tool_calls`，不是文本兼容转译。
- 完整 cold-start 产候选闭环：所有必要维度完成，producer 生成候选，job 正常完成，Dashboard / API 能看到候选和可追踪状态。

## 通过标准

`note_finding` 写入闭环通过必须同时满足：

- 运行日志或结构化事件能证明进入记录阶段或 repair 路径。
- memory / ActiveContext 中存在结构化 finding。
- QualityGate 读取到这些 finding，并把该维度判为可通过。
- evidenceRef / referenced file 足以追溯到真实代码证据。

完整 cold-start 产候选闭环通过必须另外满足：

- job 未被取消或 timeout 截断。
- 必要维度完成。
- candidate / Recipe 产物可被 API、Dashboard 或 Codex 可见入口读取。
- 产物能追溯到对应 source evidence。

## 禁止口径

- 不用页面候选数单独证明 `note_finding` 写入闭环。
- 不用 job 总状态单独证明某个阶段的结构化证据写入。
- 不把兼容文本转译误称为 native tool call。
- 不把单维度通过包装成完整 cold-start 通过。
