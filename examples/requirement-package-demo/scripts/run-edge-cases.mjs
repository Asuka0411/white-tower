#!/usr/bin/env node

import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const demoRoot = path.dirname(path.dirname(scriptPath));
const repoRoot = path.dirname(path.dirname(demoRoot));
const checker = path.join(repoRoot, "templates/scripts/check-requirement-package.mjs");

function mutate(root, relativePath, replacer) {
  const target = path.join(root, relativePath);
  const before = readFileSync(target, "utf8");
  writeFileSync(target, replacer(before));
}

function cloneDemo() {
  const tempRoot = mkdtempSync(path.join(tmpdir(), "requirement-package-demo-"));
  cpSync(demoRoot, tempRoot, { recursive: true });
  return tempRoot;
}

function run(root, branch = "feat_012_import_folder") {
  return spawnSync(process.execPath, [checker, root, `--branch=${branch}`], {
    encoding: "utf8",
  });
}

const cases = [
  {
    name: "baseline passes",
    expectPass: true,
    mutate() {},
  },
  {
    name: "branch with REQ prefix fails",
    expectPass: false,
    branch: "feat_REQ_012_import_folder",
    mutate() {},
  },
  {
    name: "branch with hyphen fails",
    expectPass: false,
    branch: "feat_012_import-folder",
    mutate() {},
  },
  {
    name: "uppercase branch fails",
    expectPass: false,
    branch: "feat_012_Import_Folder",
    mutate() {},
  },
  {
    name: "requirement id mismatch fails",
    expectPass: false,
    mutate(root) {
      mutate(
        root,
        "docs/requirements/2026/Q3/in-progress/012_import_folder/00-meta.md",
        (text) => text.replace("requirement_id: 012", "requirement_id: 013"),
      );
    },
  },
  {
    name: "status and folder mismatch fails",
    expectPass: false,
    mutate(root) {
      mutate(
        root,
        "docs/requirements/2026/Q3/in-progress/012_import_folder/00-meta.md",
        (text) => text.replace("status: in-progress", "status: planned"),
      );
    },
  },
  {
    name: "missing task verification fails",
    expectPass: false,
    mutate(root) {
      mutate(
        root,
        "docs/requirements/2026/Q3/in-progress/012_import_folder/04-任务拆解.md",
        (text) => text.replace("verification:\n- npm test -- import", "verification:\n"),
      );
    },
  },
  {
    name: "task branch id mismatch fails",
    expectPass: false,
    mutate(root) {
      mutate(
        root,
        "docs/requirements/2026/Q3/in-progress/012_import_folder/04-任务拆解.md",
        (text) => text.replace("branch: feat_012_scan_diff", "branch: feat_013_scan_diff"),
      );
    },
  },
];

const results = [];
for (const testCase of cases) {
  const tempRoot = cloneDemo();
  try {
    testCase.mutate(tempRoot);
    const result = run(tempRoot, testCase.branch);
    const passed = result.status === 0;
    results.push({
      name: testCase.name,
      ok: passed === testCase.expectPass,
      passed,
      expectPass: testCase.expectPass,
      output: (result.stderr || result.stdout).trim(),
    });
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

const failed = results.filter((result) => !result.ok);
for (const result of results) {
  const label = result.ok ? "PASS" : "FAIL";
  const expected = result.expectPass ? "expected pass" : "expected fail";
  console.log(`${label}: ${result.name} (${expected}, actual ${result.passed ? "pass" : "fail"})`);
  if (!result.ok) {
    console.log(result.output);
  }
}

if (failed.length) {
  process.exit(1);
}
