#!/usr/bin/env node

import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const demoRoot = path.dirname(path.dirname(scriptPath));
const repoRoot = path.dirname(path.dirname(demoRoot));
const checker = path.join(repoRoot, "templates/scripts/check-initiative-package.mjs");

function mutate(root, relativePath, replacer) {
  const target = path.join(root, relativePath);
  const before = readFileSync(target, "utf8");
  writeFileSync(target, replacer(before));
}

function cloneDemo() {
  const tempRoot = mkdtempSync(path.join(tmpdir(), "initiative-package-demo-"));
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
    name: "initiative id mismatch fails",
    expectPass: false,
    mutate(root) {
      mutate(
        root,
        "docs/initiatives/active/012_import_folder/00-meta.md",
        (text) => text.replace("initiative_id: 012", "initiative_id: 013"),
      );
    },
  },
  {
    name: "status and folder mismatch fails",
    expectPass: false,
    mutate(root) {
      mutate(
        root,
        "docs/initiatives/active/012_import_folder/00-meta.md",
        (text) => text.replace("status: active", "status: planned"),
      );
    },
  },
  {
    name: "lifecycle state and folder mismatch fails",
    expectPass: false,
    mutate(root) {
      mutate(
        root,
        "docs/initiatives/active/012_import_folder/00-meta.md",
        (text) => text.replace("lifecycle_state: active", "lifecycle_state: ready"),
      );
    },
  },
  {
    name: "missing task verification fails",
    expectPass: false,
    mutate(root) {
      mutate(
        root,
        "docs/initiatives/active/012_import_folder/04-任务拆解.md",
        (text) => text.replace("verification:\n- npm test -- import", "verification:\n"),
      );
    },
  },
  {
    name: "missing technical plan section body fails",
    expectPass: false,
    mutate(root) {
      mutate(
        root,
        "docs/initiatives/active/012_import_folder/03-技术方案.md",
        (text) => {
          const lines = text.split(/\r?\n/);
          const start = lines.findIndex((line) => line === "## 技术目标");
          const end = lines.findIndex((line, index) => index > start && line.startsWith("## "));
          return [
            ...lines.slice(0, start + 1),
            "",
            ...lines.slice(end),
          ].join("\n");
        },
      );
    },
  },
  {
    name: "empty technical plan fails",
    expectPass: false,
    mutate(root) {
      mutate(
        root,
        "docs/initiatives/active/012_import_folder/03-技术方案.md",
        () => "",
      );
    },
  },
  {
    name: "invalid migration level fails",
    expectPass: false,
    mutate(root) {
      mutate(
        root,
        "docs/initiatives/active/012_import_folder/03-技术方案.md",
        (text) => text.replace("migration_level: compatible", "migration_level: risky"),
      );
    },
  },
  {
    name: "approved plan with open questions fails",
    expectPass: false,
    mutate(root) {
      mutate(
        root,
        "docs/initiatives/active/012_import_folder/03-技术方案.md",
        (text) => text
          .replace("plan_status: review", "plan_status: approved")
          .replace("- none\n\n## 需要新增或更新的 ADR", "- 是否需要后台重试队列。\n\n## 需要新增或更新的 ADR"),
      );
    },
  },
  {
    name: "breaking migration without ADR fails",
    expectPass: false,
    mutate(root) {
      mutate(
        root,
        "docs/initiatives/active/012_import_folder/03-技术方案.md",
        (text) => text
          .replace("migration_level: compatible", "migration_level: breaking")
          .replace("- `docs/adr/0001-import-snapshot.md`", "- none"),
      );
    },
  },
  {
    name: "missing task plan section trace fails",
    expectPass: false,
    mutate(root) {
      mutate(
        root,
        "docs/initiatives/active/012_import_folder/04-任务拆解.md",
        (text) => text.replace(
          /source_plan_sections:\n(?:- .+\n)+deliverable:/,
          "source_plan_sections:\ndeliverable:",
        ),
      );
    },
  },
  {
    name: "unknown task plan section trace fails",
    expectPass: false,
    mutate(root) {
      mutate(
        root,
        "docs/initiatives/active/012_import_folder/04-任务拆解.md",
        (text) => text.replace("- 数据结构", "- 不存在的技术章节"),
      );
    },
  },
  {
    name: "task branch id mismatch fails",
    expectPass: false,
    mutate(root) {
      mutate(
        root,
        "docs/initiatives/active/012_import_folder/04-任务拆解.md",
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
