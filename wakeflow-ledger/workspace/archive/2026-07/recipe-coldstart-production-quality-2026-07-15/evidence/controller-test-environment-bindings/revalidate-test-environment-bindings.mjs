#!/usr/bin/env node

import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  lstatSync,
  readFileSync,
  realpathSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const workspaceRoot = process.cwd();
const demandKey = 'recipe-coldstart-production-quality-2026-07-15';
const stateRootRef = `.wakeflow-active/current/${demandKey}`;
const evidenceRef = 'evidence/controller-test-environment-bindings';
const evidenceRoot = path.join(workspaceRoot, stateRootRef, evidenceRef);
const priorReceiptRef = `${evidenceRef}/test-environment-binding-receipt.json`;
const priorReceiptPath = path.join(
  workspaceRoot,
  stateRootRef,
  priorReceiptRef
);
const artifactEvidenceRef = 'evidence/controller-runtime-artifact-manifest';
const artifactEvidenceRoot = path.join(
  workspaceRoot,
  stateRootRef,
  artifactEvidenceRef
);

const expectedRepositories = {
  Alembic: {
    commit: 'd325952e23947d101ceb531bacaf47bd1d07180f',
    tree: 'c35f7dfc7eacc91e0e6ccad9da0e2e2240dd302c',
  },
  AlembicCore: {
    commit: 'f6e3f1956d67fa1d7a0a3440c2931196d9549d06',
    tree: '792d6f987d1b5e78f5e63e2b5a2ff7863a016e79',
  },
  AlembicAgent: {
    commit: 'a882f61cad34eed873db5ac52870475e6d71da52',
    tree: '2b2af813b3538308d957a5227ab102c15c04ea58',
  },
  AlembicPlugin: {
    commit: '44bbb4f1346cc177ad96dd17199746d7df0029d7',
    tree: '78e6b87e09ec3a355267f60f98a9f1b7c033b8f7',
  },
  AlembicDashboard: {
    commit: '6f5a39581cec22bca66b80c90a7c0232e316d288',
    tree: '5d1e9a5e2ba7efaec096af5085cc475c83b90b4c',
  },
};

const prior = readJson(priorReceiptPath);
const priorSemantic = structuredClone(prior);
delete priorSemantic.receiptHash;
assert(
  hashCanonicalJson(priorSemantic) === prior.receiptHash,
  'Prior binding receipt semantic hash mismatch.'
);

const repositories = Object.entries(expectedRepositories).map(
  ([name, expected]) => {
    const commit = git(name, ['rev-parse', 'HEAD']);
    const tree = git(name, ['rev-parse', 'HEAD^{tree}']);
    const clean = git(name, ['status', '--short']) === '';
    assert(
      commit === expected.commit && tree === expected.tree && clean,
      `${name} exact source binding mismatch.`
    );
    return { name, commit, tree, clean };
  }
);

const biliRoot = path.join(workspaceRoot, 'BiliDili');
const biliCommit = git('BiliDili', ['rev-parse', 'HEAD']);
const biliTree = git('BiliDili', ['rev-parse', 'HEAD^{tree}']);
const biliClean = git('BiliDili', ['status', '--short']) === '';
const priorSp = prior.sourceBindings.SRC_SP_ACCEPTED;
assert(
  biliCommit === priorSp.root.commit &&
    biliTree === priorSp.root.tree &&
    biliClean,
  'BiliDili root source binding drifted.'
);
const biliPackages = priorSp.packages.map((entry) => {
  const tree = git('BiliDili', ['rev-parse', `HEAD:${entry.relativeRoot}`]);
  assert(tree === entry.tree, `${entry.name} source tree drifted.`);
  return { ...entry, tree };
});

