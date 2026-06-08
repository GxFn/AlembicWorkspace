#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

function printHelp() {
  process.stdout.write(`Audit Test/tmp raw evidence retention.

This is a dry-run tool. It never deletes files. Deleting raw evidence requires
explicit user or control-plan authorization and a separate action.

Usage:
  node Test/scripts/tmp-evidence-retention.mjs [options]

Options:
  --tmp-dir <path>       Evidence directory. Default: Test/tmp
  --max-age-days <days>  Mark files older than this as cleanup candidates.
                         Default: 14
  --json                 Print JSON.
  -h, --help             Show this help.

Examples:
  node Test/scripts/tmp-evidence-retention.mjs
  node Test/scripts/tmp-evidence-retention.mjs --max-age-days 0
`);
}

function parseArgs(argv) {
  const options = {
    tmpDir: path.join(ROOT, 'tmp'),
    maxAgeDays: 14,
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '-h' || arg === '--help') {
      printHelp();
      process.exit(0);
    }
    if (arg === '--json') {
      options.json = true;
      continue;
    }
    if (arg === '--tmp-dir' || arg === '--max-age-days') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error(`${arg} requires a value`);
      }
      index += 1;
      if (arg === '--tmp-dir') {
        options.tmpDir = path.resolve(value);
      } else {
        const parsed = Number(value);
        if (!Number.isFinite(parsed) || parsed < 0) {
          throw new Error('--max-age-days must be a non-negative number');
        }
        options.maxAgeDays = parsed;
      }
      continue;
    }
    throw new Error(`Unknown option: ${arg}`);
  }

  return options;
}

function collectFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const results = [];
  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile()) {
        results.push(fullPath);
      }
    }
  }
  return results.sort();
}

function buildReport(options) {
  const now = Date.now();
  const maxAgeMs = options.maxAgeDays * 24 * 60 * 60 * 1000;
  const files = collectFiles(options.tmpDir).map((filePath) => {
    const stat = fs.statSync(filePath);
    const ageMs = now - stat.mtimeMs;
    return {
      path: path.relative(ROOT, filePath),
      bytes: stat.size,
      mtime: stat.mtime.toISOString(),
      ageDays: Number((ageMs / (24 * 60 * 60 * 1000)).toFixed(2)),
      cleanupCandidate: ageMs >= maxAgeMs,
    };
  });

  return {
    mode: 'dry-run',
    deleteSupported: false,
    tmpDir: path.relative(ROOT, options.tmpDir) || '.',
    maxAgeDays: options.maxAgeDays,
    fileCount: files.length,
    candidateCount: files.filter((file) => file.cleanupCandidate).length,
    totalBytes: files.reduce((sum, file) => sum + file.bytes, 0),
    files,
    note:
      'This report lists raw evidence candidates only. Do not delete files without explicit authorization.',
  };
}

function printText(report) {
  process.stdout.write(`Test tmp evidence retention audit (${report.mode})\n`);
  process.stdout.write(`tmpDir: ${report.tmpDir}\n`);
  process.stdout.write(`maxAgeDays: ${report.maxAgeDays}\n`);
  process.stdout.write(`files: ${report.fileCount}, candidates: ${report.candidateCount}\n`);
  process.stdout.write(`totalBytes: ${report.totalBytes}\n`);
  process.stdout.write(`${report.note}\n`);

  for (const file of report.files) {
    const mark = file.cleanupCandidate ? 'candidate' : 'keep';
    process.stdout.write(
      `- [${mark}] ${file.path} (${file.bytes} bytes, age=${file.ageDays}d, mtime=${file.mtime})\n`
    );
  }
}

try {
  const options = parseArgs(process.argv.slice(2));
  const report = buildReport(options);
  if (options.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    printText(report);
  }
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
}
