---
name: white-tower
version: 0.12.0-dev
codename: white-tower
updated_at: 2026-06-23
description: 白塔协议 for governed AI assisted product delivery with requirement discussion, PRD governance, interface design, technical plans, initiative packages, task DAGs, Gitflow multi-agent execution, self-governed phase checks, checkpoint-first recovery, and release handoff. Use when the user wants to start, adopt, plan, restart, audit, or continue a product from requirements to UI, technical plan, task slicing, implementation, verification, and release/deployment; when deciding current progress and next actions before coding; or when adding White Tower self-checks with project-status, initiative packages, Gitflow branch checks, or check scripts.
---

# 白塔协议

白塔是一套 AI 产品交付治理协议：把需求讨论、PRD、界面设计、技术方案、任务拆解、多 agent 开发、验证和发布约束成高可用、有序、可恢复的 SOP，避免一上来就写代码。每个阶段都必须产出能约束下一阶段的文件，完成验证后再前进。如果后续阶段暴露前序问题，回到对应上游文档修正，而不是在当前阶段硬补。

## 快速使用

用户可以显式触发：

```text
Use $white-tower 检查当前项目阶段，给出下一步 TODO 和白塔自检状态。
```

确认当前会话是否读到新版白塔时使用：

```text
Use $white-tower 自检：输出 name、version、codename、updated_at，以及分支命名规则。
```

自检期望看到：

```text
name: white-tower
version: 0.12.0-dev
codename: white-tower
updated_at: 2026-06-23
branch pattern: <type>_<id>_<short_name>
```

更新本机白塔 skill 安装时使用：

```text
Use $white-tower 更新白塔
```

执行要求：

```bash
bash ~/.codex/skills/white-tower/scripts/update-white-tower.sh codex
```

如果安装目录不是 git clone，或者有本地未提交改动，停止更新并说明原因。更新完成后提示用户新开 Codex 会话。

自动调度多 agent 编码时使用：

```text
Use $white-tower dispatch max_parallel=2
```

这条指令必须自动完成环境判断、任务选择和执行器选择。如果白塔自检通过且存在 runnable tasks，不要只输出方案，要开始派发任务。

常见请求和处理方式：

- “当前进度到哪了”：审计 `README`、`docs/`、`TODO.md`、`docs/white-tower/status.md`、`git status`，按“当前阶段 / 已完成 / 待办 / 白塔自检 / 风险”输出。
- “更新白塔 / 更新 white-tower / 更新这个 skill”：默认运行 `bash ~/.codex/skills/white-tower/scripts/update-white-tower.sh codex`，输出更新结果和版本信息。
- “更新所有白塔 / 更新全部工具里的白塔”：运行 `bash ~/.codex/skills/white-tower/scripts/update-white-tower.sh all`，逐个更新 Codex、Claude Code、Hermes、agents 和 OMP 中已经安装为 git clone 的目标；未安装目标跳过，脏目录或拉取失败必须报错。
- “迁移旧白塔数据 / migrate legacy / 兼容旧数据”：先运行 `node scripts/migrate-white-tower.mjs` 或模板脚本的 dry-run；确认只包含安全迁移后运行 `node scripts/migrate-white-tower.mjs --write`。如果需要从旧 workstream 生成交付事项包，使用 `--create-initiatives`；新版目录固定为 `docs/initiatives/<planned|active|done|archived>/<id>`，不再按年份或季度分层。
- “继续”：先读阶段状态和 TODO，只执行当前阶段允许的下一步。
- “开始开发 / 初始化项目 / 写功能”：先运行白塔自检；如果仍处于 `source-locked`，白塔自己不要创建源码目录或工程文件。
- “dispatch / 自动调度 / 开始多 agent 编码 / 按 workstreams 自动执行”：执行自动调度流程，读取当前阶段、workstreams 和 initiative 任务，选择 Codex 多 agent、OMP task 或顺序 fallback，并开始执行 runnable tasks。
- “提交代码”：白塔自己先运行可用自检、仓库既有检查和 `git diff --check`；不要默认要求项目安装 pre-commit、pre-push 或 CI 阻止其他人。
- “升级到下一阶段”：确认阶段退出条件满足，再更新 `docs/white-tower/status.md`、`TODO.md` 和必要 architecture-decision。

