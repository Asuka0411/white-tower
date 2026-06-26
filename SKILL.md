---
name: white-tower
version: 0.14.0-dev
codename: white-tower
updated_at: 2026-06-26
description: 白塔协议 for task-pool based AI product delivery. Use when the user wants to capture requirements, bugs, UI/UX work, improvements, refactors, releases, or follow-ups; normalize them into durable initiative packages; select runnable tasks by type, priority, status, dependencies, path conflicts, and human gates; then plan, slice, execute with Gitflow and optional multi-agent parallelism, verify, commit, merge, release when needed, archive, sweep follow-ups, and keep looping until only explicit human gates or hard blockers remain.
---

# 白塔协议

白塔是一套 AI 产品工程自动推进协议。主模型只有两个部分：

1. **任务生成 / 信息收集**：把需求、bug、截图、日志、TODO、测试失败、UI/UX 反馈和扫尾项规范成可执行任务。
2. **任务选择 / 自动执行**：按类型、优先级、状态、依赖、路径冲突和人工卡点选择单个或多个 runnable tasks，执行、验证、提交、归档，然后继续扫描下一轮。

白塔目标：把模糊输入持续转化为标准任务，并自动选择、切片、并发执行、验证、提交、归档，直到没有可安全推进的任务。

用户主要确认 PRD / 产品范围、产品级 UI/UX、重大架构、破坏性迁移、外部服务、付费能力和删除用户已有改动。除此之外，白塔应自动推进，不停在“本轮完成”“工作树干净”“已提交”“没有新的 active slice”。

## 快速触发

自检：

```text
Use $white-tower 自检：输出 name、version、codename、updated_at、核心模型、分支命名规则。
```

期望：

```text
name: white-tower
version: 0.14.0-dev
codename: white-tower
updated_at: 2026-06-26
core model: task generation + task selection/execution loop
branch pattern: <type>/<id6>_<YYMMDD>_<short_name>
```

常用触发词：

```text
Use $white-tower 我有个需求：<内容>
Use $white-tower 记录 bug：<现象/截图/日志>
Use $white-tower 继续
Use $white-tower 实施计划
Use $white-tower dispatch max_parallel=2
Use $white-tower 审查并推进任务池
Use $white-tower 更新白塔
```

用户要求“更新白塔 / 更新 skill”时，运行 `bash ~/.codex/skills/white-tower/scripts/update-white-tower.sh codex`；要求更新所有工具里的白塔时，运行 `bash ~/.codex/skills/white-tower/scripts/update-white-tower.sh all`。若安装目录不是 git clone 或存在本地未提交改动，停止并说明原因。

## 任务生成

白塔先从仓库和输入中收集任务，不从聊天记忆直接猜：

- 用户输入：需求、bug、优化、截图、日志、报错。
- 仓库事实：`README`、`TODO.md`、`docs/product/*`、`docs/initiatives/**`、`docs/white-tower/status.md`。
- 工程信号：测试失败、构建失败、lint/typecheck 失败、发布前检查。
- 过程产物：UI/UX review、验收扫尾、已完成任务留下的 follow-up。

每个任务尽量补齐这些字段；能从仓库确定就自动补，需要产品判断才问用户：

```yaml
task_id: <三位数字或 TASK-ID>
title: <中文短标题>
type: <epic|feature|change|bug|uiux|optimization|refactor|tech_debt|test|infra|release|docs|research|migration|cleanup|security|ops>
source: <user|screenshot|log|test|todo|prd|followup|audit>
goal: <目标>
non_goals:
  - <明确不做什么>
priority: <P0|P1|P2|P3>
status: <planned|preparing|ready|active|review|paused|blocked|done|archived>
dependencies:
  - <task-or-initiative-id>
impact_scope:
  - <product|uiux|domain|data|infra|release|docs>
requires_uiux: <true|false>
requires_technical_plan: <true|false>
can_parallel: <true|false>
conflict_risk: <low|medium|high>
contract_changes: <none|compatible|breaking>
allowed_paths:
  - <path-glob>
blocked_paths:
  - <path-glob>
verification:
  - <command-or-manual-check>
human_gate:
  required: <true|false>
  reason: <prd|product-uiux|design-review|architecture|destructive-change|external-service|payment|delete-user-work|none>
```

