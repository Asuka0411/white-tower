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

const workstreamStates = new Set(["draft", "ready", "active", "blocked", "done", "archived"]);
const statusAliases = new Map([
  ["planned", "draft"],
  ["in-progress", "active"],
  ["completed", "done"],
]);

const operations = [];
const warnings = [];
const replacements = new Map();

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

  if (!hasRequirementPackages && hasLegacyPrd && hasWorkstreams) {
    warnings.push(
      "legacy PRD + workstreams layout detected; use compatibility mode unless you explicitly create docs/requirements packages.",
    );
  }
}

ensureWorkstreamStateDirs();
migrateFlatWorkstreams();
updateMarkdownReferences();
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
}
