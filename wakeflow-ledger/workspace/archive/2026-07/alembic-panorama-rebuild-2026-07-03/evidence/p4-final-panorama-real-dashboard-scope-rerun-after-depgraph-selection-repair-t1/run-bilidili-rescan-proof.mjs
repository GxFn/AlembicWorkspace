#!/usr/bin/env node
import { appendFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const baseUrl = process.argv[2] || "http://127.0.0.1:50897";
const outDir =
  process.argv[3] ||
  "/Users/gaoxuefeng/Documents/AlembicWorkspace/.wakeflow-active/current/alembic-panorama-rebuild-2026-07-03/evidence/p4-final-panorama-real-dashboard-scope-rerun-after-depgraph-selection-repair-t1";
const pollIntervalMs = Number(process.env.POLL_INTERVAL_MS || 10_000);
const budgetMs = Number(process.env.RESCAN_BUDGET_MS || 1_620_000);

const request = {
  reason: "p4-panorama-depgraph-selection-repair-rerun-scoped-terminal-proof",
  dimensions: ["architecture"],
  maxFiles: 4,
  contentMaxLines: 40,
  maxRounds: 1,
  scaleCap: 1,
};

function file(name) {
  return path.join(outDir, name);
}

async function requestJson(endpoint, options = {}) {
  const url = new URL(endpoint, baseUrl).toString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 20_000);
  try {
    const response = await fetch(url, {
      method: options.method || "GET",
      headers: options.body ? { "content-type": "application/json" } : undefined,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text.slice(0, 4000) };
    }
    return { ok: response.ok, status: response.status, url, data };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      url,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function extractJob(payload) {
  const data = payload?.data;
  return data?.job || data || payload?.job || payload;
}

function compactEvents(payload) {
  const data = payload?.data;
  const events = data?.events || payload?.events || data || [];
  return Array.isArray(events)
    ? events.slice(-20).map((event) => ({
        id: event.id,
        type: event.type || event.eventType || event.kind,
        status: event.status,
        message:
          typeof event.message === "string"
            ? event.message.slice(0, 240)
            : event.message,
        createdAt: event.createdAt || event.timestamp || event.time,
        taskId: event.taskId,
      }))
    : events;
}

function compactDisplay(payload) {
  const data = payload?.data || payload;
  return {
    status: data?.status,
    jobId: data?.jobId || data?.id,
    snapshotId: data?.snapshotId,
    snapshotVersion: data?.snapshotVersion,
    updatedAt: data?.updatedAt,
    warningCount: data?.warningCount,
    evidenceIncompleteCount: data?.evidenceIncompleteCount,
    keys: data && typeof data === "object" ? Object.keys(data).slice(0, 40) : [],
    textProbe: JSON.stringify(data || {}).slice(0, 1200),
  };
}

function compactJob(job) {
  return {
    id: job?.id,
    kind: job?.kind,
    status: job?.status,
    createdAt: job?.createdAt,
    updatedAt: job?.updatedAt,
    startedAt: job?.startedAt,
    completedAt: job?.completedAt,
    bootstrapSessionId: job?.bootstrapSessionId,
    request: job?.request,
    progress: job?.progress,
    summary: job?.summary,
    finalSession: job?.finalSession,
    displaySnapshot: job?.displaySnapshot,
    error: job?.error,
  };
}

const submit = await requestJson("/api/v1/jobs/rescan", {
  method: "POST",
  body: request,
  timeoutMs: 30_000,
});
writeFileSync(
  file("bilidili-rescan-submit.json"),
  JSON.stringify({ request, response: submit }, null, 2),
);
const submittedJob = extractJob(submit.data);
const jobId = submittedJob?.id;
if (!submit.ok || !jobId) {
  console.error(JSON.stringify({ ok: false, phase: "submit", submit }, null, 2));
  process.exit(1);
}

const startedAt = Date.now();
const polls = [];
let finalRecord = null;
let pollIndex = 0;

while (Date.now() - startedAt <= budgetMs) {
  pollIndex += 1;
  const status = await requestJson(`/api/v1/jobs/${jobId}?compact=true`, {
    timeoutMs: 20_000,
  });
  const job = compactJob(extractJob(status.data));
  const events = await requestJson(`/api/v1/jobs/${jobId}/events?limit=80`, {
    timeoutMs: 20_000,
  });
  const display = await requestJson(`/api/v1/jobs/${jobId}/display-snapshot`, {
    timeoutMs: 20_000,
  });
  const jobs = await requestJson("/api/v1/jobs?kind=rescan&limit=5&compact=true", {
    timeoutMs: 20_000,
  });
  const record = {
    pollIndex,
    elapsedMs: Date.now() - startedAt,
    fetchedAt: new Date().toISOString(),
    statusOk: status.ok,
    eventsOk: events.ok,
    displayOk: display.ok,
    jobsOk: jobs.ok,
    job,
    eventProbe: compactEvents(events.data),
    displayProbe: compactDisplay(display.data),
  };
  polls.push(record);
  appendFileSync(file("bilidili-rescan-polls.jsonl"), `${JSON.stringify(record)}\n`);
  writeFileSync(file("bilidili-rescan-status-latest.json"), JSON.stringify(status.data, null, 2));
  writeFileSync(file("bilidili-rescan-events-latest.json"), JSON.stringify(events.data, null, 2));
  writeFileSync(
    file("bilidili-rescan-display-snapshot-latest.json"),
    JSON.stringify(display.data, null, 2),
  );
  writeFileSync(file("bilidili-rescan-jobs-latest.json"), JSON.stringify(jobs.data, null, 2));
  console.log(
    JSON.stringify({
      pollIndex,
      elapsedSeconds: Math.round(record.elapsedMs / 1000),
      jobId,
      status: job.status,
      progress: job.progress,
      hasFinalSession: Boolean(job.finalSession),
      summaryStatus: job.summary?.status,
      eventsOk: events.ok,
      displayOk: display.ok,
      displayVersion: record.displayProbe?.snapshotVersion,
    }),
  );
  if (["completed", "failed", "cancelled"].includes(String(job.status))) {
    finalRecord = record;
    break;
  }
  await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
}

if (!finalRecord) {
  finalRecord = {
    timeout: true,
    elapsedMs: Date.now() - startedAt,
    fetchedAt: new Date().toISOString(),
    jobId,
    last: polls[polls.length - 1] || null,
  };
}

writeFileSync(
  file("bilidili-rescan-final-summary.json"),
  JSON.stringify(
    {
      jobId,
      request,
      baseUrl,
      budgetMs,
      pollIntervalMs,
      startedAt: new Date(startedAt).toISOString(),
      endedAt: new Date().toISOString(),
      pollCount: polls.length,
      finalRecord,
    },
    null,
    2,
  ),
);

const finalStatus = finalRecord?.job?.status;
if (finalRecord.timeout || finalStatus !== "completed") {
  process.exitCode = finalRecord.timeout ? 2 : 3;
}
