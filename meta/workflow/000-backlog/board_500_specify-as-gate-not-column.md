---
id: 2026-07-30_12-05
title: Specify est une porte, pas une colonne — retirer 020-ready
type: refactor
branch:
created: 2026-07-30 12:05
ready:
doing:
verify:
done:
---

## Objectif

Le pipeline annonce cinq colonnes ; la pratique en franchit quatre. Mesuré le
2026-07-30 sur les tickets clos :

- **28 sur 52** portent `ready:` et `doing:` **à la même minute** — l'étape est
  remplie et quittée d'un même geste ;
- la recipe `ticket-specify` est citée par **zéro** ticket ;
- les 7 tickets clos le 2026-07-29 sont passés de `000-backlog` **directement** à
  `040-doing` (preuve : `4a9c4a7`, `R097 000-backlog/… → 040-doing/…`) tout en
  portant une estampille `ready:` renseignée.

Le garde-fou ne peut pas le voir : il vérifie **où** le ticket est, pas le chemin
qu'il a pris. Une colonne que personne ne traverse mais que tout le monde estampille
est pire qu'une colonne absente : elle fait mentir le board, et apprend à traiter le
reste du cycle comme du décor.

Coût du non-fait : un `git mv` et un commit par ticket pour une information fausse.

## Spécifications

_Amorce — à confirmer en « specify », avec l'ironie que cela suppose._

Deux issues possibles, **à trancher avant de coder** :

- **(a) Retirer `020-ready`** — *specify* devient une **porte** : le ticket reste en
  `000-backlog` et son `ready:` renseigné signifie « spécifiée, prête à démarrer ».
  Le cycle passe à `000-backlog` → `040-doing` → `060-verify` → `080-done`.
- **(b) Garder la colonne et imposer le passage** — le garde-fou vérifierait dans
  l'historique que chaque ticket clos a bien transité (`git log --diff-filter=R`).
  Plus coûteux, et cela défend une étape dont personne n'a montré le besoin.

**(a) est recommandée.** Ce qui compte dans *specify* est le **contenu** (specs,
DoD vérifiable), pas le déplacement ; la recipe `ticket-specify` garde donc tout son
sens, seule la colonne disparaît. À noter : `020` restera libre dans la numérotation
des colonnes, ce qui laisse la porte ouverte à un retour si l'on se trompe.

Le choix (a) touche : `meta/README.md` (table des colonnes), `work-a-task` (table
des étapes), `ticket-specify` / `ticket-work` (transitions), `test/board.test.js`
(`ACTIVE_COLUMNS`, `PIPELINE_COLUMNS`, contrôle « date les transitions déjà
franchies »), la source des points d'entrée, et `meta/workflow/020-ready/`
(à supprimer, `.gitkeep` compris).

### Risque

La colonne vide au moment du changement : vérifier que `020-ready/` ne contient
aucun ticket avant de la retirer, sinon un ticket disparaît du board.

## Contexte / liens

- Mesures : audit du 2026-07-30 (cette conversation), reproductibles —
  `grep -h '^ready:\|^doing:' meta/workflow/080-done/*.md`.
- `meta/agents/recipes/workflow/work-a-task.md`, `ticket-specify.md`, `meta/README.md`.

## Definition of Done

- [ ] L'issue (a) ou (b) est tranchée **et la raison écrite** dans le ticket.
- [ ] Le cycle énoncé est le même partout : board README, `work-a-task`, recipes
      d'étape, source des points d'entrée, garde-fou.
- [ ] Le garde-fou reste vert et ne référence plus une colonne qui n'existe pas.
- [ ] Aucun ticket perdu au passage (`020-ready/` vide, vérifié avant suppression).
- [ ] **La topologie de clôture est énoncée dans `meta/agents/entry-points/common.md`**,
      en une phrase : `done:` se pose **sur `main`, après le merge**, et cite le hash
      **du merge**. Écrit là parce qu'un ticket a été clos sur sa branche avec un hash
      de **commit** (`2026-07-29_08-43`, corrigé depuis) : c'est une incompréhension
      franche de la topologie, pas une négligence, et les entrées ne la disent pas.
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
