---
id: 2026-07-26_14-23
title: Déplacement — le dt perdu sous le pixel rend la vitesse dépendante du taux de rafraîchissement
type: fix
branch: claude/mouvement-sous-pixel
created: 2026-07-26 14:23
ready: 2026-07-27 17:18
doing: 2026-07-27 17:19
verify: 2026-07-27 17:22
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

- [x] À vitesse constante, la distance parcourue pour un même temps simulé est la
      même quel que soit le pas de `dt` (test : 40 frames à 16 ms vs 160 à 4 ms,
      tolérance ≤ 1 px).
- [x] Aucune configuration `dt`/vitesse ne bloque le déplacement — en particulier
      le cas 240 Hz / `speed = 100`, aujourd'hui **totalement figé**.
- [x] Preuves automatisées qui **échouent avant correction**.
- [x] Le rendu reste en pixels entiers (aucune position fractionnaire n'atteint le
      DOM ni les bounding boxes).
- [x] Le clamp de `dt` à 100 ms est conservé (test de caractérisation existant
      toujours vert).
- [x] Effet sur la cadence d'animation **mesuré** et déposé en candidat.
- [x] Doc à jour, `npm run verify` vert.

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**, ex. `date '+%Y-%m-%d
%H:%M'`), par étape ; timeline **monotone** — rien ne postdate `done`.

### Travail

- [2026-07-27 17:19] Preuves posées avant correction, dans le fichier de
  caractérisation que `2026-07-26_14-31` vient de livrer — il avait été écrit
  comme filet pour ce correctif, il a servi tel quel. Trois rouges :
  40 px d'écart entre 16 ms et 4 ms pour un même temps simulé ; **0 px parcouru**
  à 240 Hz avec `speed = 100` (personnage figé, exactement le constat du ticket) ;
  et un pas de 9 ms qui produisait 1 px là où il n'en devait que 0,9.
- [2026-07-27 17:20] Correction : `Math.round` par frame → **banque de
  sous-pixels**. `_moveRemainder += dt × vitesse / 1000`, on ne consomme que la
  partie entière (`Math.floor`) et on reporte le reste. La frame n'est plus jetée
  quand elle vaut moins d'un pixel : elle alimente la banque.
- [2026-07-27 17:20] Détail qui aurait fait un bug : la banque est **remise à
  zéro à l'arrêt**. Sans ça, un reste dormant ressortait en saut d'un pixel au
  pas suivant — couvert par un test dédié.
- [2026-07-27 17:21] Les positions restent **entières** : seule la banque est
  fractionnaire, `moveCharacter()` ne reçoit que des entiers. Rien de flottant
  n'atteint le DOM ni les bounding boxes.

### Vérification

- [2026-07-27 17:20] Les 3 tests rouges passent au vert ; `npm run verify`
  **vert** : lint + build + **270 tests / 39 fichiers** (266 + 4 nouveaux),
  aucune régression. Le test de caractérisation du clamp `dt` à 100 ms — celui
  qui encadre la frame de reprise d'onglet — est toujours vert sans retouche.
- [2026-07-27 17:22] Mesure de l'effet sur l'animation (sonde temporaire, retirée
  après lecture), sur 960 ms simulées :

  | vitesse | `dt` | distance | avances d'animation |
  |---|---|---|---|
  | 300 | 16 ms (~60 Hz) | 287 px | 60 |
  | 300 | 8 ms (~125 Hz) | 287 px | 120 |
  | 300 | 4 ms (~250 Hz) | 287 px | 240 |
  | 100 | 16 ms | 96 px | 60 |
  | 100 | 4 ms (~250 Hz) | 96 px | 96 |

  La **distance est désormais identique** quel que soit le `dt` — l'objectif du
  ticket est atteint et mesuré. En revanche la cadence d'animation, elle, suit
  toujours la fréquence : jusqu'à **4× plus rapide** à 250 Hz. C'est le second
  défaut annoncé en *specify* (`CharacterAnimator` compte des appels, pas du
  temps) ; il est **déposé en candidat**, pas corrigé ici.
- [2026-07-27 17:22] **Pas de validation au navigateur** : l'extension Chrome
  n'est toujours pas connectée. La boucle a été pilotée à la main dans les tests
  (`viewport.update(t)` à timestamps croissants), qui est le chemin recommandé
  par la recipe pour ce type de vérification — mais l'effet visuel de la marche
  n'a pas été regardé à l'écran.

### Validation

-
