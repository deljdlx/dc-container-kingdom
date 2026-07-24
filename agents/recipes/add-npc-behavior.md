# Recipe — ajouter un behavior NPC

Un behavior est une IA interchangeable qui pilote un `Character`, **tickée par la
game loop** (pas de `setTimeout` maison). Modèles : `PatrolBehavior`,
`FleeBehavior`, `CharacterBehavior`.

## Étapes

1. **Créer** `src/engine/map/MonBehavior.js` sur ce squelette :
   - constructeur `(character, { ...options } = {})` ;
   - `start()` / `stop()` qui **(dé)s'enregistrent** auprès du viewport via un
     helper `_viewport()` (`character.getApplication().getViewport()`), puis
     `viewport.addBehavior(this)` / `removeBehavior(this)` ;
   - `update(dt)` qui **accumule `dt`** et rejoue `_step()` à la cadence voulue
     (`while (this._elapsed >= this._tickDelay) { this._elapsed -= this._tickDelay; this._step(); }`) ;
   - `_step()` qui déplace via **`character.moveBlocked(dx, dy, isBlocked)`**
     (bouge puis annule si `isBlocked()` renvoie vrai), et met à jour l'anim
     (`character.update()`).
   - Pour réagir à un trigger (détection de proximité), créer une zone trigger sur
     le personnage et écouter `element.trigger` — voir `FleeBehavior.js`.

2. **Exporter** depuis **`src/engine/index.js`** (section « Character subsystems »).

3. **Tester** (déterministe) : `test/MonBehavior.test.js` avec un **faux
   personnage duck-typé** (implémentant `x/y/offsetX/offsetY/setDirection/moveBlocked/
   overlaps/getBoard/update`) et un appel **direct** à `_step()` / `update(dt)` —
   modèles : `test/PatrolBehavior.test.js`, `test/FleeBehavior.test.js`.

4. **Démo** : dans `src/engine/demo/demo.js`, instancier un PNJ, l'ajouter à une
   area, puis `new MonBehavior(npc, { ... }).start()`.

5. **Vérifier** : `npm run verify`, puis navigateur — voir
   [verify-in-browser.md](verify-in-browser.md) (le rAF étant en pause hors
   premier plan, piloter la boucle à la main).
