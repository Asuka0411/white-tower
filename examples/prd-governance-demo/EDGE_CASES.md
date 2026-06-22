# PRD Governance Edge Cases

这个实验用 `scripts/check-prd-governance.mjs` 检查 PRD、需求档案、workstream 和项目状态之间的关系。

运行：

```bash
node examples/prd-governance-demo/scripts/check-prd-governance.mjs examples/prd-governance-demo
node examples/prd-governance-demo/scripts/run-edge-cases.mjs
```

## 已覆盖场景

- baseline 示例应通过。
- `in-progress` 需求没有 `related_workstream` 应失败。
- `completed` 需求没有 `prd_backfilled: true` 应失败。
- `archived` 需求被总 PRD 引用应失败。
- `planned` 需求提前绑定 workstream 应失败。
- active workstream 指向 planned request 应失败。
- `docs/project-status.md` 的 `current_focus` 指向不存在文件应失败。
- 需求声明的 `status` 和所在状态目录不一致应失败。
- `in-progress` 需求缺少验收标准应失败。
- in-progress 需求绑定的 workstream 不是 active 应失败。
- active workstream 缺少 allowed paths 应失败。
- active workstream 缺少 verification commands 应失败。

## 已发现的边界坑

1. 空字段误读：
   `related_workstream:` 这种空值字段不能用宽松正则解析，否则会把下一行标题误读为字段值。

2. 字段列表误读：
   `current_focus:` 是 YAML-like 字段列表，不是 markdown heading，不能用 `## current_focus` 的方式解析。

## 设计结论

- CLI 不能只看文件是否存在，必须校验文档之间的互相引用。
- 总 PRD 和需求档案要分责：总 PRD 是当前事实，需求档案是生命周期记录。
- 老项目接入时，项目级可以处于正式开发，但新需求必须通过 request + workstream 控制改动边界。
- completed / archived 的语义必须被检查，否则总 PRD 很容易漂移。
