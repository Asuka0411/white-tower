# White Tower Adapters

White Tower can be installed into multiple agent ecosystems. Each tool has its own skill/plugin discovery path, so installing it for Codex does not automatically make it visible to Claude Code, Hermes, OMP, or other agents.

## Targets

| Target | Install path | Notes |
| --- | --- | --- |
| `codex` | `~/.codex/skills/white-tower` | Codex skill directory. |
| `claude` | `~/.claude/skills/white-tower` | Claude Code has a local `skills` directory and resolves skills by name in sessions. |
| `hermes` | `~/.hermes/skills/white-tower` | Hermes also has `hermes skills` management commands; this path is the local profile skill directory. |
| `agents` | `~/.agents/skills/white-tower` | Shared local agents skill directory used by several local tools. |
| `omp` | `~/Documents/AgentSkills/white-tower` | OMP-visible skill directory candidate on this machine. Verify OMP discovery if a profile overrides skills paths. |

## Install

```bash
bash scripts/install-white-tower.sh all
bash scripts/install-white-tower.sh codex
bash scripts/install-white-tower.sh claude
bash scripts/install-white-tower.sh hermes
bash scripts/install-white-tower.sh agents
bash scripts/install-white-tower.sh omp
```

## Update

```bash
bash scripts/update-white-tower.sh codex
bash scripts/update-white-tower.sh all
```

`update-white-tower.sh all` updates installed git clones and skips targets that are not installed yet. Dirty installs still fail so local edits are not overwritten by accident.

## Path Overrides

```bash
WHITE_TOWER_CODEX_DIR=/custom/codex/white-tower bash scripts/install-white-tower.sh codex
WHITE_TOWER_OMP_DIR=/custom/omp/white-tower bash scripts/update-white-tower.sh omp
```

Both scripts install from:

```text
https://github.com/Asuka0411/white-tower.git
```

The scripts refuse to overwrite non-git directories and refuse to update dirty git clones.

## Caveats

- Different tools may interpret `SKILL.md` differently.
- Some tools may require a new session, reload, skill audit, or profile refresh before the new skill is visible.
- The shared White Tower content is source-compatible, but tool-specific behavior may still need adapters later.
