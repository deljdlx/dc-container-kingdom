---
id: 2026-07-30_12-06
title: Une voie courte assumée pour les tickets minuscules
type: refactor
branch: copilot/short-lane-for-small-tickets
created: 2026-07-30 12:06
ready:
doing:
verify:
done: 2026-07-30 15:19 (merge 0f0aecb)
---

## Objectif

Le cycle complet coûte **3,5 commits de bookkeeping par commit de contenu**
(mesuré sur les 80 derniers commits : 49 `chore(board)` contre 14 commits de
contenu). C'est un bon prix pour un vrai ticket — `engine_020` a produit 552 lignes
de code pour 214 lignes de ticket, ratio 0,39.

C'en est un absurde pour les tickets minuscules : `chore-coquilles-api-publique`
a demandé **142 lignes de prose pour 11 lignes de correctif** (ratio 12,9), et
`engine_420_tools-readme` 52 lignes de ticket pour un README.

Le risque n'est pas le temps perdu, c'est ce que la disproportion enseigne : quand
la procédure coûte visiblement plus que le travail, on la contourne en silence —
et c'est déjà arrivé (7 tickets ont sauté la colonne `020-ready` le 2026-07-29).
Mieux vaut une voie courte **écrite** qu'une voie courte pratiquée en cachette.

Voie courte déclarée pour ce ticket : `docs`, diff attendu sous ~20 lignes, aucune
décision de conception à prendre.

## Spécifications

_Amorce — à confirmer en « specify »._

Une **voie courte** dans `work-a-task`, avec trois éléments non négociables :

1. **Un seuil explicite**, pas un jugement au cas par cas — sinon la voie courte
   devient la voie normale. Piste : `type` ∈ {`docs`, `chore`} **et** diff attendu
   sous ~20 lignes **et** aucune décision de conception à prendre. À trancher.
2. **Ce qui reste dû** : la branche dédiée, `npm run verify`, le merge `merge:`,
   la DoD (même à deux critères) et la rubrique `Suite`. La voie courte allège la
   **traçabilité de colonne**, jamais la vérification.
3. **Ce qui est allégé** : une seule transition (`000-backlog` → `080-done`) et un
   journal en deux lignes. Le garde-fou doit l'accepter sans contorsion — donc son
   contrôle « date les transitions déjà franchies » doit tolérer un ticket clos
   dont `doing`/`verify` valent l'heure du `done`.

À décider aussi : la voie courte se **déclare** dans le ticket (une ligne du
frontmatter ou de l'objectif), pour qu'on puisse compter combien de tickets
l'empruntent — et voir si elle dérive.

### Risque

Le seuil est le seul rempart. S'il est flou, tout devient « minuscule » : prévoir
de **mesurer** l'usage (part des tickets en voie courte) plutôt que de faire
confiance.

## Contexte / liens

- Mesure reproductible : `git log --oneline -80 | grep -c 'chore(board)'` contre
  les commits de contenu.
- `meta/agents/recipes/workflow/work-a-task.md`, `test/board.test.js`.
- Ticket voisin : `2026-07-30_12-05` (retirer `020-ready`), qui allège le même
  coût par l'autre bout.

## Definition of Done

- [x] Le seuil est écrit, chiffré, et ne demande pas de jugement subjectif.
- [x] `work-a-task` décrit la voie courte et **ce qu'elle n'allège pas**.
- [x] Le garde-fou accepte un ticket passé par la voie courte, et le prouve par un
      cas réel (le premier ticket qui l'emprunte).
- [x] La voie courte est déclarée dans le ticket, donc comptable.
- [x] `npm run verify` vert.

## Suite

- Ticket voisin : [2026-07-30_12-05](../000-backlog/board_500_specify-as-gate-not-column.md).

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**), par étape ; timeline
**monotone**.

### Travail

- [2026-07-30 15:16] Formalisation de la voie courte dans [meta/agents/recipes/workflow/work-a-task.md](../../agents/recipes/workflow/work-a-task.md), du README du board, et déclaration du ticket comme premier cas.

### Vérification



### Validation

- [2026-07-30 15:19] `npm run verify` vert, merge `0f0aecb` sur `main`, ticket clos en `080-done`.
