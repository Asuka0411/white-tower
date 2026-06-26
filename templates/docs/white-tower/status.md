# White Tower Status

```yaml
task_pool_model: true
status_version: 0.14.0-dev
loop_state: collecting
last_scan_at:
active_run:
pending_human_gate: none
```

## Current Focus

- collect-tasks
- refine-initiatives
- dispatch-runnable-tasks
- verify-and-archive
- sweep-followups

## Allowed Actions

- update-docs
- create-or-update-initiative
- create-uiux-review
- create-technical-plan
- create-task-dag
- dispatch-runnable-task
- verify
- commit-or-merge
- archive
- sweep-followups

## Human Gates

- PRD / product scope
- product-level UI/UX
- UI/UX image review
- major architecture
- destructive migration
- external service
- paid capability
- deleting user work

## Last Scan

- git status:
- pending_review:
- runnable_tasks:
- blocked_tasks:
- next_action:

## Last Verified

- node scripts/check-initiative-package.mjs .
