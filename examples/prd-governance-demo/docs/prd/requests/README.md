# 需求档案

需求档案按年份、季度和状态管理。

```text
docs/prd/requests/
└── 2026/
    ├── Q2/
    │   ├── completed/
    │   └── archived/
    └── Q3/
        ├── planned/
        └── in-progress/
```

状态含义：

- `planned`：计划中。可以补产品需求、界面设计和技术方案，不允许直接实现。
- `in-progress`：实施中。必须绑定 active workstream 和 TODO 切片。
- `completed`：已完成。必须已经反写总 PRD，并保留验证记录。
- `archived`：已归档。保留历史原因，不进入总 PRD 当前事实。
