---
name: white-tower
version: 0.12.16-dev
codename: white-tower
updated_at: 2026-06-24
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
version: 0.12.15-dev
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

如果当前项目还处在 `bootstrap`、`source-locked`、`0-迁移收口`、`1-产品需求`、`2-界面设计` 或 `3-准备开发`，`dispatch` 不能直接编码。此时不要只告诉用户“不能执行”，也不要要求用户理解阶段名、手动改状态或自己选择下一条命令。白塔必须自动切换到当前可执行的前置流程：

- 已有 `docs/initiatives/planned/` 或 `docs/initiatives/active/`：自动执行“审查并推进需求单”。
- 还没有 initiative：自动补齐当前阶段缺失的 PRD、UI、`docs/product/TECH.md`、ADR、TODO 或状态文件。
- 输出给用户时只说清楚：“现在不能直接编码，我会先推进 <具体前置动作>；你不用手动改状态。”

批量审查并推进需求单时使用：

```text
Use $white-tower 审查并推进需求单
```

这条指令不是让用户逐个打开文件手动改状态。白塔必须自动扫描 `docs/initiatives/planned/`、`docs/initiatives/active/`、`TODO.md` 和检查脚本，能确定通过的自动更新状态、TODO 和索引；只有产品判断、设计取舍、技术冲突或破坏性变更不确定时才向用户列出问题。

常见请求和处理方式：

- “当前进度到哪了”：审计 `README`、`docs/`、`TODO.md`、`docs/white-tower/status.md`、`git status`，按“当前阶段 / 已完成 / 待办 / 白塔自检 / 风险”输出。
- “更新白塔 / 更新 white-tower / 更新这个 skill”：默认运行 `bash ~/.codex/skills/white-tower/scripts/update-white-tower.sh codex`，输出更新结果和版本信息。
- “更新所有白塔 / 更新全部工具里的白塔”：运行 `bash ~/.codex/skills/white-tower/scripts/update-white-tower.sh all`，逐个更新 Codex、Claude Code、Hermes、agents 和 OMP 中已经安装为 git clone 的目标；未安装目标跳过，脏目录或拉取失败必须报错。
- “继续”：这是自动推进的默认触发词，不是状态汇报。白塔先读阶段状态、TODO、checkpoint 和 pending review，然后继续当前阶段里下一项可推进动作；如果当前没有 pending review 且没有确定性阻塞，也不能停在“已完成一轮”“这一批做完了”“当前没有新 active slice”“工作树已干净”或任何等价的结束语。
- “实施计划”：在 PRD 和产品级 UI/UX 已确认后，自动推进需求级 UI/UX、技术方案、任务拆解、状态推进、dispatch、验证和记录；不要把它当成单纯的计划讨论。
- “dispatch / 自动调度 / 开始多 agent 编码 / 按 workstreams 自动执行”：在可编码时直接开始 runnable tasks；在不可编码时自动切到前置流程，不要把下一步命令交回给用户选择。
- “迁移旧白塔数据 / migrate legacy / 兼容旧数据”：先运行 `node scripts/migrate-white-tower.mjs` 或模板脚本的 dry-run；确认只包含安全迁移后运行 `node scripts/migrate-white-tower.mjs --write`。如果需要从旧 workstream 生成交付事项包，使用 `--create-initiatives`；新版目录固定为 `docs/initiatives/<planned|active|done|archived>/<id>`，不再按年份或季度分层。
- “审查并推进需求单 / 推进需求单 / 批量推进技术方案”：执行 initiative 自动审查推进流程；不要要求用户逐个打开 `03-技术方案.md` 手动从 `draft` 改到 `review`。
- “开始开发 / 初始化项目 / 写功能”：先运行白塔自检；如果仍处于 `source-locked`，白塔自己不要创建源码目录或工程文件。
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

### 默认自治边界

白塔的默认使用方式是“用户把关产品方向，白塔自动推进交付流水线”。

用户默认只需要确认：

