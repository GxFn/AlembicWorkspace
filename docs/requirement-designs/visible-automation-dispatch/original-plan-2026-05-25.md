# Original Plan: Visible Automation Dispatch

日期：2026-05-25
状态：已确认，进入需求设计
维护窗口：AlembicWorkspace

## 用户原始口径

用户指出当前总控流程存在人工搬运：

```text
现在总控给出提示词，各个窗口输入，这个过程需要我手动输入，如何把我从这个流程中去掉
```

后续用户进一步明确，不接受通过后台 session / headless worker 绕过 Mac Codex 前端：

```text
Codex session 会失去前端可见性，他前端 UI 渲染可能会直接漏掉
我的意思是发给 Codex session 后，codex mac 端 UI 层就看不到窗口输出了
```

用户提出期望模型：

```text
我的所有 codex 窗口可以被唤醒，然后来调用一个 pull 检查是否有任务执行，从任务列表里取自己的任务执行
```

在验证 Codex thread automation 后，用户确认它更接近最初目标：

```text
我注意到这个自动化很像，我最开始想的那种，就是从主控发送消息给其他窗口
```

最终用户要求：

```text
把这个做成一个需求文档，我交给总控窗口开始走开发
```

## 总控理解

- 当前手工流程是：总控文档写出 `发送给` 和可复制提示词，用户复制到对应 Codex 窗口，执行窗口再读取总控文档并回填。
- 目标不是让后台 worker 替代窗口，而是让目标 Codex 可见窗口收到一条可见消息，并在自己的上下文中读取任务队列、领取任务、执行和回填。
- Codex thread automation 已验证能把 prompt 作为 Mac 前端可见消息投递到指定 thread，消息 UI 显示“通过自动化发送”。
- 官方 / 本地 API 目前没有 `run now`、`trigger now` 或 sub-minute automation 调度接口；automation 调度可作为 0-60 秒级 armed dispatch，不作为秒级即时通道。
- 总控应保留需求门禁、确认门禁、发送窗口判断和任务状态；自动化只替代人工复制提示词，不替代总控裁决。

## 已验证事实

### Lark Remote / 会话发现

- `codex_lark_start` 可启动本地 bridge。
- `codex_lark_takeover_targets` 能列出当前项目下 Codex 会话记录，包含活跃 / 空闲状态、thread id、cwd 和更新时间。
- Lark Remote 输出明确提示：它列出的是 Codex 会话记录，不是 macOS 原生窗口枚举；但这些会话足以作为 `窗口名 -> threadId` 注册表来源。

### Thread automation 可见投递

- 一次性 heartbeat 被用户手动 Run 时，可以把 heartbeat XML 消息投到当前可见 thread。
- 重新创建 `FREQ=MINUTELY;INTERVAL=1` heartbeat 后，调度器在约分钟级触发，当前可见 thread 收到消息并完成测试队列。
- Mac 前端 UI 显示该消息来源为“通过自动化发送”，证明它不是纯后台执行，而是可见 thread 消息投递。

### API / 文档限制

- `codex_app.automation_update` 只支持 `create` / `update` / `view` / `delete`，没有可调用的 `run now` / `trigger now`。
- 本地 `codex app-server generate-ts/json-schema` 生成的 app-server 协议有 `thread/start`、`thread/resume`、`turn/start` 等 rich client 方法，但没有 automation trigger API。
- 官方 Codex Automations 文档描述 thread automation 是 attached to current thread 的 heartbeat-style recurring wake-up，支持 minute-based intervals、daily、weekly；未承诺 sub-minute 或事件触发。

## 当前目标

设计并实现一个“主控 armed automation dispatch”能力：

1. 总控读取当前计划或结构化 dispatch queue，判断哪些窗口需要领取任务。
2. 总控通过已注册的窗口 thread id 给目标可见 Codex thread 创建一次 armed heartbeat automation。
3. 目标窗口收到可见 automation 消息后，只做 pull：读取任务队列，确认任务属于自己，claim/lock，执行，回填证据。
4. 目标窗口完成或确认无任务后删除本次 automation，避免重复唤醒。
5. 用户不再手动复制提示词，但仍能在目标 Codex 窗口看到完整执行过程。

## 非目标

- 不以 `codex exec` headless worker 替代可见执行窗口。
- 不把 app-server 后台 `turn/start` 当成第一版目标投递路径。
- 不承诺秒级即时发送；第一版接受 0-60 秒调度延迟。
- 不绕过用户确认门禁、权限审批、删除 / 降级 / 改范围确认。
- 不让自动化直接执行总控未分派、未确认或状态不允许的任务。

## 第一版完成判断

- 至少一个目标窗口可被注册为 `windowName -> threadId -> cwd`。
- 总控可为该窗口创建 armed heartbeat automation。
- 目标窗口收到可见 automation 消息，读取结构化队列并 claim 自己的任务。
- 目标窗口只修改允许的测试队列 / 回填文档，完成后删除 automation。
- 总控能读到回填证据并确认不需要用户手动复制提示词。
