# 增量扫描管线隔离与终止机制重设计

> 创建日期: 2026-04-30
>
> 状态: **已实现 ✅**
>
> 触发: 增量扫描 LLM 连接失败后点击取消，但多通道交付和 Wiki 生产仍在执行
>
> 范围: 冷启动 & 增量扫描两条链路的管线隔离、终止机制、功能裁剪

---

## 1. 现状问题

### 1.1 用户可见症状

增量扫描时 LLM 连接失败 → 前端点击"取消" → 后台仍在执行：
- **多通道交付** (`cursorDeliveryPipeline.deliver()` — channel A/B/C/F)
- **Wiki 生成** (`generateWiki` — `setImmediate` 异步调度)
- **Skill 消费** (`consumeBootstrapSkills`)
- **语义记忆合并** (`consolidateSemanticMemory`)

### 1.2 根因链

```
用户点击 Cancel
  │
  ├─ Dashboard: POST /modules/bootstrap/cancel
  │   └─ cancelBootstrap()
  │       └─ if (taskManager.isRunning) → abortSession()
  │          else → "No active bootstrap session" ← ⚠️ 这里断了
  │
  └─ 为什么 isRunning === false？
      │
      ├─ LLM 连接失败 → AgentService.run 快速失败
      │   └─ 所有 dimension task 被 markTaskFailed
      │       └─ #finishSession() → status = 'completed_with_errors'
      │           └─ isRunning = false  ← ⚠️ Cancel API 不再起作用
      │
      └─ 此时 finalize 链仍在执行（与 dimension 失败无关）
          ├─ consumeBootstrapSkills（shouldAbort 在每维开始前检查，但 isSessionValid 在 completed_with_errors 时仍为 true）
          ├─ runWorkflowCompletionFinalizer（无 shouldAbort 检查）
          │   ├─ runCursorDelivery（await，无取消检查）
          │   ├─ generateWiki（setImmediate，完全无取消挂钩）
          │   └─ consolidateSemanticMemory
          └─ persistWorkflowResult
```

### 1.3 核心设计缺陷

| # | 缺陷 | 位置 | 影响 |
|---|------|------|------|
| 1 | **Cancel API 只在 `isRunning` 时生效** | `DashboardOperations.ts:220` | LLM 失败后 session 快速进入 completed_with_errors，Cancel 变成 NOP |
| 2 | **finalize 链无取消检查** | `WorkflowCompletionFinalizer.ts:47-57` | delivery/wiki/memory 在 dimension 全失败后仍执行 |
| 3 | **`generateWiki` 完全不挂取消** | `WorkflowCompletionFinalizer.ts:69-76` | `setImmediate` 调度后无法撤销 |
| 4 | **`isSessionValid` 在完成态仍为 true** | `BootstrapTaskManager.ts:298-306` | 刻意设计（为 Phase 5.5 Skill），但与"用户已取消"的语义冲突 |
| 5 | **冷启动和增量共用同一套异步管线** | `dispatchPipelineFill` | 增量扫描不需要冷启动的全部 finalize 步骤（wiki、多通道交付等） |

---

## 2. 两条链路的完整异步执行链

### 2.1 冷启动（`runInternalColdStartWorkflow`）

```
HTTP 返回骨架（同步）
  │
  └─ dispatchPipelineFill (setImmediate, fire-and-forget)
      └─ runInternalDimensionExecution
          ├─ prepareInternalDimensionFillRun（拿 sessionAbortSignal）
          ├─ initializeBootstrapRuntime
          ├─ runInternalDimensionAgentSession
          │   └─ AgentService.run（父会话）
          │       └─ AgentRunCoordinator（tier + 并行）
          │           └─ 每维 AgentRuntime.execute（有 abortSignal）
          │
          └─ finalizeInternalDimensionFill
              ├─ consumeBootstrapSkills（每维前检查 shouldAbort）
              ├─ consumeInternalDimensionCandidateRelations
              ├─ runWorkflowCompletionFinalizer ← ⚠️ 无取消检查
              │   ├─ runCursorDelivery（多通道 A/B/C/F）
              │   ├─ generateWiki（setImmediate）← ⚠️ 完全不可取消
              │   └─ consolidateSemanticMemory
              └─ persistWorkflowResult
```