- PRD / 需求范围 / 优先级 / 非目标。
- 产品级 UI/UX 风格、设计原则、视觉基调和交互偏好。
- 白塔完成某个需求级 UI/UX 设计后的 review 结论；必须在对话中发送可预览图片给用户确认。
- 真正影响产品方向、全局设计风格、重大架构、破坏性数据迁移、外部服务、付费能力或删除用户已有改动的决策。

白塔默认自主完成：

- 根据已确认 PRD 生成或更新 initiative。
- 根据产品级 UI/UX 风格自动设计每个 initiative 的需求级 UI/UX，并写入 `02-界面设计.md`、截图、引用和设计资产。
- 需求级 UI/UX 完成后向用户给 review 摘要，并在对话中直接发送图片；如果只是局部页面设计，不先问用户才开始设计。
- UI/UX 草案生成可以并发，但状态推进不能并发越过用户确认。每个 UI/UX review item 在用户明确确认前必须保持 `pending_review`。
- 生成和推进 `03-技术方案.md`，保持 UI 与数据分离、MVVM / ViewModel 等分层约束。
- 生成和维护细粒度 `04-任务拆解.md`、allowed paths、blocked paths、verification、依赖、目标分支和 task DAG；默认按工程壳、UI token、领域模型、页面、状态集成、验收等层级拆分，而不是把一个需求压成一个大任务。
- 在条件满足后移动 initiative 状态、写 checkpoint / run record、派发多 agent 或顺序 fallback 实施。
- 运行验证、更新验收记录、反写 `docs/product/PRD.md`、`docs/product/UI.md`、`docs/product/TECH.md` 和 release handoff。

不要把阶段状态、文件移动、`plan_status`、`lifecycle_state`、任务切片或 dispatch 选择交给用户手动操作。只有上面列出的人工决策项才需要停下来问。
- 当 `current_stage=3-准备开发` 且 `gate_mode=source-locked` 时，`继续` 仍然是推进命令，不是终点命令；如果当前没有 pending review，也没有人工卡点，就继续补齐技术方案、任务拆解、验收记录、发布交接或下一个可推进动作。

### UI/UX 确认门禁

如果项目声明现有 UI/UX 为 reference only，白塔必须把旧 UI/UX 文档、草图和图片只当参考资产，不得作为已批准交付物推动状态变化。

项目应使用 `docs/uiux/REVIEW_STATUS.md` 或 initiative 内等价 run record 保存 UI/UX 审核状态：

```yaml
uiux_mode: redesign_required
current_assets_status: reference_only
approval_policy: explicit_user_confirmation_required
pending_review:
  - id: <initiative-or-page-id>
    image: <path-to-png>
    source: <path-to-html-or-figma>
    status: pending_review
```

规则：

- 白塔可以并发生成多个 UI/UX 草案、页面图、主题探索或状态图。
- 每个草案完成后，必须把 PNG/JPG/WebP 等可预览图片保存到仓库，并在对话中用图片直接发给用户确认。
- 用户明确确认前，不得把对应 initiative 从 `planned` 推到 `active`，不得把 `lifecycle_state` 推进为 `ready` / `active`，不得继续依赖该 UI/UX 的技术方案批准或源码 dispatch。
- 如果对话中断、用户未确认、token 限流、IDE 崩溃或电脑断电，下次 `继续`、`实施计划` 或 `dispatch` 必须先读取 UI/UX review 状态；只要存在 `pending_review`，就重新发送对应图片并等待确认。
- 用户提出修改意见时，白塔更新草案和图片，保持 `pending_review`；只有用户明确说确认、通过、按这个方向继续等同义表达时，才标记 `approved` 并继续推进。

### UI/UX 绘制质量闸

UI/UX 草案不是展示设计能力的海报，而是给最终用户使用的产品界面。白塔在生成、修改或发送任何 UI/UX 图片前，必须先通过质量闸；不能只满足“有图、发图、pending_review”。

绘制每个页面前，先在 initiative run record、`docs/uiux/REVIEW_STATUS.md` 或等价设计记录中写入简短 design brief：

