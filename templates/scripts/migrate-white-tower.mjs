#!/usr/bin/env node

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const positionalArgs = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
const root = positionalArgs[0] ? path.resolve(positionalArgs[0]) : process.cwd();
const write = process.argv.includes("--write");
const createRequirements = process.argv.includes("--create-requirements");

const workstreamStates = new Set(["draft", "ready", "active", "blocked", "done", "archived"]);
const statusAliases = new Map([
  ["planned", "draft"],
  ["in-progress", "active"],
  ["completed", "done"],
]);

const operations = [];
const warnings = [];
const replacements = new Map();

const requirementStatusByWorkstreamStatus = new Map([
  ["draft", "planned"],
  ["ready", "planned"],
  ["blocked", "planned"],
  ["active", "in-progress"],
  ["done", "completed"],
  ["archived", "archived"],
]);

function relative(...segments) {
  return path.join(root, ...segments);
}

function toPosix(filePath) {
  return filePath.split(path.sep).join("/");
}

function exists(...segments) {
  return existsSync(relative(...segments));
}

function read(file) {
  return readFileSync(relative(file), "utf8");
}

function writeFile(file, content) {
  if (write) {
    writeFileSync(relative(file), content);
  }
}

function field(markdown, name) {
  const match = markdown.match(new RegExp(`^${name}:[ \\t]*(.*)$`, "m"));
  return match ? match[1].trim() : "";
}

function sectionBody(markdown, heading) {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => {
    const match = line.match(/^#{1,6}\s+(.+)$/);
    return match && match[1].trim().toLowerCase() === heading.toLowerCase();
  });
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

function markdownListItems(body) {
  return body
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*-\s+(.+)$/))
    .filter(Boolean)
    .map((match) => match[1].trim());
}

function fencedOrEmpty(body) {
  return body.trim() ? body.trim() : "- none";
}

function listMarkdownFiles(dir) {
  const absoluteDir = relative(dir);
  if (!existsSync(absoluteDir)) {
    return [];
  }

  const files = [];
  for (const entry of readdirSync(absoluteDir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if ([".git", "node_modules", "build", "dist"].includes(entry.name)) {
        continue;
      }
      files.push(...listMarkdownFiles(entryPath));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(toPosix(entryPath));
    }
  }
  return files;
}

function listWorkstreamFiles() {
  const dir = relative("docs", "workstreams");
  if (!existsSync(dir)) {
    return [];
  }

  return listMarkdownFiles("docs/workstreams")
    .filter((file) => {
      const name = path.basename(file);
      return !["README.md", "template.md"].includes(name);
    })
    .sort();
}

function ensureWorkstreamStateDirs() {
  if (!exists("docs", "workstreams")) {
    return;
  }

  for (const state of workstreamStates) {
    const dir = relative("docs", "workstreams", state);
    const keep = path.join(dir, ".gitkeep");
    operations.push(`ensure docs/workstreams/${state}/`);
    if (write) {
      mkdirSync(dir, { recursive: true });
      if (!existsSync(keep)) {
        writeFileSync(keep, "");
      }
    }
  }
}

function normalizedWorkstreamStatus(status) {
  if (workstreamStates.has(status)) {
    return status;
  }
  return statusAliases.get(status) || "";
}

function requirementFolderFromWorkstream(file) {
  const base = path.basename(file, ".md");
  const match = base.match(/^(\d{3,})(?:[-_](.+))?$/);
  if (!match) {
    return null;
  }

  const id = match[1];
  const slug = (match[2] || "requirement")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    || "requirement";

  return {
    id,
    slug,
    name: `${id}_${slug}`,
    branch: `feat_${id}_${slug}`,
  };
}

