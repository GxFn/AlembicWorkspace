#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const workspaceRoot = process.cwd();
const evidenceRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname));
const pluginRoot = path.join(workspaceRoot, 'AlembicPlugin');
const localMcpEntry = path.join(pluginRoot, 'dist', 'bin', 'host-mcp.js');
const codexShellRoot = path.join(pluginRoot, 'plugins', 'alembic-codex');
const claudeShellRoot = path.join(pluginRoot, 'plugins', 'alembic-claude-code');
const sandboxRoot = path.join(evidenceRoot, 'sandbox');
const transcriptDir = path.join(evidenceRoot, 'transcripts');

const pluginRequire = createRequire(path.join(pluginRoot, 'package.json'));
const { Client } = await import(
  pathToFileURL(pluginRequire.resolve('@modelcontextprotocol/sdk/client/index.js')).href
);
const { StdioClientTransport } = await import(
  pathToFileURL(pluginRequire.resolve('@modelcontextprotocol/sdk/client/stdio.js')).href
);

const MANAGED_BEGIN = '<!-- alembic:managed-guidance:begin -->';
const MANAGED_END = '<!-- alembic:managed-guidance:end -->';

fs.mkdirSync(sandboxRoot, { recursive: true });
fs.mkdirSync(transcriptDir, { recursive: true });

const report = {
  ok: false,
  generatedAt: new Date().toISOString(),
  workspaceRoot,
  evidenceRoot,
  plugin: {
    root: pluginRoot,
    localMcpEntry,
    localMcpEntryExists: fs.existsSync(localMcpEntry),
    codexShellRoot,
    claudeShellRoot,
    buildManifest: readJsonIfExists(path.join(pluginRoot, 'dist', '.build-manifest.json')),
    git: gitFacts(pluginRoot),
  },
  rootsTouched: [],
  installedShellProbe: {},
  hosts: {},
  quiet: {},
  cleanup: {},
  contract: {},
  errors: [],
  conclusion: null,
};

report.installedShellProbe.codexCache = probeInstalledCodexCache();
report.installedShellProbe.codexDryRun = runShellDryRun(
  '/Users/gaoxuefeng/.codex/plugins/cache/gxfn/alembic/0.2.0/bin/alembic-start.mjs'
);

for (const host of ['codex', 'claude-code']) {
  const hostProject = prepareProject(`real-nonempty-${host}`, host);
  report.rootsTouched.push(hostProject.projectRoot, hostProject.homeRoot);
  report.hosts[host] = await runHostActivationFlow(host, hostProject);
}

report.quiet.emptyCodex = await runQuietFlow('codex', prepareEmptyProject('empty-codex', 'codex'));
report.quiet.ghostClaude = await runGhostQuietFlow(
  'claude-code',
  prepareProject('ghost-claude', 'claude-code')
);
report.rootsTouched.push(report.quiet.emptyCodex.projectRoot, report.quiet.emptyCodex.homeRoot);
report.rootsTouched.push(report.quiet.ghostClaude.projectRoot, report.quiet.ghostClaude.homeRoot);

report.cleanup.codex = await runKnowledgeRemovalCleanup('codex', report.hosts.codex);
report.contract = buildContractSummary(report.hosts);
report.ok = computePass(report);
report.conclusion = report.ok
  ? 'PASS: local built Host MCP validated dual host managed guidance, skills, tool usage, quiet restraint, cleanup, and tool contract shape.'
  : 'BLOCKED/NEEDS-REVIEW: one or more P4 acceptance checks failed; see checks and errors.';

const reportPath = path.join(evidenceRoot, 'p4-dual-host-realtest-report.json');
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ ok: report.ok, reportPath, conclusion: report.conclusion }, null, 2)}\n`);

function prepareProject(name, host) {
  const projectRoot = path.join(sandboxRoot, name);
  const homeRoot = path.join(sandboxRoot, `${name}-home`);
  fs.rmSync(projectRoot, { recursive: true, force: true });
  fs.rmSync(homeRoot, { recursive: true, force: true });
  fs.mkdirSync(path.join(projectRoot, 'src'), { recursive: true });
  fs.mkdirSync(homeRoot, { recursive: true });
  fs.writeFileSync(
    path.join(projectRoot, 'package.json'),
    JSON.stringify(
      {
        name: name.replace(/[^a-z0-9-]/g, '-'),
        version: '0.1.0',
        type: 'module',
        scripts: { test: 'node src/index.js' },
      },
      null,
      2
    ) + '\n'
  );
  fs.writeFileSync(
    path.join(projectRoot, 'README.md'),
    `# ${name}\n\nA small non-empty project used by Wakeflow P4 dual-host activation realtest.\n`
  );
  fs.writeFileSync(
    path.join(projectRoot, 'src', 'greeting.js'),
    "export function greet(name) {\n  return `Hello, ${name}!`;\n}\n"
  );
  fs.writeFileSync(
    path.join(projectRoot, 'src', 'index.js'),
    "import { greet } from './greeting.js';\n\nexport function run() {\n  return greet('Alembic');\n}\n\nconsole.log(run());\n"
  );
  const hostFile = host === 'claude-code' ? 'CLAUDE.md' : 'AGENTS.md';
  fs.writeFileSync(
    path.join(projectRoot, hostFile),
    [
      `# User ${hostFile} Content`,
      '',
      `This line is user-owned and must survive Alembic managed block upsert/removal for ${host}.`,
      '',
    ].join('\n')
  );
  spawnSync('git', ['init'], { cwd: projectRoot, encoding: 'utf8' });
  spawnSync('git', ['add', '.'], { cwd: projectRoot, encoding: 'utf8' });
  spawnSync('git', ['commit', '-m', 'initial fixture'], { cwd: projectRoot, encoding: 'utf8' });
  return { homeRoot, hostFile, projectRoot };
}

