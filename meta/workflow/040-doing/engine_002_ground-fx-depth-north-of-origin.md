---
id: 2026-08-03_16-49
title: La poussière au sol passe par-dessus les éléments au nord de l'origine
type: fix
branch: claude/ground-fx-depth
created: 2026-08-03 16:49
ready: 2026-08-03 16:50
doing: 2026-08-03 16:51
verify:
done:
---

## Objectif

Signalé à l'usage le 2026-08-03 : en changeant de zone, la poussière du canvas
**au sol** s'affiche **par-dessus** les éléments de la carte.

`GROUND_FX_DEPTH = DEPTH_BASE − 1 = 999 999`, et un élément vaut
`DEPTH_BASE + offsetY + height`. **Dès que `offsetY` est négatif** — un élément au
**nord de l'origine du monde** — son z passe sous celui du canvas.

Mesuré sur la démo, page fraîche, **sans même marcher** :

| | position monde | z | |
|---|---|---|---|
| canvas FX sol | — | **999 999** | |
| `House00` (area 0,−1) | y = −140, h = 130 | 999 990 | **sous le canvas** |
| `Tree00` (area 0,−1) | y = −260, h = 64 | 999 804 | **sous le canvas** |

2 éléments sur 239 sont déjà en dessous — exactement ceux de l'area au nord. On
ne le *voit* qu'en y entrant, la poussière suivant le joueur : ce n'est pas le
changement d'area qui casse le z, c'est lui qui amène le regard dessus.

**C'était un risque écrit.** Le ticket du canvas au sol (`2026-08-02_18-56`)
listait en firewall n°4 : « `DEPTH_BASE − 1` est un choix, pas une évidence : il
suppose qu'aucun élément ne descend sous `DEPTH_BASE`. C'est vrai aujourd'hui. »
Ça ne l'était pas. Et le JSDoc de `Renderer.js` affirme l'inverse du réel
(« DEPTH_BASE keeps the value above the ground layer **even north of the
origin** ») — à corriger, un commentaire faux coûte plus qu'un absent.

## Spécifications

### Le fond

Aucune constante haute ne peut marcher : la formule de profondeur est **non
bornée vers le bas** (le monde est infini au nord) alors que le canvas a un z
fixe. Il faut donc que le canvas soit **sous** tout ce qui se tient debout, pas
« juste sous `DEPTH_BASE` ».

### La correction

**`GROUND_FX_DEPTH = 1`.** L'empilement devient :

| étage | z |
|---|---|
| herbe (`.map-area`) et décalques au sol (`manualZ`) | `auto` (≈ 0), ordre DOM entre eux — **inchangé** |
| **canvas FX au sol** | **1** |
| éléments debout | `DEPTH_BASE + offsetY + height` |

Une seule constante bouge, et **rien d'autre ne change de régime** : l'herbe et
les décalques `manualZ` restent tous les deux à `auto`, donc leur ordre relatif
(par ordre DOM) est exactement celui d'aujourd'hui.

L'invariant devient « tout élément debout a un z > 1 », vrai tant que
`DEPTH_BASE + offsetY + height > 1` — soit **~1 785 areas au nord** au lieu de la
**première**. Ce n'est pas infini : c'est une limite assumée, **à écrire** plutôt
qu'à laisser croire résolue.

### Ce qu'on ne fait pas

- **Ne pas s'appuyer sur l'ordre du DOM.** Vérifié : le canvas est aujourd'hui le
  dernier enfant (index 302/303), mais les areas streamées ensuite sont ajoutées
  **après** lui — l'herbe repasserait par-dessus. C'est le même bug en miroir.
- **Ne pas donner un z explicite à l'herbe.** Ce serait le geste évident, et il
  ferait passer les décalques `manualZ` (restés à `auto`) **sous** l'herbe. Le
  minimum qui corrige est aussi celui qui ne déplace rien d'autre.

## Firewalls / risques

1. **Les décalques `manualZ`** (`Ground00`, les `FlowerGrass*` de la démo) sont à
   `auto` : le canvas doit passer **au-dessus** d'eux — c'est de la poussière au
   sol, elle se pose dessus. À vérifier à l'écran, pas seulement en z.
2. **Les areas streamées après le canvas** : c'est le cas qui casse une solution
   par ordre DOM. Le vérifier explicitement en marchant.
3. **`FX_DEPTH` (10 000 000)** ne bouge pas : le jet de fontaine reste au-dessus
   de tout.
4. **Le nord n'est pas testé aujourd'hui** : la démo peuple `(0,−1)` et `(−1,0)`,
   mais aucun test ne regarde un z négatif. C'est ce trou qui a laissé passer le
   défaut.

## Contexte / liens

- Vérifié : **rien d'équivalent au board le 2026-08-03**, `080-done` compris.
- `src/engine/render/Renderer.js` — `DEPTH_BASE`, `GROUND_FX_DEPTH`, le calcul du
  z et les deux commentaires à corriger.
- `src/engine/render/AreaRenderer.js` — l'herbe, qui ne pose aucun z.
- `src/engine/view/Viewport.js` — `enableParticles()`, qui applique la constante.
- Le ticket qui avait prévu le risque : `2026-08-02_18-56`.
- `meta/documentation/engine.md` §3.2.

## Definition of Done

- [ ] **Aucun élément de la carte n'a un z inférieur à celui du canvas au sol** —
      mesuré sur la démo, areas nord chargées.
- [ ] La poussière passe **derrière** un élément situé au nord de l'origine —
      vérifié à l'écran, capture au journal. C'est le critère qui fait foi.
- [ ] Elle passe toujours **au-dessus** des décalques au sol (`manualZ`).
- [ ] Le jet de fontaine reste **au-dessus** de tout (`FX_DEPTH` intact).
- [ ] Un **test** couvre un élément au nord de l'origine : son z est supérieur à
      `GROUND_FX_DEPTH`. C'est le trou qui a laissé passer le défaut.
- [ ] Les deux commentaires faux de `Renderer.js` sont corrigés, et la **limite
      assumée** (~1 785 areas au nord) est écrite.
- [ ] `meta/documentation/engine.md` à jour ; `npm run verify` vert.

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
