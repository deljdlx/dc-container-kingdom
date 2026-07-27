# `agents/tools/`

Outils et scripts destinés aux agents.

## Hooks Claude Code — `.claude/hooks/`

- **`allow-readonly-bash.sh`** — hook `PreToolUse` sur `Bash` : auto-autorise les
  commandes shell **prouvées en lecture seule**, y compris celles que le
  matcher de permissions ne sait pas découper (boucles `for … do … done`,
  pipelines, `cd … && …`). Il parse la commande, ignore les mots-clés de contrôle
  et n'autorise que si **chaque** segment démarre par une commande sans effet de
  bord (`ls`, `cat`, `grep`, `find`, `git status|log|diff|show`…).

  *Fail-safe* : tout ce qu'il ne sait pas prouver inoffensif ne rend **aucune**
  décision et retombe sur le flux normal (règles `allow`, puis confirmation).
  Substitution de commande, redirection, `find -exec` et `sed -i` le font
  s'abstenir. Enregistré dans `.claude/settings.json`.

> Ces hooks sont spécifiques à Claude Code ; les autres agents les ignorent. Les
> **règles**, elles, valent pour tout le monde et vivent dans
> [`../conventions.md`](../conventions.md) et [`../workflow.md`](../workflow.md) —
> un hook automatise une règle, il ne la remplace pas.
