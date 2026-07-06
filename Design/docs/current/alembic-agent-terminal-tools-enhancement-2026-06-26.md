# AlembicAgent 终端工具检查 + 增强主体 Agent — 需求设计(strict)

Date: 2026-06-26
Status: requirement-design (ready-for-controller-intake)
Source Window: Design
Design Key: alembic-agent-terminal-tools-enhancement-2026-06-26
Scope: AlembicAgent(工具引擎)+ Alembic 主体(终端适配执行端)+ AlembicCore(BootstrapTerminalToolset 工具广告)
Grounding: 5-agent 跨仓代码级测绘(~799K tokens,全 file:line 接地,静态核实未跑真机)

## 触发与定位

检查 AlembicAgent 的终端工具:现在能提供哪些**真实、有价值、好用**的终端能力来**增强 Alembic 主体的 in-process Agent**,工具系统存在什么问题,出真实落地方案。

**核心结论(一句话)**:主体 Agent 的「好用终端」**大部分已存在且端到端通**(`code.*` 全套 read/grep/outline/structure/edit + `terminal.exec` 真 Seatbelt 沙箱;scan/relation/bootstrap 的 analyze 阶段**现在就能跑 git/grep/test 取证**)。真实工作**不是加工具**,是三件事:**①接缺口**(Evolution profile 明文禁终端→Recipe 衰退判定缺时间维度证据,最高 value)、**②收硬化**(live `terminal.exec` 安全模型偏弱+无审计+cwd 前缀 bug)、**③定双轨去留**(一整套 governed 富终端栈对 in-process Agent 完全不可达,且 prompt 还在广告 Agent 拿不到的 phantom 工具名)。

## 1. 真实架构:两条终端栈,只有一条对 Agent 通电

```
in-process AI (主体 @alembic/agent)
   │ AgentRuntime(config.toolRouter) → ToolRouterAdapter → 主体 ToolContextFactory(注入真 SandboxExecutor)
   ▼
【LIVE 栈】AlembicAgent tools/runtime:TOOL_REGISTRY(6 工具 code/terminal/knowledge/graph/memory/meta)
   → ToolRouter(校验+capability allowlist+并发锁+token 截断)
   → handlers/terminal.ts 单一 `terminal.exec`(child_process.exec + Seatbelt + 子串黑名单 + cwd 守卫 + OutputCompressor)
   profile 真实工具门 = capability.allowedTools(System/ScanAnalyze/BootstrapAnalyze 给 terminal:['exec'];Evolution/Produce/Conversation 不给)

【DEAD 栈(对 Agent 不可达)】
   AlembicAgent tools/terminal/{capabilities,policy,session,envelope}:6 个 governed manifest(terminal_run 结构化 execFile / terminal_script / terminal_shell -lc / terminal_pty 真 PTY / session_*)+ 结构化 TerminalShellPolicy(远强于 live 黑名单)+ audit envelope
   主体 tools/adapters/terminal-adapter/*:**真实现的 executor**(RunExecutor/ShellExecutor/ScriptExecutor/PtyExecutor python pty.fork/SessionExecutor + TerminalAudit + MacSystemAdapter)+ Seatbelt
   注册进 UnifiedToolCatalog/toolRegistry(AgentModule.ts:69-104)→ **但 toolRegistry 无 in-process Agent 消费方**(只剩一个 type ref ServiceMap.ts:153)
   + LightweightRouter(manifest 路由,零实例化)
```

**关键澄清(避免误判)**:① 富终端栈的 executor **不是空壳**——主体真实现了 execFile/spawn/PTY+沙箱+审计+session,只是注册进了**无 Agent 消费方**的目录;② 第二条工具路 `toolRouter`(HTTP `/ai` 路由用)才是 live 给 Agent terminal.exec 的路;③ **read/grep/git/test/file-edit 不是缺口**(code.* + terminal.exec 都 live)。

## 2. 真实终端能力清单(live/dead + value + 安全)

