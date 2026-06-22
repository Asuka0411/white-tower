#!/usr/bin/env bash
set -euo pipefail

skill_dir="${WHITE_TOWER_SKILL_DIR:-$HOME/.codex/skills/white-tower}"

if [ ! -d "$skill_dir/.git" ]; then
  echo "White Tower skill is not installed as a git clone: $skill_dir" >&2
  echo "Install it with:" >&2
  echo "  git clone https://github.com/Asuka0411/white-tower.git \"$skill_dir\"" >&2
  exit 1
fi

if [ -n "$(git -C "$skill_dir" status --short)" ]; then
  echo "White Tower skill install has local changes. Refusing to pull." >&2
  git -C "$skill_dir" status --short >&2
  exit 1
fi

git -C "$skill_dir" pull --ff-only

echo
echo "White Tower skill version:"
sed -n '1,12p' "$skill_dir/SKILL.md"
echo
echo "Update complete. Start a new Codex session to reload the skill list."
