---
id: 2026-08-02_18-45
title: La garde anti-fuite tue les effets attachés au personnage
type: fix
branch:
created: 2026-08-02 18:45
ready:
doing:
verify:
done:
---

## Objectif

**Régression introduite par `2026-08-02_18-18`** : la poussière sous les pas du
personnage ne sort plus. Signalée par l'utilisateur, confirmée à la mesure le
2026-08-02 dans la démo — après 90 frames de marche, **0 particule** de poussière,
pendant que les fontaines en produisent 100.

La cause est la « ceinture deux » contre la fuite d'émetteurs :

```js
isAlive() {
  if (!this._follow) return true;
  return typeof this._follow.getParent !== 'function' || this._follow.getParent() !== null;
}
```

Elle suppose que **sans parent = détruit**. Or `Viewport.enableMainCharacter()`
crée le `Character` et **ne l'attache jamais** au scene-graph : il n'a donc
*jamais* eu de parent. L'émetteur se croit orphelin dès la première frame et
s'arrête définitivement (`isAlive()` faux, `isRunning()` faux, mesurés).

Coût du non-fait : tout effet attaché à un élément hors scene-graph est mort-né —
et silencieusement, puisque l'émetteur s'arrête au lieu de lever.

## Spécifications

_Amorce — à confirmer en « specify »._

Distinguer **« n'a jamais eu de parent »** de **« en a eu un, puis l'a perdu »**.
Seul le second cas est un orphelin.

Piste : mémoriser qu'un parent a été vu au moins une fois, et ne conclure à la
mort que dans ce cas. C'est plus robuste que de figer l'état à la construction —
un hôte peut construire l'émetteur avant d'attacher l'élément, et la ceinture doit
quand même s'armer ensuite.

### Le trou de test à combler

Les tests existants ne pouvaient pas voir le défaut : le cas « suit un élément
**sans parent** » n'était couvert nulle part. Les doubles de test attachaient
toujours l'élément (`area.add(...)`), et le cas « point fixe » n'a pas de `follow`
du tout. C'est exactement la combinaison du personnage principal.

## Contexte / liens

- La garde fautive : `src/engine/fx/Emitter.js` (`isAlive`).
- L'élément concerné : `Viewport.enableMainCharacter()`, qui n'attache pas.
- L'effet cassé : `src/engine/fx/FootstepDust.js`, câblé dans `src/engine/demo/demo.js`.
- Le ticket d'origine : `2026-08-02_18-18`.

## Definition of Done

- [ ] La poussière ressort en marchant, **mesurée** dans la démo (particules > 0).
- [ ] Un émetteur qui suit un élément **jamais attaché** continue d'émettre (test).
- [ ] Un émetteur dont la cible **a perdu** son parent s'arrête toujours (test de
      non-régression de la ceinture, qui doit rester verte).
- [ ] Le déliage par `Board.freeArea` reste opérant (test existant vert).
- [ ] `npm run verify` vert.

## Suite

-

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**), par étape ; timeline
**monotone**.

### Travail

-

### Vérification

-

### Validation

-
