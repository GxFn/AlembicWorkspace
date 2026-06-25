# AlembicPlugin 双宿主 — cc/codex 共享 workspace-identity I/O 结构裁决（option-planning）

Status: Design 结构裁决（option-planning）/ 完成（推荐已出，最终范围决定属控制器）
Date: 2026-06-20
Design Key: alembic-plugin-dual-host-shared-workspace-io-structure-2026-06-20
Demand: alembic-plugin-dual-host-architecture-refactor-2026-06-19（本裁决是其 DH-3 收尾的子裁决，喂 DH-3g；**非新需求、不入 handoff board**）
Window: Design（仅出选项/推荐/风险/控制器执行要点；不改产品代码、不派发、不改控制器状态）
Source refs: DH-3f 结果 `target-results/tr-dh-3f.json`（physical-migration flag）、需求设计 `alembic-plugin-dual-host-architecture-refactor-2026-06-19.md`、一手代码核读（HEAD `a297e9d`）

---

## 1. 裁决的决定（restate the decision）

DH-1~DH-3f 已建成功能性双宿主：L3 `HostAdapter` 接口 + `CodexHostAdapter` + `ClaudeCodeHostAdapter` + `resolveHostAdapter`/`hostAdapterForShape` 选择器，host-name 分支仅 L3。DH-3 完成定义里**唯一未达项 = 「委托外观清除（物理迁入）」**：把 host-specific 函数体搬进 `CodexHostAdapter`、去 DH-2/3.1 的委托外观。

DH-3f flag 的阻塞：cc 与 codex **共享同一组 workspace-identity I/O**，两 adapter 都委托同一批函数；把函数体迁入 codex 专属 adapter 会破 cc 共享。控制器请 Design 在 4 候选间裁决组织结构，并给执行要点，供据此派 DH-3g（或裁定保持现状 = DH-3 DONE）。

**难以回退点**：一旦把共享逻辑迁入某 host adapter（或拆基类），再纠正需二次重构 + wire-byte 风险二次暴露。**不确定边界**：这组函数究竟是 host-specific 还是 host-agnostic（决定它该在 L3 还是 L1）。

---

## 2. 当前系统形态（一手代码核读，HEAD `a297e9d`）

**核心更正：DH-3f KEEP 清单把这组簇标为「真 host-specific」是误分类——代码证明它们是 host-agnostic（shape-aware）共享实现。**

证据（`lib/runtime/ProjectRootResolver.ts` + `lib/runtime/runtime/RuntimeContext.ts`）：

- `resolveCodexProjectRoot`（:76）`buildProjectRootCandidates`（:273）**统一读全部 host env 家族**：`ALEMBIC_PROJECT_DIR` / `CODEX_WORKSPACE_DIR` / `CODEX_WORKSPACE_ROOT` **和** `CLAUDE_PROJECT_DIR`（:285），全部同一 trust/reject 校验，**函数体内零 host-name 分支**（注释 :282-284 明示「host 选择分支只在 L3」）。
- `ensureCodexRuntimeEnvironment`（:47）/ `resolveHostRuntimeContext`（:59）：host 标识全由 `derivePluginHostFromShape(detectPluginHostShape(...))`（:53/:70）**从物理 shell 形态派生**（codex shell 旁挂 `.mcp.json` vs cc shell 内联 `.claude-plugin/plugin.json`），**非硬编码 codex**。
- init-marker/saved-root I/O（`getCodexInitMarkerPath`:217 / `read|writeCodexInitMarker` / `read|writeCodexSavedProjectRoot`）：路径经 Core `WorkspaceResolver.fromProject(projectRoot)` 派生，**两 host 写同一位置**；文件名 `codex-init.json`（:219）、`codex-project-root.json`（:139）与 `profile:'codex-plugin'`（CODEX_SETUP_PROFILE :12）是**序列化/落盘冻结值**。
- 两 adapter（`CodexHostAdapter` / `ClaudeCodeHostAdapter`）的身份簇方法**逐行委托同一批 free function**；`ClaudeCodeHostAdapter` 委托这同一批仍得到正确 cc 行为 → **独立证实 cc/codex 共享**（非凭 DH-0 之言）。