项目第一次接入时，先创建 `docs/white-tower/stage-gates.md`、`docs/white-tower/status.md`、`TODO.md`，可选创建 `scripts/check-stage-gate.mjs` 作为白塔自检脚本。之后白塔自己的后续动作都按 `docs/white-tower/status.md` 的 `current_stage` 和 `gate_mode` 自我约束；没有显式使用白塔的 agent、工具或人不受白塔限制。

## 受控 Vibe Coding 协议

目标不是压制探索，而是把探索变成可恢复、可验证、可交接的工程流程。无论是新项目还是已有项目，都按同一条产物链推进：

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

### 新项目 Bootstrap

当用户在一个新仓库里说“开始”“规划一下”“直接做”“vibe coding”时：

1. 先检查是否已有 `README`、`docs/`、`TODO.md`、源码目录、git 状态。
2. 如果没有白塔状态文件，先创建最小自检文件：
   - `docs/white-tower/status.md`
   - `docs/white-tower/stage-gates.md`
   - `TODO.md`
   - `docs/workstreams/README.md`
   - `docs/workstreams/template.md`
   - `docs/workstreams/{draft,ready,active,blocked,done,archived}/.gitkeep`
   - 可选：`scripts/check-stage-gate.*`，仅作为白塔自检脚本；脚本语言按仓库现有技术栈选择，无法判断时用 Node 或 shell。
3. 把 `current_stage` 设为当前真实阶段，使用“编号-中文阶段名”的格式，例如 `3-准备开发`，不要默认进入开发。
4. 如果没有产品需求，停在阶段 1；如果没有界面设计，停在阶段 2；如果没有技术方案 / 架构和 TODO，停在阶段 3。
5. 只有阶段 4 且 `gate_mode=development` 后，白塔自己才允许初始化应用工程或写功能代码；未使用白塔的其他人或工具不受这个协议限制。

### 旧数据兼容与迁移

升级后的 skill 遇到旧项目时，先做兼容审计，不要直接假设项目已经是新版结构：

```bash
node scripts/migrate-white-tower.mjs
```

如果项目还没有该脚本，但当前 skill 有模板，先复制：

```bash
cp /path/to/white-tower/templates/scripts/migrate-white-tower.mjs scripts/migrate-white-tower.mjs
node scripts/migrate-white-tower.mjs
```

如果用户明确要求从旧 workstream 生成兼容交付事项包，先 dry-run：

```bash
node scripts/migrate-white-tower.mjs --create-initiatives
```

旧参数 `--create-requirements` 仍作为兼容别名接受，但新版文档和输出统一使用 `initiatives`。

确认输出只包含安全迁移后再应用：

```bash
node scripts/migrate-white-tower.mjs --create-initiatives --write
```

新版 initiative 只使用四个外部状态目录：

```text
docs/initiatives/planned/
docs/initiatives/active/
docs/initiatives/done/
docs/initiatives/archived/
```

`00-meta.md` 中的 `status` 必须和外部目录一致。更细的识别状态写入 `lifecycle_state`，允许值为 `planned`、`preparing`、`ready`、`active`、`review`、`paused`、`blocked`、`done`、`archived`。例如 `review`、`paused`、`blocked` 都仍放在 `active/` 目录下。

如果旧迁移已经生成了季度目录，例如 `docs/initiatives/2026/Q3/in-progress/002_app_shell_theme/`，新版脚本必须把它们迁到扁平目录，例如 `docs/initiatives/active/002_app_shell_theme/`，并更新 Markdown 引用。

该模式会从旧 workstream 生成兼容交付事项包，例如：

```text
docs/initiatives/active/001_library_bootstrap/
docs/initiatives/planned/002_app_shell_theme/
docs/initiatives/done/000_uiux_interaction_motion/
```

生成的交付事项包必须标记 `human_review_required: true`，并把旧 PRD、UI、技术方案和 workstream 当作来源引用。不要声称它们已经完成精细重写；只能说这是兼容迁移后的 initiative 骨架。

自动迁移只处理确定安全的结构变更：

