# White Tower Task Dispatch Prompt

Use this prompt inside a project that has a White Tower task pool or work item packages.

```text
Use $white-tower dispatch max_parallel=2

自动完成：
1. 扫描 git status、TODO、docs/product、docs/work-items 和白塔状态文件。
2. 运行可用自检脚本。
3. 先处理 pending_review；需要用户确认图片或产品决策时发送证据后停。
4. 根据任务类型、优先级、状态、依赖、allowed_paths、blocked_paths、conflict_risk 和 contract_changes 找出 runnable tasks。
5. 如果任务过粗，先自动重写为细粒度 DAG。
6. 根据当前环境选择 Codex 多 agent、OMP task 或顺序 fallback。
7. 如果可并行任务存在，直接开始派发 worker；没有多 agent 工具时顺序执行。
8. 每个 worker 只改自己的 allowed_paths，完成后运行 verification。
9. 主控做 spec review、quality review、状态回写、commit/merge/release 判断和归档扫尾。
10. 一轮结束后重新扫描任务池，继续下一个 runnable task。
```

Optional arguments:

```text
max_parallel=2
executor=auto|codex|omp|sequential
require_review=true
allow_dirty=false
```

Default behavior:

- `max_parallel=2`
- `executor=auto`
- `require_review=true`
- `allow_dirty=false`

The dispatcher must not stop merely because coding is not currently allowed. If no source task is runnable, it should automatically prepare the next required artifact: PRD, UI/UX review image, technical plan, task DAG, verification, acceptance record, release handoff, or archive sweep. Stop only for explicit human confirmation gates, unrecoverable tool/environment limits, destructive or high-impact decisions, unfixable verification failures, or a full scan proving no task can be generated, refined, executed, verified, archived, or swept.