const homeRoot = homedir();
const ghostCases = {
  IDENTITY_MR_ACCEPTED: {
    projectId: 'ecf32806',
    expectedProjectRoot: workspaceRoot,
    priorIdentity: prior.identityBindings.IDENTITY_MR_ACCEPTED,
    priorRoot: prior.rootBindings.APPROVED_GHOST_MR,
  },
  IDENTITY_SP_ACCEPTED: {
    projectId: '02a25032',
    expectedProjectRoot: biliRoot,
    priorIdentity: prior.identityBindings.IDENTITY_SP_ACCEPTED,
    priorRoot: prior.rootBindings.APPROVED_GHOST_SP,
  },
};
const identityBindings = {};
for (const [identityRef, entry] of Object.entries(ghostCases)) {
  const dataRoot = path.join(
    homeRoot,
    '.asd',
    'workspaces',
    entry.projectId
  );
  const init = readJson(path.join(dataRoot, '.asd', 'codex-init.json'));
  const checks = {
    ghost: init.ghost === true,
    projectRootMatch:
      realpathSync(init.projectRoot) === realpathSync(entry.expectedProjectRoot),
    dataRootMatch: realpathSync(init.dataRoot) === realpathSync(dataRoot),
    rootRealpathHashMatch:
      hashString(realpathSync(dataRoot)) === entry.priorRoot.realpathHash,
    rootIsDirectory: lstatSync(dataRoot).isDirectory(),
    rootIsSymlink: lstatSync(dataRoot).isSymbolicLink(),
  };
  assert(
    Object.entries(checks).every(
      ([key, value]) => (key === 'rootIsSymlink' ? value === false : value === true)
    ),
    `${identityRef} no longer resolves to the approved Ghost identity.`
  );
  identityBindings[identityRef] = {
    projectId: entry.projectId,
    identityHash: entry.priorIdentity.identityHash,
    storageKind: 'ghost',
    route: init.route,
    profile: init.profile,
    rootRealpathHash: entry.priorRoot.realpathHash,
    checks,
  };
}

const plannedParent = path.join(workspaceRoot, 'Test', 'tmp');
assert(
  hashString(realpathSync(plannedParent)) ===
    prior.rootBindings.plannedAbsentParent.realpathHash,
  'Test planned-absent parent drifted.'
);
const scenarioLeaves = [
  'mr-pristine-data',
  'mr-pristine-lock',
  'mr-pristine-evidence',
  'mr-rebuild-snapshot',
  'mr-rebuild-lock',
  'mr-rebuild-evidence',
  'sp-pristine-data',
  'sp-pristine-lock',
  'sp-pristine-evidence',
  'sp-rebuild-snapshot',
  'sp-rebuild-lock',
  'sp-rebuild-evidence',
];
const scenarioBase = path.join(plannedParent, demandKey);
const plannedLeaves = scenarioLeaves.map((leaf) => ({
  leaf,
  pathHash: hashString(path.join(scenarioBase, leaf)),
  absent: !existsSync(path.join(scenarioBase, leaf)),
}));
assert(
  plannedLeaves.every((entry) => entry.absent),
  'At least one planned Test leaf already exists.'
);

const configBindings = {};
for (const [mode, projectId] of [
  ['PROD_CONFIG_MR', 'ecf32806'],
  ['PROD_CONFIG_SP', '02a25032'],
]) {
  const configRoot = path.join(
    homeRoot,
    '.asd',
    'workspaces',
    projectId,
    '.asd'
  );
  const settings = readJson(path.join(configRoot, 'settings.json'));
  const config = readJson(path.join(configRoot, 'config.json'));
  const secrets = readJson(path.join(configRoot, 'secrets.json'));
  const previous = prior.productionConfigBindings[mode];
  const projection = {
    provider: settings.ai?.provider ?? null,
    model: settings.ai?.model ?? null,
    embeddingProvider:
      settings.ai?.embedProvider ??
      (config.vector?.localEmbedding?.enabled ? 'ollama' : null),
    embeddingModel:
      settings.ai?.embedModel ??
      config.vector?.localEmbedding?.model ??
      null,
    embeddingEndpointPresent: Boolean(
      settings.ai?.embedBaseUrl ??
        config.vector?.localEmbedding?.endpoint
    ),
    deepSeekCredentialPresent: Boolean(
      secrets.ai?.providerKeys?.deepseek
    ),
  };
  const matchesPrevious =
    projection.provider === previous.provider &&
    projection.model === previous.model &&
    projection.embeddingProvider === previous.embeddingProvider &&
    projection.embeddingModel === previous.embeddingModel &&
    projection.deepSeekCredentialPresent === previous.credentialPresent;
  assert(matchesPrevious, `${mode} sanitized production config drifted.`);
  configBindings[mode] = {
    sourceRef: previous.sourceRef,
    provider: projection.provider,
    model: projection.model,
    embeddingProvider: projection.embeddingProvider,
    embeddingModel: projection.embeddingModel,
    deepSeekEndpointSymbol: previous.deepSeekEndpointSymbol,
    embeddingEndpointSymbol: previous.embeddingEndpointSymbol,
    reasoningEffortSymbol: previous.reasoningEffortSymbol,
    credentialLocation: previous.credentialLocation,
    credentialPresent: projection.deepSeekCredentialPresent,
    embeddingCredential: previous.embeddingCredential,
    safeConfigHash: previous.safeConfigHash,
    currentProjectionHash: hashCanonicalJson(projection),
    matchesPrevious,
  };
}