```yaml
target_user: <最终用户>
page_job: <这个页面帮用户完成的一件事>
primary_action: <唯一主行动>
secondary_actions:
  - <最多 0-2 个辅助行动>
information_priority:
  - <最先让用户看到的信息>
forbidden_elements:
  - <本页不该出现的控件、区块、解释或状态>
product_copy_rules:
  - <面向最终用户的文案语气和禁用词>
```

单任务页面默认只允许一个主行动。例如“选择一个目录作为图库”这类页面，默认不加侧边栏、仪表盘、多组状态面板、多入口按钮、重复说明、实现流程解释或为了显得完整而添加的占位功能。除非 PRD 明确要求，页面只服务当前 `page_job`。

界面可见文案必须是最终用户会看到的产品文案：

- 不写给 Asuka 的说明。
- 不写给 agent / designer / developer 的解释。
- 不写“这个页面用于”“我做了”“设计目标是”这类设计说明。
- 不把实现细节、阶段状态、白塔流程、review 状态或需求分析塞进产品 UI。
- 不在多个区域重复同一件事；同一信息只在最合适的位置出现一次。

反馈触发规则：

- 用户说“复杂”“重复”“凌乱”“不知道干什么”“只做一件事”“我现在理论上不就一个事情可以做吗”等同义反馈时，下一版必须做结构性简化：删区块、删辅助动作、删重复文案、重新排列层级，而不是只改颜色、圆角、阴影或几个字。
- 用户说“有什么区别”“看不出区别”等同义反馈时，下一版必须产生肉眼可见的布局或信息架构变化，并在 run record 记录 changed_regions；不能发送和上一张几乎相同的图片。
- 用户指出“这句话是解释给我看的还是用户”或角色错位时，必须先重写所有可见文案，确保每一句都面向最终用户，再重新截图。
- 用户指出“没对齐”“这里很奇怪”等视觉问题时，必须检查对齐、间距、图标与文字基线、视觉重心和响应式尺寸；不能只口头解释。
- 反馈原文必须原样写入 run record，随后记录 interpretation、exact_changes、changed_regions 和 regenerated_image。

发送图片前必须自检：

```yaml
uiux_quality_check:
  primary_action_visible_within_3_seconds: true
  exactly_one_dominant_action_for_single_job_page: true
  no_duplicate_message_blocks: true
  all_visible_copy_is_end_user_product_copy: true
  alignment_spacing_and_hierarchy_checked: true
  revision_has_material_visual_delta: true
  screenshot_regenerated_after_latest_change: true
```

如果任一项不是 `true`，白塔先继续修改，不把图片发给用户 review。修订后不能声称“已解决”直到重新生成图片并完成自检。

向用户发送 UI/UX 图片时，回复只需要给图片、页面名和一句确认问题。不要用长篇文字解释设计为什么好；设计质量由图片本身接受 review。状态保持 `pending_review`，直到用户明确确认。

### UI/UX Pro Max 优先策略

如果本机可用 `ui-ux-pro-max` skill，白塔做 UI/UX 设计、重绘、review、修复或生成页面图时，默认优先使用它作为设计检索和质量输入。不要在没有检索的情况下直接凭感觉画界面。

使用顺序：

1. 先读取当前项目 PRD、产品级 UI/UX 风格、页面目标和已确认用户偏好。
2. 运行 `ui-ux-pro-max` 的 design-system 检索，获得产品类型、风格、颜色、字体、动效和反模式建议。
3. 继续按需要检索 `style`、`ux`、`color`、`typography` 和项目技术栈，例如 `flutter`、`swiftui`、`react` 或 `html-tailwind`。
4. 把检索结果写入设计 run record：`ui_ux_pro_max_queries`、`accepted_recommendations`、`rejected_recommendations`、`rejection_reason`。
5. 再进入本 skill 的 UI/UX 绘制质量闸，完成 design brief、自检、截图和 `pending_review`。

`ui-ux-pro-max` 是优先输入，不是最终裁判。它的自动推荐如果偏离项目语境，例如把工具型产品推荐成 landing page、video hero、营销页、过度仪表盘或错误行业风格，白塔必须拒绝该推荐并记录原因。最终设计必须服从：

