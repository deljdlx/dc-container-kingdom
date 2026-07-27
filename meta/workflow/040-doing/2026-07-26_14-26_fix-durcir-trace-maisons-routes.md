---
id: 2026-07-26_14-26
title: Durcir le tracé des maisons, enclos et routes (bugs silencieux)
type: fix
branch: claude/fix-durcir-trace-maisons-routes
created: 2026-07-26 14:26
ready: 2026-07-27 10:57
doing: 2026-07-27 10:58
verify:
done:
---

## Objectif

`ContainerKingdomRenderer` contient plusieurs défauts silencieux : rien ne plante
aujourd'hui, mais le rendu n'est pas celui prévu et le code piège le prochain
lecteur.

1. **`drawRoadTrees()` compare des clés string** : les clés viennent de
   `Object.keys(matrix)` (donc `"350"`), et `matrix[x + width]` fait une
   **concaténation** (`"350" + 50 === "35050"`). La règle « pas d'arbre si une
   route est adjacente » ne s'applique donc **jamais** : des arbres poussent au
   milieu des routes.
2. **`drawHouse()` renvoie `undefined`** quand `container.rendered` est déjà vrai,
   mais `drawHouseGroup()` empile le résultat dans `houses` et
   `drawFences(houses)` appelle `house.x()` dessus → `TypeError` dès qu'un
   conteneur est redessiné (cas immédiat du rafraîchissement incrémental).
3. **Arguments morts** : `drawContainers()` est déclarée sans paramètre mais
   appelée avec `this.getContainers()` ; `new Element(-16, -16, w, h, true)` passe
   un 5ᵉ argument que le constructeur d'`Element` ignore.
4. **`element.manualZ = 0`** : `manualZ` est un booléen testé par
   `Renderer.render()` via `=== false`. `0` n'est **pas** `false` → la profondeur
   n'est plus recalculée, mais par un chemin accidentel. Écrire l'intention.
5. **Duplication** : `drawNetworks()` reconstruit l'index par réseau que
   `ContainerRepository._rebuildNetworks()` / `getNetworks()` fournit déjà.

## Spécifications

### Technique — tranché en *specify*

- **Extraire la matrice de routes** dans une petite structure dédiée plutôt que
  d'empiler des objets indexés par nombre-devenu-chaîne : c'est la conversion
  implicite en clé d'objet qui a produit le bug (`Object.keys` rend des chaînes,
  `"350" + 50` concatène). Une `Map` clé `x,y` ou un helper `at(x, y)` rend
  l'arithmétique impossible à re-casser, et se teste **sans DOM**.
- `drawHouse()` : retourner la maison **existante** quand le conteneur est déjà
  tracé ; `drawFences()` ignore les entrées absentes et sort si moins de deux
  maisons.
- Nettoyer les arguments morts (`drawContainers(containers)`, le 5ᵉ argument
  d'`Element`) et écrire `manualZ` en booléen.
- Consommer `application.getNetworks()` au lieu de reconstruire l'index — le
  repository en est déjà l'autorité.
- **Testabilité** : le renderer touche le DOM et le moteur, donc les tests visent
  la **logique extraite** (matrice de routes, règle d'adjacence) plutôt que de
  monter une application complète. Ce que le test ne couvre pas — la géométrie
  réelle des routes — passe par la validation navigateur, comparaison avant/après.

### Risques / vigilance

- Le tracé des routes est visuel : valider au navigateur avec le mock avant/après
  (capture comparée), la géométrie des routes ne doit pas bouger.

## Contexte / liens

- `src/container-kingdom/js/ContainerKingdomRenderer.js` (`drawRoadTrees`,
  `drawHouse`, `drawHouseGroup`, `drawFences`, `drawNetworks`)
- `src/container-kingdom/js/ContainerRepository.js` (`getNetworks`)
- `src/engine/map/Element.js` (signature du constructeur, `manualZ`),
  `src/engine/map/Renderer/Renderer.js` (`manualZ === false`)
- Ticket lié : `…_feat-refresh-incremental-sans-reload.md` (dépend du point 2)
- `meta/recipes/verify-in-browser.md`

## Definition of Done

- [x] La règle d'adjacence des arbres de route fonctionne (test unitaire dédié).
- [x] Un second passage de rendu sur un conteneur déjà tracé ne lève plus d'erreur.
- [x] Plus d'arguments morts ; `manualZ` renseigné avec un booléen.
- [x] L'index réseau n'est plus dupliqué dans le renderer.
- [x] Validation navigateur (routes/arbres inchangés hors correction attendue),
      `npm run verify` vert.

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**, ex. `date '+%Y-%m-%d
%H:%M'`), par étape ; timeline **monotone** — rien ne postdate `done`.

### Travail

- [2026-07-27 10:58] Ticket pris sur `claude/fix-durcir-trace-maisons-routes`. Tri de `100-follow-up/` : boîte vide.
- [2026-07-27 11:00] **Extraction** de `RoadMatrix` plutôt que rustine : la cause du bug était l'indexation par nombre-devenu-chaîne (`Object.keys` rend `"350"`, donc `"350" + 50` concatène). Une `Map` à clé `x,y` rend l'arithmétique impossible à re-casser, et se teste **sans DOM** — 5 tests, dont un qui pose explicitement le piège d'origine (une case en 35050 ne doit pas compter comme voisine).
- [2026-07-27 11:01] `drawRoadTrees` réécrite sur la matrice ; `drawHouse` retourne la maison **existante** au lieu de `undefined` ; `drawFences` filtre les absentes et sort sous deux maisons.
- [2026-07-27 11:01] Arguments morts retirés des **deux côtés** : `drawContainers()` / `drawNetworks()` ne prennent plus de paramètre ignoré, et `ContainerKingdom` cesse de leur en passer. 5ᵉ argument d'`Element` supprimé.
- [2026-07-27 11:02] `manualZ = 0` → `true`, avec le commentaire qui dit **pourquoi** (le fond de cluster ne doit pas peindre par-dessus les maisons). `0` marchait par accident : falsy, donc la profondeur n'était plus recalculée.
- [2026-07-27 11:02] `drawNetworks` consomme `application.getNetworks()` : l'index par réseau a désormais une seule autorité, le repository.

### Vérification

- [2026-07-27 11:03] `npm run verify` vert : lint + build + **219 tests** (32 fichiers), dont les 5 nouveaux sur `RoadMatrix`.
- [2026-07-27 11:04] Navigateur : 35 maisons, 880 nœuds de route, 5 clusters, écran de chargement masqué, 0 erreur console — le tracé n'a pas bougé.
- [2026-07-27 11:05] Première sonde **non concluante** (0 arbre trouvé) : elle supposait l'arbre à `route + 2·hauteur`, alors que la matrice enregistre les coordonnées **avant** l'offset appliqué au dessin des routes. Corrigée en reconstruisant l'offset depuis une maison — et non en concluant.
- [2026-07-27 11:06] Preuve de la règle : **45 arbres de route, 0 violation**. Contrefactuel mesuré sur la même carte : **70 %** des 633 cases ont un voisin horizontal, donc sans la règle ~31 des 45 arbres tomberaient au milieu d'une voie. Le correctif change bien quelque chose de visible.

### Validation

-