### 2.2 增量扫描（`runInternalKnowledgeRescanWorkflow`）

```
HTTP 返回骨架（同步）
  │
  ├─ Step 0-3: 清理 → SourceRef → Phase 1-4 → ImpactPlanner → Evolution Agent
  │   （这部分在 HTTP 请求内同步完成，可通过 HTTP AbortSignal 中断）
  │
  └─ dispatchPipelineFill (setImmediate, fire-and-forget)  ← 与冷启动完全相同的管线
      └─ runInternalDimensionExecution
          └─ ...同上完整 finalize 链...
```

**关键发现**：增量扫描复用了冷启动的整套 `dispatchInternalDimensionExecution`，包括 wiki 生成、多通道交付等**对增量场景无意义的步骤**。

---

## 3. 增量扫描管线隔离设计

### 3.1 原则：增量扫描不是"缩小版冷启动"

| 对比维 | 冷启动 | 增量扫描 |
|--------|--------|---------|
| 目标 | 从零建立知识库 | 补齐 gap + 进化过时知识 |
| Phase 1-4 | 全量分析 | 增量 diff + 全量分析 |
| Evolution Agent | 无 | **核心新增** — RecipeImpactPlanner → runEvolutionAudit |
| 维度执行 | 全维度填充 | 仅 gap 维度补齐 |
| 多通道交付 | ✅ 需要（首次配置 Cursor rules 等）| ❌ **不需要**（规则已存在）|
| Wiki 生成 | ✅ 需要（首次生成项目 wiki）| ❓ **可选**（增量更新，非必须）|
| Skill 消费 | ✅ 需要（首次生成 Project Skills）| ❓ **可选**（仅 gap 维度新增时）|
| 语义记忆 | ✅ 需要 | ❌ **不需要**（增量不产生新的全局记忆）|

### 3.2 方案：增量扫描独立 finalize 路径

**当前架构**（共用）：
```
冷启动 ─┐
        ├─→ dispatchPipelineFill → runInternalDimensionExecution → finalizeInternalDimensionFill
增量   ─┘                                                          └─ 所有 finalize 步骤
```

**目标架构**（隔离）：
```
冷启动 ──→ dispatchPipelineFill → runInternalDimensionExecution → finalizeFullBootstrap
                                                                   ├─ consumeBootstrapSkills
                                                                   ├─ consumeRelations
                                                                   ├─ runCursorDelivery
                                                                   ├─ generateWiki
                                                                   └─ consolidateSemanticMemory

增量   ──→ dispatchPipelineFill → runInternalDimensionExecution → finalizeIncrementalRescan
                                                                   ├─ consumeBootstrapSkills（仅 gap 维度有产出时）
                                                                   ├─ consumeRelations
                                                                   └─ persistWorkflowResult（轻量收尾）
```

### 3.3 具体改动点

**`InternalDimensionExecutionPipeline.ts`** — 新增 `mode` 参数：

```ts
interface PipelineOptions {
  mode: 'bootstrap' | 'rescan';
}

// finalizeInternalDimensionFill 内部根据 mode 决定 finalize 范围
if (options.mode === 'bootstrap') {
  await runWorkflowCompletionFinalizer(...);  // 全量 finalize
} else {
  // 增量：只做轻量收尾
  await consumeBootstrapSkills(...);  // 可选，仅 skill-worthy 维度有产出时
  await consumeInternalDimensionCandidateRelations(...);
  await persistWorkflowResult(...);
  // 跳过: runCursorDelivery, generateWiki, consolidateSemanticMemory
}
```

**`PipelineFillView`** — 扩展 `mode` 字段：

```ts
interface PipelineFillView {
  // ...existing
  mode?: 'bootstrap' | 'rescan';
}
```