const manifestFile = 'runtime-artifact-manifest-v5.json';
const loadReceiptFile = 'runtime-artifact-load-receipt-v5.json';
const controllerReceiptFile =
  'controller-final-runtime-artifact-load-validation-receipt-v5.json';
const manifest = readJson(path.join(artifactEvidenceRoot, manifestFile));
const loadReceipt = readJson(path.join(artifactEvidenceRoot, loadReceiptFile));
const controllerReceipt = readJson(
  path.join(artifactEvidenceRoot, controllerReceiptFile)
);
const pcfReceipt = readJson(
  path.join(
    artifactEvidenceRoot,
    'final-artifact-pcf-regression-receipt-v3.json'
  )
);
const manifestCommits = Object.fromEntries(
  manifest.artifacts
    .filter((artifact) => artifact.commit)
    .map((artifact) => [artifact.repository, artifact.commit])
);
for (const repository of [
  'Alembic',
  'AlembicCore',
  'AlembicAgent',
  'AlembicPlugin',
]) {
  assert(
    manifestCommits[repository] === expectedRepositories[repository].commit,
    `${repository} runtime artifact binding is stale.`
  );
}
assert(
  pcfReceipt.finalCapabilityContract.lineageResult === 'unchanged' &&
    pcfReceipt.finalCapabilityContract.manifestHash ===
      'sha256:4d3ecdc70227cd3cc613c9df26ca04107a6327aec7eebc5eae3a5856c614f008',
  'Final PC-F artifact receipt is not unchanged.'
);
assert(
  manifest.openBlockers.length === 0 &&
    loadReceipt.dependencyResolution.singleCoreCopy === true &&
    controllerReceipt.verdict === 'passed',
  'Final runtime artifact load gate is not complete.'
);