function prepareEmptyProject(name, host) {
  const projectRoot = path.join(sandboxRoot, name);
  const homeRoot = path.join(sandboxRoot, `${name}-home`);
  fs.rmSync(projectRoot, { recursive: true, force: true });
  fs.rmSync(homeRoot, { recursive: true, force: true });
  fs.mkdirSync(projectRoot, { recursive: true });
  fs.mkdirSync(homeRoot, { recursive: true });
  spawnSync('git', ['init'], { cwd: projectRoot, encoding: 'utf8' });
  return { homeRoot, hostFile: host === 'claude-code' ? 'CLAUDE.md' : 'AGENTS.md', projectRoot };
}

async function runHostActivationFlow(host, project) {
  const flow = {
    host,
    projectRoot: project.projectRoot,
    homeRoot: project.homeRoot,
    hostFile: project.hostFile,
    stdoutTranscript: path.join(transcriptDir, `${host}-mcp-transcript.jsonl`),
    stderr: [],
    toolCalls: [],
    checks: {},
    files: {},
  };
  const client = await connectHostMcp(host, project, flow);
  try {
    flow.tools = (await client.listTools()).tools.map((tool) => ({
      name: tool.name,
      inputSchemaKeys: Object.keys(tool.inputSchema || {}),
      required: tool.inputSchema?.required ?? [],
    }));
    flow.statusBefore = await callTool(flow, client, 'alembic_status', { projectRoot: project.projectRoot });
    flow.init = await callTool(flow, client, 'alembic_init', {
      projectRoot: project.projectRoot,
      seed: false,
      standard: true,
    });
    flow.statusAfterInit = await callTool(flow, client, 'alembic_status', {
      projectRoot: project.projectRoot,
    });
    flow.planDraft = await callTool(flow, client, 'alembic_plan', {
      operation: 'draft',
      generationStage: 'coldStart',
      projectRoot: project.projectRoot,
      hints: {
        goal: 'P4 dual-host activation realtest on a small JavaScript project.',
        maxBudget: 2,
      },
      projectProfile: {
        primaryLanguage: 'javascript',
        projectType: 'node-library',
        moduleCount: 1,
        fileCount: 4,
      },
    });
    flow.planConfirm = await callTool(flow, client, 'alembic_plan', {
      operation: 'confirm',
      generationStage: 'coldStart',
      projectRoot: project.projectRoot,
      projectProfile: findProjectProfile(flow.planDraft),
      selectedDimensions: [
        {
          dimensionId: 'ts-js-module',
          priority: 1,
          rationale: 'Fixture is an ESM JavaScript project; module export/import shape is central.',
          targetRecipes: 3,
        },
        {
          dimensionId: 'agent-guidelines',
          priority: 2,
          rationale: 'P4 requires host-agent proactive Alembic guidance in context.',
          targetRecipes: 3,
        },
      ],
      scale: {
        maxFiles: 8,
        contentMaxLines: 80,
        depthLevels: ['files'],
        totalRecipeBudget: 6,
      },
      moduleBindings: [
        {
          moduleId: 'src',
          modulePath: 'src',
          dimensions: ['ts-js-module', 'agent-guidelines'],
          priority: 1,
          targetRecipes: 6,
        },
      ],
      evidenceRefs: [
        {
          kind: 'project-context',
          ref: findProjectInfoRef(flow.planDraft) || 'projectInfoTree',
          detail: 'Plan draft ProjectInfoTree for P4 activation fixture.',
        },
        {
          kind: 'human',
          ref: 'Wakeflow P4 Test dispatch p4-final-dual-host-proactive-activation-realtest-t1',
          detail: 'Controller-authorized Test validation scope.',
        },
      ],
      rationale: 'Bounded cold-start selection for P4 Test fixture.',
      plannedNextActions: [
        {
          order: 1,
          tool: 'alembic_bootstrap',
          reason: 'Create bounded cold-start briefing for fixture.',
          dimensionIds: ['ts-js-module', 'agent-guidelines'],
          modulePaths: ['src'],
        },
      ],
    });
    const planSelection = findPlanSelection(flow.planConfirm);
    flow.extractedPlanSelection = planSelection;
    if (planSelection) {
      flow.bootstrap = await callTool(flow, client, 'alembic_bootstrap', {
        projectRoot: project.projectRoot,
        generationStage: 'coldStart',
        planSelection,
        testMode: true,
        dimensions: ['ts-js-module', 'agent-guidelines'],
        scaleOverride: { maxFiles: 8, contentMaxLines: 80, totalRecipeBudget: 6 },
        rescanId: `${host}-p4-cold-start-${Date.now()}`,
      });
    }
    const sessionId = findBootstrapSessionId(flow.bootstrap);
    flow.bootstrapSessionId = sessionId;
    flow.submitKnowledge = await callTool(flow, client, 'alembic_submit_knowledge', {
      projectRoot: project.projectRoot,
      source: `p4-${host}-realtest`,
      skipConsolidation: true,
      dimensionId: 'ts-js-module',
      ...(sessionId
        ? {
            sessionId,
            bootstrapSessionRef: `bootstrap-session:${sessionId}`,
          }
        : {}),
      items: [buildKnowledgeItem(host)],
    });
    flow.dimensionComplete = await callTool(flow, client, 'alembic_dimension_complete', {
      projectRoot: project.projectRoot,
      dimensionId: 'ts-js-module',
      ...(sessionId ? { sessionId } : {}),
      candidateCount: 1,
      analysisText:
        'P4 realtest completed the fixture ts-js-module unit. The project uses a named greet export in src/greeting.js, src/index.js imports it, and host guidance should now be projected without manual refresh.',
      keyFindings: [
        'Named ESM exports are the local module boundary.',
        'Host guidance must prompt prime/search/map/graph before code work.',
      ],
      referencedFiles: ['src/greeting.js', 'src/index.js', 'package.json'],
    });
    flow.files.afterDimensionComplete = inspectHostArtifacts(project.projectRoot, project.hostFile);
    flow.toolsAfterDimensionComplete = (await client.listTools()).tools.map((tool) => ({
      name: tool.name,
      inputSchemaKeys: Object.keys(tool.inputSchema || {}),
      required: tool.inputSchema?.required ?? [],
    }));
    flow.projectSkillList = await callTool(flow, client, 'alembic_project_skill', {
      projectRoot: project.projectRoot,
      operation: 'list',
    });
    flow.prime = await callTool(flow, client, 'alembic_prime', {
      projectRoot: project.projectRoot,
      agentHost: host,
      taskAction: 'code-edit',
      requirementGoal: 'Edit the greeting flow while preserving the project module boundary.',
      capability: 'greeting-flow',
      scenario: 'edit code',
      activeFile: 'src/greeting.js',
      language: 'javascript',
      keywords: ['greet', 'module export'],
    });
    flow.search = await callTool(flow, client, 'alembic_search', {
      projectRoot: project.projectRoot,
      operation: 'search',
      mode: 'auto',
      query: 'greeting flow named exported function',
      keywords: ['greet', 'module'],
      limit: 5,
    });
    flow.recipeMap = await callTool(flow, client, 'alembic_recipe_map', {
      projectRoot: project.projectRoot,
      focus: { kind: 'file', filePath: 'src/greeting.js' },
      activeFile: 'src/greeting.js',
      detailLevel: 'summary',
      nodeLimit: 40,
      recipeMountLimit: 10,
    });
    flow.graph = await callTool(flow, client, 'alembic_graph', {
      projectRoot: project.projectRoot,
      queryKind: 'map',
      detailLevel: 'summary',
      budget: { itemLimit: 20, detailLimit: 10, tokenBudget: 2000 },
    });
    flow.statusAfterTools = await callTool(flow, client, 'alembic_status', {
      projectRoot: project.projectRoot,
    });
    flow.usage = {
      before: findByTool(flow.statusAfterInit),
      after: findByTool(flow.statusAfterTools),
    };
    flow.files.afterTools = inspectHostArtifacts(project.projectRoot, project.hostFile);
    flow.checks = buildHostChecks(flow);
  } catch (error) {
    flow.error = error instanceof Error ? error.stack || error.message : String(error);
    report.errors.push({ host, error: flow.error });
  } finally {
    await client.close().catch(() => {});
  }
  return flow;
}

