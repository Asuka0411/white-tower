#!/usr/bin/env bash
set -euo pipefail

repo_url="${WHITE_TOWER_REPO_URL:-https://github.com/Asuka0411/white-tower.git}"
target="${1:-codex}"

usage() {
  cat <<'EOF'
Usage: install-white-tower.sh [codex|claude|hermes|agents|omp|all]

Environment overrides:
  WHITE_TOWER_REPO_URL
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

install_one() {
  local name="$1"
  local path
  if ! path="$(target_path "$name")"; then
    echo "Unknown target: $name" >&2
    usage >&2
    return 1
  fi

  mkdir -p "$(dirname "$path")"

  if [ -e "$path" ] && [ ! -d "$path/.git" ]; then
    echo "Refusing to overwrite non-git install at $path" >&2
    return 1
  fi

  if [ -d "$path/.git" ]; then
    if [ -n "$(git -C "$path" status --short)" ]; then
      echo "Refusing to update dirty install at $path" >&2
      git -C "$path" status --short >&2
      return 1
    fi
    git -C "$path" pull --ff-only
  else
    git clone "$repo_url" "$path"
  fi

  echo "Installed $name -> $path"
}

if [ "$target" = "all" ]; then
  failures=0
  for name in codex claude hermes agents omp; do
    if ! install_one "$name"; then
      failures=$((failures + 1))
    fi
  done
  if [ "$failures" -gt 0 ]; then
    echo "Install finished with $failures failure(s)." >&2
    exit 1
  fi
else
  install_one "$target"
fi
