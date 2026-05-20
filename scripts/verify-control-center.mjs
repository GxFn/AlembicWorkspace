#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const withRuntime = args.includes("--with-runtime");
const strictRuntime = args.includes("--strict-runtime");

const checks = [
  {
    label: "workspace boundary",
    command: "node",
    args: ["scripts/check-workspace-boundary.mjs"],
  },
  {
    label: "repo status",
    command: "node",
    args: ["scripts/collect-repo-status.mjs"],
  },
  {
    label: "workspace docs",
    command: "node",
    args: ["scripts/verify-workspace-docs.mjs", "--all-workspace"],
  },
  {
    label: "dispatch coverage",
    command: "node",
    args: ["scripts/check-dispatch-coverage.mjs"],
  },
  {
    label: "TODO board",
    command: "node",
    args: ["scripts/check-todo-board.mjs"],
  },
  {
    label: "git diff whitespace",
    command: "git",
    args: ["diff", "--check"],
  },
];

if (withRuntime || strictRuntime) {
  checks.push({
    label: "runtime residue",
    command: "node",
    args: ["scripts/check-runtime-residue.mjs", ...(strictRuntime ? ["--strict"] : [])],
  });
}

function runCheck(check) {
  console.log(`\n## ${check.label}`);
  console.log(`$ ${[check.command, ...check.args].join(" ")}`);

  const result = spawnSync(check.command, check.args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  return {
    ...check,
    status: result.status ?? 1,
    signal: result.signal ?? "",
    ok: result.status === 0,
  };
}

console.log("AlembicWorkspace control-center verification");
console.log(`Runtime residue check: ${withRuntime || strictRuntime ? (strictRuntime ? "strict" : "warning") : "skipped"}`);

const results = checks.map(runCheck);
const failed = results.filter((result) => !result.ok);

console.log("\n## Summary");
for (const result of results) {
  console.log(`- ${result.ok ? "PASS" : "FAIL"} ${result.label}`);
}

if (failed.length > 0) {
  process.exit(1);
}