async function runQuietFlow(host, project) {
  const flow = {
    host,
    kind: 'empty-project-quiet',
    projectRoot: project.projectRoot,
    homeRoot: project.homeRoot,
    hostFile: project.hostFile,
    stderr: [],
    toolCalls: [],
    checks: {},
  };
  const client = await connectHostMcp(host, project, flow);
  try {
    flow.tools = (await client.listTools()).tools.map((tool) => tool.name).sort();
    flow.status = await callTool(flow, client, 'alembic_status', { projectRoot: project.projectRoot });
    flow.files = inspectHostArtifacts(project.projectRoot, project.hostFile);
    flow.usage = findByTool(flow.status);
    flow.checks = {
      noHostGuidanceFile: !fs.existsSync(path.join(project.projectRoot, project.hostFile)),
      noCodexSkillProjection: !fs.existsSync(path.join(project.projectRoot, '.agents', 'skills')),
      noClaudeSkillProjection: !fs.existsSync(path.join(project.projectRoot, '.claude', 'skills')),
      noPrimeUsage: !flow.usage?.alembic_prime,
      noBootstrapUsage: !flow.usage?.alembic_bootstrap,
    };
  } catch (error) {
    flow.error = error instanceof Error ? error.stack || error.message : String(error);
    report.errors.push({ host, quiet: 'empty', error: flow.error });
  } finally {
    await client.close().catch(() => {});
  }
  return flow;
}

