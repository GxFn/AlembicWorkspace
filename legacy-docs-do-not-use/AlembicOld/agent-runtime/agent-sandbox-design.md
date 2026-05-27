# Agent 终端沙箱安全设计 — macOS 落地方案

> 状态: **P2 Implemented — 全部完成** | 平台: **macOS (darwin)** | 日期: 2026-05-02

## 1. 当前架构与安全缺口

### 1.1 终端执行链路（现状）

```
ToolExecutionPipeline.ts
  │
  ├── GovernanceEngine.decide()
  │     ├── #discover  → manifest.lifecycle / surfaces
  │     ├── #plan      → inputSchema 校验
  │     ├── #approve   → role + SafetyPolicy + gateway + confirm-every-time
  │     └── #execute   → abortSignal 检查
  │
  ├── ToolRouter.execute()
  │     └── TerminalAdapter.execute()
  │           └── executeTerminalRequest()  ← TerminalExecutors.ts
  │                 │
  │                 ├── terminal_run  → TerminalRunExecutor.ts
  │                 │   buildTerminalCommandPolicyInput()
  │                 │   evaluateTerminalCommandPolicy()  ← 黑名单/意图校验
  │                 │   execFileAsync(bin, args, { env: buildTerminalEnvironment(...) })
  │                 │
  │                 ├── terminal_shell → TerminalShellExecutor.ts
  │                 │   buildTerminalShellPolicyInput()
  │                 │   evaluateTerminalShellPolicy()    ← payload 检查
  │                 │   execFileAsync(shell, ['-lc', command], { env: ... })
  │                 │
  │                 └── terminal_pty  → TerminalPtyExecutor.ts
  │                     buildTerminalPtyPolicyInput()
  │                     evaluateTerminalPtyPolicy()
  │                     execFileAsync / execFileWithInput (python3 pty wrapper)
  │
  └── TerminalAudit.recordTerminalAudit()
```

### 1.2 现有防御机制清单

| 文件 | 机制 | 作用 | 实际强制力 |
|------|------|------|-----------|
| `TerminalPolicyShared.ts:10` | `DENIED_BINS` 黑名单 | 拦截 sudo/su/shutdown 等 9 个 | ⚠️ 仅 `terminal_run` |
| `TerminalPolicyShared.ts:22` | `SHELL_BINS` 检测 | 阻止 `terminal_run` 执行 shell | ⚠️ 仅 `terminal_run` |
| `TerminalPolicyShared.ts:142` | `detectDangerousShellPayload` | 正则匹配危险模式 | ⚠️ `terminal_shell/pty` 才用 |
| `TerminalRunPolicy.ts:108` | `network === 'open'` 拒绝 | 阻止 open 网络声明 | 🔴 **声明式，不强制** |
| `TerminalRunPolicy.ts:116` | `filesystem === 'workspace-write'` 拒绝 | 阻止全盘写 | 🔴 **声明式，不强制** |
| `TerminalPolicyShared.ts:82` | `resolveCwd` 限制 cwd | 限制工作目录在项目内 | ⚠️ 仅限参数，进程无限制 |
| `SafetyPolicy.ts:12` | `DANGEROUS_COMMANDS` 正则 | 拦截 rm -rf、curl\|sh 等 | ⚠️ 仅字符串匹配 |
| `TerminalEnvironment.ts:9` | `buildTerminalEnvironment` | 合并环境变量 | 🔴 **透传 process.env** |
| `GovernanceEngine.ts:145` | `confirm-every-time` | 要求人工确认 | ✅ 但测试模式跳过 |
| `TerminalExecutorShared.ts:55` | `setTimeout → SIGTERM` | 超时杀进程 | ✅ 有效 |

### 1.3 关键安全缺口

**缺口 1 — `network`/`filesystem` 意图不强制**

`TerminalPolicyTypes.ts` 定义了 `TerminalNetworkIntent`（`none/allowlisted/open`）和 `TerminalFilesystemIntent`（`read-only/project-write/workspace-write`），但这些字段仅用于 policy 决策和审计日志。实际 `execFileAsync` 调用不做任何 OS 级限制：

```typescript
// TerminalRunExecutor.ts:79 — 直接 execFile，无隔离
const { stdout, stderr } = await execFileAsync(terminal.bin, terminal.args, {
  cwd: executionCwd,
  timeout: terminal.timeoutMs,
  maxBuffer: 1024 * 1024,
  env: buildTerminalEnvironment(process.env, commandEnv),  // ← 透传全部宿主 env
});
```

