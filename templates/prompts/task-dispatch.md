# White Tower Task Dispatch Prompt

Use this prompt inside a project that has White Tower workstreams or requirement packages.

```text
Use $white-tower dispatch max_parallel=2

自动完成：
1. 读取 docs/white-tower/status.md、stage-gates、TODO、workstreams、需求包 03/04。
2. 运行可用门禁脚本。
3. 判断当前是否允许编码。
4. 找出 runnable tasks。
5. 根据当前环境选择 Codex 多 agent、OMP task 或顺序 fallback。
6. 如果可并行任务存在，直接开始派发 worker。
7. 每个 worker 只改自己的 allowed_paths，完成后运行 verification。
8. 主控做 spec review、quality review 和最终整合。
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

The dispatcher must stop instead of coding when stage gates fail, no runnable tasks exist, or task write scopes conflict.