async function runGhostQuietFlow(host, project) {
  const flow = {
    host,
    kind: 'ghost-project-quiet',
    projectRoot: project.projectRoot,
    homeRoot: project.homeRoot,
    hostFile: project.hostFile,
    stderr: [],
    toolCalls: [],
    checks: {},
  };
  const before = fs.readFileSync(path.join(project.projectRoot, project.hostFile), 'utf8');
  const client = await connectHostMcp(host, project, flow);
  try {
    flow.initGhost = await callTool(flow, client, 'alembic_init', {
      projectRoot: project.projectRoot,
      seed: false,
      standard: false,
    });
    flow.projectSkillRefresh = await callTool(flow, client, 'alembic_project_skill', {
      projectRoot: project.projectRoot,
      operation: 'refresh',
    });
    const after = fs.readFileSync(path.join(project.projectRoot, project.hostFile), 'utf8');
    flow.files = inspectHostArtifacts(project.projectRoot, project.hostFile);
    flow.status = await callTool(flow, client, 'alembic_status', { projectRoot: project.projectRoot });
    flow.usage = findByTool(flow.status);
    flow.checks = {
      userHostFilePreserved: before === after,
      noManagedBlock: !after.includes(MANAGED_BEGIN) && !after.includes(MANAGED_END),
      refreshSkippedOrRemoved:
        findString(flow.projectSkillRefresh, 'non-standard-or-ghost-data-root') ||
        findString(flow.projectSkillRefresh, 'no-knowledge-base'),
      noPrimeUsage: !flow.usage?.alembic_prime,
    };
  } catch (error) {
    flow.error = error instanceof Error ? error.stack || error.message : String(error);
    report.errors.push({ host, quiet: 'ghost', error: flow.error });
  } finally {
    await client.close().catch(() => {});
  }
  return flow;
}

async function runKnowledgeRemovalCleanup(host, hostFlow) {
  const projectRoot = hostFlow?.projectRoot;
  if (!projectRoot) {
    return { skipped: true, reason: 'host flow did not produce projectRoot' };
  }
  const project = {
    projectRoot,
    homeRoot: path.join(sandboxRoot, 'cleanup-codex-home'),
    hostFile: hostFlow.hostFile,
  };
  fs.mkdirSync(project.homeRoot, { recursive: true });
  const before = fs.readFileSync(path.join(projectRoot, project.hostFile), 'utf8');
  const dataCandidates = [
    path.join(projectRoot, '.asd', 'alembic.db'),
    path.join(projectRoot, 'alembic.db'),
    path.join(projectRoot, 'Alembic', 'recipes'),
    path.join(projectRoot, 'Alembic', 'candidates'),
    path.join(projectRoot, '.asd', 'Alembic', 'recipes'),
    path.join(projectRoot, '.asd', 'Alembic', 'candidates'),
  ];
  const removed = [];
  for (const candidate of dataCandidates) {
    if (fs.existsSync(candidate)) {
      fs.rmSync(candidate, { recursive: true, force: true });
      removed.push(candidate);
    }
  }
  const flow = { host, projectRoot, homeRoot: project.homeRoot, hostFile: project.hostFile, stderr: [], toolCalls: [] };
  const client = await connectHostMcp(host, project, flow);
  try {
    flow.refreshAfterRemoval = await callTool(flow, client, 'alembic_project_skill', {
      projectRoot,
      operation: 'refresh',
    });
    const after = fs.readFileSync(path.join(projectRoot, project.hostFile), 'utf8');
    flow.files = inspectHostArtifacts(projectRoot, project.hostFile);
    flow.removed = removed;
    flow.checks = {
      hadManagedBlockBefore: before.includes(MANAGED_BEGIN) && before.includes(MANAGED_END),
      managedBlockRemoved: !after.includes(MANAGED_BEGIN) && !after.includes(MANAGED_END),
      userContentPreserved:
        after.includes('This line is user-owned and must survive Alembic managed block upsert/removal'),
      hostFileStillExists: fs.existsSync(path.join(projectRoot, project.hostFile)),
      refreshReportedRemoval: findString(flow.refreshAfterRemoval, 'no-knowledge-base'),
    };
  } catch (error) {
    flow.error = error instanceof Error ? error.stack || error.message : String(error);
    report.errors.push({ host, cleanup: 'knowledge-removal', error: flow.error });
  } finally {
    await client.close().catch(() => {});
  }
  return flow;
}

