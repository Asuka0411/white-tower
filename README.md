# 白塔协议

白塔协议是一个面向 AI 辅助产品交付的治理工作流。它把从想法、需求、界面设计、技术方案、架构决策、任务拆解、多 agent 开发到发布交接的过程固化成仓库内可检查、可恢复、可交接的 SOP。

白塔不直接替你判断产品方向。它负责保存产品真相、约束使用白塔的 agent 自己，并在需求、设计和架构还没有约束力时提醒白塔不要越级实现。

## Features

- **阶段自检**：按产品需求、界面设计、技术方案、架构、实现、发布交接推进，约束白塔自己的动作。
- **仓库内状态源**：用 `docs/white-tower/status.md`、`docs/white-tower/stage-gates.md`、`TODO.md` 记录当前阶段和允许动作。
- **可执行自检**：提供 `check-stage-gate.mjs` 模板，用确定性脚本帮助白塔判断自己能否继续。
- **工作流隔离**：用 `docs/workstreams/` 管理并行需求，每个需求声明允许路径、阻塞路径和验收方式。
- **技术方案治理**：需求级技术方案声明状态、迁移等级、分层约束、影响范围、测试策略、回滚方案和 ADR 要求。
- **任务追溯**：任务切片必须引用技术方案章节，并声明交付物、验收切片、契约变更和评审重点。
- **Checkpoint-first 恢复**：执行中持续写入 run record、checkpoint、task 状态和 git 状态；最终报告不是恢复依据。
- **AI 友好交接**：让下一次对话、下一位开发者或下一个 agent 只看仓库文件就能恢复上下文。

## Repository Layout

```text
.
├── SKILL.md                         # Codex skill 主说明
├── agents/openai.yaml               # OpenAI agent 元数据
├── docs/vision.md                   # 产品交付 SOP 愿景
├── templates/
│   ├── TODO.md                      # 项目 TODO 模板
│   ├── docs/product/                # 总 PRD / UI / TECH 模板
│   ├── docs/white-tower/status.md   # 当前阶段状态模板
│   ├── docs/initiatives/template/   # 单 initiative 模板
│   ├── docs/white-tower/stage-gates.md # 阶段自检定义模板
│   ├── docs/workstreams/            # 工作流模板和状态目录
│   ├── prompts/task-dispatch.md      # 自动调度多 agent 执行提示词
│   ├── scripts/check-stage-gate.mjs # 白塔自检脚本模板
│   └── scripts/check-initiative-package.mjs # initiative 检查脚本模板
├── CONTRIBUTING.md
├── CHANGELOG.md
├── SECURITY.md
└── LICENSE
```

## Installation

### Install as a Codex skill

Clone this repository, then copy it into your local Codex skills directory:

```bash
git clone https://github.com/Asuka0411/white-tower.git ~/.codex/skills/white-tower
```

Restart Codex or start a new session. You can then invoke it explicitly:

```text
Use $white-tower 检查当前项目阶段，给出下一步 TODO 和白塔自检状态。
```

Update the installed skill:

```bash
bash ~/.codex/skills/white-tower/scripts/update-white-tower.sh codex
bash ~/.codex/skills/white-tower/scripts/update-white-tower.sh all
```

`all` updates every installed git clone and skips targets that have not been installed yet.

Install to other local agent tools:

```bash
bash scripts/install-white-tower.sh all
bash scripts/install-white-tower.sh claude
bash scripts/install-white-tower.sh hermes
bash scripts/install-white-tower.sh agents
bash scripts/install-white-tower.sh omp
```

See `docs/adapters.md` for target paths and environment overrides.

### Dispatch runnable tasks

Inside a project that already has White Tower status, workstreams, and initiative-package tasks:

```text
Use $white-tower dispatch max_parallel=2
```

The agent should read the project state, run available gates, find runnable tasks, choose the available executor, and start worker agents when the environment supports multi-agent execution. If no multi-agent tool is available, it falls back to sequential execution.

For OMP:

```bash
omp --cwd /path/to/project --skills=white-tower "Use $white-tower dispatch max_parallel=2"
```

### Review and advance initiatives

Do not manually open every initiative just to update checklist or plan status.
Ask White Tower to do the deterministic scan and update:

```text
Use $white-tower 审查并推进需求单
```

White Tower should scan `docs/initiatives/planned/`,
`docs/initiatives/active/`, `TODO.md`, and the available check scripts. It can
automatically fix mechanical issues, advance `plan_status=draft` to
`plan_status=review` when the technical plan is complete enough for review,
update indexes, and rewrite TODO items. It should ask the user only for product
scope, UX direction, high-impact architecture choices, destructive changes, or
new external services/dependencies.

### Bootstrap a project with gate templates

Inside the target project:

```bash
mkdir -p docs/product docs/white-tower docs/workstreams/{draft,ready,active,blocked,done,archived} scripts
cp /path/to/white-tower/templates/TODO.md TODO.md
cp /path/to/white-tower/templates/docs/product/PRD.md docs/product/PRD.md
cp /path/to/white-tower/templates/docs/product/UI.md docs/product/UI.md
cp /path/to/white-tower/templates/docs/product/TECH.md docs/product/TECH.md
cp /path/to/white-tower/templates/docs/white-tower/status.md docs/white-tower/status.md
cp /path/to/white-tower/templates/docs/white-tower/stage-gates.md docs/white-tower/stage-gates.md
cp -R /path/to/white-tower/templates/docs/workstreams docs/
cp /path/to/white-tower/templates/scripts/check-stage-gate.mjs scripts/check-stage-gate.mjs
cp /path/to/white-tower/templates/scripts/migrate-white-tower.mjs scripts/migrate-white-tower.mjs
node scripts/check-stage-gate.mjs
```

### Migrate legacy project data

For older White Tower projects, run a dry-run first:

```bash
node scripts/migrate-white-tower.mjs
```

Apply safe migrations:

```bash
node scripts/migrate-white-tower.mjs --write
```

The migration script creates workstream state directories, moves flat workstream
files into the directory matching their `status`, updates Markdown path
references, and warns when a legacy PRD/workstream layout has not been converted
into initiative packages yet.

Generate compatibility initiative packages when an older project should move to
the current initiative-package layout:

```bash
node scripts/migrate-white-tower.mjs --create-initiatives
node scripts/migrate-white-tower.mjs --create-initiatives --write
```

The legacy `--create-requirements` flag is still accepted as an alias.

Initiative packages use a small set of external folders. Detailed lifecycle
states such as `preparing`, `ready`, `review`, `paused`, and `blocked` live in
`00-meta.md` as `lifecycle_state`:

```text
docs/initiatives/planned/
docs/initiatives/active/
docs/initiatives/done/
docs/initiatives/archived/
```

If an older migration created perioded packages such as
`docs/initiatives/2026/Q3/in-progress/002_app_shell_theme/`, the script moves
them into the flat status layout and updates Markdown references.

This mode creates packages such as:

```text
docs/initiatives/active/001_library_bootstrap/
docs/initiatives/planned/002_app_shell_theme/
docs/initiatives/done/000_uiux_interaction_motion/
```

Generated packages keep `human_review_required: true` and reference legacy PRD,
UI, technical-plan, and workstream files. They are compatibility skeletons, not a
claim that the old documents have been fully rewritten into precise initiative
packages.

## Workflow

白塔使用一条耐久产物链：

```text
产品需求
 -> 界面设计
 -> 技术方案
 -> 架构
 -> 架构决策
 -> 工作流
 -> TODO 切片
 -> 实现
 -> 验证
 -> 发布交接
```

At each step:

1. Read the current repository state.
2. Decide the current stage and allowed actions.
3. Perform one small action that belongs to that stage.
4. Verify with deterministic checks.
5. Write checkpoints before and after atomic actions.
6. Record the result back into repository files.

White Tower uses checkpoint-first recovery. A final assistant summary is only a
user-facing report. Recovery must use durable repo state:

```text
07_runs/latest.md
08_checkpoints/<timestamp>.md
04-任务拆解.md
00-meta.md or equivalent status metadata
git status / branch / commit state
```

On token limits, IDE crashes, power loss, worker failure, or stale locks, the
next run must first reconstruct state from the latest checkpoint and git diff,
then either continue, verify current WIP, mark blocked, or ask for human input.

## Initiative Package Model