**`InternalKnowledgeRescanWorkflow.ts`** — 传入 mode：

```ts
dispatchInternalDimensionExecution({
  view: { ...fillView, existingRecipes, evolutionPrescreen, mode: 'rescan' },
  dimensions: executionDimensions,
  logPrefix: 'Rescan-Internal',
});
```

---

## 4. 终止机制重设计

### 4.1 当前终止能力矩阵

| 阶段 | 组件 | 有取消检查？ | 取消方式 |
|------|------|:----------:|---------|
| HTTP 同步阶段 | Phase 1-4, ImpactPlanner, EvolutionAgent | ⚠️ 部分 | HTTP AbortSignal（仅 Dashboard 路径） |
| 异步维度执行 | AgentRunCoordinator → AgentRuntime | ✅ | `sessionAbortSignal` + `shouldAbort` |
| 维度任务标记 | BootstrapTaskManager | ✅ | `abortSession` → 所有未完成 task 标 failed |
| consumeBootstrapSkills | Phase 5.5 Skill 生成 | ⚠️ | `shouldAbort` 仅在每维开始前检查，单维内不可取消 |
| runCursorDelivery | 多通道交付 | ❌ | 无 |
| generateWiki | Wiki 生成 | ❌ | `setImmediate` 调度，完全不可取消 |
| consolidateSemanticMemory | 语义记忆合并 | ❌ | 无 |
| persistWorkflowResult | 结果持久化 | ❌ | 无（但很快，不需取消） |

### 4.2 终止信号设计

**核心问题**：当前依赖 `BootstrapTaskManager.isRunning` 判断是否可取消，但 `isRunning` 在 dimension 阶段结束后就变成 `false`，导致 finalize 阶段不可取消。

**方案：引入 `userCancelled` 独立标志**

```ts
// BootstrapTaskManager.ts
class BootstrapSession {
  // ...existing
  userCancelled: boolean = false;
}

// cancelBootstrap 时：
abortSession(reason: string) {
  // ...existing abort logic
  this.#currentSession.userCancelled = true;
}

// 新增：即使 session 不是 running 也能标记取消
markCancelled() {
  if (this.#currentSession) {
    this.#currentSession.userCancelled = true;
    this.#sessionAbortController?.abort('User cancelled');
  }
}

// 暴露查询：
isUserCancelled(sessionId: string): boolean {
  return this.#currentSession?.id === sessionId && this.#currentSession?.userCancelled === true;
}
```

**`cancelBootstrap` 改造**：

```ts
// DashboardOperations.ts
async cancelBootstrap() {
  const taskManager = container.get('bootstrapTaskManager');
  if (taskManager.isRunning) {
    taskManager.abortSession('User cancelled from dashboard');
  } else {
    // 即使不在 running，也标记用户意图
    taskManager.markCancelled();
  }
  return { cancelled: true };
}
```

### 4.3 finalize 链注入取消检查

```ts
// WorkflowCompletionFinalizer.ts
export async function runWorkflowCompletionFinalizer(ctx) {
  // 每步之前检查
  if (ctx.shouldAbort?.()) return;
  await runCursorDelivery(ctx);

  if (ctx.shouldAbort?.()) return;
  scheduleTask(() => generateWiki(ctx));

  if (ctx.shouldAbort?.()) return;
  await consolidateSemanticMemory(ctx);
}
```

**`shouldAbort` 改造**（在 `BootstrapSessionExecutionBuilder` 中）：

```ts
// 当前：
shouldAbort: () => !taskManager.isSessionValid(sessionId)

// 改为同时检查 userCancelled：
shouldAbort: () => !taskManager.isSessionValid(sessionId) || taskManager.isUserCancelled(sessionId)
```

### 4.4 两条链路终止清单

#### 冷启动终止（Cancel）应停止：

