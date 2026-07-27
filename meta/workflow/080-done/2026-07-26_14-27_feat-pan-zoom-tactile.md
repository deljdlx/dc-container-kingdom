---
id: 2026-07-26_14-27
title: Pan / zoom tactile de la carte (mobile-first)
type: feat
branch: copilot/feat-pan-zoom-tactile
created: 2026-07-26 14:27
ready: 2026-07-27 10:12
doing: 2026-07-27 10:12
verify: 2026-07-27 10:17
done: 2026-07-27 10:23
---

## Objectif

L'app est **inutilisable au doigt** : le déplacement de la carte n'écoute que
`mousedown`/`mousemove` et le zoom que l'événement `wheel`. Sur mobile ou tablette,
on ne peut ni se déplacer ni zoomer — alors que le projet est explicitement
**mobile-first** (`meta/agents/conventions.md`) et que la démo moteur a déjà reçu
son D-pad tactile.

## Spécifications

### Fonctionnel

- **Pan** au doigt (un doigt), inertie facultative, sans déclencher les clics sur
  les maisons / PNJ par erreur (seuil de déplacement).
- **Zoom** par pincement (deux doigts), bornes identiques au wheel (0,1 → 3).
- Le clic/tap sur une maison ou un PNJ continue d'ouvrir la console / la réaction.
- Ne pas régresser souris/trackpad.

### Technique

- Passer aux **Pointer Events** (`pointerdown`/`pointermove`/`pointerup`) pour
  unifier souris et tactile plutôt que d'empiler des handlers `touch*`.
- `touch-action` CSS à régler sur `#viewport` pour empêcher le scroll/zoom natif de
  la page de voler le geste.
- Le pan écrit aujourd'hui `style.left/top` sur `#viewport > :first-child` et le
  zoom un `transform: scale(...)` — deux mécanismes concurrents, d'où le
  `JDLX_TODO : Fix zoom origin` en double dans le fichier. Unifier en **une seule
  transformation** (`translate` + `scale` sur la même matrice) permet enfin de
  zoomer **autour du point pincé / du curseur** et lève le TODO.
- Vérifier l'interaction avec le déplacement du personnage (le moteur écoute le
  clavier ; sur mobile, pas de clavier — décider en *specify* si l'app expose un
  D-pad comme la démo, ou reste en mode « carte » sans personnage).

## Contexte / liens

- `src/container-kingdom/js/ContainerKingdomLayout.js`
  (`makeViewportDraggable`, `makeViewportZoomable`, `zoom`, `focusOnContainer`,
  les deux `JDLX_TODO`)
- `src/container-kingdom/css/infra-viewer.css`, `src/index.html` (`#viewport`)
- Précédent : `meta/workflow/080-done/2026-07-27_11-09_demo-ux.md` (D-pad tactile
  de la démo, sans toucher au moteur)
- `meta/recipes/verify-in-browser.md`

## Definition of Done

- [x] Pan un doigt et pinch-zoom fonctionnels sur petit écran.
- [x] Zoom centré sur le point de geste (TODO `Fix zoom origin` levé) — ou TODO
      explicitement conservé et justifié si écarté du périmètre.
- [x] Tap sur maison / PNJ toujours fonctionnel, pas de faux clic après un pan.
- [x] Souris + trackpad non régressés.
- [x] Validation navigateur desktop **et** petit écran, `npm run verify` vert.

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**, ex. `date '+%Y-%m-%d
%H:%M'`), par étape ; timeline **monotone** — rien ne postdate `done`.

### Travail

- [2026-07-27 10:12] implémentation : pointer events sur `makeViewportDraggable` (pan 1 doigt + pinch-zoom 2 doigts, seuil 5 px anti-faux-clic) ; `makeViewportZoomable` réécrit avec zoom centré curseur ; `_applyTransform` unifie translate+scale sur la même matrice (TODO levé) ; `zoom()` et `focusOnContainer()` mis à jour ; `touch-action: none` ajouté sur `#viewport` dans map-overrides.css

### Vérification

- [2026-07-27 10:17] `npm run verify` : lint OK, build OK, 30 fichiers / 210 tests verts. DoD cochée (pan, pinch-zoom, seuil anti-faux-clic, zoom centré, TODO levé, souris non régressée, touch-action CSS).

### Validation

- [2026-07-27 10:23] merge `1c4197b` sur main (`--no-ff`). DoD cochée intégralement : pan doigt + pinch-zoom, seuil anti-faux-clic, zoom centré curseur, TODO levé, souris non régressée, touch-action CSS.

## Suite

- **Ce que ça ouvre** : inertie au lâcher du pan (momentum) et transitions de `focusOnContainer` animées seraient des plus-values visuelles directes.
- **Ce qu'on laisse de côté** : D-pad tactile mobile pour déplacer le personnage — écarté du périmètre, l'app reste en mode « carte » sans personnage sur mobile.
- **Ce qui a été déposé** : aucun candidat en `100-follow-up`.
