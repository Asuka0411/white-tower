#!/usr/bin/env node

import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptPath);
const demoRoot = path.dirname(scriptDir);
const checker = path.join(scriptDir, "check-prd-governance.mjs");

function mutate(relativePath, replacer, root) {
  const target = path.join(root, relativePath);
  const before = readFileSync(target, "utf8");
  const after = replacer(before);
  writeFileSync(target, after);
}

function runChecker(root) {
  return spawnSync(process.execPath, [checker, root], {
    encoding: "utf8",
  });
}

function cloneDemo() {
  const tempRoot = mkdtempSync(path.join(tmpdir(), "prd-governance-demo-"));
  cpSync(demoRoot, tempRoot, {
    recursive: true,
    filter: (source) => !source.includes(`${path.sep}.git${path.sep}`),
  });
  return tempRoot;
}

const cases = [
  {
    name: "baseline passes",
    expectPass: true,
    mutate() {},
  },
  {
    name: "in-progress request without related workstream fails",
    expectPass: false,
    mutate(root) {
      mutate(
        "docs/prd/requests/2026/Q3/in-progress/import-folder.md",
        (text) => text.replace("related_workstream: import-folder", "related_workstream:"),
        root,
      );
    },
  },
  {
    name: "completed request without total PRD backfill fails",
    expectPass: false,
    mutate(root) {
      mutate(
        "docs/prd/requests/2026/Q2/completed/local-index-v1.md",
        (text) => text.replace("prd_backfilled: true", "prd_backfilled: false"),
        root,
      );
    },
  },
  {
    name: "archived request referenced by total PRD fails",
    expectPass: false,
    mutate(root) {
      mutate(
        "docs/prd/README.md",
        (text) => `${text}\n\n归档误引用：docs/prd/requests/2026/Q2/archived/cloud-sync-v1.md\n`,
        root,
      );
    },
  },
  {
    name: "planned request with workstream binding fails",
    expectPass: false,
    mutate(root) {
      mutate(
        "docs/prd/requests/2026/Q3/planned/duplicate-detection.md",
        (text) => text.replace("related_workstream:", "related_workstream: duplicate-detection"),
        root,
      );
    },
  },
  {
    name: "active workstream pointing to planned request fails",
    expectPass: false,
    mutate(root) {
      mutate(
        "docs/workstreams/active/import-folder.md",
        (text) =>
          text.replace(
            "prd_request: docs/prd/requests/2026/Q3/in-progress/import-folder.md",
            "prd_request: docs/prd/requests/2026/Q3/planned/duplicate-detection.md",
          ),
        root,
      );
    },
  },
  {
    name: "missing current focus target fails",
    expectPass: false,
    mutate(root) {
      mutate(
        "docs/white-tower/status.md",
        (text) => `${text}\n- docs/prd/requests/2026/Q4/in-progress/missing.md\n`,
        root,
      );
    },
  },
  {
    name: "request status and folder mismatch fails",
    expectPass: false,
    mutate(root) {
      mutate(
        "docs/prd/requests/2026/Q3/in-progress/import-folder.md",
        (text) => text.replace("status: in-progress", "status: planned"),
        root,
      );
    },
  },
  {
    name: "in-progress request without acceptance criteria fails",
    expectPass: false,
    mutate(root) {
      mutate(
        "docs/prd/requests/2026/Q3/in-progress/import-folder.md",
        (text) => text.replace("## 验收标准", "## 验收口径"),
        root,
      );
    },
  },
  {
    name: "in-progress request with inactive workstream fails",
    expectPass: false,
    mutate(root) {
      mutate(
        "docs/workstreams/active/import-folder.md",
        (text) => text.replace("status: active", "status: draft"),
        root,
      );
    },
  },
  {
    name: "workstream in wrong state directory fails",
    expectPass: false,
    mutate(root) {
      mkdirSync(path.join(root, "docs/workstreams/draft"), { recursive: true });
      renameSync(
        path.join(root, "docs/workstreams/active/import-folder.md"),
        path.join(root, "docs/workstreams/draft/import-folder.md"),
      );
    },
  },
  {
    name: "active workstream without allowed paths fails",
    expectPass: false,
    mutate(root) {
      mutate(
        "docs/workstreams/active/import-folder.md",
        (text) =>
          text.replace(
            "## Allowed Paths\n\n- src/import/**\n- src/index/**\n- tests/import/**\n- docs/prd/README.md\n- docs/prd/requests/2026/Q3/in-progress/import-folder.md\n- docs/workstreams/active/import-folder.md\n- TODO.md",
            "## Allowed Paths\n\n",
          ),
        root,
      );
    },
  },
  {
    name: "active workstream without verification commands fails",
    expectPass: false,
    mutate(root) {
      mutate(
        "docs/workstreams/active/import-folder.md",
        (text) =>
          text.replace(
            "## Verification\n\n- `npm test -- import`\n- `npm run lint`\n- `white-tower check --staged`",
            "## Verification\n\n",
          ),
        root,
      );
    },
  },
];

const results = [];

for (const testCase of cases) {
  const tempRoot = cloneDemo();
  try {
    testCase.mutate(tempRoot);
    const result = runChecker(tempRoot);
    const passed = result.status === 0;
    const ok = passed === testCase.expectPass;
    results.push({ ...testCase, ok, passed, stderr: result.stderr.trim(), stdout: result.stdout.trim() });
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

const failed = results.filter((result) => !result.ok);
for (const result of results) {
  const status = result.ok ? "PASS" : "FAIL";
  const expectation = result.expectPass ? "expected pass" : "expected fail";
  console.log(`${status}: ${result.name} (${expectation}, actual ${result.passed ? "pass" : "fail"})`);
  if (!result.ok) {
    console.log(result.stderr || result.stdout);
  }
}

if (failed.length) {
  process.exit(1);
}

execFileSync(process.execPath, [checker, demoRoot], { stdio: "inherit" });
