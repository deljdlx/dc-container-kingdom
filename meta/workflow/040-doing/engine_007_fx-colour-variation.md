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

- [x] `color` accepte un **tableau** ; chaque particule en tire une, via le RNG
      injecté — test déterministe à l'appui.
- [x] Une **chaîne** continue de fonctionner à l'identique (non-régression).
- [x] `fade` permet de modifier la courbe d'opacité, le défaut restant l'actuel.
- [x] Le cache de sprites est indexé sur **couleur + taille** : deux tailles pour
      une même couleur donnent deux sprites nets (test ou mesure).
- [x] **Coût mesuré** : nombre de sprites en cache et ms/frame, avec une palette.
- [x] **La démo le montre** : un effet dont la couleur varie visiblement.
- [x] `meta/documentation/engine.md` documente la **surcharge de descripteur**
      (les trois niveaux) et la palette ; `npm run verify` vert.

## Suite

_Rempli à la clôture._

-

## Journal

### Travail

- [2026-08-05 15:43] **La palette d'abord** : `color` accepte un tableau, chaque
  particule y tire sa teinte via le **RNG injecté** — pas `Math.random`, sinon les
  tests ne pinceraient rien. Une chaîne reste le cas dégénéré du tableau à un
  élément, donc aucune rupture.
- [2026-08-05 15:44] **`fade`** porte la courbe d'opacité, avec `1` = le fondu
  linéaire historique. Une **forme déclarative** (une puissance), pas un callback :
  le fondu tourne pour chaque particule et chaque frame, une fonction utilisateur
  y serait chère.
- [2026-08-05 15:45] **Le cache de sprites passe à `couleur@taille`.** Il
  n'indexait que par couleur et servait le sprite cuit en premier, étiré. Sans
  conséquence tant que chaque effet avait sa teinte ; encourager les palettes
  l'aurait rendu visible. C'était le vrai piège caché derrière la demande.
- [2026-08-05 15:47] **`FootstepDust` part maintenant avec une palette** de trois
  sables voisins plutôt qu'un ton unique : la demande disait « avec valeurs par
  défaut », et le défaut le plus utile est celui qui montre la fonctionnalité.
- [2026-08-05 15:47] **Ce que je n'ai pas fait** : la rampe de couleur sur la
  durée de vie. Il faudrait interpoler par particule et par frame et multiplier
  les sprites en cache — écrit comme hors périmètre plutôt que baclé.

### Vérification

- [2026-08-05 15:52] `npm run verify` **vert** : **64 fichiers, 545 tests** (+9).
- [2026-08-05 15:49] **Critère qui fait foi**, mesuré sur la démo : **six teintes
  distinctes** vivantes au sol pendant une marche — les **trois sables** du
  descripteur par défaut de l'effet (le joueur) et les **trois verts** déclarés
  par le PNJ, qui surcharge aussi son `fade` à 2. La chaîne de fusion tient donc
  de bout en bout, de la classe à la déclaration.
- [2026-08-05 15:50] **Le cache est bien indexé sur les deux** : six entrées,
  `#8fbf6a@7`, `#6fa04d@7`, `#a8cf85@7`, `#e8dcc4@7`, `#d9c9a8@7`, `#f2e8d5@7`.
- [2026-08-05 15:50] **Coût** : **0,229 ms par frame** avec les deux effets actifs
  et 115 particules vivantes — inchangé à la mesure près.
- [2026-08-05 15:51] **Les trois hôtes** sans erreur console : la démo, l'app
  (49 areas, 529 éléments, 219 conteneurs) et le catalogue (536 sprites).
- [2026-08-05 15:48] Un contrôle intermédiaire m'a semblé rater : je ne voyais que
  les teintes vertes. C'était l'échantillonnage — les particules sable du joueur
  étaient déjà mortes au moment de la lecture. Remesuré en accumulant sur toute la
  marche : les six sortent.
- [2026-08-05 15:52] Sonde `window.__vp` retirée (0 résidu).

### Validation

-
