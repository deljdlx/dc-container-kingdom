---
id: 2026-08-05_15-39
title: Une couleur unique ne suffit pas aux effets
type: feat
branch: claude/fx-colour-variation
created: 2026-08-05 15:39
ready: 2026-08-05 15:40
doing: 2026-08-05 15:41
verify:
done:
---

## Objectif

Demandé à l'usage le 2026-08-05 : rendre les FX personnalisables, notamment leurs
couleurs, avec des valeurs par défaut.

**La mécanique de surcharge existe déjà** — vérifié par sonde le même jour. Le
descripteur se fusionne sur trois niveaux (défauts du moteur → descripteur de la
classe d'effet → surcharge à l'usage), et cela vaut pour **toutes** ses clés,
`color` comprise, aussi bien à la main qu'en déclaration :

```js
new FootstepDust(layer, { follow: npc, descriptor: { color: '#ff0000', size: 20 } })
// → color #ff0000, size 20 ; life 600 et layer 'ground' hérités de la classe

static descriptor = { fx: [{ emitter: FootstepDust, at: { x: 24, y: 44 },
                             descriptor: { color: '#00ff00' } }] };
// → color #00ff00 ; layer 'ground' et size 7 hérités
```

Ce qui manque n'est donc pas la surcharge, c'est **l'expressivité de la couleur
elle-même** : `ParticleSystem.DEFAULTS.color` est une valeur plate, et toute une
salve en sort identique. De la poussière, des étincelles, de la fumée veulent de
la dispersion.

## Spécifications

_Amorce — à confirmer en « specify »._

### 1. `color` accepte un tableau

Une teinte **tirée par particule** parmi celles proposées. Une chaîne continue de
marcher — c'est le cas dégénéré du tableau à un élément, donc aucune rupture.

```js
descriptor: { color: ['#e8dcc4', '#d8ccb0', '#f0e6d2'] }
```

Le tirage doit passer par le **RNG injectable** de `ParticleSystem` (`random`),
pour que les tests restent déterministes.

### 2. `fade` pilote l'opacité

Le fondu est aujourd'hui câblé dans `ParticleLayer.render` (`1 - progress`,
linéaire). Une clé de descripteur doit permettre de le retarder ou de le courber,
avec le comportement actuel par défaut.

### 3. Le cache de sprites doit tenir compte de la taille

`ParticleLayer._spriteFor(color, size)` met en cache **par couleur seulement** et
construit le sprite à partir de la *première* taille vue. Deux effets de même
couleur et de tailles différentes partagent donc un sprite dimensionné pour le
premier, redimensionné à la volée — donc flou. Invisible aujourd'hui parce que
chaque effet a sa couleur ; encourager la personnalisation le rendrait visible.
La clé doit être **couleur + taille**.

### Ce qu'on ne fait pas

**Pas de rampe de couleur sur la durée de vie** (jaune → rouge → noir). Il
faudrait interpoler par particule et par frame, et multiplier les sprites en
cache. À reprendre si l'usage le réclame — pas avant.

## Firewalls / risques

1. **Le cache de sprites est ce qui rend le canvas rapide** : une couleur par
   particule multiplie les entrées. Avec un tableau de 3 teintes × 2 tailles on
   passe de 1 à 6 sprites — borné, mais à mesurer, et à écrire comme limite.
2. **Ne pas casser la chaîne de fusion** : un descripteur d'instance doit toujours
   l'emporter sur celui de la classe, et une chaîne rester acceptée.
3. **Le déterminisme des tests** : le tirage doit utiliser le `random` injecté,
   pas `Math.random` directement.
4. **Le fondu est sur le chemin chaud** (chaque particule, chaque frame) : une
   fonction par particule y serait coûteuse. Préférer une forme déclarative
   (un délai, une puissance) à un callback.

## Contexte / liens

- Vérifié : **rien d'équivalent au board le 2026-08-05**, `080-done` compris.
- `src/engine/fx/ParticleSystem.js` — `DEFAULTS`, `emit()`, le RNG injectable.
- `src/engine/fx/ParticleLayer.js` — `render()` (le fondu câblé) et `_spriteFor()`
  (le cache par couleur).
- `src/engine/fx/Emitter.js` — la fusion des descripteurs.
- `meta/documentation/engine.md` §3.2 — à compléter : **rien n'y dit
  aujourd'hui qu'un descripteur est surchargeable**.

## Definition of Done

- [ ] `color` accepte un **tableau** ; chaque particule en tire une, via le RNG
      injecté — test déterministe à l'appui.
- [ ] Une **chaîne** continue de fonctionner à l'identique (non-régression).
- [ ] `fade` permet de modifier la courbe d'opacité, le défaut restant l'actuel.
- [ ] Le cache de sprites est indexé sur **couleur + taille** : deux tailles pour
      une même couleur donnent deux sprites nets (test ou mesure).
- [ ] **Coût mesuré** : nombre de sprites en cache et ms/frame, avec une palette.
- [ ] **La démo le montre** : un effet dont la couleur varie visiblement.
- [ ] `meta/documentation/engine.md` documente la **surcharge de descripteur**
      (les trois niveaux) et la palette ; `npm run verify` vert.

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
