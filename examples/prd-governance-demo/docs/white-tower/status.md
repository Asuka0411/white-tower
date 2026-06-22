# Project Status

stage_id: 4
stage_name: 正式开发
gate_mode: development
project_mode: existing-project
baseline_ref: demo-baseline

allowed_actions:
- update-prd
- create-prd-request
- update-workstream
- implement-active-workstream
- update-todo
- update-verification

blocked_actions:
- implement-unplanned-feature
- modify-path-without-active-workstream
- mark-request-completed-without-prd-backfill

current_focus:
- docs/prd/requests/2026/Q3/in-progress/import-folder.md
- docs/workstreams/active/import-folder.md
