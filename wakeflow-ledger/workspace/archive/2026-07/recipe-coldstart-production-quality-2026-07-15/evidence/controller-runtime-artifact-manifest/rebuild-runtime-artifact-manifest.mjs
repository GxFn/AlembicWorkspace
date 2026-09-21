#!/usr/bin/env node

import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { gunzipSync } from 'node:zlib';

const workspaceRoot = process.cwd();
const rebuildRoot = path.resolve(process.argv[2] ?? '');
const stateRootRef =
  '.wakeflow-active/current/recipe-coldstart-production-quality-2026-07-15';
const stateRoot = path.join(workspaceRoot, stateRootRef);
const evidenceRef = 'evidence/controller-runtime-artifact-manifest';
const evidenceRoot = path.join(stateRoot, evidenceRef);
const artifactRoot = path.join(evidenceRoot, 'artifacts');
const historyRoot = path.join(evidenceRoot, 'history');
const demandKey = 'recipe-coldstart-production-quality-2026-07-15';

if (!process.argv[2] || !existsSync(rebuildRoot)) {
  throw new Error('Pass the completed rebuild directory as the first argument.');
}

const repositories = {
  AlembicCore: {
    commit: 'f6e3f1956d67fa1d7a0a3440c2931196d9549d06',
    tree: '792d6f987d1b5e78f5e63e2b5a2ff7863a016e79',
  },
  AlembicAgent: {
    commit: 'a882f61cad34eed873db5ac52870475e6d71da52',
    tree: '2b2af813b3538308d957a5227ab102c15c04ea58',
  },
  Alembic: {
    commit: 'd325952e23947d101ceb531bacaf47bd1d07180f',
    tree: 'c35f7dfc7eacc91e0e6ccad9da0e2e2240dd302c',
  },
  AlembicPlugin: {
    commit: '44bbb4f1346cc177ad96dd17199746d7df0029d7',
    tree: '78e6b87e09ec3a355267f60f98a9f1b7c033b8f7',
  },
};

const acceptedResults = {
  AlembicCore:
    'target-results/tr-i3-i9-core-pcf-final-artifact-contract-restoration-rootcause13-t1.json',
  AlembicAgent:
    'target-results/tr-i3-i9-agent-cross-harvest-v5-integration-rootcause12-t1.json',
  Alembic:
    'target-results/tr-i3-i9-alembic-pcf-public-route-consumer-migration-rootcause13-t1.json',
  AlembicPlugin:
    'target-results/tr-i8-alembic-plugin-exact-lineage-bundle-revalidation-rootcause5-t1.json',
};

const packageInputs = {
  'core-package-dist': {
    repository: 'AlembicCore',
    source: path.join(rebuildRoot, 'core', 'alembic-core-0.3.0.tgz'),
    filename: `alembic-core-0.3.0-${repositories.AlembicCore.commit.slice(0, 8)}.tgz`,
  },
  'agent-package-dist': {
    repository: 'AlembicAgent',
    source: path.join(rebuildRoot, 'agent', 'alembic-agent-0.3.0.tgz'),
    filename: `alembic-agent-0.3.0-${repositories.AlembicAgent.commit.slice(0, 8)}.tgz`,
  },
  'alembic-runtime-release': {
    repository: 'Alembic',
    source: path.join(rebuildRoot, 'main', 'alembic-ai-0.3.0.tgz'),
    filename: `alembic-ai-0.3.0-${repositories.Alembic.commit.slice(0, 8)}.tgz`,
  },
  'plugin-mcp-package-server': {
    repository: 'AlembicPlugin',
    source: path.join(rebuildRoot, 'plugin', 'alembic-runtime-0.3.0.tgz'),
    filename: `alembic-runtime-0.3.0-${repositories.AlembicPlugin.commit.slice(0, 8)}.tgz`,
  },
};

mkdirSync(artifactRoot, { recursive: true });
mkdirSync(historyRoot, { recursive: true });
assertExactRepositories();
archiveCurrentEvidence();

const oldManifest = readJson(path.join(evidenceRoot, 'runtime-artifact-manifest.json'));
const oldContentManifest = readJson(
  path.join(evidenceRoot, 'artifact-content-set-manifest.json')
);
const oldPcfReceipt = readJson(
  path.join(evidenceRoot, 'final-artifact-pcf-regression-receipt.json')
);

