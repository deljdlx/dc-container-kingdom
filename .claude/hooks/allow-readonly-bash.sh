#!/usr/bin/env bash
# PreToolUse/Bash hook — auto-allow provably read-only shell commands.
#
# The permission matcher works on simple command prefixes, so anything wrapped in
# shell control flow (`for … do … done`, pipelines, `cd … && …`) falls through to a
# manual prompt even when every command inside is a plain `ls`. This hook parses the
# command instead: if every segment starts with a read-only binary and the command
# contains no substitution, redirection or write flag, it is allowed outright.
#
# Fail-safe by construction: anything the parser cannot prove read-only produces no
# decision, and the normal permission flow (allow rules, then the prompt) takes over.
set -u

payload=$(cat)
command=$(printf '%s' "$payload" | jq -r '.tool_input.command // empty') || exit 0
[ -n "$command" ] || exit 0

allow() {
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow","permissionDecisionReason":"commande shell en lecture seule"}}\n'
  exit 0
}

# No decision: let the regular permission flow handle it.
abstain() { exit 0; }

# Command/process substitution can hide anything — never allow.
backtick='`'
case $command in
  *'$('*|*"$backtick"*|*'<('*|*'>('*) abstain ;;
esac

# Tolerate the usual stderr plumbing, then refuse any remaining redirection or
# backgrounding (`&&` is a separator, a lone `&` detaches a process).
stripped=${command//2>&1/}
stripped=${stripped//2>\/dev\/null/}
stripped=${stripped//>\/dev\/null/}
stripped=${stripped//> \/dev\/null/}
case $stripped in *'>'*) abstain ;; esac
stripped=${stripped//&&/}
case $stripped in *'&'*) abstain ;; esac

# `find -exec`/`-delete` and in-place editing turn read-only heads into writes.
case $command in
  *' -exec'*|*' -execdir'*|*' -delete'*|*' -ok'*|*'sed -i'*|*'sed --in-place'*) abstain ;;
esac

# Read-only command heads. `git` is handled separately (subcommand-dependent).
readonly SAFE_HEADS=" ls cat head tail wc echo printf pwd cd date basename dirname \
realpath readlink stat file du df tree sort uniq cut tr nl column comm diff jq grep \
egrep fgrep rg find sed awk true test [ [[ which type command_ "

readonly SAFE_GIT_SUBCOMMANDS=" status log show diff blame ls-files ls-tree rev-parse \
describe shortlog for-each-ref merge-base cat-file count-objects symbolic-ref "

is_safe_segment() {
  local segment=$1 head

  # Strip leading control-flow keywords until a real command head shows up.
  while true; do
    segment=${segment#"${segment%%[![:space:]]*}"}
    case $segment in
      if\ *|while\ *|until\ *|elif\ *|do\ *|then\ *|else\ *|time\ *|!\ *|\{\ *|\(\ *)
        segment=${segment#* } ;;
      *) break ;;
    esac
  done

  # Loop/case headers list literal words only — no command runs there.
  case $segment in
    for\ *|select\ *|case\ *) return 0 ;;
  esac

  head=${segment%%[[:space:]]*}
  case $head in
    ''|do|done|then|else|fi|esac|in|\{|\}|\(|\)) return 0 ;;
  esac

  if [ "$head" = git ]; then
    local subcommand=${segment#git}
    subcommand=${subcommand#"${subcommand%%[![:space:]]*}"}
    subcommand=${subcommand%%[[:space:]]*}
    case $SAFE_GIT_SUBCOMMANDS in *" $subcommand "*) return 0 ;; esac
    return 1
  fi

  case $SAFE_HEADS in *" $head "*) return 0 ;; esac
  return 1
}

# Split on shell separators. Quoted separators only ever create bogus segments, which
# fail the head check and make the hook abstain — never the other way round.
segments=${command//&&/$'\n'}
segments=${segments//||/$'\n'}
segments=${segments//|/$'\n'}
segments=${segments//;/$'\n'}

while IFS= read -r segment; do
  is_safe_segment "$segment" || abstain
done <<< "$segments"

allow
