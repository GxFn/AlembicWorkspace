#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const pcvmRoot = path.resolve(import.meta.dirname, '..');
const runId = process.argv[2] || 'pcv-20260530-1515-alembic-cold-start';
const runRoot = path.join(pcvmRoot, 'scratch', 'chain-runs', runId);
const reportRoot = path.join(runRoot, 'report');
const recordsRoot = path.join(reportRoot, 'records');

const requiredFiles = [
  'config/pcvm-flow-control.json',
  'skills/pcvm-flow-controller/SKILL.md',
  `scratch/chain-runs/${runId}/report/plan.md`,
  `scratch/chain-runs/${runId}/report/records/data.md`,
  `scratch/chain-runs/${runId}/report/records/issues.md`,
  `scratch/chain-runs/${runId}/report/records/progress.md`,
  `scratch/chain-runs/${runId}/report/records/review.md`,
  `scratch/chain-runs/${runId}/report/records/rounds.md`,
  `scratch/chain-runs/${runId}/report/records/task-packages.md`,
  `scratch/chain-runs/${runId}/report/records/ai-local-chain.md`,
];

const allowedIssueClasses = new Set([
  'product-risk',
  'test-gap',
  'probe-error',
  'expected-boundary',
  'runtime-placeholder',
]);

const errors = [];

function readRelative(relativePath) {
  const absolute = path.join(pcvmRoot, relativePath);
  if (!fs.existsSync(absolute)) {
    errors.push(`missing required file: ${relativePath}`);
    return '';
  }
  return fs.readFileSync(absolute, 'utf8');
}

for (const relativePath of requiredFiles) {
  readRelative(relativePath);
}

let config = null;
try {
  config = JSON.parse(readRelative('config/pcvm-flow-control.json'));
} catch (err) {
  errors.push(`config/pcvm-flow-control.json is not valid JSON: ${err.message}`);
}

if (config) {
  if (!Array.isArray(config.flowStates) || config.flowStates.length === 0) {
    errors.push('flowStates must be a non-empty array');
  }
  if (!Array.isArray(config.roundRoute) || config.roundRoute.length === 0) {
    errors.push('roundRoute must be a non-empty array');
  }
  for (const round of config.roundRoute || []) {
    if (!round.roundId || !round.roundType || !round.defaultVerdictScope) {
      errors.push(`roundRoute entry missing roundId/roundType/defaultVerdictScope: ${JSON.stringify(round)}`);
    }
  }
}

const plan = readRelative(`scratch/chain-runs/${runId}/report/plan.md`);
const issues = readRelative(`scratch/chain-runs/${runId}/report/records/issues.md`);
const rounds = readRelative(`scratch/chain-runs/${runId}/report/records/rounds.md`);
const taskPackages = readRelative(`scratch/chain-runs/${runId}/report/records/task-packages.md`);

const plainVerdictMatches = [
  ...plan.matchAll(/verdict:\s*`(pass|blocked|fail|skipped)`/gi),
].map((match) => match[0]);
if (plainVerdictMatches.length > 0) {
  errors.push(`plain scoped verdicts found in plan.md: ${plainVerdictMatches.join(', ')}`);
}

const planLines = plan.split('\n');
for (const [index, line] of planLines.entries()) {
  if (/^\| `?(?:N\d+|EXP)/.test(line) && /\|\s*(pass|blocked|fail|skipped)\s*\|?\s*$/.test(line)) {
    errors.push(`plain table verdict at plan.md:${index + 1}: ${line}`);
  }
}

const issueSections = issues.split(/\n(?=### I-\d+:)/).filter((section) => /^### I-\d+:/m.test(section));
for (const section of issueSections) {
  const title = section.match(/^### (I-\d+:[^\n]+)/m)?.[1] || 'unknown issue';
  const issueClass = section.match(/^Issue class:\s*`([^`]+)`/m)?.[1];
  if (!issueClass) {
    errors.push(`${title} missing Issue class`);
    continue;
  }
  if (!allowedIssueClasses.has(issueClass)) {
    errors.push(`${title} has invalid Issue class: ${issueClass}`);
  }
}

for (const expectedRound of ['R1-engineering-discovery', 'R2-engineering-repair']) {
  if (!rounds.includes(expectedRound)) {
    errors.push(`rounds.md missing ${expectedRound}`);
  }
}

for (const expectedPackage of ['Package P0', 'Package P1', 'Package P2', 'Package P3']) {
  if (!taskPackages.includes(expectedPackage)) {
    errors.push(`task-packages.md missing ${expectedPackage}`);
  }
}

if (!fs.existsSync(path.join(reportRoot, 'artifacts'))) {
  errors.push('report/artifacts directory missing');
}
if (!fs.existsSync(recordsRoot)) {
  errors.push('report/records directory missing');
}

if (errors.length > 0) {
  console.error(JSON.stringify({ ok: false, runId, errors }, null, 2));
  process.exitCode = 1;
} else {
  console.log(
    JSON.stringify(
      {
        ok: true,
        runId,
        flowStates: config?.flowStates?.length ?? 0,
        rounds: config?.roundRoute?.length ?? 0,
        issueCount: issueSections.length,
      },
      null,
      2
    )
  );
}