- 创建 `docs/workstreams/{draft,ready,active,blocked,done,archived}/` 状态目录。
- 将顶层 flat workstream 按 `status` 移到对应目录。
- 将旧状态别名映射为新版目录：`planned -> draft`、`in-progress -> active`、`completed -> done`。
- 自动更新 Markdown 中的旧 workstream 路径引用。
- 显式传入 `--create-initiatives` 时，从旧 workstream 生成 `docs/initiatives/<planned|active|done|archived>/<id_slug>/` 兼容交付事项包；旧的年份、季度和细状态目录会被折叠到新版扁平目录，细状态写入 `lifecycle_state`。

不能安全自动生成的信息只进入兼容模式或输出 warning：

- 缺少 `status` 的 workstream。
- 目标路径已存在的 workstream。
- 只有 `docs/prd/` + `docs/workstreams/`，但没有显式传入 `--create-initiatives` 的旧项目。
- 无法从旧 PRD 自动推断最终准确的 `00-meta.md` 到 `06-发布交接.md` 内容；生成的 initiative 只能作为待人工确认的兼容骨架。

兼容模式下，允许继续读取旧 `docs/prd/`、`docs/uiux/`、`docs/technical-plan.md`、`docs/workstreams/**` 作为上游依据；但报告时必须明确“这是旧结构兼容读取”，不能声称需求已经完成 initiative 迁移。

### 自动推进循环

每次执行任务都按这个循环：

1. **Read**：读取 `docs/white-tower/status.md`、`docs/white-tower/stage-gates.md`、`TODO.md`、相关产品需求 / 界面设计 / 架构决策 / workstream 和 `git status`。
2. **Decide**：判断当前阶段、允许动作、禁止动作、下一步最小切片。
3. **Act**：只执行一个阶段内的最小可验证动作。
4. **Verify**：运行白塔自检脚本、仓库既有检查和与改动相关的最小验证。
5. **Checkpoint**：在每个原子动作前后写入可恢复 checkpoint，而不是等本轮结束才记录。
6. **Record**：更新 TODO、workstream、项目状态、architecture-decision、run record 和 task 状态，使下一次会话能从仓库文件恢复。
7. **Report**：只总结已经写入仓库的状态；最终报告不能作为恢复依据。

如果循环中发现阶段不满足，白塔停止自己的越级任务，改为补齐必要产物。

### Checkpoint-first 恢复模型

白塔只使用 checkpoint-first 恢复模型。任何执行中断都必须能从最近 checkpoint、run record、task 状态和 git 状态恢复；不能依赖聊天上下文或最终总结。

必须持续写入：

```text
<initiative-or-requirement>/
├── 07_runs/
│   ├── latest.md
│   └── <run-id>.md
└── 08_checkpoints/
    ├── <timestamp>-before-edit.md
    ├── <timestamp>-after-edit.md
    ├── <timestamp>-before-verify.md
    └── <timestamp>-after-verify.md
```

每次执行前后至少记录：

- 当前 initiative / requirement ID。
- 当前 phase 和 task。
- 当前 branch、head commit、worker branch。
- dirty files。
- 最近一次动作。
- 下一步动作。
- verification 是否在最新 diff 后运行。
- blocker、risk、manual question。

`00-meta.md` 或等价状态文件必须能记录执行锁：

```yaml
execution_lock:
  status: locked
  run_id: <run-id>
  owner: <agent-or-worker>
  branch: <current-branch>
  heartbeat_at: <timestamp>
  ttl_minutes: 30
```

每次 checkpoint 都更新 `heartbeat_at`。如果下一次运行发现锁过期，必须先执行 stale-lock recovery：

1. 标记上一轮 run 为 `interrupted`。
2. 读取 `07_runs/latest.md` 和最新 checkpoint。
3. 运行 `git status`。
4. 对比 checkpoint 中的 dirty files 和当前 diff。
5. 判断应继续、先验证、先回滚局部 WIP，还是请求人工确认。
6. 创建新 run，写入 `resumed_from`，再继续。

不要在非对话式中断后重新从 `planned` 派发同一任务。只允许恢复这些状态：