function titleFromWorkstream(markdown, fallback) {
  const heading = markdown.match(/^#\s+(.+)$/m);
  if (!heading) {
    return fallback;
  }
  return heading[1].replace(/^Workstream:\s*/i, "").trim() || fallback;
}

function taskStatusFromRequirementStatus(status) {
  if (status === "completed") {
    return "done";
  }
  if (status === "archived") {
    return "archived";
  }
  if (status === "in-progress") {
    return "planned";
  }
  return "planned";
}

function listOrFallback(items, fallback) {
  const values = items.length ? items : fallback;
  return values.map((item) => `- ${item}`).join("\n");
}

function generatedMeta({ id, title, requirementStatus, branch, source }) {
  const archiveReason = requirementStatus === "archived"
    ? "\n## 归档原因\n\n- Legacy workstream was archived before requirement-package migration.\n"
    : "";

  return `# 需求元信息

requirement_id: ${id}
title: ${title}
status: ${requirementStatus}
priority: P1
owner:
created_at:
target_release:
source_discussion: legacy migration from ${source}
human_review_required: true

linked_branches:
- ${branch}

## 状态历史

- planned: generated from legacy workstream.
- in-progress:
- completed:
- archived:
${archiveReason}`;
}

function generatedRequirementDoc({ title, source, goal, acceptance }) {
  return `# 01-需求文档

## 背景

This package was generated from legacy White Tower documents. Treat it as a compatibility package until a human reviews and rewrites the requirement details.

## 用户问题

- See legacy PRD documents under \`docs/prd/\`.

## 目标

${fencedOrEmpty(goal)}

## 非目标

- Keep existing legacy PRD scope unchanged during migration.

## 用户流程

- See \`docs/prd/README.md\` and related module documents.

## 业务规则

- See legacy PRD modules and \`${source}\`.

## 验收标准

${fencedOrEmpty(acceptance)}

## 冲突点

- none recorded during automatic migration.

## 未决问题

- Human review is required before marking this package approved.

## 人工确认

- [ ] Confirm this generated package matches the current product intent.
`;
}

function generatedDesignDoc({ source }) {
  return `# 02-界面设计

## 页面清单

- See \`docs/uiux/README.md\`.

## 用户流程

- See legacy UI/UX documents under \`docs/uiux/\`.

## 页面跳转

- See legacy UI/UX documents under \`docs/uiux/\`.

## 低保真原型

- none linked during automatic migration.

## 高保真图

- See \`sketches/\` if present.

## 组件状态

- See \`docs/uiux/04-组件规范与交互状态.md\`.

## 加载 / 空 / 错误 / 禁用

- See legacy UI/UX state documents if present.

## 交互说明

- Generated from \`${source}\`; review against \`docs/uiux/\`.

## 动效说明

- See legacy animation or motion documents if present.

## 项目风格对齐

- Keep existing product UI direction. Do not introduce unrelated visual style changes during migration.

## 需要反写到总 UI 的内容

- none until human review.
`;
}

function generatedTechnicalPlan({ source, allowedPaths, blockedPaths }) {
  return `# 03-技术方案

plan_status: draft
migration_level: compatible

## 技术目标

Preserve the implementation boundary described by \`${source}\` while migrating the project to requirement-package governance.

## 当前代码风格

Follow the existing project architecture, Flutter/Dart conventions, and legacy \`docs/architecture.md\` / \`docs/technical-plan.md\` guidance.

## 架构偏好与分层约束

- UI 与数据分离：UI only renders state and forwards interaction intents.
- UI 层职责：presentation, interaction entry points, loading/empty/error rendering.
- 状态协调层职责：convert domain state into UI state and coordinate user actions.
- 数据 / 服务层职责：local persistence, filesystem operations, import services, and external adapters.
- 小 UI 改动的影响控制：small visual changes should not require data-layer changes unless this package explicitly records the contract impact.

## 影响范围

${listOrFallback(allowedPaths, ["docs/**"])}

## 非影响范围

${listOrFallback(blockedPaths, ["none"])}

## 数据结构

Use the current data structures documented in \`docs/architecture.md\` and \`docs/technical-plan.md\`; refine this section before implementation if the task changes storage contracts.

## API / 函数边界

Use the current module/service boundaries from the legacy technical plan. Any new boundary must be recorded here before dispatch.

## 状态流

UI state should flow from domain/service state through a ViewModel, Presenter, Controller, or equivalent state coordination layer.

## 错误处理

Preserve existing error-code and user-facing message rules. Add explicit handling for loading, empty, invalid input, permission, and filesystem failure states when relevant.

## 测试策略

Run the verification commands inherited from the legacy workstream and add focused tests before marking this package approved.

## 兼容性和迁移

This generated package is compatibility-only. It references legacy docs and should be rewritten into a complete requirement package over time.

## 风险和回滚

Risk: generated content may be too broad or stale. Rollback by deleting this generated package before it is used for implementation dispatch.

## 未解决问题

- Human review is required before approval.

## 需要新增或更新的 ADR

- none

## 需要反写到 TECH 的内容

- none until human review.
`;
}

function generatedTaskPlan({ id, title, branch, taskStatus, allowedPaths, blockedPaths, verification }) {
  return `# 04-任务拆解

## 任务 DAG

\`\`\`text
TASK-${id}-01
\`\`\`

## Tasks

### TASK-${id}-01: ${title} compatibility review

branch: ${branch}
agent:
status: ${taskStatus}
depends_on:
- none
can_parallel: false
source_plan_sections:
- 影响范围
- 测试策略
deliverable: Review and refine the generated compatibility package before dispatching implementation.
acceptance_slice: Requirement, UI, technical plan, task boundaries, and verification commands are confirmed against legacy docs.
contract_changes: none
review_focus: Check stale assumptions from legacy PRD, UI, technical-plan, and workstream files.

allowed_paths:
${listOrFallback(allowedPaths, ["docs/**"])}

blocked_paths:
${listOrFallback(blockedPaths, ["none"])}

verification:
${listOrFallback(verification, ["node scripts/check-stage-gate.mjs", "git diff --check"])}

merge_target: develop
conflict_risk: low
commit_policy: one coherent commit after verification

## 排期

- TBD after human review.

## 并行计划

- Do not parallelize until this generated package is reviewed.

## 前置条件

- Confirm the generated package is accurate.
`;
}

function generatedAcceptance({ requirementStatus }) {
  const checked = requirementStatus === "completed" ? "x" : " ";
  return `# 05-验收记录

## 验收范围

- Generated compatibility package only.

## 验收结果

- Pending human review.

## 测试记录

- none during automatic migration.

## 截图或录屏

- none.

## 已知问题

- Generated from legacy documents; details may need rewriting.

## 文档反写检查

- [${checked}] \`docs/product/PRD.md\`
- [${checked}] \`docs/product/UI.md\`
- [${checked}] \`docs/product/TECH.md\`
- [ ] \`docs/adr/\`
`;
}

function generatedReleaseHandoff() {
  return `# 06-发布交接

## 发布内容

- none during automatic migration.

## 发布分支

- TBD.

## 部署步骤

- Follow project README after implementation.

## 环境变量

- none recorded during automatic migration.

## 验证命令

- Run package verification and project gate checks before release.

## 回滚方案

- Revert the implementation commit associated with this requirement package.

## 已知限制

- This package was generated from legacy documents and requires human review.

## 后续 TODO

- Rewrite generated sections into precise product, UI, technical, and acceptance details.
`;
}

function createLegacyRequirementPackages() {
  if (!createRequirements) {
    return;
  }
  if (!exists("docs", "workstreams")) {
    return;
  }

  for (const source of listWorkstreamFiles()) {
    const descriptor = requirementFolderFromWorkstream(source);
    if (!descriptor) {
      warnings.push(`${source} does not start with a numeric ID; cannot create requirement package automatically.`);
      continue;
    }

    const markdown = read(source);
    const rawStatus = field(markdown, "status");
    const workstreamStatus = normalizedWorkstreamStatus(rawStatus);
    if (!workstreamStatus) {
      warnings.push(`${source} has no recognized status; cannot create requirement package automatically.`);
      continue;
    }

    const requirementStatus = requirementStatusByWorkstreamStatus.get(workstreamStatus) || "planned";
    const targetDir = `docs/requirements/${requirementStatus}/${descriptor.name}`;
    if (exists(targetDir)) {
      warnings.push(`${targetDir} already exists; skip generated requirement package for ${source}.`);
      continue;
    }

    const canonicalSource = replacements.get(source) || source;
    const title = titleFromWorkstream(markdown, descriptor.name);
    const goal = sectionBody(markdown, "目标");
    const acceptance = sectionBody(markdown, "验收标准");
    const allowedPaths = markdownListItems(sectionBody(markdown, "allowed_paths"));
    const blockedPaths = markdownListItems(sectionBody(markdown, "blocked_paths"));
    const verification = markdownListItems(sectionBody(markdown, "验证记录"))
      .concat(markdownListItems(sectionBody(markdown, "verification")));
    const taskStatus = taskStatusFromRequirementStatus(requirementStatus);

    const files = new Map([
      ["00-meta.md", generatedMeta({
        id: descriptor.id,
        title,
        requirementStatus,
        branch: descriptor.branch,
        source: canonicalSource,
      })],
      ["01-需求文档.md", generatedRequirementDoc({
        title,
        source: canonicalSource,
        goal,
        acceptance,
      })],
      ["02-界面设计.md", generatedDesignDoc({ source: canonicalSource })],
      ["03-技术方案.md", generatedTechnicalPlan({
        source: canonicalSource,
        allowedPaths,
        blockedPaths,
      })],
      ["04-任务拆解.md", generatedTaskPlan({
        id: descriptor.id,
        title,
        branch: descriptor.branch,
        taskStatus,
        allowedPaths,
        blockedPaths,
        verification,
      })],
      ["05-验收记录.md", generatedAcceptance({ requirementStatus })],
      ["06-发布交接.md", generatedReleaseHandoff()],
    ]);

    operations.push(`create requirement package ${targetDir}/ from ${canonicalSource}`);
    if (write) {
      mkdirSync(relative(targetDir, "02-assets"), { recursive: true });
      for (const [fileName, content] of files.entries()) {
        writeFileSync(relative(targetDir, fileName), content);
      }
    }
  }
}

function migrateFlatWorkstreams() {
  const dir = relative("docs", "workstreams");
  if (!existsSync(dir)) {
    return;
  }

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) {
      continue;
    }
    if (["README.md", "template.md"].includes(entry.name)) {
      continue;
    }

    const source = `docs/workstreams/${entry.name}`;
    const markdown = read(source);
    const rawStatus = field(markdown, "status");
    const status = normalizedWorkstreamStatus(rawStatus);

    if (!status) {
      warnings.push(`${source} has no recognized status; leave in place for manual review.`);
      continue;
    }

    const target = `docs/workstreams/${status}/${entry.name}`;
    if (exists(target)) {
      warnings.push(`${target} already exists; cannot auto-move ${source}.`);
      continue;
    }

    operations.push(`move ${source} -> ${target}`);
    replacements.set(source, target);

    if (write) {
      mkdirSync(path.dirname(relative(target)), { recursive: true });
      renameSync(relative(source), relative(target));
    }
  }
}