Agent 声明 `network: 'none'` 但进程仍可 `curl` 外传数据。声明 `filesystem: 'read-only'` 但进程仍可写入任意路径。

**缺口 2 — `buildTerminalEnvironment` 透传宿主环境**

```typescript
// TerminalEnvironment.ts:12
export function buildTerminalEnvironment(
  env: NodeJS.ProcessEnv,          // ← 包含 API_KEY / HOME / PATH 等全部
  commandEnv: Record<string, string> = {}
): NodeJS.ProcessEnv {
  return { ...env, ...commandEnv, ...NON_INTERACTIVE_ENV };
}
```

子进程继承 `HOME`、`SSH_AUTH_SOCK`、`AWS_*`、`OPENAI_API_KEY` 等敏感变量。

**缺口 3 — `terminal_shell`/`terminal_pty` 绕过 `DENIED_BINS`**

`terminal_run` 检查 `DENIED_BINS` + `SHELL_BINS`，但 `terminal_shell` 直接执行 `/bin/sh -lc <command>`，命令字符串内可包含任意二进制。`detectDangerousShellPayload` 正则只覆盖部分模式。

## 2. 设计目标

1. **将声明式意图变为 OS 级强制**：`network: 'none'` → 进程真的无法联网；`filesystem: 'read-only'` → 进程真的只能读
2. **统一收口**：三种 executor（run/shell/pty）共享同一沙箱入口，不遗漏
3. **环境净化**：子进程不继承宿主敏感环境变量
4. **macOS 原生**：使用 Seatbelt (`sandbox-exec` + SBPL)，零外部依赖
5. **对 Agent 透明**：不改变工具接口，沙箱在 executor 层包装
6. **可配置降级**：通过 `ALEMBIC_SANDBOX_MODE` 控制，`disabled` 保持向后兼容

## 3. macOS Seatbelt 沙箱方案

### 3.1 技术选型

macOS 上 `sandbox-exec` + SBPL（Sandbox Profile Language）是当前唯一无需 root、无需 Docker 的进程沙箱：

- OpenAI Codex CLI 在 macOS 上使用此方案
- `sandbox-exec` 虽标记为 deprecated，但至 macOS 15 (Sequoia) 仍可用
- Apple 内部各种系统服务（mds, mdworker, ...）仍使用 SBPL

**限制**：
- 网络只能按 IP/端口过滤，不能按域名 → 需配合 HTTP 代理
- 不支持嵌套沙箱（如 `xcodebuild` 自带沙箱会冲突）
- `sandbox-exec` 路径硬编码为 `/usr/bin/sandbox-exec`

### 3.2 新增模块结构

```
lib/sandbox/
├── SandboxPolicy.ts              # 策略定义 + 预设 + 从 intent 映射
├── SandboxExecutor.ts            # 统一入口，委托平台实现
├── SeatbeltSandbox.ts            # macOS sandbox-exec + SBPL 生成
├── SeatbeltProfileBuilder.ts     # SBPL profile 模板化构建
├── SandboxEnvironment.ts         # 环境变量净化
├── SandboxNetworkProxy.ts        # HTTP CONNECT 域名白名单代理
├── SandboxProbe.ts               # 运行时能力检测
└── __tests__/
    ├── SeatbeltProfileBuilder.test.ts
    ├── SandboxEnvironment.test.ts
    └── SandboxNetworkProxy.test.ts
```

### 3.3 SandboxPolicy — 从 TerminalPolicyInput 映射

核心设计：**不新增接口**，而是将现有 `TerminalNetworkIntent` / `TerminalFilesystemIntent` 映射到 OS 级策略，使声明式意图成为强制约束。

