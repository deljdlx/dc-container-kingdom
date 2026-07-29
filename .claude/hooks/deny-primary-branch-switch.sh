#!/usr/bin/env bash
# PreToolUse/Bash hook — block branch switches on the primary working tree.
#
# Rule enforced: no `git checkout <branch>` / `git switch <branch>` from the
# primary tree. Worktree branches remain unaffected.
set -u

payload=$(cat)
command=$(printf '%s' "$payload" | jq -r '.tool_input.command // empty') || exit 0
[ -n "$command" ] || exit 0

abstain() { exit 0; }

deny() {
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"interdit: changer la branche du tree principal"}}\n'
  exit 0
}

trim() {
  local s="$1"
  s="${s#"${s%%[![:space:]]*}"}"
  s="${s%"${s##*[![:space:]]}"}"
  printf '%s' "$s"
}

strip_quotes() {
  local s="$1"
  case "$s" in
    "\""*"\"") s=${s#\"}; s=${s%\"} ;;
    "'"*"'") s=${s#\'}; s=${s%\'} ;;
  esac
  printf '%s' "$s"
}

contains_checkout_or_switch() {
  case "$1" in
    *"git checkout "*|*"git switch "*) return 0 ;;
    *) return 1 ;;
  esac
}

is_safe_checkout_form() {
  local cmd="$1"
  case "$cmd" in
    *"git checkout --detach"*|*"git switch --detach"*|*"git checkout -- "*) return 0 ;;
    *) return 1 ;;
  esac
}

resolve_target_dir() {
  local cmd="$1"
  local base="${CLAUDE_PROJECT_DIR:-$PWD}"
  local prefix
  local dir

  cmd=$(trim "$cmd")
  if [[ "$cmd" == cd*"&&"* ]]; then
    prefix=${cmd%%&&*}
    prefix=$(trim "$prefix")
    prefix=${prefix#cd }
    prefix=$(trim "$prefix")
    dir=$(strip_quotes "$prefix")
    case "$dir" in
      /*) printf '%s' "$dir" ;;
      *) printf '%s' "$base/$dir" ;;
    esac
    return 0
  fi

  printf '%s' "$base"
}

contains_checkout_or_switch "$command" || abstain

target_dir=$(resolve_target_dir "$command")
[ -n "$target_dir" ] || deny
[ -d "$target_dir" ] || deny

common_dir=$(cd "$target_dir" && git rev-parse --git-common-dir 2>/dev/null) || deny
git_dir=$(cd "$target_dir" && git rev-parse --git-dir 2>/dev/null) || deny

common_abs=$(cd "$target_dir" && realpath -m "$common_dir" 2>/dev/null) || deny
git_abs=$(cd "$target_dir" && realpath -m "$git_dir" 2>/dev/null) || deny

# In linked worktrees, git-dir differs from common-dir.
if [ "$common_abs" != "$git_abs" ]; then
  abstain
fi

is_safe_checkout_form "$command" && abstain

deny