## 任务类型

| Type | Meaning | Default strategy |
| --- | --- | --- |
| `epic` | 大需求 / 大模块 | PRD、UI/UX、技术方案、细粒度 DAG、多轮执行 |
| `feature` | 小需求 / 新功能 | 轻量 PRD、必要设计、切片实现 |
| `change` | 小改动 / 行为调整 | 窄影响范围，避免顺手重构 |
| `bug` | 缺陷修复 | 复现、定位、最小修复、回归测试 |
| `uiux` | UI/UX 设计或重绘 | 生成可 review 图片，等待确认 |
| `optimization` | 体验 / 性能优化 | 先定义指标或体验差异 |
| `refactor` | 重构 | 行为不变，测试或快照先行 |
| `tech_debt` | 技术债 | 写清收益、风险、非目标 |
| `test` | 测试补齐 / 修复 | 优先保护当前行为或改动 |
| `infra` | 构建 / CI / 脚本 | 先验证命令和环境 |
| `release` | 发布 / 打包 / 上架 | 版本、变更说明、tag、回滚 |
| `docs` | 文档 / PRD / 技术说明 | 写入仓库事实，不依赖聊天 |
| `research` | 调研 / spike | 输出证据和 go/no-go |
| `migration` | 数据或结构迁移 | dry-run、兼容、回滚 |
| `cleanup` | 扫尾 / 归档 | 不夹带新功能 |
| `security` | 权限 / 隐私 / 漏洞 | 高风险验证和回滚 |
| `ops` | 运维 / 账号 / 环境 | 外部服务通常需要确认 |

## 任务包

新版主结构使用 initiative package。外部目录只使用四类状态：

```text
docs/initiatives/planned/
docs/initiatives/active/
docs/initiatives/done/
docs/initiatives/archived/
```

细状态写入 `00-meta.md` 的 `lifecycle_state`，例如 `preparing`、`ready`、`review`、`paused`、`blocked`。不要新建细状态目录。

推荐结构：

```text
docs/initiatives/active/012_导入文件夹/
├── 00-meta.md
├── 01-需求文档.md
├── 02-界面设计.md
├── 02-assets/
├── 03-技术方案.md
├── 04-任务拆解.md
├── 05-验收记录.md
├── 06-发布交接.md
├── 07_runs/
└── 08_checkpoints/
```

目录规则：

- initiative 目录推荐 `<三位数字>_<中文短标题>`，例如 `001_管理目录初始化与空图库壳`。
- 目录 ID 必须和 `00-meta.md` 的 `initiative_id` 一致。
- Git 分支使用英文 slug，例如 `feature/000001_260626_foundation_library_shell`，不要使用中文分支名。
- `docs/initiatives/README.md`、`TODO.md` 和其他文档引用必须使用真实路径。

全局文档只记录当前产品事实：

- `docs/product/PRD.md`
- `docs/product/UI.md`
- `docs/product/TECH.md`
- `docs/adr/`

initiative 完成后不能只移动到 `done/`，还必须反写相关全局文档。放弃或过期时移动到 `archived/`，写清原因。

## Loop Contract

`继续`、`实施计划`、`dispatch`、`自动推进`、`开始多 agent 编码` 都触发自动循环，不是状态汇报。

每轮先扫描：

- `git status --short`
- `README`、`TODO.md`
- `docs/product/PRD.md`、`docs/product/UI.md`、`docs/product/TECH.md`
- `docs/white-tower/status.md`
- `docs/initiatives/README.md`
- `docs/initiatives/<planned|active|done|archived>/**`
- 可用检查、测试、构建命令

循环逻辑：

```text
while true:
  refresh_project_state()
  tasks = scan_all_tasks()

  if has_pending_human_review(tasks):
    present_review_items_with_evidence()
    stop_only_for_required_confirmation()

  runnable = find_runnable_tasks(tasks)

  if runnable.empty:
    if can_generate_or_refine_tasks():
      generate_or_refine_tasks()
      continue
    if can_archive_or_sweep_done_work():
      archive_and_sweep()
      continue
    write_no_runnable_reason_to_repo()
    break

  batch = select_best_batch(runnable)
  prepare_branch_and_checkpoints(batch)
  execute_batch(batch)
  verify_batch(batch)
  update_status_and_records(batch)
  archive_if_done(batch)
  sweep_followups(batch)
  continue
```