- 已确认 PRD 和页面任务。
- 产品级 UI/UX 风格。
- 用户明确偏好和否定反馈。
- 当前页面的单一 `page_job` 和 `primary_action`。
- 可访问性、对齐、信息层级和可截图 review 质量。

推荐命令模板：

```bash
python3 ~/.codex/skills/ui-ux-pro-max/scripts/search.py "<product type> <industry> <style keywords>" --design-system -p "<Project Name>" -f markdown
python3 ~/.codex/skills/ui-ux-pro-max/scripts/search.py "<style query>" --domain style -n 6
python3 ~/.codex/skills/ui-ux-pro-max/scripts/search.py "<ux query>" --domain ux -n 10
python3 ~/.codex/skills/ui-ux-pro-max/scripts/search.py "<color query>" --domain color -n 5
python3 ~/.codex/skills/ui-ux-pro-max/scripts/search.py "<typography query>" --domain typography -n 5
python3 ~/.codex/skills/ui-ux-pro-max/scripts/search.py "<stack query>" --stack <stack> -n 5
```

如果 `ui-ux-pro-max` 未安装、脚本不可执行或 Python 环境不可用，白塔先报告缺失并继续使用本 skill 的质量闸完成设计；不要因为缺少该辅助 skill 就停止整个 UI/UX 流程。

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
4. 如果没有产品需求，停在阶段 1；如果没有界面设计，停在阶段 2；如果没有 `docs/product/TECH.md`、initiative 技术方案或 TODO，停在阶段 3。旧 `docs/architecture.md` / `docs/technical-plan.md` 只能作为 legacy 兼容输入，不作为新版项目主输出。
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

每次执行任务都按这个循环，并持续重复，直到遇到明确人工卡点或确定性阻塞：

1. **Read**：读取 `docs/white-tower/status.md`、`docs/white-tower/stage-gates.md`、`TODO.md`、相关产品需求 / 界面设计 / 架构决策 / workstream 和 `git status`。
2. **Decide**：判断当前阶段、允许动作、禁止动作、下一步最小切片。
3. **Act**：只执行一个阶段内的最小可验证动作。
4. **Verify**：运行白塔自检脚本、仓库既有检查和与改动相关的最小验证。
5. **Checkpoint**：在每个原子动作前后写入可恢复 checkpoint，而不是等本轮结束才记录。
6. **Record**：更新 TODO、workstream、项目状态、architecture-decision、run record 和 task 状态，使下一次会话能从仓库文件恢复。
7. **Report**：只总结已经写入仓库的状态；最终报告不能作为恢复依据。

完成一个 `Act -> Verify -> Checkpoint -> Record` 后，白塔必须立刻重新执行 Read/Decide，继续下一个可推进动作。不要因为完成了 `REVIEW_ITEMS.md`、TODO 更新、状态同步、checkpoint、run record、格式修复、索引重建、自检通过、commit 成功、push 成功、工作树干净或某个 worker / batch / initiative 暂时做完就停止；这些都是中间动作，不是终点。

以下都只是中间 checkpoint，不是自动推进的结束条件：

- 技术方案从 `review` 改成 `approved`。
- initiative、TODO、状态文件或索引已经同步。
- 验证命令通过。
- commit 成功。
- push 成功。
- 工作树变干净。
- 某一批 planned / review initiative 处理完成。
- 某一个 active task、worker 或 dispatch batch 完成。
- 当前批次没有创建新的 active slice。

白塔没有 “end-of-run” 结束姿态。只要还有下一项可推进工作，或者还能把当前工作再切细成更小的可验证 slice，就必须继续 Read/Decide/Act/Verify/Checkpoint/Record。只有在完整扫描当前阶段输入后，确认没有 `pending_review`、没有 planned/review initiative 可推进、没有缺失技术方案/任务拆解/验收记录/发布交接、没有 runnable task、没有可修复检查项，并把“无可推进项”的依据写入 run record 或状态文件后，才可以停下来。