```typescript
// lib/sandbox/SandboxPolicy.ts

export type SandboxMode = 'enforce' | 'audit' | 'disabled';

export interface SandboxProfile {
  mode: SandboxMode;

  filesystem: {
    readPaths: string[];
    writePaths: string[];
    denyPaths: string[];
    tempDir: string;       // 每次执行的沙箱 tmpdir
  };

  network: {
    allow: boolean;        // false = 阻断所有出站
    proxyPort?: number;    // 当 allowedDomains.length > 0 时启用代理
    allowedDomains: string[];
  };

  environment: {
    passthrough: string[]; // 允许透传的环境变量 key
    inject: Record<string, string>; // 强制注入
    strip: string[];       // 显式移除（即使在 passthrough 中）
  };

  limits: {
    timeoutMs: number;
    maxOutputBytes: number;
  };
}

/**
 * 从现有 TerminalPolicyInput 的声明式意图构建 OS 级沙箱策略。
 *
 * 映射规则:
 *   network: 'none'       → 阻断所有出站
 *   network: 'allowlisted' → 启动代理，仅放行配置域名
 *   network: 'open'       → (当前 terminal_run policy 已拒绝此值)
 *
 *   filesystem: 'read-only'      → 仅 readPaths + tmpdir 可写
 *   filesystem: 'project-write'  → 追加 projectRoot 可写
 *   filesystem: 'workspace-write' → (当前 terminal_run policy 已拒绝此值)
 */
export function buildSandboxProfile(input: {
  network: 'none' | 'allowlisted' | 'open';
  filesystem: 'read-only' | 'project-write' | 'workspace-write';
  cwd: string;
  projectRoot: string;
  timeoutMs: number;
  maxOutputBytes?: number;
  env?: Record<string, string>;
}): SandboxProfile {
  const globalMode = getSandboxMode();
  if (globalMode === 'disabled') {
    return DISABLED_PROFILE;
  }

  const tempDir = buildSandboxTempDir();

  const readPaths = [
    input.projectRoot,
    '/usr/lib', '/usr/bin', '/usr/local', '/usr/share',
    '/Library/Frameworks', '/System/Library',
    '/Applications/Xcode.app',  // xcodebuild 等工具
    '/bin', '/sbin',
    '/private/tmp',             // macOS tmp 实际路径
    '/private/var/folders',     // NSTemporaryDirectory
    '/etc', '/dev',
    '/var/run',
    process.env.HOME ? `${process.env.HOME}/Library/Developer` : '',
  ].filter(Boolean);

  const writePaths = [tempDir];
  if (input.filesystem === 'project-write' || input.filesystem === 'workspace-write') {
    writePaths.push(input.projectRoot);
  }

  const denyPaths = [
    `${process.env.HOME}/.ssh`,
    `${process.env.HOME}/.gnupg`,
    `${process.env.HOME}/.aws`,
    `${process.env.HOME}/.config/gh`,
    `${input.projectRoot}/.env`,
    `${input.projectRoot}/.git`,
  ];

  const networkAllow = input.network !== 'none';
  const allowedDomains = input.network === 'allowlisted'
    ? getConfiguredAllowedDomains()
    : [];

  return {
    mode: globalMode,
    filesystem: { readPaths, writePaths, denyPaths, tempDir },
    network: {
      allow: networkAllow,
      allowedDomains,
      proxyPort: allowedDomains.length > 0 ? undefined : undefined,
    },
    environment: {
      passthrough: ENV_PASSTHROUGH,
      inject: {
        HOME: tempDir,              // 重定向 HOME 到沙箱 tmp
        TMPDIR: tempDir,
        SANDBOX: '1',               // 标识沙箱环境
        ...input.env,
      },
      strip: ENV_STRIP,
    },
    limits: {
      timeoutMs: input.timeoutMs,
      maxOutputBytes: input.maxOutputBytes ?? 1_048_576,
    },
  };
}

/** 从 ALEMBIC_SANDBOX_MODE 读取，默认 'enforce' */
function getSandboxMode(): SandboxMode {
  const v = process.env.ALEMBIC_SANDBOX_MODE?.trim().toLowerCase();
  if (v === 'disabled' || v === '0' || v === 'off') return 'disabled';
  if (v === 'audit') return 'audit';
  return 'enforce';
}

// 安全的环境变量白名单 — 仅透传构建/分析必需项
const ENV_PASSTHROUGH = [
  'PATH', 'LANG', 'LC_ALL', 'LC_CTYPE', 'TERM',
  'DEVELOPER_DIR',        // Xcode 路径
  'SDKROOT',
  'MACOSX_DEPLOYMENT_TARGET',
  'SWIFT_DETERMINISTIC_HASHING',
  'NODE_PATH',
  'RUBY_VERSION',
  'GEM_HOME', 'GEM_PATH',
  'GOPATH', 'GOROOT',
  'JAVA_HOME',
  'ANDROID_HOME', 'ANDROID_SDK_ROOT',
  'HOMEBREW_PREFIX', 'HOMEBREW_CELLAR',
  'CI', 'GIT_PAGER', 'GIT_TERMINAL_PROMPT', 'LESS', 'PAGER',
];

// 显式移除 — 即使 PATH 中可能间接引用
const ENV_STRIP = [
  'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'DEEPSEEK_API_KEY',
  'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_SESSION_TOKEN',
  'GITHUB_TOKEN', 'GH_TOKEN', 'GITLAB_TOKEN',
  'SSH_AUTH_SOCK', 'SSH_AGENT_PID',
  'NPM_TOKEN', 'YARN_TOKEN',
  'DOCKER_HOST', 'KUBECONFIG',
  'DATABASE_URL', 'REDIS_URL',
  'ALEMBIC_AI_API_KEY',
];
```

