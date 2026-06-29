# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

- Require each implementation task to run on its own `feature/*` or `fix/*` branch and merge back to `develop`/`dev`; feature/fix tasks may no longer declare `main` as `merge_target`.
- Require White Tower and all agents following `docs/gitflow.md` to create or switch to a feature/fix branch before editing from `main`, `develop`, `dev`, `release/*`, or `hotfix/*`, unless the user explicitly asks to work there.
- Require every White Tower run to print `white-tower version: <version>` as the first response line.
- Added `docs/gitflow.md` as the project-level Gitflow source of truth and changed branch naming to `<type>/<id6>_<YYMMDD>_<short_name>`.
- Updated branch validation, templates, and demos for `feature/000012_260626_import_folder` style branches.
- Slimmed the White Tower skill into an execution-focused contract, removing migration details from the main skill body and reducing repeated explanatory sections.
- Redefined White Tower around a task generation system and a task selection/execution loop instead of stage gates as the primary model.
- Added task taxonomy for epics, features, changes, bugs, UI/UX, optimizations, refactors, tech debt, tests, infra, releases, docs, research, migrations, cleanup, security, and ops.
- Updated dispatch behavior to scan the task pool continuously, refine coarse DAGs, execute runnable tasks, archive done work, sweep follow-ups, and stop only for human gates or hard blockers.
- Clarified that `继续` is the default autopilot trigger for task-pool projects.
- Clarified that approved technical plans, successful checks, commits, pushes, clean working trees, and completed batches are checkpoints, not autopilot stop conditions.
- Added a `ui-ux-pro-max` priority strategy for UI/UX design research while preserving PRD and page-job override rules.
- Added a UI/UX drawing quality gate for page-job briefs, end-user copy, structural simplification, material revision deltas, and screenshot self-review before user confirmation.
- Simplified 交付项包 folders to `planned/`, `active/`, `done/`, and `archived/`; finer states now live in `00-meta.md` as `lifecycle_state`.
- Renamed the durable package root from the old requirements wording to `docs/work-items/`.
- Removed year/quarter work-item-package folders and period-based workflows.
- Changed phase checks from hard project enforcement to White Tower self-governance by default.
- Added checkpoint-first run recovery rules.
- Removed legacy migration scripts, workstream templates, stage-gate templates, and the old PRD-governance demo from the active repository surface.
- Kept work-item-package validation as the single deterministic checker.
- Added a `dispatch` trigger for automatic environment-aware multi-agent task execution.
- Added a task-dispatch prompt template.
- Added technical-plan governance fields for work item packages.
- Added a default UI/data separation and layer-boundary section to technical planning.
- Added task traceability fields that link tasks back to technical-plan sections.
- Extended the work-item-package checker with technical plan and task contract validation.
- Added work-item-package demo and edge-case checks to CI.
- Added white-tower skill version metadata for cross-project self-checks.
- Namespaced White Tower control files under `docs/white-tower/`.
- Added an installed-skill update script.
- Added multi-target install/update scripts for Codex, Claude Code, Hermes, agents, and OMP.

## 0.1.0 - 2026-06-22

- Initial open-source release.
- Added Codex skill instructions.
- Added OpenAI agent metadata.
- Added repository bootstrap templates.
- Added conservative stage-gate checker template.
