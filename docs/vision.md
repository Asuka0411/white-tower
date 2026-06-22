# 白塔协议 Vision

白塔协议的目标是把 AI 辅助开发升级为可治理的产品交付 SOP：先把需求讨论清楚，再按标准文档、界面设计、技术方案、任务拆解、并行开发、验证、发布交接逐步推进。

## 目标形态

```text
需求讨论
 -> 需求定稿
 -> 需求包落档
 -> 界面设计
 -> 原型 / 高保真 / 交互 / 动效
 -> 技术方案
 -> 任务拆解 / 排期 / 依赖图
 -> Gitflow 多 agent 并行开发
 -> 单测 / 验证 / 合并 / 提交
 -> 总 PRD / UI / TECH 反写
 -> 发布 / 部署 / 交接
```

## 文档组织原则

同一个需求的产品、界面、技术、任务和验收文档必须放在同一个需求包内，避免 PRD、UI、技术方案分散在不同目录后失去关联。

同时保留全局汇总文档：

```text
docs/product/PRD.md     # 当前产品完整事实
docs/product/UI.md      # 当前界面规范、页面索引、交互事实
docs/product/TECH.md    # 当前技术总览、模块边界、质量命令
docs/adr/               # 全局架构决策记录
```

需求包按时间和状态组织：

```text
docs/requirements/
└── 2026/
    └── Q3/
        ├── planned/
        ├── in-progress/
        ├── completed/
        └── archived/
```

单个需求包结构：

```text
docs/requirements/2026/Q3/in-progress/012_import_folder/
├── 00-meta.md
├── 01-需求文档.md
├── 02-界面设计.md
├── 02-assets/
│   ├── wireframe.png
│   └── hifi.png
├── 03-技术方案.md
├── 04-任务拆解.md
├── 05-验收记录.md
└── 06-发布交接.md
```

## 需求讨论阶段

可以接入需求讨论插件或专门的需求澄清 agent。该阶段目标不是产出代码，而是消除偏差。

必须沉淀：

- 用户目标
- 背景问题
- 用户流程
- 范围和非目标
- 验收标准
- 冲突点
- 未决问题
- 人工确认记录

如果仍有核心歧义，不能进入界面设计。

## 需求包阶段

需求定稿后，创建需求包。需求包必须有稳定 ID，例如 `012`，并在所有文档、任务、分支、提交记录中保持一致。

`00-meta.md` 必须记录：

- requirement_id
- title
- status
- owner
- priority
- created_at
- target_release
- source_discussion
- human_review_required
- linked_branches

## 界面设计阶段

界面设计写在需求包内的 `02-界面设计.md`，与该需求的 PRD、技术方案和任务拆解放在一起。

必须覆盖：

- 页面清单
- 用户流程
- 页面跳转
- 低保真原型
- 高保真图
- 组件状态
- 加载、空、错误、禁用状态
- 交互说明
- 动效说明
- 与现有项目风格的对齐点

图片、截图、原型导出文件放在 `02-assets/`。

如果该需求改变了产品级界面规范，完成后必须反写 `docs/product/UI.md`。

## 技术方案阶段

技术方案写在需求包内的 `03-技术方案.md`，不要和其他需求混在一个大文件里。

必须覆盖：

- 当前代码风格和目录约束
- 影响模块
- 数据结构
- API 或函数边界
- 状态流
- 错误处理
- 测试策略
- 兼容性和迁移
- 风险和回滚

如果技术方案涉及长期架构取舍，必须新增或更新 `docs/adr/*.md`。

如果该需求改变了项目技术事实，完成后必须反写 `docs/product/TECH.md`。

## 任务拆解阶段

任务拆解写在 `04-任务拆解.md`。任务不是普通 TODO，而是可执行 DAG。

每个任务必须包含：

- task_id
- title
- branch
- agent
- status
- depends_on
- can_parallel
- allowed_paths
- blocked_paths
- verification
- merge_target
- conflict_risk
- commit_policy

没有 `allowed_paths`、`verification`、`depends_on` 的任务不能派给 agent。

## Gitflow 和分支命名

采用 Gitflow：

```text
main
develop
release_2026q3_001
hotfix_018_login_crash
feat_012_import_folder
feat_012_scan_diff
fix_012_scan_error
```

分支命名规则：

```text
<type>_<id>_<short_name>
```

规则：

- ID 不加 `REQ` 前缀。
- 全部小写。
- 统一使用下划线 `_`。
- 不使用短横线 `-`。
- `type` 仅允许 `feat`、`fix`、`hotfix`、`release`。
- `id` 必须对应需求包 ID 或发布编号。
- `short_name` 应简短表达任务内容。

## 多 agent 并行开发

多 agent 只能从 `04-任务拆解.md` 中领取任务。每个 agent 必须遵守任务的 `allowed_paths` 和 `blocked_paths`。

并行规则：

- 无前置依赖的任务可以并行。
- 有 `depends_on` 的任务必须等前置任务完成和合并。
- 合并顺序按依赖图，不按完成时间。
- 共享契约、数据模型、路由、核心架构变更必须先有 ADR 或任务级冲突声明。
- 每个任务完成后必须更新任务状态和验收记录。

任务完成标准：

- 代码实现完成。
- 单测或指定验证命令通过。
- 相关文档已更新。
- `04-任务拆解.md` 状态已更新。
- `05-验收记录.md` 写入验证结果。
- 分支合并到目标分支。

## 反写规则

需求完成后不能只移动到 `completed/`。必须反写全局事实：

- 产品能力变化反写 `docs/product/PRD.md`。
- 页面、交互、视觉规范变化反写 `docs/product/UI.md`。
- 技术结构、命令、模块边界变化反写 `docs/product/TECH.md`。
- 架构取舍变化反写 `docs/adr/*.md`。

如果需求被放弃或过期，移动到 `archived/`，并写明归档原因，不进入全局当前事实。

## 人工确认点

这些阶段默认需要用户过目：

- 需求定稿
- 界面设计确认
- 技术方案确认
- 任务拆解和排期确认
- 发布前确认

用户明确授权后，可以降低确认频率，但不能跳过记录。

## CLI 未来命令

```bash
white-tower init
white-tower adopt
white-tower request create 012_import_folder
white-tower request audit
white-tower task plan
white-tower task check
white-tower branch check
white-tower check --staged
white-tower release check
```

CLI 负责确定性检查，不负责替代用户做产品判断。

当前原型脚本：

```bash
node templates/scripts/check-stage-gate.mjs
node templates/scripts/check-requirement-package.mjs <project> --branch=feat_012_import_folder
```