| 能力 | 层 | file:line | wired | value | 说明 |
|---|---|---|---|---|---|
| `terminal.exec`(单一 live 终端) | Agent runtime | `handlers/terminal.ts:62-162` | **live** | high | child_process.exec + Seatbelt(沙箱由主体 ToolContextFactory 注入)+ 子串黑名单 + cwd 守卫 + 120s 上限 + OutputCompressor |
| `code.*`(read/search/outline/structure/write/exec) | Agent runtime | `registry.ts:21 CODE_SPEC` | **live** | high | 富文件/AST/grep/编辑工具集——read/grep/edit **非缺口** |
| OutputCompressor + parsers(git/test/lint/grep/tree 结构化压缩) | Agent runtime | `compressor/OutputCompressor.ts` | **live** | high | 把 terminal.exec 输出压成可引用证据,是 grounding 的真实增益 |
| SandboxExecutorBridge(Seatbelt 注入) | 主体 | `tools/v2/ToolContextFactory.ts:61` | **live** | high | live exec 走真沙箱的唯一来源(network=none/fs=project-write,硬编码无 allowlist) |
| capability profiles allowedTools | Agent runtime | `capabilities/{System,ScanAnalyze,BootstrapAnalyze,Evolution}.ts` | **live** | high | 真实工具门;Evolution **无 terminal** |
| terminal_run/script/shell/pty governed manifest + 结构化 TerminalShellPolicy | Agent tools/terminal | `terminal/capabilities/TerminalExecutionCapabilities.ts:14-191`;`policy/TerminalShellPolicy.ts:88-193` | **dead** | medium | 结构化 execFile/PTY + 强策略(network/fs/sensitive-env/危险载荷/PTY 边界)——比 live 强但未接线 |
| 主体 terminal-adapter executors(真实现) | 主体 | `terminal-adapter/{TerminalRunExecutor,TerminalShellExecutor,TerminalScriptExecutor,TerminalPtyExecutor,TerminalSessionExecutor}.ts` | **dead(对 Agent)** | medium | 真 execFile/spawn/PTY+沙箱+artifact;注册进无消费方的 toolRegistry |
| TerminalAudit(执行审计落盘) | 主体 | `terminal-adapter/TerminalAudit.ts:19` | **dead** | medium | 只被 dead executor 调;**live terminal.exec 零审计** |
| InMemoryTerminalSessionManager(持久会话) | 主体 | `TerminalSessionManager.ts:54` | **dead** | low | TTL/env 续接;仅 InMemory(多 worker 丢失) |
| MacSystemAdapter(mac_system_info/permission_status) | 主体 | `MacSystemAdapter.ts:22` | live(非 Agent) | low | **名不副实**:只读探针,无 osascript/AppleScript/截图/通知等真 Mac 增强 |
| LightweightRouter / UnifiedToolCatalog | Agent | `core/LightweightRouter.ts`;`catalog/UnifiedToolCatalog.ts` | **dead** | medium | manifest 路由 + 合一目录,零实例化/零 Agent 消费 |
| BootstrapTerminalToolset(per-stage 工具广告) | Core | `BootstrapTerminalToolset.ts:23-27,82-83` | partial | medium | 按 stage 发 additionalTools+prompt;default 'terminal' live,但**广告 phantom `terminal_shell`/`terminal_pty`** |

## 3. 工具系统问题(逐条 file:line + severity)

