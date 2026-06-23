#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const stagedOnly = process.argv.includes("--staged");
const workstreamsDir = "docs/workstreams";
const initiativesDir = "docs/initiatives";

function read(path) {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

function gitChangedPaths() {
  const commands = stagedOnly
    ? [["diff", "--name-only", "--cached"]]
    : [
        ["diff", "--name-only", "--cached"],
        ["diff", "--name-only"],
        ["ls-files", "--others", "--exclude-standard"],
      ];

  const paths = new Set();
  for (const args of commands) {
    const output = execFileSync(
      "git",
      ["-c", "core.quotePath=false", ...args],
      { encoding: "utf8" },
    ).trim();

    if (output) {
      for (const path of output.split(/\r?\n/).filter(Boolean)) {
        paths.add(path);
      }
    }
  }

  return [...paths];
}

function field(markdown, name) {
  const match = markdown.match(new RegExp(`^${name}:\\s*(.+)$`, "m"));
  return match ? match[1].trim() : "";
}

function readListSection(content, section) {
  const heading = `## ${section}`;
  const start = content.indexOf(heading);
  if (start === -1) {
    return [];
  }

  const rest = content.slice(start + heading.length);
  const nextHeading = rest.search(/\n##\s+/);
  const body = nextHeading === -1 ? rest : rest.slice(0, nextHeading);
  return body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim())
    .filter(Boolean);
}

function readListFields(content, name) {
  const lines = content.split(/\r?\n/);
  const values = [];

  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index].trim() !== `${name}:`) {
      continue;
    }

    for (const line of lines.slice(index + 1)) {
      if (!line.trim()) {
        continue;
      }
      if (/^#{1,6}\s+/.test(line) || /^[A-Za-z0-9_-]+:/.test(line.trim())) {
        break;
      }
      const match = line.match(/^\s*-\s+(.+)$/);
      if (!match) {
        break;
      }
      values.push(match[1].trim());
    }
  }

  return [...new Set(values)];
}

function taskSections(content) {
  const lines = content.split(/\r?\n/);
  const tasks = [];
  let current = null;

  for (const line of lines) {
    const heading = line.match(/^###\s+(TASK-[^:]+):\s*(.+)$/);
    if (heading) {
      if (current) {
        tasks.push(current);
      }
      current = { id: heading[1].trim(), title: heading[2].trim(), bodyLines: [] };
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
    title: task.title,
    body: task.bodyLines.join("\n"),
  }));
}

function pathMatches(pattern, file) {
  if (pattern instanceof RegExp) {
    return pattern.test(file);
  }
  if (pattern.endsWith("/**")) {
    return file.startsWith(pattern.slice(0, -3));
  }
  if (pattern.endsWith("**")) {
    return file.startsWith(pattern.slice(0, -2));
  }
  return file === pattern || file.startsWith(`${pattern}/`);
}

function anyPatternMatches(patterns, file) {
  return patterns.some((pattern) => pathMatches(pattern, file));
}

function listMarkdownFiles(rootDir) {
  if (!existsSync(rootDir)) {
    return [];
  }

  const files = [];
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = `${directory}/${entry.name}`;
      if (entry.isDirectory()) {
        visit(path);
        continue;
      }
      if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push(path);
      }
    }
  };

  visit(rootDir);
  return files.sort();
}

function listActiveInitiativeTaskFiles() {
  const activeDir = `${initiativesDir}/active`;
  if (!existsSync(activeDir)) {
    return [];
  }

  const files = [];
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = `${directory}/${entry.name}`;
      if (entry.isDirectory()) {
        visit(path);
        continue;
      }
      if (entry.isFile() && entry.name === "04-任务拆解.md") {
        files.push(path);
      }
    }
  };

  visit(activeDir);
  return files.sort();
}

function readWorkstreams() {
  return listMarkdownFiles(workstreamsDir)
    .filter((file) => {
      const name = file.split("/").pop();
      return name !== "README.md" && name !== "template.md";
    })
    .map((file) => {
      const content = readFileSync(file, "utf8");
      return {
        file,
        id: field(content, "workstream_id") || file,
        status: field(content, "status") || "draft",
        allowedPaths: readListSection(content, "allowed_paths"),
        blockedPaths: readListSection(content, "blocked_paths"),
      };
    });
}

function readActiveInitiatives() {
  return listActiveInitiativeTaskFiles().flatMap((file) => {
    const content = readFileSync(file, "utf8");
    const initiativeDir = file.replace(/\/04-任务拆解\.md$/, "");
    const initiativeId = initiativeDir.split("/").pop() || initiativeDir;
    const tasks = taskSections(content);

    if (!tasks.length) {
      return [{
        file,
        id: initiativeId,
        status: "active",
        allowedPaths: readListFields(content, "allowed_paths"),
        blockedPaths: readListFields(content, "blocked_paths"),
      }];
    }

    return tasks.map((task) => ({
      file,
      id: `${initiativeId}/${task.id}`,
      status: field(task.body, "status") || "planned",
      allowedPaths: readListFields(task.body, "allowed_paths"),
      blockedPaths: readListFields(task.body, "blocked_paths"),
    }));
  });
}

