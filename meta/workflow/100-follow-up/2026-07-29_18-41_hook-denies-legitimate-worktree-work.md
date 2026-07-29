# Le hook de branche bloque le travail légitime en worktree

- **Origine** : `2026-07-29_08-43`
- **Constat** : `.claude/hooks/deny-primary-branch-switch.sh` ne sait lire le
  répertoire cible que dans la forme `cd <dir> && git …` (`resolve_target_dir`).
  Toute autre forme — un `cd` sur sa propre ligne, un `;` au lieu d'un `&&` —
  retombe sur `CLAUDE_PROJECT_DIR`, donc sur le tree principal, et **refuse**.
  Rencontré deux fois le 2026-07-29 : `git checkout -b claude/… main` **dans le
  worktree**, et un `git checkout <fichier>` (restauration d'un fichier, jamais
  une bascule de branche). Le message dit « interdit: changer la branche du tree
  principal » alors que ce n'était ni l'un ni l'autre.
- **Coût du non-fait** : le garde-fou est *fail-safe* (il refuse au lieu
  d'autoriser), donc rien de dangereux — mais il apprend aux agents à contourner
  par une formulation magique plutôt qu'à respecter la règle. Un garde-fou qu'on
  contourne par la syntaxe ne protège plus rien, et le ticket qui l'a demandé
  (`2026-07-29_08-52`) posait justement comme risque : « trop bloquer paralyse les
  agents en worktree — le hook doit être testé depuis les deux contextes ».
- **Piste** : décider du niveau d'ambition. (a) Reconnaître `;` et les sauts de
  ligne en plus de `&&` — corrige les cas rencontrés, reste syntaxique. (b) Faire
  du `cwd` fourni par le harness la source du contexte plutôt que de le déduire de
  la chaîne de commande. (c) Assumer la limite et la documenter dans
  `meta/agents/tools/README.md`, pour que le contournement soit un choix et non
  une découverte. Ajouter au passage `git checkout -- <fichier>` / `git restore`
  aux formes sûres.