- **[high] Evolution profile 完全无终端,且 promptFragment 写死「不使用终端工具」**(`Evolution.ts:15-22,34`)→ Recipe 进化决策(evolve/deprecate/skip)只能静态 code.read,**无法跑 git log/blame/grep/测试验证 Recipe 描述的代码事实是否仍成立/是否真衰退**。衰退判定本质需**时间维度证据**(commit 历史/最近改动),静态读码拿不到。且 AnalyzeGroundingGuard 反而**要求** terminal 证据(`:59 nudge`)——最该接终端却被明文禁。
- **[high] 双轨未收口**:live 单一 `terminal.exec` 与 dead 富栈(run/script/shell/pty/session + 强 policy)长期并存,kernel convergence 只收了引擎契约、**没收终端**;富栈对 Agent 不可达(`AgentModule.ts:69-104` toolRegistry 唯一消费是 type ref)。
- **[high] prompt 广告 phantom 工具**:`BootstrapTerminalToolset.ts:23-27,82-83` + `insightAnalyst.ts:492` 指示 AI 用 `terminal_pty`/`terminal_shell`,但 Agent 的 TOOL_REGISTRY **只有 `terminal.exec`**→ AI 调不存在的工具(幻觉/失败工具调用)。
- **[medium] live 路径零审计**:dead 栈有完整 TerminalAudit,但 live `terminal.exec`(及 code.* exec)**不留任何审计**(actor/command/policy/sandbox)。CLAUDE.md 要求 full auditLevel,实际 live 路无审计。
- **[medium] cwd jail 前缀匹配 bug**:`terminal.ts:81` `cwd.startsWith(projectRoot)` 无分隔符边界→`/work/proj` 放过兄弟 `/work/proj-evil`。应 `path.relative`/分隔符边界。
- **[medium] live 安全弱于 dead 引擎**:`checkCommandSafety:171-211` 子串/首词黑名单(易被变量/引号/路径绕过、不擦敏感 env、无 per-mode network/fs);dead `TerminalShellPolicy` 结构化 deny(`detectDangerousShellPayload`/sensitive-env/network/fs)远稳健却接错了面。
- **[medium] 三套重叠 catalog/registry**:RuntimeCapabilityCatalog(live)、UnifiedToolCatalog+CapabilityCatalog(dead)、agent/capabilities/CapabilityRegistry(AgentRuntime 用)都建模「工具目录」,职责重叠。
- **[medium] terminal_script 未沙箱**(dead 栈内):`TerminalScriptExecutor.ts:52` 用裸 execFileAsync 而非 sandboxedExecFile,是唯一绕过 Seatbelt 的路径(多行脚本恰最易藏危险操作)——若复活须先修。
- **[medium] TerminalSessionManager 仅 InMemory**:进程重启/daemon 多 worker 丢全部 session,「跨调用续接 cwd+env」在多进程 daemon 不成立。
- **[medium] terminal_pty 硬依赖 python3 无探测**:`TerminalPtyRunner.ts:18` 直接 `bin:'python3'`,缺失则运行期失败而非能力级降级。
- **[medium] TerminalAudit 无 sink 静默 no-op**:`TerminalAudit.ts:24` 找不到 sink 直接 return,审计完整性「看注入」而非「必达」,须核 daemon/HTTP/CLI 三入口是否都注入。
- **[medium] AnalyzeGroundingGuard 默认 off + 仅 DeepSeek-V4 首轮**:`:19 AP-3` 全局默认关、`:44-52` 只对 invalid-no-evidence 首轮生效→grounding 实为**软提示**,无机制保证 analyze 断言前真取证。(与 [[alembic-agent-pcv-observe-only-boundary]] PCV 需求同域。)
- **[medium] System capability(terminal+code.write 全功能)无 profile 使用**(`System.ts:7-27` 注册 'system_interaction' 零引用)→ 完整「探索+终端+写」能力是死代码,主体若要 agentic 写盘任务无现成 profile 承接。
- **[low] tool id 命名双轨**('terminal' vs manifest 'terminal_run');**fallback plain-exec 静默丢沙箱**(`terminal.ts:146-162` sandboxExecutor 未注入降级 plain exec,非 macOS/测试环境绕过 Seatbelt);主体 `tools/v2/` 命名漂移(→归命名重构在途)。

## 4. 增强主体 Agent 落地方案(value 排序,分阶段)

> 原则:**in-process Agent = read-mostly grounding 终端**(不是通用写 shell);写权限留在 `code.write`(单独 + 受门控);安全收口优先。

