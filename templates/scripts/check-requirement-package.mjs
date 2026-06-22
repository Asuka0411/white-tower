#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const branchArg = process.argv.find((arg) => arg.startsWith("--branch="));
const branchName = branchArg ? branchArg.slice("--branch=".length) : "";

const requiredPackageFiles = [
  "00-meta.md",
  "01-需求文档.md",
  "02-界面设计.md",
  "03-技术方案.md",
  "04-任务拆解.md",
  "05-验收记录.md",
  "06-发布交接.md",
];

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

function listMarkdownDirs(relativeDir) {
  const absoluteDir = path.join(root, relativeDir);
  if (!existsSync(absoluteDir)) {
    return [];
  }

  const dirs = [];
  for (const entry of readdirSync(absoluteDir, { withFileTypes: true })) {
    const entryRelative = path.join(relativeDir, entry.name);
    if (entry.isDirectory()) {
      dirs.push(...listMarkdownDirs(entryRelative));
      const hasMeta = existsSync(path.join(root, entryRelative, "00-meta.md"));
      if (hasMeta) {
        dirs.push(entryRelative.split(path.sep).join("/"));
      }
    }
  }
  return dirs;
}

function sectionBody(markdown, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = markdown.match(
    new RegExp(`^## ${escaped}\\s*\\n([\\s\\S]*?)(?=\\n## |\\n# |$)`, "m"),
  );
  return match ? match[1].trim() : "";
}

function taskSections(markdown) {
  const lines = markdown.split(/\r?\n/);
  const tasks = [];
  let current = null;

  for (const line of lines) {
    const heading = line.match(/^### (TASK-[^:]+):/);
    if (heading) {
      if (current) {
        tasks.push(current);
      }
      current = { id: heading[1].trim(), bodyLines: [] };
      continue;
    }

    if (current) {
      current.bodyLines.push(line);
    }
  }

  if (current) {
    tasks.push(current);
  }

  return tasks.map((task) => ({
    id: task.id,
    body: task.bodyLines.join("\n"),
  }));
}

function listField(body, name) {
  const lines = body.split(/\r?\n/);
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

function fail(errors) {
  console.error("Requirement package check failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

function validBranch(name) {
  return /^(feat|fix|hotfix)_\d{3,}_[a-z0-9]+(?:_[a-z0-9]+)*$/.test(name)
    || /^release_\d{4}q[1-4]_\d{3,}$/.test(name);
}

const errors = [];

if (branchName && !validBranch(branchName)) {
  errors.push(`Invalid branch name: ${branchName}. Use lowercase underscores, e.g. feat_012_import_folder.`);
}

const packages = listMarkdownDirs("docs/requirements");

for (const packageDir of packages) {
  const packageName = path.basename(packageDir);
  const idFromPath = packageName.match(/^(\d{3,})_/);
  if (!idFromPath) {
    errors.push(`${packageDir} must start with a numeric ID, e.g. 012_import_folder.`);
  }

  for (const file of requiredPackageFiles) {
    if (!exists(`${packageDir}/${file}`)) {
      errors.push(`${packageDir} is missing ${file}.`);
    }
  }

  if (!exists(`${packageDir}/00-meta.md`)) {
    continue;
  }

  const meta = read(`${packageDir}/00-meta.md`);
  const requirementId = field(meta, "requirement_id");
  const status = field(meta, "status");
  const pathStatus = packageDir.split("/").at(-2);

  if (!requirementId) {
    errors.push(`${packageDir}/00-meta.md must declare requirement_id.`);
  } else if (idFromPath && requirementId !== idFromPath[1]) {
    errors.push(`${packageDir}/00-meta.md requirement_id=${requirementId} does not match folder ID ${idFromPath[1]}.`);
  }

  if (!status) {
    errors.push(`${packageDir}/00-meta.md must declare status.`);
  } else if (status !== pathStatus) {
    errors.push(`${packageDir}/00-meta.md status=${status} does not match folder ${pathStatus}/.`);
  }

  const linkedBranches = listField(meta, "linked_branches");
  for (const linkedBranch of linkedBranches) {
    if (!validBranch(linkedBranch)) {
      errors.push(`${packageDir}/00-meta.md has invalid linked branch ${linkedBranch}.`);
    }
    if (requirementId && /^feat_|^fix_|^hotfix_/.test(linkedBranch) && !linkedBranch.startsWith(`feat_${requirementId}_`) && !linkedBranch.startsWith(`fix_${requirementId}_`) && !linkedBranch.startsWith(`hotfix_${requirementId}_`)) {
      errors.push(`${packageDir}/00-meta.md linked branch ${linkedBranch} does not match requirement_id=${requirementId}.`);
    }
  }

  if (!exists(`${packageDir}/04-任务拆解.md`)) {
    continue;
  }

  const taskPlan = read(`${packageDir}/04-任务拆解.md`);
  const tasks = taskSections(taskPlan);
  if (!tasks.length) {
    errors.push(`${packageDir}/04-任务拆解.md must define at least one TASK section.`);
  }

  for (const task of tasks) {
    const branch = field(task.body, "branch");
    const status = field(task.body, "status");
    const mergeTarget = field(task.body, "merge_target");
    const allowedPaths = listField(task.body, "allowed_paths");
    const verification = listField(task.body, "verification");

    if (!branch) {
      errors.push(`${packageDir}/04-任务拆解.md ${task.id} must declare branch.`);
    } else if (!validBranch(branch)) {
      errors.push(`${packageDir}/04-任务拆解.md ${task.id} has invalid branch ${branch}.`);
    } else if (requirementId && /^feat_|^fix_|^hotfix_/.test(branch) && !branch.startsWith(`feat_${requirementId}_`) && !branch.startsWith(`fix_${requirementId}_`) && !branch.startsWith(`hotfix_${requirementId}_`)) {
      errors.push(`${packageDir}/04-任务拆解.md ${task.id} branch ${branch} does not match requirement_id=${requirementId}.`);
    }

    if (!status) {
      errors.push(`${packageDir}/04-任务拆解.md ${task.id} must declare status.`);
    }
    if (!mergeTarget) {
      errors.push(`${packageDir}/04-任务拆解.md ${task.id} must declare merge_target.`);
    }
    if (!allowedPaths.length) {
      errors.push(`${packageDir}/04-任务拆解.md ${task.id} must declare allowed_paths.`);
    }
    if (!verification.length) {
      errors.push(`${packageDir}/04-任务拆解.md ${task.id} must declare verification.`);
    }
  }

  if (status === "completed") {
    const acceptance = exists(`${packageDir}/05-验收记录.md`)
      ? read(`${packageDir}/05-验收记录.md`)
      : "";
    for (const target of [
      "`docs/product/PRD.md`",
      "`docs/product/UI.md`",
      "`docs/product/TECH.md`",
    ]) {
      if (!acceptance.includes(`[x] ${target}`)) {
        errors.push(`${packageDir}/05-验收记录.md must mark ${target} as backfilled before completed.`);
      }
    }
  }

  if (status === "archived") {
    const body = sectionBody(meta, "归档原因");
    if (!body) {
      errors.push(`${packageDir}/00-meta.md archived package must include ## 归档原因.`);
    }
  }
}

if (errors.length) {
  fail(errors);
}

console.log(`Requirement package check passed: ${packages.length} package(s).`);
