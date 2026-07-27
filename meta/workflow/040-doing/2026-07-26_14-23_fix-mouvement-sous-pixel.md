---
id: 2026-07-26_14-23
title: Déplacement — le dt perdu sous le pixel rend la vitesse dépendante du taux de rafraîchissement
type: fix
branch: claude/mouvement-sous-pixel
created: 2026-07-26 14:23
ready: 2026-07-27 17:18
doing: 2026-07-27 17:19
verify:
done:
---

## Objectif

`Viewport.update()` calcule `increment = Math.round(dt * moveSpeed / 1000)` puis
**n'agit que si `increment >= 1`** — sinon la frame est purement jetée, `dt`
compris. Le reste sous-pixel n'est jamais accumulé, donc la vitesse réelle dépend
du taux de rafraîchissement et de la vitesse configurée :

- 60 Hz, `speed = 300` → `dt≈16 ms` → `increment = 5` (ok) ;
- 144 Hz, `speed = 100` → `dt≈7 ms` → `0.7` → arrondi à **1** (+43 % de vitesse) ;
- 240 Hz, `speed = 100` → `dt≈4 ms` → `0.4` → **0**, frame jetée, le personnage
  n'avance jamais.

Le `Math.round` amplifie le biais dans les deux sens. Un moteur qui a fait
l'effort d'être `dt`-based (commentaire « pixels per second ») doit être
indépendant de la fréquence d'écran.

## Spécifications

### Technique

- Accumuler le reste fractionnaire entre les frames (accumulateur de sous-pixels)
  et ne consommer que la partie entière — ou passer à des positions flottantes
  arrondies **au rendu** seulement.
- Ne plus jeter la frame quand `increment < 1` : le reste doit s'ajouter au tick
  suivant. `Character.update()` (animation) doit rester tickée de façon cohérente
  avec le déplacement effectif.
- Le clamp de `dt` à 100 ms (protection reprise d'onglet) est à conserver.
- Vérifier l'effet sur `Character._animator.advance(Math.round(moveSpeed / 80))` :
  la cadence de la marche est elle aussi dérivée de la vitesse, pas du temps.

### Décision de périmètre : le déplacement, pas la cadence d'animation

Le ticket demande de « vérifier l'effet » sur
`Character._animator.advance(Math.round(moveSpeed / 80))`. Relevé fait :
`CharacterAnimator` compte des **ticks** (des appels), jamais du temps — donc la
cadence de la marche dépend elle aussi du taux de rafraîchissement, et l'
accumulateur ne la corrigera pas.

**On ne le corrige pas ici.** C'est un second défaut, dans une autre classe, qui
touche aussi les PNJ et leurs behaviors : le traiter dans la foulée gonflerait un
correctif de boucle en refonte de l'animation. La DoD de ce ticket porte sur la
**distance parcourue**. L'effet est donc **mesuré** pendant la vérification et
**déposé** en candidat (`100-follow-up/`) plutôt que corrigé au passage.

### Risques / vigilance

- Les positions doivent rester **entières côté DOM** (`left/top` en px) pour
  éviter le flou de sous-pixel sur les sprites pixel-art.
- Les tests de collision existants raisonnent en entiers : ne pas introduire de
  positions fractionnaires dans les bounding boxes sans les couvrir.

## Contexte / liens

- `src/engine/map/Viewport.js` (`update`, `moveCharacter`, `speed`)
- `src/engine/map/Character.js` (`update`, `moveSpeed`, `CharacterAnimator`)
- `src/engine/map/Renderer/Renderer.js` (écriture de `left`/`top`)
- Docs : `meta/documentation/engine.md` (boucle de jeu),
  `meta/recipes/verify-in-browser.md` (piloter `update(t)` à la main)

## Definition of Done

- [ ] À vitesse constante, la distance parcourue pour un même temps simulé est la
      même quel que soit le pas de `dt` (test : 40 frames à 16 ms vs 160 à 4 ms,
      tolérance ≤ 1 px).
- [ ] Aucune configuration `dt`/vitesse ne bloque le déplacement — en particulier
      le cas 240 Hz / `speed = 100`, aujourd'hui **totalement figé**.
- [ ] Preuves automatisées qui **échouent avant correction**.
- [ ] Le rendu reste en pixels entiers (aucune position fractionnaire n'atteint le
      DOM ni les bounding boxes).
- [ ] Le clamp de `dt` à 100 ms est conservé (test de caractérisation existant
      toujours vert).
- [ ] Effet sur la cadence d'animation **mesuré** et déposé en candidat.
- [ ] Doc à jour, `npm run verify` vert.

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**, ex. `date '+%Y-%m-%d
%H:%M'`), par étape ; timeline **monotone** — rien ne postdate `done`.

### Travail

-

### Vérification

-

### Validation

-