- **E-1【最高 value:Evolution 接受证式只读终端】**:给 `Evolution` capability(`Evolution.ts:15-22`)增 **allowlist 只读验证终端**(git log/blame/diff、test、tsc、lint、build、grep),改 promptFragment(`:34`)允许并引导用时间维度证据验证 Recipe 衰退;让 AnalyzeGroundingGuard 从「block-only」变「ground-and-advance」。**接入点**:Evolution capability allowedTools + 一个 scoped read-only 终端能力(命令 allowlist,fs 只读 intent)。**与 Recipe 伞形需求 evolution 阶段协同**(衰退判定的真实 grounding)。验收:evolution run 跑 git/test 取证、proposal evidence 含可复核终端输出。
- **E-2【最高 safety:硬化 live terminal.exec】**:把 dead 栈结构化 `TerminalShellPolicy`(DENIED_BINS/detectDangerousShellPayload/sensitive-env scrub/per-mode network·fs intent)**移植到 live exec 路**替换脆弱子串黑名单;修 cwd jail(`:81` path.relative 边界);**给 live 路加审计**(复用 TerminalAudit,三入口必注入 sink,no-op→报错);sandbox-degrade 从静默改为**显式 diagnostic**(`:146-162`)。验收:绕过测试(变量/引号 rm -rf 被拦)、cwd 兄弟目录拒绝、每条 live exec 留审计、无 sink 时报错而非静默。
- **E-3【架构:定双轨去留】(Confirmation Gate)**:dead 富栈(run/script/shell/pty/session + LightweightRouter + UnifiedToolCatalog + 主体 terminal-adapter)三选一:**(a) 删**(无真实消费,减面)/**(b) 接成 live 第二 action**(把 `terminal_run` 结构化 execFile + 可选 `terminal_pty` 接到 Agent 表面,获结构化/PTY/审批/审计)/**(c) 维持 exec-only + 删富栈**。**Design 建议:(c) 或最小 (b) 只接 terminal_run**(结构化 execFile 比 shell-string 更安全),不复活 PTY/session 除非有真实消费需求;无论哪种都**修 terminal_script 未沙箱 + 删 phantom 广告**。
- **E-4【correctness 便宜:删 phantom 工具广告】**:`BootstrapTerminalToolset.ts:23-27,82-83`/`insightAnalyst.ts:492` 只广告 Agent 真能调的工具(默认只 `terminal`/exec),停止指示 AI 用 terminal_pty/terminal_shell;与 E-3 决定的实际工具集对齐。
- **E-5【medium:scan/relation prompt 引导 + 可选启用 grounding 强制】**:scan/relation/bootstrap 已有 terminal 但 prompt 未引导用 git/测试取证→补 prompt 引导;是否打开 AnalyzeGroundingEnforcement(`:19`)**与 PCV observe-only 需求协调**(那个需求已定 guard 默认关、per-run 开)。

## 5. 安全暴露原则(终端=权力,须明确)
- **in-process Agent 默认 = read-mostly grounding**:命令走 **allowlist**(git/test/tsc/lint/build/grep/ls/find 只读验证类),fs intent 只读,network none。
- **写盘** = `code.write` 单独路径(受门控),**不**通过通用终端给 Agent 任意写 shell。
- **审计必达**:live 路每条 exec 留审计(三入口注入 sink,缺失报错)。
- **沙箱必达**:sandbox-degrade 显式 diagnostic,非静默 plain exec。
- **结构化优于 shell-string**:优先 execFile(bin+args)避免注入。
- **主体 in-process 模型边界**:主体自己跑命令(非 host agent 代跑),沙箱+allowlist+审计是底线。

## 6. 跨仓职责 + 与在途/前序非重叠
- AlembicAgent(capability allowedTools/Evolution profile/promptFragment/live terminal handler 硬化/policy 移植/catalog 收口)+ 主体(SandboxBridge allowlist/审计 sink 注入/双轨去留执行)+ Core(BootstrapTerminalToolset phantom 广告修正)。
- **不重做**:Agent V1/V2→kernel convergence(引擎契约已 COMPLETE);主体 `tools/v2/` 命名漂移归 [[alembic-recipe-lifecycle-naming-layering-refactor]](命名重构在途,不在此改);主体 plan 适配在途不碰。
- **协同**:E-1 Evolution 终端取证与 [[alembic-recipe-lifecycle-global]] 伞形 evolution 阶段(衰退判定 grounding)同域,须协调;E-5 grounding 强制与 [[alembic-agent-pcv-observe-only-boundary]] PCV 需求协调(guard 默认关)。
- 残留:AlembicAgent CLAUDE.md「工具系统 V1 退役登记(2026-06-11)」节失真(仍称 tools/v2 为主系统/ToolForge,实际已删)——**已有等价 spawn_task chip**,不重立。

## 7. 范围:拥有 / 不拥有
**拥有**:终端工具检查结论(两栈清单+问题);Evolution 证式只读终端接缺口(E-1);live terminal.exec 硬化+审计(E-2);双轨去留决策与执行(E-3);phantom 广告修正(E-4);安全暴露原则固化。
**不拥有**:kernel convergence(已完成);tools/v2 命名(归命名重构);plan 适配(在途);真 Mac 增强能力(MacSystemAdapter 现只读探针——若需 osascript/自动化是另需求,不在本轮)。

## 8. 待决 Confirmation Gate
| # | 决策点 | 选项 | Design 建议 |
|---|---|---|---|
| **CG-1** | 双轨去留(E-3) | (a)删富栈 /(b)接 terminal_run(+pty)上 live /(c)维持 exec-only+删富栈 | **(c) 或最小 (b) 只接 terminal_run**(结构化更安全);不复活 PTY/session 除非有消费需求 |
| **CG-2** | Evolution 终端范围(E-1) | 只读 allowlist / 全 exec | **只读 allowlist**(git/test/tsc/lint/build/grep) |
| **CG-3** | 安全模型(E-2) | 子串黑名单→结构化 allowlist;allowlist 命令集 | **结构化 allowlist**(移植 TerminalShellPolicy + 只读验证命令集) |
| **CG-4** | 是否给 in-process Agent 写终端 | 给 / 不给(写留 code.write) | **不给**(read-mostly grounding;写走 code.write 受控) |
| **CG-5** | grounding 强制(E-5) | 打开 enforcement / 维持软提示 | **与 PCV 需求协调**(默认关、per-run 开),本需求不单独打开 |
| **CG-6** | MacSystemAdapter | 保留只读探针 / 扩真 Mac 能力 / 删 | **保留只读**(扩 Mac 自动化是另需求,本轮 out-of-scope) |

**全部 CG-1~6 已闭合(2026-06-26 用户全部采纳建议)**:CG-1 维持 exec-only 或最小接 terminal_run / CG-2 Evolution 只读 allowlist / CG-3 结构化 allowlist(移植 TerminalShellPolicy)/ CG-4 不给 in-process Agent 写终端 / CG-5 grounding 强制与 PCV 协调(默认关)/ CG-6 MacSystemAdapter 保留只读。残留(AlembicAgent CLAUDE.md V1 退役节失真)经 spawn_task chip 清理。代码级落地见 §10。

## 9. 风险
- **安全/越权(最高)**:终端=任意命令执行;allowlist/沙箱/审计任一缺失=真实安全洞。E-2 硬化是前置,接任何更强终端前必须先收口 live 安全。
- **命令注入**:shell-string(terminal.exec/terminal_shell)比 execFile 易注入;偏好结构化。
- **phantom 广告致 AI 失败**:E-4 不修则 AI 持续调不存在工具。
- **与在途 churn**:Evolution 终端取证须与伞形 evolution 阶段协调(同改 evolution 域);命名(tools/v2)让位命名重构。
- **审计/沙箱「看注入」**:三入口(daemon/HTTP/CLI)须都注入 sink+sandboxExecutor,否则 best-effort。
- **静态核实**:本设计未跑真机;接终端/改 policy 后须真机 e2e(agent 跑 git/test 取证、绕过测试、沙箱 enforce)。

## 10. E-1~E-5 全阶段代码级落地 + 验收(authoritative,4-agent grounding 2026-06-26)

> Grounded@HEAD:AlembicAgent `953e665` / Alembic `2090793` / AlembicCore `2a52874`。6 CG 固化。**安全优先**:read-mostly grounding、allowlist、不给写、审计/沙箱必达。

### E-2 硬化 LIVE exec(安全前置,独立先落)
- **E2-1 新建 `AlembicAgent/src/tools/runtime/handlers/terminalSafety.ts`**(add):**只复制** `TerminalPolicyShared.ts:10-20 DENIED_BINS` + `:142-185 detectDangerousShellPayload` 两个 input-agnostic 原语 + `checkCommandSafety` wrapper——**不 import dead 栈**(避免抢 E-3/CG-1 决策、不让 dead 树成 live 消费方)。
- **E2-2 替换子串黑名单**(`terminal.ts:171-211`,删 `:28-40/:43-44/:47-60` 本地 deny 常量,retire)→ import terminalSafety;关闭 `includes('sudo ')` 空格/引号绕过。
- **E2-3 修 cwd 牢笼**(`terminal.ts:79-83`,extend):`startsWith` → `path.relative` 边界(`rel.startsWith('..')||isAbsolute`),修 `/a/proj` 错收 `/a/proj-evil`。
- **E2-4 ToolContext 加可选 `auditSink?`**(`registry.ts:127-131`,extend,duck-typed `{log(entry)}` 镜像 AuditLogger.log,host-agnostic 不依赖主体类型)。
- **E2-5 live exec 落一条审计**(`terminal.ts:92-120`,extend):成功+catch 两路调 sink,action `terminal.exec`、result、duration、`data.commandHash=sha256(command)`(**存 hash 不存原文**);try/catch 吞,审计绝不改 tool result。
- **E2-6 单 DI factory 接 sink 覆盖三入口**(`Alembic/lib/tools/v2/ToolContextFactory.ts:127-152`,extend):`auditSink: tryGet('auditLogger')`(已注册 `InfraModule.ts:65`,`AuditLogger.log` 落 AuditStore+发 Dashboard);`toolContextFactory` 是单容器 singleton→**一处 wiring 覆盖 daemon/HTTP/CLI**。
- **E2-7 沙箱降级显式**(`terminal.ts:129-169` + bridge `ToolContextFactory.ts:84-97`,extend):bridge 透传 `sandboxed/degradeReason`(现 `:96` 丢弃);`sandboxed===false` 设 `_meta.fallbackUsed=true`+`[unsandboxed:<reason>]` prepend;plain-exec fallback 同样报。纯诊断,不改命令是否运行(CG-4/6 不变)。

### E-1 Evolution 只读 allowlist 终端(接缺口,复用 E-2 同 chokepoint)
- **E1-1 CapabilityDef 加 `commandAllowlist?:{bins:string[]}`**(`kernel/registry.ts:176-181`,extend,声明式 CG-3,可选不影响其它 capability)。
- **E1-2 router 注入 ctx**(`router.ts:68` 旁,extend):`ctx.commandAllowlist=this.#config.capability?.commandAllowlist`(router 唯一持 CapabilityDef 处);**不改 action gate**,是更细第二道闸(纵深防御)。
- **E1-3 ToolContext 加 commandAllowlist**(`registry.ts:127-131`,extend,可选缺省=无限制保 System/Scan/Bootstrap 行为)。
- **E1-4 chokepoint enforce 正向 allowlist + 拒 shell-meta**(`terminal.ts:73-90`,extend):仅当 `ctx.commandAllowlist` 存在→首 token bin 不在 bins 则 fail;**强制拒 `;`/`&&`/`||`/`|`/backtick/`$(`/`>` 走私**(复用 `containsShellMeta`,否则 allowlist 是 theater);纯加性,undefined 时 byte 一致。
- **E1-5 Evolution 授权 + 声明 allowlist**(`Evolution.ts:15-22`,extend):allowedTools 加 `terminal:['exec']` + `commandAllowlist` 只读 bins(见 §下);无写 bin(CG-4)。
- **E1-6 toDef 投影 allowlist**(`RuntimeCapability.ts:21-32`,extend):基类加 `get commandAllowlist()`,toDef 复制——**不接通则字段死(静默 no-op)**,验收硬守。
- **E1-7 改写 promptFragment**(`Evolution.ts:34`,extend):删「不使用终端工具」→允许只读终端验证 Recipe 衰退(git log/blame、grep、test/tsc/lint),保留「不提交新知识」。

### E-3 双轨去留(CG-1 决策门 E3-0,两条发散落地集)
- **分支 A(维持 exec-only,删 dead)**:删 Agent `tools/{terminal/*,core/LightweightRouter.ts}` + 主体 `tools/adapters/terminal-adapter/*`+MacSystemAdapter 等 + `AgentModule.ts:68-103` dead wiring;**保 `UnifiedToolCatalog`**(是 live `runtime.toolRegistry` manifest store,risk-hint 用)。⚠️ 退 `@alembic/agent/tools/terminal` **public subpath = 契约变更**(interface-contract demandKey,须总控确认在 scope)。
- **分支 B(最小接 terminal_run)**:`registry.ts TERMINAL_SPEC:144` 加 action=run 接 `TerminalRunExecutor`(结构化 execFile+沙箱);**精切** terminal-adapter 保 run+sandbox/audit、删 script/shell/pty/session;**必删** `TerminalScriptExecutor.ts:52`(唯一未沙箱 execFileAsync,CG-1 禁复活)。
- **✅ 已定 = 分支 A**(2026-06-26 用户):删 dead 栈、维持 exec-only;退 `tools/terminal` public subpath 走总控确认;修 terminal_script(删)+ 删 phantom。

### E-4 删 phantom 广告
- **E4-1 Core toolset 停广告**(`BootstrapTerminalToolset.ts:3-33`,retire):删 shell→`terminal_shell`/pty→`terminal_pty` 映射,塌缩成 live router 可解析 id(`testMode.ts:75` 默认已 terminal-run)。
- **E4-2 删 analyze prompt phantom**(`insightAnalyst.ts:492`,retire;同 `insightEvolver.ts:241`/`insightProducer.ts:280-285`)。
- **E4-3 WorkflowReportWriter 计数清理**(`WorkflowReportWriter.ts:307,330-348`,extend,report 观察者非广告者,cleanup)。
- 跨仓序:**Core 先落+build:check → 重 vendor 进 `AlembicPlugin/vendor/AlembicCore` → Plugin 测试后更**(忘重 vendor 则 Plugin 仍广告 phantom + 测试 green-but-wrong)。

### E-5 prompt 引导 + grounding 协调
> ⚠️ **落点订正(必读)**:scan/relation/bootstrap 的 `*.profile.ts` **无 prompt 文本**,真指引在 `ANALYST_SYSTEM_PROMPT`(`insightAnalyst.ts:80,107`)+ `buildAnalystPrompt`(`:486-493`)。**改 profile.ts = 假进展。**
- **E5-4 ANALYST_SYSTEM_PROMPT:107**(extend,**E-5 真正修复处**,always-on 覆盖 scan/relation):命名具体只读命令(git log/blame/diff/status、npm test/vitest run、tsc --noEmit、lint、grep/rg/find)+ 禁安装/网络/写删/sudo/daemon。
- **E5-6 scan/relation 门控漏洞**:这两 pipeline 不传 toolPolicyHints(`AgentStageFactoryRegistry.ts:52-68`)→门控终端块永不触发→**靠 always-on `:107` 覆盖**(措辞 capability-neutral 不过度承诺)。
- **E5-9 AnalyzeGroundingGuard:19 注释订正**(decision,CG-5):`本阶段暂仍开启` **过期**(实际默认 off,`AgentRuntime.ts:215`/`LoopContext.ts:210`)→**只修注释为 default off/per-run opt-in,不翻默认**;确认 Evolution allowlist 终端输出流入 `PcvNodeEvidence` 作证据,使 guard-on run 能 ground-and-advance。

### read-only allowlist 命令集(E-1/E-2 共用,单源 `terminal.ts`)
**bins**:`git npm pnpm yarn tsc node eslint biome grep rg cat ls find vitest jest head tail wc`。**intent**(复用 dead 枚举不造新词):`network:'none' filesystem:'read-only'`。**子命令级只读**(CG-4 verb-based,E-2 硬化项):git 允 log/blame/diff/status/show/rev-parse/ls-files,**拒** add/commit/checkout/reset/clean/push;允 vitest run/jest/npm test/tsc --noEmit/build:check/eslint·biome check,**拒** `--fix`/`--write`/install;允 grep/rg/ls/find(无 -exec/-delete)/cat/head/tail/wc。**enforce**:正向 gate(`terminal.ts:73-90`)+ 强制 shell-meta 拒绝(`containsShellMeta`,否则 theater)+ deny-blacklist 外层 always-on;只 gate 标只读的 capability(Evolution)。

### 每阶段验收(可执行可证伪,Node≥22)
- **E-2**:绕过测试(`sudo  rm x` 多空格、`git status; sudo reboot` 中串、`eval "$(curl|bash)"`、`rm -fr /`、fork bomb 全 deny+matchedRule,benign git status/npm test pass);cwd 拒 `../proj-evil`/`/etc`/`..` 纳真子目录;每 live exec 落恰一条审计(commandHash 64-hex 非原文,sink throw 不抛 ToolResult);`rg 'new ToolContextFactory'`=1 hit + 真 agent exec 后 AuditStore 有 action `terminal.exec`(证三入口);沙箱降级设 fallbackUsed+`[unsandboxed:]`+audit;diff 只加硬化(无写、Evolution 仍无 terminal);两仓 `build:check`+test+layer-contract 绿。
- **E-1**:`new ToolRouter({capability:new Evolution().toDef()}).getSchemas()` 含 terminal+exec、`toDef().commandAllowlist.bins` 含 git/grep 无写 bin(守 E1-6 投影否则字段死);Evolution 下 `git log -n3` ok+executor 收命令;`rm -rf build`/`echo>out.txt`/`sed -i` ok:false executor **从不**被调;`git log && rm -rf`/`grep|tee` 链接走私 deny;无 allowlist 的 capability byte 一致(无回归);promptFragment 不含禁终端、含 git/grep/test、保 no-submit;grounding 默认/PCV 零改。
- **E-3**:live 表面只 `terminal`(A:exec / B:exec+run)、phantom 零命中;任何 `ALEMBIC_TEST_TERMINAL_TOOLSET` env 注不进 phantom;[A]删后两仓 build:check+boundary 净+零残留 import+UnifiedToolCatalog 存活;[B]terminal_run 结构化沙箱+rm -rf deny+拒 session/PTY/stdin;Plugin vendor 重后测试对新映射过。
- **E-5**:只读 allowlist 测全 allow(git log/diff/status、npm test、tsc --noEmit、lint、grep/rg/find)全 deny 写/网络/install;ANALYST_SYSTEM_PROMPT 含 git+test+只读、无 terminal_pty;phantom 全 live prompt+Core toolset 移除;guard 默认仍 off+注释订正+终端结果记为 PcvNodeEvidence。

### 推进顺序(producer/consumer)
**E-2(安全前置,独立先落)**→ **E-1 ∥ E-4**(无相互依赖并行;E-1 Agent 内复用 E-2 chokepoint;E-4 Core 先+重 vendor+Plugin 测试)→ **E-3**(需 CG-1 决策门 E3-0;E-2 deny 已是 terminalSafety 副本→删 policy 不伤 E-2)→ **E-5**(prompt+guard 注释)。跨仓:E-2 Agent 先→重建→主体 factory 消费;E-4 Core 先→重 vendor→Plugin;全程 Node≥22。

### 3 项细化门(✅ 2026-06-26 用户采纳推荐)
1. **CG-1 = 分支 A(删 dead 栈,维持 exec-only)**(E3-0 定);不复活 PTY/session,terminal_run 不接(无真实消费、减面优先)。
2. **退 `@alembic/agent/tools/terminal` public subpath = 在 scope**,但作为公共契约变更**走总控确认**(interface-contract demandKey;执行波次须显式确认契约行退役在范围内,非 controller 自判)。
3. **allowlist bins 含 `node`/`npm`/`pnpm`(build/test 必需)**,但**靠子命令级只读 enforce 收窄**(拒 `node -e`/`node --eval`/`npm install`/`npm run` 非 test·lint·build:check;只允 `node --test`、`npm test`、`npm run {test:*,lint,build:check}`)+ 文档化 `node -e` 残留风险 + Seatbelt project-write 兜底。E-2 子命令级只读须显式覆盖 node/npm 这两个宽 bin。

### 风险(grounding 浮出)
allowlist **shell-meta 绕过(最深)**——exec 走 `/bin/sh` 首 token 不足,强制 `containsShellMeta` 拒绝;只读是 **verb-based 非真 enforce**(allowlist bin 仍可 `git checkout`/`npm install`→靠子命令级只读+Seatbelt+cwd);**toDef 投影必须真到达 router**(否则 gate 死);**过宽 bins**(node/npm)削弱;**CG-3 耦合陷阱**(只复制原语不 import dead evaluator);**Plugin vendor 失忆**(phantom 修须重 vendor);Evolution prompt 改勿触 `EvolutionAgentRun.ts:103-108` decision-completeness gate(措辞「verify THEN decide」)。

## 证据与链接
- Grounding:5-agent 跨仓终端工具测绘 + **4-agent E-1~E-5 代码级 grounding(~551K tokens,见 §10,@Agent 953e665/Alembic 2090793/Core 2a52874)**(~799K tokens)。
- 同域/协同:[伞形 lifecycle-global](alembic-recipe-lifecycle-global-2026-06-26.md)(evolution 衰退 grounding)、[PCV observe-only](../legacy 或 ledger)(AnalyzeGroundingGuard)、[命名重构](alembic-recipe-lifecycle-naming-layering-refactor-2026-06-26.md)(tools/v2)。
- 关键载重点:`AlembicAgent/src/tools/runtime/handlers/terminal.ts:62,81,146,171`、`capabilities/Evolution.ts:15-22,34`、`tools/terminal/policy/TerminalShellPolicy.ts:88-193`、`agent/runtime/AnalyzeGroundingGuard.ts:19,44-68`、主体 `tools/adapters/terminal-adapter/*`+`tools/v2/ToolContextFactory.ts:61`、Core `BootstrapTerminalToolset.ts:23-27,82-83`。