遇到这些结果时，白塔必须继续重新读取仓库状态，寻找下一项可推进工作：下一个 planned/review initiative、下一个缺失 `04-任务拆解.md` 的事项、下一个可切细的 task DAG、下一个可 active 的 initiative、下一个 runnable task、下一个可验证/可反写的验收或发布交接动作；如果当前批次没有新的 active slice，也不是停机条件，而是重新切片的信号。

只有以下情况可以停下来：

- 需要用户确认 PRD / 产品范围 / 优先级 / 非目标。
- 需要用户确认产品级 UI/UX 风格或某张已生成的 UI/UX 图片；此时必须发送图片并把状态写为 `pending_review`。
- 需要用户在多个 UI/UX 方向、重大架构、破坏性数据迁移、外部服务、付费能力或删除用户已有改动之间做取舍。
- 确定性检查失败，且白塔无法在当前允许范围内自动修复。
- 工具、权限、网络、依赖安装、上下文容量或运行环境限制导致无法继续。
- 完整扫描当前阶段输入后，确认没有 `pending_review`、没有 planned/review initiative 可推进、没有缺失技术方案/任务拆解/验收记录/发布交接、没有 runnable task、没有可修复检查项，并把“无可推进项”的依据写入 run record 或状态文件。

如果循环中发现阶段不满足，白塔不要停止在“下一步是补齐 X”的报告上；应自动补齐当前阶段允许补齐的必要产物。只有补齐动作触发上面的人工卡点或阻塞时才停。不要把“计划已确认、文档已同步、任务已切完、代码已提交、推送完成、tree clean”误判成结束。

UI/UX-first 项目的连续推进规则：

- 如果存在 `pending_review`，立即重发图片并等待用户确认。
- 如果 `pending_review` 为空但存在 `planned_review` 或 `docs/uiux/REVIEW_ITEMS.md` 中的 `planned` 项，继续生成下一个 UI/UX 草案、源文件和可预览图片。
- 生成图片后，更新 review 状态为 `pending_review`，在对话中展示图片，然后停在用户确认卡点。
- 不要停在“已规划 review items，下一步生成 UIR-001”这种中间状态。

### Initiative 自动审查推进

当用户要求“审查并推进需求单”“推进需求单”“批量推进技术方案”或 TODO 指向 `docs/initiatives/planned/` 时，白塔必须把它当作自动化治理任务，而不是人工待办清单。

执行顺序：

1. 读取 `TODO.md`、`docs/initiatives/README.md`、`docs/white-tower/status.md`、所有 `docs/initiatives/<planned|active>/*/00-meta.md`、`01-需求文档.md`、`02-界面设计.md`、`03-技术方案.md`、`04-任务拆解.md`。
2. 运行存在的确定性检查：`node scripts/check-stage-gate.mjs`、`node scripts/check-initiative-package.mjs`，以及必要的 Markdown 链接 / 图片存在性检查。
3. 对每个 initiative 自动判断：
   - 必需文件是否存在。
   - `00-meta.md` 的 `status` 是否和外部目录一致，`lifecycle_state` 是否合理。
   - `02-界面设计.md` 是否遵守已确认的产品级 UI/UX 风格、是否有可点击引用和内嵌预览图；缺失时白塔自动设计、导出或补齐，不先要求用户手动提供。
   - `03-技术方案.md` 是否包含必填章节、UI 与数据分离约束、影响范围、数据结构、状态流、错误处理、测试策略、兼容和回滚。
   - `plan_status=draft` 是否已经具备进入 `review` 的客观条件。
   - `04-任务拆解.md` 是否声明 `source_plan_sections`、交付物、验收切片、允许路径、阻塞路径、验证命令、依赖和目标分支。
4. 能确定修复的格式、链接、状态同步、索引、TODO 勾选和 `lifecycle_state` 变更，白塔直接修改仓库文件。
5. 只有以下情况需要用户判断：
   - 产品范围或优先级冲突。
   - UI/UX 方向需要取舍。
   - 技术方案存在多种高影响架构选择。
   - 会删除、重写或回滚用户已有改动。
   - 需要新增重大依赖、账号、服务端、云同步、公网访问或付费服务。