### 3.4 SeatbeltProfileBuilder — SBPL 生成

```typescript
// lib/sandbox/SeatbeltProfileBuilder.ts

/**
 * 生成 macOS Seatbelt SBPL profile 字符串。
 *
 * SBPL 要点:
 *   - (version 1) 必须在第一行
 *   - (deny default) 为全局默认拒绝
 *   - deny 规则优先于同级 allow
 *   - subpath 递归匹配子目录
 *   - literal 精确匹配文件
 */
export function buildSeatbeltProfile(profile: SandboxProfile): string {
  const lines: string[] = [
    '(version 1)',
    '(deny default)',
    '',
    '; ── 基础系统访问 ──',
    '(allow process-exec*)',
    '(allow process-fork)',
    '(allow signal (target self))',
    '(allow sysctl-read)',
    '(allow mach-lookup)',
    '(allow mach-register)',
    '(allow ipc-posix-shm-read*)',
    '(allow ipc-posix-shm-write-create)',
    '(allow system-socket)',
    '',
  ];

  // ── 文件系统 deny（优先级最高）──
  lines.push('; ── 文件系统 deny ──');
  for (const p of profile.filesystem.denyPaths) {
    if (!p) continue;
    lines.push(`(deny file-read* (subpath ${sbplQuote(p)}))`);
    lines.push(`(deny file-write* (subpath ${sbplQuote(p)}))`);
  }
  lines.push('');

  // ── 文件系统 read ──
  lines.push('; ── 文件系统 read ──');
  for (const p of profile.filesystem.readPaths) {
    if (!p) continue;
    lines.push(`(allow file-read* (subpath ${sbplQuote(p)}))`);
  }
  // dyld 共享缓存 + 系统库必须可读
  lines.push('(allow file-read* (subpath "/usr/lib/dyld"))');
  lines.push('(allow file-read* (literal "/dev/null"))');
  lines.push('(allow file-read* (literal "/dev/urandom"))');
  lines.push('(allow file-read* (literal "/dev/random"))');
  lines.push('');

  // ── 文件系统 write ──
  lines.push('; ── 文件系统 write ──');
  for (const p of profile.filesystem.writePaths) {
    if (!p) continue;
    lines.push(`(allow file-write* (subpath ${sbplQuote(p)}))`);
  }
  lines.push('(allow file-write* (literal "/dev/null"))');
  lines.push('');

  // ── 网络 ──
  lines.push('; ── 网络 ──');
  if (!profile.network.allow) {
    lines.push('(deny network-outbound)');
    // DNS 仍需放行（某些工具启动时查 localhost）
    lines.push('(allow network-outbound (local udp "*:53"))');
    lines.push('(allow network-outbound (remote unix-socket))');
  } else if (profile.network.proxyPort) {
    // 仅允许连接本地代理
    lines.push('(deny network-outbound)');
    lines.push('(allow network-outbound (local udp "*:53"))');
    lines.push(`(allow network-outbound (remote tcp "localhost:${profile.network.proxyPort}"))`);
    lines.push('(allow network-outbound (remote unix-socket))');
  } else {
    lines.push('(allow network-outbound)');
  }
  // 入站一律禁止
  lines.push('(deny network-inbound)');
  lines.push('');

  return lines.join('\n');
}

function sbplQuote(value: string): string {
  // SBPL 路径用双引号包裹，内部双引号需要转义
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}
```

### 3.5 SandboxExecutor — 统一执行入口

这是核心集成点，**替代三个 Executor 中直接调用 `execFileAsync`/`spawn`** 的方式：

