---
name: white-tower
version: 0.4.0-dev
codename: white-tower
updated_at: 2026-06-22
description: 白塔协议 for governed AI assisted product delivery with requirement discussion, PRD governance, interface design, technical plans, requirement packages, task DAGs, Gitflow multi-agent execution, stage gates, repository guardrails, and release handoff. Use when the user wants to start, adopt, plan, restart, audit, or continue a product from requirements to UI, technical plan, task slicing, implementation, verification, and release/deployment; when deciding current progress and next actions before coding; or when adding gate enforcement with project-status, requirement packages, Gitflow branch checks, pre-commit, pre-push, CI, or check scripts.
---

# 白塔协议

白塔是一套 AI 产品交付治理协议：把需求讨论、PRD、界面设计、技术方案、任务拆解、多 agent 开发、验证和发布约束成高可用、有序、可恢复的 SOP，避免一上来就写代码。每个阶段都必须产出能约束下一阶段的文件，完成验证后再前进。如果后续阶段暴露前序问题，回到对应上游文档修正，而不是在当前阶段硬补。

## 快速使用

用户可以显式触发：

```text
Use $white-tower 检查当前项目阶段，给出下一步 TODO 和门禁状态。
```

确认当前会话是否读到新版白塔时使用：

```text
Use $white-tower 自检：输出 name、version、codename、updated_at，以及分支命名规则。
```

自检期望看到：

