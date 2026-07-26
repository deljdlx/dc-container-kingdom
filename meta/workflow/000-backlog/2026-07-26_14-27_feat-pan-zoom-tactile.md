---
id: 2026-07-26_14-27
title: Pan / zoom tactile de la carte (mobile-first)
type: feat
branch:
created: 2026-07-26 14:27
ready:
doing:
verify:
done:
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

- [ ] Pan un doigt et pinch-zoom fonctionnels sur petit écran.
- [ ] Zoom centré sur le point de geste (TODO `Fix zoom origin` levé) — ou TODO
      explicitement conservé et justifié si écarté du périmètre.
- [ ] Tap sur maison / PNJ toujours fonctionnel, pas de faux clic après un pan.
- [ ] Souris + trackpad non régressés.
- [ ] Validation navigateur desktop **et** petit écran, `npm run verify` vert.

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**, ex. `date '+%Y-%m-%d
%H:%M'`), par étape ; timeline **monotone** — rien ne postdate `done`.

### Travail

-

### Vérification

-

### Validation

-