```typescript
// lib/sandbox/SandboxExecutor.ts

import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import Logger from '#infra/logging/Logger.js';
import type { SandboxProfile } from './SandboxPolicy.js';
import { buildSeatbeltProfile } from './SeatbeltProfileBuilder.js';

const SANDBOX_EXEC = '/usr/bin/sandbox-exec';

export interface SandboxExecOptions {
  bin: string;
  args: string[];
  cwd: string;
  env: Record<string, string>;
  timeout: number;
  maxBuffer: number;
  signal?: AbortSignal;
}

export interface SandboxExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  sandboxed: boolean;
  violations?: string;
}

/**
 * 在 macOS Seatbelt 沙箱中执行命令。
 *
 * 流程:
 *   1. 从 SandboxProfile 生成 SBPL 临时文件
 *   2. 构建净化后的环境变量
 *   3. 通过 sandbox-exec -f <profile> <command> 执行
 *   4. 超时/输出限制/进程树清理
 *   5. 清理临时 profile 文件
 *
 * 降级场景:
 *   - profile.mode === 'disabled' → 直接执行（无沙箱）
 *   - profile.mode === 'audit'   → 沙箱执行但 violation 不阻断
 *   - sandbox-exec 不存在        → 降级到直接执行 + 警告日志
 */
export async function sandboxExec(
  options: SandboxExecOptions,
  profile: SandboxProfile
): Promise<SandboxExecResult> {
  // 降级：disabled 模式或 sandbox-exec 不可用
  if (profile.mode === 'disabled' || !(await isSandboxExecAvailable())) {
    if (profile.mode !== 'disabled') {
      Logger.warn('[Sandbox] sandbox-exec not available, executing without sandbox');
    }
    return directExec(options);
  }

  // 构建净化环境
  const cleanEnv = buildSandboxEnv(options.env, profile);

  // 创建临时目录
  await fs.mkdir(profile.filesystem.tempDir, { recursive: true });

  // 写入 SBPL profile
  const sbpl = buildSeatbeltProfile(profile);
  const profilePath = path.join(
    os.tmpdir(),
    `alembic-sandbox-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.sb`
  );
  await fs.writeFile(profilePath, sbpl, { mode: 0o400 });

  try {
    const result = await execInSandbox(
      profilePath,
      options.bin,
      options.args,
      {
        cwd: options.cwd,
        env: cleanEnv,
        timeout: options.timeout,
        maxBuffer: options.maxBuffer,
        signal: options.signal,
      }
    );
    return { ...result, sandboxed: true };
  } finally {
    // 清理
    await fs.unlink(profilePath).catch(() => {});
    await fs.rm(profile.filesystem.tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

function buildSandboxEnv(
  commandEnv: Record<string, string>,
  profile: SandboxProfile
): NodeJS.ProcessEnv {
  const result: Record<string, string> = {};

  // 只透传白名单中的宿主环境变量
  for (const key of profile.environment.passthrough) {
    if (process.env[key] !== undefined) {
      result[key] = process.env[key]!;
    }
  }

  // 合并命令级环境变量
  Object.assign(result, commandEnv);

  // 注入沙箱级变量
  Object.assign(result, profile.environment.inject);

  // 最后移除敏感变量（覆盖可能通过 commandEnv 传入的）
  for (const key of profile.environment.strip) {
    delete result[key];
  }

  return result;
}

function execInSandbox(
  profilePath: string,
  bin: string,
  args: string[],
  options: { cwd: string; env: NodeJS.ProcessEnv; timeout: number; maxBuffer: number; signal?: AbortSignal }
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve, reject) => {
    const child = spawn(SANDBOX_EXEC, ['-f', profilePath, bin, ...args], {
      cwd: options.cwd,
      env: options.env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    let settled = false;
    let killed = false;

    const finish = (cb: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      options.signal?.removeEventListener('abort', abort);
      cb();
    };

    const abort = () => { killed = true; killProcessTree(child.pid); };
    const timer = setTimeout(() => { killed = true; killProcessTree(child.pid); }, options.timeout);
    options.signal?.addEventListener('abort', abort, { once: true });

    const capture = (target: Buffer[], chunk: Buffer) => {
      target.push(chunk);
      if (Buffer.concat(target).byteLength > options.maxBuffer) {
        killed = true;
        killProcessTree(child.pid);
      }
    };

    child.stdout?.on('data', (c: Buffer) => capture(stdout, c));
    child.stderr?.on('data', (c: Buffer) => capture(stderr, c));
    child.on('error', (err) => finish(() => reject(err)));
    child.on('close', (code) => {
      finish(() => resolve({
        stdout: Buffer.concat(stdout).toString('utf8'),
        stderr: Buffer.concat(stderr).toString('utf8'),
        exitCode: code ?? (killed ? 137 : 1),
      }));
    });
  });
}

/** 杀死进程树（macOS 无 cgroup，用 process group） */
function killProcessTree(pid: number | undefined) {
  if (!pid) return;
  try {
    process.kill(-pid, 'SIGKILL');  // 负数 = process group
  } catch {
    try { process.kill(pid, 'SIGKILL'); } catch { /* ignore */ }
  }
}

let _sandboxExecAvailable: boolean | null = null;
async function isSandboxExecAvailable(): Promise<boolean> {
  if (_sandboxExecAvailable !== null) return _sandboxExecAvailable;
  try {
    await fs.access(SANDBOX_EXEC, fs.constants.X_OK);
    _sandboxExecAvailable = true;
  } catch {
    _sandboxExecAvailable = false;
  }
  return _sandboxExecAvailable;
}

async function directExec(options: SandboxExecOptions): Promise<SandboxExecResult> {
  // 回退到无沙箱直接执行（保持现有行为）
  return new Promise((resolve, reject) => {
    const child = spawn(options.bin, options.args, {
      cwd: options.cwd,
      env: options.env as NodeJS.ProcessEnv,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    // ... 与 execInSandbox 相同的超时/输出/进程树逻辑
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    let settled = false;

    const finish = (cb: () => void) => { if (!settled) { settled = true; cb(); } };

    child.stdout?.on('data', (c: Buffer) => stdout.push(c));
    child.stderr?.on('data', (c: Buffer) => stderr.push(c));
    child.on('error', (err) => finish(() => reject(err)));
    child.on('close', (code) => {
      finish(() => resolve({
        stdout: Buffer.concat(stdout).toString('utf8'),
        stderr: Buffer.concat(stderr).toString('utf8'),
        exitCode: code ?? 1,
        sandboxed: false,
      }));
    });
  });
}
```