完成一轮只是下一轮扫描的触发点。

### 停止条件

只有这些情况可以停：

- 需要用户确认 PRD / 产品范围 / 优先级 / 非目标。
- 需要用户确认产品级 UI/UX 风格。
- 需要用户确认某张已生成的 UI/UX 图片；必须发送图片，并写入 `pending_review`。
- 需要用户在多个 UI/UX 方向、重大架构、破坏性迁移、外部服务、付费能力或删除用户已有改动之间取舍。
- 确定性检查失败，且白塔无法在当前允许范围内自动修复。
- 工具、权限、网络、依赖安装、上下文容量或运行环境限制导致无法继续。
- 完整扫描后确认没有 pending review、没有可生成/可细化任务、没有可推进 initiative、没有缺失技术方案/任务拆解/验收/发布交接、没有 runnable task、没有可修复检查项，并把依据写入 run record 或状态文件。

这些不是停止条件：

- 创建 TODO、索引、状态文件、checkpoint 或 run record。
- 技术方案从 `draft` 到 `review` 或从 `review` 到 `approved`。
- 任务切片完成。
- 验证通过。
- commit / push 成功。
- 工作树干净。
- 某个 worker / batch / initiative 暂时做完。
- 当前批次没有创建新的 active slice。

## Dispatch

`dispatch` 必须自动完成环境判断、任务选择和执行器选择。有 runnable tasks 时直接执行或派发。默认 `max_parallel=2`。

Runnable 条件：

- `depends_on` 已满足。
- `allowed_paths`、`blocked_paths`、`verification`、`branch`、`merge_target` 已声明。
- 没有未解决的 required human gate。
- 没有踩到当前 dirty work 或其他 worker 的路径。

并发条件：

| Can run in parallel | Must run sequentially |
| --- | --- |
| `can_parallel=true` | `conflict_risk=high` |
| `contract_changes=none` | `contract_changes != none` |
| `allowed_paths` 不重叠 | shared schema / router / manifest |
| 页面、Tab、局部 ViewModel、UI token、测试夹具 | 存储迁移、公共接口、最终集成、发布 |

如果 `04-任务拆解.md` 只有一个大任务，或把可并发页面不必要地串行，白塔先自动重写为分层细粒度 DAG，再 dispatch。

执行器选择：

- 有 Codex 多 agent 工具：优先 worker subagents。
- 有 OMP task agents：使用 OMP。
- 都没有：当前 agent 顺序执行 runnable tasks。降级不是失败，仍然按 loop 继续。

派发 worker 模板：

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

Read first:
- <00-meta.md>
- <01-需求文档.md>
- <03-技术方案.md>
- <04-任务拆解.md>

Implement only this task, run verification, then report changed files and result.
```

## UI/UX

用户默认只确认产品级 UI/UX 风格和需求级 UI/UX 图片。白塔默认自动生成需求级 UI/UX，写入 `02-界面设计.md`、资产、截图和引用。

规则：

- 现有 UI/UX 若标记为 reference only，只能作为参考，不能当已批准交付物。
- UI/UX 草案可以并发生成，但状态不能越过用户确认。
- 用户未确认前保持 `pending_review`，不得把依赖该 UI/UX 的 initiative 推到源码 dispatch。
- 中断后下次 `继续` / `实施计划` / `dispatch` 必须先读取 `docs/white-tower/status.md` 和 initiative 内 review 状态；只要有 `pending_review`，就重新发送图片并等待确认。

Review 状态示例：

```yaml
pending_review:
  - id: <initiative-or-page-id>
    image: <path-to-png>
    source: <path-to-html-or-figma>
    status: pending_review
```

生成或发送图片前必须写 design brief：

```yaml
target_user: <最终用户>
page_job: <页面要帮用户完成的一件事>
primary_action: <唯一主行动>
secondary_actions:
  - <最多 0-2 个>
information_priority:
  - <最先看到的信息>
forbidden_elements:
  - <本页不该出现的控件、区块、解释或状态>
