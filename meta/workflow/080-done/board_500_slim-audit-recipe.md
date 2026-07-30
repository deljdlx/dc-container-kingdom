---
id: 2026-07-30_12-11
title: Dégraisser audit-workflow-consistency de ce que le garde-fou exécute
type: docs
branch: copilot/slim-audit-recipe
created: 2026-07-30 12:11
ready: 2026-07-30 12:33
doing: 2026-07-30 12:33
verify: 2026-07-30 12:35
done: 2026-07-30 12:35
---

## Objectif

`meta/agents/recipes/audit-workflow-consistency.md` fait **159 lignes**, dont
l'essentiel décrit des commandes que `test/board.test.js` **exécute** désormais à
chaque `npm run verify`. La recipe le dit elle-même en tête (« ils tournent déjà »),
puis déroule quand même les blocs `bash` sur une centaine de lignes.

Le coût est le chemin de lecture : un agent neuf lit **869 lignes** avant d'écrire sa
première ligne de code (point d'entrée + 3 fichiers de règles + board README +
work-a-task + les recipes d'étape + parallel-worktrees + TEMPLATE). Chaque ligne de
doctrine qui décrit un contrôle automatisé est une ligne qui coûte à lire et
n'apporte rien à faire.

Coût du non-fait : la doctrine grossit à chaque automatisation au lieu de maigrir —
et une doctrine qu'on ne peut plus lire en entier n'est plus appliquée en entier.

## Spécifications

_Amorce — à confirmer en « specify »._

Garder ce qui **ne s'automatise pas**, retirer ce qui est exécuté :

- **Reste** : le périmètre, les contrôles **4 à 8** (rejouer les commandes
  documentées dans le contexte qu'elles décrivent, les lectures croisées colonnes /
  cycle / entrées / TEMPLATE), la section « Sortie », et la note qui dit **où**
  ajouter un contrôle (le garde-fou unique).
- **Part** : les blocs `bash` des contrôles 1 à 3, redondants avec le test — un
  pointeur vers `test/board.test.js` suffit à savoir ce qui est vérifié.
- **À conserver absolument** : la mise en garde sur le contrôle 4 (« une commande
  peut être grammaticalement parfaite et échouer dans le contexte où la recipe la
  place ») et son exemple daté — c'est le contrôle le plus rentable de la recipe, et
  celui qui a effectivement attrapé trois commandes git fausses.

Objectif de volume : **sous 90 lignes**, sans perdre un contrôle.

### Risque

Retirer une commande, c'est perdre la capacité de sonder un point à la main quand le
test est rouge et qu'on cherche pourquoi. Le pointeur doit donc nommer le test **et**
son `describe`, pas seulement le fichier.

## Contexte / liens

- `meta/agents/recipes/audit-workflow-consistency.md` (159 lignes aujourd'hui).
- `test/board.test.js` (les 13 contrôles exécutés).
- Mesure du chemin de lecture : `wc -l` sur les 16 fichiers du parcours d'entrée.

## Definition of Done

- [ ] La recipe passe sous 90 lignes.
- [ ] Aucun contrôle perdu : les 8 restent nommés, ceux automatisés renvoyant au
      test et à son `describe`.
- [ ] La mise en garde du contrôle 4 est intacte.
- [ ] Les liens résolvent ; `npm run verify` vert.

## Suite

aucune

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**), par étape ; timeline
**monotone**.

### Travail

- [2026-07-30 12:33] Ticket déplacé en `040-doing` sur la branche `copilot/slim-audit-recipe`.
- [2026-07-30 12:33] Recipe `meta/agents/recipes/audit-workflow-consistency.md` ramenée à 62 lignes en gardant les contrôles 4 à 8 et la note sur le garde-fou unique.

### Vérification

- [2026-07-30 12:35] `npm run verify` vert après la coupe de la recipe à 62 lignes.

### Validation

- [2026-07-30 12:35] `npm run verify` vert ; la recipe est tombée à 62 lignes.