- `status=active` 且 heartbeat 过期。
- `status=paused`。
- `status=blocked` 且 blocker 已解除。
- `status=planned` 且没有任何 active/run/checkpoint 记录。

最终报告只是用户可读摘要；如果报告内容没有落入 `07_runs/`、`08_checkpoints/`、`04-任务拆解.md` 或状态文件，就不算可恢复事实。

### 自动推进边界

可以自主推进：

- 创建和更新阶段文档。
- 拆 TODO。
- 创建 workstream。
- 补 architecture-decision 草稿。
- 运行白塔自检和仓库既有检查。
- 在阶段 4 后按 active workstream 实现小切片。

必须停下来说明或询问：

- 产品方向冲突。
- 页面范围、平台范围或数据模型冲突。
- 需要删除、重写或回滚用户已有改动。
- 白塔自检要求与用户明确指令冲突。
- 需要引入重大依赖、服务端、账号、云同步、公网访问或付费服务。

### 自动调度：`dispatch`

当用户说 `Use $white-tower dispatch`、`自动调度`、`开始多 agent 编码` 或等价表达时，按以下流程直接执行：

1. **读取环境**：
   - `git status --short`
   - `docs/white-tower/status.md`
   - `docs/white-tower/stage-gates.md`
   - `TODO.md`
   - `docs/workstreams/**`
   - `docs/initiatives/**/00-meta.md`
   - `docs/initiatives/**/03-技术方案.md`
   - `docs/initiatives/**/04-任务拆解.md`
2. **白塔自检**：
   - 如果存在 `scripts/check-stage-gate.mjs`，白塔先运行它作为自检。
   - 如果存在 `scripts/check-initiative-package.mjs`，先运行。
   - 只有 `gate_mode=development` 或项目状态明确允许源码实现时，白塔才执行编码任务。
3. **选择 runnable tasks**：
   - `status=planned`。
   - `depends_on` 全部完成或为 `none`。
   - `source_plan_sections` 能在 `03-技术方案.md` 中找到。
   - `allowed_paths`、`blocked_paths`、`verification`、`merge_target` 均已声明。
   - `can_parallel=true` 且 `allowed_paths` 不与其他并发任务冲突时才可并发。
   - `conflict_risk=high`、`contract_changes != none` 或涉及 shared schema / router / migration 的任务顺序执行。
4. **选择执行器**：
   - 如果当前环境有 Codex 多 agent 工具，优先使用 worker subagents；每个 worker 只负责一个任务和明确的 `allowed_paths`。
   - 如果当前环境是 OMP，或可用 OMP `task` 子代理工具，使用 OMP task agents。
   - 如果没有可用子代理工具，降级为当前 agent 顺序执行 runnable tasks。
5. **执行要求**：
   - 默认 `max_parallel=2`，除非用户显式传入其他值。
   - 每个 worker 必须拿到完整任务上下文，而不是自己重新猜计划。
   - worker 不得修改 `blocked_paths`，不得回滚其他 worker 的改动。
   - worker 完成后必须运行该任务的 `verification`。
   - 每个任务完成后先做 spec review，再做 quality review。
   - 最后由主控整合结果，更新 `04-任务拆解.md`、`05-验收记录.md` 和必要全局文档。

派发 worker 时使用这种上下文结构：

```text
You are implementing one White Tower task. You are not alone in this repo.
Do not revert or overwrite changes made by other workers.

Initiative package: <path>
Task id: <TASK-ID>
Branch: <branch>
Depends on: <depends_on>
Allowed paths: <allowed_paths>
Blocked paths: <blocked_paths>
Source technical sections: <source_plan_sections>
Deliverable: <deliverable>
Acceptance slice: <acceptance_slice>
Contract changes: <contract_changes>
Verification: <verification>

Read these files first:
- <00-meta.md>
- <01-需求文档.md>
- <03-技术方案.md>
- <04-任务拆解.md>

Implement only this task, run verification, then report changed files and result.
```

## 核心规则

从项目里的耐久文件开始，不从感觉或聊天记忆开始：