product_copy_rules:
  - <面向最终用户的文案规则>
```

UI 质量闸：

- 单任务页面默认一个主行动。
- 不写给 Asuka / agent / designer / developer 的说明。
- 不把实现细节、白塔流程、review 状态或需求分析塞进产品 UI。
- 不重复信息块。
- 发送前确认主行动、层级、对齐、间距、最终用户文案、截图均已更新。
- 用户说“复杂 / 重复 / 凌乱 / 不知道干什么 / 只做一件事”，下一版必须结构性简化。
- 用户说“看不出区别”，下一版必须有肉眼可见的信息架构或布局变化，并记录 changed_regions。

发送 UI/UX 图片时，只给图片、页面名和一句确认问题。状态保持 `pending_review`，直到用户明确确认。

如果本机可用 `ui-ux-pro-max`，白塔做 UI/UX 设计、重绘、review 或修复时默认优先使用它检索 design-system、style、ux、color、typography 和 stack 建议；检索结果写入 run record。它是输入，不是裁判；最终服从 PRD、产品级风格、页面任务和用户反馈。

## 技术方案与切片

`03-技术方案.md` 必须能约束实现。必填：

- `plan_status`
- `migration_level`
- 技术目标
- 当前代码风格
- 架构偏好与分层约束
- 影响范围
- 数据结构
- API / 函数边界
- 状态流
- 错误处理
- 测试策略
- 兼容性和迁移
- 风险和回滚
- 未解决问题

默认架构偏好：

- UI 层只负责展示、交互入口和状态渲染。
- ViewModel / Presenter / Controller 或等价层负责把领域状态转换成 UI 状态。
- 数据访问、持久化、网络请求、外部服务放在数据层或服务层。
- 小 UI 改动不应穿透修改数据层；必须穿透时写清原因和影响范围。

`04-任务拆解.md` 每个任务必须声明：

- `source_plan_sections`
- `deliverable`
- `acceptance_slice`
- `contract_changes`
- `review_focus`
- `depends_on`
- `can_parallel`
- `allowed_paths`
- `blocked_paths`
- `verification`
- `branch`
- `merge_target`

切片原则：

- 拆到一个 agent 能稳定完成的最小验证切片。
- 优先按层拆：工程/包骨架、UI token、领域模型、数据接口、单页面或单 Tab、单 ViewModel、状态集成、测试夹具、验收记录、发布交接。
- 不要把首页框架、启动页、相册页、导入页、领域校验、存储实现合成一个任务。
- 首页 Tab 壳完成后，首页、相册页、导入页等只要路径不重叠就应并行。

## Gitflow

所有分支、提交、合并和发布行为必须先读取并遵守 `docs/gitflow.md`。如果项目入口文件、全局 agent 规则或本 skill fallback 与 `docs/gitflow.md` 冲突，以 `docs/gitflow.md` 为准。

如果项目没有 `docs/gitflow.md`，白塔使用 fallback 分支格式：`<type>/<id6>_<YYMMDD>_<short_name>`。

```text
main
develop
feature/000012_260626_import_folder
fix/000012_260626_scan_error
release/000001_260626_app_store_beta
hotfix/000018_260626_launch_crash
```

规则：

- `type` 只允许 `feature`、`fix`、`hotfix`、`release`。
- `id6` 必须 6 位数字，不足左侧补 0。
- `YYMMDD` 是创建分支日期。
- `short_name` 只用小写英文、数字和下划线。
- 不使用中文、空格、短横线、大写字母或额外斜杠。
- 开发分支 ID 应对应 initiative、task 或 slice ID。
- 提交信息遵守仓库规范；没有规范时默认简洁简体中文。

## Checkpoint-first 恢复

任何中断都必须能从 checkpoint、run record、task 状态和 git 状态恢复；不能依赖聊天上下文或最终总结。

必须持续写入：

```text
<initiative>/
├── 07_runs/
│   ├── latest.md
│   └── <run-id>.md
└── 08_checkpoints/
    ├── <timestamp>-before-edit.md
    ├── <timestamp>-after-edit.md
    ├── <timestamp>-before-verify.md
    └── <timestamp>-after-verify.md
