# Product Stage Gates

Product Stage Gates 是一个面向 AI 辅助产品开发的受控工作流。它把从想法、需求、体验设计、技术方案、架构决策、工作流、TODO 切片到发布交接的过程固化成仓库内可检查、可恢复、可交接的阶段门禁。

这个项目的目标不是让团队少写文档，而是让 AI agent 和人类开发者在同一组耐久产物上工作，避免在需求、设计和架构还没有约束力时直接进入实现。

## Features

- **阶段门禁**：按 product-requirements、experience-design、technical-plan、architecture、implementation、release-handoff 推进。
- **仓库内状态源**：用 `docs/project-status.md`、`docs/stage-gates.md`、`TODO.md` 记录当前阶段和允许动作。
- **可执行检查**：提供 `check-stage-gate.mjs` 模板，用确定性脚本拦截越级源码改动。
- **工作流隔离**：用 `docs/workstreams/` 管理并行需求，每个需求声明允许路径、阻塞路径和验收方式。
- **AI 友好交接**：让下一次对话、下一位开发者或下一个 agent 只看仓库文件就能恢复上下文。

## Repository Layout

```text
.
├── SKILL.md                         # Codex skill 主说明
├── agents/openai.yaml               # OpenAI agent 元数据
├── templates/
│   ├── TODO.md                      # 项目 TODO 模板
│   ├── docs/project-status.md       # 当前阶段状态模板
│   ├── docs/stage-gates.md          # 阶段门禁定义模板
│   ├── docs/workstreams/            # 工作流模板
│   └── scripts/check-stage-gate.mjs # 阶段门禁检查脚本模板
├── CONTRIBUTING.md
├── CHANGELOG.md
├── SECURITY.md
└── LICENSE
```

## Installation

### Install as a Codex skill

Clone this repository, then copy it into your local Codex skills directory:

```bash
git clone https://github.com/Asuka0411/product-stage-gates.git
mkdir -p ~/.codex/skills/product-stage-gates
cp -R product-stage-gates/SKILL.md product-stage-gates/agents ~/.codex/skills/product-stage-gates/
```

Restart Codex or start a new session. You can then invoke it explicitly:

```text
Use $product-stage-gates 检查当前项目阶段，给出下一步 TODO 和门禁状态。
```

### Bootstrap a project with gate templates

Inside the target project:

```bash
mkdir -p docs/workstreams scripts
cp /path/to/product-stage-gates/templates/TODO.md TODO.md
cp /path/to/product-stage-gates/templates/docs/project-status.md docs/project-status.md
cp /path/to/product-stage-gates/templates/docs/stage-gates.md docs/stage-gates.md
cp -R /path/to/product-stage-gates/templates/docs/workstreams docs/
cp /path/to/product-stage-gates/templates/scripts/check-stage-gate.mjs scripts/check-stage-gate.mjs
node scripts/check-stage-gate.mjs
```

## Workflow

Product Stage Gates uses one durable artifact chain:

```text
product-requirements
 -> experience-design
 -> technical-plan
 -> architecture
 -> architecture-decisions
 -> workstreams
 -> todo-slices
 -> implementation
 -> verification
 -> release-handoff
```

At each step:

1. Read the current repository state.
2. Decide the current stage and allowed actions.
3. Perform one small action that belongs to that stage.
4. Verify with deterministic checks.
5. Record the result back into repository files.

## Stage Model

| Stage | Name | Main output | Gate mode |
| --- | --- | --- | --- |
| 1 | Product requirements | `docs/prd/README.md` | `source-locked` |
| 2 | Experience design | `docs/uiux/README.md` | `source-locked` |
| 3 | Prepare development | `docs/architecture.md`, `docs/technical-plan.md`, `TODO.md` | `source-locked` |
| 4 | Formal development | small verified implementation slices | `development` |
| 5 | Release handoff | accurate README, verification notes, deployment notes | `release` |

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

The hook checks staged paths against `docs/project-status.md`. In `source-locked` mode it allows planning artifacts and blocks new application source roots such as `src/`, `app/`, `apps/`, `packages/`, and runtime package manifests.

## When to Use

- Starting a new product with an AI coding agent.
- Restarting a project after scope drift.
- Auditing an existing repo before implementation.
- Splitting requirements into workstreams and TODO slices.
- Preventing agents from writing product code before requirements, design, and architecture are durable.

## Project Status

This repository is an initial open-source release of the Product Stage Gates workflow. The skill and templates are usable today, but the checker template is intentionally conservative and should be adapted to each repository's stack and source layout.

## Contributing

Issues and pull requests are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting changes.

## License

MIT License. See [LICENSE](LICENSE).
