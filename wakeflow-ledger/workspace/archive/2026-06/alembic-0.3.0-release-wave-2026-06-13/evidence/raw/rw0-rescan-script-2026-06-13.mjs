// RW0 fresh re-scan (SD-5 phase-2 precondition). Reproduces the staging
// methodology: collect every @alembic/core* reference across the 4 consumer
// repos (mocks included), resolve each to its most-specific serving export
// key from the CURRENT Core package.json exports (Node exact>longest-wildcard),
// and tally per-key served counts. Confirms the 67 candidate wildcard keys are
// still zero-consumer and the keep-alive set (only the drizzle exact row has
// live refs). Pure analysis — writes JSON to the wave evidence dir; mutates
// nothing.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { scanConsumerCoreImports } from '/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore/scripts/lint-consumer-core-imports.mjs';

const CORE = '/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore';
const WS = '/Users/gaoxuefeng/Documents/AlembicWorkspace';

const DEFAULT_IGNORE = ['.git/**', 'coverage/**', 'dist/**', 'docs/**', 'node_modules/**', 'vendor/**'];

const CONSUMERS = [
  { name: 'Alembic', root: `${WS}/Alembic`, config: `${WS}/Alembic/config/core-import-boundary.json` },
  { name: 'AlembicAgent', root: `${WS}/AlembicAgent`, config: `${WS}/AlembicAgent/config/core-import-boundary.json` },
  { name: 'AlembicPlugin', root: `${WS}/AlembicPlugin`, config: `${WS}/AlembicPlugin/config/core-import-boundary-allowlist.json` },
  { name: 'AlembicDashboard', root: `${WS}/AlembicDashboard`, config: null },
];

function asArray(v) {
  return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
}

// Minimal config mirror of loadConfig: we only need scanRoots + ignore globs +
// includeMockReferences (forced true, as the staging scan did).
function buildConfig(configPath) {
  let raw = {};
  if (configPath) {
    try {
      raw = JSON.parse(readFileSync(configPath, 'utf8'));
    } catch {
      raw = {};
    }
  }
  return {
    adapterPathGlobs: asArray(raw.adapterPathGlobs),
    allowProvisional: raw.allowProvisional === true,
    allowedSpecifiers: new Set(),
    configPath,
    includeMockReferences: true,
    ignoreGlobs: [...DEFAULT_IGNORE, ...asArray(raw.ignoreGlobs), ...asArray(raw.ignoredPathGlobs)],
    referenceLimits: {},
    scanRoots: asArray(raw.scanRoots),
  };
}

// Current Core export keys.
const exportsMap = JSON.parse(readFileSync(`${CORE}/package.json`, 'utf8')).exports;
const exportKeys = Object.keys(exportsMap);

function specifierToSubpath(spec) {
  if (spec === '@alembic/core') return '.';
  return `.${spec.slice('@alembic/core'.length)}`; // '@alembic/core/x' -> './x'
}

// Node-style most-specific resolution: exact key wins; else the wildcard key
// with the longest prefix before '*' that brackets the subpath.
function resolveKey(subpath) {
  if (exportKeys.includes(subpath)) return subpath;
  let best = null;
  let bestLen = -1;
  for (const k of exportKeys) {
    const star = k.indexOf('*');
    if (star === -1) continue;
    const prefix = k.slice(0, star);
    const suffix = k.slice(star + 1);
    if (
      subpath.length >= prefix.length + suffix.length &&
      subpath.startsWith(prefix) &&
      subpath.endsWith(suffix)
    ) {
      if (prefix.length > bestLen) {
        bestLen = prefix.length;
        best = k;
      }
    }
  }
  return best;
}

const servedCounts = new Map(); // export key -> count
const repoReferenceTotals = {};
const unresolved = [];

for (const consumer of CONSUMERS) {
  const cfg = buildConfig(consumer.config);
  const result = scanConsumerCoreImports(consumer.root, cfg);
  repoReferenceTotals[consumer.name] = result.referencesScanned;
  for (const ref of result.references) {
    const subpath = specifierToSubpath(ref.specifier);
    const key = resolveKey(subpath);
    if (key === null) {
      unresolved.push({ repo: consumer.name, file: ref.file, line: ref.line, specifier: ref.specifier });
      continue;
    }
    servedCounts.set(key, (servedCounts.get(key) ?? 0) + 1);
  }
}

// Candidate 67 + keep-alive 37 from the staging JSON.
const staging = JSON.parse(
  readFileSync(
    `${WS}/.workspace-active/workspace/current/alembic-portfolio-execution-plan-p3-plugin-train/evidence/raw/sd5-phase2-staging-scan-2026-06-12.json`,
    'utf8'
  )
);
const candidate67 = staging.deprecatedWildcardKeys.map((r) => r.key);
const keepAlive = staging.keepAliveRows.map((r) => r.key);

const candidateLive = candidate67
  .map((k) => ({ key: k, served: servedCounts.get(k) ?? 0, present: exportKeys.includes(k) }))
  .filter((r) => r.served > 0 || !r.present);
const keepAliveReport = keepAlive.map((k) => ({
  key: k,
  served: servedCounts.get(k) ?? 0,
  present: exportKeys.includes(k),
}));

const report = {
  generatedFor: 'RW0 fresh re-scan (alembic-0.3.0-release-wave rw-t1)',
  scanner: 'lint-consumer-core-imports.mjs scanConsumerCoreImports, includeMockReferences=true, most-specific export-key resolution vs current Core package.json',
  consumerHeadsNote: 'Alembic fca6e6a / AlembicAgent 9c2a4b3 / AlembicPlugin 1256b1d / AlembicDashboard 18837ef (all advanced past the staging baseline)',
  repoReferenceTotals,
  candidate67Count: candidate67.length,
  candidate67AllPresentInExports: candidate67.every((k) => exportKeys.includes(k)),
  candidate67StillZeroConsumer: candidateLive.length === 0,
  candidateLiveOrMissing: candidateLive,
  keepAliveReport,
  unresolvedReferences: unresolved,
  servedKeyCounts: Object.fromEntries([...servedCounts.entries()].sort()),
};

console.log(JSON.stringify(report, null, 2));