async function connectHostMcp(host, project, flow) {
  const shellRoot = host === 'claude-code' ? claudeShellRoot : codexShellRoot;
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [localMcpEntry],
    cwd: project.projectRoot,
    env: {
      ...process.env,
      HOME: project.homeRoot,
      USERPROFILE: project.homeRoot,
      ALEMBIC_HOME: project.homeRoot,
      ALEMBIC_CHANNEL_ID: host,
      ALEMBIC_CODEX_ENABLE_ADMIN: '0',
      ALEMBIC_CODEX_MCP_MODE: '1',
      ALEMBIC_CODEX_PLUGIN_ROOT: shellRoot,
      ALEMBIC_MCP_MODE: '1',
      ALEMBIC_MCP_TIER: 'agent',
      ALEMBIC_PLUGIN_HOST: host,
      ALEMBIC_PROJECT_DIR: project.projectRoot,
      ALEMBIC_QUIET: '1',
      ALEMBIC_RUNTIME_MODE: 'plugin',
      CLAUDE_PROJECT_DIR: project.projectRoot,
      CODEX_WORKSPACE_DIR: project.projectRoot,
      CODEX_WORKSPACE_ROOT: project.projectRoot,
      INIT_CWD: project.projectRoot,
      PWD: project.projectRoot,
    },
    stderr: 'pipe',
  });
  transport.stderr?.on('data', (chunk) => {
    flow.stderr.push(String(chunk));
  });
  const client = new Client({ name: `p4-${host}-realtest`, version: '0.1.0' });
  await withTimeout(client.connect(transport, { timeout: 60000 }), 65000, () => {
    return `MCP connect timed out for ${host}\n${flow.stderr.join('')}`;
  });
  return client;
}

async function callTool(flow, client, name, args) {
  const startedAt = Date.now();
  const record = { name, args, startedAt: new Date(startedAt).toISOString() };
  flow.toolCalls.push(record);
  const result = await withTimeout(
    client.callTool({ name, arguments: args }, undefined, { timeout: 120000 }),
    125000,
    () => `MCP ${name} timed out\n${flow.stderr.join('')}`
  );
  record.durationMs = Date.now() - startedAt;
  const parsed = parseToolResult(result);
  record.summary = summarizeToolResult(parsed);
  fs.appendFileSync(
    flow.stdoutTranscript || path.join(transcriptDir, `${flow.host || 'unknown'}-transcript.jsonl`),
    `${JSON.stringify({ tool: name, args, result: parsed, durationMs: record.durationMs })}\n`
  );
  return parsed;
}

function parseToolResult(result) {
  const text = result?.content?.find((item) => item.type === 'text')?.text;
  const base = {
    isError: result?.isError ?? false,
    structuredContent: result?.structuredContent ?? null,
  };
  if (typeof text === 'string') {
    try {
      const parsed = JSON.parse(text);
      return {
        ...base,
        ...(parsed && typeof parsed === 'object' && !Array.isArray(parsed)
          ? parsed
          : { value: parsed }),
      };
    } catch {
      return { ...base, rawText: text };
    }
  }
  return { ...base, rawResult: result };
}