1. 检查当前仓库状态：`README`、`docs/`、产品需求、界面设计、架构、`TODO`/backlog、`git status`、已有源码。
2. 判断当前阶段和已完成产物。
3. 创建或更新阶段 TODO。
4. 执行当前阶段最小且合理的下一步。
5. 运行对应验证。
6. 把结果写回耐久文件，再进入下一阶段。

在产品需求、界面设计、技术方案 / 架构足够稳定之前，不开始功能实现。

## 自约束模型

白塔只约束显式使用白塔的 agent 自己。它不默认限制其他人、其他工具、其他 agent 或不走白塔的执行方式。

规则：

1. 白塔读取仓库内状态文件，判断自己当前能做什么。
2. 白塔可以使用脚本做自检，但这些脚本默认不安装到 `pre-commit`、`pre-push`、CI 或分支保护。
3. 如果用户明确要求强制治理，才把自检脚本接入 hook、CI 或 PR 流程。
4. 如果未使用白塔的开发者直接改代码，白塔不把这视为违规；下次运行时只需要重新审计当前真实仓库状态。
5. 如果白塔自检失败，白塔自己停止越级动作，改为补齐缺失信息或报告阻塞。

### 推荐仓库文件

优先在项目内创建这些文件，而不是只保存在聊天里：

- `docs/white-tower/stage-gates.md`：白塔自己的阶段定义、进入条件、退出条件、允许动作、禁止动作。
- `docs/white-tower/status.md`：当前阶段、自检强度、已通过自检、允许动作、禁止动作、下一阶段条件。
- `TODO.md`：当前阶段和下一阶段的可执行 backlog。
- `docs/workstreams/`：并行需求的需求级边界，必须按状态目录管理。
- 可选：`scripts/check-stage-gate.mjs` 或同类脚本，供白塔读取阶段状态并检查自己的当前 diff。

`docs/white-tower/status.md` 可以使用这种结构：

```markdown
# Project Status

current_stage: 3-准备开发

gate_mode: source-locked

allowed_actions:
- update-docs
- create-architecture
- create-todo
- create-adr

blocked_actions:
- initialize-app-code
- implement-feature
- add-runtime-dependency

gate_to_next_stage:
- docs/architecture.md exists
- docs/technical-plan.md exists
- TODO.md exists and has ordered implementation slices
- at least one accepted architecture-decision records initial architecture
```

`gate_mode` 建议使用：

- `bootstrap`：白塔状态系统第一次加入仓库。
- `source-locked`：白塔只做文档、架构、TODO、架构决策、自检脚本和界面设计准备工作，不主动写正式源码。
- `development`：允许源码实现，但必须具备架构、TODO、架构决策和质量命令。
- `release`：发布前收敛，强调文档反扫、构建、部署和回滚。

### 自检脚本职责

`check-stage-gate` 脚本是白塔自检工具，应该做确定性检查，不要依赖 LLM 判断。默认不要把它装进 `pre-commit`、`pre-push` 或 CI；除非用户明确要求强制治理。

- 读取 `docs/white-tower/status.md` 或等价状态源。
- 支持 Bootstrap：如果项目还没有 `docs/white-tower/status.md`，白塔只新增自身初始化文件；不要要求一个尚不存在的状态系统先通过自检。
- 检查当前阶段和 `gate_mode` 对应的必需文件是否存在。
- 检查 changed files 时使用未转义路径，例如 `git -c core.quotePath=false diff --name-only`、`git -c core.quotePath=false diff --name-only --cached` 和 `git -c core.quotePath=false ls-files --others --exclude-standard`，避免中文路径或非 ASCII 路径被 Git quote 后误判白塔自检。
- 检查 `git diff --name-only --cached`、`git diff --name-only` 和 untracked files。
- 支持 `--staged`，用于白塔提交前自检暂存区；不要默认安装为 hook。
- 如果白塔在阶段还没有进入正式开发时准备新增源码目录、应用工程、业务代码、运行时依赖，自检失败。
- 如果白塔试图进入正式开发或当前状态已标记为阶段 4 以后，但 technical-plan、`TODO.md` 或 architecture-decision 缺失，自检失败。
- 输出清楚的阻塞原因和下一步应补的文档。

示例伪逻辑：