**两 adapter 真正相异的面（= 真 host-specific，全在 adapter 内、很小）**：`hostId`（label）、`allowsEmptyPluginAssets`（codex=false/cc=true，manifest 形态差异 F-V2-2）、`setupProfile`（cc 现复用 codex，分叉属 DH-4）、`pluginMcpManifestPath` / `pluginManifestPath` / `normalizePluginMcpArg`（清单布局/arg 归一）。**其余整组 workspace-identity I/O 都是共享 host-agnostic 逻辑。**

**结论**：「委托外观」不是要清除的 facade，而是 **L3 adapter 委托 L1 共享逻辑**（依赖方向 L3→L1，合法）。「物理迁入 CodexHostAdapter」的前提建立在 `Codex*` 误命名上——把共享实现误当「codex 的实现」。

---

## 3. 四候选（option format）

### Option (i)：保持委托（共享函数留低层，两 adapter 委托）— 现状结构

- Summary：不做物理迁入；共享 workspace-identity I/O 作为 L1 host-agnostic 逻辑，L3 两 adapter 委托。
- User-visible behavior：无变化（codex/cc 行为逐行不变）。
- Repositories/windows：AlembicPlugin only。
- Interfaces/contracts：`HostAdapter` 接口不变；F-V2-2 wire-byte 不触（清单读路径与本簇正交）。
- Data/state ownership：marker/saved-root 落盘位置、profile 值不变。
- Validation path：tsc + 单测失败集 vs 基线 IDENTICAL（零行为变更，无需新验证）。
- Rollout/migration：无（已是现态）。
- Risks：**残留 de-Codex 债**——这组共享函数仍带 `Codex` 前缀，违 DH-3 完成定义「de-Codex 清零误命名」+ RC-3b「消除 Codex=host 语义混淆」；且 DH-3f KEEP 理由（标其为 host-specific）落档不准，会误导后续维护者。
- Reversibility：完全可逆（未动）。
- Open decisions：是否容忍 `Codex*` 误命名留在共享层。
- Fit：分层判断**正确**（委托是对的）；但「原样 = DH-3 DONE」未达 DH-3 自身的 de-Codex 完成项。

### Option (ii)：shared-base 基类（`BaseHostAdapter` 持共享 I/O，两 adapter 继承 + 覆盖）

- Summary：抽基类持共享逻辑，Codex/CC 继承并覆盖真 host-specific 点。
- User-visible behavior：无变化（若做对）。
- Repositories/windows：AlembicPlugin only。
- Interfaces/contracts：新增继承层级（protected 方法 / super 调用）。
- Data/state ownership：不变。
- Validation path：tsc + 失败集等价 + 需复核继承覆盖未漂移行为。
- Rollout/migration：把现 free function 搬入基类 = 一次结构重构。
- Risks：**为已 DRY 的逻辑新增继承耦合**——共享已由 free-function 调用达成，基类不改善 DRY，只把共享码从函数搬进基类、增加耦合面；组合（委托 free fn）比继承更轻；纯重构零行为收益却引入 churn + wire-byte 二次暴露。
- Reversibility：中（继承一旦铺开，回退成本高于 (i)）。
- Open decisions：哪些点设为 `abstract` vs 默认实现。
- Fit：差——解一个不存在的 DRY 问题；违「最小动作」。

### Option (iii)：cc 委托 codex 单例（codex 为主实现，cc 显式委托）

- Summary：保留 codex 为 canonical，cc adapter 显式转调 codex adapter。
- User-visible behavior：无变化。
- Repositories/windows：AlembicPlugin only。
- Interfaces/contracts：cc → codex 单向委托依赖。
- Risks：**架构倒退**——在 adapter 层重新编码「codex 是正统、cc 是次级」的不对称，正是本需求要消除的 codex-centric（已决 ④真双 identity / ⑤per-host 对等 / 「消除 codex-centric + cc 半支持」）。
- Reversibility：中。
- Open decisions：无（应直接否决）。
- Fit：**否决**——与需求顶层目标冲突。

### Option (iv)：各自复制（每 adapter 复制一份，弃 DRY）

