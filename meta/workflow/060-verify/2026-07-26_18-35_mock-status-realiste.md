---
id: 2026-07-26_18-35
title: Rendre le Status du mock Docker réaliste (libellé qui vieillit)
type: test
branch: claude/mock-status-realiste
created: 2026-07-26 18:35
ready: 2026-07-27 11:12
doing: 2026-07-27 11:13
verify: 2026-07-27 11:17
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

### Fonctionnel

- Le `Status` servi **se calcule** à partir de `Created` (présent dans les
  fixtures) et de l'horloge, au format de l'API Docker : `Up 4 seconds`,
  `Up About a minute`, `Up 3 hours`, `Up 8 days`…
- Deux lectures à des instants différents donnent des `Status` différents pour un
  conteneur en cours d'exécution.
- **La mémoire varie aussi** (voir ci-dessous) — même famille de défaut, et c'est
  ce qui a rendu invérifiable au navigateur le rafraîchissement du ticket
  `2026-07-26_14-21`.

### Technique

- `getContainers(now)` calcule `Status` par-dessus les fixtures ; `Created`, lui,
  reste **fixe** : c'est une date de naissance, pas une valeur qui dérive.
  L'horloge est **injectable**, comme `makeStats(id, now)` le fait déjà, donc les
  tests restent déterministes.
- `handleDockerRequest(method, path, now)` propage son `now` à `getContainers`.
- **Mémoire** : `makeStats` sert aujourd'hui `20 + (seed % 780)` MB, strictement
  constant. Ajouter une **oscillation lente** dérivée de `now` autour de cette
  base — assez pour qu'un rafraîchissement se voie, assez faible pour que les
  seuils mémoire (`memory--*`) ne clignotent pas. Le CPU, lui, varie déjà.
- Les fixtures gardent leur `Status` : il devient une valeur de repli, jamais
  servie telle quelle. Le noter dans `mock/README.md`.

### Risques / vigilance

- **Ne pas casser les tests existants** qui lisent les fixtures : ils comparent
  des ids, des réseaux, des labels — pas le `Status`. À vérifier, pas à supposer.
- La bascule d'un palier mémoire (`memory--l` → `memory--xl`) change une classe
  CSS : garder l'amplitude sous le pas des seuils pour éviter le scintillement.

## Contexte / liens

- `mock/docker-mock.js` (`getContainers`, `makeStats` — le patron d'horloge injectable)
- `mock/fixtures/containers.json` (`Status`, `Created`)
- `mock/vite-docker-mock-plugin.js`, `mock/README.md`
- `test/docker-mock.test.js`, `test/ContainerRepository.test.js`,
  `test/DockerApiClient.test.js` (consommateurs des fixtures)
- Ticket d'origine : `2026-07-26_18-00` (le bug que ce manque a masqué)

## Definition of Done

- [x] Le `Status` servi par le mock **vieillit** avec l'horloge, comme celui de
      l'API Docker (formats `Up X seconds` / `minutes` / `hours` / `days`).
- [x] L'horloge est **injectable** : les tests restent déterministes, sans
      `Date.now()` implicite dans les assertions.
- [x] Un test prouve la variabilité : deux lectures à des instants différents
      donnent des `Status` différents pour un conteneur en cours d'exécution.
- [x] Les tests existants qui consomment les fixtures passent sans être affaiblis.
- [x] La mémoire servie **varie dans le temps**, sans faire clignoter les paliers.
- [x] `mock/README.md` décrit ce qui est **statique** et ce qui **varie dans le
      temps** dans le mock.
- [x] `npm run verify` vert.

## Suite

- **Ouvre — et ça compte** : les fixtures ont été capturées il y a 8 mois, donc en
  dev le `Status` ne change qu'une fois par semaine. La variabilité est prouvée
  **par les tests** (horloge injectée), mais un `npm run dev` ne la montre
  toujours pas à l'œil : le bug d'origine (`2026-07-26_18-00`) resterait invisible
  pendant une semaine devant un écran. → candidat déposé,
  `2026-07-27_11-20_fixtures-ages-varies.md`.
- **Laisse de côté** : `State` est `running` pour les 35 conteneurs des fixtures —
  aucun `exited`, donc le format `Exited (0) X ago` n'est ni servi ni testé. Pas
  déposé : sans conteneur arrêté dans les fixtures, ce serait du code sans usage.
- **Gain collatéral** : ce ticket rend vérifiable au navigateur ce qui ne l'était
  pas — le rafraîchissement de `2026-07-26_14-21`. Un mock réaliste ne protège pas
  que des régressions : il rend les vérifications possibles.

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**, ex. `date '+%Y-%m-%d
%H:%M'`), par étape ; timeline **monotone** — rien ne postdate `done`.

### Travail

- [2026-07-27 11:13] Ticket pris sur `claude/mock-status-realiste`. Tri de `100-follow-up/` : boîte vide.
- [2026-07-27 11:14] Tests d'abord (`test/docker-mock-time.test.js`, 6 cas) : vieillissement du `Status`, paliers du format Docker, déterminisme à horloge égale, `Created` qui **ne** dérive pas, propagation par la route HTTP, respiration de la mémoire sans saut de palier. 4 échouent avant correctif.
- [2026-07-27 11:15] `getContainers(now)` calcule `Status` depuis `Created` + l'horloge, avec un `humanizeAge` qui suit les paliers du CLI Docker (`seconds` → `About a minute` → `minutes` → `About an hour` → `hours` → `days` → `weeks`). Horloge injectable, propagée par `handleDockerRequest`.
- [2026-07-27 11:16] Mémoire : oscillation lente de ±3 % autour de la base par conteneur. Amplitude choisie **sous le pas des seuils** pour ne pas faire clignoter les classes `memory--*` — vérifié par test et au navigateur.
- [2026-07-27 11:17] `mock/README.md` : tableau de ce qui est statique et de ce qui bouge, avec la raison — un double trop stable cache une famille entière de bugs.

### Vérification

- [2026-07-27 11:17] `npm run verify` vert : lint + build + **225 tests** (33 fichiers). Aucun test existant n'a eu besoin d'être touché : ils comparent des ids, réseaux et labels, jamais le `Status`.
- [2026-07-27 11:18] Navigateur — **test croisé** : la mémoire affichée bouge à l'écran (359.31 → 362.62 MB sur trois cycles) et les paliers `memory--*` restent stables. Cela valide **deux** choses d'un coup : le mock varie, et le rafraîchissement livré ce matin (`2026-07-26_14-21`) fonctionne bout en bout — ce qui était **invérifiable** avant ce ticket.
- [2026-07-27 11:19] Le `Status` servi par l'API respecte le format Docker mais **ne bouge pas** en 6 s : les fixtures datent de 8 mois, donc à cette échelle le libellé ne change qu'une fois par semaine. Comportement correct, limite réelle — notée en `Suite`, pas passée sous silence.
- [2026-07-27 11:19] 0 erreur console, serveur de dev arrêté.

### Validation

-