```text
if current_stage < 4-正式开发:
  block new app source roots, package manifests, Xcode projects, runtime dependencies, feature code

if current_stage == 3-准备开发:
  require TODO.md
  allow docs/architecture.md, docs/technical-plan.md, TODO, architecture-decisions, gate docs, check scripts
  block source roots and runtime dependencies

if current_stage >= 4-正式开发:
  require docs/architecture.md or docs/technical-plan.md
  require docs/adr/*.md beyond README for initial architecture/tech-stack decision

always:
  allow docs, 产品需求, 界面设计, 架构决策, TODO, gate scripts, and check configuration updates
```

### Agent 执行要求

当用户要求“继续”“开始开发”“提交代码”“初始化项目”“写功能”时，先执行：

```bash
git status --short
test -f docs/white-tower/status.md && sed -n '1,220p' docs/white-tower/status.md || true
test -f docs/white-tower/stage-gates.md && sed -n '1,220p' docs/white-tower/stage-gates.md || true
test -f TODO.md && sed -n '1,220p' TODO.md || true
```

如果存在检查脚本，优先运行：

```bash
node scripts/check-stage-gate.mjs
```

白塔提交前可运行：

```bash
node scripts/check-stage-gate.mjs --staged
```

检查失败时，白塔不要继续自己的越级任务；改为补齐自检要求，并向用户说明阻塞原因和可执行下一步。

### 文档拆分与 TODO 链接

拆需求、技术文档和 TODO 时，按固定关系维护：

```text
产品需求模块
 -> 技术方案 / 架构
 -> 架构决策 when tradeoffs matter
 -> workstream
 -> todo-slice
 -> code paths
```

规则：

- 产品需求回答“做什么、为什么、验收什么”。
- 技术方案回答“怎么做、放哪里、边界是什么、数据怎么流”。
- architecture-decision 记录“为什么选择这个方案而不是其他方案”。
- workstream 回答“这个需求当前状态、能改哪些路径、依赖什么、怎么验收”。
- todo-slice 回答“下一步具体改什么、怎么验证、是否能独立提交”。

如果 TODO 找不到对应 workstream，先补 workstream。如果 workstream 找不到产品需求 / 技术方案依据，先补上游文档。

技术方案必须先能约束实现，再进入任务派发：

- `03-技术方案.md` 声明 `plan_status` 和 `migration_level`。
- 必填章节包括技术目标、当前代码风格、架构偏好与分层约束、影响范围、数据结构、API / 函数边界、状态流、错误处理、测试策略、兼容性和迁移、风险和回滚。
- 默认架构偏好是 UI 与数据分离：UI 层只负责展示、交互入口和状态渲染；ViewModel、Presenter、Controller 或等价状态协调层负责把领域状态转换成 UI 状态；数据访问、持久化、网络请求和外部服务放在数据层或服务层。
- 小 UI 改动不应穿透修改数据层；如果必须穿透，技术方案必须写清原因和影响范围。
- `plan_status=approved` 时，`未解决问题` 必须为 `none`。
- `migration_level=breaking` 时，必须新增或更新 ADR。
- `04-任务拆解.md` 的每个任务必须声明 `source_plan_sections`、`deliverable`、`acceptance_slice`、`contract_changes` 和 `review_focus`。
- `source_plan_sections` 必须能在同一 initiative 的 `03-技术方案.md` 中找到对应章节。

### Initiative 模型

同一个交付事项的产品、界面、技术、任务、验收和发布交接必须放在同一个 initiative 包里，避免 PRD、界面设计、技术方案分散后失去关联。

推荐结构：

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

全局汇总文档只记录当前产品事实：

- `docs/product/PRD.md`：当前产品完整事实。
- `docs/product/UI.md`：当前界面规范、页面索引、交互事实。
- `docs/product/TECH.md`：当前技术总览、模块边界、质量命令。
- `docs/adr/`：全局架构决策记录。

initiative 完成后不能只移动到 `done/`，还必须反写相关全局文档。如果 initiative 被放弃或过期，移动到 `archived/`，写清归档原因，不进入全局当前事实。

### Gitflow 分支规范

多 agent 并行开发时使用 Gitflow：

```text
main
develop
feat_012_import_folder
feat_012_scan_diff
fix_012_scan_error
release_2026q3_001
hotfix_018_login_crash
```

