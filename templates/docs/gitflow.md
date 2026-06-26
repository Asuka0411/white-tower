# Gitflow Standard

This file is the project-level source of truth for branch, merge, release, and hotfix behavior.

All AI agents and automation must read this file before creating branches, committing, merging, pushing, releasing, or changing task branch metadata. If this file conflicts with agent-global instructions or skill fallback rules, this file wins.

## Branches

- `main`: stable release history.
- `develop`: integration branch for completed feature and fix work.
- `feature/*`: normal feature or task-slice work, branched from `develop`, merged back to `develop`.
- `fix/*`: non-emergency bug work, branched from `develop`, merged back to `develop`.
- `release/*`: release preparation, branched from `develop`, merged to both `main` and `develop`.
- `hotfix/*`: urgent production fix, branched from `main`, merged to both `main` and `develop`.

## Branch Name Pattern

```text
<type>/<id6>_<YYMMDD>_<short_name>
```

Examples:

```text
feature/000001_260626_home_shell
feature/000002_260626_startup_page
fix/000014_260626_import_crash
release/000001_260626_app_store_beta
hotfix/000018_260626_launch_crash
```

Rules:

- `type` must be `feature`, `fix`, `release`, or `hotfix`.
- `id6` must be exactly six digits and should map to the initiative, task, or slice id. Pad with leading zeroes.
- `YYMMDD` is the branch creation date.
- `short_name` uses lowercase English words, numbers, and underscores only.
- Do not use Chinese, spaces, hyphens, uppercase letters, or extra slashes.

## Multi-Agent Safety

- Every implementation task must declare `branch`, `merge_target`, `allowed_paths`, `blocked_paths`, and `verification`.
- Parallel workers must not modify overlapping `allowed_paths`.
- Workers must not modify another worker's `blocked_paths`.
- Shared schema, router, manifest, migration, public API, final integration, release, and hotfix work should run sequentially unless the task explicitly proves it is safe.
- Each task must run its declared verification before status is advanced.

## Merge Targets

- `feature/*` and `fix/*` merge to `develop`.
- `release/*` merges to `main` and back to `develop`.
- `hotfix/*` merges to `main` and back to `develop`.

## Fallback

If a project does not have this file, White Tower may use its built-in fallback pattern:

```text
<type>/<id6>_<YYMMDD>_<short_name>
```
