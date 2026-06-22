# 白塔协议

白塔协议是一个面向 AI 辅助产品交付的治理工作流。它把从想法、需求、界面设计、技术方案、架构决策、任务拆解、多 agent 开发到发布交接的过程固化成仓库内可检查、可恢复、可交接的 SOP。

白塔不直接替你判断产品方向。它负责保存产品真相、约束交付路径，并在需求、设计和架构还没有约束力时阻止越级实现。

## Features

- **阶段门禁**：按产品需求、界面设计、技术方案、架构、实现、发布交接推进。
- **仓库内状态源**：用 `docs/white-tower/status.md`、`docs/white-tower/stage-gates.md`、`TODO.md` 记录当前阶段和允许动作。
- **可执行检查**：提供 `check-stage-gate.mjs` 模板，用确定性脚本拦截越级源码改动。
- **工作流隔离**：用 `docs/workstreams/` 管理并行需求，每个需求声明允许路径、阻塞路径和验收方式。
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
│   ├── docs/requirements/template/  # 单需求包模板
│   ├── docs/white-tower/stage-gates.md # 阶段门禁定义模板
│   ├── docs/workstreams/            # 工作流模板
│   ├── scripts/check-stage-gate.mjs # 阶段门禁检查脚本模板
│   └── scripts/check-requirement-package.mjs # 需求包检查脚本模板
├── CONTRIBUTING.md
├── CHANGELOG.md
├── SECURITY.md
└── LICENSE
```

## Installation

### Install as a Codex skill

Clone this repository, then copy it into your local Codex skills directory:

```bash
git clone https://github.com/Asuka0411/white-tower.git
mkdir -p ~/.codex/skills/white-tower
cp -R white-tower/SKILL.md white-tower/agents ~/.codex/skills/white-tower/
```

Restart Codex or start a new session. You can then invoke it explicitly:

```text
Use $white-tower 检查当前项目阶段，给出下一步 TODO 和门禁状态。
```

### Bootstrap a project with gate templates

Inside the target project:

```bash
mkdir -p docs/white-tower docs/workstreams scripts
cp /path/to/white-tower/templates/TODO.md TODO.md
cp /path/to/white-tower/templates/docs/white-tower/status.md docs/white-tower/status.md
cp /path/to/white-tower/templates/docs/white-tower/stage-gates.md docs/white-tower/stage-gates.md
cp -R /path/to/white-tower/templates/docs/workstreams docs/
cp /path/to/white-tower/templates/scripts/check-stage-gate.mjs scripts/check-stage-gate.mjs
node scripts/check-stage-gate.mjs
```

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
5. Record the result back into repository files.

## Requirement Package Model

For ongoing product work, one requirement should keep its PRD, interface design, technical plan, task breakdown, acceptance record, and release handoff together:

```text
docs/requirements/2026/Q3/in-progress/012_import_folder/
├── 00-meta.md
├── 01-需求文档.md
├── 02-界面设计.md
├── 02-assets/
├── 03-技术方案.md
├── 04-任务拆解.md
├── 05-验收记录.md
└── 06-发布交接.md
```

Global product facts stay separate and must be updated when a requirement is completed:

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

The requirement package checker validates package structure, task fields, and branch naming:

```bash
node templates/scripts/check-requirement-package.mjs examples/requirement-package-demo --branch=feat_012_import_folder
```

## Stage Model

| Stage | Name | Main output | Gate mode |
| --- | --- | --- | --- |
| 1 | 产品需求 | `docs/prd/README.md` | `source-locked` |
| 2 | 界面设计 | `docs/uiux/README.md` | `source-locked` |
| 3 | 准备开发 | `docs/architecture.md`, `docs/technical-plan.md`, `TODO.md` | `source-locked` |
| 4 | 正式开发 | small verified implementation slices | `development` |
| 5 | 发布交接 | accurate README, verification notes, deployment notes | `release` |

Before stage 4, application source roots and runtime dependencies should be blocked unless they are explicitly part of gate tooling.

## Git Hook Example

Use the template checker in a pre-commit hook:

```bash
cat > .git/hooks/pre-commit <<'EOF'
#!/usr/bin/env sh
node scripts/check-stage-gate.mjs --staged
EOF
chmod +x .git/hooks/pre-commit
```

The hook checks staged paths against `docs/white-tower/status.md`. In `source-locked` mode it allows planning artifacts and blocks new application source roots such as `src/`, `app/`, `apps/`, `packages/`, and runtime package manifests.

## When to Use

- Starting a new product with an AI coding agent.
- Restarting a project after scope drift.
- Auditing an existing repo before implementation.
- Splitting requirements into workstreams and TODO slices.
- Preventing agents from writing product code before requirements, design, and architecture are durable.

## Project Status

This repository is an initial open-source release of the 白塔协议 workflow. The skill and templates are usable today, but the checker templates are intentionally conservative and should be adapted to each repository's stack and source layout.

## Contributing

Issues and pull requests are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting changes.

## License

MIT License. See [LICENSE](LICENSE).
