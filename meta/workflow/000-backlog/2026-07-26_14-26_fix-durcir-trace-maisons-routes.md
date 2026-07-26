---
id: 2026-07-26_14-26
title: Durcir le tracé des maisons, enclos et routes (bugs silencieux)
type: fix
branch:
created: 2026-07-26 14:26
ready:
doing:
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

### Technique

- Indexer `roadsMatrix` avec des clés numériques explicites (ou une `Map` de
  coordonnées) et faire l'arithmétique sur des nombres. Ajouter un test qui prouve
  la règle d'espacement des arbres.
- `drawHouse()` : retourner la maison existante (ou `null` filtré par l'appelant) ;
  `drawFences()` doit ignorer les entrées absentes et sortir proprement si moins de
  deux maisons.
- Nettoyer les arguments morts et fixer `manualZ` (booléen).
- Consommer `application.getNetworks()` au lieu de reconstruire l'index.

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

- [ ] La règle d'adjacence des arbres de route fonctionne (test unitaire dédié).
- [ ] Un second passage de rendu sur un conteneur déjà tracé ne lève plus d'erreur.
- [ ] Plus d'arguments morts ; `manualZ` renseigné avec un booléen.
- [ ] L'index réseau n'est plus dupliqué dans le renderer.
- [ ] Validation navigateur (routes/arbres inchangés hors correction attendue),
      `npm run verify` vert.

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**, ex. `date '+%Y-%m-%d
%H:%M'`), par étape ; timeline **monotone** — rien ne postdate `done`.

### Travail

-

### Vérification

-

### Validation

-
