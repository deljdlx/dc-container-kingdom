---
id: 2026-07-30_16-00
title: Une politique d'outils partagée entre agents (Claude et Copilot)
type: feat
branch:
created: 2026-07-30 16:00
ready:
doing:
verify:
done:
---

## Objectif

Les règles dures du dépôt ne sont **exécutées que pour Claude**. Mesuré le
2026-07-30 sur les 58 tickets clos, l'écart de conformité suit exactement l'écart
de mécanisme :

| Agent | Clos | DoD vierge à la clôture | `ready`=`doing` |
|---|---|---|---|
| copilot | 29 | **5** | **27** |
| claude | 20 | 0 | 1 |

Claude ne lit pas mieux : une machine l'empêche. `.claude/settings.json` porte des
`deny` (`git add -A`, `push --force`) et deux hooks `PreToolUse` ; Copilot et Codex
n'ont que la prose. Durcir la prose creuse l'écart au lieu de le combler.

**Or Copilot a le même mécanisme, et il est versionné dans le dépôt** :
`.github/hooks/*.json`, événement `preToolUse`, refus par
`{"permissionDecision": "deny", "permissionDecisionReason": "…"}` — à un nom de
champ près, la réponse de nos hooks Claude. Surfaces annoncées : agent cloud et CLI.

Coût du non-fait : chaque règle dure reste à moitié appliquée, et l'écart se lit
dans le board.

## Spécifications

_Amorce — à confirmer en « specify »._

### Un cœur, deux adaptateurs

La **politique** (que refuser, pourquoi) est agnostique et vit une seule fois dans
`meta/agents/tools/`. Chaque agent n'a qu'un **adaptateur mince** qui traduit son
protocole :

| | Claude Code | Copilot |
|---|---|---|
| Déclaration | `.claude/settings.json` (`hooks.PreToolUse`) | `.github/hooks/*.json` (`preToolUse`) |
| Entrée | `.tool_input.command` | `toolArgs` (chaîne JSON) → `.command` |
| Sortie de refus | imbriquée sous `hookSpecificOutput` | à plat |

C'est la doctrine déjà écrite dans `meta/agents/tools/README.md` — la règle vaut
pour tous, le mécanisme est par agent — appliquée pour la première fois aux deux.

### Ce que la politique doit refuser

1. **Bascule de branche du tree principal** (règle dure n°1 de `parallel-worktrees`) —
   la logique existe déjà dans `deny-primary-branch-switch.sh`, à extraire.
2. **`git add -A` / `git add .`** — aujourd'hui un `deny` de `settings.json`, donc
   invisible pour Copilot.
3. **Clôture d'un ticket dont la DoD n'est pas cochée** — un `git commit` qui
   déplace un ticket vers `080-done` peut être évalué en lançant le garde-fou sur
   l'état indexé (~70 ms, très en dessous du `timeoutSec` de l'exemple GitHub).
   C'est le seul refus qui attaque directement la signature mesurée ci-dessus.

### Réparer au passage le hook existant (candidat fusionné `2026-07-29_18-41`)

`deny-primary-branch-switch.sh` ne sait lire le répertoire cible que dans la forme
`cd <dir> && git …` (`resolve_target_dir`) ; toute autre forme — un `cd` sur sa
propre ligne, un `;` au lieu d'un `&&` — retombe sur `CLAUDE_PROJECT_DIR` et
**refuse à tort**. Rencontré deux fois le 2026-07-29 : un `git checkout -b` légitime
**dans un worktree**, et un `git checkout <fichier>` (restauration, jamais une
bascule). Il refuse au lieu d'autoriser, donc rien de dangereux — mais il apprend à
contourner par une formulation magique, et un garde-fou qu'on contourne par la
syntaxe ne protège plus rien.

À trancher : déduire le contexte du `cwd` fourni par le harness plutôt que de la
chaîne de commande, ou élargir la reconnaissance (`;`, sauts de ligne). Ajouter
`git checkout -- <fichier>` et `git restore` aux formes sûres.

### Risques

- **Le support des hooks par l'agent cloud n'est pas vérifié.** La doc dit que les
  hooks de dépôt s'appliquent « whenever Copilot agents are used in the repository »
  et liste agent cloud + CLI, sans détailler d'éventuelles différences. À **prouver
  empiriquement** avant de s'y fier (voir DoD), pas à supposer.
- **Trop bloquer paralyse.** Le précédent est frais : c'est ce ticket-ci qui répare
  le hook trop large. Tester depuis les deux contextes (tree principal **et**
  worktree) est non négociable — contrôle 4 de `audit-workflow-consistency`.
- **Un hook n'intercepte que des appels d'outil**, donc le `git commit`, pas le
  raisonnement qui l'a précédé. Il ne remplace pas le garde-fou de `verify`, seul
  filet pour un agent dont on ne contrôle pas la couche d'outils (Codex, sur lequel
  on ne sait rien).

## Contexte / liens

- Existant à factoriser : `.claude/hooks/deny-primary-branch-switch.sh`,
  `.claude/hooks/allow-readonly-bash.sh`, `.claude/settings.json`.
- Doctrine : `meta/agents/tools/README.md`, `meta/agents/recipes/parallel-worktrees.md`.
- Ticket voisin, Claude seul : `2026-07-29_08-52`.
- Candidat fusionné dans ce ticket : `2026-07-29_18-41`.
- Docs GitHub : `docs.github.com/en/copilot/concepts/agents/hooks` et
  `/copilot/tutorials/copilot-cli-hooks` (forme du refus, déclaration).

## Definition of Done

- [ ] La politique vit **une seule fois** ; chaque agent n'a qu'un adaptateur, et
      aucune règle n'est écrite deux fois.
- [ ] Les trois refus ci-dessus fonctionnent côté Claude, **vus refuser** sur un cas
      réel.
- [ ] **Preuve empirique côté Copilot** : une tâche jetable confiée à l'agent cloud
      se heurte au refus, capture au journal. Si l'agent cloud ignore
      `.github/hooks/`, le **dire** et se replier sur le garde-fou de `verify`.
- [ ] Aucun faux positif : le cycle complet reste jouable depuis un worktree, blocs
      `bash` de `parallel-worktrees` rejoués littéralement.
- [ ] `git checkout -- <fichier>` et `git restore` passent.
- [ ] `meta/agents/tools/README.md` décrit la politique partagée et **ce qu'elle ne
      couvre pas** (Codex).
- [ ] `npm run verify` vert.

## Suite

-

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**), par étape ; timeline
**monotone**.

### Travail

-

### Vérification

-

### Validation

-
