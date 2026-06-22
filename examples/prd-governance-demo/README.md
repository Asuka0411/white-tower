# PRD Governance Demo

这个示例演示老项目接入 `white-tower` 后，如何管理后续多个新需求。

核心结构：

```text
docs/prd/README.md                  # 总 PRD，当前产品完整事实
docs/prd/requests/                  # 需求档案，按时间和状态归档
docs/workstreams/                   # 进入实施后的工程约束
TODO.md                             # 当前最小实现切片
```

示例规则：

- 总 PRD 只记录已经上线或明确成为当前产品事实的能力。
- `planned/` 里的需求只允许做产品需求和界面设计，不允许直接写代码。
- `in-progress/` 的需求必须绑定一个 active workstream。
- `completed/` 的需求必须反写总 PRD。
- `archived/` 的需求保留历史原因，但不进入总 PRD。
