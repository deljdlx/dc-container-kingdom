---
id: 2026-07-26_14-25
title: Element — code de déplacement vers cible mort et incomplet
type: fix
branch:
created: 2026-07-26 14:25
ready:
doing:
verify:
done:
---

## Objectif

`Element` porte une machinerie de « déplacement vers une cible » — `_targetX`,
`_targetY`, `_targetHitZone`, `_onMoveEnd`, `_moving`, `_moveSpeed` — exploitée
dans `update()`… mais **aucun setter n'existe** : `_targetX` / `_targetY` /
`_onMoveEnd` ne sont assignés **nulle part** dans le dépôt. Le code est donc mort,
et de plus **faux** :

- il ne gère que **`down` et `right`** (`y() < _targetY`, `x() < _targetX`) — un
  élément ne peut ni remonter ni aller à gauche ;
- les deux axes sont exclusifs (`else if`) : pas de trajectoire diagonale ;
- le pas est `moveSpeed()` **par frame** (100 px par défaut), pas en px/s : rien à
  voir avec la boucle `dt`-based du `Viewport`.

Il faut trancher : soit c'est une API utile (les behaviors NPC en profiteraient),
soit c'est du bruit qui trompe le lecteur — dans les deux cas, l'état actuel est le
pire.

## Spécifications

### Fonctionnel (option retenue à confirmer en *specify*)

**Option A — implémenter** : exposer `moveTo(x, y, { onEnd, speed })` sur
`Element`, avec :
- déplacement dans les **4 directions** (et diagonale), pas de biais d'axe ;
- pas de déplacement piloté par le `dt` de la boucle, comme `Viewport`/behaviors ;
- `_targetHitZone` respectée, `onEnd` appelé **une seule fois** à l'arrivée ;
- `isMoving()` cohérent, arrêt possible (`stopMove()`).

**Option B — retirer** : supprimer les champs et le bloc dans `update()`, ce qui
allège la frame de tous les éléments. À privilégier si aucun usage concret n'est
identifié — un `PatrolBehavior` existe déjà pour les personnages.

### Technique

- `Element.update()` est appelée récursivement sur tout le sous-arbre : tout ajout
  ici coûte à chaque frame. Garder le chemin « pas en mouvement » gratuit.
- Si option A : le déplacement doit passer par un test de collision optionnel
  (cf. `Character.moveBlocked`) plutôt que téléporter à travers les murs.

## Contexte / liens

- `src/engine/scene/Element.js` (champs `_target*`, `_onMoveEnd`, `update`)
- `src/engine/character/Character.js` (`moveBlocked`), `src/engine/character/PatrolBehavior.js`
- `src/engine/view/Viewport.js` (modèle `dt`-based)
- Docs : `meta/documentation/engine.md`

## Definition of Done

- [ ] Décision tracée dans le ticket (A ou B) avec sa justification.
- [ ] Plus aucun champ ni branche morts dans `Element` : soit l'API est complète et
      testée, soit le code est supprimé.
- [ ] Si option A : tests des 4 directions, de la diagonale, de la zone d'arrivée
      et de l'appel unique de `onEnd`.
- [ ] Doc / JSDoc à jour, `npm run verify` vert.

## Journal

Entrées datées `- [YYYY-MM-DD HH:MM] …` (heure **réelle**, ex. `date '+%Y-%m-%d
%H:%M'`), par étape ; timeline **monotone** — rien ne postdate `done`.

### Travail

-

### Vérification

-

### Validation

-
