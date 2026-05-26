#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import test from "node:test";

const workspaceRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const controlScript = path.join(workspaceRoot, "scripts/workspace-control.mjs");

function run(args) {
  return spawnSync("node", [controlScript, ...args], {
    cwd: workspaceRoot,
    encoding: "utf8",
  });
}

test("--print verify maps friendly flags to verify-control-center flags", () => {
  const result = run(["--print", "verify", "--dispatch", "--runtime", "--script-tests"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(
    result.stdout,
    /node scripts\/verify-control-center\.mjs --require-todo --require-task-packages --with-runtime --with-script-tests/,
  );
});

test("--print sync write keeps explicit write gate and post-check", () => {
  const result = run(["--print", "sync", "--write", "--verify", "--dispatch"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /node scripts\/sync-current-plan\.mjs --write/);
  assert.match(result.stdout, /node scripts\/sync-current-plan\.mjs --check/);
  assert.match(result.stdout, /node scripts\/verify-control-center\.mjs --require-todo --require-task-packages/);
});

test("--print design preserves focused handoff validation arguments", () => {
  const result = run(["--print", "design", "--id", "PCVM-2026-05-25", "--json"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /node scripts\/import-design-handoffs\.mjs --json --id PCVM-2026-05-25/);
});

test("unknown command fails closed", () => {
  const result = run(["--print", "launch"]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unknown workspace-control command/);
});