```

每次执行前后至少记录：initiative / task ID、phase、branch、head commit、dirty files、最近动作、下一步、verification 是否在最新 diff 后运行、blocker、risk、manual question。

run 和 checkpoint 顶部元信息必须用 fenced `yaml`、表格或列表，不能把连续 `key: value` 挤成一段。

执行锁示例：

```yaml
execution_lock:
  status: locked
  run_id: <run-id>
  owner: <agent-or-worker>
  branch: <current-branch>
  heartbeat_at: <timestamp>
  ttl_minutes: 30
```

发现锁过期时：

1. 标记上一轮 run 为 `interrupted`。
2. 读取 `07_runs/latest.md` 和最新 checkpoint。
3. 运行 `git status`。
4. 对比 checkpoint dirty files 和当前 diff。
5. 判断继续、先验证、局部回滚 WIP，或请求人工确认。
6. 创建新 run，写入 `resumed_from`，再继续。

最终报告只是用户摘要；没有落入 `07_runs/`、`08_checkpoints/`、`04-任务拆解.md` 或状态文件，就不算可恢复事实。

## 自约束

白塔只约束显式使用白塔的 agent 自己，不默认限制其他人、工具或 agent。

- 白塔读取仓库状态文件判断自己能做什么。
- 自检脚本默认不安装到 pre-commit、pre-push、CI 或分支保护。
- 用户明确要求强制治理时，才接入 hook、CI 或 PR 流程。
- 未使用白塔的人直接改代码，不视为违规；下次运行重新审计真实仓库。
- `docs/white-tower/status.md` 只记录白塔自己的任务池扫描、执行循环和恢复状态。
- 不让用户手动理解或编辑 `status`、`lifecycle_state`、run record 或 checkpoint；白塔能确定就自己更新。

## Bootstrap

新仓库触发“开始 / 规划 / 直接做 / vibe coding”时：

1. 检查 `README`、`docs/`、`TODO.md`、源码目录、git 状态。
2. 没有白塔状态时，创建最小任务池：
   - `docs/white-tower/status.md`
   - `TODO.md`
   - `docs/initiatives/README.md`
   - `docs/initiatives/{planned,active,done,archived}/.gitkeep`
3. 用户只给模糊想法时，先生成任务收集问题和 PRD 草案，不直接写源码。
4. PRD 已确认但 UI/UX 未确认时，推进产品级或需求级 UI/UX review。
5. PRD / UI/UX / 技术方案足够时，生成细粒度 `04-任务拆解.md` 并进入 dispatch。

## 审计输出

当用户问“当前进度 / 白塔状态 / 为什么停了 / 还有什么任务”时，基于仓库证据输出：

```markdown
**当前状态**
<任务池 / active / pending_review / blocked / git 状态一句话>

**可推进任务**
- P0: <task-id> <title>，原因：<依赖满足 / 可并发 / 无人工卡点>

**当前卡点**
- <人工确认、工具失败、验证失败等>

**白塔下一步**
<有可执行项时直接说明将执行什么，不把命令选择丢给用户>
```

不要让用户判断内部状态含义。不要让用户手动编辑状态文件。

## 最小检查

常见检查：

```bash
git status --short
rg --files docs
rg --files
git diff --check
```

中文或非 ASCII 路径：

```bash
git -c core.quotePath=false status --short
git -c core.quotePath=false diff --name-only
git -c core.quotePath=false diff --name-only --cached
git -c core.quotePath=false ls-files --others --exclude-standard
```

涉及代码时，运行当前可用的最小有效 typecheck、lint、test 或 build。涉及前端或生成式 UI 资产时，使用仓库现有渲染、导出和截图验证命令。

## 反模式

- 把白塔当成阶段门禁工具，而不是任务池和执行循环。
- 需求和 UI/UX 不能约束实现时就写代码。
- 任务切片太粗，导致 agent 一次改太多范围。
- 明明可以并发，却把页面或模块不必要地串行。
- 没有 `TODO.md`、initiative package、run record 或 checkpoint，导致下一次只能猜。
- 实现后不更新文档，造成 docs 漂移。
- 很多无关改动挤成一个大提交。
- 把聊天记录当唯一产品真相。
- 停在 commit、push、tree clean、batch complete，而不是继续扫描任务池。