### 3.6 集成点 — 改造 Executor

**改动范围最小化**：仅改 `TerminalExecutorShared.ts`（L9 `execFileAsync = promisify(execFile)`, L18 `execFileWithInput`），在调用层插入沙箱包装。三个 Executor 文件只改 1 行调用（`execFileAsync` → `sandboxedExecFile`）。

```typescript
// TerminalExecutorShared.ts — 改造方案

// 方案: 新增 sandboxedExecFile 函数，替代现有 execFileAsync

import { buildSandboxProfile, type SandboxProfile } from '#sandbox/SandboxPolicy.js';
import { sandboxExec } from '#sandbox/SandboxExecutor.js';

/**
 * 包装 execFileAsync，在 sandbox profile 可用时走沙箱路径。
 *
 * 调用方不需要改动 — 签名与 execFileAsync 兼容。
 */
export async function sandboxedExecFile(
  bin: string,
  args: string[],
  options: {
    cwd: string;
    timeout: number;
    maxBuffer: number;
    signal?: AbortSignal;
    env: NodeJS.ProcessEnv;
  },
  sandboxInput?: {
    network: 'none' | 'allowlisted' | 'open';
    filesystem: 'read-only' | 'project-write' | 'workspace-write';
    projectRoot: string;
  }
): Promise<{ stdout: string; stderr: string }> {
  if (!sandboxInput) {
    // 无沙箱上下文，保持原行为
    return execFileAsync(bin, args, options);
  }

  const profile = buildSandboxProfile({
    network: sandboxInput.network,
    filesystem: sandboxInput.filesystem,
    cwd: options.cwd,
    projectRoot: sandboxInput.projectRoot,
    timeoutMs: options.timeout,
    maxOutputBytes: options.maxBuffer,
  });

  if (profile.mode === 'disabled') {
    return execFileAsync(bin, args, options);
  }

  const result = await sandboxExec(
    { bin, args, cwd: options.cwd, env: options.env as Record<string, string>,
      timeout: options.timeout, maxBuffer: options.maxBuffer, signal: options.signal },
    profile
  );

  if (result.exitCode !== 0) {
    const error = new Error(result.stderr || `Process exited with code ${result.exitCode}`) as ExecFailure;
    error.code = result.exitCode;
    error.stdout = result.stdout;
    error.stderr = result.stderr;
    throw error;
  }

  return { stdout: result.stdout, stderr: result.stderr };
}
```