function buildKnowledgeItem(host) {
  return {
    title: `Use named greeting exports for ${host} activation fixture`,
    language: 'javascript',
    kind: 'pattern',
    dimensionId: 'ts-js-module',
    doClause: 'Use named exported functions for the greeting flow.',
    dontClause: 'Avoid hiding greeting behavior in anonymous inline callbacks.',
    whenClause: 'When editing src/greeting.js or answering questions about the fixture greeting module.',
    coreCode: "export function greet(name) {\n  return `Hello, ${name}!`;\n}",
    category: 'Utility',
    trigger: '@GreetingFlow',
    description:
      'The fixture greeting behavior lives behind a named ESM export so hosts can prime and search before edits.',
    headers: [],
    usageGuide:
      '### When to use\nUse before editing src/greeting.js or explaining greeting output.\n\n### Key points\nKeep greet as a named export and route callers through src/index.js.\n\n### When not to use\nDo not apply to unrelated CLI or package metadata changes.',
    knowledgeType: 'code-pattern',
    complexity: 'beginner',
    scope: 'narrow',
    tags: ['p4-realtest', host, 'greeting'],
    content: {
      pattern: "export function greet(name) {\n  return `Hello, ${name}!`;\n}",
      rationale:
        'The project has a tiny but real ESM boundary: src/index.js imports greet from src/greeting.js. Keeping it named makes code edits and project questions easy to ground.',
      markdown:
        'The MiniActivationFixture project keeps greeting logic in `src/greeting.js` and calls it from `src/index.js`.\n\n✅ Correct example:\n```js\nexport function greet(name) {\n  return `Hello, ${name}!`;\n}\n```\n\n❌ Forbidden example:\n```js\nexport default (name) => `Hello, ${name}!`;\n```\n',
    },
    reasoning: {
      whyStandard:
        'src/greeting.js exports greet and src/index.js imports it, so the named export is the observed local module boundary.',
      sources: ['src/greeting.js:1-3', 'src/index.js:1', 'package.json:1'],
      confidence: 0.93,
    },
    sourceRefs: ['src/greeting.js:1-3', 'src/index.js:1', 'package.json:1'],
  };
}

function inspectHostArtifacts(projectRoot, hostFile) {
  const hostFilePath = path.join(projectRoot, hostFile);
  const hostContent = fs.existsSync(hostFilePath) ? fs.readFileSync(hostFilePath, 'utf8') : null;
  const codexSkillRoot = path.join(projectRoot, '.agents', 'skills');
  const claudeSkillRoot = path.join(projectRoot, '.claude', 'skills');
  return {
    hostFilePath,
    hostFileExists: fs.existsSync(hostFilePath),
    hostFileSnippet: hostContent ? hostContent.slice(0, 2000) : null,
    hasManagedBegin: Boolean(hostContent?.includes(MANAGED_BEGIN)),
    hasManagedEnd: Boolean(hostContent?.includes(MANAGED_END)),
    managedBlockCount: hostContent ? (hostContent.match(new RegExp(MANAGED_BEGIN, 'g')) || []).length : 0,
    userContentPreserved: Boolean(
      hostContent?.includes('This line is user-owned and must survive Alembic managed block upsert/removal')
    ),
    codexSkillRootExists: fs.existsSync(codexSkillRoot),
    claudeSkillRootExists: fs.existsSync(claudeSkillRoot),
    codexSkills: listSkillDirs(codexSkillRoot),
    claudeSkills: listSkillDirs(claudeSkillRoot),
  };
}

function buildHostChecks(flow) {
  const expectedHostFile = flow.host === 'claude-code' ? 'CLAUDE.md' : 'AGENTS.md';
  const wrongHostFile = flow.host === 'claude-code' ? 'AGENTS.md' : 'CLAUDE.md';
  const after = flow.files.afterDimensionComplete || {};
  const usageBefore = flow.usage.before || {};
  const usageAfter = flow.usage.after || {};
  const expectedSkillRootExists =
    flow.host === 'claude-code' ? after.claudeSkillRootExists : after.codexSkillRootExists;
  const wrongSkillRootExists =
    flow.host === 'claude-code' ? after.codexSkillRootExists : after.claudeSkillRootExists;
  return {
    expectedHostFile,
    expectedHostFileWritten: after.hostFileExists && path.basename(after.hostFilePath) === expectedHostFile,
    wrongHostFileNotCreated: !fs.existsSync(path.join(flow.projectRoot, wrongHostFile)),
    managedBlockWrittenAfterDimensionComplete: after.hasManagedBegin && after.hasManagedEnd,
    singleManagedBlock: after.managedBlockCount === 1,
    userContentPreserved: after.userContentPreserved,
    expectedSkillRootExists,
    wrongSkillRootNotCreated: !wrongSkillRootExists,
    primeThenSearchSequence: hasOrderedTools(flow.toolCalls, ['alembic_prime', 'alembic_search']),
    mapOrGraphCalled: flow.toolCalls.some((call) =>
      ['alembic_recipe_map', 'alembic_graph'].includes(call.name)
    ),
    primeUsageIncreased: increased(
      usageBefore.alembic_prime ?? usageBefore.prime,
      usageAfter.alembic_prime ?? usageAfter.prime
    ),
    searchUsageIncreased: increased(
      usageBefore.alembic_search ?? usageBefore.search,
      usageAfter.alembic_search ?? usageAfter.search
    ),
    recipeMapUsageIncreased: increased(
      usageBefore.alembic_recipe_map ?? usageBefore.recipeMap,
      usageAfter.alembic_recipe_map ?? usageAfter.recipeMap
    ),
    graphUsageIncreased: increased(
      usageBefore.alembic_graph ?? usageBefore.graph,
      usageAfter.alembic_graph ?? usageAfter.graph
    ),
    submitSucceeded: isSuccess(flow.submitKnowledge),
    dimensionCompleteSucceeded: isSuccess(flow.dimensionComplete),
    bootstrapAttempted: Boolean(flow.bootstrap || flow.extractedPlanSelection === null),
  };
}

