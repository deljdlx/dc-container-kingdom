---
id: 2026-07-26_14-22
title: Entrées clavier — arrêt fantôme et pas de diagonale
type: fix
branch: claude/keyboard-input-diagonals
created: 2026-07-26 14:22
ready: 2026-07-29 09:29
doing: 2026-07-29 09:36
verify: 2026-07-29 09:55
done:
---

## Objectif

`Viewport.run()` branche `keydown` → `move(direction)` et `keyup` → `stop()`
**sans regarder quelle touche** est relâchée, et le viewport ne retient qu'**une**
`direction`. Deux défauts sensibles à la manette de clavier :

- **Arrêt fantôme** : flèche droite maintenue, on appuie/relâche n'importe quelle
  autre touche (ou l'autre flèche) → le personnage s'arrête alors qu'une touche de
  direction est toujours enfoncée.
- **Pas de diagonale** : impossible de marcher en biais, ce qui est le minimum
  attendu d'un déplacement RPG en vue de dessus.

## Spécifications

### Décisions prises en *specify* (2026-07-29)

Le ticket laissait trois points ouverts. Tranchés, avec leur raison :

- **Direction du sprite en diagonale → la dernière touche encore enfoncée.**
  Plutôt que « l'horizontale gagne » : c'est le seul choix qui donne un
  comportement correct au **relâchement**. Droite maintenue + Haut pressé → le
  personnage regarde en haut ; on relâche Haut → il regarde de nouveau à droite,
  sans rien de spécial à coder. Impose de garder les touches **dans l'ordre
  d'appui**, pas dans un `Set`.
- **Axe bloqué → glissement sur l'autre (« slide along wall »), oui.** Sans lui,
  marcher en diagonale contre un mur bloque **tout** le déplacement, ce qui donne
  la sensation d'être collé. Ordre d'essai : le vecteur complet, puis l'axe
  horizontal seul, puis l'axe vertical seul.
- **Normalisation de la diagonale → une banque de sous-pixels par axe.** La
  vitesse doit rester indépendante du taux de rafraîchissement (propriété acquise
  par `2026-07-26_14-23` et verrouillée par des tests). Arrondir chaque axe frame
  par frame la casserait à nouveau ; on remplace donc le reste scalaire
  `_moveRemainder` par un reste **par axe**, alimenté avec la composante du
  vecteur unitaire (0,7071 en diagonale). La normalisation tombe alors toute
  seule, sans arrondi supplémentaire.

### Fonctionnel

- Suivre l'**ensemble des touches de direction enfoncées** ; le personnage marche
  tant qu'au moins une l'est, dans la résultante des directions.
- Diagonales supportées ; le sprite prend une direction d'animation cohérente —
  **la dernière touche encore enfoncée** (tranché ci-dessus).
- Relâcher une touche parmi plusieurs ne stoppe pas le mouvement.
- Une touche non directionnelle n'a aucun effet sur le déplacement.

### Technique

- **Nouveau sous-système `DirectionalInput`** (`src/engine/map/`), exporté par le
  baril `src/engine/index.js` (toute classe publique y passe) : il retient les
  directions enfoncées **dans l'ordre d'appui** et sait produire (a) s'il y a
  mouvement, (b) le **vecteur unitaire** résultant, (c) la **direction d'animation**
  (dernière touche encore tenue). Il ignore tout ce qui n'est pas directionnel.
  Il ne connaît **ni le DOM ni les touches** : `Viewport` traduit `ArrowLeft` →
  `'left'` et l'alimente. C'est ce qui le rend testable sans jsdom et réutilisable
  pour une autre source d'entrée (D-pad, manette).
- `Viewport.moving` (0/1) et `Viewport.direction` (string) **disparaissent** au
  profit de cet état. `move(direction)` et `stop()` **restent** — API publique
  utilisée par la démo et les tests — réimplémentées par-dessus : `move(d)` =
  « seule `d` est enfoncée », `stop()` = « tout est relâché ».
- `moveCharacter(increment)` devient **`moveCharacter(dx, dy)`**. Changement de
  signature **assumé** : trois tests de `test/Viewport.test.js` l'appellent avec un
  scalaire et posent `viewport.direction` à la main ; ils seront mis à jour, ce qui
  est un changement de comportement délibéré, pas une régression (cf.
  `refactor-safely`).
- `update()` : le reste sous-pixel scalaire `_moveRemainder` devient un reste
  **par axe**. Les tests d'indépendance au taux de rafraîchissement doivent rester
  verts **sans modification de leurs assertions** — ce sont eux le filet.
- Conserver la sémantique de collision : `moveBlocked` + revert, et la
  réconciliation des triggers **à la position finale**. Avec le glissement, la
  position finale est celle de la **dernière tentative retenue**.
- La distance parcourue rendue par `moveCharacter` (qui nourrit l'animation) doit
  être la **norme** du déplacement réel (`Math.hypot`), pas la plus grande
  composante — sinon le cycle de marche ralentit en diagonale.
- La démo (`src/engine/demo/`) émet des `KeyboardEvent` synthétiques depuis son
  D-pad tactile : elle passe par `keydown`/`keyup`, donc elle bénéficie du correctif
  sans modification — à vérifier, y compris deux boutons pressés à la fois.

## Contexte / liens

- `src/engine/map/Viewport.js` (`run`, `move`, `stop`, `moveCharacter`, `update`)
- `src/engine/map/Character.js` (`moveBlocked`, `setDirection`)
- `src/engine/demo/demo.js` (D-pad tactile → événements clavier)
- Docs : `meta/documentation/engine.md` (boucle de jeu / entrées)
- Piège rAF pour la vérif : `meta/recipes/verify-in-browser.md`

## Definition of Done

- [x] Deux flèches maintenues → déplacement diagonal ; relâcher l'une garde le
      mouvement sur l'autre.
- [x] Vitesse diagonale normalisée (pas de bonus en biais) : la distance parcourue
      en diagonale sur un temps donné est celle d'une ligne droite, à 1 px près.
- [x] Une touche non directionnelle ne stoppe plus le personnage, ni ne le fait
      partir.
- [x] Le sprite regarde la **dernière** direction encore enfoncée ; relâcher la
      plus récente le fait revenir à celle d'avant.
- [x] Un axe bloqué n'annule pas l'autre (glissement le long d'un mur), et les
      triggers restent réconciliés à la position finale.
- [x] Tests : `DirectionalInput` (appuis / relâchés / ordre / vecteur / direction
      d'animation) **sans jsdom**, et le déplacement diagonal en pilotant
      `viewport.update(t)` à la main.
- [x] Les tests d'indépendance au taux de rafraîchissement passent **sans que
      leurs assertions changent**.
- [x] Démo moteur toujours pilotable (clavier + D-pad, deux boutons à la fois),
      doc `meta/documentation/engine.md` à jour, `npm run verify` vert.

## Suite

_« Et ensuite ? » — rempli à la **clôture** (follow-up, recipe
`meta/agents/recipes/workflow/ticket-follow-up.md`)._

-

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**, ex. `date '+%Y-%m-%d
%H:%M'`), par étape ; timeline **monotone** — rien ne postdate `done`.

### Travail

- [2026-07-29 09:45] Nouveau `src/engine/map/DirectionalInput.js` : les directions
  tenues **dans l'ordre d'appui**, sans DOM ni notion de touche. Rend `isMoving()`
  (deux directions opposées s'annulent), `getVector()` (unitaire — la diagonale
  vaut 0,7071 par axe) et `getFacing()` (la dernière tenue). Exporté par le baril
  `src/engine/index.js`.
- [2026-07-29 09:47] `Viewport` : `moving`/`direction` supprimés au profit de
  `_input`. `move()`/`stop()` conservés (API publique) et réimplémentés par-dessus ;
  ajout de `press()`/`release()`/`getInput()`. La table `KEY_DIRECTIONS` isole la
  traduction touche → direction ; une touche absente de la table ne fait plus rien
  du tout — c'est la fin de l'arrêt fantôme.
- [2026-07-29 09:48] L'auto-répétition du clavier (`event.repeat`) est ignorée :
  sans ça, maintenir une touche la faisait redevenir « la plus récente » et volait
  la direction du sprite à la touche réellement pressée après elle.
- [2026-07-29 09:50] Banque sous-pixel **par axe** (`_moveRemainderX/Y`) alimentée
  par la composante du vecteur unitaire : la normalisation de la diagonale tombe
  toute seule, sans second arrondi, et l'indépendance au taux de rafraîchissement
  est préservée. `Math.trunc` (et non `floor`) pour ne pas dépenser un pixel non
  encore acquis quand la composante est négative.
- [2026-07-29 09:52] `moveCharacter(dx, dy)` : essaie le vecteur complet, puis
  l'axe horizontal, puis le vertical (« slide along wall »). La distance rendue à
  l'animation est la **norme** (`Math.hypot`) du déplacement retenu, pas la plus
  grande composante — sinon le cycle de marche ralentit en diagonale.
- [2026-07-29 09:53] Doc mise à jour : `documentation/engine.md` (§3 game loop +
  mermaid, nouveau §3.1 `DirectionalInput`, §11 API publique),
  `documentation/architecture.md`, et les **trois** copies de l'extrait de pilotage
  manuel rAF (`recipes/verify-in-browser.md`, `documentation/development.md`,
  `agents/workflow.md`) qui posaient `vp.moving = 1; vp.direction = …` — une API
  qui n'existe plus.

### Vérification

- [2026-07-29 09:56] `npm run verify` vert : **45 fichiers, 332 tests** (44 / 305
  avant). +27 tests, dont 14 sur `DirectionalInput` (sans jsdom) et 13 sur le
  `Viewport` (diagonales, glissement, câblage clavier réel via `KeyboardEvent`).
- [2026-07-29 09:56] Les quatre tests d'indépendance au taux de rafraîchissement
  passent **sans modification de leurs assertions** — c'est le filet demandé par
  la spec. Trois tests ont en revanche été mis à jour délibérément (signature
  `moveCharacter(dx, dy)` et `viewport.direction` qui n'existe plus).
- [2026-07-29 09:55] `eslint.config.js` : ajout de `KeyboardEvent` aux globals de
  `test/**` — le lint ne le connaissait que pour `src/**`.
- [2026-07-29 09:58] **Validation navigateur** sur `http://localhost:5183/engine/demo/`,
  boucle pilotée à la main (rAF est en pause hors premier plan — le piège s'est
  d'ailleurs manifesté : une sonde qui `await` un rAF a bien timeouté). Sonde
  `window.__vp` posée puis **retirée** (0 résidu, vérifié au grep) :
  - **diagonale** : ArrowLeft + ArrowUp → (−153, −153), sprite tourné `up` ;
  - **normalisation** : sur 640 ms à 300 px/s, ligne droite **191 px**, diagonale
    **190,9 px** — écart **0,1 px** (avant : la diagonale n'existait pas) ;
  - **arrêt fantôme** : ArrowLeft maintenue, appui + relâchement de `Shift` → le
    personnage parcourt **192 px** sans broncher ;
  - **relâchement partiel** : lâcher ArrowUp garde le mouvement à gauche et
    **ramène** le sprite à `left` ;
  - **glissement** : collé à la maison (mur à x = 297), poussée en diagonale
    dedans → 6 frames à `dx = 0, dy = 3~4` (il longe le mur), puis il dépasse
    l'angle et repart (`dx = −3`). Sans le fallback, il serait resté figé ;
  - **D-pad tactile** : deux boutons pressés ensemble → diagonale ; relâcher l'un
    garde l'autre. La démo n'a pas eu besoin d'être modifiée ;
  - **aucune erreur console**.

### Validation

-
