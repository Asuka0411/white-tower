# Workstreams

Workstreams describe requirement-level implementation boundaries.

Workstreams are grouped by lifecycle state:

```text
docs/workstreams/
├── draft/
├── ready/
├── active/
├── blocked/
├── done/
└── archived/
```

State rules:

- `draft/`: requirement or technical boundary is still being prepared.
- `ready/`: ready to execute after the project enters development mode.
- `active/`: can receive implementation changes now.
- `blocked/`: waiting on dependency, decision, or external input.
- `done/`: completed; keep the final record here, not in the active queue.
- `archived/`: abandoned or obsolete; include the archive reason.

Do not leave completed or archived workstreams at the top level. The top-level
directory should only contain this README, the template, and state directories.

Each active workstream should answer:

- What requirement or product flow this workstream serves.
- Which files or paths it may change.
- Which files or paths are blocked.
- What dependencies or architecture decisions it relies on.
- How the workstream is verified.

Use `template.md` to start a new workstream, then place the copied file under
the matching state directory, for example `docs/workstreams/draft/012_import_folder.md`.
