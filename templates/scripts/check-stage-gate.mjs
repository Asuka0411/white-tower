#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const stagedOnly = process.argv.includes("--staged");

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