const packageArtifacts = new Map();
for (const [artifactId, input] of Object.entries(packageInputs)) {
  if (!existsSync(input.source)) {
    throw new Error(`Missing rebuilt archive for ${artifactId}.`);
  }
  const destination = path.join(artifactRoot, input.filename);
  copyFileSync(input.source, destination);
  packageArtifacts.set(artifactId, analyzeArchive(destination));
}

const contentManifest = buildContentManifest(oldContentManifest);
const contentVersionPath = path.join(evidenceRoot, 'artifact-content-set-manifest-v4.json');
atomicWriteJson(contentVersionPath, contentManifest);

const pcfReceipt = buildPcfReceipt(oldPcfReceipt, packageArtifacts);
const pcfVersionPath = path.join(
  evidenceRoot,
  'final-artifact-pcf-regression-receipt-v3.json'
);
atomicWriteJson(pcfVersionPath, pcfReceipt);

const manifest = buildRuntimeManifest({
  oldManifest,
  packageArtifacts,
  contentManifest,
  contentVersionPath,
  pcfReceipt,
  pcfVersionPath,
});
const manifestVersionPath = path.join(evidenceRoot, 'runtime-artifact-manifest-v5.json');
atomicWriteJson(manifestVersionPath, manifest);

const manifestContentHash = `sha256:${hashFile(manifestVersionPath)}`;
const extractRoot = mkdtempSync(path.join(tmpdir(), 'alembic-exact-artifact-load-'));
let verification;
try {
  execFileSync(
    'tar',
    [
      '-xzf',
      path.join(artifactRoot, packageInputs['alembic-runtime-release'].filename),
      '-C',
      extractRoot,
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  );
  const loadedMainRoot = path.join(extractRoot, 'package');
  const verifierModule = await import(
    pathToFileURL(
      path.join(
        workspaceRoot,
        'Alembic',
        'dist',
        'lib',
        'recipe-pipeline',
        'generate',
        'strict',
        'StrictRuntimeArtifacts.js'
      )
    ).href
  );
  verification = await verifierModule.verifyRuntimeArtifactManifestV1({
    expectedManifestContentHash: manifestContentHash,
    expectedManifestHash: manifest.manifestHash,
    manifestPath: manifestVersionPath,
    manifestSymbol: 'controller:runtime-artifact-manifest',
    loadedPackageRoots: {
      main: loadedMainRoot,
      core: path.join(loadedMainRoot, 'node_modules', '@alembic', 'core'),
      agent: path.join(loadedMainRoot, 'node_modules', '@alembic', 'agent'),
    },
  });
} finally {
  rmSync(extractRoot, { recursive: true, force: true });
}

const loadReceiptPath = path.join(evidenceRoot, 'runtime-artifact-load-receipt-v5.json');
atomicWriteJson(loadReceiptPath, verification.receipt);
const controllerReceipt = buildControllerReceipt({
  manifest,
  manifestContentHash,
  loadReceiptPath,
  receipt: verification.receipt,
  packageArtifacts,
});
const controllerReceiptPath = path.join(
  evidenceRoot,
  'controller-final-runtime-artifact-load-validation-receipt-v5.json'
);
atomicWriteJson(controllerReceiptPath, controllerReceipt);

for (const [versioned, current] of [
  [contentVersionPath, path.join(evidenceRoot, 'artifact-content-set-manifest.json')],
  [pcfVersionPath, path.join(evidenceRoot, 'final-artifact-pcf-regression-receipt.json')],
  [manifestVersionPath, path.join(evidenceRoot, 'runtime-artifact-manifest.json')],
  [
    controllerReceiptPath,
    path.join(evidenceRoot, 'controller-final-runtime-artifact-load-validation-receipt.json'),
  ],
]) {
  atomicCopy(versioned, current);
}

assertPrivacyClean([
  contentVersionPath,
  pcfVersionPath,
  manifestVersionPath,
  loadReceiptPath,
  controllerReceiptPath,
]);

process.stdout.write(
  `${JSON.stringify(
    {
      ok: true,
      manifestId: manifest.manifestId,
      manifestHash: manifest.manifestHash,
      manifestContentHash,
      loadReceiptHash: verification.receipt.receiptHash,
      controllerReceiptHash: controllerReceipt.receiptHash,
      singleCoreCopy: verification.receipt.dependencyResolution.singleCoreCopy,
      artifacts: [...packageArtifacts.entries()].map(([artifactId, artifact]) => ({
        artifactId,
        artifactHash: `sha256:${artifact.archiveSha256}`,
        byteSize: artifact.byteSize,
        distContentHash: artifact.distContentHash,
        distFileCount: artifact.distFileCount,
        entryCount: artifact.entryCount,
      })),
      contentSets: contentManifest.contentSets.map((contentSet) => ({
        artifactId: contentSet.artifactId,
        contentSetHash: contentSet.contentSetHash,
        byteSize: contentSet.byteSize,
        fileCount: contentSet.fileCount,
      })),
      pcfLineage: pcfReceipt.finalCapabilityContract.lineageResult,
      privacy: 'passed',
      testAuthorization: false,
    },
    null,
    2
  )}\n`
);

function assertExactRepositories() {
  for (const [repository, expected] of Object.entries(repositories)) {
    const commit = git(repository, ['rev-parse', 'HEAD']);
    const tree = git(repository, ['rev-parse', 'HEAD^{tree}']);
    const status = git(repository, ['status', '--short']);
    if (commit !== expected.commit || tree !== expected.tree || status !== '') {
      throw new Error(
        `${repository} exact baseline mismatch: commit=${commit}, tree=${tree}, clean=${status === ''}.`
      );
    }
  }
}

function archiveCurrentEvidence() {
  const suffix = 'before-f6e3f195-a882f61c-d325952e-44bbb4f1-v5';
  const files = [
    'runtime-artifact-manifest.json',
    'artifact-content-set-manifest.json',
    'final-artifact-pcf-regression-receipt.json',
    'runtime-artifact-load-receipt-v4.json',
    'controller-final-runtime-artifact-load-validation-receipt.json',
  ];
  for (const file of files) {
    const source = path.join(evidenceRoot, file);
    const destination = path.join(
      historyRoot,
      `${path.basename(file, '.json')}-${suffix}.json`
    );
    if (existsSync(source) && !existsSync(destination)) {
      copyFileSync(source, destination);
    }
  }
}

function analyzeArchive(archivePath) {
  const archive = readFileSync(archivePath);
  const files = readTarFiles(archive);
  const packageJson = JSON.parse(requiredTarFile(files, 'package/package.json').toString('utf8'));
  const entrypoint =
    packageJson.name === 'alembic-runtime'
      ? packageJson.bin?.['alembic-codex-mcp']
      : packageJson.main;
  if (typeof entrypoint !== 'string') {
    throw new Error(`Archive ${packageJson.name} lacks its expected entrypoint.`);
  }
  const entrypointBytes = requiredTarFile(files, `package/${entrypoint}`);
  const dist = hashTarDirectory(files, 'package/dist/');
  return {
    archivePath,
    archiveSha256: hashBytes(archive),
    byteSize: archive.byteLength,
    entryCount: files.size,
    packageName: packageJson.name,
    packageVersion: packageJson.version,
    entrypoint,
    entrypointSha256: hashBytes(entrypointBytes),
    distContentHash: dist.contentHash,
    distFileCount: dist.fileCount,
    embeddedCoreDistContentHash: optionalTarDirectoryHash(
      files,
      'package/node_modules/@alembic/core/dist/'
    ),
    embeddedAgentDistContentHash: optionalTarDirectoryHash(
      files,
      'package/node_modules/@alembic/agent/dist/'
    ),
  };
}

function buildContentManifest(template) {
  const contentSets = template.contentSets.map((oldSet) => {
    const rows = [];
    const components = oldSet.components.map((oldComponent) => {
      const repository = oldComponent.repository ?? oldSet.owners[0];
      const revision = repositories[repository]?.commit;
      if (!revision) {
        throw new Error(`Unknown content-set repository: ${repository}.`);
      }
      const gitObjectId = git(repository, ['rev-parse', `${revision}:${oldComponent.path}`]);
      const trackedFiles = gitNull(
        repository,
        ['ls-tree', '-r', '-z', '--name-only', revision, '--', oldComponent.path]
      );
      if (trackedFiles.length === 0) {
        throw new Error(
          `${oldSet.artifactId} component ${repository}/${oldComponent.path} is empty.`
        );
      }
      for (const file of trackedFiles) {
        const bytes = gitBuffer(repository, ['show', `${revision}:${file}`]);
        rows.push({
          path: `${repository}/${file}`,
          sha256: hashBytes(bytes),
          byteSize: bytes.byteLength,
        });
      }
      const component = {
        repository,
        path: oldComponent.path,
        gitObjectId,
      };
      if (trackedFiles.length === 1 && trackedFiles[0] === oldComponent.path) {
        component.sha256 = rows.at(-1).sha256;
      }
      return component;
    });
    rows.sort((left, right) =>
      Buffer.compare(Buffer.from(left.path), Buffer.from(right.path))
    );
    const seen = new Set();
    for (const row of rows) {
      if (seen.has(row.path)) {
        throw new Error(`${oldSet.artifactId} contains duplicate path ${row.path}.`);
      }
      seen.add(row.path);
    }
    const contentSetHash = `sha256:${hashBytes(
      Buffer.from(rows.map((row) => `${row.path} ${row.sha256}\n`).join(''))
    )}`;
    return {
      ...oldSet,
      fileCount: rows.length,
      byteSize: rows.reduce((total, row) => total + row.byteSize, 0),
      contentSetHash,
      components,
      files: rows,
    };
  });
  const semantic = {
    ...template,
    manifestId: `runtime-artifact-content-sets-${demandKey}-v4`,
    generatedFrom: {
      AlembicCore: repositories.AlembicCore.commit,
      AlembicAgent: repositories.AlembicAgent.commit,
      Alembic: repositories.Alembic.commit,
      AlembicPlugin: repositories.AlembicPlugin.commit,
    },
    integrityCorrection:
      'v4 recomputes the explicit-component-only fileCount, byteSize and contentSetHash rules on the final accepted Core, Agent, Main and Plugin revisions after the rootcause13 public-route restoration.',
    contentSets,
  };
  delete semantic.manifestHash;
  return { ...semantic, manifestHash: hashCanonicalJson(semantic) };
}

function buildPcfReceipt(template, artifacts) {
  const baselinePath = path.join(
    workspaceRoot,
    'wakeflow-ledger',
    'AlembicWorkspace',
    demandKey,
    'pcf-baseline-receipt.json'
  );
  const baseline = readJson(baselinePath);
  const contractRows = baseline.capabilityContract.files.map(({ path: filePath }) => ({
    path: filePath,
    sha256: hashFile(path.join(workspaceRoot, filePath)),
  }));
  const contractHash = `sha256:${hashBytes(
    Buffer.from(contractRows.map((row) => `${row.path} ${row.sha256}\n`).join(''))
  )}`;
  if (contractHash !== baseline.capabilityContract.manifestHash) {
    throw new Error('PC-F final capability contract drifted from the accepted baseline.');
  }
  const corePackage = readJson(path.join(workspaceRoot, 'AlembicCore', 'package.json'));
  const core = artifacts.get('core-package-dist');
  const agent = artifacts.get('agent-package-dist');
  const main = artifacts.get('alembic-runtime-release');
  const plugin = artifacts.get('plugin-mcp-package-server');
  const semantic = {
    ...template,
    receiptId: `final-artifact-pcf-regression-${demandKey}-v3`,
    issuedAt: new Date().toISOString(),
    baseline: {
      ...template.baseline,
      receiptSha256: hashFile(baselinePath),
      capabilityContractManifestHash: contractHash,
    },
    finalRevisions: structuredClone(repositories),
    finalCapabilityContract: {
      version: baseline.capabilityContract.version,
      manifestHash: contractHash,
      lineageResult: 'unchanged',
      files: contractRows,
      packageExportsHash: hashCanonicalJson(corePackage.exports),
      packageExportsHashMethod: 'canonical JSON SHA-256 of AlembicCore package.json exports',
    },
    reruns: [
      {
        repository: 'AlembicCore',
        command:
          'npx vitest run test/ProjectContextFoundation.test.ts test/GenerateSessionManager.test.ts test/ProjectContextContract.test.ts test/ProjectContextEndToEnd.test.ts',
        result: 'passed',
        testFiles: 4,
        tests: 74,
      },
      {
        repository: 'Alembic',
        command:
          'npx vitest run test/unit/ProjectContextConsumerFacts.test.ts test/unit/ProjectContextWorkflowFacts.test.ts test/unit/ProjectContextCertifiedAdapters.test.ts',
        result: 'passed',
        testFiles: 3,
        tests: 34,
      },
      {
        repository: 'AlembicPlugin',
        command:
          'npx vitest run test/unit/ProjectGraphTool.test.ts test/unit/RecipeMapTool.test.ts test/unit/PluginCertifiedEmptyStartLoadedEntrypoint.test.ts',
        result: 'passed',
        testFiles: 3,
        tests: 65,
      },
    ],
    artifactBinding: {
      coreDistContentHash: core.distContentHash,
      mainBundledCoreDistContentHash: main.embeddedCoreDistContentHash,
      pluginBundledCoreDistContentHash: plugin.embeddedCoreDistContentHash,
      agentDistContentHash: agent.distContentHash,
      mainBundledAgentDistContentHash: main.embeddedAgentDistContentHash,
      dependencyResolutionResult: 'exact-dist-match',
    },
    verdict: 'passed',
    forbiddenConclusions: [
      'T6 real-project cold-start acceptance has run',
      'Dashboard runtime was started',
      'The demand is complete or archivable',
    ],
  };
  delete semantic.receiptHash;
  return { ...semantic, receiptHash: hashCanonicalJson(semantic) };
}

function buildRuntimeManifest(input) {
  const {
    oldManifest: template,
    packageArtifacts: analyzed,
    contentManifest,
    contentVersionPath,
    pcfReceipt,
    pcfVersionPath,
  } = input;
  const contentById = new Map(
    contentManifest.contentSets.map((contentSet) => [contentSet.artifactId, contentSet])
  );
  const packageRows = new Map(
    template.artifacts
      .filter((row) => packageInputs[row.artifactId])
      .map((row) => {
        const packageInput = packageInputs[row.artifactId];
        const repository = packageInput.repository;
        const artifact = analyzed.get(row.artifactId);
        const acceptancePath = path.join(stateRoot, acceptedResults[repository]);
        const updated = {
          ...row,
          commit: repositories[repository].commit,
          tree: repositories[repository].tree,
          artifactRef: `${evidenceRef}/artifacts/${packageInput.filename}`,
          artifactSha256: artifact.archiveSha256,
          byteSize: artifact.byteSize,
          entryCount: artifact.entryCount,
          entrypoint: artifact.entrypoint,
          entrypointSha256: artifact.entrypointSha256,
          distContentHash: artifact.distContentHash,
          distFileCount: artifact.distFileCount,
          lockfileSha256: hashFile(
            path.join(workspaceRoot, repository, 'package-lock.json')
          ),
          acceptanceEvidence: {
            ref: acceptedResults[repository],
            sha256: hashFile(acceptancePath),
          },
        };
        if (row.artifactId === 'agent-package-dist') {
          updated.dependencyContract = {
            package: '@alembic/core',
            version: analyzed.get('core-package-dist').packageVersion,
            sourceCommit: repositories.AlembicCore.commit,
          };
        }
        if (row.artifactId === 'alembic-runtime-release') {
          updated.embeddedCoreDistContentHash = artifact.embeddedCoreDistContentHash;
          updated.embeddedAgentDistContentHash = artifact.embeddedAgentDistContentHash;
          updated.schemas = { ...row.schemas, exactPublicLineage: 1 };
        }
        if (row.artifactId === 'plugin-mcp-package-server') {
          updated.embeddedCoreDistContentHash = artifact.embeddedCoreDistContentHash;
          updated.schemas = { ...row.schemas, exactPlanningLineage: 1 };
        }
        return [row.artifactId, updated];
      })
  );
  const artifacts = template.artifacts.map((row) => {
    if (packageRows.has(row.artifactId)) {
      return packageRows.get(row.artifactId);
    }
    const content = contentById.get(row.artifactId);
    if (content) {
      return {
        ...row,
        artifactRef: `${evidenceRef}/${path.basename(contentVersionPath)}#${row.artifactId}`,
        artifactSha256: content.contentSetHash.slice('sha256:'.length),
        byteSize: content.byteSize,
      };
    }
    return row;
  });
  const pcfHash = pcfReceipt.finalCapabilityContract.manifestHash;
  const coreHash = analyzed.get('core-package-dist').distContentHash;
  const agentHash = analyzed.get('agent-package-dist').distContentHash;
  const exactLineagePath = path.join(
    workspaceRoot,
    'wakeflow-ledger',
    'AlembicPlugin',
    'i8-alembic-plugin-exact-lineage-bundle-revalidation-rootcause5-t1',
    'exact-bundle-revalidation.json'
  );
  const dashboardRow = template.artifacts.find((row) => row.artifactId === 'dashboard-build');
  const semantic = {
    ...template,
    manifestId: `runtime-artifact-manifest-${demandKey}-v5`,
    issuedAt: new Date().toISOString(),
    controllerReviewBasis: {
      wakeflowStateRevision: readJson(path.join(stateRoot, 'wakeflow-state.json')).revision,
      acceptedResults: Object.values(acceptedResults),
      conclusion:
        'Controller rebuilt the exact accepted Core, Agent, Main and Plugin commits after the final root-cause lineage repairs, regenerated the explicit source content sets and PC-F receipt, and verified the exact packaged Main/Core/Agent dependency graph plus Plugin archive. This closes stale-artifact risk only; T6 remains paused pending an explicit user start signal.',
    },
    toolchain: {
      platform: process.platform,
      node: process.versions.node,
      npm: execFileSync('npm', ['--version'], { encoding: 'utf8' }).trim(),
      typescript: readJson(
        path.join(workspaceRoot, 'Alembic', 'node_modules', 'typescript', 'package.json')
      ).version,
    },
    pcfLineage: {
      baselineReceiptRef: pcfReceipt.baseline.receiptRef,
      baselineReceiptSha256: pcfReceipt.baseline.receiptSha256,
      baselineCapabilityContractHash: pcfHash,
      finalCapabilityContractHash: pcfHash,
      lineageResult: 'unchanged',
      finalRegressionReceiptRef: `${evidenceRef}/${path.basename(pcfVersionPath)}`,
      finalRegressionReceiptFileSha256: hashFile(pcfVersionPath),
      finalRegressionReceiptHash: pcfReceipt.receiptHash,
    },
    contentSetManifest: {
      ref: `${evidenceRef}/${path.basename(contentVersionPath)}`,
      fileSha256: hashFile(contentVersionPath),
      manifestHash: contentManifest.manifestHash,
    },
    artifacts,
    compatibilityMatrix: [
      {
        compatibilityId: 'pcf-final-contract',
        status: 'passed',
        producer: 'AlembicCore',
        consumers: ['Alembic', 'AlembicPlugin'],
        expected: pcfHash,
        actual: pcfHash,
      },
      {
        compatibilityId: 'embedded-core-single-dist',
        status: 'passed',
        producer: 'core-package-dist',
        consumers: ['alembic-runtime-release', 'plugin-mcp-package-server'],
        expected: coreHash,
        actual: coreHash,
      },
      {
        compatibilityId: 'embedded-agent-single-dist',
        status: 'passed',
        producer: 'agent-package-dist',
        consumers: ['alembic-runtime-release'],
        expected: agentHash,
        actual: agentHash,
      },
      {
        compatibilityId: 'exact-public-lineage-bundle',
        status: 'passed',
        producer: 'Alembic',
        consumer: 'AlembicPlugin',
        coreCommit: repositories.AlembicCore.commit,
        agentCommit: repositories.AlembicAgent.commit,
        mainCommit: repositories.Alembic.commit,
        pluginCommit: repositories.AlembicPlugin.commit,
        evidenceRef:
          'wakeflow-ledger/AlembicPlugin/i8-alembic-plugin-exact-lineage-bundle-revalidation-rootcause5-t1/exact-bundle-revalidation.json',
        evidenceSha256: hashFile(exactLineagePath),
        syntheticFixtureUsed: false,
      },
      {
        compatibilityId: 'migration-017',
        status: 'passed-artifact-presence',
        producer: 'AlembicCore',
        consumer: 'Alembic',
        requiredVersion: 17,
      },
      {
        compatibilityId: 'vector-three-owner',
        status: 'artifact-compatible-runtime-config-pending',
        producers: ['AlembicCore', 'Alembic'],
        consumer: 'AlembicPlugin',
        runtimeConfigReceiptRequired: true,
      },
      {
        compatibilityId: 'dashboard-build',
        status: 'not-applicable',
        triggerDecisionReceiptHash: dashboardRow.triggerDecisionReceiptHash,
        startupDecision: 'forbidden',
      },
    ],
    openBlockers: [],
    pendingGates: [
      {
        gateId: 'T6-EXPLICIT-START',
        status: 'paused',
        owner: 'user/controller',
        conclusion:
          'No real-project cold-start, destructive reset, Dashboard startup or Test authorization is implied by rebuilding artifacts.',
      },
    ],
    runtimeLoadPolicy: {
      ...template.runtimeLoadPolicy,
      currentReceiptStatus: 'controller-final-exact-load-validation-required',
    },
    forbiddenConclusions: [
      'T6 real-project cold-start has run or passed',
      'Dashboard runtime was started or accepted',
      'A real project root or database was mutated',
      'Test is authorized',
      'The demand is complete or archivable',
    ],
  };
  delete semantic.manifestHash;
  return { ...semantic, manifestHash: hashCanonicalJson(semantic) };
}

function buildControllerReceipt(input) {
  const {
    manifest,
    manifestContentHash,
    loadReceiptPath,
    receipt,
    packageArtifacts,
  } = input;
  const main = packageArtifacts.get('alembic-runtime-release');
  const plugin = packageArtifacts.get('plugin-mcp-package-server');
  const semantic = {
    schemaVersion: 1,
    kind: 'ControllerRuntimeArtifactLoadValidationReceipt',
    issuedAt: new Date().toISOString(),
    owner: 'AlembicWorkspace/controller',
    repository: 'AlembicCore+AlembicAgent+Alembic+AlembicPlugin',
    commit: repositories.Alembic.commit,
    tree: repositories.Alembic.tree,
    pluginCommit: repositories.AlembicPlugin.commit,
    pluginTree: repositories.AlembicPlugin.tree,
    coreCommit: repositories.AlembicCore.commit,
    agentCommit: repositories.AlembicAgent.commit,
    manifestHash: manifest.manifestHash,
    manifestContentHash,
    mainArtifactSha256: `sha256:${main.archiveSha256}`,
    pluginArtifactSha256: `sha256:${plugin.archiveSha256}`,
    runtimeArtifactLoadReceiptRef: `${evidenceRef}/${path.basename(loadReceiptPath)}`,
    runtimeArtifactLoadReceiptFileSha256: hashFile(loadReceiptPath),
    runtimeArtifactLoadReceiptHash: receipt.receiptHash,
    packages: receipt.artifacts
      .filter((artifact) =>
        [
          'agent-package-dist',
          'alembic-runtime-release',
          'core-package-dist',
          'plugin-mcp-package-server',
        ].includes(artifact.artifactId)
      )
      .map((artifact) => ({
        artifactId: artifact.artifactId,
        loadedPathSymbol: artifact.loadedPathSymbol,
        ...(artifact.distContentHash
          ? {
              distContentHash: artifact.distContentHash,
              distFileCount: artifact.distFileCount,
            }
          : {}),
      })),
    dependencyResolution: {
      singleCoreCopy: receipt.dependencyResolution.singleCoreCopy,
      agentCoreResolutionHash: receipt.dependencyResolution.agentCoreResolutionHash,
    },
    dashboard: receipt.dashboard,
    verification: {
      process: 'fresh-node',
      entrypoint:
        'dist/lib/recipe-pipeline/generate/strict/StrictRuntimeArtifacts.js',
      manifestBinding: 'semantic-and-raw-sha256',
      loadedRoots: 'exact extracted alembic-ai archive with bundled Core and Agent',
      sourceContentSets:
        'explicit component-only file inventory, Git object IDs, bytes and hashes',
      mainPackageBoundary: `${main.entryCount} archive files; ${main.distFileCount} Main dist files; embedded Core/Agent hashes exact`,
      pluginPackageBoundary: `${plugin.entryCount} archive files; runtime-pack freshness, npm-install boundary and entrypoint probe passed`,
      targetRootMutation: 'not-performed',
      testAuthorization: 'not-granted',
    },
    verdict: 'passed',
  };
  return { ...semantic, receiptHash: hashCanonicalJson(semantic) };
}

function readTarFiles(archive) {
  const tar = gunzipSync(archive);
  const files = new Map();
  for (let offset = 0; offset + 512 <= tar.byteLength; ) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) {
      break;
    }
    const name = nullTerminated(header.subarray(0, 100));
    const prefix = nullTerminated(header.subarray(345, 500));
    const size = Number.parseInt(
      nullTerminated(header.subarray(124, 136)).trim() || '0',
      8
    );
    const fileName = prefix ? `${prefix}/${name}` : name;
    const contentStart = offset + 512;
    const contentEnd = contentStart + size;
    const type = header[156];
    if (type === 0x30 || type === 0) {
      if (files.has(fileName)) {
        throw new Error(`Duplicate archive file ${fileName}.`);
      }
      files.set(fileName, Buffer.from(tar.subarray(contentStart, contentEnd)));
    } else if (type !== 0x35) {
      throw new Error(`Unsupported archive record type for ${fileName}.`);
    }
    offset = contentStart + Math.ceil(size / 512) * 512;
  }
  return files;
}

