#!/usr/bin/env bash
set -euo pipefail

target="${1:-codex}"

usage() {
  cat <<'EOF'
Usage: update-white-tower.sh [codex|claude|hermes|agents|omp|all]

Environment overrides:
  WHITE_TOWER_CODEX_DIR
  WHITE_TOWER_CLAUDE_DIR
  WHITE_TOWER_HERMES_DIR
  WHITE_TOWER_AGENTS_DIR
  WHITE_TOWER_OMP_DIR
EOF
}

target_path() {
  case "$1" in
    codex) printf '%s\n' "${WHITE_TOWER_CODEX_DIR:-$HOME/.codex/skills/white-tower}" ;;
    claude|claude-code) printf '%s\n' "${WHITE_TOWER_CLAUDE_DIR:-$HOME/.claude/skills/white-tower}" ;;
    hermes) printf '%s\n' "${WHITE_TOWER_HERMES_DIR:-$HOME/.hermes/skills/white-tower}" ;;
    agents) printf '%s\n' "${WHITE_TOWER_AGENTS_DIR:-$HOME/.agents/skills/white-tower}" ;;
    omp) printf '%s\n' "${WHITE_TOWER_OMP_DIR:-$HOME/Documents/AgentSkills/white-tower}" ;;
    *) return 1 ;;
  esac
}

update_one() {
  local name="$1"
  local required="${2:-required}"
  local skill_dir
  if ! skill_dir="$(target_path "$name")"; then
    echo "Unknown target: $name" >&2
    usage >&2
    return 1
  fi

  if [ ! -d "$skill_dir/.git" ]; then
    if [ "$required" = "optional" ]; then
      echo "Skipped $name: White Tower is not installed as a git clone at $skill_dir"
      return 0
    fi
    echo "White Tower is not installed as a git clone for $name: $skill_dir" >&2
    echo "Install it with:" >&2
    echo "  bash scripts/install-white-tower.sh $name" >&2
    return 1
  fi

  if [ -n "$(git -C "$skill_dir" status --short)" ]; then
    echo "White Tower install has local changes for $name. Refusing to pull." >&2
    git -C "$skill_dir" status --short >&2
    return 1
  fi

  git -C "$skill_dir" pull --ff-only

  echo
  echo "White Tower skill version for $name:"
  sed -n '1,12p' "$skill_dir/SKILL.md"
}

if [ "$target" = "all" ]; then
  failures=0
  for name in codex claude hermes agents omp; do
    if ! update_one "$name" optional; then
      failures=$((failures + 1))
    fi
  done
  if [ "$failures" -gt 0 ]; then
    echo "Update finished with $failures failure(s)." >&2
    exit 1
  fi
else
  update_one "$target"
fi

echo
echo "Update complete. Start new agent sessions to reload skill lists."