**三个 Executor 的改动对比**：

```
TerminalRunExecutor.ts:79
  现在: execFileAsync(terminal.bin, terminal.args, { ... })
  改后: sandboxedExecFile(terminal.bin, terminal.args, { ... },
        { network: terminal.network, filesystem: terminal.filesystem,
          projectRoot: request.context.projectRoot })

TerminalShellExecutor.ts:46
  现在: execFileAsync(shell.shell, ['-lc', shell.command], { ... })
  改后: sandboxedExecFile(shell.shell, ['-lc', shell.command], { ... },
        { network: shell.network, filesystem: shell.filesystem,
          projectRoot: shell.projectRoot })

TerminalPtyExecutor.ts:76-79
  现在: execFileAsync(command.bin, command.args, execOptions)
        execFileWithInput(command.bin, command.args, pty.stdin, execOptions)
  改后: sandboxedExecFile(command.bin, command.args, execOptions,
        { network: pty.network, filesystem: pty.filesystem,
          projectRoot: pty.projectRoot })
  注意: execFileWithInput (stdin 模式) 需同步包装
```

## 4. 边界情况处理

### 4.1 sandbox-exec 不可用

```
检测: fs.access('/usr/bin/sandbox-exec', X_OK)
降级: 直接执行 + Logger.warn('[Sandbox] sandbox-exec not available')
审计: sandboxed: false 标记在 TerminalAudit 中
```

### 4.2 嵌套沙箱冲突

macOS 不支持嵌套 `sandbox-exec`。`xcodebuild`、`swift build` 内部自带沙箱：

```
解决: SandboxProbe 检测目标二进制
      已知冲突列表: ['xcodebuild', 'swift', 'swiftc', 'xcrun']
      冲突时: 跳过 sandbox-exec 包装，仅做环境净化
      审计: sandboxed: false, reason: 'nested-sandbox-conflict'
```

### 4.3 Homebrew / 非标准路径

macOS 上工具链分布复杂：

```
/opt/homebrew/bin     ← Apple Silicon Homebrew
/usr/local/bin        ← Intel Homebrew
/usr/local/Cellar     ← Homebrew 包存储
/Library/Frameworks   ← 系统框架
~/Library/Developer   ← Xcode 工具链
```

SBPL readPaths 需包含这些路径。通过 `HOMEBREW_PREFIX` 环境变量动态检测：

```typescript
function homebrewPaths(): string[] {
  const prefix = process.env.HOMEBREW_PREFIX;
  if (prefix) return [prefix];
  // 默认覆盖两种常见安装
  return ['/opt/homebrew', '/usr/local'];
}
```

### 4.4 进程树清理

macOS 无 cgroup，无法限制子进程资源。超时时需要杀死进程组：

```typescript
// spawn 时设置 detached: true 创建独立进程组
const child = spawn(SANDBOX_EXEC, [...], { detached: true, ... });

// 超时时 kill 整个进程组
process.kill(-child.pid!, 'SIGKILL');
```

### 4.5 SBPL Profile 临时文件安全

```
- 写入 /tmp/alembic-sandbox-*.sb
- mode: 0o400 (只读)
- finally 块确保清理
- 文件名包含随机后缀防碰撞
```

### 4.6 审计集成

扩展现有 `TerminalAudit.ts` 的 `buildTerminalAuditData`：

```typescript
// 新增 sandbox 字段
sandbox: {
  enabled: profile.mode !== 'disabled',
  mode: profile.mode,
  sandboxed: result.sandboxed,
  violations: result.violations,
  envStripped: profile.environment.strip.length,
  networkDenied: !profile.network.allow,
  filesystemMode: input.filesystem,
}
```

## 5. 配置方案

### 5.1 环境变量

```bash
# ═══ 沙箱配置 ═══

# 沙箱模式: enforce(默认) | audit(沙箱执行但violation不阻断) | disabled(关闭)
ALEMBIC_SANDBOX_MODE=enforce

# 网络白名单域名 (逗号分隔，仅 network='allowlisted' 时生效)
# ALEMBIC_SANDBOX_ALLOWED_DOMAINS=registry.npmjs.org,github.com

# 额外可读路径 (逗号分隔，追加到预设)
# ALEMBIC_SANDBOX_EXTRA_READ_PATHS=/opt/custom-sdk

# 已知嵌套沙箱冲突二进制 (逗号分隔，追加到内置列表)
# ALEMBIC_SANDBOX_NESTED_CONFLICT_BINS=
```