- Summary：把 workspace-identity I/O 复制进每个 adapter。
- User-visible behavior：无变化（初始）。
- Risks：为**逐字节相同**的共享逻辑造两份 ~250 行副本，须永久手工保持同步；两副本必然漂移 → wire-byte/行为漂移风险；零收益高维护。
- Reversibility：低（复制后再合并难）。
- Fit：**否决**——主动制造重复，违 DRY 与不变量保全。

---

## 4. 候选对比小结

| 候选 | 分层正确性 | DRY | cc/codex 对等 | 与 DH-4 per-host 分叉兼容 | 迁移/wire-byte 风险 | 是否值得 |
|---|---|---|---|---|---|---|
| (i) 委托现状 | ✅ 正确 | ✅ 已达 | ✅ 对称 | ✅（per-host 差异本就在 adapter） | 无 | 结构对，但留 de-Codex 债 |
| (ii) 基类 | ⚠ 可，但更重 | = 不改善 | ✅ | ✅ | 中（churn） | ✗ 解伪问题 |
| (iii) cc→codex | ✗ 倒退 | ✅ | ✗ 不对称 | ✗ | 中 | ✗ 否决 |
| (iv) 复制 | ✗ | ✗ 弃 | ⚠ 易漂移 | ✗ | 高（漂移） | ✗ 否决 |

---

## 5. Design 推荐（仅 Design 建议；最终范围决定属控制器/用户）

**结构裁决：取 Option (i) 的分层（保持委托，不迁入、不拆基类、不 cc→codex、不复制）。物理迁入 = 错误操作，应明确否决。**

但「原样照搬（含 `Codex` 误命名）= DH-3 DONE」并不严格成立：DH-3 完成定义含「de-Codex 清零误命名」，本簇仍带误命名（被 DH-3f 误 KEEP）。故 **DH-3 的正确收尾不是物理迁入，而是一个小而界定清晰的 de-Codex + 确认 L1 归位 pass**：

- 对**真 host-agnostic 成员**剥掉 cosmetic `Codex` 前缀、确认为 L1 共享（两 adapter 仍委托新名）；
- 这才是 RC-3b「Codex=host 语义混淆清零」对最后一簇的忠实完成，并修正 DH-3f 落档的误分类；
- 属已决 ⑥「de-Codex 化纳入（按正确修改）」的原始范围，**非追加 scope**。

此操作 = DH-3f 已验证安全的改名类（200 个同类符号改名，tsc 绿 + 失败集 IDENTICAL），**风险远低于物理迁入或基类重构**。完成后 DH-3 = DONE。

**何为推荐：派 DH-3g = 「shared workspace-identity 簇 de-Codex + L1 归位」执行 pass（非物理迁入）。**

---

## 6. 给控制器的执行要点（DH-3g 执行 pass 规格）

目标窗口 = AlembicPlugin；直提 main；增量绿；用 Explore 子代理先测绘引用再分批改名。

**A. DE-CODEX（剥前缀、确认 L1 host-agnostic；两 adapter 改导入新名）**
`lib/runtime/ProjectRootResolver.ts`：`resolveCodexProjectRoot`→`resolveProjectRoot`*、`ResolveCodexProjectRootOptions`→`ResolveProjectRootOptions`、`CodexSavedProjectRoot`→`SavedProjectRoot`、`CodexInitMarker`→`InitMarker`（或 `PluginInitMarker`）、`get/read/writeCodex{InitMarker,SavedProjectRoot}Path?`→去前缀、`isCodexSavedProjectRoot`/`isCodexInitMarker`/`getCodexGlobalRoot`→去前缀。
`lib/runtime/runtime/RuntimeContext.ts`：`ensureCodexRuntimeEnvironment`→`ensureRuntimeEnvironment`；cosmetic 前缀且值 host-neutral 的 env 常量（`CODEX_MCP_MODE_ENV`='ALEMBIC_MCP_MODE'、`CODEX_MCP_TIER_ENV`='ALEMBIC_MCP_TIER'、`CODEX_DEFAULT_MCP_TIER`）酌情去前缀。
调用方：`CodexHostAdapter` / `ClaudeCodeHostAdapter` / `resolveHostAdapter` 及 L2 调用点改导入新名（纯 import/标识符改名）。
（* `resolveProjectRoot` 与 adapter 方法同名——free fn 可定 `resolveProjectRootFromEnv` 或保留模块限定导入避免歧义，由执行窗口定名。）

