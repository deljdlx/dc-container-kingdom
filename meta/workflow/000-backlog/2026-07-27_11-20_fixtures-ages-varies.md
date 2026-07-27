---
id: 2026-07-27_11-20
title: Des fixtures d'âges variés, pour voir le temps passer en dev
type: test
branch:
created: 2026-07-27 11:20
ready:
doing:
verify:
done:
---

## Objectif

Depuis `2026-07-26_18-35`, le mock fait vieillir le `Status` — mais les 35
conteneurs des fixtures ont été capturés il y a ~8 mois et ont tous le même âge :
ils affichent tous `Up 36 weeks`, et ce libellé ne changera **qu'une fois par
semaine**. Mesuré : deux lectures de `/containers/json` à 6 secondes d'intervalle
rendent exactement la même chaîne.

La variabilité n'est donc démontrée que par les tests, qui injectent une horloge.
Devant un `npm run dev`, le bug d'origine (`2026-07-26_18-00` — un checksum bâti
sur `Status`) resterait invisible une semaine durant : c'est exactement le trou
qu'on venait de vouloir boucher.

## Spécifications

_À compléter en « specify ». Piste : ancrer quelques `Created` près du démarrage de
la session (un conteneur de quelques secondes, un de quelques minutes, un de
quelques heures), pour qu'au moins un libellé bouge sous les yeux pendant une
session de dev. À arbitrer : `Created` deviendrait relatif au lancement, ce qui
gagne en réalisme mais éloigne les fixtures de la capture d'origine — et le ticket
`18-35` a justement posé que `Created` ne dérive pas. Trancher entre « fixtures
retouchées une fois pour toutes » et « âges recalés au démarrage »._

## Contexte / liens

- `mock/fixtures/containers.json` (`Created`, tous du même jour)
- `mock/docker-mock.js` (`getContainers(now)`, `humanizeAge`)
- `mock/README.md` (tableau statique / variable dans le temps)
- Ticket d'origine : `2026-07-26_18-35` ; bug qu'il visait : `2026-07-26_18-00`

## Definition of Done

- [ ] En dev, au moins un conteneur affiche un `Status` qui **change sous les yeux**
      en quelques secondes ou minutes.
- [ ] Le déterminisme des tests est préservé (horloge injectable, même horloge →
      même réponse).
- [ ] La décision sur `Created` (retouché vs recalé au démarrage) est tranchée et
      **écrite**, y compris son effet sur la règle posée par `18-35`.
- [ ] `mock/README.md` reflète le choix.
- [ ] `npm run verify` vert.

## Suite

_« Et ensuite ? » — rempli à la **clôture** (follow-up, recipe
`meta/agents/recipes/workflow/ticket-follow-up.md`) : ce que le ticket **ouvre**, ce
qu'il **laisse de côté** (limite, dette), les **candidats** déposés en
`100-follow-up/`. `aucune` est une réponse valable._

-

## Journal

### Travail

-

### Vérification

-

### Validation

-