function buildContractSummary(hosts) {
  const names = ['alembic_prime', 'alembic_search', 'alembic_recipe_map', 'alembic_graph'];
  const byHost = {};
  for (const [host, flow] of Object.entries(hosts)) {
    byHost[host] = {};
    for (const name of names) {
      const tool = (flow.toolsAfterDimensionComplete || flow.tools)?.find(
        (entry) => entry.name === name
      );
      byHost[host][name] = {
        present: Boolean(tool),
        inputSchemaKeys: tool?.inputSchemaKeys ?? [],
        required: tool?.required ?? [],
      };
    }
  }
  return {
    checkedTools: names,
    byHost,
    allPresent: Object.values(byHost).every((entry) =>
      names.every((name) => entry[name]?.present === true)
    ),
    codexAndClaudeSamePresence:
      names.every((name) => byHost.codex?.[name]?.present && byHost['claude-code']?.[name]?.present),
  };
}

function computePass(value) {
  const hostPass = ['codex', 'claude-code'].every((host) => {
    const checks = value.hosts[host]?.checks || {};
    return [
      checks.expectedHostFileWritten,
      checks.wrongHostFileNotCreated,
      checks.managedBlockWrittenAfterDimensionComplete,
      checks.singleManagedBlock,
      checks.userContentPreserved,
      checks.expectedSkillRootExists,
      checks.wrongSkillRootNotCreated,
      checks.primeThenSearchSequence,
      checks.mapOrGraphCalled,
      checks.primeUsageIncreased,
      checks.searchUsageIncreased,
      checks.submitSucceeded,
      checks.dimensionCompleteSucceeded,
    ].every(Boolean);
  });
  const quietPass = [
    value.quiet.emptyCodex?.checks?.noHostGuidanceFile,
    value.quiet.emptyCodex?.checks?.noPrimeUsage,
    value.quiet.emptyCodex?.checks?.noBootstrapUsage,
    value.quiet.ghostClaude?.checks?.userHostFilePreserved,
    value.quiet.ghostClaude?.checks?.noManagedBlock,
    value.quiet.ghostClaude?.checks?.refreshSkippedOrRemoved,
  ].every(Boolean);
  const cleanupPass = [
    value.cleanup.codex?.checks?.hadManagedBlockBefore,
    value.cleanup.codex?.checks?.managedBlockRemoved,
    value.cleanup.codex?.checks?.userContentPreserved,
    value.cleanup.codex?.checks?.hostFileStillExists,
  ].every(Boolean);
  return hostPass && quietPass && cleanupPass && value.contract.allPresent && value.errors.length === 0;
}

function findPlanSelection(value) {
  const seen = new Set();
  function visit(node) {
    if (!node || typeof node !== 'object' || seen.has(node)) {
      return null;
    }
    seen.add(node);
    if (
      (node.generationStage === 'coldStart' || node.generationStage === 'deepMining') &&
      Array.isArray(node.dimensions) &&
      node.scale &&
      typeof node.scale === 'object'
    ) {
      return node;
    }
    for (const child of Object.values(node)) {
      const found = visit(child);
      if (found) {
        return found;
      }
    }
    return null;
  }
  return visit(value);
}

function findProjectProfile(value) {
  return (
    value?.structuredContent?.nextActions?.find((action) => action?.args?.projectProfile)?.args
      ?.projectProfile ||
    value?.structuredContent?.projectProfile ||
    null
  );
}

function findProjectInfoRef(value) {
  return value?.structuredContent?.projectInfoTree?.meta?.fullTreeRef?.path || null;
}

