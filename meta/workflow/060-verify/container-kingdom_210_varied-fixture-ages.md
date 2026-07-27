---
id: 2026-07-27_11-20
title: Des fixtures d'âges variés, pour voir le temps passer en dev
type: test
branch: copilot/varied-fixture-ages
created: 2026-07-27 11:20
ready: 2026-07-27 19:40
doing: 2026-07-27 19:40
verify: 2026-07-27 19:50
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

### Décision de périmètre (specify)

- `Created` est recalé **au démarrage du mock** à partir d'un profil d'âges
      synthétique et déterministe : quelques conteneurs restent à quelques secondes,
      d'autres à quelques minutes / heures / jours, de sorte qu'au moins un statut
      bouge sous les yeux pendant une session de dev.
- La capture brute n'est pas réenregistrée : on garde les fixtures actuelles et
      on leur applique un étalonnage relatif au lancement, ce qui évite une solution
      qui s'use avec le temps.
- Le contrat du ticket `18-35` reste respecté côté tests : même horloge,
      même réponse ; `Created` ne dépend pas du temps qui passe à l'intérieur d'une
      même exécution.
## Source de fixtures réelles : la prod

Les fixtures actuelles viennent d'une capture réelle. On peut en refaire une :

```bash
curl -s "https://container-kingdom.deljdlx.fr/api/docker/containers/json?all=true" \
  > mock/fixtures/containers.json
```

Vérifié le 2026-07-27 : **HTTP 200 sans authentification**, **37 conteneurs**,
5 réseaux. Une capture fraîche apporte de la **variété d'âges réelle** — des
conteneurs redémarrés récemment côtoient des conteneurs en place depuis des mois
— là où les fixtures actuelles sont toutes du même jour.

### ⚠️ Deux réserves, à traiter avant de committer quoi que ce soit

**1. Le dépôt GitHub est public** (`deljdlx/dc-container-kingdom`, vérifié :
l'API GitHub répond `200` sans authentification). Committer la capture brute
**publie l'infrastructure de l'hôte, définitivement, dans l'historique git**.
Ce que contient le payload, en agrégats relevés le 2026-07-27 :

| Namespace de label | Occurrences | Ce que ça révèle |
|---|---|---|
| `com.docker.*` | 373 | noms de projets compose, **chemins du serveur** (`working_dir`) |
| `traefik.http.*` | 132 | règles de routage, donc les **domaines hébergés** |
| `traefik.docker` / `traefik.enable` | 61 | topologie d'exposition |
| `org.opencontainers.*` | 32 | provenance des images |
| `maintainer` | 25 | — |

S'y ajoutent les **noms d'images et leurs versions** (surface de CVE connues) et
les noms de conteneurs. **Une passe d'anonymisation est nécessaire** : renommer
projets/domaines/chemins, en préservant la *forme* des données (c'est elle qui
fait la valeur d'une fixture réaliste). À décider en *specify* : à la main une
fois pour toutes, ou par un script rejouable dans `mock/`.

**2. Une capture fraîche ne règle pas le problème de ce ticket — elle le
repousse.** Les fixtures d'aujourd'hui *sont* une capture réelle : elles étaient
variées le jour de la capture, et c'est le temps qui les a toutes alignées sur
`Up 36 weeks`. Recapturer redonne de la variété **aujourd'hui** et la reperdra
de la même façon. La variété d'âges **au moment du dev** reste donc conditionnée
à l'ancrage relatif décrit ci-dessus — la capture apporte le **réalisme**, pas la
**fraîcheur**.

> Cette URL est aussi la démonstration du ticket `2026-07-27_17-28` (sécurité) :
> si `curl` suffit ici, il suffit à n'importe qui.

## Contexte / liens

- **Prod** : <https://container-kingdom.deljdlx.fr/> — API Docker proxifiée sous
  `/api/docker/` (voir `compose/nginx.conf`)
- `mock/fixtures/containers.json` (`Created`, tous du même jour)
- `mock/docker-mock.js` (`getContainers(now)`, `humanizeAge`)
- `mock/README.md` (tableau statique / variable dans le temps)
- Ticket d'origine : `2026-07-26_18-35` ; bug qu'il visait : `2026-07-26_18-00`
- Sécurité de cette exposition : `2026-07-27_17-28`

## Definition of Done

- [ ] En dev, au moins un conteneur affiche un `Status` qui **change sous les yeux**
      en quelques secondes ou minutes.
- [ ] La solution **ne se périme pas** : relue dans six mois, elle produit encore
      des âges variés sans nouvelle capture.
- [ ] Le déterminisme des tests est préservé (horloge injectable, même horloge →
      même réponse).
- [ ] **Si** les fixtures sont recapturées depuis la prod : aucune donnée
      identifiante ne rentre dans le dépôt public — domaines, chemins serveur,
      noms de projets et d'images anonymisés, forme des données préservée.
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

- `npx vitest run test/docker-mock-time.test.js test/docker-mock.test.js`
- `npm run verify`
- Validation navigateur sur `http://127.0.0.1:5178/api/docker/containers/json?all=true` : le mock renvoie bien un mélange de statuts `Up 48 seconds`, `Up 2 minutes`, `Up 5 minutes`, `Up 2 hours`, `Up 9 hours`, `Up 2 days`, puis des âges plus anciens.
- Relecture quelques minutes plus tard : le premier statut a avancé jusqu'à `Up 6 minutes`.

### Validation

- Le serveur Vite de branche a bien rechargé `mock/docker-mock.js` après modification.
- Le rendu dev sur `http://127.0.0.1:5178/` s'appuie sur cette réponse mockée.