分支命名规则：

- 格式：`<type>_<id>_<short_name>`。
- ID 不加 `REQ` 前缀。
- 全部小写。
- 统一使用下划线 `_`。
- 不使用短横线 `-`。
- `type` 只允许 `feat`、`fix`、`hotfix`、`release`。
- 开发分支的 `id` 必须对应 initiative ID。
- 每个任务在 `04-任务拆解.md` 中声明目标分支、前置依赖、允许路径、验证命令和合并目标。

### 并行需求

多个需求并行时，白塔使用项目级自检 + workstream 边界：

- 项目级自检由 `docs/white-tower/status.md` 管理，决定白塔自己能不能进入开发。
- 需求级边界由 `docs/workstreams/<status>/<workstream-id>.md` 管理，决定白塔处理某个需求时能改哪些路径。
- 阶段 1-3 或 `gate_mode=source-locked` 时，即使有多个 workstream，白塔自己也只能做文档、架构、TODO、架构决策、界面设计和自检准备。
- 阶段 4 或 `gate_mode=development` 后，白塔自己的源码改动必须命中至少一个 `docs/workstreams/active/` 下的 `status=active` workstream 的 `allowed_paths`。
- 如果多个 workstream 需要改共享契约、数据模型、架构边界，先补 architecture-decision 或在 workstream 中声明依赖。

workstream 必须按状态目录组织：

```text
docs/workstreams/
├── draft/
├── ready/
├── active/
├── blocked/
├── done/
└── archived/
```

规则：

- `status` 必须和所在目录一致，例如 `status: active` 的文件必须放在 `docs/workstreams/active/`。
- 已完成 workstream 移入 `done/`，不能继续留在顶层或 active 队列。
- 放弃或过期 workstream 移入 `archived/`，必须写清 `archive_reason`。
- 顶层 `docs/workstreams/` 只保留 `README.md`、`template.md` 和状态目录。

创建 workstream 时至少包含：

```markdown
workstream_id: import-directory-init
status: draft
stage: 3-准备开发

## allowed_paths

- docs/**
- TODO.md

## blocked_paths

- apps/**
- packages/**
```

## 阶段地图

### 1. 产品需求

目标：先定义产品是什么，再让 coding agent 写软件。

需要澄清并文档化：

- 这个产品解决什么问题。
- 目标用户是谁。
- 用户现在怎么解决。
- 现有方案有什么不足。
- 竞品是谁，差异化在哪。
- MVP 先做什么。
- 明确哪些功能先不做。
- 最终形态：网页、小程序、插件、桌面 App、移动 App、内部工具等。
- 成本约束：API 成本、服务器成本、时间成本、运营风险。

预期产物：

- `docs/prd/README.md`.
- 产品定位。
- 用户痛点。
- MVP 范围。
- 页面或功能清单。
- 核心用户流程。
- 验收标准。
- 主要风险和非目标。

白塔自检：

- 如果 AI 还需要猜用户、MVP、核心流程或业务规则，停留在本阶段。
- 如果界面设计阶段发现产品逻辑冲突，回到产品需求修正，不要只在原型里绕过去。

### 2. 界面设计

目标：在实现前，让产品逻辑和设计方向可见。

需要收集或定义：

- 整体气质。
- 色彩方向。
- 布局结构。
- 卡片、列表、表格、网格风格。
- 组件密度。
- 交互状态。
- 加载、空、错误、禁用状态。
- 明确要避免的视觉问题。

预期产物：

- 界面设计文档，例如 `docs/uiux/README.md`、`docs/uiux/03-视觉规范.md`。
- 线框图或高保真样张。
- 页面覆盖索引。
- 组件和交互状态说明。
- 必要时导出重点页面截图。

白塔自检：

- UI 原型不是为了好看，而是让 coding agent 看懂产品逻辑、布局优先级、文案语气和边界状态。
- 如果原型暴露需求缺失或流程不顺，回到 PRD。
- 除非用户明确改 scope，否则不要让视觉探索覆盖产品范围。

### 3. 准备开发：先固化 `docs/`

