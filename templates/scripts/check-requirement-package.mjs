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
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `## ${heading}`);
  if (start === -1) {
    return "";
  }

  const body = [];
  for (const line of lines.slice(start + 1)) {
    if (/^#{1,6}\s+/.test(line)) {
      break;
    }
    body.push(line);
  }
  return body.join("\n").trim();
}

function hasSection(markdown, heading) {
  return markdown
    .split(/\r?\n/)
    .some((line) => line.trim() === `## ${heading}`);
}

function isNone(value) {
  const normalized = value.trim().toLowerCase();
  return normalized === "" || normalized === "none" || normalized === "- none";
}

function nonNoneList(items) {
  return items.filter((item) => !isNone(item));
}

function markdownListItems(body) {
  return body
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*-\s+(.+)$/))
    .filter(Boolean)
    .map((match) => match[1].trim());
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
const requiredTechnicalSections = [
  "技术目标",
  "当前代码风格",
  "架构偏好与分层约束",
  "影响范围",
  "数据结构",
  "API / 函数边界",
  "状态流",
  "错误处理",
  "测试策略",
  "兼容性和迁移",
  "风险和回滚",
];

const validPlanStatuses = new Set(["draft", "review", "approved", "superseded"]);
const validMigrationLevels = new Set(["none", "compatible", "breaking"]);
const validFolderStatuses = new Set(["planned", "active", "done", "archived"]);
const validLifecycleStates = new Set([
  "planned",
  "preparing",
  "ready",
  "active",
  "review",
  "paused",
  "blocked",
  "done",
  "archived",
]);
function folderStatusForLifecycle(lifecycleState) {
  if (["planned", "preparing", "ready"].includes(lifecycleState)) {
    return "planned";
  }
  if (["active", "review", "paused", "blocked"].includes(lifecycleState)) {
    return "active";
  }
  if (lifecycleState === "done") {
    return "done";
  }
  if (lifecycleState === "archived") {
    return "archived";
  }
  return "";
}

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
  const lifecycleState = field(meta, "lifecycle_state");
  const pathParts = packageDir.split("/");
  const pathStatus = pathParts.at(-2);

  if (pathParts.length !== 4) {
    errors.push(`${packageDir} must be directly under docs/requirements/<planned|active|done|archived>/, without year or quarter folders.`);
  }

  if (!validFolderStatuses.has(pathStatus)) {
    errors.push(`${packageDir} must be under planned, active, done, or archived.`);
  }

  if (!requirementId) {
    errors.push(`${packageDir}/00-meta.md must declare requirement_id.`);
  } else if (idFromPath && requirementId !== idFromPath[1]) {
    errors.push(`${packageDir}/00-meta.md requirement_id=${requirementId} does not match folder ID ${idFromPath[1]}.`);
  }

  if (!status) {
    errors.push(`${packageDir}/00-meta.md must declare status.`);
  } else if (!validFolderStatuses.has(status)) {
    errors.push(`${packageDir}/00-meta.md status=${status} must be one of planned, active, done, archived. Use lifecycle_state for finer states.`);
  } else if (status !== pathStatus) {
    errors.push(`${packageDir}/00-meta.md status=${status} does not match folder ${pathStatus}/.`);
  }

  if (!lifecycleState) {
    errors.push(`${packageDir}/00-meta.md must declare lifecycle_state.`);
  } else if (!validLifecycleStates.has(lifecycleState)) {
    errors.push(`${packageDir}/00-meta.md lifecycle_state=${lifecycleState} must be one of planned, preparing, ready, active, review, paused, blocked, done, archived.`);
  } else if (folderStatusForLifecycle(lifecycleState) !== pathStatus) {
    errors.push(`${packageDir}/00-meta.md lifecycle_state=${lifecycleState} belongs under ${folderStatusForLifecycle(lifecycleState)}/, but folder is ${pathStatus}/.`);
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

  const technicalPlanPath = `${packageDir}/03-技术方案.md`;
  const technicalPlan = exists(technicalPlanPath) ? read(technicalPlanPath) : "";
  const planStatus = field(technicalPlan, "plan_status");
  const migrationLevel = field(technicalPlan, "migration_level");

  if (!technicalPlan.trim()) {
    errors.push(`${technicalPlanPath} must not be empty.`);
  }

  if (!planStatus) {
    errors.push(`${technicalPlanPath} must declare plan_status.`);
  } else if (!validPlanStatuses.has(planStatus)) {
    errors.push(`${technicalPlanPath} plan_status=${planStatus} must be one of draft, review, approved, superseded.`);
  }

  if (!migrationLevel) {
    errors.push(`${technicalPlanPath} must declare migration_level.`);
  } else if (!validMigrationLevels.has(migrationLevel)) {
    errors.push(`${technicalPlanPath} migration_level=${migrationLevel} must be one of none, compatible, breaking.`);
  }

  for (const section of requiredTechnicalSections) {
    if (!hasSection(technicalPlan, section)) {
      errors.push(`${technicalPlanPath} must include ## ${section}.`);
    } else if (!sectionBody(technicalPlan, section)) {
      errors.push(`${technicalPlanPath} ## ${section} must not be empty.`);
    }
  }

  const openQuestions = sectionBody(technicalPlan, "未解决问题");
  if (planStatus === "approved" && !isNone(openQuestions)) {
    errors.push(`${technicalPlanPath} cannot be approved while ## 未解决问题 is not none.`);
  }

  if (migrationLevel === "breaking") {
    const adrItems = nonNoneList(markdownListItems(sectionBody(technicalPlan, "需要新增或更新的 ADR")));
    if (!adrItems.length) {
      errors.push(`${technicalPlanPath} migration_level=breaking requires at least one ADR in ## 需要新增或更新的 ADR.`);
    }
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
    const sourcePlanSections = nonNoneList(listField(task.body, "source_plan_sections"));
    const deliverable = field(task.body, "deliverable");
    const acceptanceSlice = field(task.body, "acceptance_slice");
    const contractChanges = field(task.body, "contract_changes");
    const reviewFocus = field(task.body, "review_focus");

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
    if (!sourcePlanSections.length) {
      errors.push(`${packageDir}/04-任务拆解.md ${task.id} must declare source_plan_sections.`);
    }
    for (const section of sourcePlanSections) {
      if (technicalPlan && !hasSection(technicalPlan, section)) {
        errors.push(`${packageDir}/04-任务拆解.md ${task.id} references missing technical plan section: ${section}.`);
      }
    }
    if (!deliverable) {
      errors.push(`${packageDir}/04-任务拆解.md ${task.id} must declare deliverable.`);
    }
    if (!acceptanceSlice) {
      errors.push(`${packageDir}/04-任务拆解.md ${task.id} must declare acceptance_slice.`);
    }
    if (!contractChanges) {
      errors.push(`${packageDir}/04-任务拆解.md ${task.id} must declare contract_changes.`);
    }
    if (!reviewFocus) {
      errors.push(`${packageDir}/04-任务拆解.md ${task.id} must declare review_focus.`);
    }
  }

  if (status === "done") {
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