6. 完成后重新运行检查，更新 `TODO.md`、`docs/initiatives/README.md` 和相关 `00-meta.md` / `04-任务拆解.md`。

自动状态推进规则：

- 如果 PRD 和产品级 UI/UX 已确认，但 initiative 缺少 `02-界面设计.md` 或设计资产，白塔先自动生成需求级 UI/UX 草稿和预览图，并把 review item 记录为 `pending_review`。
- 需求级 UI/UX 草稿完成后，白塔必须在对话中发送可预览图片给用户确认。用户明确确认前，只能继续准备不依赖 UI/UX 批准的草案资料，不得批准技术方案、推进 initiative 生命周期或执行源码 dispatch。
- `plan_status=draft` 且必填章节完整、无明显占位、能约束实现、未解决问题不阻塞评审时，白塔可改为 `plan_status=review`。
- `plan_status=review` 只有在用户或明确的评审记录批准后才能改为 `approved`。
- 把一个或多个 `03-技术方案.md` 改成 `approved` 后，白塔不得停止；必须继续检查对应 initiative 是否已有可执行 `04-任务拆解.md`、allowed paths、blocked paths、verification、checkpoint 约定和 task DAG。缺失时自动补齐，满足条件时继续推进到可 dispatch 状态。
- 外部目录只使用 `planned/active/done/archived/`。准备、评审、暂停、阻塞等细状态写入 `lifecycle_state`，不要新建细状态目录。
- 从 `planned/` 移到 `active/` 前，必须已有可执行任务、允许路径、阻塞路径、验证命令和恢复 checkpoint 约定。
- 从 `active/` 移到 `done/` 前，必须有验收记录、验证结果和全局产品文档反写。

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

`07_runs/*.md`、`07_runs/latest.md` 和 `08_checkpoints/*.md` 的顶部元信息必须用 Markdown 预览友好的结构，不得把裸 `key: value` 连续写成普通段落。推荐格式：

````markdown
# UI/UX Checkpoint

## Metadata

```yaml
checkpoint_id: 2026-06-23T163711+0800-after-verify
run_id: 2026-06-23T163111+0800-generate-uir-001
phase: uiux-draft-generation
task: UIR-001
branch: main
head_commit: c56c452
verification_after_latest_diff: true
```
````

如果不用 fenced `yaml`，也必须使用 Markdown 列表或表格。不要使用这种会在预览中挤成一行的格式：

```text
checkpoint_id: ... run_id: ... phase: ... task: ...
```

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
   - 如果存在 `docs/uiux/REVIEW_STATUS.md` 或 initiative run record 中有 `pending_review` UI/UX，先在对话中重发图片并等待用户确认，不要继续源码 dispatch。
   - 只有 `gate_mode=development` 或项目状态明确允许源码实现时，白塔才执行编码任务。
   - 如果当前不允许源码实现，但存在 planned / active initiatives，自动转入 Initiative 自动审查推进流程。
   - 如果当前不允许源码实现且没有 initiative，自动补齐当前阶段缺失文档和 TODO。
   - 面向用户的回复必须给“白塔将自动执行的下一步”，不要只输出 blocked_actions、内部状态或让用户手动切换阶段。
