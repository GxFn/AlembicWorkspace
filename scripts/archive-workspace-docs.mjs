#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const workspaceRoot = process.cwd();
const workspaceDocsDir = path.join(workspaceRoot, "docs/workspace");
const indexPath = path.join(workspaceDocsDir, "index.md");
const args = process.argv.slice(2);
const apply = args.includes("--apply");
const json = args.includes("--json");
const trimIndex = !args.includes("--keep-index-rows");
const pruneIndexOnly = args.includes("--prune-index-only");

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

function sectionRange(content, heading) {
  const start = content.indexOf(`## ${heading}`);
  if (start < 0) {
    return null;
  }
  const rest = content.slice(start + 1);
  const next = rest.search(/\n## /);
  return {
    start,
    end: next >= 0 ? start + 1 + next : content.length,
  };
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

function archiveKey(monthValue, topicValue) {
  return `${monthValue}/${topicValue}`;
}

function archiveGroupFromLinkTarget(target) {
  const clean = stripMarkdownLinkTarget(target).replace(/^docs\/workspace\//, "");
  const parts = clean.split("/");
  if (parts[0] !== "archive" || parts.length < 3) {
    return null;
  }
  return {
    key: archiveKey(parts[1], parts[2]),
    monthValue: parts[1],
    topicValue: parts[2],
    archiveDir: path.join(workspaceDocsDir, "archive", parts[1], parts[2]),
  };
}

function addArchiveSummaryGroup(groups, group, count = 1) {
  if (!group) {
    return;
  }
  const previous = groups.get(group.key);
  groups.set(group.key, {
    ...group,
    fileCount: (previous?.fileCount ?? 0) + count,
  });
}

function trimArchivedRowsFromIndex(content, archivedTargets) {
  const range = sectionRange(content, "当前总控入口");
  if (!range) {
    return { content, removedRows: [], summaryGroups: [] };
  }

  const section = content.slice(range.start, range.end);
  const removedRows = [];
  const summaryGroups = new Map();
  const nextLines = [];

  for (const line of section.split("\n")) {
    const cells = splitMarkdownRow(line);
    if (cells.length < 2 || cells[0] === "类型" || cells[0].startsWith("---")) {
      nextLines.push(line);
      continue;
    }

    const match = cells[1].match(/\[[^\]]+]\(([^)]+)\)/);
    if (!match) {
      nextLines.push(line);
      continue;
    }

    const absoluteTarget = path.resolve(workspaceDocsDir, stripMarkdownLinkTarget(match[1]));
    const archiveGroup = archiveGroupFromLinkTarget(match[1]);
    if (archivedTargets.has(absoluteTarget) || archiveGroup) {
      removedRows.push(line);
      addArchiveSummaryGroup(summaryGroups, archiveGroup);
      continue;
    }

    nextLines.push(line);
  }

  return {
    content: `${content.slice(0, range.start)}${nextLines.join("\n")}${content.slice(range.end)}`,
    removedRows,
    summaryGroups: [...summaryGroups.values()],
  };
}

function archiveSummaryRow({ monthValue, topicValue, archiveDir, fileCount }) {
  const key = archiveKey(monthValue, topicValue);
  const archiveTarget = relativePosix(workspaceDocsDir, archiveDir);
  return `| \`${key}\` | [${topicValue}](${archiveTarget}/) | 最近归档 ${fileCount} 个 workspace 文档；当前索引只保留目录入口。 |`;
}

function upsertArchiveSummary(content, row) {
  const heading = "历史归档摘要";
  const section = sectionRange(content, heading);
  const summarySection = [
    `## ${heading}`,
    "",
    "| 归档主题 | 目录 | 说明 |",
    "| --- | --- | --- |",
    row,
    "",
  ].join("\n");

  if (!section) {
    const windowSection = sectionRange(content, "窗口覆盖状态");
    const insertAt = windowSection?.start ?? content.length;
    const prefix = content.slice(0, insertAt).replace(/\s*$/, "\n\n");
    const suffix = content.slice(insertAt).replace(/^\s*/, "");
    return `${prefix}${summarySection}${suffix ? `\n${suffix}` : ""}`;
  }

  const lines = content
    .slice(section.start, section.end)
    .split("\n")
    .filter((line) => line.trim().length > 0);
  const keyMatch = row.match(/\| `([^`]+)` \|/);
  const key = keyMatch?.[1] ?? "";
  let replaced = false;
  let separatorIndex = -1;
  const nextLines = lines.map((line, index) => {
    const cells = splitMarkdownRow(line);
    if (cells.every((cell) => /^:?-{3,}:?$/.test(cell))) {
      separatorIndex = index;
    }
    if (key && cells[0] === `\`${key}\``) {
      replaced = true;
      return row;
    }
    return line;
  });

  if (!replaced) {
    const insertAt = separatorIndex >= 0 ? separatorIndex + 1 : nextLines.length;
    nextLines.splice(insertAt, 0, row);
  }

  return `${content.slice(0, section.start)}${nextLines.join("\n")}\n\n${content
    .slice(section.end)
    .replace(/^\s*/, "")}`;
}

const topic = normalizeTopic(getArgValue("--topic") ?? "");
const month = getArgValue("--month") ?? "2026-05";
const files = getArgValues("--file");

const issues = [];
const operations = [];
let removedIndexRows = [];

if (!topic && files.length > 0) {
  issues.push("Missing --topic <name>");
}

if (files.length === 0 && !pruneIndexOnly) {
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
  const archivedTargets = new Set(plannedMoves.map(({ to }) => to));
  const summaryGroups = new Map();

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

  if (trimIndex) {
    const trimResult = trimArchivedRowsFromIndex(nextIndexContent, archivedTargets);
    nextIndexContent = trimResult.content;
    removedIndexRows = trimResult.removedRows;
    for (const group of trimResult.summaryGroups) {
      addArchiveSummaryGroup(summaryGroups, group, group.fileCount);
    }
    if (plannedMoves.length > 0) {
      const key = archiveKey(month, topic);
      if (!summaryGroups.has(key)) {
        addArchiveSummaryGroup(summaryGroups, {
          key,
          monthValue: month,
          topicValue: topic,
          archiveDir: targetDir,
        }, plannedMoves.length);
      }
    }
    for (const group of summaryGroups.values()) {
      nextIndexContent = upsertArchiveSummary(nextIndexContent, archiveSummaryRow(group));
    }
  }

  if (apply) {
    if (plannedMoves.length > 0) {
      mkdirSync(targetDir, { recursive: true });
    }
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
  trimIndex,
  pruneIndexOnly,
  operations,
  removedIndexRows,
  issues,
};

if (json) {
  console.log(JSON.stringify(result, null, 2));
} else if (result.ok) {
  console.log(apply ? "Workspace archive applied." : "Workspace archive dry-run passed.");
  if (result.archiveDir) {
    console.log(`Archive dir: ${result.archiveDir}`);
  }
  for (const operation of operations) {
    console.log(`- ${operation.from} -> ${operation.to}`);
  }
  if (trimIndex) {
    console.log(`Index rows removed: ${removedIndexRows.length}`);
  } else {
    console.log("Index row trimming disabled by --keep-index-rows.");
  }
  if (!apply) {
    console.log("Re-run with --apply to move files, rewrite links, and trim index rows.");
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
