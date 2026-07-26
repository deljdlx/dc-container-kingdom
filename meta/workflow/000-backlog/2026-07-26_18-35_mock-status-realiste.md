---
id: 2026-07-26_18-35
title: Rendre le Status du mock Docker réaliste (libellé qui vieillit)
type: test
branch:
created: 2026-07-26 18:35
ready:
doing:
verify:
done:
---

## Objectif

Les fixtures du mock (`mock/fixtures/containers.json`) portent un `Status` **figé**
(`"Up 8 days"`), alors que l'API Docker renvoie un libellé qui **vieillit**
(`"Up 4 seconds"` → `"Up 9 seconds"` → `"Up About a minute"`).

C'est exactement ce qui a rendu invisible le bug du ticket `2026-07-26_18-00` : le
checksum des conteneurs intégrait `Status`, l'app se serait rechargée en boucle
toutes les 5 secondes face à un vrai daemon — et **ni `npm run dev` ni la CI** ne
pouvaient le voir. Seul un test unitaire écrit à la main l'a attrapé.

Un mock qui ne reproduit pas la **variabilité dans le temps** des données Docker
donne une fausse assurance : toute régression de cette famille (libellés, uptime,
stats) passe au travers.

## Spécifications

_À compléter en « specify ». Piste : `makeStats(id, now)` montre déjà le patron —
une valeur dérivée d'une horloge **injectable**, donc déterministe en test. Le même
traitement peut s'appliquer aux champs temporels des descripteurs (`Status`, et
possiblement `Created`), sans casser les tests existants qui lisent les fixtures._

## Contexte / liens

- `mock/docker-mock.js` (`getContainers`, `makeStats` — le patron d'horloge injectable)
- `mock/fixtures/containers.json` (`Status`, `Created`)
- `mock/vite-docker-mock-plugin.js`, `mock/README.md`
- `test/docker-mock.test.js`, `test/ContainerRepository.test.js`,
  `test/DockerApiClient.test.js` (consommateurs des fixtures)
- Ticket d'origine : `2026-07-26_18-00` (le bug que ce manque a masqué)

## Definition of Done

- [ ] Le `Status` servi par le mock **vieillit** avec l'horloge, comme celui de
      l'API Docker (formats `Up X seconds` / `minutes` / `hours` / `days`).
- [ ] L'horloge est **injectable** : les tests restent déterministes, sans
      `Date.now()` implicite dans les assertions.
- [ ] Un test prouve la variabilité : deux lectures à des instants différents
      donnent des `Status` différents pour un conteneur en cours d'exécution.
- [ ] Les tests existants qui consomment les fixtures passent sans être affaiblis.
- [ ] `mock/README.md` décrit ce qui est **statique** et ce qui **varie dans le
      temps** dans le mock.
- [ ] `npm run verify` vert.

## Suite

_« Et ensuite ? » — rempli à la **clôture** (follow-up, voir la recipe
[ticket-follow-up](../agents/recipes/workflow/ticket-follow-up.md)) : ce que le ticket
**ouvre**, ce qu'il **laisse de côté** (limite, dette), les **candidats** déposés en
`100-follow-up/`. Quelques lignes ; `aucune` est une réponse valable. À la
différence du `Journal`, qui date le passé, cette rubrique regarde l'avant._

-

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**, ex. `date '+%Y-%m-%d
%H:%M'`), par étape ; timeline **monotone** — rien ne postdate `done`.

### Travail

-

### Vérification

-

### Validation

-
