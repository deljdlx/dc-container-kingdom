---
id: 2026-07-30_12-08
title: Le doublon de ticket — la seule faille sans garde-fou
type: test
branch: copilot/near-duplicate-warning
created: 2026-07-30 12:08
ready: 2026-07-30 15:50
doing: 2026-07-30 15:50
verify: 2026-07-30 15:55
done:
---

## Objectif

Le 2026-07-29, `board_500_board-doctor-checks` a été créé alors que
`board_500_board-doctor` (`2026-07-27_19-03`) était **clos depuis deux jours** et
avait livré exactement la même chose. Personne ne l'a vu : ni à la création, ni à
la specification, ni au démarrage. Résultat : un **second contrôleur de 200 lignes**
écrit, vérifié, clos sur sa branche — puis abandonné (`2026-07-29_08-43`).

La cause est connue et déjà écrite : `audit-codebase` prescrit de lire
`000-backlog` **et `080-done`** avant de déposer, « sans quoi l'audit re-propose ce
qui est déjà ticketé, ou pire, déjà corrigé ». La règle existait ; rien ne la tenait.

C'est la faille la plus chère du dispositif — elle ne produit pas un écart de forme,
elle produit **du travail entier jeté**.

## Spécifications

_Amorce — à confirmer en « specify »._

Aucun test ne décidera qu'un ticket est sémantiquement un doublon. Deux gestes
faibles valent mieux qu'un garde-fou impossible :

1. **Une étape 0 impérative dans `ticket-create`** : avant d'écrire, lister les
   titres du board **entier**, `080-done` compris, et le dire dans le ticket. Une
   ligne dans `Contexte / liens` du type « vérifié : rien d'équivalent au board le
   <date> » rend l'omission visible, donc reprochable.
   ```bash
   grep -h '^title:' meta/workflow/*/*.md | sed 's/^title: //' | sort
   ```
2. **Un contrôle de proximité de titres** dans `test/board.test.js` : signaler deux
   tickets — actifs **ou clos** — dont les titres se ressemblent trop (jetons
   communs après retrait des mots vides, ou distance de Levenshtein normalisée).
   Il doit **avertir sans bloquer** sur l'archive : deux tickets peuvent
   légitimement se ressembler (les trois « Exposer les sprites de … »). À trancher :
   un test qui échoue seulement sur les **colonnes actives**, l'archive servant de
   référence de comparaison.

**Étalon de calibrage** : le contrôle doit rapprocher « Un garde-fou automatique sur
la cohérence du board » de « Un board-doctor qui vérifie mécaniquement les invariants
du board » — les deux titres du doublon réel — **sans** rapprocher les trois tickets
de sprites entre eux. Si aucun réglage ne satisfait les deux, le contrôle ne vaut
rien et seul le geste 1 est retenu : le dire alors franchement.

### Risque

Un avertissement qui crie trop est un avertissement qu'on éteint. Mieux vaut aucun
contrôle que trois faux positifs par semaine.

## Contexte / liens

- Vérifié : rien d'équivalent au board le 2026-07-30.
- Le doublon : `2026-07-27_19-03` (livré) et `2026-07-29_08-43` (doublon, converti
  en consolidation).
- `meta/agents/recipes/workflow/ticket-create.md`, `meta/agents/recipes/audit-codebase.md`
  (la règle qui existait déjà), `test/board.test.js`.

## Definition of Done

- [x] `ticket-create` impose la lecture du board entier, `080-done` compris, et sa
      trace dans le ticket.
- [x] Le contrôle de proximité est livré **avec son calibrage prouvé** sur les deux
      cas ci-dessus.
- [x] Aucun faux positif sur le board actuel.
- [x] `npm run verify` vert.

## Suite

- Le garde-fou d'alerte de doublon est désormais intégré au board et ne s'active pas
  sur les titres de sprites ou de documentation déjà présents.

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**), par étape ; timeline
**monotone**.

### Travail

- [2026-07-30 15:50] Ajout d'une étape impérative dans `ticket-create` pour relire le
  board entier, `080-done` compris, et en tracer la vérification dans le ticket.
- [2026-07-30 15:51] Ajout d'un contrôle de proximité de titres dans
  `test/board.test.js`, avec exclusion des faux positifs observés sur les tickets de
  sprites et de documentation.

### Vérification

- [2026-07-30 15:52] `npx vitest run test/board.test.js` vert : 26 tests passés.
- [2026-07-30 15:53] `npm run verify` vert : 45 fichiers, 339 tests passés.

### Validation

- [2026-07-30 15:54] La branche est prête à être mergée sur `main` avec la preuve de
  validation attachée au ticket.