function fail(messages) {
  console.error("Stage gate failed:");
  for (const message of messages) {
    console.error(`- ${message}`);
  }
  process.exit(1);
}

const preferredStatusPath = "docs/white-tower/status.md";
const legacyStatusPath = "docs/project-status.md";
const statusPath = existsSync(preferredStatusPath)
  ? preferredStatusPath
  : existsSync(legacyStatusPath)
    ? legacyStatusPath
    : preferredStatusPath;
const status = read(statusPath);

if (!status) {
  const changed = gitChangedPaths();
  const allowedBootstrap = new Set([
    "docs/white-tower/status.md",
    "docs/white-tower/stage-gates.md",
    "TODO.md",
    "docs/workstreams/README.md",
    "docs/workstreams/template.md",
    "docs/workstreams/draft/.gitkeep",
    "docs/workstreams/ready/.gitkeep",
    "docs/workstreams/active/.gitkeep",
    "docs/workstreams/blocked/.gitkeep",
    "docs/workstreams/done/.gitkeep",
    "docs/workstreams/archived/.gitkeep",
    "scripts/check-stage-gate.mjs",
    "scripts/migrate-white-tower.mjs",
  ]);

  const blocked = changed.filter((path) => !allowedBootstrap.has(path));
  if (blocked.length) {
    fail([
      `${statusPath} is missing. Bootstrap may only add gate files first.`,
      `Blocked changed paths: ${blocked.join(", ")}`,
    ]);
  }

  console.log("Stage gate passed: bootstrap gate files only.");
  process.exit(0);
}

const currentStage = field(status, "current_stage");
const gateMode = field(status, "gate_mode");
const changed = gitChangedPaths();
const errors = [];

const sourceLocked = gateMode === "source-locked" || /^([123])-/.test(currentStage);

const alwaysAllowedInDevelopment = [
  /^docs\//,
  /^TODO\.md$/,
  /^README\.md$/,
  /^sketches\//,
  /^outputs\/uiux\//,
  /^scripts\/check-stage-gate\.mjs$/,
  /^scripts\/check-initiative-package\.mjs$/,
  /^scripts\/check-requirement-package\.mjs$/,
  /^scripts\/migrate-white-tower\.mjs$/,
  /^\.github\//,
  /^lefthook\.yml$/,
  /^\.pre-commit-config\.yaml$/,
];

const blockedSourcePatterns = [
  /^app\//,
  /^apps\//,
  /^src\//,
  /^packages\//,
  /^server\//,
  /^client\//,
  /^lib\//,
  /^package\.json$/,
  /^pnpm-lock\.yaml$/,
  /^package-lock\.json$/,
  /^yarn\.lock$/,
  /^Cargo\.toml$/,
  /^go\.mod$/,
  /^pyproject\.toml$/,
  /^requirements\.txt$/,
];

if (sourceLocked) {
  const blocked = changed.filter((path) =>
    blockedSourcePatterns.some((pattern) => pattern.test(path)),
  );

  if (blocked.length) {
    errors.push(
      `gate_mode=${gateMode} blocks application source or runtime dependency changes: ${blocked.join(", ")}`,
    );
  }
}

if (gateMode === "development" || /^([45])-/.test(currentStage)) {
  const hasTechOverview = existsSync("docs/product/TECH.md");
  const hasLegacyTechDocs =
    existsSync("docs/architecture.md") || existsSync("docs/technical-plan.md");

  if (!hasTechOverview && !hasLegacyTechDocs) {
    errors.push(
      "development mode requires docs/product/TECH.md. Legacy projects may satisfy this with existing docs/architecture.md or docs/technical-plan.md, but new projects should create docs/product/TECH.md.",
    );
  }

  if (!existsSync("TODO.md")) {
    errors.push("development mode requires TODO.md");
  }

  const activeGates = [
    ...readWorkstreams().filter((workstream) => workstream.status === "active"),
    ...readActiveInitiatives(),
  ];
  const developmentFiles = changed.filter(
    (path) => !anyPatternMatches(alwaysAllowedInDevelopment, path),
  );

  if (developmentFiles.length > 0 && activeGates.length === 0) {
    errors.push(
      "development mode found implementation changes, but docs/initiatives/active or docs/workstreams has no active initiative/workstream gate.",
    );
  }

  for (const path of developmentFiles) {
    const matched = activeGates.filter((gate) =>
      anyPatternMatches(gate.allowedPaths, path),
    );
    if (matched.length === 0) {
      errors.push(
        `${path} does not match any active initiative/workstream allowed_paths.`,
      );
      continue;
    }

    const blockedBy = matched.filter((gate) =>
      anyPatternMatches(gate.blockedPaths, path),
    );
    if (blockedBy.length > 0) {
      errors.push(
        `${path} is blocked by active initiative/workstream ${blockedBy
          .map((gate) => gate.id)
          .join(", ")} blocked_paths.`,
      );
    }
  }
}

if (!currentStage) {
  errors.push(`${statusPath} must declare current_stage`);
}

if (!gateMode) {
  errors.push(`${statusPath} must declare gate_mode`);
}

if (errors.length) {
  fail(errors);
}

console.log(`Stage gate passed: current_stage=${currentStage}, gate_mode=${gateMode}.`);