### 5.2 与 test-mode 统一

在 `test-mode.ts` 的 `TestModeConfig` 中增加沙箱配置暴露：

```typescript
export interface TestModeConfig {
  enabled: boolean;
  bootstrapDims: string[];
  rescanDims: string[];
  terminal: TestTerminalConfig;
  sandbox: {                    // 新增
    mode: SandboxMode;
    available: boolean;         // sandbox-exec 是否可用
  };
}
```

### 5.3 前端展示

Header badge 逻辑扩展：

| 条件 | badge | 颜色 |
|------|-------|------|
| `sandbox.mode === 'enforce'` | 🔒 沙箱 | 绿色 |
| `sandbox.mode === 'audit'` | 👁 审计 | 蓝色 |
| `sandbox.mode === 'disabled'` | ⚠️ 无沙箱 | 红色 |
| `sandbox.available === false` | ⚠️ 不可用 | 灰色 |

## 6. 实施计划

### P0 — 核心沙箱 + 环境净化 ✅ 已完成

- [x] `SandboxPolicy.ts` — 策略定义 + intent→profile 映射
- [x] `SeatbeltProfileBuilder.ts` — SBPL 生成 + 46 单元测试
- [x] `SandboxEnvironment.ts` — 环境变量净化
- [x] `SandboxExecutor.ts` — sandbox-exec 包装 + 3 种降级路径
- [x] `SandboxProbe.ts` — 能力检测 + 嵌套冲突检测
- [x] 改造 `TerminalExecutorShared.ts` — `sandboxedExecFile` / `sandboxedExecFileWithInput`
- [x] 改造 `TerminalRunExecutor.ts` / `TerminalShellExecutor.ts` / `TerminalPtyExecutor.ts`
- [x] `TerminalAudit.ts` — sandbox 审计字段
- [x] `test-mode.ts` — `SandboxStatusConfig` 集成
- [x] 前端 Header sandbox badge（enforce/audit/disabled 三态）
- [x] `.env.example` + i18n（zh/en）
- [x] `package.json` — `#sandbox/*` 路径别名

### P1 — 网络代理 + Violation 解析 ✅ 已完成

- [x] `SandboxNetworkProxy.ts` — HTTP CONNECT 代理 + 域名白名单 (7 单元测试)
- [x] SBPL 网络规则联动代理端口（proxyPort > 0 时限制出站到 localhost:port）
- [x] 代理生命周期管理（SandboxExecutor 按需启停 + finally 清理）
- [x] `SandboxViolationParser.ts` — violation 日志解析 + 摘要化 (8 单元测试)
- [x] SandboxExecutor 自动解析 violation 并记入审计日志
- [x] SBPL 安全模型优化：全局 file-read* + deny-list 模式（兼容 macOS dyld）
- [x] 路径符号链接规范化（safeRealpath / realTmpdir）
- [x] 集成测试：9 个端到端沙箱执行测试（读/写/网络/环境/降级）

### P2 — 加固 + 审计增强 ✅ 已完成

- [x] Homebrew 多路径兼容性验证（Apple Silicon / Intel / 自定义 HOMEBREW_PREFIX，5 个测试）
- [x] 审计数据增强：violations + envStripped + networkDenied + filesystemMode 完整传递
- [x] sandbox 元数据从 SandboxExecutor → sandboxedExecFile → 三个 Executor → structuredContent → TerminalAudit 全链路贯通
- [x] 前端 sandbox.available === false 灰色 badge + i18n
- [x] 全量测试：75 通过（单元 66 + 集成 9）

## 7. 参考

- [OpenAI Codex sandbox-exec 实现](https://pierce.dev/notes/a-deep-dive-on-agent-sandboxes) — macOS Seatbelt SBPL 生成
- [sbexec — macOS sandbox-exec wrapper with network proxy](https://crates.io/crates/sbexec) — 域名级网络过滤
- [sandvault — macOS user account + sandbox-exec](https://github.com/webcoyote/sandvault) — 嵌套沙箱处理
- [Apple SBPL 参考](https://reverse.put.as/wp-content/uploads/2011/09/Apple-Sandbox-Guide-v1.0.pdf)
