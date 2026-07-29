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

- **`deny-primary-branch-switch.sh`** — hook `PreToolUse` sur `Bash` : refuse les
  commandes qui changent la branche active du **tree principal**
  (`git checkout <branche>`, `git switch <branche>`). Le hook détecte le contexte
  principal vs worktree avec `git rev-parse --git-common-dir` et `--git-dir`, et
  laisse passer les formes inoffensives (`git checkout --detach`,
  `git switch --detach`, `git checkout -- <fichier>`). En cas de doute sur le
  contexte, il refuse (*fail-closed*).

- **Permissions git clarifiées** : `git push` n'est plus dans `allow` (demande de
  confirmation requise), alors que `git commit` reste autorisé pour le
  bookkeeping du board décrit par `work-a-task`.

> Ces hooks sont spécifiques à Claude Code ; les autres agents les ignorent. Les
> **règles**, elles, valent pour tout le monde et vivent dans
> [`../conventions.md`](../conventions.md) et [`../workflow.md`](../workflow.md) —
> un hook automatise une règle, il ne la remplace pas.
