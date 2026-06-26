# 白塔协议 Vision

白塔的目标是把 AI 辅助开发变成可恢复、可并发、可审计的产品工程 SOP。

它不做阶段门禁平台，也不替代项目管理软件。白塔只负责一条主线：把输入转成任务池，从任务池选择 runnable work，执行并验证，然后继续下一轮。

## 设计边界

- 产品真相必须落在仓库文件里，不能只留在聊天里。
- 同一个交付事项的 PRD、UI/UX、技术方案、任务拆解、验收和发布交接放在同一个 initiative package。
- 白塔只约束显式使用白塔的 agent 自己，不默认限制其他工具或其他人。
- 人工确认只保留在高影响决策上：PRD / 产品范围、产品级 UI/UX、需求级 UI/UX 图片、重大架构、破坏性迁移、外部服务、付费能力和删除用户已有改动。
- 其他可安全推进的工作应该自动循环执行，不停在“已提交”“工作树干净”“本轮完成”。

## 标准目录

```text
docs/product/PRD.md
docs/product/UI.md
docs/product/TECH.md
docs/adr/
docs/gitflow.md
docs/white-tower/status.md
docs/initiatives/planned/
docs/initiatives/active/
docs/initiatives/done/
docs/initiatives/archived/
```

单个 initiative：

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

外部目录只保留 `planned`、`active`、`done`、`archived`。更细的状态写入 `00-meta.md` 的 `lifecycle_state`。

## 执行循环

```text
收集输入
 -> 规范任务
 -> 分类 / 优先级 / 依赖 / 状态
 -> 选择 runnable tasks
 -> 计划 / 技术方案 / 细粒度切片
 -> Gitflow 执行
 -> 验证
 -> 提交 / 合并 / 视情况发布
 -> 归档 / 扫尾
 -> 重新扫描
```

如果没有 runnable source task，白塔不应立即停下。它应先尝试补齐 PRD、UI/UX review、技术方案、任务 DAG、验收记录、发布交接或归档扫尾。

## Gitflow

跨 AI 协作的分支、合并和发布标准统一写入 `docs/gitflow.md`。

默认分支格式：

```text
<type>/<id6>_<YYMMDD>_<short_name>
```

示例：

```text
feature/000012_260626_import_folder
fix/000014_260626_scan_error
release/000001_260626_app_store_beta
hotfix/000018_260626_launch_crash
```

## 质量原则

- 任务要拆到单个 agent 能稳定完成和验证的粒度。
- 可并发页面、Tab、局部 ViewModel、UI token、测试夹具不应被无故串行。
- 共享 schema、路由、manifest、迁移、公共 API、最终集成、release 和 hotfix 默认串行。
- UI 层与数据层默认分离；UI 只负责展示、交互入口和状态渲染。
- 每个任务都要声明 `allowed_paths`、`blocked_paths`、`verification`、`branch` 和 `merge_target`。
- 中断恢复必须依赖 run record、checkpoint、task 状态和 git diff，而不是最终聊天总结。