| 阶段 | 动作 |
|------|------|
| 维度执行中 | `abortSession` → `abortSignal` 传播到 AgentRuntime → 停止 LLM 调用 |
| consumeBootstrapSkills | `shouldAbort` 在每维前检查 → 跳过后续维度 |
| runCursorDelivery | **新增** `shouldAbort` 检查 → 跳过交付 |
| generateWiki | **新增** `shouldAbort` 检查 → 不调度 |
| consolidateSemanticMemory | **新增** `shouldAbort` 检查 → 跳过 |
| persistWorkflowResult | **不跳过** — 即使取消也要记录结果（标记为 cancelled） |

#### 增量扫描终止（Cancel）应停止：

| 阶段 | 动作 |
|------|------|
| HTTP 同步阶段 | 前端 `AbortController.abort()` 中断 HTTP → Phase 1-4 中断 |
| Evolution Agent | 随 HTTP 中断（同步阶段内） |
| 维度执行中 | 同冷启动 |
| consumeBootstrapSkills | 同冷启动（增量裁剪后可能不执行） |
| runCursorDelivery | **增量不执行**（§3.2 裁剪） |
| generateWiki | **增量不执行**（§3.2 裁剪） |
| persistWorkflowResult | **不跳过** |

---

## 5. 增量扫描功能裁剪决策

### 5.1 需要重新审视的功能

| 功能 | 冷启动 | 增量扫描现状 | 增量扫描应有 | 改动 |
|------|:------:|:----------:|:----------:|------|
| Phase 1-4 全量分析 | ✅ | ✅ | ✅ 保留（增量模式） | 无 |
| SourceRef 校验 | — | ✅ | ✅ 保留 | 无 |
| RecipeImpactPlanner | — | ✅ | ✅ 保留（核心） | 无 |
| Evolution Agent | — | ✅ | ✅ 保留（核心） | 无 |
| auditRecipesForRescan | — | ✅ | ✅ 保留（gap analysis） | 无 |
| Gap 维度补齐 | — | ✅ | ✅ 保留 | 无 |
| 多通道交付 (A/B/C/F) | ✅ | ✅ | ❌ **裁剪** | §3.3 mode='rescan' 跳过 |
| Wiki 生成 | ✅ | ✅ | ❌ **裁剪** | §3.3 mode='rescan' 跳过 |
| 语义记忆合并 | ✅ | ✅ | ❌ **裁剪** | §3.3 mode='rescan' 跳过 |
| Skill 消费 | ✅ | ✅ | ⚠️ **条件保留** | 仅当 gap 维度产出了新 skill-worthy candidate 时 |
| SkillHooks.onRescanComplete | — | ✅ | ✅ 保留（轻量 fire-and-forget） | 无 |

### 5.2 增量扫描裁剪后的完整流程

```
用户触发增量扫描
  │
  ├─ 同步阶段（HTTP 请求内）
  │   ├─ Step 0: 清理策略（none / force-rescan / rescan-clean）
  │   ├─ Step 0.5: syncKnowledgeStoreForRescan
  │   ├─ Step 1: SourceRef 校验 + 反向清理
  │   ├─ Step 2: Phase 1-4 项目分析（含增量 diff）
  │   ├─ Step 2.5: RecipeImpactPlanner → EvolutionCandidatePlan
  │   ├─ Step 3: Evolution Agent 验证（若有 candidates）
  │   ├─ Step 4: auditRecipesForRescan（gap analysis）
  │   └─ Step 5: gap 维度计算 → 返回骨架
  │
  └─ 异步阶段（fire-and-forget，mode='rescan'）
      ├─ 维度执行（仅 gap 维度）
      ├─ consumeBootstrapSkills（条件执行）
      ├─ consumeRelations
      ├─ persistWorkflowResult
      ├─ ❌ 不执行 runCursorDelivery
      ├─ ❌ 不执行 generateWiki
      └─ ❌ 不执行 consolidateSemanticMemory
```

---

## 6. 实施计划

### Phase 1: 终止机制修复（优先级高）

