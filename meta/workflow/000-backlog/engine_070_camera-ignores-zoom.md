---
id: 2026-08-17_18-20
title: La caméra ignore le zoom, et ne sait pas lâcher sa cible
type: fix
branch:
created: 2026-08-17 18:20
ready:
doing:
verify:
done:
---

## Objectif

Trouvé en écrivant l'arène (`2026-08-11_08-55`), et **c'est le bug que l'humain a
signalé à l'écran** : « on ne voit pas le personnage au début, il faut le
déplacer ».

`Camera.update()` centre sa cible ainsi :

```js
this._x = target.x() + target.width() / 2 - this._viewportWidth / 2;
```

`_viewportWidth` est la largeur du viewport en **pixels CSS**, alors que le monde
est dessiné à travers `ViewportTransform.scale()`. À l'échelle 1 les deux
coïncident, et c'est le cas des trois premiers hôtes. À l'échelle 2,7 — ce qu'un
écran de téléphone impose pour des sprites de 32 px — le centrage est faux du
facteur de zoom : mesuré, le héros atterrit à `y = 840` dans un cadre de 862 px
de haut, c'est-à-dire hors champ jusqu'à ce qu'on le déplace.

La largeur du monde visible est `viewportWidth / scale`, pas `viewportWidth`.

Deux questions à trancher : la caméra doit-elle connaître le transform (elle en
est aujourd'hui découplée, à dessein), ou le viewport doit-il lui passer la
taille visible en unités monde ?

Contournement de l'arène : ne pas suivre du tout (`follow(null)`), ce qu'un jeu à
écran fixe peut se permettre — pas un jeu qui scrolle.

### Le second défaut, fusionné ici

Même classe, même session de travail : **`moveTo(x, y)` ne cesse pas de suivre**.
La cible réécrit la position à la frame suivante, et le `moveTo` semble
simplement ignoré. Pour l'arrêter il faut deviner `follow(null)`.

Petit, mais trente minutes perdues pour qui découvre l'API — et le symptôme
(« mon `moveTo` ne fait rien ») n'oriente pas vers la cause. Piste : un
`unfollow()` explicite, ou un `moveTo` qui lâche la cible de lui-même — les deux
sémantiques se défendent, il faut trancher et l'écrire.

## Contexte / liens

- Vérifié : **rien d'équivalent au board le 2026-08-17**, `080-done` compris.
- Origine : deux candidats déposés à la clôture de `2026-08-11_08-55` (l'arène),
  triés et **fusionnés** le 2026-08-17 — même classe, même correctif.
- `src/engine/view/Camera.js` — `update()`, `moveTo()`, `follow()`.
- `src/engine/view/ViewportTransform.js` — `scale()`, la taille visible réelle.

## Definition of Done

- [ ] Une cible suivie est **centrée** quelle que soit l'échelle — test à 1 et
      à ~2,7, plus une vérification à l'écran.
- [ ] Le sort du couple `moveTo` / `follow` est tranché, écrit et testé.
- [ ] Les trois hôtes qui suivent une cible à l'échelle 1 sont **inchangés**.
- [ ] `documentation/engine.md` §4 à jour ; `npm run verify` vert.

## Suite

_Rempli à la clôture._

-

## Journal

### Travail

-

### Vérification

-

### Validation

-