**B. KEEP — 不得改的冻结/真 host-specific 项（防 de-Codex 过界）**
- **wire/persistence-frozen 值（符号名可改，序列化串不可动）**：落盘文件名 `codex-init.json` / `codex-project-root.json`；`profile` 值 `'codex-plugin'`（且 `CODEX_INIT_MARKER.profile` 类型锁 `typeof CODEX_SETUP_PROFILE`——cc 专属 profile 属 DH-4）；env 变量**值**含 CODEX 者（`ALEMBIC_CODEX_MCP_MODE`/`ALEMBIC_CODEX_ENABLE_ADMIN`/`ALEMBIC_CODEX_PLUGIN_ROOT`）；已 KEPT 的 `CODEX_*` MCP error codes。
- **真 host/shell-specific（应留 codex 侧或 per-host，非「共享」）**：`CODEX_PLUGIN_HOST='codex'`（host label，对称 `CLAUDE_CODE_PLUGIN_HOST`）；codex shell 产物标识 `CODEX_PLUGIN_SHELL_DIR='alembic-codex'`/`CODEX_RUNTIME_BIN='alembic-codex-mcp'`/`CODEX_MARKETPLACE_SHELL_ENTRY`（L4 per-host 产物，cc 对应物属 DH-4）；`isCodexPluginCachePath`（编码 codex `~/.codex/plugins/cache` 布局——见下风险）；`resolveCodexPluginRoot` 的 codex-shell 默认回退（per-host，DH-4）。
- **用户可见文案里的 "Codex"**（如 ProjectRootResolver.ts:86/131 的报错串）= **CC3 文案统一领地，不在本需求**（需求设计明示 CC3 文案不在本需求）；DH-3g 只改符号、不改用户串。

**C. wire-byte 注意点**
本簇 de-Codex 与 F-V2-2 正交：codex `.mcp.json` 读取/arg 归一在 `pluginMcpManifestPath`/`normalizePluginMcpArg`/PluginRegistry 清单读路径，**不在** project-root/marker/runtime-env 函数；只要 B 的落盘串与 env 值不动，wire-byte 不受影响。

**D. 验证（与 DH-3f 同口径）**
tsc --noEmit 绿；biome 0 error；全量 unit 失败集 vs 基线 `a297e9d` **IDENTICAL**（零回归）；残留误命名 host-agnostic `Codex*` 定义 = 0（仅剩 B 的 KEEP 类）；host-name 分支仍仅 L3；commit hash。完成即 **DH-3 DONE**。

---

## 7. 须控制器确认 / 会推翻推荐的证据

- **控制器最终裁断**：(a) 派 DH-3g = §6 的 de-Codex+L1 归位 pass（推荐），或 (b) 裁定 (i) 原样 = DH-3 DONE 并把本簇 de-Codex 折叠进 DH-5 清理（须同时把 DH-3f KEEP 理由改记为「host-agnostic、de-Codex 待办」以免落档不准）。Design 不替控制器定最终范围。
- **会推翻「host-agnostic」判定的证据**：若发现某成员实际按 host-name 字面分支或读写 host 专属落盘格式（当前核读未见），则该成员应留 host-specific、不 de-Codex。
- **`isCodexPluginCachePath` 的 cc 缺口**：它只挡 codex 插件缓存路径，cc 无等价保护——属 host-specific 真缺口（cc 加 `~/.claude/plugins` 等价挡板），建议归 DH-5/DH-6 加固，**不在** DH-3g de-Codex pass（避免把改名与补能力混淆）。

## 8. ADR 候选

建议（满足三条件：难逆 + 维护者会困惑 + 真有取舍）：记一条轻量 ADR「workspace-identity I/O 是 host-agnostic L1，L3 adapter 委托而非物理迁入；`Codex` 前缀为历史 cosmetic，落盘/host-label/L4 产物标识为真 host-specific 保留」——避免未来又被「Codex=host」误读触发物理迁入返工。是否落 ADR 由控制器定。