| # | 任务 | 文件 | 说明 |
|---|------|------|------|
| 1.1 | `BootstrapTaskManager` 增加 `userCancelled` 标志 | `lib/service/bootstrap/BootstrapTaskManager.ts` | 新增 `markCancelled()` + `isUserCancelled()` |
| 1.2 | `cancelBootstrap` 支持 completed 态取消 | `lib/tools/adapters/DashboardOperations.ts` | 去掉 `isRunning` 前置条件，改用 `markCancelled` |
| 1.3 | `shouldAbort` 组合 `userCancelled` | `BootstrapSessionExecutionBuilder.ts` | `shouldAbort` = `!isSessionValid \|\| isUserCancelled` |
| 1.4 | `runWorkflowCompletionFinalizer` 注入取消检查 | `WorkflowCompletionFinalizer.ts` | 每步前检查 `shouldAbort` |

### Phase 2: 增量管线隔离

| # | 任务 | 文件 | 说明 |
|---|------|------|------|
| 2.1 | `PipelineFillView` 新增 `mode` 字段 | `lib/types/snapshot-views.ts` 或定义处 | `'bootstrap' \| 'rescan'` |
| 2.2 | `InternalDimensionExecutionPipeline` 按 mode 裁剪 finalize | `InternalDimensionExecutionPipeline.ts` | rescan 模式跳过 delivery/wiki/memory |
| 2.3 | `InternalKnowledgeRescanWorkflow` 传入 `mode: 'rescan'` | `InternalKnowledgeRescanWorkflow.ts` | dispatch 时设置 mode |
| 2.4 | `InternalColdStartWorkflow` 默认 `mode: 'bootstrap'` | `InternalColdStartWorkflow.ts` | 显式标记（向后兼容） |

### Phase 3: 增强（可选）

| # | 任务 | 文件 | 说明 |
|---|------|------|------|
| 3.1 | Wiki 增量更新模式 | `WikiGenerator.ts` | 增量扫描后可选触发 wiki 增量更新（非全量重建） |
| 3.2 | MCP 路径取消支持 | `McpServer.ts` | 当前 MCP 无 cancel 机制，外部 Agent 无法取消 |
| 3.3 | 前端取消状态同步 | `useBootstrapSocket.ts` | 增加 `aborted` 状态类型，区分"取消"和"失败" |

---

## 7. 文件索引

| 文件 | 角色 |
|------|------|
| `lib/service/bootstrap/BootstrapTaskManager.ts` | 会话生命周期 + 取消控制 |
| `lib/tools/adapters/DashboardOperations.ts` | Dashboard Cancel API |
| `lib/workflows/capabilities/execution/internal-agent/InternalDimensionFillDispatch.ts` | `setImmediate` 异步调度 |
| `lib/workflows/capabilities/execution/internal-agent/InternalDimensionExecutionPipeline.ts` | 执行管线主流程 |
| `lib/workflows/capabilities/execution/internal-agent/InternalDimensionFillSessionRunner.ts` | Agent 会话执行 |
| `lib/workflows/capabilities/execution/internal-agent/InternalDimensionFillFinalizer.ts` | finalize 入口（Skills + Relations + CompletionFinalizer） |
| `lib/workflows/capabilities/completion/WorkflowCompletionFinalizer.ts` | 多通道交付 + Wiki + 语义记忆 |
| `lib/workflows/capabilities/completion/DeliveryCompletionStep.ts` | Cursor 多通道交付（A/B/C/F） |
| `lib/workflows/capabilities/completion/WikiCompletionStep.ts` | Wiki 生成调度 |
| `lib/workflows/capabilities/execution/internal-agent/BootstrapSessionExecutionBuilder.ts` | shouldAbort / abortSignal 构建 |
| `lib/agent/coordination/AgentRunCoordinator.ts` | Agent 子任务协调 + tier 取消传播 |
| `dashboard/src/App.tsx` | 前端 Cancel 按钮 |
| `dashboard/src/hooks/useBootstrapSocket.ts` | 前端 Socket.io 事件监听 |
