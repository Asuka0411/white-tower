# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

- Added a UI/UX drawing quality gate for page-job briefs, end-user copy, structural simplification, material revision deltas, and screenshot self-review before user confirmation.
- Simplified initiative package folders to `planned/`, `active/`, `done/`, and `archived/`; finer states now live in `00-meta.md` as `lifecycle_state`.
- Renamed the durable package root from `docs/requirements/` to `docs/initiatives/`; legacy `docs/requirements/` paths are migrated automatically.
- Removed year/quarter initiative-package folders and the old `--requirements-period` workflow.
- Changed phase checks from hard project enforcement to White Tower self-governance by default.
- Added checkpoint-first run recovery rules.
- Added migration repair for perioded generated initiative packages from older `--create-initiatives` runs.
- Added optional legacy workstream-to-initiative-package generation with `--create-initiatives`.
- Added a legacy migration script for old workstream layouts.
- Added legacy compatibility rules for upgraded skills.
- Added workstream lifecycle directories and rules to prevent completed workstreams from staying in the active queue.
- Added workstream status-directory validation to the PRD governance demo.
- Added a `dispatch` trigger for automatic environment-aware multi-agent task execution.
- Added a task-dispatch prompt template.
- Added technical-plan governance fields for initiative packages.
- Added a default UI/data separation and layer-boundary section to technical planning.
- Added task traceability fields that link tasks back to technical-plan sections.
- Extended the initiative-package checker with technical plan and task contract validation.
- Added initiative-package demo and edge-case checks to CI.
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