function updateMarkdownReferences() {
  if (!replacements.size) {
    return;
  }

  for (const file of listMarkdownFiles(".")) {
    const absolute = relative(file);
    if (!statSync(absolute).isFile()) {
      continue;
    }

    let content = readFileSync(absolute, "utf8");
    let next = content;
    for (const [from, to] of replacements.entries()) {
      next = next.split(from).join(to);
    }

    if (next !== content) {
      operations.push(`update references in ${file}`);
      if (write) {
        writeFile(file, next);
      }
    }
  }
}

function detectLegacyRequirementLayout() {
  const hasRequirementPackages = exists("docs", "requirements");
  const hasLegacyPrd = exists("docs", "prd");
  const hasWorkstreams = exists("docs", "workstreams");

  if (!hasRequirementPackages && hasLegacyPrd && hasWorkstreams && !createRequirements) {
    warnings.push(
      "legacy PRD + workstreams layout detected; run with --create-requirements to generate docs/requirements compatibility packages.",
    );
  }
}

ensureWorkstreamStateDirs();
migrateFlatWorkstreams();
updateMarkdownReferences();
createLegacyRequirementPackages();
detectLegacyRequirementLayout();

console.log(`White Tower migration ${write ? "applied" : "dry-run"} at ${root}`);

if (operations.length) {
  console.log("\nOperations:");
  for (const operation of operations) {
    console.log(`- ${operation}`);
  }
}

if (warnings.length) {
  console.log("\nWarnings:");
  for (const warning of warnings) {
    console.log(`- ${warning}`);
  }
}

if (!operations.length && !warnings.length) {
  console.log("No legacy data found.");
}

if (!write) {
  console.log("\nRun with --write to apply safe migrations.");
  if (!createRequirements) {
    console.log("Run with --create-requirements to also generate docs/requirements compatibility packages.");
  }
}