3. **选择 runnable tasks**：
   - 只从可运行实现通道里选任务：`docs/initiatives/active/**/04-任务拆解.md` 或 legacy `docs/workstreams/active/**`。
   - `active` 表示“当前允许实施的执行通道”，不是“所有已经规划好的需求”。不要为了显示并发，把所有 `planned` / `review` initiative 都移动到 `active`。
   - `planned` / `review` initiative 可以继续由白塔并行做需求级 UI/UX、技术方案、任务拆解、引用图片和格式修复；但它们不是源码实现 worker 的输入。
   - 任务自身 `status=planned` 或等价未开始状态。
   - `depends_on` 全部完成或为 `none`。
   - `source_plan_sections` 能在 `03-技术方案.md` 中找到。
   - `allowed_paths`、`blocked_paths`、`verification`、`merge_target` 均已声明。
   - `can_parallel=true` 且 `allowed_paths` 不与其他并发任务冲突时才可并发。
   - `conflict_risk=high`、`contract_changes != none` 或涉及 shared schema / router / migration 的任务顺序执行。
   - 如果发现 `04-任务拆解.md` 只有一个大任务，或所有任务被不必要地串成 `TASK-001A -> TASK-002A -> TASK-003A`，先自动重写为分层细粒度 DAG，再 dispatch。
   - 页面、Tab、空状态、局部 ViewModel、领域纯模型、UI token、测试夹具等路径不重叠的切片应优先并行；共享入口、路由、manifest、公共契约和最终集成才顺序执行。
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
   - 每个任务完成并写回状态后，白塔必须重新计算 task DAG：解除依赖后，把所有 `depends_on` 已满足、`can_parallel=true`、`allowed_paths` 不冲突、`blocked_paths` 不相互踩踏、`conflict_risk != high`、`contract_changes=none` 的任务继续派发，直到达到 `max_parallel` 或没有 runnable tasks。
   - 如果当前只有一个任务满足 runnable 条件，就执行这一个；不要要求用户解释为什么其他 initiative 仍在 `planned` 或 `review`。
   - 最后由主控整合结果，更新 `04-任务拆解.md`、`05-验收记录.md` 和必要全局文档。

用户引导规则：

- 不要让用户判断 `bootstrap`、`source-locked`、`development` 的含义。
- 不要让用户手动编辑 `current_stage`、`gate_mode`、`status` 或 `lifecycle_state`。
- 不要把多条候选命令丢给用户选择。
- 如果不能编码，直接说明白塔会先做哪个前置动作，例如“我先自动审查 planned 需求单，把可进入 review 的技术方案推进，并找出首个可 active 的 initiative。”
- 如果某个 active/review 任务不涉及产品范围、全局 UI/UX、重大架构、破坏性迁移、外部服务、付费能力或删除用户改动，白塔不要要求用户手动批准状态推进。
- 只有涉及产品范围、设计取舍、重大架构选择、破坏性删除或外部服务时，才向用户提问。

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
- create-tech-overview
- create-todo
- create-adr

blocked_actions:
- initialize-app-code
- implement-feature
- add-runtime-dependency

gate_to_next_stage:
- docs/product/TECH.md exists
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
- 如果白塔试图进入正式开发或当前状态已标记为阶段 4 以后，但 `docs/product/TECH.md`、`TODO.md` 或 architecture-decision 缺失，自检失败。旧 `docs/architecture.md` / `docs/technical-plan.md` 可以让旧项目兼容通过，但检查输出不得建议新建旧路径。
- 输出清楚的阻塞原因和下一步应补的文档。

示例伪逻辑：

```text
if current_stage < 4-正式开发:
  block new app source roots, package manifests, Xcode projects, runtime dependencies, feature code

if current_stage == 3-准备开发:
  require TODO.md
  allow docs/product/TECH.md, initiative technical plans, TODO, architecture-decisions, gate docs, check scripts
  block source roots and runtime dependencies

if current_stage >= 4-正式开发:
  require docs/product/TECH.md or legacy docs/architecture.md / docs/technical-plan.md
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
- `04-任务拆解.md` 默认必须细拆到“一个 agent 能稳定完成的最小验证切片”。优先按层拆分：工程/包骨架、UI token、领域模型、数据接口、单页面或单 Tab、单个 ViewModel、状态集成、验收记录。
- 不要把“首页框架、启动页、相册页、导入页、领域校验、存储实现”合成一个任务；这类任务应拆成多个 `TASK-*`，并用 `depends_on` 表达最小依赖。
- 拆任务时先找可并行层：例如首页 Tab 壳完成后，首页、相册页、导入页等 Tab 页面只要 `allowed_paths` 不重叠就应该并行；不要因为它们属于同一个 initiative 就串行。
- 每个任务的 `allowed_paths` 应尽量窄，指向具体 package、feature、page、test 或文档；只有工程 manifest、路由入口、公共契约和集成验收任务允许较宽路径。

### Initiative 模型

同一个交付事项的产品、界面、技术、任务、验收和发布交接必须放在同一个 initiative 包里，避免 PRD、界面设计、技术方案分散后失去关联。

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
└── 06-发布交接.md
```

