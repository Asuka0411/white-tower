# Workstream: 导入文件夹增量扫描

workstream_id: import-folder
status: active
stage_id: 4
stage_name: 正式开发
prd_request: docs/prd/requests/2026/Q3/in-progress/import-folder.md

## Purpose

实现已接入目录的增量扫描能力。

## Inputs

- product requirements: `docs/prd/requests/2026/Q3/in-progress/import-folder.md`
- interface design: `docs/uiux/import-folder.md`
- technical plan: `docs/technical-plan.md#import-folder`
- architecture decisions: `docs/adr/0002-local-index-strategy.md`

## Allowed Paths

- src/import/**
- src/index/**
- tests/import/**
- docs/prd/README.md
- docs/prd/requests/2026/Q3/in-progress/import-folder.md
- docs/workstreams/import-folder.md
- TODO.md

## Blocked Paths

- src/cloud/**
- src/auth/**
- package.json

## TODO Slices

- [ ] 读取目录快照并计算变化集合。
- [ ] 写入新增和修改文件的索引记录。
- [ ] 将已删除文件标记为 missing。
- [ ] 输出扫描摘要和错误列表。
- [ ] 反写总 PRD。

## Verification

- `npm test -- import`
- `npm run lint`
- `white-tower check --staged`

## Exit Criteria

- PRD request 标记为 completed。
- 总 PRD 已反写增量扫描能力。
- TODO 切片全部完成。
- 验证命令通过。
