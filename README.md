# 白塔协议

白塔协议是一个面向 AI 产品工程的轻量 SOP。它只做一件事：把需求、bug、UI/UX、优化、重构、测试、发布和扫尾项沉淀为仓库内可恢复的任务池，然后持续选择 runnable tasks，完成计划、切片、Gitflow 执行、验证、提交、归档和下一轮扫描。

白塔不替用户决定产品方向。默认只在 PRD / 产品范围、产品级 UI/UX、需求级 UI/UX 图片、重大架构、破坏性迁移、外部服务、付费能力和删除用户已有改动时停下确认。其他可安全推进的事情应自动继续。

## 核心能力

- 任务生成：收集需求、bug、截图、日志、测试失败、TODO 和 follow-up。
- 任务选择：按类型、优先级、状态、依赖、路径冲突和人工卡点找 runnable tasks。
- 自动循环：执行、验证、记录、归档、扫尾后继续扫描下一轮。
- 细粒度切片：把大需求拆成可由单个 agent 稳定完成的小 DAG。
- 并发执行：在依赖满足、路径不冲突、契约不变时并发派发。
- Checkpoint-first 恢复：中断后从仓库状态、run record、checkpoint 和 git diff 继续。
- Gitflow 协作：项目级规则写入 `docs/gitflow.md`，供 Codex、OMP 和其他 AI 共同识别。

## 仓库结构

```text
.
├── SKILL.md
├── agents/openai.yaml
├── docs/
│   ├── adapters.md
│   ├── gitflow.md
│   └── vision.md
├── templates/
│   ├── TODO.md
│   ├── docs/gitflow.md
│   ├── docs/product/
│   ├── docs/white-tower/status.md
│   ├── docs/work-items/template/
│   ├── prompts/task-dispatch.md
│   └── scripts/check-work-item-package.mjs
└── examples/work-item-package-demo/
```

## 安装

Codex:

```bash
git clone https://github.com/Asuka0411/white-tower.git ~/.codex/skills/white-tower
```

多工具安装：

```bash
bash scripts/install-white-tower.sh all
bash scripts/install-white-tower.sh codex
bash scripts/install-white-tower.sh agents
bash scripts/install-white-tower.sh omp
```

更新已安装 skill：

```bash
bash scripts/update-white-tower.sh codex
bash scripts/update-white-tower.sh all
```

不同工具的 skill 目录不同，见 `docs/adapters.md`。

## 常用触发

```text
Use $white-tower 我有个需求：<内容>
Use $white-tower 记录 bug：<现象/截图/日志>
Use $white-tower 继续
Use $white-tower 实施计划
Use $white-tower dispatch max_parallel=2
Use $white-tower 审查并推进任务池
```

`继续`、`实施计划`、`dispatch` 都是自动推进触发，不是单纯状态汇报。白塔应在没有人工卡点和硬阻塞时持续循环。

OMP 示例：

```bash
omp --cwd /path/to/project --skills=white-tower "Use $white-tower dispatch max_parallel=2"
```

## 项目接入

在目标项目复制最小模板：

```bash
mkdir -p docs/product docs/white-tower docs/work-items/{planned,active,done,archived} scripts
cp /path/to/white-tower/templates/TODO.md TODO.md
cp /path/to/white-tower/templates/docs/gitflow.md docs/gitflow.md
cp /path/to/white-tower/templates/docs/product/PRD.md docs/product/PRD.md
cp /path/to/white-tower/templates/docs/product/UI.md docs/product/UI.md
cp /path/to/white-tower/templates/docs/product/TECH.md docs/product/TECH.md
cp /path/to/white-tower/templates/docs/white-tower/status.md docs/white-tower/status.md
cp /path/to/white-tower/templates/scripts/check-work-item-package.mjs scripts/check-work-item-package.mjs
node scripts/check-work-item-package.mjs .
```

白塔自己的状态只放在 `docs/white-tower/status.md`。项目任务只放在交付项包；不要再建立额外的任务状态目录。

创建具体交付项时，把 `templates/docs/work-items/template/` 复制到真实状态目录，并替换 ID、标题和分支名：

```bash
cp -R /path/to/white-tower/templates/docs/work-items/template docs/work-items/planned/001_需求标题
```

## 交付项包

```text
docs/work-items/active/012_导入文件夹/
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

外部目录只使用四类状态：

```text
docs/work-items/planned/
docs/work-items/active/
docs/work-items/done/
docs/work-items/archived/
```

细状态写入 `00-meta.md` 的 `lifecycle_state`，例如 `preparing`、`ready`、`review`、`paused`、`blocked`。交付项目录推荐中文名，例如 `001_管理目录初始化与空图库壳`；Git 分支仍使用英文 slug。

## Gitflow

项目级 Gitflow 标准写入 `docs/gitflow.md`。所有 AI 在创建分支、提交、合并、发布前都应先读它。

默认分支格式：

```text
<type>/<id6>_<YYMMDD>_<short_name>
```

示例：

```text
feature/000012_260626_import_folder
fix/000014_260626_import_crash
release/000001_260626_app_store_beta
hotfix/000018_260626_launch_crash
```

## 验证

本仓库当前只保留一个确定性检查脚本：

```bash
node --check templates/scripts/check-work-item-package.mjs
node templates/scripts/check-work-item-package.mjs examples/work-item-package-demo --branch=feature/000012_260626_import_folder
node examples/work-item-package-demo/scripts/run-edge-cases.mjs
git diff --check
```

检查范围包括交付项结构、技术方案状态、迁移等级、任务追溯、分支格式、验收反写和归档原因。

## 适用场景

- 新产品从模糊想法进入可执行任务池。
- 老项目重新整理 PRD、UI/UX、技术方案和任务切片。
- 多 AI / 多 agent 需要统一任务包、路径边界和 Gitflow。
- 长任务需要在 token 限流、IDE 崩溃、断电或 worker 中断后恢复。

## License

MIT License. See [LICENSE](LICENSE).