目录命名推荐：

- initiative 目录是给人读的，推荐使用 `<三位数字>_<中文短标题>`，例如 `001_管理目录初始化与空图库壳`。
- 目录 ID 必须和 `00-meta.md` 中的 `initiative_id` 一致。
- 中文短标题保持清晰、稳定、可扫描；避免过长句子、标点堆叠和临时口语。
- Git 分支仍使用英文 slug，例如 `feat_001_foundation_library_shell`。不要把中文目录名同步到分支名，避免 shell、CI、远端分支、多 agent 工具和脚本兼容问题。
- `docs/initiatives/README.md`、`TODO.md` 和其他文档引用必须使用中文目录名的真实路径。

`02-界面设计.md` 不能只写裸路径或只有“设计依据”。必须同时提供可点击引用和可预览图片：

- 设计依据使用 Markdown 链接，例如 `[信息架构与页面清单](../../../uiux/02-信息架构与页面清单.md)`。
- 样张必须同时列出源文件链接和图片链接；如果已有 PNG/JPG/WebP，必须用 `![说明](相对路径)` 直接嵌入。
- 如果只有 HTML/Figma/外部原型，没有可预览图片，先导出或截图到仓库内稳定路径，再嵌入图片；不要让读者只能复制路径跳转。
- 图片路径使用相对于当前 `02-界面设计.md` 的路径，并在提交前验证文件真实存在。
- 页面图要覆盖关键页面、核心状态、异常态和危险态；不足的图要在文档中明确标记为待补，不要假装已覆盖。

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
- 阶段 4 或 `gate_mode=development` 后，白塔自己的源码改动必须命中至少一个 active gate 的 `allowed_paths`：新版项目优先读取 `docs/initiatives/active/**/04-任务拆解.md`，legacy 项目兼容读取 `docs/workstreams/active/**` 或 `status=active` workstream。
- 门禁脚本必须把 `docs/initiatives/active/**/04-任务拆解.md` 中的每个 `TASK-*` 当成独立 gate，分别读取该任务的 `allowed_paths:` 和 `blocked_paths:` 字段列表；不要把同一 initiative 所有任务的 blocked paths 合并成一个大黑名单，否则任务 A 的限制会误拦任务 B 的合法路径。只检查旧 `docs/workstreams/active` 或只找 `## allowed_paths` 标题会导致新版 initiative 项目误报“没有 active workstream”或路径未命中。
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
- 每个 initiative 的 `02-界面设计.md` 都必须引用相关规范、HTML/Figma/原型源文件，并直接嵌入可预览 PNG/JPG/WebP 图片。

白塔自检：

- UI 原型不是为了好看，而是让 coding agent 看懂产品逻辑、布局优先级、文案语气和边界状态。
- 如果原型暴露需求缺失或流程不顺，回到 PRD。
- 除非用户明确改 scope，否则不要让视觉探索覆盖产品范围。

### 3. 准备开发：先固化 `docs/`

目标：在源码实现前，建立能约束开发的耐久上下文。

创建或更新核心文档：

- `docs/prd/`：产品定位、用户痛点、MVP、页面清单、核心流程、验收标准。
- `docs/uiux/`：主题、组件规则、关键交互、加载/空/错误状态。
- `docs/product/TECH.md`：技术栈、目录结构、模块边界、数据模型、服务边界、AI 引用机制、开发约束、不变量、禁止破坏的逻辑、验收标准。
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

- `docs/product/TECH.md` 反映当前实现。
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
- 部署前跳过 README/技术总览清理。

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