```text
name: white-tower
version: 0.4.0-dev
codename: white-tower
updated_at: 2026-06-22
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

这条指令必须自动完成环境判断、任务选择和执行器选择。如果门禁通过且存在 runnable tasks，不要只输出方案，要开始派发任务。

常见请求和处理方式：

- “当前进度到哪了”：审计 `README`、`docs/`、`TODO.md`、`docs/white-tower/status.md`、`git status`，按“当前阶段 / 已完成 / 待办 / 阶段门禁 / 风险”输出。
- “更新白塔 / 更新 white-tower / 更新这个 skill”：默认运行 `bash ~/.codex/skills/white-tower/scripts/update-white-tower.sh codex`，输出更新结果和版本信息。
- “更新所有白塔 / 更新全部工具里的白塔”：运行 `bash ~/.codex/skills/white-tower/scripts/update-white-tower.sh all`，逐个更新 Codex、Claude Code、Hermes、agents 和 OMP 中已经安装为 git clone 的目标；未安装目标跳过，脏目录或拉取失败必须报错。
- “继续”：先读阶段状态和 TODO，只执行当前阶段允许的下一步。
- “开始开发 / 初始化项目 / 写功能”：先运行门禁检查；如果仍处于 `source-locked`，不要创建源码目录或工程文件。
- “dispatch / 自动调度 / 开始多 agent 编码 / 按 workstreams 自动执行”：执行自动调度流程，读取当前阶段、workstreams 和需求包任务，选择 Codex 多 agent、OMP task 或顺序 fallback，并开始执行 runnable tasks。
- “提交代码”：先运行 `node scripts/check-stage-gate.mjs --staged`、仓库既有检查和 `git diff --check`。
- “升级到下一阶段”：确认阶段退出条件满足，再更新 `docs/white-tower/status.md`、`TODO.md` 和必要 architecture-decision。

项目第一次接入时，先创建 `docs/white-tower/stage-gates.md`、`docs/white-tower/status.md`、`TODO.md` 和 `scripts/check-stage-gate.mjs`。之后所有后续改动都按 `docs/white-tower/status.md` 的 `current_stage` 和 `gate_mode` 检查。

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
2. 如果没有阶段门禁，先创建最小门禁文件：
   - `docs/white-tower/status.md`
   - `docs/white-tower/stage-gates.md`
   - `TODO.md`
   - `docs/workstreams/README.md`
   - `docs/workstreams/template.md`
   - `scripts/check-stage-gate.*`，脚本语言按仓库现有技术栈选择；无法判断时用 Node 或 shell。
3. 把 `current_stage` 设为当前真实阶段，使用“编号-中文阶段名”的格式，例如 `3-准备开发`，不要默认进入开发。
4. 如果没有产品需求，停在阶段 1；如果没有界面设计，停在阶段 2；如果没有技术方案 / 架构和 TODO，停在阶段 3。
5. 只有阶段 4 且 `gate_mode=development` 后，才允许初始化应用工程或写功能代码。

### 自动推进循环

每次执行任务都按这个循环：

1. **Read**：读取 `docs/white-tower/status.md`、`docs/white-tower/stage-gates.md`、`TODO.md`、相关产品需求 / 界面设计 / 架构决策 / workstream 和 `git status`。
2. **Decide**：判断当前阶段、允许动作、禁止动作、下一步最小切片。
3. **Act**：只执行一个阶段内的最小可验证动作。
4. **Verify**：运行门禁脚本、仓库既有检查和与改动相关的最小验证。
5. **Record**：更新 TODO、workstream、项目状态或 architecture-decision，使下一次会话能从仓库文件恢复。
6. **Report**：总结改动、验证、阻塞、下一步。

如果循环中发现阶段不满足，停止越级任务，改为补齐门禁产物。

### 自动推进边界

可以自主推进：

- 创建和更新阶段文档。
- 拆 TODO。
- 创建 workstream。
- 补 architecture-decision 草稿。
- 运行门禁和检查。
- 在阶段 4 后按 active workstream 实现小切片。

必须停下来说明或询问：

- 产品方向冲突。
- 页面范围、平台范围或数据模型冲突。
- 需要删除、重写或回滚用户已有改动。
- 门禁要求与用户明确指令冲突。
- 需要引入重大依赖、服务端、账号、云同步、公网访问或付费服务。

### 自动调度：`dispatch`

当用户说 `Use $white-tower dispatch`、`自动调度`、`开始多 agent 编码` 或等价表达时，按以下流程直接执行：

1. **读取环境**：
   - `git status --short`
   - `docs/white-tower/status.md`
   - `docs/white-tower/stage-gates.md`
   - `TODO.md`
   - `docs/workstreams/**`
   - `docs/requirements/**/00-meta.md`
   - `docs/requirements/**/03-技术方案.md`
   - `docs/requirements/**/04-任务拆解.md`
2. **检查门禁**：
   - 如果存在 `scripts/check-stage-gate.mjs`，先运行。
   - 如果存在 `scripts/check-requirement-package.mjs`，先运行。
   - 只有 `gate_mode=development` 或项目状态明确允许源码实现时，才执行编码任务。
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

Requirement package: <path>
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

## 拦截模型

Skill 只负责让 agent 会判断门禁，不能单独阻止用户、脚本或另一个 agent 绕过流程。需要三层一起落地：

1. 软拦截：把阶段规则写入 skill、`AGENTS.md`、`docs/协作流程.md` 或等价协作文档。作用是让 agent 默认先审计阶段，再决定能不能继续。
2. 中拦截：把当前阶段写入仓库文件，例如 `docs/white-tower/status.md`，并用脚本检查当前阶段允许什么、禁止什么。
3. 硬拦截：把检查脚本接入 `pre-commit`、`pre-push`、CI、PR 模板或分支保护。作用是在提交、推送或合并路径上挡住越级改动。

不要把“我会遵守 skill”当成真正拦截。真正可依赖的是仓库文件 + 自动检查 + 合并规则。

### 推荐仓库文件

优先在项目内创建这些文件，而不是只保存在聊天里：

- `docs/white-tower/stage-gates.md`：五阶段定义、每阶段进入条件、退出条件、允许动作、禁止动作。
- `docs/white-tower/status.md`：当前阶段、门禁强度、已通过门禁、允许动作、禁止动作、下一阶段条件。
- `TODO.md`：当前阶段和下一阶段的可执行 backlog。
- `docs/workstreams/`：并行需求的需求级门禁，每个需求一个文件。
- `scripts/check-stage-gate.mjs` 或同类脚本：读取阶段状态并检查当前 diff。

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

- `bootstrap`：门禁系统第一次加入仓库。
- `source-locked`：允许文档、架构、TODO、架构决策、门禁脚本和界面设计准备工作，禁止正式源码。
- `development`：允许源码实现，但必须具备架构、TODO、架构决策和质量命令。
- `release`：发布前收敛，强调文档反扫、构建、部署和回滚。

### 检查脚本职责

`check-stage-gate` 脚本应该做确定性检查，不要依赖 LLM 判断：

- 读取 `docs/white-tower/status.md` 或等价状态源。
- 支持 Bootstrap：如果项目还没有 `docs/white-tower/status.md`，只允许新增门禁初始化文件；不要要求一个尚不存在的门禁系统先通过门禁。
- 检查当前阶段和 `gate_mode` 对应的必需文件是否存在。
- 检查 changed files 时使用未转义路径，例如 `git -c core.quotePath=false diff --name-only`、`git -c core.quotePath=false diff --name-only --cached` 和 `git -c core.quotePath=false ls-files --others --exclude-standard`，避免中文路径或非 ASCII 路径被 Git quote 后误判门禁。
- 检查 `git diff --name-only --cached`、`git diff --name-only` 和 untracked files。
- 支持 `--staged`，用于 pre-commit 只检查暂存区。
- 如果阶段还没有进入正式开发，却新增源码目录、应用工程、业务代码、运行时依赖，直接失败。
- 如果试图进入正式开发或当前状态已标记为阶段 4 以后，但 technical-plan、`TODO.md` 或 architecture-decision 缺失，直接失败。
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

提交前或 hook 中运行：

```bash
node scripts/check-stage-gate.mjs --staged
```

检查失败时，不要继续越级任务；改为补齐门禁要求，并向用户说明阻塞原因和可执行下一步。

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
- `source_plan_sections` 必须能在同需求包的 `03-技术方案.md` 中找到对应章节。

### 需求包模型

同一个需求的产品、界面、技术、任务、验收和发布交接必须放在同一个需求包里，避免 PRD、界面设计、技术方案分散后失去关联。

推荐结构：

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

全局汇总文档只记录当前产品事实：

- `docs/product/PRD.md`：当前产品完整事实。
- `docs/product/UI.md`：当前界面规范、页面索引、交互事实。
- `docs/product/TECH.md`：当前技术总览、模块边界、质量命令。
- `docs/adr/`：全局架构决策记录。

需求完成后不能只移动到 `completed/`，还必须反写相关全局文档。如果需求被放弃或过期，移动到 `archived/`，写清归档原因，不进入全局当前事实。

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
- 需求开发分支的 `id` 必须对应需求包 ID。
- 每个任务在 `04-任务拆解.md` 中声明目标分支、前置依赖、允许路径、验证命令和合并目标。

### 并行需求

多个需求并行时，使用项目级门禁 + workstream 门禁：

- 项目级门禁由 `docs/white-tower/status.md` 管理，决定整个项目能不能进入开发。
- 需求级门禁由 `docs/workstreams/<workstream-id>.md` 管理，决定某个需求能改哪些路径。
- 阶段 1-3 或 `gate_mode=source-locked` 时，即使有多个 workstream，也只能做文档、架构、TODO、架构决策、界面设计和门禁准备。
- 阶段 4 或 `gate_mode=development` 后，源码改动必须命中至少一个 `status=active` workstream 的 `allowed_paths`。
- 如果多个 workstream 需要改共享契约、数据模型、架构边界，先补 architecture-decision 或在 workstream 中声明依赖。

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

门禁检查：

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

门禁检查：

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

门禁检查：

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

门禁检查：

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

门禁检查：

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

**阶段门禁**
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