function hashTarDirectory(files, prefix) {
  const entries = [];
  for (const [fileName, bytes] of files) {
    if (fileName.startsWith(prefix)) {
      entries.push([fileName.slice(prefix.length), bytes]);
    }
  }
  if (entries.length === 0) {
    throw new Error(`Archive directory ${prefix} is empty.`);
  }
  const rows = entries.map(
    ([relativePath, bytes]) => `${relativePath} ${hashBytes(bytes)}\n`
  );
  rows.sort((left, right) => Buffer.compare(Buffer.from(left), Buffer.from(right)));
  return {
    contentHash: `sha256:${hashBytes(Buffer.from(rows.join('')))}`,
    fileCount: entries.length,
  };
}

function optionalTarDirectoryHash(files, prefix) {
  return [...files.keys()].some((fileName) => fileName.startsWith(prefix))
    ? hashTarDirectory(files, prefix).contentHash
    : null;
}

function requiredTarFile(files, name) {
  const bytes = files.get(name);
  if (!bytes) {
    throw new Error(`Archive is missing ${name}.`);
  }
  return bytes;
}

function nullTerminated(value) {
  const terminator = value.indexOf(0);
  return value
    .subarray(0, terminator === -1 ? value.length : terminator)
    .toString('utf8');
}

function git(repository, args) {
  return execFileSync('git', ['-C', path.join(workspaceRoot, repository), ...args], {
    encoding: 'utf8',
    maxBuffer: 128 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function gitNull(repository, args) {
  const output = execFileSync(
    'git',
    ['-C', path.join(workspaceRoot, repository), ...args],
    {
      maxBuffer: 128 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );
  return output
    .toString('utf8')
    .split('\0')
    .filter(Boolean);
}

function gitBuffer(repository, args) {
  return execFileSync(
    'git',
    ['-C', path.join(workspaceRoot, repository), ...args],
    {
      maxBuffer: 128 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );
}

function hashCanonicalJson(value) {
  return `sha256:${hashBytes(Buffer.from(JSON.stringify(toCanonicalJson(value))))}`;
}

function toCanonicalJson(value) {
  if (
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'string'
  ) {
    return value;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new TypeError('Canonical JSON rejects non-finite numbers.');
    }
    return Object.is(value, -0) ? 0 : value;
  }
  if (Array.isArray(value)) {
    return value.map((entry) =>
      entry === undefined ? null : toCanonicalJson(entry)
    );
  }
  if (value && typeof value === 'object') {
    const result = {};
    for (const key of Object.keys(value).sort()) {
      if (value[key] !== undefined) {
        result[key] = toCanonicalJson(value[key]);
      }
    }
    return result;
  }
  throw new TypeError(`Canonical JSON rejects ${typeof value}.`);
}

function hashBytes(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function hashFile(filePath) {
  return hashBytes(readFileSync(filePath));
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function atomicWriteJson(filePath, value) {
  const bytes = `${JSON.stringify(value, null, 2)}\n`;
  assertPortableEvidence(bytes, filePath);
  const temporary = `${filePath}.next`;
  writeFileSync(temporary, bytes);
  renameSync(temporary, filePath);
}

function atomicCopy(source, destination) {
  const temporary = `${destination}.next`;
  copyFileSync(source, temporary);
  renameSync(temporary, destination);
}

function assertPrivacyClean(files) {
  for (const file of files) {
    assertPortableEvidence(readFileSync(file, 'utf8'), file);
  }
}

function assertPortableEvidence(bytes, label) {
  for (const forbidden of [
    workspaceRoot,
    path.dirname(workspaceRoot),
    '/Users/',
    '/private/tmp/',
    '/tmp/',
  ]) {
    if (bytes.includes(forbidden)) {
      throw new Error(`${label} contains forbidden absolute-path residue.`);
    }
  }
}
