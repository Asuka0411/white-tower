#!/usr/bin/env node

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const positionalArgs = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
const root = positionalArgs[0] ? path.resolve(positionalArgs[0]) : process.cwd();
const write = process.argv.includes("--write");
const createInitiatives = process.argv.includes("--create-initiatives")
  || process.argv.includes("--create-requirements");
const initiativeRoot = "docs/initiatives";
const legacyRequirementRoot = "docs/requirements";

const workstreamStates = new Set(["draft", "ready", "active", "blocked", "done", "archived"]);
const statusAliases = new Map([
  ["planned", "draft"],
  ["in-progress", "active"],
  ["completed", "done"],
]);

const operations = [];
const warnings = [];
const replacements = new Map();
const scheduledRequirementTargets = new Set();
const maybeEmptyRequirementDirs = new Set();

const requirementFolderStates = new Set(["planned", "active", "done", "archived"]);
const requirementLifecycleStates = new Set([
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
const requirementStatusAliases = new Map([
  ["draft", "planned"],
  ["ready", "planned"],
  ["preparing", "planned"],
  ["in-progress", "active"],
  ["review", "active"],
  ["paused", "active"],
  ["blocked", "active"],
  ["completed", "done"],
  ["cancelled", "archived"],
]);
const requirementLifecycleAliases = new Map([
  ["draft", "planned"],
  ["in-progress", "active"],
  ["completed", "done"],
  ["cancelled", "archived"],
]);
const requirementStatusByWorkstreamStatus = new Map([
  ["draft", "planned"],
  ["ready", "planned"],
  ["blocked", "active"],
  ["active", "active"],
  ["done", "done"],
  ["archived", "archived"],
]);
const requirementLifecycleByWorkstreamStatus = new Map([
  ["draft", "planned"],
  ["ready", "ready"],
  ["blocked", "blocked"],
  ["active", "active"],
  ["done", "done"],
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

function normalizedRequirementFolderStatus(status) {
  if (requirementFolderStates.has(status)) {
    return status;
  }
  return requirementStatusAliases.get(status) || "";
}

function normalizedRequirementLifecycleState(status, fallbackStatus) {
  if (requirementLifecycleStates.has(status)) {
    return status;
  }
  if (requirementLifecycleAliases.has(status)) {
    return requirementLifecycleAliases.get(status);
  }
  return fallbackStatus;
}

function requirementFolderStatusForLifecycle(lifecycleState) {
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

function listInitiativePackageDirs() {
  const roots = [initiativeRoot, legacyRequirementRoot]
    .filter((packageRoot) => existsSync(relative(packageRoot)));

  return roots
    .flatMap((packageRoot) => listMarkdownFiles(packageRoot)
      .filter((file) => path.basename(file) === "00-meta.md")
      .map((file) => toPosix(path.dirname(file))))
    .sort((a, b) => b.length - a.length);
}

function replaceField(markdown, name, value) {
  const pattern = new RegExp(`^${name}:[ \\t]*(.*)$`, "m");
  if (pattern.test(markdown)) {
    return markdown.replace(pattern, `${name}: ${value}`);
  }
  return `${markdown.trimEnd()}\n${name}: ${value}\n`;
}

function setFieldAfter(markdown, name, value, afterName) {
  const lines = markdown.split(/\r?\n/);
  const fieldPattern = new RegExp(`^${name}:[ \\t]*`);
  const afterPattern = new RegExp(`^${afterName}:[ \\t]*`);
  const existingIndex = lines.findIndex((line) => fieldPattern.test(line));
  if (existingIndex !== -1) {
    lines.splice(existingIndex, 1);
  }

  const afterIndex = lines.findIndex((line) => afterPattern.test(line));
  const insertIndex = afterIndex === -1 ? lines.length : afterIndex + 1;
  lines.splice(insertIndex, 0, `${name}: ${value}`);
  return lines.join("\n");
}

function packageRootFor(source) {
  if (source === legacyRequirementRoot || source.startsWith(`${legacyRequirementRoot}/`)) {
    return legacyRequirementRoot;
  }
  return initiativeRoot;
}

function trackMaybeEmptyPackageDirs(source) {
  const stopRoot = packageRootFor(source);
  let dir = path.dirname(source);
  while (dir && dir !== "." && dir !== stopRoot) {
    maybeEmptyRequirementDirs.add(toPosix(dir));
    dir = path.dirname(dir);
  }
  if (stopRoot === legacyRequirementRoot) {
    maybeEmptyRequirementDirs.add(stopRoot);
  }
}

function normalizeInitiativeIdField(markdown) {
  const legacyId = field(markdown, "requirement_id");
  const initiativeId = field(markdown, "initiative_id");
  if (!legacyId || initiativeId) {
    return markdown;
  }
  return markdown.replace(/^requirement_id:/m, "initiative_id:");
}

function migrateRequirementPackages() {
  if (!exists("docs", "initiatives") && !exists("docs", "requirements")) {
    return;
  }

  for (const source of listInitiativePackageDirs()) {
    const packageName = path.basename(source);
    const meta = read(`${source}/00-meta.md`);
    let nextMeta = meta;
    const rawStatus = field(meta, "status");
    const rawLifecycleState = field(meta, "lifecycle_state");
    const pathStatus = source.split("/").at(-2) || "";
    const targetStatus = normalizedRequirementFolderStatus(rawStatus)
      || normalizedRequirementFolderStatus(pathStatus);

    if (!targetStatus) {
      warnings.push(`${source} has no recognized initiative status; leave in place for manual review.`);
      continue;
    }

    const target = `${initiativeRoot}/${targetStatus}/${packageName}`;
    const shouldMove = source !== target;
    if (shouldMove && exists(target)) {
      warnings.push(`${target} already exists; cannot auto-move ${source}.`);
      continue;
    }

    let finalDir = source;
    if (shouldMove) {
      operations.push(`move ${source}/ -> ${target}/`);
      replacements.set(source, target);
      scheduledRequirementTargets.add(target);
      trackMaybeEmptyPackageDirs(source);
      finalDir = target;
      if (write) {
        mkdirSync(path.dirname(relative(target)), { recursive: true });
        renameSync(relative(source), relative(target));
      }
    }

    if (rawStatus !== targetStatus) {
      operations.push(`update status in ${finalDir}/00-meta.md to ${targetStatus}`);
      nextMeta = replaceField(nextMeta, "status", targetStatus);
      if (write) {
        writeFile(`${finalDir}/00-meta.md`, nextMeta);
      }
    }

    const nextIdMeta = normalizeInitiativeIdField(nextMeta);
    if (nextMeta !== nextIdMeta) {
      operations.push(`rename requirement_id to initiative_id in ${finalDir}/00-meta.md`);
      nextMeta = nextIdMeta;
      if (write) {
        writeFile(`${finalDir}/00-meta.md`, nextMeta);
      }
    }

    let targetLifecycleState = normalizedRequirementLifecycleState(rawLifecycleState, "")
      || normalizedRequirementLifecycleState(rawStatus, targetStatus)
      || normalizedRequirementLifecycleState(pathStatus, targetStatus);
    if (requirementFolderStatusForLifecycle(targetLifecycleState) !== targetStatus) {
      warnings.push(
        `${finalDir}/00-meta.md lifecycle_state=${targetLifecycleState} conflicts with status=${targetStatus}; reset lifecycle_state to ${targetStatus}.`,
      );
      targetLifecycleState = targetStatus;
    }
    const nextLifecycleMeta = setFieldAfter(
      nextMeta,
      "lifecycle_state",
      targetLifecycleState,
      "status",
    );
    if (nextMeta !== nextLifecycleMeta) {
      operations.push(`update lifecycle_state in ${finalDir}/00-meta.md to ${targetLifecycleState}`);
      nextMeta = nextLifecycleMeta;
      if (write) {
        writeFile(`${finalDir}/00-meta.md`, nextMeta);
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
  if (status === "done") {
    return "done";
  }
  if (status === "archived") {
    return "archived";
  }
  if (status === "active") {
    return "planned";
  }
  return "planned";
}

function listOrFallback(items, fallback) {
  const values = items.length ? items : fallback;
  return values.map((item) => `- ${item}`).join("\n");
}

function generatedMeta({ id, title, requirementStatus, lifecycleState, branch, source }) {
  const archiveReason = requirementStatus === "archived"
    ? "\n## 归档原因\n\n- Legacy workstream was archived before initiative-package migration.\n"
    : "";

  return `# 需求元信息

initiative_id: ${id}
title: ${title}
status: ${requirementStatus}
lifecycle_state: ${lifecycleState}
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
- active:
- done:
- archived:
${archiveReason}`;
}

function generatedRequirementDoc({ title, source, goal, acceptance }) {
  return `# 01-需求文档

## 背景

This package was generated from legacy White Tower documents. Treat it as a compatibility package until a human reviews and rewrites the initiative details.

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

## 关联页面

- See \`docs/uiux/README.md\`.

## 设计依据

- [UI/UX 入口](../../../uiux/README.md)
- [组件规范与交互状态](../../../uiux/04-组件规范与交互状态.md)
- [交互状态机](../../../uiux/05-交互状态机.md)
- Generated from \`${source}\`; review against legacy UI/UX documents.

## 页面图

### 待补页面图

- 源文件: [legacy source](${source})
- 图片: 待补。迁移脚本不能可靠推断具体截图，人工确认时必须补 PNG/JPG/WebP 并使用 \`![说明](相对路径)\` 嵌入。

## 状态

- loading:
- empty:
- ready:
- error:
- disabled:

## 文案要求

- 用户可见文案必须进入本地化资源。
- 文案必须说明当前状态、可执行动作和风险边界。

## 项目风格对齐

- Keep existing product UI direction. Do not introduce unrelated visual style changes during migration.
- If only HTML/Figma/prototype links exist, export stable preview images before treating this design section as review-ready.

## 需要反写到总 UI 的内容

- none until human review.
`;
}

function generatedTechnicalPlan({ source, allowedPaths, blockedPaths }) {
  return `# 03-技术方案

plan_status: draft
migration_level: compatible

## 技术目标

Preserve the implementation boundary described by \`${source}\` while migrating the project to initiative-package governance.

## 当前代码风格

Follow the existing project architecture, Flutter/Dart conventions, and \`docs/product/TECH.md\` when present. Legacy \`docs/architecture.md\` / \`docs/technical-plan.md\` files are compatibility inputs only.

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

Use the current data structures documented in \`docs/product/TECH.md\` when present, or legacy \`docs/architecture.md\` / \`docs/technical-plan.md\` as compatibility inputs. Refine this section before implementation if the task changes storage contracts.

## API / 函数边界

Use the current module/service boundaries from the legacy technical plan. Any new boundary must be recorded here before dispatch.

## 状态流

UI state should flow from domain/service state through a ViewModel, Presenter, Controller, or equivalent state coordination layer.

## 错误处理

Preserve existing error-code and user-facing message rules. Add explicit handling for loading, empty, invalid input, permission, and filesystem failure states when relevant.

## 测试策略

Run the verification commands inherited from the legacy workstream and add focused tests before marking this package approved.

## 兼容性和迁移

This generated package is compatibility-only. It references legacy docs and should be rewritten into a complete initiative package over time.

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
acceptance_slice: Initiative, UI, technical plan, task boundaries, and verification commands are confirmed against legacy docs.
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
  const checked = requirementStatus === "done" ? "x" : " ";
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

- Revert the implementation commit associated with this initiative package.

## 已知限制

- This package was generated from legacy documents and requires human review.

## 后续 TODO

- Rewrite generated sections into precise product, UI, technical, and acceptance details.
`;
}

function createLegacyRequirementPackages() {
  if (!createInitiatives) {
    return;
  }
  if (!exists("docs", "workstreams")) {
    return;
  }

  for (const source of listWorkstreamFiles()) {
    const descriptor = requirementFolderFromWorkstream(source);
    if (!descriptor) {
      warnings.push(`${source} does not start with a numeric ID; cannot create initiative package automatically.`);
      continue;
    }

    const markdown = read(source);
    const rawStatus = field(markdown, "status");
    const workstreamStatus = normalizedWorkstreamStatus(rawStatus);
    if (!workstreamStatus) {
      warnings.push(`${source} has no recognized status; cannot create initiative package automatically.`);
      continue;
    }

    const requirementStatus = requirementStatusByWorkstreamStatus.get(workstreamStatus) || "planned";
    const lifecycleState = requirementLifecycleByWorkstreamStatus.get(workstreamStatus) || requirementStatus;
    const targetDir = `${initiativeRoot}/${requirementStatus}/${descriptor.name}`;
    if (exists(targetDir) || scheduledRequirementTargets.has(targetDir)) {
      warnings.push(`${targetDir} already exists; skip generated initiative package for ${source}.`);
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
        lifecycleState,
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

    operations.push(`create initiative package ${targetDir}/ from ${canonicalSource}`);
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
  const hasInitiativePackages = exists("docs", "initiatives") || exists("docs", "requirements");
  const hasLegacyPrd = exists("docs", "prd");
  const hasWorkstreams = exists("docs", "workstreams");

  if (!hasInitiativePackages && hasLegacyPrd && hasWorkstreams && !createInitiatives) {
    warnings.push(
      "legacy PRD + workstreams layout detected; run with --create-initiatives to generate docs/initiatives compatibility packages.",
    );
  }
}

function removeEmptyRequirementDirs() {
  const dirs = Array.from(maybeEmptyRequirementDirs).sort((a, b) => b.length - a.length);
  for (const dir of dirs) {
    const absolute = relative(dir);
    if (!existsSync(absolute) || !statSync(absolute).isDirectory()) {
      continue;
    }
    if (readdirSync(absolute).length > 0) {
      continue;
    }
    operations.push(`remove empty ${dir}/`);
    if (write) {
      rmdirSync(absolute);
    }
  }
}

ensureWorkstreamStateDirs();
migrateFlatWorkstreams();
migrateRequirementPackages();
updateMarkdownReferences();
createLegacyRequirementPackages();
removeEmptyRequirementDirs();
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
  if (!createInitiatives) {
    console.log("Run with --create-initiatives to also generate docs/initiatives compatibility packages.");
  } else {
    console.log("Initiative packages use docs/initiatives/<planned|active|done|archived>/<id_slug>/.");
  }
}