For ongoing product work, one initiative should keep its PRD, interface design, technical plan, task breakdown, acceptance record, and release handoff together:

```text
docs/initiatives/active/012_import_folder/
├── 00-meta.md
├── 01-需求文档.md
├── 02-界面设计.md
├── 02-assets/
├── 03-技术方案.md
├── 04-任务拆解.md
├── 05-验收记录.md
└── 06-发布交接.md
```

Recommended initiative folder naming:

- Use human-readable Chinese folder names: `docs/initiatives/planned/001_管理目录初始化与空图库壳`.
- Keep Git branches as ASCII slugs: `feat_001_foundation_library_shell`.
- Update `docs/initiatives/README.md`, `TODO.md`, and cross-document links to point at the real Chinese folder path.

Interface design files should be directly reviewable:

- `02-界面设计.md` should include clickable source references.
- It should embed preview images with Markdown image syntax, not only list paths.
- If the source is HTML, Figma, or another prototype, export or capture a stable PNG/JPG/WebP into the repo and embed it.

`00-meta.md` keeps `status` aligned with the folder and records finer workflow
state separately:

```yaml
status: active
lifecycle_state: review
```

Global product facts stay separate and must be updated when an initiative is completed:

```text
docs/product/PRD.md
docs/product/UI.md
docs/product/TECH.md
docs/adr/
```

Gitflow branch names use lowercase underscores:

```text
feat_012_import_folder
fix_012_scan_error
release_2026q3_001
hotfix_018_login_crash
```

The initiative package checker validates package structure, technical plan readiness, task traceability, and branch naming:

```bash
node templates/scripts/check-initiative-package.mjs examples/initiative-package-demo --branch=feat_012_import_folder
node examples/initiative-package-demo/scripts/run-edge-cases.mjs
```

It checks that each `03-技术方案.md` declares `plan_status` and `migration_level`, fills required technical sections, records layer-boundary constraints such as UI/data separation, resolves open questions before approval, and links breaking migrations to ADRs. It also checks that each task in `04-任务拆解.md` references technical plan sections and declares deliverable, acceptance slice, contract changes, review focus, allowed paths, and verification commands.

Workstreams use state directories:

```text
docs/workstreams/draft/
docs/workstreams/ready/
docs/workstreams/active/
docs/workstreams/blocked/
docs/workstreams/done/
docs/workstreams/archived/
```

Completed workstreams move to `done/`. Abandoned workstreams move to `archived/` with an archive reason. Do not keep completed or archived workstreams at the top level.

## Stage Model

| Stage | Name | Main output | White Tower mode |
| --- | --- | --- | --- |
| 1 | 产品需求 | `docs/prd/README.md` | `source-locked` |
| 2 | 界面设计 | `docs/uiux/README.md` | `source-locked` |
| 3 | 准备开发 | `docs/product/TECH.md`, initiative technical plans, `TODO.md` | `source-locked` |
| 4 | 正式开发 | small verified implementation slices | `development` |
| 5 | 发布交接 | accurate README, verification notes, deployment notes | `release` |

Before stage 4, White Tower should not create application source roots or runtime dependencies unless they are explicitly part of its own setup work. Other people or tools are not constrained unless they opt in.

## Self-check Example

White Tower uses check scripts for its own decisions. Do not install them as
`pre-commit`, `pre-push`, CI, or branch protection by default. Other agents,
tools, and people may ignore White Tower unless they explicitly opt in.

Run the checker manually when using White Tower:

```bash
node scripts/check-stage-gate.mjs
node scripts/check-stage-gate.mjs --staged
```

Only wire these scripts into hooks or CI when the project owner explicitly asks
for hard enforcement.

## When to Use

- Starting a new product with an AI coding agent.
- Restarting a project after scope drift.
- Auditing an existing repo before implementation.
- Splitting requirements into workstreams and TODO slices.
- Keeping White Tower from writing product code before requirements, design, and architecture are durable.

## Project Status

This repository is an initial open-source release of the 白塔协议 workflow. The skill and templates are usable today, but the checker templates are intentionally conservative and should be adapted to each repository's stack and source layout.

## Contributing

Issues and pull requests are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting changes.

## License

MIT License. See [LICENSE](LICENSE).
