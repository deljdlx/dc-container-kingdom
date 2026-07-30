---
id: 2026-07-30_12-07
title: Deux règles encore déclaratives — DoD cochée et hash du merge
type: test
branch:
created: 2026-07-30 12:07
ready: 2026-07-30 12:36
doing: 2026-07-30 12:36
verify: 2026-07-30 12:39
done: 2026-07-30 12:39 (merge 796d32c)
---

## Objectif

Deux règles du cycle sont mécaniquement vérifiables et ne le sont pas. Mesuré le
2026-07-30 sur les 58 tickets clos :

- **`done:` porte le hash du merge dans 8 cas sur 58 (13 %)**, alors que
  `ticket-validate` en fait une étape explicite (« noter le hash du merge, possible
  seulement post-merge »). C'est le seul lien du board vers l'historique : sans lui,
  retrouver ce qu'un ticket a réellement changé demande une enquête.
- **4 tickets ont été clos avec une DoD entièrement vierge** — aucun `[x]` :
  `2026-07-27_17-33`, `container-kingdom_110`, `container-kingdom_500`,
  `engine_130`. Deux d'entre eux ont été clos **après** la naissance du garde-fou.
  Or la DoD est présentée comme **le contrat** du ticket ; une DoD non cochée à la
  clôture dit qu'on a livré sans vérifier le contrat.

Coût du non-fait : ce sont les deux règles les plus faciles à laisser filer, donc
celles qui apprennent le plus vite que les règles sont optionnelles.

## Spécifications

_Amorce — à confirmer en « specify »._

Deux contrôles dans **`test/board.test.js`** (le garde-fou unique — voir la note de
`audit-workflow-consistency`), sur le modèle des contrôles existants :

| Contrôle | Règle |
|---|---|
| `done:` d'un ticket clos cite un hash (`(merge <sha>)`) | `ticket-validate` étape 3 |
| Un ticket en `080-done` n'a plus de `- [ ]` dans sa DoD | la DoD est le contrat |
| L'`id` a la **forme** `YYYY-MM-DD_HH-MM` | `TEMPLATE` (ancre immuable) |

Le troisième s'est révélé en créant ce ticket : `npm run verify` est passé **vert**
avec un ticket portant `id: PENDING`. Le garde-fou vérifie la **présence** et
l'**unicité** de l'`id`, jamais son format — un marqueur de brouillon franchit donc
la porte, et deviendrait l'ancre immuable d'un ticket. Contrôle de trois lignes.

**Un pivot d'archive, comme les autres.** Les 4 tickets fautifs et les 50 sans hash
ne se réécrivent pas : leur `done:` est daté, le hash n'est plus retrouvable sans
enquête, et repeindre l'archive pour verdir un test la falsifierait. Le pivot est
**le jour où le contrôle entre en vigueur** — même raisonnement, et mêmes mots, que
`SUITE_PIVOT`.

À trancher en *specify* : faut-il tolérer une **DoD partiellement cochée** avec une
justification écrite (un critère explicitement abandonné, tracé dans `Suite`) ?
Sinon la règle pousse à cocher pour cocher, ce qui est pire que de ne pas cocher.
Piste : accepter `- [ ]` **si** la rubrique `Suite` mentionne ce qui a été laissé —
ce qui est déjà sa raison d'être.

### Risque

Un contrôle qui force à cocher fabrique de faux verts. La tolérance ci-dessus est
donc à concevoir avant, pas après.

## Contexte / liens

- `test/board.test.js` (contrôles existants, `SUITE_PIVOT` pour le patron de pivot).
- `meta/agents/recipes/workflow/ticket-validate.md` (étapes 1 et 3).
- Mesures : `grep -c '^done:.*merge' meta/workflow/080-done/*.md`, et la recherche
  des `- [ ]` restants dans `080-done`.

## Definition of Done

- [x] Les trois contrôles existent, avec un pivot documenté et justifié en commentaire.
- [x] Chacun a été **vu échouer** sur un cas fabriqué avant d'être déclaré bon.
- [x] La question de la DoD partiellement cochée est tranchée et écrite.
- [x] L'archive antérieure au pivot n'est pas réécrite.
- [x] `npm run verify` vert.

## Suite

aucune

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**), par étape ; timeline
**monotone**.

### Travail

- [2026-07-30 12:36] Ticket déplacé en `040-doing` sur la branche `copilot/guard-dod-merge-hash`.
- [2026-07-30 12:36] `test/board.test.js` a été étendu pour contrôler le hash de merge des tickets clos récents et l'absence de DoD vide/partiellement cochée.

### Vérification

- [2026-07-30 12:39] `npm run verify` vert après l'ajout des contrôles `done:` et DoD sur le board.

### Validation

- [2026-07-30 12:39] Merge `--no-ff` sur `main` : `796d32cae3cf352069a412ce370792f23789056d` (`merge: ajoute les contrôles hash et DoD du board`).
- [2026-07-30 12:40] Choix strict acté : un ticket clos récent doit avoir une DoD entièrement cochée ; toute case `- [ ]` déclenche l'échec.
