#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function exists(relativePath) {
  return existsSync(path.join(root, relativePath));
}

function field(markdown, name) {
  const match = markdown.match(new RegExp(`^${name}:[ \\t]*(.*)$`, "m"));
  return match ? match[1].trim() : "";
}

function sectionList(markdown, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = markdown.match(
    new RegExp(`^## ${escaped}\\s*\\n([\\s\\S]*?)(?=\\n## |\\n# |$)`, "m"),
  );
  if (!match) {
    return [];
  }

  return match[1]
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim())
    .filter(Boolean);
}

function fieldList(markdown, name) {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `${name}:`);
  if (start === -1) {
    return [];
  }

  const values = [];
  for (const line of lines.slice(start + 1)) {
    if (!line.trim()) {
      continue;
    }
    if (/^[A-Za-z0-9_-]+:/.test(line)) {
      break;
    }
    const match = line.match(/^\s*-\s+(.+)$/);
    if (!match) {
      break;
    }
    values.push(match[1].trim());
  }
  return values;
}

function listMarkdownFiles(relativeDir) {
  const absoluteDir = path.join(root, relativeDir);
  if (!existsSync(absoluteDir)) {
    return [];
  }

  const files = [];
  for (const entry of readdirSync(absoluteDir, { withFileTypes: true })) {
    const entryRelative = path.join(relativeDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listMarkdownFiles(entryRelative));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(entryRelative.split(path.sep).join("/"));
    }
  }

  return files;
}

function fail(errors) {
  console.error("PRD governance failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

const errors = [];

if (!exists("docs/prd/README.md")) {
  errors.push("docs/prd/README.md is required as the current total PRD.");
}

if (!exists("docs/prd/requests/README.md")) {
  errors.push("docs/prd/requests/README.md is required to define request lifecycle states.");
}

const totalPrd = exists("docs/prd/README.md") ? read("docs/prd/README.md") : "";
const requestFiles = listMarkdownFiles("docs/prd/requests").filter(
  (file) => file !== "docs/prd/requests/README.md",
);
const workstreamFiles = listMarkdownFiles("docs/workstreams");
const workstreams = new Map();

for (const file of workstreamFiles) {
  const markdown = read(file);
  const id = field(markdown, "workstream_id");
  if (!id) {
    errors.push(`${file} must declare workstream_id.`);
    continue;
  }
  if (workstreams.has(id)) {
    errors.push(`Duplicate workstream_id=${id}.`);
  }
  workstreams.set(id, { file, markdown });
}

for (const file of requestFiles) {
  const markdown = read(file);
  const status = field(markdown, "status");
  const relatedWorkstream = field(markdown, "related_workstream");
  const pathStatus = file.split("/").at(-2);

  if (!status) {
    errors.push(`${file} must declare status.`);
    continue;
  }

  if (status !== pathStatus) {
    errors.push(`${file} has status=${status}, but lives under ${pathStatus}/.`);
  }

  if (status === "planned") {
    if (relatedWorkstream) {
      errors.push(`${file} is planned but already binds related_workstream=${relatedWorkstream}.`);
    }
    if (!markdown.includes("## 待澄清")) {
      errors.push(`${file} is planned and should keep a 待澄清 section.`);
    }
  }

  if (status === "in-progress") {
    if (!relatedWorkstream) {
      errors.push(`${file} is in-progress and must declare related_workstream.`);
    } else {
      const workstream = workstreams.get(relatedWorkstream);
      if (!workstream) {
        errors.push(`${file} points to missing workstream_id=${relatedWorkstream}.`);
      } else {
        const prdRequest = field(workstream.markdown, "prd_request");
        const workstreamStatus = field(workstream.markdown, "status");
        if (workstreamStatus !== "active") {
          errors.push(`${workstream.file} must be active for in-progress request ${file}.`);
        }
        if (prdRequest !== file) {
          errors.push(`${workstream.file} prd_request must point back to ${file}.`);
        }
      }
    }

    if (!markdown.includes("## 验收标准")) {
      errors.push(`${file} is in-progress and must define 验收标准.`);
    }
    if (!markdown.includes("## 上线后需要更新的总 PRD 章节")) {
      errors.push(`${file} is in-progress and must declare total PRD backfill sections.`);
    }
  }

  if (status === "completed") {
    if (field(markdown, "prd_backfilled") !== "true") {
      errors.push(`${file} is completed but prd_backfilled is not true.`);
    }
    if (!totalPrd.includes(file)) {
      errors.push(`${file} is completed but is not referenced by docs/prd/README.md.`);
    }
  }

  if (status === "archived") {
    if (!field(markdown, "archive_reason")) {
      errors.push(`${file} is archived and must declare archive_reason.`);
    }
    if (totalPrd.includes(file)) {
      errors.push(`${file} is archived but is referenced by docs/prd/README.md.`);
    }
  }
}

for (const { file, markdown } of workstreams.values()) {
  const status = field(markdown, "status");
  const prdRequest = field(markdown, "prd_request");
  const allowedPaths = sectionList(markdown, "Allowed Paths");
  const verification = sectionList(markdown, "Verification");

  if (status === "active") {
    if (!prdRequest || !exists(prdRequest)) {
      errors.push(`${file} is active and must point to an existing prd_request.`);
    } else {
      const requestStatus = field(read(prdRequest), "status");
      if (requestStatus !== "in-progress") {
        errors.push(`${file} is active but ${prdRequest} status is ${requestStatus}.`);
      }
    }

    if (!allowedPaths.length) {
      errors.push(`${file} is active and must declare Allowed Paths.`);
    }

    if (!verification.length) {
      errors.push(`${file} is active and must declare Verification commands.`);
    }
  }
}

const projectStatusPath = exists("docs/white-tower/status.md")
  ? "docs/white-tower/status.md"
  : "docs/project-status.md";

if (exists(projectStatusPath)) {
  const status = read(projectStatusPath);
  const focusPaths = fieldList(status, "current_focus");
  for (const focusPath of focusPaths) {
    if (!exists(focusPath)) {
      errors.push(`${projectStatusPath} current_focus points to missing ${focusPath}.`);
    }
  }
}

if (errors.length) {
  fail(errors);
}

console.log(`PRD governance passed: ${requestFiles.length} request(s), ${workstreams.size} workstream(s).`);