const semantic = {
  schemaVersion: 1,
  kind: 'ControllerTestEnvironmentBindingRevalidationReceiptV1',
  demandKey,
  stateRootRef,
  issuedAt: new Date().toISOString(),
  authority: {
    priorBindingReceiptRef: priorReceiptRef,
    priorBindingReceiptFileHash: `sha256:${hashFile(priorReceiptPath)}`,
    priorBindingReceiptHash: prior.receiptHash,
    requirementDesignRef:
      'Design/docs/current/recipe-coldstart-production-quality-requirement-design-2026-07-15.md#20-test-decision',
    testEnvironmentSpecRef:
      'Design/docs/current/recipe-coldstart-production-quality-test-environment-spec-2026-07-15.md#21-executable-symbolic-environment-bindings',
  },
  taskLedger: {
    wakeflowStateRevision: 316,
    taskCount: 65,
    acceptedTaskCount: 65,
    nonAcceptedTaskCount: 0,
    testCardStatus: 'draft',
  },
  sourceBindings: {
    SRC_MR_ACCEPTED: {
      hashMethod: 'canonical JSON SHA-256 of ordered repository rows',
      sourceVectorHash: hashCanonicalJson(repositories),
      repositories,
    },
    SRC_SP_ACCEPTED: {
      sourceVectorHash: priorSp.sourceVectorHash,
      unchangedFromPrior: true,
      root: {
        name: 'BiliDili',
        commit: biliCommit,
        tree: biliTree,
        clean: biliClean,
      },
      packages: biliPackages,
    },
  },
  runtimeArtifactBinding: {
    manifestRef: `${artifactEvidenceRef}/${manifestFile}`,
    manifestHash: manifest.manifestHash,
    manifestContentHash: `sha256:${hashFile(
      path.join(artifactEvidenceRoot, manifestFile)
    )}`,
    loadReceiptRef: `${artifactEvidenceRef}/${loadReceiptFile}`,
    loadReceiptHash: loadReceipt.receiptHash,
    controllerValidationReceiptRef:
      `${artifactEvidenceRef}/${controllerReceiptFile}`,
    controllerValidationReceiptHash: controllerReceipt.receiptHash,
    pcfCapabilityContractHash:
      pcfReceipt.finalCapabilityContract.manifestHash,
    pcfLineageResult: pcfReceipt.finalCapabilityContract.lineageResult,
    singleCoreCopy: loadReceipt.dependencyResolution.singleCoreCopy,
  },
  identityBindings,
  rootBindings: {
    plannedAbsentParentRealpathHash:
      prior.rootBindings.plannedAbsentParent.realpathHash,
    approvedGhostRoots: {
      APPROVED_GHOST_MR:
        prior.rootBindings.APPROVED_GHOST_MR.realpathHash,
      APPROVED_GHOST_SP:
        prior.rootBindings.APPROVED_GHOST_SP.realpathHash,
    },
    plannedLeaves,
    allPlannedLeavesAbsent: true,
    pairwiseNonOverlap: prior.rootBindings.pairwiseNonOverlap,
    durableAbsolutePathCount: 0,
  },
  productionConfigBindings: {
    ...configBindings,
    secretValueCount: 0,
    secretDerivedHashCount: 0,
  },
  result: {
    artifactAndBindingGate: 'passed',
    environmentBindingsStatus: 'revalidated',
    technicalTestEligibility: true,
    testStartUser: false,
    testDispatchAuthorized: false,
    destructiveOperationAuthorized: false,
    testEntryDecision: 'paused-pending-fresh-user-test-start',
  },
  forbiddenConclusions: [
    'T6 real-project cold-start has run or passed',
    'Dashboard runtime was started',
    'A real project root or database was mutated',
    'Test is authorized or dispatched',
    'The demand is complete or archivable',
  ],
};
const receipt = {
  ...semantic,
  receiptHash: hashCanonicalJson(semantic),
};
const versionedPath = path.join(
  evidenceRoot,
  'test-environment-binding-revalidation-receipt-v2.json'
);
atomicWriteJson(versionedPath, receipt);
atomicCopy(
  versionedPath,
  path.join(
    evidenceRoot,
    'test-environment-binding-revalidation-receipt.json'
  )
);
process.stdout.write(
  `${JSON.stringify(
    {
      ok: true,
      receiptHash: receipt.receiptHash,
      sourceVectorHash:
        receipt.sourceBindings.SRC_MR_ACCEPTED.sourceVectorHash,
      pcfCapabilityContractHash:
        receipt.runtimeArtifactBinding.pcfCapabilityContractHash,
      environmentBindingsStatus:
        receipt.result.environmentBindingsStatus,
      technicalTestEligibility:
        receipt.result.technicalTestEligibility,
      testStartUser: receipt.result.testStartUser,
      testDispatchAuthorized:
        receipt.result.testDispatchAuthorized,
    },
    null,
    2
  )}\n`
);

function git(repository, args) {
  return execFileSync(
    'git',
    ['-C', path.join(workspaceRoot, repository), ...args],
    {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  ).trim();
}

function hashCanonicalJson(value) {
  return `sha256:${hashString(JSON.stringify(toCanonicalJson(value)), false)}`;
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
    assert(Number.isFinite(value), 'Canonical JSON rejects non-finite numbers.');
    return Object.is(value, -0) ? 0 : value;
  }
  if (Array.isArray(value)) {
    return value.map((entry) =>
      entry === undefined ? null : toCanonicalJson(entry)
    );
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .filter((key) => value[key] !== undefined)
        .map((key) => [key, toCanonicalJson(value[key])])
    );
  }
  throw new TypeError(`Canonical JSON rejects ${typeof value}.`);
}

function hashString(value, prefix = true) {
  const digest = createHash('sha256').update(value).digest('hex');
  return prefix ? `sha256:${digest}` : digest;
}

function hashFile(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function atomicWriteJson(filePath, value) {
  const bytes = `${JSON.stringify(value, null, 2)}\n`;
  assertPortableEvidence(bytes);
  const temporary = `${filePath}.next`;
  writeFileSync(temporary, bytes);
  renameSync(temporary, filePath);
}

function atomicCopy(source, destination) {
  const temporary = `${destination}.next`;
  copyFileSync(source, temporary);
  renameSync(temporary, destination);
}

function assertPortableEvidence(bytes) {
  for (const forbidden of [
    workspaceRoot,
    path.dirname(workspaceRoot),
    '/Users/',
    '/private/tmp/',
    '/tmp/',
  ]) {
    assert(!bytes.includes(forbidden), 'Evidence contains an absolute path.');
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
