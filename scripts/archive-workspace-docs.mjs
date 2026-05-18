#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const workspaceRoot = process.cwd();
const workspaceDocsDir = path.join(workspaceRoot, "docs/workspace");
const indexPath = path.join(workspaceDocsDir, "index.md");
const args = process.argv.slice(2);
const apply = args.includes("--apply");
const json = args.includes("--json");

function getArgValues(name) {
  const values = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === name && args[index + 1]) {
      values.push(args[index + 1]);
      index += 1;
    } else if (arg.startsWith(`${name}=`)) {
      values.push(arg.slice(name.length + 1));
    }
  }
  return values;
}

function getArgValue(name) {
  return getArgValues(name).at(-1) ?? null;
}

function normalizeTopic(topic) {
  return topic
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function stripMarkdownLinkTarget(target) {
  let clean = target.trim();
  if (clean.startsWith("<") && clean.endsWith(">")) {
    clean = clean.slice(1, -1);
  }
  const hashIndex = clean.indexOf("#");
  if (hashIndex >= 0) {
    clean = clean.slice(0, hashIndex);
  }
  return clean;
}

function splitMarkdownRow(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) {
    return [];
  }
  return trimmed
    .slice(1, -1)
    .split("|")
    .map((cell) => cell.trim());
}

function sectionContent(content, heading) {
  const start = content.indexOf(`## ${heading}`);
  if (start < 0) {
    return "";
  }
  const rest = content.slice(start);
  const next = rest.slice(1).search(/\n## /);
  return next >= 0 ? rest.slice(0, next + 1) : rest;
}

function firstCurrentPlanPath(indexContent) {
  const currentSection = sectionContent(indexContent, "当前总控入口");
  for (const line of currentSection.split("\n")) {
    const cells = splitMarkdownRow(line);
    if (cells.length < 2 || cells[0] === "类型" || cells[0].startsWith("---")) {
      continue;
    }
    const match = cells[1].match(/\[[^\]]+]\(([^)]+)\)/);
    if (match) {
      return path.resolve(workspaceDocsDir, stripMarkdownLinkTarget(match[1]));
    }
  }
  return null;
}

function requireWorkspaceDoc(input) {
  const normalized = input.replace(/^docs\/workspace\//, "");
  const absolutePath = path.resolve(workspaceDocsDir, normalized);

  if (!absolutePath.startsWith(`${workspaceDocsDir}${path.sep}`)) {
    throw new Error(`Refusing to archive path outside docs/workspace: ${input}`);
  }

  if (!existsSync(absolutePath)) {
    throw new Error(`Workspace doc does not exist: ${input}`);
  }

  if (!absolutePath.endsWith(".md")) {
    throw new Error(`Only Markdown workspace docs can be archived: ${input}`);
  }

  if (path.basename(absolutePath) === "index.md") {
    throw new Error("Refusing to archive docs/workspace/index.md");
  }

  if (statSync(absolutePath).isDirectory()) {
    throw new Error(`Refusing to archive directory: ${input}`);
  }

  return absolutePath;
}

function relativePosix(from, to) {
  return path.relative(from, to).split(path.sep).join("/");
}

function replaceAllLiteral(content, from, to) {
  return content.split(from).join(to);
}

const topic = normalizeTopic(getArgValue("--topic") ?? "");
const month = getArgValue("--month") ?? "2026-05";
const files = getArgValues("--file");

const issues = [];
const operations = [];

if (!topic) {
  issues.push("Missing --topic <name>");
}

if (files.length === 0) {
  issues.push("Missing --file <docs/workspace/file.md>; repeat --file for multiple docs");
}

const indexContent = existsSync(indexPath) ? readFileSync(indexPath, "utf8") : "";
const currentPlan = indexContent ? firstCurrentPlanPath(indexContent) : null;

if (!indexContent) {
  issues.push("docs/workspace/index.md is missing");
}

let targetDir = "";
if (topic) {
  targetDir = path.join(workspaceDocsDir, "archive", month, topic);
}

const plannedMoves = [];
for (const file of files) {
  try {
    const from = requireWorkspaceDoc(file);
    if (currentPlan && from === currentPlan) {
      throw new Error(`Refusing to archive current plan: ${relativePosix(workspaceRoot, from)}`);
    }

    const to = path.join(targetDir, path.basename(from));
    if (existsSync(to)) {
      throw new Error(`Archive target already exists: ${relativePosix(workspaceRoot, to)}`);
    }

    plannedMoves.push({ from, to });
  } catch (error) {
    issues.push(error instanceof Error ? error.message : String(error));
  }
}

if (issues.length === 0) {
  let nextIndexContent = indexContent;

  for (const { from, to } of plannedMoves) {
    const oldFromIndex = relativePosix(workspaceDocsDir, from);
    const newFromIndex = relativePosix(workspaceDocsDir, to);
    const oldFromRoot = relativePosix(workspaceRoot, from);
    const newFromRoot = relativePosix(workspaceRoot, to);

    nextIndexContent = replaceAllLiteral(nextIndexContent, `](${oldFromIndex})`, `](${newFromIndex})`);
    nextIndexContent = replaceAllLiteral(nextIndexContent, `](${oldFromRoot})`, `](${newFromRoot})`);

    operations.push({
      from: oldFromRoot,
      to: newFromRoot,
      indexRewrites: [oldFromIndex, oldFromRoot],
    });
  }

  if (apply) {
    mkdirSync(targetDir, { recursive: true });
    for (const { from, to } of plannedMoves) {
      renameSync(from, to);
    }
    writeFileSync(indexPath, nextIndexContent);
  }
}

const result = {
  ok: issues.length === 0,
  applied: apply,
  archiveDir: targetDir ? relativePosix(workspaceRoot, targetDir) : null,
  currentPlan: currentPlan ? relativePosix(workspaceRoot, currentPlan) : null,
  operations,
  issues,
};

if (json) {
  console.log(JSON.stringify(result, null, 2));
} else if (result.ok) {
  console.log(apply ? "Workspace archive applied." : "Workspace archive dry-run passed.");
  console.log(`Archive dir: ${result.archiveDir}`);
  for (const operation of operations) {
    console.log(`- ${operation.from} -> ${operation.to}`);
  }
  if (!apply) {
    console.log("Re-run with --apply to move files and rewrite index links.");
  }
} else {
  console.error("Workspace archive check failed:");
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
}

if (!result.ok) {
  process.exit(1);
}