function findBootstrapSessionId(value) {
  const seen = new Set();
  function visit(node) {
    if (!node || typeof node !== 'object' || seen.has(node)) {
      return null;
    }
    seen.add(node);
    for (const key of ['sessionId', 'bootstrapSessionId', 'id']) {
      const candidate = node[key];
      if (
        typeof candidate === 'string' &&
        /bootstrap|session|cold|[a-z0-9_-]{8,}/i.test(candidate)
      ) {
        return candidate;
      }
    }
    for (const child of Object.values(node)) {
      const found = visit(child);
      if (found) {
        return found;
      }
    }
    return null;
  }
  return visit(value);
}

function findByTool(value) {
  const seen = new Set();
  function visit(node) {
    if (!node || typeof node !== 'object' || seen.has(node)) {
      return null;
    }
    seen.add(node);
    if (node.byTool && typeof node.byTool === 'object') {
      return node.byTool;
    }
    for (const child of Object.values(node)) {
      const found = visit(child);
      if (found) {
        return found;
      }
    }
    return null;
  }
  return visit(value);
}

function hasOrderedTools(calls, orderedNames) {
  let index = 0;
  for (const call of calls) {
    if (call.name === orderedNames[index]) {
      index += 1;
      if (index === orderedNames.length) {
        return true;
      }
    }
  }
  return false;
}

function increased(before, after) {
  const beforeCount = typeof before === 'object' && before !== null ? before.count : before;
  const afterCount = typeof after === 'object' && after !== null ? after.count : after;
  return Number(afterCount || 0) > Number(beforeCount || 0);
}

function isSuccess(value) {
  if (!value || typeof value !== 'object') {
    return false;
  }
  if (value.success === true) {
    return true;
  }
  if (value.ok === true || value.status === 'ok' || value.status === 'ready') {
    return true;
  }
  if (value.structuredContent?.ok === true) {
    return true;
  }
  if (value.data && typeof value.data === 'object' && value.data.success === true) {
    return true;
  }
  return false;
}

function summarizeToolResult(value) {
  if (!value || typeof value !== 'object') {
    return { type: typeof value };
  }
  return {
    success: value.success ?? value.data?.success ?? null,
    errorCode: value.errorCode ?? value.data?.errorCode ?? value.error?.code ?? null,
    message: value.message ?? value.data?.message ?? value.error?.message ?? null,
  };
}

function listSkillDirs(root) {
  if (!fs.existsSync(root)) {
    return [];
  }
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() || entry.isSymbolicLink())
    .map((entry) => ({
      name: entry.name,
      skillExists: fs.existsSync(path.join(root, entry.name, 'SKILL.md')),
      managedMarkerExists: fs.existsSync(path.join(root, entry.name, '.alembic-managed.json')),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function findString(value, needle) {
  return JSON.stringify(value).includes(needle);
}

function readJsonIfExists(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function gitFacts(cwd) {
  const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd, encoding: 'utf8' });
  const status = spawnSync('git', ['status', '--short', '--branch'], { cwd, encoding: 'utf8' });
  return {
    head: head.status === 0 ? head.stdout.trim() : null,
    status: status.status === 0 ? status.stdout.trim() : status.stderr.trim(),
  };
}

function probeInstalledCodexCache() {
  const cacheRoot = '/Users/gaoxuefeng/.codex/plugins/cache/gxfn/alembic/0.2.0';
  const runtimeRoot = path.join(
    cacheRoot,
    '.runtime',
    'runtime-install',
    'node_modules',
    '@gxfn',
    'alembic-runtime'
  );
  return {
    cacheRoot,
    cacheRootExists: fs.existsSync(cacheRoot),
    runtimeRoot,
    runtimeRootExists: fs.existsSync(runtimeRoot),
    pluginManifest: readJsonIfExists(path.join(cacheRoot, '.codex-plugin', 'plugin.json')),
    runtimePackage: readJsonIfExists(path.join(runtimeRoot, 'package.json')),
  };
}

function runShellDryRun(shellPath) {
  if (!fs.existsSync(shellPath)) {
    return { ok: false, shellPath, error: 'missing shell path' };
  }
  const result = spawnSync(process.execPath, [shellPath, '--dry-run'], {
    cwd: path.dirname(path.dirname(shellPath)),
    encoding: 'utf8',
    timeout: 30000,
  });
  return {
    shellPath,
    status: result.status,
    stdout: parseJsonOrText(result.stdout),
    stderr: result.stderr,
  };
}

function parseJsonOrText(value) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

async function withTimeout(promise, timeoutMs, describe) {
  let timeout;
  const timeoutPromise = new Promise((_, reject) => {
    timeout = setTimeout(() => reject(new Error(describe())), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeout);
  }
}