目标：在源码实现前，建立能约束开发的耐久上下文。

创建或更新核心文档：

- `docs/prd/`：产品定位、用户痛点、MVP、页面清单、核心流程、验收标准。
- `docs/uiux/`：主题、组件规则、关键交互、加载/空/错误状态。
- `docs/architecture.md`：技术栈、目录结构、数据模型、服务边界、AI 引用机制、开发约束、不变量、禁止破坏的逻辑、验收标准。
- `TODO.md`：有顺序的实现 backlog。
- `docs/adr/`：关键技术取舍。

白塔自检：

- 这些文档不是形式，它们限制后续 AI 不要乱写、乱改、乱扩展。
- 如果架构解释不了某个功能该放哪里，停留在本阶段。
- 如果 TODO 不能独立实现，先拆分再编码。

### 4. 正式开发：小步迭代

目标：一次只实现一个清晰单元，验证后提交。

每轮迭代：

- 从 `TODO.md` 取下一项。
- 明确修改目标。
- 遵守允许改动范围。
- 只实现这个单元。
- 检查相关的加载、空、错误和边界状态。
- 运行最小但有效的验证。
- 如果实现改变了契约，同步更新文档或 TODO。
- 一个验证过的切片对应一次提交。

建议提交节奏：

```bash
git add <changed-files>
git commit -m "feat: xxx"
```

遵守仓库已有提交规范。如果没有规范且用户偏好中文，使用简洁的简体中文提交信息。

白塔自检：

- 一次提交应该对应一个可 review 的行为切片，而不是一堆无关改动。
- 如果下一次 AI 会看不懂当前进展，停止前先更新 `TODO.md`、`README` 或架构说明。
- 如果代码变乱，从文档和设计决策回溯，不靠猜测绕症状。

### 5. 部署上线：最后反扫文档

目标：上线前让项目可理解、可部署、可恢复上下文。

推送或部署前反扫：

- 当前真实目录结构。
- 部署方式。
- 环境变量。
- 核心模块职责。
- 构建、测试、检查命令。
- 已知限制。
- 回滚或恢复说明。

预期更新：

- `docs/architecture.md` 反映当前实现。
- `README.md` 说明安装、运行、构建、部署、验证。
- `TODO.md` 区分已完成、下一步、延期项和已知风险。
- 发布/部署说明准确。

白塔自检：

- 不依赖聊天上下文部署。
- 下一个 AI 或开发者只看仓库文件就能接手。
- 如果最终反扫发现文档漂移，先更新文档再发布。

## 进度审计输出

当用户要求整理当前进展或阶段 TODO 时，使用这个结构：

```markdown
**当前阶段**
阶段 X：<中文阶段名>。<one-line reason from repo artifacts>

**已完成**
- <artifact or decision>

**待办**
- P0: <must do next>
- P1: <important but can follow>
- P2: <later>

**白塔自检**
- <what must be true before moving on>

**风险**
- <missing doc, unclear scope, unverified assumption, or drift>
```

进展判断必须基于证据。说明结论来自当前仓库检查、截图、还是记忆。

## 反模式

避免这些失败模式：

- 产品需求和界面设计还不能约束实现时就开始写代码。
- 把 UI 样张当海报，而不是产品状态说明。
- 生成很多页面但没有页面覆盖索引。
- 没有 `TODO.md`，导致下一次对话只能猜。
- 实现后不更新文档，造成 docs 漂移。
- 很多无关改动挤成一个大提交。
- 把聊天记录当唯一产品真相。
- 部署前跳过 README/架构文档清理。

## 最小命令检查清单

使用适合当前仓库的命令。常见检查：

```bash
git status --short
rg --files docs
rg --files
git diff --check
```

如果仓库包含中文或其他非 ASCII 路径，检查 changed files 时使用：

```bash
git -c core.quotePath=false status --short
git -c core.quotePath=false diff --name-only
git -c core.quotePath=false diff --name-only --cached
git -c core.quotePath=false ls-files --others --exclude-standard
```

如果涉及前端或生成式 UI 资产，还要使用仓库现有的渲染、导出和截图验证命令。涉及代码时，运行当前可用的最小有效 typecheck、lint、test 或 build。
